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
      // Lade Ansprechpersonen
      const respAnspr = await fetch(`http://localhost:5000/api/versicherer/${versicherer.id}/ansprechpersonen`);
      const dataAnspr = await respAnspr.json();
      setAnsprechpersonen(dataAnspr);

      // Lade Kontakte
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

  const types = ['Privatkunden', 'Firmenkunden', 'Pensionskasse'];

  return (
    <div className="ansprechpersonen-tab">
      <h2>👥 Spezialisierte Ansprechpersonen</h2>
      <p className="info-text">
        Für jede Kategorie kann eine Ansprechperson definiert werden.
        Diese werden im Tracking-Modul automatisch geladen.
      </p>

      {types.map(typ => {
        const person = ansprechpersonen.find(a => a.typ === typ);

        return (
          <div key={typ} className="ansprechperson-card">
            <div className="type-header">
              {typ === 'Privatkunden' && '🟢'}
              {typ === 'Firmenkunden' && '🟡'}
              {typ === 'Pensionskasse' && '🟣'}
              {' '} {typ}
            </div>

            {person ? (
              <div className="person-info">
                <p><strong>{person.vorname} {person.nachname}</strong></p>
                <p>{person.position}</p>
                <p>{person.email}</p>
                <p>{person.telefon}</p>
                {person.ist_hauptansprechperson && <p className="badge">☑️ Hauptansprechperson</p>}
                <button 
                  className="btn-danger"
                  onClick={() => handleRemove(typ)}
                >
                  Entfernen
                </button>
              </div>
            ) : (
              <div className="no-person">
                [-- Noch nicht zugewiesen --]
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
