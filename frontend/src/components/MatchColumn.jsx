import MatchCard from "./MatchCard";

export default function MatchColumn({ title, color, items, onAssign, onMarkAdvance }) {
  return (
    <div className="column">
      <div className="column-header" style={{ borderColor: color }}>
        <h2 style={{ color }}>{title}</h2>
        <span className="badge" style={{ background: color }}>{items.length}</span>
      </div>
      <div className="column-body">
        {items.length === 0 && <div className="empty">Нет транзакций</div>}
        {items.map((item) => (
          <MatchCard
            key={item.transaction.tx_id}
            item={item}
            onAssign={onAssign}
            onMarkAdvance={onMarkAdvance}
          />
        ))}
      </div>
    </div>
  );
}