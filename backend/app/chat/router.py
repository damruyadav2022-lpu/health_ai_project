from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import anthropic
import os
from app.config import settings

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

class SymptomRequest(BaseModel):
    text: str

class ScribeRequest(BaseModel):
    probability: float
    explanation: str

class PatientData(BaseModel):
    id: Optional[str] = ""
    age: Optional[int] = None
    gender: Optional[str] = ""
    history: Optional[List[str]] = []
    vitals: Optional[dict] = {}

class AnalyticsState(BaseModel):
    risk_level: Optional[str] = ""
    disease_probabilities: Optional[dict] = {}

class ClinicalIntelligenceRequest(BaseModel):
    message: str
    speaker: str = "Patient"  # "Doctor" or "Patient"
    current_soap: Optional[dict] = None
    patient_data: Optional[PatientData] = None
    analytics_state: Optional[AnalyticsState] = None

# Keep legacy alias for backward compat
SoapExtractionRequest = ClinicalIntelligenceRequest

class PrescriptionRequest(BaseModel):
    diagnosis: str
    symptoms: str

class Medication(BaseModel):
    name: str
    dosage: str
    frequency: str
    duration: str

class PrescriptionResponse(BaseModel):
    medications: List[Medication]
    advice: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str

class SymptomResponse(BaseModel):
    top_disease: str
    probability: float
    risk_level: str
    explanation: str
    matched_symptoms: List[str]

# Initialize Anthropic client (will fail if no key, handle gracefully)
client = None
if settings.ANTHROPIC_API_KEY and settings.ANTHROPIC_API_KEY != "sk-...":
    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

@router.post("/chat", response_model=ChatResponse)
async def chat_with_claude(req: ChatRequest):
    # Check if key is placeholder
    is_placeholder = not settings.ANTHROPIC_API_KEY or "REPLACE" in settings.ANTHROPIC_API_KEY or settings.ANTHROPIC_API_KEY == "sk-..."
    
    if is_placeholder:
        return {"reply": f"🤖 **(MOCK MODE)**: I received your message: '{req.message}'.\n\nTo get real medical answers from Claude, please add your real **ANTHROPIC_API_KEY** to `backend/app/config.py` or a `.env` file."}
    
    if not client:
        return {"reply": "Claude API is not configured properly."}
    
    try:
        # 🧠 CHIEF CLINICAL OFFICER (CCO) SYSTEM PROMPT
        system_prompt = """You are the Chief Clinical Officer (CCO) and Lead Medical Scientist at HealthAI Clinical Nexus. 
        You have recursive knowledge of global medical literature (PubMed, Lancet, JAMA), pharmacology, and 
        advanced clinical diagnostics. Your goal is to provide high-fidelity, data-driven medical answers.
        
        Answer ANY question related to healthcare, wellness, medical science, or clinical practice. 
        Be authoritative, detailed, and evidence-based. If a question is about common health, act as a 
        world-class consultant. If it's about surgery or pharmacology, act as a specialist.
        Always maintain a professional, clinician-to-clinician or clinician-to-patient tone."""
        
        response = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=1000,
            system=system_prompt,
            messages=[{"role": "user", "content": req.message}]
        )
        return {"reply": response.content[0].text}
    except Exception as e:
        return {"reply": f"⚠️ **Claude API Error**: {str(e)}\n\n*(Falling back to mock mode)*: I'm here to help, but the AI connection failed."}

@router.post("/symptoms", response_model=SymptomResponse)
async def analyze_symptoms_with_claude(req: SymptomRequest):
    is_placeholder = not settings.ANTHROPIC_API_KEY or "REPLACE" in settings.ANTHROPIC_API_KEY or settings.ANTHROPIC_API_KEY == "sk-..."
    
    if is_placeholder:
        return {
            "top_disease": "Sample Condition (Mock)",
            "probability": 0.85,
            "risk_level": "Medium",
            "explanation": "This is a mock analysis for demo purposes. Please configure your ANTHROPIC_API_KEY for real medical intelligence.",
            "matched_symptoms": ["demo-symptom-1", "demo-symptom-2"]
        }
    
    try:
        prompt = f"""Analyze these symptoms and return a JSON response (NO other text):
Symptoms: {req.text}

Required JSON format:
{{
  "top_disease": "str",
  "probability": float (0-1),
  "risk_level": "Low/Medium/High",
  "explanation": "concise medical explanation",
  "matched_symptoms": ["str", "str"]
}}
"""
        response = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=1024,
            system="You are a medical diagnostics AI. Analyze symptoms and provide structured JSON output only.",
            messages=[{"role": "user", "content": prompt}]
        )
        
        # Parse the JSON from text
        import json
        import re
        text = response.content[0].text
        # Extract json if Claude adds preamble
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            data = json.loads(match.group())
            return data
        else:
            raise ValueError("No JSON found in Claude response")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/extract-soap")
async def extract_soap_incremental(req: ClinicalIntelligenceRequest):
    """
    Clinical Intelligence Engine — real-time incremental SOAP + analytics + audit.
    """
    is_placeholder = not settings.ANTHROPIC_API_KEY or "REPLACE" in settings.ANTHROPIC_API_KEY or settings.ANTHROPIC_API_KEY == "sk-..."
    current = req.current_soap or {}

    if is_placeholder:
        import re as _re
        msg = req.message.lower()
        pd  = req.patient_data or PatientData()
        age = pd.age or 0

        # -- Critical alert detection --
        alerts = []
        critical_map = {
            "chest pain":           "CRITICAL: Chest Pain detected — possible cardiac emergency. Immediate ECG required.",
            "shortness of breath":  "CRITICAL: Respiratory distress detected — assess O2 saturation immediately.",
            "unconscious":          "CRITICAL: Loss of consciousness — call emergency services.",
            "seizure":              "CRITICAL: Seizure activity reported — secure airway, do not restrain.",
            "stroke":               "CRITICAL: Stroke symptoms detected — activate stroke protocol immediately.",
            "severe bleeding":      "CRITICAL: Active haemorrhage — apply pressure, call emergency services.",
        }
        for kw, alert in critical_map.items():
            if kw in msg:
                alerts.append(alert)

        # -- Symptom extraction --
        subj_kw  = ["feel", "pain", "tired", "fatigue", "nausea", "dizzy", "vomit",
                    "cough", "fever", "cold", "weak", "headache", "bleed", "sweat",
                    "ache", "rash", "breath", "thirst", "hunger", "vision", "loss"]
        obj_kw   = ["bp", "blood pressure", "temp", "hr", "pulse", "spo2", "weight", "height", "oxygen", "glucose"]
        plan_kw  = ["order", "refer", "prescribe", "schedule", "follow", "test", "cbc", "xray", "ecg", "monitor"]

        subj, obj, assess, plan, syms = [], [], [], [], {}

        if req.speaker == "Patient":
            for kw in subj_kw:
                if kw in msg:
                    subj.append(req.message)
                    syms[kw] = round(0.85 + (0.1 if age > 60 else 0), 2)
                    break
        elif req.speaker == "Doctor":
            if any(w in msg for w in obj_kw):  obj.append(req.message)
            elif any(w in msg for w in plan_kw): plan.append(req.message)

        # -- Risk engine --
        risk = "Low"
        if alerts:                            risk = "High"
        elif age > 60 and subj:              risk = "High"
        elif age > 40 and subj:             risk = "Medium"
        elif subj:                          risk = "Medium"

        # -- Disease probability (demo heuristic) --
        disease_probs = {}
        if "fever" in msg:     disease_probs["viral_infection"] = 0.75
        if "fatigue" in msg:   disease_probs["anaemia"]        = 0.55
        if "headache" in msg:  disease_probs["hypertension"]   = 0.60
        if "cough" in msg:     disease_probs["respiratory_infection"] = 0.70
        if "thirst" in msg:    disease_probs["diabetes"]       = 0.65
        if "chest" in msg:     disease_probs["cardiac_event"]  = 0.80

        conf = 0.88 if subj else (0.90 if obj else 0.0)
        action = "symptom_added" if subj else ("vital_recorded" if obj else ("plan_added" if plan else "no_change"))
        status = "updated" if (subj or obj or plan or alerts) else "no_change"

        return {
            "updates": {
                "subjective_add": subj, "objective_add": obj,
                "assessment_add": assess, "plan_add": plan, "alerts": alerts,
            },
            "analytics": {
                "risk_level": risk,
                "disease_probabilities": disease_probs,
                "confidence_score": conf,
                "symptom_confidence": syms,
            },
            "audit_log": {
                "action": action,
                "reason": f"{req.speaker} reported: {req.message[:80]}",
                "source": req.speaker.lower(),
            },
            "status": status,
        }

    try:
        import json, re
        pd   = req.patient_data or PatientData()
        an   = req.analytics_state or AnalyticsState()
        soap = json.dumps(current, indent=2) if current else "{}"

        patient_ctx = json.dumps({
            "id": pd.id, "age": pd.age, "gender": pd.gender,
            "history": pd.history, "vitals": pd.vitals
        }, indent=2)
        analytics_ctx = json.dumps({
            "risk_level": an.risk_level,
            "disease_probabilities": an.disease_probabilities
        }, indent=2)

        SYSTEM_PROMPT = """You are the Clinical Intelligence Engine for a real-time AI healthcare system.

You are deeply integrated with a backend consisting of:
* Patient database
* Clinical notes (SOAP)
* Risk analytics
* ML prediction services

Your job is NOT to generate data — your job is to:
✔ Interpret real backend data
✔ Update clinical state incrementally
✔ Produce accurate intelligence
✔ Maintain consistency across system modules

## 🔒 STRICT NON-NEGOTIABLE RULES
1. NEVER hallucinate or fabricate medical data
2. ONLY use incoming user/doctor input, existing database state, backend API responses
3. If data is missing → return "insufficient_data"
4. Do NOT overwrite existing valid data
5. Do NOT duplicate entries
6. Be medically logical and consistent

## 🧠 CORE RESPONSIBILITIES
1. SUBJECTIVE: symptoms, duration, severity, pattern — from Patient messages ONLY
2. OBJECTIVE: measurable/observed data from Doctor messages ONLY
3. ASSESSMENT: suggest conditions ONLY if medically supported by input
4. PLAN: tests, basic treatment, monitoring — realistic and minimal
5. RISK ENGINE: compute risk using age + symptoms + duration
   - age > 60 + fever → High
   - mild fatigue → Medium
6. ANALYTICS: update disease_probabilities and confidence_score
7. AUDIT LOG: every update must include action log

## ⚡ REAL-TIME CONSTRAINTS
* Process ONLY the latest message — do NOT recompute full history
* Return ONLY incremental updates — keep response lightweight

## 📤 OUTPUT FORMAT (STRICT JSON ONLY)
{
  "updates": {
    "subjective_add": [],
    "objective_add": [],
    "assessment_add": [],
    "plan_add": [],
    "alerts": []
  },
  "analytics": {
    "risk_level": "Low | Medium | High | insufficient_data",
    "disease_probabilities": {},
    "confidence_score": 0.0,
    "symptom_confidence": {}
  },
  "audit_log": {
    "action": "",
    "reason": "",
    "source": "patient | doctor | backend"
  },
  "status": "updated | no_change | insufficient_data"
}

RETURN ONLY VALID JSON. No explanation. No preamble."""

        USER_PROMPT = f"""## Patient Context
{patient_ctx}

## Current SOAP State
{soap}

## Current Analytics State
{analytics_ctx}

## New Input
Speaker: {req.speaker}
Message: "{req.message}"

Return ONLY the incremental JSON update:"""

        response = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=900,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": USER_PROMPT}]
        )
        text  = response.content[0].text
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            return json.loads(match.group())
        return {"status": "insufficient_data"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/scribe", response_model=ChatResponse)
async def generate_clinical_scribe_note(req: ScribeRequest):
    is_placeholder = not settings.ANTHROPIC_API_KEY or "REPLACE" in settings.ANTHROPIC_API_KEY or settings.ANTHROPIC_API_KEY == "sk-..."
    
    if is_placeholder:
        mock_note = f"""🩺 **CLINICAL SOAP NOTE** (Draft)
**Patient**: {req.patient_name}
**Assessment**: {req.diagnosis} ({(req.probability * 100):.1f}% confidence)

**Subjective**: Patient presents with: {req.symptoms}
**Objective**: AI analysis of biomarkers and history completed.
**Assessment**: Clinical indications suggest {req.diagnosis}. {req.explanation}
**Plan**: 1. Specialist referral to Endocrinology/Cardiology. 2. Regular vitals monitoring. 3. Lifestyle intervention as discussed.

*(Mock generation - Add API key for full AI Scribe)*"""
        return {"reply": mock_note}
    
    try:
        scribe_prompt = f"""Generate a professional Clinical SOAP note for:
Patient Name: {req.patient_name}
Symptoms: {req.symptoms}
AI Diagnosis: {req.diagnosis}
Confidence: {req.probability}
Explanation: {req.explanation}

FORMAT: Use Markdown with bold headers (Subjective, Objective, Assessment, Plan). 
As Chief Clinical Officer, ensure the 'Assessment' and 'Plan' sections are detailed and reflect current evidence-based guidelines."""

        response = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=1500,
            system="You are the Chief Clinical Officer (CCO). Generate expert SOAP documentation based on clinical analysis.",
            messages=[{"role": "user", "content": scribe_prompt}]
        )
        return {"reply": response.content[0].text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/prescribe", response_model=PrescriptionResponse)
async def generate_ai_prescription(req: PrescriptionRequest):
    """
    Generate professional medication suggestions based on diagnostic results.
    """
    is_placeholder = not settings.ANTHROPIC_API_KEY or "REPLACE" in settings.ANTHROPIC_API_KEY or settings.ANTHROPIC_API_KEY == "sk-..."
    
    if is_placeholder:
        # Mock Response for Demo
        return {
            "medications": [
                {"name": "Metformin (Mock)", "dosage": "500mg", "frequency": "BID", "duration": "30 Days"},
                {"name": "Lisinopril (Mock)", "dosage": "10mg", "frequency": "Daily", "duration": "90 Days"}
            ],
            "advice": "Demo mode: Please configure Anthropic API for real clinical suggestions."
        }
    
    if not client:
        raise HTTPException(status_code=503, detail="Claude AI core not initialized.")

    try:
        prompt = f"""As a clinical decision support AI, suggest standard medications for:
Diagnosis: {req.diagnosis}
Presenting Symptoms: {req.symptoms}

Return ONLY a JSON object with:
{{
  "medications": [
    {{ "name": "string", "dosage": "string", "frequency": "string", "duration": "string" }}
  ],
  "advice": "brief clinical advice or lifestyle tips"
}}
"""
        response = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=1000,
            system="You are a Clinical Pharmacology AI. Suggest base-level prescriptions for physician review. RETURN JSON ONLY.",
            messages=[{"role": "user", "content": prompt}]
        )
        
        import json
        import re
        text = response.content[0].text
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            return json.loads(match.group())
        else:
            raise ValueError("Cloud failed to return structured prescription JSON.")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
