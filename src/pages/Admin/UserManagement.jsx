import { useState, useEffect } from 'react'
import UserForm from './UserForm'
import './AdminDashboard.css'

const API_BASE = 'http://localhost:5000'

function UserManagement() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('aktiv') // 'aktiv' | 'inaktiv' | 'alle'
  const [showForm, setShowForm] = useState(false)
  const [editUser, setEditUser] = useState(null)

  useEffect(() => {
    fetchUsers()
  }, [filterStatus])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem('auth_token')
      const url = filterStatus === 'alle'
        ? `${API_BASE}/api/benutzer?alle=1`
        : `${API_BASE}/api/benutzer`

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()

      // Filter inaktiv clientseitig wenn nötig
      if (filterStatus === 'inaktiv') {
        setUsers(data.filter(u => !u.ist_aktiv))
      } else {
        setUsers(data)
      }
    } catch (err) {
      setError('Fehler beim Laden der Benutzer: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeactivate = async (user) => {
    const action = user.ist_aktiv ? 'deaktivieren' : 'reaktivieren'
    if (!confirm(`Möchten Sie ${user.vorname} ${user.nachname} wirklich ${action}?`)) return

    try {
      const token = localStorage.getItem('auth_token')

      if (user.ist_aktiv) {
        // Deaktivieren via DELETE (soft delete)
        const res = await fetch(`${API_BASE}/api/benutzer/${user.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (!res.ok) throw new Error('Fehler beim Deaktivieren')
      } else {
        // Reaktivieren via PUT
        const res = await fetch(`${API_BASE}/api/benutzer/${user.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ ...user, ist_aktiv: 1 })
        })
        if (!res.ok) throw new Error('Fehler beim Reaktivieren')
      }

      fetchUsers()
    } catch (err) {
      alert('❌ ' + err.message)
    }
  }

  const handleEdit = (user) => {
    setEditUser(user)
    setShowForm(true)
  }

  const handleNew = () => {
    setEditUser(null)
    setShowForm(true)
  }

  const handleSaveSuccess = () => {
    setShowForm(false)
    setEditUser(null)
    fetchUsers()
  }

  const getRolleBadge = (rolleName, rolleId) => {
    const classMap = { 1: 'admin', 2: 'broker', 3: 'sachbearbeiter' }
    const cls = classMap[rolleId] || 'default'
    return <span className={`role-badge ${cls}`}>{rolleName || `Rolle ${rolleId}`}</span>
  }

  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase()
    return (
      u.vorname?.toLowerCase().includes(q) ||
      u.nachname?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.funktion?.toLowerCase().includes(q)
    )
  })

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    try {
      return new Date(dateString).toLocaleDateString('de-CH', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      })
    } catch { return '-' }
  }

  return (
    <>
      <div className="user-management-container">
        <div className="user-management-toolbar">
          <h2>👥 Benutzerverwaltung</h2>
          <div className="toolbar-right">
            <input
              type="text"
              className="search-input"
              placeholder="🔍 Name, E-Mail, Funktion..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select
              className="filter-select"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="aktiv">Aktive</option>
              <option value="inaktiv">Inaktive</option>
              <option value="alle">Alle</option>
            </select>
            <button className="btn-primary" onClick={handleNew}>
              + Neuer Benutzer
            </button>
          </div>
        </div>

        {loading && <div className="loading-state">⏳ Lade Benutzer...</div>}

        {error && <div className="error-state">❌ {error}</div>}

        {!loading && !error && (
          <>
            {filteredUsers.length === 0 ? (
              <div className="empty-state">
                <p>Keine Benutzer gefunden</p>
              </div>
            ) : (
              <table className="user-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>E-Mail</th>
                    <th>Funktion</th>
                    <th>CHF/h</th>
                    <th>Rolle</th>
                    <th>Letzter Login</th>
                    <th>Status</th>
                    <th>Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id}>
                      <td>
                        <div className="user-name-cell">
                          <strong>{user.vorname} {user.nachname}</strong>
                          <span>ID #{user.id}</span>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>{user.funktion || '-'}</td>
                      <td>
                        {user.stundenansatz
                          ? `CHF ${parseFloat(user.stundenansatz).toFixed(2)}`
                          : '-'
                        }
                      </td>
                      <td>{getRolleBadge(user.rolle_name, user.rolle_id)}</td>
                      <td style={{ fontSize: '13px', color: '#64748b' }}>
                        {formatDate(user.letzter_login)}
                      </td>
                      <td>
                        <span className={`status-badge ${user.ist_aktiv ? 'aktiv' : 'inaktiv'}`}>
                          {user.ist_aktiv ? 'Aktiv' : 'Inaktiv'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn-edit" onClick={() => handleEdit(user)}>
                            ✏️ Bearbeiten
                          </button>
                          <button className="btn-danger" onClick={() => handleDeactivate(user)}>
                            {user.ist_aktiv ? '🚫 Deaktivieren' : '✅ Reaktivieren'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>

      {showForm && (
        <UserForm
          user={editUser}
          onCancel={() => { setShowForm(false); setEditUser(null) }}
          onSaveSuccess={handleSaveSuccess}
        />
      )}
    </>
  )
}

export default UserManagement