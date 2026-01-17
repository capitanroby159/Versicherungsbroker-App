import { useState, useEffect } from 'react'
import './ImmobildienDetailsModal.css'

function ImmobildienDetailsModal({ immobilie, onClose, onSave }) {
  const [formData, setFormData] = useState(immobilie || {})
  const [editMode, setEditMode] = useState(!immobilie?.id)

  // 31 Immobilienart Optionen
  const IMMOBILIENARTEN = [
    'Einfamilienhaus', 'Reihenhaus', 'Doppeleinfamilienhaus', 'Mehrfamilienhaus',
    'Wohnung', 'Attikawohnung', 'Maisonettewohnung', 'Loft', 'Studio',
    'Ferienhaus', 'Ferienwohnung', 'Bauernhaus', 'Rustico', 'Villa', 'Chalet',
    'Wohn- und Geschäftshaus', 'Gewerbeobjekt', 'Bürofläche', 'Ladenfläche',
    'Praxis', 'Restaurant / Gastronomie', 'Hotel', 'Industriehalle', 'Lagerhalle',
    'Parkplatz', 'Garage', 'Bauland', 'Landwirtschaftsland',
    'Rekonstruktion / Sanierungsobjekt', 'Neubauprojekt', 'Sonstiges'
  ]

  // 12 Wohnstatus Optionen
  const WOHNORTSTATUS = [
    'Vermietung', 'Eigentümer', 'Stockwerkeigentümer', 'Mitbenutzer / Untermieter',
    'Wohngemeinschaft (WG)', 'Bei Eltern wohnend', 'Dienstwohnung',
    'Temporäre Unterkunft', 'Ferienwohnung', 'Zweitwohnsitz',
    'Betreutes Wohnen', 'Altersheim / Pflegeheim'
  ]

  // 3 Renoviert Optionen
  const RENOVIERT = ['Nein', 'teilrenoviert', 'komplett']

  // Bedingte Sichtbarkeit
  const zeigRenovationsFelder = formData.renoviert && formData.renoviert !== 'Nein'
  const zeigMietertrag = formData.wohnort_status === 'Vermietung'

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = () => {
    onSave(formData)
    setEditMode(false)
  }

  const handleCancel = () => {
    if (immobilie?.id) {
      setFormData(immobilie)
      setEditMode(false)
    } else {
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
            <fieldset>
              <legend>📍 Adresse</legend>
              <div className="form-grid">
                <div className="form-group">
                  <label>Strasse</label>
                  <input 
                    type="text" 
                    name="strasse"
                    value={formData.strasse || ''} 
                    onChange={handleChange}
                    readOnly={!editMode}
                  />
                </div>
                <div className="form-group">
                  <label>Hausnummer</label>
                  <input 
                    type="text" 
                    name="hausnummer"
                    value={formData.hausnummer || ''} 
                    onChange={handleChange}
                    readOnly={!editMode}
                  />
                </div>
                <div className="form-group">
                  <label>PLZ</label>
                  <input 
                    type="text" 
                    name="plz"
                    value={formData.plz || ''} 
                    onChange={handleChange}
                    readOnly={!editMode}
                  />
                </div>
                <div className="form-group">
                  <label>Ort</label>
                  <input 
                    type="text" 
                    name="ort"
                    value={formData.ort || ''} 
                    onChange={handleChange}
                    readOnly={!editMode}
                  />
                </div>
              </div>
            </fieldset>

            <fieldset>
              <legend>🏘️ Immobilientyp & Status</legend>
              <div className="form-grid">
                <div className="form-group">
                  <label>Immobilienart *</label>
                  <select 
                    name="immobilienart"
                    value={formData.immobilienart || ''} 
                    onChange={handleChange}
                    disabled={!editMode}
                  >
                    <option value="">-- Bitte wählen --</option>
                    {IMMOBILIENARTEN.map(art => <option key={art} value={art}>{art}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Wohnstatus *</label>
                  <select 
                    name="wohnort_status"
                    value={formData.wohnort_status || ''} 
                    onChange={handleChange}
                    disabled={!editMode}
                  >
                    <option value="">-- Bitte wählen --</option>
                    {WOHNORTSTATUS.map(status => <option key={status} value={status}>{status}</option>)}
                  </select>
                </div>
              </div>
            </fieldset>

            <fieldset>
              <legend>🔨 Baujahr & Renovierung</legend>
              <div className="form-grid">
                <div className="form-group">
                  <label>Baujahr</label>
                  <input 
                    type="number" 
                    name="baujahr"
                    value={formData.baujahr || ''} 
                    onChange={handleChange}
                    readOnly={!editMode}
                    min="1800"
                    max={new Date().getFullYear()}
                  />
                </div>
                <div className="form-group">
                  <label>Renoviert *</label>
                  <select 
                    name="renoviert"
                    value={formData.renoviert || 'Nein'} 
                    onChange={handleChange}
                    disabled={!editMode}
                  >
                    {RENOVIERT.map(ren => <option key={ren} value={ren}>{ren}</option>)}
                  </select>
                </div>
              </div>

              {/* BEDINGTE FELDER: Renovationsfelder */}
              {zeigRenovationsFelder && editMode && (
                <div className="form-grid" style={{marginTop: '15px', borderTop: '1px solid #e0e0e0', paddingTop: '15px'}}>
                  <div className="form-group">
                    <label>Renovationsjahr</label>
                    <input 
                      type="number" 
                      name="renovationsjahr"
                      value={formData.renovationsjahr || ''} 
                      onChange={handleChange}
                    />
                  </div>
                </div>
              )}

              {zeigRenovationsFelder && editMode && (
                <div className="form-group">
                  <label>Renovationsnotizen</label>
                  <textarea 
                    name="renovationsnotizen"
                    value={formData.renovationsnotizen || ''} 
                    onChange={handleChange}
                    rows="3"
                    placeholder="z.B. Dach erneuert, Fenster ausgetauscht, Elektro modernisiert..."
                  />
                </div>
              )}

              {zeigRenovationsFelder && !editMode && (formData.renovationsjahr || formData.renovationsnotizen) && (
                <div className="info-section">
                  {formData.renovationsjahr && <p><strong>Renovationsjahr:</strong> {formData.renovationsjahr}</p>}
                  {formData.renovationsnotizen && <p><strong>Renovationsnotizen:</strong> {formData.renovationsnotizen}</p>}
                </div>
              )}
            </fieldset>

            <fieldset>
              <legend>💰 Finanzielle Informationen</legend>
              <div className="form-grid">
                <div className="form-group">
                  <label>Kaufpreis (CHF)</label>
                  <input 
                    type="number" 
                    name="kaufpreis"
                    value={formData.kaufpreis || ''} 
                    onChange={handleChange}
                    readOnly={!editMode}
                  />
                </div>
                <div className="form-group">
                  <label>Kaufjahr</label>
                  <input 
                    type="number" 
                    name="kaufjahr"
                    value={formData.kaufjahr || ''} 
                    onChange={handleChange}
                    readOnly={!editMode}
                  />
                </div>
                <div className="form-group">
                  <label>Gebäudeversicherungswert (CHF)</label>
                  <input 
                    type="number" 
                    name="gebaeudeversicherungswert"
                    value={formData.gebaeudeversicherungswert || ''} 
                    onChange={handleChange}
                    readOnly={!editMode}
                  />
                </div>
                <div className="form-group">
                  <label>Versicherungssumme (CHF)</label>
                  <input 
                    type="number" 
                    name="versicherungssumme"
                    value={formData.versicherungssumme || ''} 
                    onChange={handleChange}
                    readOnly={!editMode}
                  />
                </div>
              </div>

              {/* BEDINGTE FELDER: Mietertrag */}
              {zeigMietertrag && (
                <div className="form-grid" style={{marginTop: '15px', borderTop: '1px solid #e0e0e0', paddingTop: '15px', backgroundColor: editMode ? '#fffacd' : 'transparent', padding: editMode ? '15px' : '15px 0'}}>
                  <div className="form-group">
                    <label style={{fontWeight: 'bold'}}>💵 Jährlicher Mietertrag (CHF)</label>
                    <input 
                      type="number" 
                      name="mietertrag_jaehrlich"
                      value={formData.mietertrag_jaehrlich || ''} 
                      onChange={handleChange}
                      readOnly={!editMode}
                    />
                  </div>
                </div>
              )}
            </fieldset>

            <fieldset>
              <legend>📝 Notizen</legend>
              <div className="form-group">
                <label>Beschreibung</label>
                <textarea 
                  name="beschreibung"
                  value={formData.beschreibung || ''} 
                  onChange={handleChange}
                  readOnly={!editMode}
                  rows="4"
                />
              </div>
            </fieldset>
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
