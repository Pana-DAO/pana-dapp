import { Link, SvgIcon } from "@material-ui/core";
import React from "react";
import { ReactComponent as GitHubIcon } from "../../assets/icons/github.svg";
import { ReactComponent as MediumIcon } from "../../assets/icons/medium.svg";
import { ReactComponent as TwitterIcon } from "../../assets/icons/twitter.svg";
import { ReactComponent as DiscordIcon } from "../../assets/icons/discord.svg";
import { ReactComponent as DocsIcon } from "../../assets/icons/docs.svg";
const Social: React.FC = () => (
  <div className="social-row">
    <Link href="https://github.com/PanaDAO" target="_blank">
      <SvgIcon viewBox="0 0 20 20" component={GitHubIcon} />
    </Link>
    <Link href="https://karshapana.medium.com/" target="_blank">
      <SvgIcon viewBox="0 0 20 20" component={MediumIcon} />
    </Link>
    <Link href="https://twitter.com/KarshaPana" target="_blank">
      <SvgIcon viewBox="0 0 20 20" component={TwitterIcon} />
    </Link>
    <Link href="https://discord.gg/KarshaPana" target="_blank">
      <SvgIcon viewBox="0 0 20 20" component={DiscordIcon} />
    </Link>
    <Link href="https://docs.panadao.finance/" target="_blank">
      <SvgIcon viewBox="0 0 20 20" className="menuicon" component={DocsIcon} />
    </Link>
  </div>
);

export default Social;
