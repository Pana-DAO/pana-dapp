import { Trans } from "@lingui/macro";
import { ReactElement } from "react";

export interface ExternalUrl {
  title: ReactElement;
  url: string;
  icon: string;
}

const externalUrls: ExternalUrl[] = [
  {
    title: <Trans>Forum</Trans>,
    url: "https://forum.panadao.finance/",
    icon: "forum",
  },
  {
    title: <Trans>Governance</Trans>,
    url: "https://vote.panadao.finance/",
    icon: "governance",
  },
  {
    title: <Trans>Docs</Trans>,
    url: "https://docs.panadao.finance/",
    icon: "docs",
  },
];

export default externalUrls;
