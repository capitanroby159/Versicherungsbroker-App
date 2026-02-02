import { useState } from 'react'
import './TodoForm.css'

export default function TodoForm({ kundeId, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    beschreibung: '',
    prioritaet: 'Normal',
    faellig_am: '',
    status: 'Offen'
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
    
    if (!formData.beschreibung.trim()) {
      setError('Beschreibung ist erforderlich')
      return
    }

    try {
      setLoading(true)
      setError('')
      
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          kunde_id: kundeId,
          erstellt_von: 1
        })
      })

      if (!response.ok) {
        throw new Error('Fehler beim Erstellen der Aufgabe')
      }

      onSuccess()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getTodayDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Neue Aufgabe erstellen</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="todo-form">
          <div className="form-group">
            <label htmlFor="beschreibung">Aufgabenbeschreibung *</label>
            <input
              type="text"
              id="beschreibung"
              name="beschreibung"
              value={formData.beschreibung}
              onChange={handleChange}
              placeholder="z.B. Angebot senden an Max Müller"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group half">
              <label htmlFor="prioritaet">Priorität</label>
              <select
                id="prioritaet"
                name="prioritaet"
                value={formData.prioritaet}
                onChange={handleChange}
              >
                <option value="Niedrig">Niedrig</option>
                <option value="Normal">Normal</option>
                <option value="Hoch">Hoch</option>
                <option value="Dringend">Dringend</option>
              </select>
            </div>

            <div className="form-group half">
              <label htmlFor="faellig_am">Fällig am</label>
              <input
                type="date"
                id="faellig_am"
                name="faellig_am"
                value={formData.faellig_am}
                onChange={handleChange}
                min={getTodayDate()}
              />
            </div>
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
              <option value="Erledigt">Erledigt</option>
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