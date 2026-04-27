import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './VersichererList.css';

const VersichererList = () => {
  const [versicherer, setVersicherer] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    fetch('http://localhost:5000/api/versicherer', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => { setVersicherer(data); setLoading(false); })
      .catch(err => { console.error('Fehler beim Laden:', err); setLoading(false); });
  }, []);

  const handleDelete = async (v) => {
    if (window.confirm(`Versicherer "${v.name}" wirklich löschen?`)) {
      try {
        const response = await fetch(`http://localhost:5000/api/versicherer/${v.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        });
        if (response.ok) {
          setVersicherer(prev => prev.filter(x => x.id !== v.id));
          alert('✅ Versicherer gelöscht');
        } else {
          alert('❌ Fehler beim Löschen');
        }
      } catch (err) {
        console.error('Fehler beim Löschen:', err);
        alert('❌ Fehler: ' + err.message);
      }
    }
  };

  const filtered = versicherer.filter(v =>
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.ort && v.ort.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (v.telefon && v.telefon.includes(searchTerm))
  );

  if (loading) return <div className="loading">Lädt...</div>;

  return (
    <div className="page-wrapper">
      <div className="page-container">
        <div className="list-header">
          <div className="header-left">
            <h1>🏢 Versicherer</h1>
          </div>
          <button className="btn-primary" onClick={() => navigate('/versicherer/new')}>
            + Neuer Versicherer
          </button>
        </div>

        <div className="search-container">
          <input
            type="text"
            placeholder="Nach Name, Ort oder Telefon suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="versicherer-table">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <p>{versicherer.length === 0 ? 'Noch keine Versicherer erfasst' : 'Keine Ergebnisse gefunden'}</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th><th>Ort</th><th>Telefon</th><th>Status</th><th>ZAV seit</th><th>Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(v => (
                  <tr key={v.id} className={v.status !== 'Aktiv' ? 'inactive' : ''}>
                    <td>
                      <strong style={{ cursor: 'pointer', color: '#1e40af' }} onClick={() => navigate(`/versicherer/${v.id}`)}>
                        {v.name}
                      </strong>
                    </td>
                    <td>{v.ort || '-'}</td>
                    <td>{v.telefon || '-'}</td>
                    <td>
                      <span className={`status-badge status-${v.status?.toLowerCase() || 'aktiv'}`}>
                        {v.status === 'Aktiv' ? '🟢' : '⚫'} {v.status}
                      </span>
                    </td>
                    <td>{v.zav_seit ? new Date(v.zav_seit).toLocaleDateString('de-CH') : '-'}</td>
                    <td>
                      <button className="btn-small" onClick={() => navigate(`/versicherer/${v.id}`)}>Öffnen</button>
                      <button className="btn-small btn-danger" onClick={() => handleDelete(v)}>Löschen</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {filtered.length > 0 && (
          <div className="result-count">Zeige {filtered.length} von {versicherer.length} Versicherern</div>
        )}
      </div>
    </div>
  );
};

export default VersichererList;