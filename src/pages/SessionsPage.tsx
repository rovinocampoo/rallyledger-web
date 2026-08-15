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

  function handleSessionSaved(savedSession: Session) {
    setSessions((current) => {
      const exists = current.some((session) => session.id === savedSession.id);

      if (exists) {
        return current.map((session) =>
          session.id === savedSession.id ? savedSession : session,
        );
      }

      return [...current, savedSession];
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
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
        {showForm && (
          <SessionForm
            session={editingSession ?? undefined}
            onSaved={handleSessionSaved}
            onCancel={() => {
              setShowForm(false);
              setEditingSession(null);
            }}
          />
        )}
      </div>
      {selectedSession && (
        <SessionParticipantsPanel
          key={selectedSession.id}
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
        />
      )}
      {matchSession && (
        <SessionMatchesPanel
          key={matchSession.id}
          session={matchSession}
          onClose={() => setMatchSession(null)}
        />
      )}
      {chargeSession && (
        <SessionChargesPanel
          key={chargeSession.id}
          session={chargeSession}
          onClose={() => setChargeSession(null)}
          onParticipantSelected={handleParticipantSelected}
        />
      )}
      {ledgerParticipant && (
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
      <div className="space-y-3">
        {sessions.map((session) => (
          <SessionCard
            key={session.id}
            session={session}
            onEdit={(session) => {
              setEditingSession(session);
              setShowForm(true);
            }}
            onViewCharges={() => setChargeSession(session)}
            onDelete={handleSessionDelete}
            onManagePlayers={(session) => {
              setSelectedSession(session);
            }}
            onManageMatches={(session) => {
              setMatchSession(session);
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default SessionsPage;
