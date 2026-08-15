import { NavLink, Outlet } from "react-router-dom";

function AppLayout() {
  const navItems = [
    { to: "/", label: "Home", icon: "🏠", end: true },
    { to: "/outstanding", label: "Balance", icon: "₱", end: true },
    { to: "/participants", label: "Players", icon: "👥" },
    { to: "/courts", label: "Courts", icon: "🎾" },
    { to: "/sessions", label: "Sessions", icon: "📅" },
    { to: "/fee-rules", label: "Fees", icon: "🧾" },
  ];

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-zinc-950 text-white">
      <div className="flex min-h-screen w-full min-w-0">
        <aside className="hidden w-56 shrink-0 overflow-hidden border-r border-zinc-800 bg-zinc-950 px-5 py-6 md:block">
          <h2 className="truncate text-base font-semibold text-zinc-100">
            RallyLedger
          </h2>

          <nav className="mt-8 flex flex-col gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  isActive
                    ? "rounded-lg bg-zinc-800 px-3 py-2 text-white"
                    : "rounded-lg px-3 py-2 text-zinc-400 hover:bg-zinc-900 hover:text-white"
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 overflow-x-hidden p-4 pb-24 md:p-6 md:pb-6 lg:p-8">
          <div className="w-full max-w-none">
            <Outlet />
          </div>
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-800 bg-zinc-950 md:hidden">
        <div className="grid grid-cols-6">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex min-w-0 flex-col items-center justify-center gap-1 px-1 py-3 text-[11px] ${
                  isActive ? "text-white" : "text-zinc-500"
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
