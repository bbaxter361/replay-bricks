// Compass App - Memory Care Activities Manager
// Main application with routing and layout

import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Sidebar from './components/Sidebar';
import ErrorBoundary from './components/ErrorBoundary';
import Dashboard from './pages/Dashboard';
import CalendarPage from './pages/CalendarPage';
import ContactsPage from './pages/ContactsPage';
import ContactDetailPage from './pages/ContactDetailPage';
import ChatPage from './pages/ChatPage';
import BooksPage from './pages/BooksPage';
import ExportDashboard from './pages/ExportDashboard';
import { useStore } from './stores/useStore';

export default function App() {
  const restoreFromBlobs = useStore((s) => s.restoreFromBlobs);

  useEffect(() => {
    // On mount, try to restore data from Netlify Blobs
    // This ensures data survives browser cache clears
    restoreFromBlobs();
  }, [restoreFromBlobs]);
  return (
    <div className="flex min-h-screen bg-dark-bg">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Mobile: Back to Portal button (hidden on desktop where sidebar shows) */}
      <a
        href="https://replaybrick.com/"
        className="fixed top-4 left-20 z-40 lg:hidden inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/90 backdrop-blur-sm border border-violet-200 text-xs font-medium text-violet-600 hover:bg-violet-50 hover:border-violet-300 transition-colors shadow-sm no-print"
        aria-label="Back to Portal"
      >
        <ArrowLeft size={14} />
        <span>Portal</span>
      </a>

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-64 min-h-screen pb-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/contacts/:id" element={<ContactDetailPage />} />
          <Route 
            path="/chat" 
            element={
              <ErrorBoundary>
                <ChatPage />
              </ErrorBoundary>
            } 
          />
          <Route path="/books" element={<BooksPage />} />
          <Route path="/export" element={<ExportDashboard />} />
        </Routes>
      </main>
    </div>
  );
}
