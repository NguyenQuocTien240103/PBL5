import React, { useEffect, useState } from "react";

const FaceDetection: React.FC = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [captureStatus, setCaptureStatus] = useState<string>('');
  const [faceId, setFaceId] = useState<string>('');
  const [imgSrc, setImgSrc] = useState<string>('');
  const [recognizing, setRecognizing] = useState(false);

  useEffect(() => {
    return () => {
      if (isStreaming || recognizing) {
        stopStreaming();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStreaming, recognizing]);

  const startStreaming = () => {
    if (!faceId.trim()) {
      setCaptureStatus('Please enter your name before starting the camera');
      return;
    }

    const streamUrl = `http://localhost:8000/get_face?face_id=${encodeURIComponent(faceId)}&timestamp=${Date.now()}`;
    setImgSrc(streamUrl);
    setIsStreaming(true);
    setCaptureStatus('');
  };

  const recognizeFace = () => {
    if (!faceId.trim()) {
      setCaptureStatus('Please enter your name before recognizing');
      return;
    }
    const streamUrl = `http://localhost:8000/recognize_face?face_id=${encodeURIComponent(faceId)}&timestamp=${Date.now()}`;
    setImgSrc(streamUrl);
    setRecognizing(true);
    setCaptureStatus('');
  };

  const stopStreaming = async () => {
    try {
      const stopUrl = recognizing 
        ? "http://localhost:8000/stop_recognize_face"  // 👈 nếu recognizing thì gọi stop_recognize_face
        : "http://localhost:8000/stop_get_face";       // 👈 còn không thì gọi stop_get_face

      const response = await fetch(stopUrl);
      if (!response.ok) {
        console.error("Error stopping the camera");
      }
    } catch (error) {
      console.error("Connection error to the server:", error);
    } finally {
      setImgSrc('');
      setIsStreaming(false);
      setRecognizing(false);
    }
  };

  return (
    <div className="flex flex-col items-center p-5 gap-5">
      <div className="border-2 border-gray-300 rounded-lg overflow-hidden shadow-md">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt="Face Detection Stream"
            className="w-[640px] h-[480px] object-cover"
          />
        ) : (
          <div className="w-[640px] h-[480px] flex items-center justify-center text-gray-400">
            Camera Off
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={faceId}
            onChange={(e) => setFaceId(e.target.value)}
            placeholder="Enter your name"
            className="px-3 py-2 border border-gray-300 rounded-md text-base w-48"
            disabled={isStreaming || recognizing}
          />
          {!isStreaming ? (
            <button 
              onClick={startStreaming}
              className={`px-5 py-2.5 rounded-md font-bold transition-colors ${
                faceId.trim() 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              disabled={!faceId.trim() || recognizing} // 👈 đang recognizing cũng không cho start streaming
            >
              Start Streaming
            </button>
          ) : (
            <button 
              onClick={stopStreaming}
              className="px-5 py-2.5 rounded-md font-bold transition-colors bg-red-600 hover:bg-red-700 text-white cursor-pointer"
            >
              Stop Streaming
            </button>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          {!recognizing ? (
            <button 
              onClick={recognizeFace}
              disabled={!faceId.trim() || isStreaming} // 👈 đang streaming thì ko recognize được
              className={`px-5 py-2.5 rounded-md font-bold transition-colors ${
                !faceId.trim() || isStreaming
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white cursor-pointer'
              }`}
            >
              Recognize Face
            </button>
          ) : (
            <button 
              onClick={stopStreaming}
              className="px-5 py-2.5 rounded-md font-bold transition-colors bg-red-600 hover:bg-red-700 text-white cursor-pointer"
            >
              Stop Recognizing
            </button>
          )}
        </div>

        {captureStatus && (
          <div className="mt-2 p-2.5 rounded-md bg-gray-100 text-gray-800">
            <p>{captureStatus}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FaceDetection;
