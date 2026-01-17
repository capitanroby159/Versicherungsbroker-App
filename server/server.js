import express from 'express'
import cors from 'cors'
import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'broker_app',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

const getConnection = async () => {
  try {
    return await pool.getConnection()
  } catch (error) {
    console.error('❌ Database connection error:', error.message)
    throw error
  }
}

// ============================================================================
// INITIALIZE DATABASE
// ============================================================================

const initializeDatabase = async () => {
  const connection = await getConnection()
  try {
    console.log('✅ Database connected')
  } catch (error) {
    console.error('Database initialization error:', error)
  } finally {
    connection.release()
  }
}

// ============================================================================
// KUNDEN ENDPOINTS
// ============================================================================

app.get('/api/kunden', async (req, res) => {
  const connection = await getConnection()
  try {
    const [rows] = await connection.execute('SELECT * FROM kunden ORDER BY nachname, vorname')
    res.json(rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error fetching kunden' })
  } finally {
    connection.release()
  }
})

app.get('/api/kunden/:id', async (req, res) => {
  const connection = await getConnection()
  try {
    const [rows] = await connection.execute('SELECT * FROM kunden WHERE id = ?', [req.params.id])
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Kunde not found' })
    }

    const kunde = rows[0]

    // Fetch related data
    let immobilien = []
    let policen = []

    try {
      const [immoRows] = await connection.execute('SELECT * FROM immobilien WHERE kunde_id = ?', [req.params.id])
      immobilien = immoRows
    } catch (err) {
      console.warn('❌ Error fetching immobilien:', err.message)
    }

    try {
      const [polRows] = await connection.execute(
        'SELECT p.*, v.name as versicherer_name FROM policen p LEFT JOIN versicherer v ON p.versicherer_id = v.id WHERE p.kunde_id = ?',
        [req.params.id]
      )
      policen = polRows
    } catch (err) {
      console.warn('❌ Error fetching policen:', err.message)
    }

    res.json({
      ...kunde,
      immobilien,
      policen
    })
  } catch (error) {
    console.error('❌ Error fetching kunde:', error)
    res.status(500).json({ message: 'Error fetching kunde', error: error.message })
  } finally {
    connection.release()
  }
})

app.post('/api/kunden', async (req, res) => {
  const connection = await getConnection()
  try {
    const { anrede, vorname, nachname, typ, email, telefon, status } = req.body

    if (!vorname || !nachname) {
      return res.status(400).json({ message: 'Vorname and Nachname are required' })
    }

    const [result] = await connection.execute(
      'INSERT INTO kunden (anrede, vorname, nachname, typ, email, telefon, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [anrede || 'Herr', vorname, nachname, typ || 'Privat', email || null, telefon || null, status || 'Aktiv']
    )

    res.json({ id: result.insertId, message: 'Kunde created' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error creating kunde', error: error.message })
  } finally {
    connection.release()
  }
})

// ✅ FIXED: Only update fields that are actually provided
app.put('/api/kunden/:id', async (req, res) => {
  const connection = await getConnection()
  try {
    const { id } = req.params
    const body = req.body

    // Build dynamic update query with only provided fields
    const updates = []
    const values = []

    const allowedFields = [
      'anrede', 'typ', 'vorname', 'nachname', 'email', 'telefon',
      'adresse', 'plz', 'ort', 'verhaeltnis',
      'geburtsdatum', 'ahv_nummer',
      'beruf', 'ausbildung', 'erwerbsstatus', 'weiterbildung',
      'ehepartner_name', 'hochzeitsdatum',
      'arbeitgeber_name', 'position', 'angestellt_seit',
      'arbeitspensum_prozent', 'kanton',
      'status', 'besonderheiten'
    ]

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updates.push(`${field} = ?`)
        values.push(body[field])
      }
    })

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' })
    }

    values.push(id)

    const query = `UPDATE kunden SET ${updates.join(', ')} WHERE id = ?`

    console.log('💾 UPDATE Query:', query)
    console.log('💾 VALUES:', values)

    const [result] = await connection.execute(query, values)

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Kunde not found' })
    }

    res.json({ message: 'Kunde updated', success: true })
  } catch (error) {
    console.error('❌ PUT /api/kunden/:id ERROR:', error)
    res.status(500).json({ message: 'Error updating kunde', error: error.message })
  } finally {
    connection.release()
  }
})

app.delete('/api/kunden/:id', async (req, res) => {
  const connection = await getConnection()
  try {
    const [result] = await connection.execute('DELETE FROM kunden WHERE id = ?', [req.params.id])

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Kunde not found' })
    }

    res.json({ message: 'Kunde deleted' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error deleting kunde', error: error.message })
  } finally {
    connection.release()
  }
})

// ============================================================================
// IMMOBILIEN ENDPOINTS
// ============================================================================

app.get('/api/immobilien', async (req, res) => {
  const connection = await getConnection()
  try {
    const [rows] = await connection.execute(
      'SELECT i.*, k.vorname, k.nachname FROM immobilien i LEFT JOIN kunden k ON i.kunde_id = k.id ORDER BY i.kunde_id'
    )
    res.json(rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error fetching immobilien' })
  } finally {
    connection.release()
  }
})

app.post('/api/immobilien', async (req, res) => {
  const connection = await getConnection()
  try {
    const {
      kunde_id, strasse, hausnummer, plz, ort, immobilienart,
      wohnort_status, baujahr, renoviert, renovationsjahr, renovationsnotizen,
      kaufpreis, kaufjahr, gebaeudeversicherungswert, versicherungssumme,
      mietertrag_jaehrlich, beschreibung
    } = req.body

    // Konvertiere undefined zu null
    const nullSafe = (val) => val === undefined || val === '' ? null : val

    const [result] = await connection.execute(
      `INSERT INTO immobilien (
        kunde_id, strasse, hausnummer, plz, ort, immobilienart,
        wohnort_status, baujahr, renoviert, renovationsjahr, renovationsnotizen,
        kaufpreis, kaufjahr, gebaeudeversicherungswert, versicherungssumme,
        mietertrag_jaehrlich, beschreibung
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nullSafe(kunde_id), 
        nullSafe(strasse), 
        nullSafe(hausnummer), 
        nullSafe(plz), 
        nullSafe(ort), 
        nullSafe(immobilienart),
        nullSafe(wohnort_status), 
        nullSafe(baujahr), 
        nullSafe(renoviert),
        nullSafe(renovationsjahr),
        nullSafe(renovationsnotizen),
        nullSafe(kaufpreis),
        nullSafe(kaufjahr),
        nullSafe(gebaeudeversicherungswert),
        nullSafe(versicherungssumme),
        nullSafe(mietertrag_jaehrlich),
        nullSafe(beschreibung)
      ]
    )

    res.json({ id: result.insertId, message: 'Immobilie created' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error creating immobilie', error: error.message })
  } finally {
    connection.release()
  }
})

app.put('/api/immobilien/:id', async (req, res) => {
  const connection = await getConnection()
  try {
    const {
      strasse, hausnummer, plz, ort, immobilienart,
      wohnort_status, baujahr, renoviert, renovationsjahr, renovationsnotizen,
      kaufpreis, kaufjahr, gebaeudeversicherungswert, versicherungssumme,
      mietertrag_jaehrlich, beschreibung
    } = req.body

    // Konvertiere undefined zu null
    const nullSafe = (val) => val === undefined ? null : val

    const [result] = await connection.execute(
      `UPDATE immobilien SET
        strasse = ?, hausnummer = ?, plz = ?, ort = ?, immobilienart = ?,
        wohnort_status = ?, baujahr = ?, renoviert = ?, renovationsjahr = ?, renovationsnotizen = ?,
        kaufpreis = ?, kaufjahr = ?, gebaeudeversicherungswert = ?, versicherungssumme = ?,
        mietertrag_jaehrlich = ?, beschreibung = ?
      WHERE id = ?`,
      [
        nullSafe(strasse), nullSafe(hausnummer), nullSafe(plz), nullSafe(ort), nullSafe(immobilienart),
        nullSafe(wohnort_status), nullSafe(baujahr), nullSafe(renoviert), nullSafe(renovationsjahr), nullSafe(renovationsnotizen),
        nullSafe(kaufpreis), nullSafe(kaufjahr), nullSafe(gebaeudeversicherungswert), nullSafe(versicherungssumme),
        nullSafe(mietertrag_jaehrlich), nullSafe(beschreibung),
        req.params.id
      ]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Immobilie not found' })
    }

    res.json({ message: 'Immobilie updated' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error updating immobilie', error: error.message })
  } finally {
    connection.release()
  }
})

app.delete('/api/immobilien/:id', async (req, res) => {
  const connection = await getConnection()
  try {
    const [result] = await connection.execute('DELETE FROM immobilien WHERE id = ?', [req.params.id])

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Immobilie not found' })
    }

    res.json({ message: 'Immobilie deleted' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error deleting immobilie', error: error.message })
  } finally {
    connection.release()
  }
})

// ============================================================================
// POLICEN ENDPOINTS
// ============================================================================

app.get('/api/policen', async (req, res) => {
  const connection = await getConnection()
  try {
    const [rows] = await connection.execute(
      'SELECT p.*, k.vorname, k.nachname, v.name as versicherer_name FROM policen p LEFT JOIN kunden k ON p.kunde_id = k.id LEFT JOIN versicherer v ON p.versicherer_id = v.id ORDER BY p.kunde_id'
    )
    res.json(rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error fetching policen' })
  } finally {
    connection.release()
  }
})

app.post('/api/policen', async (req, res) => {
  const connection = await getConnection()
  try {
    const { kunde_id, versicherer_id, branche_id, policennummer, praemie_chf, gebuehren, beginn, ende, jkr, waehrung, bemerkungen, versicherungsart } = req.body

    // Konvertiere undefined zu null
    const nullSafe = (val) => val === undefined || val === '' ? null : val

    // Konvertiere ISO-Daten zu MySQL DATE Format (YYYY-MM-DD)
    const formatDate = (dateStr) => {
      if (!dateStr) return null
      // Wenn es ein ISO-String ist (z.B. "2022-11-30T23:00:00.000Z"), nimm nur das Datum
      if (dateStr.includes('T')) {
        return dateStr.split('T')[0]
      }
      // Sonst nimm den String als-ist (schon formatiert)
      return dateStr
    }

    const [result] = await connection.execute(
      'INSERT INTO policen (kunde_id, versicherer_id, branche_id, policennummer, praemie_chf, gebuehren, beginn, ende, jkr, waehrung, bemerkungen, versicherungsart) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        nullSafe(kunde_id), 
        nullSafe(versicherer_id), 
        nullSafe(branche_id), 
        nullSafe(policennummer), 
        nullSafe(praemie_chf), 
        nullSafe(gebuehren), 
        formatDate(beginn),
        formatDate(ende),
        nullSafe(jkr), 
        nullSafe(waehrung), 
        nullSafe(bemerkungen), 
        nullSafe(versicherungsart)
      ]
    )

    res.json({ id: result.insertId, message: 'Police created' })
  } catch (error) {
    console.error('Error creating police:', error)
    res.status(500).json({ message: 'Error creating police', error: error.message })
  } finally {
    connection.release()
  }
})

app.put('/api/policen/:id', async (req, res) => {
  const connection = await getConnection()
  try {
    const { versicherer_id, branche_id, policennummer, praemie_chf, gebuehren, beginn, ende, jkr, waehrung, bemerkungen, versicherungsart } = req.body

    // Konvertiere undefined zu null
    const nullSafe = (val) => val === undefined || val === '' ? null : val

    // Konvertiere ISO-Daten zu MySQL DATE Format (YYYY-MM-DD)
    const formatDate = (dateStr) => {
      if (!dateStr) return null
      // Wenn es ein ISO-String ist (z.B. "2022-11-30T23:00:00.000Z"), nimm nur das Datum
      if (dateStr.includes('T')) {
        return dateStr.split('T')[0]
      }
      // Sonst nimm den String als-ist (schon formatiert)
      return dateStr
    }

    const [result] = await connection.execute(
      'UPDATE policen SET versicherer_id = ?, branche_id = ?, policennummer = ?, praemie_chf = ?, gebuehren = ?, beginn = ?, ende = ?, jkr = ?, waehrung = ?, bemerkungen = ?, versicherungsart = ? WHERE id = ?',
      [
        nullSafe(versicherer_id), 
        nullSafe(branche_id), 
        nullSafe(policennummer), 
        nullSafe(praemie_chf), 
        nullSafe(gebuehren), 
        formatDate(beginn),
        formatDate(ende),
        nullSafe(jkr), 
        nullSafe(waehrung), 
        nullSafe(bemerkungen), 
        nullSafe(versicherungsart), 
        req.params.id
      ]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Police not found' })
    }

    res.json({ message: 'Police updated' })
  } catch (error) {
    console.error('Error updating police:', error)
    res.status(500).json({ message: 'Error updating police', error: error.message })
  } finally {
    connection.release()
  }
})

app.delete('/api/policen/:id', async (req, res) => {
  const connection = await getConnection()
  try {
    const [result] = await connection.execute('DELETE FROM policen WHERE id = ?', [req.params.id])

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Police not found' })
    }

    res.json({ message: 'Police deleted' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error deleting police', error: error.message })
  } finally {
    connection.release()
  }
})

// ============================================================================
// VERSICHERER ENDPOINTS
// ============================================================================

app.get('/api/versicherer', async (req, res) => {
  const connection = await getConnection()
  try {
    const [rows] = await connection.execute('SELECT * FROM versicherer ORDER BY name')
    res.json(rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error fetching versicherer' })
  } finally {
    connection.release()
  }
})

app.post('/api/versicherer', async (req, res) => {
  const connection = await getConnection()
  try {
    const { name, contact_person, email, telefon } = req.body

    const [result] = await connection.execute(
      'INSERT INTO versicherer (name, contact_person, email, telefon) VALUES (?, ?, ?, ?)',
      [name, contact_person, email, telefon]
    )

    res.json({ id: result.insertId, message: 'Versicherer created' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error creating versicherer', error: error.message })
  } finally {
    connection.release()
  }
})

// ============================================================================
// BRANCHE ENDPOINTS
// ============================================================================

app.get('/api/branchen', async (req, res) => {
  const connection = await getConnection()
  try {
    const [rows] = await connection.execute('SELECT * FROM branche ORDER BY name')
    res.json(rows)
  } catch (error) {
    console.warn('⚠️ Table branche does not exist:', error.message)
    res.json([]) // Return empty array if table doesn't exist
  } finally {
    connection.release()
  }
})

app.post('/api/branchen', async (req, res) => {
  const connection = await getConnection()
  try {
    const { name } = req.body

    const [result] = await connection.execute('INSERT INTO branche (name) VALUES (?)', [name])

    res.json({ id: result.insertId, message: 'Branche created' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error creating branche', error: error.message })
  } finally {
    connection.release()
  }
})

// ============================================================================
// SERVER START
// ============================================================================

const PORT = process.env.PORT || 5000

initializeDatabase()

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})