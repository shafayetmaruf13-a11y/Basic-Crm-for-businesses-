from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, ConfigDict

from .models import DealStage


# ---------- Auth / User ----------

class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---------- Company ----------

class CompanyBase(BaseModel):
    name: str
    website: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None


class CompanyCreate(CompanyBase):
    pass


class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None


class CompanyOut(CompanyBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


# ---------- Contact ----------

class ContactBase(BaseModel):
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    notes: Optional[str] = None
    company_id: Optional[int] = None


class ContactCreate(ContactBase):
    pass


class ContactUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    notes: Optional[str] = None
    company_id: Optional[int] = None


class ContactOut(ContactBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


# ---------- Deal ----------

class DealBase(BaseModel):
    title: str
    value: int = 0
    stage: DealStage = DealStage.LEAD
    contact_id: Optional[int] = None
    company_id: Optional[int] = None
    notes: Optional[str] = None


class DealCreate(DealBase):
    pass


class DealUpdate(BaseModel):
    title: Optional[str] = None
    value: Optional[int] = None
    stage: Optional[DealStage] = None
    contact_id: Optional[int] = None
    company_id: Optional[int] = None
    notes: Optional[str] = None


class DealOut(DealBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


# ---------- Task ----------

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    completed: bool = False
    contact_id: Optional[int] = None


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    completed: Optional[bool] = None
    contact_id: Optional[int] = None


class TaskOut(TaskBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


# ---------- Appointment ----------

class AppointmentBase(BaseModel):
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    location: Optional[str] = None
    contact_id: Optional[int] = None


class AppointmentCreate(AppointmentBase):
    pass


class AppointmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    location: Optional[str] = None
    contact_id: Optional[int] = None


class AppointmentOut(AppointmentBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


# ---------- Call ----------

class CallBase(BaseModel):
    contact_id: int
    called_at: datetime
    duration_minutes: Optional[int] = None
    outcome: Optional[str] = None
    notes: Optional[str] = None


class CallCreate(CallBase):
    pass


class CallUpdate(BaseModel):
    called_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    outcome: Optional[str] = None
    notes: Optional[str] = None


class CallOut(CallBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
