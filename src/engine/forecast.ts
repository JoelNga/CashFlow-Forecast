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

function annualOccurrences(entry: Entry, windowStart: Date, windowEnd: Date): string[] {
    const [, am, ad] = entry.anchorDate.split('-').map(Number)
    const results: string[] = []
    const firstYear = Math.min(windowStart.getFullYear(), windowEnd.getFullYear())
    const lastYear = windowEnd.getFullYear()
    for (let y = firstYear; y <= lastYear; y += 1) {
        const day = Math.min(ad, daysInMonth(y, am - 1))
        const occ = new Date(y, am - 1, day)
        if (occ >= windowStart && occ <= windowEnd) results.push(toDateString(occ))
    }
    return results
}

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

function dailyOccurrences(entry: Entry, windowStart: Date, windowEnd: Date): string[] {
    const anchor = parseDate(entry.anchorDate)
    const results: string[] = []
    const occ = anchor > windowStart ? new Date(anchor) : new Date(windowStart)
    while (occ <= windowEnd) {
        if (occ >= windowStart) results.push(toDateString(occ))
        occ.setDate(occ.getDate() + 1)
    }
    return results;
}

function onceOccurrences(entry: Entry, windowStart: Date, windowEnd: Date): string[] {
    const occ = parseDate(entry.anchorDate)
    return occ >= windowStart && occ <= windowEnd ? [toDateString(occ)] : []
}

function getOccurrences(entry: Entry, windowStart: Date, windowEnd: Date): string[] {
    switch (entry.frequency) {
        case 'daily':
            return dailyOccurrences(entry, windowStart, windowEnd)
        case 'weekly':
            return weeklyOccurrences(entry, windowStart, windowEnd)
        case 'monthly':
            return monthlyOccurrences(entry, windowStart, windowEnd)
        case 'annual':
            return annualOccurrences(entry, windowStart, windowEnd)
        case 'once':
            return onceOccurrences(entry, windowStart, windowEnd)
        default:
            throw new Error(`Unhandled frequency: ${entry.frequency}`)
    }
}

function netOf(type: Entry['type'], amount: number): number {
    return (type === 'income' ? 1 : -1) * Math.abs(amount)
}

function logNet(log: DailyLog): number {
    return netOf(log.type, log.amount)
}

function logNetOnDate(logs: DailyLog[], date: string): number {
    return logs.reduce((sum, log) => (log.date === date ? sum + logNet(log) : sum), 0)
}
