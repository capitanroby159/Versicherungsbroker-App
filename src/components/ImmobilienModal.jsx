import React, { useState, useEffect } from 'react'
import './ImmobilienModal.css'

export default function ImmobilienModal({ immobilie, onSave, onClose, kundeId }) {
  // Select Options
  const IMMOBILIENART_OPTIONS = [
    'Einfamilienhaus', 'Reihenhaus', 'Doppeleinfamilienhaus', 'Mehrfamilienhaus',
    'Wohnung', 'Attikawohnung', 'Maisonettewohnung', 'Loft', 'Studio',
    'Ferienhaus', 'Ferienwohnung', 'Bauernhaus', 'Rustico', 'Villa', 'Chalet',
    'Wohn- und Geschäftshaus', 'Gewerbeobjekt', 'Bürofläche', 'Ladenfläche',
    'Praxis', 'Restaurant / Gastronomie', 'Hotel', 'Industriehalle', 'Lagerhalle',
    'Parkplatz', 'Garage', 'Bauland', 'Landwirtschaftsland',
    'Rekonstruktion / Sanierungsobjekt', 'Neubauprojekt', 'Sonstiges'
  ]

  const WOHNSTATUS_OPTIONS = [
    'Vermietung', 'Eigentümer', 'Stockwerkeigentümer', 'Mitbenutzer / Untermieter',
    'Wohngemeinschaft (WG)', 'Bei Eltern wohnend', 'Dienstwohnung',
    'Temporäre Unterkunft', 'Ferienwohnung', 'Zweitwohnsitz',
    'Betreutes Wohnen', 'Altersheim / Pflegeheim'
  ]

  const RENOVIERT_OPTIONS = ['Nein', 'teilrenoviert', 'komplett']

  const [formData, setFormData] = useState({
    strasse: '',
    hausnummer: '',
    plz: '',
    ort: '',
    immobilienart: '',
    wohnort_status: '',
    baujahr: '',
    renoviert: 'Nein',
    renovationsjahr: '',
    renovationsnotizen: '',
    kaufpreis: '',
    kaufjahr: '',
    gebaeudeversicherungswert: '',
    versicherungssumme: '',
    mietertrag_jaehrlich: '',
    beschreibung: ''
  })

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (immobilie) {
      setFormData({
        strasse: immobilie.strasse || '',
        hausnummer: immobilie.hausnummer || '',
        plz: immobilie.plz || '',
        ort: immobilie.ort || '',
        immobilienart: immobilie.immobilienart || '',
        wohnort_status: immobilie.wohnort_status || '',
        baujahr: immobilie.baujahr || '',
        renoviert: immobilie.renoviert || 'Nein',
        renovationsjahr: immobilie.renovationsjahr || '',
        renovationsnotizen: immobilie.renovationsnotizen || '',
        kaufpreis: immobilie.kaufpreis || '',
        kaufjahr: immobilie.kaufjahr || '',
        gebaeudeversicherungswert: immobilie.gebaeudeversicherungswert || '',
        versicherungssumme: immobilie.versicherungssumme || '',
        mietertrag_jaehrlich: immobilie.mietertrag_jaehrlich || '',
        beschreibung: immobilie.beschreibung || ''
      })
    }
  }, [immobilie])

  // Bedingte Sichtbarkeit
  const zeigRenovationsFelder = formData.renoviert && formData.renoviert !== 'Nein'
  const zeigMietertrag = formData.wohnort_status === 'Vermietung'

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const endpoint = immobilie?.id ? `/api/immobilien/${immobilie.id}` : '/api/immobilien'
      const method = immobilie?.id ? 'PUT' : 'POST'

      const payload = immobilie?.id 
        ? formData 
        : { ...formData, kunde_id: kundeId || immobilie?.kunde_id }

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.message || 'Fehler beim Speichern')
      }

      onSave()
    } catch (err) {
      setError(err.message)
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🏠 Immobilie {immobilie?.id ? 'bearbeiten' : 'erstellen'}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="immobilien-form">
          {error && <div className="error-message">❌ {error}</div>}

          {/* ADRESSE */}
          <fieldset>
            <legend>📍 Adresse</legend>
            <div className="form-row">
              <div className="form-group">
                <label>Strasse</label>
                <input type="text" name="strasse" value={formData.strasse} onChange={handleChange} placeholder="z.B. Franz-Zelgerstrasse" />
              </div>
              <div className="form-group">
                <label>Hausnummer</label>
                <input type="text" name="hausnummer" value={formData.hausnummer} onChange={handleChange} placeholder="z.B. 14" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>PLZ</label>
                <input type="text" name="plz" value={formData.plz} onChange={handleChange} placeholder="z.B. 6023" />
              </div>
              <div className="form-group">
                <label>Ort</label>
                <input type="text" name="ort" value={formData.ort} onChange={handleChange} placeholder="z.B. Rothenburg" />
              </div>
            </div>
          </fieldset>

          {/* IMMOBILIENTYP & STATUS */}
          <fieldset>
            <legend>🏘️ Immobilientyp & Status</legend>
            <div className="form-row">
              <div className="form-group">
                <label>Immobilienart *</label>
                <select name="immobilienart" value={formData.immobilienart} onChange={handleChange} required>
                  <option value="">-- Bitte wählen --</option>
                  {IMMOBILIENART_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Wohnstatus *</label>
                <select name="wohnort_status" value={formData.wohnort_status} onChange={handleChange} required>
                  <option value="">-- Bitte wählen --</option>
                  {WOHNSTATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>
          </fieldset>

          {/* BAUJAHR & RENOVIERUNG */}
          <fieldset>
            <legend>🔨 Baujahr & Renovierung</legend>
            <div className="form-row">
              <div className="form-group">
                <label>Baujahr</label>
                <input type="number" name="baujahr" value={formData.baujahr} onChange={handleChange} placeholder="z.B. 2000" />
              </div>
              <div className="form-group">
                <label>Renoviert *</label>
                <select name="renoviert" value={formData.renoviert} onChange={handleChange} required>
                  {RENOVIERT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>

            {/* BEDINGTE FELDER */}
            {zeigRenovationsFelder && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label>Renovationsjahr</label>
                    <input type="number" name="renovationsjahr" value={formData.renovationsjahr} onChange={handleChange} placeholder="z.B. 2024" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Renovationsnotizen</label>
                  <textarea name="renovationsnotizen" value={formData.renovationsnotizen} onChange={handleChange} placeholder="z.B. Dach erneuert, Fenster ausgetauscht..." rows="3" />
                </div>
              </>
            )}
          </fieldset>

          {/* FINANZIELLES */}
          <fieldset>
            <legend>💰 Finanzielle Informationen</legend>
            <div className="form-row">
              <div className="form-group">
                <label>Kaufpreis (CHF)</label>
                <input type="number" name="kaufpreis" value={formData.kaufpreis} onChange={handleChange} placeholder="z.B. 1200000" step="100" />
              </div>
              <div className="form-group">
                <label>Kaufjahr</label>
                <input type="number" name="kaufjahr" value={formData.kaufjahr} onChange={handleChange} placeholder="z.B. 2024" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Gebäudeversicherungswert (CHF)</label>
                <input type="number" name="gebaeudeversicherungswert" value={formData.gebaeudeversicherungswert} onChange={handleChange} placeholder="z.B. 1500000" step="100" />
              </div>
              <div className="form-group">
                <label>Versicherungssumme (CHF)</label>
                <input type="number" name="versicherungssumme" value={formData.versicherungssumme} onChange={handleChange} placeholder="z.B. 1000000" step="100" />
              </div>
            </div>

            {/* BEDINGTE MIETERTRAG */}
            {zeigMietertrag && (
              <div className="form-group highlight-field">
                <label>💵 Jährlicher Mietertrag (CHF)</label>
                <input type="number" name="mietertrag_jaehrlich" value={formData.mietertrag_jaehrlich} onChange={handleChange} placeholder="z.B. 24000" step="100" />
              </div>
            )}
          </fieldset>

          {/* BESCHREIBUNG */}
          <fieldset>
            <legend>📝 Notizen</legend>
            <div className="form-group">
              <label>Beschreibung</label>
              <textarea name="beschreibung" value={formData.beschreibung} onChange={handleChange} placeholder="Allgemeine Notizen..." rows="4" />
            </div>
          </fieldset>

          {/* BUTTONS */}
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-cancel">Abbrechen</button>
            <button type="submit" disabled={loading} className="btn-save">{loading ? 'Speichern...' : 'Speichern'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
