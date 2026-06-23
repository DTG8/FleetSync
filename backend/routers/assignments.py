from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, schemas
from database import get_db
from typing import List

router = APIRouter(
    prefix="/api/v1/assignments",
    tags=["Assignments"]
)

@router.get("/", response_model=List[schemas.AssignmentResponse])
def get_assignments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    assignments = db.query(models.Assignment).offset(skip).limit(limit).all()
    # Populate vehicle plate and driver name
    for a in assignments:
        v = db.query(models.Vehicle).filter(models.Vehicle.id == a.vehicle_id).first()
        d = db.query(models.Driver).filter(models.Driver.id == a.driver_id).first()
        a.vehicle_plate = v.plate_number if v else "Unknown"
        a.driver_name = d.full_name if d else "Unknown"
    return assignments

@router.post("/", response_model=schemas.AssignmentResponse)
def create_assignment(assignment: schemas.AssignmentCreate, db: Session = Depends(get_db)):
    db_assignment = models.Assignment(**assignment.dict(exclude_unset=True))
    db.add(db_assignment)
    
    # Update driver status to 'On Assignment'
    driver = db.query(models.Driver).filter(models.Driver.id == assignment.driver_id).first()
    if driver:
        driver.status = 'On Assignment'
        
    db.commit()
    db.refresh(db_assignment)
    
    v = db.query(models.Vehicle).filter(models.Vehicle.id == db_assignment.vehicle_id).first()
    db_assignment.vehicle_plate = v.plate_number if v else "Unknown"
    db_assignment.driver_name = driver.full_name if driver else "Unknown"
    
    return db_assignment

@router.put("/{assignment_id}", response_model=schemas.AssignmentResponse)
def update_assignment(assignment_id: int, assignment: schemas.AssignmentUpdate, db: Session = Depends(get_db)):
    db_assignment = db.query(models.Assignment).filter(models.Assignment.id == assignment_id).first()
    if not db_assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
        
    update_data = assignment.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_assignment, key, value)
        
    # If returned_at is set, driver status might revert to 'Available'
    if 'returned_at' in update_data and update_data['returned_at']:
        driver = db.query(models.Driver).filter(models.Driver.id == db_assignment.driver_id).first()
        if driver:
            driver.status = 'Available'
            
    db.commit()
    db.refresh(db_assignment)
    
    v = db.query(models.Vehicle).filter(models.Vehicle.id == db_assignment.vehicle_id).first()
    d = db.query(models.Driver).filter(models.Driver.id == db_assignment.driver_id).first()
    db_assignment.vehicle_plate = v.plate_number if v else "Unknown"
    db_assignment.driver_name = d.full_name if d else "Unknown"
    return db_assignment

@router.delete("/{assignment_id}")
def delete_assignment(assignment_id: int, db: Session = Depends(get_db)):
    db_assignment = db.query(models.Assignment).filter(models.Assignment.id == assignment_id).first()
    if not db_assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    db.delete(db_assignment)
    db.commit()
    return {"message": "Assignment deleted successfully"}
