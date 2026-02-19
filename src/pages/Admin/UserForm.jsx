import { useState, useEffect } from 'react'

const API_BASE = 'http://localhost:5000'

function UserForm({ user, onCancel, onSaveSuccess }) {
  const isEdit = !!user

  const [formData, setFormData] = useState({
    vorname: '',
    nachname: '',
    email: '',
    funktion: '',
    stundenansatz: '',
    rolle_id: 2,
    ist_aktiv: 1,
    passwort: '',
    passwort_confirm: ''
  })
  const [rollen, setRollen] = useState([])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetchRollen()
    if (user) {
      setFormData({
        vorname: user.vorname || '',
        nachname: user.nachname || '',
        email: user.email || '',
        funktion: user.funktion || '',
        stundenansatz: user.stundenansatz || '',
        rolle_id: user.rolle_id || 2,
        ist_aktiv: user.ist_aktiv ?? 1,
        passwort: '',
        passwort_confirm: ''
      })
    }
  }, [user])

  const fetchRollen = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`${API_BASE}/api/benutzer/meta/rollen`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setRollen(data)
      } else {
        // Fallback
        setRollen([
          { id: 1, name: 'Admin' },
          { id: 2, name: 'Broker' },
          { id: 3, name: 'Sachbearbeiter' },
          { id: 4, name: 'Leserecht' }
        ])
      }
    } catch {
      setRollen([
        { id: 1, name: 'Admin' },
        { id: 2, name: 'Broker' },
        { id: 3, name: 'Sachbearbeiter' },
        { id: 4, name: 'Leserecht' }
      ])
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.vorname.trim()) newErrors.vorname = 'Pflichtfeld'
    if (!formData.nachname.trim()) newErrors.nachname = 'Pflichtfeld'
    if (!formData.email.trim()) {
      newErrors.email = 'Pflichtfeld'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Ungültige E-Mail-Adresse'
    }
    if (formData.stundenansatz && parseFloat(formData.stundenansatz) < 0) {
      newErrors.stundenansatz = 'Muss positiv sein'
    }
    if (!isEdit && !formData.passwort) {
      newErrors.passwort = 'Passwort ist erforderlich'
    }
    if (formData.passwort && formData.passwort.length < 8) {
      newErrors.passwort = 'Mindestens 8 Zeichen'
    }
    if (formData.passwort && formData.passwort !== formData.passwort_confirm) {
      newErrors.passwort_confirm = 'Passwörter stimmen nicht überein'
    }
    return newErrors
  }

  const handleSubmit = async () => {
    const newErrors = validate()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setSaving(true)
    try {
      const token = localStorage.getItem('auth_token')
      const payload = {
        vorname: formData.vorname.trim(),
        nachname: formData.nachname.trim(),
        email: formData.email.trim(),
        funktion: formData.funktion.trim() || null,
        stundenansatz: parseFloat(formData.stundenansatz) || 0,
        rolle_id: parseInt(formData.rolle_id),
        ist_aktiv: formData.ist_aktiv ? 1 : 0
      }
      if (formData.passwort) payload.passwort = formData.passwort

      const url = isEdit
        ? `${API_BASE}/api/benutzer/${user.id}`
        : `${API_BASE}/api/benutzer`
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (res.ok) {
        onSaveSuccess()
      } else {
        alert('❌ Fehler: ' + (data.message || 'Unbekannter Fehler'))
      }
    } catch (err) {
      alert('❌ Fehler: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const getRollenBadgeColor = (rolleId) => {
    switch (parseInt(rolleId)) {
      case 1: return '#92400e'
      case 2: return '#1e40af'
      case 3: return '#065f46'
      default: return '#374151'
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal-box">
        <div className="modal-header">
          <h2>{isEdit ? '✏️ Benutzer bearbeiten' : '➕ Neuer Benutzer'}</h2>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>

        <div className="modal-body">

          {/* GRUNDDATEN */}
          <div className="form-section-title">👤 Grunddaten</div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Vorname <span className="required">*</span></label>
              <input
                type="text"
                value={formData.vorname}
                onChange={e => handleChange('vorname', e.target.value)}
                placeholder="Max"
                style={errors.vorname ? { borderColor: '#dc2626' } : {}}
              />
              {errors.vorname && <p className="form-hint" style={{ color: '#dc2626' }}>{errors.vorname}</p>}
            </div>
            <div className="form-group">
              <label>Nachname <span className="required">*</span></label>
              <input
                type="text"
                value={formData.nachname}
                onChange={e => handleChange('nachname', e.target.value)}
                placeholder="Mustermann"
                style={errors.nachname ? { borderColor: '#dc2626' } : {}}
              />
              {errors.nachname && <p className="form-hint" style={{ color: '#dc2626' }}>{errors.nachname}</p>}
            </div>
          </div>

          <div className="form-group">
            <label>E-Mail <span className="required">*</span></label>
            <input
              type="email"
              value={formData.email}
              onChange={e => handleChange('email', e.target.value)}
              placeholder="max.mustermann@firma.ch"
              style={errors.email ? { borderColor: '#dc2626' } : {}}
            />
            {errors.email && <p className="form-hint" style={{ color: '#dc2626' }}>{errors.email}</p>}
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Funktion / Jobbezeichnung</label>
              <input
                type="text"
                value={formData.funktion}
                onChange={e => handleChange('funktion', e.target.value)}
                placeholder="z.B. Kundenberater"
              />
            </div>
            <div className="form-group">
              <label>Stundenansatz (CHF/h)</label>
              <input
                type="number"
                value={formData.stundenansatz}
                onChange={e => handleChange('stundenansatz', e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.50"
                style={errors.stundenansatz ? { borderColor: '#dc2626' } : {}}
              />
              {errors.stundenansatz
                ? <p className="form-hint" style={{ color: '#dc2626' }}>{errors.stundenansatz}</p>
                : <p className="form-hint">Wird bei Zeiterfassung als Snapshot gespeichert</p>
              }
            </div>
          </div>

          {/* ROLLE & STATUS */}
          <div className="form-section-title">🔐 Rolle & Status</div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Rolle <span className="required">*</span></label>
              <select
                value={formData.rolle_id}
                onChange={e => handleChange('rolle_id', e.target.value)}
              >
                {rollen.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            {isEdit && (
              <div className="form-group">
                <label>Status</label>
                <div className="toggle-row" style={{ padding: '9px 0' }}>
                  <span style={{ fontSize: '14px', color: formData.ist_aktiv ? '#065f46' : '#991b1b', fontWeight: 500 }}>
                    {formData.ist_aktiv ? '✅ Aktiv' : '❌ Inaktiv'}
                  </span>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={!!formData.ist_aktiv}
                      onChange={e => handleChange('ist_aktiv', e.target.checked ? 1 : 0)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* PASSWORT */}
          <div className="form-section-title">🔑 Passwort</div>

          {isEdit && (
            <p className="form-hint" style={{ marginBottom: '12px' }}>
              Nur ausfüllen wenn das Passwort geändert werden soll.
            </p>
          )}

          <div className="form-row-2">
            <div className="form-group">
              <label>Passwort {!isEdit && <span className="required">*</span>}</label>
              <input
                type="password"
                value={formData.passwort}
                onChange={e => handleChange('passwort', e.target.value)}
                placeholder="Min. 8 Zeichen"
                style={errors.passwort ? { borderColor: '#dc2626' } : {}}
              />
              {errors.passwort && <p className="form-hint" style={{ color: '#dc2626' }}>{errors.passwort}</p>}
            </div>
            <div className="form-group">
              <label>Passwort bestätigen</label>
              <input
                type="password"
                value={formData.passwort_confirm}
                onChange={e => handleChange('passwort_confirm', e.target.value)}
                placeholder="Wiederholung"
                style={errors.passwort_confirm ? { borderColor: '#dc2626' } : {}}
              />
              {errors.passwort_confirm && <p className="form-hint" style={{ color: '#dc2626' }}>{errors.passwort_confirm}</p>}
            </div>
          </div>

        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onCancel} disabled={saving}>
            Abbrechen
          </button>
          <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? '⏳ Speichern...' : (isEdit ? '💾 Speichern' : '➕ Erstellen')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default UserForm