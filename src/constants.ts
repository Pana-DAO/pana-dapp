import polygon from "./assets/tokens/matic.svg";
import ethereum from "./assets/tokens/wETH.svg";
import arbitrum_testnet from "./assets/arbitrum_plain.svg";
import { NodeHelper } from "./helpers/NodeHelper";

export const EPOCH_INTERVAL = 2200;

// NOTE could get this from an outside source since it changes slightly over time
export const BLOCK_RATE_SECONDS = 13.14;

export const TOKEN_DECIMALS = 18;

export enum NetworkId {
  TESTNET_GOERLI = 5,

  POLYGON_MAINNET = 137,
  MUMBAI_TESTNET = 80001,

  ARBITRUM_MAINNET = 42161,
  ARBITRUM_TESTNET = 421611,

  Localhost = 1337,
}

interface IAddresses {
  [key: number]: { [key: string]: string };
}

export const addresses: IAddresses = {
  [NetworkId.TESTNET_GOERLI]: {
    DAI_ADDRESS: "0x327459343E34F4c2Cc3fE6678ea8cA3Cf22fBfC8",
    PANA_ADDRESS: "0x26DB13688182819159642072ce64a7D7287c4853",
    SPANA_ADDRESS: "0xEB420642878bEed24dA29FA5D53ECF3be59fB322",
    KARSHA_ADDRESS: "0xd991FF367F08AE4217F9A6A21619674989Ff63Fc",
    PANA_DAI_LP: "",
    STAKING_ADDRESS: "0xa8Ba11928B4e15d7d029B1e2C25fba59aBbe194f",

    DISTRIBUTOR_ADDRESS: "0x83DE3FAa1ca69f31E471C99E2a52c5A44DF54F22",
    BONDINGCALC_ADDRESS: "0xfDB1de0B847785B8827ACf0fA0dc495b099c941B",

    BOND_DEPOSITORY: "0x568DC570a15ACf2E5d3DE6A95D207e5Ae0d993DD",
    DAO_TREASURY: "0xB31b2D3741C2B7468D7bbAf362e869d2DF8bF75F",
  },
  [NetworkId.MUMBAI_TESTNET]: {
    DAI_ADDRESS: "0x327459343E34F4c2Cc3fE6678ea8cA3Cf22fBfC8",
    PANA_ADDRESS: "0xa14fd01d3450Fd7385f8d78ecF3F2Fa80106B43D",
    KARSHA_ADDRESS: "0x00eAceC41ca2D5d86352A90eAF66DDdE6B38b840",

    STAKING_ADDRESS: "0x725365B53c50f0273825947096C71Ab791d07eb9",

    DISTRIBUTOR_ADDRESS: "0xF7660d246B3d03Fa0E5Ff8fB8a2B3fd9aA7909fc",
    BONDINGCALC_ADDRESS: "0x0F947842d2aaAbb04600D831B49fD396559e81d4",

    BOND_DEPOSITORY: "0x57fAdaDc162D4e74151e77705069A54383ae0b96",
    DAO_TREASURY: "0x366D9Eb2586BC23f807F546C1f329c07650cE148",
  },
  [NetworkId.POLYGON_MAINNET]: {
    DAI_ADDRESS: "",
    PANA_ADDRESS: "",
    KARSHA_ADDRESS: "",

    STAKING_ADDRESS: "",

    DISTRIBUTOR_ADDRESS: "",
    BONDINGCALC_ADDRESS: "",

    BOND_DEPOSITORY: "",
    DAO_TREASURY: "",
  },
  [NetworkId.ARBITRUM_MAINNET]: {
    DAI_ADDRESS: "",
    PANA_ADDRESS: "",
    KARSHA_ADDRESS: "",

    STAKING_ADDRESS: "",

    DISTRIBUTOR_ADDRESS: "",
    BONDINGCALC_ADDRESS: "",

    BOND_DEPOSITORY: "",
    DAO_TREASURY: "",
  },
  [NetworkId.ARBITRUM_TESTNET]: {
    DAI_ADDRESS: "0x327459343E34F4c2Cc3fE6678ea8cA3Cf22fBfC8",
    PANA_ADDRESS: "0x29F55058BE3104EDE589FA51FF74B2F07EBB46F6",
    SPANA_ADDRESS: "0xE75C7C6C1491B91887FB4B72C4F42B0CD6B6EEBC",
    KARSHA_ADDRESS: "0x44333156C47AC50631236B02C97751583A334F41",
    PANA_DAI_LP: "0x75C78C8F779DE09687629E158AD4F33EE35B5EE1",
    STAKING_ADDRESS: "0x3D0DA0E2C27FE2A14D2BEEA7165F183EBC0CA64A",

    DISTRIBUTOR_ADDRESS: "0xA9A0B7CEE748A4C5BDF15EB749947FC5020AABDB",
    BONDINGCALC_ADDRESS: "0x8EE19FE0DA2C29BF864049B09997019781AB4FE2",

    BOND_DEPOSITORY: "0x7ADA3E4250c23001760Fb3983645B8778f24a515",
    BOND_DEPOSITORY_OLD: "0x0f4196ca36696D0938568ee7FD8ff7be83C1E7ef",
    DAO_TREASURY: "0xF7A4A8EFC0153262BC449D021F268A63F4B49417",

    PPANA_ADDRESS: "0x404D1F1300F28BFEE5FDED5FE9D5F898B93E65F5",
    PPANA_REDEEM_ADDRESS: "0x32C90D5E7AA30DD15B8AEBBEF565CF0BC732B329",
    DAO_MULTISIG: "0xde9eB6AB368290D17eb207206e2a067C65D98F15",
    STAKING_POOLS: "0x6B72821bEa6B8639BA30554bdBaFa07c11ef8C53"
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
export const USER_SELECTABLE_NETWORKS = [NetworkId.POLYGON_MAINNET];

// Set this to the chain number of the most recently added network in order to enable the 'Now supporting X network'
// message in the UI. Set to -1 if we don't want to display the message at the current time.
export const NEWEST_NETWORK_ID = NetworkId.POLYGON_MAINNET;

export const NETWORKS: { [key: number]: INetwork } = {
  [NetworkId.TESTNET_GOERLI]: {
    chainName: "Rinkeby Testnet",
    chainId: 4,
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: [""],
    blockExplorerUrl: "https://rinkeby.etherscan.io/#",
    image: ethereum,
    imageAltText: "Ethereum Logo",
    uri: () => NodeHelper.getMainnetURI(NetworkId.TESTNET_GOERLI),
    isOracleIntegrated: false,
  },
  [NetworkId.POLYGON_MAINNET]: {
    chainName: "Polygon",
    chainId: 137,
    nativeCurrency: {
      name: "Polygon",
      symbol: "MATIC",
      decimals: 18,
    },
    rpcUrls: ["https://polygon-rpc.com"],
    blockExplorerUrl: "https://polygonscan.com",
    image: polygon,
    imageAltText: "Polygon Logo",
    uri: () => NodeHelper.getMainnetURI(NetworkId.POLYGON_MAINNET),
    isOracleIntegrated: false,
  },
  [NetworkId.MUMBAI_TESTNET]: {
    chainName: "Polygon Mumbai Testnet",
    chainId: 80001,
    nativeCurrency: {
      name: "Polygon",
      symbol: "MATIC",
      decimals: 18,
    },
    rpcUrls: ["https://polygon-rpc.com"],
    blockExplorerUrl: "https://mumbai.polygonscan.com",
    image: polygon,
    imageAltText: "Polygon Logo",
    uri: () => "", // NodeHelper.getMainnetURI(NetworkId.MUMBAI_TESTNET),
    isOracleIntegrated: false,
  },
  [NetworkId.ARBITRUM_MAINNET]: {
    chainName: "Arbitrum",
    chainId: 42161,
    nativeCurrency: {
      name: "Arbitrum",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: ["https://arb1.arbitrum.io/rpc"],
    blockExplorerUrl: "https://arbiscan.io",
    image: polygon,
    imageAltText: "Arbitrum Logo",
    uri: () => NodeHelper.getMainnetURI(NetworkId.ARBITRUM_MAINNET),
    isOracleIntegrated: false
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
    image: arbitrum_testnet,
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
  [NetworkId.TESTNET_GOERLI]: {
    dashboard: true,
    stake: true,
    wrap: true,
    network: true,
    bonds: true,
    pPana: true,
  },
  [NetworkId.POLYGON_MAINNET]: {
    dashboard: true,
    stake: false,
    wrap: false,
    network: false,
    bonds: false,
    pPana: false,
  },
  [NetworkId.MUMBAI_TESTNET]: {
    dashboard: true,
    stake: false,
    wrap: true,
    network: true,
    bonds: false,
    pPana: false,
  },
  [NetworkId.ARBITRUM_MAINNET]: {
    dashboard: true,
    stake: false,
    wrap: false,
    network: false,
    bonds: false,
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
