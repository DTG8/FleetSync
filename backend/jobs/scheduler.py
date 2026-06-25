import asyncio
import datetime
from sqlalchemy.orm import Session
from database import SessionLocal
import crud
import models

def send_simulated_email(to_address: str, subject: str, body: str):
    print("="*50)
    print(f"📧 SIMULATED EMAIL SENT TO: {to_address}")
    print(f"SUBJECT: {subject}")
    print(f"BODY:\n{body}")
    print("="*50)

def check_compliance_expiries():
    db: Session = SessionLocal()
    try:
        today = datetime.date.today()
        seven_days_from_now = today + datetime.timedelta(days=7)
        
        # Get papers expiring soon that haven't been reminded recently
        papers = db.query(models.VehiclePaper).filter(
            models.VehiclePaper.expiry_date <= seven_days_from_now,
            models.VehiclePaper.expiry_date >= today
        ).all()
        
        for paper in papers:
            # Check if reminder was sent in the last 2 days
            if paper.last_reminder_sent:
                days_since_reminder = (datetime.datetime.utcnow() - paper.last_reminder_sent).days
                if days_since_reminder < 2:
                    continue
            
            vehicle = paper.vehicle
            message = f"Warning: {paper.document_type} for Vehicle {vehicle.plate_number} ({vehicle.make} {vehicle.model}) expires on {paper.expiry_date}."
            
            # 1. Create In-App Notification
            crud.create_notification(db, message=message, type="Warning")
            
            # 2. Send Simulated Email
            send_simulated_email(
                to_address="admin@fleetsync.com",
                subject=f"Action Required: Vehicle Document Expiring Soon ({vehicle.plate_number})",
                body=message
            )
            
            # Update last reminder
            paper.last_reminder_sent = datetime.datetime.utcnow()
            db.commit()

    except Exception as e:
        print(f"Error in check_compliance_expiries: {e}")
    finally:
        db.close()


async def run_scheduler():
    print("🚀 Background Scheduler Started")
    while True:
        check_compliance_expiries()
        # In a real app, this would be asyncio.sleep(86400) for daily.
        # For testing purposes, we'll run it every 15 seconds.
        await asyncio.sleep(15)
