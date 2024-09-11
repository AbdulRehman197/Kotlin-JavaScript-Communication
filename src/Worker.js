import {
  ensureFourByteString,
  arrayBufferToBase64,
  calculateBase64SHA256,
  calculateSHA256,
} from "./utils";
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
let PORT = null;
let versionNo = ensureFourByteString(1);
let reservedBytes = ensureFourByteString(0);
const CHUNK_SIZE = 4 * 1000 * 1000; // 4 MB
const SMALL_CHUNK_SIZE = 500 * 1000; // 500 KB

self.addEventListener("message", (event) => {
  let data = event.data;
  switch (data.type) {
    case undefined:
      console.log("port received");
      PORT = data;
      break;
    case "deletedb":
      PORT.postMessage("deleteDB|");
      break;
    case "file":
      // eslint-disable-next-line no-case-declarations
      console.log("filesize", data.file.size);
      processFile(data.file);
      break;
  }
});

async function processFile(receivedFile) {
  let offset = 0;
  let file = receivedFile;
  let totalChunks = 0; // Track the total number of chunks to process
  let currentChunk = 0;
  let sendingChunks = 0;

  async function readNextChunk(file) {
    const slice = file.slice(offset, offset + CHUNK_SIZE);
    let chunk = await slice.arrayBuffer();
    currentChunk = currentChunk + 1;
    if (chunk.byteLength > 0) {
      const chunkSha256 = await calculateSHA256(chunk); // 64 KB
      PORT.postMessage(`sha256|${chunkSha256}`);
      PORT.onmessage = async (event) => {
        let message = event.data.split("|");
        let type = message[0];
        switch (type) {
          case "confirmation":
            console.log("confirmation", message[1]);
            break;
          case "sha256Exist":
            console.log("chunkSha256", chunkSha256);
            if (message[1] == "false") {
              sendingChunks = sendingChunks + 1;
              // self.postMessage({ type: "status", status: "StartSending" });
              PORT.postMessage(`startsending|${chunkSha256}`);
              console.log("sedingchunks", sendingChunks);
              // eslint-disable-next-line no-case-declarations
              // await processChunk(chunk,chunkSha256);
            }
            console.log("offset", offset);
         
            break;
          case "isListReady":
            if (message[1] == "true") {
              // eslint-disable-next-line no-debugger
              processChunk(chunk, chunkSha256);
              self.postMessage({
                type: "status",
                status: `sending chunk ${currentChunk}/${Math.ceil(
                  file.size / CHUNK_SIZE
                )}`,
              });

              if (sendingChunks <= 3) {
                offset += CHUNK_SIZE;
                if (offset < file.size) {
                  readNextChunk(file);
                } else {
                  console.log("completed 2", file.size, file.name);
                  PORT.postMessage(`filename|${file.name}`);
                  // sendingChunks = sendingChunks - 1;
                  // file = null;
                  offset = 0;
                  totalChunks = 0; //
                }
              }
            }

            break;

          case "completesending":
            sendingChunks = sendingChunks - 1;
            if (sendingChunks <= 3) {
              offset += CHUNK_SIZE;
              if (offset < file.size) {
                readNextChunk(file);
              }
            }
            break;
          case "filecompleted":
            // self.postMessage({ type: "status", status: "File Completed" });
            break;
          default:
            break;
        }
      };
    }
  }

  const processChunk = async (chunk, chunkSha256) => {
    const base64Chunk = arrayBufferToBase64(chunk); // 4 MB
    const numSmallChunks = Math.ceil(base64Chunk.length / SMALL_CHUNK_SIZE);
    const chunkSha256base64 = await calculateBase64SHA256(chunkSha256); // 64 KB
    totalChunks += numSmallChunks; // Update total chunks count

    const processSmallChunk = async (index) => {
      if (index >= numSmallChunks) {
        PORT.postMessage(`completesending|`);
        // Base case: No more chunks to process
        return;
      }

      const start = index * SMALL_CHUNK_SIZE;
      const end = Math.min(start + SMALL_CHUNK_SIZE, base64Chunk.length);
      const smallChunkBase64 = base64Chunk.slice(start, end);

      // Send the 256 KB chunk as a base64 string and wait for confirmation
      let packetNo = ensureFourByteString(index + 1);
      let totalPacketNo = ensureFourByteString(numSmallChunks);

      // POST message to PORT
      PORT.postMessage(
        `packet|${versionNo}|${reservedBytes}|${packetNo}|${totalPacketNo}|${chunkSha256base64}|${smallChunkBase64}`
      );

      // Recursively process the next chunk
      await processSmallChunk(index + 1);
    };

    // Start the recursion with the first small chunk
    await processSmallChunk(0);
  };

  readNextChunk(file);
}
