// Compass App - Memory Care Activities Manager
// Main application with routing and layout

import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import CalendarPage from './pages/CalendarPage';
import ContactsPage from './pages/ContactsPage';
import ContactDetailPage from './pages/ContactDetailPage';
import ChatPage from './pages/ChatPage';
import BooksPage from './pages/BooksPage';

export default function App() {
  return (
    <div className="flex min-h-screen bg-dark-bg">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <main className="flex-1 lg:ml-64 min-h-screen pb-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/contacts/:id" element={<ContactDetailPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/books" element={<BooksPage />} />
        </Routes>
      </main>
    </div>
  );
}
