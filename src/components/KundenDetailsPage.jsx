import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import KundenFormModal from './KundenFormModal'
import PolicenTab from './PolicenTab'
import './KundenDetailsPage.css'

function KundenDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [kunde, setKunde] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [activeTab, setActiveTab] = useState('übersicht') // 'übersicht', 'policen', 'immobilien', 'schadenfaelle'

  useEffect(() => {
    fetchKunde()
  }, [id])

  const fetchKunde = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`http://localhost:5000/api/kunden/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Kunde nicht gefunden')
      }

      const data = await response.json()
      console.log('✅ Kunde geladen:', data)
      setKunde(data)
    } catch (error) {
      console.error('❌ Error fetching kunde:', error.message)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveKunde = async (kundeData) => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`http://localhost:5000/api/kunden/${kundeData.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(kundeData)
      })

      const data = await response.json()
      if (response.ok) {
        alert('✅ Kunde aktualisiert!')
        setShowEditForm(false)
        fetchKunde()
      } else {
        alert('❌ Fehler: ' + (data.message || data.error))
      }
    } catch (error) {
      console.error('❌ Error saving kunde:', error)
      alert('❌ Fehler beim Speichern: ' + error.message)
    }
  }

  // Formatiere Datum zu dd.mm.yyyy für Anzeige
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '-'
    if (typeof dateString !== 'string') return '-'
    try {
      const date = new Date(dateString + 'T00:00:00')
      if (isNaN(date.getTime())) return dateString
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      return `${day}.${month}.${year}`
    } catch (e) {
      return dateString
    }
  }

  if (loading) {
    return (
      <div className="details-page-wrapper">
        <div className="page-container">
          <div className="loading">⏳ Lade Kundendetails...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="details-page-wrapper">
        <div className="page-container">
          <div className="error-container">
            <p>❌ {error}</p>
            <button className="button-back" onClick={() => navigate('/kunden')}>← Zurück zur Kundenliste</button>
          </div>
        </div>
      </div>
    )
  }

  if (!kunde) {
    return (
      <div className="details-page-wrapper">
        <div className="page-container">
          <div className="error-container">
            <p>❌ Kunde nicht gefunden</p>
            <button className="button-back" onClick={() => navigate('/kunden')}>← Zurück zur Kundenliste</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="details-page-wrapper">
      <div className="page-container">
        {/* HEADER */}
        <div className="details-header">
          <div className="header-left">
            <button className="back-button" onClick={() => navigate('/kunden')}>← Zurück</button>
            <h1>{kunde.vorname} {kunde.nachname}</h1>
            <div className="mandat-links-container">
              {kunde.mandat_url && (
                <a href={kunde.mandat_url} target="_blank" rel="noopener noreferrer" className="mandat-link-inline">
                  📋 Mandat
                </a>
              )}
              {kunde.archiv_url && (
                <a href={kunde.archiv_url} target="_blank" rel="noopener noreferrer" className="mandat-link-inline archiv">
                  📁 Archiv
                </a>
              )}
              {kunde.personalreglement_url && (
                <a href={kunde.personalreglement_url} target="_blank" rel="noopener noreferrer" className="mandat-link-inline">
                  📄 Personalreglement
                </a>
              )}
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* TAB MENU */}
        {/* ============================================================ */}
        <div className="tabs-menu">
          <button 
            className={`tab-button ${activeTab === 'übersicht' ? 'active' : ''}`}
            onClick={() => setActiveTab('übersicht')}
          >
            👤 Übersicht
          </button>
          <button 
            className={`tab-button ${activeTab === 'policen' ? 'active' : ''}`}
            onClick={() => setActiveTab('policen')}
          >
            📋 Policen
          </button>
          <button 
            className={`tab-button ${activeTab === 'immobilien' ? 'active' : ''}`}
            onClick={() => setActiveTab('immobilien')}
          >
            🏠 Immobilien
          </button>
          <button 
            className={`tab-button ${activeTab === 'schadenfaelle' ? 'active' : ''}`}
            onClick={() => setActiveTab('schadenfaelle')}
          >
            ⚠️ Schadenfälle
          </button>
          <button 
            className={`tab-button ${activeTab === 'aktivitaeten' ? 'active' : ''}`}
            onClick={() => setActiveTab('aktivitaeten')}
          >
            📝 Aktivitäten
          </button>
        </div>

        {/* ============================================================ */}
        {/* TAB CONTENT - ÜBERSICHT */}
        {/* ============================================================ */}
        {activeTab === 'übersicht' && (
          <div className="details-page-content">
            {/* PERSÖNLICH */}
            <div className="form-section">
              <h3>👤 Persönlich</h3>
              <div className="form-row-3">
                <div className="detail-field">
                  <label>Vorname</label>
                  <p>{kunde.vorname || '-'}</p>
                </div>
                <div className="detail-field">
                  <label>Nachname</label>
                  <p>{kunde.nachname || '-'}</p>
                </div>
                <div className="detail-field">
                  <label>Geburtsdatum</label>
                  <p>{formatDateForDisplay(kunde.geburtsdatum)}</p>
                </div>
              </div>
              <div className="form-row-3">
                <div className="detail-field">
                  <label>AHV-Nummer</label>
                  <p>{kunde.ahv_nummer || '-'}</p>
                </div>
                <div className="detail-field">
                  <label>Status</label>
                  <p>{kunde.status || '-'}</p>
                </div>
                <div className="detail-field">
                  <label>Familienstand</label>
                  <p>{kunde.verhaeltnis || '-'}</p>
                </div>
              </div>

              <div className="form-row-3">
                <div className="detail-field">
                  <label>IBAN</label>
                  <p>{kunde.iban || '-'}</p>
                </div>
              </div>
            </div>

            {/* FAMILIE */}
            <div className="form-section">
              <h3>👨‍👩‍👧‍👦 Familie</h3>
              
              {(kunde.verhaeltnis === 'Verheiratet' || kunde.verhaeltnis === 'Konkubinat') && (
                <div className="form-row-2">
                  <div className="detail-field">
                    <label>{kunde.verhaeltnis === 'Konkubinat' ? 'Partnerin / Partner' : 'Ehefrau / Ehemann'}</label>
                    <p>{kunde.ehepartner_name || '-'}</p>
                  </div>
                  <div className="detail-field">
                    <label>{kunde.verhaeltnis === 'Konkubinat' ? 'Datum Zusammenzug' : 'Hochzeitsdatum'}</label>
                    <p>{formatDateForDisplay(kunde.hochzeitsdatum)}</p>
                  </div>
                </div>
              )}

              {kunde.verhaeltnis === 'Geschieden' && (
                <div className="form-row-2">
                  <div className="detail-field">
                    <label>Scheidungsdatum</label>
                    <p>{formatDateForDisplay(kunde.scheidungsdatum)}</p>
                  </div>
                </div>
              )}

              <div className="kinder-section">
                <div className="kinder-header">
                  <h4>
                    👶 Kinder {kunde.kinder && kunde.kinder.length > 0 ? `(${kunde.kinder.length})` : ''}
                  </h4>
                  <button 
                    type="button"
                    onClick={() => setShowEditForm(true)}
                    className="kinder-add-button"
                  >
                    + Kind
                  </button>
                </div>
                
                {kunde.kinder && kunde.kinder.length > 0 ? (
                  <div className="kinder-list">
                    {kunde.kinder.map((kind, index) => (
                      <div key={index} className="kinder-card">
                        <p className="kinder-card-name">{kind.vorname} {kind.nachname}</p>
                        <p className="kinder-card-info">
                          Geb: {formatDateForDisplay(kind.geburtsdatum)}
                          {kind.ausbildung && ` • ${kind.ausbildung}`}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="kinder-empty">Keine Kinder erfasst</p>
                )}
              </div>
            </div>

            {/* ADRESSE */}
            <div className="form-section">
              <h3>🏠 Adresse</h3>
              <div className="form-row-3">
                <div className="detail-field">
                  <label>Strasse</label>
                  <p>{kunde.adresse || '-'}</p>
                </div>
                <div className="detail-field">
                  <label>PLZ</label>
                  <p>{kunde.plz || '-'}</p>
                </div>
                <div className="detail-field">
                  <label>Ort</label>
                  <p>{kunde.ort || '-'}</p>
                </div>
              </div>
              <div className="form-row-2">
                <div className="detail-field">
                  <label>Kanton</label>
                  <p>{kunde.kanton || '-'}</p>
                </div>
              </div>
            </div>

            {/* KONTAKT */}
            <div className="form-section">
              <h3>📞 Kontakt</h3>
              
              <div className="contact-group">
                <h4>📧 E-Mails</h4>
                {kunde.emails && Array.isArray(kunde.emails) && kunde.emails.length > 0 ? (
                  <div className="contact-items">
                    {kunde.emails.map((item, index) => {
                      const email = typeof item === 'object' ? item.email : item
                      const typ = typeof item === 'object' ? item.typ : 'Privat'
                      return (
                        <div key={index} className="contact-row">
                          <a href={`mailto:${email}`} className="contact-link">
                            {email}
                          </a>
                          <span className="contact-badge">{typ}</span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="no-data">Keine E-Mails erfasst</p>
                )}
              </div>

              <div className="contact-group">
                <h4>📱 Telefone</h4>
                {kunde.telefone && Array.isArray(kunde.telefone) && kunde.telefone.length > 0 ? (
                  <div className="contact-items">
                    {kunde.telefone.map((item, index) => {
                      const telefon = typeof item === 'object' ? item.telefon : item
                      const typ = typeof item === 'object' ? item.typ : 'Mobil'
                      const isWhatsApp = telefon && (telefon.includes('+') || telefon.startsWith('0'))
                      
                      return (
                        <div key={index} className="contact-row">
                          <div className="phone-actions">
                            <a href={`tel:${telefon.replace(/\s/g, '')}`} className="contact-link">
                              ☎️ Anrufen
                            </a>
                            {isWhatsApp && (
                              <a 
                                href={`https://wa.me/${telefon.replace(/[^\d+]/g, '')}`} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="contact-link whatsapp"
                              >
                                💬 WhatsApp
                              </a>
                            )}
                          </div>
                          <span className="contact-badge">{typ}</span>
                          <span className="phone-display">{telefon}</span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="no-data">Keine Telefone erfasst</p>
                )}
              </div>
            </div>

            {/* ARBEIT */}
            {(kunde.ausbildung || kunde.arbeitgeber_name || kunde.position) && (
              <div className="form-section">
                <h3>💼 Arbeit</h3>
                <div className="form-row-3">
                  <div className="detail-field">
                    <label>Ausbildung</label>
                    <p>{kunde.ausbildung || '-'}</p>
                  </div>
                  <div className="detail-field">
                    <label>Arbeitgeber</label>
                    <p>{kunde.arbeitgeber_name || '-'}</p>
                  </div>
                  <div className="detail-field">
                    <label>Position</label>
                    <p>{kunde.position || '-'}</p>
                  </div>
                </div>
                <div className="form-row-2">
                  <div className="detail-field">
                    <label>Arbeitspensum (%)</label>
                    <p>{kunde.arbeitspensum_prozent || '-'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* NOTIZEN */}
            {kunde.besonderheiten && (
              <div className="form-section">
                <h3>📝 Notizen</h3>
                <div className="notes-box">
                  {kunde.besonderheiten}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB CONTENT - POLICEN */}
        {/* ============================================================ */}
        {activeTab === 'policen' && (
          <PolicenTab kundeId={kunde.id} kundeTyp={kunde.kundentyp} />
        )}

        {/* ============================================================ */}
        {/* TAB CONTENT - IMMOBILIEN */}
        {/* ============================================================ */}
        {activeTab === 'immobilien' && (
          <div className="details-page-content">
            <div className="form-section">
              <p className="tab-placeholder-text">🚧 Immobilien-Tab kommt bald...</p>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB CONTENT - SCHADENFÄLLE */}
        {/* ============================================================ */}
        {activeTab === 'schadenfaelle' && (
          <div className="details-page-content">
            <div className="form-section">
              <p className="tab-placeholder-text">🚧 Schadenfälle-Tab kommt bald...</p>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB CONTENT - AKTIVITÄTEN */}
        {/* ============================================================ */}
        {activeTab === 'aktivitaeten' && (
          <div className="details-page-content">
            <div className="form-section">
              <p className="tab-placeholder-text">🚧 Aktivitäten-Tab kommt bald...</p>
            </div>
          </div>
        )}

        {/* EDIT FORM MODAL */}
        {showEditForm && (
          <KundenFormModal 
            kunde={kunde}
            onCancel={() => setShowEditForm(false)}
            onSaveSuccess={handleSaveKunde}
          />
        )}
      </div>
    </div>
  )
}

export default KundenDetailsPage