from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from ultralytics import YOLO
from app.core.shared import picam2, lock, camera_active
import cv2

router = APIRouter()

# Load mô hình YOLOv8n
model = YOLO("/home/lenovo/PBL5/be/best_yolov8_dark.pt")
coco_labels = model.names  # Danh sách nhãn

camera_active = False

def generate_frames():
    
    global camera_active
      # Gọi một lần duy nhất
    while camera_active:
        with lock:
            frame = picam2.capture_array("main")

        results = model(frame, verbose=False)[0]
        

        for box in results.boxes:
            cls = int(box.cls[0])
            conf = float(box.conf[0])
            if cls != 0 or conf < 0.6:
                continue  # Chỉ hiển thị label 'person' và conf > 0.6
            x1, y1, x2, y2 = map(int, box.xyxy[0])

            label = f"{coco_labels[cls]} {conf:.2f}"
            color = (0, 255, 0)

            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            cv2.putText(frame, label, (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

            

        # if person_detected:
        #     arduino.write(b'4\n')
        # Gửi lệnh chỉ khi chuyển từ không phát hiện -> phát hiện
        

        _, buffer = cv2.imencode('.jpg', frame)
        frame_bytes = buffer.tobytes()

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')


@router.get("/video_feed")
async def video_feed():
    # global camera_active
    
    # with lock:
    #     camera_active = True
    # return StreamingResponse(generate_frames(), media_type="multipart/x-mixed-replace; boundary=frame")
    global camera_active
    headers = {
        "Cross-Origin-Resource-Policy": "cross-origin",  # <-- Thêm cái này
        "Cross-Origin-Embedder-Policy": "require-corp",  # <-- Hoặc không dùng nếu bạn không cần strict
        "Cross-Origin-Opener-Policy": "same-origin",
        "Access-Control-Allow-Origin": "*"
    }
    with lock:
        camera_active = True
    return StreamingResponse(generate_frames(), media_type="multipart/x-mixed-replace; boundary=frame",headers=headers)

@router.get("/stop_camera")
async def stop_camera():
    global camera_active
    with lock:
        camera_active = False
    return {"message": "Camera stopped"}
# @router.get("/stop_camera")
# async def stop_camera():
#     global camera_active
#     with lock:
#         camera_active = False
#     arduino = get_arduino()
#     if arduino and arduino.is_open:
#         arduino.close()
#     return {"message": "Camera stopped"}



