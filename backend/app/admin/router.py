from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import httpx
from app.config import settings
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

class KeyStatusResponse(BaseModel):
    id: str
    name: str
    created_at: str
    status: str = "active"

@router.get("/key-status/{key_id}", response_model=KeyStatusResponse)
async def get_anthropic_key_status(key_id: str):
    """
    Retrieve Anthropic API Key Status using Organizational Admin API.
    Inspired by: curl https://api.anthropic.com/v1/organizations/api_keys/$API_KEY_ID
    """
    admin_key = settings.ANTHROPIC_ADMIN_API_KEY
    
    # If no admin key provided, return mock "active" status for demo purposes
    if not admin_key or "REPLACE" in admin_key:
        logger.warning("⚠️ ANTHROPIC_ADMIN_API_KEY not configured. Returning mock status.")
        return {
            "id": key_id,
            "name": "Clinical Nexus - Primary Key",
            "created_at": "2026-04-01T00:00:00Z",
            "status": "Active (Demo)"
        }

    try:
        async with httpx.AsyncClient() as client:
            headers = {
                "X-Api-Key": admin_key,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json"
            }
            response = await client.get(
                f"https://api.anthropic.com/v1/organizations/api_keys/{key_id}",
                headers=headers,
                timeout=10.0
            )
            
            if response.status_code != 200:
                logger.error(f"❌ Anthropic API Error: {response.text}")
                raise HTTPException(status_code=response.status_code, detail="Failed to fetch key details from Anthropic.")
            
            return response.json()
            
    except httpx.RequestError as e:
        logger.error(f"⚠️ Network error while checking Anthropic key: {str(e)}")
        raise HTTPException(status_code=503, detail="Anthropic Service Unavailable")
    except Exception as e:
        logger.error(f"‼️ Unexpected error in Admin Key Router: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
