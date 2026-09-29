import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import {
  getAdminOrganizations,
  getCurrentAdmin,
  logout,
  switchOrganization,
  type AdminUser,
} from "./api/auth";

import type { Organization, OrganizationAccess } from "./types/organization";
import {
  getCurrentOrganization,
  getOrganizationLogo,
} from "./api/organization";
import { blobToDataUrl } from "./utils/image";

import AppLayout from "./components/layout/AppLayout";
import PublicLayout from "./components/layout/PublicLayout";
import LandingPage from "./pages/public/LandingPage";
import WalkthroughPage from "./pages/public/WalkthroughPage";
import FaqPage from "./pages/public/FaqPage";
import PrivacyPage from "./pages/public/PrivacyPage";
import TermsPage from "./pages/public/TermsPage";
import CookiesPage from "./pages/public/CookiesPage";
import DisclaimerPage from "./pages/public/DisclaimerPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ParticipantsPage from "./pages/ParticipantsPage";
import SessionsPage from "./pages/SessionsPage";
import OutstandingPage from "./pages/OutstandingPage";
import CourtsPage from "./pages/CourtsPage";
import ProductsPage from "./pages/ProductsPage";
import FeeRulesPage from "./pages/FeeRulesPage";
import AdminAccessPage from "./pages/AdminAccessPage";
import OrganizationSettingsPage from "./pages/OrganizationSettingsPage";
import AuditLogPage from "./pages/AuditLogPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import { AUTH_EXPIRED_EVENT } from "./api/client";
import CalendarPage from "./pages/CalendarPage";
import AppLoadingScreen from "./components/ui/AppLoadingScreen";
import SalesPage from "./pages/SalesPage";
import RecordsPage from "./pages/RecordsPage";

type Theme = "light" | "dark";

function App() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [organizationLogo, setOrganizationLogo] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<OrganizationAccess[]>([]);
  const [organizationSwitching, setOrganizationSwitching] = useState(false);
  const [organizationError, setOrganizationError] = useState<string | null>(
    null,
  );
  const [authLoading, setAuthLoading] = useState(true);
  const navigate = useNavigate();
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem("rallyledger-theme");

    if (savedTheme === "light" || savedTheme === "dark") {
      return savedTheme;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  async function loadOrganizationBranding(organizationId: number) {
    try {
      const logoBlob = await getOrganizationLogo();

      if (!logoBlob) {
        setOrganizationLogo(null);
        return;
      }

      setOrganizationLogo(await blobToDataUrl(logoBlob));
    } catch (err) {
      console.error(
        `Failed to load logo for organization ${organizationId}`,
        err,
      );
      setOrganizationLogo(null);
    }
  }

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

          await loadOrganizationBranding(currentOrganization.id);

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
      setOrganizationLogo(null);
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

      await loadOrganizationBranding(currentOrganization.id);
    } catch (err) {
      console.error("Failed to load organization information", err);

      setOrganization(null);
      setOrganizations([]);
      setOrganizationLogo(null);
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
      setOrganizationLogo(null);
    }
  }
  async function handleOrganizationChange(organizationId: number) {
    if (organizationId === admin?.organizationId) {
      return;
    }

    try {
      setOrganizationSwitching(true);
      setOrganizationError(null);

      // Immediately remove the previous organization's branding.
      setOrganizationLogo(null);

      await switchOrganization(organizationId);

      const [updatedAdmin, currentOrganization] = await Promise.all([
        getCurrentAdmin(),
        getCurrentOrganization(),
      ]);

      setAdmin(updatedAdmin);
      setOrganization(currentOrganization);

      await loadOrganizationBranding(currentOrganization.id);
    } catch (err) {
      console.error(err);

      setOrganizationError(
        err instanceof Error ? err.message : "Failed to switch organization",
      );
      setOrganizationLogo(null);
    } finally {
      setOrganizationSwitching(false);
    }
  }

  function handleThemeToggle() {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }

  if (authLoading) {
    return <AppLoadingScreen />;
  }
  if (!admin) {
    return (
      <Routes>
        <Route
          element={
            <PublicLayout theme={theme} onThemeToggle={handleThemeToggle} />
          }
        >
          <Route path="/" element={<LandingPage />} />
          <Route path="/walkthrough" element={<WalkthroughPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/cookies" element={<CookiesPage />} />
          <Route path="/disclaimer" element={<DisclaimerPage />} />
        </Route>

        <Route
          path="/login"
          element={<LoginPage onLoggedIn={handleLoggedIn} />}
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }
  if (admin.mustChangePassword) {
    return (
      <ChangePasswordPage
        forced
        onPasswordChanged={() => {
          setAdmin(null);
          setOrganizations([]);
          setOrganization(null);
          setOrganizationError(null);
        }}
      />
    );
  }

  return (
    <Routes>
      <Route
        element={
          <PublicLayout theme={theme} onThemeToggle={handleThemeToggle} />
        }
      >
        <Route path="/walkthrough" element={<WalkthroughPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/cookies" element={<CookiesPage />} />
        <Route path="/disclaimer" element={<DisclaimerPage />} />
      </Route>

      <Route path="/login" element={<Navigate to="/" replace />} />

      <Route
        element={
          <AppLayout
            key={admin.organizationId}
            admin={admin}
            organization={organization}
            organizationLogo={organizationLogo}
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
        <Route
          path="/outstanding"
          element={
            <OutstandingPage
              admin={admin}
              organization={organization}
              organizationLogo={organizationLogo}
            />
          }
        />
        <Route
          path="/participants"
          element={
            <ParticipantsPage
              admin={admin}
              organization={organization}
              organizationLogo={organizationLogo}
            />
          }
        />
        <Route path="/records" element={<RecordsPage />} />
        <Route path="/courts" element={<CourtsPage admin={admin} />} />
        <Route path="/products" element={<ProductsPage admin={admin} />} />
        <Route path="/sales" element={<SalesPage admin={admin} />} />
        <Route
          path="/sessions"
          element={
            <SessionsPage
              admin={admin}
              organization={organization}
              organizationLogo={organizationLogo}
            />
          }
        />
        <Route path="/fee-rules" element={<FeeRulesPage admin={admin} />} />
        <Route
          path="/change-password"
          element={
            <ChangePasswordPage
              onPasswordChanged={() => {
                setAdmin(null);
                setOrganizations([]);
                setOrganization(null);
                setOrganizationError(null);
              }}
            />
          }
        />
        {admin.role === "OWNER" && (
          <Route
            path="/admin/access"
            element={<AdminAccessPage admin={admin} />}
          />
        )}
        <Route path="/admin/audit-logs" element={<AuditLogPage />} />
        <Route
          path="/calendar"
          element={
            <CalendarPage
              onSessionSelected={(session) => {
                navigate(`/sessions?session=${session.id}`);
              }}
              onMatchSelected={(match) => {
                navigate(
                  `/sessions?session=${match.sessionId}&match=${match.id}`,
                );
              }}
            />
          }
        />
        <Route
          path="/organization-settings"
          element={
            <OrganizationSettingsPage
              admin={admin}
              organization={organization}
              organizationLogo={organizationLogo}
              onOrganizationChanged={setOrganization}
              onLogoChanged={() =>
                loadOrganizationBranding(admin.organizationId)
              }
            />
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
