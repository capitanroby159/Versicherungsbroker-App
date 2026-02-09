import { useState, useEffect } from 'react'
import ZusatzdeckungKatalogModal from './ZusatzdeckungKatalogModal'
import './ZusatzdeckungenManager.css'

function ZusatzdeckungenManager({ policeId, versichererId, sparteId, isEditMode }) {
  const [deckungen, setDeckungen] = useState([])
  const [loading, setLoading] = useState(true)
  const [showKatalogModal, setShowKatalogModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ deckung: '', garantiesumme: '', selbstbehalt: '' })

  useEffect(() => {
    if (policeId) {
      fetchDeckungen()
    } else {
      setLoading(false)
    }
  }, [policeId])

  const fetchDeckungen = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`http://localhost:5000/api/policen/${policeId}/zusatzdeckungen`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setDeckungen(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Fehler beim Laden der Zusatzdeckungen:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleKatalogSelect = (newDeckung) => {
    setDeckungen([...deckungen, newDeckung])
    setShowKatalogModal(false)
  }

  const handleEdit = (deckung) => {
    setEditingId(deckung.id)
    setEditForm({
      deckung: deckung.deckung,
      garantiesumme: deckung.garantiesumme || '',
      selbstbehalt: deckung.selbstbehalt || 'Grundselbstbehalt'
    })
  }

  const handleSave = async (id) => {
    try {
      const token = localStorage.getItem('auth_token')

      const response = await fetch(`http://localhost:5000/api/policen/${policeId}/zusatzdeckungen/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          deckung: editForm.deckung,
          garantiesumme: editForm.garantiesumme || null,
          selbstbehalt: editForm.selbstbehalt || 'Grundselbstbehalt'
        })
      })

      if (response.ok) {
        const updated = await response.json()
        setDeckungen(deckungen.map(d => d.id === id ? updated : d))
        setEditingId(null)
      }
    } catch (error) {
      console.error('Fehler beim Speichern der Zusatzdeckung:', error)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Möchten Sie diese Zusatzdeckung wirklich löschen?')) {
      return
    }

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`http://localhost:5000/api/policen/${policeId}/zusatzdeckungen/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        setDeckungen(deckungen.filter(d => d.id !== id))
      }
    } catch (error) {
      console.error('Fehler beim Löschen der Zusatzdeckung:', error)
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditForm({ deckung: '', garantiesumme: '', selbstbehalt: '' })
  }

  if (loading) {
    return <div style={{ padding: '1rem', color: '#999' }}>Lädt...</div>
  }

  if (!policeId) {
    return (
      <div className="zusatzdeckungen-manager">
        <div className="zusatzdeckungen-header">
          <h4>Zusatzdeckungen</h4>
        </div>
        <div style={{ padding: '1rem', textAlign: 'center', color: '#999', fontSize: '0.85rem' }}>
          Bitte speichern Sie die Police zuerst, um Zusatzdeckungen hinzuzufügen.
        </div>
      </div>
    )
  }

  return (
    <div className="zusatzdeckungen-manager">
      <div className="zusatzdeckungen-header">
        <h4>Zusatzdeckungen</h4>
        {isEditMode && policeId && (
          <button className="add-deckung-btn" onClick={() => setShowKatalogModal(true)}>
            + Aus Katalog wählen
          </button>
        )}
      </div>

      <table className="zusatzdeckungen-table">
        <thead>
          <tr>
            <th style={{ width: '35%' }}>Deckung</th>
            <th style={{ width: '30%' }}>Garantiesumme</th>
            <th style={{ width: '25%' }}>Selbstbehalt</th>
            {isEditMode && <th style={{ width: '10%' }}></th>}
          </tr>
        </thead>
        <tbody>
          {deckungen.map(deckung => (
            <tr key={deckung.id}>
              {editingId === deckung.id ? (
                <>
                  <td>
                    <input
                      type="text"
                      value={editForm.deckung}
                      onChange={(e) => setEditForm({ ...editForm, deckung: e.target.value })}
                      className="table-input"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={editForm.garantiesumme}
                      onChange={(e) => setEditForm({ ...editForm, garantiesumme: e.target.value })}
                      className="table-input"
                      placeholder="z.B. CHF 1'000'000 oder 10% der Grunddeckung"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={editForm.selbstbehalt}
                      onChange={(e) => setEditForm({ ...editForm, selbstbehalt: e.target.value })}
                      className="table-input"
                      placeholder="z.B. Grundselbstbehalt"
                    />
                  </td>
                  <td>
                    <button className="save-btn" onClick={() => handleSave(deckung.id)}>✓</button>
                    <button className="cancel-btn" onClick={handleCancel}>✕</button>
                  </td>
                </>
              ) : (
                <>
                  <td>{deckung.deckung}</td>
                  <td>{deckung.garantiesumme || '-'}</td>
                  <td>{deckung.selbstbehalt || 'Grundselbstbehalt'}</td>
                  {isEditMode && (
                    <td>
                      <button className="edit-btn" onClick={() => handleEdit(deckung)}>✎</button>
                      <button className="delete-btn" onClick={() => handleDelete(deckung.id)}>🗑</button>
                    </td>
                  )}
                </>
              )}
            </tr>
          ))}
          {deckungen.length === 0 && (
            <tr>
              <td colSpan={isEditMode ? 4 : 3} style={{ textAlign: 'center', color: '#999', padding: '1rem' }}>
                Keine Zusatzdeckungen vorhanden
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* KATALOG MODAL */}
      {showKatalogModal && (
        <ZusatzdeckungKatalogModal
          policeId={policeId}
          versichererId={versichererId}
          sparteId={sparteId}
          onClose={() => setShowKatalogModal(false)}
          onSelect={handleKatalogSelect}
        />
      )}
    </div>
  )
}

export default ZusatzdeckungenManager