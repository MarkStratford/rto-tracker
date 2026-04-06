import { formatWeekLabel } from '../lib/date'
import type { CurrentWindowAnalysis } from '../types'

interface SummaryCardsProps {
  analysis: CurrentWindowAnalysis
}

export function SummaryCards({ analysis }: SummaryCardsProps) {
  return (
    <section className="summary-grid">
      <article className="summary-card emphasis">
        <p className="summary-label">Actual current status</p>
        <strong>{analysis.best8Total}</strong>
        <span>
          counted days in the real trailing window {formatWeekLabel(analysis.windowStartDate, analysis.windowEndDate)}
        </span>
      </article>

      <article className="summary-card">
        <p className="summary-label">Target gap today</p>
        <strong>{analysis.deficit}</strong>
        <span>days short of the selected {analysis.target}-day target</span>
      </article>

      <article className="summary-card">
        <p className="summary-label">Current state</p>
        <strong>{analysis.status === 'green' ? 'Green now' : 'Not green yet'}</strong>
        <span>
          {analysis.currentWeekRemainingCapacity} open weekdays remain in the current week.
        </span>
      </article>

      <article className="summary-card">
        <p className="summary-label">Counted vs dropped</p>
        <strong>8 of 12</strong>
        <span>{analysis.droppedWeekIndexes.length} weeks currently add no value</span>
      </article>
    </section>
  )
}
