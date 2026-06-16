from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import schemas
import crud

router = APIRouter(
    prefix="/drivers",
    tags=["drivers"]
)

@router.post("", response_model=schemas.DriverResponse, status_code=status.HTTP_201_CREATED)
def create_driver(driver: schemas.DriverCreate, db: Session = Depends(get_db)):
    return crud.create_driver(db=db, driver=driver)

@router.get("", response_model=List[schemas.DriverResponse])
def read_drivers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_drivers(db=db, skip=skip, limit=limit)

@router.get("/{driver_id}", response_model=schemas.DriverResponse)
def read_driver(driver_id: int, db: Session = Depends(get_db)):
    db_driver = crud.get_driver(db=db, driver_id=driver_id)
    if not db_driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    return db_driver
