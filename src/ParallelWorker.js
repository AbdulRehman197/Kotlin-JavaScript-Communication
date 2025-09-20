/* eslint-disable no-inner-declarations */
/* eslint-disable no-case-declarations */
import CryptoJS from "crypto-js";
import { arrayBufferToBase64 } from "./utils.js";

const CHUNK_SIZE = 6 * 1000 * 1000; // 6 MB
const SMALL_CHUNK_SIZE = 375 * 1000; // 375 KB

let PORT = null;

let verid = padOrTrim("0001", 4);
let reservedBytes = padOrTrim("", 8);

let currentFile = null;
let fileOffset = 0;

let currentPacketSha = "";
let kPacketNames = new Map();

console.log("worker initialized");

self.addEventListener("message", async (event) => {
  const data = event.data;
  switch (data.type) {
    case undefined:
      console.log("port received");
      PORT = data;
      await handlePortCallbacks();
      break;

    case "deletedb":
      PORT.postMessage("deleteDB|");
      break;

    case "file":
      console.log("Received file, size (MB):", data.file.size / (1024 * 1024));
      resetFileState();
      currentFile = data.file;
      await processFileV2(currentFile);
      break;

    case "sendToKotlin":
      const hash = await hashStringSHA256(
        Array.from(kPacketNames.keys()).join("")
      );
      const metadata =
        verid +
        padOrTrim("metadata", 32) +
        padOrTrim(`k${kPacketNames.size}`, 4) +
        padOrTrim(hash.toString(), 32);
      PORT.postMessage(metadata);
      break;

    case "getFile":
      handleGetFile(event.data.name);
      break;

    default:
      console.warn("Unknown message type:", data.type);
  }
});

function resetFileState() {
  fileOffset = 0;
  currentPacketSha = "";
  kPacketNames.clear();
  currentFile = null;
}

async function handlePortCallbacks() {
  return new Promise((resolve) => {
    PORT.onmessage = async (event) => {
      console.log("Message from Kotlin:", event.data);
      const [type] = event.data.split("|");

      switch (type) {
        case "metaRecevied":
          self.postMessage({
            type: "status",
            status: `chunk no ${fileOffset / CHUNK_SIZE}/${Math.ceil(
              currentFile.size / CHUNK_SIZE
            )} is sending`,
          });
          await processSmallChunksParallel();
          break;

        case "packetCompleted":
          await processFileV2(currentFile);
          break;

        case "completeSHA":
          console.log("completeSHA received");
          break;

        default:
          console.warn("Unhandled PORT message type:", type);
      }

      resolve();
    };
  });
}

async function processFileV2(file) {
  if (fileOffset >= file.size) {
    self.postMessage({
      type: "status",
      status: "file sending is completed",
      file: {
        isCompleted: true,
        name: file.name,
      },
    });
    return;
  }

  const blobChunk = file.slice(fileOffset, fileOffset + CHUNK_SIZE);
  fileOffset += CHUNK_SIZE;

  console.log("Processing chunk no:", fileOffset / CHUNK_SIZE);

  const arrayBuffer = await blobChunk.arrayBuffer();

  const shaHash = await getArrayBufferSHA256(arrayBuffer);
  currentPacketSha = shaHash;
  kPacketNames.set(shaHash, { isCompleted: false });

  const metadata =
    verid +
    padOrTrim("metadata", 32) +
    padOrTrim(shaHash, 64) +
    padOrTrim(arrayBuffer.byteLength, 8) +
    padOrTrim(currentFile.name, 500) +
    padOrTrim(fileOffset / CHUNK_SIZE, 8);
  PORT.postMessage(metadata);
}

async function processSmallChunksParallel() {
  const chunkBuffer = await currentFile
    .slice(fileOffset - CHUNK_SIZE, fileOffset)
    .arrayBuffer();

  const numChunks = Math.ceil(chunkBuffer.byteLength / SMALL_CHUNK_SIZE);
  const promises = [];

  for (let i = 0; i < numChunks; i++) {
    const offset = i * SMALL_CHUNK_SIZE;
    const slice = chunkBuffer.slice(offset, offset + SMALL_CHUNK_SIZE);
    promises.push(runBase64Worker(slice, i, offset));
  }

  await Promise.all(promises);

  // Notify Kotlin after all slices are done
  const packetCompleted =
    verid +
    padOrTrim("packetCompleted", 32) +
    padOrTrim(currentPacketSha, 64);
  PORT.postMessage(packetCompleted);
}

function runBase64Worker(sliceBuffer, index, offset) {
  return new Promise((resolve, reject) => {
    const workerBlob = new Blob(
      [
        `
      self.onmessage = async function(e) {
        const { buffer } = e.data;
        const base64 = btoa(
          new Uint8Array(buffer)
            .reduce((data, byte) => data + String.fromCharCode(byte), "")
        );
        self.postMessage({ base64 });
      };
      `,
      ],
      { type: "application/javascript" }
    );

    const blobURL = URL.createObjectURL(workerBlob);
    const worker = new Worker(blobURL);
    URL.revokeObjectURL(blobURL);

    worker.onmessage = (e) => {
      const base64 = e.data.base64;
        console.log("base64", base64)
      const finalString =
        verid +
        padOrTrim("randomString", 32) +
        padOrTrim(currentPacketSha, 64) +
        padOrTrim(index, 4) +
        padOrTrim(offset, 12) +
        reservedBytes +
        base64;

      PORT.postMessage(finalString);
      worker.terminate();
      resolve();
    };

    worker.onerror = (err) => {
      console.error("Worker error", err);
      reject(err);
    };

    worker.postMessage({ buffer: sliceBuffer }, [sliceBuffer]); // Transfer buffer for performance
  });
}

function padOrTrim(str, length) {
  return (str + " ".repeat(length)).slice(0, length);
}

const handleGetFile = (fileName) => {
  const fileMetadData =
    verid + padOrTrim("readFileChunk", 32) + padOrTrim(fileName, 500);
  PORT.postMessage(fileMetadData);
};

async function getArrayBufferSHA256(arrayBuffer) {
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hashStringSHA256(message) {
  return CryptoJS.SHA256(message).toString(CryptoJS.enc.Hex);
}
