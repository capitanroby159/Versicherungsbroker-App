import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatCHF } from '../utils/formatters'
import './PoliceTab.css'

function PoliceTab() {
  const navigate = useNavigate()
  const [policen, setPolicen] = useState([])
  const [kunden, setKunden] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [policenRes, kundenRes] = await Promise.all([
        fetch('http://localhost:5000/api/policen'),
        fetch('http://localhost:5000/api/kunden')
      ])
      const policenData = await policenRes.json()
      const kundenData = await kundenRes.json()
      setPolicen(policenData)
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

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('de-CH')
  }

  const isExpiringSoon = (enddatum) => {
    if (!enddatum) return false
    const endDate = new Date(enddatum)
    const today = new Date()
    const daysUntilExpiry = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry < 90 && daysUntilExpiry > 0
  }

  const isExpired = (enddatum) => {
    if (!enddatum) return false
    return new Date(enddatum) < new Date()
  }

  if (loading) {
    return <div className="card">Laden...</div>
  }

  return (
    <div>
      <h2>📋 Policenverwaltung</h2>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Kunde</th>
              <th>Policenummer</th>
              <th>Prämie</th>
              <th>Startdatum</th>
              <th>Enddatum</th>
              <th>Status</th>
              <th>Aktion</th>
            </tr>
          </thead>
          <tbody>
            {policen.map(police => (
              <tr key={police.id} className={isExpired(police.ende) ? 'expired' : ''}>
                <td>{police.id}</td>
                <td>{getKundenName(police.kunde_id)}</td>
                <td>{police.policennummer}</td>
                <td>{formatCHF(police.praemie_chf)}</td>
                <td>{formatDate(police.beginn)}</td>
                <td>{formatDate(police.ende)}</td>
                <td>
                  {isExpired(police.ende) && <span className="status-expired">⚠️ Abgelaufen</span>}
                  {isExpiringSoon(police.ende) && !isExpired(police.ende) && <span className="status-expiring">🔔 Läuft bald ab</span>}
                  {!isExpired(police.ende) && !isExpiringSoon(police.ende) && <span className="status-active">✅ Aktiv</span>}
                </td>
                <td>
                  <button 
                    className="button-view"
                    onClick={() => navigate(`/police/${police.id}`)}
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

export default PoliceTab