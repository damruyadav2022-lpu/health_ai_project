from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum
from datetime import datetime
from app.database import Base

class AppointmentStatus(enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    patient_name = Column(String)
    patient_age = Column(String)
    patient_gender = Column(String)
    doctor_name = Column(String)
    doctor_role = Column(String)
    appointment_time = Column(DateTime, default=datetime.utcnow)
    status = Column(SQLEnum(AppointmentStatus), default=AppointmentStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="appointments")
