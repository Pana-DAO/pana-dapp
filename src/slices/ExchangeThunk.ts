import { createAsyncThunk } from "@reduxjs/toolkit";
import { BigNumber, ethers } from "ethers";
import ReactGA from "react-ga";
import { Karsha, Pana, Staking__factory, PPanaRedeem__factory, USDC } from "src/typechain";
import { abi as usdcABI } from "../abi/USDC.json";
import { abi as karshaABI } from "../abi/Karsha.json";
import { abi as panaABI } from "../abi/Pana.json";
import { abi as pPanaABI } from "../abi/pPana.json";
import { addresses } from "../constants";
import { segmentUA } from "../helpers/userAnalyticHelpers";
import { fetchAccountSuccess, getBalances, getPPanaTerms } from "./AccountSlice";
import {
  IActionAsyncThunk,
  IActionValueAsyncThunk,
  IChangeApprovalWithVersionAsyncThunk,
  IJsonRPCError,
  IStakeAsyncThunk,
} from "./interfaces";
import { error, info } from "./MessagesSlice";
import { clearPendingTxn, fetchPendingTxns, getStakingTypeText } from "./PendingTxnsSlice";

interface IUAData {
  address: string;
  value: string;
  approved: boolean;
  txHash: string | null;
  type: string | null;
}

function alreadyApprovedToken(
  token: string,
  stakeAllowance: BigNumber,
  exchangeAllowance: BigNumber,
  pPanaAllowance: BigNumber,
  pPanaUSDCAllowance: BigNumber,
) {
  // set defaults
  const bigZero = BigNumber.from("0");
  let applicableAllowance = bigZero;
  // determine which allowance to check
  if (token === "pana") {
    applicableAllowance = stakeAllowance;
  } else if (token === "karsha") {
    applicableAllowance = exchangeAllowance;
  } else if (token === "pPana") {
    applicableAllowance = pPanaAllowance;
  } else if (token === "pPanaUSDC") {
    applicableAllowance = pPanaUSDCAllowance;
  }

  // check if allowance exists
  if (applicableAllowance.gt(bigZero)) return true;

  return false;
}

export const changeApproval = createAsyncThunk(
  "exchange/changeApproval",
  async ({ token, provider, address, networkID }: IChangeApprovalWithVersionAsyncThunk, { dispatch }) => {
    if (!provider) {
      dispatch(error("Please connect your wallet!"));
      return;
    }

    const signer = provider.getSigner();
    const panaContract = new ethers.Contract(addresses[networkID].PANA_ADDRESS as string, panaABI, signer) as Pana;
    const karshaContract = new ethers.Contract(
      addresses[networkID].KARSHA_ADDRESS as string,
      karshaABI,
      signer,
    ) as Karsha;
    const pPanaContract = new ethers.Contract(addresses[networkID].PPANA_ADDRESS as string, pPanaABI, signer) as Pana;
    const usdcContract = new ethers.Contract(addresses[networkID].USDC_ADDRESS as string, usdcABI, signer) as USDC;

    let approveTx;
    let stakeAllowance = await panaContract.allowance(address, addresses[networkID].STAKING_ADDRESS);
    const exchangeAllowance = await karshaContract.allowance(address, addresses[networkID].STAKING_ADDRESS);
    let pPanaRedeemAllowance = BigNumber.from("0"); //await pPanaContract.allowance(address, addresses[networkID].PPANA_REDEEM_ADDRESS);
    let pPanaUSDCAllowance = BigNumber.from("0"); //await usdcContract.allowance(address, addresses[networkID].PPANA_REDEEM_ADDRESS);

    // return early if approval has already happened
    if (alreadyApprovedToken(token, stakeAllowance, exchangeAllowance, pPanaRedeemAllowance, pPanaUSDCAllowance)) {
      dispatch(info("Approval completed."));
      return dispatch(
        fetchAccountSuccess({
          staking: {
            panaStake: +stakeAllowance,
            panaUnstake: +exchangeAllowance,
          },
          redeem: {
            pPanaRedeem: +pPanaRedeemAllowance,
            pPanaUSDC: +pPanaUSDCAllowance,
          },
        }),
      );
    }

    try {
      if (token === "pana") {
        approveTx = await panaContract.approve(
          addresses[networkID].STAKING_ADDRESS,
          ethers.utils.parseUnits("1000000000000000000", "gwei").toString(),
        );
      } else if (token === "karsha") {
        approveTx = await karshaContract.approve(
          addresses[networkID].STAKING_ADDRESS,
          ethers.utils.parseUnits("1000000000000000000", "gwei").toString(),
        );
      } else if (token === "pPana") {
        approveTx = await pPanaContract.approve(
          addresses[networkID].PPANA_REDEEM_ADDRESS,
          ethers.utils.parseUnits("1000000000000000000", "gwei").toString(),
        );
      } else if (token === "pPanaUSDC") {
        approveTx = await usdcContract.approve(
          addresses[networkID].PPANA_REDEEM_ADDRESS,
          ethers.utils.parseUnits("1000000000000000000", "gwei").toString(),
        );
      }

      const text = "Approve Exchanging";
      const pendingTxnType = "approve_exchanging";
      if (approveTx) {
        dispatch(fetchPendingTxns({ txnHash: approveTx.hash, text, type: pendingTxnType }));

        await approveTx.wait();
      }
    } catch (e: unknown) {
      dispatch(error((e as IJsonRPCError).message));
      return;
    } finally {
      if (approveTx) {
        dispatch(clearPendingTxn(approveTx.hash));
      }
    }

    // go get fresh allowances
    stakeAllowance = await panaContract.allowance(address, addresses[networkID].STAKING_ADDRESS);
    pPanaRedeemAllowance = await pPanaContract.allowance(address, addresses[networkID].PPANA_REDEEM_ADDRESS);
    pPanaUSDCAllowance = await usdcContract.allowance(address, addresses[networkID].PPANA_REDEEM_ADDRESS);

    return dispatch(
      fetchAccountSuccess({
        staking: {
          panaStake: +stakeAllowance,
          karshaUnstake: +exchangeAllowance,
        },
        redeem: {
          pPanaRedeem: +pPanaRedeemAllowance,
          pPanaUSDC: +pPanaUSDCAllowance,
        },
      }),
    );
  },
);

export const changeExchange = createAsyncThunk(
  "exchange/changeExchange",
  async ({ action, value, provider, address, networkID, rebase }: IStakeAsyncThunk, { dispatch }) => {
    if (!provider) {
      dispatch(error("Please connect your wallet!"));
      return;
    }

    const signer = provider.getSigner();

    const staking = Staking__factory.connect(addresses[networkID].STAKING_ADDRESS, signer);

    let stakeTx;
    const uaData: IUAData = {
      address: address,
      value: value,
      approved: true,
      txHash: null,
      type: null,
    };
    try {
      uaData.type = "exchange";
      // 3rd arg is trigger default to true for mainnet and false for rinkeby
      // 4th arg is rebasing
      stakeTx = rebase
        ? await staking.unstake(address, ethers.utils.parseUnits(value, 18), true)
        : await staking.unstake(address, ethers.utils.parseUnits(value, "ether"), true);

      const pendingTxnType = "exchanging";
      uaData.txHash = stakeTx.hash;
      dispatch(fetchPendingTxns({ txnHash: stakeTx.hash, text: getStakingTypeText(action), type: pendingTxnType }));
      await stakeTx.wait();
    } catch (e: unknown) {
      uaData.approved = false;
      const rpcError = e as IJsonRPCError;
      if (rpcError.code === -32603 && rpcError.message.indexOf("ds-math-sub-underflow") >= 0) {
        dispatch(error("You may be trying to stake more than your balance!"));
      } else {
        dispatch(error(rpcError.message));
      }
      return;
    } finally {
      if (stakeTx) {
        segmentUA(uaData);
        ReactGA.event({
          category: "Staking",
          action: uaData.type ?? "unknown",
          label: uaData.txHash ?? "unknown",
          dimension1: uaData.txHash ?? "unknown",
          dimension2: uaData.address,
          metric1: parseFloat(uaData.value),
        });
        dispatch(clearPendingTxn(stakeTx.hash));
      }
    }
    dispatch(getBalances({ address, networkID, provider }));
  },
);

export const changePPanaExercise = createAsyncThunk(
  "exchange/changePPanaExercise",
  async ({ action, value, provider, address, networkID }: IActionValueAsyncThunk, { dispatch }) => {
    if (!provider) {
      dispatch(error("Please connect your wallet!"));
      return;
    }

    const signer = provider.getSigner();

    const pPanaRedeem = PPanaRedeem__factory.connect(addresses[networkID].PPANA_REDEEM_ADDRESS, signer);

    let pPanaExerciseTx;
    const uaData: IUAData = {
      address: address,
      value: value,
      approved: true,
      txHash: null,
      type: null,
    };
    try {
      uaData.type = "exercisePPana";
      pPanaExerciseTx = await pPanaRedeem.exercise(ethers.utils.parseUnits(value, "ether"));

      const pendingTxnType = "exercising-p-pana";
      uaData.txHash = pPanaExerciseTx.hash;
      dispatch(fetchPendingTxns({ txnHash: pPanaExerciseTx.hash, text: "Exercising pPana", type: pendingTxnType }));
      await pPanaExerciseTx.wait();
    } catch (e: unknown) {
      uaData.approved = false;
      const rpcError = e as IJsonRPCError;
      if (rpcError.code === -32603 && rpcError.data.message.indexOf("execution reverted: Not enough vested") >= 0) {
        dispatch(error("pPana more than redeemable balance cannot be exercised"));
      } else {
        dispatch(error(rpcError.message));
      }
      return;
    } finally {
      if (pPanaExerciseTx) {
        segmentUA(uaData);
        dispatch(info("Successfully Exercised pPana!"));
        ReactGA.event({
          category: "ExercisePPana",
          action: uaData.type ?? "unknown",
          label: uaData.txHash ?? "unknown",
          dimension1: uaData.txHash ?? "unknown",
          dimension2: uaData.address,
          metric1: parseFloat(uaData.value),
        });
        dispatch(clearPendingTxn(pPanaExerciseTx.hash));
      }
    }
    dispatch(getBalances({ address, networkID, provider }));
    dispatch(getPPanaTerms({ address, networkID, provider }));
  },
);

export const changePPanaClaim = createAsyncThunk(
  "exchange/changePPanaExercise",
  async ({ action, provider, address, networkID }: IActionAsyncThunk, { dispatch }) => {
    if (!provider) {
      dispatch(error("Please connect your wallet!"));
      return;
    }

    const signer = provider.getSigner();

    const pPanaRedeem = PPanaRedeem__factory.connect(addresses[networkID].PPANA_REDEEM_ADDRESS, signer);

    let pPanaClaimTx;
    const uaData: IUAData = {
      address: address,
      value: "",
      approved: true,
      txHash: null,
      type: null,
    };
    try {
      uaData.type = "claimPPana";
      pPanaClaimTx = await pPanaRedeem.claimRedeemable();

      const pendingTxnType = "claim-p-pana";
      uaData.txHash = pPanaClaimTx.hash;
      dispatch(fetchPendingTxns({ txnHash: pPanaClaimTx.hash, text: "Claiming pPana", type: pendingTxnType }));
      await pPanaClaimTx.wait();
    } catch (e: unknown) {
      uaData.approved = false;
      const rpcError = e as IJsonRPCError;
      if (rpcError.code === -32603 && rpcError.message.indexOf("ds-math-sub-underflow") >= 0) {
        dispatch(error("Error code: 32603. Message: ds-math-sub-underflow"));
      } else {
        dispatch(error(rpcError.message));
      }
      return;
    } finally {
      if (pPanaClaimTx) {
        segmentUA(uaData);
        dispatch(info("Successfully Claimed Pana!"));
        ReactGA.event({
          category: "ClaimPPana",
          action: uaData.type ?? "unknown",
          label: uaData.txHash ?? "unknown",
          dimension1: uaData.txHash ?? "unknown",
          dimension2: uaData.address,
          metric1: parseFloat(uaData.value),
        });
        dispatch(clearPendingTxn(pPanaClaimTx.hash));
      }
    }
    dispatch(getBalances({ address, networkID, provider }));
    dispatch(getPPanaTerms({ address, networkID, provider }));
  },
);
