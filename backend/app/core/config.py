from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_NAME: str = "Habit Tracker 2.0"
    ENVIRONMENT: str = "development"
    SECRET_KEY: str
    DATABASE_URL: str
    REDIS_URL: str = "redis://localhost:6379/0"
    FRONTEND_URL: str = "http://localhost:5173"

    EMAIL_PROVIDER: str = "console"
    EMAIL_FROM: str = "no-reply@example.com"
    RESEND_API_KEY: str | None = None

    OPENROUTER_API_KEY: str | None = None
    OPENROUTER_MODEL: str | None = None
    GEMINI_API_KEY: str | None = None
    GEMINI_MODEL: str | None = None

    PAYMENT_PROVIDER: str = "razorpay"
    RAZORPAY_KEY_ID: str | None = None
    RAZORPAY_KEY_SECRET: str | None = None
    RAZORPAY_WEBHOOK_SECRET: str | None = None

    ADMIN_EMAIL: str = "admin@example.com"
    ADMIN_PASSWORD: str = "change-this-immediately"

    ACCESS_TOKEN_MINUTES: int = 60 * 24
    LOGIN_MAX_FAILURES: int = 5
    LOGIN_LOCK_MINUTES: int = 1
    AI_DAILY_LIMIT: int = 15
    MAX_AI_MESSAGE_CHARS: int = 4000
    MAX_CHAT_THREADS: int = 10

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

settings = Settings()
