import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

const ffmpeg = createFFmpeg({ log: true });

export async function convertWebmToWav(blob: Blob): Promise<Blob> {
  if (!ffmpeg.isLoaded()) {
    await ffmpeg.load();
  }

  const webmFileName = 'input.webm';
  const wavFileName = 'output.wav';

  // Đưa file gốc vào bộ nhớ ảo của ffmpeg
  ffmpeg.FS('writeFile', webmFileName, await fetchFile(blob));

  // Thực hiện chuyển đổi
  await ffmpeg.run('-i', webmFileName, '-ar', '16000', '-ac', '1', '-acodec', 'pcm_s16le', wavFileName);

  // Lấy file WAV đã chuyển đổi ra
  const wavData = ffmpeg.FS('readFile', wavFileName);

  // Tạo Blob WAV
  return new Blob([wavData.buffer], { type: 'audio/wav' });
}
