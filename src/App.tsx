import { Route, Routes } from "react-router-dom"
import AppLayout from "./components/layout/AppLayout"
import DashboardPage from "./pages/DashboardPage"
import ParticipantsPage from "./pages/ParticipantsPage"
import SessionsPage from "./pages/SessionsPage";

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/participants" element={<ParticipantsPage />} />
        <Route path="/sessions" element={<SessionsPage />} />
      </Route>
    </Routes>
  )
}

export default App