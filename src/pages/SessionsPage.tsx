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
  const [trainingSession, setTrainingSession] = useState<Session | null>(null);
  const [outsiderSession, setOutsiderSession] = useState<Session | null>(null);
  const [chargeSession, setChargeSession] = useState<Session | null>(null);
  const [ledgerParticipant, setLedgerParticipant] =
    useState<Participant | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [returnToChargeSession, setReturnToChargeSession] =
    useState<Session | null>(null);
  const sessionPanelRef = useRef<HTMLDivElement | null>(null);
  const [resultsSession, setResultsSession] = useState<Session | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
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

    Promise.all([getSessions(), getParticipants()])
      .then(([sessionData, participantData]) => {
        if (!ignore) {
          setSessions(sortSessions(sessionData));
          setParticipants(participantData);
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
    if (!editingSession) {
      return;
    }

    const element = document.getElementById(`session-${editingSession.id}`);

    element?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [editingSession]);

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
              Manage tennis sessions and events.
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
                    onClose={() => setMatchSession(null)}
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
    </div>
  );
}

export default SessionsPage;
