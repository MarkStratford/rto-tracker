import type { AttendanceRecord, AttendanceRepository } from '../types'

const STORAGE_KEY = 'rto-tracker.attendance'

function normalizeRecord(record: Partial<AttendanceRecord> & { date: string }): AttendanceRecord {
  return {
    date: record.date,
    inOffice: record.inOffice ?? true,
    source: record.source ?? 'manual',
  }
}

export class LocalStorageAttendanceRepository implements AttendanceRepository {
  getAll(): AttendanceRecord[] {
    if (typeof window === 'undefined') {
      return []
    }

    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return []
    }

    try {
      const parsed = JSON.parse(raw) as Array<Partial<AttendanceRecord> & { date: string }>
      return parsed
        .map(normalizeRecord)
        .filter((record) => record.inOffice)
        .sort((left, right) => left.date.localeCompare(right.date))
    } catch {
      return []
    }
  }

  saveAll(records: AttendanceRecord[]): void {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        records
          .filter((record) => record.inOffice)
          .map(normalizeRecord)
          .sort((left, right) => left.date.localeCompare(right.date)),
      ),
    )
  }

  clear(): void {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.removeItem(STORAGE_KEY)
  }

  upsert(records: AttendanceRecord[], nextRecord: AttendanceRecord): AttendanceRecord[] {
    const normalized = normalizeRecord(nextRecord)
    const withoutCurrent = records.filter((record) => record.date !== normalized.date)
    return [...withoutCurrent, normalized].sort((left, right) =>
      left.date.localeCompare(right.date),
    )
  }
}
