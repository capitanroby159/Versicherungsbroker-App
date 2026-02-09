import { useState, useEffect } from 'react'
import './KlauselAuswahlModal.css'

function KlauselAuswahlModal({ policeId, versichererId, sparteId, onClose, onSave }) {
  const [klauseln, setKlauseln] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchKlauseln()
  }, [versichererId, sparteId])

  const fetchKlauseln = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const params = new URLSearchParams()
      
      if (versichererId) params.append('versicherer_id', versichererId)
      if (sparteId) params.append('sparte_id', sparteId)
      
      const url = `http://localhost:5000/api/vertragsklauseln?${params.toString()}`
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setKlauseln(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Fehler beim Laden der Klauseln:', error)
      setError('Fehler beim Laden der Klauseln')
    }
  }

  const toggleSelection = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(sid => sid !== id)
        : [...prev, id]
    )
  }

  const selectAll = () => {
    setSelectedIds(klauseln.map(k => k.id))
  }

  const deselectAll = () => {
    setSelectedIds([])
  }

  const handleSave = async () => {
    if (selectedIds.length === 0) {
      setError('❌ Bitte wählen Sie mindestens eine Klausel aus')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`http://localhost:5000/api/vertragsklauseln/police/${policeId}/add`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ klausel_ids: selectedIds })
      })

      if (!response.ok) {
        throw new Error('Fehler beim Zuordnen der Klauseln')
      }

      onSave()
      onClose()
    } catch (err) {
      setError('❌ ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal klausel-auswahl-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📋 Klauseln auswählen</h3>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        {error && (
          <div style={{ background: '#fecaca', padding: '1rem', marginBottom: '1rem', borderRadius: '4px', color: '#7f1d1d' }}>
            {error}
          </div>
        )}

        <div className="modal-content">
          <div className="selection-controls">
            <button 
              className="button-small" 
              onClick={selectAll}
              style={{ marginRight: '0.5rem' }}
            >
              ✓ Alle auswählen
            </button>
            <button 
              className="button-small" 
              onClick={deselectAll}
            >
              ✕ Alle abwählen
            </button>
            <span style={{ marginLeft: 'auto', fontSize: '0.9rem', color: '#666' }}>
              {selectedIds.length} ausgewählt
            </span>
          </div>

          <div className="klausel-list">
            {klauseln.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                Keine Klauseln für diesen Versicherer/diese Sparte vorhanden
              </div>
            ) : (
              klauseln.map(klausel => (
                <div 
                  key={klausel.id} 
                  className={`klausel-item ${selectedIds.includes(klausel.id) ? 'selected' : ''}`}
                  onClick={() => toggleSelection(klausel.id)}
                >
                  <div className="klausel-checkbox">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(klausel.id)}
                      onChange={() => toggleSelection(klausel.id)}
                    />
                  </div>
                  <div className="klausel-info">
                    <div className="klausel-header">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <span className="klausel-titel">{klausel.titel}</span>
                        {klausel.sparte_name && (
                          <span style={{ fontSize: '0.7rem', color: '#666' }}>
                            📋 {klausel.sparte_name}
                          </span>
                        )}
                      </div>
                      <span className="klausel-kategorie">{klausel.kategorie}</span>
                    </div>
                    <div className="klausel-text">{klausel.klausel}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="modal-actions">
          <button className="button-secondary" onClick={onClose} disabled={loading}>
            Abbrechen
          </button>
          <button className="button-primary" onClick={handleSave} disabled={loading || selectedIds.length === 0}>
            {loading ? '💾 Hinzufügen...' : `💾 ${selectedIds.length} Klausel(n) hinzufügen`}
          </button>
        </div>
      </div>
    </div>
  )
}

export default KlauselAuswahlModal