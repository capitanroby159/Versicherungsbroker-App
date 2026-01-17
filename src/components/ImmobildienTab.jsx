import { useState, useEffect } from 'react'
import ImmobildienDetailsModal from './ImmobildienDetailsModal'
import './ImmobildienTab.css'

// ===== UTILITY FUNCTIONS =====
const formatCHF = (value) => {
  if (!value && value !== 0) return '-'
  const num = parseFloat(value)
  if (isNaN(num)) return '-'
  
  const rounded = Math.round(num * 20) / 20
  
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(rounded)
}

const formatNumber = (value) => {
  if (!value && value !== 0) return '-'
  const num = parseFloat(value)
  if (isNaN(num)) return '-'
  
  return new Intl.NumberFormat('de-CH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num)
}

const formatPercent = (value, decimals = 2) => {
  if (!value && value !== 0) return '-'
  const num = parseFloat(value)
  if (isNaN(num)) return '-'
  
  return num.toFixed(decimals) + '%'
}

// ===== KPI COLOR HELPER =====
const getKPIColor = (value, type) => {
  if (!value && value !== 0) return '#999'
  
  const num = parseFloat(value)
  if (isNaN(num)) return '#999'
  
  if (type === 'gewinn') {
    return num >= 0 ? '#10b981' : '#ef4444'
  } else if (type === 'bruttorendite') {
    if (num >= 5) return '#10b981'
    if (num >= 3) return '#f59e0b'
    return '#ef4444'
  } else if (type === 'eigenkapitalrendite') {
    if (num >= 8) return '#10b981'
    if (num >= 4) return '#f59e0b'
    return '#ef4444'
  }
  return '#666'
}

const getHypoQuoteColor = (quote) => {
  if (quote > 80) return '#ef4444'
  if (quote >= 65) return '#f59e0b'
  return '#10b981'
}

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
      
      if (updatedImmobilie.id) {
        response = await fetch(`http://localhost:5000/api/immobilien/${updatedImmobilie.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedImmobilie)
        })
      } else {
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

  // ===== SUMMARY CALCULATIONS =====
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

      // Parse hypotheken
      try {
        const hypos = immo.hypotheken ? JSON.parse(typeof immo.hypotheken === 'string' ? immo.hypotheken : JSON.stringify(immo.hypotheken)) : []
        hypos.forEach(hypo => {
          const betrag = parseFloat(hypo.betrag) || 0
          const zinssatz = parseFloat(hypo.zinssatz) || 0
          totalHypothek += betrag
          totalZinskosten += (betrag * zinssatz / 100)
          hypothekenData.push({ betrag, zinssatz })
        })
      } catch (e) {
        console.warn('Error parsing hypotheken:', e)
      }
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

      {/* ===== SUMMARY DASHBOARD ===== */}
      {summary && (
        <div className="summary-dashboard">
          {/* KPI Cards */}
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

          {/* Stats Grid */}
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