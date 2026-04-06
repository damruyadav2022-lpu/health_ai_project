from sqlalchemy.orm import Session
from app.patients.models import Patient
from app.patients.schemas import PatientCreate, PatientUpdate

def get_patients(db: Session, user_id: int):
    return db.query(Patient).filter(Patient.user_id == user_id).all()

def get_patient(db: Session, patient_id: int, user_id: int):
    return db.query(Patient).filter(Patient.id == patient_id, Patient.user_id == user_id).first()

def create_patient(db: Session, patient: PatientCreate, user_id: int):
    db_patient = Patient(**patient.model_dump(), user_id=user_id)
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient

def update_patient(db: Session, patient_id: int, user_id: int, patient_update: PatientUpdate):
    db_patient = get_patient(db, patient_id=patient_id, user_id=user_id)
    if db_patient:
        update_data = patient_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_patient, key, value)
        db.commit()
        db.refresh(db_patient)
    return db_patient

def delete_patient(db: Session, patient_id: int, user_id: int):
    db_patient = get_patient(db, patient_id=patient_id, user_id=user_id)
    if db_patient:
        db.delete(db_patient)
        db.commit()
    return db_patient
