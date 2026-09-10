import { useState } from "react";
import type { FormEvent } from "react";
import { changePassword } from "../api/auth";

type ChangePasswordPageProps = {
  forced?: boolean;
  onPasswordChanged: () => void;
};

function ChangePasswordPage({
  forced = false,
  onPasswordChanged,
}: ChangePasswordPageProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must contain at least 8 characters.");
      return;
    }

    try {
      setSaving(true);

      await changePassword({
        currentPassword,
        newPassword,
      });

      onPasswordChanged();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to change password.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-8 text-zinc-950 dark:bg-zinc-950 dark:text-white">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:p-8">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              RallyLedger
            </p>

            <h1 className="mt-2 text-2xl font-semibold">
              {forced ? "Set your new password" : "Change password"}
            </h1>

            <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
              {forced
                ? "You are using a temporary password. Change it before continuing."
                : "Update the password used for email and password login."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Current password
              </span>

              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoComplete="current-password"
                required
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                New password
              </span>

              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                required
                minLength={8}
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
              />

              <span className="mt-1 block text-xs text-zinc-400">
                At least 8 characters.
              </span>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Confirm new password
              </span>

              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                required
                minLength={8}
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
              />
            </label>

            {error && (
              <p
                role="alert"
                className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-400"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="primary-action w-full rounded-lg px-4 py-2.5 text-sm font-medium"
            >
              {saving ? "Changing password..." : "Change password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ChangePasswordPage;
