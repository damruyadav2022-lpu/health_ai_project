"""OCR service — extracts text from uploaded medical images using Tesseract."""
import io
import re
import os
from PIL import Image

try:
    import pytesseract
    import cv2
    import numpy as np
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False

from app.config import settings

if OCR_AVAILABLE and os.path.exists(settings.TESSERACT_CMD):
    pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_CMD


def preprocess_image(image_bytes: bytes) -> "np.ndarray":
    """Convert bytes → grayscale + threshold for better OCR accuracy."""
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    return thresh


def extract_text(image_bytes: bytes) -> str:
    """Run Tesseract OCR on image bytes with mock fallback."""
    if not OCR_AVAILABLE:
        # Return mock data for demo mode
        return "DEMO MODE: Glucose 126 mg/dL, Blood Pressure 140/90, HbA1c 6.5%"
    
    try:
        processed = preprocess_image(image_bytes)
        pil_img = Image.fromarray(processed)
        text = pytesseract.image_to_string(pil_img, config="--psm 6")
        return text.strip()
    except Exception:
        return "DEMO MODE: Glucose 126 mg/dL, Blood Pressure 140/90, HbA1c 6.5%"


# ─── Simple value extraction from OCR text ─────────────────────────────────────

FIELD_PATTERNS = {
    "Glucose": r"(?:glucose|fbs|fasting\s+sugar|ppbs)[^\d]*(\d+\.?\d*)",
    "HbA1c": r"(?:hba1c|haemoglobin\s+a1c)[^\d]*(\d+\.?\d*)",
    "BMI": r"bmi[^\d]*(\d+\.?\d*)",
    "BloodPressure": r"(?:blood\s+pressure|bp)\s*:?\s*(\d+)\s*/\s*(\d+)",
    "Cholesterol": r"(?:total\s+)?cholesterol[^\d]*(\d+\.?\d*)",
    "LDL": r"(?:ldl|low\s+density\s+lipoprotein)[^\d]*(\d+\.?\d*)",
    "HDL": r"(?:hdl|high\s+density\s+lipoprotein)[^\d]*(\d+\.?\d*)",
    "Triglycerides": r"triglycerides[^\d]*(\d+\.?\d*)",
    "Platelet": r"(?:platelet|plt)[^\d]*(\d+)",
    "Hemoglobin": r"(?:hemoglobin|hb)[^\d]*(\d+\.?\d*)",
    "WBC": r"(?:wbc|white\s+blood\s+cell)[^\d]*(\d+\.?\d*)",
    "Bilirubin": r"(?:total\s+)?bilirubin[^\d]*(\d+\.?\d*)",
    "Creatinine": r"creatinine[^\d]*(\d+\.?\d*)",
    "ALT": r"(?:alt|sgpt)[^\d]*(\d+)",
    "AST": r"(?:ast|sgot)[^\d]*(\d+)",
    "SpO2": r"(?:spo2|oxygen\s+saturation)[^\d]*(\d+)",
}


def parse_values(text: str) -> dict:
    """Extract health metric values from raw OCR text with improved pattern matching."""
    parsed = {}
    lower_text = text.lower()
    
    for field, pattern in FIELD_PATTERNS.items():
        match = re.search(pattern, lower_text)
        if match:
            try:
                if field == "BloodPressure":
                    parsed["systolic"] = float(match.group(1))
                    parsed["diastolic"] = float(match.group(2))
                else:
                    parsed[field] = float(match.group(1))
            except (ValueError, IndexError):
                pass
                
    return parsed
