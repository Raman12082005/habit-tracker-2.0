from datetime import date, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from app.db import get_db
from app.deps import get_current_user
from app.models import Habit, HabitCompletion, DailyTask
from app.core.time import today_ist

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("")
async def analytics(
    start: date | None = Query(default=None),
    end: date | None = Query(default=None),
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    end = end or today_ist()
    start = start or (end - timedelta(days=29))
    if start > end:
        start, end = end, start

    habits = (await db.scalars(select(Habit).where(Habit.user_id == user.id, Habit.active.is_(True)))).all()
    completions = (await db.scalars(select(HabitCompletion).where(
        HabitCompletion.habit_id.in_([h.id for h in habits]),
        HabitCompletion.date.between(start, end)
    ))).all() if habits else []
    tasks = (await db.scalars(select(DailyTask).where(
        DailyTask.user_id == user.id,
        DailyTask.date.between(start, end)
    ))).all()

    total_habit_slots = len(habits) * ((end - start).days + 1)
    done_habits = sum(c.completed for c in completions)
    total_tasks = len(tasks)
    done_tasks = sum(t.completed for t in tasks)
    total = total_habit_slots + total_tasks
    done = done_habits + done_tasks

    daily = []
    cursor = start
    completion_map = {(c.habit_id, c.date): c.completed for c in completions}
    while cursor <= end:
        hd = sum(completion_map.get((h.id, cursor), False) for h in habits)
        dt = [t for t in tasks if t.date == cursor]
        dtotal = len(habits) + len(dt)
        ddone = hd + sum(t.completed for t in dt)
        daily.append({"date": cursor.isoformat(), "done": ddone, "total": dtotal, "progress": round(ddone/dtotal*100) if dtotal else 0})
        cursor += timedelta(days=1)

    habit_stats = []
    for h in habits:
        done = sum(c.completed for c in completions if c.habit_id == h.id)
        slots = (end - start).days + 1
        habit_stats.append({"name": h.name, "done": done, "total": slots, "progress": round(done/slots*100) if slots else 0})

    return {
        "start": start.isoformat(), "end": end.isoformat(),
        "progress": round(done/total*100) if total else 0,
        "done": done, "total": total,
        "daily": daily,
        "habit_stats": habit_stats,
        "task_stats": {"done": done_tasks, "total": total_tasks},
    }
