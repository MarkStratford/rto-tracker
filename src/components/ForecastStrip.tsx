interface ForecastStripProps {
  daysRemaining: number
  workdaysLeft: number
  daysPerWeekNeeded: number
  warning: string
}

export function ForecastStrip({
  daysRemaining,
  workdaysLeft,
  daysPerWeekNeeded,
  warning,
}: ForecastStripProps) {
  return (
    <section className="forecast-section">
      <div className="section-title-row">
        <p className="section-kicker">Forecast</p>
      </div>

      <div className="forecast-grid">
        <article className="forecast-card">
          <span className="forecast-icon">+</span>
          <strong>{daysRemaining}</strong>
          <small>Days remaining</small>
        </article>
        <article className="forecast-card">
          <span className="forecast-icon">o</span>
          <strong>{workdaysLeft}</strong>
          <small>Workdays left in window</small>
        </article>
        <article className="forecast-card">
          <span className="forecast-icon">^</span>
          <strong>{daysPerWeekNeeded}</strong>
          <small>Days/week needed</small>
        </article>
      </div>

      <p className="forecast-warning">{warning}</p>
    </section>
  )
}
