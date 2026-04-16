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
import random
import time
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
GOLD_API_KEY = os.environ.get('GOLD_API_KEY', '')

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Gold price cache
_gold_cache = {"data": None, "ts": 0}

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

class ForgotPasswordRequest(BaseModel):
    email: str

class VerifyOTPRequest(BaseModel):
    email: str
    otp: str

class ResetPasswordRequest(BaseModel):
    email: str
    otp: str
    newPassword: str

class UpdateAvatarRequest(BaseModel):
    avatarBase64: str

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

# ─── AUTH ───
@api_router.post("/auth/register", response_model=AuthResponse)
async def register(req: RegisterRequest):
    existing = await db.users.find_one({"email": req.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    auth_id = f"auth_{uuid.uuid4().hex[:12]}"
    hashed = bcrypt.hashpw(req.password.encode(), bcrypt.gensalt()).decode()
    await db.users.insert_one({
        "auth_id": auth_id, "email": req.email, "full_name": req.fullName,
        "password_hash": hashed, "auth_type": "email",
        "created_at": datetime.now(timezone.utc),
    })
    token = create_jwt(auth_id, req.email, req.fullName)
    return AuthResponse(token=token, user_id=auth_id, authId=auth_id, fullName=req.fullName, email=req.email)

@api_router.post("/auth/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    user = await db.users.find_one({"email": req.email}, {"_id": 0})
    if not user or not user.get("password_hash"):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not bcrypt.checkpw(req.password.encode(), user["password_hash"].encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_jwt(user["auth_id"], user["email"], user["full_name"])
    return AuthResponse(token=token, user_id=user["auth_id"], authId=user["auth_id"],
                        fullName=user["full_name"], email=user["email"])

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
    email, name, picture = data.get("email"), data.get("name", "User"), data.get("picture", "")
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        auth_id, full_name = existing["auth_id"], existing["full_name"]
    else:
        auth_id = f"auth_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "auth_id": auth_id, "email": email, "full_name": name,
            "picture": picture, "auth_type": "google",
            "created_at": datetime.now(timezone.utc),
        })
        full_name = name
    token = create_jwt(auth_id, email, full_name)
    return AuthResponse(token=token, user_id=auth_id, authId=auth_id, fullName=full_name, email=email)

@api_router.get("/auth/me")
async def get_me(authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization)
    return {"auth_id": user["auth_id"], "email": user["email"],
            "full_name": user["full_name"], "picture": user.get("picture", "")}

# ─── FORGOT PASSWORD ───
@api_router.post("/auth/forgot-password")
async def forgot_password(req: ForgotPasswordRequest):
    user = await db.users.find_one({"email": req.email}, {"_id": 0})
    if not user:
        return {"message": "If email exists, OTP has been sent", "success": True}
    otp = str(random.randint(100000, 999999))
    await db.password_otps.delete_many({"email": req.email})
    await db.password_otps.insert_one({
        "email": req.email, "otp": otp,
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=10),
        "created_at": datetime.now(timezone.utc),
    })
    # In production, send email via SendGrid/Resend. For now, log it.
    logger.info(f"[OTP] Password reset code for {req.email}: {otp}")
    return {"message": "If email exists, OTP has been sent", "success": True, "dev_otp": otp}

@api_router.post("/auth/verify-otp")
async def verify_otp(req: VerifyOTPRequest):
    record = await db.password_otps.find_one({"email": req.email, "otp": req.otp}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    expires = record["expires_at"]
    if isinstance(expires, str):
        expires = datetime.fromisoformat(expires)
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if expires < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="OTP expired")
    return {"valid": True}

@api_router.post("/auth/reset-password")
async def reset_password(req: ResetPasswordRequest):
    record = await db.password_otps.find_one({"email": req.email, "otp": req.otp}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    hashed = bcrypt.hashpw(req.newPassword.encode(), bcrypt.gensalt()).decode()
    await db.users.update_one({"email": req.email}, {"$set": {"password_hash": hashed}})
    await db.password_otps.delete_many({"email": req.email})
    return {"message": "Password reset successful", "success": True}

# ─── AVATAR ───
@api_router.post("/auth/avatar")
async def update_avatar(req: UpdateAvatarRequest, authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization)
    await db.users.update_one(
        {"auth_id": user["auth_id"]},
        {"$set": {"avatar_base64": req.avatarBase64}}
    )
    return {"success": True}

# ─── AI CHAT ───
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
Key knowledge: Egyptian inflation ~15-25%, Gold 21k most popular, Bank rates ~12-15%, Popular side hustles: freelancing, Careem, content creation, tutoring."""
    chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=req.session_id, system_message=system_prompt)
    chat.with_model("gemini", "gemini-2.5-flash")
    response = await chat.send_message(UserMessage(text=req.message))
    return ChatResponse(response=response, session_id=req.session_id)

# ─── LIVE GOLD PRICES ───
@api_router.get("/gold/prices")
async def get_gold_prices():
    global _gold_cache
    now = time.time()
    if _gold_cache["data"] and now - _gold_cache["ts"] < 60:
        return _gold_cache["data"]
    try:
        async with httpx.AsyncClient(timeout=10) as http_client:
            resp = await http_client.get("https://api.gold-api.com/price/XAU/USD")
            if resp.status_code == 200:
                data = resp.json()
                price_per_oz_usd = data.get("price", 0)
                egp_rate = 49.0  # 1 USD = ~49 EGP
                price_per_oz_egp = price_per_oz_usd * egp_rate
                price_per_gram = price_per_oz_egp / 31.1035 if price_per_oz_egp else 0
                change_pct = data.get("chg_percent", 0) or 0
                result = {
                    "prices": [
                        {"karat": 18, "pricePerGramEGP": round(price_per_gram * 0.75, 2), "change24h": change_pct},
                        {"karat": 21, "pricePerGramEGP": round(price_per_gram * 0.875, 2), "change24h": change_pct},
                        {"karat": 24, "pricePerGramEGP": round(price_per_gram, 2), "change24h": change_pct},
                    ],
                    "source": "Gold-API.com (Live)",
                    "updatedAt": datetime.now(timezone.utc).isoformat(),
                    "raw_price_per_oz_usd": price_per_oz_usd,
                }
                _gold_cache = {"data": result, "ts": now}
                return result
    except Exception as e:
        logger.error(f"Gold API error: {e}")
    return {
        "prices": [
            {"karat": 18, "pricePerGramEGP": 2850, "change24h": 0},
            {"karat": 21, "pricePerGramEGP": 3325, "change24h": 0},
            {"karat": 24, "pricePerGramEGP": 3800, "change24h": 0},
        ],
        "source": "Cached (fallback)",
        "updatedAt": datetime.now(timezone.utc).isoformat(),
    }

# ─── PRAYER TIMES ───
@api_router.get("/prayer-times")
async def get_prayer_times(city: str = "Cairo", country: str = "Egypt"):
    try:
        async with httpx.AsyncClient(timeout=10) as http_client:
            resp = await http_client.get(
                f"https://api.aladhan.com/v1/timingsByCity",
                params={"city": city, "country": country, "method": 5},
                follow_redirects=True,
            )
            if resp.status_code == 200:
                data = resp.json()
                timings = data.get("data", {}).get("timings", {})
                return {
                    "timings": {
                        "Fajr": timings.get("Fajr", ""),
                        "Dhuhr": timings.get("Dhuhr", ""),
                        "Asr": timings.get("Asr", ""),
                        "Maghrib": timings.get("Maghrib", ""),
                        "Isha": timings.get("Isha", ""),
                    },
                    "city": city,
                    "country": country,
                    "date": data.get("data", {}).get("date", {}).get("readable", ""),
                }
    except Exception as e:
        logger.error(f"Prayer times error: {e}")
    return {"timings": {"Fajr": "04:30", "Dhuhr": "12:00", "Asr": "15:30", "Maghrib": "18:15", "Isha": "19:45"},
            "city": city, "country": country, "date": ""}

# ─── CURRENCY RATES ───
@api_router.get("/currency/rates")
async def get_currency_rates():
    return {"base": "EGP",
            "rates": {"USD": 0.0204, "SAR": 0.0765, "AED": 0.0750, "EUR": 0.0188},
            "updatedAt": datetime.now(timezone.utc).isoformat()}

@api_router.get("/")
async def root():
    return {"message": "SULTAN API v1.1", "status": "running"}

app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
