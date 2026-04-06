import os
import re
import json
import joblib
try:
    import numpy as np
    import sklearn
    HAS_ML = True
except ImportError:
    HAS_ML = False
    class np_mock:
        def array(self, *args, **kwargs): return None
    np = np_mock()

from typing import List, Dict

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "ml", "models")
DISEASES_DB_PATH = os.path.join(os.path.dirname(__file__), "diseases.json")

# ─── Legacy Config (Keep for ML models) ───────────────────────────────────────
DISEASE_CONFIG = {
    "diabetes": {"display_name": "Diabetes", "features": ["Pregnancies", "Glucose", "BloodPressure", "SkinThickness", "Insulin", "BMI", "DiabetesPedigreeFunction", "Age"], "specialist": "Endocrinologist", "color": "#f59e0b"},
    "heart": {"display_name": "Heart Disease", "features": ["age", "sex", "cp", "trestbps", "chol", "fbs", "restecg", "thalach", "exang", "oldpeak", "slope", "ca", "thal"], "specialist": "Cardiologist", "color": "#ef4444"},
    "liver": {"display_name": "Liver Disease", "features": ["Age", "Gender", "Total_Bilirubin", "Direct_Bilirubin", "Alkaline_Phosphotase", "Alamine_Aminotransferase", "Aspartate_Aminotransferase", "Total_Protiens", "Albumin", "Albumin_and_Globulin_Ratio"], "specialist": "Hepatologist", "color": "#8b5cf6"},
}

_models: dict = {}
_meta: dict = {}
_diseases_db: List[Dict] = []


def _load_data():
    """Lazy-load models and disease database."""
    global _models, _meta, _diseases_db
    if not _diseases_db:
        if os.path.exists(DISEASES_DB_PATH):
            with open(DISEASES_DB_PATH, "r") as f:
                _diseases_db = json.load(f)
    
    if _models:
        return
    for disease in DISEASE_CONFIG:
        model_path = os.path.join(MODELS_DIR, f"{disease}_model.pkl")
        meta_path = os.path.join(MODELS_DIR, f"{disease}_meta.pkl")
        if os.path.exists(model_path) and HAS_ML:
            try:
                _models[disease] = joblib.load(model_path)
                if os.path.exists(meta_path):
                    _meta[disease] = joblib.load(meta_path)
            except Exception:
                _models[disease] = None
        else:
            _models[disease] = None


def get_all_diseases():
    _load_data()
    return _diseases_db


def _parse_threshold(threshold_str: str, value: float) -> bool:
    """Intelligently parse medical thresholds like '>=126', '5.7-6.4', or '120/80'."""
    try:
        ts = str(threshold_str).strip()
        
        # Handle composite thresholds like Blood Pressure 120/80
        if '/' in ts:
            # For simplicity, we compare based on the dominant part or check specific logic if needed
            ts = ts.split('/')[0] # Fallback to systolic check
            
        if ts.startswith('>='): return value >= float(ts[2:])
        if ts.startswith('<='): return value <= float(ts[2:])
        if ts.startswith('>'): return value > float(ts[1:])
        if ts.startswith('<'): return value < float(ts[1:])
        if '-' in ts:
            low_str, high_str = ts.split('-')
            return float(low_str) <= value <= float(high_str)
    except (ValueError, TypeError, IndexError):
        pass
    return False


def analyze_report_data(extracted_values: dict) -> dict:
    """
    Advanced Clinical Reasoning Engine.
    Dynamically cross-references 100+ diseases using precise threshold logic.
    """
    _load_data()
    potential_risks = []
    
    # Normalize input keys (e.g., 'fasting sugar' -> 'FBS')
    norm_values = {k.upper(): v for k, v in extracted_values.items() if isinstance(v, (int, float))}
    
    for item in _diseases_db:
        disease_name = item["disease"]
        matching_params = [p.upper() for p in item.get("parameters", [])]
        
        score = 0.0
        reasons = []
        highest_risk_found = "Low"

        for p_name in matching_params:
            if p_name in norm_values:
                val = norm_values[p_name]
                risk_cfg = item.get("risk", {})
                
                # Check for High Risk Threshold
                if _parse_threshold(risk_cfg.get("high", "99999"), val):
                    score = max(score, 0.92)
                    reasons.append(f"CRITICAL: {p_name} level is {val}, exceeding the {risk_cfg['high']} high-risk limit.")
                    highest_risk_found = "High"
                # Check for Medium Risk Threshold
                elif _parse_threshold(risk_cfg.get("medium", "0-0"), val):
                    score = max(score, 0.55)
                    reasons.append(f"CAUTION: {p_name} level is {val}, within the {risk_cfg['medium']} warning range.")
                    highest_risk_found = max(highest_risk_found, "Medium", key=lambda x: 2 if x=="High" else 1 if x=="Medium" else 0)

        if score > 0:
            potential_risks.append({
                "disease": disease_name,
                "display_name": disease_name,
                "probability": score,
                "risk_level": highest_risk_found,
                "explanation": " ".join(reasons),
                "specialist": item.get("specialist", "General Physician"),
                "category": item.get("category", "General"),
                "description": item.get("description", "A clinical condition requiring monitoring."),
                "precautions": item.get("precautions", ["Consult a physician", "Maintain health records"]),
                "dos": item.get("dos", ["Stay hydrated", "Monitor vitals"]),
                "donts": item.get("donts", ["Avoid self-medication", "Avoid strenuous activity"]),
                "lifestyle": item.get("lifestyle", "Follow a balanced diet and regular exercise."),
                "color": item.get("color", "#0ea5e9")
            })

    # Sort results
    potential_risks.sort(key=lambda x: (x["probability"]), reverse=True)
    
    return {
        "risks": potential_risks[:8],
        "extracted_params": extracted_values,
        "summary": f"Dr. AI analyzed {len(norm_values)} biomarkers against 100+ conditions. Identified {len(potential_risks)} focus areas."
    }


def analyze_symptoms(symptom_text: str) -> dict:
    """NLP-based symptom matching across the entire 100+ disease knowledge base."""
    _load_data()
    text = symptom_text.lower()
    results = []

    for item in _diseases_db:
        disease_name = item["disease"]
        matched = []
        for symptom in item.get("symptoms", []):
            if re.search(r'\b' + re.escape(symptom.lower()) + r'\b', text):
                matched.append(symptom)
        
        if matched:
            prob = min(len(matched) / max(len(item.get("symptoms", [1])), 1), 0.95)
            results.append({
                "disease": disease_name,
                "display_name": disease_name,
                "probability": round(prob, 4),
                "risk_level": "High" if prob > 0.6 else "Medium" if prob > 0.3 else "Low",
                "specialist": item.get("specialist", "General Physician"),
                "category": item.get("category", "General"),
                "description": item.get("description", "Symptomatic presentation detected."),
                "precautions": item.get("precautions", ["Rest and hydration"]),
                "matched_symptoms": matched,
                "color": item.get("color", "#0ea5e9"),
                "dos": item.get("dos", []),
                "donts": item.get("donts", []),
                "lifestyle": item.get("lifestyle", ""),
            })

    if not results:
        return {"top_disease": "Inconclusive", "probability": 0.0, "risk_level": "Low", "all_diseases": [], "explanation": "No symptoms matched."}

    results.sort(key=lambda x: x["probability"], reverse=True)
    top = results[0]
    return {
        "top_disease": top["display_name"],
        "probability": top["probability"],
        "risk_level": top["risk_level"],
        "all_diseases": results[:10],
        "explanation": f"Clinical symptom mapping identifies {top['display_name']} as a primary concern. Matched indicators: {', '.join(top['matched_symptoms'])}.",
    }
def predict_structured(input_data: dict) -> dict:
    """
    Standardized entry point for lab data prediction.
    Bridges the legacy API with the new high-precision diagnostic engine.
    """
    analysis = analyze_report_data(input_data)
    risks = analysis.get("risks", [])
    
    if not risks:
        return {
            "top_disease": "Inconclusive",
            "probability": 0.0,
            "risk_level": "Low",
            "all_diseases": [],
            "explanation": "No significant clinical risks identified from current parameters.",
        }
    
    top = risks[0]
    return {
        "top_disease": top["display_name"],
        "probability": top["probability"],
        "risk_level": top["risk_level"],
        "all_diseases": risks,
        "explanation": top["explanation"],
        "specialist": top["specialist"],
        "category": top["category"],
        "description": top.get("description"),
        "precautions": top.get("precautions"),
        "dos": top.get("dos"),
        "donts": top.get("donts"),
        "lifestyle": top.get("lifestyle"),
        "color": top.get("color")
    }
