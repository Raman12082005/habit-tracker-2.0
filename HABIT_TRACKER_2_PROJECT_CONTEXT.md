# Habit Tracker 2.0 — AI Project Context

> Canonical context for any AI agent/developer working on Habit Tracker 2.0.
> Read this file before changing code. Never put secrets, passwords, API keys, or database credentials in this file.

## 1. Project Overview

**Name:** Habit Tracker 2.0  
**Type:** Full-stack, multi-user habit/productivity SaaS.

Goal: provide a polished productivity workspace for recurring weekly habits and date-specific personal tasks, with analytics, themes, authentication, subscriptions, and an optional AI assistant.

The project should be portfolio-quality, production-oriented, secure, responsive, GitHub-ready, and deployable.

---

## 2. Technology Stack

### Frontend
- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- Motion
- Lucide icons
- Recharts
- React Router
- Sonner

### Backend
- Python
- FastAPI
- SQLAlchemy 2.x
- asyncpg
- Alembic
- Pydantic / pydantic-settings
- JWT
- pwdlib + Argon2
- HTTPX
- Redis
- SlowAPI

### Infrastructure
- PostgreSQL
- Redis-compatible cache
- Docker / Docker Compose
- GitHub
- Vercel for frontend
- Render for backend/database/cache

---

## 3. Core Data Model

There are two fundamentally different work-item types.

### A. Recurring Weekly Habits

Habits are recurring activities associated with one or more days of the week.

Examples:
- Exercise
- Coding Practice
- Reading
- Meditation

A habit may appear on multiple days.

**Critical rule:** habit names are logically case-insensitive.

These represent the same logical habit:

```text
Morning Exercise
morning exercise
MORNING EXERCISE
Morning exercise
```

Case-insensitive uniqueness/reuse must ultimately be enforced correctly at the persistence/application level.

**Known status:** this final database-level integrity migration is still a TODO. Do not claim it is complete.

### B. Date-Specific Personal Tasks

Personal Tasks belong to a specific calendar date.

They can be created for:
- past dates
- today
- future dates

They can be:
- added
- edited
- deleted
- completed
- uncompleted

Do not impose a current-day-only restriction.

---

## 4. Single Source of Truth

The Dashboard day cards and the top Habit Tracker must use the same underlying recurring-habit state.

Conceptually:

```text
tracker.days[currentDayKey].habits
```

There must not be a duplicate independent Habit Tracker habit state.

Therefore:

```text
Complete habit in day card
    -> shared tracker state
    -> Habit Tracker updates

Complete habit in Habit Tracker
    -> shared tracker state
    -> day card updates
```

Adding a habit from either UI must update the same current-day data.

---

## 5. Progress and Donut Rules

### Habit Tracker progress
Represents recurring habit completion.

### Daily Personal Task donut
Represents **ONLY date-specific Personal Tasks** for that date.

Example:

```text
Personal Tasks:
[x] Assignment
[ ] Groceries

Habits:
[x] Exercise
```

Personal-task donut = 1/2 = 50%.

Completing Exercise must NOT change the personal-task donut.

Therefore:

```text
Habit completion ----X----> personal-task donut
Personal-task completion ---> personal-task donut
```

### Overall progress
May represent a combined weekly view of recurring habits + personal tasks according to the current product implementation. Do not silently change this rule.

---

## 6. Dashboard

Main title:

```text
Weekly Habit Tracker
```

The dashboard is the primary workspace.

Top area contains:
1. Week information
2. Overall progress
3. Habit Tracker

The current desktop design uses a wide three-column top area.

### Week
- Automatically calculated from the current date.
- No manual week-start date selector.
- Product calendar uses IST.
- Timezone: `Asia/Kolkata`
- Show week start/end.
- Show user-specific Weekly Focus.
- Weekly Focus is persisted.

### Clock
Reward/affirmation area was removed.
It was replaced with a wide digital IST clock.

---

## 7. Seven Day Cards

The dashboard contains:

```text
Monday
Tuesday
Wednesday
Thursday
Friday
Saturday
Sunday
```

Cards can show:
- date/day
- recurring habits
- personal tasks
- personal-task donut
- add habit
- add personal task
- completion controls
- edit/delete controls

Current updated design uses seven cards across desktop.

---

## 8. Habit Management

Users can:
- add habit
- edit habit
- delete habit
- complete habit
- uncomplete habit
- reuse a habit across multiple days

UI label for recurring habit creation:

```text
Add habit
```

Do not confuse recurring habits with date-specific personal tasks.

---

## 9. Personal Task Management

Users can:
- add task
- edit task
- delete task
- complete task
- uncomplete task

Tasks can be attached to any date, including past, current, and future dates.

---

## 10. End of Day

There is an:

```text
End of Day
```

control.

Ending a day finalizes its completion state for progress/reporting.

It does NOT:
- delete tasks
- delete habits
- reset tasks
- reset habits

Users manually edit/delete items.

### Automatic End of Day

Users can configure an automatic end-of-day time, e.g.:

```text
23:00 IST
```

The time is editable.

If the user does not manually end the day, the system can finalize it automatically.

---

## 11. Historical Days

Previous days remain visible.

Allowed historical behavior:
- existing unfinished items can be marked finished where permitted.

Do not allow forbidden historical additions.

The existing product requirement is specifically that previous days are editable but new tasks/habits should not be casually added to finalized historical days.

---

## 12. Analysis

Dedicated Analysis page.

Supported ranges:
- day
- week
- month
- custom date range

Expected capabilities:
- completion statistics
- habit trends
- personal-task trends
- progress charts
- historical patterns
- summaries
- report download

Charts use Recharts.

---

## 13. Themes

Current themes:
- Blue
- Red
- Dark
- Brown

Main aesthetic is dark/cinematic, but users can select another theme.

Theme selection must persist in the database.

---

## 14. Authentication

Authentication is email + password.

There is no username login requirement.

Required:
- register
- login
- logout
- email verification
- forgot password
- reset password
- generated user ID
- failed-login protection
- API rate limiting

### Email verification
Production should require verification before normal access.

Development can use the convenience behavior already designed so local accounts can be tested immediately.

Do not weaken production verification just to simplify local development.

### Login lockout
After 5 failed login attempts, apply approximately 1 minute of lockout/rate limiting.

---

## 15. Admin

Admin can:
- see user count
- see paid/unpaid counts
- search by email
- search by user ID
- inspect account status
- inspect subscription status
- block users
- unblock users
- view platform AI analytics

**Critical:** admin must NEVER see plaintext passwords.

Passwords must be stored as secure hashes.

---

## 16. Subscriptions and Payments

AI access:
- paid subscribers
- admin

Planned subscription periods:
- weekly
- biweekly
- monthly

Payment provider:

```text
Razorpay
```

Architecture:

```text
Frontend
 -> backend creates payment/order
 -> Razorpay checkout
 -> backend verifies payment
 -> subscription activated
```

Use server-side payment verification and webhook support.

Use Razorpay Standard Checkout.

For UPI, use currently supported Intent/QR flows rather than relying on deprecated UPI Collect behavior for new users.

Test mode first.

---

## 17. AI Assistant

AI is subscription-gated.

### Capabilities
The assistant can:
- summarize habits
- summarize personal tasks
- analyze progress
- identify patterns
- provide suggestions
- answer questions about the user's tracker data
- answer general knowledge questions

AI must only receive data the authenticated user is authorized to access.

### Chat
- persistent
- closing the chat does not delete history
- subscription expiry does not delete existing chats
- maximum 10 threads/user
- maximum 15 AI questions/user/day

### UI
Floating bottom-right assistant.
- draggable
- openable/closeable
- approximately 1/4 screen width on desktop
- persistent history

### Provider
Primary:

```text
OpenRouter
Model: openrouter/free
```

Fallback:

```text
Gemini
Model: gemini-3.7-flash
```

API keys remain server-side.

Do not put provider secrets in Vite/browser-exposed variables.

Do not rotate multiple keys to evade provider limits.

---

## 18. Database

Primary database:

```text
PostgreSQL
```

Used for:
- users
- authentication state
- habits
- daily completion
- personal tasks
- weekly focus
- themes
- AI threads/messages
- subscriptions
- analytics-related persistent data

ORM:

```text
SQLAlchemy 2.x
```

Async driver:

```text
asyncpg
```

Migrations:

```text
Alembic
```

---

## 19. Redis

Redis-compatible storage is used/planned for:
- rate limiting
- temporary authentication state
- AI usage counters
- caching/short-lived state

Local:

```text
redis://localhost:6379/0
```

Production:
Render Key Value / Redis-compatible service.

---

## 20. Backend Structure

```text
backend/
├── requirements.txt
├── Dockerfile
├── .dockerignore
├── alembic.ini
├── .env.example
├── app/
│   ├── main.py
│   ├── db.py
│   ├── models.py
│   ├── schemas.py
│   ├── deps.py
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py
│   │   └── time.py
│   ├── routers/
│   │   ├── auth.py
│   │   ├── users.py
│   │   ├── habits.py
│   │   ├── analytics.py
│   │   ├── ai.py
│   │   ├── subscriptions.py
│   │   └── admin.py
│   └── services/
│       ├── ai_service.py
│       ├── email.py
│       ├── payment.py
│       └── rate_limit.py
└── migrations/
    ├── env.py
    └── versions/
        ├── 0001_initial.py
        └── 0002_weekly_focus.py
```

---

## 21. Backend Dependencies

Current `backend/requirements.txt`:

```text
fastapi>=0.116,<1
uvicorn[standard]>=0.35,<1
sqlalchemy>=2.0,<3
asyncpg>=0.30,<1
alembic>=1.16,<2
pydantic>=2.11,<3
pydantic-settings>=2.10,<3
python-jose[cryptography]>=3.5,<4
pwdlib[argon2]>=0.2,<1
email-validator>=2.2,<3
httpx>=0.28,<1
redis>=6,<7
slowapi>=0.1.9,<1
python-multipart>=0.0.20,<1
```

Alembic is already present. If deployment says `alembic: not found`, investigate Docker build/runtime configuration rather than adding Alembic again.

---

## 22. Frontend Structure

```text
frontend/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── index.html
├── vercel.json
├── .env.example
└── src/
    ├── App.tsx
    ├── main.tsx
    ├── index.css
    ├── types.ts
    ├── components/
    │   ├── AppShell.tsx
    │   ├── Navbar.tsx
    │   ├── ChatAssistant.tsx
    │   └── ui.tsx
    ├── context/
    │   ├── AuthContext.tsx
    │   └── ThemeContext.tsx
    ├── lib/
    │   ├── api.ts
    │   └── utils.ts
    └── pages/
        ├── LandingPage.tsx
        ├── DashboardPage.tsx
        ├── AnalysisPage.tsx
        ├── SubscriptionPage.tsx
        ├── AdminPage.tsx
        ├── SettingsPage.tsx
        ├── AuthPages.tsx
        ├── InfoPages.tsx
        └── LegalPages.tsx
```

---

## 23. Pages

```text
/                   Home
/about              About
/contact            Contact
/login              Login
/register            Register
/forgot-password    Forgot Password
/reset-password     Reset Password
/verify-email       Verify Email
/dashboard          Dashboard
/analysis           Analysis
/subscription       AI Access / Subscription
/settings           Settings
/admin              Admin
/terms              Terms
/privacy            Privacy
/*                  404
```

---

## 24. Timezone

Product calendar timezone:

```text
Asia/Kolkata
```

Use it consistently for:
- current day
- week boundaries
- end-of-day
- dashboard dates
- recurring schedule interpretation

Do not blindly use server UTC for product calendar logic.

---

## 25. Security

Never commit:
- `.env`
- `.venv`
- API keys
- passwords
- JWT secrets
- database credentials
- Redis credentials
- Razorpay secrets

Use `.env.example` for documentation.

### User isolation

Every user-owned query must be scoped to the authenticated user's ID.

Users must never be able to access another user's:
- habits
- tasks
- AI chats
- subscriptions
- private analytics

### Passwords

Use:

```text
pwdlib[argon2]
```

Never store or expose plaintext passwords.

### Secrets

Production `SECRET_KEY` must be different from local development.

---

## 26. Email

Email is abstracted behind a backend service.

Development:

```text
EMAIL_PROVIDER=console
```

Production can use a real provider such as Resend.

Never expose email API keys to the browser.

---

## 27. Environment Separation

### Local

Conceptually:

```env
APP_NAME=Habit Tracker 2.0
ENVIRONMENT=development
SECRET_KEY=<local-secret>
DATABASE_URL=postgresql+asyncpg://...localhost...
REDIS_URL=redis://localhost:6379/0
FRONTEND_URL=http://localhost:5173

EMAIL_PROVIDER=console
EMAIL_FROM=no-reply@example.com
RESEND_API_KEY=

OPENROUTER_API_KEY=
OPENROUTER_MODEL=openrouter/free
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.7-flash

PAYMENT_PROVIDER=razorpay
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

ADMIN_EMAIL=<admin-email>
ADMIN_PASSWORD=<admin-password>
```

### Production

Use:
- `ENVIRONMENT=production`
- fresh production SECRET_KEY
- Render PostgreSQL internal URL
- Render Redis/Key Value internal URL
- actual Vercel frontend URL
- production admin credentials
- production provider credentials

Never copy local localhost values into production.

---

## 28. Local Infrastructure

Known local setup:
- Windows
- Node.js 24.x
- npm 11.x
- Python 3.12.x

Docker:
- PostgreSQL
- Redis

PostgreSQL host mapping:

```text
5433:5432
```

The host uses 5433 because another PostgreSQL service conflicted with host port 5432.

Container PostgreSQL remains on 5432.

---

## 29. GitHub

Repository:

```text
https://github.com/Raman12082005/habit-tracker-2.0
```

Branch:

```text
main
```

The project has already been pushed.

Keep secrets out of Git.

---

## 30. Deployment Architecture

Target:

```text
GitHub
   |
   +--> Vercel
   |     React/Vite frontend
   |
   +--> Render
         FastAPI backend
             |
             +--> Render PostgreSQL
             |
             +--> Render Redis/Key Value
```

Frontend and backend are separate services.

---

## 31. Vercel

Frontend deployment target:

```text
Vercel
```

Configuration:

```text
Root Directory: frontend
Framework: Vite
Build Command: npm run build
Output Directory: dist
```

After backend is working, frontend environment variable:

```text
VITE_API_URL=https://<backend-domain>/api/v1
```

Do not invent the backend URL.

SPA routing is configured through:

```text
frontend/vercel.json
```

---

## 32. Render

Backend deployment target:

```text
Render Web Service
```

Repository:

```text
Raman12082005/habit-tracker-2.0
```

Root directory:

```text
backend
```

Runtime:

```text
Docker
```

Current target region:

```text
Oregon (US West)
```

PostgreSQL is also in Oregon.

Health endpoint:

```text
/health
```

---

## 33. Current Deployment Status

### Frontend
The user is currently working on deploying/importing the frontend to Vercel.

Immediate objective:
- obtain a public frontend URL

The frontend can be visible before the backend works, but API-dependent features will not work until the backend is live.

### Backend
The first Render deployment failed after the Docker image built.

Observed runtime error:

```text
sh: 1: alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 10000: not found
```

Render reported:

```text
Exited with status 127
```

`backend/requirements.txt` already contains Alembic, so the likely debugging area is the Dockerfile, Render Docker configuration, working directory, or start-command handling.

A proposed more explicit command is:

```bash
sh -c "python -m alembic upgrade head && python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT"
```

Do not create duplicate Render services simply because the first deployment failed.

---

## 34. Previous Known Development Problems

### Backend import
A previous error occurred from an import like:

```python
from backend.app import db
```

when the application was run from the backend directory.

The intended package-local form was:

```python
from app import db
```

when using:

```bash
uvicorn app.main:app
```

If the error returns, inspect all `backend.app...` imports.

### Local PostgreSQL
Host port 5432 conflicted with another PostgreSQL installation, so Docker was mapped to 5433.

### Timezone
`tzdata` was installed locally so `ZoneInfo("Asia/Kolkata")` could resolve correctly.

---

## 35. Testing/Verification

### Frontend

```bash
npm run build
npx tsc --noEmit
```

Verify:
- no TypeScript errors
- no broken imports
- routes work
- no console errors
- responsive layout
- API URL is correct

### Backend

```bash
python -m compileall -q backend/app backend/migrations
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

Health:

```text
http://127.0.0.1:8000/health
```

---

## 36. Required Coding Conventions

Before changing code:

1. Read this document.
2. Inspect existing implementation.
3. Preserve existing requirements unless explicitly changed.
4. Do not rewrite architecture unnecessarily.
5. Keep one source of truth for shared data.
6. Keep recurring habits and personal tasks separate.
7. Keep personal-task donuts independent from habit completion.
8. Use authenticated user ownership.
9. Use IST utilities for calendar logic.
10. Use Alembic for schema changes.
11. Never hardcode user data.
12. Never hardcode secrets.
13. Test changes.

---

## 37. Complete-File Preference

When giving implementation instructions, provide complete contents for every changed/created file whenever practical.

Preferred:

```text
File: frontend/src/pages/DashboardPage.tsx

<complete file>
```

Avoid incomplete fragments unless a tiny change is genuinely safer as a patch.

Also provide exact terminal commands and explain where each file belongs.

---

## 38. Major TODOs

### Deployment
- [ ] Fix Render backend Docker/startup issue
- [ ] Deploy FastAPI backend
- [ ] Verify migrations
- [ ] Verify `/health`
- [ ] Connect Vercel to backend
- [ ] Set production CORS/frontend URL

### Product
- [ ] Implement final case-insensitive habit uniqueness/integrity migration
- [ ] Finish/verify analytics
- [ ] Finish report download
- [ ] Production email provider
- [ ] AI provider configuration
- [ ] Razorpay integration
- [ ] Subscription lifecycle/webhooks
- [ ] Admin analytics
- [ ] Production security review

### Security review
- [ ] CORS
- [ ] rate limits
- [ ] JWT expiration
- [ ] reset-token expiration/one-time use
- [ ] email-verification-token security
- [ ] authorization on every user-owned resource
- [ ] webhook verification
- [ ] secret handling

---

## 39. Release Checklist

### Authentication
- [ ] register
- [ ] login
- [ ] logout
- [ ] email verification
- [ ] forgot password
- [ ] reset password
- [ ] generated user ID
- [ ] 5-attempt login protection
- [ ] 1-minute lockout

### Dashboard
- [ ] IST date
- [ ] current week
- [ ] seven day cards
- [ ] weekly focus
- [ ] IST clock
- [ ] overall progress
- [ ] Habit Tracker
- [ ] shared habit state
- [ ] habit CRUD/completion
- [ ] personal task CRUD/completion
- [ ] personal-task-only day donut
- [ ] End of Day
- [ ] automatic End of Day

### Analytics
- [ ] day
- [ ] week
- [ ] month
- [ ] custom
- [ ] charts
- [ ] report download

### Themes
- [ ] Blue
- [ ] Red
- [ ] Dark
- [ ] Brown
- [ ] persistence

### AI
- [ ] subscription gate
- [ ] admin access
- [ ] 10 threads/user
- [ ] 15 questions/day
- [ ] persistent chat
- [ ] user-data context
- [ ] general knowledge
- [ ] draggable assistant

### Subscription
- [ ] weekly
- [ ] biweekly
- [ ] monthly
- [ ] order creation
- [ ] server verification
- [ ] webhook

### Admin
- [ ] user count
- [ ] paid/unpaid count
- [ ] email search
- [ ] user-ID search
- [ ] block/unblock
- [ ] subscription visibility
- [ ] AI platform analytics
- [ ] no plaintext passwords

---

## 40. AI Agent Rules

An AI agent working on this project must NOT:

- invent requirements
- replace FastAPI without approval
- replace PostgreSQL without approval
- replace the deployment architecture without approval
- create duplicate habit state
- mix recurring habits with personal tasks
- make habit completion change the personal-task donut
- hardcode demo habits as user data
- delete data after End of Day
- delete AI history after subscription expiry
- expose API keys
- store plaintext passwords
- silently restrict future personal tasks
- casually change historical-day behavior
- assume capitalization creates separate habits
- skip migrations for schema changes

Before any major change, determine:

```text
What data type is affected?
Who owns it?
What is the source of truth?
Does IST matter?
Does this require a migration?
Does it change a documented requirement?
Does it expose a secret?
```

If a requirement changes, update this document.

---

## 41. Canonical Mental Model

```text
USER
 |
 +-- Account
 |    +-- email
 |    +-- password hash
 |    +-- generated user ID
 |    +-- verification
 |    +-- subscription
 |
 +-- Weekly Tracker
 |    +-- weekly focus
 |    +-- recurring habits
 |    |    +-- Monday
 |    |    +-- Tuesday
 |    |    +-- Wednesday
 |    |    +-- Thursday
 |    |    +-- Friday
 |    |    +-- Saturday
 |    |    +-- Sunday
 |    +-- completion state
 |
 +-- Personal Tasks
 |    +-- date -> tasks
 |
 +-- Analytics
 |    +-- daily
 |    +-- weekly
 |    +-- monthly
 |    +-- custom
 |
 +-- AI
 |    +-- threads
 |    +-- messages
 |    +-- usage limits
 |    +-- tracker-data context
 |
 +-- Settings
      +-- theme
```

**Frontend** visualizes the data.  
**FastAPI** owns authorization and business rules.  
**PostgreSQL** owns persistent data.  
**Redis** handles temporary/high-frequency state.  
**AI** receives only authorized user data.

---

## 42. Document Maintenance

This file is intended to be committed to the repository, for example:

```text
HABIT_TRACKER_2_PROJECT_CONTEXT.md
```

Whenever an important product or architecture decision changes, update this document in the same change/commit when appropriate.

This document is the first file an AI agent should read before modifying Habit Tracker 2.0.
