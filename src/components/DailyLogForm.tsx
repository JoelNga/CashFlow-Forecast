import { useState } from 'react'
import type { FormEvent } from 'react'
import type { DailyLog } from '../engine/types'

interface Props {
    logs: DailyLog[]
    onChange: (next: DailyLog[]) => void
}

function today(): string {
    const d = new Date()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${d.getFullYear()}-${m}-${day}`
}

export default function DailyLogForm({ logs, onChange }: Props) {
    const [date, setDate] = useState(today())
    const [amount, setAmount] = useState('')
    const [kind, setKind] = useState<DailyLog['type']>('expense')
    const [note, setNote] = useState('')

    function addLog(e: FormEvent) {
        e.preventDefault()
        const value = Number(amount)
        if (!Number.isFinite(value) || value <= 0) return
        onChange([
            ...logs,
            {
                id: crypto.randomUUID(),
                date,
                amount: value,
                type: kind,
                note: note.trim() === '' ? undefined : note.trim(),
            },
        ])
        setAmount('')
        setNote('')
    }

    return (
        <section className="panel form-panel">
            <h2>Daily log (what actually happened)</h2>
            <p className="log-hint">
                Record real, after-the-fact spending or income up to today. Your logged days set the
                projected daily average used on future days — logging today projects it immediately.
            </p>
            <form className="entry-form" onSubmit={addLog}>
                <label>
                    Date
                    <input type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value)} />
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
                    <select value={kind} onChange={(e) => setKind(e.target.value as DailyLog['type'])}>
                        <option value="expense">Spent</option>
                        <option value="income">Received</option>
                    </select>
                </label>
                <label>
                    Note
                    <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. lunch" />
                </label>
                <button type="submit" className="btn">
                    Log
                </button>
            </form>

            <ul className="entry-list">
                {logs.length === 0 && (
                    <li className="row empty">No activity logged yet.</li>
                )}
                {logs.map((l) => (
                    <li key={l.id} className={`row ${l.type === 'income' ? 'row-income' : 'row-expense'}`}>
                        <span className="row-label">{l.note ?? (l.type === 'income' ? 'Received' : 'Spent')}</span>
                        <span className="row-meta">{l.date}</span>
                        <span className="row-amount">
                            {l.type === 'income' ? '+' : '-'}
                            {`RM${l.amount.toFixed(2)}`}
                        </span>
                        <button
                            type="button"
                            className="btn-ghost"
                            onClick={() => onChange(logs.filter((x) => x.id !== l.id))}
                        >
                            Remove
                        </button>
                    </li>
                ))}
            </ul>
        </section>
    )
}