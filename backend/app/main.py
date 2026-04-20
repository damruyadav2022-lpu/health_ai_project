from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
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
from app.patients.router import router as patients_router
from app.chat.router import router as chat_router
from app.admin.router import router as admin_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup/shutdown lifecycle."""
    # 0. System Dependency Checks (Tesseract)
    import subprocess
    tesseract_available = False
    try:
        subprocess.run(["tesseract", "--version"], capture_output=True, check=True)
        tesseract_available = True
    except (subprocess.CalledProcessError, FileNotFoundError):
        logger.warning("⚠️ Tesseract OCR not found in PATH. Medical reports will process in DEMO MODE.")

    logger.info(f"🚀 HealthAI Platform starting up... (OCR: {'READY' if tesseract_available else 'DEMO'})")
    create_tables()

    # Seed Demo Data (Optimized: Import only when needed)
    from app.database import SessionLocal, engine
    from app.history.models import PredictionHistory

    
    db = SessionLocal()
    try:
        from app.auth.service import get_or_create_demo_user
        demo_user = get_or_create_demo_user(db)
        
        # High-speed count check
        count = db.query(PredictionHistory).filter(PredictionHistory.user_id == demo_user.id).limit(1).count()
        if count == 0:
            logger.info("🌱 Seeding Super Cool Demo Data...")
            import json
            scenarios = [
                {"disease": "Diabetes Mellitus", "prob": 0.82, "risk": "High", "type": "structured"},
                {"disease": "Hypertension", "prob": 0.45, "risk": "Medium", "type": "symptoms"},
                {"disease": "Dengue", "prob": 0.12, "risk": "Low", "type": "ocr"}
            ]
            for s in scenarios:
                h = PredictionHistory(
                    user_id=demo_user.id,
                    input_type=s["type"],
                    top_disease=s["disease"],
                    probability=s["prob"],
                    risk_level=s["risk"],
                    all_diseases=json.dumps([{"display_name": s["disease"], "probability": s["prob"]}]),
                    explanation=f"Demo prediction based on typical {s['disease']} parameters."
                )
                db.add(h)
            db.commit()
            logger.info("✅ Dashboard data seeded.")
    except Exception as e:
        logger.warning(f"⚠️ Seeding optimized out or skipped: {str(e)}")

    finally:
        db.close()
    
    logger.info("✅ HealthAI Platform environment ready.")
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
app.include_router(auth_router,          prefix="/api/auth",  tags=["Authentication"])
app.include_router(predict_router,        prefix="/api",       tags=["Prediction"])
app.include_router(ocr_router,            prefix="/api",       tags=["OCR"])
app.include_router(history_router,        prefix="/api",       tags=["History"])
app.include_router(recommend_router,      prefix="/api",       tags=["Recommendations"])
app.include_router(patients_router,       prefix="/api",       tags=["Patients"])
app.include_router(chat_router,           prefix="/api",       tags=["Chat"])
app.include_router(admin_router,          prefix="/api/admin", tags=["Admin Control"])

# 🛡️ Global Exception Handler to prevent 500 errors in UI
from fastapi.responses import JSONResponse
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"❌ CRITICAL ERROR: {str(exc)}")
    return JSONResponse(
        status_code=500, # Return proper error to trigger frontend catch block
        content={
            "status": "error",
            "message": "System is self-healing. Please refresh.",
            "detail": str(exc)
        },
    )

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
