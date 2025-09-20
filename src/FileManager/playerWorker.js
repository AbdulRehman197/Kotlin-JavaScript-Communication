import axios from "axios";
self.onmessage = async (e) => {
  const { url, type } = e.data;
//   const res = await fetch(url);
//   const blob = await res.blob();
//   const objectUrl = URL.createObjectURL(blob);
//   postMessage({eventType: "getFile", objectUrl, type });


   try {
      const response = await axios.get(url, {
        responseType: "blob", // we want binary data
        onDownloadProgress: (event) => {
          if (event.total) {
            const percent = Math.round((event.loaded * 100) / event.total);
            postMessage({eventType: "getProgress", percent});
          }
        },
      });

      // Create an object URL for the blob
      const objectUrl = URL.createObjectURL(response.data);
      postMessage({eventType: "getFile", objectUrl, type });
    } catch (error) {
      console.error("Download failed", error);
    }
};
