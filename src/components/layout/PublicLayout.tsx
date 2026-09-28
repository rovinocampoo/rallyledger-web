import { NavLink, Outlet } from "react-router-dom";

type PublicLayoutProps = {
  theme: "light" | "dark";
  onThemeToggle: () => void;
};

function PublicLayout({ theme, onThemeToggle }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-white">
      <header className="border-b border-zinc-200 bg-white/95 dark:border-zinc-800 dark:bg-zinc-950/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <NavLink to="/" className="flex items-center">
            <img
              src="/branding/login-light-horizontal.png"
              alt="RallyLedger"
              className="h-6 w-auto dark:hidden"
            />
            <img
              src="/branding/login-dark-horizontal.png"
              alt="RallyLedger"
              className="hidden h-6 w-auto dark:block"
            />
          </NavLink>

          <div className="flex items-center gap-2">
            {/* Desktop links */}
            <nav className="hidden items-center gap-5 text-sm font-medium md:flex">
              <NavLink
                to="/walkthrough"
                className="text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
              >
                Walkthrough
              </NavLink>

              <NavLink
                to="/faq"
                className="text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
              >
                FAQ
              </NavLink>
            </nav>

            {/* Theme toggle - visible on mobile and desktop */}
            <button
              type="button"
              onClick={onThemeToggle}
              aria-label={`Switch to ${
                theme === "dark" ? "light" : "dark"
              } mode`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-300 text-sm text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {theme === "dark" ? "☀" : "☾"}
            </button>

            {/* Sign in - visible on mobile and desktop */}
            <NavLink
              to="/login"
              className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-300"
            >
              Sign in
            </NavLink>
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-6xl px-5 py-10">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <div>
              <img
                src="/branding/login-light-horizontal.png"
                alt="RallyLedger"
                className="h-5 w-auto dark:hidden"
              />
              <img
                src="/branding/login-dark-horizontal.png"
                alt="RallyLedger"
                className="hidden h-5 w-auto dark:block"
              />

              <p className="mt-3 max-w-sm text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                Club management for sessions, participants, matches, charges,
                products, and club records.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-3">
              <NavLink
                to="/walkthrough"
                className="text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
              >
                Walkthrough
              </NavLink>
              <NavLink
                to="/faq"
                className="text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
              >
                FAQ
              </NavLink>
              <NavLink
                to="/privacy"
                className="text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
              >
                Privacy
              </NavLink>
              <NavLink
                to="/terms"
                className="text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
              >
                Terms
              </NavLink>
              <NavLink
                to="/cookies"
                className="text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
              >
                Cookies
              </NavLink>
              <NavLink
                to="/disclaimer"
                className="text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
              >
                Disclaimer
              </NavLink>
            </div>
          </div>

          <div className="mt-8 border-t border-zinc-200 pt-6 text-xs text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
            © {new Date().getFullYear()} RallyLedger. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default PublicLayout;
