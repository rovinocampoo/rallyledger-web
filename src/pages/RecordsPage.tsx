import { useEffect, useMemo, useState } from "react";
import { getPairRecords, getPlayerRecords } from "../api/records";
import type { PairRecord, PlayerRecord } from "../types/record";

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

  useEffect(() => {
    let ignore = false;

    Promise.all([getPlayerRecords(), getPairRecords()])
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
  }, []);

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
                  <div
                    key={record.participantId}
                    className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 md:grid md:grid-cols-[minmax(0,1fr)_110px_140px_140px_140px_100px] md:items-center md:gap-4 md:rounded-none md:border-0 md:border-b md:px-4 md:py-3 md:last:border-b-0"
                  >
                    <div className="min-w-0">
                      <p
                        className="truncate text-sm font-medium"
                        title={record.fullName}
                      >
                        {record.fullName}
                      </p>

                      {record.nickname && (
                        <p className="mt-0.5 truncate text-xs text-zinc-500">
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
                  </div>
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
                  <div
                    key={`${record.participantOneId}-${record.participantTwoId}`}
                    className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 md:grid md:grid-cols-[minmax(0,1fr)_120px_120px_120px] md:items-center md:gap-4 md:rounded-none md:border-0 md:border-b md:last:border-b-0 md:px-4 md:py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {record.participantOneName} +{" "}
                        {record.participantTwoName}
                      </p>
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
                      {formatWinRate(record.wins, record.losses, record.draws)}
                    </div>
                  </div>
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
