// src/components/Zeiterfassung/KundenZeiterfassung.jsx
import { useState, useEffect } from 'react'
import ZeiterfassungForm from './ZeiterfassungForm'
import ZeiterfassungExport from './ZeiterfassungExport'
import './Zeiterfassung.css'

const API = 'http://localhost:5000/api'

export default function KundenZeiterfassung({ kundeId, kundeName = 'Kunde' }) {
  const [daten, setDaten] = useState({ eintraege: [], total_minuten: 0, total_formatiert: '0 Min', total_kosten_chf: 0 })
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [editEintrag, setEditEintrag] = useState(null)
  const [sparten, setSparten] = useState([])
  const [mitarbeiter, setMitarbeiter] = useState([])

  // Filter
  const [filterVon, setFilterVon] = useState('')
  const [filterBis, setFilterBis] = useState('')
  const [filterSparte, setFilterSparte] = useState('')
  const [filterArt, setFilterArt] = useState('')
  const [filterMitarbeiter, setFilterMitarbeiter] = useState('')

  useEffect(() => {
    fetchDaten()
    fetchSparten()
    fetchMitarbeiter()
  }, [kundeId])

  const fetchDaten = async (filters = {}) => {
    setLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      const params = new URLSearchParams()
      if (filters.von ?? filterVon)           params.append('von', filters.von ?? filterVon)
      if (filters.bis ?? filterBis)           params.append('bis', filters.bis ?? filterBis)
      if (filters.sparte !== undefined ? filters.sparte : filterSparte)
        params.append('sparte_id', filters.sparte ?? filterSparte)
      if (filters.art ?? filterArt)           params.append('art', filters.art ?? filterArt)
      if (filters.mitarbeiter ?? filterMitarbeiter)
        params.append('mitarbeiter_id', filters.mitarbeiter ?? filterMitarbeiter)

      const res = await fetch(`${API}/zeiterfassung/by-kunde/${kundeId}?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (res.ok) setDaten(await res.json())
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const fetchSparten = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`${API}/sparten`, { headers: { 'Authorization': `Bearer ${token}` } })
      if (res.ok) setSparten(await res.json())
    } catch (e) {}
  }

  const fetchMitarbeiter = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`${API}/benutzer`, { headers: { 'Authorization': `Bearer ${token}` } })
      if (res.ok) setMitarbeiter(await res.json())
    } catch (e) {}
  }

  const handleFilter = () => fetchDaten({
    von: filterVon, bis: filterBis, sparte: filterSparte, art: filterArt, mitarbeiter: filterMitarbeiter
  })

  const handleReset = () => {
    setFilterVon(''); setFilterBis(''); setFilterSparte(''); setFilterArt(''); setFilterMitarbeiter('')
    fetchDaten({ von: '', bis: '', sparte: '', art: '', mitarbeiter: '' })
  }

  const handleDelete = async (id) => {
    if (!confirm('Eintrag wirklich löschen?')) return
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`${API}/zeiterfassung/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) fetchDaten()
      else alert('❌ Löschen fehlgeschlagen')
    } catch (e) { alert('❌ ' + e.message) }
  }

  const formatDatum = (d) => d ? new Date(d).toLocaleDateString('de-CH') : '-'
  const formatCHF   = (v) => `CHF ${parseFloat(v || 0).toFixed(2)}`

  // ✅ Administration hinzugefügt
  const artIcons = {
    Anruf: '📞',
    Korrespondenz: '📧',
    Termin: '📅',
    Fahrt: '🚗',
    Administration: '🗂️'
  }

  return (
    <div className="zeiterfassung-wrap">

      {/* ── Header ── */}
      <div className="ze-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h3 className="ze-header-title">⏱ Zeiterfassung</h3>
          <div className="ze-totals">
            <span className="ze-total-badge zeit">🕐 {daten.total_formatiert}</span>
            <span className="ze-total-badge kosten">💰 {formatCHF(daten.total_kosten_chf)}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="ze-btn secondary" onClick={() => setShowExport(true)}>
            📥 Exportieren
          </button>
          <button className="ze-btn primary" onClick={() => { setEditEintrag(null); setShowForm(true) }}>
            + Erfassen
          </button>
        </div>
      </div>

      {/* ── Filter ── */}
      <div className="ze-filter-bar">
        <div className="ze-filter-group">
          <label>Von</label>
          <input type="date" value={filterVon} onChange={e => setFilterVon(e.target.value)} />
        </div>
        <div className="ze-filter-group">
          <label>Bis</label>
          <input type="date" value={filterBis} onChange={e => setFilterBis(e.target.value)} />
        </div>
        <div className="ze-filter-group">
          <label>Sparte</label>
          <select value={filterSparte} onChange={e => setFilterSparte(e.target.value)}>
            <option value="">Alle</option>
            <option value="null">Allgemein</option>
            {sparten.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="ze-filter-group">
          <label>Art</label>
          <select value={filterArt} onChange={e => setFilterArt(e.target.value)}>
            <option value="">Alle</option>
            <option>Anruf</option>
            <option>Korrespondenz</option>
            <option>Administration</option>
            <option>Termin</option>
            <option>Fahrt</option>
          </select>
        </div>
        <div className="ze-filter-group">
          <label>Mitarbeiter</label>
          <select value={filterMitarbeiter} onChange={e => setFilterMitarbeiter(e.target.value)}>
            <option value="">Alle</option>
            {mitarbeiter.map(m => (
              <option key={m.id} value={m.id}>{m.vorname} {m.nachname}</option>
            ))}
          </select>
        </div>
        <div className="ze-filter-actions">
          <button className="ze-btn primary" onClick={handleFilter}>🔍 Filtern</button>
          <button className="ze-btn secondary" onClick={handleReset}>✕ Reset</button>
        </div>
      </div>

      {/* ── Tabelle ── */}
      {loading ? (
        <div className="ze-empty">⏳ Wird geladen...</div>
      ) : (
        <div className="ze-table-wrap">
          <table className="ze-table">
            <thead>
              <tr>
                <th>Datum</th>
                <th>Mitarbeiter</th>
                <th>Sparte</th>
                <th>Art</th>
                <th>Aktivität</th>
                <th className="col-right">Min</th>
                <th className="col-right">CHF/h</th>
                <th className="col-right">Kosten</th>
                <th className="col-center">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {daten.eintraege.length === 0 ? (
                <tr>
                  <td colSpan={9} className="ze-empty">
                    Keine Einträge {filterVon || filterBis || filterSparte || filterArt ? 'für diese Filter' : ''}
                  </td>
                </tr>
              ) : (
                <>
                  {daten.eintraege.map(e => (
                    <tr key={e.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatDatum(e.datum)}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{e.mitarbeiter_name}</div>
                        {e.mitarbeiter_funktion && e.mitarbeiter_funktion !== '-' && (
                          <div style={{ fontSize: 11, color: '#9ca3af' }}>{e.mitarbeiter_funktion}</div>
                        )}
                      </td>
                      <td>{e.sparte_name}</td>
                      <td>
                        {/* ✅ Administration badge wird jetzt korrekt gerendert */}
                        <span className={`ze-art-badge ${e.art}`}>
                          {artIcons[e.art] || '📌'} {e.art}
                        </span>
                      </td>
                      <td style={{ maxWidth: 220 }}>
                        <span style={{ fontSize: 12, color: '#374151', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {e.aktivitaet || <span style={{ color: '#d1d5db' }}>—</span>}
                        </span>
                      </td>
                      <td className="col-right" style={{ whiteSpace: 'nowrap' }}>{e.zeit_minuten}'</td>
                      <td className="col-right" style={{ fontSize: 12, color: '#6b7280' }}>
                        {parseFloat(e.stundenansatz_snapshot || 0).toFixed(0)}.-
                      </td>
                      <td className="col-right" style={{ whiteSpace: 'nowrap', fontWeight: 600, color: '#059669' }}>
                        {formatCHF(e.kosten_chf)}
                      </td>
                      <td className="col-center">
                        <div className="ze-row-actions" style={{ justifyContent: 'center' }}>
                          <button
                            className="ze-btn-icon edit"
                            title="Bearbeiten"
                            onClick={() => { setEditEintrag(e); setShowForm(true) }}
                          >✏️</button>
                          <button
                            className="ze-btn-icon delete"
                            title="Löschen"
                            onClick={() => handleDelete(e.id)}
                          >🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {/* Total-Zeile */}
                  <tr className="ze-total-row">
                    <td colSpan={5} style={{ fontWeight: 700 }}>TOTAL</td>
                    <td className="col-right">{daten.total_minuten}'</td>
                    <td></td>
                    <td className="col-right">{formatCHF(daten.total_kosten_chf)}</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td colSpan={9} style={{ fontSize: 11, color: '#9ca3af', padding: '6px 14px', background: '#f8fafc' }}>
                      ⏱ {daten.total_formatiert} Gesamtaufwand • Stundenansatz eingefroren bei Erstellung
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modals ── */}
      {showForm && (
        <ZeiterfassungForm
          kundeId={kundeId}
          eintrag={editEintrag}
          onSave={() => { setShowForm(false); setEditEintrag(null); fetchDaten() }}
          onCancel={() => { setShowForm(false); setEditEintrag(null) }}
        />
      )}

      {showExport && (
        <ZeiterfassungExport
          kundeId={kundeId}
          kundeName={kundeName}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  )
}