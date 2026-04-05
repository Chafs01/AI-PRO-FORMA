'use client'

import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { NumberInput } from '@/components/ui/NumberInput'
import { fmt$ } from '@/lib/utils'
import type {
  PropertyDetails as PD,
  PropertyType,
  PropertyClass,
  ConstructionType,
  UtilitySetup,
  LaundryType,
  ParkingType,
  UnitMix,
  CommercialTenant,
} from '@/types/proforma'

interface Props {
  data: PD
  onChange: (d: PD) => void
}

function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="card mb-4">
      <button
        type="button"
        className="card-header w-full flex items-center justify-between text-left cursor-pointer"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="section-header">{title}</span>
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      {open && <div className="card-body">{children}</div>}
    </div>
  )
}

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'multifamily', label: 'Multifamily' },
  { value: 'single-family', label: 'Single Family' },
  { value: 'office', label: 'Office' },
  { value: 'retail', label: 'Retail' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'mixed-use', label: 'Mixed-Use' },
  { value: 'self-storage', label: 'Self-Storage' },
  { value: 'hospitality', label: 'Hospitality' },
  { value: 'other', label: 'Other' },
]
const PROPERTY_CLASSES: PropertyClass[] = ['A', 'B', 'C', 'D']
const CONSTRUCTION_TYPES: { value: ConstructionType; label: string }[] = [
  { value: 'wood-frame', label: 'Wood Frame' },
  { value: 'concrete', label: 'Concrete' },
  { value: 'steel', label: 'Steel' },
  { value: 'masonry', label: 'Masonry' },
  { value: 'prefab', label: 'Prefab' },
  { value: 'other', label: 'Other' },
]
const UTILITY_SETUPS: { value: UtilitySetup; label: string }[] = [
  { value: 'master-metered', label: 'Master Metered' },
  { value: 'sub-metered', label: 'Sub-Metered' },
  { value: 'individual', label: 'Individual Meters' },
]
const LAUNDRY_TYPES: { value: LaundryType; label: string }[] = [
  { value: 'in-unit', label: 'In-Unit' },
  { value: 'common', label: 'Common Area' },
  { value: 'none', label: 'None' },
]
const PARKING_TYPES: { value: ParkingType; label: string }[] = [
  { value: 'surface', label: 'Surface' },
  { value: 'structured', label: 'Structured' },
  { value: 'garage', label: 'Garage' },
  { value: 'street', label: 'Street' },
  { value: 'mixed', label: 'Mixed' },
]
const LEASE_TYPES = ['nnn', 'gross', 'modified-gross'] as const

export function PropertyDetailsSection({ data, onChange }: Props) {
  function set<K extends keyof PD>(key: K, val: PD[K]) {
    onChange({ ...data, [key]: val })
  }

  // Unit mix helpers
  function addUnit() {
    const unit: UnitMix = {
      id: String(Date.now()),
      unitType: '',
      unitCount: 0,
      sqft: 0,
      marketRent: 0,
      currentRent: 0,
      occupied: 0,
      leaseExpiration: '',
    }
    set('unitMix', [...data.unitMix, unit])
  }
  function updateUnit(id: string, key: keyof UnitMix, val: unknown) {
    set('unitMix', data.unitMix.map((u) => (u.id === id ? { ...u, [key]: val } : u)))
  }
  function removeUnit(id: string) {
    set('unitMix', data.unitMix.filter((u) => u.id !== id))
  }

  // Commercial tenant helpers
  function addTenant() {
    const t: CommercialTenant = {
      id: String(Date.now()),
      tenantName: '',
      sqft: 0,
      leaseType: 'nnn',
      baseRent: 0,
      leaseExpiration: '',
      escalation: 0,
      ownerExpenses: 0,
    }
    set('commercialTenants', [...data.commercialTenants, t])
  }
  function updateTenant(id: string, key: keyof CommercialTenant, val: unknown) {
    set('commercialTenants', data.commercialTenants.map((t) => (t.id === id ? { ...t, [key]: val } : t)))
  }
  function removeTenant(id: string) {
    set('commercialTenants', data.commercialTenants.filter((t) => t.id !== id))
  }

  const totalUnits = data.unitMix.reduce((s, u) => s + u.unitCount, 0)
  const totalAnnualGPR = data.unitMix.reduce((s, u) => s + u.unitCount * u.marketRent * 12, 0)

  return (
    <div className="space-y-2">

      {/* 1. Property Identification */}
      <Section title="Property Identification">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="input-label">Property Name</label>
            <input className="input-field" value={data.propertyName}
              onChange={(e) => set('propertyName', e.target.value)} placeholder="e.g. The Wilshire Apartments" />
          </div>
          <div className="sm:col-span-2">
            <label className="input-label">Address</label>
            <input className="input-field" value={data.address}
              onChange={(e) => set('address', e.target.value)} placeholder="123 Main Street" />
          </div>
          <div>
            <label className="input-label">City</label>
            <input className="input-field" value={data.city} onChange={(e) => set('city', e.target.value)} />
          </div>
          <div>
            <label className="input-label">State</label>
            <input className="input-field" value={data.state} onChange={(e) => set('state', e.target.value)} placeholder="CA" />
          </div>
          <div>
            <label className="input-label">ZIP Code</label>
            <input className="input-field" value={data.zipCode} onChange={(e) => set('zipCode', e.target.value)} />
          </div>
          <div>
            <label className="input-label">County</label>
            <input className="input-field" value={data.county} onChange={(e) => set('county', e.target.value)} />
          </div>
          <div>
            <label className="input-label">MSA</label>
            <input className="input-field" value={data.msa} onChange={(e) => set('msa', e.target.value)} />
          </div>
          <div>
            <label className="input-label">Submarket</label>
            <input className="input-field" value={data.submarket} onChange={(e) => set('submarket', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="input-label">APN (Assessor Parcel Number)</label>
            <input className="input-field" value={data.apn} onChange={(e) => set('apn', e.target.value)} />
          </div>
        </div>
      </Section>

      {/* 2. Classification */}
      <Section title="Classification">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="input-label">Property Type</label>
            <select className="input-field" value={data.propertyType}
              onChange={(e) => set('propertyType', e.target.value as PropertyType)}>
              {PROPERTY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="input-label">Property Class</label>
            <select className="input-field" value={data.propertyClass}
              onChange={(e) => set('propertyClass', e.target.value as PropertyClass)}>
              {PROPERTY_CLASSES.map((c) => <option key={c} value={c}>Class {c}</option>)}
            </select>
          </div>
          <div>
            <label className="input-label">Construction Type</label>
            <select className="input-field" value={data.constructionType}
              onChange={(e) => set('constructionType', e.target.value as ConstructionType)}>
              {CONSTRUCTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <NumberInput label="Year Built" value={data.yearBuilt}
            onChange={(v) => set('yearBuilt', v)} min={1800} max={2030} />
          <NumberInput label="Year Renovated" value={data.yearRenovated}
            onChange={(v) => set('yearRenovated', v)} min={1800} max={2030}
            hint="Leave 0 if never renovated" />
        </div>
      </Section>

      {/* 3. Physical Details */}
      <Section title="Physical Details">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <NumberInput label="Total Units" value={data.totalUnits}
            onChange={(v) => set('totalUnits', v)} />
          <NumberInput label="Total Sq Ft" value={data.totalSqft}
            onChange={(v) => set('totalSqft', v)} step={100} />
          <NumberInput label="Net Rentable Sq Ft" value={data.netRentableSqft}
            onChange={(v) => set('netRentableSqft', v)} step={100} />
          <NumberInput label="Common Area Sq Ft" value={data.commonAreaSqft}
            onChange={(v) => set('commonAreaSqft', v)} step={100} />
          <NumberInput label="Lot Size (Sq Ft)" value={data.lotSizeSqft}
            onChange={(v) => set('lotSizeSqft', v)} step={100} />
          <NumberInput label="Lot Size (Acres)" value={data.lotSizeAcres}
            onChange={(v) => set('lotSizeAcres', v)} decimals={2} step={0.1} />
          <NumberInput label="Stories" value={data.stories}
            onChange={(v) => set('stories', v)} min={1} />
          <NumberInput label="Number of Buildings" value={data.numberOfBuildings}
            onChange={(v) => set('numberOfBuildings', v)} min={1} />
        </div>
      </Section>

      {/* 4. Parking */}
      <Section title="Parking">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <NumberInput label="Total Parking Spaces" value={data.parkingSpaces}
            onChange={(v) => set('parkingSpaces', v)} />
          <div>
            <label className="input-label">Parking Type</label>
            <select className="input-field" value={data.parkingType}
              onChange={(e) => set('parkingType', e.target.value as ParkingType)}>
              {PARKING_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <NumberInput label="Covered Spaces" value={data.coveredSpaces}
            onChange={(v) => set('coveredSpaces', v)} />
          <NumberInput label="Garage Spaces" value={data.garageSpaces}
            onChange={(v) => set('garageSpaces', v)} />
        </div>
      </Section>

      {/* 5. Systems & Utilities */}
      <Section title="Systems & Utilities">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <label className="input-label">Utility Setup</label>
            <select className="input-field" value={data.utilitySetup}
              onChange={(e) => set('utilitySetup', e.target.value as UtilitySetup)}>
              {UTILITY_SETUPS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
            </select>
          </div>
          <div>
            <label className="input-label">Laundry Type</label>
            <select className="input-field" value={data.laundryType}
              onChange={(e) => set('laundryType', e.target.value as LaundryType)}>
              {LAUNDRY_TYPES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
          <div>
            <label className="input-label">HVAC Type</label>
            <input className="input-field" value={data.hvacType}
              onChange={(e) => set('hvacType', e.target.value)} placeholder="e.g. Central, Mini-Split" />
          </div>
          <div>
            <label className="input-label">Roof Type</label>
            <input className="input-field" value={data.roofType}
              onChange={(e) => set('roofType', e.target.value)} placeholder="e.g. Flat, Pitched, TPO" />
          </div>
          <NumberInput label="Roof Age (yrs)" value={data.roofAge}
            onChange={(v) => set('roofAge', v)} min={0} />
          <NumberInput label="Plumbing Age (yrs)" value={data.plumbingAge}
            onChange={(v) => set('plumbingAge', v)} min={0} />
          <NumberInput label="Electrical Age (yrs)" value={data.electricalAge}
            onChange={(v) => set('electricalAge', v)} min={0} />
          <div className="flex items-center gap-2 pt-6">
            <input type="checkbox" id="hasElevator" checked={data.hasElevator}
              onChange={(e) => set('hasElevator', e.target.checked)} className="w-4 h-4 rounded" />
            <label htmlFor="hasElevator" className="input-label mb-0 cursor-pointer">Has Elevator</label>
          </div>
        </div>
      </Section>

      {/* 6. Zoning & Regulatory */}
      <Section title="Zoning & Regulatory">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <label className="input-label">Zoning</label>
            <input className="input-field" value={data.zoning}
              onChange={(e) => set('zoning', e.target.value)} placeholder="e.g. R-3, C-2" />
          </div>
          <div>
            <label className="input-label">Flood Zone</label>
            <input className="input-field" value={data.floodZone}
              onChange={(e) => set('floodZone', e.target.value)} placeholder="e.g. X, AE, VE" />
          </div>
          <div>
            <label className="input-label">Seismic Zone</label>
            <input className="input-field" value={data.seismicZone}
              onChange={(e) => set('seismicZone', e.target.value)} placeholder="e.g. Zone 4" />
          </div>
          <NumberInput label="Current Occupancy (%)" value={data.currentOccupancy}
            onChange={(v) => set('currentOccupancy', v)} suffix="%" decimals={1} min={0} max={100} />
        </div>
      </Section>

      {/* 7. Amenities */}
      <Section title="Amenities">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {(
            [
              ['hasPool', 'Pool'],
              ['hasFitnessCtr', 'Fitness Center'],
              ['hasDogPark', 'Dog Park'],
              ['hasCoworking', 'Co-working Space'],
              ['hasEVCharging', 'EV Charging'],
              ['hasSmartHome', 'Smart Home'],
              ['hasGatedAccess', 'Gated Access'],
              ['hasConcierge', 'Concierge'],
            ] as [keyof PD, string][]
          ).map(([key, label]) => (
            <div key={key} className="flex items-center gap-2">
              <input type="checkbox" id={key} checked={data[key] as boolean}
                onChange={(e) => set(key, e.target.checked as PD[typeof key])}
                className="w-4 h-4 rounded" />
              <label htmlFor={key} className="input-label mb-0 cursor-pointer text-sm">{label}</label>
            </div>
          ))}
        </div>
        <div>
          <label className="input-label">Amenities Notes</label>
          <textarea className="input-field" rows={3} value={data.amenitiesNotes}
            onChange={(e) => set('amenitiesNotes', e.target.value)}
            placeholder="Describe additional amenities or planned upgrades…" />
        </div>
      </Section>

      {/* 8. Market Scores */}
      <Section title="Market Scores">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <NumberInput label="Walk Score (0–100)" value={data.walkScore}
            onChange={(v) => set('walkScore', v)} min={0} max={100} />
          <NumberInput label="Transit Score (0–100)" value={data.transitScore}
            onChange={(v) => set('transitScore', v)} min={0} max={100} />
          <NumberInput label="Bike Score (0–100)" value={data.bikeScore}
            onChange={(v) => set('bikeScore', v)} min={0} max={100} />
          <NumberInput label="School Rating (0–10)" value={data.schoolRating}
            onChange={(v) => set('schoolRating', v)} min={0} max={10} decimals={1} step={0.5} />
          <NumberInput label="Crime Index (0–100)" value={data.crimeIndex}
            onChange={(v) => set('crimeIndex', v)} min={0} max={100}
            hint="Higher = more crime" />
        </div>
      </Section>

      {/* 9. Unit Mix / Rent Roll */}
      <Section title="Unit Mix / Rent Roll">
        {data.unitMix.length === 0 ? (
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-400 text-sm mb-4">
            No unit types added yet.
          </div>
        ) : (
          <div className="overflow-x-auto mb-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="input-label pb-2 pr-2 font-semibold">Unit Type</th>
                  <th className="input-label pb-2 pr-2 font-semibold"># Units</th>
                  <th className="input-label pb-2 pr-2 font-semibold">Sq Ft</th>
                  <th className="input-label pb-2 pr-2 font-semibold">Market Rent</th>
                  <th className="input-label pb-2 pr-2 font-semibold">Current Rent</th>
                  <th className="input-label pb-2 pr-2 font-semibold">Occupied</th>
                  <th className="input-label pb-2 pr-2 font-semibold">Lease Exp.</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {data.unitMix.map((unit) => (
                  <tr key={unit.id} className="border-b last:border-0">
                    <td className="py-1 pr-2">
                      <input className="input-field py-1 text-xs" value={unit.unitType}
                        onChange={(e) => updateUnit(unit.id, 'unitType', e.target.value)}
                        placeholder="1BR/1BA" />
                    </td>
                    <td className="py-1 pr-2">
                      <input type="number" className="input-field py-1 text-xs text-right w-20"
                        value={unit.unitCount} min={0}
                        onChange={(e) => updateUnit(unit.id, 'unitCount', Number(e.target.value))} />
                    </td>
                    <td className="py-1 pr-2">
                      <input type="number" className="input-field py-1 text-xs text-right w-24"
                        value={unit.sqft} min={0}
                        onChange={(e) => updateUnit(unit.id, 'sqft', Number(e.target.value))} />
                    </td>
                    <td className="py-1 pr-2">
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                        <input type="number" className="input-field py-1 text-xs text-right pl-5 w-28"
                          value={unit.marketRent} min={0}
                          onChange={(e) => updateUnit(unit.id, 'marketRent', Number(e.target.value))} />
                      </div>
                    </td>
                    <td className="py-1 pr-2">
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                        <input type="number" className="input-field py-1 text-xs text-right pl-5 w-28"
                          value={unit.currentRent} min={0}
                          onChange={(e) => updateUnit(unit.id, 'currentRent', Number(e.target.value))} />
                      </div>
                    </td>
                    <td className="py-1 pr-2">
                      <input type="number" className="input-field py-1 text-xs text-right w-20"
                        value={unit.occupied} min={0}
                        onChange={(e) => updateUnit(unit.id, 'occupied', Number(e.target.value))} />
                    </td>
                    <td className="py-1 pr-2">
                      <input className="input-field py-1 text-xs w-28" value={unit.leaseExpiration}
                        onChange={(e) => updateUnit(unit.id, 'leaseExpiration', e.target.value)}
                        placeholder="MM/YYYY" />
                    </td>
                    <td className="py-1">
                      <button onClick={() => removeUnit(unit.id)}
                        className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 border-t">
                  <td className="px-2 py-2 text-xs font-bold text-gray-700">TOTALS</td>
                  <td className="px-2 py-2 text-xs font-bold">{totalUnits} units</td>
                  <td colSpan={4} />
                  <td colSpan={2} className="px-2 py-2 text-xs font-semibold text-right">
                    Annual GPR:{' '}
                    <span className="text-green-700 font-mono">{fmt$(totalAnnualGPR)}</span>
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
        <button type="button" onClick={addUnit} className="btn-secondary flex items-center gap-1 text-xs py-1.5 px-3">
          <Plus className="w-3.5 h-3.5" /> Add Unit Type
        </button>
      </Section>

      {/* 10. Commercial Tenants */}
      <Section title="Commercial Tenants (Optional)" defaultOpen={false}>
        <p className="text-xs text-gray-400 mb-3">Add retail, office, or other commercial tenants if applicable.</p>
        {data.commercialTenants.length === 0 ? (
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center text-gray-400 text-sm mb-4">
            No commercial tenants added.
          </div>
        ) : (
          <div className="overflow-x-auto mb-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="input-label pb-2 pr-2 font-semibold">Tenant Name</th>
                  <th className="input-label pb-2 pr-2 font-semibold">Sq Ft</th>
                  <th className="input-label pb-2 pr-2 font-semibold">Lease Type</th>
                  <th className="input-label pb-2 pr-2 font-semibold">Base Rent ($/sf/yr)</th>
                  <th className="input-label pb-2 pr-2 font-semibold">Lease Exp.</th>
                  <th className="input-label pb-2 pr-2 font-semibold">Escalation %</th>
                  <th className="input-label pb-2 pr-2 font-semibold">Owner Exp ($/sf/yr)</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {data.commercialTenants.map((t) => (
                  <tr key={t.id} className="border-b last:border-0">
                    <td className="py-1 pr-2">
                      <input className="input-field py-1 text-xs" value={t.tenantName}
                        onChange={(e) => updateTenant(t.id, 'tenantName', e.target.value)} />
                    </td>
                    <td className="py-1 pr-2">
                      <input type="number" className="input-field py-1 text-xs text-right w-24"
                        value={t.sqft} min={0}
                        onChange={(e) => updateTenant(t.id, 'sqft', Number(e.target.value))} />
                    </td>
                    <td className="py-1 pr-2">
                      <select className="input-field py-1 text-xs" value={t.leaseType}
                        onChange={(e) => updateTenant(t.id, 'leaseType', e.target.value)}>
                        {LEASE_TYPES.map((lt) => (
                          <option key={lt} value={lt}>{lt.toUpperCase()}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-1 pr-2">
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                        <input type="number" className="input-field py-1 text-xs text-right pl-5 w-28"
                          value={t.baseRent} min={0}
                          onChange={(e) => updateTenant(t.id, 'baseRent', Number(e.target.value))} />
                      </div>
                    </td>
                    <td className="py-1 pr-2">
                      <input className="input-field py-1 text-xs w-28" value={t.leaseExpiration}
                        onChange={(e) => updateTenant(t.id, 'leaseExpiration', e.target.value)}
                        placeholder="MM/YYYY" />
                    </td>
                    <td className="py-1 pr-2">
                      <div className="relative">
                        <input type="number" className="input-field py-1 text-xs text-right pr-5 w-20"
                          value={t.escalation} min={0}
                          onChange={(e) => updateTenant(t.id, 'escalation', Number(e.target.value))} />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
                      </div>
                    </td>
                    <td className="py-1 pr-2">
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                        <input type="number" className="input-field py-1 text-xs text-right pl-5 w-28"
                          value={t.ownerExpenses} min={0}
                          onChange={(e) => updateTenant(t.id, 'ownerExpenses', Number(e.target.value))} />
                      </div>
                    </td>
                    <td className="py-1">
                      <button onClick={() => removeTenant(t.id)}
                        className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <button type="button" onClick={addTenant} className="btn-secondary flex items-center gap-1 text-xs py-1.5 px-3">
          <Plus className="w-3.5 h-3.5" /> Add Tenant
        </button>
      </Section>

    </div>
  )
}
