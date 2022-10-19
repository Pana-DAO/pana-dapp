import "./exchange.scss";

import { t, Trans } from "@lingui/macro";
import {
  Box,
  Button,
  Divider,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Typography,
  Zoom,
  Paper,
} from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import { ethers } from "ethers";
import { ChangeEventHandler, useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { useHistory } from "react-router";
import { useAppSelector } from "src/hooks";
import { usePathForNetwork } from "src/hooks/usePathForNetwork";
import { useWeb3Context } from "src/hooks/web3Context";
import { isPendingTxn, txnButtonText } from "src/slices/PendingTxnsSlice";

import RebaseTimer from "../../components/RebaseTimer/RebaseTimer";
import { trim } from "../../helpers";
import { changeApproval, changeExchange } from "../../slices/ExchangeThunk";
import { error } from "../../slices/MessagesSlice";
import { ReactElement } from "react";
import { GridSize } from "@material-ui/core";
function Exchange() {
  const dispatch = useDispatch();
  const history = useHistory();
  const { provider, address, connect, networkId } = useWeb3Context();
  usePathForNetwork({ pathName: "exchange", networkID: networkId, history });

  const [zoomed, setZoomed] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [confirmation, setConfirmation] = useState(false);

  const isAppLoading = useAppSelector(state => state.app.loading);
  const currentIndex = useAppSelector(state => {
    return state.app.currentIndex;
  });
  const fiveDayRate = useAppSelector(state => {
    return state.app.fiveDayRate;
  });
  const panabalance = useAppSelector(state => {
    return state.account.balances && state.account.balances.pana;
  });
  const karshabalance = useAppSelector(state => {
    return state.account.balances && state.account.balances.karsha;
  });

  const stakeAllowance = useAppSelector(state => {
    return (state.account.staking && state.account.staking.panaStake) || 0;
  });
  const exchangeAllowance = useAppSelector(state => {
    return (state.account.staking && state.account.staking.panaUnstake) || 0;
  });

  const stakingRebase = useAppSelector(state => {
    return state.app.stakingRebase || 0;
  });
  const stakingAPY = useAppSelector(state => {
    return state.app.stakingAPY || 0;
  });
  const stakingTVL = useAppSelector(state => {
    return state.app.stakingTVL || 0;
  });

  const pendingTransactions = useAppSelector(state => {
    return state.pendingTransactions;
  });

  const setMax = () => {
    setQuantity(karshabalance);
  };

  const onSeekApproval = async (token: string) => {
    await dispatch(changeApproval({ address, token, provider, networkID: networkId, version2: true }));
  };

  const onChangeStake = async (action: string) => {
    // eslint-disable-next-line no-restricted-globals
    if (isNaN(Number(quantity)) || Number(quantity) === 0 || Number(quantity) < 0) {
      // eslint-disable-next-line no-alert
      return dispatch(error(t`Please enter a value!`));
    }

    // 1st catch if quantity > balance
    const gweiValue = ethers.utils.parseUnits(quantity.toString(), 18);
    if (action === "exchange" && gweiValue.gt(ethers.utils.parseUnits(karshabalance, 18))) {
      return dispatch(error(t`You do not have enough Karsha to complete this transaction.`));
    }

    const formQuant = async () => {
      return quantity;
    };

    await dispatch(
      changeExchange({
        address,
        action,
        value: await formQuant(),
        provider,
        networkID: networkId,
        rebase: !confirmation,
      }),
    );
  };

  const hasAllowance = useCallback(
    token => {
      if (token === "pana") return stakeAllowance > 0;
      if (token === "karsha") return exchangeAllowance > 0;
      return 0;
    },
    [stakeAllowance, exchangeAllowance],
  );

  const isAllowanceDataLoading = stakeAllowance == null || exchangeAllowance == null;

  const modalButton = [];

  modalButton.push(
    <Button variant="contained" color="primary" className="connect-button" onClick={connect} key={1}>
      <Trans>Connect Wallet</Trans>
    </Button>,
  );

  const handleChangeQuantity = useCallback<ChangeEventHandler<HTMLInputElement>>(e => {
    if (Number(e.target.value) >= 0) setQuantity(e.target.value);
  }, []);

  const karshaAsPana = Number(karshabalance) * Number(currentIndex);
  const trimmedBalance = Number(
    [karshaAsPana]
      .filter(Boolean)
      .map(balance => Number(balance))
      .reduce((a, b) => a + b, 0)
      .toFixed(4),
  );
  const trimmedExchangingAPY = trim(Math.round(stakingAPY * 100), 2);

  const stakingRebasePercentage = trim(stakingRebase * 100, 4);
  const nextRewardValue = trim((Number(stakingRebasePercentage) / 100) * trimmedBalance, 4);

  const formattedTrimmedExchangingAPY = new Intl.NumberFormat("en-US").format(Number(trimmedExchangingAPY));
  // TODO Enable TVL
  const formattedExchangingTVL = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(stakingTVL);
  const formattedCurrentIndex = trim(Number(currentIndex), 4);

  const MetricContent = ({
    label,
    xsUnit,
    isLoading,
    metric,
    clsName,
  }: {
    label: any;
    xsUnit: GridSize;
    isLoading: boolean;
    metric: any;
    clsName: string;
  }): ReactElement => {
    return (
      <Grid item xs={xsUnit} className={clsName}>
        <Typography variant="h5" color="textSecondary" className="card-title-text">
          {label}
        </Typography>
        <Typography variant="h4" style={{ fontWeight: 500 }}>
          <>{isLoading ? <Skeleton width="100px" /> : metric}</>
        </Typography>
      </Grid>
    );
  };

  const DataRowContent = ({
    title,
    id,
    balance,
    isLoading,
  }: {
    title: any;
    id?: string;
    balance: any;
    isLoading: boolean;
  }): ReactElement => {
    return (
      <Box id={id} display="flex" className="flxrow data-row" flexDirection="row" justifyContent="space-between">
        <Box display="flex" flexDirection="row">
          <Typography>{title}</Typography>
        </Box>
        <Typography className="price-data">{isLoading ? <Skeleton width="100px" /> : balance}</Typography>
      </Box>
    );
  };

  return (
    <div id="exchange-view">
      <Zoom in={true} onEntered={() => setZoomed(true)}>
        <Paper className="paper-format" elevation={0}>
          <Typography variant="h5" style={{ fontWeight: 600 }}>
            {t`Unwrap`}
          </Typography>
          <Typography variant="h4" style={{ fontWeight: 500 }}>
            <RebaseTimer />
          </Typography>
          <Grid container direction="column" spacing={2}>
            <Grid container direction="row" spacing={2}>
              <MetricContent
                clsName="exchange-apy"
                label={t`APY`}
                xsUnit={6}
                metric={`${formattedTrimmedExchangingAPY}%`}
                isLoading={stakingAPY ? false : true}
              />
              {/* <Metric
                  className="exchange-tvl"
                  label={t`Total Value Deposited`}
                  metric={formattedExchangingTVL}
                  isLoading={stakingTVL ? false : true}
                /> */}
              <MetricContent
                clsName="exchange-index"
                label={t`Current Index`}
                xsUnit={6}
                metric={`${formattedCurrentIndex} Pana`}
                isLoading={currentIndex ? false : true}
              />
            </Grid>
            <div className="staking-area">
              {!address ? (
                <div className="exchange-wallet-notification">
                  <div className="wallet-menu" id="wallet-menu">
                    {modalButton}
                  </div>
                  <Typography variant="h6">
                    <Trans>Connect your wallet to exchange Karsha</Trans>
                  </Typography>
                </div>
              ) : (
                <>
                  <Box className="exchange-action-area">
                    <Grid container className="exchange-action-row">
                      <Grid item xs={12} sm={8} className="exchange-grid-item">
                        {address && !isAllowanceDataLoading ? (
                          !hasAllowance("karsha") ? (
                            <Box mt={"10px"}>
                              <Typography variant="body1" className="exchange-note" color="textSecondary">
                                <>
                                  <Trans>First time exchanging</Trans> <b>Karsha</b>?
                                  <br />
                                  <Trans>Please approve Pana Dao to use your</Trans> <b>Karsha</b>{" "}
                                  <Trans>for exchanging</Trans>.
                                </>
                              </Typography>
                            </Box>
                          ) : (
                            <FormControl className="pana-input" variant="outlined" color="primary">
                              <InputLabel htmlFor="amount-input"></InputLabel>
                              <OutlinedInput
                                id="amount-input"
                                type="number"
                                placeholder="Enter an amount"
                                className="exchange-input"
                                value={quantity}
                                onChange={handleChangeQuantity}
                                labelWidth={0}
                                endAdornment={
                                  <InputAdornment position="end">
                                    <Button variant="text" onClick={setMax} color="inherit">
                                      Max
                                    </Button>
                                  </InputAdornment>
                                }
                              />
                            </FormControl>
                          )
                        ) : (
                          <Skeleton width="150px" />
                        )}
                      </Grid>
                      <Grid item xs={12} sm={4} className="exchange-grid-item">
                        <Box m={-2}>
                          {isAllowanceDataLoading ? (
                            <Skeleton />
                          ) : address && hasAllowance("karsha") ? (
                            <>
                              <Button
                                className="exchange-button"
                                variant="contained"
                                color="primary"
                                disabled={isPendingTxn(pendingTransactions, "exchanging")}
                                onClick={() => {
                                  onChangeStake("exchange");
                                }}
                              >
                                {txnButtonText(pendingTransactions, "exchanging", `${t`Unwrap Karsha to Pana`}`)}
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                className="exchange-button"
                                variant="contained"
                                color="primary"
                                disabled={isPendingTxn(pendingTransactions, "approve_exchanging")}
                                onClick={() => {
                                  onSeekApproval("karsha");
                                }}
                              >
                                {txnButtonText(pendingTransactions, "approve_exchanging", t`Approve`)}
                              </Button>
                            </>
                          )}
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                  <div className="exchange-user-data">
                    <DataRowContent
                      title={t`Unwrapped Balance`}
                      id="user-balance"
                      balance={`${trim(Number(panabalance), 4)} Pana`}
                      isLoading={isAppLoading}
                    />
                    <DataRowContent
                      title={t`Wrapped Balance`}
                      balance={`${trim(Number(karshabalance), 4)} Karsha`}
                      isLoading={isAppLoading}
                    />
                    <Divider color="secondary" />
                    <DataRowContent
                      title={t`Next Reward Amount`}
                      balance={`${nextRewardValue} Pana`}
                      isLoading={isAppLoading}
                    />
                    <DataRowContent
                      title={t`Next Reward Yield`}
                      balance={`${stakingRebasePercentage}%`}
                      isLoading={isAppLoading}
                    />
                    <DataRowContent
                      title={t`ROI (5-Day Rate)`}
                      balance={`${trim(Number(fiveDayRate) * 100, 4)}%`}
                      isLoading={isAppLoading}
                    />
                  </div>
                </>
              )}
            </div>
          </Grid>
        </Paper>
      </Zoom>
      {/* NOTE (appleseed-olyzaps) olyzaps disabled until  contracts */}
      {/* <ZapCta /> */}
    </div>
  );
}

export default Exchange;
