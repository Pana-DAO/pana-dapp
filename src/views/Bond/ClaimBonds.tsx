import "./ChooseBond.scss";

import { t } from "@lingui/macro";
import { Box, Button, Table, TableBody, TableContainer, Typography, Zoom, Paper } from "@material-ui/core";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import { isEmpty } from "lodash";
import { useDispatch } from "react-redux";
import { trim } from "src/helpers";
import { useAppSelector } from "src/hooks";
import { useWeb3Context } from "src/hooks/web3Context";
import { claimAllNotes, IUserNote, claimAllOldNotes } from "src/slices/BondSlice";
import { isPendingTxn, txnButtonText } from "src/slices/PendingTxnsSlice";

import AccordionSection from "./AccordionSection";

function ClaimBonds({ activeNotes, activeOldNotes }: { activeNotes: IUserNote[]; activeOldNotes: IUserNote[] }) {
  const dispatch = useDispatch();
  const { provider, address, networkId } = useWeb3Context();

  const currentIndex = useAppSelector(state => {
    return state.app.currentIndex ?? "1";
  });
  const isSmallScreen = useMediaQuery("(max-width: 733px)"); // change to breakpoint query

  const pendingTransactions = useAppSelector(state => {
    return state.pendingTransactions;
  });

  const fullyVestedBonds = activeNotes.filter(note => note.fullyMatured);
  const vestingBonds = activeNotes.filter(note => !note.fullyMatured);

  const fullyVestedOldBonds = activeOldNotes.filter(note => note.fullyMatured);
  const vestingOldBonds = activeOldNotes.filter(note => !note.fullyMatured);

  const total = fullyVestedBonds.reduce((a, b) => {
    return a + b.payout;
  }, 0);

  // const totalClaimable = view === 1 ? total : total * +currentIndex;
  const totalClaimable = total;

  const totalOldClaimable = fullyVestedOldBonds.reduce((a, b) => {
    return a + b.payout;
  }, 0);

  const onRedeemAll = () => {
    dispatch(claimAllNotes({ provider, networkID: networkId, address }));
  };

  const onOldRedeemAll = () => {
    dispatch(claimAllOldNotes({ provider, networkID: networkId, address }));
  };

  return (
    <>
      {!isEmpty(activeNotes) && (
        <Zoom in={true}>
          {/* <Paper headerText="Your Bonds"> */}
          <Paper className="bond-list">
            <Typography variant="h5" style={{ fontWeight: 600 }}>
              {t`Your Bonds`}
            </Typography>
            <Box>
              {!isSmallScreen && (
                <TableContainer>
                  <Table aria-label="Claimable bonds">
                    <TableBody>
                      <Box
                        display="flex"
                        flexDirection="column"
                        alignItems="center"
                        className={`global-claim-buttons ${isSmallScreen ? "small" : ""}`}
                      >
                        <Typography variant="h5" align="center" className="claimable-balance">
                          Claimable Balance
                        </Typography>
                        <Typography variant="h4" align="center" style={{ marginBottom: "10px" }}>
                          {trim(totalClaimable, 4) + " KARSHA"}
                        </Typography>

                        <Button
                          variant="contained"
                          color="primary"
                          className="transaction-button"
                          fullWidth
                          disabled={
                            isPendingTxn(pendingTransactions, "redeem_all_notes") ||
                            !activeNotes
                              .map(note => note.fullyMatured)
                              .reduce((prev, current) => prev || current, false)
                          }
                          onClick={onRedeemAll}
                        >
                          {txnButtonText(pendingTransactions, "redeem_all_notes", t`Claim all`)}
                        </Button>
                      </Box>
                      {!isEmpty(fullyVestedBonds) && (
                        <AccordionSection
                          bonds={fullyVestedBonds}
                          oldBonds={false}
                          title="Fully Vested Bonds"
                          vested={true}
                          isSmallScreen={isSmallScreen}
                        />
                      )}
                      {!isEmpty(vestingBonds) && (
                        <AccordionSection
                          bonds={vestingBonds}
                          oldBonds={false}
                          title="Vesting Bonds"
                          vested={false}
                          isSmallScreen={isSmallScreen}
                        />
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {isSmallScreen && (
                <>
                  <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    className={`global-claim-buttons ${isSmallScreen ? "small" : ""}`}
                  >
                    <Typography variant="h5" align="center" className="claimable-balance">
                      Claimable Balance
                    </Typography>
                    <Typography variant="h4" align="center" style={{ marginBottom: "10px" }}>
                      {trim(totalClaimable, 4) + " KARSHA"}
                    </Typography>

                    <Button
                      variant="contained"
                      color="primary"
                      className="transaction-button"
                      fullWidth
                      disabled={
                        isPendingTxn(pendingTransactions, "redeem_all_notes") ||
                        !activeNotes.map(note => note.fullyMatured).reduce((prev, current) => prev || current, false)
                      }
                      onClick={onRedeemAll}
                    >
                      {txnButtonText(pendingTransactions, "redeem_all_notes", t`Claim all`)}
                    </Button>
                  </Box>
                  {!isEmpty(fullyVestedBonds) && (
                    <AccordionSection
                      bonds={fullyVestedBonds}
                      oldBonds={false}
                      title="Fully Vested Bonds"
                      vested={true}
                      isSmallScreen={isSmallScreen}
                    />
                  )}
                  {!isEmpty(vestingBonds) && (
                    <AccordionSection
                      bonds={vestingBonds}
                      oldBonds={false}
                      title="Vesting Bonds"
                      vested={false}
                      isSmallScreen={isSmallScreen}
                    />
                  )}
                </>
              )}
            </Box>
          </Paper>
        </Zoom>
      )}
      {!isEmpty(activeOldNotes) && (
        <Zoom in={true}>
          {/* <Paper headerText="Your v1 Bonds (please claim all of them soon)"> */}
          <Paper className="bond-list">
            <Typography variant="h5" style={{ fontWeight: 600 }}>
              {t`Your Prior Bonds`}
            </Typography>
            <Box>
              {!isSmallScreen && (
                <TableContainer>
                  <Table aria-label="Claimable bonds">
                    <TableBody>
                      <Box
                        display="flex"
                        flexDirection="column"
                        alignItems="center"
                        className={`global-claim-buttons ${isSmallScreen ? "small" : ""}`}
                      >
                        <Typography variant="h5" align="center" className="claimable-balance">
                          Claimable Balance
                        </Typography>
                        <Typography variant="h4" align="center" style={{ marginBottom: "10px" }}>
                          {trim(totalOldClaimable, 4) + " KARSHA"}
                        </Typography>

                        <Button
                          variant="contained"
                          color="primary"
                          className="transaction-button"
                          fullWidth
                          disabled={
                            isPendingTxn(pendingTransactions, "redeem_all_old_notes") ||
                            !activeOldNotes
                              .map(note => note.fullyMatured)
                              .reduce((prev, current) => prev || current, false)
                          }
                          onClick={onOldRedeemAll}
                        >
                          {txnButtonText(pendingTransactions, "redeem_all_old_notes", t`Claim all`)}
                        </Button>
                      </Box>
                      {!isEmpty(fullyVestedOldBonds) && (
                        <AccordionSection
                          bonds={fullyVestedOldBonds}
                          oldBonds={true}
                          title="Fully Vested Bonds"
                          vested={true}
                          isSmallScreen={isSmallScreen}
                        />
                      )}
                      {!isEmpty(vestingOldBonds) && (
                        <AccordionSection
                          bonds={vestingOldBonds}
                          oldBonds={true}
                          title="Vesting Bonds"
                          vested={false}
                          isSmallScreen={isSmallScreen}
                        />
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {isSmallScreen && (
                <>
                  <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    className={`global-claim-buttons ${isSmallScreen ? "small" : ""}`}
                  >
                    <Typography variant="h5" align="center" className="claimable-balance">
                      Claimable Balance
                    </Typography>
                    <Typography variant="h4" align="center" style={{ marginBottom: "10px" }}>
                      {trim(totalOldClaimable, 4) + " KARSHA"}
                    </Typography>

                    <Button
                      variant="contained"
                      color="primary"
                      className="transaction-button"
                      fullWidth
                      disabled={
                        isPendingTxn(pendingTransactions, "redeem_all_old_notes") ||
                        !activeOldNotes.map(note => note.fullyMatured).reduce((prev, current) => prev || current, false)
                      }
                      onClick={onOldRedeemAll}
                    >
                      {txnButtonText(pendingTransactions, "redeem_all_old_notes", t`Claim all`)}
                    </Button>
                  </Box>
                  {!isEmpty(fullyVestedOldBonds) && (
                    <AccordionSection
                      bonds={fullyVestedOldBonds}
                      oldBonds={true}
                      title="Fully Vested Bonds"
                      vested={true}
                      isSmallScreen={isSmallScreen}
                    />
                  )}
                  {!isEmpty(vestingOldBonds) && (
                    <AccordionSection
                      bonds={vestingOldBonds}
                      oldBonds={true}
                      title="Vesting Bonds"
                      vested={false}
                      isSmallScreen={isSmallScreen}
                    />
                  )}
                </>
              )}
            </Box>
          </Paper>
        </Zoom>
      )}
    </>
  );
}

export default ClaimBonds;
