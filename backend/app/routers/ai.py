from datetime import date
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.core.config import settings
from app.db import get_db
from app.deps import get_current_user
from app.models import ChatThread, ChatMessage, Subscription, Habit, HabitCompletion, DailyTask, User
from app.schemas import ChatCreateIn, ChatMessageIn
from app.services.ai_service import generate
from app.core.time import today_ist

router = APIRouter(prefix="/ai", tags=["ai"])

async def require_ai_access(user, db):
    if user.role == "admin":
        return
    sub = await db.scalar(select(Subscription).where(
        Subscription.user_id == user.id,
        Subscription.status == "active",
        Subscription.ends_at > func.now(),
    ).order_by(Subscription.ends_at.desc()))
    if not sub:
        raise HTTPException(402, "AI access requires an active subscription.")

async def context_for_user(user, db):
    if user.role == "admin":
        total_users = await db.scalar(select(func.count(User.id)))
        paid_users = await db.scalar(select(func.count(func.distinct(Subscription.user_id))).where(
            Subscription.status == "active", Subscription.ends_at > func.now()
        ))
        return {
            "scope": "admin platform analytics",
            "total_users": total_users,
            "paid_users": paid_users,
            "free_users": (total_users or 0) - (paid_users or 0),
        }
    habits = (await db.scalars(select(Habit).where(Habit.user_id == user.id, Habit.active.is_(True)))).all()
    tasks = (await db.scalars(select(DailyTask).where(DailyTask.user_id == user.id))).all()
    today = today_ist()
    completions = (await db.scalars(select(HabitCompletion).where(
        HabitCompletion.habit_id.in_([h.id for h in habits]),
        HabitCompletion.date >= today.replace(day=1),
    ))).all() if habits else []
    return {
        "today": today.isoformat(),
        "habits": [{"id": str(h.id), "name": h.name} for h in habits],
        "tasks": [{"date": t.date.isoformat(), "title": t.title, "completed": t.completed} for t in tasks[-200:]],
        "recent_completions": [{"habit_id": str(c.habit_id), "date": c.date.isoformat(), "completed": c.completed} for c in completions[-300:]],
    }

@router.get("/status")
async def status(user=Depends(get_current_user), db=Depends(get_db)):
    if user.role == "admin":
        return {"active": True, "remaining_questions": settings.AI_DAILY_LIMIT, "is_admin": True}
    sub = await db.scalar(select(Subscription).where(
        Subscription.user_id == user.id, Subscription.status == "active", Subscription.ends_at > func.now()
    ).order_by(Subscription.ends_at.desc()))
    return {"active": bool(sub), "ends_at": sub.ends_at if sub else None, "remaining_questions": settings.AI_DAILY_LIMIT}

@router.get("/threads")
async def threads(user=Depends(get_current_user), db=Depends(get_db)):
    await require_ai_access(user, db)
    rows = (await db.scalars(select(ChatThread).where(ChatThread.user_id == user.id).order_by(ChatThread.updated_at.desc()))).all()
    return [{"id": str(t.id), "title": t.title, "created_at": t.created_at, "updated_at": t.updated_at} for t in rows]

@router.post("/threads")
async def create_thread(data: ChatCreateIn, user=Depends(get_current_user), db=Depends(get_db)):
    await require_ai_access(user, db)
    count = await db.scalar(select(func.count(ChatThread.id)).where(ChatThread.user_id == user.id))
    if count >= settings.MAX_CHAT_THREADS:
        raise HTTPException(409, "Maximum chat limit reached. Delete a chat to create a new one.")
    thread = ChatThread(user_id=user.id, title=data.title.strip())
    db.add(thread)
    await db.commit()
    await db.refresh(thread)
    return {"id": str(thread.id), "title": thread.title}

@router.get("/threads/{thread_id}")
async def get_thread(thread_id: UUID, user=Depends(get_current_user), db=Depends(get_db)):
    await require_ai_access(user, db)
    thread = await db.scalar(select(ChatThread).options(selectinload(ChatThread.messages)).where(ChatThread.id == thread_id, ChatThread.user_id == user.id))
    if not thread:
        raise HTTPException(404, "Chat not found.")
    return {
        "id": str(thread.id), "title": thread.title,
        "messages": [{"id": str(m.id), "role": m.role, "content": m.content, "created_at": m.created_at} for m in thread.messages],
    }

@router.patch("/threads/{thread_id}")
async def rename_thread(thread_id: UUID, data: ChatCreateIn, user=Depends(get_current_user), db=Depends(get_db)):
    await require_ai_access(user, db)
    thread = await db.scalar(select(ChatThread).where(ChatThread.id == thread_id, ChatThread.user_id == user.id))
    if not thread:
        raise HTTPException(404, "Chat not found.")
    thread.title = data.title.strip()
    await db.commit()
    return {"message": "Renamed."}

@router.delete("/threads/{thread_id}")
async def delete_thread(thread_id: UUID, user=Depends(get_current_user), db=Depends(get_db)):
    await require_ai_access(user, db)
    thread = await db.scalar(select(ChatThread).where(ChatThread.id == thread_id, ChatThread.user_id == user.id))
    if not thread:
        raise HTTPException(404, "Chat not found.")
    await db.delete(thread)
    await db.commit()
    return {"message": "Deleted."}

@router.post("/threads/{thread_id}/messages")
async def message(thread_id: UUID, data: ChatMessageIn, user=Depends(get_current_user), db=Depends(get_db)):
    await require_ai_access(user, db)
    if len(data.content) > settings.MAX_AI_MESSAGE_CHARS:
        raise HTTPException(413, "Message is too long.")
    thread = await db.scalar(select(ChatThread).options(selectinload(ChatThread.messages)).where(ChatThread.id == thread_id, ChatThread.user_id == user.id))
    if not thread:
        raise HTTPException(404, "Chat not found.")
    if user.role != "admin":
        # Count user messages since UTC midnight; production can move this counter to Redis.
        from datetime import datetime, timezone
        start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        used = await db.scalar(select(func.count(ChatMessage.id)).where(
            ChatMessage.thread_id.in_(select(ChatThread.id).where(ChatThread.user_id == user.id)),
            ChatMessage.role == "user",
            ChatMessage.created_at >= start,
        ))
        if used >= settings.AI_DAILY_LIMIT:
            raise HTTPException(429, "Your daily AI question limit has been reached.")
    history = [{"role": m.role, "content": m.content} for m in thread.messages[-20:]]
    user_context = await context_for_user(user, db)
    prompt = f"User tracker data (private to this user): {user_context}"
    history.insert(0, {"role": "user", "content": prompt})
    history.append({"role": "user", "content": data.content})
    db.add(ChatMessage(thread_id=thread.id, role="user", content=data.content))
    try:
        answer = await generate(history)
    except RuntimeError as exc:
        await db.rollback()
        raise HTTPException(503, str(exc))
    db.add(ChatMessage(thread_id=thread.id, role="assistant", content=answer))
    await db.commit()
    return {"answer": answer}
