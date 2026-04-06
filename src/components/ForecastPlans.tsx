import { formatShortDate } from '../lib/date'
import type { ForwardPlanScenario } from '../types'

interface ForecastPlansProps {
  scenario: ForwardPlanScenario
}

export function ForecastPlans({ scenario }: ForecastPlansProps) {
  return (
    <div className="plan-stack">
      {scenario.plans.map((plan) => (
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
                    Week of {formatShortDate(suggestion.weekStart)}: add {suggestion.recommendedDays}
                  </span>
                  <p>{suggestion.reason}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="plan-empty">
              {scenario.status === 'green'
                ? 'This horizon is already green without extra planning.'
                : 'No combination of remaining weekdays reaches the target in this horizon.'}
            </p>
          )}
        </article>
      ))}
    </div>
  )
}
