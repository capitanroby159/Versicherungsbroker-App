import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './VersichererList.css';

const VersichererList = () => {
  const [versicherer, setVersicherer] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // WICHTIG: Diese Funktion lädt NUR die LISTE!
    fetch('http://localhost:5000/api/versicherer')
      .then(res => res.json())
      .then(data => {
        setVersicherer(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Fehler beim Laden:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="loading">Lädt...</div>;

  return (
    <div className="versicherer-list-container">
      <div className="versicherer-header">
        <h1>🏢 Versicherer-Management</h1>
        <button className="btn-primary" onClick={() => navigate('/versicherer/new')}>
          + Neuer Versicherer
        </button>
      </div>

      <div className="versicherer-grid">
        {versicherer.length === 0 ? (
          <div className="empty-state">
            <p>Noch keine Versicherer erfasst</p>
          </div>
        ) : (
          versicherer.map(v => (
            <div 
              key={v.id} 
              className="versicherer-card"
              onClick={() => navigate(`/versicherer/${v.id}`)}
            >
              <div className="card-header">
                <h3>{v.name}</h3>
                <span className={`status-badge status-${v.status?.toLowerCase() || 'aktiv'}`}>
                  {v.status === 'Aktiv' ? '🟢' : '⚫'} {v.status}
                </span>
              </div>

              <div className="card-body">
                {v.ort && <p><strong>Ort:</strong> {v.ort}</p>}
                {v.telefon && <p><strong>Telefon:</strong> {v.telefon}</p>}
                {v.zav_seit && <p><strong>ZAV seit:</strong> {new Date(v.zav_seit).toLocaleDateString('de-CH')}</p>}
              </div>

              <div className="card-actions">
                <button className="btn-secondary" onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/versicherer/${v.id}`);
                }}>
                  Bearbeiten
                </button>
                <button className="btn-danger" onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('Wirklich löschen?')) {
                    fetch(`http://localhost:5000/api/versicherer/${v.id}`, { method: 'DELETE' })
                      .then(() => setVersicherer(prev => prev.filter(x => x.id !== v.id)))
                      .catch(err => console.error('Fehler beim Löschen:', err));
                  }
                }}>
                  Löschen
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default VersichererList;