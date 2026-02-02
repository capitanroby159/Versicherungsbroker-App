import { useState, useEffect } from 'react'
import AktivitaetForm from './AktivitaetForm'

export default function KundenAktivitaeten({ kundeId }) {
  const [aktivitaeten, setAktivitaeten] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedAktivitaet, setSelectedAktivitaet] = useState(null)
  const [filterStatus, setFilterStatus] = useState('alle')
  const [editAktivitaet, setEditAktivitaet] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editFormData, setEditFormData] = useState({})
  const [editAnhangFile, setEditAnhangFile] = useState(null)
  const [editAnhangFileName, setEditAnhangFileName] = useState('')

  useEffect(() => {
    console.log(`🔄 Lade Aktivitäten für Kunde: ${kundeId}`)
    fetchAktivitaeten()
  }, [kundeId])

  const fetchAktivitaeten = async () => {
    setLoading(true)
    try {
      const url = `http://localhost:5000/api/aktivitaeten/by-kunde/${kundeId}`
      console.log(`📍 Fetching: ${url}`)
      
      const res = await fetch(url)
      
      if (!res.ok) {
        console.error(`❌ HTTP ${res.status}:`, res.statusText)
        setAktivitaeten([])
        return
      }

      const data = await res.json()
      
      if (!Array.isArray(data)) {
        console.error('❌ Response ist kein Array:', data)
        setAktivitaeten([])
        return
      }

      console.log(`✅ ${data.length} Aktivitäten geladen`)
      setAktivitaeten(data)
      setSelectedAktivitaet(null)
    } catch (error) {
      console.error('❌ Fehler beim Laden:', error)
      setAktivitaeten([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('❌ Aktivität wirklich löschen?')) return

    try {
      const url = `http://localhost:5000/api/aktivitaeten/${id}`
      const res = await fetch(url, { method: 'DELETE' })

      if (res.ok) {
        alert('✅ Gelöscht!')
        fetchAktivitaeten()
      } else {
        alert(`❌ Fehler: ${res.status}`)
      }
    } catch (error) {
      alert('❌ Fehler: ' + error.message)
    }
  }

  // ============================================================
  // EDIT FUNKTIONEN
  // ============================================================
  const handleEditClick = (aktivitaet) => {
    console.log(`✏️ Bearbeite Aktivität:`, aktivitaet)
    setEditAktivitaet(aktivitaet)
    setEditFormData({
      titel: aktivitaet.titel || '',
      beschreibung: aktivitaet.beschreibung || '',
      typ: aktivitaet.typ || 'Notiz',
      richtung: aktivitaet.richtung || 'Intern',
      prioritaet: aktivitaet.prioritaet || 'Normal',
      status: aktivitaet.status || 'Geplant',
      datum: aktivitaet.datum_aktivitaet || '',
      uhrzeit: aktivitaet.uhrzeit_aktivitaet || '09:00',
      ort: aktivitaet.ort || ''
    })
    setEditAnhangFile(null)
    setEditAnhangFileName(aktivitaet.anhang ? `Aktuelle Datei: ${aktivitaet.anhang}` : '')
    setShowEditModal(true)
  }

  const handleEditChange = (e) => {
    const { name, value } = e.target
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleEditAnhangChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('❌ Datei zu groß! Max. 10MB.')
        return
      }
      setEditAnhangFile(file)
      setEditAnhangFileName(`Neue Datei: ${file.name}`)
    }
  }

  const handleEditSave = async () => {
    if (!editFormData.titel.trim()) {
      alert('❌ Titel ist erforderlich')
      return
    }

    try {
      console.log(`💾 Speichere Aktivität ${editAktivitaet.id}...`)
      
      const url = `http://localhost:5000/api/aktivitaeten/${editAktivitaet.id}`
      
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editFormData,
          datum: editFormData.datum ? editFormData.datum.split('T')[0] : null,
          uhrzeit: editFormData.uhrzeit,
          kunde_id: editAktivitaet.kunde_id
        })
      })

      if (!res.ok) {
        const errText = await res.text()
        console.error(`❌ HTTP ${res.status}:`, errText)
        throw new Error(`HTTP ${res.status}`)
      }

      console.log(`✅ Aktivität gespeichert`)

      // Wenn neue Datei: Upload
      if (editAnhangFile) {
        console.log(`📎 Lade Datei hoch...`)
        const formData = new FormData()
        formData.append('file', editAnhangFile)
        formData.append('aktivitaet_id', editAktivitaet.id)

        const uploadRes = await fetch('http://localhost:5000/api/aktivitaeten/upload', {
          method: 'POST',
          body: formData
        })

        if (!uploadRes.ok) {
          console.warn('⚠️ Datei-Upload hatte Problem, aber Aktivität wurde gespeichert')
        } else {
          console.log(`✅ Datei hochgeladen`)
        }
      }

      alert('✅ Aktivität aktualisiert!')
      setShowEditModal(false)
      setEditAktivitaet(null)
      
      console.log(`🔄 Lade Liste neu...`)
      await fetchAktivitaeten()
      
    } catch (error) {
      console.error('❌ Fehler beim Speichern:', error)
      alert('❌ Fehler: ' + error.message)
    }
  }

  const downloadAnhang = (filename) => {
    const url = `http://localhost:5000/api/aktivitaeten/download/${filename}`
    console.log(`📥 Download: ${url}`)
    window.location.href = url
  }

  const filteredAktivitaeten = filterStatus === 'alle' 
    ? aktivitaeten 
    : aktivitaeten.filter(a => a.status === filterStatus)

  const getStatusColor = (status) => {
    const colors = {
      'Geplant': '#3b82f6',
      'In Bearbeitung': '#f97316',
      'Abgeschlossen': '#10b981',
      'Abgebrochen': '#ef4444'
    }
    return colors[status] || '#6b7280'
  }

  const getTypeIcon = (typ) => {
    const icons = {
      'Anruf': '📞',
      'Email': '📧',
      'Meeting': '📅',
      'Aufgabe': '✓',
      'Notiz': '📝',
      'Angebot': '📋'
    }
    return icons[typ] || '📌'
  }

  if (loading) return <div className="card">⏳ Laden...</div>

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
      {/* HEADER MIT FILTER & BUTTON */}
      <div style={{display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'space-between'}}>
        <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
          <label style={{fontWeight: '600', whiteSpace: 'nowrap'}}>Filter:</label>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db'}}
          >
            <option value="alle">Alle</option>
            <option value="Geplant">Geplant</option>
            <option value="In Bearbeitung">In Bearbeitung</option>
            <option value="Abgeschlossen">Abgeschlossen</option>
          </select>
          <span style={{color: '#6b7280', fontSize: '14px'}}>({filteredAktivitaeten.length})</span>
        </div>

        <button 
          onClick={() => setShowForm(true)}
          style={{
            padding: '10px 16px',
            background: '#0369a1',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
            whiteSpace: 'nowrap'
          }}
        >
          + Neue Aktivität
        </button>
      </div>

      {/* SPLIT VIEW: LINKS & RECHTS */}
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', minHeight: '500px'}}>
        
        {/* ============================================================
            LINKE SEITE: AKTIVITÄTEN LISTE
            ============================================================ */}
        <div style={{
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '16px',
          background: 'white',
          overflowY: 'auto',
          maxHeight: '600px'
        }}>
          <h3 style={{margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#1f2937'}}>
            Aktivitäten ({filteredAktivitaeten.length})
          </h3>

          {filteredAktivitaeten.length === 0 ? (
            <div style={{padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '14px'}}>
              Keine Aktivitäten
            </div>
          ) : (
            <div style={{display: 'grid', gap: '10px'}}>
              {filteredAktivitaeten.map(a => (
                <div
                  key={a.id}
                  onClick={() => setSelectedAktivitaet(a)}
                  style={{
                    padding: '12px',
                    background: selectedAktivitaet?.id === a.id ? '#dbeafe' : '#f9fafb',
                    border: `2px solid ${selectedAktivitaet?.id === a.id ? '#0369a1' : '#e5e7eb'}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{display: 'flex', gap: '8px', alignItems: 'flex-start'}}>
                    <span style={{fontSize: '16px'}}>{getTypeIcon(a.typ)}</span>
                    <div style={{flex: 1, minWidth: 0}}>
                      <strong style={{fontSize: '13px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                        {a.titel}
                      </strong>
                      <div style={{fontSize: '11px', color: '#6b7280', marginTop: '3px'}}>
                        📅 {a.datum_aktivitaet ? new Date(a.datum_aktivitaet).toLocaleDateString('de-CH') : '-'}
                        {a.uhrzeit_aktivitaet && ` • 🕐 ${a.uhrzeit_aktivitaet.substring(0, 5)}`}
                      </div>
                      <span 
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          background: getStatusColor(a.status),
                          color: 'white',
                          borderRadius: '12px',
                          fontSize: '10px',
                          fontWeight: '600',
                          marginTop: '4px'
                        }}
                      >
                        {a.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ============================================================
            RECHTE SEITE: DETAILS PANEL
            ============================================================ */}
        <div style={{
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '16px',
          background: 'white',
          overflowY: 'auto',
          maxHeight: '600px'
        }}>
          {selectedAktivitaet ? (
            <>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb'}}>
                <h3 style={{margin: 0, fontSize: '15px', color: '#1f2937', flex: 1}}>
                  {getTypeIcon(selectedAktivitaet.typ)} {selectedAktivitaet.titel}
                </h3>
                <div style={{display: 'flex', gap: '8px'}}>
                  <button
                    onClick={() => handleEditClick(selectedAktivitaet)}
                    style={{padding: '6px 10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '600'}}
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(selectedAktivitaet.id)}
                    style={{padding: '6px 10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '600'}}
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Details Grid */}
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px'}}>
                <div>
                  <label style={{fontSize: '11px', color: '#6b7280', fontWeight: '600'}}>Typ</label>
                  <p style={{margin: '3px 0', fontSize: '13px'}}>{selectedAktivitaet.typ}</p>
                </div>
                <div>
                  <label style={{fontSize: '11px', color: '#6b7280', fontWeight: '600'}}>Status</label>
                  <p style={{margin: '3px 0', fontSize: '13px'}}>{selectedAktivitaet.status}</p>
                </div>
                <div>
                  <label style={{fontSize: '11px', color: '#6b7280', fontWeight: '600'}}>Datum</label>
                  <p style={{margin: '3px 0', fontSize: '13px'}}>
                    {selectedAktivitaet.datum_aktivitaet ? new Date(selectedAktivitaet.datum_aktivitaet).toLocaleDateString('de-CH') : '-'}
                  </p>
                </div>
                <div>
                  <label style={{fontSize: '11px', color: '#6b7280', fontWeight: '600'}}>Priorität</label>
                  <p style={{margin: '3px 0', fontSize: '13px'}}>{selectedAktivitaet.prioritaet}</p>
                </div>
                {selectedAktivitaet.uhrzeit_aktivitaet && (
                  <div>
                    <label style={{fontSize: '11px', color: '#6b7280', fontWeight: '600'}}>🕐 Uhrzeit</label>
                    <p style={{margin: '3px 0', fontSize: '13px'}}>{selectedAktivitaet.uhrzeit_aktivitaet}</p>
                  </div>
                )}
                {selectedAktivitaet.ort && (
                  <div>
                    <label style={{fontSize: '11px', color: '#6b7280', fontWeight: '600'}}>📍 Ort</label>
                    <p style={{margin: '3px 0', fontSize: '13px'}}>{selectedAktivitaet.ort}</p>
                  </div>
                )}
                {selectedAktivitaet.richtung && selectedAktivitaet.typ !== 'Meeting' && (
                  <div>
                    <label style={{fontSize: '11px', color: '#6b7280', fontWeight: '600'}}>Richtung</label>
                    <p style={{margin: '3px 0', fontSize: '13px'}}>{selectedAktivitaet.richtung}</p>
                  </div>
                )}
              </div>

              {/* Beschreibung */}
              {selectedAktivitaet.beschreibung && (
                <div style={{marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb'}}>
                  <label style={{fontSize: '11px', color: '#6b7280', fontWeight: '600'}}>Beschreibung</label>
                  <p style={{margin: '4px 0', fontSize: '13px', whiteSpace: 'pre-wrap', color: '#374151'}}>
                    {selectedAktivitaet.beschreibung}
                  </p>
                </div>
              )}

              {/* ANHANG - ✅ FIXED */}
              {selectedAktivitaet.anhang ? (
                <div style={{
                  padding: '12px',
                  background: '#f0fdf4',
                  border: '1px solid #86efac',
                  borderRadius: '6px',
                  marginBottom: '12px'
                }}>
                  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '10px', flex: 1}}>
                      <span style={{fontSize: '20px'}}>📎</span>
                      <div style={{flex: 1}}>
                        <div style={{fontSize: '13px', color: '#1f2937', fontWeight: '600', wordBreak: 'break-word'}}>
                          {selectedAktivitaet.anhang}
                        </div>
                        {selectedAktivitaet.anhang_dateigrösse && (
                          <div style={{fontSize: '11px', color: '#6b7280', marginTop: '2px'}}>
                            {(selectedAktivitaet.anhang_dateigrösse / 1024).toFixed(1)} KB
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => downloadAnhang(selectedAktivitaet.anhang)}
                      style={{
                        padding: '8px 12px',
                        background: '#06b6d4',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '12px',
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                      }}
                    >
                      📥 Download
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: '12px',
                  background: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  marginBottom: '12px',
                  textAlign: 'center',
                  color: '#6b7280',
                  fontSize: '12px'
                }}>
                  Keine Datei angehängt
                </div>
              )}

              {/* Meta Info */}
              <div style={{fontSize: '10px', color: '#9ca3af', paddingTop: '10px', borderTop: '1px solid #e5e7eb'}}>
                Erstellt: {new Date(selectedAktivitaet.datum_erstellt).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </div>
            </>
          ) : (
            <div style={{textAlign: 'center', color: '#9ca3af', paddingTop: '40px'}}>
              Wähle eine Aktivität aus um Details zu sehen
            </div>
          )}
        </div>
      </div>

      {/* NEUE AKTIVITÄT MODAL */}
      {showForm && (
        <AktivitaetForm
          kundeId={kundeId}
          onSave={() => {
            setShowForm(false)
            fetchAktivitaeten()
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* EDIT MODAL */}
      {showEditModal && editAktivitaet && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '85vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            <h2 style={{margin: '0 0 20px 0', fontSize: '18px'}}>✏️ Aktivität bearbeiten</h2>

            <div style={{marginBottom: '16px'}}>
              <label style={{display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '14px'}}>Titel *</label>
              <input
                type="text"
                name="titel"
                value={editFormData.titel}
                onChange={handleEditChange}
                style={{width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', boxSizing: 'border-box'}}
              />
            </div>

            <div style={{marginBottom: '16px'}}>
              <label style={{display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '14px'}}>Beschreibung</label>
              <textarea
                name="beschreibung"
                value={editFormData.beschreibung}
                onChange={handleEditChange}
                rows="3"
                style={{width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', boxSizing: 'border-box', fontFamily: 'inherit'}}
              />
            </div>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px'}}>
              <div>
                <label style={{display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '14px'}}>Typ</label>
                <select
                  name="typ"
                  value={editFormData.typ}
                  onChange={handleEditChange}
                  style={{width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px'}}
                >
                  <option>Anruf</option>
                  <option>Email</option>
                  <option>Meeting</option>
                  <option>Aufgabe</option>
                  <option>Notiz</option>
                  <option>Angebot</option>
                </select>
              </div>

              {editFormData.typ !== 'Meeting' && (
                <div>
                  <label style={{display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '14px'}}>Richtung</label>
                  <select
                    name="richtung"
                    value={editFormData.richtung}
                    onChange={handleEditChange}
                    style={{width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px'}}
                  >
                    <option>Eingehend</option>
                    <option>Ausgehend</option>
                    <option>Intern</option>
                  </select>
                </div>
              )}

              {editFormData.typ === 'Meeting' && (
                <div>
                  <label style={{display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '14px'}}>📍 Ort</label>
                  <input
                    type="text"
                    name="ort"
                    value={editFormData.ort}
                    onChange={handleEditChange}
                    placeholder="z.B. Zürich Bahnhof"
                    style={{width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', boxSizing: 'border-box'}}
                  />
                </div>
              )}
            </div>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px'}}>
              <div>
                <label style={{display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '14px'}}>Priorität</label>
                <select
                  name="prioritaet"
                  value={editFormData.prioritaet}
                  onChange={handleEditChange}
                  style={{width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px'}}
                >
                  <option>Kritisch</option>
                  <option>Hoch</option>
                  <option>Normal</option>
                  <option>Niedrig</option>
                </select>
              </div>

              <div>
                <label style={{display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '14px'}}>Status</label>
                <select
                  name="status"
                  value={editFormData.status}
                  onChange={handleEditChange}
                  style={{width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px'}}
                >
                  <option>Geplant</option>
                  <option>In Bearbeitung</option>
                  <option>Abgeschlossen</option>
                  <option>Abgebrochen</option>
                </select>
              </div>

              <div>
                <label style={{display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '14px'}}>Datum</label>
                <input
                  type="date"
                  name="datum"
                  value={editFormData.datum}
                  onChange={handleEditChange}
                  style={{width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px'}}
                />
              </div>
            </div>

            {editFormData.typ === 'Meeting' && (
              <div style={{marginBottom: '16px'}}>
                <label style={{display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '14px'}}>🕐 Uhrzeit</label>
                <input
                  type="time"
                  name="uhrzeit"
                  value={editFormData.uhrzeit}
                  onChange={handleEditChange}
                  style={{width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px'}}
                />
              </div>
            )}

            {/* DATEI-UPLOAD */}
            <div style={{marginBottom: '16px', padding: '12px', background: '#f0f9ff', borderRadius: '6px', border: '1px solid #bfdbfe'}}>
              <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px'}}>📎 Datei</label>
              <input
                type="file"
                onChange={handleEditAnhangChange}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip,.txt"
                style={{width: '100%', padding: '8px'}}
              />
              {editAnhangFileName && (
                <div style={{fontSize: '12px', color: '#0369a1', marginTop: '8px', fontWeight: '600'}}>
                  {editAnhangFileName}
                </div>
              )}
              <span style={{fontSize: '11px', color: '#6b7280', marginTop: '6px', display: 'block'}}>
                Max. 10MB (optional - leerlassen wenn keine neue Datei)
              </span>
            </div>

            {/* Buttons */}
            <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e5e7eb'}}>
              <button
                onClick={() => setShowEditModal(false)}
                style={{padding: '10px 16px', background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontWeight: '600'}}
              >
                Abbrechen
              </button>
              <button
                onClick={handleEditSave}
                style={{padding: '10px 16px', background: '#0369a1', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600'}}
              >
                💾 Speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}