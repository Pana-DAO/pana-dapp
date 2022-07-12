import { BigNumber, ethers } from "ethers"
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

export const stakingPoolsConfig = {
    startTime: 1656676009,
    endTime: 1688212009,
    panaPerSecond: BigNumber.from('18000000000000000000')
}

export const farms: FarmInfo[] = [
    // { index: 0, pid: 0, symbol: 'Pana', name: 'Pana', address: '0x55975321D9d22587d1742DC68B35481C8DBB0Db8', decimals: 18, points: 100, icon: ['PANA'], url: '' },
    { index: 0, pid: 0, symbol: 'Pana-DAI', name: 'Pana-DAI LP', address: '0x75C78C8F779dE09687629E158Ad4f33EE35b5eE1', decimals: 18, points: 400, icon: ['PANA', 'DAI'], url: 'https://swapr.eth.link/#/swap?chainId=421611' }
    // { index: 2, pid: 1, symbol: 'DAI', name: 'DAI Stable Coin', address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', decimals: 6, points: 10, icon: ['DAI'], url: '' }
]

export const totalFarmPoints = farms.reduce((total, value) => total + value.points, 0);

export function parseBigNumber(value: string, decimals: number): BigNumber {
    try {
        return ethers.utils.parseUnits(value, decimals);
    }
    catch {
        return BigNumber.from(0);
    }
}
