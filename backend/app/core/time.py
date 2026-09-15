from datetime import datetime, date
from zoneinfo import ZoneInfo
IST = ZoneInfo("Asia/Kolkata")
def now_ist() -> datetime:
    return datetime.now(IST)
def today_ist() -> date:
    return now_ist().date()
