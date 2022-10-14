import { JsonRpcProvider, StaticJsonRpcProvider } from "@ethersproject/providers";

import { NetworkId, NETWORKS } from "../constants";
import { NodeHelper } from "../helpers/NodeHelper";
import { EnvHelper } from "./Environment";

const arbitrum_mainnet = NETWORKS[NetworkId.ARBITRUM_MAINNET];
const arbitrum_testnet = NETWORKS[NetworkId.ARBITRUM_TESTNET];

interface IGetCurrentNetwork {
  provider: StaticJsonRpcProvider | JsonRpcProvider;
}

export const checkNetwork = (networkId: number) => {
  return {
    enabledNetwork:
      (networkId == arbitrum_mainnet.chainId && checkMainnet().enabledNetwork) ||
      (networkId == arbitrum_testnet.chainId && checkTestnet().enabledNetwork),
  };
};

export const checkMainnet = () => {
  return {
    enabledNetwork: EnvHelper.env.REACT_APP_ARBITRUM_MAINNET_ENABLED === "true",
  };
};

export const isWalletMainnet = (networkId: number) => networkId == arbitrum_mainnet.chainId;

export const checkTestnet = () => {
  return {
    enabledNetwork: EnvHelper.env.REACT_APP_ARBITRUM_TESTNET_ENABLED === "true",
  };
};
export const CheckBondClock = () => {
  return  EnvHelper.env.REACT_APP_SHOWBONDCLOCK==="true";
};

export const isWalletTestnet = (networkId: number) => networkId == arbitrum_testnet.chainId;

export const handleSwitchChain = (id: any, provider: StaticJsonRpcProvider | JsonRpcProvider) => {
  return () => {
    switchNetwork({ provider: provider, networkId: id });
  };
};

export const initNetworkFunc = async ({ provider }: IGetCurrentNetwork) => {
  try {
    let networkName: string;
    let blockExplorerUrl: string;
    let uri: string;
    let supported = true;
    const id: number = await provider.getNetwork().then(network => network.chainId);
    const network = NETWORKS[id];
    switch (id) {
      case 5:
        networkName = "Goerli Testnet";
        uri = NodeHelper.getMainnetURI(id);
        blockExplorerUrl = network["blockExplorerUrl"];
        break;
      case 137:
        networkName = "Polygon";
        uri = NodeHelper.getMainnetURI(id);
        blockExplorerUrl = network["blockExplorerUrl"];
        break;
      case 42161:
        networkName = "Arbitrum";
        uri = NodeHelper.getMainnetURI(id);
        blockExplorerUrl = network["blockExplorerUrl"];
        break;
      case 421613:
        networkName = "Arbitrum Testnet";
        uri = network.rpcUrls[1];
        blockExplorerUrl = network["blockExplorerUrl"];
        break;
      case 80001:
        networkName = "Polygon Testnet";
        uri = NodeHelper.getMainnetURI(id);
        blockExplorerUrl = network["blockExplorerUrl"];
        break;
      default:
        supported = false;
        networkName = "Unsupported Network";
        blockExplorerUrl = "";
        uri = "";
        break;
    }

    return {
      networkId: id,
      networkName: networkName,
      blockExplorerUrl: blockExplorerUrl,
      uri: uri,
      initialized: supported,
    };
  } catch (e) {
    console.log(e);
    return {
      networkId: -1,
      networkName: "",
      blockExplorerUrl: "",
      uri: "",
      initialized: false,
    };
  }
};

interface ISwitchNetwork {
  provider: StaticJsonRpcProvider | JsonRpcProvider;
  networkId: number;
}

export const switchNetwork = async ({ provider, networkId }: ISwitchNetwork) => {
  try {
    await provider.send("wallet_switchEthereumChain", [{ chainId: idToHexString(networkId) }]);
  } catch (e) {
    // If the chain has not been added to the user's wallet
    // @ts-ignore
    if (e.code === 4902) {
      const network = NETWORKS[networkId];
      const params = [
        {
          chainId: idToHexString(networkId),
          chainName: network["chainName"],
          nativeCurrency: network["nativeCurrency"],
          rpcUrls: network["rpcUrls"],
          blockExplorerUrl: network["blockExplorerUrl"],
        },
      ];

      try {
        await provider.send("wallet_addEthereumChain", params);
      } catch (e) {
        console.log(e);
        // dispatch(error("Error switching network!"));
      }
    }
    // }
  }
};

const idToHexString = (id: number) => {
  return "0x" + id.toString(16);
};

export const idFromHexString = (hexString: string) => {
  return parseInt(hexString, 16);
};
