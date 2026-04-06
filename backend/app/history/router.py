from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
import json

from app.database import get_db
from app.auth.router import get_current_user
from app.history.models import PredictionHistory

router = APIRouter()


@router.get("/history")
def get_history(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        total = db.query(PredictionHistory).filter(PredictionHistory.user_id == current_user.id).count()
        records = (
            db.query(PredictionHistory)
            .filter(PredictionHistory.user_id == current_user.id)
            .order_by(PredictionHistory.created_at.desc())
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )
    except Exception as e:
        # Fallback to empty if DB is locked or table missing during migration
        return {
            "total": 0,
            "page": page,
            "limit": limit,
            "total_pages": 1,
            "items": [],
            "error": str(e)
        }

    items = []
    for rec in records:
        try:
            items.append({
                "id": rec.id,
                "input_type": rec.input_type,
                "top_disease": rec.top_disease,
                "probability": rec.probability,
                "risk_level": rec.risk_level,
                "explanation": rec.explanation,
                "all_diseases": json.loads(rec.all_diseases) if rec.all_diseases else [],
                "created_at": rec.created_at.isoformat() if rec.created_at else None,
            })
        except Exception:
            continue

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit,
        "items": items,
    }
