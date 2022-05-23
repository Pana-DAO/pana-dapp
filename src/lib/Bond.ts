import { StaticJsonRpcProvider } from "@ethersproject/providers";
import { ethers } from "ethers";
import { NetworkId } from "src/constants";
import { PanaTokenStackProps } from "./PanaTokenStack";

export enum BondType {
  StableAsset,
  LP,
}

export interface BondAddresses {
  reserveAddress: string;
  bondAddress: string;
}

export type NetworkAddresses = { [key in NetworkId]?: BondAddresses };
export type Available = { [key in NetworkId]?: boolean };

export interface BondOpts {
  name: string; // Internal name used for references
  displayName: string; // Displayname on UI
  isBondable: Available; // aka isBondable => set false to hide
  // NOTE (appleseed): temporary for ONHOLD MIGRATION
  isLOLable: Available; // aka isBondable => set false to hide
  LOLmessage: string; // aka isBondable => set false to hide
  isClaimable: Available; // set false to hide
  bondIconSvg: PanaTokenStackProps["tokens"]; //  SVG path for icons
  panaIconSvg: PanaTokenStackProps["tokens"]; //  SVG path for icons
  bondContractABI: ethers.ContractInterface; // ABI for contract
  networkAddrs: NetworkAddresses; // Mapping of network --> Addresses
  bondToken: string; // Unused, but native token to buy the bond.
  payoutToken: string; // Token the user will receive
  Bond: boolean; // if Bond use BondingCalculator
}

// Technically only exporting for the interface
export abstract class Bond {
  // Standard Bond fields regardless of LP bonds or stable bonds.
  readonly name: string;
  readonly displayName: string;
  readonly isBondable: Available;
  // NOTE (appleseed): temporary for ONHOLD MIGRATION
  readonly isLOLable: Available;
  readonly LOLmessage: string;
  readonly isClaimable: Available;
  readonly type: BondType;
  readonly bondIconSvg: PanaTokenStackProps["tokens"];
  readonly panaIconSvg: PanaTokenStackProps["tokens"];
  readonly bondContractABI: ethers.ContractInterface; // Bond ABI
  readonly networkAddrs: NetworkAddresses;
  readonly bondToken: string;
  readonly payoutToken: string;
  readonly Bond: boolean;

  // The following two fields will differ on how they are set depending on bond type
  abstract isLP: boolean;
  abstract reserveContract: ethers.ContractInterface; // Token ABI
  abstract displayUnits: string;

  // Async method that returns a Promise
  abstract getTreasuryBalance(NetworkId: NetworkId, provider: StaticJsonRpcProvider): Promise<number>;

  constructor(type: BondType, bondOpts: BondOpts) {
    this.name = bondOpts.name;
    this.displayName = bondOpts.displayName;
    this.isBondable = bondOpts.isBondable;
    // NOTE (appleseed): temporary for ONHOLD MIGRATION
    this.isLOLable = bondOpts.isLOLable;
    this.LOLmessage = bondOpts.LOLmessage;
    this.type = type;
    this.isClaimable = bondOpts.isClaimable;
    this.bondIconSvg = bondOpts.bondIconSvg;
    this.panaIconSvg = bondOpts.panaIconSvg;
    this.bondContractABI = bondOpts.bondContractABI;
    this.networkAddrs = bondOpts.networkAddrs;
    this.bondToken = bondOpts.bondToken;
    this.payoutToken = bondOpts.payoutToken;
    this.Bond = bondOpts.Bond;
  }

  /**
   * makes isBondable accessible within Bonds.ts
   * @param NetworkId
   * @returns boolean
   */
  getBondability(NetworkId: NetworkId) {
    return this.isBondable[NetworkId];
  }
  getClaimability(NetworkId: NetworkId) {
    return this.isClaimable[NetworkId];
  }
  // NOTE (appleseed): temporary for ONHOLD MIGRATION
  getLOLability(NetworkId: NetworkId) {
    return this.isLOLable[NetworkId];
  }

  getAddressForBond(NetworkId: NetworkId) {
    return this.networkAddrs[NetworkId]?.bondAddress;
  }

  getAddressForReserve(NetworkId: NetworkId) {
    return this.networkAddrs[NetworkId]?.reserveAddress;
  }
}
