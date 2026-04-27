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

const formatSwissNumber = (value) => {
  if (!value) return ''
  const num = value.toString().replace(/[^\d.]/g, '')
  const parts = num.split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, "'")
  return parts.join('.')
}

// ── MFZ Konstanten ──────────────────────────────────────────
const MFZ_KANTONE = ['AG','AI','AR','BE','BL','BS','FR','GE','GL','GR','JU','LU','NE','NW','OW','SG','SH','SO','SZ','TG','TI','UR','VD','VS','ZG','ZH']
const MFZ_FAHRZEUGART_DEFAULT = ['PKW','LKW','Motorrad','Motorroller','Wohnmobil','Anhänger','Traktor','Elektrofahrzeug']
const MFZ_MARKEN_DEFAULT = ['Audi','BMW','Fiat','Ford','Honda','Hyundai','Kia','Mazda','Mercedes','Nissan','Opel','Peugeot','Porsche','Renault','Seat','Skoda','Tesla','Toyota','VW','Volvo']
const MFZ_TREIBSTOFFART_DEFAULT = ['Benzin','Diesel','Elektro','Hybrid','Plug-in Hybrid','Gas','Wasserstoff']
const MFZ_VERWENDUNG_DEFAULT = ['Privatfahrzeug','Geschäftsfahrzeug','Gemischte Nutzung','Lieferfahrzeug','Personentransport']
const MFZ_LENKER_TYP_DEFAULT = ['Hauptlenker','Gelegenheitslenker','Junglenker','Firmenfahrzeug allgemein']

const MFZ_INITIAL_FIELDS = {
  mfz_fahrzeugart: '',
  mfz_marke: '',
  mfz_typ: '',
  mfz_kontrollschild: '',
  mfz_kanton: '',
  mfz_stamm_nr: '',
  mfz_erste_iv: '',
  mfz_katalogpreis: '',
  mfz_zubehoer: '',
  mfz_fahrzeugwert: '',
  mfz_treibstoffart: '',
  mfz_verwendung: '',
  mfz_hubraum: '',
  mfz_ps: '',
  mfz_leergewicht: '',
  mfz_leasing: 'Nein',
  mfz_leasinggeber: '',
  mfz_lenker_typ: '',
  mfz_lenker_vorname: '',
  mfz_lenker_name: '',
  mfz_lenker_geburtsdatum: '',
  mfz_lenker_fahrausweis: '',
  mfz_versicherungssumme: '',
  mfz_sb_haft: '',
  mfz_grobfahrlaessigkeit: false,
  mfz_bonusschutz: false,
  mfz_kollision: false,
  mfz_sb_kollision: '',
  mfz_teilkasko: false,
  mfz_tk_diebstahl: true,
  mfz_tk_elementar: true,
  mfz_tk_feuer: true,
  mfz_tk_tier: true,
  mfz_tk_glas: 'Standard',
  mfz_tk_vandalismus: true,
  mfz_tk_marder: true,
  mfz_tk_parkschaden: false,
  mfz_tk_parkschaden_text: '',
  mfz_tk_mitgefuehrte_sachen: false,
  mfz_tk_mitgefuehrte_sachen_text: '',
  mfz_tk_cyber: false,
  mfz_tk_cyber_text: '',
  mfz_tk_felgen_reifen: false,
  mfz_tk_felgen_reifen_text: '',
  mfz_tk_innenraum: false,
  mfz_tk_innenraum_text: '',
  mfz_insassen: false,
  mfz_insassen_text: '',
  mfz_insassen_heilungskosten: false,
  mfz_insassen_todesfall: false,
  mfz_insassen_todesfall_text: '',
  mfz_insassen_invaliditaet: false,
  mfz_insassen_invaliditaet_text: '',
  mfz_insassen_spitaltaggeld: false,
  mfz_insassen_spitaltaggeld_text: '',
  mfz_insassen_taggeld: false,
  mfz_insassen_taggeld_text: '',
  mfz_pannendienst: false,
  mfz_pannendienst_text: '',
  mfz_ebatterie: false,
  mfz_ebatterie_text: '',
  mfz_eladegeraet: false,
  mfz_eladegeraet_text: '',
  mfz_gf_verzicht: false,
  mfz_bs: false,
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

  // MFZ dynamische Listen
  const [mfzFahrzeugart, setMfzFahrzeugart] = useState(MFZ_FAHRZEUGART_DEFAULT)
  const [mfzMarken, setMfzMarken] = useState(MFZ_MARKEN_DEFAULT)
  const [mfzTreibstoffart, setMfzTreibstoffart] = useState(MFZ_TREIBSTOFFART_DEFAULT)
  const [mfzVerwendung, setMfzVerwendung] = useState(MFZ_VERWENDUNG_DEFAULT)
  const [mfzLenkerTyp, setMfzLenkerTyp] = useState(MFZ_LENKER_TYP_DEFAULT)

  const addMfzOption = (setter, currentList) => {
    const val = window.prompt('Neuen Eintrag hinzufügen:')
    if (val && val.trim()) setter([...currentList, val.trim()])
  }

  const btnPlusStyle = {
    padding: '4px 8px',
    fontSize: '14px',
    background: '#e0f2fe',
    border: '1px solid #7dd3fc',
    borderRadius: '4px',
    cursor: 'pointer',
    color: '#0369a1',
    lineHeight: 1,
    flexShrink: 0,
  }

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
    uvg_nbu_praemiensatz: '',
    uvg_lohnsumme_maenner_bu: '',
    uvg_lohnsumme_frauen_bu: '',
    uvg_lohnsumme_maenner_nbu: '',
    uvg_lohnsumme_frauen_nbu: '',
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
    haft_ahv_lohnsumme: '',
    haft_umsatz: '',
    haft_deklaration: 'Pauschal',
    haft_grunddeckung_garantiesumme: '',
    haft_grunddeckung_selbstbehalt: '',
    sach_inventar: '',
    sach_inventar_nicht_fix_freien: '',
    sach_inventar_fix_installationen: '',
    sach_inventar_elementar_spezial: '',
    sach_inventar_container: '',
    sach_mfz_gesamt: '',
    sach_mfz_bis_35t: '',
    sach_mfz_ueber_35t: '',
    sach_umsatz: '',
    kautionen_art: '',
    kautionen_empfaenger: '',
    kautionen_bemerkungen: '',
    ...MFZ_INITIAL_FIELDS,
  })

  const calculateFaelligkeit = (endDate) => {
    if (!endDate) return ''
    try {
      const date = new Date(endDate)
      const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1)
      const day = String(nextMonth.getDate()).padStart(2, '0')
      const month = String(nextMonth.getMonth() + 1).padStart(2, '0')
      return `${day}.${month}`
    } catch (e) { return '' }
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
        // KTG
        ktg_max_versicherter_lohn: police.ktg_max_versicherter_lohn ? formatSwissNumber(police.ktg_max_versicherter_lohn) : '300000.00',
        ktg_lohnsumme_maenner: police.ktg_lohnsumme_maenner ? formatSwissNumber(police.ktg_lohnsumme_maenner) : '',
        ktg_lohnsumme_frauen: police.ktg_lohnsumme_frauen ? formatSwissNumber(police.ktg_lohnsumme_frauen) : '',
        ktg_lohnsumme_mutterschaft_eo: police.ktg_lohnsumme_mutterschaft_eo ? formatSwissNumber(police.ktg_lohnsumme_mutterschaft_eo) : '',
        ktg_lohnsumme_mutterschaft_uebersteigend: police.ktg_lohnsumme_mutterschaft_uebersteigend ? formatSwissNumber(police.ktg_lohnsumme_mutterschaft_uebersteigend) : '',
        ktg_lohnsumme_vaterschaft: police.ktg_lohnsumme_vaterschaft ? formatSwissNumber(police.ktg_lohnsumme_vaterschaft) : '',
        // UVG
        uvg_lohnsumme_maenner_bu: police.uvg_lohnsumme_maenner_bu ? formatSwissNumber(police.uvg_lohnsumme_maenner_bu) : '',
        uvg_lohnsumme_frauen_bu: police.uvg_lohnsumme_frauen_bu ? formatSwissNumber(police.uvg_lohnsumme_frauen_bu) : '',
        uvg_lohnsumme_maenner_nbu: police.uvg_lohnsumme_maenner_nbu ? formatSwissNumber(police.uvg_lohnsumme_maenner_nbu) : '',
        uvg_lohnsumme_frauen_nbu: police.uvg_lohnsumme_frauen_nbu ? formatSwissNumber(police.uvg_lohnsumme_frauen_nbu) : '',
        // Haftpflicht
        haft_ahv_lohnsumme: police.haft_ahv_lohnsumme ? formatSwissNumber(police.haft_ahv_lohnsumme) : '',
        haft_umsatz: police.haft_umsatz ? formatSwissNumber(police.haft_umsatz) : '',
        haft_grunddeckung_garantiesumme: police.haft_grunddeckung_garantiesumme ? formatSwissNumber(police.haft_grunddeckung_garantiesumme) : '',
        haft_grunddeckung_selbstbehalt: police.haft_grunddeckung_selbstbehalt ? formatSwissNumber(police.haft_grunddeckung_selbstbehalt) : '',
        // Sach
        sach_inventar: police.sach_inventar ? formatSwissNumber(police.sach_inventar) : '',
        sach_inventar_nicht_fix_freien: police.sach_inventar_nicht_fix_freien ? formatSwissNumber(police.sach_inventar_nicht_fix_freien) : '',
        sach_inventar_fix_installationen: police.sach_inventar_fix_installationen ? formatSwissNumber(police.sach_inventar_fix_installationen) : '',
        sach_inventar_elementar_spezial: police.sach_inventar_elementar_spezial ? formatSwissNumber(police.sach_inventar_elementar_spezial) : '',
        sach_inventar_container: police.sach_inventar_container ? formatSwissNumber(police.sach_inventar_container) : '',
        sach_mfz_gesamt: police.sach_mfz_gesamt ? formatSwissNumber(police.sach_mfz_gesamt) : '',
        sach_mfz_bis_35t: police.sach_mfz_bis_35t ? formatSwissNumber(police.sach_mfz_bis_35t) : '',
        sach_mfz_ueber_35t: police.sach_mfz_ueber_35t ? formatSwissNumber(police.sach_mfz_ueber_35t) : '',
        sach_umsatz: police.sach_umsatz ? formatSwissNumber(police.sach_umsatz) : '',
        // MFZ Text/Datum
        mfz_kontrollschild: police.mfz_kontrollschild || '',
        mfz_kanton: police.mfz_kanton || '',
        mfz_stamm_nr: police.mfz_stamm_nr || '',
        mfz_erste_iv: police.mfz_erste_iv ? police.mfz_erste_iv.split('T')[0] : '',
        mfz_lenker_geburtsdatum: police.mfz_lenker_geburtsdatum ? police.mfz_lenker_geburtsdatum.split('T')[0] : '',
        mfz_lenker_fahrausweis: police.mfz_lenker_fahrausweis ? police.mfz_lenker_fahrausweis.split('T')[0] : '',
        // MFZ Beträge
        mfz_katalogpreis: police.mfz_katalogpreis ? formatSwissNumber(police.mfz_katalogpreis) : '',
        mfz_zubehoer: police.mfz_zubehoer ? formatSwissNumber(police.mfz_zubehoer) : '',
        mfz_fahrzeugwert: police.mfz_fahrzeugwert ? formatSwissNumber(police.mfz_fahrzeugwert) : '',
        mfz_leergewicht: police.mfz_leergewicht ? formatSwissNumber(police.mfz_leergewicht) : '',
        mfz_versicherungssumme: police.mfz_versicherungssumme ? formatSwissNumber(police.mfz_versicherungssumme) : '',
        mfz_sb_haft: police.mfz_sb_haft ? formatSwissNumber(police.mfz_sb_haft) : '',
        mfz_sb_kollision: police.mfz_sb_kollision ? formatSwissNumber(police.mfz_sb_kollision) : '',
        // MFZ Booleans
        mfz_grobfahrlaessigkeit: Boolean(police.mfz_grobfahrlaessigkeit),
        mfz_bonusschutz: Boolean(police.mfz_bonusschutz),
        mfz_kollision: Boolean(police.mfz_kollision),
        mfz_teilkasko: Boolean(police.mfz_teilkasko),
        mfz_tk_diebstahl: police.mfz_tk_diebstahl != null ? Boolean(police.mfz_tk_diebstahl) : true,
        mfz_tk_elementar: police.mfz_tk_elementar != null ? Boolean(police.mfz_tk_elementar) : true,
        mfz_tk_feuer: police.mfz_tk_feuer != null ? Boolean(police.mfz_tk_feuer) : true,
        mfz_tk_tier: police.mfz_tk_tier != null ? Boolean(police.mfz_tk_tier) : true,
        mfz_tk_vandalismus: police.mfz_tk_vandalismus != null ? Boolean(police.mfz_tk_vandalismus) : true,
        mfz_tk_marder: police.mfz_tk_marder != null ? Boolean(police.mfz_tk_marder) : true,
        mfz_tk_parkschaden: Boolean(police.mfz_tk_parkschaden),
        mfz_tk_mitgefuehrte_sachen: Boolean(police.mfz_tk_mitgefuehrte_sachen),
        mfz_tk_cyber: Boolean(police.mfz_tk_cyber),
        mfz_tk_felgen_reifen: Boolean(police.mfz_tk_felgen_reifen),
        mfz_tk_innenraum: Boolean(police.mfz_tk_innenraum),
        mfz_insassen: Boolean(police.mfz_insassen),
        mfz_insassen_heilungskosten: Boolean(police.mfz_insassen_heilungskosten),
        mfz_insassen_todesfall: Boolean(police.mfz_insassen_todesfall),
        mfz_insassen_invaliditaet: Boolean(police.mfz_insassen_invaliditaet),
        mfz_insassen_spitaltaggeld: Boolean(police.mfz_insassen_spitaltaggeld),
        mfz_insassen_taggeld: Boolean(police.mfz_insassen_taggeld),
        mfz_pannendienst: Boolean(police.mfz_pannendienst),
        mfz_ebatterie: Boolean(police.mfz_ebatterie),
        mfz_eladegeraet: Boolean(police.mfz_eladegeraet),
        mfz_gf_verzicht: Boolean(police.mfz_gf_verzicht),
        mfz_bs: Boolean(police.mfz_bs),
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
    } catch (error) { console.error('Error fetching sparten:', error) }
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
    } catch (error) { console.error('Error fetching versicherer:', error) }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    let finalValue = type === 'checkbox' ? checked : value

    if (name.includes('lohnsumme') ||
        name === 'ktg_max_versicherter_lohn' ||
        name === 'haft_ahv_lohnsumme' ||
        name === 'haft_umsatz' ||
        name === 'haft_grunddeckung_garantiesumme' ||
        name === 'haft_grunddeckung_selbstbehalt' ||
        name.startsWith('sach_') ||
        name === 'mfz_katalogpreis' ||
        name === 'mfz_zubehoer' ||
        name === 'mfz_leergewicht' ||
        name === 'mfz_versicherungssumme' ||
        name === 'mfz_sb_haft' ||
        name === 'mfz_sb_kollision') {
      finalValue = formatSwissNumber(value)
    }

    const newFormData = { ...formData, [name]: finalValue }

    if (name === 'ende' && value) {
      newFormData.faelligkeit = calculateFaelligkeit(value)
    }

    if (name === 'mfz_katalogpreis' || name === 'mfz_zubehoer') {
      const katalogRaw = name === 'mfz_katalogpreis' ? value : (formData.mfz_katalogpreis || '0')
      const zubehoerRaw = name === 'mfz_zubehoer' ? value : (formData.mfz_zubehoer || '0')
      const katalog = parseFloat(katalogRaw.toString().replace(/'/g, '')) || 0
      const zubehoer = parseFloat(zubehoerRaw.toString().replace(/'/g, '')) || 0
      newFormData.mfz_fahrzeugwert = formatSwissNumber((katalog + zubehoer).toFixed(2))
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

      const cleanNumber = (val) => {
        if (!val || val === '' || val === '-') return null
        const cleaned = val.toString().replace(/'/g, '')
        const num = parseFloat(cleaned)
        return isNaN(num) ? null : num
      }
      const cleanString = (val) => {
        if (!val || val === '' || val === '-') return null
        return val
      }
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
        bemerkungen: formData.bemerkungen || null,
        uvg_risiko_nr: cleanString(formData.uvg_risiko_nr),
        uvg_art_betrieb: cleanString(formData.uvg_art_betrieb),
        uvg_bu_gefahrenklasse: cleanString(formData.uvg_bu_gefahrenklasse),
        uvg_bu_gefahrenstufe: cleanString(formData.uvg_bu_gefahrenstufe),
        uvg_bu_praemiensatz: cleanPercentage(formData.uvg_bu_praemiensatz),
        uvg_nbu_gefahrenklasse: cleanString(formData.uvg_nbu_gefahrenklasse),
        uvg_nbu_unterklasse: cleanString(formData.uvg_nbu_unterklasse),
        uvg_nbu_praemiensatz: cleanPercentage(formData.uvg_nbu_praemiensatz),
        uvg_lohnsumme_maenner_bu: cleanNumber(formData.uvg_lohnsumme_maenner_bu),
        uvg_lohnsumme_frauen_bu: cleanNumber(formData.uvg_lohnsumme_frauen_bu),
        uvg_lohnsumme_maenner_nbu: cleanNumber(formData.uvg_lohnsumme_maenner_nbu),
        uvg_lohnsumme_frauen_nbu: cleanNumber(formData.uvg_lohnsumme_frauen_nbu),
        ktg_mutterschaftstaggeld: cleanString(formData.ktg_mutterschaftstaggeld),
        ktg_vaterschaftstaggeld: cleanString(formData.ktg_vaterschaftstaggeld),
        ktg_praemiensatz_maenner: cleanPercentage(formData.ktg_praemiensatz_maenner),
        ktg_praemiensatz_frauen: cleanPercentage(formData.ktg_praemiensatz_frauen),
        ktg_lohnnachgenuss: null,
        ktg_familienzulagen: null,
        ktg_max_versicherter_lohn: cleanNumber(formData.ktg_max_versicherter_lohn),
        ktg_lohnsumme_maenner: cleanNumber(formData.ktg_lohnsumme_maenner),
        ktg_lohnsumme_frauen: cleanNumber(formData.ktg_lohnsumme_frauen),
        ktg_lohnsumme_mutterschaft_eo: cleanNumber(formData.ktg_lohnsumme_mutterschaft_eo),
        ktg_lohnsumme_mutterschaft_uebersteigend: cleanNumber(formData.ktg_lohnsumme_mutterschaft_uebersteigend),
        ktg_lohnsumme_vaterschaft: cleanNumber(formData.ktg_lohnsumme_vaterschaft),
        haft_ahv_lohnsumme: cleanNumber(formData.haft_ahv_lohnsumme),
        haft_umsatz: cleanNumber(formData.haft_umsatz),
        haft_deklaration: cleanString(formData.haft_deklaration),
        haft_grunddeckung_garantiesumme: cleanNumber(formData.haft_grunddeckung_garantiesumme),
        haft_grunddeckung_selbstbehalt: cleanNumber(formData.haft_grunddeckung_selbstbehalt),
        sach_inventar: cleanNumber(formData.sach_inventar),
        sach_inventar_nicht_fix_freien: cleanNumber(formData.sach_inventar_nicht_fix_freien),
        sach_inventar_fix_installationen: cleanNumber(formData.sach_inventar_fix_installationen),
        sach_inventar_elementar_spezial: cleanNumber(formData.sach_inventar_elementar_spezial),
        sach_inventar_container: cleanNumber(formData.sach_inventar_container),
        sach_mfz_gesamt: cleanNumber(formData.sach_mfz_gesamt),
        sach_mfz_bis_35t: cleanNumber(formData.sach_mfz_bis_35t),
        sach_mfz_ueber_35t: cleanNumber(formData.sach_mfz_ueber_35t),
        sach_umsatz: cleanNumber(formData.sach_umsatz),
        kautionen_art: cleanString(formData.kautionen_art),
        kautionen_empfaenger: cleanString(formData.kautionen_empfaenger),
        kautionen_bemerkungen: cleanString(formData.kautionen_bemerkungen),
        // MFZ
        mfz_fahrzeugart: cleanString(formData.mfz_fahrzeugart),
        mfz_marke: cleanString(formData.mfz_marke),
        mfz_typ: cleanString(formData.mfz_typ),
        mfz_kontrollschild: cleanString(formData.mfz_kontrollschild),
        mfz_kanton: cleanString(formData.mfz_kanton),
        mfz_stamm_nr: cleanString(formData.mfz_stamm_nr),
        mfz_erste_iv: formData.mfz_erste_iv || null,
        mfz_katalogpreis: cleanNumber(formData.mfz_katalogpreis),
        mfz_zubehoer: cleanNumber(formData.mfz_zubehoer),
        mfz_fahrzeugwert: cleanNumber(formData.mfz_fahrzeugwert),
        mfz_treibstoffart: cleanString(formData.mfz_treibstoffart),
        mfz_verwendung: cleanString(formData.mfz_verwendung),
        mfz_hubraum: formData.mfz_hubraum ? parseInt(formData.mfz_hubraum) : null,
        mfz_ps: formData.mfz_ps ? parseInt(formData.mfz_ps) : null,
        mfz_leergewicht: cleanNumber(formData.mfz_leergewicht),
        mfz_leasing: cleanString(formData.mfz_leasing),
        mfz_leasinggeber: cleanString(formData.mfz_leasinggeber),
        mfz_lenker_typ: cleanString(formData.mfz_lenker_typ),
        mfz_lenker_vorname: cleanString(formData.mfz_lenker_vorname),
        mfz_lenker_name: cleanString(formData.mfz_lenker_name),
        mfz_lenker_geburtsdatum: formData.mfz_lenker_geburtsdatum || null,
        mfz_lenker_fahrausweis: formData.mfz_lenker_fahrausweis || null,
        mfz_versicherungssumme: cleanNumber(formData.mfz_versicherungssumme),
        mfz_sb_haft: cleanNumber(formData.mfz_sb_haft),
        mfz_grobfahrlaessigkeit: Boolean(formData.mfz_grobfahrlaessigkeit),
        mfz_bonusschutz: Boolean(formData.mfz_bonusschutz),
        mfz_kollision: Boolean(formData.mfz_kollision),
        mfz_sb_kollision: cleanNumber(formData.mfz_sb_kollision),
        mfz_teilkasko: Boolean(formData.mfz_teilkasko),
        mfz_tk_diebstahl: Boolean(formData.mfz_tk_diebstahl),
        mfz_tk_elementar: Boolean(formData.mfz_tk_elementar),
        mfz_tk_feuer: Boolean(formData.mfz_tk_feuer),
        mfz_tk_tier: Boolean(formData.mfz_tk_tier),
        mfz_tk_glas: cleanString(formData.mfz_tk_glas),
        mfz_tk_vandalismus: Boolean(formData.mfz_tk_vandalismus),
        mfz_tk_marder: Boolean(formData.mfz_tk_marder),
        mfz_tk_parkschaden: Boolean(formData.mfz_tk_parkschaden),
        mfz_tk_parkschaden_text: cleanString(formData.mfz_tk_parkschaden_text),
        mfz_tk_mitgefuehrte_sachen: Boolean(formData.mfz_tk_mitgefuehrte_sachen),
        mfz_tk_mitgefuehrte_sachen_text: cleanString(formData.mfz_tk_mitgefuehrte_sachen_text),
        mfz_tk_cyber: Boolean(formData.mfz_tk_cyber),
        mfz_tk_cyber_text: cleanString(formData.mfz_tk_cyber_text),
        mfz_tk_felgen_reifen: Boolean(formData.mfz_tk_felgen_reifen),
        mfz_tk_felgen_reifen_text: cleanString(formData.mfz_tk_felgen_reifen_text),
        mfz_tk_innenraum: Boolean(formData.mfz_tk_innenraum),
        mfz_tk_innenraum_text: cleanString(formData.mfz_tk_innenraum_text),
        mfz_insassen: Boolean(formData.mfz_insassen),
        mfz_insassen_text: cleanString(formData.mfz_insassen_text),
        mfz_insassen_heilungskosten: Boolean(formData.mfz_insassen_heilungskosten),
        mfz_insassen_todesfall: Boolean(formData.mfz_insassen_todesfall),
        mfz_insassen_todesfall_text: cleanString(formData.mfz_insassen_todesfall_text),
        mfz_insassen_invaliditaet: Boolean(formData.mfz_insassen_invaliditaet),
        mfz_insassen_invaliditaet_text: cleanString(formData.mfz_insassen_invaliditaet_text),
        mfz_insassen_spitaltaggeld: Boolean(formData.mfz_insassen_spitaltaggeld),
        mfz_insassen_spitaltaggeld_text: cleanString(formData.mfz_insassen_spitaltaggeld_text),
        mfz_insassen_taggeld: Boolean(formData.mfz_insassen_taggeld),
        mfz_insassen_taggeld_text: cleanString(formData.mfz_insassen_taggeld_text),
        mfz_pannendienst: Boolean(formData.mfz_pannendienst),
        mfz_pannendienst_text: cleanString(formData.mfz_pannendienst_text),
        mfz_ebatterie: Boolean(formData.mfz_ebatterie),
        mfz_ebatterie_text: cleanString(formData.mfz_ebatterie_text),
        mfz_eladegeraet: Boolean(formData.mfz_eladegeraet),
        mfz_eladegeraet_text: cleanString(formData.mfz_eladegeraet_text),
        mfz_gf_verzicht: Boolean(formData.mfz_grobfahrlaessigkeit),
        mfz_bs: Boolean(formData.mfz_bonusschutz),
      }

      const response = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
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
  const isSach = parseInt(formData.sparte_id) === 8
  const isHaft = parseInt(formData.sparte_id) === 9
  const isKautionen = parseInt(formData.sparte_id) === 10
  const isMFZ = sparten.some(s =>
    s.id === parseInt(formData.sparte_id) &&
    (s.name?.toLowerCase().includes('motorfahrzeug') || s.name?.toLowerCase().includes('mfz'))
  )

  const total = parseCHF(formData.praemie_chf || '0') + parseCHF(formData.gebuehren || '0')

  // Hilfsstyle für MFZ Checkbox-Zeilen mit optionalem Text
  const mfzCbRow = (nameCheck, nameText, label) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', padding: '4px 0' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 180, cursor: isEditMode ? 'pointer' : 'default', fontSize: 13 }}>
        <input type="checkbox" name={nameCheck} checked={formData[nameCheck]} onChange={handleInputChange} disabled={!isEditMode} />
        {label}
      </label>
      {nameText && formData[nameCheck] && (
        <input type="text" name={nameText} value={formData[nameText] || ''} onChange={handleInputChange} disabled={!isEditMode} placeholder="Bemerkung..." style={{ flex: 1, minWidth: 150, padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 12 }} />
      )}
    </div>
  )

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
              <button className="button-edit" onClick={() => setIsEditMode(true)}>✏️ Bearbeiten</button>
            )}
            {isEditMode && (
              <button className="button-edit" onClick={() => setIsEditMode(false)} style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
                ✕ Abbrechen
              </button>
            )}
            <button className="close-button" onClick={onClose}>✕</button>
          </div>
        </div>

        {error && <div style={{ background: '#fecaca', padding: '1rem', marginBottom: '1rem', borderRadius: '4px', color: '#7f1d1d' }}>{error}</div>}

        {/* 2-CONTAINER LAYOUT */}
        <div className="modal-content-2container">
          <div className="container-left">

            {/* SPARTE & VERSICHERER */}
            <div className="form-grid-3col">
              <div className="form-group">
                <label>Sparte</label>
                <select name="sparte_id" value={formData.sparte_id} onChange={handleInputChange} disabled={!isEditMode}>
                  <option value="">-- Wählen --</option>
                  {sparten.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-group span-3">
                <label>Versicherer</label>
                <select name="versicherer_id" value={formData.versicherer_id} onChange={handleInputChange} disabled={!isEditMode}>
                  <option value="">-- Wählen --</option>
                  {versicherer.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
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
              <textarea name="bemerkungen" value={formData.bemerkungen || ''} onChange={handleInputChange} rows="3" placeholder="Weitere Bemerkungen..." disabled={!isEditMode} />
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
                    <input type="text" name="uvg_bu_gefahrenklasse" value={formData.uvg_bu_gefahrenklasse} onChange={handleInputChange} disabled={!isEditMode} />
                  </div>
                  <div className="form-group">
                    <label>Gefahrenstufe</label>
                    <input type="text" name="uvg_bu_gefahrenstufe" value={formData.uvg_bu_gefahrenstufe} onChange={handleInputChange} disabled={!isEditMode} />
                  </div>
                  <div className="form-group">
                    <label>Prämiensatz %</label>
                    <input type="text" name="uvg_bu_praemiensatz" value={formData.uvg_bu_praemiensatz} onChange={handleInputChange} disabled={!isEditMode} />
                  </div>
                  <div className="form-group">
                    <label>Lohnsumme Männer BU</label>
                    <input type="text" name="uvg_lohnsumme_maenner_bu" value={formData.uvg_lohnsumme_maenner_bu || ''} onChange={handleInputChange} disabled={!isEditMode} />
                  </div>
                  <div className="form-group">
                    <label>Lohnsumme Frauen BU</label>
                    <input type="text" name="uvg_lohnsumme_frauen_bu" value={formData.uvg_lohnsumme_frauen_bu || ''} onChange={handleInputChange} disabled={!isEditMode} />
                  </div>
                </div>
                <div className="form-grid-3col span-3">
                  <h4 style={{ gridColumn: '1 / -1' }}>✓ UVG-Betrieb Nichterwerbstätige</h4>
                  <div className="form-group">
                    <label>Gefahrenklasse</label>
                    <input type="text" name="uvg_nbu_gefahrenklasse" value={formData.uvg_nbu_gefahrenklasse} onChange={handleInputChange} disabled={!isEditMode} />
                  </div>
                  <div className="form-group">
                    <label>Unterklasse</label>
                    <input type="text" name="uvg_nbu_unterklasse" value={formData.uvg_nbu_unterklasse} onChange={handleInputChange} disabled={!isEditMode} />
                  </div>
                  <div className="form-group">
                    <label>Prämiensatz %</label>
                    <input type="text" name="uvg_nbu_praemiensatz" value={formData.uvg_nbu_praemiensatz} onChange={handleInputChange} disabled={!isEditMode} />
                  </div>
                  <div className="form-group">
                    <label>Lohnsumme Männer NBU</label>
                    <input type="text" name="uvg_lohnsumme_maenner_nbu" value={formData.uvg_lohnsumme_maenner_nbu || ''} onChange={handleInputChange} disabled={!isEditMode} />
                  </div>
                  <div className="form-group">
                    <label>Lohnsumme Frauen NBU</label>
                    <input type="text" name="uvg_lohnsumme_frauen_nbu" value={formData.uvg_lohnsumme_frauen_nbu || ''} onChange={handleInputChange} disabled={!isEditMode} />
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
                    <input type="text" name="ktg_max_versicherter_lohn" value={formData.ktg_max_versicherter_lohn || ''} onChange={handleInputChange} disabled={!isEditMode} />
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
                <div className="form-grid-2col span-3">
                  <h4 style={{ gridColumn: '1 / -1' }}>✓ KTG-Zusatzleistungen</h4>
                  <div className="form-group">
                    <label>Mutterschaftstaggeld</label>
                    <input type="text" name="ktg_mutterschaftstaggeld" value={formData.ktg_mutterschaftstaggeld || ''} onChange={handleInputChange} disabled={!isEditMode} />
                  </div>
                  <div className="form-group">
                    <label>Vaterschaftstaggeld</label>
                    <input type="text" name="ktg_vaterschaftstaggeld" value={formData.ktg_vaterschaftstaggeld || ''} onChange={handleInputChange} disabled={!isEditMode} />
                  </div>
                </div>
                <div className="form-grid-2col span-3">
                  <h4 style={{ gridColumn: '1 / -1' }}>✓ KTG-Prämiensätze & Lohnsummen</h4>
                  <div className="form-group">
                    <label>Prämiensatz Männer %</label>
                    <input type="text" name="ktg_praemiensatz_maenner" value={formData.ktg_praemiensatz_maenner || ''} onChange={handleInputChange} disabled={!isEditMode} />
                  </div>
                  <div className="form-group">
                    <label>Prämiensatz Frauen %</label>
                    <input type="text" name="ktg_praemiensatz_frauen" value={formData.ktg_praemiensatz_frauen || ''} onChange={handleInputChange} disabled={!isEditMode} />
                  </div>
                  <div className="form-group">
                    <label>Lohnsumme Männer CHF</label>
                    <input type="text" name="ktg_lohnsumme_maenner" value={formData.ktg_lohnsumme_maenner || ''} onChange={handleInputChange} disabled={!isEditMode} />
                  </div>
                  <div className="form-group">
                    <label>Lohnsumme Frauen CHF</label>
                    <input type="text" name="ktg_lohnsumme_frauen" value={formData.ktg_lohnsumme_frauen || ''} onChange={handleInputChange} disabled={!isEditMode} />
                  </div>
                  <div className="form-group">
                    <label>Lohnsumme Mutterschaft EO CHF</label>
                    <input type="text" name="ktg_lohnsumme_mutterschaft_eo" value={formData.ktg_lohnsumme_mutterschaft_eo || ''} onChange={handleInputChange} disabled={!isEditMode} />
                  </div>
                  <div className="form-group">
                    <label>Lohnsumme Mutterschaft übersteigend CHF</label>
                    <input type="text" name="ktg_lohnsumme_mutterschaft_uebersteigend" value={formData.ktg_lohnsumme_mutterschaft_uebersteigend || ''} onChange={handleInputChange} disabled={!isEditMode} />
                  </div>
                  <div className="form-group">
                    <label>Lohnsumme Vaterschaft CHF</label>
                    <input type="text" name="ktg_lohnsumme_vaterschaft" value={formData.ktg_lohnsumme_vaterschaft || ''} onChange={handleInputChange} disabled={!isEditMode} />
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
                    <input type="text" name="haft_ahv_lohnsumme" value={formData.haft_ahv_lohnsumme || ''} onChange={handleInputChange} disabled={!isEditMode} />
                  </div>
                  <div className="form-group">
                    <label>Umsatz CHF</label>
                    <input type="text" name="haft_umsatz" value={formData.haft_umsatz || ''} onChange={handleInputChange} disabled={!isEditMode} />
                  </div>
                  <div className="form-group">
                    <label>Deklaration</label>
                    <select name="haft_deklaration" value={formData.haft_deklaration || 'Pauschal'} onChange={handleInputChange} disabled={!isEditMode}>
                      <option value="Pauschal">Pauschal</option>
                      <option value="jährlich">jährlich</option>
                    </select>
                  </div>
                </div>
                <div className="form-grid-3col span-3">
                  <h4 style={{ gridColumn: '1 / -1' }}>✓ Grunddeckung</h4>
                  <div className="form-group">
                    <label>Garantiesumme CHF</label>
                    <input type="text" name="haft_grunddeckung_garantiesumme" value={formData.haft_grunddeckung_garantiesumme || ''} onChange={handleInputChange} disabled={!isEditMode} />
                  </div>
                  <div className="form-group">
                    <label>Selbstbehalt CHF</label>
                    <input type="text" name="haft_grunddeckung_selbstbehalt" value={formData.haft_grunddeckung_selbstbehalt || ''} onChange={handleInputChange} disabled={!isEditMode} />
                  </div>
                </div>
                <div className="span-3">
                  <ZusatzdeckungenManager policeId={police?.id} versichererId={formData.versicherer_id} sparteId={formData.sparte_id} isEditMode={isEditMode} />
                </div>
              </>
            )}

            {/* SACH SECTION */}
            {isSach && (
              <>
                <VersicherungsummenSection formData={formData} setFormData={setFormData} isEditMode={isEditMode} />
                <VersicherungsorteManager policeId={formData.id} isEditMode={isEditMode} />
                <GrundversicherungManager policeId={formData.id} inventar={formData.sach_inventar} mfzGesamt={formData.sach_mfz_gesamt} isEditMode={isEditMode} />
                <BetriebsunterbruchManager policeId={formData.id} umsatz={formData.sach_umsatz} isEditMode={isEditMode} />
                <div className="span-3">
                  <ZusatzdeckungenManager policeId={formData.id} versichererId={formData.versicherer_id} sparteId={formData.sparte_id} isEditMode={isEditMode} />
                </div>
                <div className="span-3" style={{ marginTop: '2rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid #e5e7eb' }}>📋 Vertragsklauseln</h4>
                  <KlauselnTab policeId={formData.id} isEditMode={isEditMode} />
                </div>
              </>
            )}

            {/* KAUTIONEN SECTION */}
            {isKautionen && (
              <>
                <h4 style={{ gridColumn: '1 / -1', marginTop: '2rem' }}>🏛️ Kautionen</h4>
                <div className="form-group">
                  <label>Kautionsart:</label>
                  <select name="kautionen_art" value={formData.kautionen_art || ''} onChange={handleInputChange} disabled={!isEditMode} style={{ width: '100%', padding: '8px' }}>
                    <option value="">Bitte wählen...</option>
                    <option value="Baugarantie">Baugarantie</option>
                    <option value="Mietkaution">Mietkaution</option>
                    <option value="Andere">Andere</option>
                  </select>
                </div>
                <div className="form-group span-2">
                  <label>Empfänger:</label>
                  <textarea name="kautionen_empfaenger" value={formData.kautionen_empfaenger || ''} onChange={handleInputChange} disabled={!isEditMode} rows={4} style={{ width: '100%', padding: '8px', fontFamily: 'inherit', resize: 'vertical' }} />
                </div>
                <div className="form-group span-3">
                  <label>Bemerkungen:</label>
                  <textarea name="kautionen_bemerkungen" value={formData.kautionen_bemerkungen || ''} onChange={handleInputChange} disabled={!isEditMode} rows={6} style={{ width: '100%', padding: '8px', fontFamily: 'inherit', resize: 'vertical' }} />
                </div>
                <div className="span-3" style={{ marginTop: '2rem' }}>
                  <ZusatzdeckungenManager policeId={formData.id} versichererId={formData.versicherer_id} sparteId={formData.sparte_id} isEditMode={isEditMode} />
                </div>
                <div className="span-3" style={{ marginTop: '2rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid #e5e7eb' }}>📋 Vertragsklauseln</h4>
                  <KlauselnTab policeId={formData.id} isEditMode={isEditMode} />
                </div>
              </>
            )}

                        {/* MFZ SECTION */}
            {isMFZ && (
              <>
                {/* 1. Fahrzeugdaten */}
                <div className="form-grid-3col span-3">
                  <h4 style={{ gridColumn: '1 / -1' }}>🚗 Fahrzeugdaten</h4>
                  <div className="form-group">
                    <label>Fahrzeugart</label>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <select name="mfz_fahrzeugart" value={formData.mfz_fahrzeugart || ''} onChange={handleInputChange} disabled={!isEditMode} style={{ flex: 1 }}>
                        <option value="">-- Wählen --</option>
                        {mfzFahrzeugart.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                      {isEditMode && <button type="button" style={btnPlusStyle} onClick={() => addMfzOption(setMfzFahrzeugart, mfzFahrzeugart)}>＋</button>}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Marke</label>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <select name="mfz_marke" value={formData.mfz_marke || ''} onChange={handleInputChange} disabled={!isEditMode} style={{ flex: 1 }}>
                        <option value="">-- Wählen --</option>
                        {mfzMarken.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                      {isEditMode && <button type="button" style={btnPlusStyle} onClick={() => addMfzOption(setMfzMarken, mfzMarken)}>＋</button>}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Typ / Modell</label>
                    <input type="text" name="mfz_typ" value={formData.mfz_typ || ''} onChange={handleInputChange} disabled={!isEditMode} placeholder="z.B. Tucson 1.6 T-GDI" />
                  </div>
                  <div className="form-group">
                    <label>Kanton</label>
                    <select name="mfz_kanton" value={formData.mfz_kanton || ''} onChange={handleInputChange} disabled={!isEditMode}>
                      <option value="">-- Wählen --</option>
                      {MFZ_KANTONE.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Kontrollschild</label>
                    <input type="text" name="mfz_kontrollschild" value={formData.mfz_kontrollschild || ''} onChange={handleInputChange} disabled={!isEditMode} placeholder="z.B. LU 281025" />
                  </div>
                  <div className="form-group">
                    <label>Stamm-Nr.</label>
                    <input type="text" name="mfz_stamm_nr" value={formData.mfz_stamm_nr || ''} onChange={handleInputChange} disabled={!isEditMode} placeholder="z.B. 12345" />
                  </div>
                  <div className="form-group">
                    <label>Erste Inverkehrsetzung</label>
                    <input type="date" name="mfz_erste_iv" value={formData.mfz_erste_iv || ''} onChange={handleInputChange} disabled={!isEditMode} />
                  </div>
                </div>

                {/* 2. Technische Daten */}
                <div className="form-grid-3col span-3">
                  <h4 style={{ gridColumn: '1 / -1' }}>⚙️ Technische Daten</h4>
                  <div className="form-group">
                    <label>Treibstoffart</label>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <select name="mfz_treibstoffart" value={formData.mfz_treibstoffart || ''} onChange={handleInputChange} disabled={!isEditMode} style={{ flex: 1 }}>
                        <option value="">-- Wählen --</option>
                        {mfzTreibstoffart.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      {isEditMode && <button type="button" style={btnPlusStyle} onClick={() => addMfzOption(setMfzTreibstoffart, mfzTreibstoffart)}>＋</button>}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Verwendung</label>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <select name="mfz_verwendung" value={formData.mfz_verwendung || ''} onChange={handleInputChange} disabled={!isEditMode} style={{ flex: 1 }}>
                        <option value="">-- Wählen --</option>
                        {mfzVerwendung.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                      {isEditMode && <button type="button" style={btnPlusStyle} onClick={() => addMfzOption(setMfzVerwendung, mfzVerwendung)}>＋</button>}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Hubraum (cc)</label>
                    <input type="number" name="mfz_hubraum" value={formData.mfz_hubraum || ''} onChange={handleInputChange} disabled={!isEditMode} placeholder="z.B. 1600" min="0" />
                  </div>
                  <div className="form-group">
                    <label>Leistung (PS)</label>
                    <input type="number" name="mfz_ps" value={formData.mfz_ps || ''} onChange={handleInputChange} disabled={!isEditMode} placeholder="z.B. 150" min="0" />
                  </div>
                  <div className="form-group">
                    <label>Leergewicht (kg)</label>
                    <input type="text" name="mfz_leergewicht" value={formData.mfz_leergewicht || ''} onChange={handleInputChange} disabled={!isEditMode} placeholder="z.B. 1'650" />
                  </div>
                </div>

                {/* 3. Fahrzeugwert */}
                <div className="form-grid-3col span-3">
                  <h4 style={{ gridColumn: '1 / -1' }}>💰 Fahrzeugwert</h4>
                  <div className="form-group">
                    <label>Katalogpreis CHF</label>
                    <input type="text" name="mfz_katalogpreis" value={formData.mfz_katalogpreis || ''} onChange={handleInputChange} disabled={!isEditMode} placeholder="z.B. 45'000.00" />
                  </div>
                  <div className="form-group">
                    <label>Zubehör CHF</label>
                    <input type="text" name="mfz_zubehoer" value={formData.mfz_zubehoer || ''} onChange={handleInputChange} disabled={!isEditMode} placeholder="z.B. 2'500.00" />
                  </div>
                  <div className="form-group">
                    <label>Fahrzeugwert CHF (auto)</label>
                    <input type="text" value={formData.mfz_fahrzeugwert || ''} readOnly style={{ background: '#f0f9ff', color: '#0369a1', fontWeight: 600 }} />
                  </div>
                </div>

                {/* 4. Leasing */}
                <div className="form-grid-3col span-3">
                  <h4 style={{ gridColumn: '1 / -1' }}>📄 Leasing</h4>
                  <div className="form-group">
                    <label>Leasing</label>
                    <select name="mfz_leasing" value={formData.mfz_leasing || 'Nein'} onChange={handleInputChange} disabled={!isEditMode}>
                      <option value="Nein">Nein</option>
                      <option value="Ja">Ja</option>
                    </select>
                  </div>
                  {formData.mfz_leasing === 'Ja' && (
                    <div className="form-group">
                      <label>Leasinggeber</label>
                      <input type="text" name="mfz_leasinggeber" value={formData.mfz_leasinggeber || ''} onChange={handleInputChange} disabled={!isEditMode} placeholder="z.B. AMAG Leasing AG" />
                    </div>
                  )}
                </div>

                {/* 5. Lenker */}
                <div className="form-grid-3col span-3">
                  <h4 style={{ gridColumn: '1 / -1' }}>👤 Lenker</h4>
                  <div className="form-group">
                    <label>Lenker-Typ</label>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <select name="mfz_lenker_typ" value={formData.mfz_lenker_typ || ''} onChange={handleInputChange} disabled={!isEditMode} style={{ flex: 1 }}>
                        <option value="">-- Wählen --</option>
                        {mfzLenkerTyp.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      {isEditMode && <button type="button" style={btnPlusStyle} onClick={() => addMfzOption(setMfzLenkerTyp, mfzLenkerTyp)}>＋</button>}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Vorname</label>
                    <input type="text" name="mfz_lenker_vorname" value={formData.mfz_lenker_vorname || ''} onChange={handleInputChange} disabled={!isEditMode} />
                  </div>
                  <div className="form-group">
                    <label>Nachname</label>
                    <input type="text" name="mfz_lenker_name" value={formData.mfz_lenker_name || ''} onChange={handleInputChange} disabled={!isEditMode} />
                  </div>
                  <div className="form-group">
                    <label>Geburtsdatum</label>
                    <input type="date" name="mfz_lenker_geburtsdatum" value={formData.mfz_lenker_geburtsdatum || ''} onChange={handleInputChange} disabled={!isEditMode} />
                  </div>
                  <div className="form-group">
                    <label>Fahrausweis seit</label>
                    <input type="date" name="mfz_lenker_fahrausweis" value={formData.mfz_lenker_fahrausweis || ''} onChange={handleInputChange} disabled={!isEditMode} />
                  </div>
                </div>

                                {/* 6. Haftpflicht */}
                <div className="form-grid-3col span-3">
                  <h4 style={{ gridColumn: '1 / -1' }}>🛡️ Haftpflicht</h4>
                  <div className="form-group">
                    <label>Versicherungssumme CHF</label>
                    <input type="text" name="mfz_versicherungssumme" value={formData.mfz_versicherungssumme || ''} onChange={handleInputChange} disabled={!isEditMode} placeholder="z.B. 100'000'000.00" />
                  </div>
                  <div className="form-group">
                    <label>Selbstbehalt CHF</label>
                    <input type="text" name="mfz_sb_haft" value={formData.mfz_sb_haft || ''} onChange={handleInputChange} disabled={!isEditMode} placeholder="z.B. 0.00" />
                  </div>
                  <div className="form-group" style={{ display: 'flex', gap: 20, alignItems: 'center', paddingTop: 20 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: isEditMode ? 'pointer' : 'default', fontSize: 13 }}>
                      <input type="checkbox" name="mfz_grobfahrlaessigkeit" checked={formData.mfz_grobfahrlaessigkeit} onChange={handleInputChange} disabled={!isEditMode} />
                      GF-Verzicht
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: isEditMode ? 'pointer' : 'default', fontSize: 13 }}>
                      <input type="checkbox" name="mfz_bonusschutz" checked={formData.mfz_bonusschutz} onChange={handleInputChange} disabled={!isEditMode} />
                      BS
                    </label>
                  </div>
                </div>

                {/* 7. Kollision */}
                <div className="form-grid-3col span-3">
                  <h4 style={{ gridColumn: '1 / -1' }}>💥 Kollision</h4>
                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 16, paddingTop: 4 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: isEditMode ? 'pointer' : 'default', fontSize: 13 }}>
                      <input type="checkbox" name="mfz_kollision" checked={formData.mfz_kollision} onChange={handleInputChange} disabled={!isEditMode} />
                      ✓
                    </label>
                  </div>
                  {formData.mfz_kollision && (
                    <div className="form-group">
                      <label>Selbstbehalt CHF</label>
                      <input type="text" name="mfz_sb_kollision" value={formData.mfz_sb_kollision || ''} onChange={handleInputChange} disabled={!isEditMode} placeholder="z.B. 1'000.00" />
                    </div>
                  )}
                </div>

                {/* 8. Teilkasko */}
                <div className="form-grid-3col span-3">
                  <h4 style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: isEditMode ? 'pointer' : 'default', fontWeight: 700 }}>
                      <input type="checkbox" name="mfz_teilkasko" checked={formData.mfz_teilkasko} onChange={handleInputChange} disabled={!isEditMode} />
                      🔒 Teilkasko
                    </label>
                  </h4>
                  {formData.mfz_teilkasko && (
                    <div style={{ gridColumn: '1 / -1', background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 6, padding: 14 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px 16px' }}>
                        {[
                          ['mfz_tk_diebstahl', null, 'Diebstahl'],
                          ['mfz_tk_elementar', null, 'Elementar'],
                          ['mfz_tk_feuer', null, 'Feuer'],
                          ['mfz_tk_tier', null, 'Tierbiss'],
                          ['mfz_tk_vandalismus', null, 'Vandalismus'],
                          ['mfz_tk_marder', null, 'Marder'],
                        ].map(([name, , label]) => (
                          <label key={name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: isEditMode ? 'pointer' : 'default' }}>
                            <input type="checkbox" name={name} checked={formData[name]} onChange={handleInputChange} disabled={!isEditMode} />
                            {label}
                          </label>
                        ))}
                      </div>
                      <div style={{ marginTop: 8 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Glas</label>
                        <select name="mfz_tk_glas" value={formData.mfz_tk_glas || 'Standard'} onChange={handleInputChange} disabled={!isEditMode} style={{ padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13 }}>
                          <option value="Standard">Standard</option>
                          <option value="Erweitert">Erweitert</option>
                          <option value="Ausgeschlossen">Ausgeschlossen</option>
                        </select>
                      </div>
                      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {mfzCbRow('mfz_tk_parkschaden', 'mfz_tk_parkschaden_text', 'Parkschaden')}
                        {mfzCbRow('mfz_tk_mitgefuehrte_sachen', 'mfz_tk_mitgefuehrte_sachen_text', 'Mitgeführte Sachen')}
                        {mfzCbRow('mfz_tk_cyber', 'mfz_tk_cyber_text', 'Cyber')}
                        {mfzCbRow('mfz_tk_felgen_reifen', 'mfz_tk_felgen_reifen_text', 'Felgen & Reifen')}
                        {mfzCbRow('mfz_tk_innenraum', 'mfz_tk_innenraum_text', 'Innenraum')}
                      </div>
                    </div>
                  )}
                </div>

                {/* 9. Insassen */}
                <div className="form-grid-3col span-3">
                  <h4 style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: isEditMode ? 'pointer' : 'default', fontWeight: 700 }}>
                      <input type="checkbox" name="mfz_insassen" checked={formData.mfz_insassen} onChange={handleInputChange} disabled={!isEditMode} />
                      👥 Insassen
                    </label>
                  </h4>
                  {formData.mfz_insassen && (
                    <div style={{ gridColumn: '1 / -1', background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 6, padding: 14 }}>
                      <div style={{ marginBottom: 8 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Beschreibung</label>
                        <input type="text" name="mfz_insassen_text" value={formData.mfz_insassen_text || ''} onChange={handleInputChange} disabled={!isEditMode} placeholder="z.B. CHF 100'000 pro Person" style={{ width: '100%', padding: '5px 8px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13 }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {mfzCbRow('mfz_insassen_heilungskosten', null, 'Heilungskosten')}
                        {mfzCbRow('mfz_insassen_todesfall', 'mfz_insassen_todesfall_text', 'Todesfall')}
                        {mfzCbRow('mfz_insassen_invaliditaet', 'mfz_insassen_invaliditaet_text', 'Invalidität')}
                        {mfzCbRow('mfz_insassen_spitaltaggeld', 'mfz_insassen_spitaltaggeld_text', 'Spitaltaggeld')}
                        {mfzCbRow('mfz_insassen_taggeld', 'mfz_insassen_taggeld_text', 'Taggeld')}
                      </div>
                    </div>
                  )}
                </div>

                {/* 10. Weitere Deckungen */}
                <div className="form-grid-3col span-3">
                  <h4 style={{ gridColumn: '1 / -1' }}>🔧 Weitere Deckungen</h4>
                  <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {mfzCbRow('mfz_pannendienst', 'mfz_pannendienst_text', 'Pannendienst')}
                    {mfzCbRow('mfz_ebatterie', 'mfz_ebatterie_text', 'E-Batterie')}
                    {mfzCbRow('mfz_eladegeraet', 'mfz_eladegeraet_text', 'E-Ladegerät')}
                  </div>
                </div>

                {/* Zusatzdeckungen & Klauseln */}
                <div className="span-3">
                  <ZusatzdeckungenManager policeId={formData.id} versichererId={formData.versicherer_id} sparteId={formData.sparte_id} isEditMode={isEditMode} />
                </div>
                <div className="span-3" style={{ marginTop: '2rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid #e5e7eb' }}>📋 Vertragsklauseln</h4>
                  <KlauselnTab policeId={formData.id} isEditMode={isEditMode} />
                </div>
              </>
            )}

          </div>

                    {/* RIGHT: TABS + BOXES */}
          <div className="container-right">
            {police && (
              <>
                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.4rem' }}>
                  {['dateien','klauseln','mutations'].map(tab => (
                    <button key={tab} onClick={() => setRightActiveTab(tab)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', background: rightActiveTab === tab ? '#1e40af' : '#f0f0f0', color: rightActiveTab === tab ? 'white' : '#333', border: 'none', borderRadius: '3px', cursor: 'pointer', fontWeight: '500' }}>
                      {tab === 'dateien' ? '📁 Dateien' : tab === 'klauseln' ? '📋 Klauseln' : '📜 History'}
                    </button>
                  ))}
                </div>

                {rightActiveTab === 'dateien' && (
                  <div className="right-section documents-section">
                    <h4 style={{ margin: '0 0 0.4rem 0' }}>📁 Dateien</h4>
                    <DateienTab policeId={police.id} />
                  </div>
                )}
                {rightActiveTab === 'klauseln' && (
                  <div className="right-section documents-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', gap: '0.5rem' }}>
                      <h4 style={{ margin: 0 }}>📋 Vertragsklauseln</h4>
                      {isEditMode && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => setShowKlauselVerwaltung(true)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', backgroundColor: '#475569', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', whiteSpace: 'nowrap' }}>+ Neue Klausel</button>
                          <button onClick={() => setShowKlauselAuswahl(true)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', backgroundColor: '#1e40af', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', whiteSpace: 'nowrap' }}>+ Hinzufügen</button>
                        </div>
                      )}
                    </div>
                    <KlauselnTab policeId={police.id} key={`klauseln-${rightActiveTab}-${klauselnRefreshTrigger}`} />
                  </div>
                )}
                {rightActiveTab === 'mutations' && (
                  <div className="right-section documents-section">
                    <h4 style={{ margin: '0 0 0.4rem 0' }}>📜 Änderungsverlauf</h4>
                    <MutationsTab policeId={police.id} />
                  </div>
                )}

                <div className="right-section">
                  <h4>💰 Rechnungen</h4>
                  <div className="empty-section">Hier erscheinen die Rechnungen</div>
                </div>
                <div className="right-section">
                  <h4>⚠️ Schadenfälle</h4>
                  <div className="empty-section">Hier erscheinen die Schadenfälle</div>
                </div>
                <div className="right-section">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <h4 style={{ margin: 0 }}>🗂️ Archiv</h4>
                    {isEditMode && (
                      <button onClick={() => { const link = prompt('Archiv-Link eingeben:', formData.archiv_url || ''); if (link !== null) setFormData({ ...formData, archiv_url: link }) }} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', backgroundColor: '#475569', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>✏️ Bearbeiten</button>
                    )}
                  </div>
                  {formData.archiv_url
                    ? <a href={formData.archiv_url} target="_blank" rel="noopener noreferrer" style={{ padding: '0.4rem 0.8rem', border: '1px solid #1e40af', borderRadius: '3px', fontSize: '0.75rem', color: '#1e40af', textDecoration: 'none', fontWeight: '500', display: 'inline-block' }}>🔗 Zum Archiv</a>
                    : <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: 0 }}>{isEditMode ? 'Kein Link - auf Bearbeiten klicken' : 'Kein Link'}</p>
                  }
                </div>
              </>
            )}
          </div>
        </div>

        {/* ACTIONS */}
        <div className="modal-actions">
          <button className="button-secondary" onClick={onClose} disabled={loading}>Schließen</button>
          {isEditMode && (
            <button className="button-primary" onClick={handleSave} disabled={loading}>
              {loading ? '💾 Speichern...' : '💾 Speichern'}
            </button>
          )}
        </div>

        {showModal && <DateienModal policeId={police?.id} onClose={() => setShowModal(false)} onSave={() => setShowModal(false)} />}
        {showKlauselVerwaltung && (
          <KlauselVerwaltungModal versichererId={formData.versicherer_id} sparteId={formData.sparte_id}
            onClose={() => setShowKlauselVerwaltung(false)}
            onSave={() => { setShowKlauselVerwaltung(false); setShowKlauselAuswahl(true) }}
          />
        )}
        {showKlauselAuswahl && (
          <KlauselAuswahlModal policeId={police?.id} versichererId={formData.versicherer_id} sparteId={formData.sparte_id}
            onClose={() => setShowKlauselAuswahl(false)}
            onSave={() => { setShowKlauselAuswahl(false); setRightActiveTab('klauseln'); setKlauselnRefreshTrigger(prev => prev + 1) }}
          />
        )}
      </div>
    </div>
  )
}

export default PolicenDetailsModal