// import React, { useEffect, useRef, useState } from "react";

// function ScanFace() {
//   const videoRef = useRef<HTMLVideoElement | null>(null);
//   const socketRef = useRef<WebSocket | null>(null);
//   const canvasRef = useRef<HTMLCanvasElement>(document.createElement("canvas"));
//   const [isClickScan, setIsClickScan] = useState<boolean>(false);
//   // useEffect(() => {
//   //   // Kết nối WebSocket
//   //   socketRef.current = new WebSocket("ws://localhost:8000/ws"); // Hoặc ws://localhost:8000/ws nếu dùng FastAPI

//   //   socketRef.current.onopen = () => {
//   //     console.log("✅ WebSocket connected");
//   //     startWebcam();
//   //   };

//   //   socketRef.current.onclose = () => {
//   //     console.log("❌ WebSocket disconnected");
//   //   };

//   //   socketRef.current.onerror = (error) => {
//   //     console.error("WebSocket error:", error);
//   //   };

//   //   return () => {
//   //     socketRef.current?.close();
//   //   };
//   // }, []);

//   const startWebcam = () => {
//     socketRef.current = new WebSocket("ws://localhost:8000/ws"); // Hoặc ws://localhost:8000/ws nếu dùng FastAPI
//     socketRef.current.onmessage = (event) => {
//       console.log("✅ Server response:", event.data);
//     };

//     navigator.mediaDevices
//       .getUserMedia({ video: true })
//       .then((stream) => {
//         const video = videoRef.current;
//         if (video) {
//           video.srcObject = stream;
//           video.onloadedmetadata = () => {
//             video.play();
//             streamFrame();
//           };
//         }
//       })
//       .catch((err) => console.error("Lỗi webcam:", err));
//   };

//   const streamFrame = () => {
//     const video = videoRef.current;
//     const canvas = canvasRef.current;
//     const ctx = canvas.getContext("2d");

//     const sendFrame = () => {
//       if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
//         requestAnimationFrame(sendFrame);
//         return;
//       }

//       canvas.width = video.videoWidth;
//       canvas.height = video.videoHeight;
//       ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

//       canvas.toBlob(
//         (blob) => {
//           if (blob) {
//             console.log("Blob created:", blob.size);
//             if (socketRef.current?.readyState === WebSocket.OPEN) {
//               socketRef.current.send(blob);
//             } else {
//               console.warn("WebSocket not open");
//             }
//           } else {
//             console.error("Failed to create blob");
//           }
//           requestAnimationFrame(sendFrame);
//         },
//         "image/jpeg",
//         0.7
//       );
//     };

//     requestAnimationFrame(sendFrame);
//   };

//   return (
//     <div className="flex flex-col items-center justify-center gap-2 mt-2">
//       {isClickScan && (
//         <video
//           ref={videoRef}
//           autoPlay
//           muted
//           playsInline
//           style={{ border: "2px solid black" }}
//           width={640}
//           height={480}
//         />
//       )}
//       <button className="bg-gray-500 text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:bg-gray-600 transition duration-300 cursor-pointer">
//         Start Scan
//       </button>
//     </div>
//   );
// }

// export default ScanFace;

import React, { useEffect, useRef, useState } from "react";

function ScanFace() {
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement("canvas"));

  useEffect(() => {
    let stream: MediaStream | null = null;
    let animationFrameId: number | null = null;

    const startScan = async () => {
      try {
        // 1. Mở webcam
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // 2. Mở kết nối WebSocket
        socketRef.current = new WebSocket(
          `ws://localhost:8000/ws/get_face/${localStorage.getItem("username")}`
        );

        socketRef.current.onopen = () => {
          console.log("✅ WebSocket connected to scan_face");
        };

        socketRef.current.onmessage = (event) => {
          console.log("📩 Server response:", event.data);
        };

        // 3. Gửi frame mỗi giây
        let lastFrameTime = 0;

        const sendFrame = (timestamp: number) => {
          if (!isScanning) return;

          const video = videoRef.current;
          const canvas = canvasRef.current;
          const context = canvas.getContext("2d");

          if (timestamp - lastFrameTime >= 1000) {
            lastFrameTime = timestamp;

            if (video && video.videoWidth && video.videoHeight && context) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              context.drawImage(video, 0, 0, canvas.width, canvas.height);

              canvas.toBlob(
                (blob) => {
                  if (
                    blob &&
                    socketRef.current?.readyState === WebSocket.OPEN
                  ) {
                    socketRef.current.send(blob);
                  }
                },
                "image/jpeg",
                0.7
              );
            }
          }

          animationFrameId = requestAnimationFrame(sendFrame);
        };

        animationFrameId = requestAnimationFrame(sendFrame);
      } catch (error) {
        console.error("🚨 Error starting webcam:", error);
      }
    };

    if (isScanning) {
      startScan();
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (stream) stream.getTracks().forEach((track) => track.stop());
      if (socketRef.current) socketRef.current.close();
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [isScanning]);

  const handleStartScan = () => setIsScanning(true);

  const handleStopScan = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }

    if (socketRef.current) {
      socketRef.current.close();
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsScanning(false);
  };

  return (
    <div className="flex flex-col items-center justify-center gap-2 mt-2">
      {isScanning && <video ref={videoRef} autoPlay muted playsInline />}

      <div className="flex gap-4">
        {isScanning ? (
          <button
            onClick={handleStopScan}
            className="bg-blue-500 text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:bg-blue-600 transition duration-300"
          >
            Stop Scan
          </button>
        ) : (
          <button
            onClick={handleStartScan}
            className="bg-green-500 text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:bg-green-600 transition duration-300"
          >
            Start Scan
          </button>
        )}
      </div>
    </div>
  );
}

export default ScanFace;
