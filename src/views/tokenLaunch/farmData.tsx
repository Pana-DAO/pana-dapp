import { t, Trans } from "@lingui/macro";
import { Box, Button, Grid, Link, SvgIcon, TableCell, TableRow, Typography, useMediaQuery } from "@material-ui/core";
import { BigNumber, ethers } from "ethers";
import { useEffect, useState } from "react";
import { NavLink, useHistory } from "react-router-dom";
import { NetworkId } from "src/constants";
import { formatCurrency, getAllTokenPrice } from "src/helpers";
import {
  FarmInfo,
  FarmPriceData,
  farms,
  formatMoney,
  stakingPoolsConfig,
  totalFarmPoints,
} from "src/helpers/tokenLaunch";
import { useAppSelector, useWeb3Context } from "src/hooks";
import TokenStack from "src/lib/PanaTokenStack";
import { getErc20TokenBalance } from "src/slices/StakingPoolsSlice";
import { ReactComponent as ArrowUp } from "../../assets/icons/arrow-up.svg";

function FarmData({
  networkId,
  farm,
  onFarmLiquidityUpdate,
  onFarmPanaUpdate,
}: {
  networkId: NetworkId;
  farm: FarmInfo;
  onFarmLiquidityUpdate: any;
  onFarmPanaUpdate: any;
}) {
  // const dispatch = useDispatch();
  const history = useHistory();
  const [loadCount, setLoadCount] = useState(0);
  const [loadProgress, setLoadProgress] = useState(0);
  const [farmBalanceData, setFarmBalanceData] = useState(Array(farms.length) as BigNumber[]);
  const [farmLiquidity, setFarmLiquidity] = useState(Array(farms.length) as FarmPriceData[]);
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

  useEffect(() => {
    if (hoursLeft(stakingPoolsConfig.startTime) <= 0) {
      let progress = 0;
      const interval = setInterval(() => {
        if (!address) {
          setLoadProgress((progress = 0));
        } else {
          setLoadProgress((progress += 6.6667));
          if (progress >= 100) {
            if (document.hasFocus()) {
              setLoadCount(loadCount => loadCount + 1);
            }
            progress = 0;
          }
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [address]);

  useEffect(() => {
    const loadBalanceData = async () => {
      const promises: Array<Promise<BigNumber>> = Array(farms.length);
      for (let i = 0; i < farms.length; i++) {
        promises[i] = getErc20TokenBalance(farms[i].address, provider, networkId);
      }
      setFarmBalanceData(await Promise.all(promises));
    };
    loadBalanceData();
  }, [loadCount]);

  function getFarmLiquidity(index: number): string {
    const farmLiq = farmLiquidity.find(p => {
      return p && p.index === index;
    });
    if (farmLiq && farmLiq.liquidity > 0) {
      return formatMoney(farmLiq.liquidity, true);
    }
    return "-";
  }

  useEffect(() => {
    const loadFarmLiquidity = async () => {
      const prices = Array(farms.length) as FarmPriceData[];      
      const tokenslist = farms
        .filter(x => {
          if (x.coingeckoId) return true;
          else false;
        })
        .map(x => x.coingeckoId)
        .join(",");
      const allprice = await getAllTokenPrice(tokenslist);
      for (let i = 0; i < farms.length; i++) {
        const data = { index: farms[i].index, liquidity: 0, price: 0 } as FarmPriceData;
        const farmLiq = await farms[i].calculateLiquidity(
          farms[i].index,
          allprice[farms[i].coingeckoId]?.usd,
          provider,
          networkId,
        );
        if (farmLiq) {
          data.liquidity = farmLiq.liquidity > 0 ? farmLiq.liquidity : 0;
          data.price = farmLiq.price > 0 ? farmLiq.price : 0;
        }
        prices[i] = data;        
      }
      setFarmLiquidity(prices);
      onFarmLiquidityUpdate(prices.map(p => p.liquidity).reduce((total, p) => total += p));      
    };

    loadFarmLiquidity();
  }, [loadCount]);

  useEffect(() => {
    const loadPanaPerday = async () => {      
      const panaperdaylst = Array(farms.length) as BigNumber[];      
      for (let i = 0; i < farms.length; i++) {        
        panaperdaylst[i] =farmRewardsPerDay(farms[i].pid, farms[i].index);
      }      
      onFarmPanaUpdate(panaperdaylst.map(p => p).reduce((total, p) => total= total.add(p)));
    };
    loadPanaPerday();
  }, [loadCount]);

  function getUserPoolBalanceFormated(pid: number, index: number) {
    if (userPoolBalance) {
      return formatCurrency(+ethers.utils.formatUnits(userPoolBalance[pid], farms[index].decimals), 6, "PANA");
    }
  }

  function getUserPoolBalanceInUSD(pid: number, index: number) {
    if (userPoolBalance) {
      const farmLiq = farmLiquidity.find(p => {
        return p && p.index === index;
      });
      if (farmLiq && farmLiq.price > 0)
        return '$' + formatCurrency((farmLiq.price * +ethers.utils.formatUnits(userPoolBalance[pid], farms[index].decimals)), 4, "PANA");
    }
  }

  function getFarmRewardsPerDayFormated(pid: number, index: number) {
    return formatCurrency(+ethers.utils.formatUnits(farmRewardsPerDay(pid, index), 18), 4, "PANA");
  }

  function getPendingPanaForUserFormated(pid: number) {
    if (pendingPanaForUser) {
      return formatCurrency(+ethers.utils.formatUnits(pendingPanaForUser[pid], 18), 4, "PANA");
    }
  }

  function farmRewardsPerDay(pid: number, index: number): BigNumber {
    if (userPoolBalance && userPoolBalance[pid] && farmBalanceData[index]) {
      const poolTotal = farmBalanceData[index];
      if (poolTotal.gt(0)) {
        const amount = userPoolBalance[pid];
        const farmPerDay = stakingPoolsConfig.panaPerSecond.mul(86400).mul(farms[index].points).div(totalFarmPoints);
        return farmPerDay.mul(amount).div(poolTotal);
      }
    }
    return ethers.constants.Zero;
  }

  function hoursLeft(date: number): number {
    const diffTime = date - Date.now() / 1000;
    if (diffTime < 0) return 0;
    const diffHours = Math.ceil(diffTime / (60 * 60));
    return diffHours;
  }

  function daysLeft(date: number): number {
    const diffTime = date - Date.now() / 1000;
    if (diffTime < 0) return 0;
    const diffDays = Math.ceil(diffTime / (60 * 60 * 24));
    return diffDays;
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
              <Typography>{farm.points / 10}x</Typography>
            </TableCell>
            <TableCell align="center">
              <Typography>{getFarmLiquidity(farm.index)}</Typography>
            </TableCell>
            <TableCell align="center">
              <Typography>{ connected ? getUserPoolBalanceFormated(farm.pid, farm.index) : '-'}</Typography>
              { connected && <Typography style={{marginTop: '4px'}} color="textSecondary" variant="body2">{getUserPoolBalanceInUSD(farm.pid, farm.index)}</Typography> }
            </TableCell>
            <TableCell align="center">
              <Typography>{ connected ? getFarmRewardsPerDayFormated(farm.pid, farm.index) : '-'}</Typography>
            </TableCell>
            <TableCell align="center">
              <Typography>{ connected ? getPendingPanaForUserFormated(farm.pid) : '-'}</Typography>
            </TableCell>
            <TableCell>
              <Link component={NavLink} to={`/tokenlaunch/${farm.index}`}>
                { <Button disabled={ !connected } variant="outlined" color="primary" style={{ width: "100%" }}>
                  <Typography variant="h6">{t`Stake/Unstake`}</Typography>
                </Button> }
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
                <Typography>Liquidity: {getFarmLiquidity(farm.index)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography>My Stakes: {getUserPoolBalanceFormated(farm.pid, farm.index)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography>Per Day: {getFarmRewardsPerDayFormated(farm.pid, farm.index)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography>Rewards: {getPendingPanaForUserFormated(farm.pid)}</Typography>
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
