from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from sqlalchemy.sql import func
from app.database import Base


class PredictionHistory(Base):
    __tablename__ = "prediction_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)
    input_type = Column(String, default="structured")  # "structured" | "symptoms" | "ocr"
    top_disease = Column(String, nullable=True)
    probability = Column(Float, nullable=True)
    risk_level = Column(String, nullable=True)
    all_diseases = Column(Text, nullable=True)  # JSON string
    explanation = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
