import React from 'react'

/**
 * GLOBALER ZAHLEN-FORMATTER
 * Automatische Tausender-Trennzeichen für alle Zahlen-Inputs
 */

/**
 * Formatiert eine Zahl mit Schweizer Tausender-Trennzeichen
 * @param {string|number} value - Die zu formatierende Zahl
 * @returns {string} Formatierte Zahl (z.B. "1'000'000.50")
 */
export const formatSwissNumber = (value) => {
  if (!value && value !== 0) return ''
  
  // Konvertiere zu String und entferne alle nicht-numerischen Zeichen außer . und -
  const cleaned = value.toString().replace(/[^\d.-]/g, '')
  
  if (cleaned === '' || cleaned === '-') return cleaned
  
  // Trenne Vor- und Nachkommastellen
  const parts = cleaned.split('.')
  
  // Formatiere Vorkommastellen mit Tausender-Trennzeichen
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, "'")
  
  // Füge zusammen (max 2 Nachkommastellen)
  return parts.length > 1 
    ? parts[0] + '.' + parts[1].substring(0, 2)
    : parts[0]
}

/**
 * Entfernt Formatierung und gibt reine Zahl zurück
 * @param {string} value - Formatierter String
 * @returns {number|null} Reine Zahl oder null
 */
export const cleanNumber = (value) => {
  if (!value || value === '') return null
  const cleaned = value.toString().replace(/'/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

/**
 * Event-Handler für Input-Felder mit automatischer Formatierung
 * Verwendung: onChange={(e) => handleNumberInput(e, setFormData, formData, 'fieldName')}
 * 
 * @param {Event} e - Das Input-Event
 * @param {Function} setFormData - State-Setter Funktion
 * @param {Object} formData - Aktueller State
 * @param {string} fieldName - Name des Feldes
 */
export const handleNumberInput = (e, setFormData, formData, fieldName) => {
  const formatted = formatSwissNumber(e.target.value)
  setFormData({ ...formData, [fieldName]: formatted })
}

/**
 * Smart Number Input - Formatiert nur wenn es eine reine Zahl ist
 * Erlaubt auch Text wie "10% der Grunddeckung"
 */
export const SmartNumberInput = ({ value, onChange, placeholder, className, ...props }) => {
  const handleChange = (e) => {
    const input = e.target.value
    
    // Prüfe ob es nur aus Zahlen, Punkten, Kommas und Apostrophen besteht
    const isNumericOnly = /^[\d.',-]*$/.test(input)
    
    if (isNumericOnly && input.trim() !== '') {
      // Formatiere als Zahl
      const formatted = formatSwissNumber(input)
      onChange(formatted)
    } else {
      // Behalte als Text
      onChange(input)
    }
  }

  return (
    <input
      type="text"
      value={value || ''}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
      {...props}
    />
  )
}

/**
 * Number Input - Immer als Zahl formatiert
 * Verwendung für reine Zahlen-Felder
 */
export const NumberInput = ({ value, onChange, placeholder, className, ...props }) => {
  const handleChange = (e) => {
    const formatted = formatSwissNumber(e.target.value)
    onChange(formatted)
  }

  return (
    <input
      type="text"
      value={value || ''}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
      inputMode="decimal"
      {...props}
    />
  )
}

/**
 * Hook für automatische Formatierung bei mehreren Feldern
 * Verwendung:
 * 
 * const { formData, setFormattedValue, setFormData } = useNumberFormatter({
 *   praemie: '',
 *   selbstbehalt: '',
 *   lohnsumme: ''
 * })
 * 
 * <input onChange={(e) => setFormattedValue('praemie', e.target.value)} />
 */
export const useNumberFormatter = (initialState) => {
  const [formData, setFormData] = React.useState(initialState)

  const setFormattedValue = (fieldName, value) => {
    const formatted = formatSwissNumber(value)
    setFormData(prev => ({ ...prev, [fieldName]: formatted }))
  }

  return { formData, setFormattedValue, setFormData }
}

/**
 * Formatiert alle numerischen Felder in einem Objekt
 * @param {Object} data - Das Datenobjekt
 * @param {Array} fields - Array von Feldnamen die formatiert werden sollen
 * @returns {Object} Objekt mit formatierten Feldern
 */
export const formatObjectNumbers = (data, fields) => {
  const formatted = { ...data }
  fields.forEach(field => {
    if (formatted[field] !== undefined && formatted[field] !== null) {
      formatted[field] = formatSwissNumber(formatted[field])
    }
  })
  return formatted
}

/**
 * Bereinigt alle numerischen Felder in einem Objekt vor dem Speichern
 * @param {Object} data - Das Datenobjekt
 * @param {Array} fields - Array von Feldnamen die bereinigt werden sollen
 * @returns {Object} Objekt mit bereinigten Feldern
 */
export const cleanObjectNumbers = (data, fields) => {
  const cleaned = { ...data }
  fields.forEach(field => {
    if (cleaned[field] !== undefined && cleaned[field] !== null) {
      cleaned[field] = cleanNumber(cleaned[field])
    }
  })
  return cleaned
}