import { useState, useEffect } from 'react'
import UserManagement from './UserManagement'
import './AdminDashboard.css'

const API_BASE = 'http://localhost:5000'

function AdminDashboard() {
  const [stats, setStats] = useState({
    total: 0,
    aktiv: 0,
    inaktiv: 0,
    admins: 0
  })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`${API_BASE}/api/benutzer?alle=1`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) return
      const data = await res.json()
      setStats({
        total: data.length,
        aktiv: data.filter(u => u.ist_aktiv).length,
        inaktiv: data.filter(u => !u.ist_aktiv).length,
        admins: data.filter(u => u.rolle_id === 1).length
      })
    } catch {
      // Stats sind optional, kein Fehler anzeigen
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>⚙️ Administration</h1>
          <p>Benutzerverwaltung und Systemeinstellungen</p>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="admin-stats-grid">
        <div className="stat-card">
          <div className="stat-card-icon">👥</div>
          <div className="stat-card-info">
            <h3>{stats.total}</h3>
            <p>Benutzer total</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">✅</div>
          <div className="stat-card-info">
            <h3>{stats.aktiv}</h3>
            <p>Aktive Benutzer</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">🚫</div>
          <div className="stat-card-info">
            <h3>{stats.inaktiv}</h3>
            <p>Inaktive Benutzer</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">🔐</div>
          <div className="stat-card-info">
            <h3>{stats.admins}</h3>
            <p>Administratoren</p>
          </div>
        </div>
      </div>

      {/* USER MANAGEMENT */}
      <UserManagement onStatsChange={fetchStats} />
    </div>
  )
}

export default AdminDashboard