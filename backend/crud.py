from sqlalchemy.orm import Session
from sqlalchemy import func
import models
import schemas
import datetime
from fastapi import HTTPException, status

# --- VEHICLE CRUD ---
def get_vehicle(db: Session, vehicle_id: int):
    return db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id).first()

def get_vehicle_by_plate(db: Session, plate_number: str):
    return db.query(models.Vehicle).filter(models.Vehicle.plate_number == plate_number).first()

def get_vehicles(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Vehicle).offset(skip).limit(limit).all()

def create_vehicle(db: Session, vehicle: schemas.VehicleCreate):
    # Check duplicate plate number
    db_vehicle = get_vehicle_by_plate(db, vehicle.plate_number)
    if db_vehicle:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vehicle with this plate number already exists."
        )
    db_vehicle = models.Vehicle(
        plate_number=vehicle.plate_number,
        make=vehicle.make,
        model=vehicle.model,
        year=vehicle.year,
        status=vehicle.status,
        current_odometer=vehicle.current_odometer,
        current_fuel_level_percent=vehicle.current_fuel_level_percent,
        purchase_date=vehicle.purchase_date
    )
    db.add(db_vehicle)
    db.commit()
    db.refresh(db_vehicle)
    return db_vehicle

def update_vehicle(db: Session, vehicle_id: int, vehicle_update: schemas.VehicleUpdate):
    db_vehicle = get_vehicle(db, vehicle_id)
    if not db_vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )
    update_data = vehicle_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_vehicle, key, value)
    db.commit()
    db.refresh(db_vehicle)
    return db_vehicle

def delete_vehicle(db: Session, vehicle_id: int):
    db_vehicle = get_vehicle(db, vehicle_id)
    if not db_vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
    db.delete(db_vehicle)
    db.commit()
    return db_vehicle


# --- DRIVER CRUD ---
def get_driver(db: Session, driver_id: int):
    return db.query(models.Driver).filter(models.Driver.id == driver_id).first()

def get_driver_by_license(db: Session, license_number: str):
    return db.query(models.Driver).filter(models.Driver.license_number == license_number).first()

def get_drivers(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Driver).offset(skip).limit(limit).all()

def create_driver(db: Session, driver: schemas.DriverCreate):
    db_driver = get_driver_by_license(db, driver.license_number)
    if db_driver:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Driver with this license number already exists."
        )
    db_driver = models.Driver(
        full_name=driver.full_name,
        license_number=driver.license_number,
        phone_number=driver.phone_number,
        status=driver.status
    )
    db.add(db_driver)
    db.commit()
    db.refresh(db_driver)
    return db_driver

def update_driver(db: Session, driver_id: int, driver_update: schemas.DriverUpdate):
    db_driver = get_driver(db, driver_id)
    if not db_driver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")
    update_data = driver_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_driver, key, value)
    db.commit()
    db.refresh(db_driver)
    return db_driver

def delete_driver(db: Session, driver_id: int):
    db_driver = get_driver(db, driver_id)
    if not db_driver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")
    db.delete(db_driver)
    db.commit()
    return db_driver


# --- ALLOCATION CRUD ---
def get_allocations(db: Session, skip: int = 0, limit: int = 100):
    allocs = db.query(models.Allocation).offset(skip).limit(limit).all()
    for alloc in allocs:
        vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == alloc.vehicle_id).first()
        driver = db.query(models.Driver).filter(models.Driver.id == alloc.driver_id).first()
        alloc.vehicle_plate = vehicle.plate_number if vehicle else None
        alloc.driver_name = driver.full_name if driver else None
    return allocs

def get_active_allocation_by_vehicle(db: Session, vehicle_id: int):
    return db.query(models.Allocation).filter(
        models.Allocation.vehicle_id == vehicle_id,
        models.Allocation.returned_at.is_(None)
    ).first()

def get_active_allocation_by_driver(db: Session, driver_id: int):
    return db.query(models.Allocation).filter(
        models.Allocation.driver_id == driver_id,
        models.Allocation.returned_at.is_(None)
    ).first()

def create_allocation(db: Session, allocation: schemas.AllocationCreate):
    vehicle = get_vehicle(db, allocation.vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
    
    driver = get_driver(db, allocation.driver_id)
    if not driver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")

    if vehicle.status == "In Repair":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vehicle is currently in repair and cannot be allocated."
        )
    
    active_vehicle_alloc = get_active_allocation_by_vehicle(db, allocation.vehicle_id)
    if active_vehicle_alloc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vehicle is already allocated to another driver."
        )

    active_driver_alloc = get_active_allocation_by_driver(db, allocation.driver_id)
    if active_driver_alloc or driver.status == "Assigned":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Driver is already allocated to another vehicle."
        )

    db_alloc = models.Allocation(
        vehicle_id=allocation.vehicle_id,
        driver_id=allocation.driver_id,
        allocated_at=datetime.datetime.utcnow()
    )
    db.add(db_alloc)
    driver.status = "Assigned"
    db.commit()
    db.refresh(db_alloc)
    
    db_alloc.vehicle_plate = vehicle.plate_number
    db_alloc.driver_name = driver.full_name
    return db_alloc

def return_allocation(db: Session, allocation_id: int):
    db_alloc = db.query(models.Allocation).filter(models.Allocation.id == allocation_id).first()
    if not db_alloc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Allocation not found")
    
    if db_alloc.returned_at is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Allocation already returned")
        
    db_alloc.returned_at = datetime.datetime.utcnow()
    
    driver = db.query(models.Driver).filter(models.Driver.id == db_alloc.driver_id).first()
    if driver:
        driver.status = "Available"
        
    db.commit()
    db.refresh(db_alloc)
    
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == db_alloc.vehicle_id).first()
    db_alloc.vehicle_plate = vehicle.plate_number if vehicle else None
    db_alloc.driver_name = driver.full_name if driver else None
    return db_alloc

def delete_allocation(db: Session, allocation_id: int):
    db_alloc = db.query(models.Allocation).filter(models.Allocation.id == allocation_id).first()
    if not db_alloc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Allocation not found")
    
    # Revert driver status if active
    if db_alloc.returned_at is None:
        driver = db.query(models.Driver).filter(models.Driver.id == db_alloc.driver_id).first()
        if driver:
            driver.status = "Available"

    db.delete(db_alloc)
    db.commit()
    return db_alloc


# --- FUEL LOG CRUD ---
def get_fuel_logs(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.FuelLog).offset(skip).limit(limit).all()

def create_fuel_log(db: Session, fuel_log: schemas.FuelLogCreate):
    vehicle = get_vehicle(db, fuel_log.vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")

    if fuel_log.odometer_reading < vehicle.current_odometer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Odometer reading ({fuel_log.odometer_reading}) cannot be less than current vehicle odometer ({vehicle.current_odometer})."
        )

    # Auto-resolve driver_id "whenever possible"
    if fuel_log.driver_id is None:
        alloc = get_active_allocation_by_vehicle(db, fuel_log.vehicle_id)
        if alloc:
            fuel_log.driver_id = alloc.driver_id

    db_fuel_log = models.FuelLog(
        vehicle_id=fuel_log.vehicle_id,
        driver_id=fuel_log.driver_id,
        entry_date=fuel_log.entry_date,
        odometer_reading=fuel_log.odometer_reading,
        fuel_added_liters=fuel_log.fuel_added_liters,
        cost=fuel_log.cost,
        fuel_gauge_after_fill_percent=fuel_log.fuel_gauge_after_fill_percent,
        filling_station=fuel_log.filling_station or "Unknown"
    )
    db.add(db_fuel_log)

    vehicle.current_odometer = fuel_log.odometer_reading
    vehicle.current_fuel_level_percent = fuel_log.fuel_gauge_after_fill_percent

    db.commit()
    db.refresh(db_fuel_log)
    return db_fuel_log

def update_fuel_log(db: Session, fuel_log_id: int, log_update: schemas.FuelLogUpdate):
    db_log = db.query(models.FuelLog).filter(models.FuelLog.id == fuel_log_id).first()
    if not db_log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fuel log not found")
    
    update_data = log_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_log, key, value)
    db.commit()
    db.refresh(db_log)
    return db_log

def delete_fuel_log(db: Session, fuel_log_id: int):
    db_log = db.query(models.FuelLog).filter(models.FuelLog.id == fuel_log_id).first()
    if not db_log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fuel log not found")
    db.delete(db_log)
    db.commit()
    return db_log


# --- MAINTENANCE LOG CRUD ---
def get_maintenance_logs(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.MaintenanceLog).offset(skip).limit(limit).all()

def create_maintenance_log(db: Session, log: schemas.MaintenanceLogCreate):
    vehicle = get_vehicle(db, log.vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")

    # Auto-resolve driver_id "whenever possible"
    if log.driver_id is None:
        alloc = get_active_allocation_by_vehicle(db, log.vehicle_id)
        if alloc:
            log.driver_id = alloc.driver_id

    db_log = models.MaintenanceLog(
        vehicle_id=log.vehicle_id,
        driver_id=log.driver_id,
        issue_description=log.issue_description,
        type=log.type,
        status=log.status,
        cost=log.cost,
        logged_at=log.logged_at,
        resolved_at=log.resolved_at
    )
    db.add(db_log)

    if log.status == "In Progress":
        vehicle.status = "In Repair"
    elif log.status == "Pending":
        vehicle.status = "Faulty"
    elif log.status == "Resolved":
        unresolved = db.query(models.MaintenanceLog).filter(
            models.MaintenanceLog.vehicle_id == log.vehicle_id,
            models.MaintenanceLog.status.in_(["Pending", "In Progress"]),
            models.MaintenanceLog.id != db_log.id
        ).first()
        if not unresolved:
            vehicle.status = "Active"

    db.commit()
    db.refresh(db_log)
    return db_log

def update_maintenance_log(db: Session, log_id: int, log_update: schemas.MaintenanceLogUpdate):
    db_log = db.query(models.MaintenanceLog).filter(models.MaintenanceLog.id == log_id).first()
    if not db_log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Maintenance log not found")
    
    update_data = log_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_log, key, value)
    db.commit()
    db.refresh(db_log)
    return db_log

def delete_maintenance_log(db: Session, log_id: int):
    db_log = db.query(models.MaintenanceLog).filter(models.MaintenanceLog.id == log_id).first()
    if not db_log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Maintenance log not found")
    db.delete(db_log)
    db.commit()
    return db_log


# --- VEHICLE PAPER CRUD ---
def get_vehicle_papers(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.VehiclePaper).offset(skip).limit(limit).all()

def create_vehicle_paper(db: Session, paper: schemas.VehiclePaperCreate):
    vehicle = get_vehicle(db, paper.vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")

    db_paper = models.VehiclePaper(
        vehicle_id=paper.vehicle_id,
        document_type=paper.document_type,
        expiry_date=paper.expiry_date,
        last_reminder_sent=paper.last_reminder_sent
    )
    db.add(db_paper)
    db.commit()
    db.refresh(db_paper)
    return db_paper

def update_vehicle_paper(db: Session, paper_id: int, paper_update: schemas.VehiclePaperUpdate):
    db_paper = db.query(models.VehiclePaper).filter(models.VehiclePaper.id == paper_id).first()
    if not db_paper:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle paper not found")
    update_data = paper_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_paper, key, value)
    db.commit()
    db.refresh(db_paper)
    return db_paper

def delete_vehicle_paper(db: Session, paper_id: int):
    db_paper = db.query(models.VehiclePaper).filter(models.VehiclePaper.id == paper_id).first()
    if not db_paper:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle paper not found")
    db.delete(db_paper)
    db.commit()
    return db_paper


# --- MISCELLANEOUS EXPENSE CRUD ---
def get_miscellaneous_expenses(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.MiscellaneousExpense).offset(skip).limit(limit).all()

def create_miscellaneous_expense(db: Session, expense: schemas.MiscellaneousExpenseCreate):
    vehicle = get_vehicle(db, expense.vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")

    # Auto-resolve driver_id "whenever possible"
    if expense.driver_id is None:
        alloc = get_active_allocation_by_vehicle(db, expense.vehicle_id)
        if alloc:
            expense.driver_id = alloc.driver_id

    db_expense = models.MiscellaneousExpense(
        vehicle_id=expense.vehicle_id,
        driver_id=expense.driver_id,
        amount=expense.amount,
        description=expense.description,
        entry_date=expense.entry_date,
        category=expense.category
    )
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense

def update_miscellaneous_expense(db: Session, expense_id: int, expense_update: schemas.MiscellaneousExpenseUpdate):
    db_expense = db.query(models.MiscellaneousExpense).filter(models.MiscellaneousExpense.id == expense_id).first()
    if not db_expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    
    update_data = expense_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_expense, key, value)
    db.commit()
    db.refresh(db_expense)
    return db_expense

def delete_miscellaneous_expense(db: Session, expense_id: int):
    db_expense = db.query(models.MiscellaneousExpense).filter(models.MiscellaneousExpense.id == expense_id).first()
    if not db_expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    db.delete(db_expense)
    db.commit()
    return db_expense


# --- FINANCIAL REPORT AGGREGATION ---
def get_financial_report(db: Session, period: str):
    today = datetime.date.today()
    if period == "weekly":
        start_date = today - datetime.timedelta(days=6)
    elif period == "monthly":
        start_date = today - datetime.timedelta(days=29)
    elif period == "quarterly":
        start_date = today - datetime.timedelta(days=89)
    elif period == "yearly":
        start_date = today - datetime.timedelta(days=364)
    else:
        start_date = today - datetime.timedelta(days=6)

    # 1. VEHICLE FINANCIALS BREAKDOWN
    vehicles = db.query(models.Vehicle).all()
    vehicle_report = []

    # Aggregates for vehicles
    fuel_by_v = db.query(
        models.FuelLog.vehicle_id,
        func.sum(models.FuelLog.cost).label("cost")
    ).filter(models.FuelLog.entry_date >= start_date).group_by(models.FuelLog.vehicle_id).all()
    fuel_v_dict = {item.vehicle_id: float(item.cost) for item in fuel_by_v if item.cost is not None}

    repairs_by_v = db.query(
        models.MaintenanceLog.vehicle_id,
        func.sum(models.MaintenanceLog.cost).label("cost")
    ).filter(models.MaintenanceLog.logged_at >= start_date).group_by(models.MaintenanceLog.vehicle_id).all()
    repairs_v_dict = {item.vehicle_id: float(item.cost) for item in repairs_by_v if item.cost is not None}

    misc_by_v = db.query(
        models.MiscellaneousExpense.vehicle_id,
        func.sum(models.MiscellaneousExpense.amount).label("amount")
    ).filter(models.MiscellaneousExpense.entry_date >= start_date).group_by(models.MiscellaneousExpense.vehicle_id).all()
    misc_v_dict = {item.vehicle_id: float(item.amount) for item in misc_by_v if item.amount is not None}

    # Odometer difference in timeframe
    odo_data = db.query(
        models.FuelLog.vehicle_id,
        func.min(models.FuelLog.odometer_reading).label("min_odo"),
        func.max(models.FuelLog.odometer_reading).label("max_odo")
    ).filter(models.FuelLog.entry_date >= start_date).group_by(models.FuelLog.vehicle_id).all()
    odo_dict = {item.vehicle_id: (item.min_odo, item.max_odo) for item in odo_data}

    for v in vehicles:
        fuel_cost = fuel_v_dict.get(v.id, 0.0)
        repair_cost = repairs_v_dict.get(v.id, 0.0)
        misc_cost = misc_v_dict.get(v.id, 0.0)
        total_tco = fuel_cost + repair_cost + misc_cost

        min_odo, max_odo = odo_dict.get(v.id, (0, 0))
        distance = max_odo - min_odo
        if distance < 0:
            distance = 0
        
        cost_per_km = float(total_tco / distance) if distance > 0 else 0.0

        vehicle_report.append(
            schemas.VehicleFinancialItem(
                vehicle_id=v.id,
                plate_number=v.plate_number,
                fuel_cost=fuel_cost,
                repair_cost=repair_cost,
                misc_cost=misc_cost,
                total_tco=total_tco,
                distance_traveled=distance,
                cost_per_km=cost_per_km
            )
        )

    # 2. DRIVER FINANCIALS BREAKDOWN
    drivers = db.query(models.Driver).all()
    driver_report = []

    # Aggregates for drivers (filter out nullable driver_id)
    fuel_by_d = db.query(
        models.FuelLog.driver_id,
        func.sum(models.FuelLog.cost).label("cost")
    ).filter(
        models.FuelLog.entry_date >= start_date,
        models.FuelLog.driver_id.isnot(None)
    ).group_by(models.FuelLog.driver_id).all()
    fuel_d_dict = {item.driver_id: float(item.cost) for item in fuel_by_d if item.cost is not None}

    repairs_by_d = db.query(
        models.MaintenanceLog.driver_id,
        func.sum(models.MaintenanceLog.cost).label("cost")
    ).filter(
        models.MaintenanceLog.logged_at >= start_date,
        models.MaintenanceLog.driver_id.isnot(None)
    ).group_by(models.MaintenanceLog.driver_id).all()
    repairs_d_dict = {item.driver_id: float(item.cost) for item in repairs_by_d if item.cost is not None}

    misc_by_d = db.query(
        models.MiscellaneousExpense.driver_id,
        func.sum(models.MiscellaneousExpense.amount).label("amount")
    ).filter(
        models.MiscellaneousExpense.entry_date >= start_date,
        models.MiscellaneousExpense.driver_id.isnot(None)
    ).group_by(models.MiscellaneousExpense.driver_id).all()
    misc_d_dict = {item.driver_id: float(item.amount) for item in misc_by_d if item.amount is not None}

    for d in drivers:
        fuel_cost = fuel_d_dict.get(d.id, 0.0)
        repair_cost = repairs_d_dict.get(d.id, 0.0)
        misc_cost = misc_d_dict.get(d.id, 0.0)
        total_tco = fuel_cost + repair_cost + misc_cost

        driver_report.append(
            schemas.DriverFinancialItem(
                driver_id=d.id,
                driver_name=d.full_name,
                fuel_cost=fuel_cost,
                repair_cost=repair_cost,
                misc_cost=misc_cost,
                total_tco=total_tco
            )
        )

    return schemas.FinancialReportResponse(
        vehicles=vehicle_report,
        drivers=driver_report,
        period=period
    )

def get_filling_station_analytics(db: Session, period: str):
    today = datetime.date.today()
    if period == "weekly":
        start_date = today - datetime.timedelta(days=6)
    elif period == "monthly":
        start_date = today - datetime.timedelta(days=29)
    elif period == "quarterly":
        start_date = today - datetime.timedelta(days=89)
    elif period == "yearly":
        start_date = today - datetime.timedelta(days=364)
    else:
        start_date = today - datetime.timedelta(days=6)

    results = db.query(
        models.FuelLog.filling_station,
        func.sum(models.FuelLog.cost).label("total_spent"),
        func.sum(models.FuelLog.fuel_added_liters).label("total_liters"),
        func.count(models.FuelLog.id).label("log_count")
    ).filter(
        models.FuelLog.entry_date >= start_date
    ).group_by(
        models.FuelLog.filling_station
    ).order_by(
        func.sum(models.FuelLog.cost).desc()
    ).all()

    spend_items = []
    for item in results:
        station_name = item.filling_station if item.filling_station else "Unknown"
        spend_items.append(
            schemas.FillingStationSpendItem(
                filling_station=station_name,
                total_spent=float(item.total_spent) if item.total_spent is not None else 0.0,
                total_liters=float(item.total_liters) if item.total_liters is not None else 0.0,
                log_count=item.log_count or 0
            )
        )
    return spend_items

