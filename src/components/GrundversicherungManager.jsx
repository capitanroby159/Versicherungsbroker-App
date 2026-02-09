import { useState, useEffect } from 'react'
import { SmartNumberInput } from '../utils/numberFormatter'
import { formatSwissNumber } from '../utils/numberFormatter'
import './GrundversicherungManager.css'

function GrundversicherungManager({ policeId, inventar, mfzGesamt, isEditMode }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const vw_gesamt = (parseFloat(inventar?.replace(/'/g, '') || 0) + parseFloat(mfzGesamt?.replace(/'/g, '') || 0))

  useEffect(() => {
    if (policeId) {
      fetchItems()
    } else {
      setLoading(false)
    }
  }, [policeId])

  const fetchItems = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`http://localhost:5000/api/policen/${policeId}/grundversicherung`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setItems(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Fehler beim Laden der Grundversicherung:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleArt = async (item) => {
    if (!isEditMode) return

    const newArt = item.art === 'VW' ? 'ER' : 'VW'
    const newVersicherungssumme = newArt === 'VW' 
      ? `Gemäss VW (CHF ${formatSwissNumber(vw_gesamt)})`
      : ''

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`http://localhost:5000/api/policen/${policeId}/grundversicherung/${item.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          risiko: item.risiko,
          art: newArt,
          versicherungssumme: newVersicherungssumme,
          selbstbehalt: item.selbstbehalt,
          glasbruch_typ: item.glasbruch_typ
        })
      })

      if (response.ok) {
        const updated = await response.json()
        setItems(items.map(i => i.id === item.id ? updated : i))
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren:', error)
    }
  }

  const handleUpdate = async (item, field, value) => {
    if (!isEditMode) return

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`http://localhost:5000/api/policen/${policeId}/grundversicherung/${item.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          risiko: item.risiko,
          art: item.art,
          versicherungssumme: field === 'versicherungssumme' ? value : item.versicherungssumme,
          selbstbehalt: field === 'selbstbehalt' ? value : item.selbstbehalt,
          glasbruch_typ: field === 'glasbruch_typ' ? value : item.glasbruch_typ
        })
      })

      if (response.ok) {
        const updated = await response.json()
        setItems(items.map(i => i.id === item.id ? updated : i))
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren:', error)
    }
  }

  if (loading) {
    return <div style={{ padding: '1rem', color: '#999' }}>Lädt...</div>
  }

  if (!policeId) {
    return (
      <div className="grundversicherung-manager">
        <h4>Grundversicherung</h4>
        <div style={{ padding: '1rem', textAlign: 'center', color: '#999', fontSize: '0.85rem' }}>
          Bitte speichern Sie die Police zuerst.
        </div>
      </div>
    )
  }

  return (
    <div className="grundversicherung-manager">
      <h4>Grundversicherung</h4>

      {vw_gesamt > 0 && (
        <div className="vw-info">
          <strong>VW gesamt:</strong> CHF {formatSwissNumber(vw_gesamt)} (Inventar + MFZ)
        </div>
      )}

      <div className="grundvers-table-wrapper">
        <table className="grundvers-table">
          <thead>
            <tr>
              <th style={{ width: '20%' }}>Risiko</th>
              <th style={{ width: '10%' }}>Art</th>
              <th style={{ width: '35%' }}>Versicherungssumme in CHF</th>
              <th style={{ width: '20%' }}>Selbstbehalt</th>
              <th style={{ width: '15%' }}>Glasbruch-Typ</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                <td>
                  <strong>{item.risiko}</strong>
                </td>
                <td>
                  <button
                    className={`art-toggle ${item.art}`}
                    onClick={() => handleToggleArt(item)}
                    disabled={!isEditMode}
                    title="Klicken zum Wechseln"
                  >
                    {item.art}
                  </button>
                </td>
                <td>
                  {item.art === 'VW' ? (
                    <div className="vw-auto">
                      Gemäss VW (CHF {formatSwissNumber(vw_gesamt)})
                    </div>
                  ) : (
                    <SmartNumberInput
                      value={item.versicherungssumme}
                      onChange={(val) => handleUpdate(item, 'versicherungssumme', val)}
                      placeholder="z.B. CHF 1'000'000"
                      disabled={!isEditMode}
                    />
                  )}
                </td>
                <td>
                  <SmartNumberInput
                    value={item.selbstbehalt}
                    onChange={(val) => handleUpdate(item, 'selbstbehalt', val)}
                    placeholder="z.B. CHF 500"
                    disabled={!isEditMode}
                  />
                </td>
                <td>
                  {item.risiko === 'Glasbruch' ? (
                    <select
                      value={item.glasbruch_typ || ''}
                      onChange={(e) => handleUpdate(item, 'glasbruch_typ', e.target.value)}
                      disabled={!isEditMode}
                      className="glasbruch-select"
                    >
                      <option value="">Nicht ausgewählt</option>
                      <option value="Mobiliar">Mobiliar</option>
                      <option value="Gebäude">Gebäude</option>
                      <option value="Mobiliar + Gebäude">Mobiliar + Gebäude</option>
                    </select>
                  ) : (
                    <div style={{ textAlign: 'center', color: '#d1d5db' }}>-</div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {items.length === 0 && (
        <div style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>
          Keine Grundversicherungen erfasst
        </div>
      )}
    </div>
  )
}

export default GrundversicherungManager