/* eslint-disable prettier/prettier */
import "./tokenLaunch.scss";
import { t, Trans } from "@lingui/macro";
import {
  Button,
  Typography,
  Zoom,
  Paper,
  useMediaQuery,
  Grid,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@material-ui/core";
import { useAppSelector, useWeb3Context } from "src/hooks";
import { useHistory } from "react-router";
import { usePathForNetwork } from "src/hooks/usePathForNetwork";
import { useState } from "react";
import { FarmPriceData, farms } from "src/helpers/tokenLaunch";
import FarmData from "./farmData";
import { isPendingTxn, txnButtonText } from "src/slices/PendingTxnsSlice";
import { BigNumber, ethers } from "ethers";
import { formatCurrency } from "src/helpers";
import { onHarvestAll } from "src/slices/StakingPoolsSlice";
import { useDispatch } from "react-redux";
// import { AppDispatch } from "src/store";
import { CircSupply, MarketCap, PANAPrice, TVLStakingPool } from "../TreasuryDashboard/components/Metric/Metric";
import { Skeleton } from "@material-ui/lab";
import { useEffect } from "react";
import { getAllTokenPrice } from "src/helpers";
import {
  // FarmInfo,
  // formatMoney,
  stakingPoolsConfig,
  totalFarmPoints,
} from "src/helpers/tokenLaunch";


function TokenLaunch() {
  // const dispatch = useDispatch<AppDispatch>();
  const dispatch = useDispatch();
  const history = useHistory();
  const { provider, address, connect, networkId, connected } = useWeb3Context();  
  usePathForNetwork({ pathName: "tokenlaunch", networkID: networkId, history });
  const isSmallScreen = useMediaQuery("(max-width: 885px)"); // change to breakpoint query
  const [loadCount, setLoadCount] = useState(0);  
  const [loadProgress, setLoadProgress] = useState(0);
  const [checkIsLoading, setCheckIsLoading] = useState(false);   
  const [checkIsTotalPana, setCheckIsTotalPana] = useState(false);    
  const [zoomed, setZoomed] = useState(false);
  const [totalLiquidity, setTotalLiquidity] = useState(0);
  const [totalLiquidityUSD, setTotalLiquidityUSD] = useState(0);
  const [totalPana, setTotalPana] = useState(BigNumber.from(0));
  
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

  // const [farmPanaPerday, setFarmPanaPerday] = useState(Array(farms.length) as BigNumber[]);
  // const [farmLiquidityData, setfarmLiquidityData] = useState(Array(farms.length) as number[]);
  const [farmLiquidity, setFarmLiquidity] = useState(Array(farms.length) as FarmPriceData[]); 
  const pendingTransactions = useAppSelector(state => {
    return state.pendingTransactions;
  });

  const totalPendingPanaForUser = useAppSelector(state => {
    return state.stakingPools.pendingPanaForUser && state.stakingPools.pendingPanaForUser.length > 0
      ? state.stakingPools.pendingPanaForUser.reduce((total, val) => total.add(val))
      : null;
  });
  
  const modalButton = [];

  const doHarvestAll = () => {
    dispatch(onHarvestAll({ provider, networkID: networkId, address }));
  };

  const checkGreaterZero = (val:BigNumber) => {    
    return val.gt(BigNumber.from(0));
  };

  const arbitrum_mainnet = NETWORKS[NetworkId.ARBITRUM_MAINNET];

  const handleSwitchChain = (id: any) => {
    return () => {
      switchNetwork({ provider: provider, networkId: id });
    };
  };

  const loadFarmLiquidity = async (isOnlyTotalValue:boolean) => {
    //to avoid whole run for totak value alone
    // if(chcktotalPana){
    //   await new Promise(resolve => setTimeout(resolve, 5000));
    //   if(address) return;      
    // }
    const tokenslist = farms
      .filter(x => {
        if (x.coingeckoId) return true;
        else false;
      })
      .map(x => x.coingeckoId)
      .join(",");
    let allprice = await getAllTokenPrice(tokenslist);
    let retryCount=0
    while(allprice==null && retryCount<3){
      await new Promise(resolve => setTimeout(resolve, 1000));
      allprice = await getAllTokenPrice(tokenslist);
      retryCount+=1;
    }      
    let totalP=BigNumber.from("0");
    let totalLiq=0;
    let totalLiqUSD=0;   
    const calculPromise: Promise<{
          balance: BigNumber;
          price: number;
          liquidity: number;
          isLoad: boolean;
      }>[] = farms.map((farm,indx)=>
                  farms[indx].calculateLiquidity(
                  farms[indx].index,
                  allprice[farms[indx].coingeckoId]?.usd,
                  provider,
                  networkId,
                ));
    const responses = await Promise.all(calculPromise)
    for (let i = 0; i < responses.length; i++) {
      const data = {balance:BigNumber.from("0"), index: farms[i].index,liquidityUSD:0, farmperday:BigNumber.from("0"), liquidity: 0, price: 0,isLoad:false } as FarmPriceData;
      // const farmLiq = await farms[i].calculateLiquidity(
      //   farms[i].index,
      //   allprice[farms[i].coingeckoId]?.usd,
      //   provider,
      //   networkId,
      // );
      const farmLiq = responses[i];
      if (farmLiq) {
        const userpool = userPoolBalance!=null?userPoolBalance[farms[i].pid??0]:0;
        data.liquidity = farmLiq.liquidity > 0 ? farmLiq.liquidity : 0;
        data.price = farmLiq.price > 0 ? farmLiq.price : 0;
        data.balance = farmLiq.balance;
        data.farmperday = farmRewardsFarmPerDay(farms[i].pid,data.balance,farms[i].points);        
        data.liquidityUSD= data.price * +ethers.utils.formatUnits(userpool, farms[i].decimals);
        if(farmLiq.isLoad){
          farmLiquidity[i]=data; 
          totalP=totalP.add(data.farmperday??0);
          totalLiq=totalLiq+(data.liquidity??0);
          totalLiqUSD=totalLiqUSD+(data.liquidityUSD??0)          
          setFarmLiquidity(farmLiquidity);
        }
      }       
    }
    if(isOnlyTotalValue){ 
      setTotalLiquidity(totalLiq);
      setCheckIsTotalPana(false);
    }
    else{
      setTotalLiquidity(totalLiq);
      setTotalLiquidityUSD(totalLiqUSD);
      setTotalPana(totalP);
    }    

  };
 
  useEffect(() => {
    //&&userPoolBalance!=null 
    if(checkIsLoading==false && ((address&&userPoolBalance!=null))){         
      setCheckIsLoading(true);   
      setCheckIsTotalPana(false);
      loadFarmLiquidity(false).finally(()=>{
        setCheckIsLoading(false);
        setCheckIsTotalPana(true);
      });
    }
  }, [loadCount]);

  useEffect(() => {
    if(!address){
      loadFarmLiquidity(true);
    }
  }, [address]);
  

  function farmRewardsFarmPerDay(pid: number, farmBalanceData:any,farmpoints:any): BigNumber {    
    if (userPoolBalance && userPoolBalance[pid] && farmBalanceData) {
      const poolTotal = farmBalanceData;      
      if (poolTotal.gt(0)) {
        const amount = userPoolBalance[pid];
        const farmPerDay = stakingPoolsConfig.panaPerSecond.mul(86400).mul(farmpoints).div(totalFarmPoints);        
        return farmPerDay.mul(amount).div(poolTotal);
      }
    }
    return ethers.constants.Zero;
  }

  const farmPanaUpdate =()=>{
    console.log("updateparent")
  }

  modalButton.push(
    <Button variant="contained" color="primary" className="connect-button" onClick={connect} key={1}>
      <Trans>Connect Wallet</Trans>
    </Button>,
  );
  
  useEffect(() => {
    if (hoursLeft(stakingPoolsConfig.startTime) <= 0) {
      let progress = 0;
      const interval = setInterval(() => {
        if (!address) {
          setLoadProgress((progress = 0));
        } else {
          setLoadProgress((progress += (6.6667)));
          if (progress >= 100) {
            if (!document.hidden) {  
              setLoadCount(loadCount=>loadCount+1);
            }
            progress = 0;
          }
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [address]);
  function hoursLeft(date: number): number {
    const diffTime = date - Date.now() / 1000;
    if (diffTime < 0) return 0;
    const diffHours = Math.ceil(diffTime / (60 * 60));
    return diffHours;
  }

  // function daysLeft(date: number): number {
  //   const diffTime = date - Date.now() / 1000;
  //   if (diffTime < 0) return 0;
  //   const diffDays = Math.ceil(diffTime / (60 * 60 * 24));
  //   return diffDays;
  // }
  return (
    <div id="token-launch-view">
      { !checkNetwork(networkId).enabledNetwork ? (
        <>
          <SwitchChain provider={provider} />
        </>
      ) : (
        <Zoom in={true} onEntered={() => setZoomed(true)}>
          <Paper className="paper-format" elevation={0}>
            <Typography variant="h5" className="card-header" style={{ fontWeight: 600 }}>
              {t`Pana Token Launch`}
            </Typography>

            {farms.length != 0 && (
              <>
                <Grid container direction="row" className="small-box" spacing={1}>
                  <TVLStakingPool totalLiquidity={totalLiquidity} />

                  <MarketCap />
                  <PANAPrice />
                  <CircSupply />
                </Grid>
                { connected && <Grid container className="bigboxspace" direction="row" spacing={1}>
                  <Grid item xs={12} sm={6}>
                    <Grid className="box-dash big-box">
                      <Typography variant="h5" align="center" className="claimable-balance">
                        Claimable Pana Rewards
                      </Typography>
                      <Typography variant="h4" align="center" style={{ marginBottom: "10px" }}>
                        {totalPendingPanaForUser
                          ? formatCurrency(+ethers.utils.formatUnits(totalPendingPanaForUser, 18), 4, "PANA")
                          : "-"}
                      </Typography>

                      <Button
                        variant="contained"
                        color="primary"
                        className="transaction-button"
                        fullWidth
                        disabled={
                          isPendingTxn(pendingTransactions, "farm_harvestAll") ||
                          !totalPendingPanaForUser ||
                          (totalPendingPanaForUser && +totalPendingPanaForUser <= 0)
                        }
                        onClick={doHarvestAll}
                      >
                        {txnButtonText(pendingTransactions, "farm_harvestAll", t`Harvest All`)}
                      </Button>
                    </Grid>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Grid className="box-dash big-box">
                      <div style={{ margin: "auto" }}>
                        <Typography variant="h5" align="center" className="claimable-balance">
                          Expected Pana Rewards
                        </Typography>
                        <Typography variant="h5" align="center" className="claimable-balance info-perday">
                          Per Day
                        </Typography>
                        <Typography variant="h4" align="center" style={{ marginBottom: "10px" }}>
                          <>
                            {((totalLiquidity&&!checkIsLoading&&checkIsTotalPana)||checkGreaterZero(totalPana)) ? (
                               totalPana ? (
                                formatCurrency(+ethers.utils.formatUnits(totalPana, 18), 4, "PANA")
                              ) : (
                                "-"
                              )
                            ) :<Skeleton width="200px" />}
                          </>
                        </Typography>
                      </div>
                    </Grid>
                  </Grid>
                </Grid> }
                <Grid container className="MuiPaper-root">
                  {!isSmallScreen ? (
                    <TableContainer>
                      <Table aria-label="Available bonds">
                        <>
                          <TableHead>
                            <TableRow>
                              <TableCell align="left">
                                <Trans>Name</Trans>
                              </TableCell>
                              <TableCell align="center">
                                <Trans>Multiplier</Trans>
                              </TableCell>
                              <TableCell align="center">
                                <Trans>Liquidity</Trans>
                              </TableCell>
                              <TableCell align="center">
                                <Trans>My Stakes</Trans>
                              </TableCell>
                              <TableCell align="center">
                                <Trans>Per Day</Trans>
                              </TableCell>
                              <TableCell align="center">
                                <Trans>Rewards (Pana)</Trans>
                              </TableCell>
                            </TableRow>
                          </TableHead>
                        </>
                        <TableBody>
                          {farms.filter(farm => farm.network == networkId).map((farm,indx) => {

                            //if (bond.displayName !== "unknown")
                            return (
                              <FarmData
                                networkId={networkId}
                                key={farm.index}
                                farm={farm}
                                farmLiquidity={farmLiquidity[indx]}
                                onFarmPanaUpdate={farmPanaUpdate}
                              />
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <>
                      {farms.filter(farm => farm.network == networkId).map((farm,indx) => {

                        //if (bond.displayName !== "unknown")
                        return (
                          <FarmData
                            networkId={networkId}
                            key={farm.index}
                            farm={farm}
                            farmLiquidity={farmLiquidity[indx]}
                            onFarmPanaUpdate={farmPanaUpdate}
                          />
                        );
                      })}
                    </>
                  )}
                </Grid>
              </>
            )}
          </Paper>
        </Zoom>
      )}
    </div>
  );
}

export default TokenLaunch;
