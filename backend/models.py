from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum
import uuid


class InvoiceStatus(str, Enum):
    PENDING = "PENDING"
    PAID = "PAID"
    OVERDUE = "OVERDUE"


class Client(BaseModel):
    id: str
    name: str
    iin: Optional[str] = None
    bin: Optional[str] = None


class Invoice(BaseModel):
    id: str
    client_id: str
    amount: float
    currency: str
    due_date: str
    status: InvoiceStatus
    created_at: str


class Transaction(BaseModel):
    tx_id: str
    date: str
    amount: float
    currency: str
    sender_name: str
    sender_iin: Optional[str] = None
    purpose_text: Optional[str] = None


class MatchStatus(str, Enum):
    AUTO = "AUTO"           # сматчилось автоматически
    UNCERTAIN = "UNCERTAIN" # под вопросом
    UNMATCHED = "UNMATCHED" # не сматчилось


class MatchItem(BaseModel):
    transaction: Transaction
    invoice_ids: List[str] = []   # один платёж может покрыть несколько счетов
    status: MatchStatus
    confidence: float = 0.0       # 0.0 - 1.0
    note: Optional[str] = None    # причина неуверенности


class ReconcilePlan(BaseModel):
    plan_id: str
    created_at: str
    matches: List[MatchItem]


class ConfirmMatchItem(BaseModel):
    tx_id: str
    invoice_ids: List[str]
    is_advance: bool = False      # отметить как аванс


class ConfirmRequest(BaseModel):
    plan_id: str
    operator: str
    matches: List[ConfirmMatchItem]


class AuditLog(BaseModel):
    id: str
    plan_id: str
    operator: str
    confirmed_at: str
    actions: List[ConfirmMatchItem]