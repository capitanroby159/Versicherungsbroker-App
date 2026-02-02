import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import VersichererForm from '../../components/VersichererModule/VersichererForm';
import AnsprechpersonenTab from '../../components/VersichererModule/AnsprechpersonenTab';
import KontakteTab from '../../components/VersichererModule/KontakteTab';
import DateienTab from '../../components/VersichererModule/DateienTab';
import './VersichererDetail.css';

const VersichererDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [versicherer, setVersicherer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('stammdaten');
  
  // Überprüfe ob es eine neue oder bestehende Versicherer ist
  const isNew = id === 'new';

  useEffect(() => {
    console.log('VersichererDetail mounted. ID:', id, 'isNew:', isNew);
    
    // Nur laden wenn ID existiert und nicht 'new' ist
    if (!isNew && id && id !== 'undefined') {
      fetchVersicherer();
    } else {
      setLoading(false);
      setVersicherer(null);
    }
  }, [id, isNew]);

  const fetchVersicherer = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Lade Versicherer mit ID:', id);
      const response = await fetch(`http://localhost:5000/api/versicherer/${id}`);
      
      if (!response.ok) {
        throw new Error(`Server antwortet mit Status ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Versicherer geladen:', data);
      setVersicherer(data);
    } catch (err) {
      console.error('Fehler beim Laden:', err);
      setError('Versicherer konnte nicht geladen werden: ' + err.message);
      setVersicherer(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSuccess = (newVersicherer) => {
    console.log('handleSaveSuccess:', newVersicherer);
    setVersicherer(newVersicherer);
    
    // Wenn neu erstellt, navigiere zur Detail-Seite
    if (isNew && newVersicherer.id) {
      navigate(`/versicherer/${newVersicherer.id}`);
    }
  };

  const handleBack = () => {
    console.log('Navigiere zurück zu /versicherer');
    navigate('/versicherer');
  };

  if (loading) return <div className="loading">Lädt...</div>;

  const title = isNew ? 'Neuer Versicherer' : (versicherer?.name || 'Versicherer');

  return (
    <div className="versicherer-detail-container">
      <div className="detail-header">
        <h1>🏢 {title}</h1>
        <button 
          className="btn-secondary"
          onClick={handleBack}
        >
          ← Zurück zur Übersicht
        </button>
      </div>

      {/* TAB SYSTEM */}
      <div className="tab-system">
        <button 
          className={`tab ${activeTab === 'stammdaten' ? 'active' : ''}`}
          onClick={() => setActiveTab('stammdaten')}
        >
          📍 Stammdaten
        </button>
        
        {/* Andere Tabs nur wenn nicht neu */}
        {!isNew && (
          <>
            <button 
              className={`tab ${activeTab === 'ansprechpersonen' ? 'active' : ''}`}
              onClick={() => setActiveTab('ansprechpersonen')}
            >
              👥 Ansprechpersonen
            </button>
            <button 
              className={`tab ${activeTab === 'kontakte' ? 'active' : ''}`}
              onClick={() => setActiveTab('kontakte')}
            >
              👔 Kontakte
            </button>
            <button 
              className={`tab ${activeTab === 'dateien' ? 'active' : ''}`}
              onClick={() => setActiveTab('dateien')}
            >
              📄 Dateien
            </button>
          </>
        )}
      </div>

      {/* TAB CONTENT */}
      <div className="tab-content">
        {error && <div className="error-message">{error}</div>}

        {activeTab === 'stammdaten' && (
          <VersichererForm 
            versicherer={versicherer}
            isNew={isNew}
            onSaveSuccess={handleSaveSuccess}
          />
        )}

        {activeTab === 'ansprechpersonen' && versicherer && (
          <AnsprechpersonenTab versicherer={versicherer} />
        )}

        {activeTab === 'kontakte' && versicherer && (
          <KontakteTab versicherer={versicherer} />
        )}

        {activeTab === 'dateien' && versicherer && (
          <DateienTab versicherer={versicherer} />
        )}
      </div>
    </div>
  );
};

export default VersichererDetail;