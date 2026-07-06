import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import Portal from './components/Portal';
import Activities from './pages/Activities';
import Books from './pages/Books';
import Calendar from './pages/Calendar';
import CanvaExports from './pages/CanvaExports';
import Dashboard from './pages/Dashboard';
import FamilyOfResidents from './pages/FamilyOfResidents';
import Games from './pages/Games';
import Residents from './pages/Residents';
import SpringAssistant from './pages/SpringAssistant';
import { AppStateProvider, useAppState } from './state/appState';

function AppRoutes() {
  const { state } = useAppState();

  return (
    <Routes>
      <Route path="/" element={<Portal />} />
      <Route
        path="/app"
        element={state.currentUser ? <AppLayout /> : <Navigate to="/" replace />}
      >
        <Route index element={<Dashboard />} />
        <Route path="spring" element={<SpringAssistant />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="canva" element={<CanvaExports />} />
        <Route path="activities" element={<Activities />} />
        <Route path="residents" element={<Residents />} />
        <Route path="family" element={<FamilyOfResidents />} />
        <Route path="contacts" element={<Navigate to="/app/family" replace />} />
        <Route path="books" element={<Books />} />
        <Route path="games" element={<Games />} />
        <Route path="settings" element={<Navigate to="/app" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AppStateProvider>
      <AppRoutes />
    </AppStateProvider>
  );
}
