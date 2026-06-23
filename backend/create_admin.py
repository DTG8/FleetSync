import os
from database import SessionLocal, engine
import models
import schemas
import crud

# Ensure tables are created
models.Base.metadata.create_all(bind=engine)

def create_admin():
    db = SessionLocal()
    try:
        email = "admin@cedarviewng.com"
        
        # Check if exists
        existing = crud.get_user_by_email(db, email)
        if existing:
            print(f"User {email} already exists!")
            return

        crud.create_user(db, schemas.UserCreate(
            email=email,
            password="@Cedar2026",
            full_name="Cedarview Admin",
            is_active=1
        ))
        print(f"Successfully created admin user: {email}")
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()
