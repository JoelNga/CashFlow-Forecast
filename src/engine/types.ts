export type Frequency = 'daily' | 'weekly' | 'monthly' | 'annual' | 'once';

export type EntryType = 'income' | 'expense'

export interface Entry {
    id: string;
    label: string;
    amount: number;
    type: EntryType;
    frequency: Frequency;
    anchorDate: string;
}

export interface DailyLog {
    id: string
    date: string
    amount: number
    type: EntryType
    note?: string
}

export interface ForecastInput {
    startingBalance: number
    entries: Entry[]
    windowDays: number
    startDate: string
    referenceDate: string
    logs: DailyLog[]
}

export interface DailyBalance {
    date: string
    balance: number
    activity: number
}

export interface ForecastResult {
    series: DailyBalance[];
    lowPoint: DailyBalance;
    projectedDailyAverage: number;
    todayLogNet: number;
}

export type DayActivitySource = 'entry' | 'log' | 'average'

export interface DayActivityItem {
    id: string
    source: DayActivitySource
    label: string
    sub: string
    amount: number
}