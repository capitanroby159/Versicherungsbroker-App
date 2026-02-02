// src/components/Aktivitaeten/AktivitaetForm.jsx
import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import './AktivitaetForm.css'

export default function AktivitaetForm({ 
  onSave, 
  onCancel, 
  kundeId = null,
  projekt_id = null
}) {
  const heute = format(new Date(), 'yyyy-MM-dd')
  
  const [formData, setFormData] = useState({
    titel: '',
    beschreibung: '',
    typ: 'Notiz',
    richtung: 'Intern',
    prioritaet: 'Normal',
    status: 'Geplant',
    datum_erstellt: heute,
    datum: heute,
    uhrzeit: '09:00',
    ort: '',
    kunde_id: kundeId || '',
    gespraechspartner_typ: '',
    versicherer_id: '',
    ansprechpartner_id: '',
    projekt_id: projekt_id || null,
    anhang: null
  })

  const [kunden, setKunden] = useState([])
  const [versicherer, setVersicherer] = useState([])
  const [ansprechpartner, setAnsprechpartner] = useState([])
  const [loading, setLoading] = useState(false)
  const [showNewAnsprechpartner, setShowNewAnsprechpartner] = useState(false)
  const [newAnsprechpartner, setNewAnsprechpartner] = useState({
    vorname: '',
    nachname: '',
    position: '',
    email: '',
    telefon: ''
  })
  const [anhangFile, setAnhangFile] = useState(null)
  const [anhangFileName, setAnhangFileName] = useState('')

  useEffect(() => {
    fetchKunden()
    fetchVersicherer()
  }, [])

  useEffect(() => {
    if (formData.versicherer_id) {
      fetchAnsprechpartner(formData.versicherer_id)
    } else {
      setAnsprechpartner([])
    }
  }, [formData.versicherer_id])

  const fetchKunden = async () => {
    try {
      // ✅ PORT 5000!
      const res = await fetch('http://localhost:5000/api/kunden')
      const data = await res.json()
      setKunden(data)
    } catch (error) {
      console.error('❌ Fehler beim Laden der Kunden:', error)
    }
  }

  const fetchVersicherer = async () => {
    try {
      // ✅ PORT 5000!
      const res = await fetch('http://localhost:5000/api/versicherer')
      const data = await res.json()
      setVersicherer(data)
    } catch (error) {
      console.error('❌ Fehler beim Laden der Versicherer:', error)
    }
  }

  const fetchAnsprechpartner = async (versichererId) => {
    try {
      // ✅ PORT 5000!
      const res = await fetch(`http://localhost:5000/api/versicherer/${versichererId}/kontakte`)
      if (res.ok) {
        const data = await res.json()
        setAnsprechpartner(data)
      }
    } catch (error) {
      console.error('❌ Fehler beim Laden der Ansprechpartner:', error)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleGespraechspartnerChange = (e) => {
    const value = e.target.value
    setFormData(prev => ({
      ...prev,
      gespraechspartner_typ: value,
      versicherer_id: '',
      ansprechpartner_id: ''
    }))
  }

  const handleAnhangChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('❌ Datei zu groß! Max. 10MB.')
        return
      }
      setAnhangFile(file)
      setAnhangFileName(file.name)
    }
  }

  const handleCreateNewAnsprechpartner = async () => {
    if (!newAnsprechpartner.vorname || !newAnsprechpartner.nachname || !newAnsprechpartner.email) {
      alert('Vorname, Nachname und Email sind erforderlich')
      return
    }

    try {
      // ✅ PORT 5000!
      const res = await fetch(
        `http://localhost:5000/api/versicherer/${formData.versicherer_id}/kontakte`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newAnsprechpartner)
        }
      )

      if (!res.ok) throw new Error('Fehler beim Erstellen')

      const result = await res.json()
      
      const updatedAnsprechpartner = [
        ...ansprechpartner,
        {
          id: result.id,
          ...newAnsprechpartner
        }
      ]
      setAnsprechpartner(updatedAnsprechpartner)
      
      setFormData(prev => ({
        ...prev,
        ansprechpartner_id: result.id
      }))

      setShowNewAnsprechpartner(false)
      setNewAnsprechpartner({
        vorname: '',
        nachname: '',
        position: '',
        email: '',
        telefon: ''
      })

      alert('✅ Ansprechperson erstellt!')
    } catch (error) {
      console.error('❌ Fehler:', error)
      alert('❌ Ansprechperson konnte nicht erstellt werden: ' + error.message)
    }
  }

  const exportToCalendar = () => {
    if (!formData.titel.trim()) {
      alert('❌ Titel ist erforderlich')
      return
    }

    if (formData.typ !== 'Meeting') {
      alert('⚠️ Nur Meetings können in den Kalender exportiert werden!')
      return
    }

    const startDateTime = `${formData.datum.replace(/-/g, '')}T${formData.uhrzeit.replace(':', '')}00`
    const [stundStr, minStr] = formData.uhrzeit.split(':')
    const stundenInt = parseInt(stundStr) + 1
    const endDateTime = `${formData.datum.replace(/-/g, '')}T${String(stundenInt).padStart(2, '0')}${minStr}00`

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Versicherungsbroker-App//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Versicherungsbroker Termine
X-WR-TIMEZONE:Europe/Zurich
BEGIN:VEVENT
UID:${Date.now()}-${Math.random().toString(36).substr(2, 9)}@versicherungsbroker
DTSTAMP:${new Date().toISOString().replace(/[-:.]/g, '').split('Z')[0]}Z
DTSTART:${startDateTime}
DTEND:${endDateTime}
SUMMARY:${formData.titel}
DESCRIPTION:${formData.beschreibung ? formData.beschreibung.replace(/\n/g, '\\n') : 'Meeting'}
LOCATION:${formData.ort || 'TBD'}
PRIORITY:${formData.prioritaet === 'Kritisch' ? '1' : formData.prioritaet === 'Hoch' ? '3' : '5'}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`

    const element = document.createElement('a')
    element.setAttribute('href', 'data:text/calendar;charset=utf-8,' + encodeURIComponent(icsContent))
    element.setAttribute('download', `${formData.titel.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)

    alert('✅ Kalenderdatei heruntergeladen!')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.titel.trim()) {
      alert('Titel ist erforderlich')
      return
    }

    setLoading(true)
    try {
      if (anhangFile) {
        const formDataObj = new FormData()
        formDataObj.append('file', anhangFile)
        formDataObj.append('aktivitaet_data', JSON.stringify({
          ...formData,
          kunde_id: formData.kunde_id ? parseInt(formData.kunde_id) : null,
          versicherer_id: formData.versicherer_id ? parseInt(formData.versicherer_id) : null,
          ansprechpartner_id: formData.ansprechpartner_id ? parseInt(formData.ansprechpartner_id) : null,
          projekt_id: formData.projekt_id ? parseInt(formData.projekt_id) : null,
          erstellt_von: 'Benutzer'
        }))

        // ✅ PORT 5000!
        const res = await fetch('http://localhost:5000/api/aktivitaeten/with-file', {
          method: 'POST',
          body: formDataObj
        })

        if (!res.ok) throw new Error('Fehler beim Erstellen mit Datei')
      } else {
        // ✅ PORT 5000!
        const res = await fetch('http://localhost:5000/api/aktivitaeten', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            kunde_id: formData.kunde_id ? parseInt(formData.kunde_id) : null,
            versicherer_id: formData.versicherer_id ? parseInt(formData.versicherer_id) : null,
            ansprechpartner_id: formData.ansprechpartner_id ? parseInt(formData.ansprechpartner_id) : null,
            projekt_id: formData.projekt_id ? parseInt(formData.projekt_id) : null,
            erstellt_von: 'Benutzer'
          })
        })

        if (!res.ok) throw new Error('Fehler beim Erstellen')
      }
      
      alert('✅ Aktivität erstellt!')
      onSave()
    } catch (error) {
      console.error('❌ Fehler:', error)
      alert('❌ Fehler: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="activity-form-container">
      <div className="form-overlay" onClick={onCancel}></div>
      
      <form onSubmit={handleSubmit} className="activity-form">
        <h2>📝 Neue Aktivität erstellen</h2>

        <div className="form-group">
          <label>Titel *</label>
          <input
            type="text"
            name="titel"
            value={formData.titel}
            onChange={handleChange}
            placeholder="z.B. 'Angebot besprechen mit Müller'"
            required
          />
        </div>

        <div className="form-group">
          <label>Beschreibung</label>
          <textarea
            name="beschreibung"
            value={formData.beschreibung}
            onChange={handleChange}
            placeholder="Notizen zur Aktivität..."
            rows="3"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Typ</label>
            <select name="typ" value={formData.typ} onChange={handleChange}>
              <option>Anruf</option>
              <option>Email</option>
              <option>Meeting</option>
              <option>Aufgabe</option>
              <option>Notiz</option>
              <option>Angebot</option>
            </select>
          </div>

          {formData.typ !== 'Meeting' && (
            <div className="form-group">
              <label>Richtung</label>
              <select name="richtung" value={formData.richtung} onChange={handleChange}>
                <option>Eingehend</option>
                <option>Ausgehend</option>
                <option>Intern</option>
              </select>
            </div>
          )}

          {formData.typ === 'Meeting' && (
            <div className="form-group">
              <label>📍 Ort / Adresse</label>
              <input
                type="text"
                name="ort"
                value={formData.ort}
                onChange={handleChange}
                placeholder="z.B. 'AXA Büro, Zürich' oder 'Telefon'"
              />
            </div>
          )}

          <div className="form-group">
            <label>Priorität</label>
            <select name="prioritaet" value={formData.prioritaet} onChange={handleChange}>
              <option>Kritisch</option>
              <option>Hoch</option>
              <option>Normal</option>
              <option>Niedrig</option>
            </select>
          </div>
        </div>

        <div className="form-group" style={{backgroundColor: '#f0fdf4', padding: '12px', borderRadius: '6px', marginBottom: '15px'}}>
          <label>📅 Erstellungsdatum</label>
          <p style={{margin: '8px 0', fontSize: '14px', color: '#166534', fontWeight: '500'}}>
            {format(new Date(formData.datum_erstellt), 'dd. MMMM yyyy')}
          </p>
          <span style={{fontSize: '12px', color: '#4b5563'}}>Auto-gesetzt (nicht bearbeitbar)</span>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>📅 Datum</label>
            <input
              type="date"
              name="datum"
              value={formData.datum}
              onChange={handleChange}
            />
          </div>

          {formData.typ === 'Meeting' && (
            <div className="form-group">
              <label>🕐 Uhrzeit</label>
              <input
                type="time"
                name="uhrzeit"
                value={formData.uhrzeit}
                onChange={handleChange}
              />
            </div>
          )}

          <div className="form-group">
            <label>Status</label>
            <select name="status" value={formData.status} onChange={handleChange}>
              <option>Geplant</option>
              <option>In Bearbeitung</option>
              <option>Abgeschlossen</option>
              <option>Abgebrochen</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Kunde {kundeId ? '(vorgesetzt)' : '(optional)'}</label>
            <select 
              name="kunde_id" 
              value={formData.kunde_id} 
              onChange={handleChange}
              disabled={!!kundeId}
            >
              <option value="">-- Kein Kunde --</option>
              {kunden.map(k => (
                <option key={k.id} value={k.id}>
                  {k.vorname} {k.nachname}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Gesprächspartner</label>
            <select 
              name="gespraechspartner_typ" 
              value={formData.gespraechspartner_typ} 
              onChange={handleGespraechspartnerChange}
            >
              <option value="">-- Kein Gesprächspartner --</option>
              <option value="Versicherer">Versicherer</option>
            </select>
          </div>
        </div>

        {formData.gespraechspartner_typ === 'Versicherer' && (
          <div className="form-row">
            <div className="form-group">
              <label>Versicherer *</label>
              <select 
                name="versicherer_id" 
                value={formData.versicherer_id} 
                onChange={handleChange}
                required
              >
                <option value="">-- Bitte Versicherer wählen --</option>
                {versicherer.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Ansprechpartner (optional)</label>
              <div style={{display: 'flex', gap: '8px'}}>
                <select 
                  name="ansprechpartner_id" 
                  value={formData.ansprechpartner_id} 
                  onChange={handleChange}
                  disabled={!formData.versicherer_id}
                  style={{flex: 1}}
                >
                  <option value="">-- Kein Ansprechpartner --</option>
                  {ansprechpartner.map(ap => (
                    <option key={ap.id} value={ap.id}>
                      {ap.vorname} {ap.nachname} ({ap.position})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowNewAnsprechpartner(true)}
                  disabled={!formData.versicherer_id}
                  className="btn-icon-add"
                >
                  ➕
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="form-group">
          <label>📎 Anhang (optional)</label>
          <input
            type="file"
            onChange={handleAnhangChange}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip"
          />
          {anhangFileName && (
            <div style={{fontSize: '13px', color: '#059669', marginTop: '8px'}}>
              ✅ Datei: {anhangFileName}
            </div>
          )}
        </div>

        {projekt_id && (
          <div className="form-group" style={{backgroundColor: '#f0fdf4', padding: '10px', borderRadius: '4px'}}>
            <label>✓ Mit Projekt verknüpft</label>
            <div style={{color: '#166534', fontSize: '14px'}}>
              Projekt-ID: {projekt_id}
            </div>
          </div>
        )}

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Abbrechen
          </button>
          
          <div className="form-actions-right">
            {formData.typ === 'Meeting' && (
              <button 
                type="button" 
                className="btn btn-calendar"
                onClick={exportToCalendar}
              >
                📅 Zu Kalender exportieren
              </button>
            )}
            
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '⏳ Wird erstellt...' : '✓ Aktivität erstellen'}
            </button>
          </div>
        </div>

        {showNewAnsprechpartner && (
          <div className="mini-modal-overlay">
            <div className="mini-modal">
              <h3>➕ Neue Ansprechperson hinzufügen</h3>
              
              <div className="form-group">
                <label>Vorname *</label>
                <input
                  type="text"
                  value={newAnsprechpartner.vorname}
                  onChange={(e) => setNewAnsprechpartner({...newAnsprechpartner, vorname: e.target.value})}
                  placeholder="z.B. Anna"
                />
              </div>

              <div className="form-group">
                <label>Nachname *</label>
                <input
                  type="text"
                  value={newAnsprechpartner.nachname}
                  onChange={(e) => setNewAnsprechpartner({...newAnsprechpartner, nachname: e.target.value})}
                  placeholder="z.B. Müller"
                />
              </div>

              <div className="form-group">
                <label>Position</label>
                <input
                  type="text"
                  value={newAnsprechpartner.position}
                  onChange={(e) => setNewAnsprechpartner({...newAnsprechpartner, position: e.target.value})}
                  placeholder="z.B. Schadensachbearbeiterin"
                />
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={newAnsprechpartner.email}
                  onChange={(e) => setNewAnsprechpartner({...newAnsprechpartner, email: e.target.value})}
                  placeholder="email@example.ch"
                />
              </div>

              <div className="form-group">
                <label>Telefon</label>
                <input
                  type="tel"
                  value={newAnsprechpartner.telefon}
                  onChange={(e) => setNewAnsprechpartner({...newAnsprechpartner, telefon: e.target.value})}
                  placeholder="+41 44 123 45 67"
                />
              </div>

              <div className="mini-modal-actions">
                <button 
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowNewAnsprechpartner(false)
                    setNewAnsprechpartner({
                      vorname: '',
                      nachname: '',
                      position: '',
                      email: '',
                      telefon: ''
                    })
                  }}
                >
                  Abbrechen
                </button>
                <button 
                  type="button"
                  className="btn btn-primary"
                  onClick={handleCreateNewAnsprechpartner}
                >
                  ✓ Erstellen & Auswählen
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}