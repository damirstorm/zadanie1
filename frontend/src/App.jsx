import { useState } from "react";
import { reconcile, confirmPlan, getAudit } from "./api";
import MatchColumn from "./components/MatchColumn";
import AuditLog from "./components/AuditLog";
import "./App.css";

export default function App() {
  const [plan, setPlan] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [audit, setAudit] = useState([]);
  const [showAudit, setShowAudit] = useState(false);
  const [operator, setOperator] = useState("operator1");

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    setConfirmed(false);
    try {
      const res = await reconcile(file);
      setPlan(res.data);
      setMatches(res.data.matches.map((m) => ({ ...m, is_advance: false })));
    } catch (err) {
      alert("Ошибка загрузки: " + err.message);
    }
    setLoading(false);
  };

  const handleAssign = (txId, invoiceIds) => {
    setMatches((prev) =>
      prev.map((m) =>
        m.transaction.tx_id === txId
          ? { ...m, invoice_ids: invoiceIds, status: "UNCERTAIN" }
          : m
      )
    );
  };

  const handleMarkAdvance = (txId, value) => {
    setMatches((prev) =>
      prev.map((m) =>
        m.transaction.tx_id === txId ? { ...m, is_advance: value } : m
      )
    );
  };

  const handleConfirm = async () => {
    if (!plan) return;
    try {
      await confirmPlan(
        plan.plan_id,
        operator,
        matches.map((m) => ({
          tx_id: m.transaction.tx_id,
          invoice_ids: m.invoice_ids,
          is_advance: m.is_advance || false,
        }))
      );
      setConfirmed(true);
    } catch (err) {
      alert("Ошибка подтверждения: " + err.message);
    }
  };

  const handleShowAudit = async () => {
    const res = await getAudit();
    setAudit(res.data);
    setShowAudit(true);
  };

  const auto = matches.filter((m) => m.status === "AUTO");
  const uncertain = matches.filter((m) => m.status === "UNCERTAIN");
  const unmatched = matches.filter((m) => m.status === "UNMATCHED");

  return (
    <div className="app">
      <header className="header">
        <h1>💳 Сверка платежей</h1>
        <div className="header-controls">
          <input
            className="operator-input"
            value={operator}
            onChange={(e) => setOperator(e.target.value)}
            placeholder="Имя оператора"
          />
          <label className="upload-btn">
            📂 Загрузить выписку
            <input type="file" accept=".csv" onChange={handleFileUpload} hidden />
          </label>
          <button className="audit-btn" onClick={handleShowAudit}>
            📋 История
          </button>
        </div>
      </header>

      {loading && <div className="loading">⏳ Обработка выписки...</div>}

      {plan && !loading && (
        <>
          <div className="plan-info">
            <span>План: <code>{plan.plan_id.slice(0, 8)}...</code></span>
            <span>Транзакций: {matches.length}</span>
          </div>

          <div className="columns">
            <MatchColumn
              title="✅ Автоматически"
              color="#22c55e"
              items={auto}
              onAssign={handleAssign}
              onMarkAdvance={handleMarkAdvance}
            />
            <MatchColumn
              title="⚠️ Под вопросом"
              color="#f59e0b"
              items={uncertain}
              onAssign={handleAssign}
              onMarkAdvance={handleMarkAdvance}
            />
            <MatchColumn
              title="❌ Не сматчено"
              color="#ef4444"
              items={unmatched}
              onAssign={handleAssign}
              onMarkAdvance={handleMarkAdvance}
            />
          </div>

          <div className="confirm-bar">
            {confirmed ? (
              <div className="success">✅ План подтверждён! Счета обновлены.</div>
            ) : (
              <button className="confirm-btn" onClick={handleConfirm}>
                Подтвердить план
              </button>
            )}
          </div>
        </>
      )}

      {showAudit && (
        <AuditLog logs={audit} onClose={() => setShowAudit(false)} />
      )}
    </div>
  );
}