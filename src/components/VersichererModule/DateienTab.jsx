import React, { useState, useEffect } from 'react';
import './DateienTab.css';

const DateienTab = ({ versicherer }) => {
  const [dateien, setDateien] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadData, setUploadData] = useState({
    dateiname: '',
    dateityp: 'ZAV',
    beschreibung: '',
    gueltig_von: '',
    gueltig_ab: ''
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
    setUploadData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setError(null);

    // Validierung
    if (!uploadData.dateiname.trim()) {
      setError('Dateiname ist erforderlich');
      return;
    }

    try {
      console.log('Sende Metadaten:', uploadData);

      const response = await fetch(`http://localhost:5000/api/versicherer/${versicherer.id}/dateien`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(uploadData)
      });

      console.log('Response Status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Fehler beim Upload');
      }

      console.log('Upload erfolgreich!');
      
      // Reset Form
      setUploadData({
        dateiname: '',
        dateityp: 'ZAV',
        beschreibung: '',
        gueltig_von: '',
        gueltig_bis: ''
      });
      
      setShowUpload(false);
      loadDateien();
    } catch (err) {
      console.error('Upload Fehler:', err);
      setError('Fehler: ' + err.message);
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
          onClick={() => setShowUpload(!showUpload)}
        >
          {showUpload ? '✕ Abbrechen' : '+ Neue Datei'}
        </button>
      </div>

      {showUpload && (
        <form className="upload-form" onSubmit={handleUpload}>
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label>Dateiname *</label>
            <input
              type="text"
              name="dateiname"
              value={uploadData.dateiname}
              onChange={handleInputChange}
              placeholder="z.B. ZAV_2026_Hausrat.pdf"
              required
            />
          </div>

          <div className="form-group">
            <label>Dateityp *</label>
            <select 
              name="dateityp" 
              value={uploadData.dateityp}
              onChange={handleInputChange}
            >
              <option value="ZAV">🏛️ ZAV</option>
              <option value="Tarife">💰 Tarife</option>
              <option value="Bedingungen">📋 Bedingungen</option>
              <option value="Brochüren">📖 Brochüren</option>
              <option value="Sonstiges">📎 Sonstiges</option>
            </select>
          </div>

          <div className="form-group">
            <label>Beschreibung</label>
            <input
              type="text"
              name="beschreibung"
              value={uploadData.beschreibung}
              onChange={handleInputChange}
              placeholder="z.B. ZAV 2026 - Hausrat & Privathaftpflicht"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Gültig von</label>
              <input
                type="date"
                name="gueltig_von"
                value={uploadData.gueltig_von}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>Gültig bis</label>
              <input
                type="date"
                name="gueltig_bis"
                value={uploadData.gueltig_bis}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary">💾 Speichern</button>
            <button type="button" className="btn-secondary" onClick={() => setShowUpload(false)}>
              Abbrechen
            </button>
          </div>
        </form>
      )}

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
              </div>
              <div className="datei-actions">
                <button 
                  className="btn-small btn-danger"
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