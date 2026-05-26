export default function HealthCard({ label, value, meta, tone = "primary" }) {
  return (
    <article className={`stat-card stat-card-${tone}`}>
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      {meta ? <p className="stat-meta">{meta}</p> : null}
    </article>
  );
}
