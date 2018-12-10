import classNames from "classnames";
import PropTypes from "prop-types";
import React from "react";
import {
    SortableContainer,
    SortableElement,
    SortableHandle,
    arrayMove,
} from "react-sortable-hoc";
import DropdownItem from "reactstrap/lib/DropdownItem";
import DropdownMenu from "reactstrap/lib/DropdownMenu";
import DropdownToggle from "reactstrap/lib/DropdownToggle";
import UncontrolledDropdown from "reactstrap/lib/UncontrolledDropdown";
import { getCols, helpers, setTitle, toWorker } from "../../../deion/ui/util";
import {
    NewWindowLink,
    PlayerNameLabels,
    ResponsiveTableWrapper,
} from "../../../deion/ui/components";
import clickable from "../../../deion/ui/wrappers/clickable";

const handleAutoSort = async () => {
    await toWorker("autoSortDepth");
};

const handleAutoSortAll = async () => {
    await toWorker("autoSortDepthAll");
};

const ReorderHandle = SortableHandle(({ i, isSorting, numStarters }) => {
    return (
        <td
            className={classNames("roster-handle", {
                "table-info": i < numStarters,
                "table-secondary": i >= numStarters,
                "user-select-none": isSorting,
            })}
        />
    );
});

ReorderHandle.propTypes = {
    i: PropTypes.number.isRequired,
    isSorting: PropTypes.bool.isRequired,
    numStarters: PropTypes.number.isRequired,
};

const RosterRow = SortableElement(
    clickable(props => {
        const {
            clicked,
            i,
            isSorting,
            numStarters,
            p,
            stats,
            toggleClicked,
        } = props;

        return (
            <tr
                key={p.pid}
                className={classNames({
                    separator: i === numStarters - 1,
                    "table-warning": clicked,
                })}
                data-pid={p.pid}
            >
                <ReorderHandle
                    i={i}
                    isSorting={isSorting}
                    numStarters={numStarters}
                />
                <td onClick={toggleClicked}>
                    <PlayerNameLabels
                        pid={p.pid}
                        injury={p.injury}
                        skills={p.ratings.skills}
                        watch={p.watch}
                    >
                        {p.name}
                    </PlayerNameLabels>
                </td>
                <td onClick={toggleClicked}>{p.ratings.pos}</td>
                <td onClick={toggleClicked}>{p.age}</td>
                <td onClick={toggleClicked}>{p.ratings.ovr}</td>
                <td onClick={toggleClicked}>{p.ratings.pot}</td>
                {stats.map(stat => (
                    <td key={stat} onClick={toggleClicked}>
                        {helpers.roundStat(p.stats[stat], stat)}
                    </td>
                ))}
            </tr>
        );
    }),
);

RosterRow.propTypes = {
    i: PropTypes.number.isRequired,
    isSorting: PropTypes.bool.isRequired,
    numStarters: PropTypes.number.isRequired,
    p: PropTypes.object.isRequired,
    stats: PropTypes.arrayOf(PropTypes.string).isRequired,
};

const TBody = SortableContainer(
    ({ isSorting, numStarters, players, stats }) => {
        return (
            <tbody id="roster-tbody">
                {players.map((p, i) => {
                    return (
                        <RosterRow
                            key={p.pid}
                            i={i}
                            index={i}
                            isSorting={isSorting}
                            numStarters={numStarters}
                            p={p}
                            stats={stats}
                        />
                    );
                })}
            </tbody>
        );
    },
);

TBody.propTypes = {
    isSorting: PropTypes.bool.isRequired,
    numStarters: PropTypes.number.isRequired,
    players: PropTypes.arrayOf(PropTypes.object).isRequired,
    stats: PropTypes.arrayOf(PropTypes.string).isRequired,
};

const numStartersByPos = {
    QB: 1,
    RB: 1,
    WR: 3,
    TE: 1,
    OL: 4,
    C: 1,
    DL: 4,
    LB: 3,
    CB: 2,
    S: 2,
    K: 1,
    P: 1,
    KR: 1,
    PR: 1,
};
const positions = Object.keys(numStartersByPos);

class Roster extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isSorting: false,
            sortedPids: undefined,
        };

        this.handleOnSortEnd = this.handleOnSortEnd.bind(this);
        this.handleOnSortStart = this.handleOnSortStart.bind(this);
    }

    async handleOnSortEnd({ oldIndex, newIndex }) {
        const pids = this.props.players.map(p => p.pid);
        const sortedPids = arrayMove(pids, oldIndex, newIndex);
        this.setState({
            isSorting: false,
            sortedPids,
        });
        await toWorker("reorderDepthDrag", this.props.pos, sortedPids);
    }

    handleOnSortStart({ clonedNode, node }) {
        this.setState({ isSorting: true });

        // Ideally, this wouldn't be necessary https://github.com/clauderic/react-sortable-hoc/issues/175
        const clonedChildren = clonedNode.childNodes;
        const children = node.childNodes;
        for (let i = 0; i < children.length; i++) {
            clonedChildren[i].style.padding = "5px";
            clonedChildren[i].style.width = `${children[i].offsetWidth}px`;
        }
    }

    static getDerivedStateFromProps() {
        return {
            sortedPids: undefined,
        };
    }

    render() {
        const { abbrev, players, pos, season, stats } = this.props;

        setTitle(`Depth Chart - ${pos}`);

        // Use the result of drag and drop to sort players, before the "official" order comes back as props
        let playersSorted;
        if (this.state.sortedPids !== undefined) {
            playersSorted = this.state.sortedPids.map(pid => {
                return players.find(p => p.pid === pid);
            });
        } else {
            playersSorted = players;
        }

        const statCols = getCols(...stats.map(stat => `stat:${stat}`));

        return (
            <>
                <UncontrolledDropdown className="float-right my-1">
                    <DropdownToggle caret className="btn-light-bordered">
                        More Info
                    </DropdownToggle>
                    <DropdownMenu>
                        <DropdownItem href={helpers.leagueUrl(["roster"])}>
                            Roster
                        </DropdownItem>
                        <DropdownItem
                            href={helpers.leagueUrl([
                                "player_stats",
                                abbrev,
                                season,
                            ])}
                        >
                            Player Stats
                        </DropdownItem>
                        <DropdownItem
                            href={helpers.leagueUrl([
                                "player_ratings",
                                abbrev,
                                season,
                            ])}
                        >
                            Player Ratings
                        </DropdownItem>
                    </DropdownMenu>
                </UncontrolledDropdown>

                <h1>
                    Depth Chart - {pos} <NewWindowLink />
                </h1>
                <p>
                    More: <a href={helpers.leagueUrl(["roster"])}>Roster</a> |{" "}
                    <a href={helpers.leagueUrl(["team_finances"])}>Finances</a>{" "}
                    | <a href={helpers.leagueUrl(["game_log"])}>Game Log</a> |{" "}
                    <a href={helpers.leagueUrl(["team_history"])}>History</a> |{" "}
                    <a href={helpers.leagueUrl(["transactions"])}>
                        Transactions
                    </a>
                </p>
                <p style={{ clear: "both" }}>
                    Drag row handles to move players between the starting lineup{" "}
                    <span className="table-info legend-square" /> and the bench{" "}
                    <span className="table-secondary legend-square" />.
                </p>
                <div className="btn-group mb-3">
                    <button
                        className="btn btn-light-bordered"
                        onClick={handleAutoSort}
                    >
                        Auto sort {pos}
                    </button>
                    <button
                        className="btn btn-light-bordered"
                        onClick={handleAutoSortAll}
                    >
                        Auto sort all
                    </button>
                </div>
                <div className="clearfix" />
                <div className="btn-group mb-3">
                    {positions.map(pos2 => (
                        <a
                            key={pos2}
                            className={classNames("btn", {
                                "btn-light-bordered": pos !== pos2,
                                "btn-primary": pos === pos2,
                            })}
                            href={helpers.leagueUrl(["depth", pos2])}
                        >
                            {pos2}
                        </a>
                    ))}
                </div>

                <div className="clearfix" />

                <ResponsiveTableWrapper nonfluid>
                    <table className="table table-striped table-bordered table-sm table-hover">
                        <thead>
                            <tr>
                                <th />
                                <th>Name</th>
                                <th title="Position">Pos</th>
                                <th>Age</th>
                                <th title="Overall Rating">Ovr</th>
                                <th title="Potential Rating">Pot</th>
                                {statCols.map(({ desc, title }) => (
                                    <th key={title} title={desc}>
                                        {title}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <TBody
                            players={playersSorted}
                            isSorting={this.state.isSorting}
                            numStarters={numStartersByPos[pos]}
                            onSortEnd={this.handleOnSortEnd}
                            onSortStart={this.handleOnSortStart}
                            stats={stats}
                            transitionDuration={0}
                            useDragHandle
                        />
                    </table>
                </ResponsiveTableWrapper>
            </>
        );
    }
}

Roster.propTypes = {
    abbrev: PropTypes.string.isRequired,
    players: PropTypes.arrayOf(PropTypes.object).isRequired,
    pos: PropTypes.string.isRequired,
    season: PropTypes.number.isRequired,
    stats: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default Roster;