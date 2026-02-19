// src/components/Aktivitaeten.jsx (oder ähnlicher Pfad)
// WICHTIG: Dies ist ein Beispiel - deine Struktur kann anders sein!

import { useState, useEffect } from 'react'

export default function Aktivitaeten() {
  const [stats, setStats] = useState([])
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    fetchOverview()
  }, [])

  // ============================================================
  // OFFENE AKTIVITÄTEN LADEN
  // ============================================================
  const fetchStats = async () => {
    try {
      console.log('📊 Lade offene Aktivitäten...')
      
      // ✅ WICHTIG: localhost:5000 (nicht 3000!)
      const res = await fetch('http://localhost:5000/api/aktivitaeten/stats/offene')
      
      // ✅ Error-Check
      if (!res.ok) {
        console.warn(`⚠️ Stats-Endpoint nicht verfügbar (${res.status})`)
        setStats([])
        return
      }
      
      const data = await res.json()
      
      // ✅ Array-Check
      if (!Array.isArray(data)) {
        console.warn('⚠️ Response ist kein Array, sondern:', data)
        setStats([])
        return
      }
      
      console.log(`✅ ${data.length} offene Aktivitäten geladen`)
      setStats(data)
    } catch (error) {
      console.error('❌ Fehler beim Laden der Statistiken:', error)
      setStats([])
    } finally {
      setLoading(false)
    }
  }

  // ============================================================
  // STATISTIK-ÜBERSICHT LADEN
  // ============================================================
  const fetchOverview = async () => {
    try {
      console.log('📊 Lade Statistik-Übersicht...')
      
      // ✅ localhost:5000 (nicht 3000!)
      const res = await fetch('http://localhost:5000/api/aktivitaeten/stats/overview')
      
      if (!res.ok) {
        console.warn(`⚠️ Overview-Endpoint nicht verfügbar (${res.status})`)
        setOverview(null)
        return
      }
      
      const data = await res.json()
      
      // ✅ Object-Check
      if (typeof data !== 'object' || data === null) {
        console.warn('⚠️ Overview ist kein Object')
        setOverview(null)
        return
      }
      
      console.log('✅ Übersicht geladen:', data)
      setOverview(data)
    } catch (error) {
      console.error('❌ Fehler beim Laden der Übersicht:', error)
      setOverview(null)
    }
  }

  if (loading) {
    return <div>⏳ Statistiken werden geladen...</div>
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>📊 Aktivitäten-Übersicht</h1>

      {/* ÜBERSICHT */}
      {overview && (
        <div style={{
          padding: '16px',
          background: '#f9fafb',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #e5e7eb'
        }}>
          <h2 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>Statistik</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div style={{ padding: '12px', background: 'white', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Gesamt</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginTop: '4px' }}>
                {overview.gesamt || 0}
              </div>
            </div>

            <div style={{ padding: '12px', background: 'white', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Geplant</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6', marginTop: '4px' }}>
                {overview.nach_status?.['Geplant'] || 0}
              </div>
            </div>

            <div style={{ padding: '12px', background: 'white', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>In Bearbeitung</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f97316', marginTop: '4px' }}>
                {overview.nach_status?.['In Bearbeitung'] || 0}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OFFENE AKTIVITÄTEN */}
      <div style={{
        padding: '16px',
        background: 'white',
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
      }}>
        <h2 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>
          🔴 Offene Aktivitäten ({stats.length})
        </h2>

        {stats.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>
            ✅ Keine offenen Aktivitäten
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '8px' }}>
            {stats.map(activity => (
              <div
                key={activity.id}
                style={{
                  padding: '12px',
                  background: '#f0fdf4',
                  border: '1px solid #86efac',
                  borderRadius: '6px'
                }}
              >
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                  {activity.titel}
                </div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>
                  📅 {new Date(activity.datum_aktivitaet).toLocaleDateString('de-CH')}
                  {activity.uhrzeit_aktivitaet && ` • 🕐 ${activity.uhrzeit_aktivitaet.substring(0, 5)}`}
                  {activity.kunde_name && ` • 👤 ${activity.kunde_name}`}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}