import { useEffect, useState } from "react";
import { getSessions, deleteSession } from "../api/sessions";
import type { Session } from "../types/session";
import SessionCard from "../components/ui/SessionCard";
import SessionForm from "../components/ui/SessionForm";
import SessionParticipantsPanel from "../components/ui/SessionParticipantsPanel";
import SessionMatchesPanel from "../components/ui/SessionMatchesPanel";
import SessionChargesPanel from "../components/ui/SessionChargesPanel";
import ParticipantLedgerPanel from "../components/ui/ParticipantLedgerPanel";
import type { Participant } from "../types/participant";
import { getParticipants } from "../api/participants";

function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [matchSession, setMatchSession] = useState<Session | null>(null);
  const [chargeSession, setChargeSession] = useState<Session | null>(null);
  const [ledgerParticipant, setLedgerParticipant] =
    useState<Participant | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [returnToChargeSession, setReturnToChargeSession] =
    useState<Session | null>(null);

  useEffect(() => {
    let ignore = false;

    Promise.all([getSessions(), getParticipants()])
      .then(([sessionData, participantData]) => {
        if (!ignore) {
          setSessions(sessionData);
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
  }

  async function handleSessionDelete(session: Session) {
    const confirmed = window.confirm(`Delete ${session.name}?`);

    if (!confirmed) {
      return;
    }

    try {
      await deleteSession(session.id);

      setSessions((current) =>
        current.filter((item) => item.id !== session.id),
      );
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-left">
            <h1 className="text-2xl font-bold sm:text-3xl">Sessions</h1>

            <p className="mt-1 text-sm text-zinc-400">
              Manage tennis sessions and events.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingSession(null);
              setShowForm(true);
            }}
            className="w-full rounded-lg bg-white px-4 py-3 text-sm font-medium text-black sm:w-auto sm:py-2"
          >
            Add Session
          </button>
        </div>

        {showForm && editingSession === null && (
          <div className="mt-4">
            <SessionForm
              onSaved={handleSessionSaved}
              onCancel={() => {
                setShowForm(false);
                setEditingSession(null);
              }}
            />
          </div>
        )}
      </div>

      <div className="space-y-3">
        {sessions.map((session) => (
          <div
            key={session.id}
            id={`session-${session.id}`}
            className="space-y-3"
          >
            <SessionCard
              session={session}
              onEdit={(session) => {
                setEditingSession(session);
                setShowForm(true);
              }}
              onViewCharges={() => {
                setChargeSession(session);
                setSelectedSession(null);
                setMatchSession(null);
                setLedgerParticipant(null);
                setEditingSession(null);
                setShowForm(false);
              }}
              onDelete={handleSessionDelete}
              onManagePlayers={(session) => {
                setSelectedSession(session);
                setMatchSession(null);
                setChargeSession(null);
                setLedgerParticipant(null);
                setEditingSession(null);
                setShowForm(false);
              }}
              onManageMatches={(session) => {
                setMatchSession(session);
                setSelectedSession(null);
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
              <SessionMatchesPanel
                session={session}
                onClose={() => setMatchSession(null)}
              />
            )}

            {chargeSession?.id === session.id && (
              <SessionChargesPanel
                session={session}
                onClose={() => setChargeSession(null)}
                onParticipantSelected={handleParticipantSelected}
              />
            )}

            {ledgerParticipant && returnToChargeSession?.id === session.id && (
              <ParticipantLedgerPanel
                participant={ledgerParticipant}
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
        ))}
      </div>
    </div>
  );
}

export default SessionsPage;
