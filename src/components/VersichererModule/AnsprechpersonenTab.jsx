import React, { useState, useEffect } from 'react';
import './AnsprechpersonenTab.css';

const AnsprechpersonenTab = ({ versicherer }) => {
  const [ansprechpersonen, setAnsprechpersonen] = useState([]);
  const [kontakte, setKontakte] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedKontakt, setSelectedKontakt] = useState(null);

  useEffect(() => {
    loadData();
  }, [versicherer.id]);

  const loadData = async () => {
    try {
      const respAnspr = await fetch(`http://localhost:5000/api/versicherer/${versicherer.id}/ansprechpersonen`);
      const dataAnspr = await respAnspr.json();
      setAnsprechpersonen(dataAnspr);

      const respKont = await fetch(`http://localhost:5000/api/versicherer/${versicherer.id}/kontakte`);
      const dataKont = await respKont.json();
      setKontakte(dataKont);

      setLoading(false);
    } catch (err) {
      console.error('Fehler beim Laden:', err);
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedType || !selectedKontakt) {
      alert('Bitte wähle einen Typ und einen Kontakt');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/versicherer/${versicherer.id}/ansprechpersonen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          typ: selectedType,
          kontakt_id: selectedKontakt,
          ist_hauptansprechperson: true
        })
      });

      if (!response.ok) throw new Error('Fehler beim Speichern');

      alert('Ansprechperson zugewiesen');
      setSelectedType(null);
      setSelectedKontakt(null);
      loadData();
    } catch (err) {
      alert('Fehler: ' + err.message);
    }
  };

  const handleRemove = async (typ) => {
    if (!window.confirm('Wirklich entfernen?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/versicherer/${versicherer.id}/ansprechpersonen/${typ}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Fehler beim Löschen');

      alert('Ansprechperson entfernt');
      loadData();
    } catch (err) {
      alert('Fehler: ' + err.message);
    }
  };

  if (loading) return <div>Lädt...</div>;

  // 4 TYPEN ALS KACHELN NEBENEINANDER
  const types = ['Brokerbetreuer', 'Privatkunden', 'Firmenkunden', 'Pensionskasse'];

  return (
    <div className="ansprechpersonen-tab">
      <h2>👥 Spezialisierte Ansprechpersonen</h2>
      <p className="info-text">
        Für jede Kategorie kann eine Ansprechperson definiert werden.
        Diese werden im Tracking-Modul automatisch geladen.
      </p>

      {/* 4er GRID - Jede Kachel ist ein Typ */}
      <div className="types-grid">
        {types.map(typ => {
          const person = ansprechpersonen.find(a => a.typ === typ);

          return (
            <div key={typ} className="type-card">
              <div className="card-header">{typ}</div>

              {person ? (
                <div className="card-content">
                  <div className="person-name">
                    {person.vorname} {person.nachname}
                  </div>
                  <div className="person-position">
                    {person.position}
                  </div>

                  {person.email && (
                    <div className="contact-item">
                      <label>Email:</label>
                      <a href={`mailto:${person.email}`} className="contact-value">
                        {person.email}
                      </a>
                    </div>
                  )}

                  {person.telefon && (
                    <div className="contact-item">
                      <label>Telefon:</label>
                      <a href={`tel:${person.telefon}`} className="contact-value">
                        {person.telefon}
                      </a>
                    </div>
                  )}

                  <button 
                    className="btn-remove"
                    onClick={() => handleRemove(typ)}
                  >
                    Entfernen
                  </button>
                </div>
              ) : (
                <div className="card-empty">
                  <p>[-- Noch nicht zugewiesen --]</p>
                  <button 
                    className="btn-secondary"
                    onClick={() => setSelectedType(typ)}
                  >
                    Zuweisen
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* MODAL */}
      {selectedType && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Ansprechperson für {selectedType} wählen</h3>
            
            <select 
              value={selectedKontakt || ''} 
              onChange={(e) => setSelectedKontakt(parseInt(e.target.value))}
            >
              <option value="">-- Wähle einen Kontakt --</option>
              {kontakte.map(k => (
                <option key={k.id} value={k.id}>
                  {k.vorname} {k.nachname} - {k.position}
                </option>
              ))}
            </select>

            <div className="modal-actions">
              <button 
                className="btn-primary"
                onClick={handleAssign}
              >
                Zuweisen
              </button>
              <button 
                className="btn-secondary"
                onClick={() => setSelectedType(null)}
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnsprechpersonenTab;