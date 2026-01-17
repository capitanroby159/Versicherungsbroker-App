import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './KundenTab.css'

function KundenTab() {
  const [kunden, setKunden] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showNewKundenForm, setShowNewKundenForm] = useState(false)
  const [newKundeForm, setNewKundeForm] = useState({
    vorname: '',
    nachname: '',
    typ: 'Privat',
    email: '',
    telefon: ''
  })
  const navigate = useNavigate()

  useEffect(() => {
    fetchKunden()
  }, [])

  const fetchKunden = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('📥 Fetching kunden from /api/kunden...')
      
      const response = await fetch('http://localhost:5000/api/kunden')
      
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

  const handleNewKundeChange = (e) => {
    const { name, value } = e.target
    setNewKundeForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleCreateKunde = async (e) => {
    e.preventDefault()

    if (!newKundeForm.vorname.trim() || !newKundeForm.nachname.trim()) {
      alert('❌ Vorname und Nachname sind erforderlich!')
      return
    }

    try {
      const response = await fetch('http://localhost:5000/api/kunden', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newKundeForm)
      })

      const data = await response.json()

      if (response.ok) {
        console.log('✅ Kunde erstellt:', data)
        alert('✅ Kunde erstellt!')
        setShowNewKundenForm(false)
        setNewKundeForm({
          vorname: '',
          nachname: '',
          typ: 'Privat',
          email: '',
          telefon: ''
        })
        fetchKunden()
      } else {
        alert('❌ Fehler: ' + (data.message || data.error))
      }
    } catch (error) {
      console.error('❌ Error creating kunde:', error)
      alert('❌ Fehler beim Erstellen: ' + error.message)
    }
  }

  const getTypeIcon = (typ) => {
    const typeVal = typ || 'Privat'
    if (typeVal === 'Privat') return '👤'
    if (typeVal === 'Geschäft') return '🏢'
    if (typeVal === 'Partner') return '🤝'
    return '👤'
  }

  const getTypeClass = (typ) => {
    const typeVal = (typ || 'Privat').toLowerCase()
    return typeVal
  }

  if (loading) {
    return <div className="kunden-tab"><p>⏳ Lade Kunden...</p></div>
  }

  return (
    <div className="kunden-tab">
      <div className="kunden-header">
        <h2>👥 Kunden</h2>
        <button className="button-new-kunde" onClick={() => setShowNewKundenForm(true)}>
          + Neue Kunden
        </button>
      </div>

      {error && (
        <div className="error-box">
          <p>❌ {error}</p>
          <button onClick={fetchKunden}>🔄 Erneut versuchen</button>
        </div>
      )}

      {/* NEW KUNDE FORM */}
      {showNewKundenForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Neue Kunden erfassen</h3>
            <form onSubmit={handleCreateKunde} className="new-kunde-form">
              <div className="form-group">
                <label>Vorname *</label>
                <input
                  type="text"
                  name="vorname"
                  value={newKundeForm.vorname}
                  onChange={handleNewKundeChange}
                  required
                  placeholder="z.B. Max"
                />
              </div>
              <div className="form-group">
                <label>Nachname *</label>
                <input
                  type="text"
                  name="nachname"
                  value={newKundeForm.nachname}
                  onChange={handleNewKundeChange}
                  required
                  placeholder="z.B. Muster"
                />
              </div>
              <div className="form-group">
                <label>Kundentyp</label>
                <select name="typ" value={newKundeForm.typ} onChange={handleNewKundeChange}>
                  <option value="Privat">👤 Privat</option>
                  <option value="Geschäft">🏢 Geschäft</option>
                  <option value="Partner">🤝 Partner</option>
                </select>
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={newKundeForm.email}
                  onChange={handleNewKundeChange}
                  placeholder="max@example.com"
                />
              </div>
              <div className="form-group">
                <label>Telefon</label>
                <input
                  type="tel"
                  name="telefon"
                  value={newKundeForm.telefon}
                  onChange={handleNewKundeChange}
                  placeholder="+41 44 123 45 67"
                />
              </div>

              <div className="modal-actions">
                <button type="submit" className="button-primary">✅ Erstellen</button>
                <button type="button" className="button-secondary" onClick={() => setShowNewKundenForm(false)}>
                  ❌ Abbrechen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KUNDEN LIST */}
      {kunden.length === 0 ? (
        <div className="empty-state">
          <p>📭 Keine Kunden erfasst</p>
          <button className="button-new-kunde" onClick={() => setShowNewKundenForm(true)}>
            + Erste Kunden erstellen
          </button>
        </div>
      ) : (
        <div className="kunden-list">
          {kunden.map(kunde => (
            <div 
              key={kunde.id} 
              className="kunde-card" 
              onClick={() => {
                console.log('🔗 Navigating to /kunden/' + kunde.id)
                navigate(`/kunden/${kunde.id}`)
              }}
            >
              <div className="kunde-card-header">
                <h3>{kunde.vorname} {kunde.nachname}</h3>
                <span className={`type-badge ${getTypeClass(kunde.typ)}`}>
                  {getTypeIcon(kunde.typ)} {kunde.typ || 'Privat'}
                </span>
              </div>
              <div className="kunde-card-details">
                {kunde.email && <p>📧 {kunde.email}</p>}
                {kunde.telefon && <p>📞 {kunde.telefon}</p>}
                {kunde.status && <p>📌 {kunde.status}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default KundenTab
