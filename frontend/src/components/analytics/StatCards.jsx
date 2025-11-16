// StatCards.jsx
// Summary cards for: total queries, avg response time, resolution rate, resolved today

export default function StatCards({ summary = {} }) {
  const total = summary.total_queries || 0;
  const avgResponse = summary.avg_response_time || "N/A";
  const resolutionRate = Math.round((summary.resolution_rate || 0) * 100);
  const resolvedToday = summary.resolved_today || 0;

  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      <Card
        title="Avg Response Time"
        value={avgResponse}
        note=""
      />

      <Card
        title="Resolution Rate"
        value={`${resolutionRate}%`}
        note=""
      />

      <Card
        title="Total Queries"
        value={total}
        note=""
      />

      <Card
        title="Resolved Today"
        value={resolvedToday}
        note={`out of ${total}`}
      />
    </div>
  );
}

function Card({ title, value, note }) {
  return (
    <div style={cardStyle}>
      <div style={{ fontSize: 13, color: "#6b7280" }}>{title}</div>
      <div style={{ fontSize: 20, fontWeight: 700, marginTop: 8 }}>{value}</div>
      {note && <div style={{ marginTop: 8, color: "#10b981", fontSize: 13 }}>{note}</div>}
    </div>
  );
}

const cardStyle = {
  background: "#fff",
  borderRadius: 10,
  padding: 16,
  boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
  flex: 1,
};
