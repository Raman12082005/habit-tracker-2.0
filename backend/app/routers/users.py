from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_db
from app.deps import get_current_user
from app.models import User
from app.schemas import ThemeIn
from pydantic import BaseModel, Field
from app.core.security import hash_password

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me")
async def me(user=Depends(get_current_user)):
    return {
        "id": str(user.id), "user_id": user.user_id, "email": user.email,
        "role": user.role, "is_active": user.is_active, "is_blocked": user.is_blocked,
        "email_verified": user.email_verified, "theme": user.theme, "created_at": user.created_at
    }

class FocusIn(BaseModel):
    weekly_focus: str = Field(default="", max_length=240)

@router.get("/weekly-focus")
async def weekly_focus(user=Depends(get_current_user)):
    return {"weekly_focus": user.weekly_focus}

@router.patch("/weekly-focus")
async def update_weekly_focus(data: FocusIn, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    user.weekly_focus = data.weekly_focus.strip()
    await db.commit()
    return {"weekly_focus": user.weekly_focus}

@router.patch("/theme")
async def update_theme(data: ThemeIn, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    allowed = {"violet", "emerald", "blue", "orange", "red", "rose", "cyan"}
    if data.theme not in allowed:
        raise HTTPException(400, "Unsupported theme.")
    user.theme = data.theme
    await db.commit()
    return {"theme": user.theme}

@router.delete("/me")
async def delete_me(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await db.delete(user)
    await db.commit()
    return {"message": "Account deleted."}
