import { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import {
  claimPlayerInvitation,
  getPlayerInvitation,
  type PlayerInvitation,
} from "../api/playerauth";
import { neonAuth } from "../auth/neon";

export default function PlayerInvitationPage() {
  const { token } = useParams<{ token: string }>();

  const [invitation, setInvitation] = useState<PlayerInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      return;
    }

    const invitationToken = token;

    async function loadInvitation() {
      try {
        setError(null);

        const invitationResult = await getPlayerInvitation(invitationToken);

        setInvitation(invitationResult);

        const { data } = await neonAuth.getSession();

        if (data?.session?.token) {
          await claimPlayerInvitation(invitationToken);
          navigate("/player", { replace: true });
          return;
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load player invitation.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadInvitation();
  }, [token, navigate]);

  if (!token) {
    return (
      <div className="mx-auto max-w-lg p-6">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="text-xl font-semibold text-zinc-950 dark:text-white">
            Invitation unavailable
          </h1>

          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Invalid invitation link.
          </p>

          <RouterLink
            to="/player/sign-in"
            className="primary-action mt-5 inline-block rounded-lg px-4 py-2 text-sm font-medium"
          >
            Player Sign In
          </RouterLink>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-lg p-6 text-center">
        <p className="text-sm text-zinc-500">Loading invitation...</p>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="mx-auto max-w-lg p-6">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="text-xl font-semibold text-zinc-950 dark:text-white">
            Invitation unavailable
          </h1>

          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {error ?? "This invitation could not be loaded."}
          </p>

          <RouterLink
            to="/player/sign-in"
            className="primary-action mt-5 inline-block rounded-lg px-4 py-2 text-sm font-medium"
          >
            Player Sign In
          </RouterLink>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg p-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm font-medium text-zinc-500">
          Player Portal Invitation
        </p>

        <h1 className="mt-2 text-2xl font-bold text-zinc-950 dark:text-white">
          You have been invited
        </h1>

        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          Your invitation is ready. Sign in or create your player account to
          continue.
        </p>

        <p className="mt-4 text-xs text-zinc-500">
          Invitation expires{" "}
          {new Date(invitation.expiresAt).toLocaleDateString()}
        </p>

        <RouterLink
          to={`/player/sign-in?invite=${token}`}
          className="primary-action mt-6 block rounded-lg px-4 py-2 text-center text-sm font-medium"
        >
          Sign In / Create Account
        </RouterLink>
      </div>
    </div>
  );
}
