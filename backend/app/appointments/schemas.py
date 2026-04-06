from pydantic import BaseModel
from datetime import datetime
from typing import Optional
import enum

class AppointmentStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"

class AppointmentBase(BaseModel):
    patient_name: str
    patient_age: str
    patient_gender: str
    doctor_name: str
    doctor_role: str
    appointment_time: Optional[datetime] = None
    status: Optional[AppointmentStatus] = AppointmentStatus.PENDING

class AppointmentCreate(AppointmentBase):
    pass

class AppointmentUpdate(BaseModel):
    status: AppointmentStatus

class AppointmentResponse(AppointmentBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True
