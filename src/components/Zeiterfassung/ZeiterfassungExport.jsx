// src/components/Zeiterfassung/ZeiterfassungExport.jsx
import { useState, useEffect } from 'react'
import './Zeiterfassung.css'

const API = 'http://localhost:5000/api'

// ✅ FIX: Lokale Datumsformatierung statt toISOString() (verhindert UTC-Verschiebung)
const toLocalDateStr = (d) => {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function ZeiterfassungExport({ kundeId, kundeName, onClose }) {
  const heute = new Date()
  const ersterDiesesMonat = toLocalDateStr(new Date(heute.getFullYear(), heute.getMonth(), 1))
  const letzterDiesesMonat = toLocalDateStr(new Date(heute.getFullYear(), heute.getMonth() + 1, 0))

  const [periode, setPeriode] = useState('monat')
  const [von, setVon] = useState(ersterDiesesMonat)
  const [bis, setBis] = useState(letzterDiesesMonat)
  const [courtage, setCourtage] = useState('')
  const [courtage_beschreibung, setCourtage_beschreibung] = useState('')
  const [preview, setPreview] = useState(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [loadingExport, setLoadingExport] = useState(false)

  useEffect(() => {
    applyPeriode(periode)
  }, [periode])

  useEffect(() => {
    if (von && bis) fetchPreview()
  }, [von, bis, courtage])

  const applyPeriode = (p) => {
    const now = new Date()
    const year = now.getFullYear()
    let v, b

    if (p === 'monat') {
      v = new Date(year, now.getMonth(), 1)
      b = new Date(year, now.getMonth() + 1, 0)
    } else if (p === 'letzter_monat') {
      v = new Date(year, now.getMonth() - 1, 1)
      b = new Date(year, now.getMonth(), 0)
    } else if (p === 'q1') {
      v = new Date(year, 0, 1);  b = new Date(year, 2, 31)
    } else if (p === 'q2') {
      v = new Date(year, 3, 1);  b = new Date(year, 5, 30)
    } else if (p === 'q3') {
      v = new Date(year, 6, 1);  b = new Date(year, 8, 30)
    } else if (p === 'q4') {
      v = new Date(year, 9, 1);  b = new Date(year, 11, 31)
    } else if (p === 'jahr') {
      v = new Date(year, 0, 1);  b = new Date(year, 11, 31)
    } else {
      return // benutzerdefiniert — nicht überschreiben
    }

    // ✅ FIX: toLocalDateStr statt toISOString
    setVon(toLocalDateStr(v))
    setBis(toLocalDateStr(b))
  }

  const fetchPreview = async () => {
    setLoadingPreview(true)
    try {
      const token = localStorage.getItem('auth_token')
      const params = new URLSearchParams({ von, bis })
      const res = await fetch(`${API}/zeiterfassung/by-kunde/${kundeId}?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setPreview(data)
      }
    } catch (e) { console.error(e) }
    finally { setLoadingPreview(false) }
  }

  const handleExport = async () => {
    setLoadingExport(true)
    try {
      const token = localStorage.getItem('auth_token')
      const params = new URLSearchParams({
        von, bis, format: 'csv',
        courtage: courtage || '0',
        courtage_beschreibung: courtage_beschreibung || ''
      })

      const res = await fetch(`${API}/zeiterfassung/export/${kundeId}?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!res.ok) throw new Error('Export fehlgeschlagen')

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Beratungsrapport_${kundeName.replace(/[^a-z0-9]/gi, '_')}_${von}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (e) {
      alert('❌ Export fehlgeschlagen: ' + e.message)
    } finally {
      setLoadingExport(false)
    }
  }

  const formatMin = (min) => {
    if (!min) return '0 Min'
    const h = Math.floor(min / 60), m = min % 60
    if (h === 0) return `${m} Min`
    if (m === 0) return `${h}h`
    return `${h}h ${m}min`
  }

  const formatCHF = (val) => `CHF ${parseFloat(val || 0).toFixed(2)}`

  const courtageVal = parseFloat(courtage) || 0
  const totalKosten = preview ? (preview.total_kosten_chf || 0) : 0
  const totalGesamt = totalKosten + courtageVal

  const PERIODEN = [
    { key: 'monat', label: 'Dieser Monat' },
    { key: 'letzter_monat', label: 'Letzter Monat' },
    { key: 'q1', label: 'Q1' },
    { key: 'q2', label: 'Q2' },
    { key: 'q3', label: 'Q3' },
    { key: 'q4', label: 'Q4' },
    { key: 'jahr', label: 'Ganzes Jahr' },
    { key: 'custom', label: 'Benutzerdefiniert' }
  ]

  return (
    <div className="ze-modal-overlay" onClick={onClose}>
      <div className="ze-modal ze-modal-lg" onClick={e => e.stopPropagation()}>
        <div className="ze-modal-header">
          <h3>📥 Export Beratungsrapport</h3>
          <button className="ze-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="ze-modal-body">
          {/* Kunde */}
          <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 6, padding: '8px 14px', marginBottom: 16, fontSize: 13, color: '#0369a1', fontWeight: 600 }}>
            📋 {kundeName}
          </div>

          {/* Perioden-Buttons */}
          <div className="ze-form-group">
            <label>Periode</label>
            <div className="ze-periode-buttons">
              {PERIODEN.map(p => (
                <button
                  key={p.key}
                  type="button"
                  className={`ze-periode-btn${periode === p.key ? ' active' : ''}`}
                  onClick={() => setPeriode(p.key)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Von / Bis */}
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

          {/* Courtage */}
          <div className="ze-courtage-section">
            <h4>💰 Courtage für diese Periode</h4>
            <div className="ze-form-row">
              <div className="ze-form-group" style={{ marginBottom: 0 }}>
                <label>Betrag (CHF)</label>
                <input
                  type="number"
                  value={courtage}
                  onChange={e => setCourtage(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="ze-form-group" style={{ marginBottom: 0 }}>
                <label>Beschreibung (optional)</label>
                <input
                  type="text"
                  value={courtage_beschreibung}
                  onChange={e => setCourtage_beschreibung(e.target.value)}
                  placeholder="z.B. Jahresprämien 2026"
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          {loadingPreview ? (
            <div style={{ padding: '20px 0', textAlign: 'center', color: '#6b7280', fontSize: 13 }}>⏳ Vorschau wird geladen...</div>
          ) : preview && (
            <div className="ze-export-summary">
              <h4>📊 Vorschau</h4>
              <div className="ze-export-row">
                <span>Anzahl Einträge</span>
                <span>{preview.eintraege?.length || 0}</span>
              </div>
              <div className="ze-export-row">
                <span>Total Zeitaufwand</span>
                <span>{preview.total_formatiert}</span>
              </div>
              <div className="ze-export-row">
                <span>Beratungskosten</span>
                <span>{formatCHF(totalKosten)}</span>
              </div>
              {courtageVal > 0 && (
                <div className="ze-export-row">
                  <span>Courtage{courtage_beschreibung ? ` (${courtage_beschreibung})` : ''}</span>
                  <span>{formatCHF(courtageVal)}</span>
                </div>
              )}
              <div className="ze-export-row total">
                <span>TOTAL LEISTUNG</span>
                <span>{formatCHF(totalGesamt)}</span>
              </div>
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