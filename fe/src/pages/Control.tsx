import { useState, useEffect } from 'react';
import { useReactMediaRecorder } from 'react-media-recorder';

function Control() {
  const { status, startRecording, stopRecording, mediaBlobUrl } = useReactMediaRecorder({ audio: true });
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  useEffect(() => {
    if (mediaBlobUrl) {
      fetch(mediaBlobUrl)
        .then(res => res.blob())
        .then(blob => setAudioBlob(blob))
        .catch(err => console.error("Lỗi khi chuyển mediaBlobUrl thành Blob:", err));
    }
  }, [mediaBlobUrl]);

  return (
    <div>
      <h1 className="text-3xl font-bold underline">Hello world!</h1>
      <h1>{status}</h1>
      <button onClick={startRecording}>Bắt đầu ghi âm</button>
      <button onClick={stopRecording}>Dừng ghi âm</button>
      {mediaBlobUrl && <audio src={mediaBlobUrl} controls />}
    </div>
  );
}

export default Control;