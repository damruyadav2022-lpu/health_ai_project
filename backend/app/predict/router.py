from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.router import get_current_user
from app.predict import service
from app.predict.schemas import StructuredInput, SymptomInput, PredictionResponse
from app.history.models import PredictionHistory
from app.recommend.service import get_recommendations
import json

router = APIRouter()


def _save_history(db: Session, user_id: int, result: dict, input_type: str):
    try:
        hist = PredictionHistory(
            user_id=user_id,
            input_type=input_type,
            top_disease=result.get("top_disease", ""),
            probability=result.get("probability", 0),
            risk_level=result.get("risk_level", "Low"),
            all_diseases=json.dumps(result.get("all_diseases", [])),
            explanation=result.get("explanation", ""),
        )
        db.add(hist)
        db.commit()
    except Exception as e:
        print(f"⚠️ History Seeding Error: {str(e)}")
        db.rollback()


@router.get("/diseases")
def get_diseases():
    """Fetch the master clinical knowledge base."""
    return service.get_all_diseases()


@router.post("/predict", response_model=PredictionResponse)
def predict(
    data: StructuredInput,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Run structured-data multi-disease prediction."""
    result = service.predict_structured(data.to_dict())
    recs = get_recommendations(result.get("top_disease", ""))
    result["recommendations"] = recs
    _save_history(db, current_user.id, result, "structured")
    return result


@router.post("/analyze-symptoms", response_model=PredictionResponse)
def analyze_symptoms(
    data: SymptomInput,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """NLP-based symptom text analysis."""
    result = service.analyze_symptoms(data.symptoms)
    recs = get_recommendations(result.get("top_disease", ""))
    result["recommendations"] = recs
    result["symptoms"] = result.get("matched_symptoms", [])
    _save_history(db, current_user.id, result, "symptoms")
    return result
