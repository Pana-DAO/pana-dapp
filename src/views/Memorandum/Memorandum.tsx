/* eslint-disable */
import "./memorandum.scss";

import { Grid, Container, useMediaQuery, Paper } from "@material-ui/core";

import chart_1 from "./images/chart_1.jpg";
import chart_2 from "./images/chart_2.jpg";
import chart_3 from "./images/chart_3.jpg";
import chart_4 from "./images/chart_4.jpg";
import chart_5 from "./images/chart_5.jpg";

function Memorandum() {
  const isSmallScreen = useMediaQuery("(max-width: 650px)");
  const isVerySmallScreen = useMediaQuery("(max-width: 379px)");

  return (
    <>
      <Paper className="paper-format-memo">
        <div>
          <Container
          // style={{
          //   paddingLeft: isSmallScreen || isVerySmallScreen ? "0.1rem" : "10rem",
          //   paddingRight: isSmallScreen || isVerySmallScreen ? "0.1rem" : "10rem",
          // }}
          >
            <div className="memorandum-container">
              <div className="memorandum-header">MEMORANDUM</div>
              <Grid container spacing={1} className="memorandum-header-row">
                <Grid item xs={12} className="memorandum-row">
                  <Grid item xs={4} sm={2} className="memorandum-header-label">
                    TO:
                  </Grid>
                  <Grid item xs={8} sm={10} className="memorandum-header-value">
                    Pana DAO Founders
                  </Grid>
                </Grid>
                <Grid item xs={12} className="memorandum-row">
                  <Grid item xs={4} sm={2} className="memorandum-header-label">
                    FROM:
                  </Grid>
                  <Grid item xs={8} sm={10} className="memorandum-header-value">
                    Robert B. Lamb, Esq.
                  </Grid>
                </Grid>
                <Grid item xs={12} className="memorandum-row">
                  <Grid item xs={4} sm={2} className="memorandum-header-label">
                    RE<span>:</span>
                  </Grid>
                  <Grid item xs={8} sm={10} className="memorandum-header-value">
                    DAO International Corporate Structure
                  </Grid>
                </Grid>
                <Grid item xs={12} className="memorandum-row">
                  <Grid item xs={4} sm={2} className="memorandum-header-label">
                    DATE:
                  </Grid>
                  <Grid item xs={8} sm={10} className="memorandum-header-value">
                    2-7-2022
                  </Grid>
                </Grid>
              </Grid>
              <div className="memorandum-section-header">I - Introduction</div>
              <div className="memorandum-section-content">
                The purpose of this Memorandum is to serve as the public, phased outline of the legal structure of the
                Pana Decentralized Autonomous Organization (the “Pana DAO”).
              </div>
              <div className="memorandum-section-header">II - “Decentralization”</div>
              <div className="memorandum-section-content">
                DAOs, with their decentralization and autonomous character do not fit naturally or easily into a
                corporate form. In fact, the primary appeal of a DAO is its decentralization and autonomy and
                independence from traditional corporate formality. In a pure DAO there is no hierarchy and no
                centralized control. Also, there are no traditionally governing documents like Bylaws and Operating
                Agreements. Rather, the rules of “agreement”, participation, execution and performance are governed by
                “on-chain” smart contracts, also known as “computable agreements”, which self-execute and self-govern.
                All these elements make corporate form selection and strategy highly democratic but can tend towards
                devolving to the pace of human consensus.{" "}
              </div>
              <div className="memorandum-section-content">
                Also, as advanced and efficient as these smart contracts are (and technology improves every day) for a
                sophisticated DAO that interacts heavily with off-chain entities, they do not fully replace the need for
                corporate formality or human adaptation. There are issues around hiring staff, developers, and the like.
                When necessary, there is a need to pay taxes, and otherwise make required regulatory filings. Then there
                is the open question of liability, and liability protection, which a legal entity receives under
                traditional corporate form. As such, it is often necessary to create a functionable corporate form even
                within a DAO environment, while still adhering to the core principles of DAO ethos that protects classic
                DAO governance token holders.
              </div>
              <div className="memorandum-section-header">III – Corporate Form Objectives</div>
              <div className="memorandum-section-content">
                With the structure that follows below, it is our goal to work within the DAO ethos, while still
                accomplishing the following objectives:
              </div>
              <div className="memorandum-section-content-bullet">
                <ul>
                  <li>Maintain decentralization;</li>
                  <li>Limit the liability of developers, users, management and members of Pana DAO;</li>
                  <li>Create an entity taxpayer capable of paying taxes (in relevant jurisdictions);</li>
                  <li>Have an entity capable of complying with regulatory requirements;</li>
                  <li>Avoid certain unpredictable and unnecessary state and federal statutes;</li>
                  <li>Grant the ability to hire, fire and make important decisions; and</li>
                  <li>
                    Establish credibility of form for purposes of contacting, partnering and execution with off-chain
                    entities.
                  </li>
                </ul>
              </div>
              <div className="memorandum-section-content">
                The following (Chart 1) is a full structure flow of the end Pana corporate structure (with each phase to
                be discussed below):
              </div>
              <img src={chart_1} alt="Chart 1" className="memorandum-chart" />
              <div className="memorandum-section-header">IV – Phased and Stepped Structure</div>
              <div className="memorandum-section-content">
                To achieve the above (Chart 1) end-result it will be necessary to move in phases and steps. The
                following is a breakdown of each phase.
              </div>
              <div className="memorandum-section-header-sub">A) Phase 1 (Chart 2)</div>
              <img src={chart_2} alt="Chart 2" className="memorandum-chart" />
              <div className="memorandum-section-content">
                This first phase (Chart 2) is required to achieve the assimilation of the Founders and Investors into a
                cohesive leadership team capable of corporate function and contracting, and to provide the Founders,
                Investors and other organizers the entity formation necessary to undertake venturing tasks, duties (i.e.
                hire developers, attorneys, etc.) and the ability to lay the foundation for Pana DAO. In short, the
                two-entity structure set in Chart 2 serves as the launching entities to initiate the venture and start
                building the Pana DAO community.
              </div>
              <div className="memorandum-section-content">
                More specifically, in Chart 2 we create two holding companies, one in the United States (Pana Advisors
                Inc.) and one in the BVI (Pana Investor Holdings, Ltd.). These two entities pool each of the Founders
                and Investors in a centralized (and limited liability) entity structure that supports multiple
                international locations. Using these two entities we can identify the Founders and Investors in the
                normal course of corporate formation (needed to establish regular course of conduct business
                relationships off-chain) and begin the process of venturing off-chain and on-chain. We are also
                providing the Founders and Investors an initial layer of limited liability protections for all
                activities associated with establishing Pana DAO. This extends to Pana DAO Advisors, Partners and other
                organizers who will predominantly reside in the USA at the time of launch.
              </div>
              <div className="memorandum-section-header-sub">B) Phase 2 (Chart 3)</div>
              <img src={chart_3} alt="Chart 3" className="memorandum-chart" />
              <div className="memorandum-section-content">
                Once the initial holding entities are established, we move into the second phase by establishing a
                second BVI entity (Pana DAO, LTD). Pana DAO LTD will become the initial “operating” entity of the DAO.
                It will have a specific charter and mandate (operating like a “special purpose vehicle”) but enveloped
                in limited liability, and all the status of a legal entity able to professionalize all the functions of
                a DAO and establish all legal and financial relationships necessary to operate.
              </div>
              <div className="memorandum-section-content">
                A word about non-US entities and the selection of BVI entities. An increasingly utilized mechanism for
                resolving DAO entity structure issues has been the practice of “offshoring” governance tokens to
                jurisdictions with more technology friendly tax regimes (BVI has a very favorable tax regime) and
                wrapping the DAO inside a jurisdiction that is considered favorable to cryptocurrency, digital assets
                and tokenization entities. The BVI meets all those categories. Furthermore, there is no burden of
                multiple jurisdictional compliance (i.e., the United States). A non-US entity has the further benefit of
                being “international” in a way that is consistent with the international DAO participation base where
                many of the founders, developers, investors and early members are all part of a global network.
              </div>
              <div className="memorandum-section-header-sub">C) Phase 3 (Chart 4)</div>
              <div className="memorandum-section-content">
                With the off-chain complexity of the Pana insurance business, and the hope to create multiple phases and
                stages of tokenomics in multiple jurisdictions, it may be necessary to have an additional layer of
                corporate form.{" "}
              </div>
              <div className="memorandum-section-content">
                The regulatory environment in Singapore is favorable for DAOs (both structure and operation).
                Furthermore, current Singapore “Foundation” rules are liberally applied to DAOs to enable them to
                bifurcate function, treasury and other corporate functionality, from smart contracting protocols. This,
                in essence, allows us to separate for-profit functions of the DAO from not-for-profit. In other words,
                we can create a non-profit cost center for all functions around treasuries and wrap those functions in a
                Singapore Foundation, while allowing decentralization of the DAO participant base to function
                interpedently. Here is how it would look.
              </div>
              <img src={chart_4} alt="Chart 4" className="memorandum-chart" />
              <div className="memorandum-section-header-sub">D) Phase 3.5 (Chart 5)</div>
              <div className="memorandum-section-content">
                As Pana DAO evolves, within the complex structure and business goals of Pana DAO it is possible we won’t
                desire a Foundation purpose or function. The following structure (Chart 5) takes elements of the
                Singapore model, but adapts it to fully for-profit structure and purpose. The end goal is to achieve
                corporate formation and protection, with all the same functions, but overlay it on top of a bifurcated
                treasury and decentralization protocol scheme where for-profit incentives sourced from disaggregated
                treasuries flow back to DAO members and accelerate protocol growth. Here is the flow:
              </div>
              <img src={chart_5} alt="Chart 5" className="memorandum-chart" />
              <div className="memorandum-section-content">
                With this model, we achieve all formation goals (see above) and allow decentralized control within the
                DAO participation and voting base. In this final form, the BVI (and its “management”) are actors
                administrating on-behalf of the voting base. “Management” exists inside the entity to carry out the
                function and purpose of the votes of the DAO voting base.
              </div>
              <div className="memorandum-section-header">V – Conclusion</div>
              <div className="memorandum-section-content">
                With the above structure and phased approach, we can achieve the necessary corporate form while
                maintaining the principles of decentralization. This proposal is both innovative and effective. It seeks
                to respect the value and proposition of the DAO ethos, while allowing some level of corporate person and
                protection that enables meaningful off-chain business development and execution.
              </div>
              <div className="memorandum-section-spacer"></div>
            </div>
          </Container>
        </div>
      </Paper>
    </>
  );
}
export default Memorandum;
