import { useState, useEffect } from 'react'

const styles = `
.mutations-container {
  width: 100%;
  padding: 0;
  background: transparent;
}

.mutations-timeline {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.mutation-group {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 0.8rem;
  position: relative;
}

.mutation-group::before {
  content: '';
  position: absolute;
  left: -8px;
  top: 1.2rem;
  width: 12px;
  height: 12px;
  background: #1e40af;
  border: 2px solid white;
  border-radius: 50%;
  box-shadow: 0 0 0 2px #e2e8f0;
}

.mutation-group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.6rem;
  padding-bottom: 0.6rem;
  border-bottom: 1px solid #f0f0f0;
}

.mutation-time {
  font-weight: 600;
  font-size: 0.9rem;
  color: #0f2f5f;
}

.mutation-user {
  font-size: 0.8rem;
  color: #475569;
  font-weight: 500;
}

.mutations-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.mutation-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.8rem;
  padding: 0.3rem 0;
}

.mutation-field {
  font-weight: 600;
  color: #333;
  min-width: 120px;
  word-break: break-word;
}

.mutation-change {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  color: #666;
}

.mutation-arrow {
  color: #94a3b8;
  font-weight: bold;
  padding: 0 0.3rem;
}

.mutation-old {
  color: #dc2626;
  background: #fee2e2;
  padding: 0.2rem 0.4rem;
  border-radius: 2px;
  font-family: monospace;
  font-size: 0.75rem;
}

.mutation-new {
  color: #059669;
  background: #dcfce7;
  padding: 0.2rem 0.4rem;
  border-radius: 2px;
  font-family: monospace;
  font-size: 0.75rem;
}

.empty-state {
  text-align: center;
  padding: 1.5rem;
  color: #94a3b8;
  font-size: 0.85rem;
}

.loading {
  text-align: center;
  padding: 1rem;
  color: #64748b;
  font-size: 0.8rem;
}

.error {
  background: #fecaca;
  border: 1px solid #fca5a5;
  color: #7f1d1d;
  padding: 0.8rem;
  border-radius: 4px;
  font-size: 0.8rem;
}
`

function MutationsTab({ policeId }) {
  const [mutations, setMutations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [grouped, setGrouped] = useState({})

  useEffect(() => {
    if (policeId) fetchMutations()
  }, [policeId])

  const fetchMutations = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem('auth_token')
      if (!token) {
        setMutations([])
        setLoading(false)
        return
      }

      const response = await fetch(
        `http://localhost:5000/api/policen/${policeId}/mutations`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setMutations(data.mutations || [])
        setGrouped(data.grouped || {})
      } else {
        setError('Fehler beim Laden der Mutations-History')
      }
    } catch (err) {
      console.error('Fehler:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!policeId) {
    return <div className="mutations-container"></div>
  }

  if (loading) {
    return <div className="mutations-container"><p className="loading">⏳ Lade History...</p></div>
  }

  if (error) {
    return <div className="mutations-container"><p className="error">❌ {error}</p></div>
  }

  if (mutations.length === 0) {
    return (
      <div className="mutations-container">
        <div className="empty-state">
          📭 Keine Änderungen registriert
        </div>
      </div>
    )
  }

  // Gruppiere Mutations nach DateTime
  const timeGroups = {}
  mutations.forEach(mutation => {
    const dateTime = new Date(mutation.changed_at)
    const date = dateTime.toLocaleDateString('de-CH')
    const time = dateTime.toLocaleTimeString('de-CH', {
      hour: '2-digit',
      minute: '2-digit'
    })
    const key = `${date} ${time}`

    if (!timeGroups[key]) {
      timeGroups[key] = {
        date,
        time,
        user: mutation.changed_by_name || 'System',
        mutations: []
      }
    }
    timeGroups[key].mutations.push(mutation)
  })

  return (
    <>
      <style>{styles}</style>
      <div className="mutations-container">
        <div className="mutations-timeline">
          {Object.entries(timeGroups).map(([key, group]) => (
            <div key={key} className="mutation-group">
              <div className="mutation-group-header">
                <div>
                  <div className="mutation-time">
                    📅 {group.date} · ⏰ {group.time}
                  </div>
                  <div className="mutation-user">👤 {group.user}</div>
                </div>
              </div>

              <div className="mutations-list">
                {group.mutations.map((mutation, idx) => (
                  <div key={idx} className="mutation-item">
                    <span className="mutation-field">
                      {mutation.field_label || mutation.field_name}
                    </span>
                    <div className="mutation-change">
                      <span className="mutation-old">
                        {truncate(mutation.old_value || '(leer)', 30)}
                      </span>
                      <span className="mutation-arrow">→</span>
                      <span className="mutation-new">
                        {truncate(mutation.new_value || '(leer)', 30)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

function truncate(str, length) {
  if (!str) return '(leer)'
  return str.length > length ? str.substring(0, length) + '...' : str
}

export default MutationsTab