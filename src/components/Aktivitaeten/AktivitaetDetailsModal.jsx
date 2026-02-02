// src/components/Aktivitaeten/AktivitaetDetailsModal.jsx
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

export default function AktivitaetDetailsModal({ aktivitaet, onClose, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState(aktivitaet);
  const [dateien, setDateien] = useState(aktivitaet.dateien || []);
  const [teilnehmer, setTeilnehmer] = useState(aktivitaet.teilnehmer || []);
  const [projekte, setProjekte] = useState([]);
  const [selectedDatei, setSelectedDatei] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exportType, setExportType] = useState('Local');
  const [showExportForm, setShowExportForm] = useState(false);

  useEffect(() => {
    fetchProjekte();
  }, []);

  const fetchProjekte = async () => {
    try {
      const res = await fetch('/api/projekte');
      if (res.ok) {
        const data = await res.json();
        setProjekte(data);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Projekte:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/aktivitaeten/${aktivitaet.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error('Fehler beim Speichern');
      
      setEditing(false);
      onSave();
    } catch (error) {
      console.error('Fehler:', error);
      alert('Aktivität konnte nicht gespeichert werden');
    } finally {
      setLoading(false);
    }
  };

  const handleProjektZuweisen = async (projektId) => {
    try {
      const res = await fetch(`/api/aktivitaeten/${aktivitaet.id}/projekt`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projekt_id: projektId || null })
      });

      if (res.ok) {
        setFormData(prev => ({
          ...prev,
          projekt_id: projektId || null
        }));
        alert('Projekt zugewiesen!');
      }
    } catch (error) {
      console.error('Fehler:', error);
      alert('Projekt konnte nicht zugewiesen werden');
    }
  };

  // Datei-Upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      alert('Datei ist zu groß (max. 50MB)');
      return;
    }

    const formDataUpload = new FormData();
    formDataUpload.append('datei', file);

    setLoading(true);
    try {
      const res = await fetch(`/api/aktivitaeten/${aktivitaet.id}/dateien`, {
        method: 'POST',
        body: formDataUpload
      });

      if (!res.ok) throw new Error('Upload fehlgeschlagen');
      
      const newFile = await res.json();
      setDateien([...dateien, newFile]);
      alert('Datei hochgeladen!');
    } catch (error) {
      console.error('Fehler:', error);
      alert('Datei konnte nicht hochgeladen werden');
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  // Datei löschen
  const handleDeleteFile = async (dateiId) => {
    if (!window.confirm('Datei wirklich löschen?')) return;

    try {
      const res = await fetch(`/api/aktivitaeten/${aktivitaet.id}/dateien/${dateiId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setDateien(dateien.filter(d => d.id !== dateiId));
      }
    } catch (error) {
      console.error('Fehler:', error);
      alert('Datei konnte nicht gelöscht werden');
    }
  };

  // Todo exportieren
  const handleExportTodo = async () => {
    try {
      const res = await fetch(`/api/aktivitaeten/${aktivitaet.id}/export-todo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          export_typ: exportType,
          externe_liste: 'Broker-App'
        })
      });

      if (res.ok) {
        alert(`Aktivität zu ${exportType} exportiert!`);
        setShowExportForm(false);
      }
    } catch (error) {
      console.error('Fehler:', error);
      alert('Export fehlgeschlagen');
    }
  };

  const formatDateDe = (dateStr) => {
    if (!dateStr) return '-';
    return format(new Date(dateStr), 'dd.MM.yyyy');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content aktivitaet-details" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{aktivitaet.titel}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {!editing ? (
            // View Mode
            <div className="view-mode">
              <div className="detail-section">
                <h3>Informationen</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Typ</label>
                    <span>{aktivitaet.typ}</span>
                  </div>
                  <div className="detail-item">
                    <label>Richtung</label>
                    <span>{aktivitaet.richtung}</span>
                  </div>
                  <div className="detail-item">
                    <label>Priorität</label>
                    <span>{aktivitaet.prioritaet}</span>
                  </div>
                  <div className="detail-item">
                    <label>Status</label>
                    <span>{aktivitaet.status}</span>
                  </div>
                  <div className="detail-item">
                    <label>Fällig</label>
                    <span>{formatDateDe(aktivitaet.datum_fällig)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Erstellt</label>
                    <span>{formatDateDe(aktivitaet.datum_erstellt)}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>Beteiligte</h3>
                <div className="participants">
                  {aktivitaet.kunde_name && (
                    <div className="participant">🧑 <strong>Kunde:</strong> {aktivitaet.kunde_name}</div>
                  )}
                  {aktivitaet.versicherer_name && (
                    <div className="participant">🏢 <strong>Versicherer:</strong> {aktivitaet.versicherer_name}</div>
                  )}
                </div>
              </div>

              <div className="detail-section">
                <h3>Beschreibung</h3>
                <p className="full-description">{aktivitaet.beschreibung || '(keine Beschreibung)'}</p>
              </div>

              {/* Dateien */}
              <div className="detail-section">
                <h3>Dateien ({dateien.length})</h3>
                {dateien.length > 0 ? (
                  <div className="file-list">
                    {dateien.map(datei => (
                      <div key={datei.id} className="file-item">
                        <span className="file-icon">📎</span>
                        <span className="file-name">{datei.dateiname}</span>
                        <span className="file-size">
                          {(datei.dateigross / 1024).toFixed(1)} KB
                        </span>
                        <button 
                          className="btn-small btn-delete"
                          onClick={() => handleDeleteFile(datei.id)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-data">Keine Dateien</p>
                )}
                <label className="file-upload-label">
                  + Datei hochladen
                  <input 
                    type="file" 
                    onChange={handleFileUpload} 
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              {/* Projekt-Zuordnung */}
              <div className="detail-section">
                <h3>Projekt</h3>
                {aktivitaet.projekt_id ? (
                  <div className="project-info">
                    <span>✓ Projekt #{aktivitaet.projekt_id}</span>
                    <button 
                      className="btn-small btn-secondary"
                      onClick={() => handleProjektZuweisen(null)}
                    >
                      Entfernen
                    </button>
                  </div>
                ) : (
                  <div className="project-selector">
                    <p className="no-data">Noch nicht zugewiesen</p>
                    <select 
                      onChange={(e) => handleProjektZuweisen(e.target.value)}
                      className="project-select"
                    >
                      <option value="">-- Zu Projekt zuweisen --</option>
                      {projekte.map(p => (
                        <option key={p.id} value={p.id}>
                          Projekt: {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Edit Mode
            <div className="edit-mode">
              <div className="form-group">
                <label>Titel</label>
                <input
                  type="text"
                  name="titel"
                  value={formData.titel}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Beschreibung</label>
                <textarea
                  name="beschreibung"
                  value={formData.beschreibung || ''}
                  onChange={handleChange}
                  rows="4"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Typ</label>
                  <select name="typ" value={formData.typ} onChange={handleChange}>
                    <option>Anruf</option>
                    <option>Email</option>
                    <option>Meeting</option>
                    <option>Aufgabe</option>
                    <option>Notiz</option>
                    <option>Angebot</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select name="status" value={formData.status} onChange={handleChange}>
                    <option>Geplant</option>
                    <option>In Bearbeitung</option>
                    <option>Abgeschlossen</option>
                    <option>Abgebrochen</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Priorität</label>
                  <select name="prioritaet" value={formData.prioritaet} onChange={handleChange}>
                    <option>Kritisch</option>
                    <option>Hoch</option>
                    <option>Normal</option>
                    <option>Niedrig</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Fälligkeitsdatum</label>
                <input
                  type="date"
                  name="datum_fällig"
                  value={formData.datum_fällig || format(new Date(), 'yyyy-MM-dd')}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {!editing ? (
            <>
              <button 
                className="btn btn-secondary"
                onClick={() => setShowExportForm(!showExportForm)}
              >
                📤 Zu Todo exportieren
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => setEditing(true)}
              >
                ✎ Bearbeiten
              </button>
              <button 
                className="btn btn-danger"
                onClick={() => {
                  if (window.confirm('Aktivität wirklich löschen?')) {
                    onDelete();
                  }
                }}
              >
                🗑️ Löschen
              </button>
              <button 
                className="btn btn-secondary"
                onClick={onClose}
              >
                Schließen
              </button>
            </>
          ) : (
            <>
              <button 
                className="btn btn-secondary"
                onClick={() => setEditing(false)}
              >
                Abbrechen
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? 'Wird gespeichert...' : 'Speichern'}
              </button>
            </>
          )}
        </div>

        {/* Export-Form */}
        {showExportForm && (
          <div className="export-form">
            <h3>Zu Todo exportieren</h3>
            <div className="form-group">
              <label>Service</label>
              <select 
                value={exportType}
                onChange={(e) => setExportType(e.target.value)}
              >
                <option>Local</option>
                <option>Microsoft</option>
                <option>Google</option>
                <option>Todoist</option>
              </select>
            </div>
            <div className="form-actions">
              <button 
                className="btn btn-primary"
                onClick={handleExportTodo}
              >
                Exportieren
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => setShowExportForm(false)}
              >
                Abbrechen
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}