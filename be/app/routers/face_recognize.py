import numpy as np
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from PIL import Image
from io import BytesIO
from datetime import datetime
import face_recognition
import os
import math
import cv2

from .arduino_connection import get_arduino  
arduino = get_arduino()  # 
# # den day

router = APIRouter()

# ----------------------Nhận diện khuôn mặt----------------------
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
            print(f"📥 Loading image: {image_path}")
            image = face_recognition.load_image_file(image_path)
            encodings = face_recognition.face_encodings(image)

            if encodings:
                known_encodings.append(encodings[0])
                known_names.append(filename)

        return known_encodings, known_names

 
    def recognize_faces(self, frame):
        rgb_small_frame = frame[:, :, ::-1]
        rgb_small_frame = np.ascontiguousarray(rgb_small_frame, dtype=np.uint8)
        height, width, _ = rgb_small_frame.shape

        face_locations = face_recognition.face_locations(rgb_small_frame)
        print("face_locations:", face_locations)
        print("rgb_small_frame shape:", rgb_small_frame.shape, "dtype:", rgb_small_frame.dtype)

        if not face_locations:
            return []

        # Lọc các face_locations nằm ngoài biên ảnh
        valid_face_locations = []
        for (top, right, bottom, left) in face_locations:
            if 0 <= top < bottom <= height and 0 <= left < right <= width:
                valid_face_locations.append((top, right, bottom, left))
            else:
                print(f"Bỏ qua face_location ngoài biên: {(top, right, bottom, left)}")

        if not valid_face_locations:
            return []

        face_encodings = face_recognition.face_encodings(rgb_small_frame, valid_face_locations)

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
                    distance = face_distances[best_match_index]
                    confidence_value = float(face_confidence(distance).replace('%', ''))
                    confidence = f"{confidence_value}%"  # để hiển thị lại
                    # Gửi tín hiệu đến Arduino
                    if confidence_value >= 92:
                        if arduino:
                            try:
                                arduino.write(b'1')  # Hoặc gửi 'R' tùy lệnh điều khiển
                                print(f"📤 Đã gửi tín hiệu tới Arduino cho {name}")
                            except Exception as e:
                                print(f"⚠️ Gửi tín hiệu thất bại: {e}")
                    else:
                        print(f"⚠️ Độ tin cậy thấp ({confidence}), không gửi tín hiệu")
                    # sua o day
            face_names.append(f"{name} ({confidence})")

        return face_names

# WebSocket endpoint 1: Nhận diện khuôn mặt
@router.websocket("/ws/face_recognition/{face_id}")
async def ws_face_recognition(websocket: WebSocket, face_id: str):
    await websocket.accept()

    if face_id not in known_faces_cache:
        print(f"🆔 Nhận kết nối với face_id: {face_id}")  # Thêm dòng này để kiểm tra
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

            # await websocket.send_text(", ".join(face_names) or "Không nhận diện được khuôn mặt.")
            await websocket.send_text(", ".join(face_names) or "Unknown (Unknown)")

    except WebSocketDisconnect:
        print("❌ WebSocket client (recognition) disconnected.")

# WebSocket endpoint 2: Quét và lưu khuôn mặt
@router.websocket("/ws/get_face/{face_id}") 
async def ws_get_face(websocket: WebSocket, face_id: str):
    await websocket.accept()
    print("🔌 Client connected to face scanning.")

    # ----------------------Quét khuôn mặt----------------------
    base_dir = os.path.dirname(__file__)
    cascade_path = os.path.join(base_dir, "haarcascade_frontalface_default.xml")
    face_detector = cv2.CascadeClassifier(cascade_path)

    save_dir = f"dataset/detect_face/{face_id}"
    os.makedirs(save_dir, exist_ok=True)

    count = 0  # Biến đếm số lượng ảnh đã lưu

    try:
        while count < 10:  # Dừng sau khi lưu đủ 10 ảnh
            data = await websocket.receive_bytes()
            nparr = np.frombuffer(data, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img is None:
                print("⚠️ Không thể giải mã ảnh.")
                continue

            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            faces = face_detector.detectMultiScale(gray, 1.3, 5)

            if len(faces) > 0:
                filename = f"{save_dir}/{face_id}_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}.jpg"
                with open(filename, "wb") as f: 
                    f.write(data)
                count += 1
                print(f"📷 Saved ({count}/10): {filename}")
                await websocket.send_text(f"Capture Success: {count} image")
            else:
                await websocket.send_text("No face detected.")

        # Gửi thông báo sau khi đã lưu đủ 10 ảnh
        await websocket.send_text("Collected 10 face images. Done!")
        await websocket.close()
        print("✅ Finished collecting face images.")

    except WebSocketDisconnect:
        print("❌ WebSocket client (get face) disconnected.")








# WebSocket endpoint 2: Nhận diện khuôn mặt trước khi voice
class FaceRecognitionVoice:
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
            print(f"📥 Loading image: {image_path}")
            image = face_recognition.load_image_file(image_path)
            encodings = face_recognition.face_encodings(image)

            if encodings:
                known_encodings.append(encodings[0])
                known_names.append(filename)

        return known_encodings, known_names

    def recognize_faces(self, frame):
        rgb_small_frame = frame[:, :, ::-1]
        rgb_small_frame = np.ascontiguousarray(rgb_small_frame, dtype=np.uint8)
        height, width, _ = rgb_small_frame.shape

        face_locations = face_recognition.face_locations(rgb_small_frame)
        print("face_locations:", face_locations)
        print("rgb_small_frame shape:", rgb_small_frame.shape, "dtype:", rgb_small_frame.dtype)

        if not face_locations:
            return []

        # Lọc các face_locations nằm ngoài biên ảnh
        valid_face_locations = []
        for (top, right, bottom, left) in face_locations:
            if 0 <= top < bottom <= height and 0 <= left < right <= width:
                valid_face_locations.append((top, right, bottom, left))
            else:
                print(f"Bỏ qua face_location ngoài biên: {(top, right, bottom, left)}")

        if not valid_face_locations:
            return []

        face_encodings = face_recognition.face_encodings(rgb_small_frame, valid_face_locations)

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

known_faces_voice_cache = {}

@router.websocket("/ws/face_recognition_voice/{face_id}")
async def ws_face_recognition_voice(websocket: WebSocket, face_id: str):
    await websocket.accept()

    if face_id not in known_faces_voice_cache:
        print(f"🆔 Nhận kết nối với face_id: {face_id}")  # Thêm dòng này để kiểm tra
        face_recognition_instance = FaceRecognitionVoice(face_id)
        known_faces_voice_cache[face_id] = face_recognition_instance
    else:
        face_recognition_instance = known_faces_voice_cache[face_id]

    try:
        while True:
            data = await websocket.receive_bytes()

            img = Image.open(BytesIO(data))

            frame = np.array(img.convert("RGB"))

            face_names = face_recognition_instance.recognize_faces(frame)
        
            await websocket.send_text(", ".join(face_names) or "Unknown (Unknown)")

    except WebSocketDisconnect:
        print("❌ WebSocket client (recognition) disconnected.")


# stop the door
@router.get("/stop_camera_door")
async def stop_camera_door():
    if arduino:
        try:
            arduino.write(b'9')  # Hoặc gửi 'R' tùy lệnh điều khiển
            print(f"📤 Đã gửi tín hiệu tới Arduino  ")
            return {"message": "đóng cửa thành công"}
        except Exception as e:
            print(f"⚠️ Gửi tín hiệu thất bại: {e}")