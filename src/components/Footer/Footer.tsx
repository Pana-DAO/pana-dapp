import "./footer.scss";
import React from "react";
import { Box, Grid, Link, SvgIcon, Paper, Typography } from "@material-ui/core";
import { ReactComponent as PanaDAOIcon } from "../../assets/icons/panadao-nav-header.svg";
import Social from "../Sidebar/Social";

const Footer: React.FC = () => (
  <Paper className="dapp-footer">
    <Grid container>
      <Grid item xs={1}></Grid>
      <Grid item xs={3} sm={2} md={1} className="dapp-footer-logo">
        <Link href="https://panadao.finance" target="_blank">
          <SvgIcon
            color="primary"
            component={PanaDAOIcon}
            viewBox="0 0 151 40"
            style={{ minWidth: "120px", minHeight: "32px", width: "120px" }}
          />
        </Link>
      </Grid>
      <Grid item xs={12} sm={8} md={6} className="dapp-footer-logo-text">
        <Grid className="dapp-footer-logo-text-inner">
          <Typography variant="body2" color="textSecondary">
            A Humble Mission to Serve the Underserved. A Bold Goal to Provide Insurance to Everyone.
          </Typography>
        </Grid>
      </Grid>
      <Grid item xs={12} sm={8} md={2} className="dapp-footer-social">
        <Box display="flex" justifyContent="space-between" flexDirection="column">
          <Social />
        </Box>
      </Grid>
    </Grid>
  </Paper>
);

export default Footer;
