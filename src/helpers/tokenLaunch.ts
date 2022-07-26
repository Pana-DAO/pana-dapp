import { BigNumber, ethers } from "ethers"
import { addresses, NetworkId } from "src/constants"
import { PanaTokenStackProps } from "src/lib/PanaTokenStack"
import { getPanaPriceInDAI } from "src/slices/AppSlice"
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
    panaPerSecond: BigNumber.from('18000000000000000000')
}

export const panaDAILiquidity = async (index: number, provider: ethers.providers.JsonRpcProvider, networkId: NetworkId) => {
    try {
        const baseContract = UniswapV2Lp__factory.connect(addresses[networkId].PANA_DAI_LP, provider);
        const reserves = await baseContract.getReserves();
        const baseContractDec = await baseContract.decimals();
        const totalSupply = +(await baseContract.totalSupply()) / Math.pow(10, baseContractDec);
        const token0Address = await baseContract.token0();
        const token1Address = await baseContract.token1();
        let reserve, tokenContract;

        if (token0Address.toLowerCase() == addresses[networkId].DAI_ADDRESS.toLowerCase()) {
            reserve = +reserves._reserve0;
            tokenContract = IERC20__factory.connect(token0Address, provider);
        } else {
            reserve = +reserves._reserve1;
            tokenContract = IERC20__factory.connect(token1Address, provider);
        }
        const tokenDecimals = await tokenContract.decimals();
        const daiAmount = reserve / Math.pow(10, tokenDecimals);
        const daiPerLP = 2 * (daiAmount / totalSupply);

        // LPs hold by Staking Pools
        const lpInFarm = +(await getErc20TokenBalance(farms[index].address, provider, networkId)) / Math.pow(10, baseContractDec);

        return daiPerLP * +lpInFarm;
    } catch (error) {
        console.error(error);
        return 0;
    }
}

export const panaLiquidity = async (index: number, provider: ethers.providers.JsonRpcProvider, networkId: NetworkId) => {
    try {
        const panaPrice = await getPanaPriceInDAI(provider, networkId);

        // Pana hold by Staking Pool
        const panaInFarm = +(await getErc20TokenBalance(farms[index].address, provider, networkId)) / Math.pow(10, 18);
        return panaPrice * +panaInFarm;
    } catch (error) {
        console.error(error);
        return 0;
    }

}

export const daiLiquidity = async (index: number, provider: ethers.providers.JsonRpcProvider, networkId: NetworkId) => {
    try {
        // DAI hold by Staking Pool
        return +(await getErc20TokenBalance(farms[index].address, provider, networkId)) / Math.pow(10, 18);
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
            const wETHInFarm = +(await getErc20TokenBalance(farms[index].address, provider, networkId)) / Math.pow(10, 18);
            return wethPrice * +wETHInFarm;
        } catch (error) {
            console.error(error);
            return 0;
        }
    }    
    return 0;
}

export const farms: FarmInfo[] = [
    { index: 0, pid: 1, symbol: 'Pana-DAI', name: 'Pana-DAI LP', address: '0x75C78C8F779dE09687629E158Ad4f33EE35b5eE1', decimals: 18, points: 400, icon: ['PANA', 'DAI'], url: 'https://swapr.eth.link/#/swap?chainId=421611', calculateLiquidity: panaDAILiquidity },
    { index: 1, pid: 0, symbol: 'Pana', name: 'Pana', address: '0x29f55058bE3104EdE589fA51ff74B2F07eBb46F6', decimals: 18, points: 100, icon: ['PANA'], url: 'https://swapr.eth.link/#/swap?chainId=421611', calculateLiquidity: panaLiquidity },
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


