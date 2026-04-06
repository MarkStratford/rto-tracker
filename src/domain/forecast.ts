import { addDays, endOfWeekMonday, formatWeekLabel, toIsoDate } from '../lib/date'
import { annotateWeeks, buildWeeklyAttendance, computeBest8Total, selectBestWeekIndexes } from './compliance'
import type {
  ForecastPlan,
  ForecastService,
  ForwardPlanScenario,
  PlanningOptions,
  WeekOpportunity,
  WeekSuggestion,
  AttendanceRecord,
  WeeklyAttendance,
} from '../types'

interface ComboEvaluation {
  indexes: number[]
  baseTotal: number
  minimumDays: number
  reachableTotal: number
}

const PLAN_RULES: Record<ForecastPlan['type'], { label: string; description: string; order: 'capacity' | 'balanced' | 'chronological' }> = {
  minimum: {
    label: 'Minimum to green',
    description: 'Use the fewest additional badge days across the strongest open weeks.',
    order: 'capacity',
  },
  balanced: {
    label: 'Balanced plan',
    description: 'Spread the remaining days across multiple valuable weeks.',
    order: 'balanced',
  },
  sprint: {
    label: 'Sprint plan',
    description: 'Front-load the earliest high-value weeks to get green sooner.',
    order: 'chronological',
  },
}

export function buildForwardPlanScenario(
  records: AttendanceRecord[],
  options: PlanningOptions,
  today = new Date(),
): ForwardPlanScenario {
  const currentAnalysisWeeks = buildWeeklyAttendance(records, endOfWeekMonday(today), today)
  const currentBest8Total = computeBest8Total(currentAnalysisWeeks)
  const planningWindowEndDate = endOfWeekMonday(addDays(today, options.horizonWeeks * 7))
  const planningWeeks = buildWeeklyAttendance(records, planningWindowEndDate, today)
  const countedWeekIndexes = selectBestWeekIndexes(planningWeeks)
  const optimal = selectOptimalWeeks(planningWeeks, options.target)
  const status = derivePlannerStatus(optimal.baseTotal, options.target, optimal.reachableTotal)
  const weeks = annotateWeeks(planningWeeks, countedWeekIndexes, optimal.indexes)
  const plans = buildPlans(weeks, optimal.indexes, optimal.minimumDays, optimal.reachableTotal, status, options.target)
  const opportunities = buildWeekOpportunities(planningWeeks)

  return {
    weeks,
    target: options.target,
    horizonWeeks: options.horizonWeeks,
    currentBest8Total,
    projectedBest8Total: optimal.baseTotal,
    additionalDaysNeeded:
      optimal.minimumDays === Number.POSITIVE_INFINITY
        ? Math.max(0, options.target - optimal.baseTotal)
        : optimal.minimumDays,
    status,
    planningWindowEndDate: toIsoDate(planningWindowEndDate),
    maxReachableTotal: optimal.reachableTotal,
    plans,
    opportunities,
  }
}

export const DefaultForecastService: ForecastService = {
  buildScenario: buildForwardPlanScenario,
}

function selectOptimalWeeks(weeks: WeeklyAttendance[], target: number): ComboEvaluation {
  const combinations = buildEightWeekCombinations(weeks.length)
  let best: ComboEvaluation | null = null

  combinations.forEach((indexes) => {
    const baseTotal = indexes.reduce((sum, index) => sum + weeks[index].totalDays, 0)
    const reachableTotal = indexes.reduce(
      (sum, index) => sum + weeks[index].totalDays + weeks[index].remainingCapacity,
      0,
    )
    const minimumDays =
      reachableTotal >= target ? Math.max(0, target - baseTotal) : Number.POSITIVE_INFINITY
    const candidate: ComboEvaluation = {
      indexes,
      baseTotal,
      minimumDays,
      reachableTotal,
    }

    if (!best || isBetterCombo(candidate, best)) {
      best = candidate
    }
  })

  return best ?? {
    indexes: [],
    baseTotal: 0,
    minimumDays: Number.POSITIVE_INFINITY,
    reachableTotal: 0,
  }
}

function isBetterCombo(candidate: ComboEvaluation, current: ComboEvaluation): boolean {
  const candidateReachable = candidate.minimumDays !== Number.POSITIVE_INFINITY
  const currentReachable = current.minimumDays !== Number.POSITIVE_INFINITY

  if (candidateReachable !== currentReachable) {
    return candidateReachable
  }

  if (candidate.minimumDays !== current.minimumDays) {
    return candidate.minimumDays < current.minimumDays
  }

  if (candidate.reachableTotal !== current.reachableTotal) {
    return candidate.reachableTotal > current.reachableTotal
  }

  if (candidate.baseTotal !== current.baseTotal) {
    return candidate.baseTotal > current.baseTotal
  }

  return candidate.indexes.join(',') > current.indexes.join(',')
}

function buildEightWeekCombinations(weekCount: number): number[][] {
  const result: number[][] = []

  const pick = (start: number, current: number[]) => {
    if (current.length === 8) {
      result.push([...current])
      return
    }

    for (let index = start; index < weekCount; index += 1) {
      current.push(index)
      pick(index + 1, current)
      current.pop()
    }
  }

  pick(0, [])
  return result
}

function derivePlannerStatus(
  projectedBest8Total: number,
  target: number,
  maxReachableTotal: number,
): ForwardPlanScenario['status'] {
  if (projectedBest8Total >= target) {
    return 'green'
  }

  if (maxReachableTotal < target) {
    return 'unreachable'
  }

  return 'not-green'
}

function buildPlans(
  weeks: ForwardPlanScenario['weeks'],
  optimalWeekIndexes: number[],
  minimumAdditionalDaysNeeded: number,
  maxReachableTotal: number,
  status: ForwardPlanScenario['status'],
  target: number,
): ForecastPlan[] {
  return (Object.keys(PLAN_RULES) as ForecastPlan['type'][]).map((type) => {
    const rule = PLAN_RULES[type]
    const candidateWeeks = weeks
      .map((week, index) => ({ ...week, index }))
      .filter((week) => optimalWeekIndexes.includes(week.index) && week.remainingCapacity > 0)

    if (status === 'green') {
      return {
        type,
        label: rule.label,
        description: 'You are already projected to be green within this planning horizon.',
        additionalDaysNeeded: 0,
        weekSuggestions: [],
      }
    }

    if (status === 'unreachable' || candidateWeeks.length === 0) {
      return {
        type,
        label: rule.label,
        description: `This planning horizon tops out at ${maxReachableTotal} counted days, so the target remains out of reach.`,
        additionalDaysNeeded: Math.max(0, target - maxReachableTotal),
        weekSuggestions: [],
      }
    }

    const weekSuggestions = allocateSuggestions(
      candidateWeeks,
      minimumAdditionalDaysNeeded,
      rule.order,
    )

    return {
      type,
      label: rule.label,
      description: rule.description,
      additionalDaysNeeded: minimumAdditionalDaysNeeded,
      weekSuggestions,
    }
  })
}

function allocateSuggestions(
  weeks: Array<ForwardPlanScenario['weeks'][number] & { index: number }>,
  neededDays: number,
  order: 'capacity' | 'balanced' | 'chronological',
): WeekSuggestion[] {
  const working = weeks.map((week) => ({ ...week, recommendedDays: 0 }))
  let remaining = neededDays

  if (order === 'capacity') {
    working.sort((left, right) => right.remainingCapacity - left.remainingCapacity)
  } else if (order === 'chronological') {
    working.sort((left, right) => left.weekStart.localeCompare(right.weekStart))
  } else {
    working.sort((left, right) => left.weekStart.localeCompare(right.weekStart))
  }

  if (order === 'balanced') {
    while (remaining > 0) {
      let progressed = false

      for (const week of working) {
        if (remaining <= 0) {
          break
        }

        if (week.recommendedDays < week.remainingCapacity) {
          week.recommendedDays += 1
          remaining -= 1
          progressed = true
        }
      }

      if (!progressed) {
        break
      }
    }
  } else {
    for (const week of working) {
      if (remaining <= 0) {
        break
      }

      const assigned = Math.min(remaining, week.remainingCapacity)
      week.recommendedDays = assigned
      remaining -= assigned
    }
  }

  return working
    .filter((week) => week.recommendedDays > 0)
    .map((week) => ({
      weekStart: week.weekStart,
      recommendedDays: week.recommendedDays,
      reason: getSuggestionReason(week.explanation.state, week.weekStart, week.weekEnd),
    }))
}

function getSuggestionReason(
  state: ForwardPlanScenario['weeks'][number]['explanation']['state'],
  weekStart: string,
  weekEnd: string,
): string {
  const label = formatWeekLabel(weekStart, weekEnd)

  if (state === 'candidate') {
    return `${label} is a best sprint candidate in this planning horizon.`
  }

  if (state === 'counted') {
    return `${label} already counts, so each extra day pads your projected best 8.`
  }

  return `${label} is dropped right now, but another day can pull it into the counted set.`
}

function buildWeekOpportunities(weeks: WeeklyAttendance[]): WeekOpportunity[] {
  const baseBest8Total = computeBest8Total(weeks)

  return weeks
    .map((week, index) => {
      if (week.remainingCapacity <= 0) {
        return null
      }

      const nextWeeks = weeks.map((entry, weekIndex) =>
        weekIndex === index ? { ...entry, totalDays: entry.totalDays + 1 } : entry,
      )
      const nextBest8Total = computeBest8Total(nextWeeks)
      const gain = nextBest8Total - baseBest8Total

      return {
        weekStart: week.weekStart,
        gain,
        reason:
          gain > 0
            ? 'One more office day would increase the projected best-8 score.'
            : 'One more office day would not change the projected best-8 score yet.',
      }
    })
    .filter((item): item is WeekOpportunity => Boolean(item))
    .sort((left, right) => right.gain - left.gain || left.weekStart.localeCompare(right.weekStart))
    .slice(0, 5)
}
