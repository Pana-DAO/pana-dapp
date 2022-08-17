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
}: {
  label: any,
  xsUnit?: GridSize,
  isLoading: boolean,
  metric: any,
  className?: string,
  tooltip?: any,
}): ReactElement => {
  return (
    <Grid item xs={12} sm={6} md={3} className={className}>
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

export const MarketCap = () => {
  const marketCap = useSelector(state => state.app.marketCap || 0);
  return <MetricContent label={t`Market Cap`} metric={formatMoney(marketCap, true)} isLoading={!marketCap} />;
};

export const TVLStakingPool = ({totalLiquidity}) => {
  return <MetricContent label={t`Total Value Locked`} metric={formatMoney(totalLiquidity, true)} isLoading={!totalLiquidity} />;
};

export const PANAPrice = () => {
  const marketPrice = useSelector(state => state.app.marketPrice);
  return (
    <MetricContent
      label={t`Pana Price`}
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
  const trimmedExchangingAPY = trim(stakingAPY * 100, 1);
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

export const CircSupply = () => {
  const circSupply = useSelector(state => state.app.circSupply);
  const totalSupply = useSelector(state => state.app.totalSupply);
  const isDataLoaded = circSupply && totalSupply;
  return (
    <MetricContent
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
