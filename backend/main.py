import uuid
import csv
import io
from datetime import datetime
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from models import ConfirmRequest, AuditLog
from store import processed_tx_ids, plans, invoices, audit_logs, mark_invoices_paid
from reconciler import build_reconcile_plan
from models import Transaction

app = FastAPI(title="Payment Reconciliation API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def parse_csv(content: str) -> list[Transaction]:
    reader = csv.DictReader(io.StringIO(content))
    transactions = []
    for row in reader:
        transactions.append(Transaction(
            tx_id=row["tx_id"].strip(),
            date=row["date"].strip(),
            amount=float(row["amount"].strip()),
            currency=row["currency"].strip(),
            sender_name=row["sender_name"].strip(),
            sender_iin=row.get("sender_iin", "").strip() or None,
            purpose_text=row.get("purpose_text", "").strip() or None,
        ))
    return transactions


@app.get("/api/invoices")
def get_invoices():
    return list(invoices.values())


@app.post("/api/reconcile")
async def reconcile(file: UploadFile = File(...)):
    content = await file.read()
    transactions = parse_csv(content.decode("utf-8"))
    plan = build_reconcile_plan(transactions)
    return plan


@app.post("/api/reconcile/confirm")
def confirm(req: ConfirmRequest):
    if req.plan_id not in plans:
        raise HTTPException(status_code=404, detail="План не найден")

    plan = plans[req.plan_id]

    # Достаём tx_id из плана для идемпотентности
    plan_tx_ids = {m.transaction.tx_id for m in plan.matches}

    for match in req.matches:
        if not match.is_advance:
            mark_invoices_paid(match.invoice_ids)
        # Фиксируем транзакцию как обработанную
        processed_tx_ids.add(match.tx_id)

    log = AuditLog(
        id=str(uuid.uuid4()),
        plan_id=req.plan_id,
        operator=req.operator,
        confirmed_at=datetime.utcnow().isoformat() + "Z",
        actions=req.matches
    )
    audit_logs.append(log)

    return {"ok": True, "log_id": log.id}


@app.get("/api/audit")
def get_audit():
    return audit_logs