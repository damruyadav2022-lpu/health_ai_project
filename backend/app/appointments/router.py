from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.database import get_db
from app.auth.router import get_current_user
from app.appointments.models import Appointment
from app.appointments.schemas import AppointmentCreate, AppointmentResponse, AppointmentUpdate

router = APIRouter()

@router.get("/appointments", response_model=List[AppointmentResponse])
def get_appointments(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Retrieve all clinic appointments for the current doctor/admin."""
    return db.query(Appointment).filter(Appointment.user_id == current_user.id).order_by(Appointment.created_at.desc()).all()

@router.post("/appointments", response_model=AppointmentResponse)
def create_appointment(
    apt: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Register a new clinical visit."""
    db_apt = Appointment(
        user_id=current_user.id,
        patient_name=apt.patient_name,
        patient_age=apt.patient_age,
        patient_gender=apt.patient_gender,
        doctor_name=apt.doctor_name,
        doctor_role=apt.doctor_role,
        appointment_time=apt.appointment_time or datetime.utcnow(),
        status=apt.status
    )
    db.add(db_apt)
    db.commit()
    db.refresh(db_apt)
    return db_apt

@router.put("/appointments/{apt_id}", response_model=AppointmentResponse)
def update_appointment(
    apt_id: int,
    apt_update: AppointmentUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Update clinical session status (Confirm/Cancel)."""
    db_apt = db.query(Appointment).filter(Appointment.id == apt_id, Appointment.user_id == current_user.id).first()
    if not db_apt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    db_apt.status = apt_update.status
    db.commit()
    db.refresh(db_apt)
    return db_apt
