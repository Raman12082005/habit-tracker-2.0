# Habit Tracker 2.0

A production-oriented AI habit tracking SaaS built with React + Tailwind CSS + FastAPI + PostgreSQL.

## Product highlights

- Email/password authentication
- Email verification and password reset-ready token architecture
- 5 failed-login lockout for 1 minute
- User IDs and role-based admin access
- Recurring daily habits
- Unlimited date-specific tasks
- Automatic current date handling
- IST-oriented product rules
- Today's wide dashboard card + compact surrounding days
- Theme persistence
- Interactive analysis dashboard
- Monthly/custom reports
- 10 AI chat threads per user
- 15 AI questions/day for subscribers
- Subscription plans: ₹99 / ₹179 / ₹399
- Payment-gateway integration boundary
- Provider fallback boundary for AI
- PostgreSQL + Redis-ready architecture
- Vercel-ready frontend
- GitHub-safe secrets setup

## Recommended production stack

Frontend:
- Vite + React + TypeScript
- Tailwind CSS v4
- shadcn/ui-compatible component approach
- Motion
- Recharts
- Lucide
- React Router
- React Hook Form + Zod
- Sonner

Backend:
- FastAPI
- SQLAlchemy 2 async
- PostgreSQL
- Redis
- Alembic
- JWT
- Argon2 password hashing

## 1. Prerequisites

Install:
- Node.js 22+
- Python 3.12+
- Docker Desktop
- Git

## 2. Create the Python environment

From the project root:

```powershell
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
copy .env.example .env
```

Generate a secret:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

Put that value into `backend/.env` as `SECRET_KEY`.

## 3. Start PostgreSQL + Redis

From the project root:

```powershell
docker compose up -d
```

Verify:

```powershell
docker ps
```

## 4. Run migrations

From `backend`:

```powershell
alembic upgrade head
```

## 5. Start FastAPI

```powershell
uvicorn app.main:app --reload --port 8000
```

Health check:

```text
http://localhost:8000/health
```

Docs:

```text
http://localhost:8000/docs
```

The admin account is bootstrapped from `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`.
Change both before production.

## 6. Start frontend

Open a second PowerShell:

```powershell
cd frontend
npm install
copy .env.example .env
npm run dev
```

Open the URL Vite prints, normally:

```text
http://localhost:5173
```

## 7. Frontend package install

The included `package.json` already lists the production UI packages.

If you need to regenerate/add shadcn components later, use the official CLI:

```powershell
npx shadcn@latest init
```

## 8. AI keys

Do not put AI keys in the frontend.

Set them only in `backend/.env`.

Current starting recommendation (checked September 2026):
1. OpenRouter `openrouter/free` as the primary free router.
2. Gemini `gemini-3.7-flash` as the fallback where the account/project has free-tier access.

Free-model availability and limits can change, so re-check the provider dashboards before production. For a commercial launch, move to a paid production model after revenue starts.

Example:

```env
OPENROUTER_API_KEY=...
OPENROUTER_MODEL=...
GEMINI_API_KEY=...
GEMINI_MODEL=...
```

## 9. Payment gateway

Payment integration is deliberately kept behind a backend boundary. Do not accept real money until merchant onboarding, KYC/KYB, business/bank setup, legal pages, webhook verification and test-mode validation are complete.

Set Razorpay credentials only on the backend:

```env
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
```

## 10. Production checklist

Before collecting money:

- Replace development secrets
- Configure production PostgreSQL
- Configure Redis
- Configure a real email provider
- Verify email domain
- Configure payment gateway test mode
- Configure webhook HTTPS URL
- Test payment verification
- Add privacy policy and terms
- Add refund/no-refund policy wording appropriate to the business
- Add monitoring and error reporting
- Run dependency/security audits
- Build frontend with `npm run build`
- Deploy frontend to Vercel
- Deploy FastAPI on a suitable backend host
- Configure CORS to the real Vercel domain
- Never commit `.env`

## Important

The current repository is a strong production foundation. Payment merchant onboarding, exact free-AI-provider selection, legal wording and final production hosting should be completed after the app is running locally and tested.
