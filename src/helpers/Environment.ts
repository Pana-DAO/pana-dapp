import { NetworkId } from "src/constants";

/**
 * Access `process.env` in an environment helper
 * Usage: `EnvHelper.env`
 * - Other static methods can be added as needed per
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/static
 */
export class EnvHelper {
  /**
   * @returns `process.env`
   */
  static env = process.env;
  // static alchemyEthereumTestnetURI = `https://eth-rinkeby.alchemyapi.io//${EnvHelper.env.REACT_APP_ETHEREUM_TESTNET_ALCHEMY}`;
  static alchemyArbitrumTestnetURI = `https://arb-rinkeby.g.alchemy.com//${EnvHelper.env.REACT_APP_ARBITRUM_TESTNET_ALCHEMY}`;
  static alchemyAvalancheTestnetURI = ``;

  static whitespaceRegex = /\s+/;

  /**
   * Returns env contingent segment api key
   * @returns segment
   */
  static getSegmentKey() {
    return EnvHelper.env.REACT_APP_SEGMENT_API_KEY;
  }

  static getGaKey() {
    return EnvHelper.env.REACT_APP_GA_API_KEY;
  }

  static getCovalentKey() {
    let CKEYS: string[] = [];
    if (EnvHelper.env.REACT_APP_COVALENT && EnvHelper.isNotEmpty(EnvHelper.env.REACT_APP_COVALENT)) {
      CKEYS = EnvHelper.env.REACT_APP_COVALENT.split(EnvHelper.whitespaceRegex);
    } else {
      console.warn("you must set at least 1 REACT_APP_COVALENT key in your ENV");
    }
    const randomIndex = Math.floor(Math.random() * CKEYS.length);
    return CKEYS[randomIndex];
  }

  static isNotEmpty(envVariable: string) {
    if (envVariable.length > 10) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * NOTE(appleseed): Infura IDs are only used as Fallbacks & are not Mandatory
   * @returns {Array} Array of Infura API Ids
   */
  static getInfuraIdList() {
    let INFURA_ID_LIST: string[];

    // split the provided API keys on whitespace
    if (EnvHelper.env.REACT_APP_INFURA_IDS && EnvHelper.isNotEmpty(EnvHelper.env.REACT_APP_INFURA_IDS)) {
      INFURA_ID_LIST = EnvHelper.env.REACT_APP_INFURA_IDS.split(new RegExp(EnvHelper.whitespaceRegex));
    } else {
      INFURA_ID_LIST = [];
    }
    //console.log("INFURA_ID_LIST", INFURA_ID_LIST);
    // now add the uri path
    if (INFURA_ID_LIST.length > 0) {
      INFURA_ID_LIST = INFURA_ID_LIST.map(infuraID => `https://arbitrum-mainnet.infura.io/v3/${infuraID}`);
    } else {
      INFURA_ID_LIST = [];
    }
    return INFURA_ID_LIST;
  }

  /**
   * @returns {Array} Array of node url addresses or empty set
   * node url addresses can be whitespace-separated string of "https" addresses
   * - functionality for Websocket addresses has been deprecated due to issues with WalletConnect
   *     - WalletConnect Issue: https://github.com/WalletConnect/walletconnect-monorepo/issues/193
   */
  static getSelfHostedNode(networkId: NetworkId) {
    //console.log("getSelfHostedNode", NetworkId);
    let URI_LIST: string[] = [];
    switch (networkId) {
      case NetworkId.ARBITRUM_TESTNET:
        if (
          EnvHelper.env.REACT_APP_ARBITRUM_MAINNET_SELF_HOSTED_NODE &&
          EnvHelper.isNotEmpty(EnvHelper.env.REACT_APP_ARBITRUM_MAINNET_SELF_HOSTED_NODE)
        ) {
          URI_LIST = EnvHelper.env.REACT_APP_ARBITRUM_MAINNET_SELF_HOSTED_NODE.split(
            new RegExp(EnvHelper.whitespaceRegex),
          );
        }
        break;
      case NetworkId.ARBITRUM_MAINNET:
        if (
          EnvHelper.env.REACT_APP_ARBITRUM_MAINNET_SELF_HOSTED_NODE &&
          EnvHelper.isNotEmpty(EnvHelper.env.REACT_APP_ARBITRUM_MAINNET_SELF_HOSTED_NODE)
        ) {
          URI_LIST = EnvHelper.env.REACT_APP_ARBITRUM_MAINNET_SELF_HOSTED_NODE.split(
            new RegExp(EnvHelper.whitespaceRegex),
          );
        }
        break;
    }
    return URI_LIST;
  }

  /**
   * in development will always return the `ethers` community key url even if .env is blank
   * in prod if .env is blank API connections will fail
   * @returns array of API urls
   */
  static getAPIUris(networkId: NetworkId) {
    //console.log("getAPIUris", NetworkId);
    let ALL_URIs = EnvHelper.getSelfHostedNode(networkId);
    //console.log("getAPIUris - ALL_URIs.length", ALL_URIs.length);
    if (ALL_URIs.length === 0) {
      //console.warn("API keys must be set in the .env, reverting to fallbacks");
      ALL_URIs = EnvHelper.getFallbackURIs(networkId);
    }
    return ALL_URIs;
  }

  static getFallbackURIs(networkId: NetworkId) {
    const ALL_URIs = [...EnvHelper.getInfuraIdList()];
    //console.log("getFallbackURIs", ALL_URIs);
    return ALL_URIs;
  }
}
