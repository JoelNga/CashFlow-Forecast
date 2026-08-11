export type CycleType = 'weekly' | 'monthly' | 'annual';

export interface Entry {
    id: string;
    label: string;
    amount: number;
    type: 'income' | 'expense';
    cycle: CycleType;
    anchorDate: string;
}

export interface ForecastInput {
    startingBalance: number;
    entries: Entry[];
    windowDays: number;
    startDate: string;
}

export interface DailyBalance {
    date: string;
    balance: number;
}

export interface ForecastResult {
    series: DailyBalance[];
    lowPoint: DailyBalance;
}