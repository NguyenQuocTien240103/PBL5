from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import cv2
import threading
import time
import serial  # Thư viện giao tiếp với Arduino
from ultralytics import YOLO  # Thư viện YOLOv8

app = FastAPI()
cap = None  # Biến lưu camera
camera_active = False  # Trạng thái camera
lock = threading.Lock()

# Kết nối với Arduino
arduino = serial.Serial(port='COM3', baudrate=9600, timeout=1)  # Thay 'COM3' bằng cổng Arduino của bạn

# Load mô hình YOLOv8
model = YOLO('d:/hoctap/Nam03/hocky2/PBL5/Camera_Vision/best.pt')  # Thay bằng đường dẫn đến mô hình của bạn

def detect_human(frame):
    """
    Hàm nhận diện con người từ frame.
    Trả về True nếu phát hiện con người, ngược lại False.
    """
    results = model.predict(frame, show=False, conf=0.5)  # Dự đoán với YOLOv8
    for result in results[0].boxes:  # Duyệt qua các bounding box
        if result.cls == 0:  # Lớp '0' là con người (theo cấu hình của YOLOv8)
            return True
    return False

def generate_frames():
    global cap, camera_active
    while camera_active:
        with lock:
            if cap is None or not cap.isOpened():
                break

            ret, frame = cap.read()
            if not ret:
                break

            # Nhận diện con người
            if detect_human(frame):
                arduino.write(b'1')  # Gửi tín hiệu '1' để quay động cơ
            else:
                arduino.write(b'0')  # Gửi tín hiệu '0' để không quay

            # Vẽ bounding box và nhãn
            results = model.predict(frame, show=False, conf=0.5)
            annotated_frame = results[0].plot()

            _, buffer = cv2.imencode('.jpg', annotated_frame)
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
    time.sleep(1)  # Chờ một chút để đảm bảo camera đã dừng    
    arduino.write(b'0') 
    return {"message": "Camera stopped"}

# Đóng camera và kết nối Arduino khi server dừng
import atexit
@atexit.register
def cleanup():
    global cap, camera_active, arduino
    with lock:
        camera_active = False
        if cap:
            cap.release()
            cap = None
        if arduino:
            arduino.close()  # Đóng kết nối với Arduino