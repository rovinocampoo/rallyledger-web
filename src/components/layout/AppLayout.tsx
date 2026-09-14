import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import type { AdminUser } from "../../api/auth";
import type {
  Organization,
  OrganizationAccess,
} from "../../types/organization";

export type AppOutletContext = {
  organization: Organization | null;
};

type AppLayoutProps = {
  admin: AdminUser;
  organization: Organization | null;
  organizations: OrganizationAccess[];
  organizationSwitching: boolean;
  organizationError: string | null;
  onOrganizationChange: (organizationId: number) => Promise<void>;
  onLogout: () => void;
  theme: "light" | "dark";
  onThemeToggle: () => void;
};

function AppLayout({
  admin,
  organization,
  organizations,
  organizationSwitching,
  organizationError,
  onOrganizationChange,
  onLogout,
  theme,
  onThemeToggle,
}: AppLayoutProps) {
  const [sessionMenuOpen, setSessionMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const navItems = [
    { to: "/", label: "Home", icon: "🏠", end: true },
    { to: "/outstanding", label: "Balance", icon: "₱", end: true },
    { to: "/participants", label: "Players", icon: "👥" },
    { to: "/sessions", label: "Sessions", icon: "🎾" },
    { to: "/courts", label: "Courts", icon: "🎾" },
    { to: "/fee-rules", label: "Fees", icon: "🧾" },
    ...(admin.role === "OWNER"
      ? [{ to: "/admin/access", label: "Admin Access", icon: "🔐" }]
      : []),
    { to: "/admin/audit-logs", label: "Audit Log", icon: "📊" },
  ];

  function closeMobileMenus() {
    setSessionMenuOpen(false);
    setMoreMenuOpen(false);
  }

  function handleSessionAction() {
    setMoreMenuOpen(false);
    setSessionMenuOpen((current) => !current);
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-white">
      <div className="flex min-h-screen w-full min-w-0">
        {/* Desktop sidebar */}
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-56 overflow-y-auto border-r border-zinc-200 bg-white px-5 py-6 dark:border-zinc-800 dark:bg-zinc-950 md:flex md:flex-col">
          <div className="min-w-0">
            <h1
              className="truncate text-base font-semibold text-zinc-950 dark:text-zinc-100"
              title={organization?.name}
            >
              {organization?.name ?? "Organization"}
            </h1>

            <p className="mt-1 text-xs text-zinc-500">Powered by RallyLedger</p>
          </div>

          {organizations.length > 1 && (
            <label className="mt-4 block">
              <span className="text-xs text-zinc-500">Organization</span>

              <select
                value={admin.organizationId}
                disabled={organizationSwitching}
                onChange={(event) =>
                  void onOrganizationChange(Number(event.target.value))
                }
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-2 py-2 text-sm text-zinc-900 disabled:cursor-wait disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
              >
                {organizations.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>

              {organizationSwitching && (
                <span className="mt-1 block text-xs text-zinc-500">
                  Switching...
                </span>
              )}
            </label>
          )}

          <div className="relative mt-6">
            <button
              type="button"
              onClick={() => setSessionMenuOpen((current) => !current)}
              aria-expanded={sessionMenuOpen}
              className="primary-action flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium"
            >
              <span
                className={`text-lg leading-none transition-transform duration-200 ${
                  sessionMenuOpen ? "rotate-45" : ""
                }`}
              >
                +
              </span>
              <span>Quick Add</span>
            </button>

            {sessionMenuOpen && (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
                <NavLink
                  to="/sessions?action=add-match"
                  onClick={() => setSessionMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  <span className="text-lg">🎾</span>

                  <span className="min-w-0">
                    <span className="block font-medium">Add Match</span>
                    <span className="block text-xs text-zinc-400">
                      Today&apos;s Regular Play
                    </span>
                  </span>
                </NavLink>

                <div className="my-1 border-t border-zinc-200 dark:border-zinc-800" />

                <p className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-zinc-400">
                  New Session
                </p>

                <NavLink
                  to="/sessions?new=TRAINING"
                  onClick={() => setSessionMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  <span className="text-lg">🎾</span>
                  <span>Training</span>
                </NavLink>

                <NavLink
                  to="/sessions?new=REGULAR_PLAY"
                  onClick={() => setSessionMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  <span className="text-lg">🎾</span>
                  <span>Regular Play</span>
                </NavLink>

                <NavLink
                  to="/sessions?new=OUTSIDER_PLAY"
                  onClick={() => setSessionMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  <span className="text-lg">👥</span>
                  <span>Outsider Play</span>
                </NavLink>

                <NavLink
                  to="/sessions?new=EVENT"
                  onClick={() => setSessionMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  <span className="text-lg">🎉</span>
                  <span>Event</span>
                </NavLink>
              </div>
            )}
          </div>

          <nav className="mt-4 flex flex-col gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  isActive
                    ? "rounded-lg bg-zinc-200 px-3 py-2 text-zinc-950 dark:bg-zinc-800 dark:text-white"
                    : "rounded-lg px-3 py-2 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white"
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto border-t border-zinc-200 pt-4 dark:border-zinc-800">
            <p className="truncate text-xs text-zinc-500">Signed in as</p>

            <p className="mt-1 truncate text-sm text-zinc-700 dark:text-zinc-300">
              {admin.email}
            </p>
            <NavLink
              to="/change-password"
              className={({ isActive }) =>
                isActive
                  ? "mt-3 block rounded-lg bg-zinc-200 px-3 py-2 text-sm text-zinc-950 dark:bg-zinc-800 dark:text-white"
                  : "mt-3 block rounded-lg px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white"
              }
            >
              Change Password
            </NavLink>
            <button
              type="button"
              onClick={onThemeToggle}
              className="mt-3 flex w-full items-center justify-between rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              <span>Theme</span>
              <span>{theme === "dark" ? "🌙 Dark" : "☀️ Light"}</span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="mt-3 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white"
            >
              Logout
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1 overflow-x-hidden p-4 pb-24 md:ml-56 md:p-6 md:pb-6 lg:p-8">
          <div className="mb-4 flex items-center gap-7 md:hidden">
            {organizations.length > 1 ? (
              <label className="min-w-0 flex-1">
                <span className="sr-only">Organization</span>

                <select
                  value={admin.organizationId}
                  disabled={organizationSwitching}
                  onChange={(event) =>
                    void onOrganizationChange(Number(event.target.value))
                  }
                  className="w-full rounded-lg bg-zinc-50 px-2 py-2 text-sm text-zinc-900 disabled:cursor-wait disabled:opacity-60 dark:bg-zinc-900 dark:text-white"
                >
                  {organizations.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <p className="min-w-0 flex-1 truncate text-sm font-semibold">
                {organization?.name ?? "Organization"}
              </p>
            )}

            <button
              type="button"
              onClick={onThemeToggle}
              aria-label="Toggle theme"
              className="shrink-0 text-sm opacity-70 transition-opacity hover:opacity-100"
            >
              {theme === "dark" ? "🌙" : "☀️"}
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="shrink-0 text-sm text-zinc-500 transition-colors hover:text-zinc-950 dark:hover:text-white"
            >
              Logout
            </button>
          </div>

          {organizationError && (
            <p
              role="alert"
              className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-400"
            >
              {organizationError}
            </p>
          )}

          <div className="w-full max-w-none">
            <Outlet context={{ organization }} />
          </div>
        </main>
      </div>

      {/* Mobile session actions */}
      {sessionMenuOpen && (
        <>
          <button
            type="button"
            aria-label="Close session menu"
            onClick={closeMobileMenus}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] md:hidden"
          />

          <div className="fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-3 md:hidden">
            <NavLink
              to="/sessions?action=add-match"
              onClick={() => setSessionMenuOpen(false)}
              className="flex min-w-52 items-center gap-3 rounded-full border border-zinc-200 bg-white px-5 py-3 text-sm font-medium text-zinc-900 shadow-lg transition-transform active:scale-95 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            >
              <span className="text-lg">🎾</span>

              <span className="text-left">
                <span className="block font-medium">Add Match</span>
                <span className="block text-xs font-normal text-zinc-400">
                  Today&apos;s Regular Play
                </span>
              </span>
            </NavLink>

            <div className="my-1 h-px w-40 bg-zinc-300 dark:bg-zinc-700" />
            <NavLink
              to="/sessions?new=TRAINING"
              onClick={() => setSessionMenuOpen(false)}
              className="flex min-w-44 items-center gap-3 rounded-full border border-zinc-200 bg-white px-5 py-3 text-sm font-medium text-zinc-900 shadow-lg transition-transform active:scale-95 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            >
              <span className="text-lg">🎾</span>
              <span>Training</span>
            </NavLink>

            <NavLink
              to="/sessions?new=REGULAR_PLAY"
              onClick={() => setSessionMenuOpen(false)}
              className="flex min-w-44 items-center gap-3 rounded-full border border-zinc-200 bg-white px-5 py-3 text-sm font-medium text-zinc-900 shadow-lg transition-transform active:scale-95 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            >
              <span className="text-lg">🎾</span>
              <span>Regular Play</span>
            </NavLink>
            <NavLink
              to="/sessions?new=OUTSIDER_PLAY"
              onClick={() => setSessionMenuOpen(false)}
              className="flex min-w-44 items-center gap-3 rounded-full border border-zinc-200 bg-white px-5 py-3 text-sm font-medium text-zinc-900 shadow-lg transition-transform active:scale-95 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            >
              <span className="text-lg">👥</span>
              <span>Outsider Play</span>
            </NavLink>

            <NavLink
              to="/sessions?new=EVENT"
              onClick={() => setSessionMenuOpen(false)}
              className="flex min-w-44 items-center gap-3 rounded-full border border-zinc-200 bg-white px-5 py-3 text-sm font-medium text-zinc-900 shadow-lg transition-transform active:scale-95 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            >
              <span className="text-lg">🎉</span>
              <span>Event</span>
            </NavLink>
          </div>
        </>
      )}

      {/* Mobile More menu */}
      {moreMenuOpen && (
        <>
          <button
            type="button"
            aria-label="Close more menu"
            onClick={closeMobileMenus}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] md:hidden"
          />

          <div className="fixed bottom-20 right-3 z-50 w-64 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 md:hidden">
            <p className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-zinc-400">
              More
            </p>

            <NavLink
              to="/participants"
              onClick={closeMobileMenus}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <span>👥</span>
              <span>Players</span>
            </NavLink>

            <NavLink
              to="/courts"
              onClick={closeMobileMenus}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <span>🏟️</span>
              <span>Courts</span>
            </NavLink>

            <NavLink
              to="/fee-rules"
              onClick={closeMobileMenus}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <span>🧾</span>
              <span>Fee Rules</span>
            </NavLink>
            {admin.role === "OWNER" && (
              <NavLink
                to="/admin/access"
                onClick={closeMobileMenus}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                <span>⚙</span>
                <span>Admin Access</span>
              </NavLink>
            )}

            <NavLink
              to="/admin/audit-logs"
              onClick={closeMobileMenus}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <span>▤</span>
              <span>Audit Log</span>
            </NavLink>

            <NavLink
              to="/change-password"
              onClick={closeMobileMenus}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <span>🔑</span>
              <span>Change Password</span>
            </NavLink>

            <div className="my-2 border-t border-zinc-200 dark:border-zinc-800" />

            <button
              type="button"
              onClick={onThemeToggle}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <span>{theme === "dark" ? "🌙" : "☀️"}</span>
              <span>{theme === "dark" ? "Dark mode" : "Light mode"}</span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <span>↪</span>
              <span>Logout</span>
            </button>
          </div>
        </>
      )}

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95 md:hidden">
        <div className="grid h-16 grid-cols-5">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 text-[11px] ${
                isActive
                  ? "font-medium text-zinc-950 dark:text-white"
                  : "text-zinc-500"
              }`
            }
          >
            <span className="text-lg leading-none">🏠</span>
            <span>Home</span>
          </NavLink>

          <NavLink
            to="/sessions"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 text-[11px] ${
                isActive
                  ? "font-medium text-zinc-950 dark:text-white"
                  : "text-zinc-500"
              }`
            }
          >
            <span className="text-lg leading-none">🎾</span>
            <span>Sessions</span>
          </NavLink>

          <div className="relative flex items-center justify-center">
            <button
              type="button"
              onClick={handleSessionAction}
              aria-label="Create session"
              aria-expanded={sessionMenuOpen}
              className="absolute -top-5 flex h-14 w-14 items-center justify-center rounded-full border-4 border-zinc-50 bg-zinc-950 text-2xl text-white shadow-lg transition-transform active:scale-95 dark:border-zinc-950 dark:bg-white dark:text-zinc-950"
            >
              <span
                className={`transition-transform duration-200 ${
                  sessionMenuOpen ? "rotate-45" : ""
                }`}
              >
                +
              </span>
            </button>
          </div>

          <NavLink
            to="/outstanding"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 text-[11px] ${
                isActive
                  ? "font-medium text-zinc-950 dark:text-white"
                  : "text-zinc-500"
              }`
            }
          >
            <span className="text-lg leading-none">₱</span>
            <span>Finance</span>
          </NavLink>

          <button
            type="button"
            onClick={() => {
              setSessionMenuOpen(false);
              setMoreMenuOpen((current) => !current);
            }}
            aria-label="More"
            aria-expanded={moreMenuOpen}
            className={`flex flex-col items-center justify-center gap-1 text-[11px] ${
              moreMenuOpen
                ? "font-medium text-zinc-950 dark:text-white"
                : "text-zinc-500"
            }`}
          >
            <span className="text-lg leading-none">☰</span>
            <span>More</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

export default AppLayout;
