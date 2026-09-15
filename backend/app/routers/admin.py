from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, or_
from app.db import get_db
from app.deps import get_admin
from app.models import User, Subscription, Payment, Habit, DailyTask

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/overview")
async def overview(admin=Depends(get_admin), db=Depends(get_db)):
    total = await db.scalar(select(func.count(User.id)))
    paid = await db.scalar(select(func.count(func.distinct(Subscription.user_id))).where(Subscription.status == "active", Subscription.ends_at > func.now()))
    blocked = await db.scalar(select(func.count(User.id)).where(User.is_blocked.is_(True)))
    revenue = await db.scalar(select(func.coalesce(func.sum(Payment.amount_paise), 0)).where(Payment.status == "paid"))
    ai_threads = 0
    return {"total_users": total, "paid_users": paid, "free_users": total - paid, "blocked_users": blocked, "revenue_paise": revenue, "ai_threads": ai_threads}

@router.get("/users")
async def users(q: str | None = Query(default=None), admin=Depends(get_admin), db=Depends(get_db)):
    stmt = select(User).order_by(User.created_at.desc())
    if q:
        like = f"%{q.lower()}%"
        stmt = stmt.where(or_(func.lower(User.email).like(like), func.lower(User.user_id).like(like)))
    rows = (await db.scalars(stmt.limit(100))).all()
    return [{"id": str(u.id), "user_id": u.user_id, "email": u.email, "role": u.role, "is_active": u.is_active, "is_blocked": u.is_blocked, "email_verified": u.email_verified, "theme": u.theme, "created_at": u.created_at} for u in rows]

@router.get("/users/{user_id}")
async def user_detail(user_id: str, admin=Depends(get_admin), db=Depends(get_db)):
    user = await db.scalar(select(User).where(User.user_id == user_id))
    if not user:
        raise HTTPException(404, "User not found.")
    habit_count = await db.scalar(select(func.count(Habit.id)).where(Habit.user_id == user.id))
    task_count = await db.scalar(select(func.count(DailyTask.id)).where(DailyTask.user_id == user.id))
    subscriptions = (await db.scalars(select(Subscription).where(Subscription.user_id == user.id).order_by(Subscription.created_at.desc()))).all()
    return {
        "user": {"id": str(user.id), "user_id": user.user_id, "email": user.email, "role": user.role, "is_blocked": user.is_blocked, "email_verified": user.email_verified, "created_at": user.created_at},
        "habit_count": habit_count, "task_count": task_count,
        "subscriptions": [{"plan": s.plan, "starts_at": s.starts_at, "ends_at": s.ends_at, "status": s.status} for s in subscriptions],
    }

@router.post("/users/{user_id}/block")
async def block_user(user_id: str, admin=Depends(get_admin), db=Depends(get_db)):
    user = await db.scalar(select(User).where(User.user_id == user_id))
    if not user:
        raise HTTPException(404, "User not found.")
    user.is_blocked = True
    await db.commit()
    return {"message": "User blocked."}

@router.post("/users/{user_id}/unblock")
async def unblock_user(user_id: str, admin=Depends(get_admin), db=Depends(get_db)):
    user = await db.scalar(select(User).where(User.user_id == user_id))
    if not user:
        raise HTTPException(404, "User not found.")
    user.is_blocked = False
    await db.commit()
    return {"message": "User unblocked."}
