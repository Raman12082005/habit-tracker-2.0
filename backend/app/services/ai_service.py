import httpx
from app.core.config import settings

SYSTEM_PROMPT = """You are the Habit Tracker 2.0 personal AI assistant.
Use only the user's supplied tracker data and conversation context.
Do not invent statistics. If data is insufficient, say so.
Give practical, supportive suggestions. Never expose private data from another user.
Keep answers concise but useful and explain calculations when relevant."""

async def _openrouter(messages):
    if not settings.OPENROUTER_API_KEY or not settings.OPENROUTER_MODEL:
        return None
    headers = {"Authorization": f"Bearer {settings.OPENROUTER_API_KEY}", "Content-Type": "application/json"}
    body = {"model": settings.OPENROUTER_MODEL, "messages": [{"role": "system", "content": SYSTEM_PROMPT}, *messages], "temperature": 0.3}
    async with httpx.AsyncClient(timeout=45) as client:
        r = await client.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=body)
        if r.status_code >= 400:
            return None
        return r.json()["choices"][0]["message"]["content"]

async def _gemini(messages):
    if not settings.GEMINI_API_KEY or not settings.GEMINI_MODEL:
        return None
    contents = [{"role": "user" if m["role"] == "user" else "model", "parts": [{"text": m["content"]}]} for m in messages]
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent"
    async with httpx.AsyncClient(timeout=45) as client:
        r = await client.post(url, params={"key": settings.GEMINI_API_KEY}, json={
            "systemInstruction": {"parts": [{"text": SYSTEM_PROMPT}]},
            "contents": contents,
            "generationConfig": {"temperature": 0.3},
        })
        if r.status_code >= 400:
            return None
        return r.json()["candidates"][0]["content"]["parts"][0]["text"]

async def generate(messages):
    result = await _openrouter(messages)
    if result:
        return result
    result = await _gemini(messages)
    if result:
        return result
    raise RuntimeError("No configured AI provider is currently available.")
