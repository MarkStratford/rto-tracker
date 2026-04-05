import type { AttendanceRecord, AttendanceRepository } from '../types'

const STORAGE_KEY = 'rto-tracker.attendance'

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
      const parsed = JSON.parse(raw) as AttendanceRecord[]
      return parsed
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
    const withoutCurrent = records.filter((record) => record.date !== nextRecord.date)
    return [...withoutCurrent, nextRecord].sort((left, right) =>
      left.date.localeCompare(right.date),
    )
  }
}
