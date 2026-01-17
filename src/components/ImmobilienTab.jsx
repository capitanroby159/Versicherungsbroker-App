import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './ImmobilienTab.css'

function ImmobilienTab() {
  const navigate = useNavigate()
  const [immobilien, setImmobilien] = useState([])
  const [kunden, setKunden] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [immobRes, kundenRes] = await Promise.all([
        fetch('http://localhost:5000/api/immobilien'),
        fetch('http://localhost:5000/api/kunden')
      ])
      const immobData = await immobRes.json()
      const kundenData = await kundenRes.json()
      setImmobilien(immobData)
      setKunden(kundenData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getKundenName = (kundeId) => {
    const kunde = kunden.find(k => k.id === kundeId)
    return kunde ? `${kunde.vorname} ${kunde.nachname}` : 'Unbekannt'
  }

  if (loading) {
    return <div className="card">Laden...</div>
  }

  return (
    <div>
      <h2>🏠 Immobilien</h2>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Kunde</th>
              <th>Straße</th>
              <th>Hausnummer</th>
              <th>PLZ</th>
              <th>Ort</th>
              <th>Objekttyp</th>
              <th>Baujahr</th>
              <th>Aktion</th>
            </tr>
          </thead>
          <tbody>
            {immobilien.map(immo => (
              <tr key={immo.id}>
                <td>{immo.id}</td>
                <td>{getKundenName(immo.kunde_id)}</td>
                <td>{immo.strasse}</td>
                <td>{immo.hausnummer}</td>
                <td>{immo.plz}</td>
                <td>{immo.ort}</td>
                <td>{immo.immobilienart}</td>
                <td>{immo.baujahr}</td>
                <td>
                  <button 
                    className="button-view"
                    onClick={() => navigate(`/immobilien/${immo.id}`)}
                  >
                    Ansicht
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ImmobilienTab
