import "./ChooseBond.scss";

import { t, Trans } from "@lingui/macro";
import {
  Box,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Zoom,
  Paper,
} from "@material-ui/core";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import isEmpty from "lodash/isEmpty";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useHistory } from "react-router";
import { useAppSelector, useWeb3Context } from "src/hooks";
import { usePathForNetwork } from "src/hooks/usePathForNetwork";
import { IUserBondDetails } from "src/slices/AccountSlice";
import { getAllBonds, getUserNotes, IUserNote } from "src/slices/BondSlice";
import { AppDispatch } from "src/store";
import { Skeleton } from "@material-ui/lab";
import { formatCurrency, trim } from "../../helpers";
import { BondDataCard, BondTableData } from "./BondRow";
import ClaimBonds from "./ClaimBonds";
import { NetworkId, NETWORKS } from "src/constants";
// import CountDownSmall from "src/CountDownSmall";
import { CheckBondClock } from "src/helpers/NetworkHelper";
import { formatMoney } from "src/helpers/tokenLaunch";

function ChooseBond() {
  const { networkId, address, provider } = useWeb3Context();
  const dispatch = useDispatch<AppDispatch>();
  const history = useHistory();
  usePathForNetwork({ pathName: "bonds", networkID: networkId, history });
  
  const bonds = useAppSelector(state => {
    return state.bonding.indexes.map(index => state.bonding.bonds[index]).sort((a, b) => b.discount - a.discount);
  });
  
  const countDown = new Date(Date.UTC(2022,8,27,16,0,0,0)).getTime(); //3pm gmt == 11am est
  const arbitrum_mainnet = NETWORKS[NetworkId.ARBITRUM_MAINNET];
  const arbitrum_testnet = NETWORKS[NetworkId.ARBITRUM_TESTNET];  
  
  const isShowCountDown = () =>{
    return CheckBondClock();
    // if(networkId == arbitrum_mainnet.chainId){
    //   const currentTime = (new Date()).getTime()+((new Date()).getTimezoneOffset()*1000)+(-4*60*1000);
    //   console.log(countDown,currentTime);
    //   if(currentTime<countDown) return true;
    //   return false;
    // }
    // return false;
  } 
  const isSmallScreen = useMediaQuery("(max-width: 733px)"); // change to breakpoint query
  const accountNotes: IUserNote[] = useAppSelector(state => state.bonding.notes);
  const accountOldNotes: IUserNote[] = useAppSelector(state => state.bonding.oldNotes);

  const marketPrice: number | undefined = useAppSelector(state => {
    return state.app.marketPrice;
  });

  const treasuryBalance = useAppSelector(state => state.app.treasuryMarketValue);

  const stakingAPY = useAppSelector(state => state.app.stakingAPY);
  const formatAPY = (stakingAPY: any) => {
    const trimmedExchangingAPY = trim(Math.round(stakingAPY * 100), 2);
    return new Intl.NumberFormat("en-US").format(Number(trimmedExchangingAPY));
  }

  const isBondsLoading = useAppSelector(state => state.bonding.loading ?? true);

  const formattedTreasuryBalance = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Number(treasuryBalance));

  useEffect(() => {
    const interval = setTimeout(() => {
      dispatch(getAllBonds({ address, networkID: networkId, provider }));
      dispatch(getUserNotes({ address, networkID: networkId, provider }));
    }, 60000);
    return () => clearTimeout(interval);
  });

  const v1AccountBonds: IUserBondDetails[] = useAppSelector(state => {
    const withInterestDue = [];
    for (const bond in state.account.bonds) {
      if (state.account.bonds[bond].interestDue > 0) {
        withInterestDue.push(state.account.bonds[bond]);
      }
    }
    return withInterestDue;
  });


  return (
    <>
    
    <div id="choose-bond-view">
      {(!isEmpty(accountNotes) || !isEmpty(accountOldNotes) || !isEmpty(v1AccountBonds)) && (
        <ClaimBonds activeNotes={accountNotes} activeOldNotes={accountOldNotes} />
      )}

      <Zoom in={true}>
        <Paper className="bond-list">
          <Typography variant="h5" className="card-header" style={{ fontWeight: 600 }}>
            {t`Bond`}
          </Typography>
          <Grid container direction="row" spacing={3}>
            <Grid className="bondInfoGrid" item xs={4}>
              <Grid className="box-dash">
                <Typography variant="h6" color="textSecondary" className="card-title-text">
                  {t`Treasury Balance`}
                </Typography>
                <Typography variant="h5" style={{ fontWeight: 500 }}>
                  <>{!!treasuryBalance ? formatMoney(treasuryBalance):(stakingAPY?'-':<Skeleton width="100px" style={{marginLeft: '35%'}} />)}</>
                </Typography>
              </Grid>
            </Grid>
            <Grid className="bondInfoGrid" item xs={4}>
              <Grid className="box-dash">
                <Typography variant="h6" color="textSecondary" className="card-title-text">
                  {t`APY`}
                </Typography>
                <Typography variant="h5" style={{ fontWeight: 500 }}>
                  <>{!!stakingAPY ? `${formatAPY(stakingAPY)}%`:<Skeleton width="100px" style={{marginLeft: '35%'}} />}</>
                </Typography>
              </Grid>
            </Grid>
            <Grid className="bondInfoGrid" item xs={4}>
              <Grid className="box-dash">
                <Typography variant="h6" color="textSecondary" className="card-title-text">
                  {t`PANA Price`}
                </Typography>
                <Typography variant="h5" style={{ fontWeight: 500 }}>
                  <>{marketPrice ? formatCurrency(Number(marketPrice), 6) : <Skeleton width="100px"  style={{marginLeft: '35%'}}  />}</>
                </Typography>
              </Grid>
            </Grid>
          </Grid>

          {bonds.length == 0 && !isBondsLoading && (
            <Box display="flex" justifyContent="center" marginY="24px">
              <Typography variant="h4">No active bonds</Typography>
            </Box>
          )}

          {!isSmallScreen && bonds.length != 0 && (
            <Grid container item className="bond-container">
              <TableContainer>
                <Table aria-label="Available bonds">
                  <TableHead>
                    <TableRow>
                      <TableCell align="center">
                        <Trans>Bond</Trans>
                      </TableCell>
                      <TableCell align="left">
                        <Trans>Price</Trans>
                      </TableCell>
                      <TableCell align="left">
                        <Trans>Discount</Trans>
                      </TableCell>
                      <TableCell align="left">
                        <Trans>Duration</Trans>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {bonds.map(bond => {
                      //if (bond.displayName !== "unknown")
                      return <BondTableData networkId={networkId} key={bond.index} bond={bond} />;
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          )}
          <Box mt={2} className="help-text">
            <em>
              <Typography variant="body2" align="center">
                Important: Bonds are auto-wrapped (accrue rebase rewards). Simply claim as KARSHA at the end of the
                term.
              </Typography>
            </em>
          </Box>
        </Paper>
      </Zoom>

      {isSmallScreen && (
        <Box className="pana-card-container">
          <Grid container item spacing={2}>
            {bonds.map(bond => {
              return (
                <Grid item xs={12} key={bond.index}>
                  <BondDataCard key={bond.index} bond={bond} networkId={networkId} />
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}
    </div>
    </>
  );
}

export default ChooseBond;
