import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PolicenTab from './PolicenTab'
import './KundenDetailsPage.css'

const KANTONE = ['Aargau', 'Appenzell Ausserrhoden', 'Appenzell Innerrhoden', 'Basel-Landschaft', 'Basel-Stadt', 'Bern', 'Freiburg', 'Genf', 'Glarus', 'Graubünden', 'Jura', 'Luzern', 'Neuenburg', 'Nidwalden', 'Obwalden', 'Schaffhausen', 'Schwyz', 'Solothurn', 'St. Gallen', 'Tessin', 'Thurgau', 'Uri', 'Waadt', 'Wallis', 'Zug', 'Zürich']

const AUSBILDUNG = ['Obligatorische Schule', 'Lehre EFZ', 'Lehre EBA', 'Berufsmaturität', 'Mittelschule', 'Gymnasium / Matura', 'Höhere Fachschule (HF)', 'Berufsprüfung (BP)', 'Höhere Fachprüfung (HFP)', 'Fachausweis', 'Fachhochschule', 'Universität/ETH', 'Doktorat / PhD', 'CAS/DAS/MAS', 'NDS']

const ERWERBSSTATUS = ['Angestellt', 'Selbstständig', 'In Ausbildung / Studium', 'Arbeitslos', 'Stellensuchend (RAV)', 'Erwerbsunfähig', 'Invalidität (IV‐Rente)', 'Pensioniert', 'Ohne Erwerbstätigkeit']

function KundenDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  // ===== ALL HOOKS AT THE TOP =====
  const [kunde, setKunde] = useState(null)
  const [loading, setLoading] = useState(true)
  const [allKunden, setAllKunden] = useState([])
  const [activeTab, setActiveTab] = useState('persönlich')
  const [showGrunddatenModal, setShowGrunddatenModal] = useState(false)
  const [showWohnortModal, setShowWohnortModal] = useState(false)
  const [showFamilieModal, setShowFamilieModal] = useState(false)
  const [showBerufModal, setShowBerufModal] = useState(false)
  const [showBemerkungenModal, setShowBemerkungenModal] = useState(false)

  useEffect(() => {
    fetchKunde()
  }, [id])

  const fetchKunde = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/kunden/${id}`)
      if (!response.ok) throw new Error('Kunde nicht gefunden')
      const data = await response.json()
      setKunde(data)

      // Load all customers for partner dropdown
      try {
        const allRes = await fetch('http://localhost:5000/api/kunden')
        if (allRes.ok) {
          const allData = await allRes.json()
          setAllKunden(allData || [])
        }
      } catch (err) {
        console.warn('Error loading customer list:', err)
      }
    } catch (error) {
      console.error('Error fetching kunde:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleModalSave = async (type, data) => {
    try {
      let url, body, method
      const formatDate = (date) => date ? date.split('T')[0] : null

      if (type === 'grunddaten') {
        url = `http://localhost:5000/api/kunden/${id}`
        body = {
          vorname: data.vorname,
          nachname: data.nachname,
          geburtsdatum: formatDate(data.geburtsdatum),
          ahv_nummer: data.ahv_nummer,
          email: data.email,
          telefon: data.telefon,
          status: data.status
        }
        method = 'PUT'
      } else if (type === 'wohnort') {
        url = `http://localhost:5000/api/kunden/${id}`
        body = {
          adresse: data.adresse,
          plz: data.plz,
          ort: data.ort,
          verhaeltnis: data.verhaeltnis
        }
        method = 'PUT'
      } else if (type === 'familie') {
        url = `http://localhost:5000/api/kunden/${id}`
        body = {
          ehepartner_name: data.ehepartner_name,
          hochzeitsdatum: formatDate(data.hochzeitsdatum)
        }
        method = 'PUT'
      } else if (type === 'beruf') {
        url = `http://localhost:5000/api/kunden/${id}`
        body = {
          beruf: data.beruf,
          ausbildung: data.ausbildung,
          erwerbsstatus: data.erwerbsstatus,
          arbeitgeber_name: data.arbeitgeber_name,
          position: data.position,
          angestellt_seit: formatDate(data.angestellt_seit),
          arbeitspensum_prozent: data.arbeitspensum_prozent,
          kanton: data.kanton
        }
        method = 'PUT'
      } else if (type === 'bemerkungen') {
        url = `http://localhost:5000/api/kunden/${id}`
        body = { besonderheiten: data.besonderheiten }
        method = 'PUT'
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const responseData = await response.json()

      if (response.ok) {
        alert('✅ Gespeichert!')
        setShowGrunddatenModal(false)
        setShowWohnortModal(false)
        setShowFamilieModal(false)
        setShowBerufModal(false)
        setShowBemerkungenModal(false)
        fetchKunde()
      } else {
        alert('❌ Fehler:\n' + responseData.error)
      }
    } catch (error) {
      alert('❌ Fehler:\n' + error.message)
    }
  }

  if (loading) return <div className="card">Laden...</div>
  if (!kunde) return <div className="card error">Kunde nicht gefunden</div>

  return (
    <div className="kunde-details">
      <div className="header-section">
        <div className="header-title">
          <button className="back-button" onClick={() => navigate('/')}>← Zurück</button>
          <div>
            <h1>{kunde.vorname} {kunde.nachname}</h1>
            {kunde.ehepartner_name && <p className="header-subtitle">👫 Mit {kunde.ehepartner_name}</p>}
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="tabs-section">
        <button 
          className={`tab ${activeTab === 'persönlich' ? 'active' : ''}`}
          onClick={() => setActiveTab('persönlich')}
        >
          👤 Persönlich
        </button>
        <button 
          className={`tab ${activeTab === 'policen' ? 'active' : ''}`}
          onClick={() => setActiveTab('policen')}
        >
          📋 Policen
        </button>
        <button 
          className={`tab ${activeTab === 'immobilien' ? 'active' : ''}`}
          onClick={() => setActiveTab('immobilien')}
        >
          🏠 Immobilien
        </button>
      </div>

      <div className="content">
        {activeTab === 'persönlich' && (
          <>
        {/* GRUNDDATEN */}
        <div className="card">
          <div className="card-header">
            <h2>Grunddaten</h2>
            <button className="button-small" onClick={() => setShowGrunddatenModal(true)}>✏️ Bearbeiten</button>
          </div>
          <div className="info-grid">
            <div><label>Vorname</label><p>{kunde.vorname}</p></div>
            <div><label>Nachname</label><p>{kunde.nachname}</p></div>
            <div><label>Geburtsdatum</label><p>{kunde.geburtsdatum ? new Date(kunde.geburtsdatum).toLocaleDateString('de-CH') : '-'}</p></div>
            <div><label>AHV-Nummer</label><p>{kunde.ahv_nummer || '-'}</p></div>
            <div><label>Email</label><p>{kunde.email ? <a href={`mailto:${kunde.email}`}>{kunde.email}</a> : '-'}</p></div>
            <div><label>Telefon</label><p>{kunde.telefon ? <a href={`tel:${kunde.telefon}`}>{kunde.telefon}</a> : '-'}</p></div>
            <div><label>Status</label><p>{kunde.status}</p></div>
          </div>
        </div>

        {/* WOHNORT */}
        <div className="card">
          <div className="card-header">
            <h2>Wohnort</h2>
            <button className="button-small" onClick={() => setShowWohnortModal(true)}>✏️ Bearbeiten</button>
          </div>
          <div className="info-grid">
            <div><label>Strasse</label><p>{kunde.adresse || '-'}</p></div>
            <div><label>PLZ</label><p>{kunde.plz || '-'}</p></div>
            <div><label>Ort</label><p>{kunde.ort || '-'}</p></div>
            <div><label>Verhältnis</label><p>{kunde.verhaeltnis || '-'}</p></div>
          </div>
        </div>

        {/* FAMILIE */}
        <div className="card">
          <div className="card-header">
            <h2>Familie</h2>
            <button className="button-small" onClick={() => setShowFamilieModal(true)}>✏️ Bearbeiten</button>
          </div>
          <div className="info-grid">
            <div><label>Ehepartner</label><p>{kunde.ehepartner_name || '-'}</p></div>
            <div><label>Hochzeitsdatum</label><p>{kunde.hochzeitsdatum ? new Date(kunde.hochzeitsdatum).toLocaleDateString('de-CH') : '-'}</p></div>
          </div>
        </div>

        {/* BERUF & ARBEITGEBER */}
        <div className="card">
          <div className="card-header">
            <h2>Beruf & Arbeitgeber</h2>
            <button className="button-small" onClick={() => setShowBerufModal(true)}>✏️ Bearbeiten</button>
          </div>
          
          <div className="info-grid">
            <div><label>Beruf</label><p>{kunde.beruf || '-'}</p></div>
            <div><label>Ausbildung</label><p>{kunde.ausbildung || '-'}</p></div>
            <div><label>Erwerbsstatus</label><p>{kunde.erwerbsstatus || '-'}</p></div>
          </div>

          <div style={{marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e0e0e0'}}>
            <h3>Arbeitgeber</h3>
            <div className="info-grid">
              <div><label>Firma</label><p>{kunde.arbeitgeber_name || '-'}</p></div>
              <div><label>Position</label><p>{kunde.position || '-'}</p></div>
              <div><label>Angestellt seit</label><p>{kunde.angestellt_seit ? new Date(kunde.angestellt_seit).toLocaleDateString('de-CH') : '-'}</p></div>
            </div>
          </div>

          <div style={{marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e0e0e0'}}>
            <h3>Arbeitspensum</h3>
            <div className="info-grid">
              <div><label>Prozent</label><p>{kunde.arbeitspensum_prozent}%</p></div>
              <div><label>Kanton</label><p>{kunde.kanton || '-'}</p></div>
            </div>
          </div>
        </div>

        {/* BEMERKUNGEN */}
        <div className="card">
          <div className="card-header">
            <h2>Bemerkungen</h2>
            <button className="button-small" onClick={() => setShowBemerkungenModal(true)}>✏️ Bearbeiten</button>
          </div>
          <div className="remarks-display">{kunde.besonderheiten || 'Keine Bemerkungen'}</div>
        </div>
          </>
        )}

        {activeTab === 'policen' && (
          <PolicenTab kundeId={parseInt(id)} />
        )}

        {activeTab === 'immobilien' && (
          <div className="card">
            <h2>🏠 Immobilien</h2>
            {kunde.immobilien && kunde.immobilien.length > 0 ? (
              <table className="sub-table">
                <thead>
                  <tr><th>Adresse</th><th>Typ</th><th>Status</th><th>Baujahr</th></tr>
                </thead>
                <tbody>
                  {kunde.immobilien.map((immo, idx) => (
                    <tr key={idx}>
                      <td>{immo.strasse} {immo.hausnummer}, {immo.plz} {immo.ort}</td>
                      <td>{immo.immobilienart}</td>
                      <td>{immo.wohnort_status}</td>
                      <td>{immo.baujahr}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>Keine Immobilien erfasst.</p>
            )}
          </div>
        )}
      </div>

      {/* MODALS */}
      {showGrunddatenModal && <GrunddatenModal grunddaten={kunde} onClose={() => setShowGrunddatenModal(false)} onSave={handleModalSave} />}
      {showWohnortModal && <WohnortModal wohnort={kunde} onClose={() => setShowWohnortModal(false)} onSave={handleModalSave} />}
      {showFamilieModal && <FamilieModal familie={kunde} kundeId={parseInt(id)} allKunden={allKunden} onClose={() => setShowFamilieModal(false)} onSave={handleModalSave} />}
      {showBerufModal && <BerufModal beruf={kunde} kantone={KANTONE} onClose={() => setShowBerufModal(false)} onSave={handleModalSave} />}
      {showBemerkungenModal && <BemerkungenModal bemerkungen={kunde.besonderheiten} onClose={() => setShowBemerkungenModal(false)} onSave={handleModalSave} />}
    </div>
  )
}

// ============================================================================
// MODALS
// ============================================================================

function GrunddatenModal({ grunddaten, onClose, onSave }) {
  const [formData, setFormData] = useState(grunddaten || {})
  const formatDate = (date) => date ? date.split('T')[0] : ''

  return (
    <div className="modal-overlay">
      <div className="modal modal-large">
        <h3>Grunddaten bearbeiten</h3>
        <div className="modal-form">
          <div className="form-group"><label>Vorname</label><input type="text" value={formData.vorname || ''} onChange={(e) => setFormData({...formData, vorname: e.target.value})} /></div>
          <div className="form-group"><label>Nachname</label><input type="text" value={formData.nachname || ''} onChange={(e) => setFormData({...formData, nachname: e.target.value})} /></div>
          <div className="form-group"><label>Geburtsdatum</label><input type="date" value={formatDate(formData.geburtsdatum)} onChange={(e) => setFormData({...formData, geburtsdatum: e.target.value})} /></div>
          <div className="form-group"><label>AHV-Nummer</label><input type="text" value={formData.ahv_nummer || ''} onChange={(e) => setFormData({...formData, ahv_nummer: e.target.value})} /></div>
          <div className="form-group"><label>Email</label><input type="email" value={formData.email || ''} onChange={(e) => setFormData({...formData, email: e.target.value})} /></div>
          <div className="form-group"><label>Telefon</label><input type="tel" value={formData.telefon || ''} onChange={(e) => setFormData({...formData, telefon: e.target.value})} /></div>
          <div className="form-group"><label>Status</label><select value={formData.status || 'Vollmandat'} onChange={(e) => setFormData({...formData, status: e.target.value})}><option value="Vollmandat">Vollmandat</option><option value="Teilmandat">Teilmandat</option><option value="Kein Mandat">Kein Mandat</option></select></div>
        </div>
        <div className="modal-actions">
          <button className="button-primary" onClick={() => onSave('grunddaten', formData)}>Speichern</button>
          <button className="button-secondary" onClick={onClose}>Abbrechen</button>
        </div>
      </div>
    </div>
  )
}

function WohnortModal({ wohnort, onClose, onSave }) {
  const [formData, setFormData] = useState(wohnort || {})

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Wohnort bearbeiten</h3>
        <div className="modal-form">
          <div className="form-group"><label>Strasse</label><input type="text" value={formData.adresse || ''} onChange={(e) => setFormData({...formData, adresse: e.target.value})} /></div>
          <div className="form-group"><label>PLZ</label><input type="text" value={formData.plz || ''} onChange={(e) => setFormData({...formData, plz: e.target.value})} /></div>
          <div className="form-group"><label>Ort</label><input type="text" value={formData.ort || ''} onChange={(e) => setFormData({...formData, ort: e.target.value})} /></div>
          <div className="form-group"><label>Verhältnis</label><select value={formData.verhaeltnis || ''} onChange={(e) => setFormData({...formData, verhaeltnis: e.target.value})}><option value="">-- Bitte wählen --</option><option value="Eigentum">Eigentum</option><option value="Miete">Miete</option></select></div>
        </div>
        <div className="modal-actions">
          <button className="button-primary" onClick={() => onSave('wohnort', formData)}>Speichern</button>
          <button className="button-secondary" onClick={onClose}>Abbrechen</button>
        </div>
      </div>
    </div>
  )
}

function FamilieModal({ familie, kundeId, allKunden, onClose, onSave }) {
  const [formData, setFormData] = useState(familie || {})
  const [showNewPartnerForm, setShowNewPartnerForm] = useState(false)
  const [newPartnerName, setNewPartnerName] = useState('')
  const formatDate = (date) => date ? date.split('T')[0] : ''

  const handleSelectPartner = (e) => {
    const selectedId = e.target.value
    if (selectedId === 'new') {
      setShowNewPartnerForm(true)
    } else if (selectedId) {
      const selectedKunde = allKunden.find(k => k.id === parseInt(selectedId))
      if (selectedKunde) {
        setFormData({
          ...formData,
          ehepartner_name: `${selectedKunde.vorname} ${selectedKunde.nachname}`
        })
      }
    }
  }

  const handleAddNewPartner = () => {
    if (!newPartnerName.trim()) {
      alert('❌ Name eingeben!')
      return
    }
    setFormData({
      ...formData,
      ehepartner_name: newPartnerName
    })
    setShowNewPartnerForm(false)
    setNewPartnerName('')
  }

  return (
    <div className="modal-overlay">
      <div className="modal modal-large">
        <h3>Familie bearbeiten</h3>
        <div className="modal-form">
          <h4>Ehepartner</h4>
          <div className="form-group">
            <label>Partner aus Kundenliste wählen</label>
            <select onChange={handleSelectPartner} defaultValue="">
              <option value="">-- Bitte wählen --</option>
              {allKunden && allKunden
                .filter(k => k.id !== kundeId)
                .map(k => (
                  <option key={k.id} value={k.id}>
                    {k.vorname} {k.nachname}
                  </option>
                ))}
              <option value="new">+ Neuer Partner erfassen</option>
            </select>
          </div>

          {showNewPartnerForm && (
            <div className="form-group">
              <label>Name eingeben</label>
              <input 
                type="text" 
                value={newPartnerName}
                onChange={(e) => setNewPartnerName(e.target.value)}
                placeholder="z.B. Anna Muster"
              />
              <button 
                className="button-small" 
                onClick={handleAddNewPartner}
                style={{marginTop: '10px'}}
              >
                + Übernehmen
              </button>
            </div>
          )}

          {formData.ehepartner_name && (
            <div className="form-group">
              <label>Ausgewählter Partner</label>
              <input 
                type="text" 
                value={formData.ehepartner_name}
                readOnly
                style={{background: '#f0f0f0'}}
              />
            </div>
          )}

          <div className="form-group"><label>Hochzeitsdatum</label><input type="date" value={formatDate(formData.hochzeitsdatum)} onChange={(e) => setFormData({...formData, hochzeitsdatum: e.target.value})} /></div>
        </div>
        <div className="modal-actions">
          <button className="button-primary" onClick={() => onSave('familie', formData)}>Speichern</button>
          <button className="button-secondary" onClick={onClose}>Abbrechen</button>
        </div>
      </div>
    </div>
  )
}

function BerufModal({ beruf, kantone, onClose, onSave }) {
  const [formData, setFormData] = useState(beruf || {})
  const formatDate = (date) => date ? date.split('T')[0] : ''

  return (
    <div className="modal-overlay">
      <div className="modal modal-large">
        <h3>Beruf & Arbeitgeber bearbeiten</h3>
        <div className="modal-form">
          <div className="form-group"><label>Beruf</label><input type="text" value={formData.beruf || ''} onChange={(e) => setFormData({...formData, beruf: e.target.value})} placeholder="z.B. Maschinenmechaniker, Kauffrau" /></div>
          <div className="form-group"><label>Ausbildung</label><select value={formData.ausbildung || ''} onChange={(e) => setFormData({...formData, ausbildung: e.target.value})}><option value="">-- Bitte wählen --</option>{AUSBILDUNG.map(a => <option key={a} value={a}>{a}</option>)}</select></div>
          <div className="form-group"><label>Erwerbsstatus</label><select value={formData.erwerbsstatus || ''} onChange={(e) => setFormData({...formData, erwerbsstatus: e.target.value})}><option value="">-- Bitte wählen --</option>{ERWERBSSTATUS.map(e => <option key={e} value={e}>{e}</option>)}</select></div>

          <h4 style={{marginTop: '20px'}}>Arbeitgeber</h4>
          <div className="form-group"><label>Firma</label><input type="text" value={formData.arbeitgeber_name || ''} onChange={(e) => setFormData({...formData, arbeitgeber_name: e.target.value})} /></div>
          <div className="form-group"><label>Position</label><input type="text" value={formData.position || ''} onChange={(e) => setFormData({...formData, position: e.target.value})} /></div>
          <div className="form-group"><label>Angestellt seit</label><input type="date" value={formatDate(formData.angestellt_seit)} onChange={(e) => setFormData({...formData, angestellt_seit: e.target.value})} /></div>

          <h4 style={{marginTop: '20px'}}>Arbeitspensum</h4>
          <div className="form-group"><label>Prozent</label><input type="number" value={formData.arbeitspensum_prozent || ''} onChange={(e) => setFormData({...formData, arbeitspensum_prozent: e.target.value})} /></div>
          <div className="form-group"><label>Kanton</label><select value={formData.kanton || ''} onChange={(e) => setFormData({...formData, kanton: e.target.value})}><option value="">-- Bitte wählen --</option>{kantone.map(k => <option key={k} value={k}>{k}</option>)}</select></div>
        </div>
        <div className="modal-actions">
          <button className="button-primary" onClick={() => onSave('beruf', formData)}>Speichern</button>
          <button className="button-secondary" onClick={onClose}>Abbrechen</button>
        </div>
      </div>
    </div>
  )
}

function BemerkungenModal({ bemerkungen, onClose, onSave }) {
  const [formData, setFormData] = useState({besonderheiten: bemerkungen || ''})

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Bemerkungen</h3>
        <div className="modal-form">
          <div className="form-group full-width"><label>Notizen</label><textarea rows="8" value={formData.besonderheiten} onChange={(e) => setFormData({...formData, besonderheiten: e.target.value})} /></div>
        </div>
        <div className="modal-actions">
          <button className="button-primary" onClick={() => onSave('bemerkungen', formData)}>Speichern</button>
          <button className="button-secondary" onClick={onClose}>Abbrechen</button>
        </div>
      </div>
    </div>
  )
}

export default KundenDetailsPage
