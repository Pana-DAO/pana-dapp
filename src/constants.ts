import arbitrum_logo from "./assets/arbitrum_plain.svg";
import { NodeHelper } from "./helpers/NodeHelper";

export const EPOCH_INTERVAL = 2200;

// NOTE could get this from an outside source since it changes slightly over time
export const BLOCK_RATE_SECONDS = 13.14;

export const TOKEN_DECIMALS = 18;

export const SHOW_COUNTDOWN_PAGE = false;

export enum NetworkId {
  ARBITRUM_MAINNET = 42161,
  ARBITRUM_TESTNET = 421611,

  Localhost = 1337,
}

interface IAddresses {
  [key: number]: { [key: string]: string };
}

export const addresses: IAddresses = {
  [NetworkId.ARBITRUM_MAINNET]: {
    USDC_ADDRESS: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
    PANA_ADDRESS: "0x369eB8197062093a20402935D3a707b4aE414E9D",
    KARSHA_ADDRESS: "0x543ff59E8BC8844DcB2FC5116D8FF972305aE0d4",
    PANA_USDC_LP: "0x300fDD222687db8686EA51847Db43fa988b518E0",
    STAKING_ADDRESS: "0x6bAf949BE348F6DF135Df9DC15102971654749fe",
    SPANA_ADDRESS:"0xC2786A608B8bA6F9dF87D8e0b8777BF158b61093",
    DISTRIBUTOR_ADDRESS: "0x9898E83b8E10290fEe332EE43503948194624d6F",
    BONDINGCALC_ADDRESS: "",

    BOND_DEPOSITORY: "0xd87d959ebE3749FB403b1dDf986007451a0fA97f",
    DAO_TREASURY: "0xf4414eeb85Da1932889997d13edA5B5ed137C19d",
    DAO_MULTISIG: "0xa178776D7B05931e31b2b955Dd97436F08046cFe",
    STAKING_POOLS: "0x1288D0bEd4F0a1381A0f63cbC97C7353908623be",
  },
  [NetworkId.ARBITRUM_TESTNET]: {
    USDC_ADDRESS: "0x91700A0a45bef3Ef488eC11792aE3b3199e0dC4e",
    PANA_ADDRESS: "0x053Bdec0bEC0b010C7dd37E82C2246d107d6B363",
    SPANA_ADDRESS: "0x16d90a71520554781cdd1c220b9f11adcb88f010",
    KARSHA_ADDRESS: "0x9a791Aa6a20c0516a19C8Cc43ff9DbA5660119e7",
    PANA_USDC_LP: "0x91a2d26e987219E6a266784d5a816ceEf03cB3B8",
    STAKING_ADDRESS: "0xa89D35418b80786436bcE3aAE167C7954d4c47c1",

    DISTRIBUTOR_ADDRESS: "0x08483698406bb7A108B19A60525031df60C15518",
    // BONDINGCALC_ADDRESS: "0xDB1F524152278E6E454870EB1D692B51ACE4A97E",

    BOND_DEPOSITORY: "0x4d2F3260154C96906E70bDfB049066F6EB4C4103",
    BOND_DEPOSITORY_OLD: "",
    DAO_TREASURY: "0x5b94B43cC687A9D53bA43Dd0440ABdd0d8778cbb",

    PPANA_ADDRESS: "",
    PPANA_REDEEM_ADDRESS: "",
    DAO_MULTISIG: "0xde9eB6AB368290D17eb207206e2a067C65D98F15",
    STAKING_POOLS: "0xaffB1cB501DccC274F81D0C6d495DdDbEFE9687F",
  },
};

/**
 * Network details required to add a network to a user's wallet, as defined in EIP-3085 (https://eips.ethereum.org/EIPS/eip-3085)
 */

interface INativeCurrency {
  name: string;
  symbol: string;
  decimals?: number;
}

interface INetwork {
  chainName: string;
  chainId: number;
  nativeCurrency: INativeCurrency;
  rpcUrls: string[];
  blockExplorerUrl: string;
  image: SVGImageElement;
  imageAltText: string;
  uri: () => string;
  isOracleIntegrated: boolean;
}

// These networks will be available for users to select. Other networks may be functional
// (e.g. testnets, or mainnets being prepared for launch) but need to be selected directly via the wallet.
export const USER_SELECTABLE_NETWORKS = [NetworkId.ARBITRUM_MAINNET];

// Set this to the chain number of the most recently added network in order to enable the 'Now supporting X network'
// message in the UI. Set to -1 if we don't want to display the message at the current time.
export const NEWEST_NETWORK_ID = NetworkId.ARBITRUM_MAINNET;

export const NETWORKS: { [key: number]: INetwork } = {
  [NetworkId.ARBITRUM_MAINNET]: {
    chainName: "Arbitrum",
    chainId: 42161,
    nativeCurrency: {
      name: "Arbitrum",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: ["https://arb1.arbitrum.io/rpc", "https://arbitrum-mainnet.infura.io/v3"],
    blockExplorerUrl: "https://arbiscan.io",
    image: arbitrum_logo,
    imageAltText: "Arbitrum Mainnet",
    uri: () => NodeHelper.getMainnetURI(NetworkId.ARBITRUM_MAINNET),
    isOracleIntegrated: true
  },
  [NetworkId.ARBITRUM_TESTNET]: {
    chainName: "Arbitrum Testnet",
    chainId: 421611,
    nativeCurrency: {
      name: "Arbitrum",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: ["https://rinkeby.arbitrum.io/rpc"],
    blockExplorerUrl: "https://rinkeby-explorer.arbitrum.io/#",
    image: arbitrum_logo,
    imageAltText: "Arbitrum Testnet",
    uri: () => NodeHelper.getMainnetURI(NetworkId.ARBITRUM_TESTNET),
    isOracleIntegrated: true
  },
};

// VIEWS FOR NETWORK is used to denote which paths should be viewable on each network
// ... attempting to prevent contract calls that can't complete & prevent user's from getting
// ... stuck on the wrong view
interface IViewsForNetwork {
  dashboard: boolean;
  stake: boolean;
  wrap: boolean;
  network: boolean;
  bonds: boolean;
  pPana: boolean;
}

export const VIEWS_FOR_NETWORK: { [key: number]: IViewsForNetwork } = {
  [NetworkId.ARBITRUM_MAINNET]: {
    dashboard: true,
    stake: true,
    wrap: true,
    network: true,
    bonds: true,
    pPana: false,
  },
  [NetworkId.ARBITRUM_TESTNET]: {
    dashboard: true,
    stake: true,
    wrap: true,
    network: true,
    bonds: true,
    pPana: true,
  },
};
