// ========================================================
// utils/formatters.js - Schweiz-spezifische Formatierung
// ========================================================

/**
 * Formatiere Betrag in CHF mit x'xxx.xx Format
 * @param {number} amount - Betrag in CHF
 * @returns {string} Formatierter String, z.B. "CHF 1'234.56"
 */
export const formatCHF = (amount) => {
  if (!amount && amount !== 0) return 'CHF 0.00'
  
  const num = parseFloat(amount);
  if (isNaN(num)) return 'CHF 0.00'
  
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
}

/**
 * Formatiere Betrag für Input (nur Zahl mit Tausender-Trennzeichen)
 * z.B. "1'234.56"
 * @param {number} amount 
 * @returns {string}
 */
export const formatCHFInput = (amount) => {
  if (!amount && amount !== 0) return '0.00'
  
  const num = parseFloat(amount);
  if (isNaN(num)) return '0.00'
  
  return new Intl.NumberFormat('de-CH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
}

/**
 * Parse CHF String zu Number
 * Akzeptiert: "1'234.56", "1234.56", "1234,56"
 * @param {string} str 
 * @returns {number}
 */
export const parseCHF = (str) => {
  if (!str) return 0;
  let cleaned = str.replace(/^CHF\s?/, '').trim();
  cleaned = cleaned.replace(',', '.');
  cleaned = cleaned.replace(/'/g, '');
  return parseFloat(cleaned) || 0;
}

/**
 * Formatiere Datum zu dd.mm.yyyy
 * WICHTIG: Parse manuell um Timezone-Probleme zu vermeiden!
 * @param {string|Date} date 
 * @returns {string}
 */
export const formatDate = (date) => {
  if (!date) return '-'
  
  try {
    let dateString;
    
    if (typeof date === 'string') {
      // Nur das Datum-Teil: "2026-01-01" oder "2026-01-01T..."
      dateString = date.split('T')[0];
    } else if (date instanceof Date) {
      // Falls es ein Date-Objekt ist, konvertiere zu YYYY-MM-DD
      dateString = date.toISOString().split('T')[0];
    } else {
      return '-'
    }
    
    // 🔧 Parse Komponenten manuell (keine new Date() um Timezone zu vermeiden!)
    const [year, month, day] = dateString.split('-').map(Number)
    
    if (!year || !month || !day || month < 1 || month > 12 || day < 1 || day > 31) {
      return '-'
    }
    
    return `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${year}`;
  } catch (e) {
    console.error('formatDate Error:', e, 'Input:', date);
    return '-'
  }
}

/**
 * Formatiere Datum zu dd.mm (ohne Jahr)
 * @param {string|Date} date 
 * @returns {string}
 */
export const formatDateShort = (date) => {
  if (!date) return '-'
  
  try {
    let dateString;
    
    if (typeof date === 'string') {
      dateString = date.split('T')[0];
    } else if (date instanceof Date) {
      dateString = date.toISOString().split('T')[0];
    } else {
      return '-'
    }
    
    // 🔧 Parse manuell
    const [year, month, day] = dateString.split('-').map(Number)
    
    if (!year || !month || !day || month < 1 || month > 12 || day < 1 || day > 31) {
      return '-'
    }
    
    return `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}`;
  } catch {
    return '-'
  }
}

/**
 * Parse dd.mm Format zu Date
 * @param {string} str - Format "dd.mm"
 * @returns {Date|null}
 */
export const parseDateShort = (str) => {
  if (!str || str.length !== 5) return null;
  
  const parts = str.split('.');
  if (parts.length !== 2) return null;
  
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  
  if (day < 1 || day > 31 || month < 1 || month > 12) return null;
  
  const year = new Date().getFullYear();
  return new Date(year, month - 1, day);
}

/**
 * Validiere dd.mm Format
 * @param {string} str 
 * @returns {boolean}
 */
export const isValidDateShort = (str) => {
  if (!str || str.length !== 5) return false;
  
  const parts = str.split('.');
  if (parts.length !== 2) return false;
  
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  
  return day >= 1 && day <= 31 && month >= 1 && month <= 12;
}

/**
 * Formatiere Prozentangabe
 * @param {number} percent 
 * @returns {string}
 */
export const formatPercent = (percent) => {
  if (!percent && percent !== 0) return '0%'
  const num = parseFloat(percent);
  return isNaN(num) ? '0%' : `${num.toFixed(2)}%`;
}

/**
 * Formatiere Zahl mit 2 Dezimalstellen
 * @param {number} num 
 * @returns {string}
 */
export const formatNumber = (num) => {
  if (!num && num !== 0) return '0.00'
  const n = parseFloat(num);
  return isNaN(n) ? '0.00' : n.toFixed(2);
}

/**
 * Bestimme Farbe für Hypotheken-Quote basierend auf LTV
 * @param {number} ltv - Loan-to-Value Prozentsatz
 * @returns {string} - Tailwind Color Klasse
 */
export const getHypoQuoteColor = (ltv) => {
  if (!ltv && ltv !== 0) return 'bg-gray-100';
  
  const value = parseFloat(ltv);
  if (isNaN(value)) return 'bg-gray-100';
  
  if (value <= 50) return 'bg-green-100 text-green-900';
  if (value <= 65) return 'bg-green-50 text-green-900';
  if (value <= 80) return 'bg-yellow-50 text-yellow-900';
  if (value <= 90) return 'bg-orange-50 text-orange-900';
  return 'bg-red-50 text-red-900';
}

/**
 * Bestimme Farbe für KPI basierend auf Wert
 * @param {number} value - KPI Wert
 * @param {string} type - 'positive' oder 'negative'
 * @returns {string} - Tailwind Color Klasse
 */
export const getKPIColor = (value, type = 'positive') => {
  if (!value && value !== 0) return 'bg-gray-100 text-gray-900';
  
  const num = parseFloat(value);
  if (isNaN(num)) return 'bg-gray-100 text-gray-900';
  
  if (type === 'positive') {
    // Höher = besser
    if (num >= 80) return 'bg-green-100 text-green-900';
    if (num >= 60) return 'bg-green-50 text-green-900';
    if (num >= 40) return 'bg-yellow-50 text-yellow-900';
    if (num >= 20) return 'bg-orange-50 text-orange-900';
    return 'bg-red-50 text-red-900';
  } else {
    // Niedriger = besser
    if (num <= 20) return 'bg-green-100 text-green-900';
    if (num <= 40) return 'bg-green-50 text-green-900';
    if (num <= 60) return 'bg-yellow-50 text-yellow-900';
    if (num <= 80) return 'bg-orange-50 text-orange-900';
    return 'bg-red-50 text-red-900';
  }
}

/**
 * Formatiere Status mit Farbe
 * @param {string} status 
 * @returns {object} - {text, color}
 */
export const getStatusColor = (status) => {
  const statusMap = {
    'Aktiv': { text: 'Aktiv', color: 'bg-green-100 text-green-900' },
    'Inaktiv': { text: 'Inaktiv', color: 'bg-gray-100 text-gray-900' },
    'Archiv': { text: 'Archiv', color: 'bg-blue-100 text-blue-900' },
    'Gelöscht': { text: 'Gelöscht', color: 'bg-red-100 text-red-900' },
    'Ausstehend': { text: 'Ausstehend', color: 'bg-yellow-100 text-yellow-900' },
    'Abgelaufen': { text: 'Abgelaufen', color: 'bg-red-100 text-red-900' },
    'Ablauf bald': { text: 'Ablauf bald', color: 'bg-orange-100 text-orange-900' }
  };
  
  return statusMap[status] || { text: status, color: 'bg-gray-100 text-gray-900' };
}

/**
 * Formatiere Priorität mit Farbe
 * @param {string} prioritaet 
 * @returns {object} - {text, color}
 */
export const getPrioritaetColor = (prioritaet) => {
  const prioritaetMap = {
    'VIP': { text: 'VIP', color: 'bg-red-100 text-red-900' },
    'Hoch': { text: 'Hoch', color: 'bg-orange-100 text-orange-900' },
    'Normal': { text: 'Normal', color: 'bg-blue-100 text-blue-900' },
    'Niedrig': { text: 'Niedrig', color: 'bg-gray-100 text-gray-900' },
    'Archiv': { text: 'Archiv', color: 'bg-slate-100 text-slate-900' }
  };
  
  return prioritaetMap[prioritaet] || { text: prioritaet, color: 'bg-gray-100 text-gray-900' };
}

/**
 * Runde Zahl auf X Dezimalstellen
 * @param {number} num 
 * @param {number} decimals 
 * @returns {number}
 */
export const roundNumber = (num, decimals = 2) => {
  if (!num && num !== 0) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round(parseFloat(num) * factor) / factor;
}