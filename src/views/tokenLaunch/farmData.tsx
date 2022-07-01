import { t, Trans } from "@lingui/macro";
import { Button, Link, SvgIcon, TableCell, TableRow, Typography } from "@material-ui/core";
import { NavLink, useHistory } from "react-router-dom";
import { NetworkId } from "src/constants";
import { FarmInfo } from "src/helpers/tokenLaunch";
import TokenStack from "src/lib/PanaTokenStack";
import { ReactComponent as ArrowUp } from "../../assets/icons/arrow-up.svg";

function FarmData({ networkId, farm }: { networkId: NetworkId, farm: FarmInfo }) {
    // const dispatch = useDispatch();
    const history = useHistory();


    function farmLiquidity(index: number): string {
        // if (farmPriceData[index]) {
        //   return formatMoney(farmPriceData[index].liquidity, true);
        // }
        return '-';
    }

    return (
        <TableRow id={`${farm.index}--farm`}>
            <TableCell align="left" className="farm-name-cell">
                <div className="farm-asset-icon"><TokenStack tokens={farm.icon} /></div>
                <div className="farm-name">
                    <>
                        <Typography variant="body1">{farm.symbol}</Typography>
                        <Link color="primary" href={farm.url} target="_blank">
                            <Typography variant="body1">
                                <Trans>Get </Trans>
                                <SvgIcon component={ArrowUp} htmlColor="#A3A3A3" />
                            </Typography>
                        </Link>
                    </>
                </div>
            </TableCell>
            <TableCell align="left">
                <Typography>{farm.points / 10}x</Typography>
            </TableCell>
            <TableCell align="left">
                <Typography>{farmLiquidity(farm.index)}</Typography>
            </TableCell>
            <TableCell align="left">
                <Typography>9.77</Typography>
            </TableCell>
            <TableCell align="left">
                <Typography>0.03358</Typography>
            </TableCell>
            <TableCell align="left">
                <Typography>0.3619</Typography>
            </TableCell>
            <TableCell>
                <Link component={NavLink} to={`/tokenlaunch/${farm.index}`}>
                    <Button variant="outlined" color="primary" style={{ width: "100%" }}>
                        <Typography variant="h6">{t`do_stake`}</Typography>
                    </Button>
                </Link>
            </TableCell>
        </TableRow>
    )
}
export default FarmData;
