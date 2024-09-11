export function arrayBufferToBase64(buffer) {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
  // Calculate the SHA-256 hash using Web Crypto API
  export async function calculateSHA256(uint8Array) {
    // Calculate SHA-256 hash using Web Crypto API
    const hashBuffer = await crypto.subtle.digest("SHA-256", uint8Array);
  
    // Convert hash ArrayBuffer to hexadecimal string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  
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
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  
    // Convert hash to Base64
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashBinary = hashArray.reduce(
      (data, byte) => data + String.fromCharCode(byte),
      ""
    );
    const hashBase64 = btoa(hashBinary);
  
    return hashBase64;
  }