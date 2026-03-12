export default function DashboardPage() {
  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24 }}>
        ダッシュボード
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        <StatCard label="進行中プロジェクト" value="0" />
        <StatCard label="未完了タスク" value="0" />
        <StatCard label="遅延タスク" value="0" color="#ef4444" />
        <StatCard label="過負荷メンバー" value="0" color="#f59e0b" />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color = "#2563eb",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        borderRadius: 8,
        padding: 20,
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
      }}
    >
      <p style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 700, color }}>{value}</p>
    </div>
  );
}
