import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toBlob } from "html-to-image";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CircleHelp,
  GitBranch,
  LoaderCircle,
  MapPin,
  Plus,
  RefreshCw,
  Share2,
  Sparkles,
  Trophy,
  Users,
  X,
} from "lucide-react";

import type { AdminUser } from "../api/auth";
import { ApiError } from "../api/client";
import { getParticipants } from "../api/participants";
import type { Participant } from "../types/participant";
import {
  createTournamentDivision,
  createTournamentEntry,
  generateTournamentDraw,
  getTournament,
  getTournamentDivisions,
  getTournamentDraw,
  getTournamentEntries,
  recordTournamentMatchResult,
  updateTournamentDrawDraft,
  publishTournamentDraw,
  updateCustomTournamentDrawDraft,
} from "../api/tournaments";
import type {
  CreateDivisionInput,
  CustomDrawMatchInput,
  DraftMatchInput,
  DrawType,
  Tournament,
  TournamentDivision,
  TournamentDivisionCode,
  TournamentDraw,
  TournamentDrawEntrySummary,
  TournamentEntry,
  TournamentMatch,
  UpdateCustomDrawDraftInput,
} from "../types/tournament";
import ParticipantPicker from "../components/ui/ParticipantPicker";
import TournamentBracketTree from "../components/TournamentBracketTree";

type Props = { admin: AdminUser };

type ShareTarget =
  | { kind: "BRACKET" }
  | { kind: "RESULT"; matchId: number }
  | { kind: "CHAMPION" };

const BRAND = {
  green: "#103f25",
  greenLight: "#1c5636",
  lime: "#dfff28",
  paper: "#f1eee5",
  white: "#fffdf5",
  ink: "#153323",
  muted: "#55705e",
};

const divisionChoices: {
  code: TournamentDivisionCode;
  name: string;
  doubles: boolean;
}[] = [
  { code: "SINGLES_A", name: "Singles A", doubles: false },
  { code: "SINGLES_B", name: "Singles B", doubles: false },
  { code: "MENS_SINGLES", name: "Men's Singles", doubles: false },
  { code: "WOMENS_SINGLES", name: "Women's Singles", doubles: false },
  { code: "MENS_DOUBLES", name: "Men's Doubles", doubles: true },
  { code: "WOMENS_DOUBLES", name: "Women's Doubles", doubles: true },
  { code: "MIXED_DOUBLES", name: "Mixed Doubles", doubles: true },
];

function formatDate(value: string): string {
  if (!value) return "Date to be announced";

  const parsed = new Date(`${value.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

function dateRange(tournament: Tournament): string {
  if (!tournament.startDate && !tournament.endDate) {
    return "Dates to be announced";
  }

  if (!tournament.startDate) {
    return `Until ${formatDate(tournament.endDate)}`;
  }

  if (!tournament.endDate) {
    return `From ${formatDate(tournament.startDate)}`;
  }

  if (tournament.startDate.slice(0, 10) === tournament.endDate.slice(0, 10)) {
    return formatDate(tournament.startDate);
  }

  return `${formatDate(tournament.startDate)} – ${formatDate(tournament.endDate)}`;
}

function safeFilename(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || "tournament"
  );
}

function displayEntry(entry?: TournamentDrawEntrySummary | null): string {
  if (!entry) return "TBD";
  if (entry.entryName?.trim()) return entry.entryName;

  const names = (entry.players ?? []).map((player) => {
    const fullName = `${player.firstName} ${player.lastName}`.trim();

    return (
      player.nickname?.trim() || fullName || `Player ${player.participantId}`
    );
  });

  return names.join(" / ") || `Entry #${entry.id}`;
}

function roundLabel(round: number, drawSize: number): string {
  const roundCount = Math.log2(drawSize);

  if (round === roundCount) return "Final";
  if (round === roundCount - 1) return "Semifinals";
  if (round === roundCount - 2 && roundCount >= 4) {
    return "Quarterfinals";
  }

  return `Round of ${drawSize / 2 ** (round - 1)}`;
}

function isResultComplete(match: TournamentMatch): boolean {
  return match.status === "COMPLETED" || match.status === "WALKOVER";
}

function countDirectByeEntries(matches: TournamentMatch[]): number {
  const roundOneEntryIds = new Set<number>();
  const laterRoundEntryIds = new Set<number>();

  for (const match of matches) {
    const entryIds = [
      match.entryA?.id ?? match.entryAId,
      match.entryB?.id ?? match.entryBId,
    ];

    for (const entryId of entryIds) {
      if (typeof entryId !== "number") continue;

      if (match.roundNumber === 1) {
        roundOneEntryIds.add(entryId);
      } else {
        laterRoundEntryIds.add(entryId);
      }
    }
  }

  return [...laterRoundEntryIds].filter(
    (entryId) => !roundOneEntryIds.has(entryId),
  ).length;
}

function createSuggestedCustomDraw(
  entries: TournamentEntry[],
): CustomDrawMatchInput[] {
  const ordered = [...entries].sort(
    (a, b) =>
      (a.seed ?? Number.MAX_SAFE_INTEGER) -
        (b.seed ?? Number.MAX_SAFE_INTEGER) || a.id - b.id,
  );

  if (ordered.length < 2) return [];

  // Five-entry example: Player 1 receives a direct place in Match 3.
  if (ordered.length === 5) {
    return [
      {
        key: "m1",
        roundNumber: 1,
        matchNumber: 1,
        entryAId: ordered[1].id,
        entryBId: ordered[4].id,
        nextMatchKey: "m3",
        nextSlot: "B",
      },
      {
        key: "m2",
        roundNumber: 1,
        matchNumber: 2,
        entryAId: ordered[2].id,
        entryBId: ordered[3].id,
        nextMatchKey: "m4",
        nextSlot: "B",
      },
      {
        key: "m3",
        roundNumber: 2,
        matchNumber: 1,
        entryAId: ordered[0].id,
        nextMatchKey: "m4",
        nextSlot: "A",
      },
      {
        key: "m4",
        roundNumber: 3,
        matchNumber: 1,
      },
    ];
  }

  type Source = {
    entryId?: number;
    matchKey?: string;
    round: number;
  };

  const matches: CustomDrawMatchInput[] = [];
  const roundCounters = new Map<number, number>();
  let sequence = 1;

  function buildTree(group: TournamentEntry[]): Source {
    if (group.length === 1) {
      return { entryId: group[0].id, round: 0 };
    }

    const middle = Math.floor(group.length / 2);
    const left = buildTree(group.slice(0, middle));
    const right = buildTree(group.slice(middle));
    const round = Math.max(left.round, right.round) + 1;
    const matchNumber = (roundCounters.get(round) ?? 0) + 1;
    roundCounters.set(round, matchNumber);

    const key = `custom-${sequence++}`;
    const match: CustomDrawMatchInput = {
      key,
      roundNumber: round,
      matchNumber,
    };

    if (left.entryId !== undefined) {
      match.entryAId = left.entryId;
    } else if (left.matchKey) {
      const child = matches.find((item) => item.key === left.matchKey);
      if (child) {
        child.nextMatchKey = key;
        child.nextSlot = "A";
      }
    }

    if (right.entryId !== undefined) {
      match.entryBId = right.entryId;
    } else if (right.matchKey) {
      const child = matches.find((item) => item.key === right.matchKey);
      if (child) {
        child.nextMatchKey = key;
        child.nextSlot = "B";
      }
    }

    matches.push(match);
    return { matchKey: key, round };
  }

  buildTree(ordered);
  return matches;
}

/**
 * Compact court illustration inspired by the RallyLedger Landing Page.
 * Inline styles keep the illustration's colors stable in exported PNGs.
 */
function MiniCourt({
  width = 78,
  height = 98,
}: {
  width?: number;
  height?: number;
}) {
  const line = Math.max(1, Math.round(width * 0.018));
  const outerLine = Math.max(2, Math.round(width * 0.035));
  const netWidth = Math.max(6, Math.round(width * 0.18));

  return (
    <div
      aria-hidden="true"
      style={{
        width,
        height,
        boxSizing: "border-box",
        padding: Math.max(3, Math.round(width * 0.045)),
        border: `${outerLine}px solid ${BRAND.green}`,
        background: BRAND.white,
        boxShadow: `4px 4px 0 ${BRAND.lime}`,
        transform: "rotate(2deg)",
        flex: "0 0 auto",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          boxSizing: "border-box",
          overflow: "hidden",
          border: `${outerLine}px solid ${BRAND.green}`,
          background: BRAND.lime,
          transform: "perspective(500px) rotateX(9deg) rotate(-1deg)",
        }}
      >
        {/* Service box vertical lines */}
        <div
          style={{
            position: "absolute",
            left: "20%",
            top: "10%",
            bottom: "10%",
            width: line,
            background: BRAND.green,
          }}
        />
        <div
          style={{
            position: "absolute",
            right: "20%",
            top: "10%",
            bottom: "10%",
            width: line,
            background: BRAND.green,
          }}
        />

        {/* Service box horizontal line */}
        <div
          style={{
            position: "absolute",
            left: "20%",
            right: "20%",
            top: "49%",
            height: line,
            background: BRAND.green,
          }}
        />

        {/* Center line */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            bottom: 0,
            width: line,
            background: BRAND.green,
          }}
        />

        {/* Baseline markings */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: "10%",
            right: 0,
            borderTop: `${line}px solid ${BRAND.green}`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            bottom: "10%",
            right: 0,
            borderTop: `${line}px solid ${BRAND.green}`,
          }}
        />

        {/* Net */}
        <div
          style={{
            position: "absolute",
            left: "45%",
            top: 0,
            bottom: 0,
            width: netWidth,
            boxSizing: "border-box",
            borderLeft: `${Math.max(1, outerLine - 1)}px solid ${BRAND.green}`,
            borderRight: `${Math.max(1, outerLine - 1)}px solid ${BRAND.green}`,
            background:
              "repeating-linear-gradient(45deg, transparent 0 4px, rgba(16,63,37,.72) 4px 5.5px), repeating-linear-gradient(-45deg, transparent 0 4px, rgba(16,63,37,.72) 4px 5.5px)",
          }}
        />
      </div>
    </div>
  );
}

function CourtDoodle() {
  return (
    <svg
      viewBox="0 0 200 240"
      aria-hidden="true"
      style={{ width: 180, opacity: 0.18 }}
    >
      <rect
        x="14"
        y="9"
        width="172"
        height="222"
        rx="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        d="M57 9V231 M143 9V231 M14 120H186 M57 58H143V182H57Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        d="M7 120H193"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="5 5"
      />
    </svg>
  );
}

function StatusPill({ status }: { status: string }) {
  const style =
    status === "COMPLETED" || status === "WALKOVER"
      ? { background: "#dcfce7", color: "#14532d" }
      : status === "BYE"
        ? { background: "#efff9b", color: BRAND.green }
        : status === "CANCELLED"
          ? { background: "#fee2e2", color: "#991b1b" }
          : { background: "#e8ebe4", color: "#46544a" };

  return (
    <span
      className="rounded-full px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide"
      style={style}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}

function TournamentMatchCard({
  match,
  canManage,
  onRecord,
  onShareResult,
  saving,
  roundLabelText,
}: {
  match: TournamentMatch;
  roundLabelText?: string;

  canManage: boolean;
  onRecord: (
    match: TournamentMatch,
    winnerEntryId: number,
    score: string,
    walkover: boolean,
  ) => Promise<void>;
  onShareResult: (match: TournamentMatch) => void;
  saving: boolean;
}) {
  const [winnerId, setWinnerId] = useState("");
  const [score, setScore] = useState(match.score ?? "");
  const [walkover, setWalkover] = useState(match.status === "WALKOVER");

  const entryAId = match.entryA?.id ?? match.entryAId;
  const entryBId = match.entryB?.id ?? match.entryBId;
  const complete = isResultComplete(match);

  const canRecord =
    canManage &&
    !match.winnerEntryId &&
    Boolean(entryAId && entryBId) &&
    match.status !== "BYE" &&
    match.status !== "CANCELLED";

  return (
    <article className="w-full min-w-0 overflow-hidden rounded-xl border-2 border-[#103f25]/15 bg-white text-[#153323] shadow-[3px_3px_0_rgba(16,63,37,0.08)]">
      <div className="flex items-center justify-between gap-2 border-b border-[#103f25]/10 px-3 py-2">
        <span className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#55705e]">
          {roundLabelText ? `${roundLabelText} · ` : ""}
          Match {match.matchNumber}{" "}
        </span>
        <StatusPill status={match.status} />
      </div>

      <div className="space-y-1 p-3">
        {[
          { entry: match.entryA, id: entryAId, slot: "A" as const },
          { entry: match.entryB, id: entryBId, slot: "B" as const },
        ].map((side, index) => {
          const winner = Boolean(
            match.winnerEntryId && side.id === match.winnerEntryId,
          );
          const missing = !side.id;

          return (
            <div
              key={side.slot}
              className="flex min-h-[48px] items-center gap-2 rounded-lg px-2.5 py-2"
              style={{
                backgroundColor: winner
                  ? "#eaff9a"
                  : missing
                    ? "#f7f8f2"
                    : "#fffdf5",
                color: winner ? BRAND.green : missing ? "#7b877e" : "#273d2e",
              }}
            >
              <span
                className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-xs font-black"
                style={{
                  backgroundColor: winner ? BRAND.lime : "#e8ebe4",
                  color: BRAND.green,
                }}
              >
                {winner ? (
                  <Trophy className="h-3.5 w-3.5" />
                ) : (
                  (side.entry?.seed ?? index + 1)
                )}
              </span>

              <span
                className={`min-w-0 flex-1 break-words text-sm ${
                  winner ? "font-black" : "font-semibold"
                }`}
                title={displayEntry(side.entry)}
              >
                {displayEntry(side.entry)}
              </span>

              {winner && <Check className="h-4 w-4 shrink-0" />}
            </div>
          );
        })}

        {match.score && (
          <p
            className="mt-2 rounded-lg px-2.5 py-2 text-center text-xs font-extrabold tracking-wide"
            style={{ backgroundColor: BRAND.paper, color: BRAND.green }}
          >
            {match.score}
          </p>
        )}

        {match.status === "BYE" && (
          <p
            className="pt-1 text-center text-xs font-bold"
            style={{ color: BRAND.green }}
          >
            BYE · automatic advancement
          </p>
        )}

        {match.status === "CANCELLED" && (
          <p className="pt-1 text-center text-xs font-semibold text-red-700">
            This match was cancelled.
          </p>
        )}

        {canRecord && (
          <div
            data-export-hide="true"
            className="mt-3 space-y-2 border-t border-[#103f25]/10 pt-3"
          >
            <label
              className="block text-xs font-bold"
              style={{ color: "#46594b" }}
            >
              Winner
              <select
                value={winnerId}
                onChange={(event) => setWinnerId(event.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-sm outline-none focus:border-emerald-700"
                style={{
                  backgroundColor: "#ffffff",
                  color: "#27272a",
                  borderColor: "#e4e4e7",
                }}
              >
                <option value="">Select winner</option>
                {entryAId && (
                  <option value={entryAId}>{displayEntry(match.entryA)}</option>
                )}
                {entryBId && (
                  <option value={entryBId}>{displayEntry(match.entryB)}</option>
                )}
              </select>
            </label>

            <label
              className="block text-xs font-bold"
              style={{ color: "#46594b" }}
            >
              Score
              <input
                value={score}
                onChange={(event) => setScore(event.target.value)}
                disabled={walkover}
                placeholder="6-3, 6-4"
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-sm outline-none placeholder:text-zinc-400 focus:border-emerald-700 disabled:opacity-50"
                style={{
                  backgroundColor: "#ffffff",
                  color: "#27272a",
                  borderColor: "#e4e4e7",
                }}
              />
            </label>

            <label
              className="flex items-center gap-2 text-xs font-medium"
              style={{ color: "#46594b" }}
            >
              <input
                type="checkbox"
                checked={walkover}
                onChange={(event) => setWalkover(event.target.checked)}
                className="accent-lime-500"
              />
              Walkover
            </label>

            <button
              type="button"
              disabled={saving || !winnerId || (!walkover && !score.trim())}
              onClick={() =>
                void onRecord(match, Number(winnerId), score, walkover)
              }
              className="primary-action w-full rounded-lg px-3 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving result..." : "Save match result"}
            </button>
          </div>
        )}

        {complete && match.winner && (
          <button
            type="button"
            data-export-hide="true"
            onClick={() => onShareResult(match)}
            className="secondary-action mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold"
          >
            <Share2 className="h-3.5 w-3.5" />
            Share result PNG
          </button>
        )}
      </div>
    </article>
  );
}

function TournamentDetailPage({ admin }: Props) {
  const navigate = useNavigate();
  const { tournamentId: routeId } = useParams();
  const tournamentId = Number(routeId);
  const validTournamentId =
    Number.isSafeInteger(tournamentId) && tournamentId > 0;
  const canManage = admin.role === "OWNER" || admin.role === "ADMIN";

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [divisions, setDivisions] = useState<TournamentDivision[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedDivisionId, setSelectedDivisionId] = useState<number | null>(
    null,
  );
  const [entries, setEntries] = useState<TournamentEntry[]>([]);
  const [draw, setDraw] = useState<TournamentDraw | null>(null);
  const [drawType, setDrawType] = useState<DrawType>("MAIN");

  const [loading, setLoading] = useState(true);
  const [divisionLoading, setDivisionLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creatingDivision, setCreatingDivision] = useState(false);
  const [generatingDraw, setGeneratingDraw] = useState(false);

  const [draftMatchups, setDraftMatchups] = useState<DraftMatchInput[]>([]);

  const [editingDraft, setEditingDraft] = useState(false);

  const [savingDraft, setSavingDraft] = useState(false);

  const [customDraftMatches, setCustomDraftMatches] = useState<
    CustomDrawMatchInput[]
  >([]);
  const [editingCustomDraft, setEditingCustomDraft] = useState(false);
  const [savingCustomDraft, setSavingCustomDraft] = useState(false);
  const [publishingDraw, setPublishingDraw] = useState(false);
  const [matchSavingId, setMatchSavingId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [showDivisionForm, setShowDivisionForm] = useState(false);
  const [divisionCode, setDivisionCode] =
    useState<TournamentDivisionCode>("SINGLES_A");
  const [divisionName, setDivisionName] = useState("");
  const [qualifyingEnabled, setQualifyingEnabled] = useState(false);
  const [qualifyingSpots, setQualifyingSpots] = useState("4");

  const [entryName, setEntryName] = useState("");
  const [entrySeed, setEntrySeed] = useState("");
  const [playerOneId, setPlayerOneId] = useState("");
  const [playerTwoId, setPlayerTwoId] = useState("");
  const [entryQualifying, setEntryQualifying] = useState(false);

  const [shareTarget, setShareTarget] = useState<ShareTarget | null>(null);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const exportRef = useRef<HTMLDivElement | null>(null);

  const selectedDivision =
    divisions.find((division) => division.id === selectedDivisionId) ?? null;
  const selectedChoice = divisionChoices.find(
    (choice) => choice.code === selectedDivision?.code,
  );
  const isDoubles = selectedChoice?.doubles ?? false;

  const availableDivisions = useMemo(
    () =>
      divisionChoices.filter(
        (choice) =>
          !divisions.some((division) => division.code === choice.code),
      ),
    [divisions],
  );

  const effectiveDivisionCode = availableDivisions.some(
    (choice) => choice.code === divisionCode,
  )
    ? divisionCode
    : (availableDivisions[0]?.code ?? divisionCode);

  const poolEntries = entries.filter((entry) =>
    drawType === "QUALIFYING" ? entry.qualifyingEntry : !entry.qualifyingEntry,
  );

  const eligiblePoolEntries = poolEntries.filter(
    (entry) =>
      entry.entryStatus === "REGISTERED" || entry.entryStatus === "QUALIFIER",
  );

  const rounds = useMemo(() => {
    if (!draw) return [];

    const byRound = new Map<number, TournamentMatch[]>();
    draw.matches.forEach((match) => {
      const round = byRound.get(match.roundNumber) ?? [];
      round.push(match);
      byRound.set(match.roundNumber, round);
    });

    return [...byRound.entries()]
      .sort(([a], [b]) => a - b)
      .map(([roundNumber, matches]) => ({
        roundNumber,
        label: roundLabel(roundNumber, draw.drawSize),
        matches: matches.sort((a, b) => a.matchNumber - b.matchNumber),
      }));
  }, [draw]);

  const finalMatch = useMemo(() => {
    if (!draw || rounds.length === 0) return null;

    const finalRound = rounds[rounds.length - 1].roundNumber;
    return (
      draw.matches.find((match) => match.roundNumber === finalRound) ?? null
    );
  }, [draw, rounds]);

  const championReady = Boolean(
    finalMatch?.winner && isResultComplete(finalMatch),
  );
  const entryCount = eligiblePoolEntries.length;
  const bracketSizeNeeded =
    entryCount <= 1 ? 1 : 2 ** Math.ceil(Math.log2(entryCount));
  const firstRoundMatches = rounds[0]?.matches ?? [];
  const byeCount = firstRoundMatches.filter(
    (match) => match.status === "BYE",
  ).length;

  const hasStandardBracketShape = Boolean(
    draw && draw.matches.length === draw.drawSize - 1,
  );

  const actualMatchCount =
    draw?.matches.filter((match) => match.status !== "BYE").length ?? 0;

  const directByeCount = draw ? countDirectByeEntries(draw.matches) : 0;

  const summaryByeCount = hasStandardBracketShape ? byeCount : directByeCount;

  useEffect(() => {
    if (!validTournamentId) return;

    let ignore = false;

    async function loadPage() {
      setLoading(true);
      setLoadError(null);

      try {
        const [loadedTournament, loadedDivisions, loadedParticipants] =
          await Promise.all([
            getTournament(tournamentId),
            getTournamentDivisions(tournamentId),
            getParticipants(),
          ]);

        if (ignore) return;

        setTournament(loadedTournament);
        setDivisions(loadedDivisions);
        setParticipants(loadedParticipants);

        if (loadedDivisions.length > 0) {
          setSelectedDivisionId((current) => current ?? loadedDivisions[0].id);
        }
      } catch (error) {
        if (!ignore) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Couldn't load tournament details.",
          );
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void loadPage();

    return () => {
      ignore = true;
    };
  }, [tournamentId, validTournamentId]);

  useEffect(() => {
    if (!validTournamentId || selectedDivisionId === null) return;

    const divisionId = selectedDivisionId;
    let ignore = false;

    async function loadDivision() {
      setDivisionLoading(true);

      try {
        const [loadedEntries, loadedDraw] = await Promise.all([
          getTournamentEntries(tournamentId, divisionId),
          getTournamentDraw(tournamentId, divisionId, drawType).catch(
            (error: unknown) => {
              if (error instanceof ApiError && error.status === 404) {
                return null;
              }
              throw error;
            },
          ),
        ]);

        if (ignore) return;

        setEntries(loadedEntries);
        setDraw(loadedDraw);
        setActionError(null);
      } catch (error) {
        if (!ignore) {
          setActionError(
            error instanceof Error
              ? error.message
              : "Couldn't load this division.",
          );
          setDraw(null);
        }
      } finally {
        if (!ignore) setDivisionLoading(false);
      }
    }

    void loadDivision();

    return () => {
      ignore = true;
    };
  }, [tournamentId, validTournamentId, selectedDivisionId, drawType]);

  function clearMessages() {
    setActionError(null);
    setActionMessage(null);
  }

  async function refreshDraw() {
    if (selectedDivisionId === null) return;

    const refreshed = await getTournamentDraw(
      tournamentId,
      selectedDivisionId,
      drawType,
    );

    setDraw(refreshed);
  }

  async function handleCreateDivision(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearMessages();

    const spots = Number(qualifyingSpots);
    if (qualifyingEnabled && (!Number.isInteger(spots) || spots <= 0)) {
      setActionError("Qualifying spots must be a positive whole number.");
      return;
    }

    setCreatingDivision(true);

    const input: CreateDivisionInput = {
      code: effectiveDivisionCode,
      name: divisionName.trim(),
      qualifyingEnabled,
      qualifyingSpots: qualifyingEnabled ? spots : 0,
    };

    try {
      const created = await createTournamentDivision(tournamentId, input);
      setDivisions((current) => [...current, created]);
      setSelectedDivisionId(created.id);
      setDrawType("MAIN");
      setEntries([]);
      setDraw(null);
      setShowDivisionForm(false);
      setDivisionName("");
      setQualifyingEnabled(false);
      setQualifyingSpots("4");
      setActionMessage(`${created.name} added to the tournament.`);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Couldn't create division.",
      );
    } finally {
      setCreatingDivision(false);
    }
  }

  async function handleCreateEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearMessages();

    if (!selectedDivision) return;

    const firstID = Number(playerOneId);
    const secondID = Number(playerTwoId);

    if (!firstID || (isDoubles && !secondID)) {
      setActionError(
        isDoubles
          ? "Choose both players for this doubles team."
          : "Choose a player to register.",
      );
      return;
    }

    if (isDoubles && firstID === secondID) {
      setActionError("A doubles team must contain two different players.");
      return;
    }

    const seed = entrySeed.trim() ? Number(entrySeed) : null;

    if (
      seed !== null &&
      (!Number.isInteger(seed) ||
        seed <= 0 ||
        entries.some((entry) => entry.seed === seed))
    ) {
      setActionError("Enter a positive, unused seed number.");
      return;
    }

    if (draw) {
      setActionError(
        "This draw already exists. Registration is closed here to protect the existing bracket.",
      );
      return;
    }

    setSaving(true);

    try {
      await createTournamentEntry(tournamentId, selectedDivision.id, {
        entryName: entryName.trim(),
        seed,
        entryStatus: "REGISTERED",
        qualifyingEntry: Boolean(
          selectedDivision.qualifyingEnabled && entryQualifying,
        ),
        playerIds: isDoubles ? [firstID, secondID] : [firstID],
      });

      setEntries(await getTournamentEntries(tournamentId, selectedDivision.id));

      setEntryName("");
      setEntrySeed("");
      setPlayerOneId("");
      setPlayerTwoId("");
      setEntryQualifying(false);
      setActionMessage("Entry registered successfully.");
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Couldn't register entry.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateDraw() {
    if (selectedDivisionId === null) return;

    clearMessages();

    if (eligiblePoolEntries.length < 2) {
      setActionError(
        "Register at least two eligible entries before generating this draw.",
      );
      return;
    }

    setGeneratingDraw(true);

    try {
      await generateTournamentDraw(tournamentId, selectedDivisionId, drawType);

      // GET returns the entry/player summaries required by the bracket.
      const hydratedDraw = await getTournamentDraw(
        tournamentId,
        selectedDivisionId,
        drawType,
      );

      setDraw(hydratedDraw);
      setActionMessage(
        `${drawType === "MAIN" ? "Main" : "Qualifying"} draw generated with ${hydratedDraw.drawSize} bracket slots.`,
      );
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Couldn't generate draw.",
      );
    } finally {
      setGeneratingDraw(false);
    }
  }
  function beginDraftEdit() {
    if (!draw || draw.status !== "DRAFT") return;

    setDraftMatchups(
      firstRoundMatches.map((match) => ({
        matchNumber: match.matchNumber,
        entryAId: match.entryA?.id ?? match.entryAId ?? null,
        entryBId: match.entryB?.id ?? match.entryBId ?? null,
      })),
    );
    clearMessages();
    setEditingDraft(true);
  }

  async function handleSaveDraft() {
    if (selectedDivisionId === null || !draw || draw.status !== "DRAFT") return;

    clearMessages();
    setSavingDraft(true);

    try {
      await updateTournamentDrawDraft(
        tournamentId,
        selectedDivisionId,
        drawType,
        { matches: draftMatchups },
      );

      const hydratedDraw = await getTournamentDraw(
        tournamentId,
        selectedDivisionId,
        drawType,
      );
      setDraw(hydratedDraw);
      setEditingDraft(false);
      setDraftMatchups([]);
      setActionMessage("Draft saved. BYE advances have been recalculated.");
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Couldn't save the bracket draft.",
      );
    } finally {
      setSavingDraft(false);
    }
  }

  function beginCustomDraft() {
    if (!canManage || eligiblePoolEntries.length < 2) return;
    if (draw && draw.status !== "DRAFT") return;

    const isSavedCustomGraph =
      draw !== null && draw.matches.length === eligiblePoolEntries.length - 1;

    if (isSavedCustomGraph && draw) {
      setCustomDraftMatches(
        draw.matches.map((match) => ({
          key: String(match.id),
          roundNumber: match.roundNumber,
          matchNumber: match.matchNumber,
          entryAId: match.entryA?.id ?? match.entryAId ?? null,
          entryBId: match.entryB?.id ?? match.entryBId ?? null,
          nextMatchKey:
            match.nextMatchId != null ? String(match.nextMatchId) : undefined,
          nextSlot: match.nextSlot,
        })),
      );
    } else {
      setCustomDraftMatches(createSuggestedCustomDraw(eligiblePoolEntries));
    }

    setEditingDraft(false);
    setDraftMatchups([]);
    setEditingCustomDraft(true);
    clearMessages();
  }

  function cancelCustomDraft() {
    setEditingCustomDraft(false);
    setCustomDraftMatches([]);
    clearMessages();
  }

  async function handleSaveCustomDraft() {
    if (selectedDivisionId === null || !editingCustomDraft) return;

    clearMessages();
    setSavingCustomDraft(true);

    try {
      const input: UpdateCustomDrawDraftInput = {
        matches: customDraftMatches,
      };

      await updateCustomTournamentDrawDraft(
        tournamentId,
        selectedDivisionId,
        drawType,
        input,
      );

      const hydratedDraw = await getTournamentDraw(
        tournamentId,
        selectedDivisionId,
        drawType,
      );

      setDraw(hydratedDraw);
      setEditingCustomDraft(false);
      setCustomDraftMatches([]);
      setActionMessage("Custom bracket saved successfully.");
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Couldn't save the custom bracket.",
      );
    } finally {
      setSavingCustomDraft(false);
    }
  }

  function getCustomSlotSource(
    match: CustomDrawMatchInput,
    slot: "A" | "B",
  ): string {
    const directEntry = slot === "A" ? match.entryAId : match.entryBId;

    if (directEntry != null) return `entry:${directEntry}`;

    const incoming = customDraftMatches.find(
      (item) => item.nextMatchKey === match.key && item.nextSlot === slot,
    );

    return incoming ? `winner:${incoming.key}` : "";
  }

  function setCustomSlotSource(
    targetKey: string,
    slot: "A" | "B",
    value: string,
  ) {
    setCustomDraftMatches((current) => {
      const next = current.map((match) => ({ ...match }));
      const target = next.find((match) => match.key === targetKey);

      if (!target) return current;

      // Remove the previous source of this slot.
      for (const match of next) {
        if (match.nextMatchKey === targetKey && match.nextSlot === slot) {
          delete match.nextMatchKey;
          delete match.nextSlot;
        }
      }

      if (slot === "A") target.entryAId = null;
      else target.entryBId = null;

      if (!value) return next;

      if (value.startsWith("entry:")) {
        const entryID = Number(value.slice("entry:".length));
        if (!Number.isSafeInteger(entryID) || entryID <= 0) return next;

        // Move an entry instead of leaving duplicate assignments behind.
        for (const match of next) {
          if (match.entryAId === entryID) match.entryAId = null;
          if (match.entryBId === entryID) match.entryBId = null;
        }

        if (slot === "A") target.entryAId = entryID;
        else target.entryBId = entryID;

        return next;
      }

      if (value.startsWith("winner:")) {
        const sourceKey = value.slice("winner:".length);
        const source = next.find((match) => match.key === sourceKey);

        if (
          !source ||
          source.key === targetKey ||
          source.roundNumber >= target.roundNumber
        ) {
          return next;
        }

        source.nextMatchKey = targetKey;
        source.nextSlot = slot;
      }

      return next;
    });
  }

  function addCustomMatch() {
    setCustomDraftMatches((current) => {
      const roundNumber = 1;
      const matchNumber =
        Math.max(
          0,
          ...current
            .filter((match) => match.roundNumber === roundNumber)
            .map((match) => match.matchNumber),
        ) + 1;

      return [
        ...current,
        {
          key: `custom-${Date.now()}-${current.length + 1}`,
          roundNumber,
          matchNumber,
        },
      ];
    });
  }

  function removeCustomMatch(key: string) {
    setCustomDraftMatches((current) =>
      current
        .filter((match) => match.key !== key)
        .map((match) => {
          if (match.nextMatchKey !== key) return match;

          const updated = { ...match };
          delete updated.nextMatchKey;
          delete updated.nextSlot;
          return updated;
        }),
    );
  }

  function updateCustomMatchPosition(
    key: string,
    field: "roundNumber" | "matchNumber",
    value: number,
  ) {
    if (!Number.isSafeInteger(value) || value < 1) return;

    setCustomDraftMatches((current) =>
      current.map((match) =>
        match.key === key ? { ...match, [field]: value } : match,
      ),
    );
  }

  async function handlePublishDraw() {
    if (selectedDivisionId === null || !draw || draw.status !== "DRAFT") return;

    if (editingDraft || editingCustomDraft) {
      setActionError("Save or cancel your draft edits before publishing.");
      return;
    }
    if (
      !window.confirm(
        "Publish this bracket? Matchups will be locked, and results can then be recorded.",
      )
    )
      return;

    clearMessages();
    setPublishingDraw(true);

    try {
      await publishTournamentDraw(tournamentId, selectedDivisionId, drawType);

      const hydratedDraw = await getTournamentDraw(
        tournamentId,
        selectedDivisionId,
        drawType,
      );
      setDraw(hydratedDraw);
      setActionMessage("Bracket published. You can now record match results.");
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Couldn't publish the bracket.",
      );
    } finally {
      setPublishingDraw(false);
    }
  }

  async function handleRecordResult(
    match: TournamentMatch,
    winnerEntryId: number,
    score: string,
    walkover: boolean,
  ) {
    if (selectedDivisionId === null) return;

    clearMessages();
    setMatchSavingId(match.id);

    try {
      await recordTournamentMatchResult(
        tournamentId,
        selectedDivisionId,
        drawType,
        match.id,
        { winnerEntryId, score, walkover },
      );

      await refreshDraw();
      setActionMessage(
        "Result saved. The winner has advanced where applicable.",
      );
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Couldn't save match result.",
      );
    } finally {
      setMatchSavingId(null);
    }
  }

  function openShare(target: ShareTarget) {
    setShareMessage(null);
    setShareTarget(target);
  }

  function waitForRender() {
    return new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });
  }

  async function handleSharePng() {
    if (!shareTarget || !exportRef.current) return;

    setExporting(true);
    setShareMessage(null);

    try {
      await waitForRender();

      const blob = await toBlob(exportRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });

      if (!blob) {
        throw new Error("Failed to generate tournament image.");
      }

      const target = shareTarget;

      const fileName =
        target.kind === "BRACKET"
          ? `rallyledger-${safeFilename(tournament?.name ?? "tournament")}-${safeFilename(selectedDivision?.name ?? "division")}-bracket.png`
          : target.kind === "CHAMPION"
            ? `rallyledger-${safeFilename(tournament?.name ?? "tournament")}-champion.png`
            : `rallyledger-${safeFilename(tournament?.name ?? "tournament")}-match-${target.matchId}-result.png`;

      const file = new File([blob], fileName, { type: "image/png" });

      const title =
        target.kind === "BRACKET"
          ? `${tournament?.name ?? "Tournament"} Bracket`
          : target.kind === "CHAMPION"
            ? `${tournament?.name ?? "Tournament"} Champion`
            : `${tournament?.name ?? "Tournament"} Match Result`;

      const shareText =
        target.kind === "BRACKET"
          ? `${tournament?.name ?? "Tournament"} · ${selectedDivision?.name ?? "Division"} bracket`
          : target.kind === "CHAMPION"
            ? `${displayEntry(finalMatch?.winner)} are champions of ${selectedDivision?.name ?? "the division"}!`
            : `Match result from ${tournament?.name ?? "Tournament"}`;

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title, text: shareText, files: [file] });
        setShareMessage("PNG shared successfully.");
      } else {
        const url = URL.createObjectURL(file);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        setShareMessage(
          "This browser can't share files directly, so the PNG was downloaded.",
        );
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;

      console.error(error);
      setShareMessage(
        error instanceof Error
          ? error.message
          : "Failed to share tournament PNG.",
      );
    } finally {
      setExporting(false);
    }
  }

  function winnerDestinationLabel(match: TournamentMatch): string | null {
    if (match.status === "BYE" || match.nextMatchId == null || !draw) {
      return null;
    }

    const destination = draw.matches.find(
      (candidate) => candidate.id === match.nextMatchId,
    );

    if (!destination) return "Winner → Unknown match";

    const destinationRound = rounds.find(
      (round) => round.roundNumber === destination.roundNumber,
    );

    const roundName =
      destinationRound?.label ?? `Round ${destination.roundNumber}`;

    return `Winner → ${roundName} · Match ${destination.matchNumber} · Slot ${match.nextSlot ?? "?"}`;
  }

  function matchByTarget(target: ShareTarget) {
    if (target.kind !== "RESULT" || !draw) return null;

    return draw.matches.find((match) => match.id === target.matchId) ?? null;
  }

  function renderBracketArtwork() {
    if (!draw || !tournament || !selectedDivision) return null;

    const maxRound = Math.max(
      1,
      ...draw.matches.map((match) => match.roundNumber),
    );
    const width = Math.max(1200, maxRound * 414 + 112);
    return (
      <div
        ref={exportRef}
        style={{
          width,
          minHeight: 860,
          boxSizing: "border-box",
          overflow: "hidden",
          position: "relative",
          padding: 44,
          background: BRAND.paper,
          color: BRAND.green,
          fontFamily: "Manrope, DM Sans, Arial, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: 30,
            top: 20,
            transform: "rotate(9deg)",
            opacity: 0.95,
          }}
        >
          <MiniCourt width={56} height={74} />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            paddingBottom: 28,
            borderBottom: `3px solid ${BRAND.green}`,
          }}
        >
          <div style={{ maxWidth: "78%" }}>
            <div
              style={{
                display: "inline-block",
                padding: "8px 13px",
                border: `2px solid ${BRAND.green}`,
                background: BRAND.lime,
                color: BRAND.green,
                fontSize: 15,
                fontWeight: 900,
                letterSpacing: 2,
                textTransform: "uppercase",
                transform: "rotate(-1deg)",
              }}
            >
              RallyLedger · Official Draw
            </div>

            <h1
              style={{
                margin: "22px 0 0",
                fontSize: 48,
                lineHeight: 1.02,
                letterSpacing: -1.5,
                fontWeight: 900,
                color: BRAND.green,
                overflowWrap: "anywhere",
              }}
            >
              {tournament.name}
            </h1>

            <p
              style={{
                margin: "12px 0 0",
                fontSize: 24,
                fontWeight: 800,
                color: BRAND.green,
              }}
            >
              {selectedDivision.name}{" "}
              <span style={{ color: BRAND.muted, fontWeight: 500 }}>
                · {drawType === "MAIN" ? "Main Draw" : "Qualifying Draw"}
              </span>
            </p>

            <p
              style={{
                margin: "9px 0 0",
                fontSize: 17,
                color: BRAND.muted,
              }}
            >
              {tournament.venue || "Venue to be announced"} ·{" "}
              {dateRange(tournament)}
            </p>
          </div>

          <div
            style={{
              position: "absolute",
              right: 45,
              top: 145,
              width: 150,
              height: 190,
              border: `3px solid ${BRAND.green}`,
              padding: 12,
              background: BRAND.white,
              transform: "rotate(2deg)",
            }}
          >
            <CourtDoodle />
            <p
              style={{
                margin: "-2px 0 0",
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: 2,
                textAlign: "center",
              }}
            >
              PLAY · TRAIN · COMPETE
            </p>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 22,
            margin: "22px 0 30px",
            fontSize: 14,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          <span>
            {
              entries.filter((entry) =>
                drawType === "QUALIFYING"
                  ? entry.qualifyingEntry
                  : !entry.qualifyingEntry,
              ).length
            }{" "}
            entries
          </span>

          {hasStandardBracketShape && (
            <span>{draw.drawSize} standard bracket capacity</span>
          )}

          <span>{actualMatchCount} matches</span>

          <span>{summaryByeCount} first-round byes</span>
        </div>

        <TournamentBracketTree
          variant="artwork"
          draw={draw}
          getRoundLabel={roundLabel}
          displayEntry={displayEntry}
          renderMatch={(match) => (
            <div
              style={{
                border: `2px solid ${BRAND.green}`,
                background: BRAND.white,
                boxShadow: `5px 5px 0 ${BRAND.lime}`,
                borderRadius: 9,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  padding: "9px 12px",
                  background: BRAND.green,
                  color: BRAND.white,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 900,
                    letterSpacing: 0.5,
                  }}
                >
                  {roundLabel(match.roundNumber, draw.drawSize).toUpperCase()}
                  {" · MATCH "}
                  {match.matchNumber}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 900,
                    color: match.status === "BYE" ? BRAND.lime : BRAND.white,
                  }}
                >
                  {match.status.replaceAll("_", " ")}
                </span>
              </div>

              {[
                { entry: match.entryA, id: match.entryA?.id ?? match.entryAId },
                { entry: match.entryB, id: match.entryB?.id ?? match.entryBId },
              ].map((side, index) => {
                const isWinner = Boolean(
                  match.winnerEntryId && side.id === match.winnerEntryId,
                );

                return (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "13px 12px",
                      borderBottom: index === 0 ? "1px solid #dce4d8" : "none",
                      background: isWinner ? "#eaff9a" : BRAND.white,
                      color: BRAND.green,
                      minHeight: 47,
                    }}
                  >
                    <span
                      style={{
                        display: "grid",
                        placeItems: "center",
                        width: 26,
                        height: 26,
                        flex: "0 0 26px",
                        borderRadius: 5,
                        background: isWinner ? BRAND.lime : "#e8ebe4",
                        fontSize: 12,
                        fontWeight: 900,
                      }}
                    >
                      {side.entry?.seed ?? index + 1}
                    </span>
                    <span
                      style={{
                        flex: 1,
                        minWidth: 0,
                        fontSize: 14,
                        lineHeight: 1.25,
                        fontWeight: isWinner ? 900 : 700,
                        overflowWrap: "anywhere",
                      }}
                    >
                      {displayEntry(side.entry)}
                    </span>
                    {isWinner && (
                      <span style={{ fontSize: 16, fontWeight: 900 }}>✓</span>
                    )}
                  </div>
                );
              })}

              {match.score && (
                <div
                  style={{
                    padding: "7px 12px",
                    textAlign: "center",
                    fontSize: 14,
                    fontWeight: 900,
                    letterSpacing: 1,
                    background: BRAND.paper,
                    color: BRAND.green,
                  }}
                >
                  {match.score}
                </div>
              )}

              <div
                style={{
                  padding: "8px 12px",
                  textAlign: "center",
                  fontSize: 10,
                  fontWeight: 900,
                  letterSpacing: 0.5,
                  color: BRAND.green,
                  background: "#efff9b",
                }}
              >
                {winnerDestinationLabel(match)?.toUpperCase() ??
                  "CHAMPIONSHIP · FINAL"}
              </div>
            </div>
          )}
        />

        <footer
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 18,
            marginTop: 42,
            paddingTop: 20,
            borderTop: `2px solid ${BRAND.green}`,
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontSize: 22,
                fontWeight: 1000,
                letterSpacing: 2,
                color: BRAND.green,
              }}
            >
              RALLY
              <span style={{ background: BRAND.lime, padding: "2px 5px" }}>
                LEDGER
              </span>
            </p>
            <p
              style={{
                margin: "6px 0 0",
                fontSize: 12,
                color: BRAND.muted,
              }}
            >
              Club management, simplified. · Compete · Connect · Advance
            </p>
          </div>

          <span
            style={{
              padding: "9px 13px",
              background: BRAND.lime,
              color: BRAND.green,
              border: `2px solid ${BRAND.green}`,
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: 1,
            }}
          >
            OFFICIAL CLUB DRAW
          </span>
        </footer>
      </div>
    );
  }

  function renderResultArtwork(
    target: Extract<ShareTarget, { kind: "RESULT" }>,
  ) {
    if (!draw || !tournament || !selectedDivision) return null;

    const match = matchByTarget(target);
    if (!match) return null;

    const winner =
      match.winner ??
      (match.winnerEntryId === match.entryA?.id ? match.entryA : match.entryB);

    const opponent =
      match.winnerEntryId === match.entryA?.id ||
      match.winnerEntryId === match.entryAId
        ? match.entryB
        : match.entryA;

    return (
      <div
        ref={exportRef}
        style={{
          position: "relative",
          width: 1080,
          height: 1350,
          boxSizing: "border-box",
          padding: 76,
          overflow: "hidden",
          background: BRAND.green,
          color: BRAND.white,
          fontFamily: "Manrope, DM Sans, Arial, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 24,
            border: "2px dashed rgba(255,253,245,.20)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            position: "absolute",
            top: 90,
            right: 80,
            transform: "rotate(13deg)",
          }}
        >
          <MiniCourt width={76} height={98} />
        </div>

        <div
          style={{
            position: "absolute",
            right: -80,
            bottom: 170,
            opacity: 0.11,
          }}
        >
          <CourtDoodle />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
          }}
        >
          <div
            style={{
              border: `3px solid ${BRAND.lime}`,
              background: BRAND.lime,
              color: BRAND.green,
              padding: "13px 18px",
              fontWeight: 900,
              fontSize: 19,
              letterSpacing: 3,
              transform: "rotate(-2deg)",
            }}
          >
            MATCH POINT
          </div>
          <span
            style={{
              color: BRAND.lime,
              fontSize: 18,
              fontWeight: 900,
              letterSpacing: 4,
            }}
          >
            RALLYLEDGER
          </span>
        </div>

        <p
          style={{
            margin: "90px 0 0",
            color: BRAND.lime,
            fontSize: 20,
            letterSpacing: 5,
            fontWeight: 900,
            textTransform: "uppercase",
          }}
        >
          {selectedDivision.name} ·{" "}
          {roundLabel(match.roundNumber, draw.drawSize)}
        </p>

        <h1
          style={{
            margin: "20px 0 0",
            maxWidth: 850,
            fontSize: 64,
            lineHeight: 1.02,
            fontWeight: 1000,
            letterSpacing: -2,
            overflowWrap: "anywhere",
            color: BRAND.white,
          }}
        >
          {tournament.name}
        </h1>

        <div
          style={{
            marginTop: 58,
            borderLeft: `12px solid ${BRAND.lime}`,
            paddingLeft: 28,
          }}
        >
          <p
            style={{
              margin: 0,
              color: BRAND.lime,
              fontSize: 24,
              letterSpacing: 6,
              fontWeight: 900,
            }}
          >
            THE WINNER
          </p>

          <h2
            style={{
              margin: "14px 0 0",
              fontSize: 66,
              lineHeight: 1.02,
              fontWeight: 1000,
              letterSpacing: -2,
              color: BRAND.white,
              overflowWrap: "anywhere",
            }}
          >
            {displayEntry(winner)}
          </h2>

          <p
            style={{
              margin: "22px 0 0",
              fontSize: 26,
              color: BRAND.paper,
              fontWeight: 600,
            }}
          >
            defeated{" "}
            <span style={{ color: BRAND.white, fontWeight: 800 }}>
              {displayEntry(opponent)}
            </span>
          </p>
        </div>

        <div
          style={{
            marginTop: 50,
            padding: "28px 32px",
            background: BRAND.paper,
            color: BRAND.green,
            border: `4px solid ${BRAND.lime}`,
            boxShadow: `12px 12px 0 ${BRAND.lime}`,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 17,
              letterSpacing: 4,
              fontWeight: 900,
              color: BRAND.muted,
            }}
          >
            FINAL SCORE
          </p>

          <p
            style={{
              margin: "12px 0 0",
              fontSize: 62,
              letterSpacing: 1,
              fontWeight: 1000,
              color: BRAND.green,
            }}
          >
            {match.score ||
              (match.status === "WALKOVER" ? "WALKOVER" : "RESULT")}
          </p>
        </div>

        <div
          style={{
            position: "absolute",
            left: 76,
            right: 76,
            bottom: 68,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            borderTop: "2px solid rgba(255,253,245,.30)",
            paddingTop: 24,
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                color: BRAND.lime,
                fontSize: 22,
                fontWeight: 1000,
                letterSpacing: 3,
              }}
            >
              PLAY. TRAIN. COMPETE.
            </p>
            <p
              style={{
                margin: "8px 0 0",
                color: BRAND.paper,
                fontSize: 16,
              }}
            >
              {tournament.venue || "Club tournament"} · {dateRange(tournament)}
            </p>
          </div>

          <div
            style={{
              borderRadius: "50%",
              padding: 8,
              background: BRAND.lime,
              transform: "rotate(-12deg)",
            }}
          >
            <Trophy size={54} color={BRAND.green} strokeWidth={2.5} />
          </div>
        </div>
      </div>
    );
  }

  function renderChampionArtwork() {
    if (!tournament || !selectedDivision || !finalMatch?.winner) return null;

    return (
      <div
        ref={exportRef}
        style={{
          position: "relative",
          width: 1080,
          height: 1350,
          boxSizing: "border-box",
          padding: 76,
          overflow: "hidden",
          background: BRAND.green,
          color: BRAND.white,
          fontFamily: "Manrope, DM Sans, Arial, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 24,
            border: "2px dashed rgba(255,253,245,.20)",
          }}
        />

        <div
          style={{
            position: "absolute",
            right: 68,
            top: 180,
            transform: "rotate(14deg)",
          }}
        >
          <MiniCourt width={82} height={106} />
        </div>

        <div
          style={{
            position: "absolute",
            left: -65,
            bottom: 160,
            opacity: 0.1,
          }}
        >
          <CourtDoodle />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              padding: "13px 18px",
              background: BRAND.lime,
              color: BRAND.green,
              border: `3px solid ${BRAND.lime}`,
              fontSize: 18,
              fontWeight: 900,
              letterSpacing: 4,
              transform: "rotate(-2deg)",
            }}
          >
            THE FINAL WORD
          </div>

          <Trophy size={68} color={BRAND.lime} strokeWidth={2.2} />
        </div>

        <p
          style={{
            margin: "76px 0 0",
            color: BRAND.lime,
            fontSize: 22,
            letterSpacing: 6,
            fontWeight: 900,
          }}
        >
          TOURNAMENT CHAMPION
        </p>

        <h1
          style={{
            margin: "20px 0 0",
            maxWidth: 850,
            fontSize: 62,
            lineHeight: 1.02,
            fontWeight: 1000,
            color: BRAND.white,
            overflowWrap: "anywhere",
          }}
        >
          {tournament.name}
        </h1>

        <p
          style={{
            margin: "18px 0 0",
            color: BRAND.paper,
            fontSize: 27,
            fontWeight: 700,
          }}
        >
          {selectedDivision.name}
        </p>

        <div
          style={{
            marginTop: 54,
            width: 205,
            height: 205,
            display: "grid",
            placeItems: "center",
            border: `6px solid ${BRAND.green}`,
            outline: `8px solid ${BRAND.lime}`,
            borderRadius: "50%",
            background: BRAND.paper,
            transform: "rotate(-4deg)",
          }}
        >
          <Trophy size={112} color={BRAND.green} strokeWidth={1.8} />
        </div>

        <p
          style={{
            margin: "70px 0 0",
            color: BRAND.lime,
            fontSize: 23,
            letterSpacing: 6,
            fontWeight: 900,
          }}
        >
          YOUR CHAMPION
        </p>

        <h2
          style={{
            margin: "18px 0 0",
            maxWidth: 900,
            fontSize: 72,
            lineHeight: 0.98,
            letterSpacing: -2,
            fontWeight: 1000,
            color: BRAND.white,
            overflowWrap: "anywhere",
          }}
        >
          {displayEntry(finalMatch.winner)}
        </h2>

        <div
          style={{
            marginTop: 35,
            display: "inline-flex",
            alignItems: "center",
            gap: 18,
            padding: "18px 24px",
            background: BRAND.paper,
            color: BRAND.green,
            border: `3px solid ${BRAND.lime}`,
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 900, letterSpacing: 3 }}>
            FINAL SCORE
          </span>
          <span style={{ fontSize: 31, fontWeight: 1000 }}>
            {finalMatch.score || "WALKOVER"}
          </span>
        </div>

        <div
          style={{
            position: "absolute",
            left: 76,
            right: 76,
            bottom: 68,
            paddingTop: 23,
            borderTop: "2px solid rgba(255,253,245,.3)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                color: BRAND.lime,
                fontSize: 24,
                fontWeight: 1000,
                letterSpacing: 3,
              }}
            >
              RALLYLEDGER
            </p>
            <p
              style={{
                margin: "8px 0 0",
                color: BRAND.paper,
                fontSize: 16,
              }}
            >
              One draw. Every match. One champion.
            </p>
          </div>

          <div style={{ transform: "rotate(11deg)" }}>
            <MiniCourt width={44} height={58} />
          </div>
        </div>
      </div>
    );
  }

  function renderExportArtwork(target: ShareTarget) {
    if (target.kind === "BRACKET") return renderBracketArtwork();
    if (target.kind === "CHAMPION") return renderChampionArtwork();
    return renderResultArtwork(target);
  }

  function renderPreview(target: ShareTarget) {
    if (target.kind === "BRACKET") {
      return (
        <div className="rounded-2xl border-2 border-[#103f25] bg-[#f1eee5] p-5 text-[#103f25] shadow-[5px_5px_0_#dfff28]">
          <div className="flex items-center justify-between gap-2">
            <span className="bg-[#dfff28] px-3 py-2 text-xs font-black uppercase tracking-widest">
              Full draw
            </span>
            <MiniCourt width={30} height={40} />
          </div>

          <p className="mt-4 text-2xl font-black leading-tight">
            {tournament?.name}
          </p>
          <p className="mt-1 font-bold">
            {selectedDivision?.name} ·{" "}
            {drawType === "MAIN" ? "Main Draw" : "Qualifying Draw"}
          </p>

          <TournamentBracketTree
            variant="preview"
            draw={draw!}
            getRoundLabel={roundLabel}
            displayEntry={displayEntry}
            renderMatch={(match) => (
              <div className="rounded border border-[#103f25]/25 bg-[#fffdf5] p-1.5 text-[8px] font-bold text-[#103f25]">
                <p className="font-black">
                  {roundLabel(match.roundNumber, draw!.drawSize)} · M
                  {match.matchNumber}
                </p>
                <p className="mt-1 break-words">{displayEntry(match.entryA)}</p>
                <div className="my-1 border-t border-[#103f25]/20" />
                <p className="break-words">{displayEntry(match.entryB)}</p>
                {match.score && <p className="mt-1">{match.score}</p>}
              </div>
            )}
          />

          <p className="mt-3 text-[10px] font-black uppercase tracking-widest">
            RALLYLEDGER · PLAY. TRAIN. COMPETE.
          </p>
        </div>
      );
    }

    if (target.kind === "CHAMPION") {
      return (
        <div className="relative overflow-hidden rounded-2xl border-2 border-[#dfff28] bg-[#103f25] p-6 text-[#fffdf5] shadow-[5px_5px_0_#dfff28]">
          <div className="flex justify-between">
            <span className="bg-[#dfff28] px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[#103f25]">
              Tournament champion
            </span>
            <Trophy size={35} color="#dfff28" />
          </div>

          <p className="mt-7 text-xs font-black uppercase tracking-widest text-[#dfff28]">
            {selectedDivision?.name}
          </p>
          <p className="mt-2 text-2xl font-black leading-tight">
            {tournament?.name}
          </p>

          <div className="my-5 grid h-20 w-20 place-items-center rounded-full bg-[#f1eee5]">
            <Trophy size={46} color="#103f25" />
          </div>

          <p className="text-xs font-black uppercase tracking-widest text-[#dfff28]">
            Your champion
          </p>
          <p className="mt-2 break-words text-3xl font-black">
            {displayEntry(finalMatch?.winner)}
          </p>
          <p className="mt-3 inline-block bg-[#f1eee5] px-3 py-2 font-black text-[#103f25]">
            {finalMatch?.score || "WALKOVER"}
          </p>
          <p className="mt-6 text-xs font-bold">
            RALLYLEDGER · ONE DRAW. EVERY MATCH. ONE CHAMPION.
          </p>
        </div>
      );
    }

    const match = matchByTarget(target);
    const winner =
      match?.winner ??
      (match?.winnerEntryId === match?.entryA?.id
        ? match?.entryA
        : match?.entryB);
    const opponent =
      match &&
      (match.winnerEntryId === match.entryA?.id ||
        match.winnerEntryId === match.entryAId)
        ? match.entryB
        : match?.entryA;

    return (
      <div className="relative overflow-hidden rounded-2xl border-2 border-[#dfff28] bg-[#103f25] p-6 text-[#fffdf5] shadow-[5px_5px_0_#dfff28]">
        <div className="flex items-center justify-between">
          <span className="bg-[#dfff28] px-3 py-2 text-xs font-black uppercase tracking-widest text-[#103f25]">
            Match point
          </span>
          <MiniCourt width={30} height={40} />
        </div>
        <p className="mt-6 text-xs font-black uppercase tracking-widest text-[#dfff28]">
          {selectedDivision?.name} ·{" "}
          {match
            ? roundLabel(match.roundNumber, draw?.drawSize ?? 2)
            : "Match result"}
        </p>
        <p className="mt-2 text-xl font-black leading-tight">
          {tournament?.name}
        </p>
        <p className="mt-5 text-xs font-black uppercase tracking-widest text-[#dfff28]">
          The winner
        </p>
        <p className="mt-2 break-words text-3xl font-black">
          {displayEntry(winner)}
        </p>
        <p className="mt-2 text-sm text-[#f1eee5]">
          defeated {displayEntry(opponent)}
        </p>
        <div className="mt-5 bg-[#f1eee5] p-3 text-[#103f25]">
          <p className="text-[10px] font-black uppercase tracking-widest">
            Final score
          </p>
          <p className="mt-1 text-2xl font-black">
            {match?.score || "WALKOVER"}
          </p>
        </div>
        <p className="mt-5 text-xs font-black uppercase tracking-widest">
          RALLYLEDGER · PLAY. TRAIN. COMPETE.
        </p>
      </div>
    );
  }

  if (!validTournamentId) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5">
        <h1 className="font-semibold text-red-900">Invalid tournament</h1>
        <p className="mt-2 text-sm text-red-700">
          The tournament ID in this URL is invalid.
        </p>
        <button
          type="button"
          onClick={() => navigate("/tournaments")}
          className="secondary-action mt-4 rounded-lg px-4 py-2 text-sm"
        >
          Back to tournaments
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl animate-pulse space-y-5">
        <div className="h-5 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-40 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-48 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
      </div>
    );
  }

  if (loadError || !tournament) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-red-50 p-6">
        <h1 className="text-lg font-semibold text-red-900">
          Couldn't open tournament
        </h1>
        <p className="mt-2 text-sm text-red-700">
          {loadError ?? "Tournament not found."}
        </p>
        <button
          type="button"
          onClick={() => navigate("/tournaments")}
          className="secondary-action mt-5 rounded-lg px-4 py-2 text-sm"
        >
          Back to tournaments
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-10">
      <button
        type="button"
        onClick={() => navigate("/tournaments")}
        className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        All tournaments
      </button>

      <header className="relative overflow-hidden rounded-[28px] border-2 border-[#103f25] bg-[#f1eee5] p-6 text-[#103f25] shadow-[8px_8px_0_#dfff28] sm:p-8">
        <div className="pointer-events-none absolute -right-5 -top-4 rotate-12 opacity-90">
          <MiniCourt width={68} height={88} />
        </div>

        <div className="relative max-w-4xl">
          <div className="inline-flex rotate-[-1deg] items-center gap-2 border-2 border-[#103f25] bg-[#dfff28] px-3 py-2 text-[10px] font-black uppercase tracking-[0.15em]">
            <Trophy className="h-3.5 w-3.5" />
            Tournament control
          </div>

          <h1 className="mt-5 max-w-4xl break-words text-3xl font-black leading-[0.95] tracking-[-0.055em] sm:text-5xl">
            {tournament.name}
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-6 text-[#103f25]/80 sm:text-base">
            {tournament.description ||
              "Manage divisions, register players, build your draw, and share the moments that matter."}
          </p>

          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3 text-sm font-semibold">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              {dateRange(tournament)}
            </span>
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {tournament.venue || "Venue to be announced"}
            </span>
            <span className="inline-flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              Single elimination
            </span>
          </div>
        </div>

        <div className="relative mt-6 flex flex-wrap gap-2">
          {draw && (
            <button
              type="button"
              onClick={() => openShare({ kind: "BRACKET" })}
              className="secondary-action inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black"
            >
              <Share2 className="h-4 w-4" />
              Share bracket PNG
            </button>
          )}

          {canManage && (
            <button
              type="button"
              onClick={() => setShowDivisionForm((value) => !value)}
              disabled={availableDivisions.length === 0}
              className="primary-action inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Add division
            </button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Divisions", value: divisions.length, icon: GitBranch },
          { label: "Registered entries", value: entries.length, icon: Users },
          {
            label: "Draw matches",
            value: draw?.matches.length ?? 0,
            icon: Trophy,
          },
          {
            label: "Results recorded",
            value: draw?.matches.filter(isResultComplete).length ?? 0,
            icon: Check,
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  {item.label}
                </span>
                <Icon className="h-4 w-4 text-emerald-800 dark:text-lime-300" />
              </div>
              <p className="mt-2 text-2xl font-black text-zinc-950 dark:text-white">
                {item.value}
              </p>
            </div>
          );
        })}
      </div>

      {actionError && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          <span>{actionError}</span>
          <button
            type="button"
            aria-label="Dismiss error"
            onClick={() => setActionError(null)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {actionMessage && (
        <div
          role="status"
          className="flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
        >
          <span className="flex items-center gap-2">
            <Check className="h-4 w-4 shrink-0" />
            {actionMessage}
          </span>
          <button
            type="button"
            aria-label="Dismiss message"
            onClick={() => setActionMessage(null)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {showDivisionForm && canManage && (
        <form
          onSubmit={handleCreateDivision}
          className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6"
        >
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-zinc-950 dark:text-white">
                Add a division
              </h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Configure singles, doubles, or a qualifying draw.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowDivisionForm(false)}
              aria-label="Close division form"
              className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {availableDivisions.length === 0 ? (
            <p className="text-sm text-zinc-500">
              All supported divisions have been added.
            </p>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                    Category
                  </span>
                  <select
                    value={effectiveDivisionCode}
                    onChange={(event) => {
                      setDivisionCode(
                        event.target.value as TournamentDivisionCode,
                      );
                      setDivisionName("");
                    }}
                    className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                  >
                    {availableDivisions.map((choice) => (
                      <option key={choice.code} value={choice.code}>
                        {choice.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                    Display name (optional)
                  </span>
                  <input
                    value={divisionName}
                    onChange={(event) => setDivisionName(event.target.value)}
                    placeholder={
                      divisionChoices.find(
                        (item) => item.code === effectiveDivisionCode,
                      )?.name
                    }
                    className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                  />
                </label>
              </div>

              <div className="mt-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={qualifyingEnabled}
                    onChange={(event) => {
                      setQualifyingEnabled(event.target.checked);
                      if (!event.target.checked) setQualifyingSpots("4");
                    }}
                    className="mt-1 accent-lime-500"
                  />
                  <span>
                    <span className="block text-sm font-bold text-zinc-800 dark:text-zinc-200">
                      Enable qualifying draw
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                      Qualifying stays separate from the main draw; advancing
                      qualifiers must be promoted through a separate workflow.
                    </span>
                  </span>
                </label>

                {qualifyingEnabled && (
                  <label className="mt-4 block max-w-xs">
                    <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                      Qualifying spots
                    </span>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      required
                      value={qualifyingSpots}
                      onChange={(event) =>
                        setQualifyingSpots(event.target.value)
                      }
                      className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                    />
                  </label>
                )}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={creatingDivision}
                  className="primary-action inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-black disabled:opacity-50"
                >
                  {creatingDivision && (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  )}
                  {creatingDivision ? "Adding..." : "Add division"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDivisionForm(false)}
                  className="secondary-action rounded-lg px-4 py-2.5 text-sm font-bold"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </form>
      )}

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-black text-zinc-950 dark:text-white">
              Divisions
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Choose a division to manage its entries and draw.
            </p>
          </div>
          <span className="text-xs text-zinc-400">
            {divisions.length} of {divisionChoices.length} categories
          </span>
        </div>

        {divisions.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-zinc-300 px-5 py-10 text-center dark:border-zinc-700">
            <GitBranch className="mx-auto h-8 w-8 text-emerald-800 dark:text-lime-300" />
            <h3 className="mt-3 font-bold text-zinc-900 dark:text-white">
              Start with your first division
            </h3>
            <p className="mt-1 text-sm text-zinc-500">
              Choose a singles or doubles category.
            </p>
            {canManage && (
              <button
                type="button"
                onClick={() => setShowDivisionForm(true)}
                className="primary-action mt-5 rounded-lg px-4 py-2 text-sm font-bold"
              >
                Add first division
              </button>
            )}
          </div>
        ) : (
          <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
            {divisions.map((division) => {
              const active = selectedDivisionId === division.id;

              return (
                <button
                  key={division.id}
                  type="button"
                  onClick={() => {
                    setSelectedDivisionId(division.id);
                    setDrawType("MAIN");
                    setDraw(null);
                    setEntries([]);
                    setPlayerOneId("");
                    setPlayerTwoId("");
                    setEntryQualifying(false);
                    clearMessages();
                  }}
                  className={`shrink-0 rounded-xl border-2 px-4 py-3 text-left transition ${
                    active
                      ? "border-[#103f25] bg-[#103f25] text-white shadow-[3px_3px_0_#dfff28]"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-emerald-300 hover:bg-emerald-50/40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                  }`}
                >
                  <span className="block text-sm font-black">
                    {division.name}
                  </span>
                  <span
                    className={`mt-1 block text-[11px] ${
                      active ? "text-[#dfff28]" : "text-zinc-400"
                    }`}
                  >
                    {division.qualifyingEnabled
                      ? "Qualifying enabled"
                      : "Main draw"}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {selectedDivision && (
        <section className="grid gap-5 xl:grid-cols-[minmax(300px,0.82fr)_minmax(0,1.8fr)]">
          <div className="space-y-5">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-800 dark:text-lime-300">
                    Division setup
                  </p>
                  <h2 className="mt-1 text-xl font-black text-zinc-950 dark:text-white">
                    {selectedDivision.name}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    {isDoubles
                      ? "Two players per entry"
                      : "One player per entry"}
                  </p>
                </div>
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-lime-300">
                  {isDoubles ? (
                    <Users className="h-5 w-5" />
                  ) : (
                    <Trophy className="h-5 w-5" />
                  )}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/70">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Entries
                  </p>
                  <p className="mt-1 text-2xl font-black text-zinc-950 dark:text-white">
                    {entries.length}
                  </p>
                </div>
                <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/70">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Qualifying spots
                  </p>
                  <p className="mt-1 text-2xl font-black text-zinc-950 dark:text-white">
                    {selectedDivision.qualifyingEnabled
                      ? selectedDivision.qualifyingSpots
                      : "—"}
                  </p>
                </div>
              </div>

              {selectedDivision.qualifyingEnabled && (
                <div className="mt-4 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
                  <CircleHelp className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>
                    Qualifying uses a separate draw. Promotion of qualifying
                    winners into the main draw is not automatic yet.
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-4">
                <h3 className="font-black text-zinc-950 dark:text-white">
                  Register an entry
                </h3>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {isDoubles
                    ? "Choose two different players for this team."
                    : "Search for a participant to enter this division."}
                </p>
              </div>

              {!canManage ? (
                <p className="rounded-lg bg-zinc-50 p-3 text-sm text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  You have view access. An administrator can register entries.
                </p>
              ) : draw ? (
                <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
                  A draw has been generated. Registration is closed here to
                  protect the existing bracket.
                </p>
              ) : (
                <form onSubmit={handleCreateEntry} className="space-y-3">
                  <label className="block">
                    <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">
                      Entry or team name{" "}
                      <span className="font-normal text-zinc-400">
                        (optional)
                      </span>
                    </span>
                    <input
                      value={entryName}
                      onChange={(event) => setEntryName(event.target.value)}
                      placeholder={
                        isDoubles
                          ? "e.g. Team Alpha"
                          : "Uses player's name if blank"
                      }
                      className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold text-zinc-600 dark:text-zinc-300">
                      {isDoubles ? "Player 1" : "Participant"}
                    </span>
                    <ParticipantPicker
                      participants={
                        isDoubles
                          ? participants.filter(
                              (participant) =>
                                String(participant.id) !== playerTwoId,
                            )
                          : participants
                      }
                      selectedParticipantId={playerOneId}
                      onSelect={setPlayerOneId}
                      disabled={saving}
                      placeholder={
                        isDoubles
                          ? "Search player 1..."
                          : "Search participant..."
                      }
                    />
                  </label>

                  {isDoubles && (
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-bold text-zinc-600 dark:text-zinc-300">
                        Player 2
                      </span>
                      <ParticipantPicker
                        participants={participants.filter(
                          (participant) =>
                            String(participant.id) !== playerOneId,
                        )}
                        selectedParticipantId={playerTwoId}
                        onSelect={setPlayerTwoId}
                        disabled={saving}
                        placeholder="Search partner..."
                      />
                    </label>
                  )}

                  <label className="block">
                    <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">
                      Seed{" "}
                      <span className="font-normal text-zinc-400">
                        (optional)
                      </span>
                    </span>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={entrySeed}
                      onChange={(event) => setEntrySeed(event.target.value)}
                      placeholder="e.g. 1"
                      className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                    />
                  </label>

                  {selectedDivision.qualifyingEnabled && (
                    <label className="flex items-start gap-2 rounded-lg bg-zinc-50 p-3 text-sm dark:bg-zinc-800/70">
                      <input
                        type="checkbox"
                        checked={entryQualifying}
                        onChange={(event) =>
                          setEntryQualifying(event.target.checked)
                        }
                        className="mt-1 accent-lime-500"
                      />
                      <span>
                        <span className="block font-bold text-zinc-800 dark:text-zinc-200">
                          Enter qualifying draw
                        </span>
                        <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-400">
                          Leave unchecked to enter the main draw.
                        </span>
                      </span>
                    </label>
                  )}

                  <button
                    type="submit"
                    disabled={saving || participants.length === 0}
                    className="primary-action inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-black disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving && (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    )}
                    {saving ? "Registering..." : "Register entry"}
                  </button>
                </form>
              )}
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-black text-zinc-950 dark:text-white">
                    Registered entries
                  </h3>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {entries.length} total in this division
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (selectedDivisionId !== null) {
                      void getTournamentEntries(
                        tournamentId,
                        selectedDivisionId,
                      )
                        .then(setEntries)
                        .catch((error: unknown) =>
                          setActionError(
                            error instanceof Error
                              ? error.message
                              : "Couldn't refresh entries.",
                          ),
                        );
                    }
                  }}
                  aria-label="Refresh entries"
                  className="secondary-action rounded-lg p-2"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>

              {divisionLoading ? (
                <div className="flex items-center gap-2 py-6 text-sm text-zinc-500">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Loading entries...
                </div>
              ) : entries.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-200 px-4 py-7 text-center dark:border-zinc-700">
                  <Users className="mx-auto h-6 w-6 text-zinc-400" />
                  <p className="mt-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    No entries yet
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Registered players and teams will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center gap-3 rounded-xl border border-zinc-100 px-3 py-3 dark:border-zinc-800"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-xs font-black text-emerald-950 dark:bg-emerald-950 dark:text-lime-300">
                        {entry.seed ?? <Users className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-zinc-900 dark:text-white">
                          {entry.entryName?.trim() ||
                            (entry.players ?? [])
                              .map(
                                (player) =>
                                  player.nickname?.trim() ||
                                  `${player.firstName} ${player.lastName}`,
                              )
                              .join(" / ") ||
                            `Entry #${entry.id}`}
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                          {(entry.players ?? []).length} player(s)
                          {entry.qualifyingEntry
                            ? " · Qualifying"
                            : " · Main draw"}
                        </p>
                      </div>
                      <span className="rounded-full bg-zinc-100 px-2 py-1 text-[10px] font-black uppercase text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                        {entry.entryStatus}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="min-w-0 space-y-4">
            <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-800 dark:text-lime-300">
                    The draw
                  </p>
                  <h2 className="mt-1 text-xl font-black text-zinc-950 dark:text-white">
                    {selectedDivision.name}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    Connected single-elimination bracket
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedDivision.qualifyingEnabled && (
                    <select
                      aria-label="Draw type"
                      value={drawType}
                      onChange={(event) => {
                        setDrawType(event.target.value as DrawType);
                        setDraw(null);
                        clearMessages();
                      }}
                      className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                    >
                      <option value="MAIN">Main draw</option>
                      <option value="QUALIFYING">Qualifying draw</option>
                    </select>
                  )}

                  {canManage && eligiblePoolEntries.length >= 2 && (
                    <div className="mt-5 flex flex-wrap justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => void handleGenerateDraw()}
                        disabled={generatingDraw || editingCustomDraft}
                        className="primary-action inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-black disabled:opacity-50"
                      >
                        <Sparkles className="h-4 w-4" />
                        {generatingDraw ? "Generating..." : "Generate bracket"}
                      </button>
                      <button
                        type="button"
                        onClick={beginCustomDraft}
                        disabled={generatingDraw || savingCustomDraft}
                        className="secondary-action inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-black disabled:opacity-50"
                      >
                        <GitBranch className="h-4 w-4" />
                        Build custom bracket
                      </button>
                    </div>
                  )}

                  {draw && (
                    <button
                      type="button"
                      onClick={() => openShare({ kind: "BRACKET" })}
                      className="secondary-action inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-black"
                    >
                      <Share2 className="h-4 w-4" />
                      Share as PNG
                    </button>
                  )}
                </div>
              </div>
              {draw?.status === "DRAFT" &&
                canManage &&
                !editingDraft &&
                !editingCustomDraft && (
                  <>
                    <button
                      type="button"
                      onClick={beginCustomDraft}
                      disabled={
                        divisionLoading ||
                        savingDraft ||
                        savingCustomDraft ||
                        publishingDraw
                      }
                      className="secondary-action inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-black disabled:opacity-50"
                    >
                      <GitBranch className="h-4 w-4" />
                      Custom bracket builder
                    </button>
                    <button
                      type="button"
                      onClick={() => beginDraftEdit()}
                      disabled={
                        divisionLoading || savingDraft || publishingDraw
                      }
                      className="secondary-action inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-black disabled:opacity-50"
                    >
                      Edit matchups
                    </button>
                    <button
                      type="button"
                      onClick={() => void handlePublishDraw()}
                      disabled={
                        divisionLoading || savingDraft || publishingDraw
                      }
                      className="primary-action inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-black disabled:opacity-50"
                    >
                      {publishingDraw ? "Publishing..." : "Publish draw"}
                    </button>
                  </>
                )}
              {editingCustomDraft && canManage && (
                <section className="mt-4 rounded-xl border-2 border-[#103f25]/20 bg-[#fffdf5] p-4 text-[#153323] sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-black">
                        Custom bracket builder
                      </h3>
                      <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-600">
                        Drag an entry or a match winner onto a slot. You can
                        also use each slot's dropdown. Every entry must appear
                        once, every slot needs a source, and all paths must
                        reach one final.
                      </p>
                    </div>
                    <span className="rounded-full bg-[#dfff28] px-3 py-1 text-xs font-black">
                      {customDraftMatches.length} matches
                    </span>
                  </div>

                  <div className="mt-4 rounded-xl border border-[#103f25]/15 bg-white p-3">
                    <p className="mb-2 text-xs font-black uppercase tracking-wide text-[#55705e]">
                      Entry pool · Drag into any slot
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {eligiblePoolEntries.map((entry) => {
                        const names = (entry.players ?? [])
                          .map(
                            (player) =>
                              player.nickname?.trim() ||
                              `${player.firstName} ${player.lastName}`.trim(),
                          )
                          .filter(Boolean)
                          .join(" / ");
                        const name =
                          entry.entryName?.trim() ||
                          names ||
                          `Entry #${entry.id}`;

                        return (
                          <button
                            key={entry.id}
                            type="button"
                            draggable
                            onDragStart={(event) => {
                              event.dataTransfer.setData(
                                "text/plain",
                                `entry:${entry.id}`,
                              );
                              event.dataTransfer.effectAllowed = "move";
                            }}
                            className="cursor-grab rounded-lg border border-[#103f25]/20 bg-[#f1eee5] px-3 py-2 text-left text-xs font-bold active:cursor-grabbing"
                            title="Drag this entry to a match slot"
                          >
                            {entry.seed ? `#${entry.seed} · ` : ""}
                            {name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    {[...customDraftMatches]
                      .sort(
                        (a, b) =>
                          a.roundNumber - b.roundNumber ||
                          a.matchNumber - b.matchNumber,
                      )
                      .map((match) => (
                        <article
                          key={match.key}
                          className="min-w-0 rounded-xl border-2 border-[#103f25]/15 bg-white p-3 sm:p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <p className="text-xs font-black uppercase tracking-wide text-[#55705e]">
                                Match {match.matchNumber}
                              </p>
                              <div className="mt-2 flex items-center gap-2">
                                <label className="text-xs font-bold text-zinc-600">
                                  Round
                                  <input
                                    aria-label={`Round for match ${match.matchNumber}`}
                                    type="number"
                                    min={1}
                                    step={1}
                                    value={match.roundNumber}
                                    disabled={savingCustomDraft}
                                    onChange={(event) =>
                                      updateCustomMatchPosition(
                                        match.key,
                                        "roundNumber",
                                        Number(event.target.value),
                                      )
                                    }
                                    className="ml-2 w-16 rounded border border-zinc-200 px-2 py-1 text-sm text-zinc-900"
                                  />
                                </label>
                                <label className="text-xs font-bold text-zinc-600">
                                  Match #
                                  <input
                                    aria-label={`Match number for match ${match.matchNumber}`}
                                    type="number"
                                    min={1}
                                    step={1}
                                    value={match.matchNumber}
                                    disabled={savingCustomDraft}
                                    onChange={(event) =>
                                      updateCustomMatchPosition(
                                        match.key,
                                        "matchNumber",
                                        Number(event.target.value),
                                      )
                                    }
                                    className="ml-2 w-16 rounded border border-zinc-200 px-2 py-1 text-sm text-zinc-900"
                                  />
                                </label>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                draggable
                                disabled={savingCustomDraft}
                                onDragStart={(event) => {
                                  event.dataTransfer.setData(
                                    "text/plain",
                                    `winner:${match.key}`,
                                  );
                                  event.dataTransfer.effectAllowed = "move";
                                }}
                                className="cursor-grab rounded-lg border border-[#103f25]/20 bg-[#f1eee5] px-2.5 py-2 text-xs font-bold active:cursor-grabbing disabled:opacity-50"
                                title="Drag this match's winner into a later match slot"
                              >
                                <GitBranch className="mr-1 inline h-3.5 w-3.5" />
                                Drag winner
                              </button>
                              <button
                                type="button"
                                disabled={savingCustomDraft}
                                onClick={() => removeCustomMatch(match.key)}
                                className="rounded-lg border border-red-200 p-2 text-red-700 hover:bg-red-50 disabled:opacity-50"
                                aria-label={`Remove match ${match.matchNumber}`}
                                title="Remove match"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          <div className="mt-3 space-y-2">
                            {(["A", "B"] as const).map((slot) => {
                              const sourceValue = getCustomSlotSource(
                                match,
                                slot,
                              );

                              return (
                                <div
                                  key={slot}
                                  onDragOver={(event) => {
                                    event.preventDefault();
                                    event.dataTransfer.dropEffect = "move";
                                  }}
                                  onDrop={(event) => {
                                    event.preventDefault();
                                    const dropped =
                                      event.dataTransfer.getData("text/plain");
                                    setCustomSlotSource(
                                      match.key,
                                      slot,
                                      dropped,
                                    );
                                  }}
                                  className="rounded-lg border-2 border-dashed border-[#103f25]/20 bg-[#f7f8f2] p-2.5 transition hover:border-[#103f25]/50 hover:bg-[#f1eee5]"
                                >
                                  <label className="block text-xs font-black text-[#103f25]">
                                    Slot {slot}
                                    <select
                                      value={sourceValue}
                                      disabled={savingCustomDraft}
                                      onChange={(event) =>
                                        setCustomSlotSource(
                                          match.key,
                                          slot,
                                          event.target.value,
                                        )
                                      }
                                      className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm font-medium text-zinc-900 disabled:opacity-60"
                                    >
                                      <option value="">
                                        Choose entry or winner…
                                      </option>
                                      <optgroup label="Direct entries">
                                        {eligiblePoolEntries.map((entry) => {
                                          const names = (entry.players ?? [])
                                            .map(
                                              (player) =>
                                                player.nickname?.trim() ||
                                                `${player.firstName} ${player.lastName}`.trim(),
                                            )
                                            .filter(Boolean)
                                            .join(" / ");
                                          const name =
                                            entry.entryName?.trim() ||
                                            names ||
                                            `Entry #${entry.id}`;

                                          return (
                                            <option
                                              key={entry.id}
                                              value={`entry:${entry.id}`}
                                            >
                                              {entry.seed
                                                ? `Seed ${entry.seed} · `
                                                : ""}
                                              {name}
                                            </option>
                                          );
                                        })}
                                      </optgroup>
                                      <optgroup label="Winner of another match">
                                        {customDraftMatches
                                          .filter(
                                            (candidate) =>
                                              candidate.key !== match.key &&
                                              candidate.roundNumber <
                                                match.roundNumber,
                                          )
                                          .map((candidate) => (
                                            <option
                                              key={candidate.key}
                                              value={`winner:${candidate.key}`}
                                            >
                                              Winner · Match{" "}
                                              {candidate.matchNumber} (Round{" "}
                                              {candidate.roundNumber})
                                            </option>
                                          ))}
                                      </optgroup>
                                    </select>
                                  </label>
                                  <p className="mt-1 text-[11px] text-zinc-500">
                                    {sourceValue.startsWith("entry:")
                                      ? "Direct entry assigned"
                                      : sourceValue.startsWith("winner:")
                                        ? "Winner connection assigned"
                                        : "Drop an entry or an earlier match winner here"}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </article>
                      ))}
                  </div>

                  <div className="mt-4 flex flex-wrap justify-between gap-2">
                    <button
                      type="button"
                      disabled={savingCustomDraft}
                      onClick={addCustomMatch}
                      className="secondary-action inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold disabled:opacity-50"
                    >
                      <Plus className="h-4 w-4" />
                      Add match
                    </button>

                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        disabled={savingCustomDraft}
                        onClick={cancelCustomDraft}
                        className="secondary-action rounded-lg px-4 py-2.5 text-sm font-bold disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={
                          savingCustomDraft ||
                          publishingDraw ||
                          customDraftMatches.length < 1
                        }
                        onClick={() => void handleSaveCustomDraft()}
                        className="primary-action inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-black disabled:opacity-50"
                      >
                        {savingCustomDraft && (
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                        )}
                        {savingCustomDraft
                          ? "Saving custom draw…"
                          : "Save custom draw"}
                      </button>
                    </div>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-zinc-500">
                    Saving validates the complete graph on the server. If a slot
                    is empty, an entry is duplicated, or an advancement path is
                    invalid, the server will reject the draft and show the
                    error.
                  </p>
                </section>
              )}
              {divisionLoading ? (
                <div className="flex items-center justify-center gap-2 py-16 text-sm text-zinc-500">
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                  Loading draw...
                </div>
              ) : !draw ? (
                <div className="mt-5 rounded-xl border border-dashed border-zinc-300 px-5 py-12 text-center dark:border-zinc-700">
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-lime-300">
                    <GitBranch className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 font-black text-zinc-900 dark:text-white">
                    Your bracket starts here
                  </h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                    {eligiblePoolEntries.length < 2
                      ? `Register at least ${2 - eligiblePoolEntries.length} more eligible ${2 - eligiblePoolEntries.length === 1 ? "entry" : "entries"} to generate this draw.`
                      : `${eligiblePoolEntries.length} eligible entries are ready. Generate the draw when registration is complete.`}
                  </p>
                  {canManage && eligiblePoolEntries.length >= 2 && (
                    <button
                      type="button"
                      onClick={() => void handleGenerateDraw()}
                      disabled={generatingDraw}
                      className="primary-action mt-5 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-black disabled:opacity-50"
                    >
                      <Sparkles className="h-4 w-4" />
                      Generate bracket
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-zinc-50 px-3.5 py-3 dark:bg-zinc-800/70">
                    <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                      {hasStandardBracketShape && (
                        <span>
                          <strong className="text-zinc-900 dark:text-white">
                            {draw.drawSize}
                          </strong>{" "}
                          standard bracket capacity
                        </span>
                      )}

                      <span>
                        <strong className="text-zinc-900 dark:text-white">
                          {actualMatchCount}
                        </strong>{" "}
                        matches
                      </span>

                      <span>
                        <strong className="text-zinc-900 dark:text-white">
                          {summaryByeCount}
                        </strong>{" "}
                        first-round byes
                      </span>
                    </div>

                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-900">
                      {draw.status}
                    </span>
                  </div>
                  {editingDraft && draw.status === "DRAFT" && (
                    <section className="mt-4 rounded-xl border-2 border-[#103f25]/20 bg-white p-4 text-[#153323] sm:p-5">
                      <h3 className="font-black">Edit first-round matchups</h3>

                      <p className="mt-1 mb-4 text-sm text-zinc-600">
                        Place any eligible entry in any matchup. Seeds are
                        informational. Leave one slot empty for a BYE.
                      </p>

                      <div className="space-y-3">
                        {draftMatchups.map((matchup) => (
                          <div
                            key={matchup.matchNumber}
                            className="rounded-xl border border-zinc-200 p-3 sm:p-4"
                          >
                            <p className="mb-3 text-xs font-black uppercase tracking-wide text-zinc-500">
                              Match {matchup.matchNumber}
                            </p>

                            <div className="grid gap-3 sm:grid-cols-2">
                              {(["A", "B"] as const).map((slot) => {
                                const field =
                                  slot === "A" ? "entryAId" : "entryBId";

                                const selectedID = matchup[field];

                                const usedElsewhere = new Set<number>();

                                draftMatchups.forEach((other) => {
                                  if (
                                    !(
                                      other.matchNumber ===
                                        matchup.matchNumber && slot === "A"
                                    ) &&
                                    other.entryAId !== null
                                  )
                                    usedElsewhere.add(other.entryAId);

                                  if (
                                    !(
                                      other.matchNumber ===
                                        matchup.matchNumber && slot === "B"
                                    ) &&
                                    other.entryBId !== null
                                  )
                                    usedElsewhere.add(other.entryBId);
                                });

                                return (
                                  <label key={slot} className="block">
                                    <span className="mb-1.5 block text-xs font-bold text-zinc-600">
                                      Entry {slot}
                                    </span>

                                    <select
                                      value={
                                        selectedID === null
                                          ? ""
                                          : String(selectedID)
                                      }

                                      disabled={savingDraft}

                                      onChange={(event) => {
                                        const nextID =
                                          event.target.value === ""
                                            ? null
                                            : Number(event.target.value);

                                        setDraftMatchups((current) =>
                                          current.map((item) =>
                                            item.matchNumber ===
                                            matchup.matchNumber
                                              ? { ...item, [field]: nextID }
                                              : item,
                                          ),
                                        );
                                      }}

                                      className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm disabled:opacity-60"
                                    >
                                      <option value="">BYE / empty slot</option>

                                      {eligiblePoolEntries

                                        .filter(
                                          (entry) =>
                                            !usedElsewhere.has(entry.id) ||
                                            entry.id === selectedID,
                                        )

                                        .map((entry) => {
                                          const names = (entry.players ?? [])
                                            .map(
                                              (player) =>
                                                player.nickname?.trim() ||
                                                `${player.firstName} ${player.lastName}`.trim(),
                                            )
                                            .filter(Boolean)
                                            .join(" / ");

                                          const name =
                                            entry.entryName?.trim() ||
                                            names ||
                                            `Entry #${entry.id}`;

                                          return (
                                            <option
                                              key={entry.id}
                                              value={entry.id}
                                            >
                                              {entry.seed
                                                ? `Seed ${entry.seed} ? `
                                                : ""}
                                              {name}
                                            </option>
                                          );
                                        })}
                                    </select>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 flex flex-wrap justify-end gap-2">
                        <button
                          type="button"

                          disabled={savingDraft}

                          onClick={() => {
                            setEditingDraft(false);
                            setDraftMatchups([]);
                            clearMessages();
                          }}

                          className="secondary-action rounded-lg px-4 py-2.5 text-sm font-bold disabled:opacity-50"
                        >
                          Cancel
                        </button>

                        <button
                          type="button"

                          disabled={savingDraft || publishingDraw}

                          onClick={() => void handleSaveDraft()}

                          className="primary-action rounded-lg px-4 py-2.5 text-sm font-black disabled:opacity-50"
                        >
                          {savingDraft ? "Saving..." : "Save draft"}
                        </button>
                      </div>
                    </section>
                  )}
                  <p className="mb-2 text-xs text-zinc-500 sm:hidden">
                    Swipe horizontally to follow the bracket into later rounds.
                  </p>
                  <TournamentBracketTree
                    variant="screen"
                    draw={draw}
                    getRoundLabel={roundLabel}
                    displayEntry={displayEntry}
                    renderMatch={(match) => (
                      <div className="w-full min-w-0">
                        <TournamentMatchCard
                          match={match}
                          roundLabelText={roundLabel(
                            match.roundNumber,
                            draw.drawSize,
                          )}
                          canManage={
                            canManage &&
                            (draw.status === "PUBLISHED" ||
                              draw.status === "IN_PROGRESS")
                          }
                          onRecord={handleRecordResult}
                          onShareResult={(item) =>
                            openShare({
                              kind: "RESULT",
                              matchId: item.id,
                            })
                          }
                          saving={matchSavingId === match.id}
                        />

                        {winnerDestinationLabel(match) && (
                          <p className="mt-2 px-1 text-[10px] font-black uppercase tracking-wide text-[#55705e]">
                            {winnerDestinationLabel(match)}
                          </p>
                        )}
                      </div>
                    )}
                  />

                  {entryCount > 1 && (
                    <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                      <CircleHelp className="mt-0.5 h-4 w-4 shrink-0" />
                      {hasStandardBracketShape ? (
                        <>
                          A {entryCount}-entry standard bracket uses{" "}
                          {bracketSizeNeeded} slots. The remaining{" "}
                          {bracketSizeNeeded - entryCount} slot(s) are
                          first-round byes, allowing some players to advance
                          without playing.
                        </>
                      ) : (
                        <>
                          This custom draw contains {actualMatchCount} matches
                          and {summaryByeCount} first-round byes. Players placed
                          directly into later rounds advance without playing in
                          Round 1.
                        </>
                      )}{" "}
                      Total matches needed to decide a champion:{" "}
                      {entryCount - 1}.
                    </p>
                  )}

                  <p className="mt-2 text-xs leading-5 text-zinc-400 dark:text-zinc-500">
                    Scroll horizontally to move through rounds. Saving a result
                    advances the winner into the linked next-round slot.
                  </p>
                </>
              )}
            </section>

            {championReady && finalMatch?.winner && (
              <section className="relative overflow-hidden rounded-[26px] border-2 border-[#103f25] bg-[#103f25] p-5 text-[#fffdf5] shadow-[7px_7px_0_#dfff28] sm:p-7">
                <div className="pointer-events-none absolute -right-3 -top-3 rotate-12 opacity-90">
                  <MiniCourt width={60} height={78} />
                </div>

                <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#dfff28] text-[#103f25]">
                      <Trophy className="h-7 w-7" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#dfff28]">
                        Division champion
                      </p>
                      <h3 className="mt-1 break-words text-xl font-black sm:text-2xl">
                        {displayEntry(finalMatch.winner)}
                      </h3>
                      <p className="mt-1 text-sm text-[#f1eee5]">
                        {selectedDivision.name} ·{" "}
                        {finalMatch.score || "Walkover"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openShare({ kind: "CHAMPION" })}
                    className="primary-action inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black"
                  >
                    <Share2 className="h-4 w-4" />
                    Celebrate champion
                  </button>
                </div>
              </section>
            )}
          </div>
        </section>
      )}

      {shareTarget && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain bg-[#103f25]/80 p-2 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Tournament PNG Studio"
        >
          <div className="my-0 max-h-[calc(100dvh-1rem)] w-full max-w-2xl overflow-y-auto overscroll-contain animate-[fade-in_180ms_ease-out] rounded-[26px] border-2 border-[#103f25] bg-[#f1eee5] p-4 text-[#103f25] shadow-[8px_8px_0_#dfff28] sm:my-auto sm:max-h-[calc(100dvh-2rem)] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#55705e]">
                  RallyLedger · PNG Studio
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-tight">
                  Your moment, ready to share.
                </h2>
                <p className="mt-1 text-sm text-[#103f25]/70">
                  Preview the artwork, then share it or download the PNG.
                </p>
              </div>

              <button
                type="button"
                aria-label="Close PNG Studio"
                onClick={() => {
                  setShareTarget(null);
                  setShareMessage(null);
                }}
                className="rounded-lg border-2 border-[#103f25] p-2 hover:bg-[#dfff28]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_160px] sm:items-start">
              <div className="min-w-0">
                {renderPreview(shareTarget)}
                <p className="mt-3 text-xs font-semibold text-[#55705e]">
                  {shareTarget.kind === "BRACKET"
                    ? "FULL DRAW · CONTENT-SIZED LANDSCAPE"
                    : shareTarget.kind === "RESULT"
                      ? "MATCH ANNOUNCEMENT · 1080 × 1350"
                      : "CHAMPION POSTER · 1080 × 1350"}
                </p>
              </div>
            </div>

            {shareMessage && (
              <p
                role="status"
                className="mt-4 rounded-lg border border-[#103f25]/15 bg-[#fffdf5] p-3 text-sm font-semibold"
              >
                {shareMessage}
              </p>
            )}

            <div className="sticky bottom-0 mt-5 flex flex-wrap justify-end gap-2 border-t border-[#103f25]/15 bg-[#f1eee5] py-3">
              {" "}
              <button
                type="button"
                onClick={() => {
                  setShareTarget(null);
                  setShareMessage(null);
                }}
                className="secondary-action rounded-xl px-4 py-2.5 text-sm font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={exporting}
                onClick={() => void handleSharePng()}
                className="primary-action inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black disabled:opacity-50"
              >
                {exporting ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Share2 className="h-4 w-4" />
                )}
                {exporting ? "Preparing..." : "Share as PNG"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export artwork is isolated from the app theme so colors remain stable. */}
      {shareTarget && (
        <div
          className="pointer-events-none fixed -left-[12000px] top-0"
          aria-hidden="true"
        >
          {renderExportArtwork(shareTarget)}
        </div>
      )}
    </div>
  );
}

export default TournamentDetailPage;
