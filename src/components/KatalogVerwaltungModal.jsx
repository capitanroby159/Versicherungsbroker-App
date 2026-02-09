import { useState, useEffect } from 'react'
import { SmartNumberInput } from '../utils/numberFormatter'
import './KatalogVerwaltungModal.css'

function KatalogVerwaltungModal({ item, versichererId, sparteId, onClose, onSave }) {
  const [formData, setFormData] = useState({
    deckung_name: '',
    kategorie: 'Allgemein',
    standard_garantiesumme: '',
    standard_selbstbehalt: 'Grundselbstbehalt',
    beschreibung: '',
    versicherer_id: versichererId || '',
    sparte_id: sparteId || ''
  })
  const [versicherer, setVersicherer] = useState([])
  const [sparten, setSparten] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchVersicherer()
    fetchSparten()
    
    if (item) {
      setFormData({
        deckung_name: item.deckung_name || '',
        kategorie: item.kategorie || 'Allgemein',
        standard_garantiesumme: item.standard_garantiesumme || '',
        standard_selbstbehalt: item.standard_selbstbehalt || 'Grundselbstbehalt',
        beschreibung: item.beschreibung || '',
        versicherer_id: item.versicherer_id || '',
        sparte_id: item.sparte_id || ''
      })
    }
  }, [item])

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.deckung_name.trim()) {
      alert('Bitte geben Sie einen Deckungsnamen ein')
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      const url = item 
        ? `http://localhost:5000/api/policen/zusatzdeckungen-katalog/${item.id}`
        : 'http://localhost:5000/api/policen/zusatzdeckungen-katalog'
      
      const method = item ? 'PUT' : 'POST'

      const dataToSend = {
        ...formData,
        versicherer_id: formData.versicherer_id || null,
        sparte_id: formData.sparte_id || null
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      })

      if (response.ok) {
        const savedItem = await response.json()
        onSave(savedItem)
      } else {
        alert('Fehler beim Speichern')
      }
    } catch (error) {
      console.error('Fehler beim Speichern:', error)
      alert('Fehler beim Speichern')
    } finally {
      setLoading(false)
    }
  }

  const kategorien = [
    'Allgemein',
    'Umwelt',
    'Haftung',
    'Cyber',
    'Geografisch',
    'Personal',
    'Fahrzeuge',
    'Bau',
    'Management',
    'Spezial',
    'Service',
    'Sonstiges'
  ]

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content katalog-verwaltung-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{item ? 'Katalog-Deckung bearbeiten' : 'Neue Katalog-Deckung erstellen'}</h3>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Deckungsname *</label>
              <input
                type="text"
                value={formData.deckung_name}
                onChange={(e) => setFormData({ ...formData, deckung_name: e.target.value })}
                placeholder="z.B. Umweltschadenversicherung"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Kategorie</label>
                <select
                  value={formData.kategorie}
                  onChange={(e) => setFormData({ ...formData, kategorie: e.target.value })}
                >
                  {kategorien.map(kat => (
                    <option key={kat} value={kat}>{kat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Versicherer (optional)</label>
                <select
                  value={formData.versicherer_id}
                  onChange={(e) => setFormData({ ...formData, versicherer_id: e.target.value })}
                >
                  <option value="">Alle Versicherer</option>
                  {versicherer.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Sparte (optional)</label>
              <select
                value={formData.sparte_id}
                onChange={(e) => setFormData({ ...formData, sparte_id: e.target.value })}
              >
                <option value="">Alle Sparten</option>
                {sparten.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <small>Leer = Deckung erscheint bei allen Sparten</small>
            </div>

            <div className="form-group">
              <label>Standard Garantiesumme</label>
              <SmartNumberInput
                value={formData.standard_garantiesumme}
                onChange={(val) => setFormData({ ...formData, standard_garantiesumme: val })}
                placeholder="z.B. CHF 1'000'000 oder 10% der Grunddeckung"
              />
              <small>Kann Zahl oder Text sein (z.B. "10% der Grunddeckung", "Gemäss Grunddeckung")</small>
            </div>

            <div className="form-group">
              <label>Standard Selbstbehalt</label>
              <SmartNumberInput
                value={formData.standard_selbstbehalt}
                onChange={(val) => setFormData({ ...formData, standard_selbstbehalt: val })}
                placeholder="z.B. Grundselbstbehalt oder CHF 500"
              />
              <small>Standard: "Grundselbstbehalt" (kann auch "10% mind. CHF 500 max. CHF 10'000" sein)</small>
            </div>

            <div className="form-group">
              <label>Beschreibung (optional)</label>
              <textarea
                value={formData.beschreibung}
                onChange={(e) => setFormData({ ...formData, beschreibung: e.target.value })}
                placeholder="Zusätzliche Informationen zur Deckung..."
                rows="3"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Abbrechen
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Speichert...' : (item ? 'Aktualisieren' : 'Erstellen')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default KatalogVerwaltungModal