import sys
import os
import datetime
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Vehicle, VehiclePaper

# The data from the table
data = [
    {
        "plate_number": "AGL-77-KA",
        "docs": {
            "Proof of Ownership": "2026-08-31",
            "Vehicle License": "2026-08-31",
            "Roadworthiness": "2026-08-22",
            "Insurance": "2026-08-31"
        }
    },
    {
        "plate_number": "SMK-07-KE",
        "docs": {
            "LG papers": "2026-12-31",
            "Proof of Ownership": "2026-08-31",
            "Vehicle License": "2026-08-31",
            "Roadworthiness": "2026-08-24",
            "Insurance": "2026-08-25"
        }
    },
    {
        "plate_number": "APP-07-KF",
        "docs": {
            "Proof of Ownership": "2027-05-31",
            "Vehicle License": "2026-10-31",
            "Roadworthiness": "2026-12-31",
            "Insurance": "2027-05-25"
        }
    },
    {
        "plate_number": "LSD-357-YH",
        "docs": {
            "LG papers": "2026-12-31",
            "Proof of Ownership": "2026-06-30",
            "Vehicle License": "2026-06-30",
            "Hackney permit": "2026-06-30",
            "Roadworthiness": "2026-06-21",
            "Insurance": "2026-06-22"
        }
    },
    {
        "plate_number": "AAA-27-YK",
        "docs": {
            "LG papers": "2026-12-31",
            "Proof of Ownership": "2026-09-30",
            "Vehicle License": "2027-02-28",
            "Hackney permit": "2027-02-28",
            "Roadworthiness": "2026-08-24",
            "Insurance": "2027-02-28"
        }
    },
    {
        "plate_number": "KJA-77-YJ",
        "docs": {
            "LG papers": "2026-12-31",
            "Proof of Ownership": "2027-01-31",
            "Vehicle License": "2026-11-30",
            "Hackney permit": "2026-11-30",
            "Insurance": "2026-09-02"
        }
    },
    {
        "plate_number": "LND-947-XL",
        "docs": {
            "LG papers": "2026-12-31",
            "Proof of Ownership": "2026-10-31",
            "Vehicle License": "2026-10-31",
            "Hackney permit": "2027-02-28",
            "Roadworthiness": "2026-12-12",
            "Insurance": "2027-06-09"
        }
    },
    {
        "plate_number": "AAA-908-DF",
        "docs": {
            "Proof of Ownership": "2027-02-28",
            "Vehicle License": "2026-11-30",
            "Roadworthiness": "2026-08-24",
            "Insurance": "2026-09-06"
        }
    },
    {
        "plate_number": "MUS-677-KL",
        "docs": {
            "Proof of Ownership": "2027-03-31",
            "Vehicle License": "2027-03-31",
            "Roadworthiness": "2026-09-15",
            "Insurance": "2027-03-17"
        }
    },
    {
        "plate_number": "LSR-07-KM",
        "docs": {
            "Proof of Ownership": "2027-03-31",
            "Vehicle License": "2027-03-31",
            "Roadworthiness": "2026-09-15",
            "Insurance": "2027-03-17"
        }
    },
    {
        "plate_number": "LND-277-KM",
        "docs": {
            "Proof of Ownership": "2027-03-31",
            "Vehicle License": "2027-03-31",
            "Roadworthiness": "2026-09-15",
            "Insurance": "2027-03-17"
        }
    },
    {
        "plate_number": "KSF-87-KR",
        "docs": {
            "Proof of Ownership": "2026-12-31",
            "Vehicle License": "2027-06-30",
            "Roadworthiness": "2026-12-07",
            "Insurance": "2027-06-07"
        }
    },
    {
        "plate_number": "APP-507-KP",
        "docs": {
            "Proof of Ownership": "2026-12-31",
            "Vehicle License": "2027-06-30",
            "Roadworthiness": "2026-12-07",
            "Insurance": "2027-06-07"
        }
    }
]

def seed_papers():
    db = SessionLocal()
    try:
        for item in data:
            plate = item["plate_number"]
            # Find the vehicle by plate number
            vehicle = db.query(Vehicle).filter(Vehicle.plate_number == plate).first()
            if not vehicle:
                print(f"Vehicle {plate} not found in database. Skipping.")
                continue
                
            for doc_type, expiry_str in item["docs"].items():
                # Check if this exact doc type already exists for this vehicle
                existing = db.query(VehiclePaper).filter(
                    VehiclePaper.vehicle_id == vehicle.id,
                    VehiclePaper.document_type == doc_type
                ).first()
                
                if existing:
                    print(f"Document {doc_type} already exists for {plate}. Skipping.")
                    continue
                    
                # Create the document
                expiry_date = datetime.datetime.strptime(expiry_str, "%Y-%m-%d").date()
                new_paper = VehiclePaper(
                    vehicle_id=vehicle.id,
                    document_type=doc_type,
                    expiry_date=expiry_date
                )
                db.add(new_paper)
                print(f"Added {doc_type} for {plate} (Expires: {expiry_str})")
        
        db.commit()
        print("Done!")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_papers()
