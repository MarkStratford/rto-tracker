import { formatShortDate } from '../lib/date'
import type { ForecastPlan, RollingWindowAnalysis } from '../types'

interface ForecastPlansProps {
  analysis: RollingWindowAnalysis
  plans: ForecastPlan[]
}

export function ForecastPlans({ analysis, plans }: ForecastPlansProps) {
  return (
    <div className="plan-stack">
      {plans.map((plan) => (
        <article key={plan.type} className="plan-card">
          <div className="plan-card-top">
            <div>
              <h3>{plan.label}</h3>
              <p>{plan.description}</p>
            </div>
            <strong>{plan.additionalDaysNeeded}</strong>
          </div>

          {plan.weekSuggestions.length > 0 ? (
            <ul className="plan-list">
              {plan.weekSuggestions.map((suggestion) => (
                <li key={`${plan.type}-${suggestion.weekStart}`}>
                  <span>
                    Week of {formatShortDate(suggestion.weekStart)}: add{' '}
                    {suggestion.recommendedDays}
                  </span>
                  <p>{suggestion.reason}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="plan-empty">
              {analysis.status === 'green'
                ? 'No sprint required in this window.'
                : 'No additional combination of remaining weekdays can reach the target before this window closes.'}
            </p>
          )}
        </article>
      ))}
    </div>
  )
}
