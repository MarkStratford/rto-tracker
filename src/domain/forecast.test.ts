import { describe, expect, it } from 'vitest'
import { analyzeRollingWindow } from './compliance'
import { buildForecastPlans } from './forecast'
import { addDays, endOfWeekMonday, startOfWeekMonday, toIsoDate } from '../lib/date'
import type { AttendanceRecord } from '../types'

function makeRecords(weekTotals: number[], currentWeekStart: Date): AttendanceRecord[] {
  const oldestWeekStart = addDays(currentWeekStart, -77)

  return weekTotals.flatMap((days, weekIndex) =>
    Array.from({ length: days }, (_, dayIndex) => ({
      date: toIsoDate(addDays(addDays(oldestWeekStart, weekIndex * 7), dayIndex)),
      inOffice: true,
    })),
  )
}

describe('forecast engine', () => {
  it('finds a minimum-day plan by using future capacity in the selected window', () => {
    const today = new Date('2026-04-08')
    const currentWeekStart = startOfWeekMonday(today)
    const records = makeRecords([1, 1, 2, 2, 3, 2, 2, 3, 1, 2, 2, 0], currentWeekStart)
    const futureWindowEnd = endOfWeekMonday(addDays(today, 21))

    const analysis = analyzeRollingWindow(records, 20, futureWindowEnd, today)
    const plans = buildForecastPlans(analysis)

    expect(analysis.minimumAdditionalDaysNeeded).toBeGreaterThan(0)
    expect(plans[0].weekSuggestions.length).toBeGreaterThan(0)
  })

  it('keeps the balanced plan distributed across multiple open weeks when available', () => {
    const today = new Date('2026-04-08')
    const currentWeekStart = startOfWeekMonday(today)
    const records = makeRecords([0, 1, 1, 2, 1, 2, 2, 1, 2, 1, 0, 0], currentWeekStart)
    const futureWindowEnd = endOfWeekMonday(addDays(today, 28))

    const analysis = analyzeRollingWindow(records, 20, futureWindowEnd, today)
    const plans = buildForecastPlans(analysis)
    const balancedPlan = plans.find((plan) => plan.type === 'balanced')

    expect(balancedPlan?.weekSuggestions.length).toBeGreaterThan(1)
  })
})
