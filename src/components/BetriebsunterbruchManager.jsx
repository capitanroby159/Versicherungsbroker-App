import { useState, useEffect } from 'react'
import { SmartNumberInput } from '../utils/numberFormatter'
import { formatSwissNumber } from '../utils/numberFormatter'
import './BetriebsunterbruchManager.css'

function BetriebsunterbruchManager({ policeId, umsatz, isEditMode }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [artBetrieb, setArtBetrieb] = useState('Umsatz')

  const umsatz_wert = parseFloat(umsatz?.replace(/'/g, '') || 0)

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
      const response = await fetch(`http://localhost:5000/api/policen/${policeId}/betriebsunterbruch`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setItems(Array.isArray(data) ? data : [])
        // Setze Art Betrieb vom ersten Item
        if (data.length > 0 && data[0].art_betrieb) {
          setArtBetrieb(data[0].art_betrieb)
        }
      }
    } catch (error) {
      console.error('Fehler beim Laden des Betriebsunterbruchs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleArtBetriebChange = async (newArt) => {
    if (!isEditMode) return

    setArtBetrieb(newArt)

    // Update alle Items
    try {
      const token = localStorage.getItem('auth_token')
      for (const item of items) {
        await fetch(`http://localhost:5000/api/policen/${policeId}/betriebsunterbruch/${item.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            art_betrieb: newArt,
            risiko: item.risiko,
            art: item.art,
            versicherungssumme: item.versicherungssumme,
            selbstbehalt: item.selbstbehalt
          })
        })
      }
      fetchItems()
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Art:', error)
    }
  }

  const handleToggleArt = async (item) => {
    if (!isEditMode) return

    const newArt = item.art === 'VW' ? 'ER' : 'VW'
    const newVersicherungssumme = newArt === 'VW' 
      ? `Gemäss Umsatz (CHF ${formatSwissNumber(umsatz_wert)})`
      : ''

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`http://localhost:5000/api/policen/${policeId}/betriebsunterbruch/${item.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          art_betrieb: item.art_betrieb,
          risiko: item.risiko,
          art: newArt,
          versicherungssumme: newVersicherungssumme,
          selbstbehalt: item.selbstbehalt
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
      const response = await fetch(`http://localhost:5000/api/policen/${policeId}/betriebsunterbruch/${item.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          art_betrieb: item.art_betrieb,
          risiko: item.risiko,
          art: item.art,
          versicherungssumme: field === 'versicherungssumme' ? value : item.versicherungssumme,
          selbstbehalt: field === 'selbstbehalt' ? value : item.selbstbehalt
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
      <div className="betriebsunterbruch-manager">
        <h4>Betriebsunterbruch</h4>
        <div style={{ padding: '1rem', textAlign: 'center', color: '#999', fontSize: '0.85rem' }}>
          Bitte speichern Sie die Police zuerst.
        </div>
      </div>
    )
  }

  return (
    <div className="betriebsunterbruch-manager">
      <div className="bu-header">
        <h4>Betriebsunterbruch</h4>
        <div className="art-betrieb-selector">
          <label>Art:</label>
          <select
            value={artBetrieb}
            onChange={(e) => handleArtBetriebChange(e.target.value)}
            disabled={!isEditMode}
          >
            <option value="Umsatz">Umsatz</option>
            <option value="VtBg">VtBg</option>
            <option value="Mehrkosten">Mehrkosten</option>
          </select>
        </div>
      </div>

      {umsatz_wert > 0 && (
        <div className="vw-info">
          <strong>VW Betriebsunterbruch:</strong> CHF {formatSwissNumber(umsatz_wert)} (Umsatz)
        </div>
      )}

      <div className="bu-table-wrapper">
        <table className="bu-table">
          <thead>
            <tr>
              <th style={{ width: '25%' }}>Risiko</th>
              <th style={{ width: '10%' }}>Art</th>
              <th style={{ width: '40%' }}>Versicherungssumme in CHF</th>
              <th style={{ width: '25%' }}>Selbstbehalt</th>
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
                      Gemäss Umsatz (CHF {formatSwissNumber(umsatz_wert)})
                    </div>
                  ) : (
                    <SmartNumberInput
                      value={item.versicherungssumme}
                      onChange={(val) => handleUpdate(item, 'versicherungssumme', val)}
                      placeholder="z.B. CHF 500'000"
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {items.length === 0 && (
        <div style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>
          Keine Betriebsunterbrechungen erfasst
        </div>
      )}
    </div>
  )
}

export default BetriebsunterbruchManager