import mysql from 'mysql2/promise'

// Feld-Labels für Anzeige
const FIELD_LABELS = {
  policennummer: 'Policennummer',
  sparte_id: 'Sparte',
  versicherer_id: 'Versicherer',
  praemie_chf: 'Prämie (CHF)',
  gebuehren: 'Gebühren',
  zahlungsart: 'Zahlungsart',
  faelligkeit: 'Fälligkeit',
  beginn: 'Gültig von',
  ende: 'Gültig bis',
  avb_ausgabe: 'AVB-Ausgabe',
  archiv_url: 'Archiv-Link',
  jaehrliches_kuendigungsrecht: 'Jährliches Kündigungsrecht',
  praemiengarantie: 'Prämiengarantie',
  prioritaet: 'Priorität',
  status_detail: 'Status',
  bemerkungen: 'Bemerkungen',
  notizen: 'Notizen',
  uvg_risiko_nr: 'UVG Risiko-Nr',
  uvg_art_betrieb: 'UVG Art Betrieb',
  uvg_versicherter_personenkreis: 'UVG Versicherter Personenkreis',
  uvg_bu_gefahrenklasse: 'UVG BU Gefahrenklasse',
  uvg_bu_gefahrenstufe: 'UVG BU Gefahrenstufe',
  uvg_bu_praemiensatz: 'UVG BU Prämiensatz',
  uvg_nbu_gefahrenklasse: 'UVG NBU Gefahrenklasse',
  uvg_nbu_unterklasse: 'UVG NBU Unterklasse',
  uvg_nbu_praemiensatz: 'UVG NBU Prämiensatz'
}

/**
 * Loggt nur GEÄNDERTE Felder (nicht alle)
 */
export async function logMutations(pool, policeId, oldData, newData, userId, userName) {
  try {
    const connection = await pool.getConnection()
    
    // Nur Felder loggen die sich WIRKLICH geändert haben
    for (const field in newData) {
      const oldValue = oldData[field]
      const newValue = newData[field]
      
      // Vergleich mit normalisierten Werten (für Datums-Korrektheit)
      const oldNorm = normalizeValue(oldValue)
      const newNorm = normalizeValue(newValue)
      
      // Nur loggen wenn sich was WIRKLICH geändert hat
      if (oldNorm !== newNorm) {
        const oldStr = formatValue(oldValue)
        const newStr = formatValue(newValue)
        const label = FIELD_LABELS[field] || field
        
        await connection.query(
          `INSERT INTO policen_mutations 
           (police_id, field_name, field_label, old_value, new_value, changed_by, changed_by_name, changed_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
          [policeId, field, label, oldStr, newStr, userId, userName]
        )
      }
    }
    
    connection.release()
    return true
  } catch (err) {
    console.error('❌ Fehler beim Logging der Mutation:', err)
    throw err
  }
}

/**
 * Holt den Mutations-Verlauf einer Police
 */
export async function getMutationsHistory(pool, policeId) {
  try {
    const connection = await pool.getConnection()
    
    const [rows] = await connection.query(
      `SELECT 
        id,
        police_id,
        field_name,
        field_label,
        old_value,
        new_value,
        changed_by,
        changed_by_name,
        changed_at,
        change_reason
      FROM policen_mutations
      WHERE police_id = ?
      ORDER BY changed_at DESC`,
      [policeId]
    )
    
    connection.release()
    return rows
  } catch (err) {
    console.error('❌ Fehler beim Abrufen der Mutations-History:', err)
    throw err
  }
}

/**
 * Normalisiert Werte zum Vergleich (behebt Timezone-Probleme)
 */
function normalizeValue(value) {
  if (value === null || value === undefined) return null
  
  // Für Daten: nur das Datum vergleichen, nicht die Zeit/Timezone
  if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
    return value.split('T')[0] // nur YYYY-MM-DD
  }
  
  return value
}

/**
 * Formatiert Werte für lesbare Anzeige
 */
function formatValue(value) {
  if (value === null || value === undefined) return '(leer)'
  
  // Für Daten: formatiere als dd.mm.yyyy
  if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
    const date = new Date(value + 'T00:00:00') // Keine Timezone-Konvertierung
    return date.toLocaleDateString('de-CH')
  }
  
  if (typeof value === 'boolean') return value ? 'Ja' : 'Nein'
  if (typeof value === 'number') return value.toString()
  if (typeof value === 'string') return value
  return JSON.stringify(value)
}

/**
 * Gruppiert Mutations nach Datum
 */
export function groupMutationsByDate(mutations) {
  const grouped = {}
  
  mutations.forEach(mutation => {
    const date = new Date(mutation.changed_at).toLocaleDateString('de-CH')
    const time = new Date(mutation.changed_at).toLocaleTimeString('de-CH', {
      hour: '2-digit',
      minute: '2-digit'
    })
    
    const key = `${date} ${time}`
    
    if (!grouped[key]) {
      grouped[key] = {
        timestamp: mutation.changed_at,
        user: mutation.changed_by_name,
        mutations: []
      }
    }
    
    grouped[key].mutations.push(mutation)
  })
  
  return grouped
}