import {
  addDays,
  compareDates,
  eachDayInclusive,
  endOfWeekMonday,
  isWeekday,
  startOfDay,
  startOfWeekMonday,
  toIsoDate,
} from '../lib/date'
import type {
  AttendanceRecord,
  ComplianceCalculator,
  ComplianceTarget,
  EvaluatedWeek,
  RollingWindowAnalysis,
  WeeklyAttendance,
} from '../types'

const WINDOW_WEEKS = 12
const COUNTED_WEEKS = 8

interface WeekModel extends WeeklyAttendance {
  remainingCapacity: number
}

interface ComboEvaluation {
  indexes: number[]
  baseTotal: number
  capacity: number
  minimumDays: number
  reachableTotal: number
}

export function analyzeRollingWindow(
  records: AttendanceRecord[],
  target: ComplianceTarget,
  windowEndDate: Date,
  today = new Date(),
): RollingWindowAnalysis {
  const weeks = buildWeeklyAttendance(records, windowEndDate, today)
  const countedWeekIndexes = selectBestWeekIndexes(weeks)
  const droppedWeekIndexes = weeks
    .map((_, index) => index)
    .filter((index) => !countedWeekIndexes.includes(index))
  const best8Total = countedWeekIndexes.reduce(
    (sum, index) => sum + weeks[index].totalDays,
    0,
  )
  const totalRemainingCapacity = weeks.reduce(
    (sum, week) => sum + week.remainingCapacity,
    0,
  )
  const optimal = selectOptimalWeeks(weeks, target)
  const deficit = Math.max(0, target - best8Total)
  const status = deriveStatus(best8Total, target, optimal, totalRemainingCapacity)

  const evaluatedWeeks: EvaluatedWeek[] = weeks.map((week, index) => ({
    ...week,
    isCounted: countedWeekIndexes.includes(index),
    isDropped: droppedWeekIndexes.includes(index),
    isSprintWeek: optimal.indexes.includes(index) && week.remainingCapacity > 0,
    leverageLabel: getLeverageLabel(week, index, countedWeekIndexes, optimal.indexes),
  }))

  return {
    weeks: evaluatedWeeks,
    countedWeekIndexes,
    droppedWeekIndexes,
    best8Total,
    target,
    deficit,
    status,
    totalRemainingCapacity,
    maxReachableTotal: optimal.reachableTotal,
    optimalWeekIndexes: optimal.indexes,
    minimumAdditionalDaysNeeded:
      optimal.minimumDays === Number.POSITIVE_INFINITY ? deficit : optimal.minimumDays,
    windowEndDate: toIsoDate(windowEndDate),
  }
}

export const DefaultComplianceCalculator: ComplianceCalculator = {
  analyze: analyzeRollingWindow,
}

export function buildWeeklyAttendance(
  records: AttendanceRecord[],
  windowEndDate: Date,
  today = new Date(),
): WeekModel[] {
  const attendanceByDate = new Set(
    records.filter((record) => record.inOffice).map((record) => record.date),
  )
  const endWeekStart = startOfWeekMonday(windowEndDate)
  const firstWeekStart = addDays(endWeekStart, -7 * (WINDOW_WEEKS - 1))

  return Array.from({ length: WINDOW_WEEKS }, (_, index) => {
    const weekStart = addDays(firstWeekStart, index * 7)
    const weekEnd = endOfWeekMonday(weekStart)
    const weekStartIso = toIsoDate(weekStart)
    const weekEndIso = toIsoDate(weekEnd)
    const totalDays = eachDayInclusive(weekStart, weekEnd).filter((day) =>
      attendanceByDate.has(toIsoDate(day)),
    ).length

    return {
      weekStart: weekStartIso,
      weekEnd: weekEndIso,
      totalDays,
      isComplete: compareDates(today, weekEnd) > 0,
      remainingCapacity: countRemainingCapacity(
        weekStart,
        weekEnd,
        attendanceByDate,
        today,
      ),
    }
  })
}

export function selectBestWeekIndexes(weeks: WeeklyAttendance[]): number[] {
  return weeks
    .map((week, index) => ({
      index,
      totalDays: week.totalDays,
      weekStart: week.weekStart,
    }))
    .sort((left, right) => {
      if (right.totalDays !== left.totalDays) {
        return right.totalDays - left.totalDays
      }

      return right.weekStart.localeCompare(left.weekStart)
    })
    .slice(0, COUNTED_WEEKS)
    .map((item) => item.index)
    .sort((left, right) => left - right)
}

function countRemainingCapacity(
  weekStart: Date,
  weekEnd: Date,
  attendanceByDate: Set<string>,
  today: Date,
): number {
  const firstEligible = compareDates(today, weekStart) > 0 ? startOfDay(today) : weekStart

  if (compareDates(firstEligible, weekEnd) > 0) {
    return 0
  }

  return eachDayInclusive(firstEligible, weekEnd).filter((day) => {
    const iso = toIsoDate(day)
    return isWeekday(day) && !attendanceByDate.has(iso)
  }).length
}

function selectOptimalWeeks(weeks: WeekModel[], target: ComplianceTarget): ComboEvaluation {
  const combinations = buildEightWeekCombinations(weeks.length)
  let best: ComboEvaluation | null = null

  combinations.forEach((indexes) => {
    const baseTotal = indexes.reduce((sum, index) => sum + weeks[index].totalDays, 0)
    const capacity = indexes.reduce(
      (sum, index) => sum + weeks[index].remainingCapacity,
      0,
    )
    const reachableTotal = baseTotal + capacity
    const minimumDays =
      reachableTotal >= target ? Math.max(0, target - baseTotal) : Number.POSITIVE_INFINITY
    const evaluation: ComboEvaluation = {
      indexes,
      baseTotal,
      capacity,
      minimumDays,
      reachableTotal,
    }

    if (!best || isBetterCombo(evaluation, best)) {
      best = evaluation
    }
  })

  return best ?? {
    indexes: [],
    baseTotal: 0,
    capacity: 0,
    minimumDays: Number.POSITIVE_INFINITY,
    reachableTotal: 0,
  }
}

function isBetterCombo(candidate: ComboEvaluation, current: ComboEvaluation): boolean {
  const candidateReachable = candidate.minimumDays !== Number.POSITIVE_INFINITY
  const currentReachable = current.minimumDays !== Number.POSITIVE_INFINITY

  if (candidateReachable && !currentReachable) {
    return true
  }

  if (!candidateReachable && currentReachable) {
    return false
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
    if (current.length === COUNTED_WEEKS) {
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

function deriveStatus(
  best8Total: number,
  target: ComplianceTarget,
  optimal: ComboEvaluation,
  totalRemainingCapacity: number,
): RollingWindowAnalysis['status'] {
  if (best8Total >= target) {
    return 'green'
  }

  if (optimal.reachableTotal < target) {
    return 'unreachable'
  }

  if (optimal.minimumDays > Math.max(2, Math.floor(totalRemainingCapacity / 2))) {
    return 'at-risk'
  }

  return 'not-green'
}

function getLeverageLabel(
  week: WeekModel,
  index: number,
  countedWeekIndexes: number[],
  optimalWeekIndexes: number[],
): EvaluatedWeek['leverageLabel'] {
  if (optimalWeekIndexes.includes(index) && week.remainingCapacity > 0) {
    return 'sprint'
  }

  if (countedWeekIndexes.includes(index)) {
    return week.remainingCapacity > 0 ? 'maintain' : 'locked'
  }

  return 'no-value'
}
