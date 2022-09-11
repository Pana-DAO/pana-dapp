import "./sidebar.scss";

import { Box, Link, Paper, SvgIcon, Typography, ListSubheader, List, ListItem, Collapse } from "@material-ui/core";
import {
  ExpandLess,
  ExpandMore,
  AccountBalanceOutlined,
  DashboardOutlined,
  FilterNoneOutlined,
  InfoOutlined,
  BubbleChartOutlined,
} from "@material-ui/icons";

import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { NavLink, useLocation } from "react-router-dom";
import { useAppSelector } from "src/hooks";
import { useWeb3Context } from "src/hooks/web3Context";
import { DisplayBondDiscount } from "src/views/Bond/Bond";

import karshaCoin from "../../assets/icons/karsha-coin.png";
// import karshalogo from "../../assets/images/logo.png";
import WalletAddressEns from "../TopBar/Wallet/WalletAddressEns";
import RebaseTimer from "../RebaseTimer/RebaseTimer";

import { ReactComponent as PanaDAOIcon } from "../../assets/icons/panadao-nav-header.svg";
import { getUserPoolBalance, getUserPendingPana } from "src/slices/StakingPoolsSlice";
import { checkNetwork, isWalletTestnet } from "src/helpers/NetworkHelper";

type NavContentProps = {
  handleDrawerToggle?: () => void;
};

const NavContent: React.FC<NavContentProps> = ({ handleDrawerToggle }) => {
  const { networkId, address, provider } = useWeb3Context();
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [isRedeemOpen, setIsRedeemOpen] = useState<boolean>(true);
  const location = useLocation();

  const dispatch = useDispatch();
  const bonds = useAppSelector(state => state.bonding.indexes.map(index => state.bonding.bonds[index]));
  const pPanaBalance = useAppSelector(state => state.account.balances && state.account.balances.pPana);
  const pPanaTerms = useAppSelector(state => state.account.pPanaTerms);

  const showPPana = () => {
    return (
      (pPanaBalance && +pPanaBalance > 0) ||
      (pPanaTerms && pPanaTerms.active && pPanaTerms.locked && pPanaTerms.locked > 0)
    );
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && handleDrawerToggle) {
      handleDrawerToggle();
    }
  }, [location]);

  useEffect(() => {
    const interval = setTimeout(() => {
      // dispatch(getAllBonds({ address, networkID: networkId, provider }));
      // dispatch(getUserNotes({ address, networkID: networkId, provider }));
      dispatch(getUserPoolBalance({ networkID: networkId, address, provider }));
      dispatch(getUserPendingPana({ networkID: networkId, address, provider }));
    }, 60000);
    return () => clearTimeout(interval);
  });

  const sortedBonds = bonds
    .filter(bond => bond.soldOut === false)
    .sort((a, b) => {
      return a.discount > b.discount ? -1 : b.discount > a.discount ? 1 : 0;
    });

  return (
    <Paper className="dapp-sidebar">
      <Box className="dapp-sidebar-inner" display="flex" justifyContent="space-between" flexDirection="column">
        <div className="dapp-menu-top">
          <Box className="branding-header">
            <Link href="https://panadao.finance" target="_blank" className="branding-header-logo">
              <img className="panalogo" src={karshaCoin} alt="Karsha Coin" />
              <SvgIcon
                color="primary"
                component={PanaDAOIcon}
                viewBox="0 0 151 40"
                style={{ minWidth: "151px", minHeight: "40px", width: "151px" }}
              />
            </Link>
            {checkNetwork(networkId) ? (
              <>
                <WalletAddressEns />
                {isWalletTestnet(networkId) ? <RebaseTimer /> : <></>}
              </>
            ) : (
              <></>
            )}
          </Box>

          <div className="dapp-menu-links">
            <div className="dapp-nav" id="navbarNav">
              {
                <>
                  <List component="nav">
                    {isWalletTestnet(networkId) ? (
                      <Link className="nav-link" component={NavLink} to="/dashboard">
                        <ListItem button selected={location.pathname == "/dashboard"}>
                          <Typography variant="h6" className="nav-content">
                            <div className="nav-svg">
                              <SvgIcon viewBox="0 0 25 25" className="menuicon" component={DashboardOutlined} />
                            </div>
                            <div className="nav-text">Dashboard</div>
                          </Typography>
                        </ListItem>
                      </Link>
                    ) : (
                      <></>
                    )}
                    <Link className="nav-link" component={NavLink} to="/tokenlaunch">
                      <ListItem button selected={location.pathname == "/tokenlaunch"}>
                        <Typography variant="h6" className="nav-content">
                          <div className="nav-svg">
                            <SvgIcon viewBox="0 0 25 25" className="menuicon" component={BubbleChartOutlined} />
                          </div>
                          <div className="nav-text">Token Launch</div>
                        </Typography>
                      </ListItem>
                    </Link>
                    <Link className="nav-link" component={NavLink} to="/bonds">
                        <ListItem button selected={location.pathname.indexOf("/bonds") > -1}>
                          <Typography variant="h6" className="nav-content">
                            <div className="nav-svg">
                              <SvgIcon viewBox="0 0 25 25" className="menuicon" component={AccountBalanceOutlined} />
                            </div>
                            <div className="nav-text">Bonds</div>
                          </Typography>
                        </ListItem>
                      </Link>
                    {isWalletTestnet(networkId) ? (
                      <>
                        
                        <Collapse in={true} timeout="auto" unmountOnExit>
                          <List
                            className="submenu"
                            subheader={
                              <ListSubheader onClick={() => setIsOpen(!isOpen)} component="div">
                                Highest Discount
                                {isOpen ? (
                                  <ExpandLess className="arrowposition-roi" />
                                ) : (
                                  <ExpandMore className="arrowposition-roi" />
                                )}
                              </ListSubheader>
                            }
                            component="div"
                            disablePadding
                          >
                            <Collapse in={isOpen} timeout="auto" unmountOnExit>
                              <div className="submenulist">
                                {sortedBonds.map((bond, i) => {
                                  return (
                                    <Link
                                      component={NavLink}
                                      to={`/bonds/${bond.index}`}
                                      key={i}
                                      className={"bond"}
                                      onClick={handleDrawerToggle}
                                    >
                                      <Typography variant="body2">
                                        {bond.displayName}
                                        <span className="bond-pair-roi">
                                          <DisplayBondDiscount key={bond.index} bond={bond} />
                                        </span>
                                      </Typography>
                                    </Link>
                                  );
                                })}
                              </div>
                            </Collapse>
                          </List>
                        </Collapse>
                        <Link className="nav-link" component={NavLink} to="/exchange">
                          <ListItem button selected={location.pathname == "/exchange"}>
                            <Typography variant="h6" className="nav-content">
                              <div className="nav-svg">
                                <SvgIcon viewBox="0 0 25 25" className="menuicon" component={FilterNoneOutlined} />
                              </div>
                              <div className="nav-text">Unwrap</div>
                            </Typography>
                          </ListItem>
                        </Link>
                      </>
                    ) : (
                      <></>
                    )}
                    {/* {isWalletTestnet(networkId) ? ( // pPana Redeem is not available in phase-2
                      <>
                        <ListItem button onClick={() => setIsRedeemOpen(!isRedeemOpen)}>
                          <Typography variant="h6" className="nav-content">
                            <div className="nav-svg">
                              <SvgIcon viewBox="0 0 25 25" className="menuicon" component={RedeemOutlined} />
                            </div>
                            <div className="nav-text">Redeem</div>
                          </Typography>
                          {isRedeemOpen ? (
                            <ExpandLess className="arrowposition" />
                          ) : (
                            <ExpandMore className="arrowposition" />
                          )}
                        </ListItem>
                        <Collapse in={isRedeemOpen} className="submenu pad0" timeout="auto" unmountOnExit>
                          <div className="submenulist menu2">
                            <List>
                              {showPPana() ? (
                                <Link className="nav-link" component={NavLink} to="/redeem/ppana">
                                  <ListItem button selected={location.pathname == "/redeem/ppana"}>
                                    <Typography variant="h6" className="nav-content">
                                      <div className="nav-text">pPana</div>
                                    </Typography>
                                  </ListItem>
                                </Link>
                              ) : (
                                <></>
                              )}
                            </List>
                          </div>
                        </Collapse>
                      </>
                    ) : (
                      <></>
                    )} */}
                    <Link className="nav-link" component={NavLink} to="/memorandum">
                      <ListItem button selected={location.pathname == "/memorandum"}>
                        <Typography variant="h6" className="nav-content">
                          <div className="nav-svg">
                            <SvgIcon viewBox="0 0 25 25" className="menuicon" component={InfoOutlined} />
                          </div>
                          <div className="nav-text">Memorandum</div>
                        </Typography>
                      </ListItem>
                    </Link>
                  </List>
                </>
              }
            </div>
          </div>
        </div>
      </Box>
    </Paper>
  );
};

export default NavContent;
