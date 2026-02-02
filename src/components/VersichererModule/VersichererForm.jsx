import React, { useState } from 'react';
import './VersichererForm.css';

const VersichererForm = ({ versicherer, isNew, onSaveSuccess }) => {
  const [formData, setFormData] = useState({
    name: versicherer?.name || '',
    strasse: versicherer?.strasse || '',
    hausnummer: versicherer?.hausnummer || '',
    plz: versicherer?.plz || '',
    ort: versicherer?.ort || '',
    land: versicherer?.land || 'Switzerland',
    telefon: versicherer?.telefon || '',
    website: versicherer?.website || '',
    status: versicherer?.status || 'Aktiv',
    zav_seit: versicherer?.zav_seit ? versicherer.zav_seit.split('T')[0] : '',
    notizen: versicherer?.notizen || ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

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
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Validierung
      if (!formData.name.trim()) {
        throw new Error('Name ist erforderlich');
      }
      if (!formData.telefon.trim()) {
        throw new Error('Telefon ist erforderlich');
      }

      // ✅ DATUM FORMATIEREN - NUR YYYY-MM-DD!
      const dataToSend = {
        ...formData,
        zav_seit: formData.zav_seit ? formData.zav_seit.split('T')[0] : ''
      };

      const method = isNew ? 'POST' : 'PUT';
      const url = isNew 
        ? 'http://localhost:5000/api/versicherer'
        : `http://localhost:5000/api/versicherer/${versicherer.id}`;

      console.log('Speichere mit Method:', method, 'URL:', url);
      console.log('Daten:', dataToSend);

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      });

      console.log('Response Status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server Error: ${response.status}`);
      }

      const data = await response.json();
      
      console.log('Erfolgreich gespeichert:', data);
      setSuccess(true);
      
      // Nach 2 Sekunden den Success ausblenden
      setTimeout(() => setSuccess(false), 2000);

      // Callback ausführen
      if (isNew) {
        onSaveSuccess({ ...dataToSend, id: data.id });
      } else {
        onSaveSuccess({ ...versicherer, ...dataToSend });
      }
    } catch (err) {
      console.error('Fehler beim Speichern:', err);
      setError(err.message || 'Fehler beim Speichern');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="versicherer-form">
      <h2>📍 Stammdaten</h2>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">✅ Erfolgreich gespeichert!</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Grundinformationen</h3>

          <div className="form-group">
            <label>Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder="z.B. AXA Switzerland"
            />
          </div>

          <div className="form-group">
            <label>Website</label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              placeholder="https://www.example.ch"
            />
          </div>

          <div className="form-group">
            <label>Telefon (Zentrale) *</label>
            <input
              type="tel"
              name="telefon"
              value={formData.telefon}
              onChange={handleInputChange}
              required
              placeholder="+41 44 555 1111"
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Adresse</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Strasse</label>
              <input
                type="text"
                name="strasse"
                value={formData.strasse}
                onChange={handleInputChange}
                placeholder="z.B. Brandschenkestrasse"
              />
            </div>

            <div className="form-group">
              <label>Hausnummer</label>
              <input
                type="text"
                name="hausnummer"
                value={formData.hausnummer}
                onChange={handleInputChange}
                placeholder="60"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Postleitzahl</label>
              <input
                type="text"
                name="plz"
                value={formData.plz}
                onChange={handleInputChange}
                placeholder="8002"
              />
            </div>

            <div className="form-group">
              <label>Ort</label>
              <input
                type="text"
                name="ort"
                value={formData.ort}
                onChange={handleInputChange}
                placeholder="Zürich"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Land</label>
            <select name="land" value={formData.land} onChange={handleInputChange}>
              <option value="Switzerland">Switzerland</option>
              <option value="Germany">Germany</option>
              <option value="Austria">Austria</option>
              <option value="France">France</option>
              <option value="Italy">Italy</option>
            </select>
          </div>
        </div>

        <div className="form-section">
          <h3>Status & Verwaltung</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Status</label>
              <select name="status" value={formData.status} onChange={handleInputChange}>
                <option value="Aktiv">🟢 Aktiv</option>
                <option value="Inaktiv">⚫ Inaktiv</option>
              </select>
            </div>

            <div className="form-group">
              <label>ZAV seit</label>
              <input
                type="date"
                name="zav_seit"
                value={formData.zav_seit}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Notizen</h3>
          <div className="form-group">
            <textarea
              name="notizen"
              value={formData.notizen}
              onChange={handleInputChange}
              rows="4"
              placeholder="Zusätzliche Informationen zum Versicherer..."
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? '⏳ Speichert...' : '💾 Speichern'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VersichererForm;