import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "react-router-dom";
import { getSessions, deleteSession } from "../api/sessions";
import type { Session, SessionType } from "../types/session";
import SessionCard from "../components/ui/SessionCard";
import type { SessionChargeOverviewState, SessionOverviewStats, SessionSection } from "../components/ui/SessionCard";
import SessionForm from "../components/ui/SessionForm";
import SessionParticipantsPanel from "../components/ui/SessionParticipantsPanel";
import SessionMatchesPanel from "../components/ui/SessionMatchesPanel";
import SessionChargesPanel from "../components/ui/SessionChargesPanel";
import ParticipantLedgerPanel from "../components/ui/ParticipantLedgerPanel";
import type { Participant } from "../types/participant";
import { getParticipants } from "../api/participants";
import SessionTrainingPanel from "../components/ui/SessionTrainingPanel";
import SessionOutsiderPanel from "../components/sessions/SessionOutsiderPanel";
import SessionResultsPanel from "../components/sessions/SessionResultsPanel";
import type { AdminUser } from "../api/auth";
import type { Organization } from "../types/organization";
import { getSessionMatches } from "../api/matches";
import { getMatchParticipants } from "../api/matchParticipants";
import { getSessionParticipants } from "../api/sessionParticipants";
import { getMatchBoardCounts } from "../utils/matchBoard";
import { generateSessionMatchCharges, getSessionCharges } from "../api/charges";
import SessionChargeReviewModal, {
  type SessionChargeReviewMatch,
} from "../components/ui/SessionChargeReviewModal";
import { getProducts } from "../api/products";
import type { Product } from "../types/product";
import RallyLedgerLoading from "../components/RallyLedgerLoadingScreen";
function sortSessions(items: Session[]) {
  return [...items].sort((a, b) => {
    if (a.sessionDate !== b.sessionDate) {
      return b.sessionDate.localeCompare(a.sessionDate);
    }

    if (a.startTime !== b.startTime) {
      return b.startTime.localeCompare(a.startTime);
    }

    return b.id - a.id;
  });
}

function nextSequence(sequenceRef: { current: Map<number, number> }, sessionId: number) {
  const next = (sequenceRef.current.get(sessionId) ?? 0) + 1;
  sequenceRef.current.set(sessionId, next);
  return next;
}

function calculateFullyCharged(
  matches: Awaited<ReturnType<typeof getSessionMatches>>,
  charges: Awaited<ReturnType<typeof getSessionCharges>>,
) {
  const chargeableResults = new Set([
    "TEAM_A_WIN", "TEAM_B_WIN", "DRAW", "WALKOVER_A", "WALKOVER_B", "ABANDONED",
  ]);
  const chargeableMatches = matches.filter((match) => chargeableResults.has(match.result));
  const chargedMatchIds = new Set(
    charges.map((charge) => charge.matchId).filter((matchId): matchId is number => matchId !== null),
  );
  const allMatchesFinished = matches.every((match) => chargeableResults.has(match.result));
  return matches.length > 0 && allMatchesFinished && chargeableMatches.length > 0 &&
    chargeableMatches.every((match) => chargedMatchIds.has(match.id));
}

type SessionsPageProps = {
  admin: AdminUser;
  organization: Organization | null;
  organizationLogo: string | null;
};

type SessionRefreshOutcome = {
  overviewRefreshed: boolean;
  superseded?: boolean;
  message?: string;
};

function SessionsPage({
  admin,
  organization,
  organizationLogo,
}: SessionsPageProps) {
  const canDeleteSessions = admin.role === "OWNER" || admin.role === "ADMIN";
  const [searchParams, setSearchParams] = useSearchParams();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [overviewStats, setOverviewStats] = useState<Record<number, SessionOverviewStats>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [matchSession, setMatchSession] = useState<Session | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [openAddMatch, setOpenAddMatch] = useState(false);
  const [trainingSession, setTrainingSession] = useState<Session | null>(null);
  const [outsiderSession, setOutsiderSession] = useState<Session | null>(null);
  const [chargeSession, setChargeSession] = useState<Session | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [ledgerParticipant, setLedgerParticipant] =
    useState<Participant | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [returnToChargeSession, setReturnToChargeSession] =
    useState<Session | null>(null);
  const sessionPanelRef = useRef<HTMLDivElement | null>(null);
  const pageMountedRef = useRef(false);
  const sessionParticipantRefreshSequenceRef = useRef(new Map<number, number>());
  const sessionMatchOverviewRefreshSequenceRef = useRef(new Map<number, number>());
  const sessionChargeRefreshSequenceRef = useRef(new Map<number, number>());
  const sessionChargePreflightSequenceRef = useRef(new Map<number, number>());
  const [sessionPanelScrollRequest, setSessionPanelScrollRequest] = useState(0);
  const [resultsSession, setResultsSession] = useState<Session | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [chargeReviewSession, setChargeReviewSession] =
    useState<Session | null>(null);

  const [chargeReviewMatches, setChargeReviewMatches] = useState<
    SessionChargeReviewMatch[]
  >([]);

  const [chargeStatus, setChargeStatus] = useState<string | null>(null);

  const [generatingSessionCharges, setGeneratingSessionCharges] =
    useState(false);
  const [matchChargeRefreshSignal, setMatchChargeRefreshSignal] = useState(0);
  const [chargeStatusSession, setChargeStatusSession] =
    useState<Session | null>(null);
  const [chargeReviewLoadingSessionId, setChargeReviewLoadingSessionId] =
    useState<number | null>(null);
  const [sessionChargeStates, setSessionChargeStates] = useState<
    Record<number, SessionChargeOverviewState>
  >({});
  const [initialSessionType, setInitialSessionType] = useState<
    SessionType | undefined
  >(undefined);

  useEffect(() => {
    const participantSequences = sessionParticipantRefreshSequenceRef.current;
    const matchOverviewSequences = sessionMatchOverviewRefreshSequenceRef.current;
    const chargeSequences = sessionChargeRefreshSequenceRef.current;
    const chargePreflightSequences = sessionChargePreflightSequenceRef.current;
    pageMountedRef.current = true;
    return () => {
      pageMountedRef.current = false;
      participantSequences.clear();
      matchOverviewSequences.clear();
      chargeSequences.clear();
      chargePreflightSequences.clear();
    };
  }, []);

  const handleAddMatchOpened = useCallback(() => {
    setOpenAddMatch(false);
  }, []);

  const updateSessionChargeState = useCallback((
    sessionId: number,
    chargeState: SessionChargeOverviewState,
    isCurrent: () => boolean = () => true,
  ) => {
    setSessionChargeStates((current) => {
      if (!pageMountedRef.current || !isCurrent()) return current;
      return { ...current, [sessionId]: chargeState };
    });
  }, []);

  useLayoutEffect(() => {
    if (sessionPanelScrollRequest === 0) {
      return;
    }

    requestAnimationFrame(() => {
      console.log(
        "[SessionsPage] PANEL SCROLL",
        "request:",
        sessionPanelScrollRequest,
      );
      const element = sessionPanelRef.current;

      if (!element) {
        return;
      }

      const top = element.getBoundingClientRect().top + window.scrollY - 24;

      window.scrollTo({
        top,
        behavior: "smooth",
      });
    });
  }, [sessionPanelScrollRequest]);

  const setStatisticsLoading = useCallback((sessionId: number) => {
    setOverviewStats((current) => ({
      ...current,
      [sessionId]: {
        ...(current[sessionId] ?? {
          participantCount: null,
          matchCount: null,
          matchCounts: null,
        }),
        participantStatus: "loading",
        matchStatus: "loading",
      },
    }));
  }, []);

  const refreshSessionSnapshot = useCallback(async (
    sessionId: number,
    isActive: () => boolean = () => true,
    snapshot?: { matches: Awaited<ReturnType<typeof getSessionMatches>>; participantCount: number },
  ): Promise<SessionRefreshOutcome> => {
    const participantSequence = nextSequence(sessionParticipantRefreshSequenceRef, sessionId);
    const matchOverviewSequence = nextSequence(sessionMatchOverviewRefreshSequenceRef, sessionId);
    const chargeSequence = nextSequence(sessionChargeRefreshSequenceRef, sessionId);
    setStatisticsLoading(sessionId);
    updateSessionChargeState(sessionId, { status: "loading", fullyCharged: null }, () =>
      sessionChargeRefreshSequenceRef.current.get(sessionId) === chargeSequence,
    );

    const [matchesResult, participantCountResult, chargesResult] = await Promise.allSettled([
      snapshot ? Promise.resolve(snapshot.matches) : getSessionMatches(sessionId),
      snapshot ? Promise.resolve(snapshot.participantCount) : getSessionParticipants(sessionId).then((items) => items.length),
      getSessionCharges(sessionId),
    ]);
    const mountedAndActive = pageMountedRef.current && isActive();

    const participantIsCurrent = mountedAndActive &&
      sessionParticipantRefreshSequenceRef.current.get(sessionId) === participantSequence;
    const matchOverviewIsCurrent = mountedAndActive &&
      sessionMatchOverviewRefreshSequenceRef.current.get(sessionId) === matchOverviewSequence;
    if (participantIsCurrent || matchOverviewIsCurrent) {
      setOverviewStats((current) => {
      if (!pageMountedRef.current) return current;
        const previous = current[sessionId] ?? {
          participantCount: null,
          participantStatus: "loading" as const,
          matchCount: null,
          matchCounts: null,
          matchStatus: "loading" as const,
        };
        const participantStillCurrent = mountedAndActive &&
          sessionParticipantRefreshSequenceRef.current.get(sessionId) === participantSequence;
        const matchOverviewStillCurrent = mountedAndActive &&
          sessionMatchOverviewRefreshSequenceRef.current.get(sessionId) === matchOverviewSequence;
        return {
          ...current,
          [sessionId]: {
            participantCount: !participantStillCurrent
              ? previous.participantCount
              : participantCountResult.status === "fulfilled" ? participantCountResult.value : previous.participantCount,
            participantStatus: !participantStillCurrent
              ? previous.participantStatus
              : participantCountResult.status === "fulfilled" ? "loaded" : "error",
            matchCount: !matchOverviewStillCurrent
              ? previous.matchCount
              : matchesResult.status === "fulfilled" ? matchesResult.value.length : previous.matchCount,
            matchCounts: !matchOverviewStillCurrent
              ? previous.matchCounts
              : matchesResult.status === "fulfilled" ? getMatchBoardCounts(matchesResult.value) : previous.matchCounts,
            matchStatus: !matchOverviewStillCurrent
              ? previous.matchStatus
              : matchesResult.status === "fulfilled" ? "loaded" : "error",
          },
        };
      });
    }

    const chargeIsCurrent = mountedAndActive &&
      sessionChargeRefreshSequenceRef.current.get(sessionId) === chargeSequence;
    if (chargeIsCurrent) {
      if (matchesResult.status === "fulfilled" && chargesResult.status === "fulfilled") {
        updateSessionChargeState(sessionId, {
          status: "known",
          fullyCharged: calculateFullyCharged(matchesResult.value, chargesResult.value),
        }, () => sessionChargeRefreshSequenceRef.current.get(sessionId) === chargeSequence);
      } else {
        updateSessionChargeState(sessionId, {
          status: "unknown",
          fullyCharged: null,
          message: "Session charge status could not be refreshed.",
        }, () => sessionChargeRefreshSequenceRef.current.get(sessionId) === chargeSequence);
      }
    }

    if (!participantIsCurrent && !matchOverviewIsCurrent) {
      return { overviewRefreshed: false, superseded: true };
    }
    const failures = [
      participantIsCurrent && participantCountResult.status === "rejected" ? "participant count" : null,
      matchOverviewIsCurrent && matchesResult.status === "rejected" ? "match statistics" : null,
      chargeIsCurrent && (matchesResult.status === "rejected" || chargesResult.status === "rejected") ? "charge status" : null,
    ].filter((item): item is string => item !== null);
    if (failures.length > 0) return { overviewRefreshed: false, message: `Could not refresh ${failures.join(" and ")}.` };
    return participantIsCurrent && matchOverviewIsCurrent
      ? { overviewRefreshed: true }
      : { overviewRefreshed: false, superseded: true };
  }, [setStatisticsLoading, updateSessionChargeState]);

  const refreshSessionStatistics = useCallback(async (sessionId: number): Promise<SessionRefreshOutcome> => {
    const participantSequence = nextSequence(sessionParticipantRefreshSequenceRef, sessionId);
    const matchOverviewSequence = nextSequence(sessionMatchOverviewRefreshSequenceRef, sessionId);
    setStatisticsLoading(sessionId);
    const [matchesResult, participantsResult] = await Promise.allSettled([
      getSessionMatches(sessionId),
      getSessionParticipants(sessionId),
    ]);
    if (!pageMountedRef.current || (
      sessionParticipantRefreshSequenceRef.current.get(sessionId) !== participantSequence &&
      sessionMatchOverviewRefreshSequenceRef.current.get(sessionId) !== matchOverviewSequence
    )) {
      return { overviewRefreshed: false, superseded: true };
    }
    setOverviewStats((current) => {
      if (!pageMountedRef.current) return current;
      const previous = current[sessionId] ?? {
        participantCount: null,
        participantStatus: "loading" as const,
        matchCount: null,
        matchCounts: null,
        matchStatus: "loading" as const,
      };
      return {
        ...current,
        [sessionId]: {
          participantCount: sessionParticipantRefreshSequenceRef.current.get(sessionId) === participantSequence && participantsResult.status === "fulfilled" ? participantsResult.value.length : previous.participantCount,
          participantStatus: sessionParticipantRefreshSequenceRef.current.get(sessionId) !== participantSequence ? previous.participantStatus : participantsResult.status === "fulfilled" ? "loaded" : "error",
          matchCount: sessionMatchOverviewRefreshSequenceRef.current.get(sessionId) === matchOverviewSequence && matchesResult.status === "fulfilled" ? matchesResult.value.length : previous.matchCount,
          matchCounts: sessionMatchOverviewRefreshSequenceRef.current.get(sessionId) === matchOverviewSequence && matchesResult.status === "fulfilled" ? getMatchBoardCounts(matchesResult.value) : previous.matchCounts,
          matchStatus: sessionMatchOverviewRefreshSequenceRef.current.get(sessionId) !== matchOverviewSequence ? previous.matchStatus : matchesResult.status === "fulfilled" ? "loaded" : "error",
        },
      };
    });
    const failures = [
      sessionParticipantRefreshSequenceRef.current.get(sessionId) === participantSequence && participantsResult.status === "rejected" ? "participant count" : null,
      sessionMatchOverviewRefreshSequenceRef.current.get(sessionId) === matchOverviewSequence && matchesResult.status === "rejected" ? "match statistics" : null,
    ].filter((item): item is string => item !== null);
    if (failures.length > 0) return { overviewRefreshed: false, message: `Could not refresh ${failures.join(" and ")}.` };
    return sessionParticipantRefreshSequenceRef.current.get(sessionId) === participantSequence &&
      sessionMatchOverviewRefreshSequenceRef.current.get(sessionId) === matchOverviewSequence
      ? { overviewRefreshed: true }
      : { overviewRefreshed: false, superseded: true };
  }, [setStatisticsLoading]);

  const refreshSessionChargeState = useCallback(async (sessionId: number): Promise<boolean | null> => {
    const sequence = nextSequence(sessionChargeRefreshSequenceRef, sessionId);
    updateSessionChargeState(sessionId, { status: "loading", fullyCharged: null }, () =>
      sessionChargeRefreshSequenceRef.current.get(sessionId) === sequence,
    );
    const [matchesResult, chargesResult] = await Promise.allSettled([
      getSessionMatches(sessionId),
      getSessionCharges(sessionId),
    ]);
    if (!pageMountedRef.current || sessionChargeRefreshSequenceRef.current.get(sessionId) !== sequence) {
      return null;
    }
    if (matchesResult.status === "rejected" || chargesResult.status === "rejected") {
      updateSessionChargeState(sessionId, {
        status: "unknown",
        fullyCharged: null,
        message: "Session charge status could not be refreshed.",
      }, () => sessionChargeRefreshSequenceRef.current.get(sessionId) === sequence);
      return false;
    }
    updateSessionChargeState(sessionId, {
      status: "known",
      fullyCharged: calculateFullyCharged(matchesResult.value, chargesResult.value),
    }, () => sessionChargeRefreshSequenceRef.current.get(sessionId) === sequence);
    return true;
  }, [updateSessionChargeState]);

  useEffect(() => {
    let ignore = false;

    Promise.all([getSessions(), getParticipants(), getProducts()])
      .then(([sessionData, participantData, productData]) => {
        if (!ignore) {
          setSessions(sortSessions(sessionData));
          setParticipants(participantData);
          setProducts(productData);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error(err);
          setError("Failed to load sessions");
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (loading) {
      return;
    }

    const action = searchParams.get("action");
    const requestedType = searchParams.get("new");
    const sessionIdParam = searchParams.get("session");

    if (action === "add-match") {
      const today = new Date();

      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");

      const todayDate = `${year}-${month}-${day}`;

      const latestRegularPlay = sessions
        .filter(
          (session) =>
            session.sessionType === "REGULAR_PLAY" &&
            session.sessionDate.slice(0, 10) === todayDate,
        )
        .sort((a, b) => {
          if (a.startTime !== b.startTime) {
            return b.startTime.localeCompare(a.startTime);
          }

          return b.id - a.id;
        })[0];

      if (!latestRegularPlay) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setActionError("No Regular Play session found for today.");
        setSearchParams({}, { replace: true });
        return;
      }

      setMatchSession(latestRegularPlay);
      setSelectedMatchId(null);
      setOpenAddMatch(true);
      setTrainingSession(null);
      setOutsiderSession(null);
      setResultsSession(null);
      setSelectedSession(null);
      setChargeSession(null);
      setLedgerParticipant(null);
      setEditingSession(null);
      setShowForm(false);

      setSearchParams({}, { replace: true });
      return;
    }

    if (
      requestedType === "REGULAR_PLAY" ||
      requestedType === "TRAINING" ||
      requestedType === "OUTSIDER_PLAY" ||
      requestedType === "EVENT"
    ) {
      setEditingSession(null);
      setInitialSessionType(requestedType);
      setShowForm(true);

      setSearchParams({}, { replace: true });
      return;
    }

    if (!sessionIdParam || sessions.length === 0) {
      return;
    }

    const sessionId = Number(sessionIdParam);

    if (!Number.isInteger(sessionId)) {
      return;
    }

    const session = sessions.find((item) => item.id === sessionId);

    if (!session) {
      return;
    }

    const matchIdParam = searchParams.get("match");

    if (matchIdParam) {
      const matchId = Number(matchIdParam);

      if (!Number.isInteger(matchId)) {
        return;
      }

      setSelectedMatchId(matchId);
      setMatchSession(session);
      setOpenAddMatch(false);
      setSelectedSession(null);
      setEditingSession(null);
      setTrainingSession(null);
      setOutsiderSession(null);
      setResultsSession(null);
      setChargeSession(null);
    } else {
      setSelectedMatchId(null);
      setOpenAddMatch(false);
      setSelectedSession(null);
      setEditingSession(null);
      setMatchSession(null);
      setTrainingSession(null);
      setOutsiderSession(null);
      setResultsSession(null);
      setChargeSession(null);

      if (session.sessionType === "TRAINING") {
        setTrainingSession(session);
      } else if (session.sessionType === "OUTSIDER_PLAY") {
        setOutsiderSession(session);
      } else if (session.sessionType === "REGULAR_PLAY") {
        setMatchSession(session);
      } else {
        setSelectedSession(session);
      }
      setSessionPanelScrollRequest((current) => current + 1);
    }

    setSearchParams({}, { replace: true });
  }, [loading, searchParams, sessions, setSearchParams]);

  useEffect(() => {
    if (!editingSession) {
      return;
    }

    const element = document.getElementById(`session-${editingSession.id}`);

    element?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [editingSession]);

  useEffect(() => {
    if (loading || sessions.length === 0) {
      return;
    }

    let ignore = false;
    const regularPlaySessions = sessions.filter(
      (session) => session.sessionType === "REGULAR_PLAY",
    );
    void Promise.all(
      regularPlaySessions.map((session) =>
        refreshSessionSnapshot(session.id, () => !ignore),
      ),
    );

    return () => {
      ignore = true;
    };
  }, [loading, sessions, refreshSessionSnapshot]);

if (loading) {
  return (
    <RallyLedgerLoading
      heading="Getting your sessions ready"
      message="Loading..."
      portalLabel="RallyLedger Admin Portal"
    />
  );
}

  if (error) {
    return <p>{error}</p>;
  }

  function handleParticipantSelected(participantId: number) {
    const participant = participants.find(
      (participant) => participant.id === participantId,
    );
    if (!participant) {
      console.error(`Participant ${participantId} not found`);
      return;
    }
    setReturnToChargeSession(chargeSession);
    setChargeSession(null);
    setLedgerParticipant(participant);
  }

  function handleAddSession(sessionType: SessionType = "REGULAR_PLAY") {
    setEditingSession(null);
    setInitialSessionType(sessionType);
    setShowForm(true);
  }

  function handleCancelNewSession() {
    setShowForm(false);
    setEditingSession(null);
    setInitialSessionType(undefined);
    setSearchParams({}, { replace: true });
  }

  function handleSessionSaved(savedSession: Session) {
    setSessions((current) => {
      const exists = current.some((session) => session.id === savedSession.id);

      if (exists) {
        return sortSessions(
          current.map((session) =>
            session.id === savedSession.id ? savedSession : session,
          ),
        );
      }

      return sortSessions([...current, savedSession]);
    });

    setShowForm(false);
    setEditingSession(null);
    setInitialSessionType(undefined);
  }

  async function handleGenerateSessionCharges(session: Session) {
    const preflightSequence = nextSequence(sessionChargePreflightSequenceRef, session.id);
    const refreshSequence = nextSequence(sessionChargeRefreshSequenceRef, session.id);
    const preflightIsCurrent = () =>
      pageMountedRef.current &&
      sessionChargePreflightSequenceRef.current.get(session.id) === preflightSequence &&
      sessionChargeRefreshSequenceRef.current.get(session.id) === refreshSequence;
    updateSessionChargeState(session.id, { status: "loading", fullyCharged: null }, preflightIsCurrent);
    try {
      setActionError(null);
      setChargeStatus(null);
      setChargeStatusSession(session);
      setChargeReviewLoadingSessionId(session.id);

      const matches = await getSessionMatches(session.id);
      if (!preflightIsCurrent()) return;

      if (matches.length === 0) {
        updateSessionChargeState(session.id, { status: "known", fullyCharged: false }, preflightIsCurrent);
        setChargeStatus(
          "No matches have been added to this session yet. Add and finish matches before generating charges.",
        );
        return;
      }

      const existingCharges = await getSessionCharges(session.id);
      if (!preflightIsCurrent()) return;
      updateSessionChargeState(session.id, {
        status: "known",
        fullyCharged: calculateFullyCharged(matches, existingCharges),
      }, preflightIsCurrent);

      const chargedMatchIds = new Set(
        existingCharges
          .map((charge) => charge.matchId)
          .filter((matchId): matchId is number => matchId !== null),
      );

      const chargeableResults = new Set([
        "TEAM_A_WIN",
        "TEAM_B_WIN",
        "DRAW",
        "WALKOVER_A",
        "WALKOVER_B",
        "ABANDONED",
      ]);

      const chargeableMatches = matches.filter((match) =>
        chargeableResults.has(match.result),
      );

      const unchargedMatches = matches.filter(
        (match) =>
          chargeableResults.has(match.result) && !chargedMatchIds.has(match.id),
      );

      if (chargeableMatches.length === 0) {
        const unfinishedCount = matches.length;

        setChargeStatus(
          unfinishedCount === 1
            ? "1 match still needs a final result. Finish the match before generating charges."
            : `${unfinishedCount} matches still need a final result. Finish all matches before generating charges.`,
        );

        return;
      }

      if (unchargedMatches.length === 0) {
        const unfinishedMatches = matches.filter(
          (match) => !chargeableResults.has(match.result),
        );

        if (unfinishedMatches.length > 0) {
          setChargeStatus(
            unfinishedMatches.length === 1
              ? "1 match still needs a final result. Finish the match before generating charges."
              : `${unfinishedMatches.length} matches still need a final result. Finish all matches before generating charges.`,
          );

          return;
        }

        setChargeStatus(
          "All finished matches in this session have already been charged.",
        );
        return;
      }

      const participantResults = await Promise.all(
        unchargedMatches.map(async (match) => {
          const matchParticipants = await getMatchParticipants(match.id);

          const reviewParticipants = matchParticipants.map(
            (matchParticipant) => {
              const participant = participants.find(
                (item) => item.id === matchParticipant.participantId,
              );

              return {
                participantId: matchParticipant.participantId,
                teamSide: matchParticipant.teamSide,
                firstName: participant?.firstName ?? "Unknown",
                lastName: participant?.lastName ?? "Participant",
              };
            },
          );

          return {
            matchNumber:
              matches.length -
              matches.findIndex((item) => item.id === match.id),
            match,
            participants: reviewParticipants,
          };
        }),
      );
      if (!preflightIsCurrent()) return;

      setChargeStatus(null);
      setChargeStatusSession(null);
      setChargeReviewMatches(participantResults);
      setChargeReviewSession(session);
    } catch (err) {
      console.error(err);

      if (preflightIsCurrent()) {
        updateSessionChargeState(session.id, {
          status: "unknown",
          fullyCharged: null,
          message: "Session charge status could not be verified.",
        }, preflightIsCurrent);
        setActionError(
          err instanceof Error ? err.message : "Failed to prepare charges",
        );
      }
    } finally {
      if (sessionChargePreflightSequenceRef.current.get(session.id) === preflightSequence) {
        setChargeReviewLoadingSessionId((current) => current === session.id ? null : current);
      }
    }
  }

  function handleSessionSection(session: Session, section: SessionSection) {
    setActionError(null);
    setShowForm(false);
    setEditingSession(null);
    setOpenAddMatch(false);
    setSelectedMatchId(null);
    setSelectedSession(null);
    setMatchSession(null);
    setResultsSession(null);
    setTrainingSession(null);
    setOutsiderSession(null);
    setChargeSession(null);
    setLedgerParticipant(null);
    if (section === "PLAYERS") setSelectedSession(session);
    if (section === "MATCHES") setMatchSession(session);
    if (section === "RESULTS") setResultsSession(session);
    if (section !== "OVERVIEW") {
      requestAnimationFrame(() => {
        const element = document.getElementById(`session-${session.id}`);
        element?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    }
  }
  async function handleConfirmSessionCharges() {
    if (!chargeReviewSession) {
      return;
    }
    const sessionId = chargeReviewSession.id;
    nextSequence(sessionChargeRefreshSequenceRef, sessionId);
    const chargeSequence = sessionChargeRefreshSequenceRef.current.get(sessionId);
    updateSessionChargeState(sessionId, { status: "loading", fullyCharged: null }, () =>
      sessionChargeRefreshSequenceRef.current.get(sessionId) === chargeSequence,
    );

    try {
      setActionError(null);
      setGeneratingSessionCharges(true);

      await generateSessionMatchCharges(sessionId);
      if (pageMountedRef.current) {
        setMatchChargeRefreshSignal((current) => current + 1);
      }
      setChargeReviewSession(null);
      setChargeReviewMatches([]);
      const chargeStateRefreshed = await refreshSessionChargeState(sessionId);
      if (chargeStateRefreshed === false) {
        setActionError("Charges were generated successfully, but the session charge status could not be refreshed. Review the Charges panel before trying to generate charges again.");
      }
    } catch (err) {
      console.error(err);

      updateSessionChargeState(sessionId, {
        status: "unknown",
        fullyCharged: null,
        message: "Charge generation did not return a confirmed status. Verify charge state before retrying.",
      }, () => sessionChargeRefreshSequenceRef.current.get(sessionId) === chargeSequence);

      setActionError(
        err instanceof Error ? err.message : "Failed to generate charges",
      );
    } finally {
      setGeneratingSessionCharges(false);
    }
  }

  async function handleSessionDelete(session: Session) {
    const confirmed = window.confirm(`Delete ${session.name}?`);

    if (!confirmed) {
      return;
    }

    try {
      setActionError(null);

      await deleteSession(session.id);

      setSessions((current) =>
        current.filter((item) => item.id !== session.id),
      );

      setSelectedSession(null);
      setMatchSession(null);
      setTrainingSession(null);
      setOutsiderSession(null);
      setResultsSession(null);
      setChargeSession(null);
      setLedgerParticipant(null);
      setReturnToChargeSession(null);
    } catch (err) {
      console.error(err);

      setActionError(
        err instanceof Error ? err.message : "Failed to delete session",
      );
    }
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-left">
            <h1 className="text-2xl font-bold text-zinc-950 dark:text-white sm:text-3xl">
              Sessions
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Manage sessions and events.
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleAddSession()}
            className="primary-action w-full rounded-lg px-4 py-3 text-sm font-medium sm:w-auto sm:py-2"
          >
            Add Session
          </button>
        </div>
        {actionError && (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400">
            {actionError}
          </p>
        )}
        {showForm && editingSession === null && (
          <div className="mt-4">
            <SessionForm
              initialSessionType={initialSessionType}
              onSaved={handleSessionSaved}
              onCancel={handleCancelNewSession}
            />
          </div>
        )}
      </div>

      <div className="space-y-3">
        {sessions.length === 0 ? (
          <p className="text-sm text-zinc-500">No sessions yet.</p>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              id={`session-${session.id}`}
              className="space-y-3"
            >
              <SessionCard
                session={session}
                canDelete={canDeleteSessions}
                stats={overviewStats[session.id]}
                chargeState={sessionChargeStates[session.id] ?? { status: "loading", fullyCharged: null }}
                activeSection={
                  selectedSession?.id === session.id ? "PLAYERS" :
                  matchSession?.id === session.id ? "MATCHES" :
                  resultsSession?.id === session.id ? "RESULTS" : "OVERVIEW"
                }
                onGenerateCharges={handleGenerateSessionCharges}
                generatingCharges={chargeReviewLoadingSessionId === session.id}
                onEdit={(session) => {
                  setEditingSession(session);
                  setShowForm(true);
                }}
                onViewOverview={(session) => handleSessionSection(session, "OVERVIEW")}
                onRetryStatistics={(session) => { void refreshSessionStatistics(session.id); }}
                onRetryChargeState={(session) => { void refreshSessionChargeState(session.id); }}
                onViewCharges={() => {
                  setChargeSession(session);
                  setSelectedSession(null);
                  setMatchSession(null);
                  setTrainingSession(null);
                  setOutsiderSession(null);
                  setResultsSession(null);
                  setLedgerParticipant(null);
                  setEditingSession(null);
                  setShowForm(false);
                }}
                onViewResults={(session) => handleSessionSection(session, "RESULTS")}
                onDelete={handleSessionDelete}
                onManagePlayers={(session) => handleSessionSection(session, "PLAYERS")}
                onManageMatches={(session) => handleSessionSection(session, "MATCHES")}
                onManageTraining={(session) => {
                  setTrainingSession(session);

                  setOutsiderSession(null);
                  setResultsSession(null);
                  setSelectedSession(null);
                  setMatchSession(null);
                  setChargeSession(null);
                  setLedgerParticipant(null);
                  setEditingSession(null);
                  setShowForm(false);
                }}
                onManageOutsider={(session) => {
                  setOutsiderSession(session);

                  setSelectedSession(null);
                  setMatchSession(null);
                  setTrainingSession(null);
                  setResultsSession(null);
                  setChargeSession(null);
                  setLedgerParticipant(null);
                  setEditingSession(null);
                  setShowForm(false);
                }}
              />

              {showForm && editingSession?.id === session.id && (
                <div className="p-3">
                  <SessionForm
                    session={editingSession}
                    onSaved={handleSessionSaved}
                    onCancel={() => {
                      setShowForm(false);
                      setEditingSession(null);
                    }}
                  />
                </div>
              )}

              {selectedSession?.id === session.id && (
                <div ref={sessionPanelRef}>
                  <SessionParticipantsPanel
                    session={session}
                    onClose={() => setSelectedSession(null)}
                    onParticipantsChanged={(participantCount) => {
                      nextSequence(sessionParticipantRefreshSequenceRef, session.id);
                      setOverviewStats((current) => ({
                        ...current,
                        [session.id]: {
                          ...(current[session.id] ?? {
                            participantCount: null,
                            matchCount: null,
                            matchCounts: null,
                            matchStatus: "loading" as const,
                          }),
                          participantCount,
                          participantStatus: "loaded",
                        },
                      }));
                    }}
                  />
                </div>
              )}

              {matchSession?.id === session.id && (
                <div ref={sessionPanelRef}>
                  <SessionMatchesPanel
                    session={session}
                    admin={admin}
                    chargeRefreshSignal={matchChargeRefreshSignal}
                    selectedMatchId={selectedMatchId}
                    openAddMatch={openAddMatch}
                    onAddMatchOpened={handleAddMatchOpened}
                    onClose={() => {
                      setMatchSession(null);
                      setSelectedMatchId(null);
                      setOpenAddMatch(false);
                    }}
                    onManageParticipants={() => {
                      setSelectedSession(session);
                      setMatchSession(null);
                      setSelectedMatchId(null);
                    }}
                    onMatchesChanged={(snapshot) => refreshSessionSnapshot(session.id, undefined, snapshot)}
                  />
                </div>
              )}
              {trainingSession?.id === session.id && (
                <div ref={sessionPanelRef}>
                  <SessionTrainingPanel
                    session={session}
                    admin={admin}
                    organization={organization}
                    organizationLogo={organizationLogo}
                    onClose={() => setTrainingSession(null)}
                  />
                </div>
              )}
              {outsiderSession?.id === session.id && (
                <div ref={sessionPanelRef}>
                  <SessionOutsiderPanel
                    session={session}
                    admin={admin}
                    onClose={() => setOutsiderSession(null)}
                  />
                </div>
              )}
              {resultsSession?.id === session.id && (
                <div ref={sessionPanelRef}>
                  <SessionResultsPanel
                    session={session}
                    organization={organization}
                    organizationLogo={organizationLogo}
                    onClose={() => setResultsSession(null)}
                    onViewMatch={(matchId) => {
                      handleSessionSection(session, "MATCHES");
                      setSelectedMatchId(matchId);
                    }}
                  />
                </div>
              )}
              {chargeSession?.id === session.id && (
                <div ref={sessionPanelRef}>
                  <SessionChargesPanel
                    session={session}
                    onClose={() => setChargeSession(null)}
                    onParticipantSelected={handleParticipantSelected}
                  />
                </div>
              )}

              {ledgerParticipant &&
                returnToChargeSession?.id === session.id && (
                  <ParticipantLedgerPanel
                    participant={ledgerParticipant}
                    organization={organization}
                    organizationLogo={organizationLogo}
                    admin={admin}
                    products={products}
                    onClose={() => {
                      setLedgerParticipant(null);

                      if (returnToChargeSession) {
                        setChargeSession(returnToChargeSession);
                        setReturnToChargeSession(null);
                      }
                    }}
                  />
                )}
            </div>
          ))
        )}
      </div>
      {chargeStatus && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
              <div>
                <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">
                  Generate Charges
                </h2>

                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {chargeStatusSession?.name ?? "Session status"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setChargeStatus(null);
                  setChargeStatusSession(null);
                }}
                className="rounded-lg px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="p-5">
              <p className="text-sm text-zinc-700 dark:text-zinc-300">
                {chargeStatus}
              </p>
            </div>

            <div className="border-t border-zinc-200 p-5 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setChargeStatus(null);
                  setChargeStatusSession(null);
                }}
                className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {chargeReviewSession && (
        <SessionChargeReviewModal
          sessionName={chargeReviewSession.name}
          matches={chargeReviewMatches}
          generating={generatingSessionCharges}
          onCancel={() => {
            if (generatingSessionCharges) {
              return;
            }

            setChargeReviewSession(null);
            setChargeReviewMatches([]);
          }}
          onConfirm={handleConfirmSessionCharges}
        />
      )}
    </div>
  );
}

export default SessionsPage;
