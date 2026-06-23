import datetime
from database import SessionLocal, engine, Base
import models
import schemas
import crud

def seed_db():
    print("Clearing database tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        print("Seeding Admin User...")
        crud.create_user(db, schemas.UserCreate(
            email="admin@cedarviewng.com",
            password="@Cedar2026",
            full_name="Cedarview Admin",
            is_active=1
        ))

        print("Seeding Vehicles...")
        v1 = models.Vehicle(
            plate_number="TX-1234", make="Toyota", model="Camry", year=2024,
            status="Active", current_odometer=15000, current_fuel_level_percent=85,
            purchase_date=datetime.date(2024, 1, 15)
        )
        v2 = models.Vehicle(
            plate_number="TX-5678", make="Ford", model="F-150", year=2023,
            status="Faulty", current_odometer=45000, current_fuel_level_percent=30,
            purchase_date=datetime.date(2023, 6, 20)
        )
        v3 = models.Vehicle(
            plate_number="TX-9012", make="Tesla", model="Model 3", year=2024,
            status="In Repair", current_odometer=22000, current_fuel_level_percent=55,
            purchase_date=datetime.date(2024, 3, 10)
        )
        v4 = models.Vehicle(
            plate_number="TX-3456", make="Hino", model="195 Truck", year=2022,
            status="Active", current_odometer=89000, current_fuel_level_percent=90,
            purchase_date=datetime.date(2022, 11, 5)
        )
        db.add_all([v1, v2, v3, v4])
        db.commit()

        print("Seeding Drivers...")
        d1 = models.Driver(full_name="John Doe", license_number="LIC-001", phone_number="+1-555-0199", status="Assigned")
        d2 = models.Driver(full_name="Jane Smith", license_number="LIC-002", phone_number="+1-555-0188", status="Available")
        d3 = models.Driver(full_name="Bob Johnson", license_number="LIC-003", phone_number="+1-555-0177", status="Available")
        db.add_all([d1, d2, d3])
        db.commit()

        print("Seeding Allocations...")
        a_past = models.Allocation(
            vehicle_id=v1.id, driver_id=d2.id,
            allocated_at=datetime.datetime.utcnow() - datetime.timedelta(days=10),
            returned_at=datetime.datetime.utcnow() - datetime.timedelta(days=8)
        )
        a_active = models.Allocation(
            vehicle_id=v1.id, driver_id=d1.id,
            allocated_at=datetime.datetime.utcnow() - datetime.timedelta(days=2),
            returned_at=None
        )
        db.add_all([a_past, a_active])
        db.commit()

        print("Seeding Fuel Logs...")
        today = datetime.date.today()
        
        # Camry
        f1 = models.FuelLog(
            vehicle_id=v1.id, driver_id=d2.id, entry_date=today - datetime.timedelta(days=10),
            odometer_reading=14500, fuel_added_liters=40.0, cost=50.0,
            fuel_gauge_after_fill_percent=95, filling_station="Total"
        )
        f2 = models.FuelLog(
            vehicle_id=v1.id, driver_id=d1.id, entry_date=today - datetime.timedelta(days=3),
            odometer_reading=15000, fuel_added_liters=42.0, cost=55.0,
            fuel_gauge_after_fill_percent=85, filling_station="Shell"
        )
        
        # F-150
        f3 = models.FuelLog(
            vehicle_id=v2.id, driver_id=d3.id, entry_date=today - datetime.timedelta(days=8),
            odometer_reading=44200, fuel_added_liters=70.0, cost=95.0,
            fuel_gauge_after_fill_percent=80, filling_station="Mobil"
        )
        f4 = models.FuelLog(
            vehicle_id=v2.id, driver_id=d3.id, entry_date=today - datetime.timedelta(days=4),
            odometer_reading=44800, fuel_added_liters=68.0, cost=90.0,
            fuel_gauge_after_fill_percent=30, filling_station="Shell"
        )

        # Hino Truck
        f5 = models.FuelLog(
            vehicle_id=v4.id, driver_id=d1.id, entry_date=today - datetime.timedelta(days=11),
            odometer_reading=88200, fuel_added_liters=90.0, cost=120.0,
            fuel_gauge_after_fill_percent=95, filling_station="Oando"
        )
        f6 = models.FuelLog(
            vehicle_id=v4.id, driver_id=d2.id, entry_date=today - datetime.timedelta(days=2),
            odometer_reading=89000, fuel_added_liters=95.0, cost=130.0,
            fuel_gauge_after_fill_percent=90, filling_station="Total"
        )
        
        db.add_all([f1, f2, f3, f4, f5, f6])
        db.commit()

        print("Seeding Maintenance Logs...")
        m1 = models.MaintenanceLog(
            vehicle_id=v1.id, driver_id=None, issue_description="Annual oil change and air filter replacement",
            type="Routine Service", status="Resolved", cost=120.0,
            logged_at=today - datetime.timedelta(days=30), resolved_at=today - datetime.timedelta(days=30)
        )
        m2 = models.MaintenanceLog(
            vehicle_id=v2.id, driver_id=d3.id, issue_description="Engine check light on, misfire in cylinder 3",
            type="Unscheduled Repair", status="Pending", cost=850.0,
            logged_at=today, resolved_at=None
        )
        m3 = models.MaintenanceLog(
            vehicle_id=v3.id, driver_id=d2.id, issue_description="Suspension strut noise and alignment issues",
            type="Unscheduled Repair", status="In Progress", cost=1200.0,
            logged_at=today - datetime.timedelta(days=3), resolved_at=None
        )
        m4 = models.MaintenanceLog(
            vehicle_id=v4.id, driver_id=d1.id, issue_description="Brake pads replacement and rotor machining",
            type="Routine Service", status="Resolved", cost=450.0,
            logged_at=today - datetime.timedelta(days=15), resolved_at=today - datetime.timedelta(days=14)
        )
        db.add_all([m1, m2, m3, m4])
        db.commit()

        print("Seeding Vehicle Papers...")
        p1 = models.VehiclePaper(
            vehicle_id=v1.id, document_type="Insurance",
            expiry_date=today + datetime.timedelta(days=45)
        )
        p2 = models.VehiclePaper(
            vehicle_id=v1.id, document_type="Roadworthiness",
            expiry_date=today + datetime.timedelta(days=15)  # Expiring Soon
        )
        p3 = models.VehiclePaper(
            vehicle_id=v2.id, document_type="Registration",
            expiry_date=today - datetime.timedelta(days=5)  # Expired
        )
        p4 = models.VehiclePaper(
            vehicle_id=v3.id, document_type="Insurance",
            expiry_date=today + datetime.timedelta(days=20)  # Expiring Soon
        )
        p5 = models.VehiclePaper(
            vehicle_id=v4.id, document_type="Roadworthiness",
            expiry_date=today - datetime.timedelta(days=12)  # Expired
        )
        db.add_all([p1, p2, p3, p4, p5])
        db.commit()

        print("Seeding Miscellaneous Expenses...")
        me1 = models.MiscellaneousExpense(
            vehicle_id=v1.id, driver_id=d1.id, amount=15.00,
            description="Expressway highway toll fee", entry_date=today - datetime.timedelta(days=3),
            category="Toll"
        )
        me2 = models.MiscellaneousExpense(
            vehicle_id=v2.id, driver_id=d3.id, amount=180.00,
            description="Speeding violation in school zone", entry_date=today - datetime.timedelta(days=5),
            category="Fine"
        )
        me3 = models.MiscellaneousExpense(
            vehicle_id=v3.id, driver_id=d2.id, amount=250.00,
            description="Annual municipal parking permit", entry_date=today - datetime.timedelta(days=10),
            category="Permit"
        )
        me4 = models.MiscellaneousExpense(
            vehicle_id=v4.id, driver_id=d1.id, amount=45.00,
            description="Heavy cargo bridge toll", entry_date=today - datetime.timedelta(days=1),
            category="Toll"
        )
        me5 = models.MiscellaneousExpense(
            vehicle_id=v4.id, driver_id=d2.id, amount=120.00,
            description="Overweight loading violation fine", entry_date=today - datetime.timedelta(days=12),
            category="Fine"
        )
        db.add_all([me1, me2, me3, me4, me5])
        db.commit()

        print("Database seeded successfully with financials!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
