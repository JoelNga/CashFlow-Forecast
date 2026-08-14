import { useMemo, useState } from 'react'
import { listDayActivity } from '../engine/forecast'
import type { DailyBalance, DayActivityItem, ForecastInput } from '../engine/types'

interface Props {
    input: ForecastInput
    series: DailyBalance[]
    lowPoint: DailyBalance
    today: string
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function fmtMoney(v: number): string {
    return `${v < 0 ? '-' : ''}RM${Math.abs(v).toFixed(2)}`
}

function fmtBalanceCell(v: number): string {
    return `${v < 0 ? '-' : ''}RM${Math.abs(v).toFixed(0)}`
}

function formatLong(date: string): string {
    return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    })
}

interface MonthGroup {
    key: string
    year: number
    monthIndex: number
}

function groupByMonth(series: DailyBalance[]): MonthGroup[] {
    const seen = new Map<string, MonthGroup>()
    for (const p of series) {
        const [y, m] = p.date.split('-').map(Number)
        const key = `${y}-${String(m).padStart(2, '0')}`
        if (!seen.has(key)) seen.set(key, { key, year: y, monthIndex: m - 1 })
    }
    return Array.from(seen.values())
}

function daysInMonth(year: number, monthIndex: number): number {
    return new Date(year, monthIndex + 1, 0).getDate()
}

export default function CalendarView({ input, series, lowPoint, today }: Props) {
    const [selected, setSelected] = useState<string | null>(null)

    const byDate = useMemo(() => new Map(series.map((p) => [p.date, p])), [series])
    const months = useMemo(() => groupByMonth(series), [series])

    const itemsByDate = useMemo(() => {
        const map = new Map<string, DayActivityItem[]>()
        for (const p of series) map.set(p.date, listDayActivity(input, p.date))
        return map
    }, [input, series])

    const selectedPoint = selected ? byDate.get(selected) : undefined
    const selectedItems = selected ? itemsByDate.get(selected) ?? [] : []

    return (
        <section className="panel calendar-panel">
            <h2>Day-by-day forecast</h2>
            <div className="calendar-legend">
                <span className="legend-chip legend-fine">Fine</span>
                <span className="legend-chip legend-neg">Below zero</span>
                <span className="legend-chip legend-today">Today</span>
                <span className="legend-chip legend-low">Tightest day</span>
                <span className="legend-chip legend-dot">Transactions</span>
            </div>

            {months.map(({ key, year, monthIndex }) => {
                const firstWeekday = new Date(year, monthIndex, 1).getDay()
                const totalDays = daysInMonth(year, monthIndex)
                const cells = []
                for (let i = 0; i < firstWeekday; i += 1) cells.push(<div key={`pad-${i}`} className="cal-cell empty" />)
                for (let day = 1; day <= totalDays; day += 1) {
                    const ds = `${key}-${String(day).padStart(2, '0')}`
                    const point = byDate.get(ds)
                    if (!point) {
                        cells.push(<div key={day} className="cal-cell empty" />)
                        continue
                    }
                    const items = itemsByDate.get(ds) ?? []
                    const classes = [
                        'cal-cell',
                        point.balance < 0 ? 'neg' : '',
                        point.balance > 0 ? 'pos' : '',
                        ds === today ? 'today' : '',
                        ds === lowPoint.date ? 'low' : '',
                        selected === ds ? 'open' : '',
                        items.length > 0 ? 'hasitems' : '',
                    ]
                        .filter(Boolean)
                        .join(' ')
                    cells.push(
                        <button
                            key={day}
                            type="button"
                            className={classes}
                            onClick={() => setSelected(selected === ds ? null : ds)}
                        >
                            <span className="cal-daynum">{day}</span>
                            <span className="cal-bal">{fmtBalanceCell(point.balance)}</span>
                        </button>,
                    )
                }
                const showDetail =
                    selected !== null &&
                    Number(selected.slice(0, 4)) === year &&
                    Number(selected.slice(5, 7)) - 1 === monthIndex
                return (
                    <div className="cal-month" key={key}>
                        <h3 className="cal-month-label">
                            {new Date(year, monthIndex, 1).toLocaleDateString(undefined, {
                                month: 'long',
                                year: 'numeric',
                            })}
                        </h3>
                        <div className="cal-weekdays">
                            {WEEKDAYS.map((w) => (
                                <span key={w} className="cal-weekday">
                                    {w}
                                </span>
                            ))}
                        </div>
                        <div className="cal-grid">{cells}</div>
                        {showDetail && selectedPoint && (
                            <DayDetail items={selectedItems} point={selectedPoint} />
                        )}
                    </div>
                )
            })}
        </section>
    )
}

function DayDetail({ items, point }: { items: DayActivityItem[]; point: DailyBalance }) {
    return (
        <div className="day-detail">
            <div className="day-detail-head">
                <strong>{formatLong(point.date)}</strong>
                <span>
                    Net {fmtMoney(point.activity)} &middot; End balance {fmtMoney(point.balance)}
                </span>
            </div>
            {items.length === 0 && <p className="day-detail-empty">No transactions this day.</p>}
            <ul className="day-detail-list">
                {items.map((item) => (
                    <li key={item.id} className={item.amount < 0 ? 'neg' : 'pos'}>
                        <span className="dd-label">{item.label}</span>
                        <span className="dd-sub">{item.sub}</span>
                        <span className="dd-amount">{fmtMoney(item.amount)}</span>
                    </li>
                ))}
            </ul>
        </div>
    )
}