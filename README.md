# RTO Compliance Tracker

A local-first React app for tracking return-to-office compliance under a rolling "best 8 of 12 weeks" rule.

## What it does

- Tracks manual in-office attendance in browser `localStorage`
- Calculates your real current compliance using the trailing 12 weeks ending in the current week
- Supports both `20`-day and `24`-day targets
- Separates:
  - actual current compliance
  - forward planning scenarios
- Shows which weeks are currently counted, dropped, or best sprint candidates
- Keeps attendance records ready for future badge import by storing a `source` field on each record

## Product model

### Current status

The top section always answers the real present-tense question: are you green in the trailing 12-week window right now?

### Forward planner

The planner simulates future value over a selected horizon without changing the meaning of the current score. It exists to answer "what is the fewest additional badge days I need?" and "which weeks matter most next?"

## Attendance model

Attendance records are stored as:

`AttendanceRecord { date: string; inOffice: boolean; source: 'manual' | 'imported' }`

The current app only writes `manual` records, but the data model is prepared for future badge-data ingestion.

## Development

Install dependencies:

```bash
npm install
```

Run the app:

```bash
npm run dev
```

Run tests:

```bash
npm test
```

Build production assets:

```bash
npm run build
```

## Notes

- Weeks are Monday through Sunday.
- Only the top 8 weeks inside a 12-week window count.
- The app is optimized for personal decision support, not employer-facing reporting.
