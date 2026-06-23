from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal

# --- AUTH & USER SCHEMAS ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UserBase(BaseModel):
    email: str
    full_name: Optional[str] = None
    is_active: int = 1

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int

    class Config:
        from_attributes = True

# --- VEHICLE PAPER SCHEMAS ---
class VehiclePaperBase(BaseModel):
    vehicle_id: int
    document_type: str  # 'Insurance', 'Roadworthiness', 'Registration'
    expiry_date: date
    last_reminder_sent: Optional[datetime] = None

class VehiclePaperCreate(VehiclePaperBase):
    pass

class VehiclePaperUpdate(BaseModel):
    document_type: Optional[str] = None
    expiry_date: Optional[date] = None
    last_reminder_sent: Optional[datetime] = None

class VehiclePaperResponse(VehiclePaperBase):
    id: int

    class Config:
        from_attributes = True


# --- VEHICLE SCHEMAS ---
class VehicleBase(BaseModel):
    plate_number: str
    make: str
    model: str
    year: int
    status: str = "Active"  # 'Active', 'Faulty', 'In Repair'
    current_odometer: int = 0
    current_fuel_level_percent: int = Field(100, ge=0, le=100)
    purchase_date: date

class VehicleCreate(VehicleBase):
    pass

class VehicleUpdate(BaseModel):
    plate_number: Optional[str] = None
    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    status: Optional[str] = None
    current_odometer: Optional[int] = None
    current_fuel_level_percent: Optional[int] = Field(None, ge=0, le=100)
    purchase_date: Optional[date] = None

class VehicleResponse(VehicleBase):
    id: int
    papers: List[VehiclePaperResponse] = []

    class Config:
        from_attributes = True


# --- DRIVER SCHEMAS ---
class DriverBase(BaseModel):
    full_name: str
    license_number: str
    phone_number: str
    status: str = "Available"  # 'Available', 'On Leave', 'On Assignment'
    photo_url: Optional[str] = None
    allocated_vehicle_id: Optional[int] = None

class DriverCreate(DriverBase):
    pass

class DriverUpdate(BaseModel):
    full_name: Optional[str] = None
    license_number: Optional[str] = None
    phone_number: Optional[str] = None
    status: Optional[str] = None
    photo_url: Optional[str] = None
    allocated_vehicle_id: Optional[int] = None

class DriverResponse(DriverBase):
    id: int

    class Config:
        from_attributes = True


# --- ALLOCATION SCHEMAS ---
class AllocationBase(BaseModel):
    vehicle_id: int
    driver_id: int

class AllocationCreate(AllocationBase):
    pass

class AllocationResponse(AllocationBase):
    id: int
    allocated_at: datetime
    returned_at: Optional[datetime] = None
    vehicle_plate: Optional[str] = None
    driver_name: Optional[str] = None

    class Config:
        from_attributes = True


# --- FUEL LOG SCHEMAS ---
class FuelLogBase(BaseModel):
    vehicle_id: int
    driver_id: Optional[int] = None
    entry_date: date
    odometer_reading: int
    fuel_added_liters: Decimal = Field(..., gt=0)
    cost: Decimal = Field(..., ge=0)
    fuel_gauge_after_fill_percent: int = Field(..., ge=0, le=100)
    filling_station: Optional[str] = "Unknown"

class FuelLogCreate(FuelLogBase):
    pass

class FuelLogUpdate(BaseModel):
    driver_id: Optional[int] = None
    entry_date: Optional[date] = None
    odometer_reading: Optional[int] = None
    fuel_added_liters: Optional[Decimal] = Field(None, gt=0)
    cost: Optional[Decimal] = Field(None, ge=0)
    fuel_gauge_after_fill_percent: Optional[int] = Field(None, ge=0, le=100)
    filling_station: Optional[str] = None

class FuelLogResponse(FuelLogBase):
    id: int

    class Config:
        from_attributes = True


# --- MAINTENANCE LOG SCHEMAS ---
class MaintenanceLogBase(BaseModel):
    vehicle_id: int
    driver_id: Optional[int] = None
    issue_description: str
    type: str  # 'Routine Service', 'Unscheduled Repair'
    status: str = "Pending"  # 'Pending', 'In Progress', 'Resolved'
    cost: Decimal = Field(..., ge=0)
    logged_at: date
    resolved_at: Optional[date] = None

class MaintenanceLogCreate(MaintenanceLogBase):
    pass

class MaintenanceLogUpdate(BaseModel):
    driver_id: Optional[int] = None
    issue_description: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None
    cost: Optional[Decimal] = Field(None, ge=0)
    logged_at: Optional[date] = None
    resolved_at: Optional[date] = None

class MaintenanceLogResponse(MaintenanceLogBase):
    id: int

    class Config:
        from_attributes = True


# --- MISCELLANEOUS EXPENSE SCHEMAS ---
class MiscellaneousExpenseBase(BaseModel):
    vehicle_id: int
    driver_id: Optional[int] = None
    amount: Decimal = Field(..., gt=0)
    description: str
    entry_date: date
    category: str  # 'Fine', 'Toll', 'Permit'

class MiscellaneousExpenseCreate(MiscellaneousExpenseBase):
    pass

class MiscellaneousExpenseUpdate(BaseModel):
    driver_id: Optional[int] = None
    amount: Optional[Decimal] = Field(None, gt=0)
    description: Optional[str] = None
    entry_date: Optional[date] = None
    category: Optional[str] = None

class MiscellaneousExpenseResponse(MiscellaneousExpenseBase):
    id: int

    class Config:
        from_attributes = True


# --- ANALYTICS SCHEMAS ---
class DashboardMetrics(BaseModel):
    total_fleet: int
    active_fleet: int
    faulty_vehicles: int
    in_repair_vehicles: int
    papers_expiring_soon: int
    total_fuel_this_week: float
    total_fuel_last_week: float

class WeeklyFuelItem(BaseModel):
    vehicle_id: int
    plate_number: str
    total_liters: float

class MaintenanceRecurrentItem(BaseModel):
    vehicle_id: int
    plate_number: str
    repair_count: int
    total_cost: float

class ExpiringPaperItem(BaseModel):
    id: int
    vehicle_id: int
    plate_number: str
    make_model: Optional[str] = None
    document_type: str
    expiry_date: date
    days_remaining: int
    status: str  # 'Expired', 'Expiring Soon', 'Valid'


class FillingStationSpendItem(BaseModel):
    filling_station: str
    total_spent: float
    total_liters: float
    log_count: int


# --- FINANCIAL REPORT SCHEMAS ---
class VehicleFinancialItem(BaseModel):
    vehicle_id: int
    plate_number: str
    fuel_cost: float
    repair_cost: float
    misc_cost: float
    total_tco: float
    distance_traveled: int
    cost_per_km: float

class DriverFinancialItem(BaseModel):
    driver_id: int
    driver_name: str
    fuel_cost: float
    repair_cost: float
    misc_cost: float
    total_tco: float

class FinancialReportResponse(BaseModel):
    vehicles: List[VehicleFinancialItem]
    drivers: List[DriverFinancialItem]
    period: str


# --- ASSIGNMENT SCHEMAS ---
class AssignmentBase(BaseModel):
    vehicle_id: int
    driver_id: int
    task_description: Optional[str] = None

class AssignmentCreate(AssignmentBase):
    dispatched_at: Optional[datetime] = None

class AssignmentUpdate(BaseModel):
    returned_at: Optional[datetime] = None

class AssignmentResponse(AssignmentBase):
    id: int
    dispatched_at: datetime
    returned_at: Optional[datetime] = None
    vehicle_plate: Optional[str] = None
    driver_name: Optional[str] = None

    class Config:
        from_attributes = True

# --- ACCESSORY SCHEMAS ---
class VehicleAccessoryBase(BaseModel):
    vehicle_id: int
    item_name: str
    status: str = "Present"

class VehicleAccessoryCreate(VehicleAccessoryBase):
    pass

class VehicleAccessoryUpdate(BaseModel):
    status: Optional[str] = None

class VehicleAccessoryResponse(VehicleAccessoryBase):
    id: int
    last_updated: datetime

    class Config:
        from_attributes = True

class VehicleAccessoryHistoryResponse(BaseModel):
    id: int
    vehicle_id: int
    accessory_id: int
    item_name: str
    old_status: Optional[str] = None
    new_status: str
    updated_at: datetime

    class Config:
        from_attributes = True
