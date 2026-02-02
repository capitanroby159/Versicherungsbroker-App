import { useState } from 'react'
import './TrackingActivityForm.css'

export default function TrackingActivityForm({ projektId, kundeId, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    art: 'Email',
    richtung: 'Outgoing',
    teilnehmer: '',
    notizen: '',
    hat_aufgabe: false,
    aufgabe_beschreibung: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.art || !formData.richtung) {
      setError('Art und Richtung sind erforderlich')
      return
    }

    try {
      setLoading(true)
      setError('')
      
      const response = await fetch(`/api/tracking/campaigns/${projektId}/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          datum: new Date().toISOString(),
          kunde_id: kundeId,
          erstellt_von: 1
        })
      })

      if (!response.ok) {
        throw new Error('Fehler beim Erstellen der Activity')
      }

      // Wenn Aufgabe erstellt werden soll
      if (formData.hat_aufgabe && formData.aufgabe_beschreibung) {
        await fetch('/api/todos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            beschreibung: formData.aufgabe_beschreibung,
            kunde_id: kundeId,
            prioritaet: 'Normal',
            status: 'Offen',
            erstellt_von: 1
          })
        })
      }

      onSuccess()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Neue Aktivität hinzufügen</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="activity-form">
          <div className="form-row">
            <div className="form-group half">
              <label htmlFor="art">Art *</label>
              <select
                id="art"
                name="art"
                value={formData.art}
                onChange={handleChange}
              >
                <option value="Telefon">📞 Telefon</option>
                <option value="Email">📧 Email</option>
                <option value="Besprechung">🤝 Besprechung</option>
                <option value="Offerte">📄 Offerte</option>
                <option value="Sanierung">✅ Sanierung</option>
                <option value="Ausschreibung">📋 Ausschreibung</option>
                <option value="Event">📅 Event</option>
                <option value="Sonstiges">📌 Sonstiges</option>
              </select>
            </div>

            <div className="form-group half">
              <label htmlFor="richtung">Richtung *</label>
              <select
                id="richtung"
                name="richtung"
                value={formData.richtung}
                onChange={handleChange}
              >
                <option value="Outgoing">📤 Outgoing (von uns)</option>
                <option value="Ingoing">📥 Ingoing (zu uns)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="teilnehmer">Teilnehmer</label>
            <input
              type="text"
              id="teilnehmer"
              name="teilnehmer"
              value={formData.teilnehmer}
              onChange={handleChange}
              placeholder="z.B. Roberto Valentini, John Smith"
            />
          </div>

          <div className="form-group">
            <label htmlFor="notizen">Notizen</label>
            <textarea
              id="notizen"
              name="notizen"
              value={formData.notizen}
              onChange={handleChange}
              placeholder="Was wurde besprochen?"
              rows="4"
            />
          </div>

          <div className="form-group checkbox">
            <input
              type="checkbox"
              id="hat_aufgabe"
              name="hat_aufgabe"
              checked={formData.hat_aufgabe}
              onChange={handleChange}
            />
            <label htmlFor="hat_aufgabe">Mit Aufgabe erstellen (separate Todo)</label>
          </div>

          {formData.hat_aufgabe && (
            <div className="form-group">
              <label htmlFor="aufgabe_beschreibung">Aufgabenbeschreibung</label>
              <input
                type="text"
                id="aufgabe_beschreibung"
                name="aufgabe_beschreibung"
                value={formData.aufgabe_beschreibung}
                onChange={handleChange}
                placeholder="z.B. Angebot senden"
              />
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Abbrechen
            </button>
            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? 'Speichert...' : 'Speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}