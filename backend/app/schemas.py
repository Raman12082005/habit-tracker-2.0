from datetime import date, datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field

class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    confirm_password: str = Field(min_length=8, max_length=128)

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class PasswordResetRequestIn(BaseModel):
    email: EmailStr

class PasswordResetIn(BaseModel):
    token: str
    password: str = Field(min_length=8, max_length=128)

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    user_id: str
    email: EmailStr
    role: str
    is_active: bool
    is_blocked: bool
    email_verified: bool
    theme: str
    created_at: datetime

class AuthOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class HabitIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=500)
    color: str = "violet"

class CompletionIn(BaseModel):
    completed: bool

class TaskIn(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    date: date
    completed: bool = False

class ThemeIn(BaseModel):
    theme: str = Field(min_length=2, max_length=30)

class ChatCreateIn(BaseModel):
    title: str = Field(default="New chat", min_length=1, max_length=120)

class ChatMessageIn(BaseModel):
    content: str = Field(min_length=1, max_length=4000)
