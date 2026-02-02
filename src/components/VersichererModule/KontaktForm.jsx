import React, { useState } from 'react';
import './KontaktForm.css';

const KontaktForm = ({ versicherer, kontakt, onSaveSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    vorname: kontakt?.vorname || '',
    nachname: kontakt?.nachname || '',
    position: kontakt?.position || '',
    email: kontakt?.email || '',
    telefon: kontakt?.telefon || '',
    art: kontakt?.art || '',
    direkt_erreichbar: kontakt?.direkt_erreichbar || false,
    status: kontakt?.status || 'Aktiv',
    notizen: kontakt?.notizen || ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const artOptions = ['Beratung', 'Underwriting', 'Schaden', 'Marketing', 'Sonstiges'];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleArtChange = (option) => {
    const currentArt = formData.art ? formData.art.split(',') : [];
    const newArt = currentArt.includes(option)
      ? currentArt.filter(a => a !== option)
      : [...currentArt, option];
    setFormData(prev => ({
      ...prev,
      art: newArt.join(',')
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const method = kontakt ? 'PUT' : 'POST';
      const url = kontakt
        ? `http://localhost:5000/api/versicherer/kontakt/${kontakt.id}`
        : `http://localhost:5000/api/versicherer/${versicherer.id}/kontakte`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Fehler beim Speichern');

      alert('Kontakt erfolgreich gespeichert');
      onSaveSuccess();
    } catch (err) {
      setError('Fehler: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="kontakt-form" onSubmit={handleSubmit}>
      <h3>{kontakt ? 'Kontakt bearbeiten' : 'Neuer Kontakt'}</h3>

      {error && <div className="error-message">{error}</div>}

      <div className="form-row">
        <div className="form-group">
          <label>Vorname *</label>
          <input
            type="text"
            name="vorname"
            value={formData.vorname}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Nachname *</label>
          <input
            type="text"
            name="nachname"
            value={formData.nachname}
            onChange={handleInputChange}
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label>Position</label>
        <input
          type="text"
          name="position"
          value={formData.position}
          onChange={handleInputChange}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Email *</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Telefon *</label>
          <input
            type="tel"
            name="telefon"
            value={formData.telefon}
            onChange={handleInputChange}
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label>Art (Rolle) *</label>
        <div className="checkbox-group">
          {artOptions.map(option => (
            <label key={option} className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.art.includes(option)}
                onChange={() => handleArtChange(option)}
              />
              {option}
            </label>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            name="direkt_erreichbar"
            checked={formData.direkt_erreichbar}
            onChange={handleInputChange}
          />
          Direkt erreichbar (in Dropdowns prominent zeigen)
        </label>
      </div>

      <div className="form-group">
        <label>Status</label>
        <select name="status" value={formData.status} onChange={handleInputChange}>
          <option value="Aktiv">🟢 Aktiv</option>
          <option value="Inaktiv">⚫ Inaktiv</option>
        </select>
      </div>

      <div className="form-group">
        <label>Notizen</label>
        <textarea
          name="notizen"
          value={formData.notizen}
          onChange={handleInputChange}
          rows="3"
        />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Speichert...' : 'Speichern'}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Abbrechen
        </button>
      </div>
    </form>
  );
};

export default KontaktForm;