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
        if days_remaining < 30:
            # Get the vehicle plate
            vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == paper.vehicle_id).first()
            plate_number = vehicle.plate_number if vehicle else "Unknown"
            status_str = "Expired" if days_remaining < 0 else "Expiring Soon"
            
            result.append(
                schemas.ExpiringPaperItem(
                    id=paper.id,
                    vehicle_id=paper.vehicle_id,
                    plate_number=plate_number,
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
