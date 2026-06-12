import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

function ExternalRedirect({ to }) {
  useEffect(() => { window.location.href = to; }, [to]);
  return null;
}
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Products from './components/Products';
import Marketplaces from './components/Marketplaces';
import LegoNews from './components/LegoNews';
import Newsletter from './components/Newsletter';
import Social from './components/Social';
import Contact from './components/Contact';
import Footer from './components/Footer';
import BrickBackground from './components/BrickBackground';
import LoginPage from './pages/LoginPage';
import PortalPage from './pages/PortalPage';
import CompassPage from './pages/CompassPage';
import GamesPage from './pages/GamesPage';
import BaxterFamilyPage from './pages/BaxterFamilyPage';
import NewsletterEditor from './pages/NewsletterEditor';

function HomePage() {
  const [currentSection, setCurrentSection] = useState('hero');

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['hero', 'news', 'products', 'marketplaces', 'about', 'newsletter', 'contact'];
      const scrollPos = window.scrollY + 200;

      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i]);
        if (el && el.offsetTop <= scrollPos) {
          setCurrentSection(sections[i]);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative min-h-screen">
      <BrickBackground />
      <Navbar currentSection={currentSection} showLogin />
      <main>
        <Hero />
        <LegoNews />
        <Products />
        <Marketplaces />
        <About />
        <Newsletter />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('replay_user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('replay_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('replay_user');
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to="/portal" replace />
            ) : (
              <LoginPage onLogin={handleLogin} />
            )
          }
        />
        <Route
          path="/portal"
          element={
            user ? (
              <PortalPage user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/inventory"
          element={<Redirect to="https://replaybrick.com/hold/" />}
        />
        <Route
          path="/compass"
          element={
            user ? (
              <CompassPage user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/games"
          element={
            user ? (
              <GamesPage user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/baxter-family"
          element={
            user ? (
              <BaxterFamilyPage user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/newsletter-editor"
          element={
            user ? (
              <NewsletterEditor user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
