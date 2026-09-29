import { Fragment, useEffect, useMemo, useState } from "react";
import {
  getPairRecords,
  getPlayerRecords,
  getPlayerMatchHistory,
  getPairMatchHistory,
  type RecordDateRange,
} from "../api/records";
import type {
  PairRecord,
  PlayerRecord,
  RecordMatchHistory,
} from "../types/record";
function formatRecord(wins: number, losses: number, draws: number) {
  return (
    <span className="inline-flex items-center">
      <span className="text-emerald-600 dark:text-emerald-400">{wins}</span>
      <span className="text-zinc-400 dark:text-zinc-500">-</span>
      <span className="text-red-600 dark:text-red-400">{losses}</span>
      <span className="text-zinc-400 dark:text-zinc-500">-</span>
      <span className="text-amber-600 dark:text-amber-400">{draws}</span>
    </span>
  );
}

type DateFilter =
  | "THIS_WEEK"
  | "LAST_7_DAYS"
  | "THIS_MONTH"
  | "ALL_RECORDS"
  | "CUSTOM";

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function buildRecordDateRange(
  filter: DateFilter,
  customFrom: string,
  customTo: string,
) {
  const today = new Date();
  const todayValue = formatDateInput(today);

  if (filter === "THIS_WEEK") {
    const startOfWeek = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - today.getDay(),
    );

    return {
      from: formatDateInput(startOfWeek),
      to: todayValue,
    };
  }

  if (filter === "LAST_7_DAYS") {
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 6);

    return {
      from: formatDateInput(startDate),
      to: todayValue,
    };
  }

  if (filter === "THIS_MONTH") {
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    return {
      from: formatDateInput(startOfMonth),
      to: todayValue,
    };
  }

  if (filter === "CUSTOM") {
    return {
      from: customFrom || undefined,
      to: customTo || undefined,
    };
  }

  return undefined;
}

function getWinRate(wins: number, losses: number, draws: number) {
  const totalMatches = wins + losses + draws;

  if (totalMatches === 0) {
    return 0;
  }

  const adjustedWins = wins + 0.5 * draws;

  return adjustedWins / totalMatches;
}

function compareNumbers(a: number, b: number, direction: SortDirection) {
  const comparison = a - b;

  return direction === "asc" ? comparison : -comparison;
}

function formatWinRate(wins: number, losses: number, draws: number) {
  const totalMatches = wins + losses + draws;

  if (totalMatches === 0) {
    return <span className="text-zinc-400">—</span>;
  }
  const adjustedWins = wins + 0.5 * draws;
  const winRate = (adjustedWins / totalMatches) * 100;

  const className =
    winRate > 50
      ? "text-emerald-600 dark:text-emerald-400"
      : winRate === 50
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400";

  return (
    <span className={`font-medium ${className}`}>{winRate.toFixed(1)}%</span>
  );
}

function formatMatchType(matchType: string) {
  return matchType.replaceAll("_", " ");
}

function getHistoryResultClass(result: RecordMatchHistory["result"]) {
  switch (result) {
    case "W":
      return "text-emerald-600 dark:text-emerald-400";
    case "D":
      return "text-amber-600 dark:text-amber-400";
    case "L":
      return "text-red-600 dark:text-red-400";
  }
}

function MatchHistoryList({ history }: { history: RecordMatchHistory[] }) {
  if (history.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No completed matches in this period.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {history.map((match) => {
        const teamA = match.players.filter((player) => player.teamSide === "A");

        const teamB = match.players.filter((player) => player.teamSide === "B");

        return (
          <div
            key={match.matchId}
            className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                {match.sessionDate} · {formatMatchType(match.matchType)}
              </p>

              <span
                className={`text-xs font-semibold ${getHistoryResultClass(
                  match.result,
                )}`}
              >
                {match.result}
              </span>
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_24px_minmax(0,1fr)] items-center gap-2 text-sm">
              <div className="min-w-0">
                {teamA.map((player) => (
                  <p
                    key={`${match.matchId}-a-${player.participantId}`}
                    className="truncate"
                  >
                    {player.nickname || player.name}
                  </p>
                ))}
              </div>

              <span className="text-center text-xs text-zinc-400">vs</span>

              <div className="min-w-0">
                {teamB.map((player) => (
                  <p
                    key={`${match.matchId}-b-${player.participantId}`}
                    className="truncate"
                  >
                    {player.nickname || player.name}
                  </p>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
type RecordsTab = "players" | "pairs";

type SortDirection = "asc" | "desc";

type PlayerSortKey =
  | "name"
  | "matches"
  | "singles"
  | "doubles"
  | "overall"
  | "winRate";

type PairSortKey = "pair" | "matches" | "record" | "winRate";

function RecordsPage() {
  const [playerRecords, setPlayerRecords] = useState<PlayerRecord[]>([]);
  const [pairRecords, setPairRecords] = useState<PairRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<RecordsTab>("players");

  const [playerSearch, setPlayerSearch] = useState("");
  const [playerSortKey, setPlayerSortKey] = useState<PlayerSortKey>("matches");
  const [playerSortDirection, setPlayerSortDirection] =
    useState<SortDirection>("desc");

  const [pairSearch, setPairSearch] = useState("");
  const [pairSortKey, setPairSortKey] = useState<PairSortKey>("matches");
  const [pairSortDirection, setPairSortDirection] =
    useState<SortDirection>("desc");
  const [dateFilter, setDateFilter] = useState<DateFilter>("ALL_RECORDS");

  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const [appliedDateRange, setAppliedDateRange] = useState<
    RecordDateRange | undefined
  >(undefined);
  const [expandedPlayerId, setExpandedPlayerId] = useState<number | null>(null);

  const [expandedPairKey, setExpandedPairKey] = useState<string | null>(null);

  const [playerHistory, setPlayerHistory] = useState<
    Record<number, RecordMatchHistory[]>
  >({});

  const [pairHistory, setPairHistory] = useState<
    Record<string, RecordMatchHistory[]>
  >({});

  const [loadingPlayerHistory, setLoadingPlayerHistory] = useState<
    Record<number, boolean>
  >({});

  const [loadingPairHistory, setLoadingPairHistory] = useState<
    Record<string, boolean>
  >({});
  const [historyError, setHistoryError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    setExpandedPlayerId(null);
    setExpandedPairKey(null);
    setPlayerHistory({});
    setPairHistory({});
    Promise.all([
      getPlayerRecords(appliedDateRange),
      getPairRecords(appliedDateRange),
    ])
      .then(([players, pairs]) => {
        if (ignore) {
          return;
        }

        setPlayerRecords(players);
        setPairRecords(pairs);
      })
      .catch((err) => {
        if (!ignore) {
          console.error(err);
          setError("Failed to load records.");
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [appliedDateRange]);

  async function togglePlayerHistory(participantId: number) {
    if (expandedPlayerId === participantId) {
      setExpandedPlayerId(null);
      setHistoryError(null);
      return;
    }

    setExpandedPairKey(null);
    setExpandedPlayerId(participantId);
    setHistoryError(null);

    if (playerHistory[participantId]) {
      return;
    }

    setLoadingPlayerHistory((current) => ({
      ...current,
      [participantId]: true,
    }));

    try {
      const history = await getPlayerMatchHistory(
        participantId,
        appliedDateRange,
      );

      setPlayerHistory((current) => ({
        ...current,
        [participantId]: history,
      }));
    } catch (err) {
      console.error(err);
      setHistoryError("Failed to load match history.");
    } finally {
      setLoadingPlayerHistory((current) => ({
        ...current,
        [participantId]: false,
      }));
    }
  }

  async function togglePairHistory(
    participantOneId: number,
    participantTwoId: number,
  ) {
    const key = `${participantOneId}-${participantTwoId}`;

    if (expandedPairKey === key) {
      setExpandedPairKey(null);
      setHistoryError(null);
      return;
    }

    setExpandedPlayerId(null);
    setExpandedPairKey(key);
    setHistoryError(null);

    if (pairHistory[key]) {
      return;
    }

    setLoadingPairHistory((current) => ({
      ...current,
      [key]: true,
    }));

    try {
      const history = await getPairMatchHistory(
        participantOneId,
        participantTwoId,
        appliedDateRange,
      );

      setPairHistory((current) => ({
        ...current,
        [key]: history,
      }));
    } catch (err) {
      console.error(err);
      setHistoryError("Failed to load match history.");
    } finally {
      setLoadingPairHistory((current) => ({
        ...current,
        [key]: false,
      }));
    }
  }

  function togglePlayerSort(key: PlayerSortKey) {
    if (playerSortKey === key) {
      setPlayerSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setPlayerSortKey(key);
    setPlayerSortDirection(key === "winRate" ? "desc" : "asc");
  }

  function togglePairSort(key: PairSortKey) {
    if (pairSortKey === key) {
      setPairSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setPairSortKey(key);
    setPairSortDirection(key === "winRate" ? "desc" : "asc");
  }

  function sortIndicator(active: boolean, direction: SortDirection) {
    if (!active) {
      return "↕";
    }

    return direction === "asc" ? "↑" : "↓";
  }

  const filteredPlayerRecords = useMemo(() => {
    const search = playerSearch.trim().toLowerCase();

    const filtered = playerRecords.filter((record) => {
      if (!search) {
        return true;
      }

      return [record.fullName, record.nickname]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(search));
    });

    return [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (playerSortKey) {
        case "name":
          comparison = a.fullName.localeCompare(b.fullName);
          break;

        case "singles":
          comparison = compareNumbers(
            a.singlesMatches,
            b.singlesMatches,
            playerSortDirection,
          );
          break;

        case "doubles":
          comparison = compareNumbers(
            a.doublesMatches,
            b.doublesMatches,
            playerSortDirection,
          );
          break;

        case "overall":
          comparison = compareNumbers(
            a.overallMatches,
            b.overallMatches,
            playerSortDirection,
          );
          break;

        case "matches":
          comparison = compareNumbers(
            a.overallMatches,
            b.overallMatches,
            playerSortDirection,
          );
          break;

        case "winRate":
          comparison = compareNumbers(
            getWinRate(a.overallWins, a.overallLosses, a.overallDraws),
            getWinRate(b.overallWins, b.overallLosses, b.overallDraws),
            playerSortDirection,
          );
          break;
      }

      if (comparison === 0) {
        comparison = a.fullName.localeCompare(b.fullName);
      }

      return comparison;
    });
  }, [playerRecords, playerSearch, playerSortKey, playerSortDirection]);

  const filteredPairRecords = useMemo(() => {
    const search = pairSearch.trim().toLowerCase();

    const sortRecords = (records: PairRecord[]) => {
      return [...records].sort((a, b) => {
        let comparison = 0;

        switch (pairSortKey) {
          case "pair":
            comparison =
              `${a.participantOneName} ${a.participantTwoName}`.localeCompare(
                `${b.participantOneName} ${b.participantTwoName}`,
              );
            break;

          case "matches":
            comparison = a.matchesPlayed - b.matchesPlayed;
            break;

          case "record":
            comparison =
              a.wins - b.wins || a.losses - b.losses || a.draws - b.draws;
            break;

          case "winRate":
            comparison =
              getWinRate(a.wins, a.losses, a.draws) -
              getWinRate(b.wins, b.losses, b.draws);
            break;
        }

        if (comparison === 0) {
          comparison =
            `${a.participantOneName} ${a.participantTwoName}`.localeCompare(
              `${b.participantOneName} ${b.participantTwoName}`,
            );
        }

        return pairSortDirection === "asc" ? comparison : -comparison;
      });
    };

    if (!search) {
      return sortRecords(pairRecords);
    }

    const playerById = new Map(
      playerRecords.map((player) => [player.participantId, player]),
    );

    const searchTerms = search.split(/\s+/).filter(Boolean);

    const filtered = pairRecords.filter((record) => {
      const playerOne = playerById.get(record.participantOneId);
      const playerTwo = playerById.get(record.participantTwoId);

      const searchableText = [
        record.participantOneName,
        record.participantTwoName,
        playerOne?.fullName,
        playerOne?.nickname,
        playerTwo?.fullName,
        playerTwo?.nickname,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchTerms.every((term) => searchableText.includes(term));
    });

    return sortRecords(filtered);
  }, [pairRecords, playerRecords, pairSearch, pairSortKey, pairSortDirection]);

  function handleDateFilterChange(filter: DateFilter) {
    setDateFilter(filter);

    if (filter === "CUSTOM") {
      return;
    }

    setAppliedDateRange(buildRecordDateRange(filter, customFrom, customTo));
  }

  function handleApplyCustomRange() {
    if (!customFrom || !customTo) {
      setError("Please select both From and To dates.");
      return;
    }

    if (customFrom > customTo) {
      setError("From date cannot be after To date.");
      return;
    }

    setError(null);

    setAppliedDateRange(buildRecordDateRange("CUSTOM", customFrom, customTo));
  }

  if (loading) {
    return <p>Loading records...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-950 dark:text-white sm:text-3xl">
          Records
        </h1>

        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Match records calculated from completed results.
        </p>
      </div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="w-full sm:w-auto">
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Period
          </label>

          <select
            value={dateFilter}
            onChange={(event) =>
              handleDateFilterChange(event.target.value as DateFilter)
            }
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-600 sm:w-48"
          >
            <option value="THIS_WEEK">This Week</option>
            <option value="LAST_7_DAYS">Last 7 Days</option>
            <option value="THIS_MONTH">This Month</option>
            <option value="ALL_RECORDS">All Records</option>
            <option value="CUSTOM">Custom</option>
          </select>
        </div>

        {dateFilter === "CUSTOM" && (
          <>
            <div className="w-full sm:w-auto">
              <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                From
              </label>

              <input
                type="date"
                value={customFrom}
                onChange={(event) => setCustomFrom(event.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-600"
              />
            </div>

            <div className="w-full sm:w-auto">
              <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                To
              </label>

              <input
                type="date"
                value={customTo}
                onChange={(event) => setCustomTo(event.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-600"
              />
            </div>

            <button
              type="button"
              onClick={handleApplyCustomRange}
              className="primary-action rounded-lg px-4 py-2 text-sm font-medium"
            >
              Apply
            </button>
          </>
        )}
      </div>
      <div className="mb-6 inline-flex rounded-xl border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-800 dark:bg-zinc-900">
        <button
          type="button"
          onClick={() => setActiveTab("players")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            activeTab === "players"
              ? "bg-white text-zinc-950 shadow-sm dark:bg-zinc-800 dark:text-white"
              : "text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
          }`}
        >
          Players
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("pairs")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            activeTab === "pairs"
              ? "bg-white text-zinc-950 shadow-sm dark:bg-zinc-800 dark:text-white"
              : "text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
          }`}
        >
          Pairs
        </button>
      </div>

      {activeTab === "players" ? (
        <section>
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold">Player Records</h2>

            <div className="w-full sm:max-w-xs">
              <input
                type="search"
                value={playerSearch}
                onChange={(event) => setPlayerSearch(event.target.value)}
                placeholder="Search players..."
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-zinc-600"
              />
            </div>
          </div>

          {playerRecords.length === 0 ? (
            <p className="text-sm text-zinc-500">No player records yet.</p>
          ) : filteredPlayerRecords.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No players match your search.
            </p>
          ) : (
            <>
              <div className="hidden overflow-x-auto rounded-t-xl border border-zinc-200 dark:border-zinc-800 md:block">
                <div className="grid grid-cols-[minmax(0,1fr)_110px_140px_140px_140px_100px] items-center gap-4 bg-zinc-50 px-4 py-3 text-sm text-zinc-600 dark:bg-zinc-950 dark:text-zinc-400">
                  <button
                    type="button"
                    onClick={() => togglePlayerSort("name")}
                    className="flex items-center gap-1 text-left"
                  >
                    Player
                    <span>
                      {sortIndicator(
                        playerSortKey === "name",
                        playerSortDirection,
                      )}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => togglePlayerSort("matches")}
                    className="flex items-center gap-1 text-left"
                  >
                    Matches
                    <span>
                      {sortIndicator(
                        playerSortKey === "matches",
                        playerSortDirection,
                      )}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => togglePlayerSort("singles")}
                    className="flex items-center gap-1 text-left"
                  >
                    Singles
                    <span>
                      {sortIndicator(
                        playerSortKey === "singles",
                        playerSortDirection,
                      )}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => togglePlayerSort("doubles")}
                    className="flex items-center gap-1 text-left"
                  >
                    Doubles
                    <span>
                      {sortIndicator(
                        playerSortKey === "doubles",
                        playerSortDirection,
                      )}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => togglePlayerSort("overall")}
                    className="flex items-center gap-1 text-left"
                  >
                    Overall
                    <span>
                      {sortIndicator(
                        playerSortKey === "overall",
                        playerSortDirection,
                      )}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => togglePlayerSort("winRate")}
                    className="flex items-center gap-1 text-left"
                  >
                    Win %
                    <span>
                      {sortIndicator(
                        playerSortKey === "winRate",
                        playerSortDirection,
                      )}
                    </span>
                  </button>
                </div>
              </div>

              <div className="space-y-3 md:space-y-0 md:rounded-b-xl md:border-x md:border-b md:border-zinc-200 dark:border-zinc-800">
                {filteredPlayerRecords.map((record) => (
                  <Fragment key={record.participantId}>
                    {" "}
                    <button
                      type="button"
                      onClick={() => togglePlayerHistory(record.participantId)}
                      aria-expanded={expandedPlayerId === record.participantId}
                      className="w-full rounded-xl border border-zinc-200 bg-white p-4 text-left dark:border-zinc-800 dark:bg-zinc-900 md:grid md:grid-cols-[minmax(0,1fr)_110px_140px_140px_140px_100px] md:items-center md:gap-4 md:rounded-none md:border-0 md:border-b md:px-4 md:py-3 md:last:border-b-0"
                    >
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="shrink-0 text-xs text-zinc-400">
                            {expandedPlayerId === record.participantId
                              ? "▾"
                              : "▸"}
                          </span>

                          <p
                            className="truncate text-sm font-medium"
                            title={record.fullName}
                          >
                            {record.fullName}
                          </p>
                        </div>

                        {record.nickname && (
                          <p className="mt-0.5 truncate pl-5 text-xs text-zinc-500">
                            {record.nickname}
                          </p>
                        )}
                      </div>

                      <div className="mt-3 text-sm md:mt-0">
                        <span className="md:hidden">Total Matches: </span>
                        {record.overallMatches}
                      </div>

                      <div className="mt-3 text-sm md:mt-0">
                        <span className="md:hidden">Singles: </span>
                        {formatRecord(
                          record.singlesWins,
                          record.singlesLosses,
                          record.singlesDraws,
                        )}
                      </div>

                      <div className="mt-3 text-sm md:mt-0">
                        <span className="md:hidden">Doubles: </span>
                        {formatRecord(
                          record.doublesWins,
                          record.doublesLosses,
                          record.doublesDraws,
                        )}
                      </div>

                      <div className="mt-3 text-sm font-medium md:mt-0">
                        <span className="md:hidden">Overall: </span>
                        {formatRecord(
                          record.overallWins,
                          record.overallLosses,
                          record.overallDraws,
                        )}
                      </div>

                      <div className="mt-3 text-sm md:mt-0">
                        <span className="md:hidden">Win %: </span>
                        {formatWinRate(
                          record.overallWins,
                          record.overallLosses,
                          record.overallDraws,
                        )}
                      </div>
                    </button>
                    {expandedPlayerId === record.participantId && (
                      <div className="border-b border-zinc-200 px-4 py-4 dark:border-zinc-800 md:col-span-full md:px-6">
                        <p className="mb-3 text-sm font-semibold">
                          Match History
                        </p>

                        {loadingPlayerHistory[record.participantId] ? (
                          <p className="text-sm text-zinc-500">
                            Loading match history...
                          </p>
                        ) : historyError ? (
                          <p className="text-sm text-red-500">{historyError}</p>
                        ) : (
                          <MatchHistoryList
                            history={playerHistory[record.participantId] ?? []}
                          />
                        )}
                      </div>
                    )}
                  </Fragment>
                ))}
              </div>
            </>
          )}
        </section>
      ) : (
        <section>
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold">Pair Records</h2>

            <div className="w-full sm:max-w-xs">
              <input
                type="search"
                value={pairSearch}
                onChange={(event) => setPairSearch(event.target.value)}
                placeholder="Search pairs..."
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-zinc-600"
              />
            </div>
          </div>

          {pairRecords.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No doubles pair records yet.
            </p>
          ) : filteredPairRecords.length === 0 ? (
            <p className="text-sm text-zinc-500">No pairs match your search.</p>
          ) : (
            <>
              <div className="hidden overflow-x-auto rounded-t-xl border border-zinc-200 dark:border-zinc-800 md:block">
                <div className="grid grid-cols-[minmax(0,1fr)_120px_120px_120px] items-center gap-4 bg-zinc-50 px-4 py-3 text-sm text-zinc-600 dark:bg-zinc-950 dark:text-zinc-400">
                  <button
                    type="button"
                    onClick={() => togglePairSort("pair")}
                    className="flex items-center gap-1 text-left"
                  >
                    Pair
                    <span>
                      {sortIndicator(pairSortKey === "pair", pairSortDirection)}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => togglePairSort("matches")}
                    className="flex items-center gap-1 text-left"
                  >
                    Matches
                    <span>
                      {sortIndicator(
                        pairSortKey === "matches",
                        pairSortDirection,
                      )}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => togglePairSort("record")}
                    className="flex items-center gap-1 text-left"
                  >
                    Record
                    <span>
                      {sortIndicator(
                        pairSortKey === "record",
                        pairSortDirection,
                      )}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => togglePairSort("winRate")}
                    className="flex items-center gap-1 text-left"
                  >
                    Win %
                    <span>
                      {sortIndicator(
                        pairSortKey === "winRate",
                        pairSortDirection,
                      )}
                    </span>
                  </button>
                </div>
              </div>

              <div className="space-y-3 md:space-y-0 md:rounded-b-xl md:border-x md:border-b md:border-zinc-200 dark:border-zinc-800">
                {filteredPairRecords.map((record) => (
                  <Fragment
                    key={`${record.participantOneId}-${record.participantTwoId}`}
                  >
                    {" "}
                    <button
                      type="button"
                      onClick={() =>
                        togglePairHistory(
                          record.participantOneId,
                          record.participantTwoId,
                        )
                      }
                      aria-expanded={
                        expandedPairKey ===
                        `${record.participantOneId}-${record.participantTwoId}`
                      }
                      className="w-full rounded-xl border border-zinc-200 bg-white p-4 text-left dark:border-zinc-800 dark:bg-zinc-900 md:grid md:grid-cols-[minmax(0,1fr)_120px_120px_120px] md:items-center md:gap-4 md:rounded-none md:border-0 md:border-b md:px-4 md:py-3 md:last:border-b-0"
                    >
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="shrink-0 text-xs text-zinc-400">
                            {expandedPairKey ===
                            `${record.participantOneId}-${record.participantTwoId}`
                              ? "▾"
                              : "▸"}
                          </span>

                          <p className="truncate text-sm font-medium">
                            {record.participantOneName} +{" "}
                            {record.participantTwoName}
                          </p>
                        </div>
                      </div>

                      <div className="mt-2 text-sm md:mt-0">
                        <span className="md:hidden">Matches: </span>
                        {record.matchesPlayed}
                      </div>

                      <div className="mt-2 text-sm md:mt-0">
                        <span className="md:hidden">Record: </span>
                        {formatRecord(record.wins, record.losses, record.draws)}
                      </div>

                      <div className="mt-2 text-sm md:mt-0">
                        <span className="md:hidden">Win %: </span>
                        {formatWinRate(
                          record.wins,
                          record.losses,
                          record.draws,
                        )}
                      </div>
                    </button>
                    {expandedPairKey ===
                      `${record.participantOneId}-${record.participantTwoId}` && (
                      <div className="border-b border-zinc-200 px-4 py-4 dark:border-zinc-800 md:col-span-full md:px-6">
                        <p className="mb-3 text-sm font-semibold">
                          Match History
                        </p>

                        {loadingPairHistory[
                          `${record.participantOneId}-${record.participantTwoId}`
                        ] ? (
                          <p className="text-sm text-zinc-500">
                            Loading match history...
                          </p>
                        ) : historyError ? (
                          <p className="text-sm text-red-500">{historyError}</p>
                        ) : (
                          <MatchHistoryList
                            history={
                              pairHistory[
                                `${record.participantOneId}-${record.participantTwoId}`
                              ] ?? []
                            }
                          />
                        )}
                      </div>
                    )}
                  </Fragment>
                ))}
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}

export default RecordsPage;
