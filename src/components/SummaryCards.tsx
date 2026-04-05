import type { RollingWindowAnalysis } from '../types'

interface SummaryCardsProps {
  analysis: RollingWindowAnalysis
}

const STATUS_COPY: Record<RollingWindowAnalysis['status'], string> = {
  green: 'Green now',
  'at-risk': 'Reachable but tight',
  'not-green': 'Not green yet',
  unreachable: 'Window cannot recover',
}

export function SummaryCards({ analysis }: SummaryCardsProps) {
  return (
    <section className="summary-grid">
      <article className="summary-card emphasis">
        <p className="summary-label">Current best 8 total</p>
        <strong>{analysis.best8Total}</strong>
        <span>days counted in the selected 12-week window</span>
      </article>

      <article className="summary-card">
        <p className="summary-label">Needed to hit target</p>
        <strong>{analysis.deficit}</strong>
        <span>
          {analysis.status === 'unreachable'
            ? `max reachable is ${analysis.maxReachableTotal}`
            : `${analysis.minimumAdditionalDaysNeeded} day plan to green`}
        </span>
      </article>

      <article className="summary-card">
        <p className="summary-label">Status</p>
        <strong>{STATUS_COPY[analysis.status]}</strong>
        <span>
          {analysis.status === 'green'
            ? 'You already satisfy the selected goal.'
            : `${analysis.totalRemainingCapacity} open weekdays remain in the selected horizon.`}
        </span>
      </article>

      <article className="summary-card">
        <p className="summary-label">Counted weeks</p>
        <strong>8 of 12</strong>
        <span>{analysis.droppedWeekIndexes.length} weeks currently add no value</span>
      </article>
    </section>
  )
}
