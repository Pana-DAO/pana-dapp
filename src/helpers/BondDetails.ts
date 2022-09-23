import { ethers } from "ethers";

import { addresses, NetworkId, NETWORKS } from "src/constants";
import { PanaTokenStackProps } from "src/lib/PanaTokenStack";
import { getPanaPriceInUSDC } from "src/slices/AppSlice";
import { IERC20__factory, UniswapV2Lp__factory, BondDepository__factory } from "../typechain";

const pricingFunctionHelperLP = async (
  provider: ethers.providers.JsonRpcProvider,
  quoteToken: string,
  networkId: NetworkId,
) => {
  const baseContract = UniswapV2Lp__factory.connect(quoteToken, provider);
  const reserves = await baseContract.getReserves();
  const totalSupply = +(await baseContract.totalSupply()) / Math.pow(10, await baseContract.decimals());
  const token0Address = await baseContract.token0();
  const token1Address = await baseContract.token1();
  let reserve, tokenContract;

  if (token0Address.toLowerCase() == addresses[networkId].PANA_ADDRESS.toLowerCase()) {
    reserve = +reserves._reserve0;
    tokenContract = IERC20__factory.connect(token0Address, provider);
  } else {
    reserve = +reserves._reserve1;
    tokenContract = IERC20__factory.connect(token1Address, provider);
  }
  const tokenDecimals = await tokenContract.decimals();

  const panaAmount = reserve / Math.pow(10, tokenDecimals);

  // Price in terms of LP token for a single Pana
  return 1 / (2 * (panaAmount / totalSupply));
};

const getOraclePrice = async (provider: ethers.providers.JsonRpcProvider, networkId: NetworkId, index: number) => {
  const depositoryContract = BondDepository__factory.connect(addresses[networkId].BOND_DEPOSITORY, provider);
  const oraclePrice = await depositoryContract.getOraclePriceView(index);
  return +oraclePrice / Math.pow(10, 18);
};

export interface BondDetails {
  name: string;
  panaIconSvg: PanaTokenStackProps["tokens"];
  pricingFunction(
    provider: ethers.providers.JsonRpcProvider,
    quoteToken: string,
    networkId: NetworkId,
    index: number,
  ): Promise<number>;
  isLP: boolean;
  lpUrl: { [key: number]: string };
}

const UsdcDetails: BondDetails = {
  name: "USDC",
  panaIconSvg: ["USDC"],
  pricingFunction: async (provider, quoteToken, networkId, index) => {
    if (NETWORKS[networkId].isOracleIntegrated) {
      return await getOraclePrice(provider, networkId, index);
    } else {
      return await getPanaPriceInUSDC(provider, networkId);
    }
  },
  isLP: false,
  lpUrl: {},
};

export const UsdcPanaDetails: BondDetails = {
  name: "PANA-USDC LP",
  panaIconSvg: ["PANA", "USDC"],
  pricingFunction: async (provider, quoteToken, networkId, index) => {
    if (NETWORKS[networkId].isOracleIntegrated) {
      return await getOraclePrice(provider, networkId, index);
    } else {
      return pricingFunctionHelperLP(provider, quoteToken, networkId);
    }
  },
  isLP: true,
  lpUrl: {
    [NetworkId.ARBITRUM_TESTNET]: "https://testnet.arbiscan.io/token/0x91a2d26e987219E6a266784d5a816ceEf03cB3B8",
    [NetworkId.ARBITRUM_MAINNET]: "https://app.sushi.com/legacy/add/0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8/0x369eB8197062093a20402935D3a707b4aE414E9D?chainId=42161",
  },
};

export const UnknownDetails: BondDetails = {
  name: "unknown",
  panaIconSvg: ["PANA"],
  pricingFunction: async () => {
    return 1;
  },
  isLP: false,
  lpUrl: "",
};

/**
 * DOWNCASE ALL THE ADDRESSES!!! for comparison purposes
 */
export const BondDetails: { [key: number]: { [key: string]: BondDetails } } = {
  [NetworkId.ARBITRUM_MAINNET]: {
    ["0x300fdd222687db8686ea51847db43fa988b518e0"]: UsdcPanaDetails
  },
  [NetworkId.ARBITRUM_TESTNET]: {
    ["0x91a2d26e987219e6a266784d5a816ceef03cb3b8"]: UsdcPanaDetails
  },
};
