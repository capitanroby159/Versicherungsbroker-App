import { useState, useEffect } from 'react'
import './Zeiterfassung.css'

const API = 'http://localhost:5000/api'

const toLocalDateStr = (d) => {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function ZeiterfassungExport({ kundeId, kundeName, onClose }) {
  const heute = new Date()
  const ersterDiesesMonat  = toLocalDateStr(new Date(heute.getFullYear(), heute.getMonth(), 1))
  const letzterDiesesMonat = toLocalDateStr(new Date(heute.getFullYear(), heute.getMonth() + 1, 0))

  const [periode, setPeriode] = useState('monat')
  const [von, setVon] = useState(ersterDiesesMonat)
  const [bis, setBis] = useState(letzterDiesesMonat)
  const [courtage, setCourtage] = useState('')
  const [courtage_beschreibung, setCourtage_beschreibung] = useState('')
  const [policenCourtage, setPolicenCourtage] = useState(0)
  const [preview, setPreview] = useState(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [loadingExport, setLoadingExport] = useState(false)

  useEffect(() => { fetchPolicenCourtage() }, [kundeId])
  useEffect(() => { applyPeriode(periode) }, [periode])
  useEffect(() => { if (von && bis) fetchPreview() }, [von, bis, courtage])

  const fetchPolicenCourtage = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`${API}/policen?kunde_id=${kundeId}&status_detail=Aktiv`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const policen = await res.json()
        const total = policen.reduce((sum, p) =>
          sum + (parseFloat(p.praemie_chf) || 0) + (parseFloat(p.gebuehren) || 0), 0)
        setPolicenCourtage(total)
        setCourtage(total.toFixed(2))
      }
    } catch (e) { console.error(e) }
  }

  const applyPeriode = (p) => {
    const now = new Date()
    const year = now.getFullYear()
    let v, b
    if (p === 'monat')        { v = new Date(year, now.getMonth(), 1);     b = new Date(year, now.getMonth() + 1, 0) }
    else if (p === 'letzter_monat') { v = new Date(year, now.getMonth()-1, 1); b = new Date(year, now.getMonth(), 0) }
    else if (p === 'q1')      { v = new Date(year, 0, 1);  b = new Date(year, 2, 31) }
    else if (p === 'q2')      { v = new Date(year, 3, 1);  b = new Date(year, 5, 30) }
    else if (p === 'q3')      { v = new Date(year, 6, 1);  b = new Date(year, 8, 30) }
    else if (p === 'q4')      { v = new Date(year, 9, 1);  b = new Date(year, 11, 31) }
    else if (p === 'jahr')    { v = new Date(year, 0, 1);  b = new Date(year, 11, 31) }
    else return
    setVon(toLocalDateStr(v))
    setBis(toLocalDateStr(b))
  }

  const fetchPreview = async () => {
    setLoadingPreview(true)
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`${API}/zeiterfassung/by-kunde/${kundeId}?${new URLSearchParams({ von, bis })}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) setPreview(await res.json())
    } catch (e) { console.error(e) }
    finally { setLoadingPreview(false) }
  }

  const handleExport = async () => {
    setLoadingExport(true)
    try {
      const token = localStorage.getItem('auth_token')
      const params = new URLSearchParams({ von, bis, format: 'csv', courtage: courtage || '0', courtage_beschreibung: courtage_beschreibung || '' })
      const res = await fetch(`${API}/zeiterfassung/export/${kundeId}?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Export fehlgeschlagen')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Beratungsrapport_${kundeName.replace(/[^a-z0-9]/gi, '_')}_${von}.csv`
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (e) { alert('❌ Export fehlgeschlagen: ' + e.message) }
    finally { setLoadingExport(false) }
  }

  const formatCHF = (val) =>
    `CHF ${parseFloat(val || 0).toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const courtageVal    = parseFloat(courtage) || 0
  const totalKosten    = preview ? (preview.total_kosten_chf || 0) : 0
  const rentabilitaet  = totalKosten > 0 ? courtageVal / totalKosten : null

  const PERIODEN = [
    { key: 'monat',         label: 'Dieser Monat' },
    { key: 'letzter_monat', label: 'Letzter Monat' },
    { key: 'q1', label: 'Q1' }, { key: 'q2', label: 'Q2' },
    { key: 'q3', label: 'Q3' }, { key: 'q4', label: 'Q4' },
    { key: 'jahr',   label: 'Ganzes Jahr' },
    { key: 'custom', label: 'Benutzerdefiniert' },
  ]

  return (
    <div className="ze-modal-overlay" onClick={onClose}>
      <div className="ze-modal ze-modal-lg" onClick={e => e.stopPropagation()}>
        <div className="ze-modal-header">
          <h3>📥 Export Beratungsrapport</h3>
          <button className="ze-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="ze-modal-body">
          <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 6, padding: '8px 14px', marginBottom: 16, fontSize: 13, color: '#0369a1', fontWeight: 600 }}>
            📋 {kundeName}
          </div>

          <div className="ze-form-group">
            <label>Periode</label>
            <div className="ze-periode-buttons">
              {PERIODEN.map(p => (
                <button key={p.key} type="button"
                  className={`ze-periode-btn${periode === p.key ? ' active' : ''}`}
                  onClick={() => setPeriode(p.key)}>{p.label}</button>
              ))}
            </div>
          </div>

          <div className="ze-form-row">
            <div className="ze-form-group">
              <label>Von</label>
              <input type="date" value={von} onChange={e => { setVon(e.target.value); setPeriode('custom') }} />
            </div>
            <div className="ze-form-group">
              <label>Bis</label>
              <input type="date" value={bis} onChange={e => { setBis(e.target.value); setPeriode('custom') }} />
            </div>
          </div>

          <div className="ze-courtage-section">
            <h4>💰 Courtage (aus aktiven Policen)</h4>
            {policenCourtage > 0 && (
              <div style={{ fontSize: 12, color: '#713f12', marginBottom: 8 }}>
                📋 Automatisch aus Policen: <strong>{formatCHF(policenCourtage)}</strong> / Jahr
              </div>
            )}
            <div className="ze-form-row">
              <div className="ze-form-group" style={{ marginBottom: 0 }}>
                <label>Betrag (CHF)</label>
                <input type="number" value={courtage} onChange={e => setCourtage(e.target.value)} placeholder="0.00" min="0" step="0.01" />
              </div>
              <div className="ze-form-group" style={{ marginBottom: 0 }}>
                <label>Beschreibung (optional)</label>
                <input type="text" value={courtage_beschreibung} onChange={e => setCourtage_beschreibung(e.target.value)} placeholder="z.B. Jahresprämien 2026" />
              </div>
            </div>
          </div>

          {loadingPreview ? (
            <div style={{ padding: '20px 0', textAlign: 'center', color: '#6b7280', fontSize: 13 }}>⏳ Vorschau wird geladen...</div>
          ) : preview && (
            <div className="ze-export-summary">
              <h4>📊 Vorschau</h4>
              <div className="ze-export-row">
                <span>Anzahl Einträge</span><span>{preview.eintraege?.length || 0}</span>
              </div>
              <div className="ze-export-row">
                <span>Total Zeitaufwand</span><span>{preview.total_formatiert}</span>
              </div>
              <div className="ze-export-row">
                <span>Beratungskosten</span>
                <span style={{ fontWeight: 600, color: '#dc2626' }}>{formatCHF(totalKosten)}</span>
              </div>
              {courtageVal > 0 && (
                <div className="ze-export-row">
                  <span>Courtage{courtage_beschreibung ? ` (${courtage_beschreibung})` : ''}</span>
                  <span style={{ fontWeight: 600, color: '#059669' }}>{formatCHF(courtageVal)}</span>
                </div>
              )}
              {rentabilitaet !== null && (
                <div className="ze-export-row total" style={{
                  background: rentabilitaet >= 1 ? '#f0fdf4' : '#fef2f2',
                  borderColor: rentabilitaet >= 1 ? '#86efac' : '#fca5a5',
                  borderRadius: 6, padding: '10px 12px', marginTop: 10
                }}>
                  <span>Rentabilität</span>
                  <span style={{ color: rentabilitaet >= 1 ? '#166534' : '#b91c1c' }}>
                    {rentabilitaet.toFixed(2)}×
                    {rentabilitaet >= 2 ? ' ✅ Sehr gut' : rentabilitaet >= 1 ? ' ✅ Rentabel' : ' ⚠️ Nicht rentabel'}
                  </span>
                </div>
              )}
            </div>
          )}

          {preview?.eintraege?.length === 0 && (
            <div style={{ background: '#fefce8', border: '1px solid #fde047', borderRadius: 6, padding: '10px 14px', marginTop: 10, fontSize: 13, color: '#713f12' }}>
              ⚠️ Keine Einträge für diese Periode.
            </div>
          )}
        </div>

        <div className="ze-modal-footer">
          <button className="ze-btn secondary" onClick={onClose}>Abbrechen</button>
          <button className="ze-btn success" onClick={handleExport} disabled={loadingExport || !von || !bis}>
            {loadingExport ? '⏳ Wird exportiert...' : '📥 CSV exportieren'}
          </button>
        </div>
      </div>
    </div>
  )
}