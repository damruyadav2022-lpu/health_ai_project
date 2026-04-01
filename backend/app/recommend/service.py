"""Recommendation service — returns doctor specializations and treatment tips."""

RECOMMENDATIONS_DB = {
    "Diabetes": {
        "specialist": "Endocrinologist",
        "treatments": [
            "Monitor blood glucose levels daily",
            "Adopt a low-glycemic index diet",
            "Exercise at least 30 minutes per day",
            "Consider Metformin if prescribed by doctor",
            "Annual HbA1c and kidney function tests",
        ],
        "lifestyle": [
            "Reduce refined carbohydrates and sugar intake",
            "Stay hydrated — aim for 8 glasses of water/day",
            "Maintain healthy BMI (18.5–24.9)",
            "Avoid smoking and excessive alcohol",
        ],
        "emergency_signs": ["Blood sugar > 300 mg/dL", "Loss of consciousness", "Severe vomiting"],
    },
    "Heart Disease": {
        "specialist": "Cardiologist",
        "treatments": [
            "Regular ECG and cardiac monitoring",
            "Maintain LDL cholesterol below 100 mg/dL",
            "Consider statins or beta-blockers as prescribed",
            "Cardiac rehabilitation program",
            "Stress management and mindfulness",
        ],
        "lifestyle": [
            "Mediterranean diet (olive oil, fish, vegetables)",
            "Quit smoking immediately",
            "Limit sodium intake to < 2,300 mg/day",
            "Aerobic exercise 150 min/week",
        ],
        "emergency_signs": ["Severe chest pain", "Difficulty breathing at rest", "Irregular heartbeat"],
    },
    "Liver Disease": {
        "specialist": "Hepatologist",
        "treatments": [
            "Avoid alcohol completely",
            "Regular liver function tests (LFT)",
            "Antiviral medications if hepatitis present",
            "Nutrition support — high protein diet",
            "Monitor for liver fibrosis via ultrasound",
        ],
        "lifestyle": [
            "Avoid hepatotoxic medications (NSAIDS, acetaminophen overuse)",
            "Eat small, frequent meals",
            "Stay hydrated",
            "Avoid raw shellfish",
        ],
        "emergency_signs": ["Yellowing of skin/eyes (Jaundice)", "Severe abdominal pain", "Confusion or disorientation"],
    },
}

DEFAULT_RECOMMENDATIONS = {
    "specialist": "General Physician",
    "treatments": ["Consult a doctor for a full health screening", "Maintain a healthy lifestyle"],
    "lifestyle": ["Exercise regularly", "Balanced diet", "Adequate sleep (7-9 hours)"],
    "emergency_signs": ["Seek emergency care if symptoms are severe"],
}


def get_recommendations(disease_name: str) -> list:
    """Return a flat list of recommendation strings."""
    data = RECOMMENDATIONS_DB.get(disease_name, DEFAULT_RECOMMENDATIONS)
    recs = []
    recs.append(f"👨‍⚕️ Consult a {data['specialist']}")
    for t in data["treatments"][:3]:
        recs.append(f"💊 {t}")
    for l in data["lifestyle"][:2]:
        recs.append(f"🥗 {l}")
    for e in data.get("emergency_signs", [])[:1]:
        recs.append(f"🚨 Emergency sign: {e}")
    return recs


def get_full_recommendations(disease_name: str) -> dict:
    return RECOMMENDATIONS_DB.get(disease_name, DEFAULT_RECOMMENDATIONS)
