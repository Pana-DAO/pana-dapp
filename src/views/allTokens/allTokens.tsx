import "./allTokens.scss";

import { Box } from "@material-ui/core";
import { Token, tokenPaths } from "src/lib/PanaTokenStack";

function AllTokens() {
  return (
    <>
      <Box display="flex" flexDirection="row">
        {Object.keys(tokenPaths).map(e => {
          return <>{e}<Token name={e} /></>;
        })}
      </Box>
    </>
  );
}

export default AllTokens;
