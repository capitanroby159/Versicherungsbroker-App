import './styles/globals.css'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/Auth/ProtectedRoute'
import LoginPage from './pages/Auth/LoginPage'
import Layout from './components/Layout/Layout'

// Pages
import KundenTab from './components/KundenTab'
import ImmobildienTab from './components/ImmobildienTab'
import PolicenTab from './components/PolicenTab'
import KundenDetailsPage from './components/KundenDetailsPage'  // ← HIER
import FirmenDetailsPage from './components/FirmenDetailsPage'  // ← HIER auch components!
import VersichererList from './pages/Versicherer/VersichererList'
import VersichererDetail from './pages/Versicherer/VersichererDetail'
import TrackingPage from './components/TrackingModule/TrackingPage'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* PUBLIC ROUTES */}
          <Route path="/login" element={<LoginPage />} />

          {/* PROTECTED ROUTES */}
          <Route element={<Layout />}>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <KundenTab />
                </ProtectedRoute>
              }
            />
            
            {/* WICHTIG: /kunden/firma/:id MUSS VOR /kunden/:id kommen! */}
            <Route
              path="/kunden/firma/:id"
              element={
                <ProtectedRoute>
                  <FirmenDetailsPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/kunden/:id"
              element={
                <ProtectedRoute>
                  <KundenDetailsPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/immobilien"
              element={
                <ProtectedRoute>
                  <ImmobildienTab />
                </ProtectedRoute>
              }
            />
            <Route
              path="/policen"
              element={
                <ProtectedRoute>
                  <PolicenTab />
                </ProtectedRoute>
              }
            />
            <Route
              path="/versicherer"
              element={
                <ProtectedRoute>
                  <VersichererList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/versicherer/:id"
              element={
                <ProtectedRoute>
                  <VersichererDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tracking"
              element={
                <ProtectedRoute>
                  <TrackingPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App