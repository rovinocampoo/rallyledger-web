import { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";

import { getCurrentAdmin, logout, type AdminUser } from "./api/auth";
import { getCurrentOrganization } from "./api/organization";
import type { Organization } from "./types/organization";

import AppLayout from "./components/layout/AppLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ParticipantsPage from "./pages/ParticipantsPage";
import SessionsPage from "./pages/SessionsPage";
import OutstandingPage from "./pages/OutstandingPage";
import CourtsPage from "./pages/CourtsPage";
import FeeRulesPage from "./pages/FeeRulesPage";
import { AUTH_EXPIRED_EVENT } from "./api/client";

type Theme = "light" | "dark";

function App() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem("rallyledger-theme");

    if (savedTheme === "light" || savedTheme === "dark") {
      return savedTheme;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  useEffect(() => {
    let ignore = false;

    async function loadCurrentSession() {
      try {
        const currentAdmin = await getCurrentAdmin();

        if (ignore) {
          return;
        }

        setAdmin(currentAdmin);

        try {
          const currentOrganization = await getCurrentOrganization();

          if (!ignore) {
            setOrganization(currentOrganization);
          }
        } catch (err) {
          if (!ignore) {
            console.error("Failed to load organization", err);
            setOrganization(null);
          }
        }
      } catch {
        if (!ignore) {
          setAdmin(null);
          setOrganization(null);
        }
      } finally {
        if (!ignore) {
          setAuthLoading(false);
        }
      }
    }

    void loadCurrentSession();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;

    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("rallyledger-theme", theme);
  }, [theme]);

  useEffect(() => {
    function handleAuthExpired() {
      setAdmin(null);
      setOrganization(null);
    }

    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);

    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    };
  }, []);

  async function handleLoggedIn(loggedInAdmin: AdminUser) {
    setAdmin(loggedInAdmin);

    try {
      const currentOrganization = await getCurrentOrganization();
      setOrganization(currentOrganization);
    } catch (err) {
      console.error("Failed to load organization", err);
      setOrganization(null);
    }
  }

  async function handleLogout() {
    try {
      await logout();
    } catch (err) {
      console.error(err);
    } finally {
      setAdmin(null);
      setOrganization(null);
    }
  }

  function handleThemeToggle() {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-zinc-600 dark:bg-zinc-950 dark:text-zinc-400">
        Checking session...
      </div>
    );
  }

  if (!admin) {
    return <LoginPage onLoggedIn={handleLoggedIn} />;
  }

  return (
    <Routes>
      <Route
        element={
          <AppLayout
            admin={admin}
            organization={organization}
            onLogout={handleLogout}
            theme={theme}
            onThemeToggle={handleThemeToggle}
          />
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/outstanding" element={<OutstandingPage />} />
        <Route path="/participants" element={<ParticipantsPage />} />
        <Route path="/courts" element={<CourtsPage />} />
        <Route path="/sessions" element={<SessionsPage />} />
        <Route path="/fee-rules" element={<FeeRulesPage />} />
      </Route>
    </Routes>
  );
}

export default App;
