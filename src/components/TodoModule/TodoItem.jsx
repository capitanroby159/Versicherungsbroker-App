import { useState } from 'react'
import './TodoItem.css'

export default function TodoItem({ todo, onUpdated }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    beschreibung: todo.beschreibung,
    status: todo.status,
    prioritaet: todo.prioritaet,
    faellig_am: todo.faellig_am
  })
  const [loading, setLoading] = useState(false)

  const handleEditChange = (e) => {
    const { name, value } = e.target
    setEditData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/todos/${todo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editData)
      })

      if (!response.ok) {
        throw new Error('Fehler beim Aktualisieren')
      }

      setIsEditing(false)
      onUpdated()
    } catch (error) {
      console.error('Error updating todo:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Möchtest du diese Aufgabe wirklich löschen?')) {
      return
    }

    try {
      const response = await fetch(`/api/todos/${todo.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Fehler beim Löschen')
      }

      onUpdated()
    } catch (error) {
      console.error('Error deleting todo:', error)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Offen': return '#ffc107'
      case 'In Bearbeitung': return '#0dcaf0'
      case 'Erledigt': return '#198754'
      case 'Storniert': return '#dc3545'
      default: return '#6c757d'
    }
  }

  const getPriorityColor = (prioritaet) => {
    switch (prioritaet) {
      case 'Niedrig': return '#6c757d'
      case 'Normal': return '#0dcaf0'
      case 'Hoch': return '#ffc107'
      case 'Dringend': return '#dc3545'
      default: return '#6c757d'
    }
  }

  const isOverdue = todo.faellig_am && new Date(todo.faellig_am) < new Date() && todo.status !== 'Erledigt'

  const getDaysUntilDue = () => {
    if (!todo.faellig_am) return null
    const today = new Date()
    const dueDate = new Date(todo.faellig_am)
    const diffTime = dueDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) {
      return { days: Math.abs(diffDays), status: 'overdue' }
    } else if (diffDays === 0) {
      return { days: 0, status: 'today' }
    } else {
      return { days: diffDays, status: 'upcoming' }
    }
  }

  const daysInfo = getDaysUntilDue()

  if (isEditing) {
    return (
      <div className="todo-item editing">
        <div className="edit-form">
          <input
            type="text"
            name="beschreibung"
            value={editData.beschreibung}
            onChange={handleEditChange}
            className="edit-input"
          />
          <div className="edit-row">
            <select
              name="status"
              value={editData.status}
              onChange={handleEditChange}
              className="edit-select"
            >
              <option value="Offen">Offen</option>
              <option value="In Bearbeitung">In Bearbeitung</option>
              <option value="Erledigt">Erledigt</option>
              <option value="Storniert">Storniert</option>
            </select>
            <select
              name="prioritaet"
              value={editData.prioritaet}
              onChange={handleEditChange}
              className="edit-select"
            >
              <option value="Niedrig">Niedrig</option>
              <option value="Normal">Normal</option>
              <option value="Hoch">Hoch</option>
              <option value="Dringend">Dringend</option>
            </select>
            <input
              type="date"
              name="faellig_am"
              value={editData.faellig_am}
              onChange={handleEditChange}
              className="edit-input"
            />
          </div>
          <div className="edit-actions">
            <button
              className="btn-save-small"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? 'Speichert...' : 'Speichern'}
            </button>
            <button
              className="btn-cancel-small"
              onClick={() => setIsEditing(false)}
            >
              Abbrechen
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`todo-item ${isOverdue ? 'overdue' : ''}`}>
      <div className="todo-content">
        <div className="todo-title">
          {isOverdue && <span className="overdue-warning">🔴 ÜBERFÄLLIG!</span>}
          {todo.beschreibung}
        </div>
        <div className="todo-meta">
          <span
            className="todo-status"
            style={{ backgroundColor: getStatusColor(todo.status) }}
          >
            {todo.status}
          </span>
          <span
            className="todo-priority"
            style={{ backgroundColor: getPriorityColor(todo.prioritaet) }}
          >
            {todo.prioritaet}
          </span>
          {todo.faellig_am && (
            <span className={`todo-date ${isOverdue ? 'overdue-date' : daysInfo?.status === 'today' ? 'today-date' : ''}`}>
              📅 {new Date(todo.faellig_am).toLocaleDateString('de-CH')}
              {daysInfo && (
                <>
                  {' '}
                  {daysInfo.status === 'overdue' && (
                    <strong className="overdue-info">({daysInfo.days} Tage ÜBERFÄLLIG!)</strong>
                  )}
                  {daysInfo.status === 'today' && (
                    <strong className="today-info">(HEUTE!)</strong>
                  )}
                  {daysInfo.status === 'upcoming' && (
                    <span className="upcoming-info">(in {daysInfo.days} Tag{daysInfo.days !== 1 ? 'en' : ''})</span>
                  )}
                </>
              )}
            </span>
          )}
        </div>
      </div>
      <div className="todo-actions">
        <button
          className="btn-edit"
          onClick={() => setIsEditing(true)}
          title="Bearbeiten"
        >
          ✏️
        </button>
        <button
          className="btn-delete"
          onClick={handleDelete}
          title="Löschen"
        >
          🗑️
        </button>
      </div>
    </div>
  )
}