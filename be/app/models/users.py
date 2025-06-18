from pydantic import BaseModel

class User(BaseModel):
    username: str
    email: str
    password: str
    role: str

class UserLogin(BaseModel):
    email: str
    password: str 

class UsernameRequest(BaseModel):
    username: str

class EmailUserRequest(BaseModel):
    email: str

class UsernameCodeRequest(BaseModel):
    username: str
    code: str