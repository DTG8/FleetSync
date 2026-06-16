from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import schemas
import crud

router = APIRouter(
    prefix="/fuel-logs",
    tags=["fuel-logs"]
)

@router.get("", response_model=List[schemas.FuelLogResponse])
def read_fuel_logs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_fuel_logs(db=db, skip=skip, limit=limit)

@router.post("", response_model=schemas.FuelLogResponse, status_code=status.HTTP_201_CREATED)
def create_fuel_log(fuel_log: schemas.FuelLogCreate, db: Session = Depends(get_db)):
    return crud.create_fuel_log(db=db, fuel_log=fuel_log)
