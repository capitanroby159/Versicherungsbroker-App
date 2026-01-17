import { useState, useEffect } from 'react'
import ImmobildienDetailsModal from './ImmobildienDetailsModal'
import './ImmobildienTab.css'

function ImmobildienTab({ kundeId }) {
  const [immobilien, setImmobilien] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedImmobilie, setSelectedImmobilie] = useState(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    fetchImmobilien()
  }, [kundeId])

  const fetchImmobilien = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:5000/api/immobilien')
      if (!response.ok) throw new Error('Fehler beim Laden')
      const data = await response.json()
      
      // Filter by kundeId if provided
      if (kundeId) {
        const filtered = data.filter(i => i.kunde_id === kundeId)
        setImmobilien(filtered)
      } else {
        setImmobilien(data)
      }
    } catch (error) {
      console.error('Error fetching immobilien:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDetails = (immobilie) => {
    setSelectedImmobilie(immobilie)
    setShowDetails(true)
  }

  const handleSaveImmobilie = async (updatedImmobilie) => {
    try {
      let response
      
      // Neue Immobilie erstellen oder existierende updaten
      if (updatedImmobilie.id) {
        // UPDATE
        response = await fetch(`http://localhost:5000/api/immobilien/${updatedImmobilie.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedImmobilie)
        })
      } else {
        // CREATE
        response = await fetch('http://localhost:5000/api/immobilien', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedImmobilie)
        })
      }

      if (response.ok) {
        alert('✅ Immobilie gespeichert!')
        setShowDetails(false)
        fetchImmobilien()
      } else {
        alert('❌ Fehler beim Speichern')
      }
    } catch (error) {
      console.error('Error saving immobilie:', error)
      alert('❌ Fehler: ' + error.message)
    }
  }

  const handleNewImmobilie = () => {
    const newImmobilie = {
      kunde_id: kundeId
    }
    setSelectedImmobilie(newImmobilie)
    setShowDetails(true)
  }

  if (loading) return <div className="immobilien-tab"><p>⏳ Lade Immobilien...</p></div>

  return (
    <div className="immobilien-tab">
      <div className="tab-header">
        <h2>🏠 Immobilien</h2>
        <button className="button-new" onClick={handleNewImmobilie}>+ Neue Immobilie</button>
      </div>

      {immobilien.length === 0 ? (
        <div className="empty-state">
          <p>Keine Immobilien erfasst</p>
        </div>
      ) : (
        <table className="immobilien-table">
          <thead>
            <tr>
              <th>Adresse</th>
              <th>Immobilienart</th>
              <th>Wohnortstatus</th>
              <th>Baujahr</th>
              <th>Gebäudeversicherungswert</th>
              <th>Aktion</th>
            </tr>
          </thead>
          <tbody>
            {immobilien.map(immobilie => (
              <tr key={immobilie.id}>
                <td><strong>{immobilie.strasse} {immobilie.hausnummer}, {immobilie.plz} {immobilie.ort}</strong></td>
                <td>{immobilie.immobilienart || '-'}</td>
                <td>{immobilie.wohnort_status || '-'}</td>
                <td>{immobilie.baujahr || '-'}</td>
                <td>{immobilie.gebaeudeversicherungswert ? immobilie.gebaeudeversicherungswert.toLocaleString('de-CH') + ' CHF' : '-'}</td>
                <td>
                  <button 
                    className="button-details"
                    onClick={() => handleOpenDetails(immobilie)}
                  >
                    👁️ Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showDetails && selectedImmobilie && (
        <ImmobildienDetailsModal 
          immobilie={selectedImmobilie}
          onClose={() => setShowDetails(false)}
          onSave={handleSaveImmobilie}
        />
      )}
    </div>
  )
}

export default ImmobildienTab
