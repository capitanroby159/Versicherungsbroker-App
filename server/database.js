import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config()

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'broker_app',
  port: process.env.DB_PORT || 3306,
  
  // Connection Pool Einstellungen (GÜLTIG)
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  enableKeepAlive: true,            // ← Verhindert ECONNRESET
  
  // MySQL Session Einstellungen
  charset: 'utf8mb4',
  timezone: '+00:00',
  supportBigNumbers: true,
  bigNumberStrings: true
})

// Error-Handling für Pool
pool.on('error', (err) => {
  console.error('❌ Pool-Fehler:', err.message)
})

pool.on('connection', (connection) => {
  console.log('✅ DB-Verbindung hergestellt')
})

// Test connection on startup
async function testConnection() {
  try {
    const connection = await pool.getConnection()
    console.log('✅ Datenbank-Verbindung erfolgreich')
    connection.release()
  } catch (error) {
    console.error('❌ Datenbank-Verbindungsfehler:', error.message)
  }
}

testConnection()

export const getConnection = async () => {
  try {
    const connection = await pool.getConnection()
    return connection
  } catch (error) {
    console.error('❌ Konnte keine Verbindung bekommen:', error.message)
    throw error
  }
}

export default pool