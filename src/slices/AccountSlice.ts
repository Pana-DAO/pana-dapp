import { createAsyncThunk, createSelector, createSlice } from "@reduxjs/toolkit";
import { BigNumber, ethers } from "ethers";
import { RootState } from "src/store";
import { DAI, Karsha, Pana, PPanaRedeem__factory, PPanaRedeem } from "src/typechain";
import { prettifySeconds } from "src/helpers";
import { abi as daiAbi } from "../abi/DAI.json";
import { abi as karshaAbi } from "../abi/Karsha.json";
import { abi as panaAbi } from "../abi/Pana.json";
import { abi as pPanaAbi } from "../abi/pPana.json";
import { abi as pPanaRedeemAbi } from "../abi/pPanaRedeem.json";
import { addresses } from "../constants";
import { handleContractError, setAll } from "../helpers";
import { IBaseAddressAsyncThunk } from "./interfaces";

interface IUserBalances {
  balances: {
    karsha: string;
    pana: string;
    usdc: string;
    pPana: string;
    redeemablePpana: string;
  };
}

interface IUserPPanaTermsCore {
  supplyBased: boolean;
  percent: BigNumber;
  max: BigNumber;
  lockDuration: BigNumber;
  exercised: BigNumber;
  locked: BigNumber;
  lockExpiry: BigNumber;
  active: boolean;
}

interface IUserPPanaTerms {
  pPanaTerms: {
    supplyBased?: boolean;
    percent?: number;
    max?: string;
    lockDuration?: number;
    exercised?: number;
    locked?: number;
    timeLeft?: string;
    active?: boolean;
  };
}

interface IUserRecipientInfo {
  totalDebt: string;
  carry: string;
  agnosticAmount: string;
  indexAtLastChange: string;
}

export const getBalances = createAsyncThunk(
  "account/getBalances",
  async ({ address, networkID, provider }: IBaseAddressAsyncThunk): Promise<IUserBalances> => {
    let karshaBalance = BigNumber.from("0");
    let panaBalance = BigNumber.from("0");
    let usdcBalance = BigNumber.from("0");
    // let pPanaBalance = BigNumber.from("0");

    try {
      const karshaContract = new ethers.Contract(
        addresses[networkID].KARSHA_ADDRESS as string,
        karshaAbi,
        provider,
      ) as Karsha;
      karshaBalance = await karshaContract.balanceOf(address);
    } catch (e) {
      handleContractError(e);
    }
    try {
      const panaContract = new ethers.Contract(addresses[networkID].PANA_ADDRESS as string, panaAbi, provider) as Pana;
      panaBalance = await panaContract.balanceOf(address);
    } catch (e) {
      handleContractError(e);
    }
    try {
      const usdcContract = new ethers.Contract(addresses[networkID].USDC_ADDRESS as string, daiAbi, provider) as DAI;
      usdcBalance = await usdcContract.balanceOf(address);
    } catch (e) {
      handleContractError(e);
    }

    // try {
    //   const pPanaContract = new ethers.Contract(
    //     addresses[networkID].PPANA_ADDRESS as string,
    //     pPanaAbi,
    //     provider,
    //   ) as Pana;
    //   pPanaBalance = await pPanaContract.balanceOf(address);
    // } catch (e) {
    //   handleContractError(e);
    // }
    

    return {
      balances: {
        karsha: ethers.utils.formatUnits(karshaBalance, 18),
        pana: ethers.utils.formatUnits(panaBalance, 18),
        usdc: ethers.utils.formatUnits(usdcBalance, 6),
        pPana: BigNumber.from("0"),//ethers.utils.formatUnits(pPanaBalance, 18),
        redeemablePpana: ethers.utils.formatUnits(0, 18),
      },
    };
  },
);

export const getPPanaRedeemableFor = createAsyncThunk(
  "account/getPPanaRedeemableFor",
  async ({ address, networkID, provider }: IBaseAddressAsyncThunk): Promise<BigNumber> => {
    
    let redeemablePpanaBalance = BigNumber.from("0");

    try {
      const pPanaRedeemContract = new ethers.Contract(
        addresses[networkID].PPANA_REDEEM_ADDRESS as string,
        pPanaRedeemAbi,
        provider,
      ) as PPanaRedeem;
      redeemablePpanaBalance = await pPanaRedeemContract.redeemableFor(address);
    } catch (e) {
      handleContractError(e);
    }

    return redeemablePpanaBalance;
  }
);

export const getPPanaTerms = createAsyncThunk(
  "account/getPPanaTerms",
  async ({ address, networkID, provider }: IBaseAddressAsyncThunk, { dispatch }): Promise<IUserPPanaTerms | undefined> => {
    let terms;

    try {
      const signer = provider.getSigner();
      const pPanaRedeem = PPanaRedeem__factory.connect(addresses[networkID].PPANA_REDEEM_ADDRESS, signer);
      terms = (await pPanaRedeem.terms(address)) as IUserPPanaTermsCore;
    } catch (e) {
      handleContractError(e);
    }

    if (terms && terms.active) {
      // await dispatch(getPPanaRedeemableFor({ address, networkID, provider }));

      const currentTime = Date.now() / 1000;
      let duration = "";
      const seconds = +BigNumber.from(terms.lockExpiry) - currentTime;
      if (seconds > 0) {
        duration = prettifySeconds(seconds);
      } else {
        duration = "Fully Vested";
      }

      return {
        pPanaTerms: {
          supplyBased: terms?.supplyBased,
          percent: BigNumber.from(terms?.percent).toNumber(),
          max: BigNumber.from(terms?.max).toString(),
          lockDuration: BigNumber.from(terms?.lockDuration).toNumber(),
          exercised: +BigNumber.from(terms?.exercised.toString()).div(Math.pow(10, 18).toString()),
          locked: +BigNumber.from(terms?.locked.toString()).div(Math.pow(10, 18).toString()),
          timeLeft: duration,
          active: terms?.active,
        },
      };
    } else {
      return undefined;
    }
  },
);

interface IUserAccountDetails {
  staking: {
    panaStake: number;
    panaUnstake: number;
  };

  redeem: {
    pPanaRedeem: number;
    pPanaDAI: number;
  };
}

export const loadAccountDetails = createAsyncThunk(
  "account/loadAccountDetails",
  async ({ networkID, provider, address }: IBaseAddressAsyncThunk, { dispatch }) => {
    let stakeAllowance = BigNumber.from("0");
    let exchangeAllowance = BigNumber.from("0");
    let pPanaRedeemAllowance = BigNumber.from("0");
    let pPanaDAIAllowance = BigNumber.from("0");

    try {
      const panaContract = new ethers.Contract(addresses[networkID].PANA_ADDRESS as string, panaAbi, provider) as Pana;
      stakeAllowance = await panaContract.allowance(address, addresses[networkID].STAKING_ADDRESS);

      const karshaContract = new ethers.Contract(
        addresses[networkID].KARSHA_ADDRESS as string,
        karshaAbi,
        provider,
      ) as Karsha;
      exchangeAllowance = await karshaContract.allowance(address, addresses[networkID].STAKING_ADDRESS);
    } catch (e) {
      handleContractError(e);
    }

    try {
      const pPanaContract = new ethers.Contract(
        addresses[networkID].PPANA_ADDRESS as string,
        pPanaAbi,
        provider,
      ) as Pana;
      pPanaRedeemAllowance = await pPanaContract.allowance(address, addresses[networkID].PPANA_REDEEM_ADDRESS);
    } catch (e) {
      handleContractError(e);
    }

    try {
      const usdcContract = new ethers.Contract(addresses[networkID].DAI_ADDRESS as string, daiAbi, provider) as DAI;
      pPanaDAIAllowance = await usdcContract.allowance(address, addresses[networkID].PPANA_REDEEM_ADDRESS);
    } catch (e) {
      handleContractError(e);
    }

    await dispatch(getBalances({ address, networkID, provider }));
    await dispatch(getPPanaTerms({ address, networkID, provider }));

    return {
      staking: {
        panaStake: +stakeAllowance,
        panaUnstake: +exchangeAllowance,
      },
      redeem: {
        pPanaRedeem: +pPanaRedeemAllowance,
        pPanaDAI: +pPanaDAIAllowance,
      },
    };
  },
);

export interface IUserBondDetails {
  // bond: string;
  readonly bond: string;
  readonly balance: string;
  readonly displayName: string;
  readonly allowance: number;
  readonly interestDue: number;
  readonly bondMaturationBlock: number;
  readonly pendingPayout: string; //Payout formatted in gwei.  
}

export interface IAccountSlice extends IUserAccountDetails, IUserBalances {
  redeeming: { karshaRedeemable: string; recipientInfo: IUserRecipientInfo };
  bonds: { [key: string]: IUserBondDetails };
  balances: {
    karsha: string;
    pana: string;
    usdc: string;
    pPana: string;
    redeemablePpana: string;
  };
  loading: boolean;
  staking: {
    panaStake: number;
    panaUnstake: number;
  };
  redeem: {
    pPanaRedeem: number;
    pPanaDAI: number;
  };
  pPanaTerms?: {
    supplyBased?: boolean;
    percent?: number;
    max?: string;
    lockDuration?: number;
    exercised?: number;
    locked?: number;
    timeLeft?: string;
    active?: boolean;
  };
}

const initialState: IAccountSlice = {
  loading: false,
  bonds: {},
  balances: {
    karsha: "",
    pana: "",
    usdc: "",
    pPana: "",
    redeemablePpana: "",
  },
  redeeming: {
    karshaRedeemable: "",
    recipientInfo: {
      totalDebt: "",
      carry: "",
      agnosticAmount: "",
      indexAtLastChange: "",
    },
  },
  staking: { panaStake: 0, panaUnstake: 0 },
  redeem: { pPanaRedeem: 0, pPanaDAI: 0 },
  pPanaTerms: undefined,
};

const accountSlice = createSlice({
  name: "account",
  initialState,
  reducers: {
    fetchAccountSuccess(state, action) {
      setAll(state, action.payload);
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loadAccountDetails.pending, state => {
        state.loading = true;
      })
      .addCase(loadAccountDetails.fulfilled, (state, action) => {
        setAll(state, action.payload);
        state.loading = false;
      })
      .addCase(loadAccountDetails.rejected, (state, { error }) => {
        state.loading = false;
        console.log(error);
      })
      .addCase(getBalances.pending, state => {
        state.loading = true;
      })
      .addCase(getBalances.fulfilled, (state, action) => {
        setAll(state, action.payload);
        state.loading = false;
      })
      .addCase(getBalances.rejected, (state, { error }) => {
        state.loading = false;
        console.log(error);
      })
      // .addCase(getPPanaTerms.pending, state => {
      //   state.loading = true;
      // })
      // .addCase(getPPanaTerms.fulfilled, (state, action) => {
      //   setAll(state, action.payload);
      //   state.loading = false;
      // })
      // .addCase(getPPanaTerms.rejected, (state, { error }) => {
      //   state.loading = false;
      //   console.log(error);
      // })
      // .addCase(getPPanaRedeemableFor.fulfilled, (state, action) => {
      //   state.balances.redeemablePpana = ethers.utils.formatUnits(action.payload, 18);
      // });
    // .addCase(calculateUserBondDetails.pending, state => {
    //   state.loading = true;
    // })
    // .addCase(calculateUserBondDetails.fulfilled, (state, action) => {
    //   if (!action.payload) return;
    //   const bond = action.payload.bond;
    //   state.bonds[bond] = action.payload;
    //   state.loading = false;
    // })
    // .addCase(calculateUserBondDetails.rejected, (state, { error }) => {
    //   state.loading = false;
    //   console.log(error);
    // });
  },
});

export default accountSlice.reducer;

export const { fetchAccountSuccess } = accountSlice.actions;

const baseInfo = (state: RootState) => state.account;

export const getAccountState = createSelector(baseInfo, account => account);
