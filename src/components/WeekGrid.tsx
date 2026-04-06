import { formatWeekLabel } from '../lib/date'
import type { AnalyzedWeek } from '../types'

interface WeekGridProps {
  title: string
  subtitle: string
  weeks: AnalyzedWeek[]
}

export function WeekGrid({ title, subtitle, weeks }: WeekGridProps) {
  return (
    <section>
      <div className="panel-heading week-grid-heading">
        <div>
          <p className="section-kicker">{title}</p>
          <h2>{subtitle}</h2>
        </div>
      </div>

      <div className="week-grid">
        {weeks.map((week) => (
          <article
            key={week.weekStart}
            className={[
              'week-card',
              week.explanation.state,
              week.phase,
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <div className="week-card-top">
              <p>{formatWeekLabel(week.weekStart, week.weekEnd)}</p>
              <span className={`status-chip ${week.explanation.state}`}>
                {week.explanation.state}
              </span>
            </div>

            <div className="week-metric-row">
              <div>
                <span className="metric-label">Badge days</span>
                <strong>{week.totalDays}</strong>
              </div>
              <div>
                <span className="metric-label">Open weekdays</span>
                <strong>{week.remainingCapacity}</strong>
              </div>
            </div>

            <p className="week-phase">{week.phase}</p>
            <p className="week-footnote">{week.explanation.reason}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
