import { BigNumber, ethers } from "ethers"
import { addresses, NetworkId } from "src/constants"
import { PanaTokenStackProps } from "src/lib/PanaTokenStack"
import { getPanaPriceInUSDC } from "src/slices/AppSlice"
import { getErc20TokenBalance } from "src/slices/StakingPoolsSlice"
import { IERC20__factory, UniswapV2Lp__factory } from "src/typechain"
import { getTokenPrice } from "."

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
    readonly calculateLiquidity: (index: number, provider: ethers.providers.JsonRpcProvider, networkId: NetworkId) => Promise<number>
}

export interface FarmPriceData {
    index: number;
    liquidity: number;
}

export const stakingPoolsConfig = {
    startTime: 1656676009,
    endTime: 1688212009,
    panaPerSecond: BigNumber.from('578703703703700000')
}

export const panaUSDCLiquidity = async (index: number, provider: ethers.providers.JsonRpcProvider, networkId: NetworkId) => {
    try {
        const baseContract = UniswapV2Lp__factory.connect(addresses[networkId].PANA_USDC_LP, provider);
        const reserves = await baseContract.getReserves();
        const baseContractDec = await baseContract.decimals();
        const totalSupply = +(await baseContract.totalSupply()) / Math.pow(10, baseContractDec);
        const token0Address = await baseContract.token0();
        const token1Address = await baseContract.token1();
        let reserve, tokenContract;

        if (token0Address.toLowerCase() == addresses[networkId].USDC_ADDRESS.toLowerCase()) {
            reserve = +reserves._reserve0;
            tokenContract = IERC20__factory.connect(token0Address, provider);
        } else {
            reserve = +reserves._reserve1;
            tokenContract = IERC20__factory.connect(token1Address, provider);
        }
        const tokenDecimals = await tokenContract.decimals();
        const usdcAmount = reserve / Math.pow(10, tokenDecimals);
        const usdcPerLP = 2 * (usdcAmount / totalSupply);

        // LPs hold by Staking Pools
        const farm = farms.find(p => p.index == index);
        if (farm) {
            const lpInFarm = +(await getErc20TokenBalance(farm.address, provider, networkId)) / Math.pow(10, baseContractDec);
            return usdcPerLP * +lpInFarm;
        } else {
            return 0;
        }
    } catch (error) {
        console.error(error);
        return 0;
    }
}

export const panaLiquidity = async (index: number, provider: ethers.providers.JsonRpcProvider, networkId: NetworkId) => {
    try {
        const panaPrice = await getPanaPriceInUSDC(provider, networkId);

        // Pana hold by Staking Pool
        const farm = farms.find(p => p.index == index);
        if (farm) {
            const panaInFarm = +(await getErc20TokenBalance(farm.address, provider, networkId)) / Math.pow(10, 18);
            return panaPrice * +panaInFarm;
        } else {
            return 0;
        }
    } catch (error) {
        console.error(error);
        return 0;
    }

}

export const daiLiquidity = async (index: number, provider: ethers.providers.JsonRpcProvider, networkId: NetworkId) => {
    try {
        // DAI hold by Staking Pool
        const farm = farms.find(p => p.index == index);
        if (farm) {
            return +(await getErc20TokenBalance(farm.address, provider, networkId)) / Math.pow(10, 18);
        } else {
            return 0;
        }
    } catch (error) {
        console.error(error);
        return 0;
    }
}

export const usdcLiquidity = async (index: number, provider: ethers.providers.JsonRpcProvider, networkId: NetworkId) => {
    try {
        // DAI hold by Staking Pool
        const farm = farms.find(p => p.index == index);
        if (farm) {
            return +(await getErc20TokenBalance(farm.address, provider, networkId)) / Math.pow(10, 6);
        } else {
            return 0;
        }
    } catch (error) {
        console.error(error);
        return 0;
    }
}

export const wETHLiquidity = async (index: number, provider: ethers.providers.JsonRpcProvider, networkId: NetworkId) => {
    const wethPrice = await getTokenPrice("weth");
    if (wethPrice) {
        try {
            // Pana hold by Staking Pool
            const farm = farms.find(p => p.index == index);
            if (farm) {
                const wETHInFarm = +(await getErc20TokenBalance(farm.address, provider, networkId)) / Math.pow(10, 18);
                return wethPrice * +wETHInFarm;
            } else {
                return 0;
            }
        } catch (error) {
            console.error(error);
            return 0;
        }
    }
    return 0;
}

export const farms: FarmInfo[] = [
    { index: 0, pid: 1, symbol: 'USDC-Pana', name: 'USDC-Pana LP', address: '0x91a2d26e987219E6a266784d5a816ceEf03cB3B8', decimals: 18, points: 400, icon: ['USDC', 'PANA'], url: 'https://swapr.eth.link/#/swap?chainId=421611', calculateLiquidity: panaUSDCLiquidity },
    { index: 1, pid: 0, symbol: 'USDC', name: 'USDC Stable Coin', address: '0x91700A0a45bef3Ef488eC11792aE3b3199e0dC4e', decimals: 6, points: 10, icon: ['USDC'], url: 'https://swapr.eth.link/#/swap?chainId=421611', calculateLiquidity: usdcLiquidity },
    { index: 2, pid: 2, symbol: 'DAI', name: 'DAI Stable Coin', address: '0x327459343E34F4c2Cc3fE6678ea8cA3Cf22fBfC8', decimals: 18, points: 10, icon: ['DAI'], url: 'https://swapr.eth.link/#/swap?chainId=421611', calculateLiquidity: daiLiquidity },
    { index: 3, pid: 3, symbol: 'wETH', name: 'Wrapped ETH', address: '0xB47e6A5f8b33b3F17603C83a0535A9dcD7E32681', decimals: 18, points: 10, icon: ['wETH'], url: 'https://swapr.eth.link/#/swap?chainId=421611', calculateLiquidity: wETHLiquidity }
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

export function formatMoney(value: number, abbreviate = false): string {
    try {
        const prefix = value < 0 ? '-$' : '$';
        value = Math.abs(value);
        if (abbreviate) {
            if (value >= 1000) {
                if (value >= 1000000) {
                    if (value >= 1000000000) {
                        return prefix + (Math.round((value / 1000000000) * 1e1) / 1e1) + 'B';
                    }
                    return prefix + (Math.round((value / 1000000) * 1e1) / 1e1) + 'M';
                }
                return prefix + (Math.round((value / 1000) * 1e1) / 1e1) + 'K';
            }
        }
        if (value < 1e-6 || isNaN(value)) {
            return '$0';
        }
        for (let i = 0; i < 7; i++) {
            const power = Math.pow(10, i);
            if (value < 1e-5 * power) {
                const rounded = Math.round(value * (1e9 / power)) / (1e9 / power);
                return prefix + rounded.toString();
            }
        }
        const rounded = Math.round(value * 1e2) / 1e2;
        return prefix + rounded.toLocaleString(undefined, { minimumFractionDigits: 2 });
    }
    catch { }
    return '';
}


