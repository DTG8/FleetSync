from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import schemas
import crud

router = APIRouter(
    prefix="/vehicles",
    tags=["vehicles"]
)

@router.post("", response_model=schemas.VehicleResponse, status_code=status.HTTP_201_CREATED)
def create_vehicle(vehicle: schemas.VehicleCreate, db: Session = Depends(get_db)):
    return crud.create_vehicle(db=db, vehicle=vehicle)

@router.get("", response_model=List[schemas.VehicleResponse])
def read_vehicles(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_vehicles(db=db, skip=skip, limit=limit)

@router.get("/{vehicle_id}", response_model=schemas.VehicleResponse)
def read_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    db_vehicle = crud.get_vehicle(db=db, vehicle_id=vehicle_id)
    if not db_vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return db_vehicle

@router.put("/{vehicle_id}", response_model=schemas.VehicleResponse)
def update_vehicle(vehicle_id: int, vehicle_update: schemas.VehicleUpdate, db: Session = Depends(get_db)):
    return crud.update_vehicle(db=db, vehicle_id=vehicle_id, vehicle_update=vehicle_update)
