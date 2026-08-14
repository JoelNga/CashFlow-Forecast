interface Props {
    projectedDailyAverage: number
    todayLogNet: number
}

export default function PacingIndicator({ projectedDailyAverage, todayLogNet }: Props) {
    if (projectedDailyAverage === 0 && todayLogNet === 0) {
        return (
            <section className="panel pacing">
                <p className="pacing-empty">
                    Log a few days of real spending to build a daily average — it will be used to
                    project future days.
                </p>
            </section>
        )
    }

    const loggedToday = todayLogNet < 0 ? `RM${Math.abs(todayLogNet).toFixed(2)} spent` : `RM${todayLogNet.toFixed(2)} received`
    const over = todayLogNet < 0 && Math.abs(todayLogNet) > Math.abs(projectedDailyAverage)
    const label = `Projected daily average is ${`RM${Math.abs(projectedDailyAverage).toFixed(2)}`}${projectedDailyAverage < 0 ? ' spent' : ' received'}, you've ${loggedToday} so far.`

    return (
        <section className="panel pacing">
            <span className={`pacing-emoji ${over ? 'pacing-over' : 'pacing-ok'}`}>{over ? 'Oops' : 'On track'}</span>
            <p className="pacing-text">{label}</p>
        </section>
    )
}