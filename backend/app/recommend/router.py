from fastapi import APIRouter, Query
from app.recommend.service import get_full_recommendations

router = APIRouter()


@router.get("/recommend")
def recommend(disease: str = Query(..., description="Disease name e.g. Diabetes, Heart Disease, Liver Disease")):
    """Return doctor and treatment recommendations for a given disease."""
    data = get_full_recommendations(disease)
    return {
        "disease": disease,
        "specialist": data.get("specialist"),
        "treatments": data.get("treatments", []),
        "lifestyle": data.get("lifestyle", []),
        "emergency_signs": data.get("emergency_signs", []),
    }
