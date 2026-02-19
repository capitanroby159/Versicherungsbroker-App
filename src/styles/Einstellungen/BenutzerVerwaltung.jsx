// src/components/Einstellungen/BenutzerVerwaltung.jsx
import { useState, useEffect } from 'react'
import BenutzerForm from './BenutzerForm'
import '../Zeiterfassung/Zeiterfassung.css'

const API = 'http://localhost:5000/api'

export default function BenutzerVerwaltung() {
  const [benutzer, setBenutzer] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [filterAktiv, setFilterAktiv] = useState('aktiv')

  useEffect(() => {
    fetchBenutzer()
  }, [])

  const fetchBenutzer = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`${API}/benutzer?alle=1`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) setBenutzer(await res.json())
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handleDeaktivieren = async (id, name) => {
    if (!confirm(`${name} wirklich deaktivieren?`)) return
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`${API}/benutzer/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) { alert('✅ Benutzer deaktiviert'); fetchBenutzer() }
      else alert('❌ Fehler beim Deaktivieren')
    } catch (e) { alert('❌ ' + e.message) }
  }

  const handleReaktivieren = async (user) => {
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`${API}/benutzer/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...user, ist_aktiv: true })
      })
      if (res.ok) { fetchBenutzer() }
    } catch (e) { alert('❌ ' + e.message) }
  }

  const filtered = benutzer.filter(b =>
    filterAktiv === 'alle' ? true : filterAktiv === 'aktiv' ? b.ist_aktiv : !b.ist_aktiv
  )

  const formatDatum = (d) => d ? new Date(d).toLocaleDateString('de-CH') : '—'
  const formatCHF   = (v) => v ? `CHF ${parseFloat(v).toFixed(2)}/h` : '—'

  return (
    <div className="bv-wrap">
      <div className="bv-header">
        <div>
          <h2>👥 Mitarbeiterverwaltung</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>
            Nur Administratoren haben Zugriff auf diesen Bereich
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select
            value={filterAktiv}
            onChange={e => setFilterAktiv(e.target.value)}
            style={{ padding: '7px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }}
          >
            <option value="aktiv">Aktive</option>
            <option value="inaktiv">Inaktive</option>
            <option value="alle">Alle</option>
          </select>
          <button className="ze-btn primary" onClick={() => { setEditUser(null); setShowForm(true) }}>
            + Neuer Mitarbeiter
          </button>
        </div>
      </div>

      {loading ? (
        <div className="ze-empty">⏳ Wird geladen...</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="bv-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>E-Mail</th>
                <th>Funktion</th>
                <th>Stundenansatz</th>
                <th>Rolle</th>
                <th>Letzter Login</th>
                <th>Status</th>
                <th>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 30, color: '#9ca3af' }}>
                    Keine Benutzer gefunden
                  </td>
                </tr>
              ) : filtered.map(b => (
                <tr key={b.id}>
                  <td>
                    <strong>{b.vorname} {b.nachname}</strong>
                  </td>
                  <td style={{ color: '#6b7280', fontSize: 12 }}>{b.email}</td>
                  <td style={{ fontSize: 12 }}>{b.funktion || '—'}</td>
                  <td>
                    <span style={{ fontWeight: 600, color: b.stundenansatz > 0 ? '#059669' : '#9ca3af' }}>
                      {formatCHF(b.stundenansatz)}
                    </span>
                  </td>
                  <td>
                    <span className="bv-rolle-badge">{b.rolle_name || `Rolle ${b.rolle_id}`}</span>
                  </td>
                  <td style={{ fontSize: 12, color: '#6b7280' }}>{formatDatum(b.letzter_login)}</td>
                  <td>
                    <span className={`bv-aktiv-badge ${b.ist_aktiv ? 'aktiv' : 'inaktiv'}`}>
                      {b.ist_aktiv ? '✅ Aktiv' : '⚫ Inaktiv'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="ze-btn-icon edit"
                        title="Bearbeiten"
                        onClick={() => { setEditUser(b); setShowForm(true) }}
                      >✏️</button>
                      {b.ist_aktiv ? (
                        <button
                          className="ze-btn-icon delete"
                          title="Deaktivieren"
                          onClick={() => handleDeaktivieren(b.id, `${b.vorname} ${b.nachname}`)}
                        >🚫</button>
                      ) : (
                        <button
                          className="ze-btn-icon"
                          style={{ background: '#dcfce7', color: '#166534' }}
                          title="Reaktivieren"
                          onClick={() => handleReaktivieren(b)}
                        >✅</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Info */}
      <div style={{ marginTop: 16, padding: '10px 14px', background: '#f8fafc', borderRadius: 6, fontSize: 12, color: '#6b7280', border: '1px solid #e5e7eb' }}>
        ℹ️ Deaktivierte Mitarbeiter können sich nicht mehr einloggen, ihre Zeiterfassungseinträge bleiben aber erhalten.
        Der Stundenansatz wird bei der Erfassung eingefroren — Änderungen hier betreffen nur zukünftige Einträge.
      </div>

      {showForm && (
        <BenutzerForm
          user={editUser}
          onSave={() => { setShowForm(false); setEditUser(null); fetchBenutzer() }}
          onCancel={() => { setShowForm(false); setEditUser(null) }}
        />
      )}
    </div>
  )
}