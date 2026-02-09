import { useState, useEffect } from 'react'
import './VersicherungsorteManager.css'

function VersicherungsorteManager({ policeId, isEditMode }) {
  const [orte, setOrte] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({
    strasse: '',
    hausnummer: '',
    plz: '',
    ort: '',
    land: 'Schweiz',
    bemerkung: ''
  })

  useEffect(() => {
    if (policeId) {
      fetchOrte()
    } else {
      setLoading(false)
    }
  }, [policeId])

  const fetchOrte = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`http://localhost:5000/api/policen/${policeId}/versicherungsorte`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setOrte(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Fehler beim Laden der Versicherungsorte:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`http://localhost:5000/api/policen/${policeId}/versicherungsorte`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          strasse: '',
          hausnummer: '',
          plz: '',
          ort: '',
          land: 'Schweiz',
          bemerkung: ''
        })
      })

      if (response.ok) {
        const newOrt = await response.json()
        setOrte([...orte, newOrt])
        setEditingId(newOrt.id)
        setEditForm({
          strasse: '',
          hausnummer: '',
          plz: '',
          ort: '',
          land: 'Schweiz',
          bemerkung: ''
        })
      }
    } catch (error) {
      console.error('Fehler beim Hinzufügen des Versicherungsortes:', error)
    }
  }

  const handleEdit = (ort) => {
    setEditingId(ort.id)
    setEditForm({
      strasse: ort.strasse || '',
      hausnummer: ort.hausnummer || '',
      plz: ort.plz || '',
      ort: ort.ort || '',
      land: ort.land || 'Schweiz',
      bemerkung: ort.bemerkung || ''
    })
  }

  const handleSave = async (id) => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`http://localhost:5000/api/policen/${policeId}/versicherungsorte/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      })

      if (response.ok) {
        const updated = await response.json()
        setOrte(orte.map(o => o.id === id ? updated : o))
        setEditingId(null)
      }
    } catch (error) {
      console.error('Fehler beim Speichern des Versicherungsortes:', error)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Möchten Sie diesen Versicherungsort wirklich löschen?')) return

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`http://localhost:5000/api/policen/${policeId}/versicherungsorte/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        setOrte(orte.filter(o => o.id !== id))
      }
    } catch (error) {
      console.error('Fehler beim Löschen des Versicherungsortes:', error)
    }
  }

  const handleCancel = () => {
    setEditingId(null)
  }

  if (loading) {
    return <div style={{ padding: '1rem', color: '#999' }}>Lädt...</div>
  }

  if (!policeId) {
    return (
      <div className="versicherungsorte-manager">
        <div className="orte-header">
          <h4>Versicherungsorte</h4>
        </div>
        <div style={{ padding: '1rem', textAlign: 'center', color: '#999', fontSize: '0.85rem' }}>
          Bitte speichern Sie die Police zuerst.
        </div>
      </div>
    )
  }

  return (
    <div className="versicherungsorte-manager">
      <div className="orte-header">
        <h4>Versicherungsorte</h4>
        {isEditMode && policeId && (
          <button className="add-ort-btn" onClick={handleAdd}>
            + Standort hinzufügen
          </button>
        )}
      </div>

      <div className="orte-liste">
        {orte.map(ort => (
          <div key={ort.id} className="ort-card">
            {editingId === ort.id ? (
              <div className="ort-edit-form">
                <div className="form-row">
                  <div className="form-group" style={{ flex: 3 }}>
                    <label>Strasse</label>
                    <input
                      type="text"
                      value={editForm.strasse}
                      onChange={(e) => setEditForm({ ...editForm, strasse: e.target.value })}
                      placeholder="z.B. Musterstrasse"
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Nr.</label>
                    <input
                      type="text"
                      value={editForm.hausnummer}
                      onChange={(e) => setEditForm({ ...editForm, hausnummer: e.target.value })}
                      placeholder="123"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>PLZ</label>
                    <input
                      type="text"
                      value={editForm.plz}
                      onChange={(e) => setEditForm({ ...editForm, plz: e.target.value })}
                      placeholder="8000"
                    />
                  </div>
                  <div className="form-group" style={{ flex: 2 }}>
                    <label>Ort</label>
                    <input
                      type="text"
                      value={editForm.ort}
                      onChange={(e) => setEditForm({ ...editForm, ort: e.target.value })}
                      placeholder="Zürich"
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Land</label>
                    <input
                      type="text"
                      value={editForm.land}
                      onChange={(e) => setEditForm({ ...editForm, land: e.target.value })}
                      placeholder="Schweiz"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Bemerkung</label>
                  <input
                    type="text"
                    value={editForm.bemerkung}
                    onChange={(e) => setEditForm({ ...editForm, bemerkung: e.target.value })}
                    placeholder="Optionale Bemerkung"
                  />
                </div>

                <div className="edit-actions">
                  <button className="save-btn" onClick={() => handleSave(ort.id)}>✓ Speichern</button>
                  <button className="cancel-btn" onClick={handleCancel}>✕ Abbrechen</button>
                </div>
              </div>
            ) : (
              <div className="ort-view">
                <div className="ort-adresse">
                  <strong>{ort.strasse} {ort.hausnummer}</strong>
                  <div>{ort.plz} {ort.ort}</div>
                  {ort.land && ort.land !== 'Schweiz' && <div>{ort.land}</div>}
                  {ort.bemerkung && <div className="ort-bemerkung">{ort.bemerkung}</div>}
                </div>
                {isEditMode && (
                  <div className="ort-actions">
                    <button className="edit-btn" onClick={() => handleEdit(ort)}>✎</button>
                    <button className="delete-btn" onClick={() => handleDelete(ort.id)}>🗑</button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {orte.length === 0 && (
          <div style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>
            Keine Versicherungsorte erfasst
          </div>
        )}
      </div>
    </div>
  )
}

export default VersicherungsorteManager