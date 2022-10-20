import { t, Trans } from "@lingui/macro";
import { Box, Button, Grid, Link, SvgIcon, TableCell, TableRow, Typography, useMediaQuery } from "@material-ui/core";
import { BigNumber, ethers } from "ethers";
import { NavLink } from "react-router-dom";
import { NetworkId } from "src/constants";
import { formatCurrency } from "src/helpers";
import {
  FarmInfo,
  FarmPriceData,
  // farms,
  formatMoney,
  // stakingPoolsConfig,
  // totalFarmPoints,
} from "src/helpers/tokenLaunch";
import { useAppSelector, useWeb3Context } from "src/hooks";
import TokenStack from "src/lib/PanaTokenStack";
// import { getErc20TokenBalance } from "src/slices/StakingPoolsSlice";
import { ReactComponent as ArrowUp } from "../../assets/icons/arrow-up.svg";
import { Skeleton } from "@material-ui/lab";

function FarmData({
  networkId,
  farm,
  farmLiquidity,
  onFarmPanaUpdate,
}: {
  networkId: NetworkId;
  farm: FarmInfo;
  farmLiquidity?:FarmPriceData;
  onFarmPanaUpdate: any;
}) {
  const { provider, address, connect, connected } = useWeb3Context();
  const isSmallScreen = useMediaQuery("(max-width: 885px)"); // change to breakpoint query

  const userPoolBalance = useAppSelector(state => {
    return state.stakingPools.userPoolBalance && state.stakingPools.userPoolBalance.length > 0
      ? state.stakingPools.userPoolBalance
      : null;
  });

  const pendingPanaForUser = useAppSelector(state => {
    return state.stakingPools.pendingPanaForUser && state.stakingPools.pendingPanaForUser.length > 0
      ? state.stakingPools.pendingPanaForUser
      : null;
  });


function getUserPoolBalanceFormated(pid: number, index: number) {
    if (userPoolBalance) {
      return formatCurrency(+ethers.utils.formatUnits(userPoolBalance[pid], farm.decimals), 6, "PANA");
    }
  }

  function getUserPoolBalanceInUSD(pid: number, index: number,farmLiq?: FarmPriceData) {
    if (userPoolBalance) {      
      if (farmLiq && farmLiq.price > 0)
        return '$' + formatCurrency((farmLiq.price * +ethers.utils.formatUnits(userPoolBalance[pid], farm.decimals)), 4, "PANA");     
    }
  }
  // function getUserPoolBalanceInUSD(pid: number, index: number,farmLiq?: FarmPriceData) {
  //   if (userPoolBalance) {      
  //     if (farmLiq && farmLiq.liquidityUSD > 0)
  //       // return '$' + formatCurrency((farmLiq.price * +ethers.utils.formatUnits(userPoolBalance[pid], farm.decimals)), 4, "PANA");     
  //       return '$' + formatCurrency(farmLiq.liquidityUSD, 4, "PANA");     
  //   }
  //   return '$' + formatCurrency(0, 4, "PANA");     
  // }

  function getFarmRewardsPerDayFormated(farmLiq?: FarmPriceData): string {        
    if (farmLiq && farmLiq.farmperday.gt(0)) {
      return formatCurrency(+ethers.utils.formatUnits(farmLiq?.farmperday, 18), 4, "PANA");
    }    
    return formatCurrency(+ethers.utils.formatUnits(BigNumber.from(0), 18), 4, "PANA");
  }

  function getPendingPanaForUserFormated(pid: number) {
    if (pendingPanaForUser) {
      return formatCurrency(+ethers.utils.formatUnits(pendingPanaForUser[pid], 18), 4, "PANA");
    }
  }  
  function getFarmLiquidity(farmLiq?: FarmPriceData): string {        
    if (farmLiq && farmLiq.liquidity > 0) {
      return formatMoney(farmLiq.liquidity, true);
    }    
    return formatMoney(0,true);
  }
  
  return (    
    <>
      {!isSmallScreen ? (
        <>
          <TableRow id={`${farm.index}--farm`}>
            <TableCell align="left" className="farm-name-cell">
              <div className="farm-asset-icon">
                <TokenStack tokens={farm.icon} />
              </div>
              <div className="farm-name">
                <>
                  <Typography variant="body1">{farm.symbol}</Typography>
                  <Link color="primary" href={farm.url} target="_blank">
                    <Typography variant="body2">
                      <Trans>Get </Trans>
                      <SvgIcon component={ArrowUp} htmlColor="#A3A3A3" />
                    </Typography>
                  </Link>
                </>
              </div>
            </TableCell>
            <TableCell align="center">
              <Typography>
                {/* {farm.points / 10}x */}
                &mdash;
              </Typography>
            </TableCell>
            <TableCell align="center">
             {farmLiquidity ? (<Typography>{getFarmLiquidity(farmLiquidity)}</Typography>):
             (<Skeleton width="50px" />)}
            </TableCell>
            <TableCell align="center">
             {userPoolBalance && farm?( 
              <>
                <Typography>{ connected ? getUserPoolBalanceFormated(farm.pid, farm.index) : '-'}</Typography>
                {connected&&<Typography style={{marginTop: '4px'}} color="textSecondary" variant="body2">{ getUserPoolBalanceInUSD(farm.pid, farm.index,farmLiquidity)}</Typography> }
              </>
             ):(connected?(<Skeleton width="50px" />):'-')}
            </TableCell>
            <TableCell align="center">
             {
            //  farmLiquidity&&farmLiquidity.farmperday? 
            //   (<Typography>{ connected ? getFarmRewardsPerDayFormated(farmLiquidity) : '-'}</Typography>):
            //   (connected?(<Skeleton width="50px" />):'-')
            
              }
                &mdash;
            </TableCell>
            {/* <TableCell align="center">
             {
              // pendingPanaForUser?(<Typography>{connected ? getPendingPanaForUserFormated(farm.pid) : "-"}</Typography>):
              // (connected?(<Skeleton width="50px" />):'-')              
             }
             <b>Concluded</b>
            </TableCell> */}
            <TableCell>
              <Link component={NavLink} to={`/tokenlaunch/${farm.index}`}>
                {
                  <Button disabled={!connected} variant="outlined" color="primary" style={{ width: "100%" }}>
                    <Typography variant="h6">{t`Unstake`}</Typography>
                  </Button>
                }
              </Link>
            </TableCell>
          </TableRow>
        </>
      ) : (
        <>
          <Box sx={{ paddingBottom: 20 }}>
            <Grid container spacing={1}>
              <Grid item xs={3}>
                <TokenStack tokens={farm.icon} />
              </Grid>
              <Grid item xs={9}>
                <Typography variant="h4">
                  {farm.symbol} &nbsp;
                  <Link color="primary" href={farm.url} target="_blank">
                    <Trans>Get </Trans>
                    <SvgIcon component={ArrowUp} htmlColor="#A3A3A3" />
                  </Link>
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography>Multiplier: {farm.points / 10}x</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography>Liquidity:                 
                {farmLiquidity && farmLiquidity.liquidity? 
                  (getFarmLiquidity(farmLiquidity)):
                  (<Skeleton width="50px" />)
                }
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography>My Stakes: 
                {userPoolBalance && farm?( 
                  getUserPoolBalanceFormated(farm.pid, farm.index)):
                  (connected?(<Skeleton width="50px" />):'-')}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography>Per Day: 
                {farmLiquidity&&farmLiquidity.farmperday? 
                    ( connected ? getFarmRewardsPerDayFormated(farmLiquidity) : '-'):
                    (connected?(<Skeleton width="50px" />):'-')
                }
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography>Rewards:                   
                  {
                    pendingPanaForUser?(connected ? getPendingPanaForUserFormated(farm.pid) : "-"):
                    (connected?(<Skeleton width="50px" />):'-')
                  }
                  </Typography>
              </Grid>
              <Grid item xs={12}>
                <Link component={NavLink} to={`/tokenlaunch/${farm.index}`}>
                  <Button variant="outlined" color="primary" style={{ width: "100%" }}>
                    <Typography variant="h6">{t`Stake/Unstake`}</Typography>
                  </Button>
                </Link>
              </Grid>
            </Grid>
          </Box>
        </>
      )}
    </>
  );
}
export default FarmData;
