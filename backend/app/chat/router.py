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
