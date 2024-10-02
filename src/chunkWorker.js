/* eslint-disable no-unused-vars */
import {
  calculateBase64SHA256,
  calculateSHA256,
  arrayBufferToBase64,
  ensureFourByteString,
} from "./utils";
let port = null;
self.onmessage = async (event) => {
  let { type } = event.data;
  switch (type) {
    case "chunk":
      console.log("chunkWorker", event.data, event.ports, self);
      port = event.ports[0];
      handleChunk(event.data.slice);

      break;
    case "postPort":
      console.log("get port", event.ports);
      port = event.ports[0];
      port.onmessage = (event) => {
        let message = event.data.split("|");
        let type = message[0];
        if(type == "completeChunkPackets"){
        console.log("message from kotlin", event.data);
        self.postMessage({ type: "completeChunkPackets", lastChunk: true, name: self.name }, [port]);
      }
    }
      break;
      case "returnPort":

        self.postMessage({ type: "returnPort" }, [port]);
        break

    default:
      break;
  }
};

const handleChunk = async (chunk) => {
  let versionNo = ensureFourByteString(1);
  let reservedBytes = ensureFourByteString(0);
  let totalChunks = 0;
  let processingChunks = new Map();
  //   const CHUNK_SIZE = 4 * 1000 * 1000; // 4 MB
  const SMALL_CHUNK_SIZE = 500 * 1000; // 500 KB

  const chunkBuffer = await chunk.arrayBuffer();
  const chunkSha256 = await calculateSHA256(chunkBuffer);
  const chunkSha256base64 = await calculateBase64SHA256(chunkSha256);

  port.postMessage(`sha256|${chunkSha256base64}`);
  const processChunk = async (base64Chunk, chunkSha256base64) => {
    // console.log("chunkSha256 43", chunkSha256);

    const numSmallChunks = Math.ceil(base64Chunk.length / SMALL_CHUNK_SIZE);
    // const chunkSha256base64 = await calculateBase64SHA256(chunkSha256);
    totalChunks += numSmallChunks;
    const processSmallChunk = async (index) => {
      console.log("numSmallChunks", index, numSmallChunks);
      if (index >= numSmallChunks) {
        // self.postMessage({ type: "completesending" });
        // console.log("ending chunk 139", processingChunks.size);
        port.postMessage(
          `completesending|${chunkSha256base64}|${numSmallChunks}`
        );
        console.log("completed", totalChunks);
        return;
      }

      const start = index * SMALL_CHUNK_SIZE;
      const end = Math.min(start + SMALL_CHUNK_SIZE, base64Chunk.length);
      const smallChunkBase64 = base64Chunk.slice(start, end);

      //   let packetNo = ensureFourByteString(index);
      let totalPacketNo = ensureFourByteString(numSmallChunks);

      console.log("chunkbase64", index, smallChunkBase64.slice(1, 100));
      port.postMessage(
        `packet|${versionNo}|${reservedBytes}|${index}|${totalPacketNo}|${chunkSha256base64}|${smallChunkBase64}`
      );
      await processSmallChunk(index + 1);
    };

    await processSmallChunk(0);
  };

  port.onmessage = async (event) => {
    let message = event.data.split("|");
    let type = message[0];
    switch (type) {
      case "sha256Exist":
        if (message[2] == "false") {
          //   sendingChunks += 1;
          // self.postMessage({ type: "startsending", chunkSha256 });
          port.postMessage(`startsending|${message[1]}`);
        }
        break;
      case "isListReady":
        console.log(
          "isListReady callad"
          //   processingChunks.has(message[1]),
        );
        if (message[2] == "true") {
          const base64Chunk = arrayBufferToBase64(chunkBuffer);
          processingChunks.set(message[1], base64Chunk);
          await processChunk(base64Chunk, message[1]);
        }
        break;
      case "completesending":
        console.log("completed sending chunk", self.name);
        self.postMessage({ type: "completesending" }, [port]);

        // port.postMessage(`demo|`);
        // if (sendingChunks == 0) {
        //   processingChunks.clear()
        //  await readNextChunk();
        // }

        break;
      case "missingPacket":
        console.log("missingPacket", message);
        self.postMessage({ type: "missingPacket" });
        // missingPackets.add(event.data);
        break;
      case "completeChunkPackets":
        console.log("completeChunkPackets", message);
        self.postMessage({ type: "completeChunkPackets", name: self.name });
        // self.close()
        // missingPackets.add(event.data);
        break;
      default:
        break;
    }
  };
};
