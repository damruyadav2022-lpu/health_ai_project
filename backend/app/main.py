from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.config import settings
from app.database import create_tables
from app.auth.router import router as auth_router
from app.predict.router import router as predict_router
from app.ocr.router import router as ocr_router
from app.history.router import router as history_router
from app.recommend.router import router as recommend_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup/shutdown lifecycle."""
    logger.info("🚀 HealthAI Platform starting up...")
    create_tables()
    
    # Seed Demo User
    from app.database import SessionLocal
    from app.auth.service import get_or_create_demo_user
    db = SessionLocal()
    try:
        demo_user = get_or_create_demo_user(db)
        logger.info(f"✅ Demo User active: {demo_user.email}")
    finally:
        db.close()
        
    logger.info("✅ Database tables created.")
    yield
    logger.info("🛑 HealthAI Platform shutting down.")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Enterprise AI Healthcare Analytics Platform API",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(predict_router, prefix="/api", tags=["Prediction"])
app.include_router(ocr_router, prefix="/api", tags=["OCR"])
app.include_router(history_router, prefix="/api", tags=["History"])
app.include_router(recommend_router, prefix="/api", tags=["Recommendations"])


@app.get("/", tags=["Health"])
async def root():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/api/docs",
    }


@app.get("/api/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "service": "HealthAI Backend"}
