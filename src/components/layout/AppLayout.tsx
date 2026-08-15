import { NavLink, Outlet } from "react-router-dom";

function AppLayout() {
  const navItems = [
    { to: "/", label: "Home", icon: "⌂", end: true },
    { to: "/outstanding", label: "Balance", icon: "₱", end: true },
    { to: "/participants", label: "Players", icon: "👥" },
    { to: "/courts", label: "Courts", icon: "🎾" },
    { to: "/sessions", label: "Sessions", icon: "📅" },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-zinc-950 text-white">
      <div className="flex min-h-screen min-w-0">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-zinc-800 p-6 md:block">
          <h1 className="text-2xl font-bold">RallyLedger</h1>

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

        {/* Page content */}
        <main className="min-w-0 flex-1 p-4 pb-24 md:p-8 md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-800 bg-zinc-950 md:hidden">
        <div className="grid grid-cols-5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 py-3 text-xs ${
                  isActive ? "text-white" : "text-zinc-500"
                }`
              }
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

export default AppLayout;