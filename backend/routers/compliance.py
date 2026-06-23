from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
import datetime
from typing import List
from database import get_db
import models
import schemas
import crud

router = APIRouter(
    prefix="/compliance",
    tags=["compliance"]
)

@router.get("/expiring-papers", response_model=List[schemas.ExpiringPaperItem])
def get_expiring_papers(db: Session = Depends(get_db)):
    today = datetime.date.today()
    papers = db.query(models.VehiclePaper).all()
    
    result = []
    for paper in papers:
        days_remaining = (paper.expiry_date - today).days
        
        # Get the vehicle plate and make_model
        vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == paper.vehicle_id).first()
        plate_number = vehicle.plate_number if vehicle else "Unknown"
        make_model = f"{vehicle.make} {vehicle.model}" if vehicle else "Unknown"
        
        if days_remaining < 0:
            status_str = "Expired"
        elif days_remaining < 30:
            status_str = "Expiring Soon"
        else:
            status_str = "Valid"
        
        result.append(
            schemas.ExpiringPaperItem(
                id=paper.id,
                vehicle_id=paper.vehicle_id,
                plate_number=plate_number,
                make_model=make_model,
                document_type=paper.document_type,
                expiry_date=paper.expiry_date,
                days_remaining=days_remaining,
                status=status_str
            )
        )
            
    # Sort by days_remaining ascending (most urgent first)
    result.sort(key=lambda x: x.days_remaining)
    return result

@router.post("/papers", response_model=schemas.VehiclePaperResponse, status_code=status.HTTP_201_CREATED)
def create_vehicle_paper(paper: schemas.VehiclePaperCreate, db: Session = Depends(get_db)):
    return crud.create_vehicle_paper(db=db, paper=paper)

@router.put("/papers/{paper_id}", response_model=schemas.VehiclePaperResponse)
def update_vehicle_paper(paper_id: int, paper_update: schemas.VehiclePaperUpdate, db: Session = Depends(get_db)):
    return crud.update_vehicle_paper(db=db, paper_id=paper_id, paper_update=paper_update)

@router.delete("/papers/{paper_id}", response_model=schemas.VehiclePaperResponse)
def delete_vehicle_paper(paper_id: int, db: Session = Depends(get_db)):
    return crud.delete_vehicle_paper(db=db, paper_id=paper_id)
