import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getSessions, deleteSession } from "../api/sessions";
import type { Session, SessionType } from "../types/session";
import SessionCard from "../components/ui/SessionCard";
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
import { generateSessionMatchCharges, getSessionCharges } from "../api/charges";
import SessionChargeReviewModal, {
  type SessionChargeReviewMatch,
} from "../components/ui/SessionChargeReviewModal";
import { getProducts } from "../api/products";
import type { Product } from "../types/product";
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

type SessionsPageProps = {
  admin: AdminUser;
  organization: Organization | null;
  organizationLogo: string | null;
};

function SessionsPage({
  admin,
  organization,
  organizationLogo,
}: SessionsPageProps) {
  const canDeleteSessions = admin.role === "OWNER" || admin.role === "ADMIN";
  const [searchParams, setSearchParams] = useSearchParams();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [matchSession, setMatchSession] = useState<Session | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
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
  const [chargeStatusSession, setChargeStatusSession] =
    useState<Session | null>(null);
  const [chargeReviewLoadingSessionId, setChargeReviewLoadingSessionId] =
    useState<number | null>(null);
  const [fullyChargedSessionIds, setFullyChargedSessionIds] = useState<
    Set<number>
  >(new Set());
  const [initialSessionType, setInitialSessionType] = useState<
    SessionType | undefined
  >(undefined);

  useEffect(() => {
    if (
      matchSession ||
      trainingSession ||
      outsiderSession ||
      resultsSession ||
      chargeSession
    ) {
      sessionPanelRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [
    matchSession,
    trainingSession,
    outsiderSession,
    resultsSession,
    chargeSession,
  ]);
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

    if (searchParams.get("action") !== "add-match") {
      return;
    }

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
    setTrainingSession(null);
    setOutsiderSession(null);
    setResultsSession(null);
    setSelectedSession(null);
    setChargeSession(null);
    setLedgerParticipant(null);
    setEditingSession(null);
    setShowForm(false);

    setSearchParams({}, { replace: true });
  }, [loading, searchParams, sessions, setSearchParams]);

  useEffect(() => {
    const requestedType = searchParams.get("new");

    if (
      requestedType !== "REGULAR_PLAY" &&
      requestedType !== "TRAINING" &&
      requestedType !== "OUTSIDER_PLAY" &&
      requestedType !== "EVENT"
    ) {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEditingSession(null);
    setInitialSessionType(requestedType);
    setShowForm(true);

    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const sessionIdParam = searchParams.get("session");

    if (!sessionIdParam || loading || sessions.length === 0) {
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

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedMatchId(matchId);
      setMatchSession(session);
      setSelectedSession(null);
      setEditingSession(null);
      setTrainingSession(null);
      setOutsiderSession(null);
      setResultsSession(null);
      setChargeSession(null);
    } else {
      setSelectedMatchId(null);
      setSelectedSession(session);
      setEditingSession(null);
      setMatchSession(null);
      setTrainingSession(null);
      setOutsiderSession(null);
      setResultsSession(null);
      setChargeSession(null);
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

    async function loadChargeStatus() {
      try {
        const regularPlaySessions = sessions.filter(
          (session) => session.sessionType === "REGULAR_PLAY",
        );

        const statusResults = await Promise.all(
          regularPlaySessions.map(async (session) => {
            const [matches, charges] = await Promise.all([
              getSessionMatches(session.id),
              getSessionCharges(session.id),
            ]);

            const chargeableResults = new Set([
              "TEAM_A_WIN",
              "TEAM_B_WIN",
              "DRAW",
              "WALKOVER_A",
              "WALKOVER_B",
              "ABANDONED",
            ]);

            const chargeableMatchIds = new Set(
              matches
                .filter((match) => chargeableResults.has(match.result))
                .map((match) => match.id),
            );

            const chargedMatchIds = new Set(
              charges
                .map((charge) => charge.matchId)
                .filter((matchId): matchId is number => matchId !== null),
            );

            const unfinishedMatchCount = matches.filter(
              (match) => !chargeableResults.has(match.result),
            ).length;

            const fullyCharged =
              matches.length > 0 &&
              unfinishedMatchCount === 0 &&
              chargeableMatchIds.size > 0 &&
              [...chargeableMatchIds].every((matchId) =>
                chargedMatchIds.has(matchId),
              );
            return {
              sessionId: session.id,
              fullyCharged,
            };
          }),
        );

        if (ignore) {
          return;
        }

        setFullyChargedSessionIds(
          new Set(
            statusResults
              .filter((result) => result.fullyCharged)
              .map((result) => result.sessionId),
          ),
        );
      } catch (err) {
        console.error("Failed to load session charge status:", err);
      }
    }

    loadChargeStatus();

    return () => {
      ignore = true;
    };
  }, [loading, sessions]);

  if (loading) {
    return <p>Loading sessions...</p>;
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
    try {
      setActionError(null);
      setChargeStatus(null);
      setChargeStatusSession(session);
      setChargeReviewLoadingSessionId(session.id);

      const matches = await getSessionMatches(session.id);

      if (matches.length === 0) {
        setChargeStatus(
          "No matches have been added to this session yet. Add and finish matches before generating charges.",
        );
        return;
      }

      const existingCharges = await getSessionCharges(session.id);

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
        setFullyChargedSessionIds((current) => {
          const next = new Set(current);
          next.delete(session.id);
          return next;
        });

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
          setFullyChargedSessionIds((current) => {
            const next = new Set(current);
            next.delete(session.id);
            return next;
          });

          setChargeStatus(
            unfinishedMatches.length === 1
              ? "1 match still needs a final result. Finish the match before generating charges."
              : `${unfinishedMatches.length} matches still need a final result. Finish all matches before generating charges.`,
          );

          return;
        }

        setFullyChargedSessionIds((current) => {
          const next = new Set(current);
          next.add(session.id);
          return next;
        });

        setChargeStatus(
          "All finished matches in this session have already been charged.",
        );
        return;
      }

      setFullyChargedSessionIds((current) => {
        const next = new Set(current);
        next.delete(session.id);
        return next;
      });

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

      setChargeStatus(null);
      setChargeStatusSession(null);
      setChargeReviewMatches(participantResults);
      setChargeReviewSession(session);
    } catch (err) {
      console.error(err);

      setActionError(
        err instanceof Error ? err.message : "Failed to prepare charges",
      );
    } finally {
      setChargeReviewLoadingSessionId(null);
    }
  }
  async function handleConfirmSessionCharges() {
    if (!chargeReviewSession) {
      return;
    }

    try {
      setActionError(null);
      setGeneratingSessionCharges(true);

      await generateSessionMatchCharges(chargeReviewSession.id);
      const updatedCharges = await getSessionCharges(chargeReviewSession.id);
      const updatedMatches = await getSessionMatches(chargeReviewSession.id);
      const chargedMatchIds = new Set(
        updatedCharges
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

      const updatedChargeableMatches = updatedMatches.filter((match) =>
        chargeableResults.has(match.result),
      );

      const remainingUnchargedMatches = updatedChargeableMatches.filter(
        (match) => !chargedMatchIds.has(match.id),
      );

      const unfinishedMatchCount = updatedMatches.filter(
        (match) => !chargeableResults.has(match.result),
      ).length;
      setFullyChargedSessionIds((current) => {
        const next = new Set(current);

        const fullyCharged =
          updatedMatches.length > 0 &&
          unfinishedMatchCount === 0 &&
          updatedChargeableMatches.length > 0 &&
          remainingUnchargedMatches.length === 0;

        if (fullyCharged) {
          next.add(chargeReviewSession.id);
        } else {
          next.delete(chargeReviewSession.id);
        }

        return next;
      });

      setChargeReviewSession(null);
      setChargeReviewMatches([]);
    } catch (err) {
      console.error(err);

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
                onGenerateCharges={handleGenerateSessionCharges}
                generatingCharges={chargeReviewLoadingSessionId === session.id}
                hasUnchargedMatches={
                  session.sessionType === "REGULAR_PLAY"
                    ? !fullyChargedSessionIds.has(session.id)
                    : false
                }
                onEdit={(session) => {
                  setEditingSession(session);
                  setShowForm(true);
                }}
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
                onViewResults={(session) => {
                  setResultsSession(session);
                  setSelectedSession(null);
                  setMatchSession(null);
                  setTrainingSession(null);
                  setOutsiderSession(null);
                  setChargeSession(null);
                  setLedgerParticipant(null);
                  setEditingSession(null);
                  setShowForm(false);
                }}
                onDelete={handleSessionDelete}
                onManagePlayers={(session) => {
                  setSelectedSession(session);
                  setMatchSession(null);
                  setTrainingSession(null);
                  setOutsiderSession(null);
                  setResultsSession(null);
                  setChargeSession(null);
                  setLedgerParticipant(null);
                  setEditingSession(null);
                  setShowForm(false);
                }}
                onManageMatches={(session) => {
                  setMatchSession(session);
                  setSelectedMatchId(null);

                  setTrainingSession(null);
                  setOutsiderSession(null);
                  setResultsSession(null);
                  setSelectedSession(null);
                  setChargeSession(null);
                  setLedgerParticipant(null);
                  setEditingSession(null);
                  setShowForm(false);
                }}
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
                <SessionParticipantsPanel
                  session={session}
                  onClose={() => setSelectedSession(null)}
                />
              )}

              {matchSession?.id === session.id && (
                <div ref={sessionPanelRef}>
                  <SessionMatchesPanel
                    session={session}
                    admin={admin}
                    selectedMatchId={selectedMatchId}
                    onClose={() => {
                      setMatchSession(null);
                      setSelectedMatchId(null);
                    }}
                    onMatchesChanged={() => {
                      setFullyChargedSessionIds((current) => {
                        const next = new Set(current);
                        next.delete(session.id);
                        return next;
                      });
                    }}
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
