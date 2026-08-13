import type {
    DailyBalance,
    DailyLog,
    DayActivityItem,
    Entry,
    ForecastInput,
    ForecastResult,
} from './types'

function toDateString(d: Date): string {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
}

function parseDate(s: string): Date {
    const [y, m, d] = s.split('-').map(Number)
    return new Date(y, m - 1, d)
}

function addDays(d: Date, n: number): Date {
    const next = new Date(d)
    next.setDate(next.getDate() + n)
    return next
}

function daysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate()
}

function

function monthlyOccurrences(entry: Entry, windowStart: Date, windowEnd: Date): string[] {
    const [, , ad] = entry.anchorDate.split('-').map(Number)
    const results: string[] = []
    let y = windowStart.getFullYear()
    let m = windowStart.getMonth()          // 0-indexed: Jan = 0
    while (true) {
        const day = Math.min(ad, daysInMonth(y, m))   // THE clamp, in one line
        const occ = new Date(y, m, day)
        if (occ > windowEnd) break                   // past the window to stop
        if (occ >= windowStart) results.push(toDateString(occ))
        m += 1                                       // step to next month
        if (m > 11) { m = 0; y += 1 }                // Dec to Jan of next year
    }
    return results
}

function weeklyOccurrences(entry: Entry, windowStart: Date, windowEnd: Date): string[] {
    const anchor = parseDate(entry.anchorDate)
    const results: string[] = []
    const occ = new Date(anchor)
    while (occ <= windowEnd) {
        if (occ >= windowStart) results.push(toDateString(occ))
        occ.setDate(occ.getDate() + 7)
    }
    return results
}

function dailyOccurrences(entry: Entry, windowStart: Date, windowEnd: Date): string[](
    const anchor = parseDate(entry.anchorDate)
    const results: string[] = []
    const occ = anchor > windowStart ? new Date(anchor) : new Date(windowStart)
    while (occ <= windowEnd) {

}
)

export function getOccurrences(entry: Entry, windowStart: Date, windowEnd: Date): string[] {
    switch (entry.cycle) {
        case 'monthly':
            return monthlyOccurrences(entry, windowStart, windowEnd)
        case 'weekly':
            return [] // not done
        case 'annual':
            return [] // not done
        default:
            throw new Error(`Unhandled cycle: ${entry.cycle}`)
    }
}