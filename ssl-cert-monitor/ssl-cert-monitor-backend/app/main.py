from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler

from app.database import init_db, SessionLocal
from app.routers import certificates, dashboard, settings
from app.seed_data import seed_database
from app.services.scheduler import run_certificate_scan_job

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Initializing database...")
    init_db()

    # Seed sample data
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()

    # Start background scheduler for certificate scanning
    scheduler.add_job(
        run_certificate_scan_job,
        "interval",
        hours=24,
        id="cert_scan_job",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("Certificate scan scheduler started (every 24 hours)")

    yield

    # Shutdown
    scheduler.shutdown()
    logger.info("Scheduler shut down")


app = FastAPI(
    title="SSL Certificate Monitor",
    description="Monitor SSL certificates across your organization",
    version="1.0.0",
    lifespan=lifespan,
)

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Include routers
app.include_router(certificates.router)
app.include_router(dashboard.router)
app.include_router(settings.router)


@app.get("/healthz")
async def healthz():
    return {"status": "ok"}
