from fastapi import APIRouter
from config.database import get_database
from app.models.users import User
from app.models.users import UserLogin
from app.models.users import UsernameRequest
from app.models.users import EmailUserRequest
from fastapi import HTTPException, status
from utils.main import send_email
from dotenv import load_dotenv
import os
import random
db = get_database()
router = APIRouter()
load_dotenv()  # Load biến môi trường từ .env

@router.post("/auth/register",status_code=201)
async def register(user: User):
    username = user.username
    email = user.email
    password = user.password    
    role = user.role
    # Simulate a database check
    existing_user = db.users.find_one({"username": username})
    if existing_user:
         raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already exists"
        )
    else:
        existing_email_user = db.users.find_one({"email": email})
        if existing_email_user:
            raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already exists"
        )
        else:
            db.users.insert_one({"username": username,"email":email, "password": password,"role":role ,"isConfirmEmail": False, "isHouseId": False})
            db.verify_email.insert_one({"email":email})
            send_email(
                    subject="Sending with SendGrid is Fun",
                    content_text=f"Confirm in here: {os.getenv('BASE_URL')}/auth/verify_email?email={email}",
                    to_email_str=email  # hoặc email gốc nếu bạn muốn gửi đúng người đăng ký
            )
            return {"message": "Registration successful"}

@router.post("/auth/login", status_code=200)
async def login(user: UserLogin): 
    email = user.email
    password = user.password

    found_user = db.users.find_one({"email": email, "password": password})
    if found_user["isConfirmEmail"]:
        return {"message": "Login successful", "username": found_user["username"]}
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

@router.post("/auth/get_role_user", status_code=200)
async def verify_email(user: UsernameRequest):
    username = user.username
    found_user = db.users.find_one({"username": username})
    if found_user:
        return {"message": "Get user successful","role":found_user["role"]}
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

@router.get("/auth/verify_email", status_code=200)
async def verify_email(email: str):
    found_email = db.verify_email.find_one({"email": email})
    if found_email:
        db.users.update_one(
                {"email": email},               
                {"$set": {"isConfirmEmail": True}}   
        )
        return {"message": "Confirm successful"}
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

@router.post("/auth/admin_send_code",status_code=201)
async def admin_send_code(user: EmailUserRequest):    
    email = user.email
    existing_user = db.user_verify_code.find_one({"email": email})
    if existing_user:
            random_code = str(random.randint(100000, 999999))
            db.house_id.insert_one({"code": random_code, "username": existing_user["username"],"email":existing_user["email"]})
            send_email(
                    subject="Sending with SendGrid is Fun",
                    content_text=f"Code:{random_code}",
                    to_email_str=email  
            )
            db.user_verify_code.delete_one({"email": email})
            return {"message": "Send code successful"}


