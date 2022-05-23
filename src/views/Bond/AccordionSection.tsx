import "./ChooseBond.scss";

import { t, Trans } from "@lingui/macro";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@material-ui/core";
import { ExpandMore } from "@material-ui/icons";
import { IUserNote } from "src/slices/BondSlice";

import { ClaimBondCardData, ClaimBondTableData } from "./ClaimRow";

const AccordionSection = ({
  bonds,
  title,
  vested,
  isSmallScreen,
  oldBonds,
}: {
  bonds: IUserNote[];
  title: string;
  vested: boolean;
  isSmallScreen: boolean;
  oldBonds: boolean;
}) => (
  <Accordion defaultExpanded classes={{ root: "accordion-root" }}>
    <AccordionSummary expandIcon={<ExpandMore />} aria-controls={`${title}-content`} id={`${title}-header`}>
      <Typography>{title}</Typography>
    </AccordionSummary>

    {isSmallScreen ? (
      bonds.map((bond, i) => <ClaimBondCardData key={i} userNote={bond} oldBonds={oldBonds} />)
    ) : (
      <AccordionDetails>
        <Table aria-label={title}>
          <TableHead>
            <TableRow>
              <TableCell align="left">
                <Trans>Bond</Trans>
              </TableCell>
              <TableCell align="center">{`Duration`}</TableCell>
              <TableCell align="center">{`Remaining`}</TableCell>
              <TableCell align="center">{vested ? t`Payout` : t`Pending Payout`}</TableCell>
              {/* <TableCell align="right"></TableCell> */}
            </TableRow>
          </TableHead>
          <TableBody>
            {bonds.map((bond, i) => (
              <ClaimBondTableData key={i} userNote={bond} oldBonds={oldBonds} />
            ))}
          </TableBody>
        </Table>
      </AccordionDetails>
    )}
  </Accordion>
);

export default AccordionSection;
