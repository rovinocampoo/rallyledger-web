import { useEffect, useState } from "react"
import { Route, Routes } from "react-router-dom"

import {
  getCurrentAdmin,
  logout,
  type AdminUser,
} from "./api/auth"

import AppLayout from "./components/layout/AppLayout"
import LoginPage from "./pages/LoginPage"
import DashboardPage from "./pages/DashboardPage"
import ParticipantsPage from "./pages/ParticipantsPage"
import SessionsPage from "./pages/SessionsPage"
import OutstandingPage from "./pages/OutstandingPage"
import CourtsPage from "./pages/CourtsPage"
import FeeRulesPage from "./pages/FeeRulesPage"

function App() {
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    let ignore = false

    getCurrentAdmin()
      .then((currentAdmin) => {
        if (!ignore) {
          setAdmin(currentAdmin)
        }
      })
      .catch(() => {
        if (!ignore) {
          setAdmin(null)
        }
      })
      .finally(() => {
        if (!ignore) {
          setAuthLoading(false)
        }
      })

    return () => {
      ignore = true
    }
  }, [])

  async function handleLogout() {
    try {
      await logout()
    } catch (err) {
      console.error(err)
    } finally {
      setAdmin(null)
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">
        Checking session...
      </div>
    )
  }

  if (!admin) {
    return <LoginPage onLoggedIn={setAdmin} />
  }

  return (
    <Routes>
      <Route
        element={
          <AppLayout
            admin={admin}
            onLogout={handleLogout}
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
  )
}

export default App