import express from 'express';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'broker_app',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

console.log('📍 Kunden Routes mit .env geladen');

// ============================================================
// HILFSFUNKTION: Datum-Konvertierung (ISO zu DATE)
// ============================================================
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

// GET ALL
router.get('/', async (req, res) => {
  try {
    // ✅ FIX: Formatiere Datumswerte als String um Timezone-Probleme zu vermeiden
    const [kunden] = await pool.query(`
      SELECT 
        id, kundentyp, vorname, nachname, 
        DATE_FORMAT(geburtsdatum, '%Y-%m-%d') as geburtsdatum,
        ahv_nummer, beruf, ausbildung, arbeitgeber_name, position,
        DATE_FORMAT(angestellt_seit, '%Y-%m-%d') as angestellt_seit,
        arbeitspensum_prozent, personalreglement_url, verhaeltnis, ehepartner_name,
        DATE_FORMAT(hochzeitsdatum, '%Y-%m-%d') as hochzeitsdatum,
        DATE_FORMAT(scheidungsdatum, '%Y-%m-%d') as scheidungsdatum,
        firma_name,
        DATE_FORMAT(gruendungsdatum, '%Y-%m-%d') as gruendungsdatum,
        uid, mehrwertsteuer, noga_code, taetigkeitsbeschrieb,
        status, mandat_url, archiv_url, iban,
        adresse, plz, ort, kanton, besonderheiten,
        created_at, updated_at
      FROM kunden 
      ORDER BY kundentyp, nachname, firma_name ASC
    `);

    const kundenMitKontakte = await Promise.all(
      kunden.map(async (k) => {
        let emails = [], telefone = [];
        
        try {
          const [emailRows] = await pool.query('SELECT email, typ FROM kunden_emails WHERE kunden_id = ?', [k.id]);
          emails = emailRows.map(e => ({ email: e.email, typ: e.typ }));
        } catch (err) {}

        try {
          const [telefoneRows] = await pool.query('SELECT telefon, typ FROM kunden_telefone WHERE kunden_id = ?', [k.id]);
          telefone = telefoneRows.map(t => ({ telefon: t.telefon, typ: t.typ }));
        } catch (err) {}

        return { ...k, emails, telefone };
      })
    );

    res.json(kundenMitKontakte);
  } catch (err) {
    console.error('❌ Error:', err.message);
    res.status(500).json({ error: 'Fehler beim Laden' });
  }
});

// GET ONE
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // ✅ FIX: Formatiere Datumswerte als String um Timezone-Probleme zu vermeiden
    const [kunden] = await pool.query(`
      SELECT 
        id, kundentyp, vorname, nachname, 
        DATE_FORMAT(geburtsdatum, '%Y-%m-%d') as geburtsdatum,
        ahv_nummer, beruf, ausbildung, arbeitgeber_name, position,
        DATE_FORMAT(angestellt_seit, '%Y-%m-%d') as angestellt_seit,
        arbeitspensum_prozent, personalreglement_url, verhaeltnis, ehepartner_name,
        DATE_FORMAT(hochzeitsdatum, '%Y-%m-%d') as hochzeitsdatum,
        DATE_FORMAT(scheidungsdatum, '%Y-%m-%d') as scheidungsdatum,
        firma_name,
        DATE_FORMAT(gruendungsdatum, '%Y-%m-%d') as gruendungsdatum,
        uid, mehrwertsteuer, noga_code, taetigkeitsbeschrieb,
        status, mandat_url, archiv_url, iban,
        adresse, plz, ort, kanton, besonderheiten,
        created_at, updated_at
      FROM kunden 
      WHERE id = ?
    `, [id]);

    if (kunden.length === 0) {
      return res.status(404).json({ error: 'Nicht gefunden' });
    }

    const kunde = kunden[0];
    const [emails] = await pool.query('SELECT email, typ FROM kunden_emails WHERE kunden_id = ?', [id]);
    const [telefone] = await pool.query('SELECT telefon, typ FROM kunden_telefone WHERE kunden_id = ?', [id]);

    let kinder = [];
    if (kunde.kundentyp === 'Privatperson') {
      // ✅ FIX: Auch Kinder-Geburtsdatum formatieren
      const [kinderData] = await pool.query(`
        SELECT 
          vorname, nachname, 
          DATE_FORMAT(geburtsdatum, '%Y-%m-%d') as geburtsdatum,
          ausbildung 
        FROM kunden_kinder 
        WHERE kunden_id = ?
      `, [id]);
      kinder = kinderData;
    }

    let ansprechpersonen = [];
    if (kunde.kundentyp === 'Firma') {
      const [apData] = await pool.query(`
        SELECT ka.id, ka.kunden_id, ka.person_kunden_id, ka.position, ka.telefon, ka.email, 
               CONCAT(k.vorname, ' ', k.nachname) as person_name
        FROM kunden_ansprechpersonen ka
        LEFT JOIN kunden k ON ka.person_kunden_id = k.id
        WHERE ka.kunden_id = ?
      `, [id]);
      ansprechpersonen = apData;
    }

    res.json({
      ...kunde,
      emails: emails.map(e => ({ email: e.email, typ: e.typ })),
      telefone: telefone.map(t => ({ telefon: t.telefon, typ: t.typ })),
      kinder,
      ansprechpersonen
    });
  } catch (err) {
    console.error('❌ Error:', err.message);
    res.status(500).json({ error: 'Fehler beim Laden' });
  }
});

// CREATE
router.post('/', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    console.log('📥 POST /api/kunden - Vollständige Eingabe:', JSON.stringify(req.body, null, 2));

    const {
      kundentyp, vorname, nachname, geburtsdatum, ahv_nummer,
      beruf, ausbildung, arbeitgeber_name, position, angestellt_seit, arbeitspensum_prozent,
      personalreglement_url, verhaeltnis, ehepartner_name, hochzeitsdatum, scheidungsdatum,
      firma_name, gruendungsdatum, uid, mehrwertsteuer, noga_code, taetigkeitsbeschrieb,
      status, mandat_url, archiv_url, iban, emails, telefone, kinder,
      adresse, plz, ort, kanton, besonderheiten
    } = req.body;

    console.log('📌 kundentyp von Frontend:', kundentyp, '(type:', typeof kundentyp, ')');

    // SICHERSTELLE kundentyp hat einen Standard-Wert
    let finalKundentyp = kundentyp || 'Privatperson';
    console.log('✅ finalKundentyp (mit Default):', finalKundentyp);

    if (finalKundentyp === 'Privatperson' && (!vorname?.trim() || !nachname?.trim())) {
      await conn.rollback();
      return res.status(400).json({ error: 'Vorname und Nachname erforderlich' });
    }

    if (finalKundentyp === 'Firma' && !firma_name?.trim()) {
      await conn.rollback();
      return res.status(400).json({ error: 'Firmenname erforderlich' });
    }

    // BEREINIGE Datums-Werte
    const cleanGeburtsdatum = cleanDateValue(geburtsdatum);
    const cleanHochzeitsdatum = cleanDateValue(hochzeitsdatum);
    const cleanScheidungsdatum = cleanDateValue(scheidungsdatum);
    const cleanAngestelltSeit = cleanDateValue(angestellt_seit);
    const cleanGruendungsdatum = cleanDateValue(gruendungsdatum);

    console.log('🔍 Vor INSERT - finalKundentyp:', finalKundentyp);
    console.log('📅 Datumswerte:', { cleanGeburtsdatum, cleanAngestelltSeit, cleanGruendungsdatum });

    const [result] = await conn.query(
      `INSERT INTO kunden (
        kundentyp, vorname, nachname, geburtsdatum, ahv_nummer,
        beruf, ausbildung, arbeitgeber_name, position, angestellt_seit, arbeitspensum_prozent,
        personalreglement_url, verhaeltnis, ehepartner_name, hochzeitsdatum, scheidungsdatum,
        firma_name, gruendungsdatum, uid, mehrwertsteuer, noga_code, taetigkeitsbeschrieb,
        status, mandat_url, archiv_url, iban, adresse, plz, ort, kanton, besonderheiten
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        finalKundentyp,
        finalKundentyp === 'Privatperson' ? (vorname?.trim() || null) : 'N/A',
        finalKundentyp === 'Privatperson' ? (nachname?.trim() || null) : 'Firma',
        cleanGeburtsdatum, ahv_nummer || null, beruf || null, ausbildung || null,
        arbeitgeber_name || null, position || null, cleanAngestelltSeit, arbeitspensum_prozent || null,
        personalreglement_url || null, verhaeltnis || null, ehepartner_name || null,
        cleanHochzeitsdatum, cleanScheidungsdatum,
        finalKundentyp === 'Firma' ? (firma_name?.trim() || null) : null,
        cleanGruendungsdatum, uid || null, mehrwertsteuer || 'nein', noga_code || null,
        taetigkeitsbeschrieb || null, status || 'Vollmandat', mandat_url || null, archiv_url || null, iban || null,
        adresse || null, plz || null, ort || null, kanton || null, besonderheiten || null
      ]
    );

    const kundeId = result.insertId;

    if (Array.isArray(emails) && emails.length > 0) {
      for (const email of emails) {
        if (email.email) {
          await conn.query('INSERT INTO kunden_emails (kunden_id, email, typ) VALUES (?, ?, ?)',
            [kundeId, email.email, email.typ || 'Privat']);
        }
      }
    }

    if (Array.isArray(telefone) && telefone.length > 0) {
      for (const tel of telefone) {
        if (tel.telefon) {
          await conn.query('INSERT INTO kunden_telefone (kunden_id, telefon, typ) VALUES (?, ?, ?)',
            [kundeId, tel.telefon, tel.typ || 'Mobil']);
        }
      }
    }

    if (finalKundentyp === 'Privatperson' && Array.isArray(kinder) && kinder.length > 0) {
      for (const kind of kinder) {
        if (kind.vorname || kind.nachname) {
          await conn.query('INSERT INTO kunden_kinder (kunden_id, vorname, nachname, geburtsdatum, ausbildung) VALUES (?, ?, ?, ?, ?)',
            [kundeId, kind.vorname || null, kind.nachname || null, kind.geburtsdatum || null, kind.ausbildung || null]);
        }
      }
    }

    await conn.commit();
    console.log('✅ Kunde erfolgreich erstellt mit ID:', kundeId);
    res.status(201).json({ id: kundeId, message: '✅ Created' });
  } catch (err) {
    await conn.rollback();
    console.error('❌ Error:', err.message);
    res.status(500).json({ error: 'Fehler beim Erstellen' });
  } finally {
    conn.release();
  }
});

// UPDATE
router.put('/:id', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { id } = req.params;
    const {
      kundentyp, vorname, nachname, geburtsdatum, ahv_nummer,
      beruf, ausbildung, arbeitgeber_name, position, angestellt_seit, arbeitspensum_prozent,
      personalreglement_url, verhaeltnis, ehepartner_name, hochzeitsdatum, scheidungsdatum,
      firma_name, gruendungsdatum, uid, mehrwertsteuer, noga_code, taetigkeitsbeschrieb,
      status, mandat_url, archiv_url, iban, emails, telefone, kinder,
      adresse, plz, ort, kanton, besonderheiten
    } = req.body;

    // SICHERSTELLE kundentyp hat einen Standard-Wert
    let finalKundentyp = kundentyp || 'Privatperson';
    console.log('📥 PUT /api/kunden/'+id);
    console.log('  kundentyp:', kundentyp);
    console.log('  vorname:', vorname);
    console.log('  nachname:', nachname);
    console.log('  firma_name:', firma_name);
    console.log('✅ finalKundentyp:', finalKundentyp);

    // VERHINDERE Updates mit undefined Werten (React Strict Mode Double-Submit)
    if (kundentyp === undefined) {
      console.warn('⚠️ Ignoriere UPDATE mit undefined Werten (Double-Submit by React Strict Mode)');
      await conn.rollback();
      // Nutze Status 409 (Conflict) für Double-Submit
      return res.status(409).json({ error: 'DOUBLE_SUBMIT', message: 'Double-Submit blockiert' });
    }

    // BEREINIGE Datums-Werte
    const cleanGeburtsdatum = cleanDateValue(geburtsdatum);
    const cleanHochzeitsdatum = cleanDateValue(hochzeitsdatum);
    const cleanScheidungsdatum = cleanDateValue(scheidungsdatum);
    const cleanAngestelltSeit = cleanDateValue(angestellt_seit);
    const cleanGruendungsdatum = cleanDateValue(gruendungsdatum);

    console.log('🔍 Vor UPDATE mit finalKundentyp:', finalKundentyp);
    console.log('📅 Datumswerte:', { cleanGeburtsdatum, cleanAngestelltSeit, cleanGruendungsdatum });

    await conn.query(
      `UPDATE kunden SET 
        kundentyp = ?, vorname = ?, nachname = ?, geburtsdatum = ?, ahv_nummer = ?,
        beruf = ?, ausbildung = ?, arbeitgeber_name = ?, position = ?, angestellt_seit = ?, arbeitspensum_prozent = ?,
        personalreglement_url = ?, verhaeltnis = ?, ehepartner_name = ?, hochzeitsdatum = ?, scheidungsdatum = ?,
        firma_name = ?, gruendungsdatum = ?, uid = ?, mehrwertsteuer = ?, noga_code = ?, taetigkeitsbeschrieb = ?,
        status = ?, mandat_url = ?, archiv_url = ?, iban = ?, adresse = ?, plz = ?, ort = ?, kanton = ?, besonderheiten = ?
       WHERE id = ?`,
      [
        finalKundentyp,
        finalKundentyp === 'Privatperson' ? (vorname?.trim() || null) : 'N/A',
        finalKundentyp === 'Privatperson' ? (nachname?.trim() || null) : 'Firma',
        cleanGeburtsdatum, ahv_nummer || null, beruf || null, ausbildung || null,
        arbeitgeber_name || null, position || null, cleanAngestelltSeit, arbeitspensum_prozent || null,
        personalreglement_url || null, verhaeltnis || null, ehepartner_name || null,
        cleanHochzeitsdatum, cleanScheidungsdatum,
        finalKundentyp === 'Firma' ? (firma_name?.trim() || null) : null,
        cleanGruendungsdatum, uid || null, mehrwertsteuer || 'nein', noga_code || null,
        taetigkeitsbeschrieb || null, status || 'Vollmandat', mandat_url || null, archiv_url || null, iban || null,
        adresse || null, plz || null, ort || null, kanton || null, besonderheiten || null,
        id
      ]
    );

    await conn.query('DELETE FROM kunden_emails WHERE kunden_id = ?', [id]);
    if (Array.isArray(emails) && emails.length > 0) {
      for (const email of emails) {
        if (email.email) {
          await conn.query('INSERT INTO kunden_emails (kunden_id, email, typ) VALUES (?, ?, ?)',
            [id, email.email, email.typ || 'Privat']);
        }
      }
    }

    await conn.query('DELETE FROM kunden_telefone WHERE kunden_id = ?', [id]);
    if (Array.isArray(telefone) && telefone.length > 0) {
      for (const tel of telefone) {
        if (tel.telefon) {
          await conn.query('INSERT INTO kunden_telefone (kunden_id, telefon, typ) VALUES (?, ?, ?)',
            [id, tel.telefon, tel.typ || 'Mobil']);
        }
      }
    }

    if (finalKundentyp === 'Privatperson') {
      await conn.query('DELETE FROM kunden_kinder WHERE kunden_id = ?', [id]);
      if (Array.isArray(kinder) && kinder.length > 0) {
        for (const kind of kinder) {
          if (kind.vorname || kind.nachname) {
            await conn.query('INSERT INTO kunden_kinder (kunden_id, vorname, nachname, geburtsdatum, ausbildung) VALUES (?, ?, ?, ?, ?)',
              [id, kind.vorname || null, kind.nachname || null, kind.geburtsdatum || null, kind.ausbildung || null]);
          }
        }
      }
    }

    await conn.commit();
    console.log('✅ Kunde aktualisiert mit ID:', id);
    res.json({ id: parseInt(id), message: '✅ Updated' });
  } catch (err) {
    await conn.rollback();
    console.error('❌ Error beim PUT:', err.message);
    console.error('❌ Full Error:', err);
    console.error('❌ SQL:', err.sql);
    res.status(500).json({ error: 'Fehler beim Aktualisieren: ' + err.message });
  } finally {
    conn.release();
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { id } = req.params;

    await conn.query('DELETE FROM kunden_emails WHERE kunden_id = ?', [id]);
    await conn.query('DELETE FROM kunden_telefone WHERE kunden_id = ?', [id]);
    await conn.query('DELETE FROM kunden_kinder WHERE kunden_id = ?', [id]);
    await conn.query('DELETE FROM kunden_ansprechpersonen WHERE kunden_id = ?', [id]);

    const [result] = await conn.query('DELETE FROM kunden WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Nicht gefunden' });
    }

    await conn.commit();
    res.json({ success: true, message: '✅ Deleted' });
  } catch (err) {
    await conn.rollback();
    console.error('❌ Error:', err.message);
    res.status(500).json({ error: 'Fehler beim Löschen' });
  } finally {
    conn.release();
  }
});

// GET ANSPRECHPERSONEN
router.get('/:kundeId/ansprechpersonen', async (req, res) => {
  try {
    const { kundeId } = req.params;
    const [ansprechpersonen] = await pool.query(
      `SELECT ka.*, k.vorname, k.nachname FROM kunden_ansprechpersonen ka
       LEFT JOIN kunden k ON ka.person_kunden_id = k.id
       WHERE ka.kunden_id = ? ORDER BY ka.ist_hauptpartner DESC, ka.id ASC`,
      [kundeId]
    );

    const enriched = ansprechpersonen.map(ap => ({
      ...ap,
      person_name: ap.vorname && ap.nachname ? `${ap.vorname} ${ap.nachname}` : 'Unbekannt'
    }));

    res.json(enriched);
  } catch (err) {
    console.error('❌ Error:', err.message);
    res.status(500).json({ error: 'Fehler' });
  }
});

// POST ANSPRECHPERSON
router.post('/:kundeId/ansprechpersonen', async (req, res) => {
  try {
    const { kundeId } = req.params;
    const { person_kunden_id, position, telefon, email, ist_hauptpartner } = req.body;

    const [person] = await pool.query('SELECT vorname, nachname FROM kunden WHERE id = ?', [person_kunden_id]);

    if (person.length === 0) {
      return res.status(404).json({ error: 'Person nicht gefunden' });
    }

    const person_name = `${person[0].vorname} ${person[0].nachname}`;

    if (ist_hauptpartner) {
      await pool.query('UPDATE kunden_ansprechpersonen SET ist_hauptpartner = 0 WHERE kunden_id = ?', [kundeId]);
    }

    const [result] = await pool.query(
      'INSERT INTO kunden_ansprechpersonen (kunden_id, person_kunden_id, position, telefon, email, ist_hauptpartner) VALUES (?, ?, ?, ?, ?, ?)',
      [kundeId, person_kunden_id, position || null, telefon || null, email || null, ist_hauptpartner ? 1 : 0]
    );

    res.status(201).json({
      id: result.insertId, kunden_id: kundeId, person_kunden_id, person_name, position, telefon, email, ist_hauptpartner
    });
  } catch (err) {
    console.error('❌ Error:', err.message);
    res.status(500).json({ error: 'Fehler' });
  }
});

// PUT ANSPRECHPERSON
router.put('/:kundeId/ansprechpersonen/:apId', async (req, res) => {
  try {
    const { kundeId, apId } = req.params;
    const { ist_hauptpartner, position, telefon, email } = req.body;

    if (ist_hauptpartner) {
      await pool.query('UPDATE kunden_ansprechpersonen SET ist_hauptpartner = 0 WHERE kunden_id = ? AND id != ?', [kundeId, apId]);
    }

    await pool.query(
      'UPDATE kunden_ansprechpersonen SET ist_hauptpartner = ?, position = ?, telefon = ?, email = ? WHERE id = ? AND kunden_id = ?',
      [ist_hauptpartner ? 1 : 0, position || null, telefon || null, email || null, apId, kundeId]
    );

    res.json({ success: true, message: '✅ Updated' });
  } catch (err) {
    console.error('❌ Error:', err.message);
    res.status(500).json({ error: 'Fehler' });
  }
});

// DELETE ANSPRECHPERSON
router.delete('/:kundeId/ansprechpersonen/:apId', async (req, res) => {
  try {
    const { kundeId, apId } = req.params;
    const [result] = await pool.query('DELETE FROM kunden_ansprechpersonen WHERE id = ? AND kunden_id = ?', [apId, kundeId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Nicht gefunden' });
    }

    res.json({ success: true, message: '✅ Deleted' });
  } catch (err) {
    console.error('❌ Error:', err.message);
    res.status(500).json({ error: 'Fehler' });
  }
});

export default router;