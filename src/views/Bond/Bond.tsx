import "./Bond.scss";

import { t, Trans } from "@lingui/macro";
import { Box, Fade, Grid, Typography, Modal, SvgIcon, Paper, Tooltip } from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import { ChangeEvent, Fragment, ReactElement, useEffect, useState } from "react";
import { Settings, Close, InfoOutlined } from "@material-ui/icons";
import { useHistory } from "react-router";
import { useAppSelector } from "src/hooks";
import useEscape from "src/hooks/useEscape";
import { usePathForNetwork } from "src/hooks/usePathForNetwork";
import { useWeb3Context } from "src/hooks/web3Context";
import { IBond } from "src/slices/BondSlice";

import { trim, trim2 } from "../../helpers";
import AdvancedSettings from "./AdvancedSettings";
import BondPurchase from "./BondPurchase";
import TokenStack from "src/lib/PanaTokenStack";

type InputEvent = ChangeEvent<HTMLInputElement>;

const Bond = ({ index }: { index: number }) => {
  const history = useHistory();

  const bond = useAppSelector(state => state.bonding.bonds[index]);
  const { provider, address, networkId } = useWeb3Context();
  usePathForNetwork({ pathName: "bonds", networkID: networkId, history });

  const [slippage, setSlippage] = useState<number>(0.5);
  const [recipientAddress, setRecipientAddress] = useState<string>(address);

  const isBondLoading = useAppSelector<boolean>(state => state.bonding.loading ?? true);
  const onRecipientAddressChange = (e: InputEvent): void => {
    return setRecipientAddress(e.target.value);
  };

  const onSlippageChange = (e: InputEvent): void => {
    return setSlippage(Number(e.target.value));
  };

  const onClickAway = (): void => {
    history.push(`/bonds`);
  };

  useEscape(() => {
    if (advOpen) handleAdvClose;
    else history.push(`/bonds`);
  });

  useEffect(() => {
    if (address) setRecipientAddress(address);
  }, [provider, address]);

  const [advOpen, setadvOpen] = useState<boolean>(false);
  const handleAdvOpen = () => setadvOpen(true);
  const handleAdvClose = () => setadvOpen(false);

  const AdvSettings = (): ReactElement => {
    return (
      <>
        <AdvancedSettings
          open={advOpen}
          handleClose={handleAdvClose}
          slippage={slippage}
          recipientAddress={recipientAddress}
          onRecipientAddressChange={onRecipientAddressChange}
          onSlippageChange={onSlippageChange}
        />
      </>
    );
  };

  const HeaderContent = ({ bond }: { bond: IBond }): ReactElement => {
    return (
      <Box display="flex" flexDirection="row">
        <TokenStack tokens={bond.bondIconSvg} />
        <Box display="flex" flexDirection="column" ml={1} justifyContent="center" alignItems="center">
          <Typography variant="h5">{`${bond.displayName}`}</Typography>
        </Box>
      </Box>
    );
  };
  return (
    <Fade in={true} mountOnEnter unmountOnExit>
      <Grid container>
        <AdvSettings></AdvSettings>
        <Modal
          open={true}
          id="bond-view"
          onClose={onClickAway}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
          // closePosition="left"
          // headerContent={headerContent}
          // topRight={advSettings}
        >
          <Paper className={"modalspace"} elevation={1}>
            <div id="modal-modal-title">
              <div className="modal-header">
                <div className="top-left">
                  <SvgIcon viewBox="0 0 25 25" component={Close} style={{ cursor: "pointer" }} onClick={onClickAway} />
                </div>
                <HeaderContent key={bond.index} bond={bond}></HeaderContent>
                <div className="top-right">
                  <SvgIcon
                    viewBox="0 0 25 25"
                    component={Settings}
                    style={{ cursor: "pointer" }}
                    onClick={handleAdvOpen}
                  />
                </div>
              </div>
              <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center">
                <Typography>{bond.fixedTerm ? t`Fixed Term` : t`Fixed Expiration`}</Typography>
                <Typography style={{ marginTop: "3px" }}>
                  {bond.fixedTerm ? `${bond.duration}` : `${bond.expiration}`}
                </Typography>
              </Box>
            </div>
            <Box id="modal-modal-description" display="flex" flexDirection="row" className="bond-price-data-row">
              <div className="bond-price-data">
                <Typography variant="h5" color="textSecondary">
                  <Trans>Bond Price</Trans>
                </Typography>
                <Typography variant="h3" className={'price'+(bond.isLP?" lpfont":"")} color="primary">
                  <>
                    {bond.soldOut ? (
                      t`--`
                    ) : isBondLoading ? (
                      <Skeleton width="100px" />
                    ) : (
                      <DisplayBondPrice key={bond.index} bond={bond} />
                    )}
                  </>
                </Typography>
              </div>
              <div className="bond-price-data">
                <Typography variant="h5" color="textSecondary">
                  <Trans>Market Price</Trans>
                </Typography>
                <Typography variant="h3" color="primary" className={'price'+(bond.isLP?" lpfont":"")}>
                  {isBondLoading ? <Skeleton /> : trim2(bond.marketPriceInToken, (bond.isLP?14:8)) +(bond.isLP ?  " LP" : " USD")}
                </Typography>
              </div>
            </Box>

            <BondPurchase bond={bond} slippage={slippage} recipientAddress={recipientAddress} />
          </Paper>
        </Modal>
      </Grid>
    </Fade>
  );
};

export const DisplayBondPrice = ({ bond }: { bond: IBond }): ReactElement => {
  if (typeof bond.priceUSD === undefined || bond.soldOut) {
    return <Fragment>--</Fragment>;
  }

  return (
    <Fragment>
      {bond.isLP ? `${trim2(bond.priceUSD, 14)} LP` : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 4,
        minimumFractionDigits: 4,
      }).format(bond.priceUSD)}
    </Fragment>
  );
};

export const DisplayBondDiscount = ({ bond,isNav }: { bond: IBond,isNav:boolean }): ReactElement => {
  if (typeof bond.discount === undefined || bond.soldOut) {
    return <Fragment>--</Fragment>;
  }
  return (
    <Fragment>
      <span style={bond.discount > 0.003 ? { color: "#3ba56c" } : {}}>
        
        {(bond.discount>0?(trim(bond.discount * 100, 2)+"%"):(
          
          <span className="alinMarketpriceinfo">
          {isNav?(<span className="navzerobond">{trim(bond.discount * 100, 2)}%</span>):(<Typography>Buy at Market Price</Typography>)}
          <Tooltip title="Bond price is at par with market price currently due to high demand for bonds. However, you can buy at market price and earn rebase rewards" style={{ cursor: "pointer" }}>
            <SvgIcon viewBox="-6 -6 30 30" component={InfoOutlined}></SvgIcon>
          </Tooltip>
        </span>
        ))}
      </span>
    </Fragment>
  );
};
export default Bond;
