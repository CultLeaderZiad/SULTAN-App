from fastapi import FastAPI, APIRouter, HTTPException, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import jwt
import bcrypt
import httpx
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]
JWT_SECRET = os.environ['JWT_SECRET']
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class RegisterRequest(BaseModel):
    fullName: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class AuthResponse(BaseModel):
    token: str
    user_id: str
    authId: str
    fullName: str
    email: str

class GoogleSessionRequest(BaseModel):
    session_id: str

class ChatRequest(BaseModel):
    message: str
    session_id: str
    language: str = "en"
    user_context: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    session_id: str

def create_jwt(auth_id: str, email: str, name: str) -> str:
    payload = {
        "sub": auth_id,
        "email": email,
        "name": name,
        "exp": datetime.now(timezone.utc) + timedelta(days=30),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def verify_jwt(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.replace("Bearer ", "")
    payload = verify_jwt(token)
    user = await db.users.find_one({"auth_id": payload["sub"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# Auth endpoints
@api_router.post("/auth/register", response_model=AuthResponse)
async def register(req: RegisterRequest):
    existing = await db.users.find_one({"email": req.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    auth_id = f"auth_{uuid.uuid4().hex[:12]}"
    hashed = bcrypt.hashpw(req.password.encode(), bcrypt.gensalt()).decode()

    user_doc = {
        "auth_id": auth_id,
        "email": req.email,
        "full_name": req.fullName,
        "password_hash": hashed,
        "auth_type": "email",
        "created_at": datetime.now(timezone.utc),
    }
    await db.users.insert_one(user_doc)

    token = create_jwt(auth_id, req.email, req.fullName)
    return AuthResponse(
        token=token,
        user_id=auth_id,
        authId=auth_id,
        fullName=req.fullName,
        email=req.email,
    )

@api_router.post("/auth/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    user = await db.users.find_one({"email": req.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not bcrypt.checkpw(req.email.encode() if not user.get("password_hash") else req.password.encode(), 
                          user["password_hash"].encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_jwt(user["auth_id"], user["email"], user["full_name"])
    return AuthResponse(
        token=token,
        user_id=user["auth_id"],
        authId=user["auth_id"],
        fullName=user["full_name"],
        email=user["email"],
    )

# REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
@api_router.post("/auth/google-session", response_model=AuthResponse)
async def google_session(req: GoogleSessionRequest):
    async with httpx.AsyncClient() as http_client:
        resp = await http_client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": req.session_id},
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid Google session")

    data = resp.json()
    email = data.get("email")
    name = data.get("name", "User")
    picture = data.get("picture", "")

    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        auth_id = existing["auth_id"]
        full_name = existing["full_name"]
    else:
        auth_id = f"auth_{uuid.uuid4().hex[:12]}"
        user_doc = {
            "auth_id": auth_id,
            "email": email,
            "full_name": name,
            "picture": picture,
            "auth_type": "google",
            "created_at": datetime.now(timezone.utc),
        }
        await db.users.insert_one(user_doc)
        full_name = name

    token = create_jwt(auth_id, email, full_name)
    return AuthResponse(
        token=token,
        user_id=auth_id,
        authId=auth_id,
        fullName=full_name,
        email=email,
    )

@api_router.get("/auth/me")
async def get_me(authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization)
    return {
        "auth_id": user["auth_id"],
        "email": user["email"],
        "full_name": user["full_name"],
        "picture": user.get("picture", ""),
    }

# AI Chat endpoint
@api_router.post("/ai/chat", response_model=ChatResponse)
async def ai_chat(req: ChatRequest, authorization: Optional[str] = Header(None)):
    if authorization:
        token = authorization.replace("Bearer ", "")
        verify_jwt(token)

    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="AI not configured")

    from emergentintegrations.llm.chat import LlmChat, UserMessage

    system_prompt = f"""You are SULTAN AI (سلطان), a wise financial advisor for young Egyptian men aged 18-30.
You speak like a knowledgeable older brother giving practical, street-smart financial advice.
You understand the Egyptian economic reality: high inflation, gold as a hedge, side hustles, and halal investing.

Language: Respond in {"Arabic (Egyptian dialect)" if req.language == "ar" else "English"}.
Keep responses concise but helpful. Use numbers and data when relevant.
{f"User context: {req.user_context}" if req.user_context else ""}

Key knowledge:
- Egyptian inflation is ~15-25% annually
- Gold is a major investment vehicle in Egypt (21k is most popular)
- Bank savings rates are ~12-15% in Egypt
- Popular side hustles: freelancing, Careem/Uber, content creation, tutoring
- Halal investing principles: no riba, no gharar, no haram industries
- EGP has been devaluing significantly"""

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=req.session_id,
        system_message=system_prompt,
    )
    chat.with_model("gemini", "gemini-2.5-flash")

    user_message = UserMessage(text=req.message)
    response = await chat.send_message(user_message)

    return ChatResponse(response=response, session_id=req.session_id)

# Gold prices endpoint (proxy)
@api_router.get("/gold/prices")
async def get_gold_prices():
    return {
        "prices": [
            {"karat": 18, "pricePerGramEGP": 2850, "change24h": 1.2},
            {"karat": 21, "pricePerGramEGP": 3325, "change24h": 0.8},
            {"karat": 24, "pricePerGramEGP": 3800, "change24h": 1.5},
        ],
        "source": "Egyptian Gold Market",
        "updatedAt": datetime.now(timezone.utc).isoformat(),
    }

# Currency rates endpoint
@api_router.get("/currency/rates")
async def get_currency_rates():
    return {
        "base": "EGP",
        "rates": {
            "USD": 0.0204,
            "SAR": 0.0765,
            "AED": 0.0750,
            "EUR": 0.0188,
        },
        "updatedAt": datetime.now(timezone.utc).isoformat(),
    }

@api_router.get("/")
async def root():
    return {"message": "SULTAN API v1.0", "status": "running"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
