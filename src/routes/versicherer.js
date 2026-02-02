import express from 'express'
import { getConnection } from '../database.js'

const router = express.Router()

// ============================================================
// VERSICHERER - GET ALL
// ============================================================
router.get('/', async (req, res) => {
  const connection = await getConnection()
  try {
    const [rows] = await connection.execute('SELECT * FROM versicherer')
    res.json(rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error fetching versicherer', error: error.message })
  } finally {
    connection.release()
  }
})

// ============================================================
// VERSICHERER - POST NEW
// ============================================================
router.post('/', async (req, res) => {
  const connection = await getConnection()
  try {
    const { name, strasse, hausnummer, plz, ort, land, telefon, website, status, zav_seit, notizen } = req.body
    
    if (!name || !telefon) {
      return res.status(400).json({ message: 'Name und Telefon sind erforderlich' })
    }
    
    const [result] = await connection.execute(
      `INSERT INTO versicherer (name, strasse, hausnummer, plz, ort, land, telefon, website, status, zav_seit, notizen) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, strasse || null, hausnummer || null, plz || null, ort || null, land || 'Switzerland', telefon, website || null, status || 'Aktiv', zav_seit || null, notizen || null]
    )
    
    res.json({ id: result.insertId, message: 'Versicherer erstellt' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Fehler beim Erstellen des Versicherers', error: error.message })
  } finally {
    connection.release()
  }
})

// ============================================================
// KONTAKTE - GET ALL FOR VERSICHERER
// ============================================================
router.get('/:id/kontakte', async (req, res) => {
  const connection = await getConnection()
  try {
    const { id } = req.params
    const [rows] = await connection.execute(
      'SELECT * FROM versicherer_kontakte WHERE versicherer_id = ? ORDER BY nachname, vorname',
      [id]
    )
    res.json(rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Fehler beim Laden der Kontakte', error: error.message })
  } finally {
    connection.release()
  }
})

// ============================================================
// KONTAKTE - POST NEW
// ============================================================
router.post('/:id/kontakte', async (req, res) => {
  const connection = await getConnection()
  try {
    const { id } = req.params
    const { vorname, nachname, position, email, telefon, art, direkt_erreichbar, status, notizen } = req.body
    
    if (!vorname || !nachname || !email) {
      return res.status(400).json({ message: 'Vorname, Nachname und Email sind erforderlich' })
    }
    
    const [result] = await connection.execute(
      `INSERT INTO versicherer_kontakte 
       (versicherer_id, vorname, nachname, position, email, telefon, art, direkt_erreichbar, status, notizen)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, vorname, nachname, position || null, email, telefon || null, art || null, direkt_erreichbar || false, status || 'Aktiv', notizen || null]
    )
    
    res.json({ id: result.insertId, message: 'Kontakt erstellt' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Fehler beim Erstellen des Kontakts', error: error.message })
  } finally {
    connection.release()
  }
})

// ============================================================
// ANSPRECHPERSONEN - GET ALL FOR VERSICHERER
// ============================================================
router.get('/:id/ansprechpersonen', async (req, res) => {
  const connection = await getConnection()
  try {
    const { id } = req.params
    console.log('Lade Ansprechpersonen für Versicherer:', id)
    
    const [rows] = await connection.execute(
      `SELECT ap.*, k.vorname, k.nachname, k.position, k.email, k.telefon 
       FROM versicherer_ansprechpersonen ap
       LEFT JOIN versicherer_kontakte k ON ap.kontakt_id = k.id
       WHERE ap.versicherer_id = ?`,
      [id]
    )
    res.json(rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Fehler beim Laden der Ansprechpersonen', error: error.message })
  } finally {
    connection.release()
  }
})

// ============================================================
// ANSPRECHPERSONEN - POST NEW (ZUWEISEN)
// ============================================================
router.post('/:id/ansprechpersonen', async (req, res) => {
  const connection = await getConnection()
  try {
    const { id } = req.params
    const { typ, kontakt_id, ist_hauptansprechperson } = req.body
    
    console.log('POST Ansprechperson:', { id, typ, kontakt_id })
    
    if (!typ || !kontakt_id) {
      return res.status(400).json({ message: 'Typ und Kontakt-ID sind erforderlich' })
    }
    
    // Check if exists
    const [existing] = await connection.execute(
      'SELECT * FROM versicherer_ansprechpersonen WHERE versicherer_id = ? AND typ = ?',
      [id, typ]
    )
    
    if (existing.length > 0) {
      // Update existing
      await connection.execute(
        'UPDATE versicherer_ansprechpersonen SET kontakt_id = ?, ist_hauptansprechperson = ? WHERE versicherer_id = ? AND typ = ?',
        [kontakt_id, ist_hauptansprechperson || true, id, typ]
      )
    } else {
      // Insert new
      await connection.execute(
        'INSERT INTO versicherer_ansprechpersonen (versicherer_id, typ, kontakt_id, ist_hauptansprechperson) VALUES (?, ?, ?, ?)',
        [id, typ, kontakt_id, ist_hauptansprechperson || true]
      )
    }
    
    res.json({ message: 'Ansprechperson zugewiesen' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Fehler beim Zuweisen der Ansprechperson', error: error.message })
  } finally {
    connection.release()
  }
})

// ============================================================
// ANSPRECHPERSONEN - DELETE
// ============================================================
router.delete('/:id/ansprechpersonen/:typ', async (req, res) => {
  const connection = await getConnection()
  try {
    const { id, typ } = req.params
    
    console.log('DELETE Ansprechperson:', { id, typ })
    
    const [result] = await connection.execute(
      'DELETE FROM versicherer_ansprechpersonen WHERE versicherer_id = ? AND typ = ?',
      [id, typ]
    )
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Ansprechperson nicht gefunden' })
    }
    
    res.json({ message: 'Ansprechperson entfernt' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Fehler beim Entfernen der Ansprechperson', error: error.message })
  } finally {
    connection.release()
  }
})

// ============================================================
// DATEIEN - GET ALL FOR VERSICHERER
// ============================================================
router.get('/:id/dateien', async (req, res) => {
  const connection = await getConnection()
  try {
    const { id } = req.params
    const [rows] = await connection.execute(
      'SELECT * FROM versicherer_dateien WHERE versicherer_id = ? ORDER BY hochgeladen_am DESC',
      [id]
    )
    res.json(rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Fehler beim Laden der Dateien', error: error.message })
  } finally {
    connection.release()
  }
})

// ============================================================
// DATEIEN - POST NEW
// ============================================================
router.post('/:id/dateien', async (req, res) => {
  const connection = await getConnection()
  try {
    const { id } = req.params
    const { dateiname, dateityp, beschreibung, gueltig_ab, gueltig_bis } = req.body
    
    console.log('POST Datei:', { id, dateiname, dateityp, gueltig_ab, gueltig_bis })
    
    if (!dateiname || !dateityp) {
      return res.status(400).json({ message: 'Dateiname und Dateityp sind erforderlich' })
    }
    
    const [result] = await connection.execute(
      `INSERT INTO versicherer_dateien 
       (versicherer_id, dateiname, dateityp, beschreibung, gueltig_ab, gueltig_bis, dateigroess, datei_pfad)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, dateiname, dateityp, beschreibung || null, gueltig_ab || null, gueltig_bis || null, 0, null]
    )
    
    console.log('Datei erstellt mit ID:', result.insertId)
    res.json({ id: result.insertId, message: 'Datei erstellt' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Fehler beim Erstellen der Datei', error: error.message })
  } finally {
    connection.release()
  }
})

// ============================================================
// DATEIEN - PUT UPDATE
// ============================================================
router.put('/:id/dateien/:dateiId', async (req, res) => {
  const connection = await getConnection()
  try {
    const { id, dateiId } = req.params
    const { dateiname, dateityp, beschreibung, gueltig_ab, gueltig_bis } = req.body
    
    if (!dateiname || !dateityp) {
      return res.status(400).json({ message: 'Dateiname und Dateityp sind erforderlich' })
    }
    
    const [result] = await connection.execute(
      `UPDATE versicherer_dateien SET 
       dateiname = ?, dateityp = ?, beschreibung = ?, gueltig_ab = ?, gueltig_bis = ?
       WHERE id = ? AND versicherer_id = ?`,
      [dateiname, dateityp, beschreibung || null, gueltig_ab || null, gueltig_bis || null, dateiId, id]
    )
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Datei nicht gefunden' })
    }
    
    res.json({ id: dateiId, message: 'Datei aktualisiert' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Fehler beim Aktualisieren der Datei', error: error.message })
  } finally {
    connection.release()
  }
})

// ============================================================
// DATEIEN - DELETE
// ============================================================
router.delete('/:id/dateien/:dateiId', async (req, res) => {
  const connection = await getConnection()
  try {
    const { id, dateiId } = req.params
    
    console.log('DELETE Datei:', { id, dateiId })
    
    const [result] = await connection.execute(
      'DELETE FROM versicherer_dateien WHERE id = ? AND versicherer_id = ?',
      [dateiId, id]
    )
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Datei nicht gefunden' })
    }
    
    res.json({ message: 'Datei gelöscht' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Fehler beim Löschen der Datei', error: error.message })
  } finally {
    connection.release()
  }
})

// ============================================================
// KONTAKT - GET SINGLE
// ============================================================
router.get('/kontakt/:kontaktId', async (req, res) => {
  const connection = await getConnection()
  try {
    const { kontaktId } = req.params
    const [rows] = await connection.execute(
      'SELECT * FROM versicherer_kontakte WHERE id = ?',
      [kontaktId]
    )
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Kontakt nicht gefunden' })
    }
    
    res.json(rows[0])
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Fehler beim Laden des Kontakts', error: error.message })
  } finally {
    connection.release()
  }
})

// ============================================================
// KONTAKT - PUT UPDATE
// ============================================================
router.put('/kontakt/:kontaktId', async (req, res) => {
  const connection = await getConnection()
  try {
    const { kontaktId } = req.params
    const { vorname, nachname, position, email, telefon, art, direkt_erreichbar, status, notizen } = req.body
    
    if (!vorname || !nachname || !email) {
      return res.status(400).json({ message: 'Vorname, Nachname und Email sind erforderlich' })
    }
    
    const [result] = await connection.execute(
      `UPDATE versicherer_kontakte SET 
       vorname = ?, nachname = ?, position = ?, email = ?, telefon = ?, 
       art = ?, direkt_erreichbar = ?, status = ?, notizen = ?
       WHERE id = ?`,
      [vorname, nachname, position || null, email, telefon || null, art || null, direkt_erreichbar || false, status || 'Aktiv', notizen || null, kontaktId]
    )
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Kontakt nicht gefunden' })
    }
    
    res.json({ id: kontaktId, message: 'Kontakt aktualisiert' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Fehler beim Aktualisieren des Kontakts', error: error.message })
  } finally {
    connection.release()
  }
})

// ============================================================
// KONTAKT - DELETE
// ============================================================
router.delete('/kontakt/:kontaktId', async (req, res) => {
  const connection = await getConnection()
  try {
    const { kontaktId } = req.params
    
    const [result] = await connection.execute(
      'DELETE FROM versicherer_kontakte WHERE id = ?',
      [kontaktId]
    )
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Kontakt nicht gefunden' })
    }
    
    res.json({ message: 'Kontakt gelöscht' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Fehler beim Löschen des Kontakts', error: error.message })
  } finally {
    connection.release()
  }
})

// ============================================================
// VERSICHERER - PUT UPDATE (nach spezifischen Routes!)
// ============================================================
router.put('/:id', async (req, res) => {
  const connection = await getConnection()
  try {
    const { id } = req.params
    const { name, strasse, hausnummer, plz, ort, land, telefon, website, status, zav_seit, notizen } = req.body
    
    if (!name || !telefon) {
      return res.status(400).json({ message: 'Name und Telefon sind erforderlich' })
    }
    
    const [result] = await connection.execute(
      `UPDATE versicherer SET 
       name = ?, strasse = ?, hausnummer = ?, plz = ?, ort = ?, land = ?, 
       telefon = ?, website = ?, status = ?, zav_seit = ?, notizen = ?
       WHERE id = ?`,
      [name, strasse || null, hausnummer || null, plz || null, ort || null, land || 'Switzerland', telefon, website || null, status || 'Aktiv', zav_seit || null, notizen || null, id]
    )
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Versicherer nicht gefunden' })
    }
    
    res.json({ id, message: 'Versicherer aktualisiert' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Fehler beim Aktualisieren des Versicherers', error: error.message })
  } finally {
    connection.release()
  }
})

// ============================================================
// VERSICHERER - DELETE
// ============================================================
router.delete('/:id', async (req, res) => {
  const connection = await getConnection()
  try {
    const { id } = req.params
    
    const [result] = await connection.execute(
      'DELETE FROM versicherer WHERE id = ?',
      [id]
    )
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Versicherer nicht gefunden' })
    }
    
    res.json({ message: 'Versicherer gelöscht' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Fehler beim Löschen des Versicherers', error: error.message })
  } finally {
    connection.release()
  }
})

// ============================================================
// VERSICHERER - GET SINGLE (MUSS GANZ AM ENDE SEIN!)
// ============================================================
router.get('/:id', async (req, res) => {
  const connection = await getConnection()
  try {
    const { id } = req.params
    console.log('Lade Versicherer mit ID:', id)
    
    const [rows] = await connection.execute(
      'SELECT * FROM versicherer WHERE id = ?',
      [id]
    )
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Versicherer nicht gefunden' })
    }
    
    res.json(rows[0])
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error fetching versicherer', error: error.message })
  } finally {
    connection.release()
  }
})

export default router