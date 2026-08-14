import {
    CartesianGrid,
    Line,
    LineChart,
    ReferenceDot,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'
import type { DailyBalance } from '../engine/types'

interface Props {
    series: DailyBalance[]
    lowPoint: DailyBalance
}

export default function ForecastChart({ series, lowPoint }: Props) {
    if (series.length === 0) {
        return (
            <section className="panel chart-panel">
                <h2>Projected balance</h2>
                <p className="empty">Nothing to chart — extend the window or check the start date.</p>
            </section>
        )
    }

    return (
        <section className="panel chart-panel">
            <h2>Projected balance</h2>
            <ResponsiveContainer width="100%" height={280}>
                <LineChart data={series} margin={{ top: 12, right: 16, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e6e6e6" />
                    <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(s: string) => s.slice(5)}
                        tickLine={false}
                        axisLine={{ stroke: '#ccc' }}
                    />
                    <YAxis
                        width={64}
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v: number) => `RM${Number(v).toFixed(0)}`}
                        tickLine={false}
                        axisLine={false}
                    />
                    <Tooltip
                        formatter={(value) => [`RM${Number(value).toFixed(2)}`, 'Balance']}
                        labelFormatter={(label) => String(label)}
                    />
                    <ReferenceLine y={0} stroke="#d0d0d0" />
                    <Line type="monotone" dataKey="balance" stroke="#2563eb" strokeWidth={2} dot={false} />
                    <ReferenceDot x={lowPoint.date} y={lowPoint.balance} r={5} fill="#dc2626" stroke="#fff" />
                </LineChart>
            </ResponsiveContainer>
        </section>
    )
}