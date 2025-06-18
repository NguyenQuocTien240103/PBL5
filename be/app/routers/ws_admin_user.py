from fastapi import FastAPI, WebSocket, WebSocketDisconnect, APIRouter
from typing import List
from config.database import get_database
import asyncio  # cần sleep nhẹ để tránh loop nhanh

db = get_database()
router = APIRouter()

admin_connections: List[WebSocket] = []

@router.websocket("/ws/admin_user")
async def ws_admin_user_handler(websocket: WebSocket):
    await websocket.accept()

    try:
        username = await websocket.receive_text()
        print("username:", username)

        user = db.users.find_one({"username": username})
        if not user:
            await websocket.close()
            print("User not found")
            return

        if user["role"] == "admin":
            admin_connections.append(websocket)
            print("Admin connected")

            try:
                while True:
                    await websocket.receive_text()  # giữ kết nối không bị timeout
            except WebSocketDisconnect:
                print("Admin disconnected")
                admin_connections.remove(websocket)

        elif user["role"] == "new_user":
            print(f"New user {username} connected")
            user_verify_code_exist = db.user_verify_code.find_one({"username":username})
            if not user_verify_code_exist: 
                db.user_verify_code.insert_one({"username": username, "email": user["email"]})

                for admin_ws in admin_connections[:]:
                            try:
                                print("abc")
                                await admin_ws.send_text(username)
                            except Exception as e:
                                print("Error sending to admin:", e)
                                if admin_ws in admin_connections:
                                    admin_connections.remove(admin_ws)


    except WebSocketDisconnect:
        print("❌ Client disconnected")
        if websocket in admin_connections:
            admin_connections.remove(websocket)
