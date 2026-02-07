import { useState, useEffect } from 'react'
import { formatCHF, formatDate } from '../utils/formatters'
import PolicenDetailsModal from './PolicenDetailsModal'
import './PolicenTab.css'

function PolicenTab({ kundeId, kundeTyp }) {
  const [policen, setPolicen] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPolice, setSelectedPolice] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  
  // Filter
  const [filterSparte, setFilterSparte] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPrioritaet, setFilterPrioritaet] = useState('')
  const [sparten, setSparten] = useState([])

  useEffect(() => {
    fetchPolicen()
    fetchSparten()
  }, [kundeId, filterSparte, filterStatus, filterPrioritaet])

  const fetchPolicen = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')
      
      // Query-Parameter bauen
      const params = new URLSearchParams()
      if (kundeId) params.append('kunde_id', kundeId)
      if (filterSparte) params.append('sparte_id', filterSparte)
      if (filterStatus) params.append('status_detail', filterStatus)
      if (filterPrioritaet) params.append('prioritaet', filterPrioritaet)

      const response = await fetch(`http://localhost:5000/api/policen?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) throw new Error('Fehler beim Laden')
      const data = await response.json()
      setPolicen(data)
    } catch (error) {
      console.error('Error fetching policen:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSparten = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('http://localhost:5000/api/sparten', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      if (response.ok) {
        const data = await response.json()
        setSparten(data)
      }
    } catch (error) {
      console.error('Error fetching sparten:', error)
    }
  }

  const handleOpenDetails = (police) => {
    setSelectedPolice(police)
    setShowDetails(true)
  }

  const handleNewPolice = () => {
    const newPolice = {
      kunde_id: kundeId,
      kundentyp: kundeTyp,
      jkr: 'Nein',
      waehrung: 'CHF'
    }
    setSelectedPolice(newPolice)
    setShowDetails(true)
  }

  const handleSavePolice = async () => {
    fetchPolicen()
  }

  // Hilfsfunktion: Tage bis Ablauf berechnen
  const getDaysUntilExpiry = (endDate) => {
    if (!endDate) return null
    const today = new Date()
    const end = new Date(endDate)
    return Math.ceil((end - today) / (1000 * 60 * 60 * 24))
  }

  // Hilfsfunktion: Warnung-Klasse basierend auf Ablauf
  const getStatusClass = (police) => {
    if (police.status_detail === 'Abgelaufen') return 'status-expired'
    if (police.status_detail === 'Ablauf_bald') return 'status-expiring'
    if (police.status_detail === 'Aktiv') return 'status-active'
    return ''
  }

  // Hilfsfunktion: Status-Badge
  const getStatusBadge = (police) => {
    const daysLeft = getDaysUntilExpiry(police.ende)
    
    if (police.status_detail === 'Abgelaufen') {
      return <span className="badge badge-expired">⚠️ Abgelaufen</span>
    }
    if (police.status_detail === 'Ablauf_bald' || (daysLeft !== null && daysLeft < 90 && daysLeft >= 0)) {
      return <span className="badge badge-expiring">🔔 {daysLeft} Tage</span>
    }
    if (police.status_detail === 'Aktiv') {
      return <span className="badge badge-active">✅ Aktiv</span>
    }
    return <span className="badge badge-inactive">⚪ {police.status_detail}</span>
  }

  // Hilfsfunktion: Prioritäts-Icon
  const getPrioritaetIcon = (prioritaet) => {
    switch (prioritaet) {
      case 'VIP': return '⭐'
      case 'Hoch': return '🔴'
      case 'Normal': return '🟡'
      case 'Niedrig': return '🟢'
      case 'Archiv': return '⚫'
      default: return '◯'
    }
  }

  if (loading) return <div className="policen-tab"><p>⏳ Lade Policen...</p></div>

  const filteredCount = policen.length
  const totalCount = policen.length // Bei Kunde-Filter ist das bereits gefiltert

  return (
    <div className="policen-tab">
      {/* HEADER MIT BUTTON */}
      <div className="tab-header">
        <div>
          <h2>📋 Policen {filteredCount > 0 && `(${filteredCount})`}</h2>
        </div>
        <button className="button-new" onClick={handleNewPolice}>
          + Neue Police
        </button>
      </div>

      {/* FILTER-BAR */}
      <div className="filter-bar">
        <div className="filter-group">
          <label>Sparte:</label>
          <select 
            value={filterSparte} 
            onChange={(e) => setFilterSparte(e.target.value)}
          >
            <option value="">Alle</option>
            {sparten.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Status:</label>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Alle</option>
            <option value="Aktiv">✅ Aktiv</option>
            <option value="Ablauf_bald">🔔 Ablauf bald</option>
            <option value="Abgelaufen">⚠️ Abgelaufen</option>
            <option value="Inaktiv">⚪ Inaktiv</option>
            <option value="Archiv">⚫ Archiv</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Priorität:</label>
          <select 
            value={filterPrioritaet} 
            onChange={(e) => setFilterPrioritaet(e.target.value)}
          >
            <option value="">Alle</option>
            <option value="VIP">⭐ VIP</option>
            <option value="Hoch">🔴 Hoch</option>
            <option value="Normal">🟡 Normal</option>
            <option value="Niedrig">🟢 Niedrig</option>
            <option value="Archiv">⚫ Archiv</option>
          </select>
        </div>
      </div>

      {/* TABELLE ODER EMPTY STATE */}
      {policen.length === 0 ? (
        <div className="empty-state">
          <p>📭 Keine Policen gefunden</p>
          {kundeId && <p style={{ fontSize: '13px', color: '#999' }}>Starten Sie mit "+ Neue Police"</p>}
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="policen-table">
            <thead>
              <tr>
                <th>Priorität</th>
                <th>Policenummer</th>
                <th>Sparte</th>
                <th>Versicherer</th>
                <th>Prämie</th>
                <th>Gültig von</th>
                <th>Gültig bis</th>
                <th>Status</th>
                <th>Aktion</th>
              </tr>
            </thead>
            <tbody>
              {policen.map(police => {
                const total = (parseFloat(police.praemie_chf) || 0) + (parseFloat(police.gebuehren) || 0)
                return (
                  <tr key={police.id} className={getStatusClass(police)}>
                    <td className="col-priority">
                      <span className="priority-badge">{getPrioritaetIcon(police.prioritaet)}</span>
                    </td>
                    <td className="col-number">
                      <button 
                        onClick={() => handleOpenDetails(police)}
                        style={{ 
                          background: 'none', 
                          border: 'none', 
                          color: '#1e40af',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          fontSize: 'inherit',
                          fontWeight: 'bold'
                        }}
                        title="Klick zum Öffnen"
                      >
                        {police.policennummer}
                      </button>
                    </td>
                    <td className="col-sparte">{police.sparten_name || '-'}</td>
                    <td className="col-versicherer">{police.versicherer_name || '-'}</td>
                    <td className="col-premium" title={`Prämie: ${formatCHF(police.praemie_chf)}, Gebühren: ${formatCHF(police.gebuehren)}`}>
                      {formatCHF(total)}
                    </td>
                    <td className="col-date">{police.beginn ? formatDate(police.beginn) : '-'}</td>
                    <td className="col-date"><strong>{police.ende ? formatDate(police.ende) : '-'}</strong></td>
                    <td className="col-status">{getStatusBadge(police)}</td>
                    <td className="col-action">
                      <button 
                        className="button-details"
                        onClick={() => handleOpenDetails(police)}
                        title="Bearbeiten"
                      >
                        ✎ Bearbeiten
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL */}
      {showDetails && selectedPolice && (
        <PolicenDetailsModal 
          police={selectedPolice.id ? selectedPolice : null}
          kundeId={selectedPolice.kunde_id}
          kundeTyp={selectedPolice.kundentyp}
          onClose={() => setShowDetails(false)}
          onSave={handleSavePolice}
        />
      )}
    </div>
  )
}

export default PolicenTab