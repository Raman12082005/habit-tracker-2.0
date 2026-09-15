import base64
import hashlib
import hmac
import httpx
from app.core.config import settings

PLANS = {
    "weekly": {"name": "Weekly", "price_inr": 99, "days": 7},
    "biweekly": {"name": "Biweekly", "price_inr": 179, "days": 14},
    "monthly": {"name": "Monthly", "price_inr": 399, "days": 30},
}

async def create_razorpay_order(amount_paise: int, receipt: str):
    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        raise RuntimeError("Payment gateway is not configured.")
    token = base64.b64encode(f"{settings.RAZORPAY_KEY_ID}:{settings.RAZORPAY_KEY_SECRET}".encode()).decode()
    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.post(
            "https://api.razorpay.com/v1/orders",
            headers={"Authorization": f"Basic {token}"},
            json={"amount": amount_paise, "currency": "INR", "receipt": receipt, "payment_capture": 1},
        )
        r.raise_for_status()
        return r.json()

def verify_razorpay_signature(order_id: str, payment_id: str, signature: str) -> bool:
    if not settings.RAZORPAY_KEY_SECRET:
        return False
    message = f"{order_id}|{payment_id}".encode()
    expected = hmac.new(settings.RAZORPAY_KEY_SECRET.encode(), message, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)

def verify_webhook(raw_body: bytes, signature: str) -> bool:
    if not settings.RAZORPAY_WEBHOOK_SECRET:
        return False
    expected = hmac.new(settings.RAZORPAY_WEBHOOK_SECRET.encode(), raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)
