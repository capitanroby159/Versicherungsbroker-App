import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import KundenFormModal from './KundenFormModal'
import './KundenTab.css'

function KundenTab() {
  const [kunden, setKunden] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editingKunde, setEditingKunde] = useState(null)
  const [filterVorname, setFilterVorname] = useState('')
  const [filterNachname, setFilterNachname] = useState('')
  const [filterOrt, setFilterOrt] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    fetchKunden()
  }, [])

  const fetchKunden = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('📥 Fetching kunden from /api/kunden...')
      
      const token = localStorage.getItem('auth_token')
      const response = await fetch('http://localhost:5000/api/kunden', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('✅ Loaded kunden:', data)
      
      if (Array.isArray(data)) {
        setKunden(data)
      } else {
        console.error('❌ Response is not an array:', data)
        setError('Ungültiges Datenformat vom Server')
        setKunden([])
      }
    } catch (error) {
      console.error('❌ Error fetching kunden:', error.message)
      setError(`Fehler beim Laden: ${error.message}`)
      setKunden([])
    } finally {
      setLoading(false)
    }
  }

  const handleNewKunde = () => {
    console.log('➕ Creating new kunde')
    setEditingKunde(null)
    setShowModal(true)
  }

  const handleEditKunde = (kunde) => {
    console.log('✏️ Editing kunde:', kunde)
    setEditingKunde(kunde)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    console.log('❌ Closing modal')
    setShowModal(false)
    setEditingKunde(null)
  }

  const handleSaveKunde = (savedKundeData) => {
    // MODAL speichert schon in KundenFormModal.jsx!
    // Hier machen wir NUR: Modal schließen + Daten refreshen
    console.log('✅ Kunde gespeichert (vom Modal):', savedKundeData)
    setShowModal(false)
    setEditingKunde(null)
    fetchKunden()  // Refresh die Liste
    // KEINEN weiteren API Call machen!
  }

  const handleDeleteKunde = async (kundeId) => {
    if (!confirm('Kunde wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden!')) {
      return
    }

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`http://localhost:5000/api/kunden/${kundeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        alert('✅ Kunde gelöscht!')
        fetchKunden()
      } else {
        alert('❌ Fehler beim Löschen')
      }
    } catch (error) {
      console.error('Error deleting kunde:', error)
      alert('❌ Fehler: ' + error.message)
    }
  }

  // Filter
  const filteredKunden = kunden.filter(kunde => {
    const vornameLower = (kunde.vorname || '').toLowerCase()
    const nachnameLower = (kunde.nachname || '').toLowerCase()
    const ortLower = (kunde.ort || '').toLowerCase()
    
    return (
      vornameLower.includes(filterVorname.toLowerCase()) &&
      nachnameLower.includes(filterNachname.toLowerCase()) &&
      ortLower.includes(filterOrt.toLowerCase())
    )
  })

  if (loading) {
    return <div className="kunden-tab"><p>⏳ Lade Kunden...</p></div>
  }

  return (
    <div className="kunden-tab">
      <div className="kunden-header">
        <h2>👥 Kunden</h2>
        <button className="button-new-kunde" onClick={handleNewKunde}>
          + Neuer Kunde
        </button>
      </div>

      {error && (
        <div className="error-box">
          <p>❌ {error}</p>
          <button onClick={fetchKunden}>🔄 Erneut versuchen</button>
        </div>
      )}

      {/* FILTER SECTION */}
      {kunden.length > 0 && (
        <div className="filter-section">
          <div className="filter-group">
            <input 
              type="text" 
              placeholder="Filter nach Vorname..." 
              value={filterVorname}
              onChange={(e) => setFilterVorname(e.target.value)}
              className="filter-input"
            />
          </div>
          <div className="filter-group">
            <input 
              type="text" 
              placeholder="Filter nach Nachname..." 
              value={filterNachname}
              onChange={(e) => setFilterNachname(e.target.value)}
              className="filter-input"
            />
          </div>
          <div className="filter-group">
            <input 
              type="text" 
              placeholder="Filter nach Ort..." 
              value={filterOrt}
              onChange={(e) => setFilterOrt(e.target.value)}
              className="filter-input"
            />
          </div>
        </div>
      )}

      {filteredKunden.length === 0 ? (
        <div className="empty-state">
          <p>📭 {kunden.length === 0 ? 'Keine Kunden erfasst' : 'Keine Kunden entsprechen den Filterkriterien'}</p>
          <button className="button-new-kunde" onClick={handleNewKunde}>
            + {kunden.length === 0 ? 'Ersten Kunden erstellen' : 'Neuer Kunde'}
          </button>
        </div>
      ) : (
        <div className="kunden-table-wrapper">
          <table className="kunden-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Telefon</th>
                <th>Ort</th>
                <th>Status</th>
                <th>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {filteredKunden.map(kunde => (
                <tr key={kunde.id}>
                  <td>
                    <button 
                      className="kunde-name-link"
                      onClick={() => navigate(
                        kunde.kundentyp === 'Firma' 
                          ? `/kunden/firma/${kunde.id}` 
                          : `/kunden/${kunde.id}`
                      )}
                    >
                      {kunde.kundentyp === 'Firma' && kunde.firma_name
                        ? kunde.firma_name
                        : (kunde.vorname && kunde.nachname 
                            ? `${kunde.vorname} ${kunde.nachname}`
                            : kunde.firma_name || 'Unbekannt'
                          )
                      }
                    </button>
                  </td>
                  <td>
                    {kunde.emails && Array.isArray(kunde.emails) && kunde.emails.length > 0 
                      ? (typeof kunde.emails[0] === 'object' ? kunde.emails[0].email : kunde.emails[0])
                      : '-'
                    }
                  </td>
                  <td>
                    {kunde.telefone && Array.isArray(kunde.telefone) && kunde.telefone.length > 0 
                      ? (typeof kunde.telefone[0] === 'object' ? kunde.telefone[0].telefon : kunde.telefone[0])
                      : '-'
                    }
                  </td>
                  <td>{kunde.ort || '-'}</td>
                  <td>
                    <span className={`status-badge ${(kunde.status || 'Aktiv').toLowerCase()}`}>
                      {kunde.status || 'Aktiv'}
                    </span>
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button 
                        className="button-edit"
                        onClick={() => handleEditKunde(kunde)}
                      >
                        Bearbeiten
                      </button>
                      <button 
                        className="button-delete"
                        onClick={() => handleDeleteKunde(kunde.id)}
                      >
                        Löschen
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL - SHOWN WHEN showModal = true */}
      {/* ============================================================ */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <KundenFormModal 
              kunde={editingKunde}
              onCancel={handleCloseModal}
              onSaveSuccess={handleSaveKunde}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default KundenTab