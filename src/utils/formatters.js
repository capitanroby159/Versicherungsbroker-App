/**
 * Zentrale Formatierungsfunktionen für die ganze App
 * Importieren mit: import { formatCHF, formatNumber, formatPercent } from '../utils/formatters'
 */

/**
 * Formatiert Zahlen als CHF Währung
 * Beispiel: 1234.56 → CHF 1'234.56
 */
export const formatCHF = (value) => {
  if (!value && value !== 0) return '-'
  const num = parseFloat(value)
  if (isNaN(num)) return '-'
  
  const rounded = Math.round(num * 20) / 20
  
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(rounded)
}

/**
 * Formatiert Ganzzahlen mit Tausender-Trennzeichen
 * Beispiel: 1234567 → 1'234'567
 */
export const formatNumber = (value) => {
  if (!value && value !== 0) return '-'
  const num = parseFloat(value)
  if (isNaN(num)) return '-'
  
  return new Intl.NumberFormat('de-CH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num)
}

/**
 * Formatiert Dezimalzahlen als Prozent
 * Beispiel: 5.234 → 5.23%
 */
export const formatPercent = (value, decimals = 2) => {
  if (!value && value !== 0) return '-'
  const num = parseFloat(value)
  if (isNaN(num)) return '-'
  
  return num.toFixed(decimals) + '%'
}

/**
 * Formatiert Datum im de-CH Format
 * Beispiel: "2026-01-17" → "17.01.2026"
 */
export const formatDate = (dateString) => {
  if (!dateString) return '-'
  try {
    return new Date(dateString).toLocaleDateString('de-CH')
  } catch (error) {
    return '-'
  }
}

/**
 * Formatiert DateTime im de-CH Format
 * Beispiel: "2026-01-17T15:30:00Z" → "17.01.2026 15:30"
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return '-'
  try {
    return new Date(dateString).toLocaleString('de-CH')
  } catch (error) {
    return '-'
  }
}

/**
 * Formatiert Dezimalzahl mit festen Dezimalstellen
 * Beispiel: formatDecimal(1.5, 2) → "1.50"
 */
export const formatDecimal = (value, decimals = 2) => {
  if (!value && value !== 0) return '-'
  const num = parseFloat(value)
  if (isNaN(num)) return '-'
  
  return num.toFixed(decimals)
}

/**
 * Farbe für KPI basierend auf Wert und Typ
 * Typen: 'gewinn', 'bruttorendite', 'eigenkapitalrendite'
 */
export const getKPIColor = (value, type) => {
  if (!value && value !== 0) return '#999'
  
  const num = parseFloat(value)
  if (isNaN(num)) return '#999'
  
  if (type === 'gewinn') {
    return num >= 0 ? '#10b981' : '#ef4444'
  } else if (type === 'bruttorendite') {
    if (num >= 5) return '#10b981'
    if (num >= 3) return '#f59e0b'
    return '#ef4444'
  } else if (type === 'eigenkapitalrendite') {
    if (num >= 8) return '#10b981'
    if (num >= 4) return '#f59e0b'
    return '#ef4444'
  }
  return '#666'
}

/**
 * Farbe für Hypotheken-Quote
 */
export const getHypoQuoteColor = (quote) => {
  if (quote > 80) return '#ef4444'
  if (quote >= 65) return '#f59e0b'
  return '#10b981'
}