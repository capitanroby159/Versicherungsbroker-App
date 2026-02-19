import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PolicenTab from './PolicenTab'
import './KundenDetailsPage.css'
import KundenZeiterfassung from './Zeiterfassung/KundenZeiterfassung'

function FirmenDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [firma, setFirma] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('übersicht')

  useEffect(() => {
    fetchFirma()
  }, [id])

  const fetchFirma = async () => {
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
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      setFirma(data)
    } catch (err) {
      console.error('❌ Error fetching firma:', err)
      setError(`Fehler beim Laden: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '-'
    const dateOnly = dateString.split('T')[0]
    const [year, month, day] = dateOnly.split('-')
    return `${day}.${month}.${year}`
  }

  if (loading) {
    return <div className="details-page"><p>⏳ Lade Firma...</p></div>
  }

  if (error) {
    return (
      <div className="details-page">
        <p className="error">❌ {error}</p>
        <button onClick={() => navigate('/kunden')}>← Zurück</button>
      </div>
    )
  }

  if (!firma) {
    return (
      <div className="details-page">
        <p>Firma nicht gefunden</p>
        <button onClick={() => navigate('/kunden')}>← Zurück</button>
      </div>
    )
  }

  return (
    <div className="details-page">

      {/* ============================================================ */}
      {/* HEADER */}
      {/* ============================================================ */}
      <div className="page-header">
        <div className="details-header">
          <div className="header-left">
            <button className="back-button" onClick={() => navigate('/kunden')}>← Zurück</button>
            <h1>{firma.firma_name}</h1>
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              {firma.mandat_url && (
                <a href={firma.mandat_url} target="_blank" rel="noopener noreferrer" className="mandat-link-inline">
                  📋 Mandat
                </a>
              )}
              {firma.archiv_url && (
                <a href={firma.archiv_url} target="_blank" rel="noopener noreferrer" className="mandat-link-inline" style={{ backgroundColor: '#6366F1' }}>
                  📁 Archiv
                </a>
              )}
              {firma.personalreglement_url && (
                <a href={firma.personalreglement_url} target="_blank" rel="noopener noreferrer" className="mandat-link-inline">
                  📄 Personalreglement
                </a>
              )}
            </div>
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
          🏢 Übersicht
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
        {/* ✅ FIX 1+2: Key 'aktivitaeten' → 'zeiterfassung', Label aktualisiert */}
        <button
          className={`tab-button ${activeTab === 'zeiterfassung' ? 'active' : ''}`}
          onClick={() => setActiveTab('zeiterfassung')}
        >
          ⏱ Zeiterfassung
        </button>
      </div>

      {/* ============================================================ */}
      {/* TAB CONTENT - ÜBERSICHT */}
      {/* ============================================================ */}
      {activeTab === 'übersicht' && (
        <div className="details-page-content">

          {/* FIRMA INFORMATIONEN */}
          <div className="form-section">
            <h3>🏢 Firmeninformationen</h3>
            <div className="form-row-3">
              <div className="detail-field">
                <label>Firmenname</label>
                <p>{firma.firma_name || '-'}</p>
              </div>
              <div className="detail-field">
                <label>Gründungsdatum</label>
                <p>{formatDateForDisplay(firma.gruendungsdatum)}</p>
              </div>
              <div className="detail-field">
                <label>UID</label>
                <p>{firma.uid || '-'}</p>
              </div>
            </div>

            <div className="form-row-3">
              <div className="detail-field">
                <label>Mehrwertsteuer</label>
                <p>{firma.mehrwertsteuer === 'ja' ? 'Ja' : 'Nein'}</p>
              </div>
              <div className="detail-field">
                <label>NOGA-Code</label>
                <p>{firma.noga_code || '-'}</p>
              </div>
              <div className="detail-field">
                <label>Status</label>
                <p>
                  <span className={`status-badge ${(firma.status || 'Aktiv').toLowerCase()}`}>
                    {firma.status || 'Aktiv'}
                  </span>
                </p>
              </div>
            </div>

            <div className="detail-field full-width">
              <label>Tätigkeitsbeschrieb</label>
              <p>{firma.taetigkeitsbeschrieb || '-'}</p>
            </div>

            <div className="detail-field full-width">
              <label>IBAN</label>
              <p>{firma.iban || '-'}</p>
            </div>
          </div>

          {/* ADRESSE */}
          <div className="form-section">
            <h3>🏠 Adresse</h3>
            <div className="form-row-3">
              <div className="detail-field">
                <label>Strasse & Hausnummer</label>
                <p>{firma.adresse || '-'}</p>
              </div>
              <div className="detail-field">
                <label>PLZ</label>
                <p>{firma.plz || '-'}</p>
              </div>
              <div className="detail-field">
                <label>Ort</label>
                <p>{firma.ort || '-'}</p>
              </div>
            </div>

            <div className="form-row-3">
              <div className="detail-field">
                <label>Kanton</label>
                <p>{firma.kanton || '-'}</p>
              </div>
            </div>
          </div>

          {/* KONTAKT */}
          <div className="form-section">
            <h3>📞 Kontakt</h3>

            <div className="detail-field full-width">
              <label>E-Mails</label>
              {firma.emails && firma.emails.length > 0 ? (
                <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                  {firma.emails.map((e, idx) => (
                    <li key={idx}>
                      <a href={`mailto:${e.email}`}>{e.email}</a>
                      <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '8px' }}>
                        ({e.typ || 'Privat'})
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>-</p>
              )}
            </div>

            <div className="detail-field full-width">
              <label>Telefone</label>
              {firma.telefone && firma.telefone.length > 0 ? (
                <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                  {firma.telefone.map((t, idx) => (
                    <li key={idx}>
                      <a href={`tel:${t.telefon}`}>{t.telefon}</a>
                      <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '8px' }}>
                        ({t.typ || 'Mobil'})
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>-</p>
              )}
            </div>
          </div>

          {/* ANSPRECHPERSONEN */}
          <div className="form-section">
            <h3>👥 Ansprechpersonen</h3>
            {firma.ansprechpersonen && firma.ansprechpersonen.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {firma.ansprechpersonen.map((ap) => (
                  <div key={ap.id} style={{ padding: '16px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                    <p style={{ margin: '0 0 8px 0', fontWeight: 600, fontSize: '16px' }}>
                      {ap.person_name}
                    </p>
                    {ap.position && (
                      <p style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#6b7280' }}>
                        <strong>Position:</strong> {ap.position}
                      </p>
                    )}
                    {ap.email && (
                      <p style={{ margin: '0 0 6px 0', fontSize: '14px' }}>
                        <strong>Email:</strong> <a href={`mailto:${ap.email}`}>{ap.email}</a>
                      </p>
                    )}
                    {ap.telefon && (
                      <p style={{ margin: '0', fontSize: '14px' }}>
                        <strong>Telefon:</strong> <a href={`tel:${ap.telefon}`}>{ap.telefon}</a>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#6b7280' }}>Keine Ansprechpersonen erfasst</p>
            )}
          </div>

          {/* BESONDERHEITEN */}
          <div className="form-section">
            <h3>⭐ Besonderheiten</h3>
            <p>{firma.besonderheiten || '-'}</p>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB CONTENT - POLICEN */}
      {/* ============================================================ */}
      {activeTab === 'policen' && (
        <PolicenTab kundeId={firma.id} kundeTyp={firma.kundentyp} />
      )}

      {/* ============================================================ */}
      {/* TAB CONTENT - IMMOBILIEN */}
      {/* ============================================================ */}
      {activeTab === 'immobilien' && (
        <div className="details-page-content">
          <div className="form-section">
            <p style={{ color: '#999', fontStyle: 'italic' }}>🚧 Immobilien-Tab kommt bald...</p>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB CONTENT - SCHADENFÄLLE */}
      {/* ============================================================ */}
      {activeTab === 'schadenfaelle' && (
        <div className="details-page-content">
          <div className="form-section">
            <p style={{ color: '#999', fontStyle: 'italic' }}>🚧 Schadenfälle-Tab kommt bald...</p>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB CONTENT - ZEITERFASSUNG */}
      {/* ✅ FIX 3: Placeholder ersetzt durch KundenZeiterfassung-Komponente */}
      {/* ============================================================ */}
      {activeTab === 'zeiterfassung' && (
        <KundenZeiterfassung
          kundeId={firma.id}
          kundeName={firma.firma_name}
        />
      )}

    </div>
  )
}

export default FirmenDetailsPage