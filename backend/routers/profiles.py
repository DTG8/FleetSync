from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, schemas
from database import get_db
import datetime

router = APIRouter(
    prefix="/profiles",
    tags=["Profiles"]
)

@router.get("/drivers/{driver_id}")
def get_driver_profile(driver_id: int, db: Session = Depends(get_db)):
    driver = db.query(models.Driver).filter(models.Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
        
    allocated_vehicle = None
    if driver.allocated_vehicle_id:
        v = db.query(models.Vehicle).filter(models.Vehicle.id == driver.allocated_vehicle_id).first()
        if v:
            allocated_vehicle = {"id": v.id, "plate_number": v.plate_number, "make": v.make, "model": v.model}
            
    # Get assignments
    assignments = db.query(models.Assignment).filter(models.Assignment.driver_id == driver_id).order_by(models.Assignment.dispatched_at.desc()).all()
    assignments_data = []
    for a in assignments:
        v = db.query(models.Vehicle).filter(models.Vehicle.id == a.vehicle_id).first()
        assignments_data.append({
            "id": f"assign-{a.id}",
            "type": "Assignment",
            "vehicle_plate": v.plate_number if v else "Unknown",
            "task_description": a.task_description,
            "dispatched_at": a.dispatched_at,
            "returned_at": a.returned_at
        })
        
    allocations = db.query(models.Allocation).filter(models.Allocation.driver_id == driver_id).all()
    for al in allocations:
        v = db.query(models.Vehicle).filter(models.Vehicle.id == al.vehicle_id).first()
        assignments_data.append({
            "id": f"alloc-{al.id}",
            "type": "Allocation",
            "vehicle_plate": v.plate_number if v else "Unknown",
            "task_description": "Permanent Allocation",
            "dispatched_at": al.allocated_at,
            "returned_at": al.returned_at
        })
        
    # Sort by dispatched_at descending
    assignments_data.sort(key=lambda x: x["dispatched_at"] or datetime.datetime.min, reverse=True)
        
    # Get expenses/costs
    fuel_logs = db.query(models.FuelLog).filter(models.FuelLog.driver_id == driver_id).all()
    maintenance_logs = db.query(models.MaintenanceLog).filter(models.MaintenanceLog.driver_id == driver_id).all()
    misc_expenses = db.query(models.MiscellaneousExpense).filter(models.MiscellaneousExpense.driver_id == driver_id).all()
    
    cost_history = []
    for log in fuel_logs:
        cost_history.append({"type": "Fuel", "amount": float(log.cost), "date": log.entry_date, "description": f"{log.fuel_added_liters}L Fuel"})
    for log in maintenance_logs:
        cost_history.append({"type": "Maintenance", "amount": float(log.cost), "date": log.logged_at, "description": log.issue_description})
    for log in misc_expenses:
        cost_history.append({"type": f"Misc ({log.category})", "amount": float(log.amount), "date": log.entry_date, "description": log.description})
        
    cost_history.sort(key=lambda x: x["date"], reverse=True)
    
    return {
        "id": driver.id,
        "full_name": driver.full_name,
        "license_number": driver.license_number,
        "phone_number": driver.phone_number,
        "status": driver.status,
        "photo_url": driver.photo_url,
        "allocated_vehicle": allocated_vehicle,
        "assignments": assignments_data,
        "cost_history": cost_history
    }

@router.get("/vehicles/{vehicle_id}")
def get_vehicle_profile(vehicle_id: int, db: Session = Depends(get_db)):
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
        
    # Full history: assignments, maintenance, fueling, misc
    history = []
    
    assignments = db.query(models.Assignment).filter(models.Assignment.vehicle_id == vehicle_id).all()
    for a in assignments:
        d = db.query(models.Driver).filter(models.Driver.id == a.driver_id).first()
        history.append({
            "category": "Assignment",
            "date": a.dispatched_at.date() if a.dispatched_at else None,
            "datetime": a.dispatched_at,
            "title": f"Dispatched to {d.full_name if d else 'Unknown'}",
            "description": a.task_description or "Task assignment",
            "status": "Completed" if a.returned_at else "Active"
        })
        
    allocations = db.query(models.Allocation).filter(models.Allocation.vehicle_id == vehicle_id).all()
    for al in allocations:
        d = db.query(models.Driver).filter(models.Driver.id == al.driver_id).first()
        history.append({
            "category": "Allocation",
            "date": al.allocated_at.date() if al.allocated_at else None,
            "datetime": al.allocated_at,
            "title": f"Allocated to {d.full_name if d else 'Unknown'}",
            "description": "Permanent/Long-term Allocation",
            "status": "Returned" if al.returned_at else "Active"
        })
        
    maintenance = db.query(models.MaintenanceLog).filter(models.MaintenanceLog.vehicle_id == vehicle_id).all()
    for m in maintenance:
        history.append({
            "category": "Maintenance",
            "date": m.logged_at,
            "datetime": m.logged_at,
            "title": m.type,
            "description": m.issue_description,
            "status": m.status,
            "cost": float(m.cost)
        })
        
    fuel = db.query(models.FuelLog).filter(models.FuelLog.vehicle_id == vehicle_id).all()
    for f in fuel:
        history.append({
            "category": "Fuel",
            "date": f.entry_date,
            "datetime": f.entry_date,
            "title": "Refueled",
            "description": f"{f.fuel_added_liters}L at {f.filling_station}",
            "cost": float(f.cost)
        })
        
    misc = db.query(models.MiscellaneousExpense).filter(models.MiscellaneousExpense.vehicle_id == vehicle_id).all()
    for m in misc:
        history.append({
            "category": f"Misc ({m.category})",
            "date": m.entry_date,
            "datetime": m.entry_date,
            "title": m.category,
            "description": m.description,
            "cost": float(m.amount)
        })
        
    # Sort history by date descending
    history.sort(key=lambda x: str(x.get("datetime") or x.get("date")), reverse=True)
    
    # Calculate Total TCO
    tco = sum(item.get("cost", 0) for item in history if "cost" in item)
    
    return {
        "id": vehicle.id,
        "plate_number": vehicle.plate_number,
        "make": vehicle.make,
        "model": vehicle.model,
        "year": vehicle.year,
        "status": vehicle.status,
        "current_odometer": vehicle.current_odometer,
        "total_tco": tco,
        "history": history
    }
