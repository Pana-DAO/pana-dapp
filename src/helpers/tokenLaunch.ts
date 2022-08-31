import { BigNumber, ethers } from "ethers";
import { addresses, NetworkId } from "src/constants";
import { PanaTokenStackProps } from "src/lib/PanaTokenStack";
import { getPanaPriceInUSDC } from "src/slices/AppSlice";
import { getErc20TokenBalance } from "src/slices/StakingPoolsSlice";
import { IERC20__factory, UniswapV2Lp__factory } from "src/typechain";
import { getTokenPrice } from ".";

export interface FarmInfo {
  readonly index: number;
  readonly pid: number;
  readonly symbol: string;
  readonly name: string;
  readonly address: string;
  readonly decimals: number;
  readonly coingeckoId: string;
  readonly points: number;
  readonly icon: PanaTokenStackProps["tokens"];
  readonly url: string;
  readonly network: number;
  readonly calculateLiquidity: (
    index: number,
    usd: number,
    provider: ethers.providers.JsonRpcProvider,
    networkId: NetworkId,
  ) => Promise<{balance:BigNumber,price: number, liquidity: number,isLoad:boolean}>;

}

export interface FarmPriceData {
  index: number;
  liquidity: number;
  liquidityUSD: number;
  price: number;
  balance:BigNumber;
  farmperday:BigNumber;
  isLoad:boolean;  
}

export const stakingPoolsConfig = {
  startTime: 1660483741,
  endTime: 1665849600,
  panaPerSecond: BigNumber.from("578703703703700000"),
};

export const panaUSDCLiquidity = async (
  index: number,
  usd: number,
  provider: ethers.providers.JsonRpcProvider,
  networkId: NetworkId,
) => {
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
      const balance = await getErc20TokenBalance(farm.address, provider, networkId);
      const lpInFarm = +(balance) / Math.pow(10, baseContractDec);
      return {
        liquidity: usdcPerLP * +lpInFarm,
        price: usdcPerLP,
        balance:balance,
        isLoad:true
      }
    } else {
      return {
        liquidity: 0,
        price: usdcPerLP,
        balance:BigNumber.from("0"),
        isLoad:false
      }
    }
  } catch (error) {
    console.error(error);
    return {
      liquidity: 0,
      price: 0,
      balance:BigNumber.from("0"),
      isLoad:false
    }
  }
};

export const panaLiquidity = async (
  index: number,
  usd: number,
  provider: ethers.providers.JsonRpcProvider,
  networkId: NetworkId,
) => {
  try {
    const panaPrice = await getPanaPriceInUSDC(provider, networkId);

    // Pana hold by Staking Pool
    const farm = farms.find(p => p.index == index);
    if (farm) {
      const balance = await getErc20TokenBalance(farm.address, provider, networkId);
      const panaInFarm = +(balance) / Math.pow(10, 18);
      return {
        balance:balance,
        liquidity: panaPrice * +panaInFarm,
        price: panaPrice,
        isLoad:true
      }
    } else {
      return {
        liquidity: 0,
        price: panaPrice,
        balance:BigNumber.from("0"),
        isLoad:false
      }
    }
  } catch (error) {
    console.error(error);
    return {
      balance:BigNumber.from("0"),
      liquidity: 0,
      price: 0,
      isLoad:false
    }
  }
};


export const defaultLiquidityCal = async (
  index: number,
  usd: number,
  provider: ethers.providers.JsonRpcProvider,
  networkId: NetworkId,
): Promise<{balance:BigNumber, price: number, liquidity: number,isLoad:boolean }> => {

  const farm = farms.find(p => p.index == index);
  if (farm) {
    const usdPrice = usd ?? usd > 0 ? usd : await getTokenPrice(farm?.coingeckoId);
    if (usdPrice) {
      try {
        if (farm) {
          const balance =  (await getErc20TokenBalance(farm.address, provider, networkId));
          const balanceInFarm =
          +balance / Math.pow(10, farm.decimals);
          return {
            balance:balance,
            liquidity: usdPrice * +balanceInFarm,
            price: usdPrice,
            isLoad:true
          }
        } else {
          return {
            balance:BigNumber.from("0"),
            liquidity: 0,
            price: usdPrice,
            isLoad:false
          }
        }
      } catch (error) {
        console.error(error);
        return {
          balance:BigNumber.from("0"),
          liquidity: 0,
          price: usdPrice,
          isLoad:false
        }
      }
    }
  }
  return {
    balance:BigNumber.from("0"),
    liquidity: 0,
    price: 0,
    isLoad:false
  }
};

export const farms: FarmInfo[] = [
  {
    index: 0,
    pid: 15,
    symbol: "USDC-Pana",
    name: "USDC-Pana LP",
    address: "0x300fDD222687db8686EA51847Db43fa988b518E0",
    decimals: 18,
    points: 400,
    icon: ["USDC", "PANA"],
    url: "https://app.sushi.com/legacy/add/0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8/0x369eB8197062093a20402935D3a707b4aE414E9D?chainId=42161",
    coingeckoId: "",
    calculateLiquidity: panaUSDCLiquidity,
    network: NetworkId.ARBITRUM_MAINNET,
  },
  {
    index: 1,
    pid: 0,
    symbol: "Pana",
    name: "Pana Token",
    address: "0x369eB8197062093a20402935D3a707b4aE414E9D",
    decimals: 18,
    points: 100,
    coingeckoId: "",
    icon: ["PANA"],
    url: "https://app.sushi.com/swap?inputCurrency=0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8&outputCurrency=0x369eB8197062093a20402935D3a707b4aE414E9D&chainId=42161",
    calculateLiquidity: panaLiquidity,
    network: NetworkId.ARBITRUM_MAINNET,
  },
  {
    index: 2,
    pid: 1,
    symbol: "USDC",
    name: "USDC Stable Coin",
    address: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
    decimals: 6,
    points: 10,
    coingeckoId: "usd-coin",
    icon: ["USDC"],
    url: "https://app.sushi.com/swap?inputCurrency=ETH&outputCurrency=0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8&chainId=42161",
    calculateLiquidity: defaultLiquidityCal,
    network: NetworkId.ARBITRUM_MAINNET,
  },
  {
    index: 3,
    pid: 2,
    symbol: "AAVE",
    name: "AAVE",
    address: "0xba5DdD1f9d7F570dc94a51479a000E3BCE967196",
    decimals: 18,
    points: 10,
    coingeckoId: "aave",
    icon: ["AAVE"],
    url: "https://app.aave.com/",
    calculateLiquidity: defaultLiquidityCal,
    network: NetworkId.ARBITRUM_MAINNET,
  },
  {
    index: 4,
    pid: 3,
    symbol: "BIFI",
    name: "BIFI",
    address: "0x99C409E5f62E4bd2AC142f17caFb6810B8F0BAAE",
    decimals: 18,
    points: 10,
    coingeckoId: "beefy-finance",
    icon: ["BIFI"],
    url: "https://app.sushi.com/swap?inputCurrency=ETH&outputCurrency=0x99C409E5f62E4bd2AC142f17caFb6810B8F0BAAE&chainId=42161",
    calculateLiquidity: defaultLiquidityCal,
    network: NetworkId.ARBITRUM_MAINNET,
  },
  {
    index: 5,
    pid: 4,
    symbol: "CRV",
    name: "CRV",
    address: "0x11cDb42B0EB46D95f990BeDD4695A6e3fA034978",
    decimals: 18,
    points: 10,
    coingeckoId: "curve-dao-token",
    icon: ["CRV"],
    url: "https://arbitrum.curve.fi/",
    calculateLiquidity: defaultLiquidityCal,
    network: NetworkId.ARBITRUM_MAINNET,
  },
  {
    index: 6,
    pid: 5,
    symbol: "DAI",
    name: "DAI",
    address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
    decimals: 18,
    points: 10,
    coingeckoId: "dai",
    icon: ["DAI"],
    url: "https://app.sushi.com/swap?inputCurrency=ETH&outputCurrency=0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1&chainId=42161",
    calculateLiquidity: defaultLiquidityCal,
    network: NetworkId.ARBITRUM_MAINNET,
  },
  {
    index: 7,
    pid: 6,
    symbol: "DPX",
    name: "DPX",
    address: "0x6C2C06790b3E3E3c38e12Ee22F8183b37a13EE55",
    decimals: 18,
    points: 10,
    coingeckoId: "dopex",
    icon: ["DPX"],
    url: "https://app.sushi.com/swap?inputCurrency=ETH&outputCurrency=0x6C2C06790b3E3E3c38e12Ee22F8183b37a13EE55&chainId=42161",
    calculateLiquidity: defaultLiquidityCal,
    network: NetworkId.ARBITRUM_MAINNET,
  },
  {
    index: 8,
    pid: 7,
    symbol: "GMX",
    name: "GMX",
    address: "0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a",
    decimals: 18,
    points: 10,
    coingeckoId: "gmx",
    icon: ["GMX"],
    url: "https://app.uniswap.org/#/swap?inputCurrency=ETH&outputCurrency=0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a&chain=arbitrum",
    calculateLiquidity: defaultLiquidityCal,
    network: NetworkId.ARBITRUM_MAINNET,
  },
  {
    index: 9,
    pid: 8,
    symbol: "GOHM",
    name: "GOHM",
    address: "0x8D9bA570D6cb60C7e3e0F31343Efe75AB8E65FB1",
    decimals: 18,
    points: 10,
    coingeckoId: "governance-ohm",
    icon: ["OHM"],
    url: "https://app.olympusdao.finance/#/dashboard",
    calculateLiquidity: defaultLiquidityCal,
    network: NetworkId.ARBITRUM_MAINNET,
  },
  {
    index: 10,
    pid: 9,
    symbol: "JONES",
    name: "JONES",
    address: "0x10393c20975cF177a3513071bC110f7962CD67da",
    decimals: 18,
    points: 10,
    coingeckoId: "jones-dao",
    icon: ["JONES"],
    url: "https://app.sushi.com/swap?inputCurrency=ETH&outputCurrency=0x10393c20975cF177a3513071bC110f7962CD67da&chainId=42161",
    calculateLiquidity: defaultLiquidityCal,
    network: NetworkId.ARBITRUM_MAINNET,
  },
  {
    index: 11,
    pid: 10,
    symbol: "STG",
    name: "STG",
    address: "0x6694340fc020c5E6B96567843da2df01b2CE1eb6",
    decimals: 18,
    points: 10,
    coingeckoId: "stargate-finance",
    icon: ["STG"],
    url: "https://stargate.finance/farm",
    calculateLiquidity: defaultLiquidityCal,
    network: NetworkId.ARBITRUM_MAINNET,
  },
  {
    index: 12,
    pid: 11,
    symbol: "SUSHI",
    name: "SUSHI",
    address: "0xd4d42F0b6DEF4CE0383636770eF773390d85c61A",
    decimals: 18,
    points: 10,
    coingeckoId: "sushi",
    icon: ["SUSHI"],
    url: "https://app.sushi.com/swap?inputCurrency=ETH&outputCurrency=0xd4d42F0b6DEF4CE0383636770eF773390d85c61A&chainId=42161",
    calculateLiquidity: defaultLiquidityCal,
    network: NetworkId.ARBITRUM_MAINNET,
  },
  {
    index: 13,
    pid: 12,
    symbol: "SYN",
    name: "SYN",
    address: "0x080F6AEd32Fc474DD5717105Dba5ea57268F46eb",
    decimals: 18,
    points: 10,
    coingeckoId: "synapse-2",
    icon: ["SYN"],
    url: "https://synapseprotocol.com/stake",
    calculateLiquidity: defaultLiquidityCal,
    network: NetworkId.ARBITRUM_MAINNET,
  },
  {
    index: 14,
    pid: 13,
    symbol: "VSTA",
    name: "VSTA",
    address: "0xa684cd057951541187f288294a1e1C2646aA2d24",
    decimals: 18,
    points: 10,
    coingeckoId: "vesta-finance",
    icon: ["VST"],
    url: "https://arbitrum.balancer.fi/#/trade/ether/0xa684cd057951541187f288294a1e1c2646aa2d24",
    calculateLiquidity: defaultLiquidityCal,
    network: NetworkId.ARBITRUM_MAINNET,
  },
  {
    index: 15,
    pid: 14,
    symbol: "wETH",
    name: "wETH",
    address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
    decimals: 18,
    points: 10,
    coingeckoId: "weth",
    icon: ["wETH"],
    url: "https://app.sushi.com/swap?inputCurrency=ETH&outputCurrency=0x82aF49447D8a07e3bd95BD0d56f35241523fBab1&chainId=42161",
    calculateLiquidity: defaultLiquidityCal,
    network: NetworkId.ARBITRUM_MAINNET,
  },
  {
    index: 0,
    pid: 1,
    symbol: "USDC-Pana",
    name: "USDC-Pana LP",
    address: "0x91a2d26e987219E6a266784d5a816ceEf03cB3B8",
    decimals: 18,
    points: 400,
    coingeckoId: "",
    icon: ["USDC", "PANA"],
    url: "https://swapr.eth.link/#/swap?chainId=421611",
    calculateLiquidity: panaUSDCLiquidity,
    network: NetworkId.ARBITRUM_TESTNET,
  },
  {
    index: 1,
    pid: 4,
    symbol: "Pana",
    name: "Pana Coin",
    address: "0x053Bdec0bEC0b010C7dd37E82C2246d107d6B363",
    decimals: 18,
    points: 100,
    coingeckoId: "pana-dao",
    icon: ["PANA"],
    url: "https://swapr.eth.link/#/swap?chainId=421611",
    calculateLiquidity: defaultLiquidityCal,
    network: NetworkId.ARBITRUM_TESTNET,
  },
  {
    index: 2,
    pid: 0,
    symbol: "USDC",
    name: "USDC Stable Coin",
    address: "0x91700A0a45bef3Ef488eC11792aE3b3199e0dC4e",
    decimals: 6,
    points: 10,
    coingeckoId: "usd-coin",
    icon: ["USDC"],
    url: "https://swapr.eth.link/#/swap?chainId=421611",
    calculateLiquidity: defaultLiquidityCal,
    network: NetworkId.ARBITRUM_TESTNET,
  },
  {
    index: 3,
    pid: 2,
    symbol: "DAI",
    name: "DAI Stable Coin",
    address: "0x327459343E34F4c2Cc3fE6678ea8cA3Cf22fBfC8",
    decimals: 18,
    points: 10,
    coingeckoId: "dai",
    icon: ["DAI"],
    url: "https://swapr.eth.link/#/swap?chainId=421611",
    calculateLiquidity: defaultLiquidityCal,
    network: NetworkId.ARBITRUM_TESTNET,
  },
  {
    index: 4,
    pid: 3,
    symbol: "wETH",
    name: "Wrapped ETH",
    address: "0xB47e6A5f8b33b3F17603C83a0535A9dcD7E32681",
    decimals: 18,
    points: 10,
    coingeckoId: "weth",
    icon: ["wETH"],
    url: "https://swapr.eth.link/#/swap?chainId=421611",
    calculateLiquidity: defaultLiquidityCal,
    network: NetworkId.ARBITRUM_TESTNET,
  },
];

export const totalFarmPoints = farms.reduce((total, value) => total + value.points, 0);

export function parseBigNumber(value: string, decimals: number): BigNumber {
  try {
    return ethers.utils.parseUnits(value, decimals);
  } catch {
    return BigNumber.from(0);
  }
}

export function formatMoney(value: number, abbreviate = false, hasPrefix = true): string {
  try {
    const prefix = hasPrefix ? (value < 0 ? "-$" : "$") : "";
    value = Math.abs(value);
    if (abbreviate) {
      if (value >= 1000) {
        if (value >= 1000000) {
          if (value >= 1000000000) {
            return prefix + Math.round((value / 1000000000) * 1e1) / 1e1 + "B";
          }
          return prefix + Math.round((value / 1000000) * 1e1) / 1e1 + "M";
        }
        return prefix + Math.round((value / 1000) * 1e1) / 1e1 + "K";
      }
    }
    if (value < 1e-6 || isNaN(value)) {
      return "$0";
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
  } catch {}
  return "";
}
