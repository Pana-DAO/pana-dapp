import "./treasury-dashboard.scss";

// import { Box, Container, Grid, useMediaQuery, Zoom } from "@material-ui/core";
import { Box, Button, Container, Divider, Typography, useMediaQuery, Grid, Paper } from "@material-ui/core";
import { memo } from "react";
import { useWeb3Context } from "src/hooks/web3Context";

// import {
//   MarketValueGraph,
//   PANAStakedGraph,
//   ProtocolOwnedLiquidityGraph,
//   RiskFreeValueGraph,
//   RunwayAvailableGraph,
//   TotalValueDepositedGraph,
// } from "./components/Graph/Graph";
import { CurrentIndex, KARSHAPrice, PANAPrice, ExchangeAPY, CircSupply, MarketCap } from "./components/Metric/Metric";
import { switchNetwork } from "src/helpers/NetworkHelper";
import { NetworkId, NETWORKS } from "src/constants";
import ConnectButton from "src/components/ConnectButton/ConnectButton";

const TreasuryDashboard = memo(() => {
  const isSmallScreen = useMediaQuery("(max-width: 650px)");
  const isVerySmallScreen = useMediaQuery("(max-width: 379px)");
  const { provider, address, networkId } = useWeb3Context();

  const arbitrum_testnet = NETWORKS[NetworkId.ARBITRUM_TESTNET];

  const handleSwitchChain = (id: any) => {
    return () => {
      switchNetwork({ provider: provider, networkId: id });
    };
  };

  const chooseButtonArea = () => {
    if (!address)
      return (
        <div className="staking-area">
          <div className="stake-wallet-notification">
            <div className="wallet-menu" id="wallet-menu">
              <ConnectButton />
            </div>
            {/* <Typography variant="h6">Connect your wallet</Typography> */}
          </div>
        </div>
      );
    if (networkId != arbitrum_testnet.chainId)
      return (
        <div className={`stake-user-data`}>
          <Divider />
          <Box width="100%" alignItems={"center"} display="flex" flexDirection="column" p={1}>
          <Typography variant="h5" style={{ margin: "15px 0 10px 0" }}>
              You are connected to an incompatible network.
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
        </div>
      );
  };

  return (
    <div id="treasury-dashboard-view" className={`${isSmallScreen && "smaller"} ${isVerySmallScreen && "very-small"}`}>
      <Container
        style={{
          paddingLeft: isSmallScreen || isVerySmallScreen ? "0" : "3.3rem",
          paddingRight: isSmallScreen || isVerySmallScreen ? "0" : "3.3rem",
        }}
      >
        <Box className="hero-metrics">
          <Paper className="paper-format-treasury pana-card dashboard-metrics">
            {networkId === NetworkId.ARBITRUM_TESTNET ? (
              <>
                <Grid container direction="row" spacing={1}>
                  <MarketCap />
                  <PANAPrice />
                  <KARSHAPrice />
                  {<CircSupply />}
                  {/* <BackingPerPANA /> */}
                  <ExchangeAPY />
                  <CurrentIndex />
                  {/* <FiveDayRate />
                  <NextRewardYield /> */}
                </Grid>
              </>
            ) : (
              <></>
            )}
            {chooseButtonArea()}
          </Paper>
        </Box>

        {/* <Zoom in={true}>
          <Grid container spacing={2} className="data-grid">
            <Grid item lg={6} md={6} sm={12} xs={12}>
              <Paper className="pana-card pana-chart-card">
                <TotalValueDepositedGraph />
              </Paper>
            </Grid>

            <Grid item lg={6} md={6} sm={12} xs={12}>
              <Paper className="pana-card pana-chart-card">
                <MarketValueGraph />
              </Paper>
            </Grid>

            <Grid item lg={6} md={6} sm={12} xs={12}>
              <Paper className="pana-card pana-chart-card">
                <RiskFreeValueGraph />
              </Paper>
            </Grid>

            <Grid item lg={6} md={6} sm={12} xs={12}>
              <Paper className="pana-card pana-chart-card">
                <ProtocolOwnedLiquidityGraph />
              </Paper>
            </Grid>

            <Grid item lg={6} md={6} sm={12} xs={12}>
              <Paper className="pana-card pana-chart-card">
                <PANAStakedGraph />
              </Paper>
            </Grid>

            <Grid item lg={6} md={6} sm={12} xs={12}>
              <Paper className="pana-card pana-chart-card">
                <RunwayAvailableGraph />
              </Paper>
            </Grid>
          </Grid>
        </Zoom> */}
      </Container>
    </div>
  );
});

export default TreasuryDashboard;
