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
import KundenDetailsPage from './components/KundenDetailsPage'
import VersichererList from './pages/Versicherer/VersichererList'
import VersichererDetail from './pages/Versicherer/VersichererDetail'
import AdminDashboard from './pages/Admin/AdminDashboard'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<Layout />}>
            <Route path="/" element={<ProtectedRoute><KundenTab /></ProtectedRoute>} />
            <Route path="/kunden/:id" element={<ProtectedRoute><KundenDetailsPage /></ProtectedRoute>} />
            <Route path="/immobilien" element={<ProtectedRoute><ImmobildienTab /></ProtectedRoute>} />
            <Route path="/policen" element={<ProtectedRoute><PolicenTab /></ProtectedRoute>} />
            <Route path="/versicherer" element={<ProtectedRoute><VersichererList /></ProtectedRoute>} />
            <Route path="/versicherer/:id" element={<ProtectedRoute><VersichererDetail /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App