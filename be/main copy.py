# # # # # from fastapi import FastAPI
# # # # # from fastapi.responses import StreamingResponse
# # # # # from fastapi.middleware.cors import CORSMiddleware
# # # # # import cv2
# # # # # import threading
# # # # # import time
# # # # # from app.routers import detect_face
# # # # # app = FastAPI()

# # # # # # Cấu hình CORS 
# # # # # app.add_middleware(
# # # # #     CORSMiddleware,
# # # # #     allow_origins=["http://localhost:5173"],  # Địa chỉ frontend
# # # # #     allow_credentials=True,
# # # # #     allow_methods=["*"],  # Cho phép tất cả các phương thức
# # # # #     allow_headers=["*"],  # Cho phép tất cả các headers
# # # # # )

# # # # # app.include_router(detect_face.router)
# # # # # cap = None  # Biến lưu camera
# # # # # camera_active = False  # Trạng thái camera
# # # # # lock = threading.Lock()

# # # # # def generate_frames():
# # # # #     global cap, camera_active
# # # # #     while camera_active:
# # # # #         with lock:
# # # # #             if cap is None or not cap.isOpened():
# # # # #                 break

# # # # #             ret, frame = cap.read()
# # # # #             if not ret:
# # # # #                 break

# # # # #             _, buffer = cv2.imencode('.jpg', frame)
# # # # #             frame_bytes = buffer.tobytes()

# # # # #         yield (b'--frame\r\n'
# # # # #                b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

# # # # # @app.get("/video_feed")
# # # # # async def video_feed():
# # # # #     global cap, camera_active
# # # # #     with lock:
# # # # #         if cap:  # Nếu camera đang mở, đóng lại trước khi mở lại
# # # # #             cap.release()
# # # # #             cap = None
# # # # #         # Mở lại camera
# # # # #         cap = cv2.VideoCapture(0)
# # # # #         camera_active = True
# # # # #         time.sleep(1)  # Chờ camera khởi động
# # # # #     return StreamingResponse(generate_frames(), media_type="multipart/x-mixed-replace; boundary=frame")

# # # # # @app.get("/stop_camera")
# # # # # async def stop_camera():
# # # # #     global cap, camera_active
# # # # #     with lock:
# # # # #         camera_active = False  # Dừng luồng camera
# # # # #         if cap:
# # # # #             cap.release()
# # # # #             cap = None  # Giải phóng camera
# # # # #     return {"message": "Camera stopped"}

# # # # # # Đóng camera khi server dừng
# # # # # import atexit
# # # # # @atexit.register
# # # # # def cleanup():
# # # # #     global cap, camera_active
# # # # #     with lock:
# # # # #         camera_active = False
# # # # #         if cap:
# # # # #             cap.release()
# # # # #             cap = None

# # # # # ----------------------------------------------------------------------------------------------- 




# from fastapi import FastAPI, WebSocket, WebSocketDisconnect
# from fastapi.staticfiles import StaticFiles
# import os
# from datetime import datetime
# import cv2
# import numpy as np
# app = FastAPI()

# current_dir = os.path.dirname(os.path.abspath(__file__))
# cascade_path = os.path.join(current_dir, 'haarcascade_frontalface_default.xml')
# face_detector = cv2.CascadeClassifier(cascade_path)

# # Tạo thư mục lưu ảnh nếu chưa tồn tại
# if not os.path.exists("frames"):
#     os.makedirs("frames")

# # Phục vụ index.html

# @app.websocket("/ws") 
# async def websocket_endpoint(websocket: WebSocket):
#     await websocket.accept()
#     print("🔌 Client connected")

#     try:
#         while True:
#             data = await websocket.receive_bytes()
#             nparr = np.frombuffer(data, np.uint8)
#             img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

#             if img is None:
#                 print("⚠️ Lỗi không giải mã được ảnh")
#                 return

#             gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
#             faces = face_detector.detectMultiScale(gray, 1.3, 5)

#             if len(faces) > 0:
#                 # Nếu phát hiện khuôn mặt, lưu ảnh
#                 filename = f"frames/frame_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}.jpg"
#                 with open(filename, "wb") as f:
#                     f.write(data)
#                 print(f"📷 Saved: {filename}")
#     except WebSocketDisconnect:
#         print("❌ Client disconnected")




# from fastapi import FastAPI, WebSocket, WebSocketDisconnect
# import face_recognition
# import numpy as np
# import cv2
# from io import BytesIO
# from PIL import Image
# import os

# app = FastAPI()

# known_faces_cache = {}

# def face_confidence(face_distance, threshold=0.6):
#     if face_distance > threshold:
#         return "Unknown"
#     return f"{round((1.0 - face_distance) * 100, 2)}%"

# def load_known_faces(face_id):
#     known_encodings = []
#     known_names = []

#     folder_path = f"dataset/detect_face/{face_id}"
#     if not os.path.exists(folder_path):
#         print(f"⚠️ Folder {folder_path} không tồn tại.")
#         return known_encodings, known_names

#     for filename in os.listdir(folder_path):
#         image_path = os.path.join(folder_path, filename)
#         image = face_recognition.load_image_file(image_path)
#         encodings = face_recognition.face_encodings(image)

#         if encodings:
#             known_encodings.append(encodings[0])
#             known_names.append(filename)

#     return known_encodings, known_names


# @app.websocket("/ws/face_recognition/{face_id}")
# async def websocket_endpoint(websocket: WebSocket, face_id: str):
#     await websocket.accept()

#     if face_id not in known_faces_cache:
#         known_encodings, known_names = load_known_faces(face_id)
#         known_faces_cache[face_id] = (known_encodings, known_names)
#     else:
#         known_encodings, known_names = known_faces_cache[face_id]

#     try:
#         while True:
#             data = await websocket.receive_bytes()

#             # Decode từ binary (JPEG) thành ảnh NumPy array
#             img = Image.open(BytesIO(data))
#             frame = np.array(img.convert("RGB"))

#             # Nhận diện
#             face_locations = face_recognition.face_locations(frame)
#             face_encodings = face_recognition.face_encodings(frame, face_locations)

#             results = []

#             for face_encoding in face_encodings:
#                 matches = face_recognition.compare_faces(known_encodings, face_encoding)
#                 face_distances = face_recognition.face_distance(known_encodings, face_encoding)

#                 name = "Unknown"
#                 confidence = "Unknown"

#                 if len(face_distances) > 0:
#                     best_match_index = np.argmin(face_distances)
#                     if matches[best_match_index]:
#                         name = known_names[best_match_index]
#                         confidence = face_confidence(face_distances[best_match_index])

#                 results.append(f"{name} ({confidence})")

#             await websocket.send_text(", ".join(results) or "Không nhận diện được khuôn mặt.")

#     except WebSocketDisconnect:
#         print("❌ WebSocket client disconnected.")


import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from PIL import Image
from io import BytesIO
import face_recognition
import os
import math
import cv2

app = FastAPI()
known_faces_cache = {}

def face_confidence(face_distance, face_match_threshold=0.6):
    range = (1.0 - face_match_threshold)
    linear_value = (1.0 - face_distance) / (range * 2.0)

    if face_distance > face_match_threshold:
        return str(round(linear_value * 100, 2)) + "%"
    else:
        value = (linear_value+((1.0 - linear_value) * math.pow((linear_value - 0.5)*2, 0.2)))*100
        return str(round(value, 2)) + "%"


class FaceRecognition:
    def __init__(self, face_id: str):
        self.face_id = face_id
        self.known_encodings, self.known_names = self.load_known_faces()

    def load_known_faces(self):
        known_encodings = []
        known_names = []

        folder_path = f"dataset/detect_face/{self.face_id}"
        if not os.path.exists(folder_path):
            print(f"⚠️ Folder {folder_path} không tồn tại.")
            return known_encodings, known_names

        for filename in os.listdir(folder_path):
            image_path = os.path.join(folder_path, filename)
            print(f"Loading image: {image_path}")
            image = face_recognition.load_image_file(image_path)
            encodings = face_recognition.face_encodings(image)

            if encodings: 
                known_encodings.append(encodings[0])
                known_names.append(filename)

        return known_encodings, known_names

    def recognize_faces(self, frame):
        small_frame = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)
        rgb_small_frame = small_frame[:, :, ::-1]
        face_locations = face_recognition.face_locations(rgb_small_frame)
        face_encodings = face_recognition.face_encodings(rgb_small_frame, face_locations)

        face_names = []

        for face_encoding in face_encodings:
            matches = face_recognition.compare_faces(self.known_encodings, face_encoding)
            face_distances = face_recognition.face_distance(self.known_encodings, face_encoding)

            name = "Unknown"
            confidence = "Unknown"

            if len(face_distances) > 0:
                best_match_index = np.argmin(face_distances)
                if matches[best_match_index]:
                    name = self.known_names[best_match_index]
                    confidence = face_confidence(face_distances[best_match_index])

            face_names.append(f"{name} ({confidence})")

        return face_names


@app.websocket("/ws/face_recognition/{face_id}")
async def websocket_endpoint(websocket: WebSocket, face_id: str):
    await websocket.accept()

    # Sử dụng cache hoặc tạo đối tượng mới cho FaceRecognition
    if face_id not in known_faces_cache:
        face_recognition_instance = FaceRecognition(face_id)
        known_faces_cache[face_id] = face_recognition_instance
    else:
        face_recognition_instance = known_faces_cache[face_id]

    try:
        while True:
            data = await websocket.receive_bytes()

            # Decode từ binary (JPEG) thành ảnh NumPy array
            img = Image.open(BytesIO(data))
            frame = np.array(img.convert("RGB"))

            # Nhận diện khuôn mặt và lấy kết quả
            face_names = face_recognition_instance.recognize_faces(frame)

            # Gửi kết quả về client
            await websocket.send_text(", ".join(face_names) or "Không nhận diện được khuôn mặt.")

    except WebSocketDisconnect:
        print("❌ WebSocket client disconnected.") 