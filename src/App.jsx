import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import KundenTab from './components/KundenTab'
import ImmobildienTab from './components/ImmobildienTab'
import PoliceTab from './components/PoliceTab'
import KundenDetailsPage from './components/KundenDetailsPage'
import VersichererList from './pages/Versicherer/VersichererList'
import VersichererDetail from './pages/Versicherer/VersichererDetail'
import './App.css'
import TrackingPage from './components/TrackingModule/TrackingPage';

function App() {
  return (
    <Router>
      <div className="app">
        <header className="header">
          <h1>🏢 Broker App</h1>
          <nav className="nav">
  <Link to="/" className="nav-link">Kunden</Link>
  <Link to="/immobilien" className="nav-link">Immobilien</Link>
  <Link to="/policen" className="nav-link">Policen</Link>
  <Link to="/versicherer" className="nav-link">🏢 Versicherer</Link>
  <Link to="/tracking" className="nav-link">📍 Tracking</Link>
</nav>
        </header>

        <main className="main">
          <Routes>
            <Route path="/" element={<KundenTab />} />
            <Route path="/kunden/:id" element={<KundenDetailsPage />} />
            <Route path="/immobilien" element={<ImmobildienTab />} />
            <Route path="/policen" element={<PoliceTab />} />
            <Route path="/versicherer/:id" element={<VersichererDetail />} />
            <Route path="/versicherer" element={<VersichererList />} />
<Route path="/tracking" element={<TrackingPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App