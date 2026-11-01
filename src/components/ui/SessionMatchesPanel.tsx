import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type SubmitEvent,
} from "react";
import {
  createMatch,
  deleteMatch,
  getSessionMatches,
  updateMatch,
} from "../../api/matches";
import { getCourts } from "../../api/courts";
import type { Session } from "../../types/session";
import type { Match } from "../../types/match";
import type { Court } from "../../types/court";
import { generateMatchCharges, getMatchCharges } from "../../api/charges";
import MatchChargesPanel from "./MatchChargesPanel";
import {
  addMatchParticipant,
  getMatchParticipants,
  removeMatchParticipant,
} from "../../api/matchParticipants";
import type { MatchParticipant } from "../../types/matchParticipant";
import { getParticipants } from "../../api/participants";
import type { Participant } from "../../types/participant";
import {
  addSessionParticipant,
  getSessionParticipants,
} from "../../api/sessionParticipants";
import MatchDetailsForm from "./MatchDetailsForm";
import MatchSetsPanel from "./MatchSetsPanel";
import MatchBoardCard from "./MatchBoardCard";
import {
  getMatchBoardCategory,
  getMatchBoardCounts,
  type MatchBoardCategory,
} from "../../utils/matchBoard";
import { getMatchSets } from "../../api/matchSets";
import type { MatchSet } from "../../types/matchSet";
import { formatFullName } from "../../utils/format";
import type { AdminUser } from "../../api/auth";
import SessionChargeReviewModal, {
  type SessionChargeReviewMatch,
} from "./SessionChargeReviewModal";
import { getOrCreateGuest } from "../../utils/guest";

type SessionMatchesPanelProps = {
  session: Session;
  admin: AdminUser;
  selectedMatchId?: number | null;
  openAddMatch?: boolean;
  chargeRefreshSignal: number;
  onAddMatchOpened?: () => void;
  onClose: () => void;
  onMatchesChanged: (snapshot?: { matches: Match[]; participantCount: number }) => Promise<{
    overviewRefreshed: boolean;
    superseded?: boolean;
    message?: string;
  }>;
  onManageParticipants: () => void;
};

function SessionMatchesPanel({
  session,
  admin,
  selectedMatchId = null,
  openAddMatch = false,
  chargeRefreshSignal,
  onAddMatchOpened,
  onClose,
  onMatchesChanged,
  onManageParticipants,
}: SessionMatchesPanelProps) {
  const canDeleteMatches = admin.role === "OWNER" || admin.role === "ADMIN";
  const [matches, setMatches] = useState<Match[]>([]);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [courts, setCourts] = useState<Court[]>([]);
  const activeCourts = courts.filter((court) => court.isActive);
  const [showForm, setShowForm] = useState(false);
  const [courtId, setCourtId] = useState("");
  const [matchType, setMatchType] = useState("DOUBLES");
  const [lightUsage, setLightUsage] = useState<"NONE" | "HALF" | "FULL">(
    "NONE",
  );
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshNotice, setRefreshNotice] = useState<string | null>(null);
  const [quickGuestError, setQuickGuestError] = useState<string | null>(null);
  const [chargeMatch, setChargeMatch] = useState<Match | null>(null);
  const [chargeReviewMatch, setChargeReviewMatch] =
    useState<SessionChargeReviewMatch | null>(null);
  const [generatingMatchCharges, setGeneratingMatchCharges] = useState(false);
  const [chargedMatchIds, setChargedMatchIds] = useState<number[]>([]);
  const [unknownChargeStateIds, setUnknownChargeStateIds] = useState<number[]>([]);
  const [checkingMatchIds, setCheckingMatchIds] = useState<number[]>([]);
  const [participantsByMatch, setParticipantsByMatch] = useState<
    Record<number, MatchParticipant[]>
  >({});
  const [setsByMatch, setSetsByMatch] = useState<Record<number, MatchSet[]>>({});
  const [matchFilter, setMatchFilter] = useState<"ALL" | MatchBoardCategory>("ALL");

  const [teamAPlayer1, setTeamAPlayer1] = useState("");
  const [teamAPlayer2, setTeamAPlayer2] = useState("");
  const [teamBPlayer1, setTeamBPlayer1] = useState("");
  const [teamBPlayer2, setTeamBPlayer2] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);

  const [showQuickGuest, setShowQuickGuest] = useState(false);
  const [quickGuestName, setQuickGuestName] = useState("");
  const [quickGuestTarget, setQuickGuestTarget] = useState<
    "A1" | "A2" | "B1" | "B2" | null
  >(null);
  const [creatingGuest, setCreatingGuest] = useState(false);
  const [sessionParticipantIds, setSessionParticipantIds] = useState<number[]>(
    [],
  );
  const [manageTab, setManageTab] = useState<"MATCH" | "SCORE">("MATCH");
  const createFormRef = useRef<HTMLDivElement | null>(null);
  const manageMatchRef = useRef<HTMLDivElement | null>(null);
  const quickGuestInputRef = useRef<HTMLInputElement | null>(null);
  const autoOpenedMatchRef = useRef<number | null>(null);
  const mountedRef = useRef(false);
  const matchLoadRequestRef = useRef(0);
  const chargeCheckVersionsRef = useRef(new Map<number, number>());
  const chargeCheckPromisesRef = useRef(new Map<number, Promise<boolean | null>>());
  const lastChargeRefreshSignalRef = useRef(chargeRefreshSignal);
  const guestCreateInFlightRef = useRef(false);
  const quickGuestCacheRef = useRef<Participant[]>([]);
  const getPersistentLightUsage = useCallback((): "NONE" | "HALF" | "FULL" => {
    const latestMatchUsingLights = [...matches]
      .sort((a, b) => b.id - a.id)
      .find((match) => match.lightUsage !== "NONE");

    return latestMatchUsingLights?.lightUsage ?? "NONE";
  }, [matches]);
  const handleMatchSetsChanged = useCallback((matchId: number, sets: MatchSet[]) => {
    setSetsByMatch((current) => ({ ...current, [matchId]: sets }));
  }, []);

  async function refreshParentAfterMutation(snapshot?: { matches: Match[]; participantCount: number }) {
    try {
      return await onMatchesChanged(snapshot);
    } catch (refreshErr) {
      console.error("Failed to refresh session overview", refreshErr);
      return {
        overviewRefreshed: false,
        message: "Session overview statistics may be out of date.",
      };
    }
  }

  async function retryOverviewRefresh() {
    const outcome = await refreshParentAfterMutation();
    if (outcome.overviewRefreshed || outcome.superseded) {
      setRefreshNotice(null);
    } else {
      setRefreshNotice(`Session overview statistics could not be refreshed. ${outcome.message ?? "Try again when the connection is available."}`);
    }
  }

  async function notifyOverviewRefreshAfterMutation(
    actionLabel: string,
    snapshot?: { matches: Match[]; participantCount: number },
  ) {
    const outcome = await refreshParentAfterMutation(snapshot);
    if (outcome.overviewRefreshed || outcome.superseded) {
      setRefreshNotice(null);
      return;
    }
    setRefreshNotice(`${actionLabel} succeeded, but session overview statistics may be stale. ${outcome.message ?? "Refresh the session overview before relying on the displayed counts."}`);
  }

  useEffect(() => {
    const chargeCheckVersions = chargeCheckVersionsRef.current;
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      matchLoadRequestRef.current += 1;
      chargeCheckVersions.forEach((version, id) =>
        chargeCheckVersions.set(id, version + 1),
      );
    };
  }, []);

  const checkMatchCharges = useCallback((matchId: number, force = false) => {
    const pending = chargeCheckPromisesRef.current.get(matchId);
    if (pending && !force) return pending;

    const version = (chargeCheckVersionsRef.current.get(matchId) ?? 0) + 1;
    chargeCheckVersionsRef.current.set(matchId, version);
    setCheckingMatchIds((current) => current.includes(matchId) ? current : [...current, matchId]);

    const request = getMatchCharges(matchId)
      .then((charges) => {
        const hasCharges = charges.length > 0;
        if (!mountedRef.current) return null;
        if (chargeCheckVersionsRef.current.get(matchId) !== version) {
          return chargeCheckPromisesRef.current.get(matchId) ?? null;
        }
        if (mountedRef.current) {
          setChargedMatchIds((current) => hasCharges
            ? current.includes(matchId) ? current : [...current, matchId]
            : current.filter((id) => id !== matchId));
          setCheckingMatchIds((current) => current.filter((id) => id !== matchId));
          setUnknownChargeStateIds((current) => current.filter((id) => id !== matchId));
        }
        return hasCharges;
      })
      .catch((err) => {
        console.error("Failed to verify match charge state", err);
        if (chargeCheckVersionsRef.current.get(matchId) !== version) {
          return chargeCheckPromisesRef.current.get(matchId) ?? null;
        }
        if (mountedRef.current && chargeCheckVersionsRef.current.get(matchId) === version) {
          setCheckingMatchIds((current) => current.filter((id) => id !== matchId));
          setUnknownChargeStateIds((current) => current.includes(matchId) ? current : [...current, matchId]);
        }
        return null;
      })
      .finally(() => {
        if (chargeCheckPromisesRef.current.get(matchId) === request) {
          chargeCheckPromisesRef.current.delete(matchId);
        }
      });

    chargeCheckPromisesRef.current.set(matchId, request);
    return request;
  }, []);

  useEffect(() => {
    const refreshOnFocus = () => {
      const matchIds = new Set(matches.map((match) => match.id));
      if (editingMatch) matchIds.add(editingMatch.id);
      matchIds.forEach((matchId) => { void checkMatchCharges(matchId, true); });
    };
    window.addEventListener("focus", refreshOnFocus);
    return () => window.removeEventListener("focus", refreshOnFocus);
  }, [matches, editingMatch, checkMatchCharges]);

  useEffect(() => {
    if (lastChargeRefreshSignalRef.current === chargeRefreshSignal) return;
    lastChargeRefreshSignalRef.current = chargeRefreshSignal;
    const matchIds = new Set(matches.map((match) => match.id));
    if (editingMatch) matchIds.add(editingMatch.id);
    matchIds.forEach((matchId) => { void checkMatchCharges(matchId, true); });
  }, [chargeRefreshSignal, matches, editingMatch, checkMatchCharges]);

  useEffect(() => {
    if (showForm && !editingMatch) {
      console.log("[SessionMatchesPanel] CREATE FORM SCROLL", {
        showForm,
        editingMatch,
        sessionId: session.id,
      });

      createFormRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [showForm, editingMatch, session.id]);

  useEffect(() => {
    if (!openAddMatch || loading) {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEditingMatch(null);
    setChargeMatch(null);
    resetMatchForm();
    setLightUsage(getPersistentLightUsage());
    setShowForm(true);
    onAddMatchOpened?.();
  }, [openAddMatch, loading, getPersistentLightUsage, onAddMatchOpened]);

  useEffect(() => {
    if (editingMatch) {
      console.log("[SessionMatchesPanel] MANAGE MATCH SCROLL", {
        editingMatchId: editingMatch.id,
        sessionId: session.id,
      });

      manageMatchRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [editingMatch, session.id]);

  useEffect(() => {
    if (showQuickGuest) {
      console.log("[SessionMatchesPanel] QUICK GUEST SCROLL", {
        showQuickGuest,
        sessionId: session.id,
      });

      quickGuestInputRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [showQuickGuest, session.id]);

  useEffect(() => {
    let ignore = false;
    const requestId = ++matchLoadRequestRef.current;

    Promise.all([
      getSessionMatches(session.id),
      getCourts(),
      getParticipants(),
      getSessionParticipants(session.id),
    ])
      .then(
        async ([
          matchData,
          courtData,
          participantData,
          sessionParticipantData,
        ]) => {
          const [, participantResults, setResults] = await Promise.all([
            Promise.all(matchData.map((match) => checkMatchCharges(match.id))),
            Promise.all(matchData.map(async (match) => ({
              matchId: match.id,
              participants: await getMatchParticipants(match.id),
            }))),
            Promise.all(matchData.map(async (match) => ({
              matchId: match.id,
              sets: await getMatchSets(match.id),
            }))),
          ]);

          if (!ignore && mountedRef.current && requestId === matchLoadRequestRef.current) {
            setParticipants(participantData);
            setMatches(matchData);
            setCourts(courtData);
            setSessionParticipantIds(
              sessionParticipantData.map(
                (sessionParticipant) => sessionParticipant.participantId,
              ),
            );

            const groupedParticipants: Record<number, MatchParticipant[]> = {};

            participantResults.forEach((result) => {
              groupedParticipants[result.matchId] = result.participants;
            });

            setParticipantsByMatch(groupedParticipants);
            const groupedSets: Record<number, MatchSet[]> = {};
            setResults.forEach((result) => { groupedSets[result.matchId] = result.sets; });
            setSetsByMatch(groupedSets);
            setLoading(false);
          }
        },
      )
      .catch((err) => {
        if (!ignore && mountedRef.current && requestId === matchLoadRequestRef.current) {
          console.error(err);
          setLoadError("Failed to load session matches");
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [session.id, checkMatchCharges]);

  async function loadMatches(): Promise<{ matches: Match[]; participantCount: number } | null> {
    const requestId = ++matchLoadRequestRef.current;
    const data = await getSessionMatches(session.id);
    const [participantResults, setResults] = await Promise.all([
      Promise.all(data.map(async (match) => ({
        matchId: match.id,
        participants: await getMatchParticipants(match.id),
      }))),
      Promise.all(data.map(async (match) => ({
        matchId: match.id,
        sets: await getMatchSets(match.id),
      }))),
      Promise.all(data.map((match) => checkMatchCharges(match.id))),
    ]);
    const grouped: Record<number, MatchParticipant[]> = {};
    participantResults.forEach((result) => { grouped[result.matchId] = result.participants; });
    const groupedSets: Record<number, MatchSet[]> = {};
    setResults.forEach((result) => { groupedSets[result.matchId] = result.sets; });
    if (!mountedRef.current || requestId !== matchLoadRequestRef.current) return null;
    setMatches(data);
    setParticipantsByMatch(grouped);
    setSetsByMatch(groupedSets);
    const sessionParticipantData = await getSessionParticipants(session.id);
    if (!mountedRef.current || requestId !== matchLoadRequestRef.current) return null;
    setSessionParticipantIds(sessionParticipantData.map((item) => item.participantId));
    return { matches: data, participantCount: sessionParticipantData.length };
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) return;

    if (!courtId) {
      setError("Please select a court");
      return;
    }

    if (!teamAPlayer1 || !teamBPlayer1) {
      setError("Please select players for both teams");
      return;
    }

    if (matchType !== "SINGLES" && (!teamAPlayer2 || !teamBPlayer2)) {
      setError("Please select 2 players for each team");
      return;
    }

    const selectedPlayerIds = [
      teamAPlayer1,
      teamBPlayer1,
      ...(matchType !== "SINGLES" ? [teamAPlayer2, teamBPlayer2] : []),
    ];

    if (new Set(selectedPlayerIds).size !== selectedPlayerIds.length) {
      setError("A player cannot be selected more than once");
      return;
    }
    let createdMatch: Match | null = null;
    let assignmentsCompleted = false;
    let matchDetailsUpdated = false;
    let participantAssignmentStarted = false;
    setSubmitting(true);
    setRefreshNotice(null);
    try {
      const sessionParticipants = await getSessionParticipants(session.id);
      const existingParticipantIds = new Set(
        sessionParticipants.map((item) => item.participantId),
      );
      const newParticipants = [...new Set(selectedPlayerIds.map(Number))].filter(
        (id) => !existingParticipantIds.has(id),
      );
      if (!editingMatch && session.maxPlayers !== null &&
          existingParticipantIds.size + newParticipants.length > session.maxPlayers) {
        const participantNames = newParticipants.map((id) => {
          const participant = participants.find((item) => item.id === id);
          return participant?.nickname || [participant?.firstName, participant?.lastName].filter(Boolean).join(" ") || `Participant #${id}`;
        });
        const remainingSlots = Math.max(0, session.maxPlayers - existingParticipantIds.size);
        setError(`Session capacity has ${remainingSlots} slot(s) remaining, but ${participantNames.join(", ")} ${participantNames.length === 1 ? "needs" : "need"} to be added.`);
        return;
      }
      setError(null);

      if (editingMatch) {
        const updatedMatch = await updateMatch(editingMatch.id, {
          sessionId: session.id,
          courtId: Number(courtId),
          matchType,
          result: editingMatch.result,
          lightUsage,
        });
        matchDetailsUpdated = true;

        const teamAIds = [
          Number(teamAPlayer1),
          ...(matchType !== "SINGLES" ? [Number(teamAPlayer2)] : []),
        ];

        const teamBIds = [
          Number(teamBPlayer1),
          ...(matchType !== "SINGLES" ? [Number(teamBPlayer2)] : []),
        ];

        const desiredAssignments = [
          ...teamAIds.map((participantId) => ({
            participantId,
            teamSide: "A",
          })),
          ...teamBIds.map((participantId) => ({
            participantId,
            teamSide: "B",
          })),
        ];

        // Make sure newly selected players also belong to the session.
        participantAssignmentStarted = true;
        const sessionParticipants = await getSessionParticipants(session.id);

        const existingSessionParticipantIds = new Set(
          sessionParticipants.map(
            (sessionParticipant) => sessionParticipant.participantId,
          ),
        );

        for (const assignment of desiredAssignments) {
          if (!existingSessionParticipantIds.has(assignment.participantId)) {
            await addSessionParticipant(session.id, assignment.participantId);
          }
        }

        const existingMatchParticipants =
          participantsByMatch[editingMatch.id] ?? [];

        const desiredParticipantIds = new Set(
          desiredAssignments.map((assignment) => assignment.participantId),
        );

        // First remove:
        // 1. players no longer selected
        // 2. players who are changing teams
        //
        // This frees team capacity before re-adding swapped players.
        for (const existing of existingMatchParticipants) {
          const desiredAssignment = desiredAssignments.find(
            (assignment) => assignment.participantId === existing.participantId,
          );

          const noLongerSelected = !desiredParticipantIds.has(
            existing.participantId,
          );

          const changingTeam =
            desiredAssignment &&
            desiredAssignment.teamSide !== existing.teamSide;

          if (noLongerSelected || changingTeam) {
            await removeMatchParticipant(
              editingMatch.id,
              existing.participantId,
            );
          }
        }

        // Then add:
        // 1. brand-new players
        // 2. players we just removed because they changed teams
        for (const assignment of desiredAssignments) {
          const existing = existingMatchParticipants.find(
            (participant) =>
              participant.participantId === assignment.participantId,
          );

          const unchanged =
            existing && existing.teamSide === assignment.teamSide;

          if (unchanged) {
            continue;
          }

          await addMatchParticipant(
            editingMatch.id,
            assignment.participantId,
            assignment.teamSide,
          );
        }
        assignmentsCompleted = true;

        setMatches((current) =>
          current.map((match) =>
            match.id === updatedMatch.id ? updatedMatch : match,
          ),
        );
      } else {
        const newMatch = await createMatch({
          sessionId: session.id,
          courtId: Number(courtId),
          matchType,
          lightUsage,
        });
        createdMatch = newMatch;

        const teamAIds = [
          Number(teamAPlayer1),
          ...(matchType !== "SINGLES" ? [Number(teamAPlayer2)] : []),
        ];

        const teamBIds = [
          Number(teamBPlayer1),
          ...(matchType !== "SINGLES" ? [Number(teamBPlayer2)] : []),
        ];

        const selectedParticipantIds = [...teamAIds, ...teamBIds];

        const sessionParticipants = await getSessionParticipants(session.id);

        const existingSessionParticipantIds = new Set(
          sessionParticipants.map(
            (sessionParticipant) => sessionParticipant.participantId,
          ),
        );

        for (const participantId of selectedParticipantIds) {
          if (!existingSessionParticipantIds.has(participantId)) {
            await addSessionParticipant(session.id, participantId);
          }
        }

        for (const participantId of teamAIds) {
          await addMatchParticipant(newMatch.id, participantId, "A");
        }

        for (const participantId of teamBIds) {
          await addMatchParticipant(newMatch.id, participantId, "B");
        }
        assignmentsCompleted = true;
      }

      let refreshError: string | null = null;
      let overviewSnapshot: { matches: Match[]; participantCount: number } | null = null;
      try {
        overviewSnapshot = await loadMatches();
      } catch (refreshErr) {
        console.error("Match assignment succeeded, but the view refresh failed", refreshErr);
        refreshError = refreshErr instanceof Error ? refreshErr.message : "Could not reload match and participant data";
      }

      const parentRefresh = await refreshParentAfterMutation(overviewSnapshot ?? undefined);
      if (!parentRefresh.overviewRefreshed && !parentRefresh.superseded) {
        refreshError = [refreshError, parentRefresh.message ?? "Session overview statistics may be out of date."].filter(Boolean).join(" ");
      }

      resetMatchForm();
      setEditingMatch(null);
      setShowForm(false);
      setManageTab("SCORE");
      setError(null);
      setRefreshNotice(refreshError
        ? `${createdMatch ? `Match #${createdMatch.id} was created and participants assigned` : "Match updated and participants assigned"}. The session overview or match display could not be fully refreshed: ${refreshError} The mutation succeeded; use Retry below or reopen this session. Do not create another match.`
        : null);
      if (createdMatch) {
        setEditingMatch(createdMatch);
      }
    } catch (err) {
      console.error(err);
      const message =
        err instanceof Error
          ? err.message
          : editingMatch
            ? "Failed to update match"
            : "Failed to create match";
      if (editingMatch) {
        let refreshError: string | null = null;
        let overviewSnapshot: { matches: Match[]; participantCount: number } | null = null;
        try {
          overviewSnapshot = await loadMatches();
        } catch (refreshErr) {
          refreshError = refreshErr instanceof Error
            ? refreshErr.message
            : "Could not reload match and participant data";
        }
        await checkMatchCharges(editingMatch.id, true);
        const parentRefresh = await refreshParentAfterMutation(overviewSnapshot ?? undefined);
        if (!parentRefresh.overviewRefreshed && !parentRefresh.superseded) {
          setRefreshNotice(`The match state was reloaded, but overview statistics may be stale. ${parentRefresh.message ?? "Retry the session overview refresh."}`);
        }
        setEditingMatch(null);
        setShowForm(false);
        setManageTab("SCORE");
        resetMatchForm();
        if (refreshError) {
          setError(`The match edit could not be fully confirmed${matchDetailsUpdated ? " and participant changes may be partially applied" : ""}. The display refresh also failed: ${refreshError}. Reopen or refresh the session before editing again.`);
        } else if (!matchDetailsUpdated) {
          setError(`The match update could not be confirmed: ${message}. The current match and participant state has been reloaded; review it before trying again.`);
        } else if (participantAssignmentStarted) {
          setError(`Match details were updated, but participant assignment stopped partway through: ${message}. Some participant changes may already have been applied. The current match and participant state has been reloaded; review it before trying again.`);
        } else {
          setError(`Match details were updated, but participant assignments could not be verified: ${message}. The current match and participant state has been reloaded; review it before trying again.`);
        }
      } else if (createdMatch && !assignmentsCompleted) {
        let recoverySnapshot: { matches: Match[]; participantCount: number } | null = null;
        let recoveryRefreshError: string | null = null;
        try {
          recoverySnapshot = await loadMatches();
          setEditingMatch(createdMatch);
          setShowForm(false);
          setManageTab("MATCH");
          setError(`Match #${createdMatch.id} was created, but participant assignment stopped partway through: ${message}. Successfully assigned participants remain visible. Review the retained player slots and save to complete setup; do not create another match.`);
        } catch (refreshErr) {
          recoveryRefreshError = refreshErr instanceof Error ? refreshErr.message : "Could not reload match and participant data";
          setEditingMatch(createdMatch);
          setShowForm(false);
          setManageTab("MATCH");
          setError(`Match #${createdMatch.id} was created, but participant assignment stopped partway through: ${message}. Refresh or reopen this session to recover the match; do not create another match.`);
        }
        const parentRefresh = await refreshParentAfterMutation(recoverySnapshot ?? undefined);
        if (recoveryRefreshError || (!parentRefresh.overviewRefreshed && !parentRefresh.superseded)) {
          setRefreshNotice(`Match #${createdMatch.id} was retained, but some displayed data may be stale. ${[recoveryRefreshError, parentRefresh.message].filter(Boolean).join(" ")} Use Retry below to refresh.`);
        }
      } else {
        setError(message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleQuickGuest() {
    const name = quickGuestName.trim();
    const target = quickGuestTarget;

    if (!name) {
      return;
    }
    if (!target || (matchType === "SINGLES" && (target === "A2" || target === "B2"))) {
      setQuickGuestError("That player slot is unavailable. Choose Quick Guest from an active slot and try again.");
      return;
    }
    if (guestCreateInFlightRef.current) return;

    try {
      guestCreateInFlightRef.current = true;
      setCreatingGuest(true);
      setQuickGuestError(null);
      setError(null);
      setRefreshNotice(null);

      const freshParticipants = await getParticipants();
      setParticipants(freshParticipants);
      const guest = await getOrCreateGuest(name, [
        ...freshParticipants,
        ...quickGuestCacheRef.current.filter((cached) =>
          !freshParticipants.some((participant) => participant.id === cached.id),
        ),
      ]);
      if (!quickGuestCacheRef.current.some((item) => item.id === guest.id)) {
        quickGuestCacheRef.current = [...quickGuestCacheRef.current, guest];
      }

      if (!sessionParticipantIds.includes(guest.id)) {
        await addSessionParticipant(session.id, guest.id);
      }

      setSessionParticipantIds((current) => {
        if (current.includes(guest.id)) {
          return current;
        }

        return [...current, guest.id];
      });

      setParticipants((current) => {
        if (current.some((participant) => participant.id === guest.id)) {
          return current;
        }

        return [...current, guest];
      });

      const setters = {
        A1: setTeamAPlayer1,
        A2: setTeamAPlayer2,
        B1: setTeamBPlayer1,
        B2: setTeamBPlayer2,
      };
      setters[target](String(guest.id));
      setShowQuickGuest(false);
      setQuickGuestTarget(null);
      setQuickGuestName("");
      await notifyOverviewRefreshAfterMutation("Quick Guest was added");
    } catch (err) {
      console.error(err);
      try {
        const freshParticipants = await getParticipants();
        const freshSessionParticipants = await getSessionParticipants(session.id);
        if (mountedRef.current) {
          setParticipants(freshParticipants);
          setSessionParticipantIds(freshSessionParticipants.map((item) => item.participantId));
          const outcome = await refreshParentAfterMutation();
          if (!outcome.overviewRefreshed && !outcome.superseded) {
            setRefreshNotice(`Quick Guest recovery refreshed local players, but overview statistics may be stale. ${outcome.message ?? "Retry the session overview refresh."}`);
          }
        }
      } catch (refreshErr) {
        console.error("Failed to refresh participant data after Quick Guest error", refreshErr);
      }

      setQuickGuestError(
        err instanceof Error ? err.message : "Failed to create quick guest",
      );
    } finally {
      guestCreateInFlightRef.current = false;
      setCreatingGuest(false);
    }
  }

  const handleEditMatch = useCallback(
    async (match: Match) => {
      const hasCharges = await checkMatchCharges(match.id, true);
      if (hasCharges === null) {
        setError("Could not verify this match's charge status. The scorecard was not opened.");
        return;
      }
      const matchParticipants = participantsByMatch[match.id] ?? [];

      const teamA = matchParticipants.filter(
        (participant) => participant.teamSide === "A",
      );

      const teamB = matchParticipants.filter(
        (participant) => participant.teamSide === "B",
      );

      setEditingMatch(match);

      setCourtId(String(match.courtId));
      setMatchType(match.matchType);
      setLightUsage(match.lightUsage);

      setTeamAPlayer1(teamA[0] ? String(teamA[0].participantId) : "");

      setTeamAPlayer2(teamA[1] ? String(teamA[1].participantId) : "");

      setTeamBPlayer1(teamB[0] ? String(teamB[0].participantId) : "");

      setTeamBPlayer2(teamB[1] ? String(teamB[1].participantId) : "");

      setManageTab("SCORE");
      setShowForm(false);
      setChargeMatch(null);

      setError(null);
    },
    [participantsByMatch, checkMatchCharges],
  );

  useEffect(() => {
    if (!selectedMatchId || loading || matches.length === 0) {
      return;
    }

    if (autoOpenedMatchRef.current === selectedMatchId) {
      return;
    }

    const match = matches.find((item) => item.id === selectedMatchId);

    if (!match) {
      return;
    }

    autoOpenedMatchRef.current = selectedMatchId;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    handleEditMatch(match);
  }, [selectedMatchId, loading, matches, handleEditMatch]);

  function getSessionMatchNumber(matchId: number) {
    const index = matches.findIndex((match) => match.id === matchId);

    return matches.length - index;
  }

  async function handleDeleteMatch(match: Match) {
    const matchNumber = getSessionMatchNumber(match.id);
    const confirmed = window.confirm(
      `Delete Match #${matchNumber}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setError(null);
      await deleteMatch(match.id);
    } catch (err) {
      console.error(err);
      setError("Failed to delete match");
      return;
    }
    let localRefreshError: string | null = null;
    let snapshot: { matches: Match[]; participantCount: number } | null = null;
    try {
      snapshot = await loadMatches();
    } catch (refreshErr) {
      localRefreshError = refreshErr instanceof Error ? refreshErr.message : "Could not reload match data";
    }
    const parentRefresh = await refreshParentAfterMutation(snapshot ?? undefined);
    if (localRefreshError || (!parentRefresh.overviewRefreshed && !parentRefresh.superseded)) {
      setRefreshNotice(`Match #${matchNumber} was deleted, but some displayed data may be stale. ${[localRefreshError, parentRefresh.message].filter(Boolean).join(" ")} Use Retry below to refresh.`);
    } else {
      setRefreshNotice(null);
    }
  }

  function handleGenerateCharges(match: Match) {
    const matchParticipants = participantsByMatch[match.id] ?? [];

    const reviewParticipants = matchParticipants.map((matchParticipant) => {
      const participant = participants.find(
        (item) => item.id === matchParticipant.participantId,
      );

      return {
        participantId: matchParticipant.participantId,
        teamSide: matchParticipant.teamSide,
        firstName: participant?.firstName ?? "Unknown",
        lastName: participant?.lastName ?? "Participant",
      };
    });

    setError(null);
    setChargeMatch(null);

    setChargeReviewMatch({
      matchNumber: getSessionMatchNumber(match.id),
      match,
      participants: reviewParticipants,
    });
  }
  async function handleConfirmMatchCharges() {
    if (!chargeReviewMatch) {
      return;
    }

    try {
      setError(null);
      setRefreshNotice(null);
      setGeneratingMatchCharges(true);

      await generateMatchCharges(chargeReviewMatch.match.id);

      const chargedId = chargeReviewMatch.match.id;
      chargeCheckVersionsRef.current.set(chargedId, (chargeCheckVersionsRef.current.get(chargedId) ?? 0) + 1);
      chargeCheckPromisesRef.current.delete(chargedId);
      setChargedMatchIds((current) =>
        current.includes(chargedId)
          ? current
          : [...current, chargedId],
      );
      setUnknownChargeStateIds((current) => current.filter((id) => id !== chargedId));
      setCheckingMatchIds((current) => current.filter((id) => id !== chargedId));
      await notifyOverviewRefreshAfterMutation("Match charges were generated");

      setChargeReviewMatch(null);
    } catch (err) {
      console.error(err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to generate charges");
      }
    } finally {
      setGeneratingMatchCharges(false);
    }
  }

  function availableForPicker(currentValue: string) {
    const selectedIds = [
      teamAPlayer1,
      teamAPlayer2,
      teamBPlayer1,
      teamBPlayer2,
    ].filter((id) => id && id !== currentValue);

    return participants.filter((participant) => {
      const alreadySelected = selectedIds.includes(String(participant.id));

      if (alreadySelected) {
        return false;
      }

      if (!participant.isTemporary) {
        return true;
      }

      return sessionParticipantIds.includes(participant.id);
    }).sort((left, right) => {
      const leftInSession = sessionParticipantIds.includes(left.id);
      const rightInSession = sessionParticipantIds.includes(right.id);
      return Number(rightInSession) - Number(leftInSession);
    });
  }

  function resetMatchForm() {
    setCourtId("");
    setMatchType("DOUBLES");
    setLightUsage("NONE");

    setTeamAPlayer1("");
    setTeamAPlayer2("");
    setTeamBPlayer1("");
    setTeamBPlayer2("");

    setShowQuickGuest(false);
    setQuickGuestTarget(null);
    setQuickGuestName("");

    setError(null);
  }

  if (loading) {
    return <p>Loading matches...</p>;
  }
  if (loadError) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm text-red-600 dark:text-red-400">{loadError}</p>

        <button
          type="button"
          onClick={onClose}
          className="secondary-action mt-3 rounded-lg px-3 py-2 text-sm"
        >
          Close
        </button>
      </div>
    );
  }

  const boardCounts = getMatchBoardCounts(matches);
  const visibleMatches = matches.filter(
    (match) => matchFilter === "ALL" || getMatchBoardCategory(match) === matchFilter,
  );
  const participantsInMatches = new Set(
    Object.values(participantsByMatch).flat().map((item) => item.participantId),
  ).size;

  return (
    <div className="mb-6 space-y-4">
      <header className="rounded-2xl bg-[#14251B] p-4 text-white sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D8C86E]">Regular Play</p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Match Board</h2>
              <span className="truncate text-sm text-white/70">{session.name}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={onManageParticipants} className="min-h-10 rounded-lg border border-white/25 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10">Players</button>
            <button
              type="button"
              onClick={() => {
                setEditingMatch(null);
                setChargeMatch(null);
                resetMatchForm();
                setLightUsage(getPersistentLightUsage());
                setShowForm(true);
              }}
              className="min-h-10 rounded-lg bg-[#D8C86E] px-3 py-2 text-sm font-bold text-[#1B281E] transition hover:bg-[#E4D887]"
            >
              Create Match
            </button>
            <button type="button" onClick={onClose} className="min-h-10 rounded-lg px-3 py-2 text-sm font-medium text-white/75 transition hover:bg-white/10 hover:text-white">Close</button>
          </div>
        </div>
      </header>

      <section aria-label="Match progress" className="space-y-1.5">
        <div className="flex items-center justify-between border-b border-stone-200 px-1 py-1.5 dark:border-stone-700">
          <span className="text-xs font-semibold text-stone-600 dark:text-stone-300">Total matches</span>
          <span className="text-base font-bold tabular-nums text-stone-900 dark:text-white">{matches.length}</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          {([
            ["In progress", boardCounts.IN_PROGRESS, "bg-emerald-50 dark:bg-emerald-950/40"],
            ["Scheduled", boardCounts.SCHEDULED, "bg-[#FAF7E9] dark:bg-[#292719]"],
            ["Completed", boardCounts.COMPLETED, "bg-stone-100 dark:bg-stone-800"],
            ["Exceptional", boardCounts.EXCEPTIONAL, "bg-orange-50 dark:bg-orange-950/40"],
          ] as const).map(([label, count, surface]) => (
            <div key={label} className={`flex min-h-10 items-center justify-between gap-2 rounded-md px-2.5 py-1.5 sm:px-3 ${surface}`}>
              <p className="text-[10px] font-medium leading-tight text-stone-600 dark:text-stone-300 sm:text-xs">{label}</p>
              <p className="text-base font-bold tabular-nums text-stone-900 dark:text-white">{count}</p>
            </div>
          ))}
        </div>
      </section>

      <p className="text-xs text-stone-500 dark:text-stone-400">
        {sessionParticipantIds.length} session participants · {participantsInMatches} participants in matches
      </p>

      {error && (
        <div className="mt-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 dark:border-red-900/50 dark:bg-red-950/20">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
      {refreshNotice && (
        <div role="status" className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#D8C86E]/60 bg-[#FAF7E9] px-3 py-2 text-sm text-[#554F32] dark:border-[#766D3C] dark:bg-[#292719] dark:text-[#E5DAA5]">
          <p>{refreshNotice}</p>
          <button type="button" onClick={() => { void retryOverviewRefresh(); }} className="shrink-0 font-semibold underline underline-offset-2">Retry</button>
        </div>
      )}
      {showForm && !editingMatch && (
        <div
          ref={createFormRef}
          className="mt-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4"
        >
          <h3 className="mb-6 text-left text-lg font-semibold">Create Match</h3>

          <MatchDetailsForm
            editingMatch={false}
            courtId={courtId}
            quickGuestInputRef={quickGuestInputRef}
            setCourtId={setCourtId}
            matchType={matchType}
            setMatchType={setMatchType}
            lightUsage={lightUsage}
            setLightUsage={setLightUsage}
            activeCourts={activeCourts}
            teamAPlayer1={teamAPlayer1}
            setTeamAPlayer1={setTeamAPlayer1}
            teamAPlayer2={teamAPlayer2}
            setTeamAPlayer2={setTeamAPlayer2}
            teamBPlayer1={teamBPlayer1}
            setTeamBPlayer1={setTeamBPlayer1}
            teamBPlayer2={teamBPlayer2}
            setTeamBPlayer2={setTeamBPlayer2}
            availableForPicker={availableForPicker}
            quickGuestTarget={quickGuestTarget}
            showQuickGuest={showQuickGuest}
            setShowQuickGuest={setShowQuickGuest}
            quickGuestName={quickGuestName}
            setQuickGuestName={setQuickGuestName}
            setQuickGuestTarget={setQuickGuestTarget}
            creatingGuest={creatingGuest}
            handleQuickGuest={handleQuickGuest}
            error={error}
            quickGuestError={quickGuestError}
            clearQuickGuestError={() => setQuickGuestError(null)}
            submitting={submitting}
            handleSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              onAddMatchOpened?.();

              resetMatchForm();
            }}
          />
        </div>
      )}

      <nav aria-label="Filter matches" className="grid grid-cols-2 gap-1 rounded-lg bg-stone-100 p-1 dark:bg-stone-900/70 sm:flex sm:flex-wrap">
        {([
          ["ALL", "All"],
          ["IN_PROGRESS", "In progress"],
          ["SCHEDULED", "Scheduled"],
          ["COMPLETED", "Completed"],
          ["EXCEPTIONAL", "Exceptions"],
        ] as const).map(([filter, label]) => (
          <button
            key={filter}
            type="button"
            aria-pressed={matchFilter === filter}
            onClick={() => setMatchFilter(filter)}
            className={`min-h-9 rounded-md px-2.5 py-1.5 text-xs font-medium transition sm:px-3 sm:text-sm ${
              matchFilter === filter
                ? "bg-[#183E2A] text-white shadow-sm dark:bg-lime-300 dark:text-[#15251A]"
                : "text-stone-600 hover:bg-white hover:text-stone-950 dark:text-stone-300 dark:hover:bg-stone-800"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="mt-2">
        {matches.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-5 py-8 text-center dark:border-stone-700 dark:bg-[#17221B]">
            <p className="font-semibold text-stone-800 dark:text-stone-100">No matches yet</p>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">Create the first match to start play.</p>
          </div>
        ) : (
          visibleMatches.length === 0 ? (
            <p className="rounded-xl border border-stone-200 bg-white px-4 py-5 text-sm text-stone-500 dark:border-stone-700 dark:bg-[#17221B] dark:text-stone-400">No {matchFilter === "IN_PROGRESS" ? "in-progress" : matchFilter === "EXCEPTIONAL" ? "exceptional" : matchFilter.toLowerCase()} matches.</p>
          ) : visibleMatches.map((match) => {
            const matchNumber = matches.length - matches.findIndex((item) => item.id === match.id);
            const court = courts.find((court) => court.id === match.courtId);
            const courtLabel = `${court?.name ?? `Court ${match.courtId}`}${court?.location ? ` · ${court.location}` : ""}`;
            const hasCharges = chargedMatchIds.includes(match.id);
            const chargeStateUnknown = unknownChargeStateIds.includes(match.id);
            const checkingCharges =
              chargeRefreshSignal !== lastChargeRefreshSignalRef.current ||
              checkingMatchIds.includes(match.id);
            const lockStatus = checkingCharges
              ? "checking"
              : chargeStateUnknown
                ? "unknown"
                : hasCharges
                  ? "charged"
                  : "unlocked";
            const scorecardReadOnly = lockStatus !== "unlocked";
            const matchParticipants = participantsByMatch[match.id] ?? [];
            const matchParticipantsForBoard = matchParticipants.map((item) => {
              const participant = participants.find((person) => person.id === item.participantId);
              const fullName = participant ? formatFullName(participant.firstName, participant.lastName) : "";
              return {
                ...item,
                nickname: item.nickname?.trim() || participant?.nickname?.trim() || fullName || `Participant #${item.participantId}`,
              };
            });
            const matchSets = setsByMatch[match.id] ?? [];
            const canGenerateCharges = [
              "TEAM_A_WIN",
              "TEAM_B_WIN",
              "DRAW",
              "WALKOVER_A",
              "WALKOVER_B",
              "ABANDONED",
            ].includes(match.result);

            return (
              <div key={match.id}>
                <MatchBoardCard
                  match={match}
                  matchNumber={matchNumber}
                  courtLabel={courtLabel}
                  participants={matchParticipantsForBoard}
                  sets={matchSets}
                  charged={hasCharges}
                  chargeStateUnknown={chargeStateUnknown}
                  checkingCharges={checkingCharges}
                  canDelete={canDeleteMatches}
                  canGenerateCharges={canGenerateCharges}
                  onOpen={() => { void handleEditMatch(match); }}
                  onDelete={() => { void handleDeleteMatch(match); }}
                  onGenerateCharges={() => handleGenerateCharges(match)}
                  onViewCharges={() => {
                    setEditingMatch(null);
                    setShowForm(false);
                    resetMatchForm();
                    setChargeMatch(match);
                  }}
                />

                {editingMatch?.id === match.id && (
                  <div
                    ref={manageMatchRef}
                    className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4 sm:p-5"
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h3 className="text-left text-lg font-semibold">
                        Manage Match #{matchNumber}
                      </h3>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingMatch(null);
                          setManageTab("SCORE");
                          resetMatchForm();
                        }}
                        className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                      >
                        Close
                      </button>
                    </div>

                    <div className={`mb-5 grid ${hasCharges ? "grid-cols-1" : "grid-cols-2"} gap-2`}>
                      {!scorecardReadOnly && <button
                        type="button"
                        onClick={() => setManageTab("MATCH")}
                        className={`rounded-lg px-3 py-2 text-sm font-medium ${
                          manageTab === "MATCH"
                            ? "primary-action"
                            : "secondary-action"
                        }`}
                      >
                        Details & Players
                      </button>}

                      <button
                        type="button"
                        onClick={() => setManageTab("SCORE")}
                        className={`rounded-lg px-3 py-2 text-sm font-medium ${
                          manageTab === "SCORE"
                            ? "primary-action"
                            : "secondary-action"
                        }`}
                      >
                        Score
                      </button>
                    </div>

                    {manageTab === "MATCH" && (
                      <MatchDetailsForm
                        editingMatch={true}
                        courtId={courtId}
                        quickGuestInputRef={quickGuestInputRef}
                        setCourtId={setCourtId}
                        matchType={matchType}
                        setMatchType={setMatchType}
                        lightUsage={lightUsage}
                        setLightUsage={setLightUsage}
                        activeCourts={activeCourts}
                        teamAPlayer1={teamAPlayer1}
                        setTeamAPlayer1={setTeamAPlayer1}
                        teamAPlayer2={teamAPlayer2}
                        setTeamAPlayer2={setTeamAPlayer2}
                        teamBPlayer1={teamBPlayer1}
                        setTeamBPlayer1={setTeamBPlayer1}
                        teamBPlayer2={teamBPlayer2}
                        setTeamBPlayer2={setTeamBPlayer2}
                        availableForPicker={availableForPicker}
                        quickGuestTarget={quickGuestTarget}
                        showQuickGuest={showQuickGuest}
                        setShowQuickGuest={setShowQuickGuest}
                        quickGuestName={quickGuestName}
                        setQuickGuestName={setQuickGuestName}
                        setQuickGuestTarget={setQuickGuestTarget}
                        creatingGuest={creatingGuest}
                        handleQuickGuest={handleQuickGuest}
                        quickGuestError={quickGuestError}
                        clearQuickGuestError={() => setQuickGuestError(null)}
                        error={error}
                        submitting={submitting}
                        handleSubmit={handleSubmit}
                        onCancel={() => {
                          setEditingMatch(null);
                          setManageTab("MATCH");

                          resetMatchForm();
                        }}
                      />
                    )}

                    {manageTab === "SCORE" && editingMatch && (
                      <MatchSetsPanel
                        key={editingMatch.id}
                        match={editingMatch}
                        matchNumber={matchNumber}
                        courtLabel={courtLabel}
                        participants={matchParticipantsForBoard}
                        canDelete={canDeleteMatches}
                        lockStatus={lockStatus}
                        onSetsChanged={handleMatchSetsChanged}
                        onClose={() => {
                          setEditingMatch(null);
                          setManageTab("SCORE");
                          resetMatchForm();
                        }}
                        onMatchUpdated={(updatedMatch) => {
                          setMatches((current) =>
                            current.map((item) =>
                              item.id === updatedMatch.id ? updatedMatch : item,
                            ),
                          );

                          setEditingMatch(updatedMatch);
                          void notifyOverviewRefreshAfterMutation("Match result or status was updated");
                          void checkMatchCharges(updatedMatch.id, true);
                        }}
                      />
                    )}
                  </div>
                )}

                {chargeMatch?.id === match.id && (
                  <MatchChargesPanel
                    key={match.id}
                    match={match}
                    onClose={() => setChargeMatch(null)}
                  />
                )}
              </div>
            );
          })
        )}
      </div>
      {chargeReviewMatch && (
        <SessionChargeReviewModal
          sessionName={session.name}
          matches={[chargeReviewMatch]}
          generating={generatingMatchCharges}
          onCancel={() => {
            if (generatingMatchCharges) {
              return;
            }

            setChargeReviewMatch(null);
          }}
          onConfirm={handleConfirmMatchCharges}
        />
      )}
    </div>
  );
}

export default SessionMatchesPanel;
