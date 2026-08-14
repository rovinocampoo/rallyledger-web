import { NavLink, Outlet } from "react-router-dom";

function AppLayout() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="flex min-h-screen">
        <aside className="w-64 border-r border-zinc-800 p-6">
          <h1 className="text-2xl font-bold">RallyLedger</h1>

          <nav className="mt-8 flex flex-col gap-2">
            <nav className="mt-8 flex flex-col gap-2">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  isActive
                    ? "rounded-lg bg-zinc-800 px-3 py-2 text-white"
                    : "rounded-lg px-3 py-2 text-zinc-400 hover:bg-zinc-900 hover:text-white"
                }
              >
                Dashboard
              </NavLink>

              <NavLink
                to="/participants"
                className={({ isActive }) =>
                  isActive
                    ? "rounded-lg bg-zinc-800 px-3 py-2 text-white"
                    : "rounded-lg px-3 py-2 text-zinc-400 hover:bg-zinc-900 hover:text-white"
                }
              >
                Participants
              </NavLink>
              <NavLink
                to="/sessions"
                className={({ isActive }) =>
                  isActive
                    ? "rounded-lg bg-zinc-800 px-3 py-2 text-white"
                    : "rounded-lg px-3 py-2 text-zinc-400 hover:bg-zinc-900 hover:text-white"
                }
              >
                Sessions
              </NavLink>
            </nav>
          </nav>
        </aside>

        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
