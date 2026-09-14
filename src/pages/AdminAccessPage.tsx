import { useEffect, useState } from "react";
import {
  createAdminAccess,
  deleteAdminAccess,
  getAdminAccess,
  updateAdminAccessRole,
  type AdminAccess,
  type AdminRole,
} from "../api/adminAccess";
import { ApiError } from "../api/client";
import type { AdminUser } from "../api/auth";

type AdminAccessPageProps = {
  admin: AdminUser;
};

function AdminAccessPage({ admin }: AdminAccessPageProps) {
  const [access, setAccess] = useState<AdminAccess[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AdminRole>("ADMIN");

  const [error, setError] = useState<string | null>(null);

  async function loadAccess() {
    try {
      setLoading(true);
      setError(null);

      const data = await getAdminAccess();
      setAccess(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setError("Only organization owners can manage administrator access.");
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load administrator access.",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const data = await getAdminAccess();

        if (!ignore) {
          setAccess(data);
        }
      } catch (err) {
        if (!ignore) {
          if (err instanceof ApiError && err.status === 403) {
            setError(
              "Only organization owners can manage administrator access.",
            );
          } else {
            setError(
              err instanceof Error
                ? err.message
                : "Failed to load administrator access.",
            );
          }
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      ignore = true;
    };
  }, []);

  async function handleCreate() {
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await createAdminAccess({
        email: email.trim(),
        password,
        role,
      });

      setEmail("");
      setPassword("");
      setRole("ADMIN");
      setShowForm(false);

      await loadAccess();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to add administrator.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleRoleChange(adminUserId: number, nextRole: AdminRole) {
    try {
      setError(null);

      const updated = await updateAdminAccessRole(adminUserId, nextRole);

      setAccess((current) =>
        current.map((item) =>
          item.adminUserId === updated.adminUserId ? updated : item,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update administrator role.",
      );
    }
  }

  async function handleRemove(item: AdminAccess) {
    if (item.adminUserId === admin.id) {
      setError("You cannot revoke your own access.");
      return;
    }

    const confirmed = window.confirm(
      `Remove ${item.email} from this organization?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setError(null);

      await deleteAdminAccess(item.adminUserId);

      setAccess((current) =>
        current.filter((existing) => existing.adminUserId !== item.adminUserId),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to remove administrator.",
      );
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-zinc-500">Administration</p>
          <h1 className="mt-1 text-2xl font-semibold">Admin Access</h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
            Manage who can access this organization and their role.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setError(null);
            setShowForm((current) => !current);
          }}
          className="primary-action w-full rounded-lg px-4 py-2.5 text-sm font-medium sm:w-auto"
        >
          {showForm ? "Cancel" : "Add administrator"}
        </button>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-400"
        >
          {error}
        </p>
      )}

      {showForm && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold">Add administrator</h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Email
              </span>

              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@example.com"
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Role
              </span>

              <select
                value={role}
                onChange={(event) => setRole(event.target.value as AdminRole)}
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              >
                <option value="ADMIN">ADMIN</option>
                <option value="COORDINATOR">COORDINATOR</option>
                <option value="OWNER">OWNER</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Temporary password
              </span>

              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Leave blank for Google-only"
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
              />
            </label>
          </div>

          <div className="mt-4 rounded-lg bg-zinc-50 px-3 py-3 text-sm text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
            Leave the password blank for Google-only access. A supplied password
            becomes a temporary password and must be changed on first use.
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleCreate()}
              className="primary-action rounded-lg px-4 py-2.5 text-sm font-medium"
            >
              {saving ? "Adding..." : "Add administrator"}
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <h2 className="font-semibold">Administrators</h2>
        </div>

        {loading ? (
          <p className="p-5 text-sm text-zinc-500">Loading administrators...</p>
        ) : access.length === 0 ? (
          <p className="p-5 text-sm text-zinc-500">No administrators found.</p>
        ) : (
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {access.map((item) => {
              const isCurrentAdmin = item.adminUserId === admin.id;

              return (
                <div
                  key={item.adminUserId}
                  className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {item.email}
                      {isCurrentAdmin && (
                        <span className="ml-2 text-xs text-zinc-400">You</span>
                      )}
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      Added {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <select
                      value={item.role}
                      disabled={isCurrentAdmin}
                      onChange={(event) =>
                        void handleRoleChange(
                          item.adminUserId,
                          event.target.value as AdminRole,
                        )
                      }
                      className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                    >
                      <option value="ADMIN">ADMIN</option>
                      <option value="COORDINATOR">COORDINATOR</option>
                      <option value="OWNER">OWNER</option>
                    </select>

                    {!isCurrentAdmin && (
                      <button
                        type="button"
                        onClick={() => void handleRemove(item)}
                        className="danger-action rounded-lg px-3 py-2 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default AdminAccessPage;
