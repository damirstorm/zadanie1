import re
import uuid
from datetime import datetime
from models import Transaction, MatchItem, MatchStatus, ReconcilePlan
from store import (
    clients, invoices, processed_tx_ids, plans,
    get_client_by_iin, get_invoices_by_client
)


def extract_invoice_numbers(text: str) -> list[str]:
    """Ищем четырёхзначные числа похожие на номера счетов в purpose_text"""
    if not text:
        return []
    return re.findall(r'\b4\d{3}\b', text)


def fuzzy_match_name(name1: str, name2: str) -> bool:
    """Простое нечёткое сравнение названий"""
    n1 = name1.lower().strip()
    n2 = name2.lower().strip()
    if n1 == n2:
        return True
    return n1 in n2 or n2 in n1


def find_invoice_by_short_number(num: str, pending: list) -> object:
    """Ищем счёт по короткому номеру (4521) в UUID-based id"""
    return next((inv for inv in pending if num in inv.id), None)


def match_transaction(tx: Transaction) -> MatchItem:
    """Матчим одну транзакцию к счетам"""

    # 1. Ищем клиента по IIN/BIN
    client = get_client_by_iin(tx.sender_iin) if tx.sender_iin else None

    # Если по IIN не нашли — пробуем по имени
    if not client:
        for c in clients.values():
            if fuzzy_match_name(c.name, tx.sender_name):
                client = c
                break

    if not client:
        return MatchItem(
            transaction=tx,
            invoice_ids=[],
            status=MatchStatus.UNMATCHED,
            confidence=0.0,
            note="Клиент не найден по IIN и имени"
        )

    # 2. Ищем номера счетов в purpose_text
    mentioned_numbers = extract_invoice_numbers(tx.purpose_text or "")
    candidate_invoices = get_invoices_by_client(client.id)
    pending = [inv for inv in candidate_invoices if inv.status == "PENDING"]

    matched_by_number = []
    if mentioned_numbers:
        for num in mentioned_numbers:
            inv_id = f"inv-{num}"
            match = next((inv for inv in pending if inv.id == inv_id), None)
            if match:
                matched_by_number.append(match)

    # 3. Точное совпадение по сумме и номеру счёта
    if matched_by_number:
        total = sum(inv.amount for inv in matched_by_number)

        if abs(total - tx.amount) < 0.01:
            return MatchItem(
                transaction=tx,
                invoice_ids=[inv.id for inv in matched_by_number],
                status=MatchStatus.AUTO,
                confidence=1.0,
                note="Совпадение по номеру счёта и сумме"
            )
        else:
            return MatchItem(
                transaction=tx,
                invoice_ids=[inv.id for inv in matched_by_number],
                status=MatchStatus.UNCERTAIN,
                confidence=0.7,
                note=f"Найдены счета но сумма расходится: ожидалось {total}, получено {tx.amount}"
            )

    # 4. Нет номеров в тексте — ищем по сумме среди счетов клиента
    exact_by_amount = [inv for inv in pending if abs(inv.amount - tx.amount) < 0.01]

    if len(exact_by_amount) == 1:
        return MatchItem(
            transaction=tx,
            invoice_ids=[exact_by_amount[0].id],
            status=MatchStatus.UNCERTAIN,
            confidence=0.6,
            note="Клиент найден, сумма совпадает, но номер счёта не указан"
        )
    elif len(exact_by_amount) > 1:
        return MatchItem(
            transaction=tx,
            invoice_ids=[inv.id for inv in exact_by_amount],
            status=MatchStatus.UNCERTAIN,
            confidence=0.4,
            note="Несколько счетов с такой суммой — требуется выбор оператора"
        )

    # 5. Ничего не подошло
    return MatchItem(
        transaction=tx,
        invoice_ids=[],
        status=MatchStatus.UNMATCHED,
        confidence=0.0,
        note="Клиент найден, но подходящий счёт не определён"
    )


def build_reconcile_plan(transactions: list[Transaction]) -> ReconcilePlan:
    """Строим план сверки, пропуская уже обработанные транзакции"""
    new_txs = [tx for tx in transactions if tx.tx_id not in processed_tx_ids]
    matches = [match_transaction(tx) for tx in new_txs]
    plan = ReconcilePlan(
        plan_id=str(uuid.uuid4()),
        created_at=datetime.utcnow().isoformat() + "Z",
        matches=matches
    )
    plans[plan.plan_id] = plan
    return plan