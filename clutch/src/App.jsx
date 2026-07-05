import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import Orders from './pages/Orders'
import Pricing from './pages/Pricing'
import PriceDashboard from './components/PriceDashboard'
import PartOut from './pages/PartOut'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Marketplaces from './pages/Marketplaces'
import PendingReview from './pages/PendingReview'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen bg-dark-bg flex items-center justify-center">
    <div className="animate-spin w-8 h-8 border-2 border-lego-red border-t-transparent rounded-full" />
  </div>
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  const { user, loading } = useAuth()

  if (loading) return <div className="min-h-screen bg-dark-bg flex items-center justify-center">
    <div className="animate-spin w-8 h-8 border-2 border-lego-red border-t-transparent rounded-full" />
  </div>

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/*" element={
        <PrivateRoute>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/price-dashboard" element={<PriceDashboard />} />
              <Route path="/part-out" element={<PartOut />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/marketplaces" element={<Marketplaces />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/pending" element={<PendingReview />} />
              <Route path="*" element={
                <div className="text-center py-20">
                  <h2 className="text-2xl font-bold text-white mb-2">404</h2>
                  <p className="text-gray-400">Page not found</p>
                </div>
              } />
            </Routes>
          </Layout>
        </PrivateRoute>
      } />
    </Routes>
  )
}
