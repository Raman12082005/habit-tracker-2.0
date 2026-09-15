from datetime import datetime, timedelta, timezone
import uuid
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.security import hash_password, verify_password, create_access_token, new_raw_token, hash_token
from app.db import get_db
from app.models import User, EmailToken
from app.schemas import RegisterIn, LoginIn, PasswordResetRequestIn, PasswordResetIn
from app.services.email import send_link
from app.services.rate_limit import hit
from app import db

router = APIRouter(prefix="/auth", tags=["auth"])

def public_user(user: User):
    return {
        "id": str(user.id), "user_id": user.user_id, "email": user.email,
        "role": user.role, "is_active": user.is_active, "is_blocked": user.is_blocked,
        "email_verified": user.email_verified, "theme": user.theme, "created_at": user.created_at
    }

@router.post("/register")
async def register(data: RegisterIn, db: AsyncSession = Depends(get_db)):
    if data.password != data.confirm_password:
        raise HTTPException(400, "Passwords do not match.")
    existing = await db.scalar(select(User).where(User.email == data.email.lower()))
    if existing:
        raise HTTPException(409, "An account with this email already exists.")
    user = User(
        user_id=f"HT{uuid.uuid4().hex[:10].upper()}",
        email=data.email.lower(),
        password_hash=hash_password(data.password),
        role="user",
        email_verified=settings.ENVIRONMENT == "development",
    )
    db.add(user)
    await db.flush()
    if settings.ENVIRONMENT == "development":
        await db.commit()

        return {
            "message": "Account created successfully. You can now sign in.",
            "user_id": user.user_id,
        }

    raw = new_raw_token()

    db.add(
        EmailToken(
            user_id=user.id,
            token_hash=hash_token(raw),
            purpose="verify_email",
            expires_at=datetime.now(timezone.utc) + timedelta(hours=24),
        )
    )

    await db.commit()

    url = f"{settings.FRONTEND_URL}/verify-email?token={raw}"

    await send_link(
        user.email,
        "Verify your Habit Tracker account",
        url,
    )

    return {
        "message": "Account created. Check your email to verify it.",
        "user_id": user.user_id,
    }

@router.post("/login")
async def login(request: Request, data: LoginIn, db: AsyncSession = Depends(get_db)):
    allowed, _ = await hit(f"login-ip:{request.client.host}", 20, 60)
    if not allowed:
        raise HTTPException(429, "Too many login requests. Try again shortly.")
    user = await db.scalar(select(User).where(User.email == data.email.lower()))
    now = datetime.now(timezone.utc)
    if user and user.locked_until and user.locked_until > now:
        remaining = max(1, int((user.locked_until - now).total_seconds()))
        raise HTTPException(429, f"Too many failed attempts. Try again in {remaining} seconds.")
    if not user or not verify_password(data.password, user.password_hash):
        if user:
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= settings.LOGIN_MAX_FAILURES:
                user.locked_until = now + timedelta(minutes=settings.LOGIN_LOCK_MINUTES)
                user.failed_login_attempts = 0
        await db.commit()
        raise HTTPException(401, "Invalid email or password.")
    if user.is_blocked:
        raise HTTPException(403, "Your account is blocked. Please contact support.")
    if not user.email_verified and user.role != "admin":
        raise HTTPException(403, "Please verify your email before logging in.")
    user.failed_login_attempts = 0
    user.locked_until = None
    await db.commit()
    token = create_access_token(str(user.id), user.role)
    return {"access_token": token, "token_type": "bearer", "user": public_user(user)}

@router.get("/verify-email")
async def verify_email(token: str, db: AsyncSession = Depends(get_db)):
    record = await db.scalar(select(EmailToken).where(
        EmailToken.token_hash == hash_token(token),
        EmailToken.purpose == "verify_email",
        EmailToken.used.is_(False),
    ))
    if not record or record.expires_at < datetime.now(timezone.utc):
        raise HTTPException(400, "Verification link is invalid or expired.")
    user = await db.get(User, record.user_id)
    user.email_verified = True
    record.used = True
    await db.commit()
    return {"message": "Email verified. You can now log in."}

@router.post("/resend-verification")
async def resend_verification(data: LoginIn, db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(User).where(User.email == data.email.lower()))
    if not user or user.email_verified:
        return {"message": "If the account exists and needs verification, an email was sent."}
    raw = new_raw_token()
    db.add(EmailToken(
        user_id=user.id, token_hash=hash_token(raw), purpose="verify_email",
        expires_at=datetime.now(timezone.utc) + timedelta(hours=24)
    ))
    await db.commit()
    await send_link(user.email, "Verify your Habit Tracker account", f"{settings.FRONTEND_URL}/verify-email?token={raw}")
    return {"message": "If the account exists and needs verification, an email was sent."}


@router.post("/forgot-password")
async def forgot_password(data: PasswordResetRequestIn, db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(User).where(User.email == data.email.lower()))
    if user:
        raw = new_raw_token()
        db.add(EmailToken(
            user_id=user.id, token_hash=hash_token(raw), purpose="reset_password",
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=30)
        ))
        await db.commit()
        await send_link(user.email, "Reset your Habit Tracker password", f"{settings.FRONTEND_URL}/reset-password?token={raw}")
    return {"message": "If that email exists, a reset link has been sent."}

@router.post("/reset-password")
async def reset_password(data: PasswordResetIn, db: AsyncSession = Depends(get_db)):
    record = await db.scalar(select(EmailToken).where(
        EmailToken.token_hash == hash_token(data.token),
        EmailToken.purpose == "reset_password",
        EmailToken.used.is_(False),
    ))
    if not record or record.expires_at < datetime.now(timezone.utc):
        raise HTTPException(400, "Reset link is invalid or expired.")
    user = await db.get(User, record.user_id)
    user.password_hash = hash_password(data.password)
    user.failed_login_attempts = 0
    user.locked_until = None
    record.used = True
    await db.commit()
    return {"message": "Password reset successfully."}
