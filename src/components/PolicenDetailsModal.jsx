import { useState, useEffect } from 'react'
import { formatCHF, formatCHFInput, parseCHF, formatDateShort, isValidDateShort } from '../utils/formatters'
import DateienTab from './DateienTab'
import DateienModal from './DateienModal'
import MutationsTab from './MutationsTab'
import './PolicenDetailsModal.css'

function PolicenDetailsModal({ police, kundeId, kundeTyp, onClose, onSave }) {
  const [sparten, setSparten] = useState([])
  const [versicherer, setVersicherer] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [isEditMode, setIsEditMode] = useState(!police)
  const [rightActiveTab, setRightActiveTab] = useState('dateien')

  const [formData, setFormData] = useState({
    kunde_id: kundeId,
    kundentyp: kundeTyp,
    sparte_id: '',
    versicherer_id: '',
    policennummer: '',
    praemie_chf: 0,
    gebuehren: 0,
    zahlungsart: 'jährlich',
    faelligkeit: '',
    beginn: '',
    ende: '',
    avb_ausgabe: '',
    archiv_url: '',
    jaehrliches_kuendigungsrecht: false,
    praemiengarantie: false,
    prioritaet: 'Normal',
    status_detail: 'Aktiv',
    bemerkungen: '',
    notizen: '',
    uvg_risiko_nr: '',
    uvg_art_betrieb: '',
    uvg_versicherter_personenkreis: 'Alle Arbeitnehmenden gemäss Art. 1a und 2 UVG sowie Art. 1 bis 6 UVV',
    uvg_bu_gefahrenklasse: '',
    uvg_bu_gefahrenstufe: '',
    uvg_bu_praemiensatz: '',
    uvg_nbu_gefahrenklasse: '',
    uvg_nbu_unterklasse: '',
    uvg_nbu_praemiensatz: ''
  })

  const calculateFaelligkeit = (endDate) => {
    if (!endDate) return ''
    try {
      const date = new Date(endDate)
      const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1)
      const day = String(nextMonth.getDate()).padStart(2, '0')
      const month = String(nextMonth.getMonth() + 1).padStart(2, '0')
      return `${day}.${month}`
    } catch (e) {
      return ''
    }
  }

  useEffect(() => {
    if (police) {
      setFormData(prev => ({
        ...prev,
        ...police,
        praemie_chf: police.praemie_chf ? police.praemie_chf.toString() : '',
        gebuehren: police.gebuehren ? police.gebuehren.toString() : '',
        beginn: police.beginn ? police.beginn.split('T')[0] : '',
        ende: police.ende ? police.ende.split('T')[0] : '',
        archiv_url: police.archiv_url || '',
        jaehrliches_kuendigungsrecht: police.jaehrliches_kuendigungsrecht ? true : false,
        praemiengarantie: police.praemiengarantie ? true : false
      }))
    }
    fetchSparten()
    fetchVersicherer()
  }, [police, kundeId, kundeTyp])

  const fetchSparten = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('http://localhost:5000/api/sparten', {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      })
      if (response.ok) {
        const data = await response.json()
        setSparten(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching sparten:', error)
    }
  }

  const fetchVersicherer = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('http://localhost:5000/api/versicherer', {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      })
      if (response.ok) {
        const data = await response.json()
        setVersicherer(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching versicherer:', error)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    const newFormData = {
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    }
    
    if (name === 'ende' && value) {
      newFormData.faelligkeit = calculateFaelligkeit(value)
    }
    
    setFormData(newFormData)
  }

  const handleSave = async () => {
    if (!formData.policennummer || !formData.versicherer_id) {
      setError('❌ Pflichtfelder: Policennummer, Versicherer')
      return
    }

    if (!isValidDateShort(formData.faelligkeit)) {
      setError('❌ Fälligkeit muss im Format dd.mm sein (z.B. 15.01)')
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      const url = police?.id 
        ? `http://localhost:5000/api/policen/${police.id}`
        : 'http://localhost:5000/api/policen'
      const method = police?.id ? 'PUT' : 'POST'

      // 🔧 Sende Daten direkt wie sie sind - KEINE Konvertierung!
      const dataToSend = {
        ...formData,
        praemie_chf: parseCHF(formData.praemie_chf || '0'),
        gebuehren: parseCHF(formData.gebuehren || '0'),
        beginn: formData.beginn || null,  // "2026-01-01" direkt
        ende: formData.ende || null,      // "2026-12-31" direkt
        bemerkungen: [formData.bemerkungen, formData.notizen]
          .filter(Boolean)
          .join('\n\n---\n\n')
      }

      console.log('📤 Sende Daten:', dataToSend)

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      })

      if (!response.ok) {
        const text = await response.text()
        try {
          const errorData = JSON.parse(text)
          throw new Error(errorData.error || 'Fehler beim Speichern')
        } catch (e) {
          throw new Error(`Fehler beim Speichern (HTTP ${response.status})`)
        }
      }

      const savedPolice = await response.json()
      // alert() blockiert - direkt schließen!
      onSave(savedPolice.police || savedPolice)
      onClose()
    } catch (err) {
      setError('❌ ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const isUVG = parseInt(formData.sparte_id) === 5
  const total = parseCHF(formData.praemie_chf || '0') + parseCHF(formData.gebuehren || '0')

  return (
    <div className="modal-overlay fullscreen" onClick={onClose}>
      <div className="modal modal-fullscreen" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="modal-header">
          <div>
            <h3>📋 {police?.id ? (isEditMode ? 'Police bearbeiten' : 'Police anzeigen') : 'Neue Police'}</h3>
            <p className="modal-subtitle">{formData.policennummer || '(Noch keine Nummer)'}</p>
          </div>
          <div className="header-actions">
            {police?.id && !isEditMode && (
              <button 
                className="button-edit"
                onClick={() => setIsEditMode(true)}
              >
                ✏️ Bearbeiten
              </button>
            )}
            {isEditMode && (
              <button 
                className="button-edit"
                onClick={() => {
                  setIsEditMode(false)
                }}
                style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}
              >
                ✕ Abbrechen
              </button>
            )}
            <button className="close-button" onClick={onClose}>✕</button>
          </div>
        </div>

        {error && <div style={{ background: '#fecaca', padding: '1rem', marginBottom: '1rem', borderRadius: '4px', color: '#7f1d1d' }}>
          {error}
        </div>}

        {/* 2-CONTAINER LAYOUT */}
        <div className="modal-content-2container">
          {/* LEFT: FORMULAR */}
          <div className="container-left">
            {/* SPARTE & VERSICHERER */}
            <div className="form-grid-3col">
              <div className="form-group">
                <label>Sparte</label>
                <select name="sparte_id" value={formData.sparte_id} onChange={handleInputChange} disabled={!isEditMode}>
                  <option value="">-- Wählen --</option>
                  {sparten.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group span-3">
                <label>Versicherer</label>
                <select name="versicherer_id" value={formData.versicherer_id} onChange={handleInputChange} disabled={!isEditMode}>
                  <option value="">-- Wählen --</option>
                  {versicherer.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* POLICENNUMMER & PRÄMIE */}
            <div className="form-grid-3col">
              <div className="form-group">
                <label>Policennummer</label>
                <input type="text" name="policennummer" disabled={!isEditMode} value={formData.policennummer} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Prämie</label>
                <input type="text" name="praemie_chf" value={formData.praemie_chf || ''} onChange={handleInputChange} placeholder="z.B. 1234.56" disabled={!isEditMode} />
              </div>
              <div className="form-group">
                <label>Gebühren</label>
                <input type="text" name="gebuehren" value={formData.gebuehren || ''} onChange={handleInputChange} placeholder="z.B. 100.00" disabled={!isEditMode} />
              </div>
              <div className="form-group span-3">
                <label>Total CHF</label>
                <input type="text" value={formatCHFInput(total)} readOnly />
              </div>
            </div>

            {/* ZAHLUNGSART & DATEN */}
            <div className="form-grid-3col">
              <div className="form-group">
                <label>Zahlungsart</label>
                <select name="zahlungsart" value={formData.zahlungsart || 'jährlich'} onChange={handleInputChange} disabled={!isEditMode}>
                  <option value="jährlich">🔄 Jährlich</option>
                  <option value="halbjährlich">🔄 Halbjährlich</option>
                  <option value="vierteljährlich">🔄 Vierteljährlich</option>
                  <option value="monatlich">🔄 Monatlich</option>
                </select>
              </div>
              <div className="form-group">
                <label>Gültig von</label>
                <input type="date" name="beginn" value={formData.beginn} onChange={handleInputChange} disabled={!isEditMode} />
              </div>
              <div className="form-group">
                <label>Gültig bis</label>
                <input type="date" name="ende" value={formData.ende} onChange={handleInputChange} disabled={!isEditMode} />
              </div>
              <div className="form-group">
                <label>Fälligkeit</label>
                <input type="text" name="faelligkeit" value={formData.faelligkeit} onChange={handleInputChange} placeholder="z.B. 15.01" maxLength="5" disabled={!isEditMode} />
              </div>
              <div className="form-group">
                <label>AVB-Ausgabe</label>
                <input type="text" name="avb_ausgabe" value={formData.avb_ausgabe || ''} onChange={handleInputChange} placeholder="z.B. 2024" disabled={!isEditMode} />
              </div>
            </div>

            {/* CHECKBOXES */}
            <div className="form-grid-3col">
              <div className="form-group checkbox-cell">
                <label>
                  <input type="checkbox" name="jaehrliches_kuendigungsrecht" disabled={!isEditMode} checked={formData.jaehrliches_kuendigungsrecht} onChange={handleInputChange} />
                  Jährliches Kündigungsrecht
                </label>
              </div>
              <div className="form-group checkbox-cell">
                <label>
                  <input type="checkbox" name="praemiengarantie" disabled={!isEditMode} checked={formData.praemiengarantie} onChange={handleInputChange} />
                  Prämiengarantie
                </label>
              </div>
            </div>

            {/* STATUS & PRIORITÄT */}
            <div className="form-grid-3col">
              <div className="form-group">
                <label>Status</label>
                <select name="status_detail" value={formData.status_detail} onChange={handleInputChange} disabled={!isEditMode}>
                  <option value="Aktiv">✅ Aktiv</option>
                  <option value="Inaktiv">⚪ Inaktiv</option>
                  <option value="Ablauf_bald">🔔 Ablauf bald</option>
                  <option value="Abgelaufen">⚠️ Abgelaufen</option>
                  <option value="Archiv">⚫ Archiv</option>
                </select>
              </div>
              <div className="form-group">
                <label>Priorität</label>
                <select name="prioritaet" value={formData.prioritaet} onChange={handleInputChange} disabled={!isEditMode}>
                  <option value="VIP">⭐ VIP</option>
                  <option value="Hoch">🔴 Hoch</option>
                  <option value="Normal">🟡 Normal</option>
                  <option value="Niedrig">🟢 Niedrig</option>
                  <option value="Archiv">⚫ Archiv</option>
                </select>
              </div>
            </div>

            {/* BESONDERE BEDINGUNGEN */}
            <div className="form-group span-3">
              <label>📋 Besondere Bedingungen</label>
              <textarea name="bemerkungen" value={formData.bemerkungen || ''} onChange={handleInputChange} rows="3" placeholder="Besondere Bedingungen..." disabled={!isEditMode} />
            </div>

            {/* BEMERKUNGEN */}
            <div className="form-group span-3">
              <label>Bemerkungen</label>
              <textarea name="notizen" value={formData.notizen || ''} onChange={handleInputChange} rows="3" placeholder="Weitere Bemerkungen..." disabled={!isEditMode} />
            </div>

            {/* UVG SECTION */}
            {isUVG && (
              <>
                <div className="form-grid-3col span-3">
                  <h4 style={{ gridColumn: '1 / -1' }}>✓ UVG-Grunddaten</h4>
                  <div className="form-group">
                    <label>Risiko-Nummer</label>
                    <input type="text" name="uvg_risiko_nr" value={formData.uvg_risiko_nr} onChange={handleInputChange} disabled={!isEditMode} />
                  </div>
                  <div className="form-group">
                    <label>Art des Betriebs</label>
                    <input type="text" name="uvg_art_betrieb" value={formData.uvg_art_betrieb} onChange={handleInputChange} disabled={!isEditMode} />
                  </div>
                </div>

                <div className="form-grid-3col span-3">
                  <h4 style={{ gridColumn: '1 / -1' }}>✓ UVG-Betrieb Unselbstständige</h4>
                  <div className="form-group">
                    <label>Gefahrenklasse</label>
                    <input type="text" name="uvg_bu_gefahrenklasse" value={formData.uvg_bu_gefahrenklasse} onChange={handleInputChange} placeholder="z.B. Klasse 1 oder 1" disabled={!isEditMode} />
                  </div>
                  <div className="form-group">
                    <label>Gefahrenstufe</label>
                    <input type="text" name="uvg_bu_gefahrenstufe" value={formData.uvg_bu_gefahrenstufe} onChange={handleInputChange} placeholder="z.B. Stufe I oder I" disabled={!isEditMode} />
                  </div>
                  <div className="form-group">
                    <label>Prämiensatz %</label>
                    <input type="text" name="uvg_bu_praemiensatz" value={formData.uvg_bu_praemiensatz} onChange={handleInputChange} disabled={!isEditMode} />
                  </div>
                </div>

                <div className="form-grid-3col span-3">
                  <h4 style={{ gridColumn: '1 / -1' }}>✓ UVG-Betrieb Nichterwerbstätige</h4>
                  <div className="form-group">
                    <label>Gefahrenklasse</label>
                    <input type="text" name="uvg_nbu_gefahrenklasse" value={formData.uvg_nbu_gefahrenklasse} onChange={handleInputChange} placeholder="z.B. Klasse 1 oder 1" disabled={!isEditMode} />
                  </div>
                  <div className="form-group">
                    <label>Unterklasse</label>
                    <input type="text" name="uvg_nbu_unterklasse" value={formData.uvg_nbu_unterklasse} onChange={handleInputChange} placeholder="z.B. Unterklasse 1 oder 1" disabled={!isEditMode} />
                  </div>
                  <div className="form-group">
                    <label>Prämiensatz %</label>
                    <input type="text" name="uvg_nbu_praemiensatz" value={formData.uvg_nbu_praemiensatz} onChange={handleInputChange} disabled={!isEditMode} />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* RIGHT: TABS + BOXES */}
          <div className="container-right">
            {police && (
              <>
                {/* TAB BUTTONS */}
                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.4rem' }}>
                  <button 
                    onClick={() => setRightActiveTab('dateien')}
                    style={{
                      padding: '0.3rem 0.6rem',
                      fontSize: '0.75rem',
                      background: rightActiveTab === 'dateien' ? '#1e40af' : '#f0f0f0',
                      color: rightActiveTab === 'dateien' ? 'white' : '#333',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    📁 Dateien
                  </button>
                  <button 
                    onClick={() => setRightActiveTab('mutations')}
                    style={{
                      padding: '0.3rem 0.6rem',
                      fontSize: '0.75rem',
                      background: rightActiveTab === 'mutations' ? '#1e40af' : '#f0f0f0',
                      color: rightActiveTab === 'mutations' ? 'white' : '#333',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    📜 History
                  </button>
                </div>

                {/* TAB CONTENT - DATEIEN */}
                {rightActiveTab === 'dateien' && (
                  <div className="right-section documents-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <h4 style={{ margin: 0 }}>📁 Dateien</h4>
                      {isEditMode && (
                        <button 
                          onClick={() => setShowModal(true)}
                          style={{
                            padding: '0.3rem 0.6rem',
                            fontSize: '0.8rem',
                            backgroundColor: '#1e40af',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            flexShrink: 0
                          }}
                        >
                          + Datei
                        </button>
                      )}
                    </div>
                    <DateienTab policeId={police.id} />
                  </div>
                )}

                {/* TAB CONTENT - MUTATIONS */}
                {rightActiveTab === 'mutations' && (
                  <div className="right-section documents-section">
                    <h4 style={{ margin: '0 0 0.4rem 0' }}>📜 Änderungsverlauf</h4>
                    <MutationsTab policeId={police.id} />
                  </div>
                )}

                {/* RECHNUNGEN BOX */}
                <div className="right-section">
                  <h4>💰 Rechnungen</h4>
                  <div className="empty-section">
                    Hier erscheinen die Rechnungen
                  </div>
                </div>

                {/* SCHADENFÄLLE BOX */}
                <div className="right-section">
                  <h4>⚠️ Schadenfälle</h4>
                  <div className="empty-section">
                    Hier erscheinen die Schadenfälle
                  </div>
                </div>

                {/* ARCHIV-LINK */}
                <div className="right-section">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <h4 style={{ margin: 0 }}>🗂️ Archiv</h4>
                    {isEditMode && (
                      <button 
                        onClick={() => {
                          const link = prompt('Archiv-Link eingeben:', formData.archiv_url || '')
                          if (link !== null) setFormData({...formData, archiv_url: link})
                        }}
                        style={{
                          padding: '0.3rem 0.6rem',
                          fontSize: '0.75rem',
                          backgroundColor: '#475569',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer'
                        }}
                      >
                        ✏️ Bearbeiten
                      </button>
                    )}
                  </div>
                  {formData.archiv_url ? (
                    <a 
                      href={formData.archiv_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '0.4rem 0.8rem',
                        border: '1px solid #1e40af',
                        borderRadius: '3px',
                        fontSize: '0.75rem',
                        color: '#1e40af',
                        textDecoration: 'none',
                        fontWeight: '500',
                        display: 'inline-block',
                        cursor: 'pointer'
                      }}
                    >
                      🔗 Zum Archiv
                    </a>
                  ) : isEditMode ? (
                    <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: 0 }}>Kein Link - auf Bearbeiten klicken</p>
                  ) : (
                    <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: 0 }}>Kein Link</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ACTIONS */}
        <div className="modal-actions">
          <button className="button-secondary" onClick={onClose} disabled={loading}>
            Schließen
          </button>
          {isEditMode && (
            <button className="button-primary" onClick={handleSave} disabled={loading}>
              {loading ? '💾 Speichern...' : '💾 Speichern'}
            </button>
          )}
        </div>

        {/* DATEIEN MODAL */}
        {showModal && (
          <DateienModal 
            policeId={police?.id}
            onClose={() => setShowModal(false)}
            onSave={() => {
              setShowModal(false)
            }}
          />
        )}
      </div>
    </div>
  )
}

export default PolicenDetailsModal