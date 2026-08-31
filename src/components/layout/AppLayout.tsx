import { NavLink, Outlet } from "react-router-dom";
import type { AdminUser } from "../../api/auth";
import type { Organization } from "../../types/organization";

export type AppOutletContext = {
  organization: Organization | null;
};

type AppLayoutProps = {
  admin: AdminUser;
  organization: Organization | null;
  onLogout: () => void;
  theme: "light" | "dark";
  onThemeToggle: () => void;
};

function AppLayout({
  admin,
  organization,
  onLogout,
  theme,
  onThemeToggle,
}: AppLayoutProps) {
  const navItems = [
    { to: "/", label: "Home", icon: "🏠", end: true },
    { to: "/outstanding", label: "Balance", icon: "₱", end: true },
    { to: "/participants", label: "Players", icon: "👥" },
    { to: "/sessions", label: "Sessions", icon: "📅" },
    { to: "/courts", label: "Courts", icon: "🎾" },
    { to: "/fee-rules", label: "Fees", icon: "🧾" },
  ];

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-white">
      <div className="flex min-h-screen w-full min-w-0">
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
          <nav className="mt-8 flex flex-col gap-2">
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
            {" "}
            <p className="truncate text-xs text-zinc-500">Signed in as</p>
            <p className="mt-1 truncate text-sm text-zinc-700 dark:text-zinc-300">
              {admin.email}
            </p>
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

        <main className="min-w-0 flex-1 overflow-x-hidden p-4 pb-24 md:ml-56 md:p-6 md:pb-6 lg:p-8">
          <div className="mb-4 flex items-center justify-between md:hidden">
            <span className="truncate text-xs text-zinc-500">
              {admin.email}
            </span>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onThemeToggle}
                className="mt-3 w-full rounded-lg border-zinc-300 text-sm text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white"
              >
                {theme === "dark" ? "🌙" : "☀️"}
              </button>

              <button
                type="button"
                onClick={onLogout}
                className="mt-3 w-full rounded-lg border-zinc-300 text-xs text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
              >
                Logout
              </button>
            </div>
          </div>
          <div className="w-full max-w-none">
            <Outlet context={{ organization }} />
          </div>
        </main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 md:hidden">
        <div className="grid grid-cols-6">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex min-w-0 flex-col items-center justify-center gap-1 px-1 py-3 text-[11px] ${
                  isActive ? "text-zinc-950 dark:text-white" : "text-zinc-500"
                }`
              }
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <span className="w-full truncate text-center">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

export default AppLayout;
