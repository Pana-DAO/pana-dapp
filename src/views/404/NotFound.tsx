import "./notfound.scss";

import { Trans } from "@lingui/macro";

import karshaCoin from "../../assets/icons/karsha-coin.png";

export default function NotFound() {
  return (
    <div id="not-found">
      <div className="not-found-header">
        <a href="https://panadao.finance" target="_blank">
          <img className="branding-header-icon" src={karshaCoin} alt="PANA DAO" />
        </a>

        <h4>
          <Trans>Page not found</Trans>
        </h4>
      </div>
    </div>
  );
}
