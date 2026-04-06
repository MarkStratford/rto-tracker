interface WindowControlsProps {
  horizonWeeks: number
  onHorizonWeeksChange: (value: number) => void
}

const HORIZON_OPTIONS = [0, 2, 4, 6, 8]

export function WindowControls({
  horizonWeeks,
  onHorizonWeeksChange,
}: WindowControlsProps) {
  return (
    <div className="window-controls">
      <div className="date-field">
        <label htmlFor="planning-horizon">Forward planning horizon</label>
        <select
          id="planning-horizon"
          value={horizonWeeks}
          onChange={(event) => onHorizonWeeksChange(Number(event.target.value))}
        >
          {HORIZON_OPTIONS.map((value) => (
            <option key={value} value={value}>
              {value === 0 ? 'This week only' : `${value} weeks ahead`}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
