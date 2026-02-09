import { useState, useEffect } from 'react'
import { formatCHF, formatCHFInput, parseCHF, formatDateShort, isValidDateShort } from '../utils/formatters'
import DateienTab from './DateienTab'
import DateienModal from './DateienModal'
import MutationsTab from './MutationsTab'
import KlauselnTab from './KlauselnTab'
import KlauselVerwaltungModal from './KlauselVerwaltungModal'
import KlauselAuswahlModal from './KlauselAuswahlModal'
import ZusatzdeckungenManager from './ZusatzdeckungenManager'
import './PolicenDetailsModal.css'
import VersicherungsummenSection from './VersicherungsummenSection'
import VersicherungsorteManager from './VersicherungsorteManager'
import GrundversicherungManager from './GrundversicherungManager'
import BetriebsunterbruchManager from './BetriebsunterbruchManager'

// Formatiert Lohnsummen mit Schweizer Tausendertrennzeichen
const formatSwissNumber = (value) => {
  if (!value) return ''
  const num = value.toString().replace(/[^\d.]/g, '')
  const parts = num.split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, "'")
  return parts.join('.')
}

function PolicenDetailsModal({ police, kundeId, kundeTyp, onClose, onSave }) {
  const [sparten, setSparten] = useState([])
  const [versicherer, setVersicherer] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showKlauselVerwaltung, setShowKlauselVerwaltung] = useState(false)
  const [showKlauselAuswahl, setShowKlauselAuswahl] = useState(false)
  const [klauselnRefreshTrigger, setKlauselnRefreshTrigger] = useState(0)
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
    // UVG Felder
    uvg_risiko_nr: '',
    uvg_art_betrieb: '',
    uvg_versicherter_personenkreis: 'Alle Arbeitnehmenden gemäss Art. 1a und 2 UVG sowie Art. 1 bis 6 UVV',
    uvg_bu_gefahrenklasse: '',
    uvg_bu_gefahrenstufe: '',
    uvg_bu_praemiensatz: '',
    uvg_nbu_gefahrenklasse: '',
    uvg_nbu_unterklasse: '',
    uvg_nbu_praemiensatz: '',
    uvg_lohnsumme_maenner_bu: '',
    uvg_lohnsumme_frauen_bu: '',
    uvg_lohnsumme_maenner_nbu: '',
    uvg_lohnsumme_frauen_nbu: '',
    // KTG Felder
    ktg_max_versicherter_lohn: '300000.00',
    ktg_taggeld: '80',
    ktg_wartefrist: '30',
    ktg_wartefrist_art: 'je Fall',
    ktg_leistungsdauer: '730 Tage',
    ktg_mutterschaftstaggeld: '',
    ktg_vaterschaftstaggeld: '',
    ktg_praemiensatz_maenner: '',
    ktg_praemiensatz_frauen: '',
    ktg_lohnsumme_maenner: '',
    ktg_lohnsumme_frauen: '',
    ktg_lohnsumme_mutterschaft_eo: '',
    ktg_lohnsumme_mutterschaft_uebersteigend: '',
    ktg_lohnsumme_vaterschaft: '',
    // Haftpflicht Felder
    haft_ahv_lohnsumme: '',
    haft_umsatz: '',
    haft_deklaration: 'Pauschal',
    haft_grunddeckung_garantiesumme: '',
    haft_grunddeckung_selbstbehalt: ''
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
        praemiengarantie: police.praemiengarantie ? true : false,
        // KTG - Formatiert
        ktg_max_versicherter_lohn: police.ktg_max_versicherter_lohn ? formatSwissNumber(police.ktg_max_versicherter_lohn) : '300000.00',
        ktg_lohnsumme_maenner: police.ktg_lohnsumme_maenner ? formatSwissNumber(police.ktg_lohnsumme_maenner) : '',
        ktg_lohnsumme_frauen: police.ktg_lohnsumme_frauen ? formatSwissNumber(police.ktg_lohnsumme_frauen) : '',
        ktg_lohnsumme_mutterschaft_eo: police.ktg_lohnsumme_mutterschaft_eo ? formatSwissNumber(police.ktg_lohnsumme_mutterschaft_eo) : '',
        ktg_lohnsumme_mutterschaft_uebersteigend: police.ktg_lohnsumme_mutterschaft_uebersteigend ? formatSwissNumber(police.ktg_lohnsumme_mutterschaft_uebersteigend) : '',
        ktg_lohnsumme_vaterschaft: police.ktg_lohnsumme_vaterschaft ? formatSwissNumber(police.ktg_lohnsumme_vaterschaft) : '',
        // UVG - Formatiert
        uvg_lohnsumme_maenner_bu: police.uvg_lohnsumme_maenner_bu ? formatSwissNumber(police.uvg_lohnsumme_maenner_bu) : '',
        uvg_lohnsumme_frauen_bu: police.uvg_lohnsumme_frauen_bu ? formatSwissNumber(police.uvg_lohnsumme_frauen_bu) : '',
        uvg_lohnsumme_maenner_nbu: police.uvg_lohnsumme_maenner_nbu ? formatSwissNumber(police.uvg_lohnsumme_maenner_nbu) : '',
        uvg_lohnsumme_frauen_nbu: police.uvg_lohnsumme_frauen_nbu ? formatSwissNumber(police.uvg_lohnsumme_frauen_nbu) : '',
        // Haftpflicht - Formatiert
        haft_ahv_lohnsumme: police.haft_ahv_lohnsumme ? formatSwissNumber(police.haft_ahv_lohnsumme) : '',
        haft_umsatz: police.haft_umsatz ? formatSwissNumber(police.haft_umsatz) : '',
        haft_grunddeckung_garantiesumme: police.haft_grunddeckung_garantiesumme ? formatSwissNumber(police.haft_grunddeckung_garantiesumme) : '',
        haft_grunddeckung_selbstbehalt: police.haft_grunddeckung_selbstbehalt ? formatSwissNumber(police.haft_grunddeckung_selbstbehalt) : ''
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
    let finalValue = type === 'checkbox' ? checked : value

    // Formatiere Lohnsummen-Felder und Haft-Beträge beim Eingeben
    if (name.includes('lohnsumme') || 
        name === 'ktg_max_versicherter_lohn' ||
        name === 'haft_ahv_lohnsumme' ||
        name === 'haft_umsatz' ||
        name === 'haft_grunddeckung_garantiesumme' ||
        name === 'haft_grunddeckung_selbstbehalt') {
      finalValue = formatSwissNumber(value)
    }

    const newFormData = {
      ...formData,
      [name]: finalValue
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

      // Konvertiert leere Strings und formatierte Zahlen zu NULL oder Number
      const cleanNumber = (val) => {
        if (!val || val === '' || val === '-') return null
        const cleaned = val.toString().replace(/'/g, '')
        const num = parseFloat(cleaned)
        return isNaN(num) ? null : num
      }

      // Konvertiert leere Strings zu NULL für Text-Felder
      const cleanString = (val) => {
        if (!val || val === '' || val === '-') return null
        return val
      }

      // Konvertiert Prämiensätze: Entfernt % und gibt Zahl zurück
      const cleanPercentage = (val) => {
        if (!val || val === '' || val === '-') return null
        const cleaned = val.toString().replace(/%/g, '').replace(/'/g, '').trim()
        const num = parseFloat(cleaned)
        return isNaN(num) ? null : num
      }

      const dataToSend = {
        ...formData,
        praemie_chf: parseCHF(formData.praemie_chf || '0'),
        gebuehren: parseCHF(formData.gebuehren || '0'),
        beginn: formData.beginn || null,
        ende: formData.ende || null,
        bemerkungen: [formData.bemerkungen, formData.notizen]
          .filter(Boolean)
          .join('\n\n---\n\n'),
        // UVG Text-Felder
        uvg_risiko_nr: cleanString(formData.uvg_risiko_nr),
        uvg_art_betrieb: cleanString(formData.uvg_art_betrieb),
        uvg_bu_gefahrenklasse: cleanString(formData.uvg_bu_gefahrenklasse),
        uvg_bu_gefahrenstufe: cleanString(formData.uvg_bu_gefahrenstufe),
        uvg_bu_praemiensatz: cleanPercentage(formData.uvg_bu_praemiensatz),
        uvg_nbu_gefahrenklasse: cleanString(formData.uvg_nbu_gefahrenklasse),
        uvg_nbu_unterklasse: cleanString(formData.uvg_nbu_unterklasse),
        uvg_nbu_praemiensatz: cleanPercentage(formData.uvg_nbu_praemiensatz),
        // UVG Lohnsummen
        uvg_lohnsumme_maenner_bu: cleanNumber(formData.uvg_lohnsumme_maenner_bu),
        uvg_lohnsumme_frauen_bu: cleanNumber(formData.uvg_lohnsumme_frauen_bu),
        uvg_lohnsumme_maenner_nbu: cleanNumber(formData.uvg_lohnsumme_maenner_nbu),
        uvg_lohnsumme_frauen_nbu: cleanNumber(formData.uvg_lohnsumme_frauen_nbu),
        // KTG Text-Felder
        ktg_mutterschaftstaggeld: cleanString(formData.ktg_mutterschaftstaggeld),
        ktg_vaterschaftstaggeld: cleanString(formData.ktg_vaterschaftstaggeld),
        ktg_praemiensatz_maenner: cleanPercentage(formData.ktg_praemiensatz_maenner),
        ktg_praemiensatz_frauen: cleanPercentage(formData.ktg_praemiensatz_frauen),
        // KTG Checkboxen (entfernt - auf null setzen)
        ktg_lohnnachgenuss: null,
        ktg_familienzulagen: null,
        // KTG Lohnsummen
        ktg_max_versicherter_lohn: cleanNumber(formData.ktg_max_versicherter_lohn),
        ktg_lohnsumme_maenner: cleanNumber(formData.ktg_lohnsumme_maenner),
        ktg_lohnsumme_frauen: cleanNumber(formData.ktg_lohnsumme_frauen),
        ktg_lohnsumme_mutterschaft_eo: cleanNumber(formData.ktg_lohnsumme_mutterschaft_eo),
        ktg_lohnsumme_mutterschaft_uebersteigend: cleanNumber(formData.ktg_lohnsumme_mutterschaft_uebersteigend),
        ktg_lohnsumme_vaterschaft: cleanNumber(formData.ktg_lohnsumme_vaterschaft),
        // Haftpflicht-Felder
        haft_ahv_lohnsumme: cleanNumber(formData.haft_ahv_lohnsumme),
        haft_umsatz: cleanNumber(formData.haft_umsatz),
        haft_deklaration: cleanString(formData.haft_deklaration),
        haft_grunddeckung_garantiesumme: cleanNumber(formData.haft_grunddeckung_garantiesumme),
        haft_grunddeckung_selbstbehalt: cleanNumber(formData.haft_grunddeckung_selbstbehalt),
        haft_grunddeckung_selbstbehalt: cleanNumber(formData.haft_grunddeckung_selbstbehalt),
        // SACH-FELDER
        sach_inventar: cleanNumber(formData.sach_inventar),
        sach_inventar_nicht_fix_freien: cleanNumber(formData.sach_inventar_nicht_fix_freien),
        sach_inventar_fix_installationen: cleanNumber(formData.sach_inventar_fix_installationen),
        sach_inventar_elementar_spezial: cleanNumber(formData.sach_inventar_elementar_spezial),
        sach_inventar_container: cleanNumber(formData.sach_inventar_container),
        sach_mfz_gesamt: cleanNumber(formData.sach_mfz_gesamt),
        sach_mfz_bis_35t: cleanNumber(formData.sach_mfz_bis_35t),
        sach_mfz_ueber_35t: cleanNumber(formData.sach_mfz_ueber_35t),
        sach_umsatz: cleanNumber(formData.sach_umsatz)
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
      onSave(savedPolice.police || savedPolice)
      onClose()
    } catch (err) {
      setError('❌ ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const isUVG = parseInt(formData.sparte_id) === 5
  const isKTG = parseInt(formData.sparte_id) === 6
  const isHaft = parseInt(formData.sparte_id) === 9
  const isSach = parseInt(formData.sparte_id) === 8
  
  // 🔍 DEBUG: Zeigt die aktuelle Sparte-ID in der Console
  useEffect(() => {
    if (formData.sparte_id) {
      console.log('🔍 DEBUG - Gewählte Sparte-ID:', formData.sparte_id)
      console.log('🔍 DEBUG - isUVG:', isUVG, '| isKTG:', isKTG, '| isSach:', isSach, '| isHaft:', isHaft)
    }
  }, [formData.sparte_id, isUVG, isKTG, isHaft])
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
                onClick={() => setIsEditMode(false)}
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
                  <div className="form-group">
                    <label>Lohnsumme Männer BU</label>
                    <input type="text" name="uvg_lohnsumme_maenner_bu" value={formData.uvg_lohnsumme_maenner_bu || ''} onChange={handleInputChange} placeholder="z.B. 150'000.00" disabled={!isEditMode} />
                  </div>
                  <div className="form-group">
                    <label>Lohnsumme Frauen BU</label>
                    <input type="text" name="uvg_lohnsumme_frauen_bu" value={formData.uvg_lohnsumme_frauen_bu || ''} onChange={handleInputChange} placeholder="z.B. 120'000.00" disabled={!isEditMode} />
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
                  <div className="form-group">
                    <label>Lohnsumme Männer NBU</label>
                    <input type="text" name="uvg_lohnsumme_maenner_nbu" value={formData.uvg_lohnsumme_maenner_nbu || ''} onChange={handleInputChange} placeholder="z.B. 150'000.00" disabled={!isEditMode} />
                  </div>
                  <div className="form-group">
                    <label>Lohnsumme Frauen NBU</label>
                    <input type="text" name="uvg_lohnsumme_frauen_nbu" value={formData.uvg_lohnsumme_frauen_nbu || ''} onChange={handleInputChange} placeholder="z.B. 120'000.00" disabled={!isEditMode} />
                  </div>
                </div>
              </>
            )}

            {/* KTG SECTION */}
            {isKTG && (
              <>
                <div className="form-grid-3col span-3">
                  <h4 style={{ gridColumn: '1 / -1' }}>✓ KTG-Grunddaten</h4>
                  <div className="form-group">
                    <label>Maximaler versicherter Lohn CHF</label>
                    <input type="text" name="ktg_max_versicherter_lohn" value={formData.ktg_max_versicherter_lohn || ''} onChange={handleInputChange} placeholder="300'000.00" disabled={!isEditMode} />
                  </div>
                  <div className="form-group">
                    <label>Taggeld %</label>
                    <select name="ktg_taggeld" value={formData.ktg_taggeld || '80'} onChange={handleInputChange} disabled={!isEditMode}>
                      <option value="80">80%</option>
                      <option value="85">85%</option>
                      <option value="88">88%</option>
                      <option value="90">90%</option>
                      <option value="100">100%</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Wartefrist</label>
                    <select name="ktg_wartefrist" value={formData.ktg_wartefrist || '30'} onChange={handleInputChange} disabled={!isEditMode}>
                      <option value="0">0 Tage</option>
                      <option value="2">2 Tage</option>
                      <option value="7">7 Tage</option>
                      <option value="14">14 Tage</option>
                      <option value="30">30 Tage</option>
                      <option value="60">60 Tage</option>
                      <option value="90">90 Tage</option>
                      <option value="180">180 Tage</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Wartefrist-Art</label>
                    <select name="ktg_wartefrist_art" value={formData.ktg_wartefrist_art || 'je Fall'} onChange={handleInputChange} disabled={!isEditMode}>
                      <option value="je Fall">je Fall</option>
                      <option value="je Kalenderjahr">je Kalenderjahr</option>
                      <option value="je Arbeitsjahr">je Arbeitsjahr</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Leistungsdauer</label>
                    <select name="ktg_leistungsdauer" value={formData.ktg_leistungsdauer || '730 Tage'} onChange={handleInputChange} disabled={!isEditMode}>
                      <option value="730 Tage">730 Tage</option>
                      <option value="730 Tage innert 900 Tagen">730 Tage innert 900 Tagen</option>
                    </select>
                  </div>
                </div>

                {/* 2-GRID FÜR ZUSATZLEISTUNGEN */}
                <div className="form-grid-2col span-3">
                  <h4 style={{ gridColumn: '1 / -1' }}>✓ KTG-Zusatzleistungen</h4>
                  <div className="form-group">
                    <label>Mutterschaftstaggeld</label>
                    <input type="text" name="ktg_mutterschaftstaggeld" value={formData.ktg_mutterschaftstaggeld || ''} onChange={handleInputChange} placeholder="Zu ergänzen" disabled={!isEditMode} />
                  </div>
                  <div className="form-group">
                    <label>Vaterschaftstaggeld</label>
                    <input type="text" name="ktg_vaterschaftstaggeld" value={formData.ktg_vaterschaftstaggeld || ''} onChange={handleInputChange} placeholder="Zu ergänzen" disabled={!isEditMode} />
                  </div>
                </div>

                {/* 2-GRID FÜR PRÄMIENSÄTZE & LOHNSUMMEN */}
                <div className="form-grid-2col span-3">
                  <h4 style={{ gridColumn: '1 / -1' }}>✓ KTG-Prämiensätze & Lohnsummen</h4>
                  <div className="form-group">
                    <label>Prämiensatz Männer %</label>
                    <input type="text" name="ktg_praemiensatz_maenner" value={formData.ktg_praemiensatz_maenner || ''} onChange={handleInputChange} placeholder="z.B. 1.25" disabled={!isEditMode} />
                  </div>
                  <div className="form-group">
                    <label>Prämiensatz Frauen %</label>
                    <input type="text" name="ktg_praemiensatz_frauen" value={formData.ktg_praemiensatz_frauen || ''} onChange={handleInputChange} placeholder="z.B. 1.50" disabled={!isEditMode} />
                  </div>
                  <div className="form-group">
                    <label>Lohnsumme Männer CHF</label>
                    <input type="text" name="ktg_lohnsumme_maenner" value={formData.ktg_lohnsumme_maenner || ''} onChange={handleInputChange} placeholder="z.B. 150'000.00" disabled={!isEditMode} />
                  </div>
                  <div className="form-group">
                    <label>Lohnsumme Frauen CHF</label>
                    <input type="text" name="ktg_lohnsumme_frauen" value={formData.ktg_lohnsumme_frauen || ''} onChange={handleInputChange} placeholder="z.B. 120'000.00" disabled={!isEditMode} />
                  </div>
                  <div className="form-group">
                    <label>Lohnsumme Mutterschaft EO CHF</label>
                    <input type="text" name="ktg_lohnsumme_mutterschaft_eo" value={formData.ktg_lohnsumme_mutterschaft_eo || ''} onChange={handleInputChange} placeholder="z.B. 50'000.00" disabled={!isEditMode} />
                  </div>
                  <div className="form-group">
                    <label>Lohnsumme Mutterschaft übersteigend CHF</label>
                    <input type="text" name="ktg_lohnsumme_mutterschaft_uebersteigend" value={formData.ktg_lohnsumme_mutterschaft_uebersteigend || ''} onChange={handleInputChange} placeholder="z.B. 30'000.00" disabled={!isEditMode} />
                  </div>
                  <div className="form-group">
                    <label>Lohnsumme Vaterschaft CHF</label>
                    <input type="text" name="ktg_lohnsumme_vaterschaft" value={formData.ktg_lohnsumme_vaterschaft || ''} onChange={handleInputChange} placeholder="z.B. 20'000.00" disabled={!isEditMode} />
                  </div>
                </div>
              </>
            )}

            {/* HAFTPFLICHT SECTION */}
            {isHaft && (
              <>
                <div className="form-grid-3col span-3">
                  <h4 style={{ gridColumn: '1 / -1' }}>✓ Haftpflicht-Grunddaten</h4>
                  <div className="form-group">
                    <label>AHV-Lohnsumme CHF</label>
                    <input 
                      type="text" 
                      name="haft_ahv_lohnsumme" 
                      value={formData.haft_ahv_lohnsumme || ''} 
                      onChange={handleInputChange} 
                      placeholder="z.B. 500'000.00" 
                      disabled={!isEditMode} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Umsatz CHF</label>
                    <input 
                      type="text" 
                      name="haft_umsatz" 
                      value={formData.haft_umsatz || ''} 
                      onChange={handleInputChange} 
                      placeholder="z.B. 1'000'000.00" 
                      disabled={!isEditMode} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Deklaration</label>
                    <select 
                      name="haft_deklaration" 
                      value={formData.haft_deklaration || 'Pauschal'} 
                      onChange={handleInputChange} 
                      disabled={!isEditMode}
                    >
                      <option value="Pauschal">Pauschal</option>
                      <option value="jährlich">jährlich</option>
                    </select>
                  </div>
                </div>

                <div className="form-grid-3col span-3">
                  <h4 style={{ gridColumn: '1 / -1' }}>✓ Grunddeckung</h4>
                  <div className="form-group">
                    <label>Garantiesumme CHF</label>
                    <input 
                      type="text" 
                      name="haft_grunddeckung_garantiesumme" 
                      value={formData.haft_grunddeckung_garantiesumme || ''} 
                      onChange={handleInputChange} 
                      placeholder="z.B. 5'000'000.00" 
                      disabled={!isEditMode} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Selbstbehalt CHF</label>
                    <input 
                      type="text" 
                      name="haft_grunddeckung_selbstbehalt" 
                      value={formData.haft_grunddeckung_selbstbehalt || ''} 
                      onChange={handleInputChange} 
                      placeholder="z.B. 500.00" 
                      disabled={!isEditMode} 
                    />
                  </div>
                </div>

                {/* ZUSATZDECKUNGEN */}
                <div className="span-3">
                  <ZusatzdeckungenManager 
                    policeId={police?.id} 
                    versichererId={formData.versicherer_id}
                    sparteId={formData.sparte_id}
                    isEditMode={isEditMode} 
                  />
                </div>
              </>
            )}

            {/* SACH SECTION */}
            {isSach && (
              <>
                {/* Versicherungssummen */}
                <VersicherungsummenSection
                  formData={formData}
                  setFormData={setFormData}
                  isEditMode={isEditMode}
                />

                {/* Versicherungsorte (mehrere Standorte) */}
                <VersicherungsorteManager
                  policeId={formData.id}
                  isEditMode={isEditMode}
                />

                {/* Grundversicherung (8 Risiken) */}
                <GrundversicherungManager
                  policeId={formData.id}
                  inventar={formData.sach_inventar}
                  mfzGesamt={formData.sach_mfz_gesamt}
                  isEditMode={isEditMode}
                />

                {/* Betriebsunterbruch (5 Risiken) */}
                <BetriebsunterbruchManager
                  policeId={formData.id}
                  umsatz={formData.sach_umsatz}
                  isEditMode={isEditMode}
                />

                {/* Zusatzdeckungen */}
                <div className="span-3">
                  <ZusatzdeckungenManager 
                    policeId={formData.id}
                    versichererId={formData.versicherer_id}
                    sparteId={formData.sparte_id}
                    isEditMode={isEditMode} 
                  />
                </div>

                {/* Klauseln */}
                <div className="span-3" style={{ marginTop: '2rem' }}>
                  <h4 style={{ 
                    fontSize: '1rem', 
                    fontWeight: 600, 
                    color: '#1f2937', 
                    marginBottom: '1rem',
                    paddingBottom: '0.5rem',
                    borderBottom: '2px solid #e5e7eb'
                  }}>
                    📋 Vertragsklauseln
                  </h4>
                  <KlauselnTab
                    policeId={formData.id}
                    isEditMode={isEditMode}
                  />
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
                    onClick={() => setRightActiveTab('klauseln')}
                    style={{
                      padding: '0.3rem 0.6rem',
                      fontSize: '0.75rem',
                      background: rightActiveTab === 'klauseln' ? '#1e40af' : '#f0f0f0',
                      color: rightActiveTab === 'klauseln' ? 'white' : '#333',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    📋 Klauseln
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

                {/* TAB CONTENT - KLAUSELN */}
                {rightActiveTab === 'klauseln' && (
                  <div className="right-section documents-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', gap: '0.5rem' }}>
                      <h4 style={{ margin: 0 }}>📋 Vertragsklauseln</h4>
                      {isEditMode && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            onClick={() => setShowKlauselVerwaltung(true)}
                            style={{
                              padding: '0.3rem 0.6rem',
                              fontSize: '0.75rem',
                              backgroundColor: '#475569',
                              color: 'white',
                              border: 'none',
                              borderRadius: '3px',
                              cursor: 'pointer',
                              flexShrink: 0,
                              whiteSpace: 'nowrap'
                            }}
                          >
                            + Neue Klausel
                          </button>
                          <button 
                            onClick={() => setShowKlauselAuswahl(true)}
                            style={{
                              padding: '0.3rem 0.6rem',
                              fontSize: '0.75rem',
                              backgroundColor: '#1e40af',
                              color: 'white',
                              border: 'none',
                              borderRadius: '3px',
                              cursor: 'pointer',
                              flexShrink: 0,
                              whiteSpace: 'nowrap'
                            }}
                          >
                            + Hinzufügen
                          </button>
                        </div>
                      )}
                    </div>
                    <KlauselnTab policeId={police.id} key={`klauseln-${rightActiveTab}-${klauselnRefreshTrigger}`} />
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

        {/* KLAUSEL VERWALTUNG MODAL */}
        {showKlauselVerwaltung && (
          <KlauselVerwaltungModal 
            versichererId={formData.versicherer_id}
            sparteId={formData.sparte_id}
            onClose={() => setShowKlauselVerwaltung(false)}
            onSave={() => {
              setShowKlauselVerwaltung(false)
              setShowKlauselAuswahl(true)
            }}
          />
        )}

        {/* KLAUSEL AUSWAHL MODAL */}
        {showKlauselAuswahl && (
          <KlauselAuswahlModal 
            policeId={police?.id}
            versichererId={formData.versicherer_id}
            sparteId={formData.sparte_id}
            onClose={() => setShowKlauselAuswahl(false)}
            onSave={() => {
              setShowKlauselAuswahl(false)
              setRightActiveTab('klauseln')
              setKlauselnRefreshTrigger(prev => prev + 1)  // ← Trigger Refresh
            }}
          />
        )}
      </div>
    </div>
  )
}

export default PolicenDetailsModal