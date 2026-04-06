from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class PatientBase(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    last_visit: Optional[str] = None
    status: Optional[str] = "Stable"
    age: Optional[int] = None
    disease: Optional[str] = None
    heart_rate: Optional[int] = 72
    blood_pressure: Optional[str] = "120/80"
    temperature: Optional[float] = 98.6
    oxygen_level: Optional[int] = 98

class PatientCreate(PatientBase):
    pass

class PatientUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    last_visit: Optional[str] = None
    status: Optional[str] = None
    age: Optional[int] = None
    disease: Optional[str] = None
    heart_rate: Optional[int] = None
    blood_pressure: Optional[str] = None
    temperature: Optional[float] = None
    oxygen_level: Optional[int] = None

class PatientResponse(PatientBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
