import { useEffect, useState, useCallback, useRef } from "react";

// import appLogo from '/favicon.svg'
import PWABadge from "./PWABadge.jsx";
import "./App.css";

function App() {
  const [portObj, setPortObj] = useState({});
  const base64Chunks = useRef([]);
  const [base64String, setBase64String] = useState("");
  const [chunkIndexNo, setChunkIndexNo] = useState(0);
  const fileRef = useRef(null);
  const [sha256List, SetSha256List] = useState([]);
  const [status, setStatus] = useState("");
  // const [reader, setReader] = useState(null)
  // const [readerStatus, setReaderStatus] = useState("")
  const worker = new Worker(new URL("./Worker.js", import.meta.url));

  let handleCallBack = useCallback((event) => {
    var port = event.ports[0];
    if (typeof port !== "undefined") {
      worker.postMessage(port, [port]);
      // alert(port)

      // alert(port)
      // let chunkIndex = 0;
      // Receive upcoming messages on this port.
      //   // alert(e.data)
      //   // alert(base64Chunks.current.length)
      //   if (e.data === 'confirm') {
      //     if (chunkIndex < base64Chunks.current.length) {
      //       // alert(typeof base64Chunks.current[chunkIndex])
      //       port.postMessage(base64Chunks.current[chunkIndex]);
      //       chunkIndex++;
      //       setChunkIndexNo(chunkIndex)
      //     } else {
      //       port.postMessage(fileRef.current.name);
      //       // alert('All chunks sent successfully');

      //       // self.close();
      //     }
      //   }
    }
  }, []);

  useEffect(() => {
    // worker.postMessage({type: 'port', port: portObj})
    worker.onmessage = (event) => {
      const message = event.data;
      console.log("message", message);
      switch (event.data.type) {
        case "status":
          setStatus(event.data.status);
          break;
        case "sha256":
          console.log("console APP 56", message);
          console.log("checking sha256",message.chunkSha256);
          worker.postMessage({ type: "sha256Exist", isExistChunk: false });
          break;
        case "startsending":
          worker.postMessage({ type: "isListReady", isListReady: true });
          break;
        case "packet":
          console.log("packet", message.data.length);
          break;
          case "completesending":
            worker.postMessage({ type: "completesending", isCompleted: true });
            break
          
        // case "sha256":
        //   console.log("ChunkResult", message)
        //   if(sha256List.includes(message.sha256)){
        //     worker.postMessage({type: "sha256", isExistChunk: true})
        //   }else{
        //     sha256List.push(message.sha256)
        //     worker.postMessage({type: "sha256", isExistChunk: false})
        //   }
        //   break;

        default:
          break;
      }
    };
    window.addEventListener("message", handleCallBack);
    // setReader(new FileReader())
    return () => {
      window.removeEventListener("message", handleCallBack);
    };
  }, [handleCallBack]);

  const handleFetchData = async () => {
    worker.postMessage({ type: "file", file: fileRef.current });

    // alert(data.length + " " + portObj)
  };
  const handleFilePicker = async (e) => {
    console.log("done doone");
    // setData(null)
    const file = e.target.files[0];
    fileRef.current = file;
    // let fileBuffer  =  await file.arrayBuffer()
    // let fileBufferUnitArray  =  new Uint8Array(fileBuffer)
    // console.log("byteArray",fileBuffer)
    // console.log("byteArrayUint8Array",fileBufferUnitArray)
    // let filesha = await calculateSHA256(fileBuffer)
    //   let filebase64 =   arrayBufferToBase64(fileBuffer)
    //   console.log("filebase64", filebase64)
    //     fileRef.current = file
    //       console.log("filesha", filesha)
    //  let shaFrombase64 = await calculateSHA256FromBase64(filebase64)
    //    console.log("filebase64sha", shaFrombase64)

    // fileRef.current = file
    //   let buffer =  await file.arrayBuffer();
    //   // alert(buffer.byteLength)
    // let base64 =  btoa(new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), ''));

    //   console.log("file",base64)
    //   setBase64String(base64)
    //  let returnChunksOfBase64 = await splitBase64(base64, 500)
    // //  alert(returnChunksOfBase64.length)
    //  base64Chunks.current = (returnChunksOfBase64)
  };

  return (
    <>
      <div>
        <h1>{status}</h1>
        {/* <img alt='Demo logo' className='logo' src={data.} /> */}
        <input type="file" onChange={handleFilePicker} />
        {/* <button onClick={handleFilePicker}>Pick File</button> */}
        {/* <input type='text' onChange={(e)=>setData(e.target.value)}/> */}
        <button onClick={handleFetchData}>Fetch data</button>
        <button onClick={() => worker.postMessage({ type: "deletedb" })}>
          Delete DB
        </button>
        {/* <p>size:{base64String !== "" ? `${((base64String.length))}` : "data not fetched"}</p>
        <p>{base64Chunks.current !== null ? base64Chunks.current.length : "data not fetched"}</p> */}
        <p>
          {chunkIndexNo} / {base64Chunks.current.length}
        </p>
        {/* <p>{base64String.slice(3225000,base64String.length)}</p> */}
      </div>
      <PWABadge />
    </>
  );
}

export default App;
