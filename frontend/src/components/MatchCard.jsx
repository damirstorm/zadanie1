import { useState } from "react";

export default function MatchCard({ item, onAssign, onMarkAdvance }) {
  const { transaction: tx, invoice_ids, status, note, is_advance } = item;
  const [editing, setEditing] = useState(false);
  const [inputIds, setInputIds] = useState(invoice_ids.join(", "));

  const handleSave = () => {
    const ids = inputIds.split(",").map((s) => s.trim()).filter(Boolean);
    onAssign(tx.tx_id, ids);
    setEditing(false);
  };

  return (
    <div className={`card card--${status.toLowerCase()}`}>
      <div className="card-header">
        <span className="tx-id">{tx.tx_id}</span>
        <span className="tx-date">{tx.date}</span>
      </div>

      <div className="card-sender">{tx.sender_name}</div>
      <div className="card-amount">{tx.amount.toLocaleString()} {tx.currency}</div>

      {tx.purpose_text && (
        <div className="card-purpose">📝 {tx.purpose_text}</div>
      )}

      {note && <div className="card-note">💬 {note}</div>}

      <div className="card-invoices">
        {editing ? (
          <div className="edit-block">
            <input
              value={inputIds}
              onChange={(e) => setInputIds(e.target.value)}
              placeholder="inv-4521, inv-4522"
            />
            <button onClick={handleSave}>💾 Сохранить</button>
            <button onClick={() => setEditing(false)}>✕</button>
          </div>
        ) : (
          <div className="invoice-row">
            <span>
              {invoice_ids.length > 0
                ? invoice_ids.join(", ")
                : "— счёт не назначен"}
            </span>
            <button className="edit-btn" onClick={() => setEditing(true)}>
              ✏️ Изменить
            </button>
          </div>
        )}
      </div>

      <label className="advance-label">
        <input
          type="checkbox"
          checked={is_advance || false}
          onChange={(e) => onMarkAdvance(tx.tx_id, e.target.checked)}
        />
        Отметить как аванс
      </label>
    </div>
  );
}