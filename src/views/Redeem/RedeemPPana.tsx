import "./redeemPPana.scss";
import { t, Trans } from "@lingui/macro";
import {
  Box,
  Button,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Typography,
  Zoom,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  GridSize,
  Tooltip,
  SvgIcon,
  Paper,
} from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import { InfoOutlined } from "@material-ui/icons";
import { useState, useCallback, ChangeEventHandler } from "react";
import { useDispatch } from "react-redux";
import { useHistory } from "react-router";
import { usePathForNetwork } from "src/hooks/usePathForNetwork";
import { useWeb3Context } from "src/hooks/web3Context";
import { useAppSelector } from "src/hooks";
import { trim } from "../../helpers";
import { changePPanaExercise, changeApproval, changePPanaClaim } from "../../slices/ExchangeThunk";
import { isPendingTxn, txnButtonText } from "src/slices/PendingTxnsSlice";
import { ethers } from "ethers";
import { error } from "src/slices/MessagesSlice";
import { toInteger } from "lodash";
// import { prettifySeconds } from "src/helpers";
import { ReactElement } from "react";

function RedeemPPana() {
  const dispatch = useDispatch();
  const history = useHistory();
  const { provider, address, connect, networkId } = useWeb3Context();
  usePathForNetwork({ pathName: "redeem/ppana", networkID: networkId, history });
  const [zoomed, setZoomed] = useState(false);
  const [view, setView] = useState<number>(0);
  const [quantity, setQuantity] = useState("");
  const pPanaBalance = useAppSelector(state => {
    return state.account.balances && toInteger(state.account.balances.pPana).toString();
  });
  const daiBalance = useAppSelector(state => {
    return state.account.balances && state.account.balances.usdc;
  });

  const pPanaRedeemAllowance = useAppSelector(state => {
    return (state.account.staking && state.account.redeem.pPanaRedeem) || 0;
  });
  const pPanaDAIAllowance = useAppSelector(state => {
    return (state.account.staking && state.account.redeem.pPanaDAI) || 0;
  });

  const pendingTransactions = useAppSelector(state => {
    return state.pendingTransactions;
  });

  const redeemablefor = useAppSelector(state => {
    return state.account.balances && toInteger(state.account.balances.redeemablePpana).toString();
  });

  const onSeekApproval = async (token: string) => {
    await dispatch(changeApproval({ address, token, provider, networkID: networkId, version2: true }));
  };

  const hasAllowance = useCallback(
    token => {
      if (token === "pPana") return pPanaRedeemAllowance > 0;
      if (token === "pPanaDAI") return pPanaDAIAllowance > 0;
      return 0;
    },
    [pPanaRedeemAllowance, pPanaDAIAllowance],
  );

  const isAllowanceDataLoading = pPanaRedeemAllowance == null || pPanaDAIAllowance == null;

  const setMaxPPana = () => {
    if (pPanaTerms?.supplyBased) setQuantity(redeemablefor);
    else setQuantity(pPanaBalance);
  };
  const setMaxDAI = () => {
    setQuantity(daiBalance);
  };

  const pPanaTerms = useAppSelector(state => {
    return state.account.pPanaTerms;
  });

  const onPPanaExercise = async (action: string) => {
    // eslint-disable-next-line no-restricted-globals
    if (isNaN(Number(quantity)) || Number(quantity) === 0 || Number(quantity) < 0) {
      // eslint-disable-next-line no-alert
      return dispatch(error(t`Please enter a value!`));
    }

    // 1st catch if quantity > balance
    const gweiValue = ethers.utils.parseUnits(quantity.toString(), 18);
    if (
      action === "exercise" &&
      (gweiValue.gt(ethers.utils.parseUnits(pPanaBalance, 18)) || gweiValue.gt(ethers.utils.parseUnits(daiBalance, 18)))
    ) {
      return dispatch(error(t`You do not have enough pPana/DAI to complete this transaction.`));
    }

    const formQuant = async () => {
      return quantity;
    };

    await dispatch(
      changePPanaExercise({
        address,
        action,
        value: await formQuant(),
        provider,
        networkID: networkId,
      }),
    );
  };

  const onClaim = async (action = "pPanaClaim") => {
    await dispatch(
      changePPanaClaim({
        address,
        action,
        provider,
        networkID: networkId,
      }),
    );
  };

  const vestingPeriod = () => pPanaTerms?.timeLeft;

  const modalButton = [];

  modalButton.push(
    <Button variant="contained" color="primary" className="connect-button" onClick={connect} key={1}>
      <Trans>Connect Wallet</Trans>
    </Button>,
  );

  const handleChangeQuantity = useCallback<ChangeEventHandler<HTMLInputElement>>(e => {
    if (Number(e.target.value) >= 0) setQuantity(toInteger(e.target.value).toString());
  }, []);

  const MetricContent = ({
    label,
    xsUnit,
    isLoading,
    metric,
    clsName,
    tooltip,
  }: {
    label: any;
    xsUnit?: GridSize;
    isLoading: boolean;
    metric: any;
    clsName?: string;
    tooltip?: string;
  }): ReactElement => {
    return (
      <Grid item xs={xsUnit} className={clsName}>
        <Typography variant="h5" color="textSecondary" className="card-title-text">
          {label}
          <>
            {tooltip?.length ? (
              <Tooltip arrow title={tooltip} style={{ cursor: "pointer" }}>
                <SvgIcon viewBox="-6 -6 30 30" component={InfoOutlined}></SvgIcon>
              </Tooltip>
            ) : (
              <></>
            )}
          </>
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
    <div id="redeem-ppana-view">
      <Zoom in={true} onEntered={() => setZoomed(true)}>
        <Paper className="paper-format" elevation={0}>
          <Typography variant="h5" className="card-header" style={{ fontWeight: 600 }}>
            {t`Redeem pPana`}
          </Typography>
          {!address ? (
            <div className="exchange-wallet-notification">
              <div className="wallet-menu" id="wallet-menu">
                {modalButton}
              </div>
              <Typography variant="h6">
                <Trans>Connect your wallet to redeem pPana</Trans>
              </Typography>
            </div>
          ) : address && !isAllowanceDataLoading ? (
            !hasAllowance("pPana") || !hasAllowance("pPanaDAI") ? (
              <>
                <Box mt={"10px"}>
                  <Typography variant="body1" className="exchange-note" color="textSecondary">
                    <>
                      <Trans>First time redeeming</Trans> <b>pPana</b>?
                      <br />
                      <Trans>Please approve Pana Dao Redemption to use your </Trans>
                      <b> pPana</b> &amp; <b> DAI </b>
                      <Trans>for redeeming</Trans>.
                    </>
                  </Typography>
                </Box>
                {isAllowanceDataLoading ? (
                  <Skeleton />
                ) : (
                  <>
                    <br />
                    <br />
                    <br />
                    <Grid container spacing={3}>
                      {!hasAllowance("pPana") ? (
                        <Grid item xs={12} sm={4}>
                          <Button
                            className="exchange-button"
                            variant="contained"
                            color="primary"
                            disabled={isPendingTxn(pendingTransactions, "approve_exchanging")}
                            onClick={() => {
                              onSeekApproval("pPana");
                            }}
                          >
                            {txnButtonText(pendingTransactions, "approve_exchanging", t`Approve pPana`)}
                          </Button>
                        </Grid>
                      ) : (
                        ""
                      )}
                      {!hasAllowance("pPanaDAI") ? (
                        <Grid item xs={12} sm={4}>
                          <Button
                            className="exchange-button"
                            variant="contained"
                            color="primary"
                            disabled={isPendingTxn(pendingTransactions, "approve_exchanging")}
                            onClick={() => {
                              onSeekApproval("pPanaDAI");
                            }}
                          >
                            {txnButtonText(pendingTransactions, "approve_exchanging", t`Approve DAI`)}
                          </Button>
                        </Grid>
                      ) : (
                        ""
                      )}
                    </Grid>
                  </>
                )}
              </>
            ) : (
              <>
                <Grid container direction="column" spacing={2}>
                  <Grid item>
                    <Grid container direction="row" spacing={2}>
                      <MetricContent
                        clsName="exchange-apy"
                        label={t`pPana Balance`}
                        metric={pPanaBalance}
                        isLoading={false}
                        // isLoading={stakingAPY ? false : true}
                      />
                      {pPanaTerms && pPanaTerms.supplyBased ? (
                        [
                          <MetricContent
                            clsName="exchange-apy"
                            label={t`Redeemable pPana`}
                            metric={redeemablefor}
                            isLoading={false}
                            tooltip={t`This is the max pPana you can redeem now`}
                            // isLoading={stakingAPY ? false : true}
                          />,
                          <MetricContent
                            clsName="exchange-apy"
                            label={t`DAI Balance`}
                            metric={`${trim(Number(daiBalance), 4)}`}
                            isLoading={false}
                            // isLoading={stakingAPY ? false : true}
                          />,
                        ]
                      ) : (
                        <MetricContent
                          clsName="exchange-apy"
                          label={t`DAI Balance`}
                          metric={`${trim(Number(daiBalance), 4)}`}
                          isLoading={false}
                          // isLoading={stakingAPY ? false : true}
                        />
                      )}
                    </Grid>
                  </Grid>
                  {pPanaTerms && pPanaTerms.active && pPanaTerms.locked && pPanaTerms.locked > 0 ? (
                    <div className="redeem-area">
                      <div className="tab-content">
                        <Grid container spacing={2} className="tab-content-row">
                          <Grid item xs={12} className="tab-content-label">
                            <Typography variant="h5">
                              <Trans>Vesting pPana</Trans>
                            </Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Table aria-label="p-pana-vesting-table">
                              <TableHead>
                                <TableRow>
                                  <TableCell align="center">{`pPana`}</TableCell>
                                  <TableCell align="center">{`Remaining`}</TableCell>
                                  <TableCell align="center">{`Pana`}</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                <TableRow id={`pPana--claim`}>
                                  <TableCell align="center">{pPanaTerms.locked / 100}</TableCell>
                                  <TableCell align="center">{pPanaTerms.timeLeft}</TableCell>
                                  <TableCell align="center">{pPanaTerms.locked}</TableCell>
                                  <TableCell align="center">
                                    {vestingPeriod() === "Fully Vested" ? (
                                      <Button
                                        variant="outlined"
                                        color="primary"
                                        disabled={isPendingTxn(pendingTransactions, "claim-p-pana")}
                                        onClick={() => onClaim()}
                                      >
                                        <Typography variant="h6">{`Claim Pana`}</Typography>
                                      </Button>
                                    ) : (
                                      ""
                                    )}
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </Grid>
                        </Grid>
                      </div>

                      <div className="help-text">
                        <em>
                          <Typography variant="body2">
                            You will not be able to redeem further till the vesting period is over
                          </Typography>
                        </em>
                      </div>
                    </div>
                  ) : (
                    <div className="redeem-area">
                      <div className="tab-content">
                        <Grid container spacing={2} className="tab-content-row">
                          <Grid item xs={12} className="tab-content-label">
                            <Typography variant="h5">
                              <Trans>Redeem pPana (with DAI) to claim Pana</Trans>
                            </Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="h6">pPana</Typography>
                          </Grid>
                          <Grid item xs={12} sm={4} className="pPana-input-container">
                            <FormControl className="pana-input" variant="outlined" color="primary">
                              <InputLabel htmlFor="amount-input"></InputLabel>
                              <OutlinedInput
                                id="amount-input"
                                type="number"
                                placeholder="Enter pPana amount"
                                value={quantity}
                                onChange={handleChangeQuantity}
                                labelWidth={0}
                                endAdornment={
                                  <InputAdornment position="end">
                                    <Button variant="text" onClick={setMaxPPana} color="inherit">
                                      Max
                                    </Button>
                                  </InputAdornment>
                                }
                              />
                            </FormControl>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Typography variant="h6">{" + " + quantity + " DAI"}</Typography>
                          </Grid>
                          <Grid item xs={12} sm={4} className="pPana-input-container">
                            <Box className="button-box" m={-2}>
                              <>
                                <br />
                                <Button
                                  className="exchange-button"
                                  variant="contained"
                                  color="primary"
                                  disabled={isPendingTxn(pendingTransactions, "exchanging")}
                                  onClick={() => {
                                    onPPanaExercise("exercise");
                                  }}
                                >
                                  {`Exercise pPana`}
                                </Button>
                              </>
                            </Box>
                          </Grid>
                        </Grid>
                      </div>
                      <Divider color="secondary" />
                      <Grid container spacing={2} className="tab-content-row">
                        <Grid item xs={12}>
                          <div className="exchange-user-data">
                            <DataRowContent
                              title={t`You will get`}
                              id="user-balance"
                              isLoading={false}
                              balance={`${trim(Number(quantity) * 100, 0)} Pana`}
                            />
                          </div>
                        </Grid>
                      </Grid>

                      <div className="help-text">
                        <em>
                          <Typography variant="body2">
                            Please Note! Once you excercise pPana, you will not be able to redeem further till the
                            vesting period is over
                          </Typography>
                        </em>
                      </div>
                    </div>
                  )}
                </Grid>
              </>
            )
          ) : (
            <Skeleton width="150px" />
          )}
        </Paper>
      </Zoom>
    </div>
  );
}

export default RedeemPPana;
