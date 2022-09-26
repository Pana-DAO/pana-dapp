import { createAsyncThunk, createSelector, createSlice } from "@reduxjs/toolkit";
import { BigNumber, ethers } from "ethers";
import { RootState } from "src/store";
import { Distributor__factory, Pana, SPana, Staking__factory } from "src/typechain";

import { abi as panaAbi } from "../abi/Pana.json";
import { abi as sPanaAbi } from "../abi/sPana.json";
import { abi as pairContractAbi } from "../abi/PairContract.json";
import { addresses, NetworkId } from "../constants";
import { setAll } from "../helpers";

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





    // NOTE (appleseed): marketPrice from Graph was delayed, so get CoinGecko price    
    let marketPrice;
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

    const currentBlock = await provider.getBlockNumber();

    const stakingContract = addresses[networkID].STAKING_ADDRESS != "" ? Staking__factory.connect(addresses[networkID].STAKING_ADDRESS, provider) : null;
    const daoMultisig = addresses[networkID].DAO_MULTISIG;

    const distribute = addresses[networkID].DISTRIBUTOR_ADDRESS != "" ? Distributor__factory.connect(addresses[networkID].DISTRIBUTOR_ADDRESS, provider) : null;
    const panaMainContract = new ethers.Contract(
      addresses[networkID].PANA_ADDRESS as string,
      panaAbi,
      provider,
    ) as Pana;

    const sPanaContract = addresses[networkID].SPANA_ADDRESS != "" ? new ethers.Contract(
      addresses[networkID].SPANA_ADDRESS as string,
      sPanaAbi,
      provider,
    ) as SPana : null;




    const totalSupply = parseFloat(parseFloat(getRealNumber((await panaMainContract.totalSupply()).toBigInt())).toFixed(4));
    const daoPanaBalance = parseFloat(parseFloat(getRealNumber((await panaMainContract.balanceOf(daoMultisig)).toBigInt())).toFixed(4));
    const circSupply = totalSupply - daoPanaBalance;
    const stakedCircSupply = stakingContract != null ? Number((await stakingContract.stakingSupply()).toString()) : 1;
    const marketCap = circSupply * marketPrice;

    //const totalSupply = parseFloat(graphData.data.protocolMetrics[0].totalSupply);
    //const treasuryMarketValue = parseFloat(graphData.data.protocolMetrics[0].treasuryMarketValue);
    // const currentBlock = parseFloat(graphData.data._meta.block.number);

    if (!provider) {
      console.error("failed to connect to provider, please connect your wallet");
      return {
        // stakingTVL,
        marketPrice: marketPrice,
        marketCap: marketCap,
        circSupply: circSupply,
        totalSupply: totalSupply,
        //treasuryMarketValue,
      } as IAppData;
    }
    // Calculating staking
    const epoch = stakingContract != null ? await stakingContract.epoch() : null;
    let secondsToEpoch = 0;

    try {
      secondsToEpoch = stakingContract != null ? Number(await stakingContract.secondsToNextEpoch()) : 0;
    } catch (ee) {
      console.error("Returned a null response from stakingContract.secondsToNextEpoch()");
    }

    const stakingReward = epoch != null ? epoch.distribute : 0;
    const stakingRebase = stakedCircSupply > 0 ? (Number(stakingReward.toString()) / stakedCircSupply) : 0;
    const fiveDayRate = Math.pow(1 + stakingRebase, 5 * 3) - 1;
    // const stakingAPY = Math.pow(1 + stakingRebase, 365 * 3) - 1;
    let infos: any;
    try {
      infos = (await distribute?.info(0));
    }
    catch (ee) { infos = null; }
    let indx = 0;
    if (infos && infos.recipient.toLowerCase() != addresses[networkID].STAKING_ADDRESS.toLowerCase()) {
      indx = indx + 1;
      infos = (await distribute?.info(indx));
    }
    const inforate = infos ? Number(infos?.rate) : 0;
    // const info = infos?.find(x=>x.recipient.toLowerCase()==addresses[networkID].STAKING_ADDRESS.toLowerCase());    
    // const stakingAPY = inforate? (Math.pow(1 + (inforate/1e6)/(365 * 3), 365 * 3) - 1):"-";    
    const stakingAPY = inforate ? (Math.pow((1 + (inforate / 1e9)), 365 * 3) - 1) : "-";

    //APY = ((1+RR/N)^N)- 1

    // Current index
    const currentIndex = stakingContract != null ? await stakingContract.index() : BigNumber.from('1000000000000000000');
    return {
      currentIndex: ethers.utils.formatUnits(currentIndex, 18),
      currentBlock: currentBlock,
      fiveDayRate: fiveDayRate,
      stakingAPY: stakingAPY,
      //stakingTVL,
      stakingRebase: stakingRebase,
      marketCap: marketCap,
      marketPrice: marketPrice,
      circSupply: circSupply,
      totalSupply: totalSupply,
      //treasuryMarketValue,
      secondsToEpoch: secondsToEpoch,
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
  let marketPrice = await getTokenPrice("pana-dao");
  if (!marketPrice) {
    const usdcPriceInUSD = (await getTokenPrice("usd-coin")) || 1;
    marketPrice = (await getPanaPriceInUSDC(provider, networkID)) * usdcPriceInUSD;
  }
  return {
    marketPrice: marketPrice,
  };
});

export const getPanaPriceInUSDC = async (provider: ethers.providers.JsonRpcProvider, networkID: NetworkId): Promise<number> => {
  const pairContract = new ethers.Contract(addresses[networkID].PANA_USDC_LP as string, pairContractAbi, provider);

  const reserves = await pairContract.getReserves();
  const token0 = await pairContract.token0();
  if (token0 == addresses[networkID].PANA_ADDRESS) {
    return (reserves[1] * Math.pow(10, 12)) / reserves[0];
  }
  return reserves[0] / (reserves[1] * Math.pow(10, 12));
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
