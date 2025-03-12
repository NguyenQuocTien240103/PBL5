from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import cv2
import threading
import time

app = FastAPI()
cap = None  # Biến lưu camera
camera_active = False  # Trạng thái camera
lock = threading.Lock()

def generate_frames():
    global cap, camera_active
    while camera_active:
        with lock:
            if cap is None or not cap.isOpened():
                break

            ret, frame = cap.read()
            if not ret:
                break

            _, buffer = cv2.imencode('.jpg', frame)
            frame_bytes = buffer.tobytes()

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

@app.get("/video_feed")
async def video_feed():
    global cap, camera_active
    with lock:
        if cap:  # Nếu camera đang mở, đóng lại trước khi mở lại
            cap.release()
            cap = None
        # Mở lại camera
        cap = cv2.VideoCapture(0)
        camera_active = True
        time.sleep(1)  # Chờ camera khởi động
    return StreamingResponse(generate_frames(), media_type="multipart/x-mixed-replace; boundary=frame")

@app.get("/stop_camera")
async def stop_camera():
    global cap, camera_active
    with lock:
        camera_active = False  # Dừng luồng camera
        if cap:
            cap.release()
            cap = None  # Giải phóng camera
    return {"message": "Camera stopped"}

# Đóng camera khi server dừng
import atexit
@atexit.register
def cleanup():
    global cap, camera_active
    with lock:
        camera_active = False
        if cap:
            cap.release()
            cap = None
