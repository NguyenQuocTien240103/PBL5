from fastapi import FastAPI, UploadFile, File, APIRouter
from fastapi.responses import JSONResponse
from vosk import Model, KaldiRecognizer
from pathlib import Path
import io
import json
import wave
from .arduino_connection import get_arduino  
arduino = get_arduino()  # 

router = APIRouter()

# Tải model VOSK tiếng Việt
current_dir = Path(__file__).resolve().parent
model_path = current_dir / "vosk-model-small-vn-0.4"
model = Model(str(model_path))



@router.post("/recognize-audio")
async def recognize_audio(file: UploadFile = File(...)):
    try:
        if file.content_type not in ["audio/wav", "audio/x-wav"]:
            return JSONResponse(content={"error": "❌ File phải là định dạng WAV"}, status_code=400)

        contents = await file.read()
        wav_io = io.BytesIO(contents)
        wf = wave.open(wav_io, "rb")

        if wf.getnchannels() != 1 or wf.getsampwidth() != 2 or wf.getframerate() != 16000:
            return JSONResponse(content={"error": "❌ File WAV phải là mono PCM 16bit, 16kHz"}, status_code=400)

        recognizer = KaldiRecognizer(model, 16000)
        full_text = ""
        while True:
            data = wf.readframes(4000)
            if len(data) == 0:
                break
            if recognizer.AcceptWaveform(data):
                result = json.loads(recognizer.Result())
                full_text += result.get("text", "") + " "

        final = json.loads(recognizer.FinalResult())
        full_text += final.get("text", "")
        full_text = full_text.strip().lower()

        # Phân tích lệnh giọng nói
        action = None
        if "mở cửa" in full_text:
            action = "2"
        elif "đóng cửa" in full_text:
            action = "3"
        elif "bật đèn" in full_text:
            action = "6"
        elif "tắt đèn" in full_text:
            action = "7"
        elif "bật còi" in full_text:
            action = "8"
        elif "tắt còi" in full_text:
            action = "9"
        # Gửi lệnh đến Arduino nếu kết nối thành công
        if action and arduino and arduino.is_open:
            arduino.write((action + "\n").encode())
            return {"text": full_text, "command_sent": action}

        return {"text": full_text, "command_sent": None if not action else f"Không gửi được tới Arduino"}

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
