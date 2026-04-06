from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.auth.router import get_current_user
from app.auth.schemas import UserResponse
from app.patients.schemas import PatientCreate, PatientResponse, PatientUpdate
from app.patients import service

router = APIRouter()

@router.get("/patients")
def read_patients(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Retrieve all patients for the current user with fallback resilience."""
    try:
        return service.get_patients(db=db, user_id=current_user.id)
    except Exception as e:
        # Prevent 500 error on dashboard/analytics if DB is unreachable
        print(f"DEBUG: Patients API Fallback triggered: {str(e)}")
        return []

@router.post("/patients", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def create_patient(
    patient: PatientCreate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """Create a new patient."""
    return service.create_patient(db=db, patient=patient, user_id=current_user.id)

@router.get("/patients/{patient_id}", response_model=PatientResponse)
def read_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """Retrieve a specific patient by ID."""
    patient = service.get_patient(db=db, patient_id=patient_id, user_id=current_user.id)
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@router.put("/patients/{patient_id}", response_model=PatientResponse)
def update_patient(
    patient_id: int,
    patient_update: PatientUpdate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """Update a specific patient."""
    patient = service.update_patient(db=db, patient_id=patient_id, user_id=current_user.id, patient_update=patient_update)
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@router.delete("/patients/{patient_id}", response_model=PatientResponse)
def delete_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """Delete a specific patient."""
    patient = service.delete_patient(db=db, patient_id=patient_id, user_id=current_user.id)
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient
