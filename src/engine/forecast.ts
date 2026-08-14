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

function projectedAverage(logs: DailyLog[], today: Date): number {
    const windowStart = addDays(today, -30)
    const windowEnd = addDays(today, -1)
    const dayNets = new Map<string, number>()
    for (const log of logs) {
        const date = parseDate(log.date)
        if (date < windowStart || date > windowEnd) continue
        const key = toDateString(date)
        dayNets.set(key, (dayNets.get(key) ?? 0) + logNet(log))
    }
    if (dayNets.size === 0) {
        return logNetOnDate(logs, toDateString(today))
    }
    let total = 0
    for (const net of dayNets.values()) total += net
    return total / dayNets.size
}

export function runForecast(input: ForecastInput): ForecastResult {
    const start = parseDate(input.startDate)
    const end = addDays(start, input.windowDays - 1)
    const reference = parseDate(input.referenceDate)

    const deltas = new Map<string, number>()
    for (const entry of input.entries) {
        const delta = netOf(entry.type, entry.amount)
        for (const date of getOccurrences(entry, start, end)) {
            deltas.set(date, (deltas.get(date) ?? 0) + delta)
        }
    }

    const todayLogNet = logNetOnDate(input.logs, toDateString(reference))
    const projAvg = projectedAverage(input.logs, reference)

    const series: DailyBalance[] = []
    let balance = input.startingBalance
    const cursor = new Date(start)
    while (cursor <= end) {
        const date = toDateString(cursor)
        const routine = deltas.get(date) ?? 0
        const realSlice = cursor > reference ? projAvg : logNetOnDate(input.logs, date)
        const activity = routine + realSlice
        balance += activity
        series.push({ date, balance, activity })
        cursor.setDate(cursor.getDate() + 1)
    }

    let lowPoint: DailyBalance =
        series.length > 0
            ? series[0]
            : { date: toDateString(start), balance: input.startingBalance, activity: 0 }
    for (const point of series) {
        if (point.balance < lowPoint.balance) lowPoint = point
    }

    return { series, lowPoint, projectedDailyAverage: projAvg, todayLogNet }
}

const FREQUENCY_LABELS: Record<Entry['frequency'], string> = {
    daily: 'daily',
    weekly: 'weekly',
    monthly: 'monthly',
    annual: 'annual',
    once: 'one-off',
}

function dayWindow(input: ForecastInput): [Date, Date] {
    const start = parseDate(input.startDate)
    return [start, addDays(start, input.windowDays - 1)]
}

export function listDayActivity(input: ForecastInput, date: string): DayActivityItem[] {
    const [start, end] = dayWindow(input)
    const reference = parseDate(input.referenceDate)
    const items: DayActivityItem[] = []

    for (const entry of input.entries) {
        if (!getOccurrences(entry, start, end).includes(date)) continue
        items.push({
            id: `${entry.id}:${date}`,
            source: 'entry',
            label: entry.label,
            sub: `${FREQUENCY_LABELS[entry.frequency]} · from ${entry.anchorDate}`,
            amount: netOf(entry.type, entry.amount),
        })
    }

    for (const log of input.logs) {
        if (log.date !== date || parseDate(log.date) > reference) continue
        items.push({
            id: log.id,
            source: 'log',
            label: log.note ?? (log.type === 'income' ? 'Received' : 'Spent'),
            sub: 'logged',
            amount: logNet(log),
        })
    }

    if (parseDate(date) > reference) {
        const avg = projectedAverage(input.logs, reference)
        if (avg !== 0) {
            items.push({
                id: `average:${date}`,
                source: 'average',
                label: 'Projected daily average',
                sub: 'trailing 30 logged days',
                amount: avg,
            })
        }
    }

    return items
}