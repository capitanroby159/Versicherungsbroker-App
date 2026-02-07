import React, { useState, useEffect } from 'react';
import './DateienTab.css';

const DateienTab = ({ versicherer }) => {
  const [dateien, setDateien] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    datei_link: '',
    dateiname: '',
    dateityp: 'ZAV',
    beschreibung: '',
    gueltig_von: '',
    gueltig_bis: ''
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDateien();
  }, [versicherer.id]);

  const loadDateien = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/versicherer/${versicherer.id}/dateien`);
      const data = await response.json();
      setDateien(data);
      setLoading(false);
    } catch (err) {
      console.error('Fehler beim Laden:', err);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validierung
    if (!formData.datei_link.trim()) {
      setError('Datei Link ist erforderlich');
      return;
    }
    if (!formData.dateiname.trim()) {
      setError('Dateiname ist erforderlich');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/versicherer/${versicherer.id}/dateien`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Fehler beim Speichern');
      }

      // Reset Form
      setFormData({
        datei_link: '',
        dateiname: '',
        dateityp: 'ZAV',
        beschreibung: '',
        gueltig_von: '',
        gueltig_bis: ''
      });

      setShowModal(false);
      loadDateien();
    } catch (err) {
      console.error('Fehler:', err);
      setError(err.message);
    }
  };

  const handleDelete = async (dateiId) => {
    if (!window.confirm('Wirklich löschen?')) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/versicherer/${versicherer.id}/dateien/${dateiId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Fehler beim Löschen');

      setDateien(prev => prev.filter(d => d.id !== dateiId));
      alert('Datei gelöscht');
    } catch (err) {
      alert('Fehler: ' + err.message);
    }
  };

  if (loading) return <div className="loading">Lädt...</div>;

  const isExpired = (gueltig_bis) => {
    if (!gueltig_bis) return false;
    return new Date(gueltig_bis) < new Date();
  };

  return (
    <div className="dateien-tab">
      <div className="dateien-header">
        <h2>📄 Dateien</h2>
        <button 
          className="btn-primary"
          onClick={() => setShowModal(!showModal)}
        >
          {showModal ? '✕ Abbrechen' : '+ Neue Datei'}
        </button>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>📄 Datei hinzufügen</h3>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit}>
              {/* DATEI LINK - ZUERST */}
              <div className="form-group">
                <label>Datei Link (Nextcloud) *</label>
                <input
                  type="url"
                  name="datei_link"
                  value={formData.datei_link}
                  onChange={handleInputChange}
                  placeholder="https://nextcloud.example.com/files/123..."
                  required
                />
              </div>

              {/* DATEINAME */}
              <div className="form-group">
                <label>Dateiname *</label>
                <input
                  type="text"
                  name="dateiname"
                  value={formData.dateiname}
                  onChange={handleInputChange}
                  placeholder="z.B. ZAV_2026_Hausrat.pdf"
                  required
                />
              </div>

              {/* DATEITYP */}
              <div className="form-group">
                <label>Dateityp *</label>
                <select 
                  name="dateityp" 
                  value={formData.dateityp}
                  onChange={handleInputChange}
                >
                  <option value="ZAV">🏛️ ZAV</option>
                  <option value="Tarife">💰 Tarife</option>
                  <option value="Bedingungen">📋 Bedingungen</option>
                  <option value="Brochüren">📖 Brochüren</option>
                  <option value="Sonstiges">📎 Sonstiges</option>
                </select>
              </div>

              {/* BESCHREIBUNG */}
              <div className="form-group">
                <label>Beschreibung</label>
                <input
                  type="text"
                  name="beschreibung"
                  value={formData.beschreibung}
                  onChange={handleInputChange}
                  placeholder="z.B. ZAV 2026 - Hausrat & Privathaftpflicht"
                />
              </div>

              {/* GÜLTIG VON / BIS */}
              <div className="form-row">
                <div className="form-group">
                  <label>Gültig von</label>
                  <input
                    type="date"
                    name="gueltig_von"
                    value={formData.gueltig_von}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Gültig bis</label>
                  <input
                    type="date"
                    name="gueltig_bis"
                    value={formData.gueltig_bis}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-primary">💾 Speichern</button>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Abbrechen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DATEIEN LISTE */}
      <div className="dateien-list">
        {dateien.length === 0 ? (
          <p className="empty">Noch keine Dateien erfasst</p>
        ) : (
          dateien.map(d => (
            <div key={d.id} className={`datei-item ${isExpired(d.gueltig_bis) ? 'expired' : ''}`}>
              <div className="datei-info">
                <p className="datei-name">📋 {d.dateiname}</p>
                <p className="datei-type">{d.dateityp}</p>
                {d.beschreibung && <p className="datei-desc">{d.beschreibung}</p>}
                {d.gueltig_von || d.gueltig_bis ? (
                  <p className="datei-validity">
                    Gültig: {d.gueltig_von || '-'} bis {d.gueltig_bis || '-'}
                    {isExpired(d.gueltig_bis) && <span className="expired-badge"> [ABGELAUFEN]</span>}
                  </p>
                ) : null}
                <a href={d.datei_link} target="_blank" rel="noopener noreferrer" className="datei-link">
                  🔗 Link öffnen
                </a>
              </div>
              <div className="datei-actions">
                <button 
                  className="btn-danger"
                  onClick={() => handleDelete(d.id)}
                >
                  🗑️ Löschen
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DateienTab;