import { createAsyncThunk, createSelector, createSlice } from "@reduxjs/toolkit";
import { ethers } from "ethers";
import { RootState } from "src/store";
import { Pana, SPana, Staking__factory } from "src/typechain";

import { abi as panaAbi } from "../abi/Pana.json";
import { abi as sPanaAbi } from "../abi/sPana.json";
import { abi as pairContractAbi } from "../abi/PairContract.json";
import { addresses, NetworkId } from "../constants";
import { setAll } from "../helpers";
import apollo from "../lib/apolloClient";
import { IBaseAsyncThunk } from "./interfaces";
import { getTokenPrice } from "../helpers";

interface IProtocolMetrics {
  readonly timestamp: string;
  readonly totalSupply: string;
  readonly marketCap: string;
  readonly totalValueLocked: string;
  readonly treasuryMarketValue: string;
  readonly nextEpochRebase: string;
}

const getRealNumber = (number: any) => {
  return ethers.utils.formatUnits(ethers.BigNumber.from(number).toBigInt(), 18);
}

export const loadAppDetails = createAsyncThunk(
  "app/loadAppDetails",
  async ({ networkID, provider }: IBaseAsyncThunk, { dispatch }) => {
    const protocolMetricsQuery = `
      query {
        _meta {
          block {
            number
          }
        }
        protocolMetrics(first: 1, orderBy: timestamp, orderDirection: desc) {
          timestamp
          
          totalSupply
          
          marketCap
          totalValueLocked
          treasuryMarketValue
          nextEpochRebase
          
        }
      }
    `;
    // alert(networkID);

    // if (networkID !== NetworkId.POLYGON_MAINNET) {
    //   provider = NodeHelper.getMainnetStaticProvider();
    //   networkID = NetworkId.POLYGON_MAINNET;
    // }
    const graphData = await apollo<{ protocolMetrics: IProtocolMetrics[] }>(protocolMetricsQuery);

    if (!graphData || graphData == null) {
      console.error("Returned a null response when querying TheGraph");
      return;
    }

    const daiPriceInUSD = (await getTokenPrice("dai")) || 1;
    
    const stakingTVL = parseFloat(graphData.data.protocolMetrics[0].totalValueLocked);
    // NOTE (appleseed): marketPrice from Graph was delayed, so get CoinGecko price    
    let marketPrice;
    try {
      const originalPromiseResult = await dispatch(
        loadMarketPrice({ networkID: networkID, provider: provider }),
      ).unwrap();
      marketPrice = originalPromiseResult?.marketPrice * daiPriceInUSD;
    } catch (rejectedValueOrSerializedError) {
      // handle error here
      console.error("Returned a null response from dispatch(loadMarketPrice)");
      return;
    }

    const currentBlock = await provider.getBlockNumber();

    const stakingContract = Staking__factory.connect(addresses[networkID].STAKING_ADDRESS, provider);
    const daoMultisig = addresses[networkID].DAO_MULTISIG;

    const panaMainContract = new ethers.Contract(
      addresses[networkID].PANA_ADDRESS as string,
      panaAbi,
      provider,
    ) as Pana;

    const sPanaContract = new ethers.Contract(
      addresses[networkID].SPANA_ADDRESS as string,
      sPanaAbi,
      provider,
    ) as SPana;

    
    

    const totalSupply = parseFloat(parseFloat(getRealNumber((await panaMainContract.totalSupply()).toBigInt())).toFixed(4));
    const daoPanaBalance = parseFloat(parseFloat(getRealNumber((await panaMainContract.balanceOf(daoMultisig)).toBigInt())).toFixed(4));
    const circSupply = totalSupply-daoPanaBalance;
    const sPanaCircSupply = Number((await sPanaContract.circulatingSupply()).toString());

    const marketCap = circSupply * marketPrice;

    //const totalSupply = parseFloat(graphData.data.protocolMetrics[0].totalSupply);
    const treasuryMarketValue = parseFloat(graphData.data.protocolMetrics[0].treasuryMarketValue);
    // const currentBlock = parseFloat(graphData.data._meta.block.number);

    if (!provider) {
      console.error("failed to connect to provider, please connect your wallet");
      return {
        stakingTVL,
        marketPrice,
        marketCap,
        circSupply,
        totalSupply,
        treasuryMarketValue,
      } as IAppData;
    }
    // Calculating staking
    const epoch = await stakingContract.epoch();
    let secondsToEpoch = 0;

    try {
      secondsToEpoch = Number(await stakingContract.secondsToNextEpoch());
    } catch {
      console.error("Returned a null response from stakingContract.secondsToNextEpoch()");
    }

    //alert(secondsToEpoch);
    const stakingReward = epoch.distribute;
    const stakingRebase = Number(stakingReward.toString()) / sPanaCircSupply;
    const fiveDayRate = Math.pow(1 + stakingRebase, 5 * 3) - 1;
    const stakingAPY = Math.pow(1 + stakingRebase, 365 * 3) - 1;
    
    // Current index
    const currentIndex = await stakingContract.index();
    return {
      currentIndex: ethers.utils.formatUnits(currentIndex, 18),
      currentBlock,
      fiveDayRate,
      stakingAPY,
      stakingTVL,
      stakingRebase,
      marketCap,
      marketPrice,
      circSupply,
      totalSupply,
      treasuryMarketValue,
      secondsToEpoch,
    } as IAppData;
  },
);

export const debug = false;

/**
 * checks if app.slice has marketPrice already
 * if yes then simply load that state
 * if no then fetches via `loadMarketPrice`
 *
 * `usage`:
 * ```
 * const originalPromiseResult = await dispatch(
 *    findOrLoadMarketPrice({ networkID: networkID, provider: provider }),
 *  ).unwrap();
 * originalPromiseResult?.whateverValue;
 * ```
 */
export const findOrLoadMarketPrice = createAsyncThunk(
  "app/findOrLoadMarketPrice",
  async ({ networkID, provider }: IBaseAsyncThunk, { dispatch, getState }) => {
    const state: any = getState();
    let marketPrice;
    // check if we already have loaded market price
    if (state.app.loadingMarketPrice === false && state.app.marketPrice) {
      // go get marketPrice from app.state
      marketPrice = state.app.marketPrice;
    } else {
      // we don't have marketPrice in app.state, so go get it
      try {
        const originalPromiseResult = await dispatch(
          loadMarketPrice({ networkID: networkID, provider: provider }),
        ).unwrap();
        marketPrice = originalPromiseResult?.marketPrice;
      } catch (rejectedValueOrSerializedError) {
        // handle error here
        console.error("Returned a null response from dispatch(loadMarketPrice)");
        return;
      }
    }
    return { marketPrice };
  },
);

/**
 * - fetches the PANA price from CoinGecko (via getTokenPrice) 
 * - updates the App.slice when it runs
 */
const loadMarketPrice = createAsyncThunk("app/loadMarketPrice", async ({ networkID, provider }: IBaseAsyncThunk) => {
  // TODO GET ACTUAL MARKET PRICE
  // const marketPrice = await getTokenPrice("pana")
  return {
    marketPrice: await getPanaPriceInDAI(provider, networkID),
  };
  
});

export const getPanaPriceInDAI = async (provider: ethers.providers.JsonRpcProvider, networkID: NetworkId): Promise<number> => {
  const pairContract = new ethers.Contract(addresses[networkID].PANA_DAI_LP as string, pairContractAbi, provider);

  const reserves = await pairContract.getReserves();
  const token0 = await pairContract.token0();  
  if(token0==addresses[networkID].PANA_ADDRESS){
    return reserves[0] / reserves[1];
  }
  return reserves[1] / reserves[0];
}

export interface IAppData {
  readonly circSupply?: any;
  readonly currentIndex?: string;
  readonly currentBlock?: number;
  readonly fiveDayRate?: number;
  readonly loading: boolean;
  readonly loadingMarketPrice: boolean;
  readonly marketCap?: number;
  readonly marketPrice?: number;
  readonly stakingAPY?: number;
  readonly stakingRebase?: number;
  readonly stakingTVL?: number;
  readonly totalSupply?: number;
  readonly treasuryBalance?: number;
  readonly treasuryMarketValue?: number;
  readonly secondsToEpoch?: number;
}

const initialState: IAppData = {
  loading: false,
  loadingMarketPrice: false,
};

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    fetchAppSuccess(state, action) {
      setAll(state, action.payload);
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loadAppDetails.pending, state => {
        state.loading = true;
      })
      .addCase(loadAppDetails.fulfilled, (state, action) => {
        setAll(state, action.payload);
        state.loading = false;
      })
      .addCase(loadAppDetails.rejected, (state, { error }) => {
        state.loading = false;
        console.error(error.name, error.message, error.stack);
      })
      .addCase(loadMarketPrice.pending, (state, action) => {
        state.loadingMarketPrice = true;
      })
      .addCase(loadMarketPrice.fulfilled, (state, action) => {
        setAll(state, action.payload);
        state.loadingMarketPrice = false;
      })
      .addCase(loadMarketPrice.rejected, (state, { error }) => {
        state.loadingMarketPrice = false;
        console.error(error.name, error.message, error.stack);
      });
  },
});

const baseInfo = (state: RootState) => state.app;

export default appSlice.reducer;

export const { fetchAppSuccess } = appSlice.actions;

export const getAppState = createSelector(baseInfo, app => app);
