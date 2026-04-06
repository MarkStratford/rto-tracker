interface ProgressRingProps {
  value: number
  target: number
}

export function ProgressRing({ value, target }: ProgressRingProps) {
  const radius = 92
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(value / target, 1)
  const offset = circumference * (1 - progress)

  return (
    <div className="progress-ring-card">
      <svg className="progress-ring" viewBox="0 0 240 240" role="img" aria-label={`${value} of ${target} days`}>
        <circle className="progress-ring-track" cx="120" cy="120" r={radius} />
        <circle
          className="progress-ring-value"
          cx="120"
          cy="120"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="progress-ring-copy">
        <strong>{value}</strong>
        <span>of {target} days</span>
      </div>
    </div>
  )
}
