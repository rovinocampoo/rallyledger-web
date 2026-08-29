import { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";

import { getCurrentAdmin, logout, type AdminUser } from "./api/auth";

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

    getCurrentAdmin()
      .then((currentAdmin) => {
        if (!ignore) {
          setAdmin(currentAdmin);
        }
      })
      .catch(() => {
        if (!ignore) {
          setAdmin(null);
        }
      })
      .finally(() => {
        if (!ignore) {
          setAuthLoading(false);
        }
      });

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
    }

    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);

    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    };
  }, []);

  async function handleLogout() {
    try {
      await logout();
    } catch (err) {
      console.error(err);
    } finally {
      setAdmin(null);
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
    return <LoginPage onLoggedIn={setAdmin} />;
  }

  return (
    <Routes>
      <Route
        element={
          <AppLayout
            admin={admin}
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
