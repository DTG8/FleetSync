import unittest
import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base
import models
import schemas
import crud
from fastapi import HTTPException

class TestFleetManagement(unittest.TestCase):
    def setUp(self):
        # Create an in-memory SQLite database for testing
        self.engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
        Base.metadata.create_all(bind=self.engine)
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        self.db = self.SessionLocal()

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(bind=self.engine)

    def test_vehicle_creation(self):
        vehicle_in = schemas.VehicleCreate(
            plate_number="TEST-001", make="Toyota", model="Corolla", year=2022,
            status="Active", current_odometer=5000, current_fuel_level_percent=100,
            purchase_date=datetime.date(2022, 5, 1)
        )
        vehicle = crud.create_vehicle(self.db, vehicle_in)
        self.assertEqual(vehicle.plate_number, "TEST-001")
        self.assertEqual(vehicle.status, "Active")
        self.assertEqual(vehicle.current_odometer, 5000)

        # Test duplicate plate number
        with self.assertRaises(HTTPException) as context:
            crud.create_vehicle(self.db, vehicle_in)
        self.assertEqual(context.exception.status_code, 400)

    def test_driver_creation(self):
        driver_in = schemas.DriverCreate(
            full_name="Driver One", license_number="LIC-111", phone_number="123456", status="Available"
        )
        driver = crud.create_driver(self.db, driver_in)
        self.assertEqual(driver.full_name, "Driver One")
        self.assertEqual(driver.status, "Available")

        # Test duplicate license
        with self.assertRaises(HTTPException) as context:
            crud.create_driver(self.db, driver_in)
        self.assertEqual(context.exception.status_code, 400)

    def test_allocation_and_return(self):
        # Setup vehicle and driver
        vehicle_in = schemas.VehicleCreate(
            plate_number="TEST-002", make="Ford", model="Focus", year=2021,
            status="Active", current_odometer=8000, current_fuel_level_percent=90,
            purchase_date=datetime.date(2021, 6, 1)
        )
        vehicle = crud.create_vehicle(self.db, vehicle_in)

        driver_in = schemas.DriverCreate(
            full_name="Driver Two", license_number="LIC-222", phone_number="123456", status="Available"
        )
        driver = crud.create_driver(self.db, driver_in)

        # Create allocation
        alloc_in = schemas.AllocationCreate(vehicle_id=vehicle.id, driver_id=driver.id)
        alloc = crud.create_allocation(self.db, alloc_in)
        self.assertEqual(alloc.vehicle_id, vehicle.id)
        self.assertEqual(alloc.driver_id, driver.id)
        self.assertIsNone(alloc.returned_at)

        # Verify driver status changed to Assigned
        self.assertEqual(driver.status, "Assigned")

        # Verify double allocation of same vehicle fails
        driver2_in = schemas.DriverCreate(
            full_name="Driver Three", license_number="LIC-333", phone_number="123456", status="Available"
        )
        driver2 = crud.create_driver(self.db, driver2_in)
        alloc2_in = schemas.AllocationCreate(vehicle_id=vehicle.id, driver_id=driver2.id)
        with self.assertRaises(HTTPException) as context:
            crud.create_allocation(self.db, alloc2_in)
        self.assertEqual(context.exception.status_code, 400)

        # Verify double allocation of same driver fails
        vehicle2_in = schemas.VehicleCreate(
            plate_number="TEST-003", make="Tesla", model="Model Y", year=2023,
            status="Active", current_odometer=1000, current_fuel_level_percent=100,
            purchase_date=datetime.date(2023, 1, 1)
        )
        vehicle2 = crud.create_vehicle(self.db, vehicle2_in)
        alloc3_in = schemas.AllocationCreate(vehicle_id=vehicle2.id, driver_id=driver.id)
        with self.assertRaises(HTTPException) as context:
            crud.create_allocation(self.db, alloc3_in)
        self.assertEqual(context.exception.status_code, 400)

        # Return allocation
        returned_alloc = crud.return_allocation(self.db, alloc.id)
        self.assertIsNotNone(returned_alloc.returned_at)
        self.assertEqual(driver.status, "Available")

    def test_fuel_log_odometer_validation(self):
        vehicle_in = schemas.VehicleCreate(
            plate_number="TEST-004", make="Chevrolet", model="Bolt", year=2022,
            status="Active", current_odometer=12000, current_fuel_level_percent=50,
            purchase_date=datetime.date(2022, 1, 1)
        )
        vehicle = crud.create_vehicle(self.db, vehicle_in)

        # Test valid fuel log
        fuel_in = schemas.FuelLogCreate(
            vehicle_id=vehicle.id, entry_date=datetime.date.today(),
            odometer_reading=12500, fuel_added_liters=35.5, cost=45.0,
            fuel_gauge_after_fill_percent=95, filling_station="Shell Station"
        )
        fuel_log = crud.create_fuel_log(self.db, fuel_in)
        self.assertEqual(fuel_log.odometer_reading, 12500)
        self.assertEqual(fuel_log.filling_station, "Shell Station")
        # Verify vehicle fields updated
        self.assertEqual(vehicle.current_odometer, 12500)
        self.assertEqual(vehicle.current_fuel_level_percent, 95)

        # Test invalid odometer (lower than current)
        fuel_invalid = schemas.FuelLogCreate(
            vehicle_id=vehicle.id, entry_date=datetime.date.today(),
            odometer_reading=12400, fuel_added_liters=10.0, cost=15.0,
            fuel_gauge_after_fill_percent=100
        )
        with self.assertRaises(HTTPException) as context:
            crud.create_fuel_log(self.db, fuel_invalid)
        self.assertEqual(context.exception.status_code, 400)
        self.assertIn("Odometer reading", context.exception.detail)

    def test_maintenance_status_updates(self):
        vehicle_in = schemas.VehicleCreate(
            plate_number="TEST-005", make="Nissan", model="Leaf", year=2021,
            status="Active", current_odometer=20000, current_fuel_level_percent=100,
            purchase_date=datetime.date(2021, 1, 1)
        )
        vehicle = crud.create_vehicle(self.db, vehicle_in)

        # Create maintenance log - status: Pending (should set vehicle to Faulty)
        log1_in = schemas.MaintenanceLogCreate(
            vehicle_id=vehicle.id, issue_description="Squeaky brakes",
            type="Unscheduled Repair", status="Pending", cost=0.0,
            logged_at=datetime.date.today(), resolved_at=None
        )
        log1 = crud.create_maintenance_log(self.db, log1_in)
        self.assertEqual(vehicle.status, "Faulty")

        # Update maintenance log - status: In Progress (should set vehicle to In Repair)
        log2_in = schemas.MaintenanceLogCreate(
            vehicle_id=vehicle.id, issue_description="Brake caliper replacement",
            type="Unscheduled Repair", status="In Progress", cost=250.0,
            logged_at=datetime.date.today(), resolved_at=None
        )
        log2 = crud.create_maintenance_log(self.db, log2_in)
        self.assertEqual(vehicle.status, "In Repair")

        # Create resolving maintenance log (should set vehicle to Active if all are resolved)
        # Let's resolve the logs
        # First, mark log1 as Resolved
        log1.status = "Resolved"
        log1.resolved_at = datetime.date.today()
        self.db.commit()
        # Second, create a log with Resolved status
        log3_in = schemas.MaintenanceLogCreate(
            vehicle_id=vehicle.id, issue_description="Oil change",
            type="Routine Service", status="Resolved", cost=80.0,
            logged_at=datetime.date.today(), resolved_at=datetime.date.today()
        )
        crud.create_maintenance_log(self.db, log3_in)
        # vehicle should still be In Repair since log2 is In Progress!
        self.assertEqual(vehicle.status, "In Repair")

        # Resolve log2 (or complete it)
        log2.status = "Resolved"
        log2.resolved_at = datetime.date.today()
        self.db.commit()
        # Now trigger the resolution check by logging a resolved maintenance
        log4_in = schemas.MaintenanceLogCreate(
            vehicle_id=vehicle.id, issue_description="Final inspection",
            type="Routine Service", status="Resolved", cost=0.0,
            logged_at=datetime.date.today(), resolved_at=datetime.date.today()
        )
        crud.create_maintenance_log(self.db, log4_in)
        # Vehicle status should become Active
        self.assertEqual(vehicle.status, "Active")
    def test_financial_reports_and_driver_resolution(self):
        # 1. Setup vehicle and driver
        vehicle_in = schemas.VehicleCreate(
            plate_number="TEST-FIN", make="Honda", model="Civic", year=2022,
            status="Active", current_odometer=1000, current_fuel_level_percent=100,
            purchase_date=datetime.date(2022, 1, 1)
        )
        vehicle = crud.create_vehicle(self.db, vehicle_in)

        driver_in = schemas.DriverCreate(
            full_name="Financial Driver", license_number="LIC-FIN", phone_number="123456", status="Available"
        )
        driver = crud.create_driver(self.db, driver_in)

        # 2. Allocate driver to vehicle
        alloc_in = schemas.AllocationCreate(vehicle_id=vehicle.id, driver_id=driver.id)
        alloc = crud.create_allocation(self.db, alloc_in)

        # 3. Create fuel log without driver_id (should auto-resolve to driver.id)
        fuel_in = schemas.FuelLogCreate(
            vehicle_id=vehicle.id, driver_id=None, entry_date=datetime.date.today(),
            odometer_reading=1200, fuel_added_liters=20.0, cost=30.00,
            fuel_gauge_after_fill_percent=90
        )
        fuel_log = crud.create_fuel_log(self.db, fuel_in)
        self.assertEqual(fuel_log.driver_id, driver.id)

        # 4. Create maintenance log without driver_id (should auto-resolve to driver.id)
        maint_in = schemas.MaintenanceLogCreate(
            vehicle_id=vehicle.id, driver_id=None, issue_description="Squeaky belts",
            type="Routine Service", status="Pending", cost=150.00,
            logged_at=datetime.date.today()
        )
        maint_log = crud.create_maintenance_log(self.db, maint_in)
        self.assertEqual(maint_log.driver_id, driver.id)

        # 5. Create misc expense without driver_id (should auto-resolve to driver.id)
        misc_in = schemas.MiscellaneousExpenseCreate(
            vehicle_id=vehicle.id, driver_id=None, amount=45.00,
            description="Toll charge", entry_date=datetime.date.today(),
            category="Toll"
        )
        misc_log = crud.create_miscellaneous_expense(self.db, misc_in)
        self.assertEqual(misc_log.driver_id, driver.id)

        # 6. Retrieve financial report
        report = crud.get_financial_report(self.db, "weekly")
        
        # Check vehicle stats in report
        v_item = next(item for item in report.vehicles if item.vehicle_id == vehicle.id)
        self.assertEqual(v_item.fuel_cost, 30.0)
        self.assertEqual(v_item.repair_cost, 150.0)
        self.assertEqual(v_item.misc_cost, 45.0)
        self.assertEqual(v_item.total_tco, 225.0)
        self.assertEqual(v_item.distance_traveled, 0) # Only one fuel log, so max_odo == min_odo == 1200
        self.assertEqual(v_item.cost_per_km, 0.0)

        # Create another fuel log to test distance traveled and cost_per_km
        fuel_in_2 = schemas.FuelLogCreate(
            vehicle_id=vehicle.id, driver_id=None, entry_date=datetime.date.today(),
            odometer_reading=1425, fuel_added_liters=25.0, cost=40.00,
            fuel_gauge_after_fill_percent=100
        )
        crud.create_fuel_log(self.db, fuel_in_2)

        report2 = crud.get_financial_report(self.db, "weekly")
        v_item_2 = next(item for item in report2.vehicles if item.vehicle_id == vehicle.id)
        self.assertEqual(v_item_2.distance_traveled, 225) # 1425 - 1200
        # Fuel cost: 30 + 40 = 70. TCO: 70 + 150 + 45 = 265
        self.assertEqual(v_item_2.fuel_cost, 70.0)
        self.assertEqual(v_item_2.total_tco, 265.0)
        self.assertEqual(v_item_2.cost_per_km, 265.0 / 225.0)

        # Check driver stats in report
        d_item = next(item for item in report2.drivers if item.driver_id == driver.id)
        self.assertEqual(d_item.fuel_cost, 70.0)
        self.assertEqual(d_item.repair_cost, 150.0)
        self.assertEqual(d_item.misc_cost, 45.0)
        self.assertEqual(d_item.total_tco, 265.0)

    def test_filling_station_analytics(self):
        # Setup vehicle
        vehicle_in = schemas.VehicleCreate(
            plate_number="TEST-STATION", make="Toyota", model="Yaris", year=2021,
            status="Active", current_odometer=1000, current_fuel_level_percent=100,
            purchase_date=datetime.date(2021, 1, 1)
        )
        vehicle = crud.create_vehicle(self.db, vehicle_in)

        # Log fuel from Shell
        fuel1 = schemas.FuelLogCreate(
            vehicle_id=vehicle.id, entry_date=datetime.date.today(),
            odometer_reading=1100, fuel_added_liters=10.0, cost=15.00,
            fuel_gauge_after_fill_percent=90, filling_station="Shell"
        )
        crud.create_fuel_log(self.db, fuel1)

        # Log fuel from Total
        fuel2 = schemas.FuelLogCreate(
            vehicle_id=vehicle.id, entry_date=datetime.date.today(),
            odometer_reading=1200, fuel_added_liters=20.0, cost=30.00,
            fuel_gauge_after_fill_percent=95, filling_station="Total"
        )
        crud.create_fuel_log(self.db, fuel2)

        # Log another fuel from Shell
        fuel3 = schemas.FuelLogCreate(
            vehicle_id=vehicle.id, entry_date=datetime.date.today(),
            odometer_reading=1300, fuel_added_liters=15.0, cost=25.00,
            fuel_gauge_after_fill_percent=100, filling_station="Shell"
        )
        crud.create_fuel_log(self.db, fuel3)

        # Retrieve filling station stats
        stats = crud.get_filling_station_analytics(self.db, "weekly")
        
        # Verify Shell stats (15.00 + 25.00 = 40.00 spent, 25 liters, 2 logs)
        shell_stats = next(item for item in stats if item.filling_station == "Shell")
        self.assertEqual(shell_stats.total_spent, 40.00)
        self.assertEqual(shell_stats.total_liters, 25.0)
        self.assertEqual(shell_stats.log_count, 2)

        # Verify Total stats (30.00 spent, 20 liters, 1 log)
        total_stats = next(item for item in stats if item.filling_station == "Total")
        self.assertEqual(total_stats.total_spent, 30.00)
        self.assertEqual(total_stats.total_liters, 20.0)
        self.assertEqual(total_stats.log_count, 1)


if __name__ == "__main__":
    unittest.main()
