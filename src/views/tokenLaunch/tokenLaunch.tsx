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
import { trim } from "src/helpers";
import { isPendingTxn, txnButtonText } from "src/slices/PendingTxnsSlice";
import { useAppSelector } from "src/hooks";

function TokenLaunch() {
  // const dispatch = useDispatch();
  const history = useHistory();
  const { provider, address, connect, networkId } = useWeb3Context();
  usePathForNetwork({ pathName: "tokenlaunch", networkID: networkId, history });
  const isSmallScreen = useMediaQuery("(max-width: 733px)"); // change to breakpoint query

  const [zoomed, setZoomed] = useState(false);

  const pendingTransactions = useAppSelector(state => {
    return state.pendingTransactions;
  });

  const totalClaimable = 1;
  const modalButton = [];

  const onHarvestAll = () => {
    return true;
  }

  modalButton.push(
    <Button variant="contained" color="primary" className="connect-button" onClick={connect} key={1}>
      <Trans>Connect Wallet</Trans>
    </Button>,
  );

  return (
    <div id="token-launch-view">
      <Zoom in={true} onEntered={() => setZoomed(true)}>
        <Paper className="paper-format" elevation={0}>
          <Typography variant="h5" className="card-header" style={{ fontWeight: 600 }}>
            {t`Pana Token Launch`}
          </Typography>

          {!isSmallScreen && farms.length != 0 && (
            <>
              <Box
                marginBottom={'20px'}
                display="flex"
                flexDirection="column"
                alignItems="center"
                className={`global-claim-buttons ${isSmallScreen ? "small" : ""}`}
              >
                <Typography variant="h5" align="center" className="claimable-balance">
                  Claimable Rewards (Pana)
                </Typography>
                <Typography variant="h4" align="center" style={{ marginBottom: "10px" }}>
                  {trim(totalClaimable, 4) + " Pana"}
                </Typography>

                <Button
                  variant="contained"
                  color="primary"
                  className="transaction-button"
                  fullWidth
                  disabled={
                    isPendingTxn(pendingTransactions, "harvest_all_pana")
                    // ||
                    // !activeNotes
                    //   .map(note => note.fullyMatured)
                    //   .reduce((prev, current) => prev || current, false)
                  }
                  onClick={onHarvestAll}
                >
                  {txnButtonText(pendingTransactions, "harvest_all_pana", t`Harvest All Pana`)}
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
                        <TableCell align="left">
                          <Trans>Multiplier</Trans>
                        </TableCell>
                        <TableCell align="left">
                          <Trans>Liquidity</Trans>
                        </TableCell>
                        <TableCell align="left">
                          <Trans>My Stakes</Trans>
                        </TableCell>
                        <TableCell align="left">
                          <Trans>Per Day</Trans>
                        </TableCell>
                        <TableCell align="left">
                          <Trans>Rewards</Trans>
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
    </div>
  );
}

export default TokenLaunch;
