import React, { useEffect, useRef, useState } from "react";

function ScanFace() {
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement("canvas"));
  const [scanUser, setScanUser] = useState<String>("");
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
          `${
            import.meta.env.VITE_APP_SOCKET_URL
          }/get_face/${localStorage.getItem("username")}`
        );

        socketRef.current.onopen = () => {
          console.log("✅ WebSocket connected to scan_face");
        };

        socketRef.current.onmessage = (event) => {
          console.log("📩 Server response:", event.data);
          if (event.data.includes("10")) {
            setScanUser(event.data);
          } else {
            setScanUser(event.data);
          }
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
    setScanUser("");
  };

  return (
    <div className="flex flex-col items-center justify-center gap-2 mt-2">
      <h1>{scanUser}</h1>
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
