import { useState } from 'react'
import "../TrackingForm.css";

export default function ProjektEditModal({ projekt, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    titel: projekt.titel,
    beschreibung: projekt.beschreibung,
    status: projekt.status
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.titel.trim()) {
      setError('Titel ist erforderlich')
      return
    }

    try {
      setLoading(true)
      setError('')
      
      const response = await fetch(`/api/tracking/campaigns/${projekt.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Fehler beim Aktualisieren des Projekts')
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
          <h3>Projekt bearbeiten</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="tracking-form">
          <div className="form-group">
            <label htmlFor="titel">Projekttitel *</label>
            <input
              type="text"
              id="titel"
              name="titel"
              value={formData.titel}
              onChange={handleChange}
              placeholder="z.B. Angebot Hausrat - Max Müller"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="beschreibung">Beschreibung</label>
            <textarea
              id="beschreibung"
              name="beschreibung"
              value={formData.beschreibung}
              onChange={handleChange}
              placeholder="Notizen zum Projekt..."
              rows="4"
            />
          </div>

          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="Offen">Offen</option>
              <option value="In Bearbeitung">In Bearbeitung</option>
              <option value="Abgeschlossen">Abgeschlossen</option>
              <option value="Storniert">Storniert</option>
            </select>
          </div>

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