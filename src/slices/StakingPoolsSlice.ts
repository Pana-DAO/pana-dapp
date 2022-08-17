import { createAsyncThunk, createSelector, createSlice } from "@reduxjs/toolkit";
import { BigNumber, ethers } from "ethers";
import { addresses, NetworkId } from "src/constants";
import { RootState } from "src/store";
import { IERC20__factory, StakingPools__factory } from "src/typechain";
import { IBaseAddressAsyncThunk, IJsonRPCError, IStakeAssetAsyncThunk, IValueAsyncThunk } from "./interfaces";
import { abi as Erc20Abi } from "../abi/IERC20.json";
import { clearPendingTxn, fetchPendingTxns } from "./PendingTxnsSlice";
import { error, info } from "./MessagesSlice";
import { getBalances } from "./AccountSlice";

interface IStakingPoolsSlice {
  loading: boolean;
  balanceLoading: { [key: string]: boolean };
  userPoolBalance: BigNumber[];
  pendingPanaForUser: BigNumber[];
  assetAllowance: { [key: string]: BigNumber };
  assetBalance: { [key: string]: BigNumber };
}

const initialState: IStakingPoolsSlice = {
  loading: false,
  balanceLoading: {},
  userPoolBalance: [],
  pendingPanaForUser: [],
  assetAllowance: {},
  assetBalance: {},
};

function checkNetwork(networkID: NetworkId) {
  if (networkID !== 421611 && networkID !== 42161) {
    //ENABLE FOR MAINNET LAUNCH
    throw Error(`Network=${networkID} is not supported`);
  }
}

export async function getErc20TokenBalance(token: string, provider: any, networkID: NetworkId): Promise<BigNumber> {
  try {
    const account = addresses[networkID].STAKING_POOLS;
    const contract = new ethers.Contract(token, Erc20Abi, provider);
    const result = await contract.balanceOf(account);
    return result as BigNumber;
  } catch (error) {
    console.error("getErc20TokenBalance", error);
  }
  return ethers.constants.Zero;
}

export const getUserPoolBalance = createAsyncThunk(
  "stakingpools/getUserPoolBalance",
  async ({ provider, networkID, address }: IBaseAddressAsyncThunk, { dispatch }) => {
    checkNetwork(networkID);
    const depositoryContract = StakingPools__factory.connect(addresses[networkID].STAKING_POOLS, provider);
    const userPoolBalances = await depositoryContract.poolBalances(address);
    return userPoolBalances;
  },
);

export const getUserPendingPana = createAsyncThunk(
  "stakingpools/getUserPendingPana",
  async ({ provider, networkID, address }: IBaseAddressAsyncThunk, { dispatch }) => {
    checkNetwork(networkID);
    const depositoryContract = StakingPools__factory.connect(addresses[networkID].STAKING_POOLS, provider);
    const pendingPanaForUser = await depositoryContract.pendingPanaForUser(address);
    return pendingPanaForUser;
  },
);

export const getAssetAllowance = createAsyncThunk(
  "stakingpools/getAssetAllowance",
  async ({ provider, networkID, address, value }: IValueAsyncThunk, { dispatch }) => {
    checkNetwork(networkID);
    const assetContract = IERC20__factory.connect(value, provider);
    const assetAllowance = await assetContract.allowance(address, addresses[networkID].STAKING_POOLS);
    return {
      value,
      assetAllowance,
    };
  },
);

export const getAssetBalance = createAsyncThunk(
  "stakingpools/getAssetBalance",
  async ({ provider, networkID, address, value }: IValueAsyncThunk, { dispatch }) => {
    checkNetwork(networkID);
    const assetContract = IERC20__factory.connect(value, provider);
    const assetBalance = await assetContract.balanceOf(address);
    return {
      value,
      assetBalance,
    };
  },
);

export const changeAssetApproval = createAsyncThunk(
  "stakingpools/changeAssetApproval",
  async ({ provider, networkID, address, value }: IValueAsyncThunk, { dispatch }) => {
    checkNetwork(networkID);
    const signer = provider.getSigner();
    const assetContract = IERC20__factory.connect(value, signer);
    const tokenDecimals = await assetContract.decimals();

    let approveTx: ethers.ContractTransaction | undefined;
    try {
      approveTx = await assetContract.approve(
        addresses[networkID].STAKING_POOLS,
        ethers.utils.parseUnits("10000000000000", tokenDecimals),
      );
      const text = `Approve Staking`;
      const pendingTxnType = `approve_${value}_farming`;
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
        dispatch(getAssetAllowance({ networkID, address, provider, value }));
      }
    }
  },
);

export const onStakeAssets = createAsyncThunk(
    "stakingpools/onStakeAssets",
    async ({ provider, networkID, address, farm, amount }: IStakeAssetAsyncThunk, { dispatch }) => {
        checkNetwork(networkID);
        const signer = provider.getSigner();
        const stakingPoolsContract = StakingPools__factory.connect(addresses[networkID].STAKING_POOLS, signer);

        let depositTx: ethers.ContractTransaction | undefined;
        try {
            depositTx = await stakingPoolsContract.deposit(farm.pid, amount)
            const text = `Depositing Asset`;
            const pendingTxnType = `farm_${farm.index}`;
            if (depositTx) {
                dispatch(fetchPendingTxns({ txnHash: depositTx.hash, text, type: pendingTxnType }));
                await depositTx.wait();
                dispatch(clearPendingTxn(depositTx.hash));
            }
        } catch (e: unknown) {
            dispatch(error((e as IJsonRPCError).message));
            return;
        } finally {
            if (depositTx) {
                dispatch(info("Successfully Staked your " + farm.symbol));
                dispatch(getAssetBalance({ networkID, address, provider, value: farm.address }));
                dispatch(getUserPoolBalance({ networkID, address, provider }));
                dispatch(getUserPendingPana({ networkID, address, provider }));
                await dispatch(getBalances({ address, networkID, provider }));
            }
        }

    let depositTx: ethers.ContractTransaction | undefined;
    try {
      depositTx = await stakingPoolsContract.deposit(farm.pid, amount);
      const text = `Depositing Asset`;
      const pendingTxnType = `farm_${farm.index}`;
      if (depositTx) {
        dispatch(fetchPendingTxns({ txnHash: depositTx.hash, text, type: pendingTxnType }));
        await depositTx.wait();
        dispatch(clearPendingTxn(depositTx.hash));
      }
    } catch (e: unknown) {
      dispatch(error((e as IJsonRPCError).message));
      return;
    } finally {
      if (depositTx) {
        dispatch(info("Successfully Staked your " + farm.symbol));
        dispatch(getAssetBalance({ networkID, address, provider, value: farm.address }));
        dispatch(getUserPoolBalance({ networkID, address, provider }));
        dispatch(getUserPendingPana({ networkID, address, provider }));
      }
    }
  },
);

export const onUnstakeAssets = createAsyncThunk(
    "stakingpools/onUnstakeAssets",
    async ({ provider, networkID, address, farm, amount }: IStakeAssetAsyncThunk, { dispatch }) => {
        checkNetwork(networkID);
        const signer = provider.getSigner();
        const stakingPoolsContract = StakingPools__factory.connect(addresses[networkID].STAKING_POOLS, signer);

        let withdrawTx: ethers.ContractTransaction | undefined;
        try {
            withdrawTx = await stakingPoolsContract.withdraw(farm.pid, amount)
            const text = `Withdrawing Asset`;
            const pendingTxnType = `farm_${farm.index}`;
            if (withdrawTx) {
                dispatch(fetchPendingTxns({ txnHash: withdrawTx.hash, text, type: pendingTxnType }));
                await withdrawTx.wait();
                dispatch(clearPendingTxn(withdrawTx.hash));
            }
        } catch (e: unknown) {
            dispatch(error((e as IJsonRPCError).message));
            return;
        } finally {
            if (withdrawTx) {
                dispatch(info("Successfully Withdrawn your " + farm.symbol));
                dispatch(getAssetBalance({ networkID, address, provider, value: farm.address }));
                dispatch(getUserPoolBalance({ networkID, address, provider }));
                dispatch(getUserPendingPana({ networkID, address, provider }));
                await dispatch(getBalances({ address, networkID, provider }));
            }
        }

    let withdrawTx: ethers.ContractTransaction | undefined;
    try {
      withdrawTx = await stakingPoolsContract.withdraw(farm.pid, amount);
      const text = `Withdrawing Asset`;
      const pendingTxnType = `farm_${farm.index}`;
      if (withdrawTx) {
        dispatch(fetchPendingTxns({ txnHash: withdrawTx.hash, text, type: pendingTxnType }));
        await withdrawTx.wait();
        dispatch(clearPendingTxn(withdrawTx.hash));
      }
    } catch (e: unknown) {
      dispatch(error((e as IJsonRPCError).message));
      return;
    } finally {
      if (withdrawTx) {
        dispatch(info("Successfully Withdrawn your " + farm.symbol));
        dispatch(getAssetBalance({ networkID, address, provider, value: farm.address }));
        dispatch(getUserPoolBalance({ networkID, address, provider }));
        dispatch(getUserPendingPana({ networkID, address, provider }));
      }
    }
  },
);

export const onHarvestAll = createAsyncThunk(
  "stakingpools/onHarvestAll",
  async ({ provider, networkID, address }: IBaseAddressAsyncThunk, { dispatch }) => {
    checkNetwork(networkID);
    const signer = provider.getSigner();
    const stakingPoolsContract = StakingPools__factory.connect(addresses[networkID].STAKING_POOLS, signer);

    let harvestAllTx: ethers.ContractTransaction | undefined;
    try {
      harvestAllTx = await stakingPoolsContract.harvestAll();
      const text = `Harvesting All Farms`;
      const pendingTxnType = `farm_harvestAll`;
      if (harvestAllTx) {
        dispatch(fetchPendingTxns({ txnHash: harvestAllTx.hash, text, type: pendingTxnType }));
        await harvestAllTx.wait();
        dispatch(clearPendingTxn(harvestAllTx.hash));
      }
    } catch (e: unknown) {
      dispatch(error((e as IJsonRPCError).message));
      return;
    } finally {
      if (harvestAllTx) {
        dispatch(info("Successfully harvested all your farms!"));
        dispatch(getUserPoolBalance({ networkID, address, provider }));
        dispatch(getUserPendingPana({ networkID, address, provider }));
        await dispatch(getBalances({ address, networkID, provider }));
      }
    }
  },
);

const stakingPoolsSlice = createSlice({
  name: "stakingPools",
  initialState,
  reducers: {
    fetchPoolBalances(state, action) {
      state.userPoolBalance = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getUserPoolBalance.pending, state => {
        state.loading = true;
      })
      .addCase(getUserPoolBalance.rejected, state => {
        state.loading = false;
        state.userPoolBalance = [];
      })
      .addCase(getUserPoolBalance.fulfilled, (state, action) => {
        state.loading = false;
        state.userPoolBalance = action.payload;
      })
      .addCase(getUserPendingPana.pending, state => {
        state.loading = true;
      })
      .addCase(getUserPendingPana.rejected, state => {
        state.loading = false;
        state.pendingPanaForUser = [];
      })
      .addCase(getUserPendingPana.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingPanaForUser = action.payload;
      })
      .addCase(getAssetAllowance.fulfilled, (state, action) => {
        state.assetAllowance[action.payload.value] = action.payload.assetAllowance;
      })
      .addCase(getAssetBalance.fulfilled, (state, action) => {
        state.assetBalance[action.payload.value] = action.payload.assetBalance;
      });
  },
});

export const stakingPoolsReducer = stakingPoolsSlice.reducer;

const baseInfo = (state: RootState) => state.stakingPools;

export const getStakingPoolsState = createSelector(baseInfo, stakingPools => stakingPools);
