/* eslint-disable no-inner-declarations */
const CHUNK_SIZE = 6 * 1000 * 1000; // 6 MB
const MAX_PARALLEL = 20; // Limit workers

let queue = [];
let activeWorkers = 0;

self.addEventListener("message", async (event) => {
  const data = event.data;

  if (data.type === "file") {
    const file = data.file;
    console.log("Received file, size (MB):", file.size / (1024 * 1024));

    // Create chunk tasks
    for (let offset = 0; offset < file.size; offset += CHUNK_SIZE) {
      const chunk = file.slice(offset, offset + CHUNK_SIZE);
      const chunkNo = Math.floor(offset / CHUNK_SIZE) + 1;
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      queue.push({ chunk, chunkNo, fileName: file.name, totalChunks });
    }

    console.log(`Total chunks: ${queue.length}`);
    processQueue();
  }
});

function processQueue() {
  while (activeWorkers < MAX_PARALLEL && queue.length > 0) {
    const { chunk, chunkNo, fileName,totalChunks } = queue.shift();
    startWorker(chunk, chunkNo, fileName,totalChunks );
  }
}

function startWorker(chunk, chunkNo, fileName,totalChunks) {
  activeWorkers++;
  console.log(`Starting worker for chunk #${chunkNo}`);
  const worker = new Worker(new URL("./HttpSubWorker.js", import.meta.url), { type: "module" });
  worker.postMessage({ chunk, chunkNo, fileName,totalChunks});

  worker.onmessage = (msg) => {
    if (msg.data.type === "uploaded") {
      self.postMessage({
        type: "status",
        status: `✅ Chunk ${msg.data.chunkNo}/${totalChunks} uploaded successfully`,
      });
    }
    if (msg.data.type === "error") {
      self.postMessage({
        type: "error",
        error: `❌ Failed to upload chunk #${msg.data.chunkNo}: ${msg.data.error}`,
      });
    }

    worker.terminate();
    activeWorkers--;
    processQueue();
  };
}
