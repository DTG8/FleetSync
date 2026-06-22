from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import schemas
import crud

router = APIRouter(
    prefix="/maintenance-logs",
    tags=["maintenance-logs"]
)

@router.get("", response_model=List[schemas.MaintenanceLogResponse])
def read_maintenance_logs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_maintenance_logs(db=db, skip=skip, limit=limit)

@router.post("", response_model=schemas.MaintenanceLogResponse, status_code=status.HTTP_201_CREATED)
def create_maintenance_log(log: schemas.MaintenanceLogCreate, db: Session = Depends(get_db)):
    return crud.create_maintenance_log(db=db, log=log)

@router.put("/{log_id}", response_model=schemas.MaintenanceLogResponse)
def update_maintenance_log(log_id: int, log_update: schemas.MaintenanceLogUpdate, db: Session = Depends(get_db)):
    return crud.update_maintenance_log(db=db, log_id=log_id, log_update=log_update)

@router.delete("/{log_id}", response_model=schemas.MaintenanceLogResponse)
def delete_maintenance_log(log_id: int, db: Session = Depends(get_db)):
    return crud.delete_maintenance_log(db=db, log_id=log_id)
