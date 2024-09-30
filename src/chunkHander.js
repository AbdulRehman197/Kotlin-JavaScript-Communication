/* eslint-disable no-unused-vars */
import {
    calculateBase64SHA256,
    calculateSHA256,
    arrayBufferToBase64,
    ensureFourByteString,
  } from "./utils";
export const handleChunk = async (chunk, port) => {
    let versionNo = ensureFourByteString(1);
    let reservedBytes = ensureFourByteString(0);
    let totalChunks = 0;
    let processingChunks = new Map();
    let isCompleted = false;
    //   const CHUNK_SIZE = 4 * 1000 * 1000; // 4 MB
    const SMALL_CHUNK_SIZE = 500 * 1000; // 500 KB
  
    const chunkBuffer = await chunk.arrayBuffer()
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
        console.log("called", event.data);
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
          console.log("completed sending chunk", processingChunks.size);
        //   self.postMessage({type: "completesending"});
        isCompleted = true;
          // if (sendingChunks == 0) {
          //   processingChunks.clear()
          //  await readNextChunk();
          // }
  
          break;
        case "missingPacket":
          console.log("missingPacket", message);
          // missingPackets.add(event.data);
          break;
        default:
          break;
      }
    };

    return isCompleted
  };
  