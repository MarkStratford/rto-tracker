import { describe, expect, it } from 'vitest'
import { analyzeCurrentWindow } from './compliance'
import { buildForwardPlanScenario } from './forecast'
import { addDays, startOfWeekMonday, toIsoDate } from '../lib/date'
import type { AttendanceRecord } from '../types'

function makeRecords(weekTotals: number[], currentWeekStart: Date): AttendanceRecord[] {
  const oldestWeekStart = addDays(currentWeekStart, -77)

  return weekTotals.flatMap((days, weekIndex) =>
    Array.from({ length: days }, (_, dayIndex) => ({
      date: toIsoDate(addDays(addDays(oldestWeekStart, weekIndex * 7), dayIndex)),
      inOffice: true,
      source: 'manual' as const,
    })),
  )
}

describe('forward planner', () => {
  it('does not mutate the current trailing window score when horizon changes', () => {
    const today = new Date('2026-04-08')
    const currentWeekStart = startOfWeekMonday(today)
    const records = makeRecords([1, 1, 2, 2, 3, 2, 2, 3, 1, 2, 2, 0], currentWeekStart)

    const current = analyzeCurrentWindow(records, 20, today)
    const planner = buildForwardPlanScenario(records, { target: 20, horizonWeeks: 4 }, today)

    expect(planner.currentBest8Total).toBe(current.best8Total)
  })

  it('creates candidate weeks and actionable plan steps when the target is reachable', () => {
    const today = new Date('2026-04-08')
    const currentWeekStart = startOfWeekMonday(today)
    const records = makeRecords([0, 1, 1, 2, 1, 2, 2, 1, 2, 1, 0, 0], currentWeekStart)
    const planner = buildForwardPlanScenario(records, { target: 20, horizonWeeks: 6 }, today)

    expect(planner.plans[0].weekSuggestions.length).toBeGreaterThan(0)
    expect(planner.weeks.some((week) => week.explanation.state === 'candidate')).toBe(true)
  })

  it('marks unreachable horizons when max reachable total stays below target', () => {
    const today = new Date('2026-04-08')
    const currentWeekStart = startOfWeekMonday(today)
    const records = makeRecords([0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0], currentWeekStart)
    const planner = buildForwardPlanScenario(records, { target: 24, horizonWeeks: 0 }, today)

    expect(planner.status).toBe('unreachable')
    expect(planner.maxReachableTotal).toBeLessThan(24)
  })

  it('computes one-more-day opportunity labels', () => {
    const today = new Date('2026-04-08')
    const currentWeekStart = startOfWeekMonday(today)
    const records = makeRecords([1, 1, 2, 2, 3, 2, 2, 3, 1, 2, 2, 0], currentWeekStart)
    const planner = buildForwardPlanScenario(records, { target: 20, horizonWeeks: 4 }, today)

    expect(planner.opportunities.length).toBeGreaterThan(0)
    expect(planner.opportunities[0]?.reason).toMatch(/One more office day/i)
  })
})
