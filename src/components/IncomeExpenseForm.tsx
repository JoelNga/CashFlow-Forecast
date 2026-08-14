import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Entry, Frequency } from '../engine/types'

export interface Settings {
    startingBalance: number
    startDate: string
    windowDays: number
}

interface Props {
    settings: Settings
    onSettingsChange: (next: Settings) => void
    entries: Entry[]
    onEntriesChange: (next: Entry[]) => void
}

function today(): string {
    const d = new Date()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${d.getFullYear()}-${m}-${day}`
}

const FREQUENCY_LABELS: Record<Frequency, string> = {
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    annual: 'Annual',
    once: 'One-off (planned)',
}

export default function IncomeExpenseForm({
    settings,
    onSettingsChange,
    entries,
    onEntriesChange,
}: Props) {
    const [label, setLabel] = useState('')
    const [amount, setAmount] = useState('')
    const [kind, setKind] = useState<Entry['type']>('expense')
    const [frequency, setFrequency] = useState<Frequency>('monthly')
    const [anchorDate, setAnchorDate] = useState(today())

    function addEntry(e: FormEvent) {
        e.preventDefault()
        const value = Number(amount)
        if (!label.trim() || !Number.isFinite(value) || value <= 0) return
        onEntriesChange([
            ...entries,
            {
                id: crypto.randomUUID(),
                label: label.trim(),
                amount: value,
                type: kind,
                frequency,
                anchorDate,
            },
        ])
        setLabel('')
        setAmount('')
    }

    return (
        <section className="panel form-panel">
            <h2>Set-up</h2>
            <div className="field-row">
                <label>
                    Starting balance
                    <input
                        type="number"
                        value={settings.startingBalance}
                        onChange={(e) =>
                            onSettingsChange({ ...settings, startingBalance: Number(e.target.value) })
                        }
                    />
                </label>
                <label>
                    Start date (today)
                    <input
                        type="date"
                        value={settings.startDate}
                        onChange={(e) => onSettingsChange({ ...settings, startDate: e.target.value })}
                    />
                </label>
                <label>
                    Days ahead
                    <input
                        type="number"
                        min={1}
                        max={120}
                        value={settings.windowDays}
                        onChange={(e) =>
                            onSettingsChange({ ...settings, windowDays: Number(e.target.value) })
                        }
                    />
                </label>
            </div>

            <h2>Planned income &amp; expenses</h2>
            <p className="log-hint">
                Things you know are coming — recurring bills, salary, or a planned one-off. Anything that
                already happened belongs in the daily log instead.
            </p>
            <form className="entry-form" onSubmit={addEntry}>
                <label>
                    Label
                    <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Rent" />
                </label>
                <label>
                    Amount
                    <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                    />
                </label>
                <label>
                    Type
                    <select value={kind} onChange={(e) => setKind(e.target.value as Entry['type'])}>
                        <option value="expense">Expense</option>
                        <option value="income">Income</option>
                    </select>
                </label>
                <label>
                    Frequency
                    <select value={frequency} onChange={(e) => setFrequency(e.target.value as Frequency)}>
                        {(Object.keys(FREQUENCY_LABELS) as Frequency[]).map((f) => (
                            <option key={f} value={f}>
                                {FREQUENCY_LABELS[f]}
                            </option>
                        ))}
                    </select>
                </label>
                <label>
                    {frequency === 'once' ? 'Date' : 'Start date'}
                    <input
                        type="date"
                        value={anchorDate}
                        min={frequency === 'once' ? today() : undefined}
                        onChange={(e) => setAnchorDate(e.target.value)}
                    />
                </label>
                <button type="submit" className="btn">
                    Add
                </button>
            </form>

            <ul className="entry-list">
                {entries.length === 0 && (
                    <li className="row empty">No entries yet — add your income and bills above.</li>
                )}
                {entries.map((e) => (
                    <li key={e.id} className={`row ${e.type === 'income' ? 'row-income' : 'row-expense'}`}>
                        <span className="row-label">{e.label}</span>
                        <span className="row-meta">
                            {FREQUENCY_LABELS[e.frequency].toLowerCase()} &middot; from {e.anchorDate}
                        </span>
                        <span className="row-amount">
                            {e.type === 'income' ? '+' : '-'}
                            {`RM${e.amount.toFixed(2)}`}
                        </span>
                        <button
                            type="button"
                            className="btn-ghost"
                            onClick={() => onEntriesChange(entries.filter((x) => x.id !== e.id))}
                        >
                            Remove
                        </button>
                    </li>
                ))}
            </ul>
        </section>
    )
}