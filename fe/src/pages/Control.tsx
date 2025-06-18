// export default Control;
import { useState, useEffect } from "react";
import { useReactMediaRecorder } from "react-media-recorder";
import { convertWebmToWav } from "../utils";
import DetectFace from "../components/DetectFace";
function Control() {
  const { status, startRecording, stopRecording, mediaBlobUrl } =
    useReactMediaRecorder({ audio: true });
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recognizedText, setRecognizedText] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isDetectFace, setIsDetectFace] = useState<boolean>(false);
  const [showCamera, setShowCamera] = useState<boolean>(false);
  useEffect(() => {
    if (mediaBlobUrl) {
      fetch(mediaBlobUrl)
        .then((res) => res.blob())
        .then((blob) => setAudioBlob(blob))
        .catch((err) =>
          console.error("Lỗi khi chuyển mediaBlobUrl thành Blob:", err)
        );
    }
  }, [mediaBlobUrl]);

  const sendToServer = async () => {
    if (!audioBlob) return alert("Chưa có dữ liệu ghi âm!");
    setIsSending(true);

    try {
      const wavBlob = await convertWebmToWav(audioBlob);
      console.log("test", wavBlob);
      const formData = new FormData();
      formData.append("file", wavBlob, "recording.webm");
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/recognize-audio`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (response.ok) {
        setRecognizedText(data.text);
      } else {
        setRecognizedText(`❌ Lỗi: ${data.error || "Không rõ nguyên nhân"}`);
      }
    } catch (error) {
      setRecognizedText("❌ Lỗi khi gửi lên server");
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow-lg rounded-xl">
      <h1 className="text-2xl font-bold text-blue-700 mb-4 text-center">
        🎙️ Ghi âm & Nhận dạng giọng nói
      </h1>

      <p className="mb-2 text-gray-700">
        <span className="font-semibold">Trạng thái ghi âm:</span>{" "}
        <span className="italic">{status}</span>
      </p>

      <div className="flex gap-4 mb-4">
        <button
          onClick={() => {
            if (!isDetectFace) {
              setShowCamera(true);
              // setIsDetectFace(true);
            } else {
              // alert("abc");
              startRecording();
            }
          }}
          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition"
        >
          ▶️ Bắt đầu ghi âm
        </button>
        <button
          onClick={stopRecording}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
        >
          ⏹️ Dừng ghi âm
        </button>
      </div>

      {mediaBlobUrl && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">🔊 Nghe lại:</h3>
          <audio src={mediaBlobUrl} controls className="w-full mb-4" />
          <button
            onClick={sendToServer}
            disabled={isSending}
            className={`px-4 py-2 rounded-lg transition text-white ${
              isSending
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            📤 Gửi lên server
          </button>
        </div>
      )}

      {recognizedText && (
        <div className="mt-6 p-4 bg-gray-100 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">📄 Kết quả nhận diện:</h3>
          <p className="text-gray-800">{recognizedText}</p>
        </div>
      )}
      {showCamera && (
        <DetectFace
          setIsDetectFace={setIsDetectFace}
          setShowCamera={setShowCamera}
        />
      )}
    </div>
  );
}

export default Control;
