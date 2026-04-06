import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { AttendancePanel } from './components/AttendancePanel'
import { ForecastStrip } from './components/ForecastStrip'
import { ProgressRing } from './components/ProgressRing'
import { WeeklyBreakdown } from './components/WeeklyBreakdown'
import { LocalStorageAttendanceRepository } from './domain/attendance'
import { analyzeCurrentWindow } from './domain/compliance'
import { buildForwardPlanScenario } from './domain/forecast'
import { buildSampleAttendance } from './domain/sampleData'
import { formatRangeWithYear, parseIsoDate, toIsoDate } from './lib/date'
import type { AttendanceRecord, ComplianceTarget } from './types'

const repository = new LocalStorageAttendanceRepository()

function App() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [target, setTarget] = useState<ComplianceTarget>(24)
  const [selectedDate, setSelectedDate] = useState(() => toIsoDate(new Date()))
  const [visibleMonth, setVisibleMonth] = useState(() => toIsoDate(new Date()))
  const [horizonWeeks] = useState(4)

  useEffect(() => {
    setAttendance(repository.getAll())
  }, [])

  const today = new Date()
  const currentAnalysis = analyzeCurrentWindow(attendance, target, today)
  const planningScenario = buildForwardPlanScenario(attendance, { target, horizonWeeks }, today)

  const saveAttendance = (nextRecords: AttendanceRecord[]) => {
    repository.saveAll(nextRecords)
    setAttendance(nextRecords)
  }

  const toggleAttendance = (date: string) => {
    const exists = attendance.some((record) => record.date === date && record.inOffice)
    const nextRecords = exists
      ? attendance.filter((record) => record.date !== date)
      : repository.upsert(attendance, { date, inOffice: true, source: 'manual' })

    saveAttendance(nextRecords)
  }

  const loadSampleData = () => {
    const sample = buildSampleAttendance(today)
    repository.saveAll(sample)
    setAttendance(sample)
    setVisibleMonth(sample.at(-1)?.date ?? toIsoDate(today))
  }

  const workdaysLeft = planningScenario.weeks.reduce(
    (sum, week) => sum + week.remainingCapacity,
    0,
  )
  const weeksLeft = Math.max(
    1,
    planningScenario.weeks.filter((week) => week.remainingCapacity > 0).length,
  )
  const daysPerWeekNeeded = planningScenario.additionalDaysNeeded
    ? Math.ceil(planningScenario.additionalDaysNeeded / weeksLeft)
    : 0

  const warning = useMemo(() => {
    if (planningScenario.status === 'green') {
      return 'You are on pace. Keep logging days as planned to stay green.'
    }

    if (planningScenario.status === 'unreachable') {
      return 'Not enough workdays left to reach target at this pace. Log every remaining workday.'
    }

    return `You need ${planningScenario.additionalDaysNeeded} more day${planningScenario.additionalDaysNeeded === 1 ? '' : 's'} across the next ${weeksLeft} scoring week${weeksLeft === 1 ? '' : 's'}.`
  }, [planningScenario.additionalDaysNeeded, planningScenario.status, weeksLeft])

  const visibleMonthDate = parseIsoDate(visibleMonth)

  return (
    <main className="tracker-shell">
      <section className="tracker-card">
        <header className="tracker-header">
          <div>
            <h1>RTO Tracker</h1>
            <p>{formatRangeWithYear(currentAnalysis.windowStartDate, currentAnalysis.windowEndDate)}</p>
          </div>

          <div className="header-actions">
            <div className="target-pill" role="group" aria-label="Compliance target">
              {[20, 24].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={value === target ? 'target-option active' : 'target-option'}
                  onClick={() => setTarget(value as ComplianceTarget)}
                >
                  {currentAnalysis.best8Total}/{value} days
                </button>
              ))}
            </div>

            <button type="button" className="demo-link" onClick={loadSampleData}>
              Load demo
            </button>
          </div>
        </header>

        <ProgressRing value={currentAnalysis.best8Total} target={target} />

        <ForecastStrip
          daysRemaining={planningScenario.additionalDaysNeeded}
          workdaysLeft={workdaysLeft}
          daysPerWeekNeeded={daysPerWeekNeeded}
          warning={warning}
        />

        <AttendancePanel
          attendance={attendance}
          selectedDate={selectedDate}
          visibleMonth={toIsoDate(visibleMonthDate)}
          onSelectedDateChange={setSelectedDate}
          onVisibleMonthChange={setVisibleMonth}
          onToggleDate={toggleAttendance}
        />

        <WeeklyBreakdown analysis={currentAnalysis} />

        <section className="tracker-footer">
          <div>
            <p className="section-kicker">Planner note</p>
            <p className="footer-copy">
              Forward planning is still calculated behind the scenes for the forecast cards, but the main score above always reflects the real trailing 12-week window.
            </p>
          </div>
          <button type="button" className="clear-link" onClick={() => saveAttendance([])}>
            Clear data
          </button>
        </section>
      </section>
    </main>
  )
}

export default App
