import { t, Trans } from "@lingui/macro";
import { Button, Link, SvgIcon, TableCell, TableRow, Typography } from "@material-ui/core";
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

function FarmData({ networkId, farm }: { networkId: NetworkId; farm: FarmInfo }) {
  // const dispatch = useDispatch();
  const history = useHistory();
  const [loadCount, setLoadCount] = useState(0);
  const [loadProgress, setLoadProgress] = useState(0);
  const [farmBalanceData, setFarmBalanceData] = useState(Array(farms.length) as BigNumber[]);
  const [farmLiquidity, setFarmLiquidity] = useState(Array(farms.length) as FarmPriceData[]);
  const { provider, address, connect } = useWeb3Context();

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
      const tokenslist = farms.filter(x=>{if(x.coingeckoId) return true;else false;}).map(x => x.coingeckoId).join(',')
      const allprice= await getAllTokenPrice(tokenslist);
      for (let i = 0; i < farms.length; i++) {
        const data = { index: farms[i].index, liquidity: 0 } as FarmPriceData;
        const farmLiq = await farms[i].calculateLiquidity(farms[i].index,allprice[farms[i].coingeckoId]?.usd, provider, networkId);
        if (farmLiq > 0) {
          data.liquidity = farmLiq;
        }
        prices[i] = data;
      }
      setFarmLiquidity(prices);
    };

    loadFarmLiquidity();
  }, [loadCount]);

  function getUserPoolBalanceFormated(pid: number,index: number) {
    if (userPoolBalance) {
      return formatCurrency(+ethers.utils.formatUnits(userPoolBalance[pid], farms[index].decimals), 6,"PANA");
    }
  }

  function getFarmRewardsPerDayFormated(pid:number,index: number) {
    return formatCurrency(+ethers.utils.formatUnits(farmRewardsPerDay(pid,index), 18), 4, "PANA");
  }

  function getPendingPanaForUserFormated(pid: number) {
    if (pendingPanaForUser) {
      return formatCurrency(+ethers.utils.formatUnits(pendingPanaForUser[pid], 18), 4, "PANA");
    }
  }

  function farmRewardsPerDay(pid:number, index: number): BigNumber {
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
        <Typography>{getUserPoolBalanceFormated(farm.pid, farm.index)}</Typography>
      </TableCell>
      <TableCell align="center">
        <Typography>{getFarmRewardsPerDayFormated(farm.pid, farm.index)}</Typography>
      </TableCell>
      <TableCell align="center">
        <Typography>{getPendingPanaForUserFormated(farm.pid)}</Typography>
      </TableCell>
      <TableCell>
        <Link component={NavLink} to={`/tokenlaunch/${farm.index}`}>
          <Button variant="outlined" color="primary" style={{ width: "100%" }}>
            <Typography variant="h6">{t`Stake/Unstake`}</Typography>
          </Button>
        </Link>
      </TableCell>
    </TableRow>
  );
}
export default FarmData;
