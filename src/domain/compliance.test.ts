import { describe, expect, it } from 'vitest'
import { analyzeCurrentWindow, buildWeeklyAttendance, selectBestWeekIndexes } from './compliance'
import { addDays, startOfWeekMonday, toIsoDate } from '../lib/date'
import type { AttendanceRecord } from '../types'

function makeWeekRecords(
  weekStart: Date,
  daysInOffice: number,
  offsets = [0, 1, 2, 3, 4],
): AttendanceRecord[] {
  return Array.from({ length: daysInOffice }, (_, index) => ({
    date: toIsoDate(addDays(weekStart, offsets[index])),
    inOffice: true,
    source: 'manual',
  }))
}

describe('current compliance engine', () => {
  it('builds Monday to Sunday weeks', () => {
    const today = new Date('2026-04-08')
    const weeks = buildWeeklyAttendance([], new Date('2026-04-12'), today)

    expect(weeks.at(-1)?.weekStart).toBe('2026-04-06')
    expect(weeks.at(-1)?.weekEnd).toBe('2026-04-12')
  })

  it('selects the top 8 weeks and uses recency as the tie-breaker', () => {
    const weeks = Array.from({ length: 12 }, (_, index) => ({
      weekStart: `2026-01-${String(index + 1).padStart(2, '0')}`,
      weekEnd: `2026-01-${String(index + 7).padStart(2, '0')}`,
      totalDays: index < 4 ? 2 : 3,
      isComplete: true,
      remainingCapacity: 0,
      phase: 'past' as const,
    }))

    expect(selectBestWeekIndexes(weeks)).toEqual([4, 5, 6, 7, 8, 9, 10, 11])
  })

  it('keeps the current analysis anchored to the trailing current window', () => {
    const today = new Date('2026-04-08')
    const currentWeekStart = startOfWeekMonday(today)
    const oldestWeekStart = addDays(currentWeekStart, -77)
    const weeklyTotals = [1, 2, 3, 0, 4, 2, 1, 5, 3, 2, 4, 1]
    const records = weeklyTotals.flatMap((days, index) =>
      makeWeekRecords(addDays(oldestWeekStart, index * 7), days),
    )

    const analysis = analyzeCurrentWindow(records, 24, today)

    expect(analysis.windowEndDate).toBe('2026-04-12')
    expect(analysis.best8Total).toBe(25)
    expect(analysis.status).toBe('green')
  })

  it('marks exact-threshold shortfalls as not green yet', () => {
    const today = new Date('2026-04-08')
    const currentWeekStart = startOfWeekMonday(today)
    const oldestWeekStart = addDays(currentWeekStart, -77)
    const weeklyTotals = [0, 0, 1, 1, 2, 1, 0, 2, 2, 1, 0, 0]
    const records = weeklyTotals.flatMap((days, index) =>
      makeWeekRecords(addDays(oldestWeekStart, index * 7), days),
    )

    const analysis = analyzeCurrentWindow(records, 20, today)

    expect(analysis.status).toBe('not-green')
    expect(analysis.deficit).toBeGreaterThan(0)
  })
})
