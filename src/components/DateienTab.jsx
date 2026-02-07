import { useState, useEffect } from 'react'
import DateienModal from './DateienModal'

const styles = `
.dateien-container {
  width: 100%;
  padding: 0;
  background: transparent;
}

.dateien-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.4rem;
  gap: 0.3rem;
}

.dateien-header h4 {
  margin: 0;
  color: #0f2f5f;
  font-size: 0.85rem;
  font-weight: 600;
}

.dateien-buttons {
  display: flex;
  gap: 0.2rem;
  flex-shrink: 0;
}

.btn-add {
  padding: 0.2rem 0.4rem;
  border: none;
  border-radius: 2px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.65rem;
  background: #1e40af;
  color: white;
  white-space: nowrap;
}

.btn-add:hover {
  background: #0f2f5f;
}

.empty-state {
  text-align: center;
  padding: 0.5rem;
  color: #94a3b8;
  font-size: 0.7rem;
}

.dateien-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.4rem;
  width: 100%;
}

.datei-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 3px;
  padding: 0.3rem;
  display: flex;
  flex-direction: column;
  min-height: auto;
  transition: all 0.2s;
}

.datei-card:hover {
  border-color: #1e40af;
  box-shadow: 0 1px 3px rgba(30, 64, 175, 0.1);
}

.datei-header {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  margin-bottom: 0.2rem;
}

.badge {
  display: inline-block;
  padding: 0.1rem 0.2rem;
  border-radius: 2px;
  font-size: 0.6rem;
  font-weight: 500;
  width: fit-content;
}

.datei-url {
  flex: 1;
  margin-bottom: 0.2rem;
}

.datei-link {
  color: #1e40af;
  text-decoration: none;
  font-weight: 500;
  word-break: break-word;
  font-size: 0.7rem;
}

.datei-link:hover {
  text-decoration: underline;
}

.datei-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0.2rem;
  border-top: 1px solid #e2e8f0;
  font-size: 0.6rem;
}

.btn-delete {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.7rem;
  padding: 0;
}

.btn-delete:hover {
  background: #fee2e2;
  border-radius: 2px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.3rem;
  padding-top: 0.3rem;
  border-top: 1px solid #e2e8f0;
  font-size: 0.65rem;
}

.pagination button {
  padding: 0.15rem 0.3rem;
  border: 1px solid #cbd5e1;
  border-radius: 2px;
  background: white;
  cursor: pointer;
  font-size: 0.6rem;
}

.pagination button:hover:not(:disabled) {
  background: #0f2f5f;
  color: white;
}

.pagination button:disabled {
  opacity: 0.5;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 6px;
  max-width: 350px;
  width: 90%;
  overflow-y: auto;
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h3 {
  margin: 0;
  color: #0f2f5f;
  font-size: 0.9rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #94a3b8;
}

.modal-body {
  padding: 0.8rem;
}

.modal-footer {
  display: flex;
  gap: 0.4rem;
  justify-content: flex-end;
  padding: 0.6rem 0.8rem;
  border-top: 1px solid #e2e8f0;
}

.form-group {
  margin-bottom: 0.6rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.3rem;
  color: #475569;
  font-weight: 500;
  font-size: 0.8rem;
}

.form-input {
  width: 100%;
  padding: 0.4rem;
  border: 1px solid #cbd5e1;
  border-radius: 3px;
  font-family: inherit;
  font-size: 0.8rem;
}

.form-input:focus {
  outline: none;
  border-color: #1e40af;
  box-shadow: 0 0 0 2px rgba(30, 64, 175, 0.08);
}

.btn-save {
  background: #1e40af;
  color: white;
  padding: 0.4rem 0.8rem;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.75rem;
}

.btn-save:hover:not(:disabled) {
  background: #0f2f5f;
}

.btn-cancel {
  background: #f1f5f9;
  color: #475569;
  padding: 0.4rem 0.8rem;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.75rem;
}

@media (max-width: 1024px) {
  .dateien-list {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .dateien-list {
    grid-template-columns: 1fr;
  }
}
`

function DateienTab({ policeId }) {
  const [dateien, setDateien] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 })
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (policeId) fetchDateien()
  }, [policeId, page])

  const fetchDateien = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')
      if (!token) {
        setDateien([])
        setLoading(false)
        return
      }

      const response = await fetch(
        `http://localhost:5000/api/policen/${policeId}/dateien?page=${page}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setDateien(data.data || [])
        setPagination(data.pagination)
      }
    } catch (err) {
      console.error('Fehler:', err)
      setDateien([])
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDateei = async (dateiId) => {
    if (!window.confirm('Löschen?')) return
    try {
      const token = localStorage.getItem('auth_token')
      await fetch(
        `http://localhost:5000/api/policen/${policeId}/dateien/${dateiId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )
      fetchDateien()
    } catch (err) {
      alert('Fehler: ' + err.message)
    }
  }

  if (!policeId) return <div className="dateien-container"></div>

  return (
    <>
      <style>{styles}</style>
      <div className="dateien-container">
        {loading ? (
          <p style={{fontSize: '0.7rem', margin: '0'}}>⏳</p>
        ) : dateien.length === 0 ? (
          <div>
            <div className="dateien-buttons" style={{ marginBottom: '0.3rem' }}>
              <button 
                className="btn-add"
                onClick={() => setShowModal(true)}
                title="Datei hinzufügen"
              >
                + Datei
              </button>
            </div>
            <div className="empty-state">Keine Dateien</div>
          </div>
        ) : (
          <div>
            <div className="dateien-buttons" style={{ marginBottom: '0.3rem' }}>
              <button 
                className="btn-add"
                onClick={() => setShowModal(true)}
                title="Datei hinzufügen"
              >
                + Datei
              </button>
            </div>
            <div className="dateien-list">
              {dateien.map(datei => (
                <div key={datei.id} className="datei-card">
                  <div className="datei-header">
                    <span className="badge">
                      {datei.kategorie}
                    </span>
                  </div>
                  <div className="datei-url">
                    <a 
                      href={datei.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="datei-link"
                    >
                      🔗
                    </a>
                  </div>
                  <div className="datei-footer">
                    <small>{new Date(datei.created_at).toLocaleDateString('de-CH')}</small>
                    <button 
                      className="btn-delete"
                      onClick={() => handleDeleteDateei(datei.id)}
                    >
                      ❌
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="pagination">
            <button 
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              ←
            </button>
            <span>{page}/{pagination.totalPages}</span>
            <button 
              onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
              disabled={page === pagination.totalPages}
            >
              →
            </button>
          </div>
        )}

        {showModal && (
          <DateienModal 
            policeId={policeId}
            onClose={() => setShowModal(false)}
            onSave={() => {
              fetchDateien()
              setShowModal(false)
            }}
          />
        )}
      </div>
    </>
  )
}

export default DateienTab