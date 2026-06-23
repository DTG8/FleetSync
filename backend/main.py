import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import models
from database import engine
from routers import vehicles, drivers, allocations, fuel_logs, maintenance_logs, analytics, compliance, financials, assignments, accessories, profiles

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Fleet Management System API",
    description="Backend API for managing vehicles, drivers, fuel logs, maintenance, allocations, and compliance documents.",
    version="1.1.0"
)

# Mount the static uploads directory
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, specify the actual frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(vehicles.router)
app.include_router(drivers.router)
app.include_router(allocations.router)
app.include_router(fuel_logs.router)
app.include_router(maintenance_logs.router)
app.include_router(analytics.router)
app.include_router(compliance.router)
app.include_router(financials.router)
app.include_router(assignments.router)
app.include_router(accessories.router)
app.include_router(profiles.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Fleet Management API. Access /docs for swagger documentation."}
