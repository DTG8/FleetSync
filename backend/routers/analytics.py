from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
import datetime
from typing import List
from database import get_db
import models
import schemas

router = APIRouter(
    prefix="/analytics",
    tags=["analytics"]
)

@router.get("/dashboard", response_model=schemas.DashboardMetrics)
def get_dashboard_metrics(db: Session = Depends(get_db)):
    # 1. Total active fleet vs. faulty vs. in-repair
    total_fleet = db.query(func.count(models.Vehicle.id)).scalar() or 0
    active_fleet = db.query(func.count(models.Vehicle.id)).filter(models.Vehicle.status == "Active").scalar() or 0
    faulty_vehicles = db.query(func.count(models.Vehicle.id)).filter(models.Vehicle.status == "Faulty").scalar() or 0
    in_repair_vehicles = db.query(func.count(models.Vehicle.id)).filter(models.Vehicle.status == "In Repair").scalar() or 0

    # 2. Total fuel expenditures this week vs. last week (past 7 days vs prior 7 days)
    today = datetime.date.today()
    this_week_start = today - datetime.timedelta(days=6)
    last_week_start = today - datetime.timedelta(days=13)
    last_week_end = today - datetime.timedelta(days=7)

    total_fuel_this_week = db.query(func.sum(models.FuelLog.cost)).filter(
        models.FuelLog.entry_date >= this_week_start,
        models.FuelLog.entry_date <= today
    ).scalar() or 0.0

    total_fuel_last_week = db.query(func.sum(models.FuelLog.cost)).filter(
        models.FuelLog.entry_date >= last_week_start,
        models.FuelLog.entry_date <= last_week_end
    ).scalar() or 0.0

    # 3. Papers expiring soon or expired (within 30 days or already expired)
    papers_expiring_soon = db.query(func.count(models.VehiclePaper.id)).filter(
        models.VehiclePaper.expiry_date <= (today + datetime.timedelta(days=30))
    ).scalar() or 0

    return schemas.DashboardMetrics(
        total_fleet=total_fleet,
        active_fleet=active_fleet,
        faulty_vehicles=faulty_vehicles,
        in_repair_vehicles=in_repair_vehicles,
        papers_expiring_soon=papers_expiring_soon,
        total_fuel_this_week=float(total_fuel_this_week),
        total_fuel_last_week=float(total_fuel_last_week)
    )

@router.get("/weekly-fuel", response_model=List[schemas.WeeklyFuelItem])
def get_weekly_fuel(db: Session = Depends(get_db)):
    # Group FuelLog.fuel_added_liters by vehicle for past 7 days
    today = datetime.date.today()
    seven_days_ago = today - datetime.timedelta(days=6)

    # To ensure all vehicles show up, we could LEFT OUTER JOIN, but standard JOIN is fine.
    # Let's do a left outer join so that even if a vehicle has no logs, it is in the list with 0.0, or we can filter it.
    # The requirement says "groups FuelLog.fuel_added_liters by vehicle for the past 7 days."
    # Let's do a JOIN so we only show vehicles with active logs, or left join to show all. Left join is usually nicer for charts!
    # Let's do a left join but filter/group appropriately.
    results = db.query(
        models.Vehicle.id,
        models.Vehicle.plate_number,
        func.sum(models.FuelLog.fuel_added_liters).label("total_liters")
    ).outerjoin(
        models.FuelLog, 
        (models.Vehicle.id == models.FuelLog.vehicle_id) & 
        (models.FuelLog.entry_date >= seven_days_ago) & 
        (models.FuelLog.entry_date <= today)
    ).group_by(
        models.Vehicle.id, models.Vehicle.plate_number
    ).all()

    weekly_fuel = []
    for item in results:
        weekly_fuel.append(
            schemas.WeeklyFuelItem(
                vehicle_id=item.id,
                plate_number=item.plate_number,
                total_liters=float(item.total_liters) if item.total_liters is not None else 0.0
            )
        )
    return weekly_fuel

@router.get("/maintenance-recurrent", response_model=List[schemas.MaintenanceRecurrentItem])
def get_maintenance_recurrent(db: Session = Depends(get_db)):
    # Groups MaintenanceLog by vehicle_id, counts total logs, sums total repair costs, sorted from highest to lowest
    results = db.query(
        models.Vehicle.id,
        models.Vehicle.plate_number,
        func.count(models.MaintenanceLog.id).label("repair_count"),
        func.sum(models.MaintenanceLog.cost).label("total_cost")
    ).join(
        models.MaintenanceLog, models.Vehicle.id == models.MaintenanceLog.vehicle_id
    ).group_by(
        models.Vehicle.id, models.Vehicle.plate_number
    ).order_by(
        func.count(models.MaintenanceLog.id).desc(),
        func.sum(models.MaintenanceLog.cost).desc()
    ).all()

    maintenance_recurrent = []
    for item in results:
        maintenance_recurrent.append(
            schemas.MaintenanceRecurrentItem(
                vehicle_id=item.id,
                plate_number=item.plate_number,
                repair_count=item.repair_count,
                total_cost=float(item.total_cost) if item.total_cost is not None else 0.0
            )
        )
    return maintenance_recurrent
