from database import SessionLocal
import models

def clear_dispatch_and_allocation_history():
    db = SessionLocal()
    try:
        # Clear Assignments (Dispatch History)
        deleted_assignments = db.query(models.Assignment).delete()
        
        # Clear Allocations
        deleted_allocations = db.query(models.Allocation).delete()
        
        # Reset driver status back to "Available" and clear allocated_vehicle_id
        drivers = db.query(models.Driver).all()
        for driver in drivers:
            driver.status = "Available"
            driver.allocated_vehicle_id = None
            
        db.commit()
        print(f"✅ Cleared {deleted_assignments} dispatch assignments.")
        print(f"✅ Cleared {deleted_allocations} allocations.")
        print(f"✅ Reset driver statuses to 'Available'.")
    except Exception as e:
        db.rollback()
        print(f"❌ Error clearing history: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    confirm = input("This will permanently delete all allocations and dispatch assignments. Type 'yes' to confirm: ")
    if confirm.lower() == 'yes':
        clear_dispatch_and_allocation_history()
    else:
        print("Operation cancelled.")
