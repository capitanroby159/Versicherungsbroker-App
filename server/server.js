import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

// Routes
import kundenRoutes from './routes/kunden.js'
import policenRoutes from './routes/policen.js'
import immobilienRoutes from './routes/immobilien.js'
import versichererRoutes from './routes/versicherer.js'
import hypothekenRoutes from './routes/hypotheken.js'

dotenv.config()

const app = express()

// ===== MIDDLEWARE =====
app.use(cors())
app.use(express.json())

// ===== ROUTES =====
app.use('/api/kunden', kundenRoutes)
app.use('/api/policen', policenRoutes)
app.use('/api/immobilien', immobilienRoutes)
app.use('/api/versicherer', versichererRoutes)
app.use('/api/hypotheken', hypothekenRoutes)

// ===== HEALTH CHECK =====
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server läuft!' })
})

// ===== START SERVER =====
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`✅ Server läuft auf Port ${PORT}`)
  console.log(`📍 http://localhost:${PORT}`)
  console.log(`📁 Routes: /api/kunden, /api/policen, /api/immobilien, /api/versicherer, /api/hypotheken`)
})