self.addEventListener("message", async (event) => {
  const { chunk, chunkNo, fileName,totalChunks } = event.data;

  try {
    const sha = await getBlobSHA256(chunk);
    console.log("Chunk SHA256:", sha);

    // Send chunk to server
    console.log("Uploading chunk to server...");
    const response = await fetch("http://127.0.0.1:8080/uploadchunk", {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "X-Chunk-SHA256": sha,
        "X-File-Name": encodeURIComponent(fileName),
        "X-Chunk-Number": chunkNo.toString(),
        "X-Chunk-Size": chunk.size.toString(),
        "X-Total-Size": totalChunks.toString(),
      },
      body: chunk,
    });
    // const response = await fetch("http://localhost:8080/")
    console.log("res", response)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    self.postMessage({ type: "uploaded", chunkNo });
  } catch (err) {
    self.postMessage({ type: "error", chunkNo, error: err.message });
  }
});

async function getBlobSHA256(blob) {
  const arrayBuffer = await blob.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
