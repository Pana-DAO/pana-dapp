/* eslint-disable global-require */
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { FC, useEffect } from "react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import { SHOW_COUNTDOWN_PAGE } from "./constants";
import CountDown from "./CountDown";
import { Web3ContextProvider } from "./hooks/web3Context";
import { initLocale } from "./locales";
import store from "./store";

const Root: FC = () => {
  useEffect(() => {
    initLocale();
  }, []);

  if (SHOW_COUNTDOWN_PAGE) {
    return <CountDown />
  } else {
    return (
      <Web3ContextProvider>
        <Provider store={store}>
          <I18nProvider i18n={i18n}>
            <BrowserRouter basename={"/#"}>
              <App />
            </BrowserRouter>
          </I18nProvider>
        </Provider>
      </Web3ContextProvider>
    )
  }

};

export default Root;
