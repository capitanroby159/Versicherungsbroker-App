import { useState, useEffect } from 'react'
import './KlauselnTab.css'

function KlauselnTab({ policeId }) {
  const [klauseln, setKlauseln] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedIds, setExpandedIds] = useState([])  // ← NEU: Welche Klauseln sind aufgeklappt

  useEffect(() => {
    if (policeId) {
      fetchKlauseln()
    }
  }, [policeId])

  const fetchKlauseln = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`http://localhost:5000/api/vertragsklauseln/police/${policeId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setKlauseln(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Fehler beim Laden der Klauseln:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleExpand = (id) => {
    setExpandedIds(prev => 
      prev.includes(id) 
        ? prev.filter(eid => eid !== id)  // Zuklappen
        : [...prev, id]  // Aufklappen
    )
  }

  const handleRemove = async (klauselId) => {
    if (!confirm('Möchten Sie diese Klausel wirklich entfernen?')) {
      return
    }

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`http://localhost:5000/api/vertragsklauseln/police/${policeId}/${klauselId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        setKlauseln(prev => prev.filter(k => k.id !== klauselId))
      }
    } catch (error) {
      console.error('Fehler beim Entfernen der Klausel:', error)
    }
  }

  if (loading) {
    return <div style={{ padding: '1rem', textAlign: 'center', color: '#999' }}>Lädt...</div>
  }

  if (klauseln.length === 0) {
    return (
      <div style={{ padding: '1rem', textAlign: 'center', color: '#999', fontSize: '0.85rem' }}>
        Keine Klauseln zugeordnet
      </div>
    )
  }

  return (
    <div className="klauseln-container">
      {klauseln.map(klausel => {
        const isExpanded = expandedIds.includes(klausel.id)
        
        return (
          <div key={klausel.id} className="klausel-card">
            <div 
              className="klausel-card-header clickable" 
              onClick={() => toggleExpand(klausel.id)}
            >
              <div className="klausel-card-titel">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
                  <span className="klausel-titel-text">{klausel.titel}</span>
                  <span className="klausel-kategorie-badge">{klausel.kategorie}</span>
                </div>
              </div>
              <button 
                className="klausel-remove-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemove(klausel.id)
                }}
                title="Klausel entfernen"
              >
                ✕
              </button>
            </div>
            
            {isExpanded && (
              <>
                <div className="klausel-card-content">
                  <div className="klausel-text-content">{klausel.klausel}</div>
                </div>
                <div className="klausel-card-footer">
                  <span className="klausel-versicherer">🏢 {klausel.versicherer_name}</span>
                  {klausel.sparte_name && (
                    <span className="klausel-sparte">
                      | 📋 {klausel.sparte_name}
                    </span>
                  )}
                  <span className="klausel-datum">
                    {new Date(klausel.hinzugefuegt_am).toLocaleDateString('de-CH')}
                  </span>
                </div>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default KlauselnTab