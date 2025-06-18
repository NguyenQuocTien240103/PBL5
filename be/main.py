from fastapi import FastAPI, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from app.routers import voice_recognize, face_recognize, camera, auth, ws_admin_user, user, video
from ultralytics import YOLO
import threading  
import time
from datetime import datetime
import os
import subprocess
import json
from app.routers.arduino_connection import get_arduino
from app.core.shared import picam2, lock, camera_active
from starlette.middleware.base import BaseHTTPMiddleware

app = FastAPI()

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
        response.headers["Cross-Origin-Embedder-Policy"] = "require-corp"
        return response


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(SecurityHeadersMiddleware)

app.include_router(voice_recognize.router)
app.include_router(face_recognize.router)
app.include_router(camera.router)
app.include_router(auth.router)
app.include_router(ws_admin_user.router)
app.include_router(user.router)
app.include_router(video.router)

if not os.path.exists("videos"):
    os.makedirs("videos")

video_writer = None
last_frame_time = None
video_filename = None

model = YOLO("/home/lenovo/PBL5/be/best_yolov8_dark.pt")
coco_labels = model.names  # Danh sách nhãn


camera_active = False
lock = threading.Lock()

def run_person_detection():
    arduino = get_arduino()
  
    
    print("Bắt đầu phát hiện người")
    
 
    while True:
        

        # Đọc config mỗi vòng lặp (nếu bạn hay cập nhật file)
        try:
            with open("config.json", "r") as f:
                time_config = json.load(f)
                year_start = int(time_config.get("year_start", 0))
                year_end = int(time_config.get("year_end", 9999))
                month_start = int(time_config.get("month_start", 1))
                month_end = int(time_config.get("month_end", 12))
                day_start = int(time_config.get("day_start", 1))
                day_end = int(time_config.get("day_end", 31))
                hours_start = int(time_config.get("hours_start", 0))
                hours_end = int(time_config.get("hours_end", 23))

        except Exception as e:
            print(f"Lỗi đọc config.json: {e}")
            year_start = year_end = None
            month_start = month_end = None
            day_start = day_end = None
            hours_start = hours_end = None

        
        print("abc")
        frame = picam2.capture_array("main")
        print("abcd")
        results = model(frame, verbose=False)[0]
        print("abcdf")
        person_detected = any(int(box.cls[0]) == 0 for box in results.boxes)
        print(f"person_detected: {person_detected}")


        now = datetime.now()
        current_hour = now.hour
        print(f"Thời gian hiện tại: {hours_start}, Giờ hiện tại: {hours_end}")
        # Nếu cả 2 giá trị là None → gửi tín hiệu bất kỳ lúc nào
        if hours_start is None and hours_end is None:
            if person_detected:
                
                arduino.write(b'10\n')

        # Nếu trong khoảng thời gian cho phép thì gửi tín hiệu
        elif hours_start is not None and hours_end is not None:
            try:
                today = datetime(now.year, now.month, now.day)
                config_date_start = datetime(year_start, month_start, day_start)
                config_date_end = datetime(year_end, month_end, day_end)
                print(f"Thời gian bawts dauf: {hours_start}, Giờ hiện tại: {current_hour}, gio ket thuc: {hours_end}")
                if config_date_start <= today <= config_date_end and hours_start <= current_hour < hours_end:
                    if person_detected:
                        print("Phát hiện người trong thời gian cho phép")
                        arduino.write(b'4\n')
                else:
                    if person_detected:
                        arduino.write(b'10\n')

            except Exception as e:
                print("Lỗi khi xử lý thời gian:", e)

        # Quản lý danh sách video, chỉ giữ tối đa 10 file
        def get_video_files():
            files = [f for f in os.listdir('videos') if f.endswith('.mp4')]
            files.sort(key=lambda x: os.path.getmtime(os.path.join('videos', x)))
            return files

        # Tránh ghi liên tục, chỉ ghi khi chưa ghi hoặc đã xong video trước
        if person_detected and not getattr(run_person_detection, 'is_recording', False):
            run_person_detection.is_recording = True
            try:
                from picamera2.encoders import H264Encoder
                from picamera2.outputs import FileOutput
                now = datetime.now()
                video_filename = f"videos/video_{now.strftime('%Y%m%d_%H%M%S')}.h264"
                mp4_file = f"videos/video_{now.strftime('%Y%m%d_%H%M%S')}.mp4"
                print(f"Ghi video vào file: {video_filename}")
                encoder = H264Encoder()
                output = FileOutput(video_filename)
                picam2.start_recording(encoder, output)
                time.sleep(2)  # Ghi trong 2 giây
                picam2.stop_recording()
                picam2.start()  # Bắt buộc phải start lại preview sau khi stop_recording để capture_array không bị treo
                print(f"✅ Đã lưu {video_filename}")

                # Chuyển sang .mp4
                if os.path.exists(video_filename):
                    print(f"🔄 Đang chuyển {video_filename} → {mp4_file}")
                    cmd = [
                        "ffmpeg",
                        "-framerate", "30",
                        "-i", video_filename,
                        "-c:v", "libx264",
                        "-preset", "fast",
                        "-pix_fmt", "yuv420p",
                        mp4_file
                    ]
                    subprocess.run(cmd)
                    print(f"✅ Đã chuyển xong: {mp4_file}")
                    os.remove(video_filename)

                # Giới hạn chỉ giữ 10 video mp4 mới nhất
                video_files = get_video_files()
                while len(video_files) > 10:
                    file_to_remove = os.path.join('videos', video_files[0])
                    os.remove(file_to_remove)
                    print(f"Đã xoá video cũ: {file_to_remove}")
                    video_files = get_video_files()
            finally:
                run_person_detection.is_recording = False

        # Biến đếm thời gian không phát hiện người
        if not hasattr(run_person_detection, 'no_person_start'):
            run_person_detection.no_person_start = None
        if not hasattr(run_person_detection, 'light_on'):
            run_person_detection.light_on = False

        if person_detected:
            # Nếu vừa phát hiện người, bật đèn nếu chưa bật
            if not run_person_detection.light_on:
                arduino.write(b'5\n')  # Ví dụ: command bật đèn là 5
                run_person_detection.light_on = True
                print('Đã bật đèn')
            run_person_detection.no_person_start = None  # Reset timer khi phát hiện người
        else:
            # Nếu không phát hiện người, bắt đầu đếm thời gian
            if run_person_detection.light_on:
                if run_person_detection.no_person_start is None:
                    run_person_detection.no_person_start = time.time()
                elif time.time() - run_person_detection.no_person_start > 10:
                    arduino.write(b'6\n')  # Command tắt đèn
                    run_person_detection.light_on = False
                    run_person_detection.no_person_start = None
                    print('Đã tắt đèn do không phát hiện người trong 30s')

        time.sleep(0.1)


threading.Thread(target=run_person_detection, daemon=True).start()