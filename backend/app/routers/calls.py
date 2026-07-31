from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..auth import get_current_user
from ..database import get_db

router = APIRouter(
    prefix="/api/calls",
    tags=["calls"],
    dependencies=[Depends(get_current_user)],
)


@router.get("", response_model=List[schemas.CallOut])
def list_calls(contact_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(models.Call)
    if contact_id is not None:
        query = query.filter(models.Call.contact_id == contact_id)
    return query.order_by(models.Call.called_at.desc()).all()


@router.post("", response_model=schemas.CallOut, status_code=201)
def create_call(call_in: schemas.CallCreate, db: Session = Depends(get_db)):
    call = models.Call(**call_in.model_dump())
    db.add(call)
    db.commit()
    db.refresh(call)
    return call


@router.get("/{call_id}", response_model=schemas.CallOut)
def get_call(call_id: int, db: Session = Depends(get_db)):
    call = db.query(models.Call).filter(models.Call.id == call_id).first()
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    return call


@router.put("/{call_id}", response_model=schemas.CallOut)
def update_call(call_id: int, call_in: schemas.CallUpdate, db: Session = Depends(get_db)):
    call = db.query(models.Call).filter(models.Call.id == call_id).first()
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    for field, value in call_in.model_dump(exclude_unset=True).items():
        setattr(call, field, value)
    db.commit()
    db.refresh(call)
    return call


@router.delete("/{call_id}", status_code=204)
def delete_call(call_id: int, db: Session = Depends(get_db)):
    call = db.query(models.Call).filter(models.Call.id == call_id).first()
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    db.delete(call)
    db.commit()
