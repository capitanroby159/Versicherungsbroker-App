import { NumberInput } from '../utils/numberFormatter'
import { formatSwissNumber } from '../utils/numberFormatter'
import './VersicherungsummenSection.css'

function VersicherungsummenSection({ formData, setFormData, isEditMode }) {
  
  // Berechne VW (Versicherungswert) = Inventar + MFZ
  const calculateVW = () => {
    const inventar = parseFloat(formData.sach_inventar?.replace(/'/g, '') || 0)
    const mfz = parseFloat(formData.sach_mfz_gesamt?.replace(/'/g, '') || 0)
    return inventar + mfz
  }

  const vw_gesamt = calculateVW()

  return (
    <div className="versicherungssummen-section">
      <h4>Versicherungssummen</h4>

      {/* INVENTAR */}
      <div className="summen-gruppe">
        <div className="form-group hauptsumme">
          <label>Inventar in CHF</label>
          <NumberInput
            value={formData.sach_inventar}
            onChange={(val) => setFormData({ ...formData, sach_inventar: val })}
            placeholder="z.B. 500'000"
            disabled={!isEditMode}
          />
        </div>

        <div className="unter-felder">
          <div className="form-group">
            <label>davon nicht fixes Inventar im Freien</label>
            <NumberInput
              value={formData.sach_inventar_nicht_fix_freien}
              onChange={(val) => setFormData({ ...formData, sach_inventar_nicht_fix_freien: val })}
              placeholder="z.B. 50'000"
              disabled={!isEditMode}
            />
          </div>

          <div className="form-group">
            <label>davon fixe Installationen im Freien</label>
            <NumberInput
              value={formData.sach_inventar_fix_installationen}
              onChange={(val) => setFormData({ ...formData, sach_inventar_fix_installationen: val })}
              placeholder="z.B. 30'000"
              disabled={!isEditMode}
            />
          </div>

          <div className="form-group">
            <label>davon Elementar-Spezial</label>
            <NumberInput
              value={formData.sach_inventar_elementar_spezial}
              onChange={(val) => setFormData({ ...formData, sach_inventar_elementar_spezial: val })}
              placeholder="z.B. 20'000"
              disabled={!isEditMode}
            />
          </div>

          <div className="form-group">
            <label>davon fixe Container/Mobilheime auf Areal</label>
            <NumberInput
              value={formData.sach_inventar_container}
              onChange={(val) => setFormData({ ...formData, sach_inventar_container: val })}
              placeholder="z.B. 25'000"
              disabled={!isEditMode}
            />
          </div>
        </div>
      </div>

      {/* EIGENE EINGELÖSTE MFZ */}
      <div className="summen-gruppe">
        <div className="form-group hauptsumme">
          <label>eigene eingelöste MFZ in CHF</label>
          <NumberInput
            value={formData.sach_mfz_gesamt}
            onChange={(val) => setFormData({ ...formData, sach_mfz_gesamt: val })}
            placeholder="z.B. 100'000"
            disabled={!isEditMode}
          />
        </div>

        <div className="unter-felder">
          <div className="form-group">
            <label>davon MFZ bis 3.5t</label>
            <NumberInput
              value={formData.sach_mfz_bis_35t}
              onChange={(val) => setFormData({ ...formData, sach_mfz_bis_35t: val })}
              placeholder="z.B. 60'000"
              disabled={!isEditMode}
            />
          </div>

          <div className="form-group">
            <label>davon MFZ über 3.5t, Motorboote, Arbeitsmaschinen</label>
            <NumberInput
              value={formData.sach_mfz_ueber_35t}
              onChange={(val) => setFormData({ ...formData, sach_mfz_ueber_35t: val })}
              placeholder="z.B. 40'000"
              disabled={!isEditMode}
            />
          </div>
        </div>
      </div>

      {/* VW BERECHNUNG ANZEIGE */}
      {vw_gesamt > 0 && (
        <div className="vw-berechnung">
          <strong>VW (Versicherungswert) Grundversicherung:</strong>
          <div className="vw-formel">
            Inventar CHF {formatSwissNumber(formData.sach_inventar || 0)} 
            {' + '} 
            MFZ CHF {formatSwissNumber(formData.sach_mfz_gesamt || 0)}
            {' = '}
            <span className="vw-total">CHF {formatSwissNumber(vw_gesamt)}</span>
          </div>
        </div>
      )}

      {/* UMSATZ */}
      <div className="summen-gruppe">
        <div className="form-group hauptsumme">
          <label>Umsatz in CHF</label>
          <NumberInput
            value={formData.sach_umsatz}
            onChange={(val) => setFormData({ ...formData, sach_umsatz: val })}
            placeholder="z.B. 2'000'000"
            disabled={!isEditMode}
          />
        </div>
      </div>

      {/* VW BETRIEBSUNTERBRUCH ANZEIGE */}
      {formData.sach_umsatz && parseFloat(formData.sach_umsatz.replace(/'/g, '')) > 0 && (
        <div className="vw-berechnung">
          <strong>VW Betriebsunterbruch:</strong>
          <div className="vw-formel">
            Umsatz 
            {' = '}
            <span className="vw-total">CHF {formatSwissNumber(formData.sach_umsatz)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default VersicherungsummenSection