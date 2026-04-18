export default function ChartComponent({ title, items }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">{title}</h2>
          <p className="panel-copy">Clinical signal distribution mapped into readable ranges.</p>
        </div>
      </div>

      <div className="chart">
        {items.map((item) => (
          <div className="chart-row" key={item.label}>
            <span>{item.label}</span>
            <div className="chart-track">
              <div className="chart-fill" style={{ width: `${item.value}%` }} />
            </div>
            <span>{item.value}%</span>
          </div>
        ))}
      </div>
    </section>
  );
}
