import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Routes
import kundenRoutes from './routes/kunden.js'
import policenRoutes from './routes/policen.js'
import immobilienRoutes from './routes/immobilien.js'
import versichererRoutes from './routes/versicherer.js'
import hypothekenRoutes from './routes/hypotheken.js'
import trackingRoutes from './routes/tracking.js'
import todosRoutes from './routes/todos.js'
import aktivitaetenRoutes from './routes/aktivitaeten.js'

dotenv.config()

// ============================================================
// SETUP
// ============================================================
const app = express()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PORT = process.env.PORT || 5000
const NODE_ENV = process.env.NODE_ENV || 'development'

// ============================================================
// MIDDLEWARE
// ============================================================

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Request Body Parsing
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// Request Logging (Development)
if (NODE_ENV === 'development') {
  app.use((req, res, next) => {
    const timestamp = new Date().toLocaleTimeString('de-CH')
    console.log(`[${timestamp}] ${req.method} ${req.path}`)
    next()
  })
}

// ============================================================
// STATISCHE DATEIEN
// ============================================================
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// ============================================================
// API ROUTES
// ============================================================

// Kunden
app.use('/api/kunden', kundenRoutes)
console.log('✅ Route registriert: /api/kunden')

// Policen
app.use('/api/policen', policenRoutes)
console.log('✅ Route registriert: /api/policen')

// Immobilien
app.use('/api/immobilien', immobilienRoutes)
console.log('✅ Route registriert: /api/immobilien')

// Versicherer (mit Kontakte, Ansprechpersonen, Dateien)
app.use('/api/versicherer', versichererRoutes)
console.log('✅ Route registriert: /api/versicherer')
console.log('   ├─ GET    /api/versicherer/:id/kontakte        (AktivitaetForm)')
console.log('   ├─ POST   /api/versicherer/:id/kontakte')
console.log('   ├─ GET    /api/versicherer/:id/ansprechpersonen')
console.log('   └─ GET    /api/versicherer/:id/dateien')

// Hypotheken
app.use('/api/hypotheken', hypothekenRoutes)
console.log('✅ Route registriert: /api/hypotheken')

// Tracking & Projekte
app.use('/api/tracking', trackingRoutes)
console.log('✅ Route registriert: /api/tracking')

// Todos
app.use('/api/todos', todosRoutes)
console.log('✅ Route registriert: /api/todos')

// Aktivitäten (Tracking für Kunden)
app.use('/api/aktivitaeten', aktivitaetenRoutes)
console.log('✅ Route registriert: /api/aktivitaeten')

// ============================================================
// HEALTH CHECK & INFO
// ============================================================

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server läuft',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    uptime: process.uptime()
  })
})

// API Info
app.get('/api', (req, res) => {
  res.json({
    name: 'Versicherungsbroker API',
    version: '1.0.0',
    environment: NODE_ENV,
    endpoints: {
      kunden: '/api/kunden',
      policen: '/api/policen',
      immobilien: '/api/immobilien',
      versicherer: '/api/versicherer',
      hypotheken: '/api/hypotheken',
      tracking: '/api/tracking',
      todos: '/api/todos',
      aktivitaeten: '/api/aktivitaeten'
    }
  })
})

// ============================================================
// ERROR HANDLING
// ============================================================

// 404 Not Found
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} existiert nicht`,
    timestamp: new Date().toISOString()
  })
})

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err)
  
  const status = err.status || 500
  const message = err.message || 'Interner Fehler'
  
  res.status(status).json({
    error: 'Server Error',
    message: message,
    ...(NODE_ENV === 'development' && { stack: err.stack }),
    timestamp: new Date().toISOString()
  })
})

// ============================================================
// SERVER STARTEN
// ============================================================

const server = app.listen(PORT, () => {
  console.log('\n')
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║        🚀 VERSICHERUNGSBROKER API - SERVER GESTARTET        ║')
  console.log('╚════════════════════════════════════════════════════════════╝')
  console.log('')
  console.log(`📍 URL:         http://localhost:${PORT}`)
  console.log(`🔧 Umgebung:    ${NODE_ENV}`)
  console.log(`⏱️  Zeitstempel: ${new Date().toLocaleString('de-CH')}`)
  console.log('')
  console.log('📚 API Endpoints:')
  console.log('   • GET    http://localhost:' + PORT + '/api          (API Info)')
  console.log('   • GET    http://localhost:' + PORT + '/health       (Health Check)')
  console.log('')
  console.log('🔗 Verfügbare Routes:')
  console.log('   • /api/kunden')
  console.log('   • /api/policen')
  console.log('   • /api/immobilien')
  console.log('   • /api/versicherer')
  console.log('   • /api/hypotheken')
  console.log('   • /api/tracking')
  console.log('   • /api/todos')
  console.log('   • /api/aktivitaeten')
  console.log('')
  console.log('📁 Uploads:')
  console.log('   • /uploads (statische Dateien)')
  console.log('')
})

// ============================================================
// GRACEFUL SHUTDOWN
// ============================================================

process.on('SIGTERM', () => {
  console.log('\n⚠️  SIGTERM empfangen - fahre Server herunter...')
  server.close(() => {
    console.log('✅ Server beendet')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('\n⚠️  SIGINT empfangen - fahre Server herunter...')
  server.close(() => {
    console.log('✅ Server beendet')
    process.exit(0)
  })
})

// Unhandled Rejection Handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason)
})

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error)
  process.exit(1)
})

export default app