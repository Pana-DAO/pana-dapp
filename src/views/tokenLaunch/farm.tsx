import "./farm.scss";
import { Box, Button, Fade, FormControl, FormControlLabel, Grid, InputAdornment, InputLabel, Modal, OutlinedInput, Paper, Radio, RadioGroup, Slide, SvgIcon, Typography } from "@material-ui/core";
import { Close } from "@material-ui/icons";
import { useHistory } from "react-router";
import { farms } from "src/helpers/tokenLaunch";
import TokenStack from "src/lib/PanaTokenStack";
import { formatCurrency, trim } from "src/helpers";
import ConnectButton from "src/components/ConnectButton/ConnectButton";
import { useAppSelector, useWeb3Context } from "src/hooks";
import { t, Trans } from "@lingui/macro";
import { ethers } from "ethers";
import { useState } from "react";
import { isPendingTxn, txnButtonText } from "src/slices/PendingTxnsSlice";
import { Skeleton } from "@material-ui/lab";

function Farm({ index }: { index: number }) {
    const history = useHistory();
    const { provider, address, networkId } = useWeb3Context();
    const farm = farms[index];
    const [quantity, setQuantity] = useState("");
    const [stake, setStake] = useState('stake');
    const onClickAway = (): void => {
        history.push(`/tokenlaunch`);
    };

    const maxStakable = 1; //+bond.maxPayoutOrCapacityInQuote;
    const balanceNumber = 1;
    const balance = 1;

    const isFarmLoading = false; //useAppSelector<boolean>(state => state.bonding.loading ?? true);

    const handleStakeBtnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setStake((event.target as HTMLInputElement).value);
    };

    const pendingTransactions = useAppSelector(state => {
        return state.pendingTransactions;
    });

    const hasAllowance = () => {
        return true;
    }

    const setMax = () => {
        let maxQ: string;
        const maxStakableNumber = maxStakable * 0.999;
        if (balanceNumber > maxStakableNumber) {
            maxQ = maxStakableNumber.toString();
        } else {
            maxQ = ethers.utils.formatUnits(balance, farm.decimals);
        }
        setQuantity(maxQ);
    };

    const onSeekApproval = async () => {
        //dispatch(changeApproval({ address, provider, networkID: networkId, bond }));
    };

    const onStakeUnstake = async () => {
        //dispatch(changeApproval({ address, provider, networkID: networkId, bond }));
    };

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
                            {/* <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center">
                                <Typography>{bond.fixedTerm ? t`Fixed Term` : t`Fixed Expiration`}</Typography>
                                <Typography style={{ marginTop: "3px" }}>
                                    {bond.fixedTerm ? `${bond.duration}` : `${bond.expiration}`}
                                </Typography>
                            </Box> */}
                        </div>
                        <Box id="modal-modal-description" display="flex" flexDirection="row" className="farm-price-data-row">
                            <div className="farm-price-data">
                                <Typography variant="h5" color="textSecondary">
                                    <Trans>Staked</Trans>
                                </Typography>
                                <Typography variant="h3" color="primary" className="price">
                                    {formatCurrency(0.012323, 4, "PANA")}
                                </Typography>
                            </div>
                            <div className="farm-price-data">
                                <Typography variant="h5" color="textSecondary">
                                    <Trans>Earned</Trans>
                                </Typography>
                                <Typography variant="h3" color="primary" className="price">
                                    {formatCurrency(11.3434, 4, "PANA")}
                                </Typography>
                            </div>
                        </Box>
                        <Box display="flex" gridGap={'10px'} flexDirection="column">
                            <Box display="flex" justifyContent="space-around" flexWrap="wrap">
                                {!address ? (
                                    <ConnectButton />
                                ) : (
                                    <>
                                        {!hasAllowance() ? (
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
                                                    >
                                                        <FormControlLabel value="stake" control={<Radio color="primary" />} label="Stake" />
                                                        <FormControlLabel value="unstake" control={<Radio color="primary" />} label="Unstake" />
                                                    </RadioGroup>
                                                </FormControl>
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
                                            </div>
                                        )}

                                        {balance ? (
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
                                                    disabled={isPendingTxn(pendingTransactions, `approve_${farm.index}_farming`)}
                                                    onClick={onSeekApproval}
                                                >
                                                    {txnButtonText(pendingTransactions, `approve_${farm.index}_farming`, "Approve")}
                                                </Button> : <></>
                                            )
                                        ) : (
                                            <Skeleton width="300px" height={40} />
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
                                            {isFarmLoading ? <Skeleton width="100px" /> : `${trim(balanceNumber, 4)} ${farm.symbol}`}
                                        </Typography>
                                    </Box>
                                    <Box display="flex" className="flxrow data-row" flexDirection="row" justifyContent="space-between">
                                        <Box display="flex" flexDirection="row">
                                            <Typography>
                                                <Trans>You will get (Pana per Day)</Trans>
                                            </Typography>
                                        </Box>
                                        <Typography className="price-data">
                                            {isFarmLoading ? <Skeleton width="100px" /> : `${trim(balanceNumber, 4)} ${farm.symbol}`}
                                        </Typography>
                                    </Box>
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
