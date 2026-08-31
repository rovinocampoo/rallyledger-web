import { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";

import {
  getAdminOrganizations,
  getCurrentAdmin,
  logout,
  switchOrganization,
  type AdminUser,
} from "./api/auth";

import type { Organization, OrganizationAccess } from "./types/organization";
import { getCurrentOrganization } from "./api/organization";

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
  const [organizations, setOrganizations] = useState<OrganizationAccess[]>([]);
  const [organizationSwitching, setOrganizationSwitching] = useState(false);
  const [organizationError, setOrganizationError] = useState<string | null>(
    null,
  );
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
          const [currentOrganization, accessibleOrganizations] =
            await Promise.all([
              getCurrentOrganization(),
              getAdminOrganizations(),
            ]);

          if (!ignore) {
            setOrganization(currentOrganization);
            setOrganizations(accessibleOrganizations);
          }
        } catch (err) {
          if (!ignore) {
            console.error("Failed to load organization information", err);
            setOrganization(null);
            setOrganizations([]);
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
      setOrganizations([]);
      setOrganizationError(null);
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
      const [currentOrganization, accessibleOrganizations] = await Promise.all([
        getCurrentOrganization(),
        getAdminOrganizations(),
      ]);

      setOrganization(currentOrganization);
      setOrganizations(accessibleOrganizations);
    } catch (err) {
      console.error("Failed to load organization information", err);
      setOrganization(null);
      setOrganizations([]);
    }
  }

  async function handleLogout() {
    try {
      await logout();
    } catch (err) {
      console.error(err);
    } finally {
      setAdmin(null);
      setOrganizations([]);
      setOrganizationError(null);
      setOrganization(null);
    }
  }

  async function handleOrganizationChange(organizationId: number) {
    if (organizationId === admin?.organizationId) {
      return;
    }

    try {
      setOrganizationSwitching(true);
      setOrganizationError(null);

      await switchOrganization(organizationId);

      const [updatedAdmin, currentOrganization] = await Promise.all([
        getCurrentAdmin(),
        getCurrentOrganization(),
      ]);

      setOrganization(currentOrganization);
      setAdmin(updatedAdmin);
    } catch (err) {
      console.error(err);

      setOrganizationError(
        err instanceof Error ? err.message : "Failed to switch organization",
      );
    } finally {
      setOrganizationSwitching(false);
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
            key={admin.organizationId}
            admin={admin}
            organization={organization}
            organizations={organizations}
            organizationSwitching={organizationSwitching}
            organizationError={organizationError}
            onOrganizationChange={handleOrganizationChange}
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
