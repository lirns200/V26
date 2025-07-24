from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, ForeignKey, func, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from passlib.context import CryptContext
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
import os
import shutil
import time
import json
import random
import string
from datetime import datetime, timedelta
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# SQLite Database setup (for development)
SQLALCHEMY_DATABASE_URL = "sqlite:///./messenger.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database Models
class User(Base):
    __tablename__ = 'users'
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    avatar = Column(String, nullable=True)
    last_online = Column(DateTime, default=func.now())
    created_at = Column(DateTime, default=func.now())
    # Privacy settings
    invisible_mode = Column(Boolean, default=False)
    hide_last_seen = Column(Boolean, default=False)
    hide_profile_info = Column(Boolean, default=False)
    # Theme settings
    theme = Column(String, default='light')  # light, dark, custom
    custom_primary_color = Column(String, default='#3B82F6')
    custom_secondary_color = Column(String, default='#1E40AF')

class Message(Base):
    __tablename__ = 'messages'
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    sender_id = Column(String, ForeignKey('users.id'))
    receiver_id = Column(String, ForeignKey('users.id'))
    text = Column(Text)
    timestamp = Column(DateTime, default=func.now())
    is_read = Column(Boolean, default=False)

class FavoriteMessage(Base):
    __tablename__ = 'favorite_messages'
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey('users.id'))
    type = Column(String, default='text')
    text = Column(Text, nullable=True)
    file_url = Column(String, nullable=True)
    voice_url = Column(String, nullable=True)
    timestamp = Column(DateTime, default=func.now())
    orig = Column(Text, nullable=True)

# Create tables
Base.metadata.create_all(bind=engine)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Create upload directory
UPLOAD_DIR = os.path.join(ROOT_DIR, "static", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Mount static files
app.mount("/static", StaticFiles(directory=os.path.join(ROOT_DIR, "static")), name="static")

# Pydantic models
class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class MessageCreate(BaseModel):
    receiver_id: str
    text: str

class MessageResponse(BaseModel):
    id: str
    sender_id: str
    receiver_id: str
    text: str
    timestamp: datetime
    is_read: bool

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    avatar: Optional[str] = None
    last_online: datetime
    invisible_mode: bool
    hide_last_seen: bool
    hide_profile_info: bool
    theme: str
    custom_primary_color: str
    custom_secondary_color: str

class FavoriteCreate(BaseModel):
    type: str = 'text'
    text: Optional[str] = None
    file_url: Optional[str] = None
    voice_url: Optional[str] = None
    orig: Optional[dict] = None

class ProfileUpdate(BaseModel):
    new_username: str

# Authentication routes
@api_router.post("/register")
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter(
        (User.email == user_data.email) | (User.username == user_data.username)
    ).first()
    
    if existing_user:
        if existing_user.email == user_data.email:
            raise HTTPException(status_code=400, detail="Email уже используется")
        else:
            raise HTTPException(status_code=400, detail="Имя пользователя уже занято")
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    user = User(
        username=user_data.username,
        email=user_data.email,
        password=hashed_password
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return {"user_id": user.id, "username": user.username, "email": user.email}

@api_router.post("/login")
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_data.email).first()
    
    if not user or not verify_password(user_data.password, user.password):
        raise HTTPException(status_code=401, detail="Неверный email или пароль")
    
    # Update last online
    user.last_online = datetime.utcnow()
    db.commit()
    
    return {"user_id": user.id, "username": user.username, "email": user.email}

@api_router.get("/users")
async def get_users(token: str, db: Session = Depends(get_db)):
    # Verify token (user_id)
    current_user = db.query(User).filter(User.id == token).first()
    if not current_user:
        raise HTTPException(status_code=401, detail="Недействительный токен")
    
    users = db.query(User).filter(User.id != token).all()
    return {"users": [{"id": u.id, "username": u.username, "avatar": u.avatar, "last_online": u.last_online} for u in users]}

@api_router.get("/profile")
async def get_profile(token: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == token).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    return {
        "user_id": user.id,
        "username": user.username,
        "email": user.email,
        "avatar": user.avatar,
        "last_online": user.last_online,
        "invisible_mode": user.invisible_mode,
        "hide_last_seen": user.hide_last_seen,
        "hide_profile_info": user.hide_profile_info,
        "theme": user.theme,
        "custom_primary_color": user.custom_primary_color,
        "custom_secondary_color": user.custom_secondary_color
    }

@api_router.get("/messages/{user_id}")
async def get_messages(user_id: str, token: str, db: Session = Depends(get_db)):
    messages = db.query(Message).filter(
        ((Message.sender_id == token) & (Message.receiver_id == user_id)) |
        ((Message.sender_id == user_id) & (Message.receiver_id == token))
    ).order_by(Message.timestamp).all()
    
    # Mark messages as read
    db.query(Message).filter(
        (Message.sender_id == user_id) & (Message.receiver_id == token) & (Message.is_read == False)
    ).update({"is_read": True})
    db.commit()
    
    return {"messages": [{"id": m.id, "sender_id": m.sender_id, "receiver_id": m.receiver_id, "text": m.text, "timestamp": m.timestamp, "is_read": m.is_read} for m in messages]}

@api_router.post("/messages")
async def send_message(message_data: MessageCreate, token: str, db: Session = Depends(get_db)):
    message = Message(
        sender_id=token,
        receiver_id=message_data.receiver_id,
        text=message_data.text
    )
    
    db.add(message)
    db.commit()
    db.refresh(message)
    
    return {"id": message.id, "sender_id": message.sender_id, "receiver_id": message.receiver_id, "text": message.text, "timestamp": message.timestamp}

@api_router.get("/favorites")
async def get_favorites(token: str, db: Session = Depends(get_db)):
    favorites = db.query(FavoriteMessage).filter(FavoriteMessage.user_id == token).order_by(FavoriteMessage.timestamp.desc()).all()
    result = []
    
    for fav in favorites:
        fav_data = {
            "id": fav.id,
            "type": fav.type,
            "text": fav.text,
            "file_url": fav.file_url,
            "voice_url": fav.voice_url,
            "timestamp": fav.timestamp.timestamp() if fav.timestamp else None
        }
        if fav.orig:
            try:
                fav_data["orig"] = json.loads(fav.orig)
            except:
                fav_data["orig"] = fav.orig
        result.append(fav_data)
    
    return {"favorites": result}

@api_router.post("/favorites")
async def add_favorite(favorite_data: FavoriteCreate, token: str, db: Session = Depends(get_db)):
    favorite = FavoriteMessage(
        user_id=token,
        type=favorite_data.type,
        text=favorite_data.text,
        file_url=favorite_data.file_url,
        voice_url=favorite_data.voice_url,
        orig=json.dumps(favorite_data.orig) if favorite_data.orig else None
    )
    
    db.add(favorite)
    db.commit()
    
    return {"status": "ok"}

@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...), token: str = "", db: Session = Depends(get_db)):
    if not token:
        raise HTTPException(status_code=401, detail="Нет токена")
    
    filename = f"{int(time.time())}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    url = f"/static/uploads/{filename}"
    
    # Update user avatar if it's an image
    if file.content_type and file.content_type.startswith('image/'):
        user = db.query(User).filter(User.id == token).first()
        if user:
            user.avatar = url
            db.commit()
    
    return {"url": url}

@api_router.post("/update_profile")
async def update_profile(profile_data: ProfileUpdate, token: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == token).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    # Check if username is already taken
    existing_user = db.query(User).filter(
        User.username == profile_data.new_username,
        User.id != token
    ).first()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Имя пользователя уже занято")
    
    user.username = profile_data.new_username
    db.commit()
    
    return {"ok": True}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
