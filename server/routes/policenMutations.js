import express from 'express'
import { getMutationsHistory } from '../utils/mutations.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

/**
 * GET /api/policen/:policeId/mutations - OHNE Auth
 * Holt den kompletten Mutations-Verlauf einer Police
 */
router.get('/policen/:policeId/mutations', async (req, res) => {
  try {
    const { policeId } = req.params

    if (!policeId) {
      return res.status(400).json({ error: 'Police-ID erforderlich' })
    }

    const mutations = await getMutationsHistory(req.pool, policeId)

    // Gruppiere nach DateTime
    const grouped = {}
    mutations.forEach(mutation => {
      const dateTime = new Date(mutation.changed_at)
      const date = dateTime.toLocaleDateString('de-CH')
      const time = dateTime.toLocaleTimeString('de-CH', {
        hour: '2-digit',
        minute: '2-digit'
      })
      const key = `${date} ${time}`

      if (!grouped[key]) {
        grouped[key] = {
          date,
          time,
          user: mutation.changed_by_name || 'System',
          mutations: []
        }
      }
      grouped[key].mutations.push(mutation)
    })

    res.json({
      success: true,
      total: mutations.length,
      grouped,
      mutations
    })
  } catch (err) {
    console.error('❌ Fehler beim Abrufen der Mutations-History:', err)
    res.status(500).json({ error: 'Fehler beim Abrufen der History' })
  }
})

export default router