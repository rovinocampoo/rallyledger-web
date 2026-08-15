import { Route, Routes } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import ParticipantsPage from "./pages/ParticipantsPage";
import SessionsPage from "./pages/SessionsPage";
import OutstandingPage from "./pages/OutstandingPage";
import CourtsPage from "./pages/CourtsPage";
import FeeRulesPage from "./pages/FeeRulesPage";


function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
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
