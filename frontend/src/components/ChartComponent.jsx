const LINE_COLORS = ["#155eef", "#0ea5e9", "#15803d", "#9a6700"];

function pointsFor(series, visualOffset = 0) {
  return series
    .map((item, index) => {
      const x = series.length === 1 ? 0 : (index / (series.length - 1)) * 100;
      const y = Math.max(0, Math.min(100, 100 - Math.max(0, Math.min(Number(item.value) || 0, 100)) + visualOffset));
      return `${x},${y}`;
    })
    .join(" ");
}

export default function ChartComponent({ title, items, series = [], seriesGroups = [] }) {
  const copy =
    title === "Health improvement"
      ? "Metric trends plotted from saved wearable records till now."
      : title === "Wearable improvement"
        ? "Improvement percentages calculated from saved wearable history till now."
      : "Quick view of the latest values being sent to or returned from the backend.";
  const hasGroupedSeries = seriesGroups.some((group) => group.values?.length > 1);
  const hasSeries = !hasGroupedSeries && series.length > 1;
  const firstLabel =
    seriesGroups.find((group) => group.values?.length)?.values?.[0]?.label || series[0]?.label;
  const lastGroup = seriesGroups.find((group) => group.values?.length);
  const lastLabel =
    lastGroup?.values?.[lastGroup.values.length - 1]?.label || series[series.length - 1]?.label;

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">{title}</h2>
          <p className="panel-copy">{copy}</p>
        </div>
      </div>

      {hasGroupedSeries || hasSeries ? (
        <div className="line-chart">
          <div className="line-chart-wrap">
            <div className="line-chart-axis">
              <span>100</span>
              <span>50</span>
              <span>0</span>
            </div>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label={`${title} trend`}>
              <polyline className="line-chart-grid" points="0,100 100,100" />
              <polyline className="line-chart-grid" points="0,50 100,50" />
              <polyline className="line-chart-grid" points="0,0 100,0" />
              {hasGroupedSeries ? (
                seriesGroups.map((group, index) => (
                  <polyline
                  className="line-chart-path"
                  key={group.label}
                  points={pointsFor(group.values || [], group.visualOffset || 0)}
                  style={{ stroke: group.color || LINE_COLORS[index % LINE_COLORS.length] }}
                />
                ))
              ) : (
                <polyline className="line-chart-path" points={pointsFor(series)} />
              )}
            </svg>
          </div>
          {hasGroupedSeries ? (
            <div className="line-chart-legend">
              {seriesGroups.map((group, index) => (
                <span key={group.label}>
                  <i style={{ background: group.color || LINE_COLORS[index % LINE_COLORS.length] }} />
                  {group.label}
                </span>
              ))}
            </div>
          ) : null}
          <div className="line-chart-meta">
            <span>{firstLabel}</span>
            <strong>{items[0]?.value ?? series[series.length - 1]?.value}%</strong>
            <span>{lastLabel}</span>
          </div>
        </div>
      ) : null}

      {!hasGroupedSeries && !hasSeries ? (
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
      ) : null}
    </section>
  );
}
