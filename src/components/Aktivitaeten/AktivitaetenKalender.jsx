// src/components/Aktivitaeten/AktivitaetenKalender.jsx
import React, { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns'
import { de } from 'date-fns/locale'

function AktivitaetenKalender({ kundeId = null }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [aktivitaeten, setAktivitaeten] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchAktivitaeten()
  }, [currentDate, kundeId])

  const fetchAktivitaeten = async () => {
    setLoading(true)
    try {
      const url = kundeId
        ? `http://localhost:5000/api/aktivitaeten/by-kunde/${kundeId}`
        : `http://localhost:5000/api/aktivitaeten`
      
      const res = await fetch(url)
      const data = await res.json()
      setAktivitaeten(data)
    } catch (error) {
      console.error('Fehler beim Laden der Aktivitäten:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAktivitaetenForDate = (date) => {
    return aktivitaeten.filter(a => 
      a.datum_fällig && 
      isSameDay(new Date(a.datum_fällig), date) &&
      a.status !== 'Abgeschlossen'
    )
  }

  const getDaysInMonth = () => {
    const start = startOfMonth(currentDate)
    const end = endOfMonth(currentDate)
    return eachDayOfInterval({ start, end })
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const selectedDateAktivitaeten = selectedDate ? getAktivitaetenForDate(selectedDate) : []

  const days = getDaysInMonth()
  const firstDayOfWeek = days[0].getDay()

  const getPriorityColor = (prioritaet) => {
    const colors = {
      'Kritisch': '#dc2626',
      'Hoch': '#f97316',
      'Normal': '#3b82f6',
      'Niedrig': '#10b981'
    }
    return colors[prioritaet] || '#3b82f6'
  }

  return (
    <div className="aktivitaeten-kalender">
      <div className="kalender-header">
        <h3>📅 Termin-Kalender</h3>
        <div className="kalender-navigation">
          <button onClick={handlePrevMonth} className="nav-btn">←</button>
          <span className="current-month">
            {format(currentDate, 'MMMM yyyy', { locale: de })}
          </span>
          <button onClick={handleNextMonth} className="nav-btn">→</button>
        </div>
      </div>

      <div className="kalender-grid">
        {/* Wochentage Header */}
        {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => (
          <div key={day} className="kalender-weekday">
            {day}
          </div>
        ))}

        {/* Tage */}
        {Array(firstDayOfWeek).fill(null).map((_, i) => (
          <div key={`empty-${i}`} className="kalender-day empty"></div>
        ))}

        {days.map(day => {
          const aktivs = getAktivitaetenForDate(day)
          const isSelected = selectedDate && isSameDay(day, selectedDate)
          const isToday = isSameDay(day, new Date())

          return (
            <div
              key={day.toString()}
              className={`kalender-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
              onClick={() => setSelectedDate(day)}
            >
              <div className="day-number">{format(day, 'd')}</div>
              <div className="day-aktivs">
                {aktivs.slice(0, 2).map(a => (
                  <div
                    key={a.id}
                    className="day-aktiv"
                    style={{
                      background: getPriorityColor(a.prioritaet),
                      title: a.titel
                    }}
                    title={a.titel}
                  />
                ))}
                {aktivs.length > 2 && (
                  <div className="day-aktiv-more">+{aktivs.length - 2}</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* SelectedDate Details */}
      {selectedDate && (
        <div className="kalender-details">
          <h4>
            {format(selectedDate, 'dd. MMMM yyyy', { locale: de })}
            {isSameDay(selectedDate, new Date()) && ' (Heute)'}
          </h4>

          {selectedDateAktivitaeten.length === 0 ? (
            <p style={{color: '#9ca3af'}}>Keine Termine an diesem Tag</p>
          ) : (
            <div className="aktivitaeten-list">
              {selectedDateAktivitaeten.map(a => (
                <div
                  key={a.id}
                  className="aktivitaet-item"
                  style={{
                    borderLeft: `4px solid ${getPriorityColor(a.prioritaet)}`
                  }}
                >
                  <div className="aktivitaet-item-title">
                    <strong>{a.titel}</strong>
                    <span className="status-badge" style={{background: getPriorityColor(a.prioritaet)}}>
                      {a.prioritaet}
                    </span>
                  </div>
                  <div className="aktivitaet-item-meta">
                    <span>📌 {a.typ}</span>
                    {a.kunde_name && <span>👤 {a.kunde_name}</span>}
                    {a.versicherer_name && <span>🏢 {a.versicherer_name}</span>}
                  </div>
                  {a.beschreibung && (
                    <div className="aktivitaet-item-desc">{a.beschreibung}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        .aktivitaeten-kalender {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .kalender-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #e5e7eb;
        }

        .kalender-header h3 {
          margin: 0;
          font-size: 18px;
        }

        .kalender-navigation {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .nav-btn {
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: bold;
          transition: all 0.2s;
        }

        .nav-btn:hover {
          background: #e5e7eb;
        }

        .current-month {
          font-weight: 600;
          min-width: 150px;
          text-align: center;
        }

        .kalender-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 8px;
          margin-bottom: 20px;
        }

        .kalender-weekday {
          text-align: center;
          font-weight: 600;
          color: #6b7280;
          padding: 8px;
          font-size: 12px;
          text-transform: uppercase;
        }

        .kalender-day {
          min-height: 80px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 8px;
          cursor: pointer;
          transition: all 0.2s;
          background: white;
        }

        .kalender-day.empty {
          background: #f9fafb;
          cursor: default;
        }

        .kalender-day:hover:not(.empty) {
          background: #f9fafb;
          border-color: #06b6d4;
        }

        .kalender-day.selected {
          background: #dbeafe;
          border-color: #0369a1;
          box-shadow: 0 0 0 2px #0369a1;
        }

        .kalender-day.today .day-number {
          background: #06b6d4;
          color: white;
          border-radius: 4px;
          padding: 2px 6px;
          font-weight: bold;
        }

        .day-number {
          font-weight: 600;
          margin-bottom: 4px;
          font-size: 14px;
        }

        .day-aktivs {
          display: flex;
          flex-wrap: wrap;
          gap: 2px;
        }

        .day-aktiv {
          width: 8px;
          height: 8px;
          border-radius: 2px;
          opacity: 0.8;
        }

        .day-aktiv-more {
          font-size: 9px;
          color: #6b7280;
          margin-top: 2px;
        }

        .kalender-details {
          background: #f9fafb;
          border-radius: 6px;
          padding: 15px;
        }

        .kalender-details h4 {
          margin: 0 0 15px 0;
          color: #1f2937;
          font-size: 16px;
        }

        .aktivitaeten-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .aktivitaet-item {
          background: white;
          border-radius: 6px;
          padding: 12px;
        }

        .aktivitaet-item-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .aktivitaet-item-title strong {
          color: #1f2937;
        }

        .status-badge {
          color: white;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
        }

        .aktivitaet-item-meta {
          display: flex;
          gap: 12px;
          font-size: 13px;
          color: #6b7280;
          margin-bottom: 8px;
        }

        .aktivitaet-item-desc {
          font-size: 13px;
          color: #374151;
          line-height: 1.4;
        }

        @media (max-width: 768px) {
          .kalender-grid {
            gap: 4px;
          }

          .kalender-day {
            min-height: 60px;
            padding: 4px;
          }

          .day-number {
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  )
}

// ✅ DEFAULT EXPORT - WICHTIG!
export default AktivitaetenKalender