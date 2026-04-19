export default function ChartComponent({ title, items }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">{title}</h2>
          <p className="panel-copy">Quick view of the latest values being sent to or returned from the backend.</p>
        </div>
      </div>

      <div className="chart">
        {items.length ? (
          items.map((item) => (
            <div className="chart-row" key={item.label}>
              <span>{item.label}</span>
              <div className="chart-track">
                <div className="chart-fill" style={{ width: `${item.value}%` }} />
              </div>
              <span>{item.value}%</span>
            </div>
          ))
        ) : (
          <div className="empty-state">No signal data loaded yet.</div>
        )}
      </div>
    </section>
  );
}
