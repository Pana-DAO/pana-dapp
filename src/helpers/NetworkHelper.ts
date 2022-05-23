import { JsonRpcProvider, StaticJsonRpcProvider } from "@ethersproject/providers";

import { NETWORKS } from "../constants";
import { NodeHelper } from "../helpers/NodeHelper";

interface IGetCurrentNetwork {
  provider: StaticJsonRpcProvider | JsonRpcProvider;
}

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
      case 421611:
        networkName = "Arbitrum Testnet";
        uri = NodeHelper.getMainnetURI(id);
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
