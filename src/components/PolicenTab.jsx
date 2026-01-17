import { useState, useEffect } from 'react'
import { formatCHF } from '../utils/formatters'
import PolicenDetailsModal from './PolicenDetailsModal'
import './PolicenTab.css'

function PolicenTab({ kundeId }) {
  const [policen, setPolicen] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPolice, setSelectedPolice] = useState(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    fetchPolicen()
  }, [kundeId])

  const fetchPolicen = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:5000/api/policen')
      if (!response.ok) throw new Error('Fehler beim Laden')
      const data = await response.json()
      
      // Filter by kundeId if provided
      if (kundeId) {
        const filtered = data.filter(p => p.kunde_id === kundeId)
        setPolicen(filtered)
      } else {
        setPolicen(data)
      }
    } catch (error) {
      console.error('Error fetching policen:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDetails = (police) => {
    setSelectedPolice(police)
    setShowDetails(true)
  }

  const handleSavePolice = async (updatedPolice) => {
    try {
      let response
      
      // Neue Police erstellen oder existierende updaten
      if (updatedPolice.id) {
        // UPDATE
        response = await fetch(`http://localhost:5000/api/policen/${updatedPolice.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedPolice)
        })
      } else {
        // CREATE
        response = await fetch('http://localhost:5000/api/policen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedPolice)
        })
      }

      if (response.ok) {
        alert('✅ Police gespeichert!')
        setShowDetails(false)
        fetchPolicen()
      } else {
        alert('❌ Fehler beim Speichern')
      }
    } catch (error) {
      console.error('Error saving police:', error)
      alert('❌ Fehler: ' + error.message)
    }
  }

  const handleNewPolice = () => {
    const newPolice = {
      kunde_id: kundeId,
      jkr: 'Nein',
      waehrung: 'CHF'
    }
    setSelectedPolice(newPolice)
    setShowDetails(true)
  }

  if (loading) return <div className="policen-tab"><p>⏳ Lade Policen...</p></div>

  return (
    <div className="policen-tab">
      <div className="tab-header">
        <h2>📋 Policen</h2>
        <button className="button-new" onClick={handleNewPolice}>+ Neue Police</button>
      </div>

      {policen.length === 0 ? (
        <div className="empty-state">
          <p>Keine Policen erfasst</p>
        </div>
      ) : (
        <table className="policen-table">
          <thead>
            <tr>
              <th>Policenummer</th>
              <th>Versicherer</th>
              <th>Prämie</th>
              <th>Gültig von</th>
              <th>Gültig bis</th>
              <th>Aktion</th>
            </tr>
          </thead>
          <tbody>
            {policen.map(police => {
              const total = (parseFloat(police.praemie_chf) || 0) + (parseFloat(police.gebuehren) || 0)
              return (
                <tr key={police.id}>
                  <td><strong>{police.policennummer}</strong></td>
                  <td>{police.versicherer_name || '-'}</td>
                  <td>{formatCHF(total)}</td>
                  <td>{police.beginn ? new Date(police.beginn).toLocaleDateString('de-CH') : '-'}</td>
                  <td>{police.ende ? new Date(police.ende).toLocaleDateString('de-CH') : '-'}</td>
                  <td>
                    <button 
                      className="button-details"
                      onClick={() => handleOpenDetails(police)}
                    >
                      👁️ Details
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {showDetails && selectedPolice && (
        <PolicenDetailsModal 
          police={selectedPolice}
          onClose={() => setShowDetails(false)}
          onSave={handleSavePolice}
        />
      )}
    </div>
  )
}

export default PolicenTab