import httpx
from app.core.config import settings

async def send_link(to_email: str, subject: str, url: str):
    if settings.EMAIL_PROVIDER == "resend" and settings.RESEND_API_KEY:
        payload = {
            "from": settings.EMAIL_FROM,
            "to": [to_email],
            "subject": subject,
            "html": f"<p>Continue by clicking:</p><p><a href='{url}'>{url}</a></p>",
        }
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {settings.RESEND_API_KEY}"},
                json=payload,
            )
            response.raise_for_status()
    else:
        print(f"[EMAIL-CONSOLE] To={to_email} Subject={subject} URL={url}")
