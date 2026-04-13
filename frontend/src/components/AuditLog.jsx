export default function AuditLog({ logs, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📋 История операций</h2>
          <button onClick={onClose}>✕</button>
        </div>
        {logs.length === 0 ? (
          <div className="empty">История пуста</div>
        ) : (
          logs.map((log) => (
            <div className="log-item" key={log.id}>
              <div><strong>Оператор:</strong> {log.operator}</div>
              <div><strong>Время:</strong> {log.confirmed_at}</div>
              <div><strong>План:</strong> {log.plan_id.slice(0, 8)}...</div>
              <hr style={{border: "none", borderTop: "1px solid #e2e8f0"}} />
              <div style={{fontSize: 13, fontWeight: 600, marginBottom: 4}}>
                Детали ({log.actions.length} транзакций):
              </div>
              {log.actions.map((action) => (
                <div
                  key={action.tx_id}
                  style={{
                    background: "#f8fafc",
                    borderRadius: 6,
                    padding: "8px 10px",
                    fontSize: 13,
                    marginBottom: 4,
                    borderLeft: action.is_advance
                      ? "3px solid #3b82f6"
                      : "3px solid #22c55e"
                  }}
                >
                  <div><strong>{action.tx_id}</strong>
                    {action.is_advance && (
                      <span style={{
                        marginLeft: 8,
                        background: "#dbeafe",
                        color: "#1d4ed8",
                        borderRadius: 4,
                        padding: "1px 6px",
                        fontSize: 11
                      }}>аванс</span>
                    )}
                  </div>
                  <div style={{color: "#64748b"}}>
                    {action.invoice_ids.length > 0
                      ? "→ " + action.invoice_ids.join(", ")
                      : "→ без привязки к счёту"}
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}