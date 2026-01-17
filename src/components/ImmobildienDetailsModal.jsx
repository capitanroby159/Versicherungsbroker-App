import { useState, useEffect } from 'react'
import './ImmobildienDetailsModal.css'

function ImmobildienDetailsModal({ immobilie, onClose, onSave }) {
  const [formData, setFormData] = useState(immobilie || {})
  const [editMode, setEditMode] = useState(!immobilie?.id) // Auto-edit für neue Immobilien

  const IMMOBILIENARTEN = ['Einfamilienhaus', 'Mehrfamilienhaus', 'Wohnung', 'Villa', 'Sonstiges']
  const WOHNORTSTATUS = ['Hauptwohnsitz', 'Nebenwohnsitz', 'Ferienwohnung', 'Ferienhaus', 'Sonstiges']
  const RENOVIERT = ['Nein', 'Teilrenoviert', 'Komplett renoviert']

  const handleSave = () => {
    onSave(formData)
    setEditMode(false)
  }

  const handleCancel = () => {
    if (immobilie?.id) {
      // Bestehende Immobilie - zurück zu View Mode
      setFormData(immobilie)
      setEditMode(false)
    } else {
      // Neue Immobilie - Modal schließen
      onClose()
    }
  }

  return (
    <div className="modal-overlay fullscreen">
      <div className="modal modal-fullscreen">
        <div className="modal-header">
          <div>
            <h3>🏠 {formData.strasse && formData.hausnummer ? `${formData.strasse} ${formData.hausnummer}` : 'Neue Immobilie'}</h3>
            <p className="modal-subtitle">{formData.plz} {formData.ort || 'Neue Immobilie'}</p>
          </div>
          <div className="header-actions">
            {!editMode && immobilie?.id && (
              <button className="button-edit" onClick={() => setEditMode(true)}>✏️ Bearbeiten</button>
            )}
            <button className="close-button" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="modal-content">
          <div className="form-container">
            <div className="form-grid">
              {/* ROW 1: Strasse | Hausnummer */}
              <div className="form-group">
                <label>Strasse</label>
                <input 
                  type="text" 
                  value={formData.strasse || ''} 
                  onChange={(e) => setFormData({...formData, strasse: e.target.value})}
                  readOnly={!editMode}
                />
              </div>
              <div className="form-group">
                <label>Hausnummer</label>
                <input 
                  type="text" 
                  value={formData.hausnummer || ''} 
                  onChange={(e) => setFormData({...formData, hausnummer: e.target.value})}
                  readOnly={!editMode}
                />
              </div>

              {/* ROW 2: PLZ | Ort */}
              <div className="form-group">
                <label>PLZ</label>
                <input 
                  type="text" 
                  value={formData.plz || ''} 
                  onChange={(e) => setFormData({...formData, plz: e.target.value})}
                  readOnly={!editMode}
                />
              </div>
              <div className="form-group">
                <label>Ort</label>
                <input 
                  type="text" 
                  value={formData.ort || ''} 
                  onChange={(e) => setFormData({...formData, ort: e.target.value})}
                  readOnly={!editMode}
                />
              </div>

              {/* ROW 3: Immobilienart | Wohnortstatus */}
              <div className="form-group">
                <label>Immobilienart</label>
                <select 
                  value={formData.immobilienart || ''} 
                  onChange={(e) => setFormData({...formData, immobilienart: e.target.value})}
                  disabled={!editMode}
                >
                  <option value="">-- Bitte wählen --</option>
                  {IMMOBILIENARTEN.map(art => <option key={art} value={art}>{art}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Wohnortstatus</label>
                <select 
                  value={formData.wohnort_status || ''} 
                  onChange={(e) => setFormData({...formData, wohnort_status: e.target.value})}
                  disabled={!editMode}
                >
                  <option value="">-- Bitte wählen --</option>
                  {WOHNORTSTATUS.map(status => <option key={status} value={status}>{status}</option>)}
                </select>
              </div>

              {/* ROW 4: Baujahr | Renoviert */}
              <div className="form-group">
                <label>Baujahr</label>
                <input 
                  type="number" 
                  value={formData.baujahr || ''} 
                  onChange={(e) => setFormData({...formData, baujahr: e.target.value})}
                  readOnly={!editMode}
                  min="1800"
                  max={new Date().getFullYear()}
                />
              </div>
              <div className="form-group">
                <label>Renoviert</label>
                <select 
                  value={formData.renoviert || ''} 
                  onChange={(e) => setFormData({...formData, renoviert: e.target.value})}
                  disabled={!editMode}
                >
                  <option value="">-- Bitte wählen --</option>
                  {RENOVIERT.map(ren => <option key={ren} value={ren}>{ren}</option>)}
                </select>
              </div>

              {/* ROW 5: Kaufpreis | Gebäudeversicherungswert */}
              <div className="form-group">
                <label>Kaufpreis (CHF)</label>
                <input 
                  type="number" 
                  value={formData.kaufpreis || ''} 
                  onChange={(e) => setFormData({...formData, kaufpreis: e.target.value})}
                  readOnly={!editMode}
                />
              </div>
              <div className="form-group">
                <label>Gebäudeversicherungswert (CHF)</label>
                <input 
                  type="number" 
                  value={formData.gebaeudeversicherungswert || ''} 
                  onChange={(e) => setFormData({...formData, gebaeudeversicherungswert: e.target.value})}
                  readOnly={!editMode}
                />
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

export default ImmobildienDetailsModal
