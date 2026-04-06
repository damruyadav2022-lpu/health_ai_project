from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, index=True, nullable=False)
    email = Column(String, index=True)
    phone = Column(String)
    last_visit = Column(String)
    status = Column(String, default="Stable")
    age = Column(Integer)
    disease = Column(String)
    
    # Real-time vitals features
    heart_rate = Column(Integer, default=72)
    blood_pressure = Column(String, default="120/80")
    temperature = Column(Float, default=98.6)
    oxygen_level = Column(Integer, default=98)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
