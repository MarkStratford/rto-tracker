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
  AnalyzedWeek,
  AttendanceRecord,
  ComplianceCalculator,
  ComplianceTarget,
  CurrentWindowAnalysis,
  WeekExplanation,
  WeekPhase,
  WeeklyAttendance,
} from '../types'

const WINDOW_WEEKS = 12
const COUNTED_WEEKS = 8

export interface WeekModel extends WeeklyAttendance {}

export function analyzeCurrentWindow(
  records: AttendanceRecord[],
  target: ComplianceTarget,
  today = new Date(),
): CurrentWindowAnalysis {
  const windowEnd = endOfWeekMonday(today)
  const weeks = buildWeeklyAttendance(records, windowEnd, today)
  const countedWeekIndexes = selectBestWeekIndexes(weeks)
  const droppedWeekIndexes = weeks
    .map((_, index) => index)
    .filter((index) => !countedWeekIndexes.includes(index))
  const best8Total = countedWeekIndexes.reduce(
    (sum, index) => sum + weeks[index].totalDays,
    0,
  )
  const currentWeekRemainingCapacity =
    weeks.find((week) => week.phase === 'current')?.remainingCapacity ?? 0

  return {
    weeks: annotateWeeks(weeks, countedWeekIndexes),
    countedWeekIndexes,
    droppedWeekIndexes,
    best8Total,
    target,
    deficit: Math.max(0, target - best8Total),
    status: best8Total >= target ? 'green' : 'not-green',
    windowStartDate: weeks[0]?.weekStart ?? toIsoDate(startOfWeekMonday(today)),
    windowEndDate: weeks.at(-1)?.weekEnd ?? toIsoDate(windowEnd),
    currentWeekRemainingCapacity,
  }
}

export const DefaultComplianceCalculator: ComplianceCalculator = {
  analyzeCurrent: analyzeCurrentWindow,
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
    const totalDays = eachDayInclusive(weekStart, weekEnd).filter((day) =>
      attendanceByDate.has(toIsoDate(day)),
    ).length

    return {
      weekStart: toIsoDate(weekStart),
      weekEnd: toIsoDate(weekEnd),
      totalDays,
      isComplete: compareDates(today, weekEnd) > 0,
      remainingCapacity: countRemainingCapacity(
        weekStart,
        weekEnd,
        attendanceByDate,
        today,
      ),
      phase: getWeekPhase(weekStart, weekEnd, today),
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

export function computeBest8Total(weeks: WeeklyAttendance[]): number {
  return selectBestWeekIndexes(weeks).reduce((sum, index) => sum + weeks[index].totalDays, 0)
}

function countRemainingCapacity(
  weekStart: Date,
  weekEnd: Date,
  attendanceByDate: Set<string>,
  today: Date,
): number {
  const todayStart = startOfDay(today)
  const firstEligible = compareDates(todayStart, weekStart) > 0 ? todayStart : weekStart

  if (compareDates(firstEligible, weekEnd) > 0) {
    return 0
  }

  return eachDayInclusive(firstEligible, weekEnd).filter((day) => {
    const iso = toIsoDate(day)
    return isWeekday(day) && !attendanceByDate.has(iso)
  }).length
}

function getWeekPhase(weekStart: Date, weekEnd: Date, today: Date): WeekPhase {
  if (compareDates(today, weekStart) < 0) {
    return 'future'
  }

  if (compareDates(today, weekEnd) > 0) {
    return 'past'
  }

  return 'current'
}

export function annotateWeeks(
  weeks: WeekModel[],
  countedWeekIndexes: number[],
  candidateWeekIndexes: number[] = [],
): AnalyzedWeek[] {
  return weeks.map((week, index) => ({
    ...week,
    isCounted: countedWeekIndexes.includes(index),
    explanation: getWeekExplanation(
      week,
      countedWeekIndexes.includes(index),
      candidateWeekIndexes.includes(index),
    ),
  }))
}

function getWeekExplanation(
  week: WeekModel,
  isCounted: boolean,
  isCandidate: boolean,
): WeekExplanation {
  if (isCandidate && week.remainingCapacity > 0) {
    return {
      state: 'candidate',
      reason:
        week.phase === 'future'
          ? 'Best sprint candidate in the forward planner.'
          : 'Best sprint candidate if you add another office day.',
    }
  }

  if (isCounted) {
    return {
      state: 'counted',
      reason:
        week.phase === 'current'
          ? 'Counting now, and still open this week.'
          : 'Counting now in your best 8.',
    }
  }

  return {
    state: 'dropped',
    reason:
      week.phase === 'future'
        ? 'Currently outside the counted set until planning adds value.'
        : 'Currently dropped from your best 8.',
  }
}
