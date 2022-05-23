import "./ChooseBond.scss";

import { t } from "@lingui/macro";
import { Box, Button, TableCell, TableRow, Typography } from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import TokenStack from "src/lib/PanaTokenStack";
import { useDispatch } from "react-redux";
import { useAppSelector, useWeb3Context } from "src/hooks";
import { claimSingleNote, IUserNote } from "src/slices/BondSlice";
import { isPendingTxn, txnButtonText } from "src/slices/PendingTxnsSlice";

import { trim } from "../../helpers";

export function ClaimBondTableData({ userNote, oldBonds }: { userNote: IUserNote; oldBonds: boolean }) {
  const dispatch = useDispatch();
  const { address, provider, networkId } = useWeb3Context();
  const currentIndex = useAppSelector(state => state.app.currentIndex);

  const note = userNote;
  const bondName = note.displayName;

  const isAppLoading = useAppSelector(state => state.app.loading ?? true);

  const pendingTransactions = useAppSelector(state => {
    return state.pendingTransactions;
  });

  const vestingPeriod = () => note.timeLeft;

  async function onRedeem(index: number) {
    await dispatch(claimSingleNote({ provider, networkID: networkId, address, indexes: [index] }));
  }

  return (
    <TableRow id={`${bondName}--claim`}>
      {/* Name */}
      <TableCell align="left" className="bond-name-cell">
        <TokenStack tokens={note.bondIconSvg} />
        <div className="bond-name">
          <Typography variant="body1">{bondName ? bondName : <Skeleton width={100} />}</Typography>
        </div>
      </TableCell>
      {/* Remaining Duration */}
      <TableCell align="center">{note.originalDuration}</TableCell>
      {/* Remaining Duration */}
      <TableCell align="center">{vestingPeriod()}</TableCell>
      {/* Payout */}
      <TableCell align="center">
        {/* {note.payout && currentIndex ? trim(note.payout * Number(currentIndex), 4) + " PANA" : <Skeleton width={100} />} */}
        {trim(note.payout, 4) + " KARSHA"}
      </TableCell>
      {/* Claim Button */}
      <TableCell align="right">
        {vestingPeriod() === "Fully Vested" && !oldBonds ? (
          <Button
            variant="outlined"
            color="primary"
            disabled={
              isPendingTxn(pendingTransactions, "redeem_note_" + note.index) ||
              isPendingTxn(pendingTransactions, "redeem_all_notes")
            }
            onClick={() => onRedeem(note.index)}
          >
            <Typography variant="h6">
              {txnButtonText(pendingTransactions, "redeem_note_" + note.index, "Claim")}
            </Typography>
          </Button>
        ) : (
          <div style={{ width: "84px" }} />
        )}
      </TableCell>
    </TableRow>
  );
}

export function ClaimBondCardData({ userNote, oldBonds }: { userNote: IUserNote; oldBonds: boolean }) {
  const dispatch = useDispatch();
  const { address, provider, networkId } = useWeb3Context();
  const currentIndex = useAppSelector(state => state.app.currentIndex);

  const note = userNote;
  const bondName = note.displayName;

  const pendingTransactions = useAppSelector(state => {
    return state.pendingTransactions;
  });

  const vestingPeriod = () => note.timeLeft;

  async function onRedeem(index: number) {
    await dispatch(claimSingleNote({ provider, networkID: networkId, address, indexes: [index] }));
  }

  return (
    <Box id={`${bondName}--claim`} className="claim-bond-data-card bond-data-card" style={{ marginBottom: "30px" }}>
      <Box className="bond-pair">
        <TokenStack tokens={note.bondIconSvg} />
        <Box className="bond-name">
          <Typography>{bondName}</Typography>
        </Box>
      </Box>

      <Box display="flex" flexDirection="row" justifyContent="space-between" className="data-row">
        <Typography>Claimable</Typography>
        <Typography>
          {note.payout && currentIndex ? (
            trim(note.payout * Number(currentIndex), 4) + " KARSHA"
          ) : (
            <Skeleton width={100} />
          )}
        </Typography>
      </Box>

      <Box display="flex" flexDirection="row" justifyContent="space-between" mb={"20px"}>
        <Typography>Remaining Duration</Typography>
        <Typography>{vestingPeriod()}</Typography>
      </Box>
      {note.fullyMatured && !oldBonds && (
        <Box display="flex" justifyContent="space-around" alignItems="center" className="claim-bond-card-buttons">
          <Button
            variant="outlined"
            color="primary"
            disabled={
              isPendingTxn(pendingTransactions, "redeem_note_" + note.index) ||
              isPendingTxn(pendingTransactions, "redeem_all_notes")
            }
            onClick={() => onRedeem(note.index)}
          >
            <Typography variant="h5">
              {txnButtonText(pendingTransactions, "redeem_note_" + note.index, t`Claim`)}
            </Typography>
          </Button>
        </Box>
      )}
    </Box>
  );
}
