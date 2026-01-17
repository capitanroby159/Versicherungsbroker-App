import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import KundenTab from './components/KundenTab'
import ImmobildienTab from './components/ImmobildienTab'
import PoliceTab from './components/PoliceTab'
import KundenDetailsPage from './components/KundenDetailsPage'
import './App.css'

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
          </nav>
        </header>

        <main className="main">
          <Routes>
            <Route path="/" element={<KundenTab />} />
            <Route path="/kunden/:id" element={<KundenDetailsPage />} />
            <Route path="/immobilien" element={<ImmobildienTab />} />
            <Route path="/policen" element={<PoliceTab />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App