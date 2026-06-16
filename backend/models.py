from sqlalchemy import Column, Integer, String, Date, DateTime, Numeric, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
import datetime
from database import Base

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    plate_number = Column(String, unique=True, index=True, nullable=False)
    make = Column(String, nullable=False)
    model = Column(String, nullable=False)
    year = Column(Integer, nullable=False)
    status = Column(String, nullable=False, default="Active")  # 'Active', 'Faulty', 'In Repair'
    current_odometer = Column(Integer, nullable=False, default=0)
    current_fuel_level_percent = Column(Integer, nullable=False, default=100)  # 0 to 100
    purchase_date = Column(Date, nullable=False)

    # Relationships
    allocations = relationship("Allocation", back_populates="vehicle", cascade="all, delete-orphan")
    fuel_logs = relationship("FuelLog", back_populates="vehicle", cascade="all, delete-orphan")
    maintenance_logs = relationship("MaintenanceLog", back_populates="vehicle", cascade="all, delete-orphan")
    papers = relationship("VehiclePaper", back_populates="vehicle", cascade="all, delete-orphan")
    miscellaneous_expenses = relationship("MiscellaneousExpense", back_populates="vehicle", cascade="all, delete-orphan")


class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    license_number = Column(String, unique=True, index=True, nullable=False)
    phone_number = Column(String, nullable=False)
    status = Column(String, nullable=False, default="Available")  # 'Available', 'Assigned'

    # Relationships
    allocations = relationship("Allocation", back_populates="driver", cascade="all, delete-orphan")
    fuel_logs = relationship("FuelLog", back_populates="driver")
    maintenance_logs = relationship("MaintenanceLog", back_populates="driver")
    miscellaneous_expenses = relationship("MiscellaneousExpense", back_populates="driver")


class Allocation(Base):
    __tablename__ = "allocations"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=False)
    allocated_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    returned_at = Column(DateTime, nullable=True)

    # Relationships
    vehicle = relationship("Vehicle", back_populates="allocations")
    driver = relationship("Driver", back_populates="allocations")


class FuelLog(Base):
    __tablename__ = "fuel_logs"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True)
    entry_date = Column(Date, nullable=False)
    odometer_reading = Column(Integer, nullable=False)
    fuel_added_liters = Column(Numeric(precision=10, scale=2), nullable=False)
    cost = Column(Numeric(precision=10, scale=2), nullable=False)
    fuel_gauge_after_fill_percent = Column(Integer, nullable=False)

    # Relationships
    vehicle = relationship("Vehicle", back_populates="fuel_logs")
    driver = relationship("Driver", back_populates="fuel_logs")


class MaintenanceLog(Base):
    __tablename__ = "maintenance_logs"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True)
    issue_description = Column(String, nullable=False)
    type = Column(String, nullable=False)  # 'Routine Service', 'Unscheduled Repair'
    status = Column(String, nullable=False, default="Pending")  # 'Pending', 'In Progress', 'Resolved'
    cost = Column(Numeric(precision=10, scale=2), nullable=False)
    logged_at = Column(Date, nullable=False)
    resolved_at = Column(Date, nullable=True)

    # Relationships
    vehicle = relationship("Vehicle", back_populates="maintenance_logs")
    driver = relationship("Driver", back_populates="maintenance_logs")


class VehiclePaper(Base):
    __tablename__ = "vehicle_papers"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    document_type = Column(String, nullable=False)  # 'Insurance', 'Roadworthiness', 'Registration'
    expiry_date = Column(Date, nullable=False)
    last_reminder_sent = Column(DateTime, nullable=True)

    # Relationships
    vehicle = relationship("Vehicle", back_populates="papers")


class MiscellaneousExpense(Base):
    __tablename__ = "miscellaneous_expenses"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True)
    amount = Column(Numeric(precision=10, scale=2), nullable=False)
    description = Column(String, nullable=False)
    entry_date = Column(Date, nullable=False)
    category = Column(String, nullable=False)  # 'Fine', 'Toll', 'Permit'

    # Relationships
    vehicle = relationship("Vehicle", back_populates="miscellaneous_expenses")
    driver = relationship("Driver", back_populates="miscellaneous_expenses")
