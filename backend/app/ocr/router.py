from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from app.auth.router import get_current_user
from app.ocr import service as ocr_service
from app.predict import service as predict_service

router = APIRouter()


@router.post("/ocr")
async def ocr_extract(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
):
    """Extract health data and run AI diagnosis from an uploaded medical report."""
    ALLOWED_TYPES = [
        "image/png", "image/jpeg", "image/jpg", "image/webp",
        "application/pdf", 
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword"
    ]
    
    # 1. Validation
    if file.content_type not in ALLOWED_TYPES and not any(file.filename.lower().endswith(ext) for ext in ['.png', '.jpg', '.jpeg', '.webp', '.pdf', '.docx', '.doc']):
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file type: {file.content_type}. Please upload PNG, JPG, PDF, or DOCX."
        )

    try:
        # 2. Reading file
        file_bytes = await file.read()
        if not file_bytes:
            raise HTTPException(status_code=400, detail="Empty file uploaded.")

        # 3. Text Extraction
        text = ocr_service.extract_text(file_bytes, filename=file.filename)
        
        # 3.5. Medical Relevance Validation
        keywords = [
            "patient", "blood", "glucose", "pressure", "bpm", "mg/dl", "diagnosis", 
            "clinic", "hospital", "dr.", "doctor", "heart", "scan", "test", 
            "results", "cholesterol", "bmi", "weight", "lab", "medical", 
            "disease", "symptoms", "prescription", "health", "record", "name",
            "age", "sex", "gender", "date", "report", "clinical", "history"
        ]
        text_lower = text.lower()
        match_count = sum(1 for kw in keywords if kw in text_lower)
        
        # Require at least 2 medical keywords
        if match_count < 2:
            raise HTTPException(
                status_code=422,
                detail="Security Protocol Triggered: This document does not appear to contain valid medical or clinical telemetry. The Vision AI requires hospital-grade medical reports, lab results, or imaging data."
            )

        # 4. Parsing extracted text
        parsed_values = ocr_service.parse_values(text)
        
        # 5. Intelligence Diagnosis
        diagnosis = predict_service.analyze_report_data(parsed_values)
        
        # 6. Response
        return {
            "filename": file.filename,
            "extracted_text": text[:2000],  # Truncate if extremely long for response
            "parsed_values": parsed_values,
            "diagnosis": diagnosis,
            "message": f"Successfully parsed {len(parsed_values)} parameters.",
            "is_demo": not ocr_service.OCR_AVAILABLE or text.startswith("DEMO MODE")
        }
    except Exception as e:
        # Check if it's a TesseractNotFoundError without directly referencing the module
        if "TesseractNotFoundError" in str(type(e)) or "tesseract is not installed" in str(e).lower():
            raise HTTPException(
                status_code=503,
                detail="Tesseract OCR engine not found. Please install tesseract-ocr on your system.",
            )
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"OCR engine error: {str(e)}")
