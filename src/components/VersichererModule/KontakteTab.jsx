import React, { useState, useEffect } from 'react';
import KontaktForm from './KontaktForm';
import './KontakteTab.css';

const KontakteTab = ({ versicherer }) => {
  const [kontakte, setKontakte] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedKontakt, setSelectedKontakt] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAktiv, setFilterAktiv] = useState(true);

  useEffect(() => {
    loadKontakte();
  }, [versicherer.id]);

  const loadKontakte = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/versicherer/${versicherer.id}/kontakte`);
      const data = await response.json();
      setKontakte(data);
      setLoading(false);
    } catch (err) {
      console.error('Fehler beim Laden:', err);
      setLoading(false);
    }
  };

  const handleDeleteKontakt = async (kontaktId) => {
    if (!window.confirm('Wirklich löschen?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/versicherer/kontakt/${kontaktId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Fehler beim Löschen');

      setKontakte(prev => prev.filter(k => k.id !== kontaktId));
      alert('Kontakt gelöscht');
    } catch (err) {
      alert('Fehler: ' + err.message);
    }
  };

  const handleSaveSuccess = () => {
    loadKontakte();
    setShowForm(false);
    setSelectedKontakt(null);
  };

  if (loading) return <div>Lädt...</div>;

  const filtered = kontakte.filter(k => {
    const matchesSearch = !searchTerm || 
      k.vorname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.nachname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = !filterAktiv || k.status === 'Aktiv';
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="kontakte-tab">
      <div className="kontakte-header">
        <h2>👔 Kontakte</h2>
        <button 
          className="btn-primary"
          onClick={() => setShowForm(true)}
        >
          + Neuer Kontakt
        </button>
      </div>

      <div className="kontakte-filter">
        <input
          type="text"
          placeholder="Suchen nach Name oder Email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <label>
          <input 
            type="checkbox" 
            checked={filterAktiv}
            onChange={(e) => setFilterAktiv(e.target.checked)}
          />
          Nur Aktive
        </label>
      </div>

      {showForm ? (
        <KontaktForm 
          versicherer={versicherer}
          kontakt={selectedKontakt}
          onSaveSuccess={handleSaveSuccess}
          onCancel={() => {
            setShowForm(false);
            setSelectedKontakt(null);
          }}
        />
      ) : (
        <table className="kontakte-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Position</th>
              <th>Art</th>
              <th>Email</th>
              <th>Telefon</th>
              <th>Status</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(k => (
              <tr key={k.id} className={k.status !== 'Aktiv' ? 'inactive' : ''}>
                <td><strong>{k.vorname} {k.nachname}</strong></td>
                <td>{k.position}</td>
                <td>{k.art}</td>
                <td>{k.email}</td>
                <td>{k.telefon}</td>
                <td>
                  <span className={`status ${k.status.toLowerCase()}`}>
                    {k.status === 'Aktiv' ? '🟢' : '⚫'} {k.status}
                  </span>
                </td>
                <td>
                  <button 
                    className="btn-small"
                    onClick={() => {
                      setSelectedKontakt(k);
                      setShowForm(true);
                    }}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn-small btn-danger"
                    onClick={() => handleDeleteKontakt(k.id)}
                  >
                    Löschen
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p className="contact-count">
        Zeige {filtered.length} von {kontakte.length} Kontakten
      </p>
    </div>
  );
};

export default KontakteTab;