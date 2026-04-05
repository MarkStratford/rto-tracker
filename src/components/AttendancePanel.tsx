import type { AttendanceRecord } from '../types'

interface AttendancePanelProps {
  attendance: AttendanceRecord[]
  quickAddDates: string[]
  selectedDate: string
  onSelectedDateChange: (value: string) => void
  onToggleDate: (value: string) => void
  onLoadSampleData: () => void
  onClearAttendance: () => void
}

export function AttendancePanel({
  attendance,
  quickAddDates,
  selectedDate,
  onSelectedDateChange,
  onToggleDate,
  onLoadSampleData,
  onClearAttendance,
}: AttendancePanelProps) {
  const attendanceSet = new Set(attendance.map((record) => record.date))
  const recentAttendance = [...attendance].sort((left, right) =>
    right.date.localeCompare(left.date),
  )

  return (
    <div className="attendance-panel">
      <div className="manual-entry">
        <label htmlFor="attendance-date">Pick a date</label>
        <input
          id="attendance-date"
          type="date"
          value={selectedDate}
          onChange={(event) => onSelectedDateChange(event.target.value)}
        />
        <button type="button" onClick={() => onToggleDate(selectedDate)}>
          {attendanceSet.has(selectedDate) ? 'Remove office day' : 'Mark in office'}
        </button>
      </div>

      <div className="quick-add">
        <h3>Quick add this week</h3>
        <div className="quick-add-grid">
          {quickAddDates.map((date) => (
            <button
              key={date}
              className={attendanceSet.has(date) ? 'quick-day active' : 'quick-day'}
              onClick={() => onToggleDate(date)}
              type="button"
            >
              <span>{new Date(date).toLocaleDateString(undefined, { weekday: 'short' })}</span>
              <strong>
                {new Date(date).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </strong>
            </button>
          ))}
        </div>
      </div>

      <div className="utility-actions">
        <button type="button" className="secondary-button" onClick={onLoadSampleData}>
          Load sample pattern
        </button>
        <button type="button" className="secondary-button danger" onClick={onClearAttendance}>
          Clear all data
        </button>
      </div>

      <div className="recent-log">
        <h3>Recent logged days</h3>
        {recentAttendance.length > 0 ? (
          <ul>
            {recentAttendance.slice(0, 10).map((record) => (
              <li key={record.date}>{record.date}</li>
            ))}
          </ul>
        ) : (
          <p>No badge days logged yet.</p>
        )}
      </div>
    </div>
  )
}
