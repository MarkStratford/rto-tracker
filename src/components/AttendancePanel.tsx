import { addDays, formatMonthYear, parseIsoDate, startOfWeekMonday, toIsoDate } from '../lib/date'
import type { AttendanceRecord } from '../types'

interface AttendancePanelProps {
  attendance: AttendanceRecord[]
  selectedDate: string
  visibleMonth: string
  onSelectedDateChange: (value: string) => void
  onVisibleMonthChange: (value: string) => void
  onToggleDate: (value: string) => void
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function startOfMonth(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), 1)
}

function addMonths(value: Date, amount: number): Date {
  return new Date(value.getFullYear(), value.getMonth() + amount, 1)
}

export function AttendancePanel({
  attendance,
  selectedDate,
  visibleMonth,
  onSelectedDateChange,
  onVisibleMonthChange,
  onToggleDate,
}: AttendancePanelProps) {
  const attendanceSet = new Set(attendance.map((record) => record.date))
  const monthDate = startOfMonth(parseIsoDate(visibleMonth))
  const calendarStart = startOfWeekMonday(monthDate)
  const days = Array.from({ length: 35 }, (_, index) => addDays(calendarStart, index))
  const monthValue = monthDate.getMonth()

  return (
    <section className="calendar-card">
      <div className="calendar-header">
        <button
          type="button"
          className="calendar-nav"
          aria-label="Previous month"
          onClick={() => onVisibleMonthChange(toIsoDate(addMonths(monthDate, -1)))}
        >
          &lt;
        </button>
        <strong>{formatMonthYear(toIsoDate(monthDate))}</strong>
        <button
          type="button"
          className="calendar-nav"
          aria-label="Next month"
          onClick={() => onVisibleMonthChange(toIsoDate(addMonths(monthDate, 1)))}
        >
          &gt;
        </button>
      </div>

      <div className="calendar-grid">
        {DAY_LABELS.map((label) => (
          <span key={label} className="calendar-day-label">
            {label}
          </span>
        ))}

        {days.map((day) => {
          const iso = toIsoDate(day)
          const inMonth = day.getMonth() === monthValue
          const active = attendanceSet.has(iso)
          const selected = iso === selectedDate

          return (
            <button
              key={iso}
              type="button"
              aria-pressed={active}
              className={[
                'calendar-cell',
                inMonth ? 'current-month' : 'outside-month',
                active ? 'active' : '',
                selected ? 'selected' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => {
                onSelectedDateChange(iso)
                onToggleDate(iso)
              }}
            >
              {day.getDate()}
            </button>
          )
        })}
      </div>
    </section>
  )
}
