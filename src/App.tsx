import { useMemo } from 'react'
import CalendarView from './components/CalendarView'
import DailyLogForm from './components/DailyLogForm'
import ForecastChart from './components/ForecastChart'
import IncomeExpenseForm, { type Settings } from './components/IncomeExpenseForm'
import LowPointCallout from './components/LowPointCallout'
import PacingIndicator from './components/PacingIndicator'
import { runForecast } from './engine/forecast'
import type { DailyLog, Entry, ForecastInput } from './engine/types'
import useLocalStorage from './hooks/useLocalStorage'
import './App.css'

type View = 'chart' | 'calendar'

function today(): string {
    const d = new Date()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${d.getFullYear()}-${m}-${day}`
}

function parseYmd(s: string): Date {
    const [y, m, d] = s.split('-').map(Number)
    return new Date(y, m - 1, d)
}

function fmtYmd(d: Date): string {
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${d.getFullYear()}-${m}-${day}`
}

function shiftDate(s: string, days: number): string {
    const d = parseYmd(s)
    d.setDate(d.getDate() + days)
    return fmtYmd(d)
}

function windowEnd(s: string, days: number): string {
    return shiftDate(s, days - 1)
}

export default function App() {
    const [settings, setSettings] = useLocalStorage<Settings>('cashflow.settings', {
        startingBalance: 500,
        startDate: today(),
        windowDays: 30,
    })
    const [entries, setEntries] = useLocalStorage<Entry[]>('cashflow.entries', [])
    const [logs, setLogs] = useLocalStorage<DailyLog[]>('cashflow.logs', [])
    const [view, setView] = useLocalStorage<View>('cashflow.view', 'chart')

    const referenceDate = today()
    const todayStr = referenceDate

    const forecastInput = useMemo<ForecastInput>(
        () => ({
            startingBalance: settings.startingBalance,
            startDate: settings.startDate,
            windowDays: settings.windowDays,
            referenceDate,
            entries,
            logs,
        }),
        [settings.startingBalance, settings.startDate, settings.windowDays, referenceDate, entries, logs],
    )

    const result = useMemo(() => runForecast(forecastInput), [forecastInput])

    const todayInWindow =
        todayStr >= settings.startDate && todayStr <= windowEnd(settings.startDate, settings.windowDays)

    const shiftWindow = (days: number) =>
        setSettings((s) => ({ ...s, startDate: shiftDate(s.startDate, days) }))

    return (
        <div className="app">
            <header className="app-header">
                <h1>Cash-Flow Forecaster</h1>
                <p>
                    Plan your income and bills, then log real daily spending so projections for future
                    days reflect how you actually live.
                </p>
            </header>
            <main className="app-main">
                <div className="left-col">
                    <IncomeExpenseForm
                        settings={settings}
                        onSettingsChange={setSettings}
                        entries={entries}
                        onEntriesChange={setEntries}
                    />
                    <DailyLogForm logs={logs} onChange={setLogs} />
                </div>
                <div className="results">
                    {todayInWindow && (
                        <PacingIndicator
                            projectedDailyAverage={result.projectedDailyAverage}
                            todayLogNet={result.todayLogNet}
                        />
                    )}
                    <LowPointCallout lowPoint={result.lowPoint} />
                    <div className="results-controls">
                        <div className="view-toggle">
                            <button
                                type="button"
                                className={view === 'chart' ? 'on' : ''}
                                onClick={() => setView('chart')}
                            >
                                Line chart
                            </button>
                            <button
                                type="button"
                                className={view === 'calendar' ? 'on' : ''}
                                onClick={() => setView('calendar')}
                            >
                                Calendar
                            </button>
                        </div>
                        <div className="pan-controls">
                            <button type="button" onClick={() => shiftWindow(-settings.windowDays)}>
                                &larr; prev
                            </button>
                            <button
                                type="button"
                                className="on"
                                onClick={() => setSettings((s) => ({ ...s, startDate: todayStr }))}
                            >
                                Today
                            </button>
                            <button type="button" onClick={() => shiftWindow(settings.windowDays)}>
                                next &rarr;
                            </button>
                        </div>
                    </div>
                    {view === 'chart' ? (
                        <ForecastChart series={result.series} lowPoint={result.lowPoint} />
                    ) : (
                        <CalendarView
                            input={forecastInput}
                            series={result.series}
                            lowPoint={result.lowPoint}
                            today={todayStr}
                        />
                    )}
                </div>
            </main>
            <footer className="app-footer">
                Forecasts apply transactions at the start of each day. Days up to today use real logged
                activity; future days add the projected daily average (trailing 30 logged days). Monthly
                and annual items anchored on the 29th&ndash;31st fall back to the last day of shorter
                months.
            </footer>
        </div>
    )
}