import { addDays, endOfWeekMonday, startOfWeekMonday, toIsoDate } from '../lib/date'

interface WindowControlsProps {
  windowEndDate: string
  onWindowEndDateChange: (value: string) => void
}

export function WindowControls({
  windowEndDate,
  onWindowEndDateChange,
}: WindowControlsProps) {
  const current = new Date(windowEndDate)

  return (
    <div className="window-controls">
      <button
        type="button"
        className="secondary-button"
        onClick={() =>
          onWindowEndDateChange(toIsoDate(endOfWeekMonday(addDays(current, -7))))
        }
      >
        Previous week
      </button>

      <div className="date-field">
        <label htmlFor="window-end-date">Window closes</label>
        <input
          id="window-end-date"
          type="date"
          value={windowEndDate}
          min={toIsoDate(startOfWeekMonday(addDays(new Date(), -70)))}
          max={toIsoDate(endOfWeekMonday(addDays(new Date(), 77)))}
          onChange={(event) =>
            onWindowEndDateChange(toIsoDate(endOfWeekMonday(new Date(event.target.value))))
          }
        />
      </div>

      <button
        type="button"
        className="secondary-button"
        onClick={() =>
          onWindowEndDateChange(toIsoDate(endOfWeekMonday(addDays(current, 7))))
        }
      >
        Next week
      </button>
    </div>
  )
}
