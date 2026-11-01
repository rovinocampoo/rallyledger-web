import type { Session } from "../../types/session";
import { formatDate, formatLabel } from "../../utils/format";
import type { getMatchBoardCounts } from "../../utils/matchBoard";

export type SessionOverviewStats = {
  participantCount: number | null;
  participantStatus: "loading" | "loaded" | "error";
  matchCount: number | null;
  matchCounts: ReturnType<typeof getMatchBoardCounts> | null;
  matchStatus: "loading" | "loaded" | "error";
};

export type SessionChargeOverviewState = {
  status: "loading" | "known" | "unknown";
  fullyCharged: boolean | null;
  message?: string;
};

export type SessionSection = "OVERVIEW" | "PLAYERS" | "MATCHES" | "RESULTS";

type SessionCardProps = {
  session: Session;
  canDelete: boolean;
  stats?: SessionOverviewStats;
  chargeState: SessionChargeOverviewState;
  activeSection: SessionSection;
  onEdit: (session: Session) => void;
  onDelete: (session: Session) => void;
  onManagePlayers: (session: Session) => void;
  onManageMatches: (session: Session) => void;
  onViewOverview: (session: Session) => void;
  onRetryStatistics: (session: Session) => void;
  onRetryChargeState: (session: Session) => void;
  onViewCharges: () => void;
  onManageTraining: (session: Session) => void;
  onManageOutsider: (session: Session) => void;
  onViewResults: (session: Session) => void;
  onGenerateCharges: (session: Session) => void;
  generatingCharges: boolean;
};

function SessionCard({
  session,
  canDelete,
  stats,
  chargeState,
  activeSection,
  onEdit,
  onDelete,
  onManagePlayers,
  onManageMatches,
  onViewOverview,
  onRetryStatistics,
  onRetryChargeState,
  onManageTraining,
  onManageOutsider,
  onViewResults,
  onViewCharges,
  onGenerateCharges,
  generatingCharges,
}: SessionCardProps) {
  const regularPlay = session.sessionType === "REGULAR_PLAY";
  const participantStatus = stats?.participantStatus ?? "loading";
  const matchStatus = stats?.matchStatus ?? "loading";
  const participantValue = participantStatus === "loading" && stats?.participantCount == null
    ? "Loading…"
    : participantStatus === "error" && stats?.participantCount == null
      ? "Unavailable"
      : stats?.participantCount ?? "—";
  const matchValue = matchStatus === "loading" && stats?.matchCount == null
    ? "Loading…"
    : matchStatus === "error" && stats?.matchCount == null
      ? "Unavailable"
      : stats?.matchCount ?? "—";
  const hasStatisticsError = participantStatus === "error" || matchStatus === "error";
  const canShowGenerateCharges = chargeState.status === "unknown" ||
    (chargeState.status === "known" && chargeState.fullyCharged === false);
  const navButton = (section: SessionSection, label: string, onClick: () => void) => (
    <button
      key={section}
      type="button"
      aria-current={activeSection === section ? "page" : undefined}
      onClick={onClick}
      className={`min-h-10 flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors sm:flex-none ${activeSection === section ? "bg-[#183E2A] text-white dark:bg-[#D8C86E] dark:text-[#14251B]" : "text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"}`}
    >
      {label}
    </button>
  );

  return (
    <article className="overflow-hidden rounded-xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-[#17221B]">
      <div className="p-3.5 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 text-left">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#F4F0D5] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#4B451F] dark:bg-[#3A3620] dark:text-[#E8DB87]">
                {formatLabel(session.sessionType)}
              </span>
              {session.freeBalls && <span className="text-xs text-stone-500">Free balls</span>}
              {session.freeLights && <span className="text-xs text-stone-500">Free lights</span>}
            </div>
            <h2 className="mt-1.5 break-words text-lg font-bold tracking-tight text-[#14251B] dark:text-white sm:text-xl">{session.name}</h2>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
              {formatDate(session.sessionDate)} <span aria-hidden="true">·</span> {session.startTime}–{session.endTime}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
            <button type="button" onClick={() => onEdit(session)} className="min-h-10 rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium hover:bg-stone-50 dark:border-stone-700 dark:hover:bg-stone-800">Edit</button>
            {canDelete && <button type="button" onClick={() => onDelete(session)} className="min-h-10 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-900/60 dark:text-red-300 dark:hover:bg-red-950/30">Delete</button>}
          </div>
        </div>

        {regularPlay && (
          <>
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg bg-stone-50 px-3 py-2.5 dark:bg-stone-900/70 sm:grid-cols-5 sm:gap-3">
              <div className="flex items-baseline justify-between gap-2 sm:block">
                <p className="text-[10px] font-medium text-stone-500 dark:text-stone-400">Players</p>
                <p className="text-sm font-bold tabular-nums">{participantValue}{stats?.participantCount != null && <span className="ml-1 text-[10px] font-medium text-stone-500">/ {session.maxPlayers ?? "∞"}</span>}</p>
              </div>
              <div className="flex items-baseline justify-between gap-2 sm:block">
                <p className="text-[10px] font-medium text-stone-500 dark:text-stone-400">Matches</p>
                <p className="text-sm font-bold tabular-nums">{matchValue}</p>
              </div>
              <div className="flex items-baseline justify-between gap-2 sm:block">
                <p className="text-[10px] font-medium text-emerald-800 dark:text-emerald-300">In progress</p>
                <p className="text-sm font-bold tabular-nums">{matchStatus === "loading" && stats?.matchCounts == null ? "Loading…" : matchStatus === "error" && stats?.matchCounts == null ? "Unavailable" : stats?.matchCounts?.IN_PROGRESS ?? "—"}</p>
              </div>
              <div className="flex items-baseline justify-between gap-2 sm:block">
                <p className="text-[10px] font-medium text-[#665E2D] dark:text-[#D8C86E]">Scheduled</p>
                <p className="text-sm font-bold tabular-nums">{matchStatus === "loading" && stats?.matchCounts == null ? "Loading…" : matchStatus === "error" && stats?.matchCounts == null ? "Unavailable" : stats?.matchCounts?.SCHEDULED ?? "—"}</p>
              </div>
              <div className="flex items-baseline justify-between gap-2 sm:block">
                <p className="text-[10px] font-medium text-stone-600 dark:text-stone-300">Completed</p>
                <p className="text-sm font-bold tabular-nums">{matchStatus === "loading" && stats?.matchCounts == null ? "Loading…" : matchStatus === "error" && stats?.matchCounts == null ? "Unavailable" : stats?.matchCounts?.COMPLETED ?? "—"}</p>
              </div>
            </div>
            {(participantStatus === "loading" && stats?.participantCount != null || matchStatus === "loading" && stats?.matchCount != null) && (
              <p role="status" className="mt-1.5 text-[10px] text-stone-500">Refreshing statistics…</p>
            )}
            {hasStatisticsError && (
              <div role="status" className="mt-1.5 flex flex-wrap items-center gap-x-2 text-[10px] text-amber-800 dark:text-amber-300">
                <span>Some statistics are unavailable or may be out of date.</span>
                <button type="button" onClick={() => onRetryStatistics(session)} className="font-semibold underline underline-offset-2">Retry</button>
              </div>
            )}
            <nav aria-label={`${session.name} sections`} className="mt-3 flex flex-wrap gap-1 rounded-lg bg-stone-50 p-1 dark:bg-stone-900/70">
              {navButton("OVERVIEW", "Overview", () => onViewOverview(session))}
              {navButton("PLAYERS", "Players", () => onManagePlayers(session))}
              {navButton("MATCHES", "Matches", () => onManageMatches(session))}
              {navButton("RESULTS", "Results", () => onViewResults(session))}
            </nav>
          </>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          {!regularPlay && session.sessionType === "TRAINING" && <button type="button" onClick={() => onManageTraining(session)} className="min-h-10 rounded-lg border border-stone-300 px-3 py-2 text-sm dark:border-stone-700">Manage Training</button>}
          {!regularPlay && session.sessionType === "OUTSIDER_PLAY" && <button type="button" onClick={() => onManageOutsider(session)} className="min-h-10 rounded-lg border border-stone-300 px-3 py-2 text-sm dark:border-stone-700">Manage Activity</button>}
          {!regularPlay && session.sessionType === "EVENT" && <button type="button" onClick={() => onManagePlayers(session)} className="min-h-10 rounded-lg border border-stone-300 px-3 py-2 text-sm dark:border-stone-700">Manage Event</button>}
          <button type="button" onClick={onViewCharges} className="min-h-10 rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium hover:bg-stone-50 dark:border-stone-700 dark:hover:bg-stone-800">Charges</button>
          {regularPlay && canShowGenerateCharges && <button type="button" onClick={() => onGenerateCharges(session)} disabled={generatingCharges || chargeState.status === "loading"} className="primary-action min-h-10 rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-50">{generatingCharges ? "Checking matches…" : "Generate charges"}</button>}
        </div>
        {regularPlay && chargeState.status === "loading" && (
          <p role="status" className="mt-2 text-xs text-stone-500">Checking session charge status…</p>
        )}
        {regularPlay && chargeState.status === "unknown" && (
          <div role="status" className="mt-2 flex flex-wrap items-center gap-x-2 text-xs text-amber-800 dark:text-amber-300">
            <span>{chargeState.message ?? "Session charge status is unavailable. Verify it before relying on charge summaries."}</span>
            <button type="button" onClick={() => onRetryChargeState(session)} className="font-semibold underline underline-offset-2">Retry</button>
          </div>
        )}
      </div>
    </article>
  );
}

export default SessionCard;
