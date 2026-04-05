import { formatWeekLabel } from '../lib/date'
import type { RollingWindowAnalysis } from '../types'

interface WeekGridProps {
  analysis: RollingWindowAnalysis
}

export function WeekGrid({ analysis }: WeekGridProps) {
  return (
    <div className="week-grid">
      {analysis.weeks.map((week) => (
        <article
          key={week.weekStart}
          className={[
            'week-card',
            week.isCounted ? 'counted' : 'dropped',
            week.isSprintWeek ? 'sprint' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <div className="week-card-top">
            <p>{formatWeekLabel(week.weekStart, week.weekEnd)}</p>
            <span className={`status-chip ${week.leverageLabel}`}>{week.leverageLabel}</span>
          </div>

          <div className="week-metric-row">
            <div>
              <span className="metric-label">Badge days</span>
              <strong>{week.totalDays}</strong>
            </div>
            <div>
              <span className="metric-label">Still available</span>
              <strong>{week.remainingCapacity}</strong>
            </div>
          </div>

          <p className="week-footnote">
            {week.isCounted
              ? 'Counts toward your best 8 right now.'
              : 'Currently a no-value week unless it climbs into the counted set.'}
          </p>
        </article>
      ))}
    </div>
  )
}
