// @flow

import classNames from "classnames";
import PropTypes from "prop-types";
import * as React from "react";
import { helpers } from "../util";

type SeriesTeam = {
    abbrev: string,
    cid: number,
    imgURL?: string,
    pts?: number,
    region: string,
    seed: number,
    tid: number,
    winp: number,
    won?: number,
};

const Team = ({
    team,
    season,
    showPts,
    showWon,
    userTid,
    won,
    lost,
}: {
    team?: SeriesTeam,
    season: number,
    showPts: boolean,
    showWon: boolean,
    userTid: number,
    won: boolean,
    lost: boolean,
}) => {
    if (!team) {
        return null;
    }

    return (
        <li
            className={classNames("border border-bottom-0", {
                "font-weight-bold": won,
                "table-primary": team.tid === userTid,
                "text-muted": lost,
            })}
        >
            {team.imgURL ? (
                <div
                    className={classNames("playoff-matchup-logo", {
                        "table-success": won,
                    })}
                >
                    <img src={team.imgURL} alt="" />
                </div>
            ) : null}
            <div className="mx-1">
                {team.seed}.{" "}
                <a
                    className={classNames({
                        "text-muted": lost,
                    })}
                    href={helpers.leagueUrl(["roster", team.abbrev, season])}
                >
                    <span className="d-lg-none">{team.abbrev}</span>
                    <span className="d-none d-lg-inline">{team.region}</span>
                </a>
            </div>
            {showWon && team.hasOwnProperty("won") ? (
                <div className="ml-auto mr-2">{team.won}</div>
            ) : null}
            {!showWon && showPts && team.hasOwnProperty("pts") ? (
                <div className="ml-auto mr-2">{team.pts}</div>
            ) : null}
        </li>
    );
};

const PlayoffMatchup = ({
    numGamesToWinSeries = 7,
    season,
    series,
    userTid,
}: {
    numGamesToWinSeries?: number,
    season: number,
    series?: {
        away?: SeriesTeam,
        home: SeriesTeam,
    },
    userTid: number,
}) => {
    if (
        series === undefined ||
        series.home === undefined ||
        series.home.tid === undefined
    ) {
        return null;
    }

    const homeWon =
        !series.away ||
        (series.home.hasOwnProperty("won") &&
            series.home.won === numGamesToWinSeries);
    const awayWon =
        !!series.away &&
        series.away.hasOwnProperty("won") &&
        series.away.won === numGamesToWinSeries;

    const showPts =
        !!series.away &&
        series.away.pts !== undefined &&
        series.home.pts !== undefined &&
        numGamesToWinSeries === 1;
    const showWon = !!series.away && numGamesToWinSeries > 1;

    return (
        <ul className="playoff-matchup border-bottom">
            <Team
                team={series.home}
                season={season}
                showPts={showPts}
                showWon={showWon}
                userTid={userTid}
                won={homeWon}
                lost={awayWon}
            />
            <Team
                team={series.away}
                season={season}
                showPts={showPts}
                showWon={showWon}
                userTid={userTid}
                won={awayWon}
                lost={homeWon}
            />
        </ul>
    );
};

PlayoffMatchup.propTypes = {
    numGamesToWinSeries: PropTypes.number,
    season: PropTypes.number.isRequired,
    series: PropTypes.shape({
        away: PropTypes.shape({
            abbrev: PropTypes.string.isRequired,
            region: PropTypes.string.isRequired,
            seed: PropTypes.number.isRequired,
            tid: PropTypes.number.isRequired,
            won: PropTypes.number,
        }),
        home: PropTypes.shape({
            abbrev: PropTypes.string.isRequired,
            region: PropTypes.string.isRequired,
            seed: PropTypes.number.isRequired,
            tid: PropTypes.number.isRequired,
            won: PropTypes.number,
        }),
    }),
    userTid: PropTypes.number.isRequired,
};

export default PlayoffMatchup;
