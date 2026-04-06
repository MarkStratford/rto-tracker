import { formatShortDate } from '../lib/date'
import type { CurrentWindowAnalysis } from '../types'

interface WeeklyBreakdownProps {
  analysis: CurrentWindowAnalysis
}

export function WeeklyBreakdown({ analysis }: WeeklyBreakdownProps) {
  const max = Math.max(...analysis.weeks.map((week) => week.totalDays), 1)

  return (
    <section className="breakdown-card">
      <div className="section-title-row">
        <p className="section-kicker">Weekly breakdown</p>
      </div>

      <div className="breakdown-list">
        {analysis.weeks.map((week) => (
          <div key={week.weekStart} className="breakdown-row">
            <span className="breakdown-label">{formatShortDate(week.weekStart)}</span>
            <div className="breakdown-bar">
              <div
                className={[
                  'breakdown-fill',
                  week.explanation.state,
                ].join(' ')}
                style={{ width: `${(week.totalDays / max) * 100}%` }}
              />
            </div>
            <strong className="breakdown-value">{week.totalDays}</strong>
          </div>
        ))}
      </div>
    </section>
  )
}
