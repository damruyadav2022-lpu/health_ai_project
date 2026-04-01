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
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are supported (PNG, JPG, etc.)")

    try:
        image_bytes = await file.read()
        text = ocr_service.extract_text(image_bytes)
        parsed_values = ocr_service.parse_values(text)
        
        # Run intelligence analysis
        diagnosis = predict_service.analyze_report_data(parsed_values)
        
        return {
            "filename": file.filename,
            "extracted_text": text,
            "parsed_values": parsed_values,
            "diagnosis": diagnosis,
            "message": f"Successfully analyzed {len(parsed_values)} parameters.",
        }
    except RuntimeError as e:
        raise HTTPException(
            status_code=503,
            detail=f"OCR service unavailable: {str(e)}. Please install Tesseract OCR.",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(e)}")
