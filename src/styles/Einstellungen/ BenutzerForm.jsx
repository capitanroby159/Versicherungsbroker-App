// src/components/Einstellungen/BenutzerForm.jsx
import { useState, useEffect } from 'react'
import '../Zeiterfassung/Zeiterfassung.css'

const API = 'http://localhost:5000/api'

export default function BenutzerForm({ user = null, onSave, onCancel }) {
  const isEdit = !!user

  const [formData, setFormData] = useState({
    vorname:       user?.vorname       || '',
    nachname:      user?.nachname      || '',
    email:         user?.email         || '',
    funktion:      user?.funktion      || '',
    stundenansatz: user?.stundenansatz || '',
    rolle_id:      user?.rolle_id      || 2,
    ist_aktiv:     user?.ist_aktiv     !== undefined ? user.ist_aktiv : true,
    passwort:      '',
    passwort2:     ''
  })

  const [rollen, setRollen] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { fetchRollen() }, [])

  const fetchRollen = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`${API}/benutzer/meta/rollen`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) setRollen(await res.json())
      else {
        // Fallback
        setRollen([
          { id: 1, name: 'Admin' },
          { id: 2, name: 'Broker' },
          { id: 3, name: 'Sachbearbeiter' },
          { id: 4, name: 'Leserecht' }
        ])
      }
    } catch (e) {
      setRollen([
        { id: 1, name: 'Admin' },
        { id: 2, name: 'Broker' },
        { id: 3, name: 'Sachbearbeiter' },
        { id: 4, name: 'Leserecht' }
      ])
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const validate = () => {
    if (!formData.vorname.trim()) return 'Vorname ist erforderlich'
    if (!formData.nachname.trim()) return 'Nachname ist erforderlich'
    if (!formData.email.trim()) return 'E-Mail ist erforderlich'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return 'Ungültige E-Mail-Adresse'
    if (!isEdit && !formData.passwort) return 'Passwort ist erforderlich'
    if (formData.passwort && formData.passwort.length < 8) return 'Passwort muss mindestens 8 Zeichen haben'
    if (formData.passwort && formData.passwort !== formData.passwort2) return 'Passwörter stimmen nicht überein'
    if (formData.stundenansatz && parseFloat(formData.stundenansatz) < 0) return 'Stundenansatz muss positiv sein'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }

    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('auth_token')
      const url = isEdit ? `${API}/benutzer/${user.id}` : `${API}/benutzer`
      const method = isEdit ? 'PUT' : 'POST'

      const body = {
        vorname: formData.vorname.trim(),
        nachname: formData.nachname.trim(),
        email: formData.email.trim().toLowerCase(),
        funktion: formData.funktion.trim() || null,
        stundenansatz: formData.stundenansatz ? parseFloat(formData.stundenansatz) : 0,
        rolle_id: parseInt(formData.rolle_id),
        ist_aktiv: formData.ist_aktiv
      }

      if (formData.passwort) body.passwort = formData.passwort

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.message || 'Fehler beim Speichern')
      }

      onSave()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ze-modal-overlay" onClick={onCancel}>
      <div className="ze-modal" onClick={e => e.stopPropagation()}>
        <div className="ze-modal-header">
          <h3>{isEdit ? '✏️ Mitarbeiter bearbeiten' : '👤 Neuer Mitarbeiter'}</h3>
          <button className="ze-modal-close" onClick={onCancel}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="ze-modal-body">

            {/* Name */}
            <div className="ze-form-row">
              <div className="ze-form-group">
                <label>Vorname <span className="required">*</span></label>
                <input name="vorname" value={formData.vorname} onChange={handleChange} placeholder="z.B. Roberto" required />
              </div>
              <div className="ze-form-group">
                <label>Nachname <span className="required">*</span></label>
                <input name="nachname" value={formData.nachname} onChange={handleChange} placeholder="z.B. Valentini" required />
              </div>
            </div>

            {/* Email */}
            <div className="ze-form-group">
              <label>E-Mail <span className="required">*</span></label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="roberto@broker.ch" required />
            </div>

            {/* Funktion + Stundenansatz */}
            <div className="ze-form-row">
              <div className="ze-form-group">
                <label>Funktion</label>
                <input name="funktion" value={formData.funktion} onChange={handleChange} placeholder="z.B. Senior Broker" />
              </div>
              <div className="ze-form-group">
                <label>💰 Stundenansatz (CHF/h)</label>
                <input
                  type="number"
                  name="stundenansatz"
                  value={formData.stundenansatz}
                  onChange={handleChange}
                  placeholder="0.00"
                  min="0"
                  step="0.50"
                />
                <span className="ze-form-hint">
                  Wird bei Zeiterfassung eingefroren. Änderungen betreffen nur zukünftige Einträge.
                </span>
              </div>
            </div>

            {/* Rolle + Status */}
            <div className="ze-form-row">
              <div className="ze-form-group">
                <label>Rolle <span className="required">*</span></label>
                <select name="rolle_id" value={formData.rolle_id} onChange={handleChange}>
                  {rollen.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              {isEdit && (
                <div className="ze-form-group">
                  <label>Status</label>
                  <select name="ist_aktiv" value={formData.ist_aktiv ? 'true' : 'false'} onChange={e => setFormData(prev => ({ ...prev, ist_aktiv: e.target.value === 'true' }))}>
                    <option value="true">✅ Aktiv</option>
                    <option value="false">⚫ Inaktiv</option>
                  </select>
                </div>
              )}
            </div>

            {/* Passwort */}
            <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 8, padding: '14px 16px', marginTop: 4 }}>
              <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: '#374151' }}>
                🔒 {isEdit ? 'Passwort ändern (leer lassen = unverändert)' : 'Passwort festlegen'}
              </p>
              <div className="ze-form-row">
                <div className="ze-form-group" style={{ marginBottom: 0 }}>
                  <label>{isEdit ? 'Neues Passwort' : 'Passwort'} {!isEdit && <span className="required">*</span>}</label>
                  <input
                    type="password"
                    name="passwort"
                    value={formData.passwort}
                    onChange={handleChange}
                    placeholder="Min. 8 Zeichen"
                    autoComplete="new-password"
                  />
                </div>
                <div className="ze-form-group" style={{ marginBottom: 0 }}>
                  <label>Passwort bestätigen</label>
                  <input
                    type="password"
                    name="passwort2"
                    value={formData.passwort2}
                    onChange={handleChange}
                    placeholder="Wiederholen"
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div style={{ marginTop: 12, background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '10px 14px', borderRadius: 6, fontSize: 13 }}>
                ❌ {error}
              </div>
            )}
          </div>

          <div className="ze-modal-footer">
            <button type="button" className="ze-btn secondary" onClick={onCancel}>Abbrechen</button>
            <button type="submit" className="ze-btn primary" disabled={loading}>
              {loading ? '⏳ Wird gespeichert...' : isEdit ? '💾 Aktualisieren' : '✓ Erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}