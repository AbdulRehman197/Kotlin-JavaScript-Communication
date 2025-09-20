import { useState, useEffect } from "react";
import axios from "axios";
export default function FileManager() {
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [media, setMedia] = useState(null);
  const [progress, setProgress] = useState(0);
  const SERVER_URL = "http://127.0.0.1:8080"; // Change to your Kotlin server IP

  const fetchFolders = async () => {
    console.log("Fetching folders from server...");
    const res = await fetch(`${SERVER_URL}/folders`);
    setFolders(await res.json());
  };

  const fetchFiles = async (folder) => {
    console.log("Fetching files from server...");
    setSelectedFolder(folder);
    const res = await fetch(`${SERVER_URL}/folder/${folder}`);
    // console.log("Files in folder:", await res.json());
    setFiles(await res.json());
  };

  const uploadFile = async (e) => {
    console.log("upload file to server...");
    const file = e.target.files[0];
    if (!file) return;

    // await fetch(
    //   `${SERVER_URL}/upload?filename=${encodeURIComponent(file.name)}`,
    //   {
    //     method: "POST",
    //     headers: { "Content-Type": "application/octet-stream" },
    //     body: file,
    //   }
    // );

    try {
      await axios.post(
        `${SERVER_URL}/upload?filename=${encodeURIComponent(file.name)}`,
        file,
        {
          headers: {
            "Content-Type": "application/octet-stream",
          },
          onUploadProgress: (event) => {
            if (event.total) {
              const percent = Math.round((event.loaded * 100) / event.total);
            //   percent === 100
            //     ? setTimeout(() => {
            //         fetchFiles(folders[0]);
            //       }, 100)
            //     : null;
              setProgress(percent);
            }
          },
        }
      );
    } catch (err) {
      console.error("Upload failed", err);
    }

     fetchFiles(folders[0]);
  };

  const playFile = (url, type) => {
    console.log("Fetching file from server...");
    const worker = new Worker(new URL("./playerWorker.js", import.meta.url));
    worker.postMessage({ url, type });
    worker.onmessage = (e) => {
      if (e.data.eventType == "getFile") {
        setMedia(e.data);
      }
      if (e.data.eventType === "getProgress") {
        setProgress(e.data.percent);
      }
    };
  };

  useEffect(() => {
    fetchFolders();
  }, []);

  return (
    <div>
      <input type="file" onChange={uploadFile} style={{ marginBottom: 20 }} />
      {progress > 0 && <p>Progress: {progress}%</p>}
      <h2>Folders</h2>
      {folders.map((f) => (
        <>
          <a
            href=""
            onClick={(e) => {
              e.preventDefault();
              fetchFiles(f);
            }}
            style={{ cursor: "pointer", color: "green" }}
          >
            {f}
          </a>
        </>
      ))}

      {selectedFolder && (
        <>
          <h3>Files in {selectedFolder}</h3>

          {files.map((file) => (
            <>
              <a
                href=""
                key={file.name}
                onClick={(e) => {
                  e.preventDefault();
                  playFile(file.url, file.type);
                }}
                style={{ cursor: "pointer", color: "green" }}
              >
                {file.name.substring(0, 20)} ({file.type})(
                {(file.size / (1024 * 1024)).toFixed(2)} MB)
              </a>
              <br />
            </>
          ))}
        </>
      )}

      {media && (
        <div style={{ marginTop: 20 }}>
          {media.type === "image" && (
            <img
              src={media.objectUrl}
              alt="preview"
              style={{ maxWidth: "100%" }}
            />
          )}
          {media.type === "video" && (
            <video
              src={media.objectUrl}
              controls
              style={{ maxWidth: "100%" }}
            />
          )}
        </div>
      )}
    </div>
  );
}
