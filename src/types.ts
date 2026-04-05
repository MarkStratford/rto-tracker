export type ComplianceTarget = 20 | 24

export interface AttendanceRecord {
  date: string
  inOffice: boolean
}

export interface WeeklyAttendance {
  weekStart: string
  weekEnd: string
  totalDays: number
  isComplete: boolean
}

export interface EvaluatedWeek extends WeeklyAttendance {
  remainingCapacity: number
  isCounted: boolean
  isDropped: boolean
  isSprintWeek: boolean
  leverageLabel: 'locked' | 'maintain' | 'sprint' | 'no-value'
}

export interface WeekSuggestion {
  weekStart: string
  recommendedDays: number
  reason: string
}

export interface ForecastPlan {
  type: 'minimum' | 'balanced' | 'sprint'
  label: string
  description: string
  additionalDaysNeeded: number
  weekSuggestions: WeekSuggestion[]
}

export interface RollingWindowAnalysis {
  weeks: EvaluatedWeek[]
  countedWeekIndexes: number[]
  droppedWeekIndexes: number[]
  best8Total: number
  target: ComplianceTarget
  deficit: number
  status: 'green' | 'at-risk' | 'not-green' | 'unreachable'
  totalRemainingCapacity: number
  maxReachableTotal: number
  optimalWeekIndexes: number[]
  minimumAdditionalDaysNeeded: number
  windowEndDate: string
}

export interface AttendanceRepository {
  getAll(): AttendanceRecord[]
  saveAll(records: AttendanceRecord[]): void
  clear(): void
}

export interface ComplianceCalculator {
  analyze(
    records: AttendanceRecord[],
    target: ComplianceTarget,
    windowEndDate: Date,
    today?: Date,
  ): RollingWindowAnalysis
}

export interface ForecastService {
  buildPlans(analysis: RollingWindowAnalysis): ForecastPlan[]
}

export interface BadgeDataProvider<TInput = unknown> {
  normalize(input: TInput): AttendanceRecord[]
}
