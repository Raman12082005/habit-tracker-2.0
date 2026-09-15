from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from app.core.config import settings
from app.core.security import hash_password
from app.db import SessionLocal
from app.models import User
from app.routers import auth, users, habits, analytics, ai, subscriptions, admin
from app.services.rate_limit import hit

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with SessionLocal() as db:
        admin = await db.scalar(select(User).where(User.email == settings.ADMIN_EMAIL.lower()))
        if not admin:
            db.add(User(
                user_id="ADMIN000001",
                email=settings.ADMIN_EMAIL.lower(),
                password_hash=hash_password(settings.ADMIN_PASSWORD),
                role="admin",
                email_verified=True,
            ))
            await db.commit()
    yield

app = FastAPI(title=settings.APP_NAME, version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "ok", "service": settings.APP_NAME}

@app.middleware("http")
async def global_rate_limit(request: Request, call_next):
    if request.url.path in {"/health", "/docs", "/openapi.json", "/redoc"} or request.url.path.endswith("/subscriptions/webhook"):
        return await call_next(request)
    client_ip = request.client.host if request.client else "unknown"
    allowed, _ = await hit(f"global:{client_ip}", 180, 60)
    if not allowed:
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=429, content={"detail": "Too many requests. Please slow down."})
    return await call_next(request)

@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return response

app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(habits.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")
app.include_router(ai.router, prefix="/api/v1")
app.include_router(subscriptions.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
