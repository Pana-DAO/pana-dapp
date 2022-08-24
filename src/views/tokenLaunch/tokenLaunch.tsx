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
import { CircSupply, MarketCap, PANAPrice, TVLStakingPool } from "../TreasuryDashboard/components/Metric/Metric";
import { switchNetwork } from "src/helpers/NetworkHelper";
import { NetworkId, NETWORKS } from "src/constants";
import { Skeleton } from "@material-ui/lab";

function TokenLaunch() {
  const dispatch = useDispatch<AppDispatch>();
  const history = useHistory();
  const { provider, address, connect, networkId, connected } = useWeb3Context();
  usePathForNetwork({ pathName: "tokenlaunch", networkID: networkId, history });
  const isSmallScreen = useMediaQuery("(max-width: 885px)"); // change to breakpoint query

  const [zoomed, setZoomed] = useState(false);
  const [totalLiquidity, setTotalLiquidity] = useState(0);
  const [totalPana, setTotalPana] = useState(0);

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

  const arbitrum_mainnet = NETWORKS[NetworkId.ARBITRUM_MAINNET];

  const handleSwitchChain = (id: any) => {
    return () => {
      switchNetwork({ provider: provider, networkId: id });
    };
  };

  const farmLiquidityUpdate = (totalLiq: number) => {
    setTotalLiquidity(totalLiq);
  };

  const farmPanaUpdate = (totalPana: number) => {
    setTotalPana(totalPana);
  };

  modalButton.push(
    <Button variant="contained" color="primary" className="connect-button" onClick={connect} key={1}>
      <Trans>Connect Wallet</Trans>
    </Button>,
  );

  return (
    <div id="token-launch-view">
      { networkId != arbitrum_mainnet.chainId ? (
        <>
          <Box width="100%" alignItems={"center"} display="flex" flexDirection="column" p={1}>
            <Typography variant="h5" style={{ margin: "15px 0 10px 0" }}>
              You are connected to an incompatible network.
            </Typography>
            <Typography variant="h5" style={{ margin: "15px 0 10px 0" }}>
              Connect to a supported network:
            </Typography>
            <Button onClick={handleSwitchChain(NetworkId.ARBITRUM_MAINNET)} variant="outlined">
              <img
                height="28px"
                width="28px"
                src={String(arbitrum_mainnet.image)}
                alt={arbitrum_mainnet.imageAltText}
              />
              <Typography variant="h6" style={{ marginLeft: "8px" }}>
                {arbitrum_mainnet.chainName}
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

            {farms.length != 0 && (
              <>
                <Grid container direction="row" className="small-box" spacing={1}>
                  <TVLStakingPool totalLiquidity={totalLiquidity} />

                  <MarketCap />
                  <PANAPrice />
                  <CircSupply />
                </Grid>
                { connected && <Grid container className="bigboxspace" direction="row" spacing={1}>
                  <Grid item xs={12} sm={6}>
                    <Grid className="box-dash big-box">
                      <Typography variant="h5" align="center" className="claimable-balance">
                        Claimable Pana Rewards
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
                    </Grid>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Grid className="box-dash big-box">
                      <div style={{ margin: "auto" }}>
                        <Typography variant="h5" align="center" className="claimable-balance">
                          Expected Pana Rewards
                        </Typography>
                        <Typography variant="h5" align="center" className="claimable-balance info-perday">
                          Per Day
                        </Typography>
                        <Typography variant="h4" align="center" style={{ marginBottom: "10px" }}>
                          <>
                            {!totalLiquidity ? (
                              <Skeleton width="200px" />
                            ) : totalPana ? (
                              formatCurrency(+ethers.utils.formatUnits(totalPana, 18), 4, "PANA")
                            ) : (
                              "-"
                            )}
                          </>
                        </Typography>
                      </div>
                    </Grid>
                  </Grid>
                </Grid> }
                <Grid container className="MuiPaper-root">
                  {!isSmallScreen ? (
                    <TableContainer>
                      <Table aria-label="Available bonds">
                        <>
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
                        </>
                        <TableBody>
                          {farms.map(farm => {
                            //if (bond.displayName !== "unknown")
                            return (
                              <FarmData
                                networkId={networkId}
                                key={farm.index}
                                farm={farm}
                                onFarmLiquidityUpdate={farmLiquidityUpdate}
                                onFarmPanaUpdate={farmPanaUpdate}
                              />
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <>
                      {farms.map(farm => {
                        //if (bond.displayName !== "unknown")
                        return (
                          <FarmData
                            networkId={networkId}
                            key={farm.index}
                            farm={farm}
                            onFarmLiquidityUpdate={farmLiquidityUpdate}
                            onFarmPanaUpdate={farmPanaUpdate}
                          />
                        );
                      })}
                    </>
                  )}
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
