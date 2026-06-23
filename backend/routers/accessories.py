from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, schemas
from database import get_db
from typing import List

router = APIRouter(
    prefix="/api/v1/accessories",
    tags=["Accessories"]
)

@router.get("/vehicle/{vehicle_id}", response_model=List[schemas.VehicleAccessoryResponse])
def get_vehicle_accessories(vehicle_id: int, db: Session = Depends(get_db)):
    return db.query(models.VehicleAccessory).filter(models.VehicleAccessory.vehicle_id == vehicle_id).all()

@router.post("/", response_model=schemas.VehicleAccessoryResponse)
def add_accessory(accessory: schemas.VehicleAccessoryCreate, db: Session = Depends(get_db)):
    db_accessory = models.VehicleAccessory(**accessory.dict())
    db.add(db_accessory)
    db.commit()
    db.refresh(db_accessory)
    
    # Log history
    history = models.VehicleAccessoryHistory(
        vehicle_id=db_accessory.vehicle_id,
        accessory_id=db_accessory.id,
        item_name=db_accessory.item_name,
        old_status=None,
        new_status=db_accessory.status
    )
    db.add(history)
    db.commit()
    
    return db_accessory

@router.put("/{accessory_id}", response_model=schemas.VehicleAccessoryResponse)
def update_accessory(accessory_id: int, accessory: schemas.VehicleAccessoryUpdate, db: Session = Depends(get_db)):
    db_accessory = db.query(models.VehicleAccessory).filter(models.VehicleAccessory.id == accessory_id).first()
    if not db_accessory:
        raise HTTPException(status_code=404, detail="Accessory not found")
        
    old_status = db_accessory.status
    if accessory.status and accessory.status != old_status:
        db_accessory.status = accessory.status
        db.commit()
        db.refresh(db_accessory)
        
        # Log history
        history = models.VehicleAccessoryHistory(
            vehicle_id=db_accessory.vehicle_id,
            accessory_id=db_accessory.id,
            item_name=db_accessory.item_name,
            old_status=old_status,
            new_status=db_accessory.status
        )
        db.add(history)
        db.commit()
        
    return db_accessory

@router.delete("/{accessory_id}")
def delete_accessory(accessory_id: int, db: Session = Depends(get_db)):
    db_accessory = db.query(models.VehicleAccessory).filter(models.VehicleAccessory.id == accessory_id).first()
    if not db_accessory:
        raise HTTPException(status_code=404, detail="Accessory not found")
        
    # Log history
    history = models.VehicleAccessoryHistory(
        vehicle_id=db_accessory.vehicle_id,
        accessory_id=db_accessory.id,
        item_name=db_accessory.item_name,
        old_status=db_accessory.status,
        new_status="Removed"
    )
    db.add(history)
    
    db.delete(db_accessory)
    db.commit()
    return {"message": "Accessory deleted successfully"}
