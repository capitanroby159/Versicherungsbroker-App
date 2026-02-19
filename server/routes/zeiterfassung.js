import express from 'express'
import { getConnection } from '../database.js'

const router = express.Router()

// ============================================================
// HILFSFUNKTION: Minuten formatieren
// ============================================================
const formatMinuten = (min) => {
  if (!min || min === 0) return '0 Min'
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m} Min`
  if (m === 0) return `${h}h`
  return `${h}h ${m}min`
}

// ============================================================
// HILFSFUNKTION: Kosten berechnen
// ============================================================
const berechneKosten = (minuten, ansatz) => {
  return Math.round((minuten / 60) * ansatz * 100) / 100
}

// ============================================================
// GET: ALLE EINTRÄGE FÜR EINEN KUNDEN (mit Filtern)
// ============================================================
router.get('/by-kunde/:kundeId', async (req, res) => {
  const connection = await getConnection()
  try {
    const { kundeId } = req.params
    const { von, bis, sparte_id, art, mitarbeiter_id } = req.query

    let query = `
      SELECT 
        z.*,
        u.vorname AS mitarbeiter_vorname,
        u.nachname AS mitarbeiter_nachname,
        u.funktion AS mitarbeiter_funktion,
        CONCAT(u.vorname, ' ', u.nachname) AS mitarbeiter_name,
        COALESCE(s.name, 'Allgemein') AS sparte_name
      FROM kunden_zeiterfassung z
      LEFT JOIN users u ON z.mitarbeiter_id = u.id
      LEFT JOIN sparten s ON z.sparte_id = s.id
      WHERE z.kunde_id = ?
    `
    const params = [kundeId]

    if (von) { query += ' AND z.datum >= ?'; params.push(von) }
    if (bis) { query += ' AND z.datum <= ?'; params.push(bis) }
    if (sparte_id === 'null' || sparte_id === '0') {
      query += ' AND z.sparte_id IS NULL'
    } else if (sparte_id) {
      query += ' AND z.sparte_id = ?'; params.push(sparte_id)
    }
    if (art) { query += ' AND z.art = ?'; params.push(art) }
    if (mitarbeiter_id) { query += ' AND z.mitarbeiter_id = ?'; params.push(mitarbeiter_id) }

    query += ' ORDER BY z.datum DESC, z.erstellt_am DESC'

    const [rows] = await connection.execute(query, params)

    // Totals berechnen
    const total_minuten = rows.reduce((sum, r) => sum + (r.zeit_minuten || 0), 0)
    const total_kosten = rows.reduce((sum, r) => sum + berechneKosten(r.zeit_minuten, r.stundenansatz_snapshot), 0)

    res.json({
      eintraege: rows.map(r => ({
        ...r,
        kosten_chf: berechneKosten(r.zeit_minuten, r.stundenansatz_snapshot)
      })),
      total_minuten,
      total_formatiert: formatMinuten(total_minuten),
      total_kosten_chf: Math.round(total_kosten * 100) / 100
    })
  } catch (error) {
    console.error('❌ Fehler Zeiterfassung:', error)
    res.status(500).json({ message: 'Fehler beim Laden', error: error.message })
  } finally {
    connection.release()
  }
})

// ============================================================
// POST: NEUER EINTRAG
// ============================================================
router.post('/', async (req, res) => {
  const connection = await getConnection()
  try {
    const { kunde_id, mitarbeiter_id, datum, zeit_minuten, sparte_id, art, aktivitaet } = req.body

    if (!kunde_id || !mitarbeiter_id || !datum || !zeit_minuten || !art) {
      return res.status(400).json({ message: 'Pflichtfelder fehlen' })
    }

    // Stundenansatz vom Mitarbeiter holen (Snapshot!)
    const [userRows] = await connection.execute(
      'SELECT stundenansatz FROM users WHERE id = ?',
      [mitarbeiter_id]
    )
    const stundenansatz_snapshot = userRows.length > 0 ? (userRows[0].stundenansatz || 0) : 0

    const [result] = await connection.execute(
      `INSERT INTO kunden_zeiterfassung 
       (kunde_id, mitarbeiter_id, datum, zeit_minuten, sparte_id, art, aktivitaet, stundenansatz_snapshot)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        kunde_id,
        mitarbeiter_id,
        datum,
        zeit_minuten,
        sparte_id || null,
        art,
        aktivitaet || null,
        stundenansatz_snapshot
      ]
    )

    console.log(`✅ Zeiterfassung erstellt: ID ${result.insertId} | Kunde ${kunde_id} | ${zeit_minuten}min`)
    res.json({ id: result.insertId, message: 'Eintrag erstellt', stundenansatz_snapshot })
  } catch (error) {
    console.error('❌ Fehler:', error)
    res.status(500).json({ message: 'Fehler beim Erstellen', error: error.message })
  } finally {
    connection.release()
  }
})

// ============================================================
// PUT: EINTRAG BEARBEITEN
// ============================================================
router.put('/:id', async (req, res) => {
  const connection = await getConnection()
  try {
    const { id } = req.params
    const { mitarbeiter_id, datum, zeit_minuten, sparte_id, art, aktivitaet } = req.body

    if (!datum || !zeit_minuten || !art) {
      return res.status(400).json({ message: 'Pflichtfelder fehlen' })
    }

    // Neuen Stundenansatz-Snapshot holen wenn Mitarbeiter geändert
    let stundenansatz_snapshot = null
    if (mitarbeiter_id) {
      const [userRows] = await connection.execute(
        'SELECT stundenansatz FROM users WHERE id = ?',
        [mitarbeiter_id]
      )
      stundenansatz_snapshot = userRows.length > 0 ? (userRows[0].stundenansatz || 0) : 0
    }

    const updateFields = [
      datum, zeit_minuten, sparte_id || null, art, aktivitaet || null
    ]
    let sql = `UPDATE kunden_zeiterfassung SET 
      datum = ?, zeit_minuten = ?, sparte_id = ?, art = ?, aktivitaet = ?`

    if (mitarbeiter_id) {
      sql += ', mitarbeiter_id = ?, stundenansatz_snapshot = ?'
      updateFields.push(mitarbeiter_id, stundenansatz_snapshot)
    }
    sql += ' WHERE id = ?'
    updateFields.push(id)

    const [result] = await connection.execute(sql, updateFields)

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Eintrag nicht gefunden' })
    }

    console.log(`✅ Zeiterfassung aktualisiert: ID ${id}`)
    res.json({ id, message: 'Eintrag aktualisiert' })
  } catch (error) {
    console.error('❌ Fehler:', error)
    res.status(500).json({ message: 'Fehler beim Aktualisieren', error: error.message })
  } finally {
    connection.release()
  }
})

// ============================================================
// DELETE: EINTRAG LÖSCHEN
// ============================================================
router.delete('/:id', async (req, res) => {
  const connection = await getConnection()
  try {
    const { id } = req.params
    const [result] = await connection.execute(
      'DELETE FROM kunden_zeiterfassung WHERE id = ?',
      [id]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Eintrag nicht gefunden' })
    }

    console.log(`✅ Zeiterfassung gelöscht: ID ${id}`)
    res.json({ message: 'Eintrag gelöscht' })
  } catch (error) {
    console.error('❌ Fehler:', error)
    res.status(500).json({ message: 'Fehler beim Löschen', error: error.message })
  } finally {
    connection.release()
  }
})

// ============================================================
// GET: EXPORT (CSV)
// ============================================================
router.get('/export/:kundeId', async (req, res) => {
  const connection = await getConnection()
  try {
    const { kundeId } = req.params
    const { von, bis, sparte_id, art, mitarbeiter_id, format = 'csv', courtage = 0, courtage_beschreibung = '' } = req.query

    // Kundenname holen
    const [kundeRows] = await connection.execute(
      `SELECT COALESCE(firma_name, CONCAT(vorname, ' ', nachname)) AS name FROM kunden WHERE id = ?`,
      [kundeId]
    )
    const kundeName = kundeRows.length > 0 ? kundeRows[0].name : `Kunde ${kundeId}`

    // Daten holen
    let query = `
      SELECT 
        z.datum,
        CONCAT(u.vorname, ' ', u.nachname) AS mitarbeiter_name,
        COALESCE(u.funktion, '-') AS funktion,
        COALESCE(s.name, 'Allgemein') AS sparte_name,
        z.art,
        z.zeit_minuten,
        z.stundenansatz_snapshot,
        z.aktivitaet
      FROM kunden_zeiterfassung z
      LEFT JOIN users u ON z.mitarbeiter_id = u.id
      LEFT JOIN sparten s ON z.sparte_id = s.id
      WHERE z.kunde_id = ?
    `
    const params = [kundeId]

    if (von) { query += ' AND z.datum >= ?'; params.push(von) }
    if (bis) { query += ' AND z.datum <= ?'; params.push(bis) }
    if (sparte_id === 'null' || sparte_id === '0') {
      query += ' AND z.sparte_id IS NULL'
    } else if (sparte_id) {
      query += ' AND z.sparte_id = ?'; params.push(sparte_id)
    }
    if (art) { query += ' AND z.art = ?'; params.push(art) }
    if (mitarbeiter_id) { query += ' AND z.mitarbeiter_id = ?'; params.push(mitarbeiter_id) }
    query += ' ORDER BY z.datum ASC'

    const [rows] = await connection.execute(query, params)

    const total_minuten = rows.reduce((sum, r) => sum + (r.zeit_minuten || 0), 0)
    const total_kosten = rows.reduce((sum, r) => sum + berechneKosten(r.zeit_minuten, r.stundenansatz_snapshot), 0)
    const courtageVal = parseFloat(courtage) || 0
    const total_gesamt = Math.round((total_kosten + courtageVal) * 100) / 100

    const periodeText = von && bis ? `${von} – ${bis}` : von ? `ab ${von}` : bis ? `bis ${bis}` : 'Alle'
    const heute = new Date().toLocaleDateString('de-CH')

    // ── CSV ──────────────────────────────────────────────
    const formatCHF = (val) => `CHF ${parseFloat(val || 0).toFixed(2)}`
    const formatDatum = (d) => d ? new Date(d).toLocaleDateString('de-CH') : '-'

    let csv = `\uFEFF` // BOM für Excel
    csv += `BERATUNGSRAPPORT;${kundeName}\n`
    csv += `Periode;${periodeText}\n`
    csv += `Erstellt am;${heute}\n`
    csv += `\n`
    csv += `Datum;Mitarbeiter;Funktion;Sparte;Art;Minuten;CHF/h;Kosten CHF;Aktivität\n`

    rows.forEach(r => {
      const kosten = berechneKosten(r.zeit_minuten, r.stundenansatz_snapshot)
      csv += [
        formatDatum(r.datum),
        r.mitarbeiter_name,
        r.funktion,
        r.sparte_name,
        r.art,
        r.zeit_minuten,
        r.stundenansatz_snapshot.toFixed(2),
        kosten.toFixed(2),
        (r.aktivitaet || '').replace(/;/g, ',').replace(/\n/g, ' ')
      ].join(';') + '\n'
    })

    csv += `\n`
    csv += `TOTAL BERATUNGSAUFWAND;;;;;;${formatMinuten(total_minuten)};;${total_kosten.toFixed(2)}\n`

    if (courtageVal > 0) {
      csv += `COURTAGE;${courtage_beschreibung};;;;;;; ${courtageVal.toFixed(2)}\n`
      csv += `TOTAL LEISTUNG (Aufwand + Courtage);;;;;;;;;${total_gesamt.toFixed(2)}\n`
    }

    csv += `\n`
    // Stundenansätze Legende
    const mitarbeiterSet = [...new Map(rows.map(r => [r.mitarbeiter_name, r])).values()]
    csv += `Stundenansätze:\n`
    mitarbeiterSet.forEach(r => {
      csv += `${r.mitarbeiter_name};CHF ${parseFloat(r.stundenansatz_snapshot || 0).toFixed(2)}/h\n`
    })
    csv += `* Stundenansatz eingefroren bei Erstellung des Eintrags\n`

    const filename = `Beratungsrapport_${kundeName.replace(/[^a-z0-9]/gi, '_')}_${von || 'alle'}.csv`

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(csv)

  } catch (error) {
    console.error('❌ Export-Fehler:', error)
    res.status(500).json({ message: 'Export fehlgeschlagen', error: error.message })
  } finally {
    connection.release()
  }
})

export default router