// src/components/Zeiterfassung/ZeiterfassungForm.jsx
import { useState, useEffect } from 'react'
import './Zeiterfassung.css'

const API = 'http://localhost:5000/api'

const SCHNELL_ZEITEN = [15, 30, 45, 60, 90, 120]

export default function ZeiterfassungForm({ kundeId, eintrag = null, onSave, onCancel }) {
  const isEdit = !!eintrag

  const heute = new Date().toISOString().split('T')[0]

  const [formData, setFormData] = useState({
    datum: eintrag?.datum?.split('T')[0] || heute,
    mitarbeiter_id: eintrag?.mitarbeiter_id || '',
    zeit_minuten: eintrag?.zeit_minuten || 30,
    sparte_id: eintrag?.sparte_id || '',
    art: eintrag?.art || 'Anruf',
    aktivitaet: eintrag?.aktivitaet || ''
  })

  const [mitarbeiter, setMitarbeiter] = useState([])
  const [sparten, setSparten] = useState([])
  const [selectedMitarbeiter, setSelectedMitarbeiter] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchMitarbeiter()
    fetchSparten()
  }, [])

  useEffect(() => {
    if (formData.mitarbeiter_id && mitarbeiter.length > 0) {
      const m = mitarbeiter.find(m => m.id === parseInt(formData.mitarbeiter_id))
      setSelectedMitarbeiter(m || null)
    } else {
      setSelectedMitarbeiter(null)
    }
  }, [formData.mitarbeiter_id, mitarbeiter])

  const fetchMitarbeiter = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`${API}/benutzer`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setMitarbeiter(data)
        // Aktuellen User vorauswählen (aus Token)
        if (!isEdit && data.length > 0) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]))
            const currentUser = data.find(m => m.id === payload.id || m.id === payload.userId)
            if (currentUser) {
              setFormData(prev => ({ ...prev, mitarbeiter_id: currentUser.id }))
            }
          } catch (e) { /* ignore */ }
        }
      }
    } catch (e) { console.error('Mitarbeiter laden:', e) }
  }

  const fetchSparten = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`${API}/sparten`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) setSparten(await res.json())
    } catch (e) { console.error('Sparten laden:', e) }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.mitarbeiter_id) { setError('Bitte Mitarbeiter auswählen'); return }
    if (!formData.datum)          { setError('Bitte Datum angeben'); return }
    if (!formData.zeit_minuten || formData.zeit_minuten <= 0) { setError('Bitte gültige Zeit angeben'); return }

    setLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      const url = isEdit
        ? `${API}/zeiterfassung/${eintrag.id}`
        : `${API}/zeiterfassung`
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          kunde_id: kundeId,
          mitarbeiter_id: parseInt(formData.mitarbeiter_id),
          zeit_minuten: parseInt(formData.zeit_minuten),
          sparte_id: formData.sparte_id ? parseInt(formData.sparte_id) : null
        })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'Fehler beim Speichern')
      }

      onSave()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const kosten = selectedMitarbeiter && formData.zeit_minuten
    ? ((parseInt(formData.zeit_minuten) / 60) * (selectedMitarbeiter.stundenansatz || 0)).toFixed(2)
    : null

  return (
    <div className="ze-modal-overlay" onClick={onCancel}>
      <div className="ze-modal" onClick={e => e.stopPropagation()}>
        <div className="ze-modal-header">
          <h3>{isEdit ? '✏️ Eintrag bearbeiten' : '⏱ Neue Zeiterfassung'}</h3>
          <button className="ze-modal-close" onClick={onCancel}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="ze-modal-body">

            {/* Datum + Mitarbeiter */}
            <div className="ze-form-row">
              <div className="ze-form-group">
                <label>Datum <span className="required">*</span></label>
                <input type="date" name="datum" value={formData.datum} onChange={handleChange} required />
              </div>
              <div className="ze-form-group">
                <label>Mitarbeiter <span className="required">*</span></label>
                <select name="mitarbeiter_id" value={formData.mitarbeiter_id} onChange={handleChange} required>
                  <option value="">-- Auswählen --</option>
                  {mitarbeiter.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.vorname} {m.nachname}{m.funktion ? ` (${m.funktion})` : ''}
                    </option>
                  ))}
                </select>
                {selectedMitarbeiter && (
                  <div className="ze-form-hint ze-ansatz-preview">
                    💰 Stundenansatz: CHF {parseFloat(selectedMitarbeiter.stundenansatz || 0).toFixed(2)}/h
                  </div>
                )}
              </div>
            </div>

            {/* Zeit */}
            <div className="ze-form-group">
              <label>Zeit <span className="required">*</span></label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                {SCHNELL_ZEITEN.map(t => (
                  <button
                    key={t}
                    type="button"
                    className={`ze-periode-btn${parseInt(formData.zeit_minuten) === t ? ' active' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, zeit_minuten: t }))}
                  >
                    {t >= 60 ? `${t/60}h` : `${t}'`}
                  </button>
                ))}
                <input
                  type="number"
                  name="zeit_minuten"
                  value={formData.zeit_minuten}
                  onChange={handleChange}
                  min="1"
                  max="999"
                  style={{ width: 80, padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }}
                  placeholder="Min"
                />
                <span style={{ fontSize: 12, color: '#6b7280' }}>Minuten</span>
              </div>
              {kosten && (
                <div className="ze-ansatz-preview" style={{ marginTop: 6 }}>
                  ≈ CHF {kosten} (bei CHF {parseFloat(selectedMitarbeiter.stundenansatz || 0).toFixed(2)}/h)
                </div>
              )}
            </div>

            {/* Sparte + Art */}
            <div className="ze-form-row">
              <div className="ze-form-group">
                <label>Sparte</label>
                <select name="sparte_id" value={formData.sparte_id} onChange={handleChange}>
                  <option value="">Allgemein</option>
                  {sparten.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="ze-form-group">
                <label>Art <span className="required">*</span></label>
                <select name="art" value={formData.art} onChange={handleChange} required>
                  <option value="Anruf">📞 Anruf</option>
                  <option value="Korrespondenz">📧 Korrespondenz</option>
                  <option value="Administration">🗂️ Administration</option>
                  <option value="Termin">📅 Termin</option>
                  <option value="Fahrt">🚗 Fahrt</option>
                </select>
              </div>
            </div>

            {/* Aktivität */}
            <div className="ze-form-group">
              <label>Aktivität / Beschreibung</label>
              <textarea
                name="aktivitaet"
                value={formData.aktivitaet}
                onChange={handleChange}
                placeholder="Was wurde besprochen / erledigt?"
                rows={3}
              />
            </div>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '10px 14px', borderRadius: 6, fontSize: 13 }}>
                ❌ {error}
              </div>
            )}
          </div>

          <div className="ze-modal-footer">
            <button type="button" className="ze-btn secondary" onClick={onCancel}>Abbrechen</button>
            <button type="submit" className="ze-btn primary" disabled={loading}>
              {loading ? '⏳ Wird gespeichert...' : isEdit ? '💾 Aktualisieren' : '✓ Erfassen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}