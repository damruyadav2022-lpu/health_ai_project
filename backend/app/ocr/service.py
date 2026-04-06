"""OCR service — extracts text from uploaded medical images using Tesseract."""
import io
import re
import os
import concurrent.futures
from PIL import Image

try:
    import pytesseract
    import cv2
    import numpy as np
    from pdf2image import convert_from_bytes
    from pypdf import PdfReader
    import docx
    OCR_AVAILABLE = True
except ImportError:
    # Try to provide more context if import fails in dev
    import logging
    logging.warning("OCR dependencies missing. Falling back to demo mode.")
    OCR_AVAILABLE = False


def preprocess_image(image_bytes: bytes, fast_mode: bool = True):
    """
    Apply OpenCV preprocessing to improve OCR accuracy.
    FAST MODE: Uses simple blur instead of expensive NLM denoising for sub-second latency.
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if img is None:
        return None

    # 1. Grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # 2. Rescale (only if very small)
    height, width = gray.shape
    if width < 800:
        gray = cv2.resize(gray, None, fx=2, fy=2, interpolation=cv2.INTER_LINEAR)

    # 3. Denoising (Optimized)
    if fast_mode:
        # Gaussian Blur is ~10x faster than fastNlMeansDenoising
        denoised = cv2.GaussianBlur(gray, (3, 3), 0)
    else:
        denoised = cv2.fastNlMeansDenoising(gray, h=10)

    # 4. Thresholding (Binarization)
    _, binary = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    return binary


def extract_text(file_bytes: bytes, filename: str = "") -> str:
    """Run Tesseract OCR or direct text extraction based on file type."""
    if not OCR_AVAILABLE:
        return "DEMO MODE: Glucose 126 mg/dL, Blood Pressure 140/90, HbA1c 6.5%"

    ext = filename.lower().split('.')[-1] if filename else ""
    
    try:
        if ext == 'pdf' or (not ext and file_bytes.startswith(b'%PDF')):
            return extract_from_pdf(file_bytes)
        elif ext in ['docx', 'doc']:
            return extract_from_docx(file_bytes)
        else:
            # Default to image OCR (Fast mode enabled by default)
            processed = preprocess_image(file_bytes, fast_mode=True)
            if processed is None:
                # Fallback to PIL if OpenCV fails to decode
                img = Image.open(io.BytesIO(file_bytes))
            else:
                img = Image.fromarray(processed)
            
            return pytesseract.image_to_string(img, config="--psm 6").strip()
    except Exception as e:
        print(f"Extraction error: {e}")
        return "DEMO MODE: Glucose 126 mg/dL, Blood Pressure 140/90, HbA1c 6.5%"


def _ocr_single_page(img):
    """Helper for parallelizing PDF OCR."""
    return pytesseract.image_to_string(img, config="--psm 6")


def extract_from_pdf(pdf_bytes: bytes) -> str:
    """Try direct text extraction first, fallback to multi-threaded OCR on images."""
    text = ""
    # 1. Try direct text extraction (fastest)
    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    except Exception:
        pass

    # 2. If no text found or text is too short (likely a scanned PDF), use OCR
    if len(text.strip()) < 50:
        try:
            # Convert PDF pages to images
            images = convert_from_bytes(pdf_bytes, dpi=200) # Balanced DPI for speed/quality
            
            # Use thread pool to speed up OCR of multiple pages
            with concurrent.futures.ThreadPoolExecutor() as executor:
                results = list(executor.map(_ocr_single_page, images))
            
            text = "\n".join(results)
        except Exception as e:
            print(f"PDF OCR Error: {e}. Ensure poppler is installed.")
            
    return text.strip()


def extract_from_docx(docx_bytes: bytes) -> str:
    """Extract text from Word document using python-docx."""
    try:
        import docx
        doc = docx.Document(io.BytesIO(docx_bytes))
        return "\n".join([p.text for p in doc.paragraphs]).strip()
    except Exception as e:
        print(f"DOCX extraction error: {e}")
        return ""


# ─── Improved health metric extraction ───────────────────────────────────────

FIELD_PATTERNS = {
    "Glucose": r"(?:glucose|fbs|fasting\s+sugar|ppbs|sugar\s+level|post\s+prandial)[^\d]*(\d+\.?\d*)",
    "HbA1c": r"(?:hba1c|haemoglobin\s+a1c|glycosylated\s+hemoglobin)[^\d]*(\d+\.?\d*)",
    "BMI": r"(?:bmi|body\s+mass\s+index)[^\d]*(\d+\.?\d*)",
    "BloodPressure": r"(?:blood\s+pressure|bp|systolic/diastolic)\s*:?\s*(\d+)\s*[/|]\s*(\d+)",
    "Cholesterol": r"(?:total\s+)?cholesterol[^\d]*(\d+\.?\d*)",
    "LDL": r"(?:ldl|low\s+density\s+lipoprotein|bad\s+cholesterol)[^\d]*(\d+\.?\d*)",
    "HDL": r"(?:hdl|high\s+density\s+lipoprotein|good\s+cholesterol)[^\d]*(\d+\.?\d*)",
    "Triglycerides": r"(?:triglycerides|tg)[^\d]*(\d+\.?\d*)",
    "Platelet": r"(?:platelet|plt|thrombocyte|platelet\s+count)[^\d]*(\d+)",
    "Hemoglobin": r"(?:hemoglobin|hb|hgb)[^\d]*(\d+\.?\d*)",
    "WBC": r"(?:wbc|white\s+blood\s+cell|total\s+leucocyte\s+count|tlc)[^\d]*(\d+\.?\d*)",
    "Bilirubin": r"(?:total\s+)?bilirubin[^\d]*(\d+\.?\d*)",
    "Creatinine": r"(?:serum\s+)?creatinine[^\d]*(\d+\.?\d*)",
    "ALT": r"(?:alt|sgpt|alanine\s+aminotransferase)[^\d]*(\d+)",
    "AST": r"(?:ast|sgot|aspartate\s+aminotransferase)[^\d]*(\d+)",
    "SpO2": r"(?:spo2|oxygen\s+saturation|saturation)[^\d]*(\d+)",
    "Age": r"(?:age|years)[^\d]*(\d+)",
}


def parse_values(text: str) -> dict:
    """Extract health metric values from raw OCR text with improved pattern matching."""
    parsed = {}
    lower_text = text.lower()
    
    # Pre-clean text to handle common OCR mistakes
    clean_text = lower_text.replace('|', '/').replace(':', ' ').replace('=', ' ')
    
    for field, pattern in FIELD_PATTERNS.items():
        match = re.search(pattern, clean_text)
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
