from models import Client, Invoice, InvoiceStatus, AuditLog, ReconcilePlan

clients: dict[str, Client] = {
    "c1": Client(id="c1", name="ТОО Ромашка", iin="123456789012", bin="123456789012"),
    "c2": Client(id="c2", name="ИП Иванов", iin="840101400123"),
    "c3": Client(id="c3", name="ТОО Альфа", bin="987654321098"),
}

invoices: dict[str, Invoice] = {
    "inv-4521": Invoice(
        id="inv-4521", client_id="c1", amount=125000, currency="KZT",
        due_date="2026-04-01", status=InvoiceStatus.PENDING,
        created_at="2026-03-25T10:00:00Z"
    ),
    "inv-4522": Invoice(
        id="inv-4522", client_id="c1", amount=150000, currency="KZT",
        due_date="2026-04-05", status=InvoiceStatus.PENDING,
        created_at="2026-03-26T10:00:00Z"
    ),
    "inv-4523": Invoice(
        id="inv-4523", client_id="c1", amount=100000, currency="KZT",
        due_date="2026-04-05", status=InvoiceStatus.PENDING,
        created_at="2026-03-26T11:00:00Z"
    ),
    "inv-4524": Invoice(
        id="inv-4524", client_id="c2", amount=500000, currency="KZT",
        due_date="2026-04-03", status=InvoiceStatus.PENDING,
        created_at="2026-03-27T09:00:00Z"
    ),
}

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