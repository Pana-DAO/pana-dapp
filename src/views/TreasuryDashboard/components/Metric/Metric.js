import { t } from "@lingui/macro";
import { useSelector } from "react-redux";
import { Grid, GridSize, Tooltip, SvgIcon, Typography } from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import { InfoOutlined } from "@material-ui/icons";
import { ReactElement } from "react";
import React from "react";

import { formatCurrency, trim } from "../../../../helpers";
import { formatMoney } from "src/helpers/tokenLaunch";

const sharedProps = {
  labelVariant: "h6",
  metricVariant: "h5",
};

const MetricContent = ({
  label,
  xsUnit,
  isLoading,
  metric,
  className,
  tooltip,
  colSize
}: {
  label: any,
  xsUnit?: GridSize,
  isLoading: boolean,
  metric: any,
  className?: string,
  tooltip?: any,
  colSize?:number
}): ReactElement => {
  return (
    <Grid item xs={12} sm={6} md={colSize?colSize:3} className={className}>
      <Grid className="box-dash">
        <Typography variant="h6" color="textSecondary">
          {label}
          <>
            {tooltip != null ? (
              <Tooltip title={tooltip} style={{ cursor: "pointer" }}>
                <SvgIcon viewBox="-6 -6 30 30" component={InfoOutlined}></SvgIcon>
              </Tooltip>
            ) : (
              <></>
            )}
          </>
        </Typography>
        <Typography variant="h5">
          <>{isLoading ? <Skeleton width="100px" /> : metric}</>
        </Typography>
      </Grid>
    </Grid>
  );
};


export const LRPSupplyRatio = () => {
  const totalSupply = useSelector(state => state.app.totalSupply);
  const panaInPool = useSelector(state => state.app.panaInPool);
  const targetSupplyRatio = useSelector(state => state.app.targetSupplyRatio);
  const isDataLoaded = panaInPool && totalSupply && targetSupplyRatio;
  return <MetricContent colSize={5} label={t`Current Supply Ratio (Target)`} 
  metric={isDataLoaded && trim((panaInPool / totalSupply) * 100, 2) + '%'
    + (targetSupplyRatio && (' / ' + (targetSupplyRatio / 100) + '%'))} isLoading={!isDataLoaded} 
    tooltip={
      <React.Fragment>
        {t`Current Supply Ratio = PANA in Liquidity Pool / Total Supply of PANA`}
        <br /> <br />
        {t`Target - This is the ideal Supply Ratio which the Loss Ratio Peg will aim to achieve`}
      </React.Fragment>
    }/>;
};

export const PanaInPool = () => {
  const panaInPool = useSelector(state => state.app.panaInPool);
  return <MetricContent colSize={3} label={t`PANA in Liquidity Pool`} 
  metric={panaInPool && (formatMoney(panaInPool, true, false))} isLoading={!panaInPool} />;
};

export const LRPTreasuryBalance = () => {
  const lpInTreasury = useSelector(state => state.app.lpInTreasury);
  const panaInTreasury = useSelector(state => state.app.panaInTreasury);
  return <MetricContent colSize={5} label={t`Treasury Balance`} 
  metric={(lpInTreasury && (trim(lpInTreasury, 6) + ' SLP')) + 
        (panaInTreasury && (' / ' + formatMoney(panaInTreasury, true, false) + ' PANA'))} isLoading={!lpInTreasury} 
        tooltip={
          <React.Fragment>
            {t`If Current Supply Ratio is greater than the Target, necessary SLP tokens from treasury will be burnt to pull PANA out of LP.`}
            <br /> <br />
            {t`If Current Supply Ratio is lesser than the Target, necessary PANA from treasury will be used to restore supply in LP.`}
          </React.Fragment>
        }/>;
};

export const LRPDaysToTarget = () => {
  const totalSupply = useSelector(state => state.app.totalSupply);
  const panaInPool = useSelector(state => state.app.panaInPool);
  const targetSupplyRatio = useSelector(state => state.app.targetSupplyRatio);
  const KP = useSelector(state => state.app.KP);
  let days;
  if (totalSupply && panaInPool && targetSupplyRatio && KP) {
    const hrs = (Math.log(0.005 / (Math.abs((targetSupplyRatio / 10000) - (panaInPool / totalSupply)))) / Math.log(1 - KP / 10000));
    days = Number.parseInt(hrs / 24);
  }

  return <MetricContent colSize={4} label={t`Days to reach Target`} 
      metric={(days !== undefined && (days > 0 ? (days + ' - ' + (days + 1) + ' days') : '1 day'))} isLoading={days === undefined} 
      tooltip={t`This is the approximate value considering LRP is executed once every hour. Other market 
          forces like bond purchase and swaps on pool may affect estimation`} />;
};


export const FullyDillutedMarketCap = () => {
  const totalSupply = useSelector(state => state.app.totalSupply);
  const marketPrice = useSelector(state => state.app.marketPrice);
  const isDataLoaded = marketPrice && totalSupply;
  return <MetricContent colSize={4} label={t`Fully Diluted Market Cap`} 
  metric={isDataLoaded && (formatMoney((totalSupply) * (marketPrice),true))} isLoading={!isDataLoaded} />;
};



export const MarketCap = ({colSize}) => {
  const marketCap = useSelector(state => state.app.marketCap || 0);
  return <MetricContent colSize={colSize} label={t`Market Cap`} metric={formatMoney(marketCap, true)} isLoading={!marketCap} />;  
};

export const TVLStakingPool = ({totalLiquidity}) => {
  return <MetricContent label={t`Total Value Locked`} metric={formatMoney(totalLiquidity, true)} isLoading={!totalLiquidity} />;
};

export const PANAPrice = () => {
  const marketPrice = useSelector(state => state.app.marketPrice);
  return (
    <MetricContent
      label={t`PANA Price`}
      metric={marketPrice && formatCurrency(marketPrice, 6)}
      isLoading={!marketPrice}
    />
  );
};

export const FiveDayRate = () => {
  const fiveDayRate = useSelector(state => state.app.fiveDayRate);
  return (
    <MetricContent
      label={t`ROI (5-Day Rate)`}
      metric={fiveDayRate && `${trim(Number(fiveDayRate) * 100, 4)}%`}
      isLoading={!fiveDayRate}
    />
  );
};

export const ExchangeAPY = () => {
  const stakingAPY = useSelector(state => state.app.stakingAPY);
  if(isNaN(stakingAPY)){
    return (
      <MetricContent label={t`APY`} metric={`-`} isLoading={!stakingAPY} />
    );
  }
  const trimmedExchangingAPY = trim(Math.round(stakingAPY * 100), 2);
  const formattedTrimmedExchangingAPY = new Intl.NumberFormat("en-US").format(Number(trimmedExchangingAPY));
  return (
    <MetricContent label={t`APY`} metric={stakingAPY && `${formattedTrimmedExchangingAPY}%`} isLoading={!stakingAPY} />
  );
};

export const NextRewardYield = () => {
  const stakingRebase = useSelector(state => state.app.stakingRebase);
  const stakingRebasePercentage = trim(stakingRebase * 100, 4);
  return (
    <MetricContent
      label={t`Next Reward Yield`}
      metric={stakingRebase && `${stakingRebasePercentage}%`}
      isLoading={!stakingRebase}
    />
  );
};

export const CircSupply = ({colSize}) => {
  const circSupply = useSelector(state => state.app.circSupply);
  const totalSupply = useSelector(state => state.app.totalSupply);
  const isDataLoaded = circSupply && totalSupply;
  return (
    <MetricContent  colSize={colSize}
      label={t`Circulating Supply (total)`} className="fnt-min"
      metric={isDataLoaded && parseInt(circSupply) + " / " + parseInt(totalSupply)}
      isLoading={!isDataLoaded}
    />
  );
};

export const BackingPerPANA = () => {
  const backingPerPana = useSelector(state => state.app.treasuryMarketValue / state.app.circSupply);
  return (
    <MetricContent
      label={t`Backing per PANA`}
      // metric={!isNaN(backingPerPana) && formatCurrency(backingPerPana, 2)}
      isLoading={!backingPerPana}
    />
  );
};

export const CurrentIndex = () => {
  const currentIndex = useSelector(state => state.app.currentIndex);
  return (
    <MetricContent
      label={t`Current Index`}
      metric={currentIndex && trim(currentIndex, 6) + " PANA"}
      isLoading={!currentIndex}
      tooltip={t`The current index tracks the amount of PANA one would have if they held a single KARSHA from day 1.`}
    />
  );
};

export const KARSHAPrice = () => {
  const karshaPrice = useSelector(state => state.app.marketPrice * state.app.currentIndex);
  return (
    <MetricContent
      className="metric wsoprice"
      label={t`KARSHA Price`}
      metric={karshaPrice && formatCurrency(karshaPrice, 6)}
      isLoading={!karshaPrice}
      tooltip={
        <React.Fragment>
          {t`KARSHA = PANA * index`}
          <br /> <br />
          {t`The price of KARSHA is equal to the price of PANA multiplied by the current index`}
        </React.Fragment>
      }
    />
  );
};
