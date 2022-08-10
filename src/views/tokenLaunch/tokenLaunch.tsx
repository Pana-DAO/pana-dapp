import "./tokenLaunch.scss";
import { t, Trans } from "@lingui/macro";
import {
  Button,
  Typography,
  Zoom,
  Paper,
  useMediaQuery,
  Grid,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Box,
} from "@material-ui/core";
import { useHistory } from "react-router";
import { usePathForNetwork } from "src/hooks/usePathForNetwork";
import { useWeb3Context } from "src/hooks/web3Context";
import { useState } from "react";
import { farms } from "src/helpers/tokenLaunch";
import FarmData from "./farmData";
import { isPendingTxn, txnButtonText } from "src/slices/PendingTxnsSlice";
import { useAppSelector } from "src/hooks";
import { ethers } from "ethers";
import { formatCurrency } from "src/helpers";
import { onHarvestAll } from "src/slices/StakingPoolsSlice";
import { useDispatch } from "react-redux";
import { AppDispatch } from "src/store";
import { CircSupply, MarketCap, PANAPrice } from "../TreasuryDashboard/components/Metric/Metric";
import { switchNetwork } from "src/helpers/NetworkHelper";
import { NetworkId, NETWORKS } from "src/constants";

function TokenLaunch() {
  const dispatch = useDispatch<AppDispatch>();
  const history = useHistory();
  const { provider, address, connect, networkId } = useWeb3Context();
  usePathForNetwork({ pathName: "tokenlaunch", networkID: networkId, history });
  const isSmallScreen = useMediaQuery("(max-width: 733px)"); // change to breakpoint query

  const [zoomed, setZoomed] = useState(false);

  const pendingTransactions = useAppSelector(state => {
    return state.pendingTransactions;
  });

  const totalPendingPanaForUser = useAppSelector(state => {
    return state.stakingPools.pendingPanaForUser && state.stakingPools.pendingPanaForUser.length > 0
      ? state.stakingPools.pendingPanaForUser.reduce((total, val) => total.add(val))
      : null;
  });

  const modalButton = [];

  const doHarvestAll = () => {
    dispatch(onHarvestAll({ provider, networkID: networkId, address }));
  };

  const arbitrum_testnet = NETWORKS[NetworkId.ARBITRUM_TESTNET];

  const handleSwitchChain = (id: any) => {
    return () => {
      switchNetwork({ provider: provider, networkId: id });
    };
  };

  modalButton.push(
    <Button variant="contained" color="primary" className="connect-button" onClick={connect} key={1}>
      <Trans>Connect Wallet</Trans>
    </Button>,
  );

  return (
    <div id="token-launch-view">
      {networkId != arbitrum_testnet.chainId ? (
        <>
          <Box width="100%" alignItems={"center"} display="flex" flexDirection="column" p={1}>
            <Typography variant="h5" style={{ margin: "15px 0 10px 0" }}>
              You are connected to an incompatable newtork.
            </Typography>
            <Typography variant="h5" style={{ margin: "15px 0 10px 0" }}>
              Connect to a supported network:
            </Typography>
            <Button onClick={handleSwitchChain(NetworkId.ARBITRUM_TESTNET)} variant="outlined">
              <img
                height="28px"
                width="28px"
                src={String(arbitrum_testnet.image)}
                alt={arbitrum_testnet.imageAltText}
              />
              <Typography variant="h6" style={{ marginLeft: "8px" }}>
                {arbitrum_testnet.chainName}
              </Typography>
            </Button>
          </Box>
        </>
      ) : (
        <Zoom in={true} onEntered={() => setZoomed(true)}>
          <Paper className="paper-format" elevation={0}>
            <Typography variant="h5" className="card-header" style={{ fontWeight: 600 }}>
              {t`Pana Token Launch`}
            </Typography>

            {!isSmallScreen && farms.length != 0 && networkId != 1 && (
              <>
                <Grid container direction="row" spacing={2}>
                  <MarketCap />
                  <PANAPrice />
                  <CircSupply />
                </Grid>
                <Box
                  marginBottom={"20px"}
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  className={`global-claim-buttons ${isSmallScreen ? "small" : ""}`}
                >
                  <Typography variant="h5" align="center" className="claimable-balance">
                    Claimable Rewards (Pana)
                  </Typography>
                  <Typography variant="h4" align="center" style={{ marginBottom: "10px" }}>
                    {totalPendingPanaForUser
                      ? formatCurrency(+ethers.utils.formatUnits(totalPendingPanaForUser, 18), 4, "PANA")
                      : "-"}
                  </Typography>

                  <Button
                    variant="contained"
                    color="primary"
                    className="transaction-button"
                    fullWidth
                    disabled={
                      isPendingTxn(pendingTransactions, "farm_harvestAll") ||
                      !totalPendingPanaForUser ||
                      (totalPendingPanaForUser && +totalPendingPanaForUser <= 0)
                    }
                    onClick={doHarvestAll}
                  >
                    {txnButtonText(pendingTransactions, "farm_harvestAll", t`Harvest All`)}
                  </Button>
                </Box>
                <Grid container item className="MuiPaper-root">
                  <TableContainer>
                    <Table aria-label="Available bonds">
                      <TableHead>
                        <TableRow>
                          <TableCell align="left">
                            <Trans>Name</Trans>
                          </TableCell>
                          <TableCell align="center">
                            <Trans>Multiplier</Trans>
                          </TableCell>
                          <TableCell align="center">
                            <Trans>Liquidity</Trans>
                          </TableCell>
                          <TableCell align="center">
                            <Trans>My Stakes</Trans>
                          </TableCell>
                          <TableCell align="center">
                            <Trans>Per Day</Trans>
                          </TableCell>
                          <TableCell align="center">
                            <Trans>Rewards (Pana)</Trans>
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {farms.map(farm => {
                          //if (bond.displayName !== "unknown")
                          return <FarmData networkId={networkId} key={farm.index} farm={farm} />;
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </>
            )}
          </Paper>
        </Zoom>
      )}
    </div>
  );
}

export default TokenLaunch;
