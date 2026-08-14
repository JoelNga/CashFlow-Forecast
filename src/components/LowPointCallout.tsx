import type { DailyBalance } from '../engine/types'

interface Props {
    lowPoint: DailyBalance
}

function formatDate(s: string): string {
    return new Date(`${s}T00:00:00`).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    })
}

export default function LowPointCallout({ lowPoint }: Props) {
    const danger = lowPoint.balance < 0
    return (
        <section className={`panel callout ${danger ? 'callout-danger' : ''}`}>
            <span className="callout-label">Tightest day</span>
            <strong className="callout-amount">
                {lowPoint.balance < 0 ? '-' : ''}
                {`RM${Math.abs(lowPoint.balance).toFixed(2)}`}
            </strong>
            <span className="callout-date">{formatDate(lowPoint.date)}</span>
            {danger && <p className="callout-note">Your balance dips below zero on this day.</p>}
        </section>
    )
}