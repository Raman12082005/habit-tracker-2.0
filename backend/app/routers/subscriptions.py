from datetime import datetime, timedelta, timezone
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_db
from app.deps import get_current_user
from app.models import Subscription, Payment
from app.services.payment import PLANS, create_razorpay_order, verify_razorpay_signature, verify_webhook
from app.core.config import settings

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])

@router.get("/plans")
async def plans():
    return [{"code": k, **v} for k, v in PLANS.items()]

@router.get("/current")
async def current(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    sub = await db.scalar(select(Subscription).where(
        Subscription.user_id == user.id, Subscription.status == "active", Subscription.ends_at > func.now()
    ).order_by(Subscription.ends_at.desc()))
    return {"active": bool(sub), "plan": sub.plan if sub else None, "starts_at": sub.starts_at if sub else None, "ends_at": sub.ends_at if sub else None}

@router.post("/checkout/{plan}")
async def checkout(plan: str, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if plan not in PLANS:
        raise HTTPException(400, "Invalid plan.")
    p = PLANS[plan]
    order = await create_razorpay_order(p["price_inr"] * 100, f"{user.user_id}-{plan}")
    payment = Payment(user_id=user.id, plan=plan, amount_paise=p["price_inr"] * 100, provider="razorpay", provider_order_id=order["id"], status="created")
    db.add(payment)
    await db.commit()
    return {"order_id": order["id"], "amount": p["price_inr"] * 100, "currency": "INR", "key_id": settings.RAZORPAY_KEY_ID}

@router.post("/verify")
async def verify(payload: dict, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    order_id = payload.get("razorpay_order_id")
    payment_id = payload.get("razorpay_payment_id")
    signature = payload.get("razorpay_signature")
    if not order_id or not payment_id or not signature or not verify_razorpay_signature(order_id, payment_id, signature):
        raise HTTPException(400, "Payment verification failed.")
    payment = await db.scalar(select(Payment).where(Payment.provider_order_id == order_id, Payment.user_id == user.id))
    if not payment:
        raise HTTPException(404, "Payment record not found.")
    payment.provider_payment_id = payment_id
    payment.status = "paid"
    now = datetime.now(timezone.utc)
    existing = await db.scalar(select(Subscription).where(
        Subscription.user_id == user.id, Subscription.status == "active", Subscription.ends_at > now
    ).order_by(Subscription.ends_at.desc()))
    start = existing.ends_at if existing else now
    p = PLANS[payment.plan]
    sub = Subscription(
        user_id=user.id, plan=payment.plan, amount_paise=payment.amount_paise,
        starts_at=start, ends_at=start + timedelta(days=p["days"]),
        status="active", payment_reference=payment_id
    )
    db.add(sub)
    await db.commit()
    return {"message": "Subscription activated.", "ends_at": sub.ends_at}

@router.post("/webhook")
async def webhook(request: Request, db: AsyncSession = Depends(get_db)):
    body = await request.body()
    signature = request.headers.get("X-Razorpay-Signature", "")
    if not verify_webhook(body, signature):
        raise HTTPException(400, "Invalid webhook signature.")
    payload = await request.json()
    event = payload.get("event")
    entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
    order_id = entity.get("order_id")
    payment_id = entity.get("id")
    if event == "payment.captured" and order_id:
        payment = await db.scalar(select(Payment).where(Payment.provider_order_id == order_id))
        if payment:
            payment.provider_payment_id = payment_id
            payment.status = "paid"
            await db.commit()
    return {"ok": True}
