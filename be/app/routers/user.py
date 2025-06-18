from fastapi import APIRouter
from config.database import get_database
from app.models.users import User
from app.models.users import UserLogin
from app.models.users import UsernameRequest
from app.models.users import EmailUserRequest
from app.models.users import UsernameCodeRequest
from fastapi.responses import JSONResponse
import os
import json
from fastapi import APIRouter,Request
from fastapi import HTTPException, status

db = get_database()
router = APIRouter()
from bson import ObjectId

def convert_objectid(doc):
    if isinstance(doc, list):
        return [convert_objectid(d) for d in doc]
    if isinstance(doc, dict):
        new_doc = {}
        for k, v in doc.items():
            if isinstance(v, ObjectId):
                new_doc[k] = str(v)
            else:
                new_doc[k] = v
        return new_doc
    return doc

@router.get("/all_user_verify_code", status_code=200)
async def get_all_user_verify_code():
    user_verify_code = db.user_verify_code.find().to_list(length=None)
    user_verify_code = convert_objectid(user_verify_code)
    if user_verify_code:
        return {"message": "Confirm successful", "data": user_verify_code}
    else:
        raise HTTPException(
            status_code=401,
            detail="No verify codes found"
        )

@router.get("/user_verify_code", status_code=200)
async def get_user_verify_code(username: str):
    user_verify_code = db.user_verify_code.find_one({"username":username})
    user_verify_code = convert_objectid(user_verify_code)
    if user_verify_code:
        return {"message": "Confirm successful", "data": user_verify_code}
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
@router.get("/getuser", status_code=200)
async def get_user_verify_code(username: str):
    user = db.users.find_one({"username":username})
    if user:
        return {"username":user["username"],"email":user["email"],"role":user["role"],"isHouseId":user["isHouseId"]}
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

@router.post("/del_user_verify_code", status_code=200)
async def del_user_verify_code(user: EmailUserRequest):
    email = user.email
    if email:
        db.user_verify_code.delete_one({"email": email})
        return {"message": "Cancel success"}
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

@router.post("/check_house_code", status_code=200)
async def del_user_verify_code(username_code: UsernameCodeRequest):
    username = username_code.username
    code = username_code.code
    house_id_exist = db.house_id.find_one({"code":code})
    
    if house_id_exist:
        db.users.update_one({"username": username}, {"$set": {"isHouseId": True}})
        return {"message":"code is success"}
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    

@router.get("/gettime", status_code=200)
async def gettimejson():
    CONFIG_PATH = os.path.join(os.path.dirname(__file__), '../../config.json')
    CONFIG_PATH = os.path.abspath(CONFIG_PATH)
    try:
        with open(CONFIG_PATH, "r") as f:
            data = json.load(f)
        return JSONResponse(content=data)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="config.json not found")
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Invalid JSON format")

@router.post("/savetime", status_code=200)
async def updatetimejson(request: Request):
    CONFIG_PATH = os.path.join(os.path.dirname(__file__), '../../config.json')

    CONFIG_PATH = os.path.abspath(CONFIG_PATH)
    try:
        data = await request.json()  # Lấy dữ liệu JSON từ client
        with open(CONFIG_PATH, "w") as f:
            json.dump(data, f, indent=2)

        return JSONResponse(content={"message": "Cập nhật thành công", "data": data})
    except Exception as e:
        import traceback
        traceback.print_exc()  # In chi tiết lỗi
        raise HTTPException(status_code=500, detail=f"Lỗi khi cập nhật: {str(e)}")
    

@router.get("/get-owner", status_code=200)
async def getowner():
    user = db.users.find_one({"role":"new_user","isHouseId":True})
    if user:
        return {"data":{"username":user["username"],"email":user["email"]}}
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
