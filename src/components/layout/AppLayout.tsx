import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  Building2,
  Calendar,
  CalendarClock,
  CalendarDays,
  FileText,
  Home,
  KeyRound,
  LogOut,
  MapPin,
  Menu,
  Moon,
  Package,
  Plus,
  Receipt,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  CalendarPlus,
  Trophy,
  Users,
  WalletCards,
  type LucideIcon,
  FileSpreadsheet,
} from "lucide-react";
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
  organizationLogo: string | null;
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
  organizationLogo,
  organizations,
  organizationSwitching,
  organizationError,
  onOrganizationChange,
  onLogout,
  theme,
  onThemeToggle,
}: AppLayoutProps) {
  const [sessionMenuOpen, setSessionMenuOpen] = useState(false);
  const [financeMenuOpen, setFinanceMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [mobileNavVisible, setMobileNavVisible] = useState(true);
  const lastScrollYRef = useRef(0);

  type NavItem = {
    to: string;
    label: string;
    icon: LucideIcon;
    end?: boolean;
  };

  const playNavItems: NavItem[] = [
    {
      to: "/calendar",
      label: "Calendar",
      icon: CalendarDays,
    },
    {
      to: "/sessions",
      label: "Sessions",
      icon: CalendarClock,
    },
    {
      to: "/records",
      label: "Records",
      icon: Trophy,
    },
    {
      to: "/participants",
      label: "Players",
      icon: Users,
    },
    {
      to: "/courts",
      label: "Courts",
      icon: MapPin,
    },
  ];

  const financeNavItems: NavItem[] = [
    {
      to: "/outstanding",
      label: "Balance",
      icon: WalletCards,
      end: true,
    },
    {
      to: "/sales",
      label: "Sales",
      icon: Receipt,
    },
    {
      to: "/products",
      label: "Products",
      icon: Package,
    },
    {
      to: "/fee-rules",
      label: "Fee Rules",
      icon: SlidersHorizontal,
    },
    {
      to: "/reports",
      label: "Financial Report",
      icon: FileSpreadsheet,
    },
  ];

  const adminNavItems: NavItem[] = [
    ...(admin.role === "OWNER"
      ? [
          {
            to: "/admin/access",
            label: "Admin Access",
            icon: ShieldCheck,
          },
        ]
      : []),
    {
      to: "/admin/audit-logs",
      label: "Audit Log",
      icon: FileText,
    },
    ...(admin.role === "OWNER" || admin.role === "ADMIN"
      ? [
          {
            to: "/organization-settings",
            label: "Organization Settings",
            icon: Building2,
          },
        ]
      : []),
  ];

  useEffect(() => {
    lastScrollYRef.current = window.scrollY;

    function handleScroll() {
      const currentScrollY = window.scrollY;
      const lastScrollY = lastScrollYRef.current;

      if (currentScrollY <= 20) {
        // Always show the navbar near the top.
        setMobileNavVisible(true);
      } else if (currentScrollY - lastScrollY > 8) {
        // Scrolling down.
        setMobileNavVisible(false);
      } else if (lastScrollY - currentScrollY > 8) {
        // Scrolling up.
        setMobileNavVisible(true);
      }

      lastScrollYRef.current = currentScrollY;
    }

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  function closeMobileMenus() {
    setSessionMenuOpen(false);
    setFinanceMenuOpen(false);
    setMoreMenuOpen(false);
  }

  function handleSessionAction() {
    setFinanceMenuOpen(false);
    setMoreMenuOpen(false);
    setSessionMenuOpen((current) => !current);
  }

  function handleFinanceAction() {
    setSessionMenuOpen(false);
    setMoreMenuOpen(false);
    setFinanceMenuOpen((current) => !current);
  }

  function handleMoreAction() {
    setSessionMenuOpen(false);
    setFinanceMenuOpen(false);
    setMoreMenuOpen((current) => !current);
  }
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-white">
      <div className="flex min-h-screen w-full min-w-0">
        {/* Desktop sidebar */}
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-56 overflow-y-auto border-r border-zinc-200 bg-white px-5 py-6 dark:border-zinc-800 dark:bg-zinc-950 md:flex md:flex-col">
          <div className="border-b border-zinc-200 pb-5 dark:border-zinc-800">
            {/* Organization branding */}
            <div className="flex items-center gap-3">
              {organizationLogo ? (
                <img
                  src={organizationLogo}
                  alt={`${organization?.name ?? "Organization"} logo`}
                  className="h-9 w-9 rounded object-contain"
                />
              ) : (
                <div className="h-9 w-9 rounded border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900" />
              )}

              <span className="truncate text-sm font-semibold">
                {organization?.name ?? "Organization"}
              </span>
            </div>

            {/* Powered by RallyLedger */}
            <div className="mt-2 ml-3 flex items-center gap-1.5">
              <span className="text-[9px] text-zinc-400 dark:text-zinc-500">
                powered by
              </span>

              <img
                src="/branding/login-light-horizontal.png"
                alt="RallyLedger"
                className="h-4 w-auto object-contain opacity-60 dark:hidden"
              />

              <img
                src="/branding/login-dark-horizontal.png"
                alt="RallyLedger"
                className="hidden h-4 w-auto object-contain opacity-60 dark:block"
              />
            </div>
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
                  <CalendarPlus className="h-4 w-4" />
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
                  <CalendarClock className="h-4 w-4" />
                  <span>Training</span>
                </NavLink>

                <NavLink
                  to="/sessions?new=REGULAR_PLAY"
                  onClick={() => setSessionMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  <CalendarDays className="h-4 w-4" />
                  <span>Regular Play</span>
                </NavLink>

                <NavLink
                  to="/sessions?new=OUTSIDER_PLAY"
                  onClick={() => setSessionMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  <Users className="h-4 w-4" />
                  <span>Outsider Play</span>
                </NavLink>

                <NavLink
                  to="/sessions?new=EVENT"
                  onClick={() => setSessionMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  <CalendarDays className="h-4 w-4" />
                  <span>Event</span>
                </NavLink>
              </div>
            )}
          </div>

          <nav className="mt-5 flex flex-1 flex-col">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${
                  isActive
                    ? "bg-zinc-200 font-medium text-zinc-950 dark:bg-zinc-800 dark:text-white"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white"
                }`
              }
            >
              <Home className="h-4 w-4 shrink-0" />
              <span>Home</span>
            </NavLink>

            <div className="mt-6">
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                Play
              </p>

              <div className="space-y-1">
                {playNavItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                          isActive
                            ? "bg-zinc-200 font-medium text-zinc-950 dark:bg-zinc-800 dark:text-white"
                            : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white"
                        }`
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>

            <div className="mt-6">
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                Finance
              </p>

              <div className="space-y-1">
                {financeNavItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                          isActive
                            ? "bg-zinc-200 font-medium text-zinc-950 dark:bg-zinc-800 dark:text-white"
                            : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white"
                        }`
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>

            {adminNavItems.length > 0 && (
              <div className="mt-6">
                <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                  Admin
                </p>

                <div className="space-y-1">
                  {adminNavItems.map((item) => {
                    const Icon = item.icon;

                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        className={({ isActive }) =>
                          `flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                            isActive
                              ? "bg-zinc-200 font-medium text-zinc-950 dark:bg-zinc-800 dark:text-white"
                              : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white"
                          }`
                        }
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            )}
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
              <div className="flex items-center gap-3">
                {organizationLogo ? (
                  <img
                    src={organizationLogo}
                    alt={`${organization?.name ?? "Organization"} logo`}
                    className="h-8 w-8 rounded object-contain"
                  />
                ) : (
                  <div className="h-8 w-8 rounded border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900" />
                )}

                <span>{organization?.name ?? "Organization"}</span>
              </div>
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
              <CalendarPlus className="h-4 w-4" />
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
              <CalendarClock className="h-4 w-4" />
              <span>Training</span>
            </NavLink>

            <NavLink
              to="/sessions?new=REGULAR_PLAY"
              onClick={() => setSessionMenuOpen(false)}
              className="flex min-w-44 items-center gap-3 rounded-full border border-zinc-200 bg-white px-5 py-3 text-sm font-medium text-zinc-900 shadow-lg transition-transform active:scale-95 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            >
              <Calendar className="h-4 w-4" />
              <span>Regular Play</span>
            </NavLink>
            <NavLink
              to="/sessions?new=OUTSIDER_PLAY"
              onClick={() => setSessionMenuOpen(false)}
              className="flex min-w-44 items-center gap-3 rounded-full border border-zinc-200 bg-white px-5 py-3 text-sm font-medium text-zinc-900 shadow-lg transition-transform active:scale-95 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            >
              <Users className="h-4 w-4" />
              <span>Outsider Play</span>
            </NavLink>

            <NavLink
              to="/sessions?new=EVENT"
              onClick={() => setSessionMenuOpen(false)}
              className="flex min-w-44 items-center gap-3 rounded-full border border-zinc-200 bg-white px-5 py-3 text-sm font-medium text-zinc-900 shadow-lg transition-transform active:scale-95 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            >
              <CalendarDays className="h-4 w-4" />
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
            <div className="max-h-[75vh] overflow-y-auto">
              <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                More
              </p>

              <div className="px-1">
                <p className="px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                  Play
                </p>

                {[...playNavItems].map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={closeMobileMenus}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}

                <p className="mt-3 px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                  Commerce
                </p>

                {[
                  {
                    to: "/products",
                    label: "Products",
                    icon: Package,
                  },
                  {
                    to: "/fee-rules",
                    label: "Fee Rules",
                    icon: SlidersHorizontal,
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={closeMobileMenus}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}

                {adminNavItems.length > 0 && (
                  <>
                    <p className="mt-3 px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                      Administration
                    </p>

                    {adminNavItems.map((item) => {
                      const Icon = item.icon;

                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          onClick={closeMobileMenus}
                          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span>{item.label}</span>
                        </NavLink>
                      );
                    })}
                  </>
                )}

                <p className="mt-3 px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                  Account
                </p>

                <NavLink
                  to="/change-password"
                  onClick={closeMobileMenus}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  <KeyRound className="h-4 w-4 shrink-0" />
                  <span>Change Password</span>
                </NavLink>

                <div className="my-2 border-t border-zinc-200 dark:border-zinc-800" />

                <button
                  type="button"
                  onClick={onThemeToggle}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  {theme === "dark" ? (
                    <Moon className="h-4 w-4 shrink-0" />
                  ) : (
                    <Sun className="h-4 w-4 shrink-0" />
                  )}
                  <span>{theme === "dark" ? "Dark mode" : "Light mode"}</span>
                </button>

                <button
                  type="button"
                  onClick={onLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Mobile bottom navigation */}
      <nav
        className={`fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur transition-transform duration-300 ease-out dark:border-zinc-800 dark:bg-zinc-950/95 md:hidden ${
          mobileNavVisible || sessionMenuOpen || financeMenuOpen || moreMenuOpen
            ? "translate-y-0"
            : "translate-y-full"
        }`}
      >
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
            <Home className="h-4 w-4 shrink-0" />
            <span>Home</span>
          </NavLink>

          <NavLink
            to="/calendar"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 text-[11px] ${
                isActive
                  ? "font-medium text-zinc-950 dark:text-white"
                  : "text-zinc-500"
              }`
            }
          >
            <CalendarDays className="h-4 w-4 shrink-0" />
            <span>Calendar</span>
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
                <Plus className="h-4 w-4" />
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleFinanceAction}
            aria-label="Finance"
            aria-expanded={financeMenuOpen}
            className={`flex flex-col items-center justify-center gap-1 text-[11px] ${
              financeMenuOpen
                ? "font-medium text-zinc-950 dark:text-white"
                : "text-zinc-500"
            }`}
          >
            <WalletCards className="h-5 w-5" />
            <span>Finance</span>
          </button>
          {financeMenuOpen && (
            <>
              <button
                type="button"
                aria-label="Close finance menu"
                onClick={closeMobileMenus}
                className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] md:hidden"
              />

              <div className="fixed bottom-20 left-1/2 z-50 w-64 -translate-x-1/2 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 md:hidden">
                <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Finance
                </p>

                <NavLink
                  to="/outstanding"
                  onClick={closeMobileMenus}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  <WalletCards className="h-4 w-4" />
                  <span>Balance</span>
                </NavLink>

                <NavLink
                  to="/sales"
                  onClick={closeMobileMenus}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  <Receipt className="h-4 w-4" />
                  <span>Sales</span>
                </NavLink>
                <NavLink
                  to="/reports"
                  onClick={closeMobileMenus}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Financial Report</span>
                </NavLink>
              </div>
            </>
          )}
          <button
            type="button"
            onClick={handleMoreAction}
            aria-label="More"
            aria-expanded={moreMenuOpen}
            className={`flex flex-col items-center justify-center gap-1 text-[11px] ${
              moreMenuOpen
                ? "font-medium text-zinc-950 dark:text-white"
                : "text-zinc-500"
            }`}
          >
            <Menu className="h-5 w-5" /> <span>More</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

export default AppLayout;
