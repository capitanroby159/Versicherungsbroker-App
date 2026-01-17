import { useState } from 'react'
import './ImmobildienDetailsModal.css'

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

// ===== MAIN COMPONENT =====
function ImmobildienDetailsModal({ immobilie, onClose, onSave }) {
  const [formData, setFormData] = useState(immobilie || {})
  const [hypotheken, setHypotheken] = useState(
    immobilie?.hypotheken 
      ? JSON.parse(typeof immobilie.hypotheken === 'string' ? immobilie.hypotheken : JSON.stringify(immobilie.hypotheken)) 
      : []
  )
  const [editMode, setEditMode] = useState(!immobilie?.id)
  const [showHypoModal, setShowHypoModal] = useState(false)
  const [hypoForm, setHypoForm] = useState({})
  const [editingHypoId, setEditingHypoId] = useState(null)

  const IMMOBILIENARTEN = [
    'Einfamilienhaus', 'Reihenhaus', 'Doppeleinfamilienhaus', 'Mehrfamilienhaus',
    'Wohnung', 'Attikawohnung', 'Maisonettewohnung', 'Loft', 'Studio',
    'Ferienhaus', 'Ferienwohnung', 'Bauernhaus', 'Rustico', 'Villa', 'Chalet',
    'Wohn- und Geschäftshaus', 'Gewerbeobjekt', 'Bürofläche', 'Ladenfläche',
    'Praxis', 'Restaurant / Gastronomie', 'Hotel', 'Industriehalle', 'Lagerhalle',
    'Parkplatz', 'Garage', 'Bauland', 'Landwirtschaftsland',
    'Rekonstruktion / Sanierungsobjekt', 'Neubauprojekt', 'Sonstiges'
  ]

  const WOHNORTSTATUS = [
    'Vermietung', 'Eigentümer', 'Stockwerkeigentümer', 'Mitbenutzer / Untermieter',
    'Wohngemeinschaft (WG)', 'Bei Eltern wohnend', 'Dienstwohnung',
    'Temporäre Unterkunft', 'Ferienwohnung', 'Zweitwohnsitz',
    'Betreutes Wohnen', 'Altersheim / Pflegeheim'
  ]

  const RENOVIERT = ['Nein', 'teilrenoviert', 'komplett']
  const HYPO_ART = ['Festhypothek', 'SARON']

  const zeigRenovationsFelder = formData.renoviert && formData.renoviert !== 'Nein'
  const zeigMietertrag = formData.wohnort_status === 'Vermietung'

  // ===== KPI BERECHNUNGEN =====
  const gebäudewert = parseFloat(formData.gebaeudeversicherungswert) || 0
  const kaufpreis = parseFloat(formData.kaufpreis) || 0
  const mietertrag = parseFloat(formData.mietertrag_jaehrlich) || 0
  
  const gesamthypothek = hypotheken.reduce((sum, h) => sum + (parseFloat(h.betrag) || 0), 0)
  const eigenkapital = kaufpreis - gesamthypothek
  
  const gewinn = gebäudewert - kaufpreis
  const bruttorendite = gebäudewert > 0 ? (mietertrag / gebäudewert * 100) : 0
  const eigenkapitalrendite = eigenkapital > 0 ? (gewinn / eigenkapital * 100) : null
  
  // Check für Überfinanzierung
  const istUeberfinanziert = eigenkapital <= 0 && gesamthypothek > 0
  
  // Hypotheken Statistiken
  const hypoQuote = gebäudewert > 0 ? (gesamthypothek / gebäudewert * 100) : 0
  const durchschnittZinssatz = hypotheken.length > 0 
    ? hypotheken.reduce((sum, h) => sum + (parseFloat(h.zinssatz) || 0), 0) / hypotheken.length 
    : 0
  const gesamtHypozins = hypotheken.reduce((sum, h) => {
    const betrag = parseFloat(h.betrag) || 0
    const zins = parseFloat(h.zinssatz) || 0
    return sum + (betrag * zins / 100)
  }, 0)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = () => {
    const dataToSave = {
      ...formData,
      hypotheken: JSON.stringify(hypotheken)
    }
    onSave(dataToSave)
    setEditMode(false)
  }

  const handleCancel = () => {
    if (immobilie?.id) {
      setFormData(immobilie)
      setHypotheken(immobilie?.hypotheken ? JSON.parse(typeof immobilie.hypotheken === 'string' ? immobilie.hypotheken : JSON.stringify(immobilie.hypotheken)) : [])
      setEditMode(false)
    } else {
      onClose()
    }
  }

  // ===== HYPOTHEKEN FUNCTIONS =====
  const handleOpenHypoModal = (hypo = null) => {
    if (hypo) {
      setHypoForm({ ...hypo })
      setEditingHypoId(hypo.id)
    } else {
      setHypoForm({ id: Date.now() })
      setEditingHypoId(null)
    }
    setShowHypoModal(true)
  }

  const handleSaveHypo = () => {
    if (!hypoForm.institut || !hypoForm.art || !hypoForm.betrag || !hypoForm.zinssatz) {
      alert('❌ Alle Felder erforderlich!')
      return
    }

    if (editingHypoId) {
      setHypotheken(hypotheken.map(h => h.id === editingHypoId ? hypoForm : h))
    } else {
      setHypotheken([...hypotheken, hypoForm])
    }
    setShowHypoModal(false)
    setHypoForm({})
  }

  const handleDeleteHypo = (id) => {
    if (confirm('❌ Hypothek wirklich löschen?')) {
      setHypotheken(hypotheken.filter(h => h.id !== id))
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
            {/* ===== FINANCIAL DASHBOARD (KPI + HYPOTHEKEN SUMMARY) ===== */}
            {!editMode && immobilie?.id && (
              <>
                {/* ÜBERFINANZIERUNGS-WARNUNG */}
                {istUeberfinanziert && (
                  <div style={{
                    padding: '15px',
                    background: '#fee2e2',
                    border: '2px solid #ef4444',
                    borderRadius: '6px',
                    marginBottom: '20px',
                    color: '#991b1b'
                  }}>
                    <strong>⚠️ Überfinanzierung erkannt!</strong>
                    <p style={{margin: '8px 0 0 0', fontSize: '13px'}}>
                      Die Gesamthypothek ({formatCHF(gesamthypothek)}) ist höher als der Kaufpreis ({formatCHF(kaufpreis)}).
                      <br/>
                      Eigenkapital: <strong>{formatCHF(eigenkapital)}</strong>
                      <br/>
                      EK-Rendite kann nicht berechnet werden.
                    </p>
                  </div>
                )}

                {/* KPI SECTION */}
                <div className="kpi-section">
                  <div className="kpi-card">
                    <div className="kpi-label">Gewinn/Verlust</div>
                    <div className="kpi-value" style={{color: getKPIColor(gewinn, 'gewinn')}}>
                      {formatCHF(gewinn)}
                    </div>
                  </div>
                  <div className="kpi-card">
                    <div className="kpi-label">Bruttorendite</div>
                    <div className="kpi-value" style={{color: getKPIColor(bruttorendite, 'bruttorendite')}}>
                      {mietertrag > 0 ? formatPercent(bruttorendite) : '-'}
                    </div>
                  </div>
                  <div className="kpi-card">
                    <div className="kpi-label">Eigenkapitalrendite</div>
                    <div className="kpi-value" style={{color: eigenkapitalrendite !== null ? getKPIColor(eigenkapitalrendite, 'eigenkapitalrendite') : '#999'}}>
                      {eigenkapitalrendite !== null ? formatPercent(eigenkapitalrendite) : '-'}
                    </div>
                  </div>
                </div>

                {/* HYPOTHEKEN SUMMARY DASHBOARD */}
                {hypotheken && hypotheken.length > 0 && (
                  <div className="hypo-summary-dashboard">
                    <div className="hypo-stat-card">
                      <span>Gebäudewert</span>
                      <strong>{formatCHF(gebäudewert)}</strong>
                    </div>
                    <div className="hypo-stat-card">
                      <span>Gesamthypothek</span>
                      <strong>{formatCHF(gesamthypothek)}</strong>
                    </div>
                    <div className="hypo-stat-card" style={{backgroundColor: getHypoQuoteColor(hypoQuote) + '20', borderLeftColor: getHypoQuoteColor(hypoQuote)}}>
                      <span>Quote</span>
                      <strong style={{color: getHypoQuoteColor(hypoQuote)}}>
                        {formatPercent(hypoQuote)}
                      </strong>
                    </div>
                    <div className="hypo-stat-card">
                      <span>Ø Zinssatz</span>
                      <strong>{formatPercent(durchschnittZinssatz, 3)}</strong>
                    </div>
                    <div className="hypo-stat-card">
                      <span>Gesamtzins/Jahr</span>
                      <strong>{formatCHF(gesamtHypozins)}</strong>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ===== ADRESSE ===== */}
            <fieldset>
              <legend>📍 Adresse</legend>
              <div className="form-grid">
                <div className="form-group">
                  <label>Strasse</label>
                  {editMode ? (
                    <input 
                      type="text" 
                      name="strasse"
                      value={formData.strasse || ''} 
                      onChange={handleChange}
                    />
                  ) : (
                    <div className="form-display">{formData.strasse || '-'}</div>
                  )}
                </div>
                <div className="form-group">
                  <label>Hausnummer</label>
                  {editMode ? (
                    <input 
                      type="text" 
                      name="hausnummer"
                      value={formData.hausnummer || ''} 
                      onChange={handleChange}
                    />
                  ) : (
                    <div className="form-display">{formData.hausnummer || '-'}</div>
                  )}
                </div>
                <div className="form-group">
                  <label>PLZ</label>
                  {editMode ? (
                    <input 
                      type="text" 
                      name="plz"
                      value={formData.plz || ''} 
                      onChange={handleChange}
                    />
                  ) : (
                    <div className="form-display">{formData.plz || '-'}</div>
                  )}
                </div>
                <div className="form-group">
                  <label>Ort</label>
                  {editMode ? (
                    <input 
                      type="text" 
                      name="ort"
                      value={formData.ort || ''} 
                      onChange={handleChange}
                    />
                  ) : (
                    <div className="form-display">{formData.ort || '-'}</div>
                  )}
                </div>
              </div>
            </fieldset>

            {/* ===== IMMOBILIENTYP & STATUS ===== */}
            <fieldset>
              <legend>🏘️ Immobilientyp & Status</legend>
              <div className="form-grid">
                <div className="form-group">
                  <label>Immobilienart *</label>
                  {editMode ? (
                    <select 
                      name="immobilienart"
                      value={formData.immobilienart || ''} 
                      onChange={handleChange}
                    >
                      <option value="">-- Bitte wählen --</option>
                      {IMMOBILIENARTEN.map(art => <option key={art} value={art}>{art}</option>)}
                    </select>
                  ) : (
                    <div className="form-display">{formData.immobilienart || '-'}</div>
                  )}
                </div>
                <div className="form-group">
                  <label>Wohnstatus *</label>
                  {editMode ? (
                    <select 
                      name="wohnort_status"
                      value={formData.wohnort_status || ''} 
                      onChange={handleChange}
                    >
                      <option value="">-- Bitte wählen --</option>
                      {WOHNORTSTATUS.map(status => <option key={status} value={status}>{status}</option>)}
                    </select>
                  ) : (
                    <div className="form-display">{formData.wohnort_status || '-'}</div>
                  )}
                </div>
              </div>
            </fieldset>

            {/* ===== BAUJAHR & RENOVIERUNG ===== */}
            <fieldset>
              <legend>🔨 Baujahr & Renovierung</legend>
              <div className="form-grid">
                <div className="form-group">
                  <label>Baujahr</label>
                  {editMode ? (
                    <input 
                      type="number" 
                      name="baujahr"
                      value={formData.baujahr || ''} 
                      onChange={handleChange}
                      min="1800"
                      max={new Date().getFullYear()}
                    />
                  ) : (
                    <div className="form-display">{formData.baujahr ? formatNumber(formData.baujahr) : '-'}</div>
                  )}
                </div>
                <div className="form-group">
                  <label>Renoviert *</label>
                  {editMode ? (
                    <select 
                      name="renoviert"
                      value={formData.renoviert || 'Nein'} 
                      onChange={handleChange}
                    >
                      {RENOVIERT.map(ren => <option key={ren} value={ren}>{ren}</option>)}
                    </select>
                  ) : (
                    <div className="form-display">{formData.renoviert || 'Nein'}</div>
                  )}
                </div>
              </div>

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
                  />
                </div>
              )}

              {zeigRenovationsFelder && !editMode && (formData.renovationsjahr || formData.renovationsnotizen) && (
                <div className="info-section">
                  {formData.renovationsjahr && <p><strong>Renovationsjahr:</strong> {formatNumber(formData.renovationsjahr)}</p>}
                  {formData.renovationsnotizen && <p><strong>Renovationsnotizen:</strong> {formData.renovationsnotizen}</p>}
                </div>
              )}
            </fieldset>

            {/* ===== FINANZIELLE INFORMATIONEN ===== */}
            <fieldset>
              <legend>💰 Finanzielle Informationen</legend>
              <div className="form-grid">
                <div className="form-group">
                  <label>Kaufpreis (CHF)</label>
                  {editMode ? (
                    <input 
                      type="number" 
                      name="kaufpreis"
                      value={formData.kaufpreis || ''} 
                      onChange={handleChange}
                    />
                  ) : (
                    <div className="form-display">{formatCHF(formData.kaufpreis)}</div>
                  )}
                </div>
                <div className="form-group">
                  <label>Kaufjahr</label>
                  {editMode ? (
                    <input 
                      type="number" 
                      name="kaufjahr"
                      value={formData.kaufjahr || ''} 
                      onChange={handleChange}
                    />
                  ) : (
                    <div className="form-display">{formData.kaufjahr ? formatNumber(formData.kaufjahr) : '-'}</div>
                  )}
                </div>
                <div className="form-group">
                  <label>Gebäudewert (CHF)</label>
                  {editMode ? (
                    <input 
                      type="number" 
                      name="gebaeudeversicherungswert"
                      value={formData.gebaeudeversicherungswert || ''} 
                      onChange={handleChange}
                    />
                  ) : (
                    <div className="form-display">{formatCHF(formData.gebaeudeversicherungswert)}</div>
                  )}
                </div>
                <div className="form-group">
                  <label>Versicherungssumme (CHF)</label>
                  {editMode ? (
                    <input 
                      type="number" 
                      name="versicherungssumme"
                      value={formData.versicherungssumme || ''} 
                      onChange={handleChange}
                    />
                  ) : (
                    <div className="form-display">{formatCHF(formData.versicherungssumme)}</div>
                  )}
                </div>
              </div>

              {zeigMietertrag && (
                <div className="form-grid" style={{marginTop: '15px', borderTop: '1px solid #e0e0e0', paddingTop: '15px'}}>
                  <div className="form-group">
                    <label>💵 Jährlicher Mietertrag (CHF)</label>
                    {editMode ? (
                      <input 
                        type="number" 
                        name="mietertrag_jaehrlich"
                        value={formData.mietertrag_jaehrlich || ''} 
                        onChange={handleChange}
                        style={{backgroundColor: '#fffacd'}}
                      />
                    ) : (
                      <div className="form-display" style={{backgroundColor: '#fffacd', padding: '8px', borderRadius: '4px'}}>
                        {formatCHF(formData.mietertrag_jaehrlich)}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </fieldset>

            {/* ===== HYPOTHEKEN ===== */}
            <fieldset>
              <legend>🏦 Hypotheken</legend>
              
              {hypotheken && hypotheken.length > 0 && (
                <div className="hypo-list">
                  {hypotheken.map((hypo) => (
                    <div key={hypo.id} className="hypo-item">
                      <div className="hypo-info">
                        <div><strong>{hypo.institut}</strong> ({hypo.art})</div>
                        <div>{formatCHF(hypo.betrag)} @ {formatPercent(hypo.zinssatz, 3)}</div>
                        <div style={{fontSize: '12px', color: '#666'}}>
                          Zins/Jahr: {formatCHF(parseFloat(hypo.betrag) * parseFloat(hypo.zinssatz) / 100)}
                        </div>
                      </div>
                      {editMode && (
                        <div className="hypo-actions">
                          <button className="hypo-btn-edit" onClick={() => handleOpenHypoModal(hypo)}>✏️</button>
                          <button className="hypo-btn-delete" onClick={() => handleDeleteHypo(hypo.id)}>🗑️</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {hypotheken && hypotheken.length === 0 && !editMode && (
                <div style={{padding: '20px', textAlign: 'center', color: '#999'}}>
                  ℹ️ Keine Hypotheken erfasst
                </div>
              )}

              {editMode && (
                <button className="button-hypo-new" onClick={() => handleOpenHypoModal()}>
                  + Neue Hypothek
                </button>
              )}
            </fieldset>

            {/* ===== NOTIZEN ===== */}
            <fieldset>
              <legend>📝 Notizen</legend>
              <div className="form-group">
                <label>Beschreibung</label>
                {editMode ? (
                  <textarea 
                    name="beschreibung"
                    value={formData.beschreibung || ''} 
                    onChange={handleChange}
                    rows="4"
                  />
                ) : (
                  <div className="form-display" style={{whiteSpace: 'pre-wrap'}}>
                    {formData.beschreibung || '-'}
                  </div>
                )}
              </div>
            </fieldset>
          </div>
        </div>

        {/* ===== MODAL ACTIONS ===== */}
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

        {/* ===== HYPOTHEKEN MODAL ===== */}
        {showHypoModal && (
          <div className="modal-overlay">
            <div className="modal" style={{maxWidth: '400px'}}>
              <h3>Hypothek {editingHypoId ? 'bearbeiten' : 'hinzufügen'}</h3>
              <div className="modal-form">
                <div className="form-group">
                  <label>Institut</label>
                  <input 
                    type="text" 
                    value={hypoForm.institut || ''}
                    onChange={(e) => setHypoForm({...hypoForm, institut: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Art</label>
                  <select 
                    value={hypoForm.art || ''}
                    onChange={(e) => setHypoForm({...hypoForm, art: e.target.value})}
                  >
                    <option value="">Art *</option>
                    {HYPO_ART.map(art => <option key={art} value={art}>{art}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Hypothek (CHF)</label>
                  <input 
                    type="number" 
                    value={hypoForm.betrag || ''}
                    onChange={(e) => setHypoForm({...hypoForm, betrag: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Zinssatz (%)</label>
                  <input 
                    type="number" 
                    placeholder="z.B. 1.25"
                    step="0.001"
                    value={hypoForm.zinssatz || ''}
                    onChange={(e) => setHypoForm({...hypoForm, zinssatz: e.target.value})}
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button className="button-primary" onClick={handleSaveHypo}>Speichern</button>
                <button className="button-secondary" onClick={() => setShowHypoModal(false)}>Abbrechen</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ImmobildienDetailsModal