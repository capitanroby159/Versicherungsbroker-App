import express from 'express'
import { getConnection } from '../database.js'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const router = express.Router()

// ============================================================
// MULTER CONFIG für File-Upload
// ============================================================
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadsDir = path.join(__dirname, '../uploads/aktivitaeten')

// Verzeichnis erstellen
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    const timestamp = Date.now()
    const sanitized = path.basename(file.originalname, ext).replace(/[^a-z0-9]/gi, '_')
    cb(null, `akt_${timestamp}_${sanitized}${ext}`)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png', '.zip', '.txt']
    const ext = path.extname(file.originalname).toLowerCase()
    if (allowed.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error(`Dateityp ${ext} nicht erlaubt`))
    }
  }
})

// ============================================================
// GET: STATISTIKEN - OFFENE AKTIVITÄTEN
// ============================================================
router.get('/stats/offene', async (req, res) => {
  const connection = await getConnection()
  try {
    console.log(`📊 Lade offene Aktivitäten...`)

    const [rows] = await connection.execute(
      `SELECT a.*, 
              CONCAT(k.vorname, ' ', k.nachname) AS kunde_name,
              v.name AS versicherer_name
       FROM aktivitaeten a
       LEFT JOIN kunden k ON a.kunde_id = k.id
       LEFT JOIN versicherer v ON a.versicherer_id = v.id
       WHERE a.status IN ('Geplant', 'In Bearbeitung')
       ORDER BY a.datum_aktivitaet ASC, a.uhrzeit_aktivitaet ASC
       LIMIT 10`
    )

    console.log(`✅ ${rows.length} offene Aktivitäten geladen`)
    res.json(rows)
  } catch (error) {
    console.error('❌ Fehler beim Laden der Stats:', error)
    res.status(500).json({ message: 'Fehler beim Laden der Statistiken', error: error.message })
  } finally {
    connection.release()
  }
})

// ============================================================
// GET: STATISTIKEN - ÜBERSICHT
// ============================================================
router.get('/stats/overview', async (req, res) => {
  const connection = await getConnection()
  try {
    console.log(`📊 Lade Statistik-Übersicht...`)

    // Gesamtzahl
    const [totalRows] = await connection.execute(
      'SELECT COUNT(*) as count FROM aktivitaeten'
    )

    // Nach Status
    const [statusRows] = await connection.execute(
      `SELECT status, COUNT(*) as count 
       FROM aktivitaeten 
       GROUP BY status`
    )

    // Nach Typ
    const [typRows] = await connection.execute(
      `SELECT typ, COUNT(*) as count 
       FROM aktivitaeten 
       GROUP BY typ`
    )

    const overview = {
      gesamt: totalRows[0].count,
      nach_status: statusRows.reduce((acc, row) => {
        acc[row.status] = row.count
        return acc
      }, {}),
      nach_typ: typRows.reduce((acc, row) => {
        acc[row.typ] = row.count
        return acc
      }, {})
    }

    console.log(`✅ Stats-Übersicht geladen`)
    res.json(overview)
  } catch (error) {
    console.error('❌ Fehler beim Laden der Stats:', error)
    res.status(500).json({ message: 'Fehler beim Laden', error: error.message })
  } finally {
    connection.release()
  }
})

// ============================================================
// POST: UPLOAD DATEI ZU AKTIVITÄT
// ============================================================
router.post('/upload', upload.single('file'), async (req, res) => {
  const connection = await getConnection()
  try {
    const { aktivitaet_id } = req.body

    if (!aktivitaet_id || !req.file) {
      return res.status(400).json({ message: 'Aktivität-ID und Datei erforderlich' })
    }

    // Alte Datei löschen (falls vorhanden)
    const [oldRows] = await connection.execute(
      'SELECT anhang FROM aktivitaeten WHERE id = ?',
      [aktivitaet_id]
    )

    if (oldRows.length > 0 && oldRows[0].anhang) {
      const oldPath = path.join(uploadsDir, oldRows[0].anhang)
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath)
        console.log(`🗑️ Alte Datei gelöscht: ${oldRows[0].anhang}`)
      }
    }

    // Neue Datei speichern
    const [result] = await connection.execute(
      `UPDATE aktivitaeten SET 
       anhang = ?
       WHERE id = ?`,
      [req.file.filename, aktivitaet_id]
    )

    console.log(`📎 Datei aktualisiert für Aktivität ${aktivitaet_id}: ${req.file.filename}`)
    
    res.json({
      message: '✅ Datei gespeichert',
      filename: req.file.filename,
      size: req.file.size
    })
  } catch (error) {
    console.error('❌ Upload-Fehler:', error)
    res.status(500).json({ message: 'Upload fehlgeschlagen', error: error.message })
  } finally {
    connection.release()
  }
})

// ============================================================
// POST: AKTIVITÄT MIT DATEI
// ============================================================
router.post('/with-file', upload.single('file'), async (req, res) => {
  const connection = await getConnection()
  try {
    const aktivitaetData = JSON.parse(req.body.aktivitaet_data)
    const {
      titel,
      beschreibung,
      typ,
      richtung,
      prioritaet,
      status,
      datum,
      uhrzeit,
      ort,
      kunde_id,
      gespraechspartner_typ,
      versicherer_id,
      ansprechpartner_id,
      projekt_id,
      erstellt_von
    } = aktivitaetData

    if (!titel) {
      return res.status(400).json({ message: 'Titel ist erforderlich' })
    }

    const formattedDatum = datum ? (datum.includes('T') ? datum.split('T')[0] : datum) : new Date().toISOString().split('T')[0]

    const [result] = await connection.execute(
      `INSERT INTO aktivitaeten 
       (titel, beschreibung, typ, richtung, prioritaet, status, 
        datum_aktivitaet, uhrzeit_aktivitaet, ort,
        kunde_id, versicherer_id, ansprechpartner_id, projekt_id,
        gespraechspartner_typ, erstellt_von, anhang, anhang_dateigrösse, anhang_datum)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        titel,
        beschreibung || null,
        typ || 'Notiz',
        richtung || 'Intern',
        prioritaet || 'Normal',
        status || 'Geplant',
        formattedDatum,
        uhrzeit || null,
        ort || null,
        kunde_id || null,
        versicherer_id || null,
        ansprechpartner_id || null,
        projekt_id || null,
        gespraechspartner_typ || null,
        erstellt_von || 'System',
        req.file ? req.file.filename : null,
        req.file ? req.file.size : null
      ]
    )

    console.log(`✅ Aktivität mit Datei erstellt: ID ${result.insertId}`)
    
    res.json({ 
      id: result.insertId, 
      message: 'Aktivität mit Datei erstellt',
      file: req.file?.filename
    })
  } catch (error) {
    console.error('❌ Fehler beim Erstellen mit Datei:', error)
    res.status(500).json({ message: 'Fehler beim Erstellen', error: error.message })
  } finally {
    connection.release()
  }
})

// ============================================================
// POST: AKTIVITÄT OHNE DATEI
// ============================================================
router.post('/', async (req, res) => {
  const connection = await getConnection()
  try {
    const {
      titel,
      beschreibung,
      typ,
      richtung,
      prioritaet,
      status,
      datum,
      uhrzeit,
      ort,
      kunde_id,
      gespraechspartner_typ,
      versicherer_id,
      ansprechpartner_id,
      projekt_id,
      erstellt_von
    } = req.body

    if (!titel) {
      return res.status(400).json({ message: 'Titel ist erforderlich' })
    }

    const formattedDatum = datum ? (datum.includes('T') ? datum.split('T')[0] : datum) : new Date().toISOString().split('T')[0]

    const [result] = await connection.execute(
      `INSERT INTO aktivitaeten 
       (titel, beschreibung, typ, richtung, prioritaet, status, 
        datum_aktivitaet, uhrzeit_aktivitaet, ort,
        kunde_id, versicherer_id, ansprechpartner_id, projekt_id,
        gespraechspartner_typ, erstellt_von)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        titel,
        beschreibung || null,
        typ || 'Notiz',
        richtung || 'Intern',
        prioritaet || 'Normal',
        status || 'Geplant',
        formattedDatum,
        uhrzeit || null,
        ort || null,
        kunde_id || null,
        versicherer_id || null,
        ansprechpartner_id || null,
        projekt_id || null,
        gespraechspartner_typ || null,
        erstellt_von || 'System'
      ]
    )

    console.log(`✅ Aktivität erstellt: ID ${result.insertId}`)
    res.json({ id: result.insertId, message: 'Aktivität erstellt' })
  } catch (error) {
    console.error('❌ Fehler beim Erstellen:', error)
    res.status(500).json({ message: 'Fehler beim Erstellen', error: error.message })
  } finally {
    connection.release()
  }
})

// ============================================================
// GET: ALLE AKTIVITÄTEN
// ============================================================
router.get('/', async (req, res) => {
  const connection = await getConnection()
  try {
    const { status, typ, kunde_id } = req.query

    let query = `
      SELECT a.*, 
             CONCAT(k.vorname, ' ', k.nachname) AS kunde_name,
             v.name AS versicherer_name
      FROM aktivitaeten a
      LEFT JOIN kunden k ON a.kunde_id = k.id
      LEFT JOIN versicherer v ON a.versicherer_id = v.id
      WHERE 1=1
    `
    const params = []

    if (status) {
      query += ' AND a.status = ?'
      params.push(status)
    }
    if (typ) {
      query += ' AND a.typ = ?'
      params.push(typ)
    }
    if (kunde_id) {
      query += ' AND a.kunde_id = ?'
      params.push(kunde_id)
    }

    query += ' ORDER BY a.datum_aktivitaet DESC, a.uhrzeit_aktivitaet DESC'

    const [rows] = await connection.execute(query, params)
    res.json(rows)
  } catch (error) {
    console.error('❌ Fehler beim Laden:', error)
    res.status(500).json({ message: 'Fehler beim Laden', error: error.message })
  } finally {
    connection.release()
  }
})

// ============================================================
// GET: AKTIVITÄTEN BY KUNDE (MUSS VOR :id KOMMEN!)
// ============================================================
router.get('/by-kunde/:kundeId', async (req, res) => {
  const connection = await getConnection()
  try {
    const { kundeId } = req.params

    console.log(`📍 Lade Aktivitäten für Kunde: ${kundeId}`)

    const [rows] = await connection.execute(
      `SELECT a.*, 
              CONCAT(k.vorname, ' ', k.nachname) AS kunde_name,
              v.name AS versicherer_name
       FROM aktivitaeten a
       LEFT JOIN kunden k ON a.kunde_id = k.id
       LEFT JOIN versicherer v ON a.versicherer_id = v.id
       WHERE a.kunde_id = ?
       ORDER BY a.datum_aktivitaet DESC, a.uhrzeit_aktivitaet DESC`,
      [kundeId]
    )
    
    console.log(`✅ ${rows.length} Aktivitäten geladen`)
    res.json(rows)
  } catch (error) {
    console.error('❌ Fehler beim Laden nach Kunde:', error)
    res.status(500).json({ message: 'Fehler beim Laden', error: error.message })
  } finally {
    connection.release()
  }
})

// ============================================================
// GET: DATEI DOWNLOAD (VOR :id KOMMEN!)
// ============================================================
router.get('/download/:filename', async (req, res) => {
  try {
    const { filename } = req.params
    const filepath = path.join(uploadsDir, filename)

    console.log(`📥 Download angefordert: ${filename}`)

    // Sicherheitsprüfung
    if (!filepath.startsWith(uploadsDir)) {
      return res.status(403).json({ message: 'Zugriff verweigert' })
    }

    if (!fs.existsSync(filepath)) {
      console.warn(`⚠️ Datei nicht gefunden: ${filename}`)
      return res.status(404).json({ message: 'Datei nicht gefunden' })
    }

    console.log(`✅ Datei heruntergeladen: ${filename}`)
    res.download(filepath)
  } catch (error) {
    console.error('❌ Download-Fehler:', error)
    res.status(500).json({ message: 'Download fehlgeschlagen', error: error.message })
  }
})

// ============================================================
// GET: EINZELNE AKTIVITÄT (MUSS NACH by-kunde & download!)
// ============================================================
router.get('/:id', async (req, res) => {
  const connection = await getConnection()
  try {
    const { id } = req.params

    console.log(`📍 Lade Aktivität: ${id}`)

    const [rows] = await connection.execute(
      `SELECT a.*, 
              CONCAT(k.vorname, ' ', k.nachname) AS kunde_name,
              v.name AS versicherer_name
       FROM aktivitaeten a
       LEFT JOIN kunden k ON a.kunde_id = k.id
       LEFT JOIN versicherer v ON a.versicherer_id = v.id
       WHERE a.id = ?`,
      [id]
    )

    if (rows.length === 0) {
      console.warn(`⚠️ Aktivität nicht gefunden: ${id}`)
      return res.status(404).json({ message: 'Aktivität nicht gefunden' })
    }

    console.log(`✅ Aktivität geladen: ${id}`)
    res.json(rows[0])
  } catch (error) {
    console.error('❌ Fehler beim Laden einzelner Aktivität:', error)
    res.status(500).json({ message: 'Fehler beim Laden', error: error.message })
  } finally {
    connection.release()
  }
})

// ============================================================
// PUT: UPDATE AKTIVITÄT
// ✅ MIT VALIDIERUNG: Bewahrt kunde_id wenn NULL gesendet wird
// ============================================================
router.put('/:id', async (req, res) => {
  const connection = await getConnection()
  try {
    const { id } = req.params
    const {
      titel,
      beschreibung,
      typ,
      richtung,
      prioritaet,
      status,
      datum,
      uhrzeit,
      ort,
      kunde_id,
      gespraechspartner_typ,
      versicherer_id,
      ansprechpartner_id,
      projekt_id
    } = req.body

    console.log(`✏️ Aktualisiere Aktivität: ${id}`, { titel, typ, status })

    if (!titel) {
      return res.status(400).json({ message: 'Titel ist erforderlich' })
    }

    // ✅ WICHTIG: Hole die aktuelle kunde_id um sie zu bewahren!
    const [current] = await connection.execute(
      'SELECT kunde_id FROM aktivitaeten WHERE id = ?',
      [id]
    )

    if (current.length === 0) {
      console.warn(`⚠️ Aktivität nicht gefunden: ${id}`)
      return res.status(404).json({ message: 'Aktivität nicht gefunden' })
    }

    const originalKundeId = current[0].kunde_id
    
    // ✅ VALIDIERUNG: Wenn neue kunde_id NULL aber original hatte Wert → bewahre original!
    const finalKundeId = kunde_id !== null ? kunde_id : originalKundeId
    
    console.log(`🔒 VALIDIERUNG: originalKundeId=${originalKundeId}, eingehend=${kunde_id}, final=${finalKundeId}`)

    const formattedDatum = datum ? (datum.includes('T') ? datum.split('T')[0] : datum) : null

    const [result] = await connection.execute(
      `UPDATE aktivitaeten SET
       titel = ?, 
       beschreibung = ?, 
       typ = ?, 
       richtung = ?, 
       prioritaet = ?, 
       status = ?, 
       datum_aktivitaet = ?, 
       uhrzeit_aktivitaet = ?, 
       ort = ?,
       kunde_id = ?, 
       versicherer_id = ?, 
       ansprechpartner_id = ?, 
       projekt_id = ?,
       gespraechspartner_typ = ?
       WHERE id = ?`,
      [
        titel,
        beschreibung || null,
        typ || 'Notiz',
        richtung || 'Intern',
        prioritaet || 'Normal',
        status || 'Geplant',
        formattedDatum,
        uhrzeit || null,
        ort || null,
        finalKundeId,  // ✅ HIER: Validierte kunde_id wird gespeichert!
        versicherer_id || null,
        ansprechpartner_id || null,
        projekt_id || null,
        gespraechspartner_typ || null,
        id
      ]
    )

    if (result.affectedRows === 0) {
      console.warn(`⚠️ Aktivität nicht gefunden: ${id}`)
      return res.status(404).json({ message: 'Aktivität nicht gefunden' })
    }

    console.log(`✅ Aktivität aktualisiert: ${id}`)
    res.json({ id, message: 'Aktivität aktualisiert' })
  } catch (error) {
    console.error('❌ Fehler beim Aktualisieren:', error)
    res.status(500).json({ message: 'Fehler beim Aktualisieren', error: error.message })
  } finally {
    connection.release()
  }
})

// ============================================================
// DELETE: AKTIVITÄT LÖSCHEN
// ============================================================
router.delete('/:id', async (req, res) => {
  const connection = await getConnection()
  try {
    const { id } = req.params

    console.log(`🗑️ Lösche Aktivität: ${id}`)

    // Datei abrufen
    const [rows] = await connection.execute(
      'SELECT anhang FROM aktivitaeten WHERE id = ?',
      [id]
    )

    // Datei löschen
    if (rows.length > 0 && rows[0].anhang) {
      const filepath = path.join(uploadsDir, rows[0].anhang)
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath)
        console.log(`🗑️ Datei gelöscht: ${rows[0].anhang}`)
      }
    }

    // Aktivität löschen
    const [result] = await connection.execute(
      'DELETE FROM aktivitaeten WHERE id = ?',
      [id]
    )

    if (result.affectedRows === 0) {
      console.warn(`⚠️ Aktivität nicht gefunden: ${id}`)
      return res.status(404).json({ message: 'Aktivität nicht gefunden' })
    }

    console.log(`✅ Aktivität gelöscht: ${id}`)
    res.json({ message: 'Aktivität gelöscht' })
  } catch (error) {
    console.error('❌ Fehler beim Löschen:', error)
    res.status(500).json({ message: 'Fehler beim Löschen', error: error.message })
  } finally {
    connection.release()
  }
})

export default router