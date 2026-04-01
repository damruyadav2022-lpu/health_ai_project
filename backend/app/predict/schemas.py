from pydantic import BaseModel
from typing import Optional, List, Dict, Any


class StructuredInput(BaseModel):
    # Diabetes features
    Pregnancies: Optional[float] = 0
    Glucose: Optional[float] = 100
    BloodPressure: Optional[float] = 70
    SkinThickness: Optional[float] = 20
    Insulin: Optional[float] = 80
    BMI: Optional[float] = 25.0
    DiabetesPedigreeFunction: Optional[float] = 0.5
    Age: Optional[float] = 35
    # Heart features
    sex: Optional[float] = 1
    cp: Optional[float] = 0
    trestbps: Optional[float] = 120
    chol: Optional[float] = 200
    fbs: Optional[float] = 0
    restecg: Optional[float] = 0
    thalach: Optional[float] = 150
    exang: Optional[float] = 0
    oldpeak: Optional[float] = 0.0
    slope: Optional[float] = 1
    ca: Optional[float] = 0
    thal: Optional[float] = 1
    # Liver features
    Gender: Optional[float] = 1
    Total_Bilirubin: Optional[float] = 1.0
    Direct_Bilirubin: Optional[float] = 0.3
    Alkaline_Phosphotase: Optional[float] = 200
    Alamine_Aminotransferase: Optional[float] = 35
    Aspartate_Aminotransferase: Optional[float] = 35
    Total_Protiens: Optional[float] = 6.5
    Albumin: Optional[float] = 3.5
    Albumin_and_Globulin_Ratio: Optional[float] = 1.0

    def to_dict(self) -> dict:
        return self.model_dump()


class SymptomInput(BaseModel):
    symptoms: str  # Free-text symptom description


class DiseaseResult(BaseModel):
    disease: str
    display_name: str
    probability: float
    risk_level: str
    specialist: str
    color: str


class PredictionResponse(BaseModel):
    top_disease: str
    probability: float
    risk_level: str
    all_diseases: List[DiseaseResult]
    explanation: str
    feature_importances: Optional[Dict[str, float]] = {}
    matched_symptoms: Optional[List[str]] = []
    recommendations: Optional[List[str]] = []
    symptoms: Optional[List[str]] = []
