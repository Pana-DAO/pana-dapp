import { StaticJsonRpcProvider } from "@ethersproject/providers";
import { ethers } from "ethers";
import { abi as BondCalcContractABI } from "src/abi/BondCalcContract.json";
import { addresses, NetworkId } from "src/constants";

import { BondCalcContract } from "../typechain";

export const getBondCalculator = (NetworkId: NetworkId, provider: StaticJsonRpcProvider, Bond: boolean) => {
  if (Bond) {
    return new ethers.Contract(
      addresses[NetworkId].BONDINGCALC_ADDRESS as string,
      BondCalcContractABI,
      provider,
    ) as BondCalcContract;
  } else {
    return new ethers.Contract(
      addresses[NetworkId].BONDINGCALC_ADDRESS as string,
      BondCalcContractABI,
      provider,
    ) as BondCalcContract;
  }
};
