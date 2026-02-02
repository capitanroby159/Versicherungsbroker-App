import express from 'express'
import { getConnection } from '../database.js'

const router = express.Router()

router.get('/campaigns', async (req, res) => {
  const connection = await getConnection()
  try {
    const [rows] = await connection.execute(
      `SELECT tc.*, k.vorname, k.nachname, v.name as versicherer_name 
       FROM tracking_campaigns tc
       LEFT JOIN kunden k ON tc.kunde_id = k.id
       LEFT JOIN versicherer v ON tc.versicherer_id = v.id
       ORDER BY tc.erstellt_am DESC`
    )
    res.json(rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error fetching campaigns', error: error.message })
  } finally {
    connection.release()
  }
})

router.post('/campaigns', async (req, res) => {
  const connection = await getConnection()
  try {
    const { kunde_id, versicherer_id, titel, beschreibung, erstellt_von } = req.body
    
    if (!titel) {
      return res.status(400).json({ message: 'Titel ist erforderlich' })
    }
    
    const [result] = await connection.execute(
      `INSERT INTO tracking_campaigns (kunde_id, versicherer_id, titel, beschreibung, erstellt_von)
       VALUES (?, ?, ?, ?, ?)`,
      [kunde_id || null, versicherer_id || null, titel, beschreibung || null, erstellt_von || 1]
    )
    
    res.json({ id: result.insertId, message: 'Campaign erstellt' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Fehler beim Erstellen der Campaign', error: error.message })
  } finally {
    connection.release()
  }
})

router.get('/campaigns/:id', async (req, res) => {
  const connection = await getConnection()
  try {
    const { id } = req.params
    const [rows] = await connection.execute(
      `SELECT tc.*, k.vorname, k.nachname, v.name as versicherer_name 
       FROM tracking_campaigns tc
       LEFT JOIN kunden k ON tc.kunde_id = k.id
       LEFT JOIN versicherer v ON tc.versicherer_id = v.id
       WHERE tc.id = ?`,
      [id]
    )
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Campaign nicht gefunden' })
    }
    
    res.json(rows[0])
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error fetching campaign', error: error.message })
  } finally {
    connection.release()
  }
})

router.put('/campaigns/:id', async (req, res) => {
  const connection = await getConnection()
  try {
    const { id } = req.params
    const { kunde_id, versicherer_id, titel, beschreibung, status } = req.body
    
    if (!titel) {
      return res.status(400).json({ message: 'Titel ist erforderlich' })
    }
    
    const [result] = await connection.execute(
      `UPDATE tracking_campaigns SET 
       kunde_id = ?, versicherer_id = ?, titel = ?, beschreibung = ?, status = ?
       WHERE id = ?`,
      [kunde_id || null, versicherer_id || null, titel, beschreibung || null, status || 'Offen', id]
    )
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Campaign nicht gefunden' })
    }
    
    res.json({ id, message: 'Campaign aktualisiert' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Fehler beim Aktualisieren der Campaign', error: error.message })
  } finally {
    connection.release()
  }
})

router.delete('/campaigns/:id', async (req, res) => {
  const connection = await getConnection()
  try {
    const { id } = req.params
    const [result] = await connection.execute(
      'DELETE FROM tracking_campaigns WHERE id = ?',
      [id]
    )
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Campaign nicht gefunden' })
    }
    
    res.json({ message: 'Campaign gelöscht' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Fehler beim Löschen der Campaign', error: error.message })
  } finally {
    connection.release()
  }
})

router.get('/campaigns/:campaignId/activities', async (req, res) => {
  const connection = await getConnection()
  try {
    const { campaignId } = req.params
    const [rows] = await connection.execute(
      `SELECT ta.*, k.vorname as kunde_vorname, k.nachname as kunde_nachname,
              v.name as versicherer_name, ap.typ as ansprech_typ,
              u.username as erstellt_user
       FROM tracking_activities ta
       LEFT JOIN kunden k ON ta.kunde_id = k.id
       LEFT JOIN versicherer v ON ta.versicherer_id = v.id
       LEFT JOIN versicherer_ansprechpersonen ap ON ta.ansprechperson_id = ap.id
       LEFT JOIN users u ON ta.erstellt_von = u.id
       WHERE ta.campaign_id = ?
       ORDER BY ta.datum DESC`,
      [campaignId]
    )
    res.json(rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error fetching activities', error: error.message })
  } finally {
    connection.release()
  }
})

router.post('/campaigns/:campaignId/activities', async (req, res) => {
  const connection = await getConnection()
  try {
    const { campaignId } = req.params
    const { datum, art, richtung, kunde_id, versicherer_id, ansprechperson_id, teilnehmer, notizen, erstellt_von, zugewiesen_zu, hat_aufgabe } = req.body
    
    if (!art || !richtung) {
      return res.status(400).json({ message: 'Art und Richtung sind erforderlich' })
    }
    
    const [result] = await connection.execute(
      `INSERT INTO tracking_activities 
       (campaign_id, datum, art, richtung, kunde_id, versicherer_id, ansprechperson_id, teilnehmer, notizen, erstellt_von, zugewiesen_zu, hat_aufgabe)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [campaignId, datum || new Date(), art, richtung, kunde_id || null, versicherer_id || null, ansprechperson_id || null, teilnehmer || null, notizen || null, erstellt_von || 1, zugewiesen_zu || null, hat_aufgabe || false]
    )
    
    res.json({ id: result.insertId, message: 'Activity erstellt' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Fehler beim Erstellen der Activity', error: error.message })
  } finally {
    connection.release()
  }
})

router.get('/activities/:id', async (req, res) => {
  const connection = await getConnection()
  try {
    const { id } = req.params
    const [rows] = await connection.execute(
      `SELECT ta.*, k.vorname, k.nachname, v.name as versicherer_name
       FROM tracking_activities ta
       LEFT JOIN kunden k ON ta.kunde_id = k.id
       LEFT JOIN versicherer v ON ta.versicherer_id = v.id
       WHERE ta.id = ?`,
      [id]
    )
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Activity nicht gefunden' })
    }
    
    res.json(rows[0])
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error fetching activity', error: error.message })
  } finally {
    connection.release()
  }
})

router.put('/activities/:id', async (req, res) => {
  const connection = await getConnection()
  try {
    const { id } = req.params
    const { datum, art, richtung, kunde_id, versicherer_id, ansprechperson_id, teilnehmer, notizen, zugewiesen_zu } = req.body
    
    const [result] = await connection.execute(
      `UPDATE tracking_activities SET 
       datum = ?, art = ?, richtung = ?, kunde_id = ?, versicherer_id = ?, 
       ansprechperson_id = ?, teilnehmer = ?, notizen = ?, zugewiesen_zu = ?
       WHERE id = ?`,
      [datum || new Date(), art || 'Sonstiges', richtung || 'Outgoing', kunde_id || null, versicherer_id || null, ansprechperson_id || null, teilnehmer || null, notizen || null, zugewiesen_zu || null, id]
    )
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Activity nicht gefunden' })
    }
    
    res.json({ id, message: 'Activity aktualisiert' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Fehler beim Aktualisieren der Activity', error: error.message })
  } finally {
    connection.release()
  }
})

router.delete('/activities/:id', async (req, res) => {
  const connection = await getConnection()
  try {
    const { id } = req.params
    const [result] = await connection.execute(
      'DELETE FROM tracking_activities WHERE id = ?',
      [id]
    )
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Activity nicht gefunden' })
    }
    
    res.json({ message: 'Activity gelöscht' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Fehler beim Löschen der Activity', error: error.message })
  } finally {
    connection.release()
  }
})

router.post('/activities/:activityId/dateien', async (req, res) => {
  const connection = await getConnection()
  try {
    const { activityId } = req.params
    const { dateiname, dateityp, datei_pfad, dateigross } = req.body
    
    if (!dateiname || !dateityp) {
      return res.status(400).json({ message: 'Dateiname und Dateityp sind erforderlich' })
    }
    
    const [result] = await connection.execute(
      `INSERT INTO tracking_dateien (activity_id, dateiname, dateityp, datei_pfad, dateigross)
       VALUES (?, ?, ?, ?, ?)`,
      [activityId, dateiname, dateityp, datei_pfad || '', dateigross || 0]
    )
    
    res.json({ id: result.insertId, message: 'Datei hochgeladen' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Fehler beim Hochladen der Datei', error: error.message })
  } finally {
    connection.release()
  }
})

router.get('/activities/:activityId/dateien', async (req, res) => {
  const connection = await getConnection()
  try {
    const { activityId } = req.params
    const [rows] = await connection.execute(
      'SELECT * FROM tracking_dateien WHERE activity_id = ? ORDER BY hochgeladen_am DESC',
      [activityId]
    )
    res.json(rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error fetching files', error: error.message })
  } finally {
    connection.release()
  }
})

router.delete('/dateien/:id', async (req, res) => {
  const connection = await getConnection()
  try {
    const { id } = req.params
    const [result] = await connection.execute(
      'DELETE FROM tracking_dateien WHERE id = ?',
      [id]
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

export default router