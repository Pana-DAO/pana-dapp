import "./farm.scss";
import { Box, Button, Fade, FormControl, FormControlLabel, Grid, InputAdornment, InputLabel, Link, Modal, OutlinedInput, Paper, Radio, RadioGroup, Slide, SvgIcon, Typography } from "@material-ui/core";
import { Close } from "@material-ui/icons";
import { useHistory } from "react-router";
import { farms, parseBigNumber, stakingPoolsConfig, totalFarmPoints } from "src/helpers/tokenLaunch";
import TokenStack from "src/lib/PanaTokenStack";
import { formatCurrency } from "src/helpers";
import ConnectButton from "src/components/ConnectButton/ConnectButton";
import { useAppSelector, useWeb3Context } from "src/hooks";
import { t, Trans } from "@lingui/macro";
import { ethers } from "ethers";
import { useCallback, useEffect, useState } from "react";
import { isPendingTxn, txnButtonText } from "src/slices/PendingTxnsSlice";
import { Skeleton } from "@material-ui/lab";
import { useDispatch } from "react-redux";
import { changeAssetApproval, getAssetAllowance, getAssetBalance, getErc20TokenBalance, onStakeAssets, onUnstakeAssets } from "src/slices/StakingPoolsSlice";
import { error } from "src/slices/MessagesSlice";
import { AppDispatch } from "src/store";
import { ReactComponent as ArrowUp } from "../../assets/icons/arrow-up.svg";

function Farm({ index }: { index: number }) {
    const dispatch = useDispatch<AppDispatch>();
    const history = useHistory();
    const { provider, address, networkId } = useWeb3Context();
    const farm = farms.find(p => p.index == index) || farms[index];
    const [quantity, setQuantity] = useState("");
    const [quantityUnstake, setQuantityUnstake] = useState("");
    const [stake, setStake] = useState('stake');
    const [panaPerDay, setPanaPerDay] = useState(ethers.constants.Zero);
    const [farmBalance, setFarmBalance] = useState(ethers.constants.MaxUint256);
    const onClickAway = (): void => {
        history.push(`/tokenlaunch`);
    };

    // const balanceNumber = 1;
    // const balance = 1;

    useEffect(() => {
        const promise = getErc20TokenBalance(farm.address, provider, networkId);
        promise.then(balance => setFarmBalance(balance));
    }, [farm]);

    const isFarmLoading = false; //useAppSelector<boolean>(state => state.bonding.loading ?? true);

    const pendingPanaForUser = useAppSelector(state => {
        return state.stakingPools.pendingPanaForUser && state.stakingPools.pendingPanaForUser.length > 0
            ? state.stakingPools.pendingPanaForUser : null;
    });

    const userPoolBalance = useAppSelector(state => {
        return state.stakingPools.userPoolBalance && state.stakingPools.userPoolBalance.length > 0
            ? state.stakingPools.userPoolBalance : null;
    });

    useEffect(() => {
        try {
            setPanaPerDay(ethers.constants.Zero);
            if (quantity && farm && !farmBalance.eq(ethers.constants.MaxUint256)) {
                const amount = parseBigNumber(quantity, farm.decimals);
                const poolTotal = amount.add(farmBalance);
                if (amount.gt(0) && poolTotal.gt(0)) {
                    const farmPerDay = stakingPoolsConfig.panaPerSecond.mul(86400).mul(farm.points).div(totalFarmPoints);
                    setPanaPerDay(farmPerDay.mul(amount).div(poolTotal));
                }
            }
        }
        catch (error: any) {
            console.error('PanaDAO.PanaPerDay', error);
        }
    }, [quantity, farm, farmBalance]);

    const handleStakeBtnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setStake((event.target as HTMLInputElement).value);
        setPanaPerDay(ethers.constants.Zero);
        if (stake == 'stake') {
            setQuantityUnstake("");
        } else {
            setQuantity("");
        }
    };

    const pendingTransactions = useAppSelector(state => {
        return state.pendingTransactions;
    });

    const assetAllowance = useAppSelector(state => state.stakingPools.assetAllowance[farm.address]);
    const assetBalance = useAppSelector(state => {
        if (state.stakingPools.assetBalance[farm.address]) {
            return ethers.utils.formatUnits(state.stakingPools.assetBalance[farm.address], farm.decimals);
        }
    });

    const hasAllowance = useCallback(() => {
        return +assetAllowance > 0;
    }, [assetAllowance]);

    const setMax = () => {
        setQuantity(assetBalance || "");
    };

    const setMaxUnstake = () => {
        if (userPoolBalance) {
            setQuantityUnstake(ethers.utils.formatUnits(userPoolBalance[farm.pid], farm.decimals) || "");
        }
    };

    const onSeekApproval = async () => {
        dispatch(changeAssetApproval({ address, provider, networkID: networkId, value: farm.address }));
    };

    const onStakeUnstake = async () => {

        if (stake == "stake") {
            if (quantity === "" || Number(quantity) <= 0) {
                dispatch(error(t`Please enter a value!`));
            } else if (Number(quantity) > Number(assetBalance)) {
                dispatch(
                    error(
                        `Max staking is ${assetBalance} ${farm.symbol}. Click Max to autocomplete.`,
                    ),
                );
            } else {
                dispatch(
                    onStakeAssets({
                        amount: ethers.utils.parseUnits(quantity, farm.decimals),
                        networkID: networkId,
                        provider,
                        farm,
                        address
                    }),
                ).then(() => clearInput());
            }

        } else if (stake == "unstake" && userPoolBalance) {
            if (quantityUnstake === "" || Number(quantityUnstake) <= 0) {
                dispatch(error(t`Please enter a value!`));
            } else if (Number(quantityUnstake) > Number(userPoolBalance[farm.pid])) {
                dispatch(
                    error(
                        `Max unstaking is ${ethers.utils.formatUnits(userPoolBalance[farm.pid], farm.decimals)} ${farm.symbol}. Click Max to autocomplete.`,
                    ),
                );
            } else {
                dispatch(
                    onUnstakeAssets({
                        amount: ethers.utils.parseUnits(quantityUnstake, farm.decimals),
                        networkID: networkId,
                        provider,
                        farm,
                        address
                    }),
                ).then(() => clearInput());
            }
        }
        //dispatch(changeApproval({ address, provider, networkID: networkId, bond }));
    };

    const clearInput = () => {
        setQuantity("");
        setQuantityUnstake("");
    };

    useEffect(() => {
        dispatch(getAssetAllowance({ networkID: networkId, address, provider, value: farm.address }));
        dispatch(getAssetBalance({ networkID: networkId, address, provider, value: farm.address }));
    }, [address, networkId])

    return (
        <Fade in={true} mountOnEnter unmountOnExit>
            <Grid container>
                <Modal
                    open={true}
                    id="farm-view"
                    onClose={onClickAway}
                    aria-labelledby="modal-modal-title"
                    aria-describedby="modal-modal-description"
                >
                    <Paper className={"modalspace"} elevation={1}>
                        <div id="modal-modal-title">
                            <div className="modal-header">
                                <div className="top-left">
                                    <SvgIcon viewBox="0 0 25 25" component={Close} style={{ cursor: "pointer" }} onClick={onClickAway} />
                                </div>
                                <Box display="flex" flexDirection="row">
                                    <TokenStack tokens={farm.icon} />
                                    <Box display="flex" flexDirection="column" ml={1} justifyContent="center" alignItems="center">
                                        <Typography variant="h5">{`${farm.symbol}`}</Typography>
                                    </Box>
                                </Box>
                                <div className="top-right"></div>
                            </div>
                            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center">
                                <Link color="primary" href={farm.url} target="_blank">
                                    <Typography className="get-token-link" variant="body1">
                                        {'Get ' + farm.symbol + ' Token'}
                                        <SvgIcon component={ArrowUp} htmlColor="#A3A3A3" />
                                    </Typography>
                                </Link>
                            </Box>
                        </div>
                        <Box id="modal-modal-description" display="flex" flexDirection="row" className="farm-price-data-row">
                            <div className="farm-price-data">
                                <Typography variant="h5" color="textSecondary">
                                    <Trans>Staked</Trans>
                                </Typography>
                                <Typography variant="h3" color="primary" className="price">
                                    {(userPoolBalance && userPoolBalance[farm.pid]) ? formatCurrency(+ethers.utils.formatUnits(userPoolBalance[farm.pid], farm.decimals), 4, "PANA") + ' ' + farm.symbol : '-'}
                                </Typography>
                            </div>
                            <div className="farm-price-data">
                                <Typography variant="h5" color="textSecondary">
                                    <Trans>Earned</Trans>
                                </Typography>
                                <Typography variant="h3" color="primary" className="price">
                                    {(pendingPanaForUser && pendingPanaForUser[farm.pid]) ? formatCurrency(+ethers.utils.formatUnits(pendingPanaForUser[farm.pid], farm.decimals), 4, "PANA") + ' Pana' : '-'}
                                </Typography>
                            </div>
                        </Box>
                        <Box display="flex" gridGap={'10px'} flexDirection="column">
                            <Box display="flex" justifyContent="space-around" flexWrap="wrap">
                                {!address ? (
                                    <ConnectButton />
                                ) : (
                                    <> {assetBalance ? (
                                        !hasAllowance() ? (
                                            <div className="help-text">
                                                <em>
                                                    <Typography variant="body1" align="center" color="textSecondary">
                                                        <Trans>First time staking</Trans> <b>{farm.symbol}</b>? <br />{" "}
                                                        <Trans>Please approve Pana Dao to use your</Trans> <b>{farm.symbol}</b>{" "}
                                                        <Trans>for staking</Trans>.
                                                    </Typography>
                                                </em>
                                            </div>
                                        ) : (
                                            <div>
                                                <FormControl>
                                                    <RadioGroup 
                                                        aria-labelledby="rb-group-stake"
                                                        value={stake}
                                                        onChange={handleStakeBtnChange}
                                                        name="rb-staking-group"
                                                        row
                                                        className="radio-staking-group"
                                                    >
                                                        <FormControlLabel value="stake" control={<Radio color="primary" />} label="Stake" />
                                                        <FormControlLabel value="unstake" control={<Radio color="primary" />} label="Unstake" />
                                                    </RadioGroup>
                                                </FormControl>
                                                {stake == 'stake' ? (
                                                    <FormControl className="pana-input" variant="outlined">
                                                        <InputLabel className="pana-input-label" htmlFor="outlined-adornment-amount">
                                                            Amount
                                                        </InputLabel>
                                                        <OutlinedInput
                                                            id="outlined-stake-amount"
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
                                                ) : (
                                                    <FormControl className="pana-input" variant="outlined">
                                                        <InputLabel className="pana-input-label" htmlFor="outlined-adornment-amount">
                                                            Amount
                                                        </InputLabel>
                                                        <OutlinedInput 
                                                            id="outlined-unstake-amount"
                                                            type="number"
                                                            value={quantityUnstake}
                                                            onChange={e => setQuantityUnstake(e.target.value)}
                                                            endAdornment={<InputAdornment onClick={setMaxUnstake} position="end">{t`Max`}</InputAdornment>}
                                                            aria-describedby="outlined-weight-helper-text"
                                                            inputProps={{
                                                                "aria-label": "Amount",
                                                            }}
                                                        />
                                                    </FormControl>
                                                )}

                                            </div>
                                        )) : <></>
                                    }

                                        {assetBalance ? (
                                            hasAllowance() ? (
                                                <Button
                                                    variant="contained"
                                                    color="primary"
                                                    id="farm-btn"
                                                    className="transaction-button"
                                                    disabled={isPendingTxn(pendingTransactions, "farm_" + farm.index)}
                                                    onClick={onStakeUnstake}
                                                >
                                                    {txnButtonText(pendingTransactions, "farm_" + farm.index, stake == "stake" ? "Stake" : "Unstake")}
                                                </Button>
                                            ) : (stake == "stake" ?
                                                <Button
                                                    variant="contained"
                                                    color="primary"
                                                    id="farm-approve-btn"
                                                    className="transaction-button"
                                                    disabled={isPendingTxn(pendingTransactions, `approve_${farm.address}_farming`)}
                                                    onClick={onSeekApproval}
                                                >
                                                    {txnButtonText(pendingTransactions, `approve_${farm.address}_farming`, "Approve")}
                                                </Button> : <></>
                                            )
                                        ) : (
                                            <Skeleton width="350px" height={40} />
                                        )}
                                    </>
                                )}
                            </Box>
                            <Slide direction="left" in={true} mountOnEnter unmountOnExit {...{ timeout: 533 }}>
                                <Box className="farm-data">
                                    <Box display="flex" className="flxrow data-row" flexDirection="row" justifyContent="space-between">
                                        <Box display="flex" flexDirection="row">
                                            <Typography>
                                                <Trans>Your Balance</Trans>
                                            </Typography>
                                        </Box>
                                        <Typography className="price-data">
                                            {isFarmLoading ? <Skeleton width="100px" /> : `${assetBalance && formatCurrency(+assetBalance, 4, "PANA")} ${farm.symbol}`}
                                        </Typography>
                                    </Box>
                                    {stake == 'stake' &&
                                        <Box display="flex" className="flxrow data-row" flexDirection="row" justifyContent="space-between">
                                            <Box display="flex" flexDirection="row">
                                                <Typography>
                                                    <Trans>You will get (Pana per Day)</Trans>
                                                </Typography>
                                            </Box>
                                            <Typography className="price-data">
                                                {isFarmLoading ? <Skeleton width="100px" /> : `${formatCurrency(+ethers.utils.formatUnits(panaPerDay, 18), 4, "PANA")} Pana`}
                                            </Typography>
                                        </Box>
                                    }
                                </Box>
                            </Slide>
                        </Box>
                    </Paper>
                </Modal>
            </Grid>
        </Fade>
    )
}
export default Farm;
