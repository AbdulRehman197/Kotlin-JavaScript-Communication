import { useEffect, useState, useRef, useCallback } from "react";
import PWABadge from "./PWABadge.jsx";
import "./App.css";

function App() {
  const workerRef = useRef(null);
  const fileRef = useRef(null);

  const [status, setStatus] = useState("");
  const [file, setFile] = useState({});
  const [kPacketSize, setKPacketSize] = useState(0);

  // Create worker once on mount
  useEffect(() => {
    workerRef.current = new Worker(
      new URL("./HttpWorker.js", import.meta.url),
      {
        type: "module",
      }
    );

    const worker = workerRef.current;

    worker.onmessage = (event) => {
      const message = event.data;
      console.log("Worker message:", message);

      switch (message.type) {
        case "status":
          setStatus(message.status);
          setFile(message.file);
          break;
        case "sha256":
          console.log("SHA256 chunk:", message.chunkSha256);
          worker.postMessage({ type: "sha256Exist", isExistChunk: false });
          break;
        case "startsending":
          worker.postMessage({ type: "isListReady", isListReady: true });
          break;
        case "packet":
          console.log("Packet length:", message.data.length);
          break;
        case "completesending":
          worker.postMessage({ type: "completesending", isCompleted: true });
          break;
        case "kPacketSize":
          console.log("kPacketSize:", message.kPacketSize);
          setKPacketSize(message.kPacketSize);
          break;
        case "packetCompleted":
          worker.postMessage({ type: "sendToKotlin" });
          break;
        default:
          break;
      }
    };

    // Cleanup worker on unmount
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  // Handle incoming MessageChannel port (if needed)
  const handleCallBack = useCallback((event) => {
    const port = event.ports?.[0];
    if (port && workerRef.current) {
      workerRef.current.postMessage(port, [port]);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("message", handleCallBack);
    return () => window.removeEventListener("message", handleCallBack);
  }, [handleCallBack]);

  // Send selected file to worker
  const handleFetchData = () => {
    if (fileRef.current && workerRef.current) {
      workerRef.current.postMessage({ type: "file", file: fileRef.current });
    }
  };

  // Handle file selection
  const handleFilePicker = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      fileRef.current = selectedFile;
      setStatus("");
      setFile({});
    }
  };

  return (
    <>
      <div>
        <input type="file" onChange={handleFilePicker} />
        <button onClick={handleFetchData} disabled={!fileRef.current}>
          Send file
        </button>
        <button
          onClick={async () => {
            const response = await fetch("http://127.0.0.1:8080/");
            console.log("res", response);
          }}
        >
          Check
        </button>
        <p>{status}</p>
        {file?.isCompleted && (
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              workerRef.current.postMessage({
                type: "getFile",
                name: file.name,
              });
              setTimeout(() => {
                window.close();
              }, 100);
            }}
          >
            {file.name}
          </a>
        )}
      </div>
      <PWABadge />
    </>
  );
}

export default App;
