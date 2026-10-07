import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import {
  getPlayerMe,
  getPlayerOrganizations,
  type PlayerMe,
  type PlayerOrganization,
} from "../api/playerauth";
import { neonAuth } from "../auth/neon";
import { Pencil } from "lucide-react";
import {
  deletePlayerProfilePicture,
  getPlayerLedger,
  getPlayerMatches,
  getPlayerPairs,
  getPlayerRecord,
  getPlayerSessions,
  getPlayerUpcomingRegularPlay,
  uploadPlayerProfilePicture,
  type PlayerMatch,
} from "../api/player";
import type { PairRecord, PlayerRecord } from "../types/record";
import type { ParticipantLedger } from "../types/ledger";
import type { Session } from "../types/session";
import { formatLabel, formatMatchTimeRange } from "../utils/format";
import PlayerPortalLoading from "../components/PlayerPortalLoading";

type PortalSection =
  "overview" | "sessions" | "records" | "pairs" | "ledger" | "profile";

const NAV_ITEMS: Array<{
  id: PortalSection;
  label: string;
}> = [
  { id: "overview", label: "Overview" },
  { id: "sessions", label: "Sessions" },
  { id: "records", label: "Records" },
  { id: "pairs", label: "Pairs" },
  { id: "ledger", label: "Ledger" },
  { id: "profile", label: "Profile" },
];

function formatMatchResult(result: string | null | undefined) {
  switch (result) {
    case "TEAM_A_WIN":
    case "WALKOVER_A":
      return "Team A won";
    case "TEAM_B_WIN":
    case "WALKOVER_B":
      return "Team B won";
    case "DRAW":
      return "Draw";
    case "ABANDONED":
      return "Abandoned";
    default:
      return "Pending";
  }
}

function getPlayerMatchResult(
  currentPlayerId: number,
  currentMatch: PlayerMatch,
) {
  if (!currentMatch.match.result) {
    return "Pending";
  }

  const player = currentMatch.participants.find(
    (participant) => participant.participantId === currentPlayerId,
  );

  if (!player) {
    return formatMatchResult(currentMatch.match.result);
  }

  if (currentMatch.match.result === "DRAW") {
    return "Draw";
  }

  const playerWon =
    (player.teamSide === "A" &&
      ["TEAM_A_WIN", "WALKOVER_A"].includes(currentMatch.match.result)) ||
    (player.teamSide === "B" &&
      ["TEAM_B_WIN", "WALKOVER_B"].includes(currentMatch.match.result));

  return playerWon ? "Win" : "Loss";
}

function getPlayerTeammates(
  currentPlayerId: number,
  currentMatch: PlayerMatch,
) {
  const player = currentMatch.participants.find(
    (participant) => participant.participantId === currentPlayerId,
  );

  if (!player) {
    return [];
  }

  return currentMatch.participants.filter(
    (participant) =>
      participant.teamSide === player.teamSide &&
      participant.participantId !== currentPlayerId,
  );
}

function getPlayerOpponents(
  currentPlayerId: number,
  currentMatch: PlayerMatch,
) {
  const player = currentMatch.participants.find(
    (participant) => participant.participantId === currentPlayerId,
  );

  if (!player) {
    return [];
  }

  return currentMatch.participants.filter(
    (participant) =>
      participant.teamSide !== player.teamSide &&
      participant.participantId !== currentPlayerId,
  );
}

function formatParticipantName(participant: {
  nickname: string;
  participantId: number;
}) {
  return participant.nickname || `Player #${participant.participantId}`;
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(amount);
}
function formatLedgerDate(date: string) {
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

type PlayerPortalPageProps = {
  theme: "light" | "dark";
  onThemeToggle: () => void;
};

export default function PlayerPortalPage({
  theme,
  onThemeToggle,
}: PlayerPortalPageProps) {
  const [organizations, setOrganizations] = useState<PlayerOrganization[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<
    number | null
  >(null);
  const [player, setPlayer] = useState<PlayerMe | null>(null);
  const [section, setSection] = useState<PortalSection>("overview");
  const [loadingOrganizations, setLoadingOrganizations] = useState(true);
  const [loadingPlayer, setLoadingPlayer] = useState(false);
  const [loadingStep, setLoadingStep] = useState(
    "Connecting to your player account...",
  );
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [upcomingRegularPlay, setUpcomingRegularPlay] = useState<Session[]>([]);
  const [matches, setMatches] = useState<PlayerMatch[]>([]);
  const [playerRecord, setPlayerRecord] = useState<PlayerRecord | null>(null);
  const [pairs, setPairs] = useState<PairRecord[]>([]);
  const [ledger, setLedger] = useState<ParticipantLedger | null>(null);
  const [loadingPortalData, setLoadingPortalData] = useState(false);
  const [expandedChargeDate, setExpandedChargeDate] = useState<string | null>(
    null,
  );
  const profilePictureInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedProfilePicture, setSelectedProfilePicture] =
    useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<
    string | null
  >(null);
  const [savingProfilePicture, setSavingProfilePicture] = useState(false);
  const [profilePictureError, setProfilePictureError] = useState<string | null>(
    null,
  );

  useEffect(() => {
    async function loadOrganizations() {
      try {
        setError(null);
        setLoadingOrganizations(true);
        setLoadingStep("Connecting to your player account...");

        // Keep this explicit for Neon Auth client/session initialization.
        await neonAuth.getSession();

        setLoadingStep("Finding your organizations...");

        const result = await getPlayerOrganizations();

        setOrganizations(result);

        if (result.length === 0) {
          setError("Your player account is not linked to an organization.");
          return;
        }

        setSelectedOrganizationId(result[0].organizationId);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load player organizations.",
        );
      } finally {
        setLoadingOrganizations(false);
      }
    }

    void loadOrganizations();
  }, []);

  useEffect(() => {
    if (selectedOrganizationId === null) {
      return;
    }

    const organizationId = selectedOrganizationId;

    async function loadPlayer() {
      try {
        setError(null);
        setLoadingPlayer(true);
        setLoadingPortalData(true);

        setLoadingStep("Loading your player profile...");
        const playerData = await getPlayerMe(organizationId);
        setPlayer(playerData);

        setLoadingStep("Loading your sessions...");
        const sessionData = await getPlayerSessions(organizationId);

        setLoadingStep("Loading your match history...");
        const matchData = await getPlayerMatches(organizationId);

        setLoadingStep("Preparing your player record...");
        const recordData = await getPlayerRecord(organizationId);

        setLoadingStep("Loading your doubles partners...");
        const pairData = await getPlayerPairs(organizationId);

        setLoadingStep("Loading your account ledger...");
        const ledgerData = await getPlayerLedger(organizationId);

        setLoadingStep("Checking upcoming regular play...");
        const upcomingRegularPlayData =
          await getPlayerUpcomingRegularPlay(organizationId);

        setSessions(sessionData);
        setUpcomingRegularPlay(upcomingRegularPlayData);
        setMatches(matchData);
        setPlayerRecord(recordData);
        setPairs(pairData);
        setLedger(ledgerData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load player profile.",
        );
        setPlayer(null);
      } finally {
        setLoadingPlayer(false);
        setLoadingPortalData(false);
      }
    }

    void loadPlayer();
  }, [selectedOrganizationId]);

  async function handleSignOut() {
    await neonAuth.signOut();
    window.location.href = "/player/sign-in";
  }

  if (loadingOrganizations || !player) {
    if (error) {
      return (
        <main className="min-h-screen bg-[#f1eee5] px-5 py-6 text-[#103f25] dark:bg-zinc-950 dark:text-white sm:px-8">
          <div className="mx-auto flex min-h-[80vh] max-w-6xl items-center justify-center">
            <div className="w-full max-w-xl rounded-2xl border-2 border-red-900/20 bg-red-50 p-5 text-sm font-bold text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
              {error}
            </div>
          </div>
        </main>
      );
    }

    return <PlayerPortalLoading message={loadingStep} />;
  }

  const selectedOrganization = organizations.find(
    (organization) => organization.organizationId === selectedOrganizationId,
  );

  const fullName = `${player.firstName} ${player.lastName}`.trim();

  const initials =
    `${player.firstName.charAt(0)}${player.lastName.charAt(0)}`.toUpperCase();

  const chargesByType =
    ledger?.charges.reduce<Record<string, number>>((totals, charge) => {
      totals[charge.feeType] = (totals[charge.feeType] ?? 0) + charge.amount;
      return totals;
    }, {}) ?? {};

  const chargesByDate =
    ledger?.charges.reduce<Record<string, number>>((totals, charge) => {
      totals[charge.chargeDate] =
        (totals[charge.chargeDate] ?? 0) + charge.amount;
      return totals;
    }, {}) ?? {};

  function handleProfilePictureSelected(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setProfilePictureError(null);

    const allowedTypes = new Set(["image/png", "image/jpeg", "image/webp"]);

    if (!allowedTypes.has(file.type)) {
      setProfilePictureError("Photo must be PNG, JPEG, or WebP.");
      event.target.value = "";
      return;
    }

    if (file.size > 1 * 1024 * 1024) {
      setProfilePictureError("Photo must be 1 MB or smaller.");
      event.target.value = "";
      return;
    }

    if (profilePicturePreview) {
      URL.revokeObjectURL(profilePicturePreview);
    }

    const previewUrl = URL.createObjectURL(file);

    setSelectedProfilePicture(file);
    setProfilePicturePreview(previewUrl);
  }

  async function handleSaveProfilePicture() {
    if (!selectedProfilePicture || !selectedOrganizationId) {
      return;
    }

    try {
      setSavingProfilePicture(true);
      setProfilePictureError(null);

      await uploadPlayerProfilePicture(
        selectedOrganizationId,
        selectedProfilePicture,
      );

      const refreshedPlayer = await getPlayerMe(selectedOrganizationId);
      setPlayer(refreshedPlayer);

      if (profilePicturePreview) {
        URL.revokeObjectURL(profilePicturePreview);
      }

      setSelectedProfilePicture(null);
      setProfilePicturePreview(null);

      if (profilePictureInputRef.current) {
        profilePictureInputRef.current.value = "";
      }
    } catch (err) {
      console.error(err);

      setProfilePictureError(
        err instanceof Error ? err.message : "Failed to update profile photo.",
      );
    } finally {
      setSavingProfilePicture(false);
    }
  }

  function handleCancelProfilePicture() {
    if (profilePicturePreview) {
      URL.revokeObjectURL(profilePicturePreview);
    }

    setSelectedProfilePicture(null);
    setProfilePicturePreview(null);
    setProfilePictureError(null);

    if (profilePictureInputRef.current) {
      profilePictureInputRef.current.value = "";
    }
  }
  async function handleRemoveProfilePicture() {
    if (!selectedOrganizationId || !player?.profilePictureUrl) {
      return;
    }

    const confirmed = window.confirm("Remove your profile photo?");

    if (!confirmed) {
      return;
    }

    try {
      setSavingProfilePicture(true);
      setProfilePictureError(null);

      await deletePlayerProfilePicture(selectedOrganizationId);

      const refreshedPlayer = await getPlayerMe(selectedOrganizationId);
      setPlayer(refreshedPlayer);
    } catch (err) {
      console.error(err);

      setProfilePictureError(
        err instanceof Error ? err.message : "Failed to remove profile photo.",
      );
    } finally {
      setSavingProfilePicture(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f1eee5] text-[#103f25] dark:bg-zinc-950 dark:text-white">
      {/* Top shell */}
      <header className="border-b-2 border-[#103f25]/10 bg-[#fffdf5]/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="flex min-h-20 items-center justify-between gap-4">
            <Link
              to="/"
              className="group flex min-w-0 items-center gap-3 rounded-xl outline-none"
              aria-label="RallyLedger home"
            >
              <div className="min-w-0">
                <img
                  src="/branding/login-light-horizontal.png"
                  alt="RallyLedger"
                  className="h-5 w-auto dark:hidden"
                />

                <img
                  src="/branding/login-dark-horizontal.png"
                  alt="RallyLedger"
                  className="hidden h-5 w-auto dark:block"
                />
              </div>
            </Link>
            <div className="flex items-center gap-3">
              {organizations.length > 1 && (
                <label className="hidden sm:block">
                  <span className="sr-only">Organization</span>

                  <select
                    value={selectedOrganizationId ?? ""}
                    onChange={(event) =>
                      setSelectedOrganizationId(Number(event.target.value))
                    }
                    className="max-w-[220px] rounded-xl border-2 border-[#103f25] bg-[#fffdf5] px-3 py-2 text-sm font-black outline-none dark:border-zinc-700 dark:bg-[#0b2417]"
                  >
                    {organizations.map((organization) => (
                      <option
                        key={organization.organizationId}
                        value={organization.organizationId}
                      >
                        {organization.organizationName}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <button
                type="button"
                onClick={onThemeToggle}
                aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                className="rounded-xl border-2 border-[#103f25] px-3 py-2 text-xs font-black transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-[#dfff28] dark:border-zinc-300 dark:hover:bg-zinc-100 dark:hover:text-zinc-950 sm:text-sm"
              >
                {theme === "dark" ? "☀ Light" : "☾ Dark"}
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-xl border-2 border-[#103f25] px-3 py-2 text-xs font-black transition hover:bg-[#103f25] hover:text-white dark:border-zinc-300 dark:hover:bg-zinc-100 dark:hover:text-zinc-950 sm:px-4 sm:text-sm"
              >
                Sign out
              </button>
            </div>
          </div>

          {/* Mobile organization selector */}
          {organizations.length > 1 && (
            <div className="pb-4 sm:hidden">
              <label
                htmlFor="player-organization"
                className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-[#103f25]/45 dark:text-zinc-500"
              >
                Organization
              </label>

              <select
                id="player-organization"
                value={selectedOrganizationId ?? ""}
                onChange={(event) =>
                  setSelectedOrganizationId(Number(event.target.value))
                }
                className="w-full rounded-xl border-2 border-[#103f25] bg-[#fffdf5] px-3 py-2.5 text-sm font-black outline-none dark:border-zinc-700 dark:bg-[#0b2417]"
              >
                {organizations.map((organization) => (
                  <option
                    key={organization.organizationId}
                    value={organization.organizationId}
                  >
                    {organization.organizationName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Portal navigation */}
          <nav className="-mb-[2px] flex gap-1 overflow-x-auto">
            {NAV_ITEMS.map((item) => {
              const active = section === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSection(item.id)}
                  className={`shrink-0 border-b-2 px-3 py-3 text-xs font-black transition sm:px-4 sm:text-sm ${
                    active
                      ? "border-[#103f25] text-[#103f25] dark:border-white dark:text-white"
                      : "border-transparent text-[#103f25]/45 hover:text-[#103f25] dark:text-zinc-500 dark:hover:text-zinc-200"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main content */}
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
        {section === "overview" && (
          <>
            <section className="rounded-[22px] border-2 border-[#103f25] bg-[#fffdf5]/60 p-5 transition hover:-translate-y-1 hover:shadow-[8px_8px_0_#dfff28] dark:border-zinc-700 dark:bg-[#0b2417]/70">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-4">
                    <div className="relative shrink-0">
                      {player.profilePictureUrl ? (
                        <img
                          src={player.profilePictureUrl}
                          alt={fullName}
                          className="h-24 w-24 rounded-2xl border-2 border-[#103f25] object-cover dark:border-zinc-700"
                        />
                      ) : (
                        <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-[#103f25] text-2xl font-black text-white dark:bg-white dark:text-zinc-950">
                          {initials}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => setSection("profile")}
                        className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#103f25] bg-[#fffdf5] text-[#103f25] shadow-sm transition hover:bg-[#dfff28] dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
                        aria-label="Edit profile"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div>
                      <h2 className="text-2xl font-black">{fullName}</h2>

                      {player.nickname && (
                        <p className="mt-1 text-sm font-bold text-[#103f25]/55 dark:text-zinc-400">
                          “{player.nickname}”
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border-2 border-[#103f25]/15 px-4 py-3 dark:border-zinc-700">
                  <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#103f25]/45 dark:text-zinc-500">
                    Membership
                  </div>
                  <div className="mt-1 text-sm font-black">
                    {player.membershipStatus}
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-8 grid gap-4 sm:grid-cols-3">
              <DashboardCard
                label="Sessions"
                value={String(sessions.length)}
                description="Sessions you've joined"
                onClick={() => setSection("sessions")}
              />

              <DashboardCard
                label="Matches"
                value={String(matches.length)}
                description="Matches you've played"
                onClick={() => setSection("records")}
              />

              <DashboardCard
                label="Balance"
                value={ledger ? formatMoney(ledger.balance) : "—"}
                description={
                  ledger
                    ? ledger.balance > 0
                      ? "Outstanding balance"
                      : ledger.balance < 0
                        ? "Account credit"
                        : "Settled account"
                    : "Your player ledger"
                }
                onClick={() => setSection("ledger")}
              />
            </section>

            <section className="mt-8 grid gap-4 lg:grid-cols-2">
              <div className="rounded-[22px] border-2 border-[#103f25] bg-[#fffdf5]/70 p-5 shadow-[6px_6px_0_#dfff28] dark:border-[#dfff28]/25 dark:bg-[#103f25] dark:shadow-[6px_6px_0_#07170e]">
                <SectionHeading
                  title="Upcoming"
                  description="Your next sessions"
                />

                {/* Your registered upcoming sessions */}
                {sessions.filter(
                  (session) =>
                    session.sessionDate >=
                    new Date().toISOString().slice(0, 10),
                ).length === 0 ? (
                  <p className="mt-5 text-sm font-semibold text-[#103f25]/50 dark:text-[#f1eee5]/50">
                    No upcoming sessions.
                  </p>
                ) : (
                  <div className="mt-5 space-y-3">
                    {sessions
                      .filter(
                        (session) =>
                          session.sessionDate >=
                          new Date().toISOString().slice(0, 10),
                      )
                      .slice(0, 3)
                      .map((session) => (
                        <button
                          key={session.id}
                          type="button"
                          onClick={() => setSection("sessions")}
                          className="w-full rounded-[18px] border-2 border-[#103f25]/10 bg-[#fffdf5]/70 p-4 text-left transition hover:-translate-y-0.5 hover:border-[#103f25] dark:border-[#f1eee5]/15 dark:bg-[#0b2417] dark:hover:border-[#dfff28]/50"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="text-base font-extrabold">
                                {session.name}
                              </div>

                              <div className="mt-1 text-sm font-semibold text-[#103f25]/50 dark:text-[#f1eee5]/55">
                                {session.sessionDate} · {session.startTime}–
                                {session.endTime}
                              </div>
                            </div>

                            <span className="rounded-full bg-[#103f25]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider dark:bg-[#f1eee5]/10">
                              {formatLabel(session.sessionType)}
                            </span>
                          </div>
                        </button>
                      ))}
                  </div>
                )}

                {/* Club-wide Regular Play */}
                <div className="mt-7 border-t-2 border-[#103f25]/10 pt-6 dark:border-[#f1eee5]/10">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <div className="text-sm font-extrabold">
                        Upcoming Regular Play
                      </div>

                      <div className="mt-1 text-xs font-semibold text-[#103f25]/50 dark:text-[#f1eee5]/50">
                        Open club sessions coming up
                      </div>
                    </div>

                    <span className="rounded-full border-2 border-[#103f25] bg-[#dfff28] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-[#103f25]">
                      Club
                    </span>
                  </div>

                  {upcomingRegularPlay.length === 0 ? (
                    <p className="mt-4 text-sm font-semibold text-[#103f25]/50 dark:text-[#f1eee5]/50">
                      No Regular Play sessions scheduled.
                    </p>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {upcomingRegularPlay.slice(0, 3).map((session) => (
                        <button
                          key={session.id}
                          type="button"
                          onClick={() => setSection("sessions")}
                          className="w-full rounded-[18px] border-2 border-[#103f25]/10 bg-[#fffdf5]/70 p-4 text-left transition hover:-translate-y-0.5 hover:border-[#103f25] hover:shadow-[4px_4px_0_#dfff28] dark:border-[#f1eee5]/15 dark:bg-[#0b2417] dark:hover:border-[#dfff28]/50"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="text-base font-extrabold">
                                {session.name}
                              </div>

                              <div className="mt-1 text-sm font-semibold text-[#103f25]/50 dark:text-[#f1eee5]/55">
                                {session.sessionDate} · {session.startTime}–
                                {session.endTime}
                              </div>
                            </div>

                            <span className="shrink-0 rounded-full border-2 border-[#103f25] bg-[#dfff28] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-[#103f25]">
                              Regular Play
                            </span>
                          </div>

                          {session.description && (
                            <p className="mt-3 line-clamp-2 text-xs font-semibold leading-5 text-[#103f25]/55 dark:text-[#f1eee5]/50">
                              {session.description}
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border-2 border-[#103f25] bg-[#fffdf5] p-5 shadow-[5px_5px_0_#dfff28] dark:border-zinc-800 dark:bg-[#0b2417] dark:shadow-[5px_5px_0_#27272a]">
                <SectionHeading
                  title="Recent Activity"
                  description="Your latest matches and account activity"
                />

                {matches.length === 0 ? (
                  <p className="mt-5 text-sm font-bold text-[#103f25]/50 dark:text-zinc-500">
                    No recent matches yet.
                  </p>
                ) : (
                  <div className="mt-5 space-y-3">
                    {matches.slice(0, 3).map((item) => {
                      const result = getPlayerMatchResult(player.id, item);

                      return (
                        <button
                          key={item.match.id}
                          type="button"
                          onClick={() => setSection("records")}
                          className="w-full rounded-xl border-2 border-[#103f25]/10 p-4 text-left transition hover:border-[#103f25]/30 dark:border-zinc-800 dark:hover:border-zinc-600"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <div className="font-black">
                                {formatLabel(item.match.matchType)}
                              </div>
                              <div className="mt-1 text-sm font-bold text-[#103f25]/50 dark:text-zinc-500">
                                {formatMatchTimeRange(
                                  item.match.createdAt,
                                  item.match.updatedAt,
                                )}
                              </div>
                            </div>

                            <div
                              className={`text-right text-sm font-black ${
                                result === "Win"
                                  ? "text-green-600 dark:text-green-400"
                                  : result === "Loss"
                                    ? "text-red-600 dark:text-red-400"
                                    : result === "Draw"
                                      ? "text-yellow-600 dark:text-yellow-400"
                                      : "text-[#103f25]/60 dark:text-zinc-400"
                              }`}
                            >
                              {result}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {section === "sessions" && (
          <section>
            <SectionHeading
              title="Sessions"
              description="Sessions you've been part of"
            />

            {sessions.length === 0 ? (
              <EmptyState
                title="No sessions yet"
                description="Sessions where you are registered will appear here."
              />
            ) : (
              <div className="mt-6 space-y-4">
                {sessions.map((session) => (
                  <article
                    key={session.id}
                    className="rounded-2xl border-2 border-[#103f25] bg-[#fffdf5] p-5 shadow-[5px_5px_0_#dfff28] dark:border-zinc-800 dark:bg-[#0b2417] dark:shadow-[5px_5px_0_#27272a]"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h2 className="text-lg font-extrabold">
                          {session.name}
                        </h2>
                        <p className="mt-1 text-sm font-bold text-[#103f25]/50 dark:text-zinc-500">
                          {session.sessionDate} · {session.startTime}–
                          {session.endTime}
                        </p>
                        <p className="mt-2 text-sm font-bold">
                          {formatLabel(session.sessionType)}
                        </p>
                      </div>

                      <span className="rounded-full border-2 border-[#103f25]/15 px-3 py-1 text-xs font-black dark:border-zinc-700">
                        Registered
                      </span>
                    </div>

                    {session.description && (
                      <p className="mt-4 text-sm leading-6 text-[#103f25]/65 dark:text-zinc-400">
                        {session.description}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {section === "records" && (
          <section>
            <SectionHeading
              title="Records"
              description="Your tennis record and completed matches"
            />

            {!playerRecord ? (
              <EmptyState
                title="No record available"
                description="Your player record will appear once match data is available."
              />
            ) : (
              <>
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <StatCard
                    label="Overall"
                    value={`${playerRecord.overallWins}-${playerRecord.overallLosses}-${playerRecord.overallDraws}`}
                    description={`${playerRecord.overallMatches} matches`}
                  />

                  <StatCard
                    label="Singles"
                    value={`${playerRecord.singlesWins}-${playerRecord.singlesLosses}-${playerRecord.singlesDraws}`}
                    description={`${playerRecord.singlesMatches} matches`}
                  />

                  <StatCard
                    label="Doubles"
                    value={`${playerRecord.doublesWins}-${playerRecord.doublesLosses}-${playerRecord.doublesDraws}`}
                    description={`${playerRecord.doublesMatches} matches`}
                  />
                </div>
              </>
            )}
            <div className="mb-4 mt-8">
              <h3 className="text-xl font-extrabold tracking-[-0.03em]">
                Completed matches
              </h3>
            </div>

            {matches.length === 0 ? (
              <EmptyState
                title="No matches yet"
                description="Your matches will appear here once you are assigned to one."
              />
            ) : (
              <div className="mt-6 space-y-4">
                {matches.map((item) => {
                  const teammates = getPlayerTeammates(player.id, item);
                  const opponents = getPlayerOpponents(player.id, item);
                  const result = getPlayerMatchResult(player.id, item);

                  return (
                    <article
                      key={item.match.id}
                      className="rounded-2xl border-2 border-[#103f25] bg-[#fffdf5] p-5 shadow-[5px_5px_0_#dfff28] dark:border-zinc-800 dark:bg-[#0b2417] dark:shadow-[5px_5px_0_#27272a]"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="text-xs font-bold uppercase tracking-[0.12em] text-[#103f25]/45 dark:text-zinc-500">
                            {formatMatchTimeRange(
                              item.match.createdAt,
                              item.match.updatedAt,
                            )}
                          </div>

                          <h2 className="mt-1 text-lg font-extrabold">
                            {formatLabel(item.match.matchType)}
                          </h2>
                        </div>

                        <div className="rounded-xl border-2 border-[#103f25]/15 px-3 py-2 text-right dark:border-zinc-700">
                          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#103f25]/45 dark:text-zinc-500">
                            Result
                          </div>
                          <div
                            className={`text-right text-sm font-black ${
                              result === "Win"
                                ? "text-green-600 dark:text-green-400"
                                : result === "Loss"
                                  ? "text-red-600 dark:text-red-400"
                                  : result === "Draw"
                                    ? "text-yellow-600 dark:text-yellow-400"
                                    : "text-[#103f25]/60 dark:text-zinc-400"
                            }`}
                          >
                            {result}
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border-2 border-[#103f25]/10 p-4 dark:border-zinc-800">
                          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#103f25]/45 dark:text-zinc-500">
                            Partner
                          </div>
                          <div className="mt-2 text-sm font-black">
                            {teammates.length > 0
                              ? teammates.map(formatParticipantName).join(" / ")
                              : "Singles"}
                          </div>
                        </div>

                        <div className="rounded-xl border-2 border-[#103f25]/10 p-4 dark:border-zinc-800">
                          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#103f25]/45 dark:text-zinc-500">
                            Opponents
                          </div>
                          <div className="mt-2 text-sm font-black">
                            {opponents.length > 0
                              ? opponents.map(formatParticipantName).join(" / ")
                              : "—"}
                          </div>
                        </div>
                      </div>

                      {item.sets.length > 0 && (
                        <div className="mt-4 rounded-xl border-2 border-[#103f25]/10 p-4 dark:border-zinc-800">
                          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#103f25]/45 dark:text-zinc-500">
                            Score
                          </div>

                          <div className="mt-2 flex flex-wrap gap-2">
                            {item.sets
                              .slice()
                              .sort((a, b) => a.setNumber - b.setNumber)
                              .map((set) => (
                                <span
                                  key={set.setNumber}
                                  className="rounded-lg border-2 border-[#103f25]/10 px-3 py-1 text-sm font-black dark:border-zinc-700"
                                >
                                  {set.teamAScore}–{set.teamBScore}
                                </span>
                              ))}
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {section === "pairs" && (
          <section>
            <SectionHeading
              title="Pairs"
              description="Your doubles and mixed-doubles partners"
            />

            {pairs.length === 0 ? (
              <EmptyState
                title="No pairs yet"
                description="Partners you've played with will appear here."
              />
            ) : (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {pairs.map((pair) => {
                  const partnerName =
                    pair.participantOneId === player.id
                      ? pair.participantTwoName
                      : pair.participantOneName;

                  return (
                    <article
                      key={`${pair.participantOneId}-${pair.participantTwoId}`}
                      className="rounded-2xl border-2 border-[#103f25] bg-[#fffdf5] p-5 shadow-[5px_5px_0_#dfff28] dark:border-zinc-800 dark:bg-[#0b2417] dark:shadow-[5px_5px_0_#27272a]"
                    >
                      <div className="text-xs font-bold uppercase tracking-[0.12em] text-[#103f25]/45 dark:text-zinc-500">
                        Partner
                      </div>

                      <h2 className="mt-1 text-lg font-extrabold">
                        {partnerName}
                      </h2>

                      <div className="mt-5 grid grid-cols-3 gap-2">
                        <StatCard
                          label="Matches"
                          value={String(pair.matchesPlayed)}
                          compact
                        />
                        <StatCard
                          label="Wins"
                          value={String(pair.wins)}
                          compact
                        />
                        <StatCard
                          label="Losses"
                          value={String(pair.losses)}
                          compact
                        />
                      </div>

                      <div className="mt-4 text-sm font-bold text-[#103f25]/55 dark:text-zinc-400">
                        Draws: {pair.draws}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {section === "ledger" && (
          <section>
            <SectionHeading
              title="Ledger"
              description="Your charges, payments, and account balance"
            />

            {!ledger ? (
              <EmptyState
                title="Ledger unavailable"
                description="Your player ledger could not be loaded."
              />
            ) : (
              <>
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <StatCard
                    label="Charges"
                    value={formatMoney(ledger.totalCharges)}
                    description={`${ledger.charges.length} recorded`}
                  />

                  <StatCard
                    label="Payments"
                    value={formatMoney(ledger.totalPayments)}
                    description={`${ledger.payments.length} recorded`}
                  />

                  <StatCard
                    label={ledger.balance > 0 ? "Outstanding" : "Balance"}
                    value={formatMoney(ledger.balance)}
                    description={
                      ledger.balance > 0
                        ? "Amount due"
                        : ledger.balance < 0
                          ? "Account credit"
                          : "Settled account"
                    }
                  />
                </div>

                <div className="mt-8 grid gap-5 lg:grid-cols-2">
                  {/* Charges by Type */}
                  <div className="rounded-[22px] border-2 border-[#103f25] bg-[#fffdf5]/60 p-5 transition hover:-translate-y-1 hover:shadow-[8px_8px_0_#dfff28] dark:border-zinc-700 dark:bg-[#0b2417]/70">
                    <SectionHeading
                      title="Charges by Type"
                      description="Where your charges came from"
                    />

                    {Object.keys(chargesByType).length === 0 ? (
                      <p className="mt-5 text-sm font-bold text-[#103f25]/50 dark:text-zinc-500">
                        No charges recorded.
                      </p>
                    ) : (
                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        {Object.entries(chargesByType)
                          .sort(([, amountA], [, amountB]) => amountB - amountA)
                          .map(([feeType, amount]) => (
                            <div
                              key={feeType}
                              className="rounded-2xl border-2 border-[#103f25]/10 bg-[#fffdf5]/70 p-4 dark:border-zinc-800 dark:bg-[#0b2417]"
                            >
                              <div className="text-xs font-bold uppercase tracking-[0.1em] text-[#103f25]/45 dark:text-zinc-500">
                                {formatLabel(feeType)}
                              </div>

                              <div className="mt-2 text-lg font-extrabold">
                                {formatMoney(amount)}
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Charges by Date */}
                  <div className="rounded-[22px] border-2 border-[#103f25] bg-[#fffdf5]/60 p-5 transition hover:-translate-y-1 hover:shadow-[8px_8px_0_#dfff28] dark:border-zinc-700 dark:bg-[#0b2417]/70">
                    <SectionHeading
                      title="Charges by Date"
                      description="Expand a date to see the individual charges"
                    />

                    {Object.keys(chargesByDate).length === 0 ? (
                      <p className="mt-5 text-sm font-bold text-[#103f25]/50 dark:text-zinc-500">
                        No charges recorded.
                      </p>
                    ) : (
                      <div className="mt-5 space-y-3">
                        {Object.entries(chargesByDate)
                          .sort(([dateA], [dateB]) =>
                            dateB.localeCompare(dateA),
                          )
                          .map(([date, amount]) => {
                            const dateCharges = ledger.charges.filter(
                              (charge) => charge.chargeDate === date,
                            );

                            const isExpanded = expandedChargeDate === date;

                            return (
                              <div
                                key={date}
                                className="overflow-hidden rounded-2xl border-2 border-[#103f25]/10 dark:border-zinc-800"
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedChargeDate(
                                      isExpanded ? null : date,
                                    )
                                  }
                                  className="flex w-full items-center justify-between gap-4 bg-[#fffdf5]/70 p-4 text-left transition hover:bg-[#dfff28]/20 dark:bg-[#0b2417] dark:hover:bg-zinc-800"
                                >
                                  <div>
                                    <div className="font-black">
                                      {formatLedgerDate(date)}
                                    </div>

                                    <div className="mt-1 text-xs font-bold text-[#103f25]/45 dark:text-zinc-500">
                                      {dateCharges.length}{" "}
                                      {dateCharges.length === 1
                                        ? "charge"
                                        : "charges"}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <span className="text-sm font-black">
                                      {formatMoney(amount)}
                                    </span>

                                    <span className="text-xs font-black">
                                      {isExpanded ? "▲" : "▼"}
                                    </span>
                                  </div>
                                </button>

                                {isExpanded && (
                                  <div className="border-t-2 border-[#103f25]/10 px-4 py-3 dark:border-zinc-800">
                                    <div className="space-y-2">
                                      {dateCharges.map((charge) => (
                                        <div
                                          key={charge.id}
                                          className="flex items-center justify-between gap-4 py-2"
                                        >
                                          <div>
                                            <div className="text-sm font-black">
                                              {formatLabel(charge.feeType)}
                                            </div>
                                          </div>

                                          <div className="text-sm font-black">
                                            {formatMoney(charge.amount)}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Payments */}
                <div className="mt-6 rounded-[22px] border-2 border-[#103f25] bg-[#fffdf5]/60 p-5 transition hover:-translate-y-1 hover:shadow-[8px_8px_0_#dfff28] dark:border-zinc-700 dark:bg-[#0b2417]/70">
                  <SectionHeading
                    title="Payments"
                    description={`${ledger.payments.length} recorded`}
                  />

                  {ledger.payments.length === 0 ? (
                    <p className="mt-5 text-sm font-bold text-[#103f25]/50 dark:text-zinc-500">
                      No payments recorded.
                    </p>
                  ) : (
                    <div className="mt-5 space-y-3">
                      {ledger.payments
                        .slice()
                        .sort((a, b) =>
                          b.paymentDate.localeCompare(a.paymentDate),
                        )
                        .map((payment) => (
                          <div
                            key={payment.id}
                            className="flex flex-col gap-3 rounded-2xl border-2 border-[#103f25]/10 bg-[#fffdf5]/70 p-4 dark:border-zinc-800 dark:bg-[#0b2417] sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <div className="text-sm font-black">
                                {formatLabel(payment.paymentMethod)}
                              </div>

                              <div className="mt-1 text-xs font-bold text-[#103f25]/45 dark:text-zinc-500">
                                {formatLedgerDate(payment.paymentDate)}
                                {payment.reference
                                  ? ` · ${payment.reference}`
                                  : ""}
                              </div>
                            </div>

                            <div className="text-sm font-black">
                              {formatMoney(payment.amount)}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        )}

        {section === "profile" && (
          <section className="max-w-2xl">
            <SectionHeading
              title="Profile"
              description="Your player information for this organization"
            />

            <div className="mt-6 rounded-2xl border-2 border-[#103f25] bg-[#fffdf5] p-5 shadow-[5px_5px_0_#dfff28] dark:border-zinc-800 dark:bg-[#0b2417] dark:shadow-[5px_5px_0_#27272a]">
              <div className="flex items-center gap-4">
                {player.profilePictureUrl ? (
                  <img
                    src={player.profilePictureUrl}
                    alt={fullName}
                    className="h-24 w-24 rounded-2xl border-2 border-[#103f25] object-cover dark:border-zinc-700"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-[#103f25] text-2xl font-black text-white dark:bg-white dark:text-zinc-950">
                    {initials}
                  </div>
                )}

                <div>
                  <h2 className="text-2xl font-black">{fullName}</h2>

                  {player.nickname && (
                    <p className="mt-1 text-sm font-bold text-[#103f25]/55 dark:text-zinc-400">
                      “{player.nickname}”
                    </p>
                  )}
                </div>
              </div>

              {profilePictureError && (
                <p className="mt-3 text-sm font-bold text-red-600 dark:text-red-400">
                  {profilePictureError}
                </p>
              )}
              <div className="mt-5 flex flex-wrap gap-2">
                <input
                  ref={profilePictureInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleProfilePictureSelected}
                  className="hidden"
                />
                {!selectedProfilePicture ? (
                  <>
                    <button
                      type="button"
                      onClick={() => profilePictureInputRef.current?.click()}
                      disabled={savingProfilePicture}
                      className="rounded-lg bg-[#103f25] px-2.5 py-1 text-xs font-bold text-white transition hover:-translate-y-0.5 hover:shadow-[2px_2px_0_#dfff28] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#dfff28] dark:text-[#0b2417]"
                    >
                      Change Photo
                    </button>

                    {player.profilePictureUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveProfilePicture}
                        disabled={savingProfilePicture}
                        className="rounded-lg border border-[#103f25]/20 px-2.5 py-1 text-xs font-bold text-[#103f25] transition hover:bg-[#103f25]/5 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:text-[#fffdf5] dark:hover:bg-white/5"
                      >
                        Remove
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleSaveProfilePicture}
                      disabled={savingProfilePicture}
                      className="rounded-xl bg-[#103f25] px-2.5 py-1 text-xs font-bold text-white transition hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#dfff28] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#dfff28] dark:text-[#0b2417]"
                    >
                      {savingProfilePicture ? "Saving..." : "Save Photo"}
                    </button>

                    <button
                      type="button"
                      onClick={handleCancelProfilePicture}
                      disabled={savingProfilePicture}
                      className="rounded-xl border-2 border-[#103f25]/20 px-2.5 py-1 text-xs font-bold text-[#103f25] transition hover:bg-[#103f25]/5 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:text-[#fffdf5] dark:hover:bg-white/5"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <ProfileField
                  label="Membership"
                  value={player.membershipStatus}
                />
                <ProfileField
                  label="Participant Type"
                  value={player.participantType}
                />
                <ProfileField
                  label="Organization"
                  value={
                    selectedOrganization?.organizationName ??
                    `Organization #${player.organizationId}`
                  }
                />
                <ProfileField label="Player ID" value={String(player.id)} />
              </div>
            </div>
          </section>
        )}

        {loadingPortalData && (
          <div className="pointer-events-none fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl border-2 border-[#103f25] bg-[#fffdf5] px-4 py-2 text-xs font-black shadow-[4px_4px_0_#dfff28] dark:border-zinc-700 dark:bg-[#0b2417] dark:text-white dark:shadow-[4px_4px_0_#27272a]">
            Loading player data…
          </div>
        )}
      </div>

      {/* Loading overlay when switching organizations */}
      {loadingPlayer && (
        <div className="pointer-events-none fixed bottom-5 right-5 rounded-xl border-2 border-[#103f25] bg-[#fffdf5] px-4 py-3 text-xs font-black shadow-[4px_4px_0_#dfff28] dark:border-zinc-700 dark:bg-[#0b2417] dark:shadow-[4px_4px_0_#27272a]">
          Loading organization...
        </div>
      )}
    </main>
  );
}

function StatCard({
  label,
  value,
  description,
  compact = false,
}: {
  label: string;
  value: string;
  description?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-[22px] border-2 border-[#103f25]/20 bg-[#fffdf5]/70 dark:border-[#dfff28]/20 dark:bg-[#103f25] ${
        compact ? "p-4" : "p-5"
      }`}
    >
      <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#103f25]/45 dark:text-[#f1eee5]/55">
        {label}
      </div>

      <div
        className={`font-black tracking-[-0.05em] ${
          compact ? "mt-1 text-lg" : "mt-2 text-2xl"
        }`}
      >
        {value}
      </div>

      {description && (
        <div className="mt-1 text-xs font-semibold text-[#103f25]/45 dark:text-[#f1eee5]/50">
          {description}
        </div>
      )}
    </div>
  );
}

function DashboardCard({
  label,
  value,
  description,
  onClick,
}: {
  label: string;
  value: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[22px] border-2 border-[#103f25] bg-[#fffdf5]/70 p-5 text-left transition hover:-translate-y-1 hover:shadow-[7px_7px_0_#dfff28] dark:border-[#dfff28]/25 dark:bg-[#103f25]"
    >
      <div className="text-xs font-bold uppercase tracking-[0.14em] text-[#103f25]/45 dark:text-[#f1eee5]/55">
        {label}
      </div>

      <div className="mt-2 text-3xl font-black tracking-[-0.06em]">{value}</div>

      <div className="mt-2 text-xs font-semibold text-[#103f25]/50 dark:text-[#f1eee5]/50">
        {description}
      </div>
    </button>
  );
}

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="text-2xl font-extrabold tracking-[-0.04em]">{title}</h2>

      <p className="mt-1 text-sm font-semibold text-[#103f25]/50 dark:text-[#f1eee5]/50">
        {description}
      </p>
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-[#103f25]/20 bg-[#fffdf5]/60 p-8 dark:border-zinc-800 dark:bg-[#0b2417]/50">
      <div className="text-sm font-black">{title}</div>

      <p className="mt-1 max-w-xl text-sm font-medium text-[#103f25]/50 dark:text-zinc-500">
        {description}
      </p>
    </div>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#103f25]/45 dark:text-zinc-500">
        {label}
      </div>

      <div className="mt-1 text-sm font-black">{value}</div>
    </div>
  );
}
