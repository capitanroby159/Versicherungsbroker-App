import { useState, useEffect } from 'react'
import KatalogVerwaltungModal from './KatalogVerwaltungModal'
import './ZusatzdeckungKatalogModal.css'

function ZusatzdeckungKatalogModal({ policeId, versichererId, sparteId, onClose, onSelect }) {
  const [katalog, setKatalog] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedKatalogId, setSelectedKatalogId] = useState(null)
  const [garantiesumme, setGarantiesumme] = useState('')
  const [selbstbehalt, setSelbstbehalt] = useState('Grundselbstbehalt')
  const [showVerwaltungModal, setShowVerwaltungModal] = useState(false)

  useEffect(() => {
    fetchKatalog()
  }, [versichererId, sparteId])

  const fetchKatalog = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const params = new URLSearchParams()
      if (versichererId) params.append('versicherer_id', versichererId)
      if (sparteId) params.append('sparte_id', sparteId)
      
      const response = await fetch(`http://localhost:5000/api/policen/zusatzdeckungen-katalog?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setKatalog(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Fehler beim Laden des Katalogs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectDeckung = (item) => {
    setSelectedKatalogId(item.id)
    setGarantiesumme(item.standard_garantiesumme || '')
    setSelbstbehalt(item.standard_selbstbehalt || 'Grundselbstbehalt')
  }

  const handleAdd = async () => {
    if (!selectedKatalogId) {
      alert('Bitte wählen Sie eine Deckung aus')
      return
    }

    const selectedItem = katalog.find(k => k.id === selectedKatalogId)
    if (!selectedItem) return

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`http://localhost:5000/api/policen/${policeId}/zusatzdeckungen`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          deckung: selectedItem.deckung_name,
          garantiesumme: garantiesumme || null,
          selbstbehalt: selbstbehalt || 'Grundselbstbehalt'
        })
      })

      if (response.ok) {
        const newDeckung = await response.json()
        onSelect(newDeckung)
      }
    } catch (error) {
      console.error('Fehler beim Hinzufügen der Deckung:', error)
    }
  }

  const handleKatalogSave = (newItem) => {
    setKatalog([...katalog, newItem])
    setShowVerwaltungModal(false)
  }

  // Gruppiere nach Kategorie
  const groupedKatalog = katalog.reduce((acc, item) => {
    const kategorie = item.kategorie || 'Sonstiges'
    if (!acc[kategorie]) acc[kategorie] = []
    acc[kategorie].push(item)
    return acc
  }, {})

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className={`modal-content katalog-modal ${showVerwaltungModal ? 'dimmed' : ''}`} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>Zusatzdeckung aus Katalog wählen</h3>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button 
              className="btn-create-katalog" 
              onClick={() => setShowVerwaltungModal(true)}
              title="Neue Deckung zum Katalog hinzufügen"
            >
              + Neue Deckung erstellen
            </button>
            <button className="modal-close-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="modal-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>Lädt Katalog...</div>
          ) : (
            <>
              <div className="katalog-liste">
                {Object.keys(groupedKatalog).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                    Keine Deckungen im Katalog verfügbar
                  </div>
                ) : (
                  Object.entries(groupedKatalog).map(([kategorie, items]) => (
                    <div key={kategorie} className="katalog-kategorie">
                      <h4 className="katalog-kategorie-titel">{kategorie}</h4>
                      <div className="katalog-items">
                        {items.map(item => (
                          <div 
                            key={item.id} 
                            className={`katalog-item ${selectedKatalogId === item.id ? 'selected' : ''}`}
                            onClick={() => handleSelectDeckung(item)}
                          >
                            <div className="katalog-item-name">{item.deckung_name}</div>
                            {item.beschreibung && (
                              <div className="katalog-item-beschreibung">{item.beschreibung}</div>
                            )}
                            {item.standard_garantiesumme && (
                              <div className="katalog-item-detail">
                                💰 Standard: {item.standard_garantiesumme}
                              </div>
                            )}
                            {item.standard_selbstbehalt && (
                              <div className="katalog-item-detail">
                                📊 SB: {item.standard_selbstbehalt}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {selectedKatalogId && (
                <div className="katalog-eingabe-bereich">
                  <h4>Deckungsdetails anpassen</h4>
                  <div className="form-group">
                    <label>Garantiesumme</label>
                    <input
                      type="text"
                      value={garantiesumme}
                      onChange={(e) => setGarantiesumme(e.target.value)}
                      placeholder="z.B. CHF 1'000'000 oder 10% der Grunddeckung"
                    />
                    <small>Kann Zahl oder Text sein (z.B. "10% der Grunddeckung")</small>
                  </div>
                  <div className="form-group">
                    <label>Selbstbehalt</label>
                    <input
                      type="text"
                      value={selbstbehalt}
                      onChange={(e) => setSelbstbehalt(e.target.value)}
                      placeholder="z.B. CHF 500 oder 10% mind. CHF 500 max. CHF 10'000"
                    />
                    <small>Kann Zahl oder Text sein (Default: "Grundselbstbehalt")</small>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Abbrechen
          </button>
          <button 
            className="btn-primary" 
            onClick={handleAdd}
            disabled={!selectedKatalogId}
          >
            Hinzufügen
          </button>
        </div>
      </div>

      {/* KATALOG VERWALTUNG MODAL */}
      {showVerwaltungModal && (
        <KatalogVerwaltungModal
          versichererId={versichererId}
          sparteId={sparteId}
          onClose={() => setShowVerwaltungModal(false)}
          onSave={handleKatalogSave}
        />
      )}
    </div>
  )
}

export default ZusatzdeckungKatalogModal