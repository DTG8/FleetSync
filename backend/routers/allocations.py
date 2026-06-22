from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import schemas
import crud

router = APIRouter(
    prefix="/allocations",
    tags=["allocations"]
)

@router.get("", response_model=List[schemas.AllocationResponse])
def read_allocations(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_allocations(db=db, skip=skip, limit=limit)

@router.post("", response_model=schemas.AllocationResponse, status_code=status.HTTP_201_CREATED)
def create_allocation(allocation: schemas.AllocationCreate, db: Session = Depends(get_db)):
    return crud.create_allocation(db=db, allocation=allocation)

@router.post("/{allocation_id}/return", response_model=schemas.AllocationResponse)
def return_allocation(allocation_id: int, db: Session = Depends(get_db)):
    return crud.return_allocation(db=db, allocation_id=allocation_id)

@router.delete("/{allocation_id}", response_model=schemas.AllocationResponse)
def delete_allocation(allocation_id: int, db: Session = Depends(get_db)):
    return crud.delete_allocation(db=db, allocation_id=allocation_id)
