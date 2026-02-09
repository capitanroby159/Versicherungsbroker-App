import { useState, useEffect } from 'react'
import './KlauselVerwaltungModal.css'

function KlauselVerwaltungModal({ klausel, versichererId, sparteId, onClose, onSave }) {
  const [versicherer, setVersicherer] = useState([])
  const [sparten, setSparten] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const [formData, setFormData] = useState({
    versicherer_id: versichererId || '',
    sparte_id: sparteId || '',
    titel: '',
    klausel: '',
    kategorie: 'Allgemein'
  })

  useEffect(() => {
    fetchVersicherer()
    fetchSparten()
    
    if (klausel) {
      setFormData({
        versicherer_id: klausel.versicherer_id,
        sparte_id: klausel.sparte_id || '',
        titel: klausel.titel,
        klausel: klausel.klausel,
        kategorie: klausel.kategorie || 'Allgemein'
      })
    }
  }, [klausel, versichererId, sparteId])

  const fetchVersicherer = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('http://localhost:5000/api/versicherer', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setVersicherer(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Fehler beim Laden der Versicherer:', error)
    }
  }

  const fetchSparten = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('http://localhost:5000/api/sparten', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setSparten(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Fehler beim Laden der Sparten:', error)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    if (!formData.versicherer_id || !formData.titel || !formData.klausel) {
      setError('❌ Versicherer, Titel und Klausel sind Pflichtfelder')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('auth_token')
      const url = klausel 
        ? `http://localhost:5000/api/vertragsklauseln/${klausel.id}`
        : 'http://localhost:5000/api/vertragsklauseln'
      const method = klausel ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Fehler beim Speichern der Klausel')
      }

      const result = await response.json()
      onSave(result.klausel)
      onClose()
    } catch (err) {
      setError('❌ ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal klausel-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📝 {klausel ? 'Klausel bearbeiten' : 'Neue Klausel'}</h3>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        {error && (
          <div style={{ background: '#fecaca', padding: '1rem', marginBottom: '1rem', borderRadius: '4px', color: '#7f1d1d' }}>
            {error}
          </div>
        )}

        <div className="modal-content">
          <div className="form-group">
            <label>Versicherer *</label>
            <select 
              name="versicherer_id" 
              value={formData.versicherer_id} 
              onChange={handleInputChange}
            >
              <option value="">-- Wählen --</option>
              {versicherer.map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Sparte (optional)</label>
            <select 
              name="sparte_id" 
              value={formData.sparte_id} 
              onChange={handleInputChange}
            >
              <option value="">-- Alle Sparten --</option>
              {sparten.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <small style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem', display: 'block' }}>
              Leer lassen = Gilt für alle Sparten dieses Versicherers
            </small>
          </div>

          <div className="form-group">
            <label>Titel *</label>
            <input 
              type="text" 
              name="titel" 
              value={formData.titel} 
              onChange={handleInputChange}
              placeholder="z.B. Selbstbehalt Gebäude"
            />
          </div>

          <div className="form-group">
            <label>Kategorie</label>
            <select 
              name="kategorie" 
              value={formData.kategorie} 
              onChange={handleInputChange}
            >
              <option value="Allgemein">Allgemein</option>
              <option value="Selbstbehalt">Selbstbehalt</option>
              <option value="Deckung">Deckung</option>
              <option value="Zusatzdeckung">Zusatzdeckung</option>
              <option value="Haftung">Haftung</option>
              <option value="Ausschlüsse">Ausschlüsse</option>
            </select>
          </div>

          <div className="form-group">
            <label>Klausel *</label>
            <textarea 
              name="klausel" 
              value={formData.klausel} 
              onChange={handleInputChange}
              rows="8"
              placeholder="Vollständiger Text der Vertragsklausel..."
            />
          </div>
        </div>

        <div className="modal-actions">
          <button className="button-secondary" onClick={onClose} disabled={loading}>
            Abbrechen
          </button>
          <button className="button-primary" onClick={handleSave} disabled={loading}>
            {loading ? '💾 Speichern...' : '💾 Speichern'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default KlauselVerwaltungModal