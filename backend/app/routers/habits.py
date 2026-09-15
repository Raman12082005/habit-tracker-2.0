from datetime import date, timedelta
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_db
from app.core.time import today_ist
from app.deps import get_current_user
from app.models import Habit, HabitCompletion, DailyTask
from app.schemas import HabitIn, CompletionIn, TaskIn

router = APIRouter(prefix="/tracker", tags=["tracker"])

@router.get("/habits")
async def list_habits(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    today = today_ist()
    monday = today - timedelta(days=today.weekday())
    sunday = monday + timedelta(days=6)

    habits = (await db.scalars(
        select(Habit)
        .where(Habit.user_id == user.id, Habit.active.is_(True))
        .order_by(Habit.created_at)
    )).all()

    if not habits:
        return []

    completions = (await db.scalars(
        select(HabitCompletion).where(
            HabitCompletion.habit_id.in_([h.id for h in habits]),
            HabitCompletion.date.between(monday, sunday),
        )
    )).all()

    by_habit_day = {(str(c.habit_id), c.date.isoformat()): bool(c.completed) for c in completions}

    return [
        {
            "id": str(h.id),
            "name": h.name,
            "description": h.description,
            "color": h.color,
            "active": h.active,
            "today_completed": by_habit_day.get((str(h.id), today.isoformat()), False),
            "weekly_completion": {
                (monday + timedelta(days=i)).isoformat(): by_habit_day.get(
                    (str(h.id), (monday + timedelta(days=i)).isoformat()), False
                )
                for i in range(7)
            },
        }
        for h in habits
    ]

@router.post("/habits")
async def create_habit(data: HabitIn, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    habit = Habit(user_id=user.id, name=data.name.strip(), description=data.description, color=data.color)
    db.add(habit)
    await db.commit()
    await db.refresh(habit)
    return {"id": str(habit.id), "name": habit.name, "description": habit.description, "color": habit.color, "active": habit.active}

@router.patch("/habits/{habit_id}")
async def edit_habit(habit_id: UUID, data: HabitIn, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    habit = await db.scalar(select(Habit).where(Habit.id == habit_id, Habit.user_id == user.id))
    if not habit:
        raise HTTPException(404, "Habit not found.")
    habit.name, habit.description, habit.color = data.name.strip(), data.description, data.color
    await db.commit()
    return {"message": "Habit updated."}

@router.delete("/habits/{habit_id}")
async def delete_habit(habit_id: UUID, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    habit = await db.scalar(select(Habit).where(Habit.id == habit_id, Habit.user_id == user.id))
    if not habit:
        raise HTTPException(404, "Habit not found.")
    await db.delete(habit)
    await db.commit()
    return {"message": "Habit deleted."}

@router.put("/habits/{habit_id}/completion/{day}")
async def set_completion(habit_id: UUID, day: date, data: CompletionIn, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    habit = await db.scalar(select(Habit).where(Habit.id == habit_id, Habit.user_id == user.id))
    if not habit:
        raise HTTPException(404, "Habit not found.")
    completion = await db.scalar(select(HabitCompletion).where(HabitCompletion.habit_id == habit.id, HabitCompletion.date == day))
    if completion:
        completion.completed = data.completed
    else:
        db.add(HabitCompletion(habit_id=habit.id, date=day, completed=data.completed))
    await db.commit()
    return {"date": day, "completed": data.completed}

@router.get("/tasks")
async def list_tasks(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    tasks = (await db.scalars(select(DailyTask).where(DailyTask.user_id == user.id).order_by(DailyTask.date.desc(), DailyTask.created_at))).all()
    return [{"id": str(t.id), "date": t.date, "title": t.title, "completed": t.completed} for t in tasks]

@router.post("/tasks")
async def create_task(data: TaskIn, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    task = DailyTask(user_id=user.id, date=data.date, title=data.title.strip(), completed=data.completed)
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return {"id": str(task.id), "date": task.date, "title": task.title, "completed": task.completed}

@router.patch("/tasks/{task_id}")
async def edit_task(task_id: UUID, data: TaskIn, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    task = await db.scalar(select(DailyTask).where(DailyTask.id == task_id, DailyTask.user_id == user.id))
    if not task:
        raise HTTPException(404, "Task not found.")
    task.date, task.title, task.completed = data.date, data.title.strip(), data.completed
    await db.commit()
    return {"message": "Task updated."}

@router.delete("/tasks/{task_id}")
async def delete_task(task_id: UUID, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    task = await db.scalar(select(DailyTask).where(DailyTask.id == task_id, DailyTask.user_id == user.id))
    if not task:
        raise HTTPException(404, "Task not found.")
    await db.delete(task)
    await db.commit()
    return {"message": "Task deleted."}

@router.get("/dashboard")
async def dashboard(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    today = today_ist()
    monday = today - timedelta(days=today.weekday())
    sunday = monday + timedelta(days=6)
    habits = (await db.scalars(select(Habit).where(Habit.user_id == user.id, Habit.active.is_(True)))).all()
    completions = (await db.scalars(select(HabitCompletion).where(
        HabitCompletion.habit_id.in_([h.id for h in habits]),
        HabitCompletion.date.between(monday, sunday)
    ))).all() if habits else []
    tasks = (await db.scalars(select(DailyTask).where(
        DailyTask.user_id == user.id, DailyTask.date.between(monday, sunday)
    ))).all()
    by_habit_day = {(str(c.habit_id), c.date.isoformat()): c.completed for c in completions}
    days = []
    for offset in range(7):
        d = monday + timedelta(days=offset)
        recurring_total = len(habits)
        recurring_done = sum(by_habit_day.get((str(h.id), d.isoformat()), False) for h in habits)
        day_tasks = [t for t in tasks if t.date == d]
        task_done = sum(t.completed for t in day_tasks)
        day_total = recurring_total + len(day_tasks)
        day_done = recurring_done + task_done
        days.append({
            "date": d.isoformat(), "is_today": d == today,
            "habit_done": recurring_done, "habit_total": recurring_total,
            "task_done": task_done, "task_total": len(day_tasks),
            "progress": round(recurring_done / recurring_total * 100) if recurring_total else 0,
            "tasks": [{"id": str(t.id), "title": t.title, "completed": t.completed} for t in day_tasks],
        })
    week_habit_stats = []
    for h in habits:
        done = sum(by_habit_day.get((str(h.id), (monday + timedelta(days=i)).isoformat()), False) for i in range(7))
        week_habit_stats.append({"id": str(h.id), "name": h.name, "done": done, "total": 7, "progress": round(done/7*100)})
    total = sum(d["habit_total"] + d["task_total"] for d in days)
    done = sum(d["habit_done"] + d["task_done"] for d in days)
    return {
        "today": today.isoformat(), "week_start": monday.isoformat(), "week_end": sunday.isoformat(),
        "overall_progress": round(done / total * 100) if total else 0,
        "overall_done": done, "overall_total": total,
        "days": days, "habits": [{"id": str(h.id), "name": h.name, "color": h.color, "today_completed": by_habit_day.get((str(h.id), today.isoformat()), False)} for h in habits],
        "habit_stats": week_habit_stats,
    }
