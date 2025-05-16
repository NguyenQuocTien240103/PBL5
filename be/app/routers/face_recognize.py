import numpy as np
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from PIL import Image
from io import BytesIO
from datetime import datetime
import face_recognition
import os
import math
import cv2

router = APIRouter()

# ----------------------Nhan dien khuon mat----------------------
known_faces_cache = {}

def face_confidence(face_distance, face_match_threshold=0.6):
    range = (1.0 - face_match_threshold)
    linear_value = (1.0 - face_distance) / (range * 2.0)

    if face_distance > face_match_threshold:
        return str(round(linear_value * 100, 2)) + "%"
    else:
        value = (linear_value + ((1.0 - linear_value) * math.pow((linear_value - 0.5) * 2, 0.2))) * 100
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

@router.websocket("/ws/face_recognition/{face_id}")
async def websocket_endpoint(websocket: WebSocket, face_id: str):
    await websocket.accept()

    if face_id not in known_faces_cache:
        face_recognition_instance = FaceRecognition(face_id)
        known_faces_cache[face_id] = face_recognition_instance
    else:
        face_recognition_instance = known_faces_cache[face_id]

    try:
        while True:
            data = await websocket.receive_bytes()

            img = Image.open(BytesIO(data))
            frame = np.array(img.convert("RGB"))

            face_names = face_recognition_instance.recognize_faces(frame)

            await websocket.send_text(", ".join(face_names) or "Không nhận diện được khuôn mặt.")

    except WebSocketDisconnect:
        print("❌ WebSocket client disconnected.")



# # ----------------------Quet khuon mat----------------------
# base_dir = os.path.dirname(__file__)

# # Nối với file XML trong cùng thư mục
# cascade_path = os.path.join(base_dir, "haarcascade_frontalface_default.xml")

# # Tạo bộ nhận diện khuôn mặt
# face_detector = cv2.CascadeClassifier(cascade_path)


@router.websocket("/ws/get_face/{face_id}") 
async def websocket_endpoint(websocket: WebSocket, face_id: str):
    await websocket.accept()
    print("🔌 Client connected") 

    # ----------------------Quet khuon mat----------------------
    base_dir = os.path.dirname(__file__)

    # Nối với file XML trong cùng thư mục
    cascade_path = os.path.join(base_dir, "haarcascade_frontalface_default.xml")

    # Tạo bộ nhận diện khuôn mặt
    face_detector = cv2.CascadeClassifier(cascade_path)

    # 🔍 Tạo thư mục nếu chưa tồn tại
    save_dir = f"dataset/detect_face/{face_id}"
    os.makedirs(save_dir, exist_ok=True)

    try:
        while True:
            data = await websocket.receive_bytes()
            nparr = np.frombuffer(data, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if img is None:
                print("⚠️ Lỗi không giải mã được ảnh")
                return

            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            faces = face_detector.detectMultiScale(gray, 1.3, 5)

            if len(faces) > 0:
                # Nếu phát hiện khuôn mặt, lưu ảnh
                filename = f"dataset/detect_face/{face_id}/{face_id}_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}.jpg"
                with open(filename, "wb") as f: 
                    f.write(data)
                print(f"📷 Saved: {filename}")
    except WebSocketDisconnect:
        print("❌ Client disconnected") 