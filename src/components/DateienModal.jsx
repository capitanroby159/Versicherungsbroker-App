import { useState } from 'react'
import './DateienModal.css'

function DateienModal({ policeId, onClose, onSave }) {
  const [formData, setFormData] = useState({
    kategorie: 'Police',
    beschreibung: '',
    url: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError(null)
  }

  const handleSave = async () => {
    if (!formData.url.trim()) {
      setError('❌ Link ist erforderlich')
      return
    }

    if (formData.kategorie === 'Sonstige' && !formData.beschreibung.trim()) {
      setError('❌ Bei "Sonstige" ist eine Beschreibung erforderlich')
      return
    }

    try {
      new URL(formData.url)
    } catch {
      setError('❌ Ungültiger Link')
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(
        `http://localhost:5000/api/policen/${policeId}/dateien`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Fehler beim Speichern')
      }

      alert('✅ Datei hinzugefügt')
      onSave()
    } catch (err) {
      setError('❌ ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📎 Datei hinzufügen</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label>Dateityp</label>
            <select 
              name="kategorie"
              value={formData.kategorie}
              onChange={handleInputChange}
              className="form-input"
            >
              <option value="Police">📄 Police</option>
              <option value="Antrag">📝 Antrag</option>
              <option value="Nachtrag">📝 Nachtrag</option>
              <option value="AVB">📋 AVB (Allgemeine Versicherungsbedingungen)</option>
              <option value="ZB">📑 ZB (Zusatzbestimmungen)</option>
              <option value="Sonstige">📎 Sonstige</option>
            </select>
          </div>

          <div className="form-group">
            <label>
              Beschreibung / Bemerkungen
              {formData.kategorie === 'Sonstige' && <span style={{ color: '#ef4444' }}> *</span>}
            </label>
            <textarea
              name="beschreibung"
              value={formData.beschreibung}
              onChange={handleInputChange}
              placeholder={
                formData.kategorie === 'Sonstige' 
                  ? 'z.B. Deckungsbestätigung (erforderlich)' 
                  : 'Optionale Bemerkung zur Datei (z.B. "Version 2024", "Nachtrag vom 15.01.2026")'
              }
              className="form-input"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>Nextcloud Link <span style={{ color: '#ef4444' }}>*</span></label>
            <input 
              type="url"
              name="url"
              value={formData.url}
              onChange={handleInputChange}
              placeholder="https://nextcloud.example.com/..."
              className="form-input"
            />
          </div>
        </div>

        <div className="modal-footer">
          <button 
            className="btn-cancel"
            onClick={onClose}
            disabled={loading}
          >
            Abbrechen
          </button>
          <button 
            className="btn-save"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? '💾 Speichern...' : '💾 Speichern'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DateienModal