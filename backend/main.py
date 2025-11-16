import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load .env BEFORE importing routers
env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(env_path)

from apscheduler.schedulers.background import BackgroundScheduler
from contextlib import asynccontextmanager
from datetime import datetime, timezone

# Routers
from routes.analytics import router as analytics_router
from routes.inbox import router as inbox_router
from routes.email_parser import (
    router as email_parser_router,
    fetch_and_process_emails,
    CHECK_INTERVAL_SECONDS
)

# -----------------------------
# CREATE APP (ONLY ONCE)
# -----------------------------
scheduler = BackgroundScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler.add_job(
        fetch_and_process_emails,
        "interval",
        seconds=CHECK_INTERVAL_SECONDS,
        next_run_time=datetime.now(timezone.utc),
        id="email-checker"
    )
    scheduler.start()
    print("📧 Scheduler started")

    yield

    scheduler.shutdown()
    print("🛑 Scheduler stopped")

app = FastAPI(
    title="Query Analytics API",
    description="API for analytics, dashboards and email ingestion",
    version="1.0.0",
    lifespan=lifespan
)

# -----------------------------
# CORS
# -----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://radiant-biscuit-172588.netlify.app",
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# ROUTERS
# -----------------------------
app.include_router(analytics_router, prefix="/api")
app.include_router(inbox_router, prefix="/api")
app.include_router(email_parser_router, prefix="/api")

# -----------------------------
# ROOT
# -----------------------------
@app.get("/")
def home():
    return {"status": "API Running 🚀"}
