import { useEffect, useState } from 'react'
import './App.css'
import { AttendancePanel } from './components/AttendancePanel'
import { ForecastPlans } from './components/ForecastPlans'
import { SummaryCards } from './components/SummaryCards'
import { WeekGrid } from './components/WeekGrid'
import { WindowControls } from './components/WindowControls'
import { LocalStorageAttendanceRepository } from './domain/attendance'
import { analyzeRollingWindow } from './domain/compliance'
import { buildForecastPlans } from './domain/forecast'
import { buildSampleAttendance } from './domain/sampleData'
import { addDays, endOfWeekMonday, startOfWeekMonday, toIsoDate } from './lib/date'
import type { AttendanceRecord, ComplianceTarget } from './types'

const repository = new LocalStorageAttendanceRepository()

function App() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [target, setTarget] = useState<ComplianceTarget>(20)
  const [windowEndDate, setWindowEndDate] = useState(() =>
    toIsoDate(endOfWeekMonday(new Date())),
  )
  const [selectedDate, setSelectedDate] = useState(() => toIsoDate(new Date()))

  useEffect(() => {
    setAttendance(repository.getAll())
  }, [])

  const today = new Date()
  const analysis = analyzeRollingWindow(
    attendance,
    target,
    new Date(windowEndDate),
    today,
  )
  const forecastPlans = buildForecastPlans(analysis)
  const currentWeekStart = startOfWeekMonday(today)
  const quickAddDates = Array.from({ length: 5 }, (_, index) =>
    toIsoDate(addDays(currentWeekStart, index)),
  )

  const saveAttendance = (nextRecords: AttendanceRecord[]) => {
    repository.saveAll(nextRecords)
    setAttendance(nextRecords)
  }

  const toggleAttendance = (date: string) => {
    const exists = attendance.some((record) => record.date === date && record.inOffice)
    const nextRecords = exists
      ? attendance.filter((record) => record.date !== date)
      : repository.upsert(attendance, { date, inOffice: true })

    saveAttendance(nextRecords)
  }

  const clearAttendance = () => {
    repository.clear()
    setAttendance([])
  }

  const loadSampleData = () => {
    const sample = buildSampleAttendance(today)
    repository.saveAll(sample)
    setAttendance(sample)
  }

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Return To Office Compliance</p>
          <h1>See the exact fewest badge days needed to stay green.</h1>
          <p className="hero-copy">
            Track your in-office days, inspect the rolling best 8 of 12 weeks,
            and see which weeks are doing real work versus which ones can safely
            drop out.
          </p>
        </div>

        <div className="hero-actions">
          <div className="target-toggle" role="group" aria-label="Compliance target">
            {[20, 24].map((value) => (
              <button
                key={value}
                className={value === target ? 'toggle-pill active' : 'toggle-pill'}
                onClick={() => setTarget(value as ComplianceTarget)}
                type="button"
              >
                {value} day target
              </button>
            ))}
          </div>
          <p className="helper-copy">
            Best 8 of 12 weeks. Only your top 8 weeks count. The other 4 weeks
            are visualized as no-value weeks.
          </p>
        </div>
      </section>

      <SummaryCards analysis={analysis} />

      <section className="panel-grid">
        <section className="panel panel-wide">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Window view</p>
              <h2>12-week compliance strip</h2>
            </div>
            <WindowControls
              windowEndDate={windowEndDate}
              onWindowEndDateChange={setWindowEndDate}
            />
          </div>

          <WeekGrid analysis={analysis} />
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Strategies</p>
              <h2>How to get green</h2>
            </div>
          </div>
          <ForecastPlans analysis={analysis} plans={forecastPlans} />
        </section>
      </section>

      <section className="panel-grid panel-grid-bottom">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Manual entry</p>
              <h2>Log office days</h2>
            </div>
          </div>

          <AttendancePanel
            attendance={attendance}
            quickAddDates={quickAddDates}
            selectedDate={selectedDate}
            onSelectedDateChange={setSelectedDate}
            onToggleDate={toggleAttendance}
            onLoadSampleData={loadSampleData}
            onClearAttendance={clearAttendance}
          />
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Reading the dashboard</p>
              <h2>What matters most</h2>
            </div>
          </div>
          <div className="insight-list">
            <article>
              <h3>Counted weeks</h3>
              <p>
                These are your current top 8 weeks. Improving them can still help
                if they have future workdays left.
              </p>
            </article>
            <article>
              <h3>No-value weeks</h3>
              <p>
                These 4 weeks are currently dropped from scoring. A sprint only
                matters if it pushes one of them into the counted set.
              </p>
            </article>
            <article>
              <h3>Sprint markers</h3>
              <p>
                Highlighted weeks are the best places to add future office days
                before this selected window closes.
              </p>
            </article>
          </div>
        </section>
      </section>
    </main>
  )
}

export default App
