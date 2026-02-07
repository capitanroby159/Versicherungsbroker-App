import express from 'express'
import db from '../database.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// GET alle Sparten - OHNE Auth
router.get('/', async (req, res) => {
  try {
    console.log('📊 GET /api/sparten')
    
    const [sparten] = await db.query('SELECT id, name FROM sparten ORDER BY id ASC')
    
    console.log('✅ Sparten geladen:', sparten.length)
    res.json(sparten)
  } catch (error) {
    console.error('❌ GET /api/sparten Error:', error.message)
    res.status(500).json({ 
      error: 'Fehler beim Laden der Sparten',
      message: error.message 
    })
  }
})

export default router