import { useState } from "react";

export default function MatchCard({ item, invoices = [], onAssign, onMarkAdvance }) {
  const { transaction: tx, invoice_ids, status, note, is_advance } = item;
  const [editing, setEditing] = useState(false);
  const [splits, setSplits] = useState(
    invoice_ids.length > 0
      ? invoice_ids.map((id) => ({ invoice_id: id, amount: "" }))
      : [{ invoice_id: "", amount: "" }]
  );

  const totalSplit = splits.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
  const remaining = tx.amount - totalSplit;
  const isBalanced = Math.abs(remaining) < 0.01;

  const handleAddSplit = () => {
    setSplits([...splits, { invoice_id: "", amount: "" }]);
  };

  const handleRemoveSplit = (index) => {
    setSplits(splits.filter((_, i) => i !== index));
  };

  const handleSplitChange = (index, field, value) => {
    setSplits(splits.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const handleSave = () => {
    const validSplits = splits.filter((s) => s.invoice_id && s.amount);

    if (validSplits.length === 0) {
      alert("Выбери хотя бы один счёт и укажи сумму");
      return;
    }

    const ids = validSplits.map((s) => s.invoice_id);
    const uniqueIds = new Set(ids);
    if (uniqueIds.size !== ids.length) {
      alert("Один и тот же счёт выбран дважды!");
      return;
    }

    if (!isBalanced) {
      alert(`Сумма не совпадает! Остаток: ${remaining.toLocaleString()} KZT`);
      return;
    }

    onAssign(tx.tx_id, ids, validSplits);
    setEditing(false);
  };

  const getInvoiceLabel = (id) => {
    if (!invoices || invoices.length === 0) return id;
    const inv = invoices.find((i) => i.id === id);
    if (!inv) return id;
    return `${inv.id} — ${inv.amount.toLocaleString()} KZT`;
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
          <div className="split-block">
            <div className="split-header">Распределение суммы:</div>

            {splits.map((split, index) => (
              <div className="split-row" key={index}>
                <select
                  value={split.invoice_id}
                  onChange={(e) => handleSplitChange(index, "invoice_id", e.target.value)}
                >
                  <option value="">— выбери счёт —</option>
                  {invoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.id} | {inv.amount.toLocaleString()} KZT | {inv.status}
                    </option>
                  ))}
                </select>
                <input
                  placeholder="сумма"
                  type="number"
                  value={split.amount}
                  onChange={(e) => handleSplitChange(index, "amount", e.target.value)}
                />
                <button onClick={() => handleRemoveSplit(index)}>✕</button>
              </div>
            ))}

            <div
              className="split-remaining"
              style={{ color: isBalanced ? "#22c55e" : "#ef4444" }}
            >
              {isBalanced
                ? "✅ Сумма распределена полностью"
                : `Остаток: ${remaining.toLocaleString()} KZT`}
            </div>

            <div className="split-actions">
              <button onClick={handleAddSplit}>+ Добавить счёт</button>
              <button onClick={handleSave}>💾 Сохранить</button>
              <button onClick={() => setEditing(false)}>Отмена</button>
            </div>
          </div>
        ) : (
          <div className="invoice-row">
            <span>
              {invoice_ids.length > 0
                ? invoice_ids.map(getInvoiceLabel).join(", ")
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