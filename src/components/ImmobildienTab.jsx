import { useState, useEffect } from 'react'
import { formatCHF, formatNumber, formatPercent, getKPIColor, getHypoQuoteColor } from '../utils/formatters'
import ImmobildienDetailsModal from './ImmobildienDetailsModal'
import './ImmobildienTab.css'

function ImmobildienTab({ kundeId }) {
  const [immobilien, setImmobilien] = useState([])
  const [allHypotheken, setAllHypotheken] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedImmobilie, setSelectedImmobilie] = useState(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    fetchData()
  }, [kundeId])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      const token = localStorage.getItem('auth_token')
      
      // 1. Lade Immobilien
      const immoResponse = await fetch('http://localhost:5000/api/immobilien', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      if (!immoResponse.ok) throw new Error('Fehler beim Laden der Immobilien')
      const immoData = await immoResponse.json()
      
      // Filter Immobilien falls kundeId gesetzt
      let filteredImmobilien = immoData
      if (kundeId) {
        filteredImmobilien = immoData.filter(i => i.kunde_id === kundeId)
      }
      setImmobilien(filteredImmobilien)
      
      // 2. Lade Hypotheken für JEDE Immobilie
      const allHypos = []
      for (const immo of filteredImmobilien) {
        try {
          const hypoResponse = await fetch(`http://localhost:5000/api/hypotheken/immobilie/${immo.id}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
          if (hypoResponse.ok) {
            const hypos = await hypoResponse.json()
            allHypos.push(...hypos)
          }
        } catch (error) {
          console.warn(`Fehler beim Laden der Hypotheken für Immobilie ${immo.id}:`, error)
        }
      }
      
      console.log('✅ Hypotheken geladen:', allHypos.length, 'Einträge')
      setAllHypotheken(allHypos)
    } catch (error) {
      console.error('Error fetching data:', error)
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
      
      const token = localStorage.getItem('auth_token')
      
      if (updatedImmobilie.id) {
        response = await fetch(`http://localhost:5000/api/immobilien/${updatedImmobilie.id}`, {
          method: 'PUT',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify(updatedImmobilie)
        })
      } else {
        response = await fetch('http://localhost:5000/api/immobilien', {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify(updatedImmobilie)
        })
      }

      if (response.ok) {
        alert('✅ Immobilie gespeichert!')
        setShowDetails(false)
        fetchData()
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

  const handleDeleteImmobilie = async (immobilieId) => {
    if (!confirm('🗑️ Immobilie wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden!')) {
      return
    }

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`http://localhost:5000/api/immobilien/${immobilieId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        alert('✅ Immobilie gelöscht!')
        fetchData()
      } else {
        alert('❌ Fehler beim Löschen')
      }
    } catch (error) {
      console.error('Error deleting immobilie:', error)
      alert('❌ Fehler: ' + error.message)
    }
  }

  const calculateSummary = () => {
    if (immobilien.length === 0) return null

    let totalGebaeudeversicherungswert = 0
    let totalKaufpreis = 0
    let totalMietertrag = 0
    let totalHypothek = 0
    let totalZinskosten = 0
    let hypothekenData = []

    immobilien.forEach(immo => {
      const gebaeudeversicherungswert = parseFloat(immo.gebaeudeversicherungswert) || 0
      const kaufpreis = parseFloat(immo.kaufpreis) || 0
      const mietertrag = parseFloat(immo.mietertrag_jaehrlich) || 0

      totalGebaeudeversicherungswert += gebaeudeversicherungswert
      totalKaufpreis += kaufpreis
      totalMietertrag += mietertrag

      const immoHypotheken = allHypotheken.filter(h => h.immobilie_id === immo.id)
      immoHypotheken.forEach(hypo => {
        const betrag = parseFloat(hypo.betrag) || 0
        const zinssatz = parseFloat(hypo.zinssatz) || 0
        totalHypothek += betrag
        totalZinskosten += (betrag * zinssatz / 100)
        hypothekenData.push({ betrag, zinssatz })
      })
    })

    const totalEigenkapital = totalKaufpreis - totalHypothek
    const totalGewinn = totalGebaeudeversicherungswert - totalKaufpreis
    const totalBruttorendite = totalGebaeudeversicherungswert > 0 ? (totalMietertrag / totalGebaeudeversicherungswert * 100) : 0
    const totalEigenkapitalrendite = totalEigenkapital > 0 ? (totalGewinn / totalEigenkapital * 100) : null
    const hypoQuote = totalGebaeudeversicherungswert > 0 ? (totalHypothek / totalGebaeudeversicherungswert * 100) : 0
    const durchschnittZinssatz = hypothekenData.length > 0 
      ? hypothekenData.reduce((sum, h) => sum + h.zinssatz, 0) / hypothekenData.length 
      : 0

    return {
      totalGewinn,
      totalBruttorendite,
      totalEigenkapitalrendite,
      totalGebaeudeversicherungswert,
      totalHypothek,
      totalEigenkapital,
      hypoQuote,
      durchschnittZinssatz,
      totalZinskosten,
      totalMietertrag,
      immobilienCount: immobilien.length
    }
  }

  const summary = calculateSummary()

  if (loading) return <div className="immobilien-tab"><p>⏳ Lade Immobilien...</p></div>

  return (
    <div className="immobilien-tab">
      <div className="tab-header">
        <h2>🏠 Immobilien</h2>
        <button className="button-new" onClick={handleNewImmobilie}>+ Neue Immobilie</button>
      </div>

      {summary && (
        <div className="summary-dashboard">
          <div className="summary-kpi-section">
            <div className="summary-kpi-card">
              <div className="summary-kpi-label">Gewinn/Verlust (Total)</div>
              <div className="summary-kpi-value" style={{color: getKPIColor(summary.totalGewinn, 'gewinn')}}>
                {formatCHF(summary.totalGewinn)}
              </div>
            </div>
            <div className="summary-kpi-card">
              <div className="summary-kpi-label">Bruttorendite</div>
              <div className="summary-kpi-value" style={{color: getKPIColor(summary.totalBruttorendite, 'bruttorendite')}}>
                {formatPercent(summary.totalBruttorendite)}
              </div>
            </div>
            <div className="summary-kpi-card">
              <div className="summary-kpi-label">EK-Rendite</div>
              <div className="summary-kpi-value" style={{color: summary.totalEigenkapitalrendite !== null ? getKPIColor(summary.totalEigenkapitalrendite, 'eigenkapitalrendite') : '#999'}}>
                {summary.totalEigenkapitalrendite !== null ? formatPercent(summary.totalEigenkapitalrendite) : '-'}
              </div>
            </div>
          </div>

          <div className="summary-stats-grid">
            <div className="summary-stat-card">
              <span>Total Gebäudewert</span>
              <strong>{formatCHF(summary.totalGebaeudeversicherungswert)}</strong>
            </div>
            <div className="summary-stat-card">
              <span>Total Hypothek</span>
              <strong>{formatCHF(summary.totalHypothek)}</strong>
            </div>
            <div className="summary-stat-card">
              <span>Total Eigenkapital</span>
              <strong>{formatCHF(summary.totalEigenkapital)}</strong>
            </div>
            <div className="summary-stat-card" style={{backgroundColor: getHypoQuoteColor(summary.hypoQuote) + '20', borderLeftColor: getHypoQuoteColor(summary.hypoQuote)}}>
              <span>Hypotheken-Quote</span>
              <strong style={{color: getHypoQuoteColor(summary.hypoQuote)}}>
                {formatPercent(summary.hypoQuote)}
              </strong>
            </div>
            <div className="summary-stat-card">
              <span>Ø Zinssatz</span>
              <strong>{formatPercent(summary.durchschnittZinssatz, 3)}</strong>
            </div>
            <div className="summary-stat-card">
              <span>Total Hypothekarzins</span>
              <strong>{formatCHF(summary.totalZinskosten)}</strong>
            </div>
            <div className="summary-stat-card">
              <span>Total Mietertrag</span>
              <strong>{formatCHF(summary.totalMietertrag)}</strong>
            </div>
          </div>
        </div>
      )}

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
                <td>{immobilie.baujahr ? formatNumber(immobilie.baujahr) : '-'}</td>
                <td>{formatCHF(immobilie.gebaeudeversicherungswert)}</td>
                <td>
                  <button 
                    className="button-details"
                    onClick={() => handleOpenDetails(immobilie)}
                  >
                    👁️ Details
                  </button>
                  <button 
                    className="button-delete"
                    onClick={() => handleDeleteImmobilie(immobilie.id)}
                  >
                    🗑️ Löschen
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