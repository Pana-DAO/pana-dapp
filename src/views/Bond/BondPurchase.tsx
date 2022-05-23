import { t, Trans } from "@lingui/macro";
import {
  Box,
  Button,
  FormControl,
  Slide,
  Tooltip,
  SvgIcon,
  Typography,
  OutlinedInput,
  InputAdornment,
  InputLabel,
} from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import { InfoOutlined } from "@material-ui/icons";
import { ethers } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useAppSelector } from "src/hooks";
import { useWeb3Context } from "src/hooks/web3Context";
import { changeApproval, getSingleBond, IBond, purchaseBond } from "src/slices/BondSlice";
import { isPendingTxn, txnButtonText } from "src/slices/PendingTxnsSlice";
import { AppDispatch } from "src/store";

import ConnectButton from "../../components/ConnectButton/ConnectButton";
import { shorten, trim } from "../../helpers";
import { error } from "../../slices/MessagesSlice";
import { DisplayBondDiscount } from "./Bond";

function BondPurchase({
  bond,
  slippage,
  recipientAddress,
}: {
  bond: IBond;
  slippage: number;
  recipientAddress: string;
}) {
  const SECONDS_TO_REFRESH = 60;
  const dispatch = useDispatch<AppDispatch>();
  const { provider, address, networkId } = useWeb3Context();
  const currentIndex = useAppSelector(state => {
    return state.app.currentIndex ?? "1";
  });

  const [quantity, setQuantity] = useState("");
  const [secondsToRefresh, setSecondsToRefresh] = useState(SECONDS_TO_REFRESH);

  const isBondLoading = useAppSelector(state => state.bonding.loading ?? true);

  const balance = useAppSelector(state => state.bonding.balances[bond.quoteToken]);

  const maxBondable = +bond.maxPayoutOrCapacityInQuote;

  const balanceNumber: number = useMemo(
    () => (balance ? +balance.balance / Math.pow(10, bond.quoteDecimals) : 0),
    [balance],
  );

  const pendingTransactions = useAppSelector(state => {
    return state.pendingTransactions;
  });

  async function onBond() {
    if (quantity === "" || Number(quantity) <= 0) {
      dispatch(error(t`Please enter a value!`));
    } else if (Number(quantity) > maxBondable) {
      dispatch(
        error(
          t`Max capacity is ${maxBondable} ${bond.displayName} for ${
            trim(+bond.maxPayoutOrCapacityInBase / +currentIndex, 4) || "0"
          } KARSHA. Click Max to autocomplete.`,
        ),
      );
    } else {
      dispatch(
        purchaseBond({
          amount: ethers.utils.parseUnits(quantity, bond.quoteDecimals),
          networkID: networkId,
          provider,
          bond,
          maxPrice: Math.round(Number(bond.priceTokenBigNumber.toString()) * (1 + slippage / 100)).toString(),
          address: recipientAddress,
        }),
      ).then(() => clearInput());
    }
  }

  const clearInput = () => {
    setQuantity("");
  };

  const hasAllowance = useCallback(() => {
    return +balance?.allowance > 0;
  }, [balance]);

  const setMax = () => {
    let maxQ: string;
    const maxBondableNumber = maxBondable * 0.999;
    if (balanceNumber > maxBondableNumber) {
      maxQ = maxBondableNumber.toString();
    } else {
      maxQ = ethers.utils.formatUnits(balance.balance, bond.quoteDecimals);
    }
    setQuantity(maxQ);
  };

  useEffect(() => {
    let interval: NodeJS.Timer | undefined;
    if (secondsToRefresh > 0) {
      interval = setInterval(() => {
        setSecondsToRefresh(secondsToRefresh => secondsToRefresh - 1);
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
      dispatch(getSingleBond({ bondIndex: bond.index, address, networkID: networkId, provider }));
      setSecondsToRefresh(SECONDS_TO_REFRESH);
    }
    return () => clearInterval(interval!);
  }, [secondsToRefresh, quantity]);

  const onSeekApproval = async () => {
    dispatch(changeApproval({ address, provider, networkID: networkId, bond }));
  };

  // const displayUnits = bond.displayUnits;

  const isAllowanceDataLoading = useAppSelector(state => state.bonding.balanceLoading[bond.quoteToken]);

  return (
    <Box display="flex" flexDirection="column">
      <Box display="flex" justifyContent="space-around" flexWrap="wrap">
        {!address ? (
          <ConnectButton />
        ) : (
          <>
            {isAllowanceDataLoading ? (
              <Skeleton width="200px" />
            ) : (
              <>
                {!hasAllowance() ? (
                  <div className="help-text">
                    <em>
                      <Typography variant="body1" align="center" color="textSecondary">
                        <Trans>First time bonding</Trans> <b>{bond.displayName}</b>? <br />{" "}
                        <Trans>Please approve Pana Dao to use your</Trans> <b>{bond.displayName}</b>{" "}
                        <Trans>for bonding</Trans>.
                      </Typography>
                    </em>
                  </div>
                ) : (
                  <FormControl className="pana-input" variant="outlined">
                    <InputLabel className="pana-input-label" htmlFor="outlined-adornment-amount">
                      Amount
                    </InputLabel>
                    <OutlinedInput
                      id="outlined-adornment-amount"
                      type="number"
                      value={quantity}
                      onChange={e => setQuantity(e.target.value)}
                      endAdornment={<InputAdornment onClick={setMax} position="end">{t`Max`}</InputAdornment>}
                      aria-describedby="outlined-weight-helper-text"
                      inputProps={{
                        "aria-label": "Amount",
                      }}
                    />
                  </FormControl>
                )}
                {bond.soldOut ? (
                  <Button
                    variant="contained"
                    color="primary"
                    id="bond-btn"
                    className="transaction-button"
                    disabled={true}
                  >
                    <Trans>Sold Out</Trans>
                  </Button>
                ) : balance ? (
                  hasAllowance() ? (
                    <Button
                      variant="contained"
                      color="primary"
                      id="bond-btn"
                      className="transaction-button"
                      disabled={isPendingTxn(pendingTransactions, "bond_" + bond.displayName)}
                      onClick={onBond}
                    >
                      {txnButtonText(pendingTransactions, "bond_" + bond.displayName, "Bond")}
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      color="primary"
                      id="bond-approve-btn"
                      className="transaction-button"
                      disabled={isPendingTxn(pendingTransactions, `approve_${bond.displayName}_bonding`)}
                      onClick={onSeekApproval}
                    >
                      {txnButtonText(pendingTransactions, `approve_${bond.displayName}_bonding`, "Approve")}
                    </Button>
                  )
                ) : (
                  <Skeleton width="300px" height={40} />
                )}
              </>
            )}{" "}
          </>
        )}
      </Box>

      <Slide direction="left" in={true} mountOnEnter unmountOnExit {...{ timeout: 533 }}>
        <Box className="bond-data">
          <Box display="flex" className="flxrow data-row" flexDirection="row" justifyContent="space-between">
            <Box display="flex" flexDirection="row">
              <Typography>
                <Trans>Your Balance</Trans>
              </Typography>
            </Box>
            <Typography className="price-data">
              {isBondLoading ? <Skeleton width="100px" /> : `${trim(balanceNumber, 4)} ${bond.displayName}`}
            </Typography>
          </Box>
          <Box display="flex" flexDirection="row" justifyContent="space-between">
            <Box display="flex" flexDirection="row">
              <Typography>
                <Trans>You Will Get</Trans>
              </Typography>
              &nbsp;
              <Tooltip
                arrow
                title="Actual KARSHA amount you receive will be lower at the end of the term due to rebase accrual."
              >
                <SvgIcon viewBox="0 0 30 30" component={InfoOutlined}></SvgIcon>
              </Tooltip>
            </Box>
            <Typography id="bond-value-id" className="price-data">
              {isBondLoading ? (
                <Skeleton width="100px" />
              ) : (
                `≈${trim(+quantity / bond.priceToken / +currentIndex, 4) || "0"} KARSHA (≈${trim(+quantity / bond.priceToken, 4) || "0"} PANA)`
              )}
            </Typography>
          </Box>
          <Box display="flex" className="flxrow data-row" flexDirection="row" justifyContent="space-between">
            <Box display="flex" flexDirection="row">
              <Typography>{t`Max You Can Buy`}</Typography>
            </Box>
            <Typography className="price-data">
              {isBondLoading ? (
                <Skeleton width="100px" />
              ) : (
                `${trim(+bond.maxPayoutOrCapacityInBase / +currentIndex, 4) || "0"} KARSHA (≈${
                  trim(+bond.maxPayoutOrCapacityInQuote, 4) || "0"
                } ${bond.displayName})`
              )}
            </Typography>
          </Box>
          <Box display="flex" className="flxrow data-row" flexDirection="row" justifyContent="space-between">
            <Typography>
              <Trans>Discount</Trans>
            </Typography>
            <Typography>
              {isBondLoading ? <Skeleton width="100px" /> : <DisplayBondDiscount key={bond.displayName} bond={bond} />}
            </Typography>
          </Box>

          <Box display="flex" className="flxrow data-row" flexDirection="row" justifyContent="space-between">
            <Typography>{t`Duration`}</Typography>
            <Typography>{isBondLoading ? <Skeleton width="100px" /> : bond.duration}</Typography>
          </Box>
          {recipientAddress !== address && (
            <>
              <Box display="flex" flexDirection="row" justifyContent="space-between">
                <Typography>{t`Recipient`}</Typography>
                <Typography>{isBondLoading ? <Skeleton width="100px" /> : shorten(recipientAddress)}</Typography>
              </Box>
            </>
          )}
        </Box>
      </Slide>
      <div className="help-text">
        <em>
          <Typography variant="body2">
            Important: Bonds are auto-wrapped (accrue rebase rewards). Simply claim as KARSHA at the end of the
            term.
          </Typography>
        </em>
      </div>
    </Box>
  );
}

export default BondPurchase;
