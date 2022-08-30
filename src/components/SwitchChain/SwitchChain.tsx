import { JsonRpcProvider, StaticJsonRpcProvider } from "@ethersproject/providers";
import { Box, Button, Typography } from "@material-ui/core";
import React from "react";
import { NetworkId, NETWORKS } from "src/constants";
import { checkMainnet, checkTestnet, handleSwitchChain } from "src/helpers/NetworkHelper";
import { useWeb3Context } from "src/hooks/web3Context";

const arbitrum_mainnet = NETWORKS[NetworkId.ARBITRUM_MAINNET];
const arbitrum_testnet = NETWORKS[NetworkId.ARBITRUM_TESTNET];

type SwitchChainProps = {
  provider: StaticJsonRpcProvider | JsonRpcProvider;
};

const SwitchChain: React.FC<SwitchChainProps> = ({ provider }) => {
  const { networkId } = useWeb3Context();
  return (
    <>
      <Box width="100%" alignItems={"center"} display="flex" flexDirection="column" p={1}>
        <Typography variant="h5" style={{ margin: "15px 0 10px 0" }}>
          You are connected to an incompatible network.
        </Typography>
        <Typography variant="h5" style={{ margin: "15px 0 10px 0" }}>
          Connect to a supported network:
        </Typography>
        {checkMainnet().enabledNetwork ? (
          <Button onClick={handleSwitchChain(NetworkId.ARBITRUM_MAINNET, provider)} variant="outlined">
            <img height="28px" width="28px" src={String(arbitrum_mainnet.image)} alt={arbitrum_mainnet.imageAltText} />
            <Typography variant="h6" style={{ marginLeft: "8px" }}>
              {arbitrum_mainnet.chainName}
            </Typography>
          </Button>
        ) : (
          <></>
        )}
        {checkTestnet().enabledNetwork ? (
          <Button onClick={handleSwitchChain(NetworkId.ARBITRUM_TESTNET, provider)} variant="outlined">
            <img height="28px" width="28px" src={String(arbitrum_testnet.image)} alt={arbitrum_testnet.imageAltText} />
            <Typography variant="h6" style={{ marginLeft: "8px" }}>
              {arbitrum_testnet.chainName}
            </Typography>
          </Button>
        ) : (
          <></>
        )}
      </Box>
    </>
  );
};

export default SwitchChain;
