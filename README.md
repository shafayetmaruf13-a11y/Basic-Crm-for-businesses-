# Basic CRM for Businesses

A small business CRM with contacts, companies, a deals pipeline, tasks, and an
appointments calendar.

- **Backend**: FastAPI + SQLAlchemy (SQLite by default), JWT auth
- **Frontend**: React + TypeScript (Vite), React Router

## Features

- Email/password auth (register, login, JWT session)
- Companies and contacts, linked to each other
- Deals pipeline as a drag-and-drop Kanban board (lead → contacted → proposal
  → negotiation → won/lost)
- Tasks with due dates and completion tracking
- Appointments on a month calendar view

## Running locally

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The API runs at `http://localhost:8000`, backed by a local `crm.db` SQLite
file (created automatically). Interactive API docs are at
`http://localhost:8000/docs`.

Environment variables (optional):

- `DATABASE_URL` — SQLAlchemy database URL (defaults to `sqlite:///./crm.db`)
- `CRM_SECRET_KEY` — JWT signing secret (set this in production)
- `CRM_CORS_ORIGINS` — comma-separated list of allowed origins (defaults to
  `http://localhost:5173`)

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173` and proxies `/api` requests to the
backend on port 8000 (see `vite.config.ts`).

## Project structure

```
backend/
  app/
    main.py          FastAPI app, CORS, router registration
    models.py         SQLAlchemy models
    schemas.py         Pydantic request/response schemas
    auth.py           Password hashing + JWT helpers
    routers/          CRUD endpoints per resource
frontend/
  src/
    api/              Axios client + shared TS types
    context/          Auth context/provider
    components/       Layout, protected route, modal
    pages/            Login, register, dashboard, companies,
                       contacts, deals (kanban), tasks, calendar
```
