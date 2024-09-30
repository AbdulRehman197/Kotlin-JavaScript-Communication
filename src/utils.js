export function arrayBufferToBase64(buffer) {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    console.log("binarylength", len);

    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
   let bas64 = btoa(binary);
    console.log("binarybase64", bas64.length)

    return bas64
  }
  // Calculate the SHA-256 hash using Web Crypto API
  export async function calculateSHA256(buffer) {
    // const bytes = new Uint8Array(buffer);
    // Calculate SHA-256 hash using Web Crypto API
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    console.log("hashBuffer", hashBuffer.byteLength);
    // Convert hash ArrayBuffer to hexadecimal string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
      console.log("hashHex", hashHex.length);
    return hashHex;
  }
  
  // Calculates the SHA-256 hash of a Base64 encoded string.
  
  export async function calculateSHA256FromBase64(base64String) {
    // Decode Base64 string to Uint8Array
    const arrayBuffer = Uint8Array.from(atob(base64String), (c) =>
      c.charCodeAt(0)
    ).buffer;
  
    // Calculate SHA-256 hash
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  
    // Convert hash ArrayBuffer to hexadecimal string
    return Array.from(new Uint8Array(hashBuffer), (b) =>
      b.toString(16).padStart(2, "0")
    ).join("");
  }
  // Start reading the first 4 MB chunk
  
  export function ensureFourByteString(input) {
    // Ensure the input is an integer
    if (!Number.isInteger(input)) {
      throw new Error("Input must be an integer");
    }
  
    // Convert the integer to a string
    let str = input.toString();
  
    // Pad the string with zeros to ensure it is exactly 4 characters long
    if (str.length < 4) {
      return str.padStart(4, "0");
    }
  
    // Truncate the string if it is longer than 4 characters
    return str.substring(0, 4);
  }
  
  export async function calculateBase64SHA256(input) {
    // Convert input string to Uint8Array
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
  
    // Compute SHA-256 hash
    // const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  
    // Convert hash to Base64
    const hashArray = Array.from((data));
    const hashBinary = hashArray.reduce(
      (data, byte) => data + String.fromCharCode(byte),
      ""
    );
    // console.log("hashHex", hashBinary.length);
    const hashBase64 = btoa(hashBinary);
    // console.log("hashBase64", hashBase64.length);
  
    return hashBase64;
  }