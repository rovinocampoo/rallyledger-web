import { useState, type SubmitEvent } from "react";
import { createParticipant, updateParticipant } from "../../api/participants";
import type { Participant } from "../../types/participant";

type ParticipantFormProps = {
  participant?: Participant;
  onSaved: (participant: Participant) => void;
  onCancel: () => void;
};

function ParticipantForm({
  participant,
  onSaved,
  onCancel,
}: ParticipantFormProps) {
  const [firstName, setFirstName] = useState(participant?.firstName ?? "");
  const [lastName, setLastName] = useState(participant?.lastName ?? "");
  const [nickname, setNickname] = useState(participant?.nickname ?? "");
  const [birthday, setBirthday] = useState(
    participant?.birthday?.slice(0, 10) ?? "",
  );
  const [participantType, setParticipantType] = useState(
    participant?.participantType ?? "MEMBER",
  );
  const [membershipStatus, setMembershipStatus] = useState(
    participant?.membershipStatus ?? "ACTIVE",
  );

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setFormError(null);

      const data = {
        firstName,
        lastName,
        nickname,
        birthday: `${birthday}T00:00:00Z`,
        membershipStatus,
        participantType,
        isTemporary: participant?.isTemporary ?? false,
      };

      let savedParticipant: Participant;

      if (participant) {
        savedParticipant = await updateParticipant(participant.id, data);
      } else {
        savedParticipant = await createParticipant(data);
      }

      onSaved(savedParticipant);
    } catch (err) {
      console.error(err);

      setFormError(
        err instanceof Error ? err.message : "Failed to save participant",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="grid gap-4">
          <div className="grid gap-4">
            <label className="block text-left">
              <span className="text-sm text-zinc-400">First Name</span>
              <input
                type="text"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                required
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none"
              />
            </label>
            <label className="block text-left">
              <span className="text-sm text-zinc-400">Last Name</span>
              <input
                type="text"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                required
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none"
              />
            </label>
            <label className="block text-left">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-300">Nickname</span>
                <span className="text-xs text-zinc-500">Optional</span>
              </div>
              <input
                type="text"
                value={nickname}
                placeholder="Optional"
                onChange={(event) => setNickname(event.target.value)}
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none"
              />
            </label>
            <label className="block text-left">
              <span className="text-sm text-zinc-400">Birthday</span>

              <input
                type="date"
                value={birthday}
                onChange={(event) => setBirthday(event.target.value)}
                required
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none"
              />
            </label>
            <label className="block text-left">
              <span className="text-sm text-zinc-400">Participant Type</span>

              <select
                value={participantType}
                onChange={(event) => setParticipantType(event.target.value)}
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none"
              >
                <option value="MEMBER">Member</option>
                <option value="NONMEMBER">Nonmember</option>
                <option value="MMSU_STUDENT">MMSU Student</option>
                <option value="MMSU_EMPLOYEE">MMSU Employee</option>
                <option value="MMSU_VARSITY">MMSU Varsity</option>
              </select>
            </label>
            <label className="block text-left">
              <span className="text-sm text-zinc-400">Membership Status</span>

              <select
                value={membershipStatus}
                onChange={(event) => setMembershipStatus(event.target.value)}
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="HONORARY">Honorary</option>
                <option value="EXPIRED">Expired</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="REVOKED">Revoked</option>
              </select>
            </label>
          </div>
        </div>

        {formError && <p className="mt-4 text-sm text-red-400">{formError}</p>}

        <div className="mt-4 flex gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting
              ? "Saving..."
              : participant
                ? "Update Participant"
                : "Save Participant"}
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}

export default ParticipantForm;
