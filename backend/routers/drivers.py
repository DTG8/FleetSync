import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import schemas
import crud
import models

router = APIRouter(
    prefix="/drivers",
    tags=["drivers"]
)

@router.post("", response_model=schemas.DriverResponse, status_code=status.HTTP_201_CREATED)
def create_driver(driver: schemas.DriverCreate, db: Session = Depends(get_db)):
    return crud.create_driver(db=db, driver=driver)

@router.post("/{driver_id}/photo")
def upload_driver_photo(driver_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    db_driver = crud.get_driver(db=db, driver_id=driver_id)
    if not db_driver:
        raise HTTPException(status_code=404, detail="Driver not found")
        
    # Ensure uploads directory exists
    uploads_dir = os.path.join(os.path.dirname(__file__), "..", "uploads", "drivers")
    os.makedirs(uploads_dir, exist_ok=True)
    
    # Generate safe filename and save
    file_ext = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
    filename = f"driver_{driver_id}.{file_ext}"
    filepath = os.path.join(uploads_dir, filename)
    
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Update driver record
    photo_url = f"/uploads/drivers/{filename}"
    db_driver.photo_url = photo_url
    db.commit()
    db.refresh(db_driver)
    
    return {"photo_url": photo_url}

@router.get("", response_model=List[schemas.DriverResponse])
def read_drivers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_drivers(db=db, skip=skip, limit=limit)

@router.get("/{driver_id}", response_model=schemas.DriverResponse)
def read_driver(driver_id: int, db: Session = Depends(get_db)):
    db_driver = crud.get_driver(db=db, driver_id=driver_id)
    if not db_driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    return db_driver

@router.put("/{driver_id}", response_model=schemas.DriverResponse)
def update_driver(driver_id: int, driver_update: schemas.DriverUpdate, db: Session = Depends(get_db)):
    return crud.update_driver(db=db, driver_id=driver_id, driver_update=driver_update)

@router.delete("/{driver_id}", response_model=schemas.DriverResponse)
def delete_driver(driver_id: int, db: Session = Depends(get_db)):
    return crud.delete_driver(db=db, driver_id=driver_id)
