import { useState, useEffect } from 'react'
import './PolicenDetailsModal.css'

function PolicenDetailsModal({ police, onClose, onSave }) {
  const [formData, setFormData] = useState(police || {})
  const [branches, setBranches] = useState([])
  const [versicherers, setVersicherers] = useState([])
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [fileInput, setFileInput] = useState(null)
  const [fileCategory, setFileCategory] = useState('Police')
  const [fileDescription, setFileDescription] = useState('')
  const [editMode, setEditMode] = useState(!police?.id) // Auto-edit für neue Policen

  const formatDate = (date) => date ? date.split('T')[0] : ''

  useEffect(() => {
    fetchBranches()
    fetchVersicherers()
  }, [])

  const fetchBranches = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/branchen')
      if (response.ok) {
        const data = await response.json()
        setBranches(data || [])
      }
    } catch (error) {
      console.warn('Fehler beim Laden der Branchen:', error)
    }
  }

  const fetchVersicherers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/versicherer')
      if (response.ok) {
        const data = await response.json()
        setVersicherers(data || [])
      }
    } catch (error) {
      console.warn('Fehler beim Laden der Versicherer:', error)
    }
  }

  // Berechne Total automatisch
  const praemie = parseFloat(formData.praemie_chf) || 0
  const gebuehren = parseFloat(formData.gebuehren) || 0
  const total = praemie + gebuehren
  const waehrung = formData.waehrung || 'CHF'

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const newFile = {
        id: Date.now(),
        name: file.name,
        size: (file.size / 1024).toFixed(2),
        type: fileCategory,
        description: fileDescription,
        uploaded_at: new Date().toLocaleDateString('de-CH')
      }
      setUploadedFiles([...uploadedFiles, newFile])
      setFileInput(null)
      setFileCategory('Police')
      setFileDescription('')
    }
  }

  const handleDeleteFile = (fileId) => {
    setUploadedFiles(uploadedFiles.filter(f => f.id !== fileId))
  }

  const handleDownloadFile = (fileName) => {
    alert(`Datei "${fileName}" wird heruntergeladen...\n\n(Feature wird später implementiert)`)
  }

  const handleSave = () => {
    onSave(formData)
    setEditMode(false)
  }

  const handleCancel = () => {
    if (police?.id) {
      // Bestehende Police - zurück zu View Mode
      setFormData(police)
      setEditMode(false)
    } else {
      // Neue Police - Modal schließen
      onClose()
    }
  }

  return (
    <div className="modal-overlay fullscreen">
      <div className="modal modal-fullscreen">
        <div className="modal-header">
          <div>
            <h3>📋 Prämie: {praemie.toFixed(2)} CHF</h3>
            <p className="modal-subtitle">Policenummer: {police?.policennummer || 'Neue Police'}</p>
          </div>
          <div className="header-actions">
            {!editMode && police?.id && (
              <button className="button-edit" onClick={() => setEditMode(true)}>✏️ Bearbeiten</button>
            )}
            <button className="close-button" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="modal-content-2container">
          {/* CONTAINER 1 - LEFT (65%) - 3 COLUMN GRID */}
          <div className="container-left">
            <div className="form-grid-3col">
              {/* ROW 1: Versicherer | Policenummer | Branche */}
              <div className="form-group">
                <label>Versicherer</label>
                <select 
                  value={formData.versicherer_id || ''} 
                  onChange={(e) => {
                    const vid = parseInt(e.target.value)
                    const selected = versicherers.find(v => v.id === vid)
                    setFormData({...formData, versicherer_id: vid, versicherer_name: selected?.name || ''})
                  }}
                  disabled={!editMode}
                >
                  <option value="">-- Bitte wählen --</option>
                  {versicherers.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Policenummer</label>
                <input 
                  type="text" 
                  value={formData.policennummer || ''} 
                  onChange={(e) => setFormData({...formData, policennummer: e.target.value})}
                  readOnly={!editMode}
                />
              </div>
              <div className="form-group">
                <label>Branche</label>
                <select 
                  value={formData.branche_id || ''} 
                  onChange={(e) => setFormData({...formData, branche_id: parseInt(e.target.value) || ''})}
                  disabled={!editMode}
                >
                  <option value="">-- Bitte wählen --</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>

              {/* ROW 2: Beginn | Ende | JKR */}
              <div className="form-group">
                <label>Beginn</label>
                <input 
                  type="date" 
                  value={formatDate(formData.beginn)} 
                  onChange={(e) => setFormData({...formData, beginn: e.target.value})}
                  readOnly={!editMode}
                />
              </div>
              <div className="form-group">
                <label>Ende</label>
                <input 
                  type="date" 
                  value={formatDate(formData.ende)} 
                  onChange={(e) => setFormData({...formData, ende: e.target.value})}
                  readOnly={!editMode}
                />
              </div>
              <div className="form-group checkbox-cell">
                <label>
                  <input 
                    type="checkbox" 
                    checked={formData.jkr === 'Ja' || false}
                    onChange={(e) => setFormData({...formData, jkr: e.target.checked ? 'Ja' : 'Nein'})}
                    disabled={!editMode}
                  />
                  <span>JKR</span>
                </label>
              </div>

              {/* ROW 3: Prämie | Gebühren | Total */}
              <div className="form-group">
                <label>Prämie</label>
                <input 
                  type="number" 
                  value={formData.praemie_chf || ''} 
                  onChange={(e) => setFormData({...formData, praemie_chf: e.target.value})}
                  readOnly={!editMode}
                />
              </div>
              <div className="form-group">
                <label>Gebühren</label>
                <input 
                  type="number" 
                  value={formData.gebuehren || ''} 
                  onChange={(e) => setFormData({...formData, gebuehren: e.target.value})}
                  readOnly={!editMode}
                />
              </div>
              <div className="form-group">
                <label>Total</label>
                <input 
                  type="number" 
                  value={total.toFixed(2)} 
                  readOnly 
                  style={{background: '#f0f0f0', fontWeight: 'bold'}} 
                />
              </div>

              {/* ROW 4: Währung (spans 1 column) */}
              <div className="form-group">
                <label>Währung</label>
                <select 
                  value={waehrung} 
                  onChange={(e) => setFormData({...formData, waehrung: e.target.value})}
                  disabled={!editMode}
                >
                  <option value="CHF">CHF</option>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                </select>
              </div>

              {/* ROW 5: Notizen (spans all 3 columns) */}
              <div className="form-group span-3">
                <label>Notizen</label>
                <textarea 
                  rows="8" 
                  value={formData.bemerkungen || ''} 
                  onChange={(e) => setFormData({...formData, bemerkungen: e.target.value})}
                  readOnly={!editMode}
                  placeholder="Spezialdeckung, Ausschlüsse, Besonderheiten..." 
                />
              </div>
            </div>
          </div>

          {/* CONTAINER 2 - RIGHT (35%) */}
          <div className="container-right">
            {/* DOKUMENTE SECTION */}
            <div className="right-section documents-section">
              <h4>📁 Dokumente</h4>
              
              {editMode && (
                <div className="file-upload-area">
                  <div className="upload-form">
                    <select value={fileCategory} onChange={(e) => setFileCategory(e.target.value)}>
                      <option value="Police">📋 Police</option>
                      <option value="AVB">📄 AVB</option>
                      <option value="BB">📋 BB</option>
                      <option value="Sonstiges">📎 Sonstiges</option>
                    </select>
                    <input 
                      type="text" 
                      placeholder="Beschreibung (optional)"
                      value={fileDescription}
                      onChange={(e) => setFileDescription(e.target.value)}
                      className="file-description"
                    />
                    <input 
                      type="file" 
                      ref={(ref) => setFileInput(ref)}
                      onChange={handleFileUpload}
                      style={{display: 'none'}}
                    />
                    <button 
                      className="button-upload"
                      onClick={() => fileInput && fileInput.click()}
                    >
                      + Datei hochladen
                    </button>
                  </div>
                </div>
              )}

              {uploadedFiles.length > 0 ? (
                <div className="files-list">
                  {uploadedFiles.map(file => (
                    <div key={file.id} className="file-item">
                      <div className="file-info">
                        <p className="file-name">{file.type} • {file.name}</p>
                        {file.description && <p className="file-description-label">{file.description}</p>}
                        <p className="file-meta">{file.size} KB • {file.uploaded_at}</p>
                      </div>
                      <div className="file-actions">
                        <button 
                          className="button-file-action"
                          onClick={() => handleDownloadFile(file.name)}
                          title="Download"
                        >
                          ⬇️
                        </button>
                        {editMode && (
                          <button 
                            className="button-file-action delete"
                            onClick={() => handleDeleteFile(file.id)}
                            title="Löschen"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-section">
                  <p>Keine Dateien hochgeladen</p>
                </div>
              )}
            </div>

            {/* RECHNUNGEN SECTION */}
            <div className="right-section">
              <h4>💰 Rechnungen</h4>
              <div className="empty-section">
                <p>Wird später implementiert</p>
              </div>
            </div>

            {/* SCHÄDEN SECTION */}
            <div className="right-section">
              <h4>⚠️ Schadenfälle</h4>
              <div className="empty-section">
                <p>Wird später implementiert</p>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL ACTIONS */}
        <div className="modal-actions">
          {editMode ? (
            <>
              <button className="button-primary" onClick={handleSave}>💾 Speichern</button>
              <button className="button-secondary" onClick={handleCancel}>Abbrechen</button>
            </>
          ) : (
            <>
              <button className="button-secondary" onClick={onClose}>Schließen</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default PolicenDetailsModal
