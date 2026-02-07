import React, { useState, useEffect, useRef } from 'react';
import './KundenForm.css';

const KundenFormModal = ({ kunde, onSaveSuccess, onCancel }) => {
  const [formData, setFormData] = useState({});
  const [allKunden, setAllKunden] = useState([]);
  const [ansprechpersonen, setAnsprechpersonen] = useState([]);
  const [selectedPersonId, setSelectedPersonId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSavingRef = useRef(false);

  const initialFormData = {
    kundentyp: 'Privatperson',
    vorname: '', nachname: '', geburtsdatum: '', ahv_nummer: '',
    beruf: '', ausbildung: '', arbeitgeber_name: '', position: '',
    angestellt_seit: '', arbeitspensum_prozent: '', personalreglement_url: '',
    verhaeltnis: '', ehepartner_name: '', hochzeitsdatum: '', scheidungsdatum: '',
    kinder: [],
    firma_name: '', gruendungsdatum: '', uid: '',
    mehrwertsteuer: 'nein', noga_code: '', taetigkeitsbeschrieb: '',
    status: 'Vollmandat', mandat_url: '', archiv_url: '', iban: '',
    emails: [{ email: '', typ: 'Privat' }],
    telefone: [{ telefon: '', typ: 'Mobil' }],
    adresse: '', plz: '', ort: '', kanton: '', besonderheiten: '',
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    if (typeof dateString !== 'string') return '';
    try {
      const dateOnly = dateString.split('T')[0];
      if (!dateOnly || dateOnly.length < 10) return dateString;
      const [year, month, day] = dateOnly.split('-');
      if (!year || !month || !day) return dateString;
      return `${day}.${month}.${year}`;
    } catch (e) {
      return dateString;
    }
  };

  const parseSwissDate = (swissDate) => {
    if (!swissDate) return '';
    const parts = swissDate.split('.');
    if (parts.length !== 3) return '';
    let [day, month, year] = parts;
    if (year.length === 2) {
      year = parseInt(year) <= 30 ? `20${year}` : `19${year}`;
    }
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  // ✅ NEU: Bereinige Datums-Werte für <input type="date"> (braucht YYYY-MM-DD)
  const cleanDateForInput = (dateValue) => {
    if (!dateValue) return '';
    if (typeof dateValue !== 'string') return '';
    
    // Wenn ISO DateTime (z.B. 2020-01-15T00:00:00.000Z), extrahiere nur das Datum
    if (dateValue.includes('T')) {
      return dateValue.split('T')[0];
    }
    
    // Wenn bereits im Format YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue;
    }
    
    return '';
  };

  const normalizeKunde = (k) => {
    let emails = [{ email: '', typ: 'Privat' }];
    if (k.emails) {
      if (typeof k.emails === 'string') {
        emails = [{ email: k.emails, typ: 'Privat' }];
      } else if (Array.isArray(k.emails)) {
        emails = k.emails.map(e => (typeof e === 'object' ? e : { email: e, typ: 'Privat' }));
      }
    }

    let telefone = [{ telefon: '', typ: 'Mobil' }];
    if (k.telefone) {
      if (typeof k.telefone === 'string') {
        telefone = [{ telefon: k.telefone, typ: 'Mobil' }];
      } else if (Array.isArray(k.telefone)) {
        telefone = k.telefone.map(t => (typeof t === 'object' ? t : { telefon: t, typ: 'Mobil' }));
      }
    }

    // ✅ NEU: Bereinige Datums-Felder beim Laden
    return {
      ...initialFormData,
      ...k,
      emails,
      telefone,
      kinder: k.kinder || [],
      kundentyp: k.kundentyp || 'Privatperson',
      geburtsdatum: cleanDateForInput(k.geburtsdatum),
      hochzeitsdatum: cleanDateForInput(k.hochzeitsdatum),
      scheidungsdatum: cleanDateForInput(k.scheidungsdatum),
      angestellt_seit: cleanDateForInput(k.angestellt_seit),
      gruendungsdatum: cleanDateForInput(k.gruendungsdatum), // ✅ FIX!
    };
  };

  useEffect(() => {
    if (kunde) {
      setFormData(normalizeKunde(kunde));
      if (kunde.kundentyp === 'Firma') {
        loadAnsprechpersonen(kunde.id);
      }
    } else {
      setFormData(initialFormData);
    }
    loadAllKunden();
  }, [kunde]);

  const loadAllKunden = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/kunden');
      const data = await response.json();
      setAllKunden(data);
    } catch (err) {
      console.error('Fehler:', err);
    }
  };

  const loadAnsprechpersonen = async (kundeId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/kunden/${kundeId}/ansprechpersonen`);
      const data = await response.json();
      setAnsprechpersonen(data);
    } catch (err) {
      console.error('Fehler:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEmailChange = (index, field, value) => {
    const newEmails = [...formData.emails];
    if (!newEmails[index]) newEmails[index] = { email: '', typ: 'Privat' };
    newEmails[index][field] = value;
    setFormData(prev => ({ ...prev, emails: newEmails }));
  };

  const handleTelefoneChange = (index, field, value) => {
    const newTelefone = [...formData.telefone];
    if (!newTelefone[index]) newTelefone[index] = { telefon: '', typ: 'Mobil' };
    newTelefone[index][field] = value;
    setFormData(prev => ({ ...prev, telefone: newTelefone }));
  };

  const addEmail = () => {
    const newEmails = [...formData.emails, { email: '', typ: 'Privat' }];
    setFormData(prev => ({ ...prev, emails: newEmails }));
  };

  const removeEmail = (index) => {
    const newEmails = formData.emails.filter((_, idx) => idx !== index);
    setFormData(prev => ({ ...prev, emails: newEmails }));
  };

  const addTelefone = () => {
    const newTelefone = [...formData.telefone, { telefon: '', typ: 'Mobil' }];
    setFormData(prev => ({ ...prev, telefone: newTelefone }));
  };

  const removeTelefone = (index) => {
    const newTelefone = formData.telefone.filter((_, idx) => idx !== index);
    setFormData(prev => ({ ...prev, telefone: newTelefone }));
  };

  const handleKindChange = (index, field, value) => {
    const newKinder = [...formData.kinder];
    if (!newKinder[index]) newKinder[index] = {};
    newKinder[index][field] = value;
    setFormData(prev => ({ ...prev, kinder: newKinder }));
  };

  const addKind = () => {
    setFormData(prev => ({
      ...prev,
      kinder: [...prev.kinder, { vorname: '', nachname: '', geburtsdatum: '', ausbildung: '' }]
    }));
  };

  const removeKind = (index) => {
    setFormData(prev => ({
      ...prev,
      kinder: prev.kinder.filter((_, i) => i !== index)
    }));
  };

  const addAnsprechperson = async () => {
    if (!selectedPersonId) {
      alert('Bitte wähle eine Person aus');
      return;
    }

    const selectedPerson = allKunden.find(k => k.id === parseInt(selectedPersonId));
    if (!selectedPerson) return;

    try {
      const response = await fetch(`http://localhost:5000/api/kunden/${kunde.id}/ansprechpersonen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          person_kunden_id: selectedPersonId,
          position: selectedPerson.position || '',
          telefon: selectedPerson.telefone?.[0]?.telefon || '',
          email: selectedPerson.emails?.[0]?.email || '',
          ist_hauptpartner: false
        })
      });

      if (!response.ok) throw new Error('Fehler');
      setSelectedPersonId(null);
      loadAnsprechpersonen(kunde.id);
    } catch (err) {
      alert('Fehler: ' + err.message);
    }
  };

  const toggleHauptpartner = async (apId, currentValue) => {
    try {
      const response = await fetch(`http://localhost:5000/api/kunden/${kunde.id}/ansprechpersonen/${apId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ist_hauptpartner: !currentValue })
      });

      if (!response.ok) throw new Error('Fehler');
      loadAnsprechpersonen(kunde.id);
    } catch (err) {
      alert('Fehler: ' + err.message);
    }
  };

  const removeAnsprechperson = async (apId) => {
    if (!window.confirm('Wirklich entfernen?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/kunden/${kunde.id}/ansprechpersonen/${apId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Fehler');
      loadAnsprechpersonen(kunde.id);
    } catch (err) {
      alert('Fehler: ' + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting || loading) {
      console.warn('⚠️ Speichern läuft bereits, ignoriere doppelten Request');
      return;
    }
    
    setIsSubmitting(true);
    isSavingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const cleanDateValue = (dateValue) => {
        if (!dateValue) return null;
        if (typeof dateValue !== 'string') return null;
        
        if (dateValue.includes('T')) {
          return dateValue.split('T')[0];
        }
        
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
          return dateValue;
        }
        
        return null;
      };

      if (!formData.kundentyp) {
        setError('Fehler: Kundentyp nicht gesetzt!');
        setLoading(false);
        return;
      }

      console.log('📋 FormData vor Submit:', {
        kundentyp: formData.kundentyp,
        vorname: formData.vorname,
        nachname: formData.nachname,
        firma_name: formData.firma_name,
        gruendungsdatum: formData.gruendungsdatum // ✅ DEBUG
      });

      const dataToSend = {
        ...formData,
        kundentyp: formData.kundentyp || 'Privatperson',
        geburtsdatum: cleanDateValue(formData.geburtsdatum),
        hochzeitsdatum: cleanDateValue(formData.hochzeitsdatum),
        scheidungsdatum: cleanDateValue(formData.scheidungsdatum),
        angestellt_seit: cleanDateValue(formData.angestellt_seit),
        gruendungsdatum: cleanDateValue(formData.gruendungsdatum), // ✅ FIX!
        emails: formData.emails ? formData.emails.map(e => ({ email: e.email, typ: e.typ })) : [],
        telefone: formData.telefone ? formData.telefone.map(t => ({ telefon: t.telefon, typ: t.typ })) : [],
      };

      console.log('📤 Sende Daten:', dataToSend);

      const method = kunde ? 'PUT' : 'POST';
      const url = kunde
        ? `http://localhost:5000/api/kunden/${kunde.id}`
        : 'http://localhost:5000/api/kunden';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      });

      if (!response.ok) {
        if (response.status === 409) {
          console.warn('⚠️ Double-Submit blockiert (409 Conflict - expected)');
          isSavingRef.current = false;
          setIsSubmitting(false);
          setLoading(false);
          return;
        }

        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Speichern');
      }

      const savedKunde = await response.json();
      alert('✅ Kunde gespeichert!');
      onSaveSuccess(savedKunde);
      isSavingRef.current = false;
      setIsSubmitting(false);
    } catch (err) {
      setError('Fehler: ' + err.message);
      isSavingRef.current = false;
      setIsSubmitting(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="kunden-form" onSubmit={handleSubmit}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>{kunde ? 'Kunde bearbeiten' : 'Neuer Kunde'}</h2>
        {kunde && (
          <div style={{ display: 'flex', gap: '12px' }}>
            {formData.mandat_url && (
              <a href={formData.mandat_url} target="_blank" rel="noopener noreferrer" 
                 style={{ padding: '8px 12px', background: '#10B981', color: 'white', borderRadius: '4px', textDecoration: 'none', fontSize: '14px' }}>
                📋 Mandat
              </a>
            )}
            {formData.archiv_url && (
              <a href={formData.archiv_url} target="_blank" rel="noopener noreferrer"
                 style={{ padding: '8px 12px', background: '#6366F1', color: 'white', borderRadius: '4px', textDecoration: 'none', fontSize: '14px' }}>
                📁 Archiv
              </a>
            )}
            {formData.personalreglement_url && (
              <a href={formData.personalreglement_url} target="_blank" rel="noopener noreferrer"
                 style={{ padding: '8px 12px', background: '#10B981', color: 'white', borderRadius: '4px', textDecoration: 'none', fontSize: '14px' }}>
                📄 Reglement
              </a>
            )}
          </div>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* KUNDENTYP */}
      <div className="form-section" style={{ marginBottom: '24px' }}>
        <h3>Kundentyp</h3>
        <div style={{ display: 'flex', gap: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
            <input type="radio" name="kundentyp" value="Privatperson" checked={formData.kundentyp === 'Privatperson'} onChange={handleInputChange} />
            Privatperson
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
            <input type="radio" name="kundentyp" value="Firma" checked={formData.kundentyp === 'Firma'} onChange={handleInputChange} />
            Firma / Unternehmen
          </label>
        </div>
      </div>

      {/* PRIVATPERSON BLOCK */}
      {formData.kundentyp === 'Privatperson' && (
        <>
          <div className="form-section">
            <h3>Persönlich</h3>
            <div className="form-row-2">
              <div className="form-group">
                <label>Vorname *</label>
                <input type="text" name="vorname" value={formData.vorname || ''} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Nachname *</label>
                <input type="text" name="nachname" value={formData.nachname || ''} onChange={handleInputChange} required />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Geburtsdatum</label>
                <input type="text" name="geburtsdatum" placeholder="dd.mm.yyyy" value={formatDateForDisplay(formData.geburtsdatum)} 
                  onChange={(e) => handleInputChange({ target: { name: 'geburtsdatum', value: parseSwissDate(e.target.value) } })} />
              </div>
              <div className="form-group">
                <label>AHV-Nummer</label>
                <input type="text" name="ahv_nummer" value={formData.ahv_nummer || ''} onChange={handleInputChange} />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Status</label>
                <select name="status" value={formData.status || ''} onChange={handleInputChange}>
                  <option value="Vollmandat">Vollmandat</option>
                  <option value="Teilmandat">Teilmandat</option>
                  <option value="Inaktiv">Inaktiv</option>
                </select>
              </div>
              <div className="form-group">
                <label>Nextcloud Mandat-Link</label>
                <input type="url" name="mandat_url" value={formData.mandat_url || ''} onChange={handleInputChange} />
              </div>
            </div>

            <div className="form-group">
              <label>Nextcloud Archiv-Link</label>
              <input type="url" name="archiv_url" value={formData.archiv_url || ''} onChange={handleInputChange} placeholder="https://nextcloud.example.com/..." />
            </div>

            <div className="form-group">
              <label>IBAN</label>
              <input type="text" name="iban" value={formData.iban || ''} onChange={handleInputChange} placeholder="CH93 0076 2011 6238 5295 7" />
            </div>
          </div>

          <div className="form-section">
            <h3>Familie</h3>
            <div className="form-row-2">
              <div className="form-group">
                <label>Familienstand</label>
                <select name="verhaeltnis" value={formData.verhaeltnis || ''} onChange={handleInputChange}>
                  <option value="">-- Wählen --</option>
                  <option value="Ledig">Ledig</option>
                  <option value="Verheiratet">Verheiratet</option>
                  <option value="Konkubinat">Konkubinat</option>
                  <option value="Geschieden">Geschieden</option>
                  <option value="Verwitwet">Verwitwet</option>
                </select>
              </div>
            </div>

            {(formData.verhaeltnis === 'Verheiratet' || formData.verhaeltnis === 'Konkubinat') && (
              <div className="form-row-2">
                <div className="form-group">
                  <label>{formData.verhaeltnis === 'Konkubinat' ? 'Partner/in' : 'Ehepartner'}</label>
                  <select name="ehepartner_name" value={formData.ehepartner_name || ''} onChange={handleInputChange}>
                    <option value="">-- Wählen --</option>
                    {allKunden.filter(k => k.id !== kunde?.id).map(k => (
                      <option key={k.id} value={`${k.vorname} ${k.nachname}`}>
                        {k.vorname} {k.nachname}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>{formData.verhaeltnis === 'Konkubinat' ? 'Zusammenzug' : 'Hochzeitsdatum'}</label>
                  <input type="text" name="hochzeitsdatum" placeholder="dd.mm.yyyy" value={formatDateForDisplay(formData.hochzeitsdatum)} 
                    onChange={(e) => handleInputChange({ target: { name: 'hochzeitsdatum', value: parseSwissDate(e.target.value) } })} />
                </div>
              </div>
            )}

            {formData.verhaeltnis === 'Geschieden' && (
              <div className="form-row-2">
                <div className="form-group">
                  <label>Scheidungsdatum</label>
                  <input type="text" name="scheidungsdatum" placeholder="dd.mm.yyyy" value={formatDateForDisplay(formData.scheidungsdatum)} 
                    onChange={(e) => handleInputChange({ target: { name: 'scheidungsdatum', value: parseSwissDate(e.target.value) } })} />
                </div>
              </div>
            )}

            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label style={{ margin: 0, fontWeight: 600 }}>Kinder</label>
                <button type="button" className="btn-add" onClick={addKind}>+ Kind</button>
              </div>
              
              {formData.kinder && formData.kinder.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {formData.kinder.map((kind, idx) => (
                    <div key={idx} style={{ padding: '12px', background: '#f8fafc', border: '1px solid #cbd5e1', display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input type="text" placeholder="Vorname" value={kind.vorname || ''} onChange={(e) => handleKindChange(idx, 'vorname', e.target.value)} style={{ flex: 1 }} />
                      <input type="text" placeholder="Nachname" value={kind.nachname || ''} onChange={(e) => handleKindChange(idx, 'nachname', e.target.value)} style={{ flex: 1 }} />
                      <input type="date" value={kind.geburtsdatum || ''} onChange={(e) => handleKindChange(idx, 'geburtsdatum', e.target.value)} style={{ flex: 1 }} />
                      <select value={kind.ausbildung || ''} onChange={(e) => handleKindChange(idx, 'ausbildung', e.target.value)} style={{ flex: 1 }}>
                        <option value="">Ausbildung</option>
                        <option value="Kindergarten">Kindergarten</option>
                        <option value="Schule">Schule</option>
                        <option value="Studium">Studium</option>
                        <option value="Erwerbstätig">Erwerbstätig</option>
                      </select>
                      {formData.kinder.length > 1 && (
                        <button type="button" onClick={() => removeKind(idx)} style={{ padding: '4px 8px' }}>🗑️</button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#94a3b8', margin: 0 }}>Keine Kinder erfasst</p>
              )}
            </div>
          </div>

          <div className="form-section">
            <h3>Arbeit</h3>
            <div className="form-row-2">
              <div className="form-group">
                <label>Beruf</label>
                <input type="text" name="beruf" value={formData.beruf || ''} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Ausbildung</label>
                <select name="ausbildung" value={formData.ausbildung || ''} onChange={handleInputChange}>
                  <option value="">-- Ausbildung wählen --</option>
                  <option value="Obligatorische Schule">Obligatorische Schule</option>
                  <option value="Berufslehre">Berufslehre</option>
                  <option value="Gymnasiums/Mittelschule">Gymnasiums/Mittelschule</option>
                  <option value="Höhere Fachschule">Höhere Fachschule</option>
                  <option value="Bachelor">Bachelor</option>
                  <option value="Master">Master</option>
                  <option value="Doktorat">Doktorat</option>
                  <option value="Andere">Andere</option>
                </select>
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Arbeitgeber</label>
                <input type="text" name="arbeitgeber_name" value={formData.arbeitgeber_name || ''} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Position</label>
                <input type="text" name="position" value={formData.position || ''} onChange={handleInputChange} />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Angestellt seit</label>
                {/* ✅ FIX: Verwende cleanDateForInput für angestellt_seit */}
                <input type="date" name="angestellt_seit" value={formData.angestellt_seit || ''} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Arbeitspensum (%)</label>
                <input type="number" name="arbeitspensum_prozent" value={formData.arbeitspensum_prozent || ''} onChange={handleInputChange} />
              </div>
            </div>

            <div className="form-group">
              <label>Personalreglement (Nextcloud Link)</label>
              <input type="url" name="personalreglement_url" value={formData.personalreglement_url || ''} onChange={handleInputChange} placeholder="https://nextcloud.example.com/..." />
            </div>
          </div>
        </>
      )}

      {/* FIRMA BLOCK */}
      {formData.kundentyp === 'Firma' && (
        <>
          <div className="form-section">
            <h3>Firma</h3>
            <div className="form-group">
              <label>Firmenname *</label>
              <input type="text" name="firma_name" value={formData.firma_name || ''} onChange={handleInputChange} required />
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Gründungsdatum</label>
                {/* ✅ FIX: Das Datum wird jetzt korrekt angezeigt und gespeichert */}
                <input 
                  type="date" 
                  name="gruendungsdatum" 
                  value={formData.gruendungsdatum || ''} 
                  onChange={handleInputChange} 
                />
              </div>
              <div className="form-group">
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <label>UID</label>
                    <input type="text" name="uid" value={formData.uid || ''} onChange={handleInputChange} placeholder="CHE-..." />
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      const searchUrl = formData.uid 
                        ? `https://www.zefix.admin.ch/cgi-bin/search.pl?company_name=&company_id=${formData.uid.trim()}&active=on`
                        : 'https://www.zefix.admin.ch/';
                      window.open(searchUrl, '_blank');
                    }}
                    style={{ padding: '8px 12px', background: '#3B82F6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap', marginBottom: '0' }}
                  >
                    🔍 Zefix
                  </button>
                </div>
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Mehrwertsteuer</label>
                <select name="mehrwertsteuer" value={formData.mehrwertsteuer || 'nein'} onChange={handleInputChange}>
                  <option value="ja">Ja</option>
                  <option value="nein">Nein</option>
                </select>
              </div>
              <div className="form-group">
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <label>NOGA-Code</label>
                    <input type="text" name="noga_code" value={formData.noga_code || ''} onChange={handleInputChange} placeholder="z.B. 5610..." />
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      const searchUrl = formData.noga_code 
                        ? `https://www.kubb.admin.ch/site/noga-suche?noga=${formData.noga_code.trim()}`
                        : 'https://www.kubb.admin.ch/';
                      window.open(searchUrl, '_blank');
                    }}
                    style={{ padding: '8px 12px', background: '#8B5CF6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap', marginBottom: '0' }}
                  >
                    🔍 KUBB
                  </button>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Tätigkeitsbeschrieb</label>
              <textarea name="taetigkeitsbeschrieb" value={formData.taetigkeitsbeschrieb || ''} onChange={handleInputChange} rows="3" placeholder="Beschreiben Sie die Geschäftstätigkeit..." />
            </div>

            <div className="form-group">
              <label>Status</label>
              <select name="status" value={formData.status || ''} onChange={handleInputChange}>
                <option value="Vollmandat">Vollmandat</option>
                <option value="Teilmandat">Teilmandat</option>
                <option value="Inaktiv">Inaktiv</option>
              </select>
            </div>

            <div className="form-group">
              <label>Nextcloud Mandat-Link</label>
              <input type="url" name="mandat_url" value={formData.mandat_url || ''} onChange={handleInputChange} placeholder="https://nextcloud.example.com/..." />
            </div>

            <div className="form-group">
              <label>Nextcloud Archiv-Link</label>
              <input type="url" name="archiv_url" value={formData.archiv_url || ''} onChange={handleInputChange} placeholder="https://nextcloud.example.com/..." />
            </div>

            <div className="form-group">
              <label>Personalreglement (Nextcloud Link)</label>
              <input type="url" name="personalreglement_url" value={formData.personalreglement_url || ''} onChange={handleInputChange} placeholder="https://nextcloud.example.com/..." />
            </div>

            <div className="form-group">
              <label>IBAN</label>
              <input type="text" name="iban" value={formData.iban || ''} onChange={handleInputChange} placeholder="CH93 0076 2011 6238 5295 7" />
            </div>
          </div>

          {kunde?.kundentyp === 'Firma' && (
            <div className="form-section">
              <h3>Ansprechpersonen</h3>
              <div style={{ marginBottom: '12px' }}>
                <label>Ansprechperson hinzufügen:</label>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <select value={selectedPersonId || ''} onChange={(e) => setSelectedPersonId(parseInt(e.target.value) || null)}>
                    <option value="">-- Person aus Kundenliste --</option>
                    {allKunden.filter(k => k.kundentyp === 'Privatperson').map(k => (
                      <option key={k.id} value={k.id}>
                        {k.vorname} {k.nachname}
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={addAnsprechperson} style={{ padding: '8px 12px', background: '#1E40AF', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Hinzufügen
                  </button>
                </div>
              </div>

              {ansprechpersonen && ansprechpersonen.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {ansprechpersonen.map((ap) => (
                    <div key={ap.id} style={{ padding: '12px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                      <p style={{ margin: '0 0 4px 0', fontWeight: 600 }}>{ap.person_name}</p>
                      {ap.position && <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#6b7280' }}><strong>Position:</strong> {ap.position}</p>}
                      {ap.email && <p style={{ margin: '0 0 4px 0', fontSize: '13px' }}><strong>Email:</strong> {ap.email}</p>}
                      {ap.telefon && <p style={{ margin: '0 8px 0 0', fontSize: '13px' }}><strong>Telefon:</strong> {ap.telefon}</p>}
                      <button 
                        type="button" 
                        onClick={() => removeAnsprechperson(ap.id)} 
                        style={{ padding: '4px 8px', background: '#ef4444', color: 'white', border: 'none', cursor: 'pointer', fontSize: '12px' }}
                      >
                        Entfernen
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#94a3b8', margin: 0 }}>Keine Ansprechpersonen erfasst</p>
              )}
            </div>
          )}
        </>
      )}

      {/* ADRESSE - FÜR ALLE */}
      <div className="form-section">
        <h3>Adresse</h3>
        <div className="form-group">
          <label>Strasse & Hausnummer</label>
          <input type="text" name="adresse" value={formData.adresse || ''} onChange={handleInputChange} placeholder="z.B. Hauptstrasse 42" />
        </div>

        <div className="form-row-2">
          <div className="form-group">
            <label>PLZ</label>
            <input type="text" name="plz" value={formData.plz || ''} onChange={handleInputChange} />
          </div>
          <div className="form-group">
            <label>Ort</label>
            <input type="text" name="ort" value={formData.ort || ''} onChange={handleInputChange} />
          </div>
        </div>

        <div className="form-group">
          <label>Kanton</label>
          <select name="kanton" value={formData.kanton || ''} onChange={handleInputChange}>
            <option value="">-- Kanton wählen --</option>
            <option value="AG">Aargau (AG)</option>
            <option value="AI">Appenzell Innerrhoden (AI)</option>
            <option value="AR">Appenzell Ausserrhoden (AR)</option>
            <option value="BE">Bern (BE)</option>
            <option value="BL">Basel-Landschaft (BL)</option>
            <option value="BS">Basel-Stadt (BS)</option>
            <option value="FR">Freiburg (FR)</option>
            <option value="GE">Genf (GE)</option>
            <option value="GL">Glarus (GL)</option>
            <option value="GR">Graubünden (GR)</option>
            <option value="JU">Jura (JU)</option>
            <option value="LU">Luzern (LU)</option>
            <option value="NE">Neuenburg (NE)</option>
            <option value="NW">Nidwalden (NW)</option>
            <option value="OW">Obwalden (OW)</option>
            <option value="SG">St. Gallen (SG)</option>
            <option value="SH">Schaffhausen (SH)</option>
            <option value="SO">Solothurn (SO)</option>
            <option value="SZ">Schwyz (SZ)</option>
            <option value="TG">Thurgau (TG)</option>
            <option value="TI">Tessin (TI)</option>
            <option value="UR">Uri (UR)</option>
            <option value="VD">Waadt (VD)</option>
            <option value="VS">Wallis (VS)</option>
            <option value="ZG">Zug (ZG)</option>
            <option value="ZH">Zürich (ZH)</option>
          </select>
        </div>
      </div>

      {/* KONTAKT - FÜR ALLE */}
      <div className="form-section">
        <h3>📞 Kontakt</h3>
        
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <label>📧 E-Mails</label>
            <button type="button" onClick={addEmail} style={{ padding: '6px 12px', background: '#10B981', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>
              + Email
            </button>
          </div>
          {formData.emails && formData.emails.length > 0 ? (
            formData.emails.map((e, idx) => (
              <div key={idx} style={{ marginBottom: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input type="email" placeholder="Email" value={e.email || ''} onChange={(ev) => handleEmailChange(idx, 'email', ev.target.value)} style={{ flex: '0 0 70%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontFamily: 'Lora, serif' }} />
                <select value={e.typ || 'Privat'} onChange={(ev) => handleEmailChange(idx, 'typ', ev.target.value)} style={{ flex: '0 0 25%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontFamily: 'Lora, serif' }}>
                  <option value="Privat">Privat</option>
                  <option value="Geschäft">Geschäft</option>
                </select>
                <button type="button" onClick={() => removeEmail(idx)} style={{ flex: '0 0 5%', padding: '8px 6px', background: '#EF4444', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>
                  ✕
                </button>
              </div>
            ))
          ) : (
            <p style={{ color: '#94a3b8', fontStyle: 'italic', marginTop: '8px' }}>Keine E-Mails erfasst</p>
          )}
        </div>

        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <label>📱 Telefone</label>
            <button type="button" onClick={addTelefone} style={{ padding: '6px 12px', background: '#10B981', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>
              + Telefon
            </button>
          </div>
          {formData.telefone && formData.telefone.length > 0 ? (
            formData.telefone.map((t, idx) => (
              <div key={idx} style={{ marginBottom: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input type="tel" placeholder="Telefon" value={t.telefon || ''} onChange={(ev) => handleTelefoneChange(idx, 'telefon', ev.target.value)} style={{ flex: '0 0 70%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontFamily: 'Lora, serif' }} />
                <select value={t.typ || 'Mobil'} onChange={(ev) => handleTelefoneChange(idx, 'typ', ev.target.value)} style={{ flex: '0 0 25%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontFamily: 'Lora, serif' }}>
                  <option value="Mobil">Mobil</option>
                  <option value="Privat">Privat</option>
                  <option value="Geschäft">Geschäft</option>
                </select>
                <button type="button" onClick={() => removeTelefone(idx)} style={{ flex: '0 0 5%', padding: '8px 6px', background: '#EF4444', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>
                  ✕
                </button>
              </div>
            ))
          ) : (
            <p style={{ color: '#94a3b8', fontStyle: 'italic', marginTop: '8px' }}>Keine Telefone erfasst</p>
          )}
        </div>
      </div>

      {/* BESONDERHEITEN */}
      <div className="form-section">
        <h3>Besonderheiten</h3>
        <div className="form-group">
          <textarea name="besonderheiten" value={formData.besonderheiten || ''} onChange={handleInputChange} rows="5" placeholder="Zusätzliche Informationen..." style={{ width: '100%', boxSizing: 'border-box' }} />
        </div>
      </div>

      {/* BUTTONS */}
      <div className="form-actions" style={{ display: 'flex', gap: '12px', justifyContent: 'center', alignItems: 'center', marginTop: '40px', paddingTop: '24px', borderTop: '2px solid #e5e7eb' }}>
        <button 
          type="submit" 
          className="btn-primary" 
          disabled={loading || isSubmitting}
          style={{ padding: '12px 32px', height: '44px', fontSize: '14px', fontWeight: '600', border: 'none', borderRadius: '6px', cursor: loading || isSubmitting ? 'not-allowed' : 'pointer', backgroundColor: loading || isSubmitting ? '#9ca3af' : '#10b981', color: 'white', minWidth: '140px', width: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap' }}
        >
          {loading ? 'Speichert...' : 'Speichern'}
        </button>
        <button 
          type="button" 
          className="btn-secondary" 
          onClick={onCancel}
          style={{ padding: '12px 32px', height: '44px', fontSize: '14px', fontWeight: '600', border: 'none', borderRadius: '6px', cursor: 'pointer', backgroundColor: '#e5e7eb', color: '#374151', minWidth: '140px', width: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap' }}
        >
          Abbrechen
        </button>
      </div>
    </form>
  );
};

export default KundenFormModal;