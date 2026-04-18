export default function HealthCard({ label, value, tone = "primary" }) {
  return (
    <article className="stat-card">
      <p className="stat-label">{label}</p>
      <p className="stat-value" style={{ color: `var(--${tone})` }}>
        {value}
      </p>
    </article>
  );
}
