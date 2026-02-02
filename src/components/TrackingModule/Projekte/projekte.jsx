// src/components/Tracking/Projekte/Projekte.jsx
import React, { useState, useEffect } from 'react';
import './Projekte.css';

export default function Projekte() {
  const [projekte, setProjekte] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProjekte();
  }, []);

  const fetchProjekte = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/projekte');
      if (res.ok) {
        const data = await res.json();
        setProjekte(data);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Projekte:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="projekte-container">
      <h2>Projekte mit Aktivitäten</h2>
      
      {loading ? (
        <div className="loading">Wird geladen...</div>
      ) : projekte.length === 0 ? (
        <div className="empty-state">
          Keine Projekte vorhanden. <button className="btn-link">+ Neues Projekt erstellen</button>
        </div>
      ) : (
        <div className="projekte-grid">
          {projekte.map(projekt => (
            <div key={projekt.id} className="projekt-card">
              <div className="projekt-header">
                <h3>{projekt.name}</h3>
                <span className={`status-badge status-${projekt.status.toLowerCase()}`}>
                  {projekt.status}
                </span>
              </div>
              
              <p className="projekt-beschreibung">{projekt.beschreibung}</p>
              
              <div className="projekt-meta">
                <span className="meta-item">
                  📅 {new Date(projekt.datum_erstellt).toLocaleDateString('de-CH')}
                </span>
                {projekt.datum_fällig && (
                  <span className="meta-item">
                    ⏰ Fällig: {new Date(projekt.datum_fällig).toLocaleDateString('de-CH')}
                  </span>
                )}
              </div>
              
              <div className="projekt-aktivitaeten">
                <a href={`/projekte/${projekt.id}`} className="btn-details">
                  Ansehen & Aktivitäten verwalten →
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}