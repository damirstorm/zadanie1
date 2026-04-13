from models import Client, Invoice, InvoiceStatus, AuditLog, ReconcilePlan
from datetime import datetime

# --- Клиенты ---
clients: dict[str, Client] = {
    "a1b2c3d4-0001-0001-0001-000000000001": Client(
        id="a1b2c3d4-0001-0001-0001-000000000001",
        name="ТОО Ромашка",
        iin="123456789012",
        bin="123456789012"
    ),
    "a1b2c3d4-0002-0002-0002-000000000002": Client(
        id="a1b2c3d4-0002-0002-0002-000000000002",
        name="ИП Иванов",
        iin="840101400123"
    ),
    "a1b2c3d4-0003-0003-0003-000000000003": Client(
        id="a1b2c3d4-0003-0003-0003-000000000003",
        name="ТОО Альфа",
        bin="987654321098"
    ),
}

# --- Счета ---
invoices: dict[str, Invoice] = {
    "f47ac10b-4521-4521-4521-000000004521": Invoice(
        id="f47ac10b-4521-4521-4521-000000004521",
        client_id="a1b2c3d4-0001-0001-0001-000000000001",
        amount=125000,
        currency="KZT",
        due_date="2026-04-01",
        status=InvoiceStatus.PENDING,
        created_at="2026-03-25T10:00:00Z"
    ),
    "f47ac10b-4522-4522-4522-000000004522": Invoice(
        id="f47ac10b-4522-4522-4522-000000004522",
        client_id="a1b2c3d4-0001-0001-0001-000000000001",
        amount=150000,
        currency="KZT",
        due_date="2026-04-05",
        status=InvoiceStatus.PENDING,
        created_at="2026-03-26T10:00:00Z"
    ),
    "f47ac10b-4523-4523-4523-000000004523": Invoice(
        id="f47ac10b-4523-4523-4523-000000004523",
        client_id="a1b2c3d4-0001-0001-0001-000000000001",
        amount=100000,
        currency="KZT",
        due_date="2026-04-05",
        status=InvoiceStatus.PENDING,
        created_at="2026-03-26T11:00:00Z"
    ),
    "f47ac10b-4524-4524-4524-000000004524": Invoice(
        id="f47ac10b-4524-4524-4524-000000004524",
        client_id="a1b2c3d4-0002-0002-0002-000000000002",
        amount=500000,
        currency="KZT",
        due_date="2026-04-03",
        status=InvoiceStatus.PENDING,
        created_at="2026-03-27T09:00:00Z"
    ),
}

# --- In-memory хранилища ---
processed_tx_ids: set[str] = set()
plans: dict[str, ReconcilePlan] = {}
audit_logs: list[AuditLog] = []


def get_client_by_iin(iin: str) -> Client | None:
    for c in clients.values():
        if c.iin == iin or c.bin == iin:
            return c
    return None


def get_invoices_by_client(client_id: str) -> list[Invoice]:
    return [inv for inv in invoices.values() if inv.client_id == client_id]


def mark_invoices_paid(invoice_ids: list[str]):
    for inv_id in invoice_ids:
        if inv_id in invoices:
            invoices[inv_id].status = InvoiceStatus.PAID