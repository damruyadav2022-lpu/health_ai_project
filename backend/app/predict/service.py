import os
import re
import json
import joblib
import numpy as np
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
        if os.path.exists(model_path):
            _models[disease] = joblib.load(model_path)
            if os.path.exists(meta_path):
                _meta[disease] = joblib.load(meta_path)
        else:
            _models[disease] = None


def get_all_diseases():
    _load_data()
    return _diseases_db


def _risk_level(prob: float) -> str:
    if prob >= 0.75: return "High"
    if prob >= 0.45: return "Medium"
    return "Low"


def _build_explanation(disease: str, prob: float, importances: dict) -> str:
    top = list(importances.items())[:3]
    parts = [f"{feat.replace('_', ' ')} ({imp*100:.0f}%)" for feat, imp in top]
    display_name = DISEASE_CONFIG.get(disease, {}).get("display_name", disease.capitalize())
    return (
        f"The model predicts {display_name} risk at {prob*100:.1f}%. "
        f"Top factors: {', '.join(parts)}."
    )


def predict_structured(input_data: dict) -> dict:
    _load_data()
    results = []

    for disease, config in DISEASE_CONFIG.items():
        model = _models.get(disease)
        if model is None: continue
        feature_values = [float(input_data.get(feat, 0)) for feat in config["features"]]
        X = np.array([feature_values])
        try:
            proba = model.predict_proba(X)[0]
            prob = float(proba[1]) if len(proba) > 1 else float(proba[0])
        except Exception: prob = 0.0

        meta = _meta.get(disease, {})
        importances = meta.get("importances", {feat: 1/len(config["features"]) for feat in config["features"]})

        results.append({
            "disease": disease,
            "display_name": config["display_name"],
            "probability": round(prob, 4),
            "risk_level": _risk_level(prob),
            "explanation": _build_explanation(disease, prob, importances),
            "specialist": config["specialist"],
            "color": config["color"],
        })

    results.sort(key=lambda x: x["probability"], reverse=True)
    top = results[0] if results else {}
    return {
        "top_disease": top.get("display_name", "Unknown"),
        "probability": top.get("probability", 0),
        "risk_level": top.get("risk_level", "Low"),
        "all_diseases": results,
        "explanation": top.get("explanation", ""),
    }


def analyze_symptoms(symptom_text: str) -> dict:
    """NLP-based symptom matching across the entire 100+ disease knowledge base."""
    _load_data()
    text = symptom_text.lower()
    scores = {}
    matched_map = {}

    for item in _diseases_db:
        disease_name = item["disease"]
        score = 0
        matched = []
        for symptom in item["symptoms"]:
            if re.search(r'\b' + re.escape(symptom.lower()) + r'\b', text):
                score += 1.0
                matched.append(symptom)
        
        if score > 0:
            scores[disease_name] = score
            matched_map[disease_name] = matched

    if not scores:
        return {
            "top_disease": "Inconclusive",
            "probability": 0.0,
            "risk_level": "Low",
            "all_diseases": [],
            "explanation": "No matching symptoms found in the clinical records.",
        }

    # Sort results
    sorted_diseases = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    results = []
    
    for name, score in sorted_diseases:
        disease_info = next(d for d in _diseases_db if d["disease"] == name)
        # Heuristic probability based on matched symptoms / total symptoms
        prob = min(score / len(disease_info["symptoms"]), 0.95)
        
        results.append({
            "disease": name,
            "display_name": name,
            "probability": round(prob, 4),
            "risk_level": "High" if prob > 0.6 else "Medium" if prob > 0.3 else "Low",
            "specialist": disease_info.get("specialist", "General Physician"),
            "category": disease_info.get("category", "General"),
            "parameters": disease_info.get("parameters", []),
            "matched_symptoms": matched_map[name],
        })

    top = results[0]
    return {
        "top_disease": top["display_name"],
        "probability": top["probability"],
        "risk_level": top["risk_level"],
        "all_diseases": results[:10],  # Return top 10 matches
        "explanation": f"Symptom matching indicates {top['display_name']} as the primary concern. "
                       f"Matched: {', '.join(top['matched_symptoms'])}. "
                       f"Consult a {top['specialist']} for clinical confirmation.",
    }


def analyze_report_data(extracted_values: dict) -> dict:
    """Analyze clinical report values against the disease database."""
    _load_data()
    potential_risks = []
    
    for item in _diseases_db:
        score = 0
        reasons = []
        
        # Check Glucose/Diabetes
        if item["disease"] == "Diabetes Mellitus":
            sugar = extracted_values.get("Glucose")
            hba1c = extracted_values.get("HbA1c")
            if sugar and sugar >= 126: 
                score = 0.9; reasons.append(f"High Fasting Glucose ({sugar} mg/dL)")
            elif hba1c and hba1c >= 6.5:
                score = 0.95; reasons.append(f"High HbA1c ({hba1c}%)")
        
        # Check Hypertension
        if item["disease"] == "Hypertension":
            sys = extracted_values.get("systolic")
            dia = extracted_values.get("diastolic")
            if sys and sys >= 140:
                score = 0.9; reasons.append(f"High Systolic BP ({sys})")
            elif dia and dia >= 90:
                score = 0.9; reasons.append(f"High Diastolic BP ({dia})")
        
        # Check Dengue (Platelet)
        if item["disease"] == "Dengue":
            plt = extracted_values.get("Platelet")
            if plt and plt < 100000:
                score = 0.85; reasons.append(f"Low Platelet Count ({plt})")
        
        # Check Liver (ALT/AST)
        if "category" in item and (item["category"] == "Gastroenterology" or "Liver" in item["disease"]):
            alt = extracted_values.get("ALT")
            ast = extracted_values.get("AST")
            if (alt and alt > 50) or (ast and ast > 50):
                score = 0.7; reasons.append("Elevated Liver Enzymes (ALT/AST)")

        if score > 0:
            potential_risks.append({
                "disease": item["disease"],
                "display_name": item["disease"],
                "probability": score,
                "risk_level": "High" if score >= 0.75 else "Medium" if score >= 0.45 else "Low",
                "reasons": reasons,
                "specialist": item["specialist"],
                "category": item.get("category", "General"),
                "precautions": item.get("precautions", []),
                "prevention": item.get("prevention", []),
                "dos": item.get("dos", []),
                "donts": item.get("donts", []),
            })

    # Sort by probability
    potential_risks.sort(key=lambda x: x["probability"], reverse=True)
    
    return {
        "risks": potential_risks,
        "extracted_params": extracted_values,
        "summary": f"Analyzed {len(extracted_values)} parameters. Found {len(potential_risks)} potential health concerns."
    }

