import { formatWeekLabel } from '../lib/date'
import type { ForecastPlan, ForecastService, RollingWindowAnalysis } from '../types'

interface AllocationRule {
  label: string
  description: string
  order: 'capacity' | 'balanced' | 'chronological'
}

const PLAN_RULES: Record<ForecastPlan['type'], AllocationRule> = {
  minimum: {
    label: 'Minimum to green',
    description: 'Concentrate the fewest possible extra days into the strongest open weeks.',
    order: 'capacity',
  },
  balanced: {
    label: 'Balanced plan',
    description: 'Spread the load across the weeks that still have room to help.',
    order: 'balanced',
  },
  sprint: {
    label: 'Sprint plan',
    description: 'Front-load the next valuable weeks so you can turn green as early as possible.',
    order: 'chronological',
  },
}

export function buildForecastPlans(analysis: RollingWindowAnalysis): ForecastPlan[] {
  return (Object.keys(PLAN_RULES) as ForecastPlan['type'][]).map((type) =>
    buildPlanForType(analysis, type),
  )
}

export const DefaultForecastService: ForecastService = {
  buildPlans: buildForecastPlans,
}

function buildPlanForType(
  analysis: RollingWindowAnalysis,
  type: ForecastPlan['type'],
): ForecastPlan {
  const rule = PLAN_RULES[type]
  const candidateWeeks = analysis.weeks
    .map((week, index) => ({ ...week, index }))
    .filter((week) => analysis.optimalWeekIndexes.includes(week.index) && week.remainingCapacity > 0)

  if (analysis.status === 'green') {
    return {
      type,
      label: rule.label,
      description: 'You are already green in the selected window.',
      additionalDaysNeeded: 0,
      weekSuggestions: [],
    }
  }

  if (analysis.status === 'unreachable' || candidateWeeks.length === 0) {
    return {
      type,
      label: rule.label,
      description: `This window tops out at ${analysis.maxReachableTotal} days, so the target cannot be reached before it closes.`,
      additionalDaysNeeded: analysis.minimumAdditionalDaysNeeded,
      weekSuggestions: [],
    }
  }

  const allocations = allocateDays(
    candidateWeeks,
    analysis.minimumAdditionalDaysNeeded,
    rule.order,
  )

  return {
    type,
    label: rule.label,
    description: rule.description,
    additionalDaysNeeded: analysis.minimumAdditionalDaysNeeded,
    weekSuggestions: allocations
      .filter((week) => week.recommendedDays > 0)
      .map((week) => ({
        weekStart: week.weekStart,
        recommendedDays: week.recommendedDays,
        reason: getReason(
          type,
          week.isDropped,
          week.recommendedDays,
          week.weekStart,
          week.weekEnd,
        ),
      })),
  }
}

function allocateDays(
  candidateWeeks: Array<{
    index: number
    weekStart: string
    weekEnd: string
    totalDays: number
    remainingCapacity: number
    isDropped: boolean
  }>,
  neededDays: number,
  order: AllocationRule['order'],
) {
  const weeks = [...candidateWeeks].map((week) => ({ ...week, recommendedDays: 0 }))
  let remaining = neededDays

  if (order === 'capacity') {
    weeks.sort((left, right) => {
      if (right.remainingCapacity !== left.remainingCapacity) {
        return right.remainingCapacity - left.remainingCapacity
      }

      if (left.isDropped !== right.isDropped) {
        return Number(left.isDropped) - Number(right.isDropped)
      }

      return right.totalDays - left.totalDays
    })

    weeks.forEach((week) => {
      if (remaining <= 0) {
        return
      }

      const assigned = Math.min(week.remainingCapacity, remaining)
      week.recommendedDays = assigned
      remaining -= assigned
    })

    return weeks
  }

  if (order === 'chronological') {
    weeks.sort((left, right) => left.weekStart.localeCompare(right.weekStart))

    weeks.forEach((week) => {
      if (remaining <= 0) {
        return
      }

      const assigned = Math.min(week.remainingCapacity, remaining)
      week.recommendedDays = assigned
      remaining -= assigned
    })

    return weeks
  }

  weeks.sort((left, right) => left.weekStart.localeCompare(right.weekStart))

  while (remaining > 0) {
    let progress = false

    for (const week of weeks) {
      if (remaining <= 0) {
        break
      }

      if (week.recommendedDays < week.remainingCapacity) {
        week.recommendedDays += 1
        remaining -= 1
        progress = true
      }
    }

    if (!progress) {
      break
    }
  }

  return weeks
}

function getReason(
  type: ForecastPlan['type'],
  isDropped: boolean,
  recommendedDays: number,
  weekStart: string,
  weekEnd: string,
): string {
  const weekLabel = formatWeekLabel(weekStart, weekEnd)

  if (isDropped) {
    return `${weekLabel} is currently a no-value week, so ${recommendedDays} added day${recommendedDays === 1 ? '' : 's'} can help it break into the counted eight.`
  }

  if (type === 'balanced') {
    return `${weekLabel} is part of the counted path, and sharing the load here keeps the plan distributed.`
  }

  if (type === 'sprint') {
    return `${weekLabel} is the earliest open leverage week, making it the fastest place to bank compliance days.`
  }

  return `${weekLabel} has open capacity and converts directly into your best-8 total with the fewest extra moves.`
}
