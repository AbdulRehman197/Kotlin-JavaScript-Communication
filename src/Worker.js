/* eslint-disable no-case-declarations */
// import {handleChunk} from "./chunkHander";

/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
let PORT = null;
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
      console.log("filesize", data.file.size);
      processFile(data.file);
      break;
  }
});

async function processFile(receivedFile) {
  let offset = 0;
  let file = receivedFile;
  let totalChunks = 0;
  let currentWorker = 0;

  let processingChunks = new Map();
  let processingWorkers = new Map();
  let missingPackets = new Set();
  let isCompleted = false;
  let sendingChunks = 0;

  const readNextChunk = async () => {
    console.log("sending chunks size", sendingChunks);
    if (processingWorkers.size >= 3) {
      console.log("limit reached", processingWorkers.size);
      return; // Only process up to 3 chunks at a time
    }

    if (offset >= file.size) {
      // if (processingWorkers.size == 0) {
        isCompleted = true;
        console.log("completed processing all chunks");
        Array.from(processingWorkers.values())[0].postMessage({type: "returnPort"}, [PORT]);

        // self.postMessage({ type: "filename", filename: file.name });
        // PORT.postMessage(`filename|${file.name}`);
      // }
      return;
    }
    console.log("offset 82", offset);

    const slice = file.slice(offset, offset + CHUNK_SIZE);
    offset += CHUNK_SIZE;

    // let chunk = await slice.arrayBuffer();
    const chunkWorker = new Worker(
      new URL("./chunkWorker.js", import.meta.url),
      { /* @vite-ignore */ name: `worker-${currentWorker}` }
    );
    chunkWorker.postMessage({ type: "chunk", slice }, [PORT]);
    processingWorkers.set(`worker-${currentWorker}`, chunkWorker);
    currentWorker += 1;

    console.log("currentWorker map", processingWorkers, currentWorker);
    // await handleChunk(slice,PORT)
    // sendingChunks += 1;
    // await readNextChunk();
    chunkWorker.onmessage = async (event) => {
      console.log("chunkWorker onmessage", event);
      let { type } = event.data;
      switch (type) {
        case "returnPort":
          console.log("get port", event.ports);
          // PORT = event.ports[0];
          //       chunkWorker.terminate();
          break;
        case "completesending":
          PORT = event.ports[0];
          await readNextChunk();
          break;
        case "missingPacket":
          break;

        case "completeChunkPackets":
          // PORT = event.ports[0];
          console.log("completeChunkPackets", event.data);
          let saveWorker = processingWorkers.get(event.data.name);
          // console.log("save worker", saveWorker);
         
          processingWorkers.delete(event.data.name);
          console.log("currentWorker map before", processingWorkers);
          // currentWorker -= 1;
          if (processingWorkers.size == 1) {
            // Array.from(processingWorkers.values())[0].postMessage({type: "returnPort"}, [PORT]);
            console.log("currentWorker map after", processingWorkers.size);
            await readNextChunk();
            saveWorker.terminate();
            saveWorker = null;
          }
          break;
        default:
          break;
      }
    };
  };

  await readNextChunk();

  // PORT.onmessage  = async (event) => {
  //   console.log("called 2", event.data);

  // //  console.log("OnMessage", event);
  //   let message = event.data.split("|");
  //   let type = message[0];
  //   switch (type) {
  //     case "sha256Exist":
  //       if (message[2] == "false") {
  //         sendingChunks += 1;
  //         // self.postMessage({ type: "startsending", chunkSha256 });
  //         PORT.postMessage(`startsending|${message[1]}`);
  //       }
  //       break;
  //     case "isListReady":
  //       console.log(
  //         "isListReady callad",
  //         processingChunks.has(message[1]),
  //       );
  //       if (message[2] == "true" && processingChunks.has(message[1])) {
  //         // processingChunks.delete(chunkSha256base64);
  //           let base64Chunk =  processingChunks.get(message[1]);
  //         await processChunk(base64Chunk, message[1]);

  //         self.postMessage({
  //           type: "status",
  //           status: `sending chunk ${currentChunk}/${Math.ceil(
  //             file.size / CHUNK_SIZE
  //           )}`,
  //         });

  //         if (sendingChunks < 2) {
  //           await readNextChunk();
  //         }
  //       }
  //       break;
  // case "completesending":
  //       console.log("completed sending chunk", processingChunks.size);
  //       // if (sendingChunks == 0) {
  //       //   processingChunks.clear()
  //  await readNextChunk();
  //       // }

  // break;
  //     case "missingPacket":
  //       console.log("missingPacket", message);
  //       missingPackets.add(event.data);
  //       break;
  //     case "completeChunkPackets":
  //       processingChunks.delete(message[1]);
  //       console.log("processChunks size", processingChunks.size,missingPackets.size);

  //       if (processingChunks.size == 0 && missingPackets.size == 0) {
  //         sendingChunks = 0;
  //         await readNextChunk();
  //       }
  //       // if (missingPackets.size > 0) {
  //       //   missingPackets.forEach(async (chunkMessage) => {
  //       //     let message = chunkMessage.split("|");
  //       //     let totalPacketNo = message[1];
  //       //     let sha256base64 = message[2];
  //       //     let packetsList = new Set(JSON.parse(message[3]));

  //       //     console.log("missingPacketset", packetsList);
  //       //     let chunkBase64String = processingChunks.get(sha256base64);

  //       //     function printArrayElements(arr, index = 0) {
  //       //       // Base case: if the index is equal to the array length, return
  //       //       if (index === arr.length) {
  //       //         PORT.postMessage(
  //       //           `completesending|${sha256base64}|${totalPacketNo}`
  //       //         );
  //       //         return;
  //       //       }
  //       //       let element = arr[index];
  //       //       console.log("packet", element);

  //       //       const start = element * SMALL_CHUNK_SIZE;
  //       //       const end = Math.min(
  //       //         start + SMALL_CHUNK_SIZE,
  //       //         chunkBase64String.length
  //       //       );
  //       //       let packetBase64 = chunkBase64String.slice(start, end);
  //       //       console.log(
  //       //         "chunkbase64 167",
  //       //         element,
  //       //         packetBase64.slice(1, 100)
  //       //       );

  //       //       PORT.postMessage(
  //       //         `packet|${versionNo}|${reservedBytes}|${element}|${totalPacketNo}|${sha256base64}|${packetBase64}`
  //       //       );
  //       //       // Recursive call to the next index
  //       //       printArrayElements(arr, index + 1);
  //       //     }

  //       //     printArrayElements([...packetsList]);
  //       //   });
  //       // }

  //       break;
  // }
  // };
}
