from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import schemas
import crud

router = APIRouter(
    tags=["financials"]
)

@router.get("/analytics/financial-report", response_model=schemas.FinancialReportResponse)
def get_financial_report(
    period: str = Query("weekly", pattern="^(weekly|monthly|quarterly|yearly)$"),
    db: Session = Depends(get_db)
):
    return crud.get_financial_report(db=db, period=period)

@router.post("/miscellaneous-expenses", response_model=schemas.MiscellaneousExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_miscellaneous_expense(
    expense: schemas.MiscellaneousExpenseCreate,
    db: Session = Depends(get_db)
):
    return crud.create_miscellaneous_expense(db=db, expense=expense)

@router.get("/miscellaneous-expenses", response_model=List[schemas.MiscellaneousExpenseResponse])
def read_miscellaneous_expenses(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return crud.get_miscellaneous_expenses(db=db, skip=skip, limit=limit)

@router.put("/miscellaneous-expenses/{expense_id}", response_model=schemas.MiscellaneousExpenseResponse)
def update_miscellaneous_expense(
    expense_id: int,
    expense_update: schemas.MiscellaneousExpenseUpdate,
    db: Session = Depends(get_db)
):
    return crud.update_miscellaneous_expense(db=db, expense_id=expense_id, expense_update=expense_update)

@router.delete("/miscellaneous-expenses/{expense_id}", response_model=schemas.MiscellaneousExpenseResponse)
def delete_miscellaneous_expense(
    expense_id: int,
    db: Session = Depends(get_db)
):
    return crud.delete_miscellaneous_expense(db=db, expense_id=expense_id)
