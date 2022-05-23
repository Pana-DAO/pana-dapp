import { AnyAction, createAsyncThunk, createSelector, createSlice, ThunkDispatch } from "@reduxjs/toolkit";
import { BigNumber, ethers } from "ethers";
import { addresses, NetworkId, NETWORKS } from "src/constants";
import { prettifySeconds } from "src/helpers";
import { RootState } from "src/store";
import { BondDepository__factory, Pana__factory } from "src/typechain";
import { getBalances } from "./AccountSlice";
import { findOrLoadMarketPrice } from "./AppSlice";
import {
  IBaseAddressAsyncThunk,
  IBaseBondClaimAsyncThunk,
  IBaseBondSingleClaimAsyncThunk,
  IBondAysncThunk,
  IBondIndexAsyncThunk,
  IBondPurchaseAsyncThunk,
  IJsonRPCError,
  IValueAsyncThunk,
} from "./interfaces";
import { error, info } from "./MessagesSlice";
import { clearPendingTxn, fetchPendingTxns } from "./PendingTxnsSlice";
import { BondDetails, UnknownDetails } from "src/helpers/BondDetails";
import { PanaTokenStackProps } from "src/lib/PanaTokenStack";

const BASE_TOKEN_DECIMALS = 18;

export interface IBond extends IBondCore, IBondMeta, IBondTerms {
  index: number;
  displayName: string;
  priceUSD: number;
  priceToken: number;
  priceTokenBigNumber: BigNumber;
  discount: number;
  duration: string;
  expiration: string;
  isLP: boolean;
  lpUrl: string;
  marketPrice: number;
  soldOut: boolean;
  capacityInBaseToken: string;
  capacityInQuoteToken: string;
  maxPayoutInBaseToken: string;
  maxPayoutInQuoteToken: string;
  maxPayoutOrCapacityInQuote: string;
  maxPayoutOrCapacityInBase: string;
  bondIconSvg: PanaTokenStackProps["tokens"];
  marketPriceInToken: number
}

export interface IBondBalance {
  allowance: BigNumber;
  balance: BigNumber;
  tokenAddress: string;
}

interface IBondCore {
  quoteToken: string;
  capacityInQuote: boolean;
  capacity: BigNumber;
  totalDebt: BigNumber;
  maxPayout: BigNumber;
  purchased: BigNumber;
  sold: BigNumber;
}

interface IBondMeta {
  lastTune: number;
  lastDecay: number;
  length: number;
  depositInterval: number;
  tuneInterval: number;
  quoteDecimals: number;
}

interface IBondTerms {
  fixedTerm: boolean;
  controlVariable: ethers.BigNumber;
  vesting: number;
  conclusion: number;
  maxDebt: ethers.BigNumber;
}

interface IBondTerms {
  fixedTerm: boolean;
  controlVariable: ethers.BigNumber;
  vesting: number;
  conclusion: number;
  maxDebt: ethers.BigNumber;
}

export interface IUserNote {
  payout: number;
  created: number;
  matured: number;
  redeemed: number;
  marketID: number;
  fullyMatured: boolean;
  originalDurationSeconds: number;
  remainingDurationSeconds: number;
  originalDuration: string;
  timeLeft: string;
  claimed: boolean;
  displayName: string;
  quoteToken: string;
  bondIconSvg: PanaTokenStackProps["tokens"];
  index: number;
}

function checkNetwork(networkID: NetworkId) {
  if (networkID !== 5 && networkID !== 421611) {
    //ENABLE FOR MAINNET LAUNCH
    throw Error(`Network=${networkID} is not supported for  bonds`);
  }
}

export const changeApproval = createAsyncThunk(
  "bonds/changeApproval",
  async ({ bond, provider, networkID, address }: IBondAysncThunk, { dispatch, getState }) => {
    checkNetwork(networkID);
    const signer = provider.getSigner();
    const bondState: IBond = (getState() as RootState).bonding.bonds[bond.index];
    const tokenContractAddress: string = bondState.quoteToken;
    const tokenDecimals: number = bondState.quoteDecimals;
    const tokenContract = Pana__factory.connect(tokenContractAddress, signer);
    let approveTx: ethers.ContractTransaction | undefined;
    try {
      approveTx = await tokenContract.approve(
        addresses[networkID].BOND_DEPOSITORY,
        ethers.utils.parseUnits("10000000000000", tokenDecimals),
      );
      const text = `Approve ${bond.displayName} Bonding`;
      const pendingTxnType = `approve_${bond.displayName}_bonding`;
      if (approveTx) {
        dispatch(fetchPendingTxns({ txnHash: approveTx.hash, text, type: pendingTxnType }));

        await approveTx.wait();
        dispatch(clearPendingTxn(approveTx.hash));
      }
    } catch (e: unknown) {
      dispatch(error((e as IJsonRPCError).message));
      return;
    } finally {
      if (approveTx) {
        dispatch(getTokenBalance({ provider, networkID, address, value: tokenContractAddress }));
      }
    }
  },
);

export const purchaseBond = createAsyncThunk(
  "bonds/purchase",
  async ({ provider, address, bond, networkID, amount, maxPrice }: IBondPurchaseAsyncThunk, { dispatch }) => {
    checkNetwork(networkID);
    const signer = provider.getSigner();
    const depositoryContract = BondDepository__factory.connect(addresses[networkID].BOND_DEPOSITORY, signer);

    let depositTx: ethers.ContractTransaction | undefined;
    try {
      // DEBUG
      console.log(`amount: ${amount}`);
      console.log(`bond: ${bond.index}`);
      console.log(`maxPrice: ${maxPrice}`);
      console.log(`address: ${address}`);
      console.log(`referral: ${addresses[networkID].DAO_TREASURY}`);
      depositTx = await depositoryContract.deposit(
        bond.index,
        amount,
        maxPrice,
        address,
        addresses[networkID].DAO_TREASURY,
      );
      const text = `Purchase ${bond.displayName} Bond`;
      const pendingTxnType = `bond_${bond.displayName}`;
      if (depositTx) {
        dispatch(fetchPendingTxns({ txnHash: depositTx.hash, text, type: pendingTxnType }));
        await depositTx.wait();
        dispatch(clearPendingTxn(depositTx.hash));
      }
    } catch (e: unknown) {
      const rpcError = e as IJsonRPCError;
      if (rpcError.code === -32603 && rpcError.data.message.indexOf("Depository: zero or negative profit") >= 0) {
        dispatch(
          error("Sorry!! This Bond is not available for purchase at this time"),
        )
      } else if(rpcError.code === -32603 && rpcError.data.message.indexOf("execution reverted: TRANSFER_FROM_FAILED") >= 0) {
        dispatch(
          error("Token transfer failed. Please check if you have enough balance"),
        )
      } else {
        dispatch(error(rpcError.message));
      }
      return;
    } finally {
      if (depositTx) {
        dispatch(info("Successfully purchased bond!"));
        dispatch(getUserNotes({ provider, networkID, address }));
        dispatch(getAllBonds({ address, provider, networkID }));
      }
    }
  },
);

export const getSingleBond = createAsyncThunk(
  "bonds/getSingle",
  async ({ provider, networkID, bondIndex }: IBondIndexAsyncThunk, { dispatch }): Promise<IBond> => {
    checkNetwork(networkID);
    const depositoryContract = BondDepository__factory.connect(addresses[networkID].BOND_DEPOSITORY, provider);
    const bondCore = await depositoryContract.markets(bondIndex);
    const bondMetadata = await depositoryContract.metadata(bondIndex);
    const bondTerms = await depositoryContract.terms(bondIndex);
    return processBond(bondCore, bondMetadata, bondTerms, bondIndex, provider, networkID, dispatch);
  },
);

export const getTokenBalance = createAsyncThunk(
  "bonds/getBalance",
  async ({ provider, networkID, address, value }: IValueAsyncThunk, { }): Promise<IBondBalance> => {
    checkNetwork(networkID);
    const tokenContract = Pana__factory.connect(value, provider);
    const balance = await tokenContract.balanceOf(address);
    const allowance = await tokenContract.allowance(address, addresses[networkID].BOND_DEPOSITORY);
    return { balance, allowance, tokenAddress: value };
  },
);

async function processBond(
  bond: IBondCore,
  metadata: IBondMeta,
  terms: IBondTerms,
  index: number,
  provider: ethers.providers.JsonRpcProvider,
  networkID: NetworkId,
  dispatch: ThunkDispatch<unknown, unknown, AnyAction>,
): Promise<IBond> {
  const currentTime = Date.now() / 1000;
  const depositoryContract = BondDepository__factory.connect(addresses[networkID].BOND_DEPOSITORY, provider);
  let BondDetail: BondDetails = BondDetails[networkID][bond.quoteToken.toLowerCase()];

  if (!BondDetail) {
    BondDetail = UnknownDetails;
    console.error(`Add details for bond index=${index}`);
  }
  const marketPriceInToken = await BondDetail.pricingFunction(provider, bond.quoteToken, networkID, index);
  let bondPriceBigNumber = await depositoryContract.marketPrice(index);
  let bondPrice = +bondPriceBigNumber / Math.pow(10, BASE_TOKEN_DECIMALS);
  const panaPrice = (await dispatch(findOrLoadMarketPrice({ provider, networkID })).unwrap())?.marketPrice;

  if (marketPriceInToken < bondPrice && NETWORKS[networkID].isOracleIntegrated) {
    bondPrice = marketPriceInToken;
    bondPriceBigNumber = BigNumber.from((marketPriceInToken * Math.pow(10, BASE_TOKEN_DECIMALS)).toString());
  }
  const bondDiscount = (marketPriceInToken - bondPrice) / marketPriceInToken;

  let capacityInBaseToken: string, capacityInQuoteToken: string;
  if (bond.capacityInQuote) {
    capacityInBaseToken = ethers.utils.formatUnits(
      bond.capacity.mul(Math.pow(10, 2 * BASE_TOKEN_DECIMALS - metadata.quoteDecimals)).div(bondPriceBigNumber),
      BASE_TOKEN_DECIMALS,
    );
    capacityInQuoteToken = ethers.utils.formatUnits(bond.capacity, metadata.quoteDecimals);
  } else {
    capacityInBaseToken = ethers.utils.formatUnits(bond.capacity, BASE_TOKEN_DECIMALS);
    capacityInQuoteToken = ethers.utils.formatUnits(
      bond.capacity
        .mul(bondPriceBigNumber)
        .div(Math.pow(10, 2 * BASE_TOKEN_DECIMALS - metadata.quoteDecimals).toString()),
      metadata.quoteDecimals,
    );
  }
  const maxPayoutInBaseToken: string = ethers.utils.formatUnits(bond.maxPayout, BASE_TOKEN_DECIMALS);
  const maxPayoutInQuoteToken: string = ethers.utils.formatUnits(
    bond.maxPayout
      .mul(bondPriceBigNumber)
      .div(Math.pow(10, 2 * BASE_TOKEN_DECIMALS - metadata.quoteDecimals).toString()),
    metadata.quoteDecimals,
  );

  let seconds = 0;
  if (terms.fixedTerm) {
    const vestingTime = currentTime + terms.vesting;
    seconds = vestingTime - currentTime;
  } else {
    const conclusionTime = terms.conclusion;
    seconds = conclusionTime - currentTime;
  }
  let duration = "";
  if (seconds > 86400) {
    duration = prettifySeconds(seconds, "day");
  } else {
    duration = prettifySeconds(seconds);
  }

  // SAFETY CHECKs
  // 1. check sold out
  let soldOut = false;
  if (+capacityInBaseToken < 1 || +maxPayoutInBaseToken < 1) soldOut = true;
  const maxPayoutOrCapacityInBase =
    +capacityInBaseToken > +maxPayoutInBaseToken ? maxPayoutInBaseToken : capacityInBaseToken;
  const maxPayoutOrCapacityInQuote =
    +capacityInQuoteToken > +maxPayoutInQuoteToken ? maxPayoutInQuoteToken : capacityInQuoteToken;

  // DEBUG
  console.log(`=-=-=-=-=-=-=-=-= =-=-=-=-=-=-=-=-=-= =-=-=-=-=-=-=-=-=`);
  console.log(`=-=-=-=-=-=-=-=-= processBond index:${index} =-=-=-=-=-=-=-=-=`);
  console.log(`${index} totalDebt: ${ethers.utils.formatUnits(bond.totalDebt, BASE_TOKEN_DECIMALS)}`);
  console.log(`${index} maxPayout: ${ethers.utils.formatUnits(bond.maxPayout, BASE_TOKEN_DECIMALS)}`);
  console.log(`${index} marketPriceInToken: ${marketPriceInToken}`);
  console.log(`${index} bondPrice: ${bondPrice}`);
  console.log(`${index} bondPriceBigNumber: ${bondPriceBigNumber}`);
  console.log(`${index} panaPrice: ${panaPrice}`);
  console.log(`${index} bondDiscount: ${bondDiscount}`);
  console.log(`${index} bond.capacityInQuote: ${bond.capacityInQuote}`);
  console.log(`${index} maxPayoutInBaseToken: ${maxPayoutInBaseToken}`);
  console.log(`${index} maxPayoutInQuoteToken: ${maxPayoutInQuoteToken}`);
  console.log(`${index} BASE_TOKEN_DECIMALS: ${BASE_TOKEN_DECIMALS}`);
  console.log(`${index} metadata.quoteDecimals: ${metadata.quoteDecimals}`);
  console.log(`${index} soldOut: ${soldOut}`);
  console.log(`${index} maxPayoutOrCapacityInBase: ${maxPayoutOrCapacityInBase}`);
  console.log(`${index} maxPayoutOrCapacityInQuote: ${maxPayoutOrCapacityInQuote}`);
  console.log(`^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^`);

  return {
    ...bond,
    ...metadata,
    ...terms,
    index: index,
    displayName: `${BondDetail.name}`,
    priceUSD: bondPrice,
    priceToken: bondPrice,
    marketPriceInToken: marketPriceInToken,
    priceTokenBigNumber: bondPriceBigNumber,
    discount: bondDiscount,
    expiration: new Date(terms.vesting * 1000).toDateString(),
    duration,
    isLP: BondDetail.isLP,
    lpUrl: BondDetail.isLP ? BondDetail.lpUrl[networkID] : "",
    marketPrice: panaPrice,
    quoteToken: bond.quoteToken.toLowerCase(),
    maxPayoutInQuoteToken,
    maxPayoutInBaseToken,
    capacityInQuoteToken,
    capacityInBaseToken,
    soldOut,
    maxPayoutOrCapacityInQuote,
    maxPayoutOrCapacityInBase,
    bondIconSvg: BondDetail.panaIconSvg,
  };
}

export const getAllBonds = createAsyncThunk(
  "bonds/getAll",
  async ({ provider, networkID, address }: IBaseAddressAsyncThunk, { dispatch }) => {
    checkNetwork(networkID);
    const depositoryContract = BondDepository__factory.connect(addresses[networkID].BOND_DEPOSITORY, provider);
    const liveBondIndexes = await depositoryContract.liveMarkets();
    // `markets()` returns quote/price data
    const liveBondPromises = liveBondIndexes.map(async index => await depositoryContract.markets(index));
    const liveBondMetadataPromises = liveBondIndexes.map(async index => await depositoryContract.metadata(index));
    const liveBondTermsPromises = liveBondIndexes.map(async index => await depositoryContract.terms(index));
    const liveBonds: IBond[] = [];

    for (let i = 0; i < liveBondIndexes.length; i++) {
      const bondIndex = +liveBondIndexes[i];
      try {
        const bond: IBondCore = await liveBondPromises[i];
        const bondMetadata: IBondMeta = await liveBondMetadataPromises[i];
        const bondTerms: IBondTerms = await liveBondTermsPromises[i];
        const finalBond = await processBond(bond, bondMetadata, bondTerms, bondIndex, provider, networkID, dispatch);
        liveBonds.push(finalBond);

        if (address) {
          dispatch(getTokenBalance({ provider, networkID, address, value: finalBond.quoteToken }));
        }
      } catch (e) {
        console.log("getAllBonds Error for Bond Index: ", bondIndex);
        console.log(e);
      }
    }
    return liveBonds;
  },
);

export const getUserNotes = createAsyncThunk(
  "bonds/notes",
  async ({ provider, networkID, address }: IBaseAddressAsyncThunk, { }): Promise<IUserNote[]> => {
    checkNetwork(networkID);
    const currentTime = Date.now() / 1000;
    const depositoryContract = BondDepository__factory.connect(addresses[networkID].BOND_DEPOSITORY, provider);
    const userNoteIndexes = await depositoryContract.indexesFor(address);
    const userNotePromises = userNoteIndexes.map(async index => await depositoryContract.notes(address, index));
    const userNotes: {
      payout: ethers.BigNumber;
      created: number;
      matured: number;
      redeemed: number;
      marketID: number;
    }[] = await Promise.all(userNotePromises);
    const bonds = await Promise.all(
      Array.from(new Set(userNotes.map(note => note.marketID))).map(async id => {
        const bond = await depositoryContract.markets(id);
        const bondDetail = BondDetails[networkID][bond.quoteToken.toLowerCase()];
        return { index: id, quoteToken: bond.quoteToken, ...bondDetail };
      }),
    ).then(result => Object.fromEntries(result.map(bond => [bond.index, bond])));
    const notes: IUserNote[] = [];
    for (let i = 0; i < userNotes.length; i++) {
      const rawNote: {
        payout: ethers.BigNumber;
        created: number;
        matured: number;
        redeemed: number;
        marketID: number;
      } = userNotes[i];
      const bond = bonds[rawNote.marketID];
      const originalDurationSeconds = Math.max(rawNote.matured - rawNote.created, 0);
      const seconds = Math.max(rawNote.matured - currentTime, 0);
      let duration = "";
      if (seconds > 86400) {
        duration = prettifySeconds(seconds, "day");
      } else if (seconds > 0) {
        duration = prettifySeconds(seconds);
      } else {
        duration = "Fully Vested";
      }
      let originalDuration = "";
      if (originalDurationSeconds > 86400) {
        originalDuration = prettifySeconds(originalDurationSeconds, "day");
      } else {
        originalDuration = prettifySeconds(originalDurationSeconds);
      }
      const note: IUserNote = {
        ...rawNote,
        payout: +rawNote.payout / Math.pow(10, 18), //Always in KARSHA
        fullyMatured: seconds == 0,
        claimed: rawNote.matured == rawNote.redeemed,
        originalDurationSeconds: originalDurationSeconds,
        remainingDurationSeconds: seconds,
        originalDuration: originalDuration,
        timeLeft: duration,
        displayName: bond?.name,
        quoteToken: bond.quoteToken.toLowerCase(),
        index: +userNoteIndexes[i],
        bondIconSvg: bond?.panaIconSvg,
      };
      notes.push(note);
    }
    return notes;
  },
);

export const getUserOldNotes = createAsyncThunk(
  "bonds/oldNotes",
  async ({ provider, networkID, address }: IBaseAddressAsyncThunk, { }): Promise<IUserNote[]> => {
    checkNetwork(networkID);
    const currentTime = Date.now() / 1000;
    const depositoryContract = BondDepository__factory.connect(addresses[networkID].BOND_DEPOSITORY_OLD, provider);
    const userNoteIndexes = await depositoryContract.indexesFor(address);
    const userNotePromises = userNoteIndexes.map(async index => await depositoryContract.notes(address, index));
    const userNotes: {
      payout: ethers.BigNumber;
      created: number;
      matured: number;
      redeemed: number;
      marketID: number;
    }[] = await Promise.all(userNotePromises);
    const bonds = await Promise.all(
      Array.from(new Set(userNotes.map(note => note.marketID))).map(async id => {
        const bond = await depositoryContract.markets(id);
        const bondDetail = BondDetails[networkID][bond.quoteToken.toLowerCase()];
        return { index: id, quoteToken: bond.quoteToken, ...bondDetail };
      }),
    ).then(result => Object.fromEntries(result.map(bond => [bond.index, bond])));
    const notes: IUserNote[] = [];
    for (let i = 0; i < userNotes.length; i++) {
      const rawNote: {
        payout: ethers.BigNumber;
        created: number;
        matured: number;
        redeemed: number;
        marketID: number;
      } = userNotes[i];
      const bond = bonds[rawNote.marketID];
      const originalDurationSeconds = Math.max(rawNote.matured - rawNote.created, 0);
      const seconds = Math.max(rawNote.matured - currentTime, 0);
      let duration = "";
      if (seconds > 86400) {
        duration = prettifySeconds(seconds, "day");
      } else if (seconds > 0) {
        duration = prettifySeconds(seconds);
      } else {
        duration = "Fully Vested";
      }
      let originalDuration = "";
      if (originalDurationSeconds > 86400) {
        originalDuration = prettifySeconds(originalDurationSeconds, "day");
      } else {
        originalDuration = prettifySeconds(originalDurationSeconds);
      }
      const note: IUserNote = {
        ...rawNote,
        payout: +rawNote.payout / Math.pow(10, 18), //Always in KARSHA
        fullyMatured: seconds == 0,
        claimed: rawNote.matured == rawNote.redeemed,
        originalDurationSeconds: originalDurationSeconds,
        remainingDurationSeconds: seconds,
        originalDuration: originalDuration,
        timeLeft: duration,
        displayName: bond?.name,
        quoteToken: bond.quoteToken.toLowerCase(),
        index: +userNoteIndexes[i],
        bondIconSvg: bond?.panaIconSvg,
      };
      notes.push(note);
    }
    return notes;
  },
);

export const claimAllNotes = createAsyncThunk(
  "bonds/claimAll",
  async ({ provider, networkID, address }: IBaseBondClaimAsyncThunk, { dispatch }) => {
    const signer = provider.getSigner();
    const depositoryContract = BondDepository__factory.connect(addresses[networkID].BOND_DEPOSITORY, signer);

    let claimTx: ethers.ContractTransaction | undefined;
    try {
      claimTx = await depositoryContract.redeemAll(address);
      const text = `Claim All Bonds`;
      const pendingTxnType = `redeem_all_notes`;
      if (claimTx) {
        dispatch(fetchPendingTxns({ txnHash: claimTx.hash, text, type: pendingTxnType }));

        await claimTx.wait();
        dispatch(clearPendingTxn(claimTx.hash));
      }
    } catch (e: unknown) {
      dispatch(error((e as IJsonRPCError).message));
      return;
    } finally {
      if (claimTx) {
        dispatch(getUserNotes({ address, provider, networkID }));
        dispatch(getBalances({ address, networkID, provider }));
      }
    }
  },
);

export const claimAllOldNotes = createAsyncThunk(
  "bonds/claimAllOld",
  async ({ provider, networkID, address }: IBaseBondClaimAsyncThunk, { dispatch }) => {
    const signer = provider.getSigner();
    const depositoryContract = BondDepository__factory.connect(addresses[networkID].BOND_DEPOSITORY_OLD, signer);

    let claimTx: ethers.ContractTransaction | undefined;
    try {
      claimTx = await depositoryContract.redeemAll(address);
      const text = `Claim All Old Bonds`;
      const pendingTxnType = `redeem_all_old_notes`;
      if (claimTx) {
        dispatch(fetchPendingTxns({ txnHash: claimTx.hash, text, type: pendingTxnType }));

        await claimTx.wait();
        dispatch(clearPendingTxn(claimTx.hash));
      }
    } catch (e: unknown) {
      dispatch(error((e as IJsonRPCError).message));
      return;
    } finally {
      if (claimTx) {
        dispatch(getUserOldNotes({ address, provider, networkID }));
        dispatch(getBalances({ address, networkID, provider }));
      }
    }
  },
);

export const claimSingleNote = createAsyncThunk(
  "bonds/claimSingle",
  async ({ provider, networkID, address, indexes }: IBaseBondSingleClaimAsyncThunk, { dispatch }) => {
    const signer = provider.getSigner();
    const depositoryContract = BondDepository__factory.connect(addresses[networkID].BOND_DEPOSITORY, signer);

    let claimTx: ethers.ContractTransaction | undefined;
    try {
      claimTx = await depositoryContract.redeem(address, indexes);
      const text = `Redeem Note Index=${indexes}`;
      if (claimTx) {
        for (let i = 0; i < indexes.length; i++) {
          const pendingTxnType = `redeem_note_${indexes[i]}`;
          dispatch(fetchPendingTxns({ txnHash: claimTx.hash, text, type: pendingTxnType }));
        }

        await claimTx.wait();
        dispatch(clearPendingTxn(claimTx.hash));
      }
    } catch (e: unknown) {
      dispatch(error((e as IJsonRPCError).message));
      return;
    } finally {
      if (claimTx) {
        dispatch(getUserNotes({ address, provider, networkID }));
        dispatch(getBalances({ address, networkID, provider }));
      }
    }
  },
);
// Note(zx): this is a barebones interface for the state. Update to be more accurate
interface IBondSlice {
  loading: boolean;
  balanceLoading: { [key: string]: boolean };
  notesLoading: boolean;
  oldNotesLoading: boolean;
  indexes: number[];
  balances: { [key: string]: IBondBalance };
  bonds: { [key: string]: IBond };
  notes: IUserNote[];
  oldNotes: IUserNote[];
}

const initialState: IBondSlice = {
  loading: false,
  balanceLoading: {},
  notesLoading: false,
  oldNotesLoading: false,
  indexes: [],
  balances: {},
  bonds: {},
  notes: [],
  oldNotes: []
};

const bondingSlice = createSlice({
  name: "bonds",
  initialState,
  reducers: {
    fetchBondSuccess(state, action) {
      state.bonds[action.payload.bond] = action.payload;
    },
  },

  extraReducers: builder => {
    builder
      .addCase(getAllBonds.pending, state => {
        state.loading = true;
      })
      .addCase(getAllBonds.fulfilled, (state, action) => {
        state.indexes = [];
        state.bonds = {};
        action.payload.forEach(bond => {
          state.bonds[bond.index] = bond;
          state.indexes.push(bond.index);
        });
        state.loading = false;
      })
      .addCase(getAllBonds.rejected, (state, { error }) => {
        state.indexes = [];
        state.bonds = {};
        state.loading = false;
        console.error(error.message);
      })
      .addCase(getTokenBalance.pending, (state, action) => {
        state.balanceLoading[action.meta.arg.value] = true;
      })
      .addCase(getTokenBalance.fulfilled, (state, action) => {
        state.balances[action.payload.tokenAddress] = action.payload;
        state.balanceLoading[action.meta.arg.value] = false;
      })
      .addCase(getTokenBalance.rejected, (state, { error, meta }) => {
        state.balanceLoading[meta.arg.value] = false;
        console.error(error.message);
      })
      .addCase(getUserNotes.pending, state => {
        state.notesLoading = true;
      })
      .addCase(getUserNotes.fulfilled, (state, action) => {
        state.notes = action.payload;
        state.notesLoading = false;
      })
      .addCase(getUserNotes.rejected, (state, { error }) => {
        state.notes = [];
        state.notesLoading = false;
        console.error(`Error when getting user notes: ${error.message}`);
      })
      .addCase(getUserOldNotes.pending, state => {
        state.oldNotesLoading = true;
      })
      .addCase(getUserOldNotes.fulfilled, (state, action) => {
        state.oldNotes = action.payload;
        state.oldNotesLoading = false;
      })
      .addCase(getUserOldNotes.rejected, (state, { error }) => {
        state.oldNotes = [];
        state.oldNotesLoading = false;
        console.error(`Error when getting user old notes: ${error.message}`);
      });
  },
});

export const bondingReducer = bondingSlice.reducer;

export const { fetchBondSuccess } = bondingSlice.actions;

const baseInfo = (state: RootState) => state.bonding;

export const getBondingState = createSelector(baseInfo, bonding => bonding);
