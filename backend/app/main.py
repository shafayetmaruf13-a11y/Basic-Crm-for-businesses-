import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models
from .database import Base, engine
from .routers import auth, appointments, companies, contacts, deals, tasks

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Basic CRM API")

allowed_origins = os.getenv("CRM_CORS_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(companies.router)
app.include_router(contacts.router)
app.include_router(deals.router)
app.include_router(tasks.router)
app.include_router(appointments.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
