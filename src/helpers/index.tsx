import axios from "axios";
import { BigNumber } from "ethers";
import { IBond } from "src/slices/BondSlice";

import { BLOCK_RATE_SECONDS, EPOCH_INTERVAL, NetworkId } from "../constants";
import { EnvHelper } from "./Environment";

/**
 * gets price of token from coingecko
 * @param tokenId STRING taken from https://www.coingecko.com/api/documentations/v3#/coins/get_coins_list
 * @returns INTEGER usd value
 */
export async function getTokenPrice(tokenId = "pana"): Promise<number | undefined> {
  try {
    const tokenValue = sessionStorage.getItem(tokenId);
    if (tokenValue) {
      const jobj = JSON.parse(tokenValue)
      if ((new Date()).getTime() < jobj["time"] + (15 * 60 * 60)) {
        return jobj["price"];
      }
    }
    axios.defaults.headers.post['Content-Type'] = 'application/json;charset=utf-8';
    axios.defaults.headers.post['Access-Control-Allow-Origin'] = '*';
    const resp = (await axios.get(
      `https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=usd`,
    )) as {
      data: { [id: string]: { usd: number } };
    };
    const tokenPrice: number = resp.data[tokenId].usd;
    sessionStorage.setItem(tokenId, JSON.stringify({ "time": (new Date()), "price": tokenPrice }));
    return tokenPrice;
  } catch (e) {
    // console.log("coingecko api error: ", e);
    // TODO RESET TO 0
    if (tokenId == "usdc") {
      return 1;
    } else {
      return undefined;
    }
  }
}


export async function getAllTokenPrice(tokenIdlist: string): Promise<any | undefined> {
  try {
    const tokenValue = sessionStorage.getItem("alltokendata");
    if (tokenValue) {
      const jobj = JSON.parse(tokenValue)
      const expriryin = jobj["time"] + (15 * 60 * 60);
      const currentTime = (new Date()).getTime();
      if (currentTime < expriryin)
        return jobj["data"];
    }
    axios.defaults.headers.post['Content-Type'] = 'application/json;charset=utf-8';
    axios.defaults.headers.post['Access-Control-Allow-Origin'] = '*';
    const resp = (await axios.get(
      `https://api.coingecko.com/api/v3/simple/price?ids=${tokenIdlist}&vs_currencies=usd`,
    )) as {
      data: { [id: string]: { usd: number } };
    };

    sessionStorage.setItem("alltokendata", JSON.stringify({ "time": (new Date()).getTime(), "data": resp.data }));
    return resp.data;
  } catch (e) {
    return null;
  }
}

/**
 * gets price of token from coingecko
 * @param contractAddress STRING representing address
 * @returns INTEGER usd value
 */
export async function getTokenByContract(contractAddress: string): Promise<number> {
  const downcasedAddress = contractAddress.toLowerCase();
  const chainName = "ethereum";
  try {
    const resp = (await axios.get(
      `https://api.coingecko.com/api/v3/simple/token_price/${chainName}?contract_addresses=${downcasedAddress}&vs_currencies=usd`,
    )) as {
      data: { [address: string]: { usd: number } };
    };
    const tokenPrice: number = resp.data[downcasedAddress].usd;
    return tokenPrice;
  } catch (e) {
    // console.log("coingecko api error: ", e);
    return 0;
  }
}

export async function getTokenIdByContract(contractAddress: string): Promise<string> {
  try {
    const resp = (await axios.get(`https://api.coingecko.com/api/v3/coins/ethereum/contract/${contractAddress}'`)) as {
      data: { id: string };
    };
    return resp.data.id;
  } catch (e) {
    // console.log("coingecko api error: ", e);
    return "";
  }
}

export const getEtherscanUrl = ({ bond, networkId }: { bond: IBond; networkId: NetworkId }) => {
  if (networkId === NetworkId.ARBITRUM_MAINNET) {
    return `https://arbiscan.io/address/${bond.quoteToken}`;
  }
  if (networkId === NetworkId.ARBITRUM_TESTNET) {
    return `https://rinkeby-explorer.arbitrum.io/address/${bond.quoteToken}`;
  }
  return `https://arbiscan.io/address/${bond.quoteToken}`;
};

export function shorten(str: string) {
  if (str.length < 10) return str;
  return `${str.slice(0, 6)}...${str.slice(str.length - 4)}`;
}

export function shortenString(str: string, length: number) {
  return str.length > length ? str.substring(0, length) + "..." : str;
}

export function formatCurrency(c: number, precision = 0, currency = "USD") {
  if (currency === "PANA") return `${trim(c, precision)}`;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: precision,
    minimumFractionDigits: precision,
  }).format(c);
}

export function trim(number = 0, precision = 0) {
  // why would number ever be undefined??? what are we trimming?
  const array = Number(number).toFixed(8).split(".");
  if (array.length === 1) return number.toString();
  if (precision === 0) return array[0].toString();

  const poppedNumber = array.pop() || "0";
  array.push(poppedNumber.substring(0, precision));
  const trimmedNumber = array.join(".");
  return trimmedNumber;
}
export function trim2(number = 0, precision = 0) {
  // why would number ever be undefined??? what are we trimming?
  const array = Number(number).toFixed(14).split(".");
  if (array.length === 1) return number.toString();
  if (precision === 0) return array[0].toString();

  const poppedNumber = array.pop() || "0";
  const sub2Array = poppedNumber.split('');
  let lastValue = sub2Array.pop();
  while(lastValue&&lastValue=="0"){
    lastValue=sub2Array.pop();
  }
  if(sub2Array.length>0)
    return array.concat(sub2Array.join('')+(lastValue&&lastValue!="0"?lastValue:"")).join('.');  
  return array[0].toString();
}

export function getRebaseBlock(currentBlock: number) {
  return currentBlock + EPOCH_INTERVAL - (currentBlock % EPOCH_INTERVAL);
}

export function secondsUntilBlock(startBlock: number, endBlock: number): number {
  const blocksAway = endBlock - startBlock;
  const secondsAway = blocksAway * BLOCK_RATE_SECONDS;

  return secondsAway;
}

export function prettyVestingPeriod(currentBlock: number, vestingBlock: number) {
  if (vestingBlock === 0) {
    return "";
  }

  const seconds = secondsUntilBlock(currentBlock, vestingBlock);
  if (seconds < 0) {
    return "Fully Vested";
  }
  return prettifySeconds(seconds);
}

export function prettifySeconds(seconds: number, resolution?: string) {
  if (seconds !== 0 && !seconds) {
    return "";
  }

  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);

  if (resolution === "day") {
    return d + (d == 1 ? " day" : " days");
  }

  const dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
  const hDisplay = h > 0 ? h + (h == 1 ? " hr, " : " hrs, ") : "";
  const mDisplay = m > 0 ? m + (m == 1 ? " min" : " mins") : "";

  let result = dDisplay + hDisplay + mDisplay;
  if (mDisplay === "") {
    result = result.slice(0, result.length - 2);
  }

  return result;
}

// TS-REFACTOR-NOTE - Used for:
// AccountSlice.ts, AppSlice.ts
export function setAll(state: any, properties: any) {
  if (properties) {
    const props = Object.keys(properties);
    props.forEach(key => {
      state[key] = properties[key];
    });
  }
}

/**
 * returns false if SafetyCheck has fired in this Session. True otherwise
 * @returns boolean
 */
export const shouldTriggerSafetyCheck = () => {
  const _storage = window.sessionStorage;
  const _safetyCheckKey = "-oly-safety";
  // check if sessionStorage item exists for SafetyCheck
  if (!_storage.getItem(_safetyCheckKey)) {
    _storage.setItem(_safetyCheckKey, "true");
    return true;
  }
  return false;
};

/**
 * returns unix timestamp for x minutes ago
 * @param x minutes as a number
 */
export const minutesAgo = (x: number) => {
  const now = new Date().getTime();
  return new Date(now - x * 60000).getTime();
};

/**
 * subtracts two dates for use in 33-together timer
 * param (Date) dateA is the ending date object
 * param (Date) dateB is the current date object
 * returns days, hours, minutes, seconds
 * NOTE: this func previously used parseInt() to convert to whole numbers, however, typescript doesn't like
 * ... using parseInt on number params. It only allows parseInt on string params. So we converted usage to
 * ... Math.trunc which accomplishes the same result as parseInt.
 */
export const subtractDates = (dateA: Date, dateB: Date) => {
  const msA: number = dateA.getTime();
  const msB: number = dateB.getTime();

  let diff: number = msA - msB;

  let days = 0;
  if (diff >= 86400000) {
    days = Math.trunc(diff / 86400000);
    diff -= days * 86400000;
  }

  let hours = 0;
  if (days || diff >= 3600000) {
    hours = Math.trunc(diff / 3600000);
    diff -= hours * 3600000;
  }

  let minutes = 0;
  if (hours || diff >= 60000) {
    minutes = Math.trunc(diff / 60000);
    diff -= minutes * 60000;
  }

  let seconds = 0;
  if (minutes || diff >= 1000) {
    seconds = Math.trunc(diff / 1000);
  }
  return {
    days,
    hours,
    minutes,
    seconds,
  };
};

export const toBN = (num: number) => {
  return BigNumber.from(num);
};

export const bnToNum = (bigNum: BigNumber) => {
  return Number(bigNum.toString());
};

export const handleContractError = (e: any) => {
  if (EnvHelper.env.NODE_ENV !== "production") console.warn("caught error in slices; usually network related", e);
};
