import { PanaTokenStackProps } from "src/lib/PanaTokenStack"

export interface FarmInfo {
    readonly index: number,
    readonly pid: number,
    readonly symbol: string,
    readonly name: string,
    readonly address: string,
    readonly decimals: number,
    readonly points: number,
    readonly icon: PanaTokenStackProps["tokens"],
    readonly url: string
}

export const farms: FarmInfo[] = [
    { index: 0, pid: 0, symbol: 'Pana', name: 'Pana', address: '0x55975321D9d22587d1742DC68B35481C8DBB0Db8', decimals: 18, points: 100, icon: ['PANA'], url: '' },
    { index: 1, pid: 9, symbol: 'Pana-DAI', name: 'Pana-DAI LP', address: '0xf777455fC8BBd4033b1E0dB1423B13BDF3B68694', decimals: 18, points: 400, icon: ['PANA', 'DAI'], url: '' },
    { index: 2, pid: 1, symbol: 'DAI', name: 'DAI Stable Coin', address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', decimals: 6, points: 10, icon: ['DAI'], url: '' }
]