import { useState, useEffect } from 'react'
import './TodoTab.css'
import TodoForm from './TodoForm'
import TodoItem from './TodoItem'

export default function TodoTab({ kundeId }) {
  const [todos, setTodos] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState('Offen')
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    offen: 0,
    in_bearbeitung: 0,
    erledigt: 0,
    dringend: 0,
    ueberfaellig: 0
  })

  useEffect(() => {
    loadTodos()
    loadStats()
  }, [kundeId])

  const loadTodos = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/todos/kunde/${kundeId}`)
      const data = await response.json()
      setTodos(data)
    } catch (error) {
      console.error('Error loading todos:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch('/api/todos/stats/dashboard')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const handleTodoCreated = () => {
    setShowForm(false)
    loadTodos()
    loadStats()
  }

  const handleTodoUpdated = () => {
    loadTodos()
    loadStats()
  }

  const getFilteredTodos = () => {
    if (filter === 'Alle') {
      return todos
    }
    return todos.filter(todo => todo.status === filter)
  }

  const getStatColor = (value) => {
    if (value === 0) return '#6c757d'
    if (value > 5) return '#dc3545'
    if (value > 2) return '#ffc107'
    return '#198754'
  }

  const filteredTodos = getFilteredTodos()

  return (
    <div className="todo-tab">
      <div className="todo-header">
        <h3>📋 Aufgaben & Todos</h3>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          + Neue Aufgabe
        </button>
      </div>

      {/* Statistiken */}
      <div className="todo-stats">
        <div className="stat-card">
          <div className="stat-value" style={{ color: getStatColor(stats.offen) }}>
            {stats.offen}
          </div>
          <div className="stat-label">Offen</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: getStatColor(stats.in_bearbeitung) }}>
            {stats.in_bearbeitung}
          </div>
          <div className="stat-label">In Bearbeitung</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#198754' }}>
            {stats.erledigt}
          </div>
          <div className="stat-label">Erledigt</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#dc3545' }}>
            {stats.dringend}
          </div>
          <div className="stat-label">Dringend</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#dc3545' }}>
            {stats.ueberfaellig}
          </div>
          <div className="stat-label">Überfällig</div>
        </div>
      </div>

      {/* Filter */}
      <div className="todo-filters">
        {['Offen', 'In Bearbeitung', 'Erledigt', 'Alle'].map(status => (
          <button
            key={status}
            className={`filter-btn ${filter === status ? 'active' : ''}`}
            onClick={() => setFilter(status)}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Todo Liste */}
      <div className="todo-list">
        {loading ? (
          <p>Lädt...</p>
        ) : filteredTodos.length === 0 ? (
          <p className="empty-state">
            {filter === 'Erledigt' ? 'Keine erledigten Aufgaben' : 'Keine offenen Aufgaben'}
          </p>
        ) : (
          filteredTodos.map(todo => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onUpdated={handleTodoUpdated}
            />
          ))
        )}
      </div>

      {showForm && (
        <TodoForm
          kundeId={kundeId}
          onClose={() => setShowForm(false)}
          onSuccess={handleTodoCreated}
        />
      )}
    </div>
  )
}