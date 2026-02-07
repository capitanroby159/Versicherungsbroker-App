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
  const [showEditForm, setShowEditForm] = useState(false);
  
  const isNew = id === 'new';

  useEffect(() => {
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
      
      const response = await fetch(`http://localhost:5000/api/versicherer/${id}`);
      
      if (!response.ok) {
        throw new Error(`Server antwortet mit Status ${response.status}`);
      }
      
      const data = await response.json();
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
    setVersicherer(newVersicherer);
    setShowEditForm(false);
    
    if (isNew && newVersicherer.id) {
      navigate(`/versicherer/${newVersicherer.id}`);
    }
  };

  const handleBack = () => {
    navigate('/versicherer');
  };

  const handleDeleteVersicherer = async () => {
    if (!confirm('Versicherer wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden!')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/versicherer/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('✅ Versicherer gelöscht!');
        navigate('/versicherer');
      } else {
        alert('❌ Fehler beim Löschen');
      }
    } catch (error) {
      console.error('Error deleting versicherer:', error);
      alert('❌ Fehler: ' + error.message);
    }
  };

  if (loading) return <div className="loading">Lädt...</div>;

  const title = isNew ? 'Neuer Versicherer' : (versicherer?.name || 'Versicherer');

  return (
    <div className="versicherer-detail-wrapper">
      {isNew ? (
        // NEU: Nur Formular
        <div className="page-container">
          <div className="details-header">
            <div className="header-left">
              <button className="back-button" onClick={handleBack}>← Zurück</button>
              <h1>{title}</h1>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="details-page-content">
            <VersichererForm 
              versicherer={null}
              isNew={true}
              onSaveSuccess={handleSaveSuccess}
            />
          </div>
        </div>
      ) : (
        // BESTEHEND: Mit Tabs
        <div className="page-container">
          {/* HEADER */}
          <div className="details-header">
            <div className="header-left">
              <button className="back-button" onClick={handleBack}>← Zurück</button>
              <h1>{title}</h1>
            </div>
            <div className="header-actions">
              <button className="button-edit-small" onClick={() => setShowEditForm(true)}>
                Bearbeiten
              </button>
              <button className="button-delete-small" onClick={handleDeleteVersicherer}>
                Löschen
              </button>
            </div>
          </div>

          {/* TAB NAVIGATION - ZWISCHEN Header und Content */}
          <div className="tab-navigation">
            <button 
              className={`tab-btn ${activeTab === 'stammdaten' ? 'active' : ''}`}
              onClick={() => setActiveTab('stammdaten')}
            >
              📍 Stammdaten
            </button>
            <button 
              className={`tab-btn ${activeTab === 'ansprechpersonen' ? 'active' : ''}`}
              onClick={() => setActiveTab('ansprechpersonen')}
            >
              👥 Ansprechpersonen
            </button>
            <button 
              className={`tab-btn ${activeTab === 'kontakte' ? 'active' : ''}`}
              onClick={() => setActiveTab('kontakte')}
            >
              👔 Kontakte
            </button>
            <button 
              className={`tab-btn ${activeTab === 'dateien' ? 'active' : ''}`}
              onClick={() => setActiveTab('dateien')}
            >
              📄 Dateien
            </button>
          </div>

          {/* EDIT MODAL */}
          {showEditForm && (
            <div className="modal-overlay">
              <div className="modal-content">
                <button className="modal-close" onClick={() => setShowEditForm(false)}>✕</button>
                <VersichererForm 
                  versicherer={versicherer}
                  isNew={false}
                  onSaveSuccess={handleSaveSuccess}
                />
              </div>
            </div>
          )}

          {/* PAGE CONTENT */}
          <div className="details-page-content">
            {error && <div className="error-message">{error}</div>}

            {/* STAMMDATEN SECTION */}
            {activeTab === 'stammdaten' && (
              <>
                {/* Grundinfo */}
                <div className="form-section">
                  <h3>📍 Grundinformationen</h3>
                  <div className="form-row-3">
                    <div className="detail-field">
                      <label>Name</label>
                      <p>{versicherer?.name || '-'}</p>
                    </div>
                    <div className="detail-field">
                      <label>Website</label>
                      <p>{versicherer?.website ? <a href={versicherer.website} target="_blank" rel="noopener noreferrer">🔗 {versicherer.website}</a> : '-'}</p>
                    </div>
                    <div className="detail-field">
                      <label>Telefon</label>
                      <p>{versicherer?.telefon || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Adresse */}
                <div className="form-section">
                  <h3>🏠 Adresse</h3>
                  <div className="form-row-3">
                    <div className="detail-field">
                      <label>Strasse</label>
                      <p>{versicherer?.strasse || '-'}</p>
                    </div>
                    <div className="detail-field">
                      <label>Hausnummer</label>
                      <p>{versicherer?.hausnummer || '-'}</p>
                    </div>
                    <div className="detail-field">
                      <label>Ort</label>
                      <p>{versicherer?.ort || '-'}</p>
                    </div>
                  </div>
                  <div className="form-row-3">
                    <div className="detail-field">
                      <label>Postleitzahl</label>
                      <p>{versicherer?.plz || '-'}</p>
                    </div>
                    <div className="detail-field">
                      <label>Land</label>
                      <p>{versicherer?.land || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="form-section">
                  <h3>📊 Status & Verwaltung</h3>
                  <div className="form-row-2">
                    <div className="detail-field">
                      <label>Status</label>
                      <p>{versicherer?.status === 'Aktiv' ? '🟢 Aktiv' : '⚫ Inaktiv'}</p>
                    </div>
                    <div className="detail-field">
                      <label>ZAV seit</label>
                      <p>{versicherer?.zav_seit ? new Date(versicherer.zav_seit).toLocaleDateString('de-CH') : '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Notizen */}
                {versicherer?.notizen && (
                  <div className="form-section">
                    <h3>📝 Notizen</h3>
                    <div className="detail-field">
                      <p style={{ whiteSpace: 'pre-wrap' }}>{versicherer.notizen}</p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ANSPRECHPERSONEN TAB */}
            {activeTab === 'ansprechpersonen' && versicherer && (
              <AnsprechpersonenTab versicherer={versicherer} />
            )}

            {/* KONTAKTE TAB */}
            {activeTab === 'kontakte' && versicherer && (
              <KontakteTab versicherer={versicherer} />
            )}

            {/* DATEIEN TAB */}
            {activeTab === 'dateien' && versicherer && (
              <DateienTab versicherer={versicherer} />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VersichererDetail;