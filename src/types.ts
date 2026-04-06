export type ComplianceTarget = 20 | 24
export type AttendanceSource = 'manual' | 'imported'
export type WeekPhase = 'past' | 'current' | 'future'

export interface AttendanceRecord {
  date: string
  inOffice: boolean
  source: AttendanceSource
}

export interface WeeklyAttendance {
  weekStart: string
  weekEnd: string
  totalDays: number
  isComplete: boolean
  remainingCapacity: number
  phase: WeekPhase
}

export interface WeekExplanation {
  state: 'counted' | 'dropped' | 'candidate'
  reason: string
}

export interface AnalyzedWeek extends WeeklyAttendance {
  isCounted: boolean
  explanation: WeekExplanation
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

export interface WeekOpportunity {
  weekStart: string
  gain: number
  reason: string
}

export interface CurrentWindowAnalysis {
  weeks: AnalyzedWeek[]
  countedWeekIndexes: number[]
  droppedWeekIndexes: number[]
  best8Total: number
  target: ComplianceTarget
  deficit: number
  status: 'green' | 'not-green'
  windowStartDate: string
  windowEndDate: string
  currentWeekRemainingCapacity: number
}

export interface PlanningOptions {
  target: ComplianceTarget
  horizonWeeks: number
}

export interface ForwardPlanScenario {
  weeks: AnalyzedWeek[]
  target: ComplianceTarget
  horizonWeeks: number
  currentBest8Total: number
  projectedBest8Total: number
  additionalDaysNeeded: number
  status: 'green' | 'not-green' | 'unreachable'
  planningWindowEndDate: string
  maxReachableTotal: number
  plans: ForecastPlan[]
  opportunities: WeekOpportunity[]
}

export interface AttendanceRepository {
  getAll(): AttendanceRecord[]
  saveAll(records: AttendanceRecord[]): void
  clear(): void
}

export interface ComplianceCalculator {
  analyzeCurrent(
    records: AttendanceRecord[],
    target: ComplianceTarget,
    today?: Date,
  ): CurrentWindowAnalysis
}

export interface ForecastService {
  buildScenario(
    records: AttendanceRecord[],
    options: PlanningOptions,
    today?: Date,
  ): ForwardPlanScenario
}

export interface BadgeDataProvider<TInput = unknown> {
  normalize(input: TInput): AttendanceRecord[]
}
