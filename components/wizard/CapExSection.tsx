'use client'

import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { NumberInput } from '@/components/ui/NumberInput'
import { fmt$ } from '@/lib/utils'
import type { CapExInputs, CapExItem } from '@/types/proforma'

interface Props {
  data: CapExInputs
  onChange: (d: CapExInputs) => void
  purchasePrice: number
  totalUnits: number
}

const YEARS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const

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

// Building system / common area item with a year selector
interface SystemItem {
  key: keyof CapExInputs
  yearKey: string
  label: string
}

export function CapExSectionWizard({ data, onChange, purchasePrice, totalUnits }: Props) {
  function set<K extends keyof CapExInputs>(key: K, val: CapExInputs[K]) {
    onChange({ ...data, [key]: val })
  }

  // ── Unit Renovation calcs ──────────────────────────────────────────────────
  const unitRenoTotalCost = data.unitRenovationCostPerUnit * totalUnits
  const unitRenoYearsToComplete =
    data.unitRenovationUnitsPerYear > 0
      ? Math.ceil(totalUnits / data.unitRenovationUnitsPerYear)
      : 0
  const rentBumpRevenue =
    data.unitRenovationRentBump > 0 && totalUnits > 0
      ? (data.unitRenovationCostPerUnit > 0
          ? (data.unitRenovationCostPerUnit * (data.unitRenovationRentBump / 100)) * totalUnits * 12
          : 0)
      : 0

  // ── Custom CapEx items helpers ─────────────────────────────────────────────
  function addItem() {
    const item: CapExItem = {
      id: String(Date.now()),
      description: '',
      category: '',
      year: 1,
      amount: 0,
      isRecurring: false,
      recurringYears: 1,
    }
    set('items', [...data.items, item])
  }
  function updateItem(id: string, key: keyof CapExItem, val: unknown) {
    set('items', data.items.map((i) => (i.id === id ? { ...i, [key]: val } : i)))
  }
  function removeItem(id: string) {
    set('items', data.items.filter((i) => i.id !== id))
  }

  // ── CapEx by year (all sources) ───────────────────────────────────────────
  function getCapExByYear(): Record<number, number> {
    const totals: Record<number, number> = {}
    YEARS.forEach((y) => (totals[y] = 0))

    // Unit renovation
    if (data.unitRenovationCostPerUnit > 0 && data.unitRenovationUnitsPerYear > 0) {
      let unitsLeft = totalUnits
      let yr = data.unitRenovationStartYear
      while (unitsLeft > 0 && yr <= 10) {
        const unitsThisYear = Math.min(unitsLeft, data.unitRenovationUnitsPerYear)
        totals[yr] = (totals[yr] ?? 0) + unitsThisYear * data.unitRenovationCostPerUnit
        unitsLeft -= unitsThisYear
        yr++
      }
    }

    // Building systems — each has a fixed year field we store as e.g. roofReplacementYear
    const systemEntries: { amount: number; yearKey: string }[] = [
      { amount: data.roofReplacement, yearKey: 'roofReplacementYear' },
      { amount: data.hvacReplacement, yearKey: 'hvacReplacementYear' },
      { amount: data.plumbingUpgrade, yearKey: 'plumbingUpgradeYear' },
      { amount: data.electricalUpgrade, yearKey: 'electricalUpgradeYear' },
      { amount: data.windowReplacement, yearKey: 'windowReplacementYear' },
      { amount: data.elevatorModernization, yearKey: 'elevatorModernizationYear' },
      { amount: data.commonAreaRenovation, yearKey: 'commonAreaRenovationYear' },
      { amount: data.lobbyRenovation, yearKey: 'lobbyRenovationYear' },
      { amount: data.laundryRoomUpgrade, yearKey: 'laundryRoomUpgradeYear' },
      { amount: data.amenityUpgrade, yearKey: 'amenityUpgradeYear' },
      { amount: data.parkingLotResurface, yearKey: 'parkingLotResurfaceYear' },
      { amount: data.exteriorPaint, yearKey: 'exteriorPaintYear' },
      { amount: data.signageReplace, yearKey: 'signageReplaceYear' },
      { amount: data.securityUpgrade, yearKey: 'securityUpgradeYear' },
    ]
    systemEntries.forEach(({ amount, yearKey }) => {
      if (amount > 0) {
        const yr = ((data as unknown as Record<string, number>)[yearKey] ?? 1)
        if (yr >= 1 && yr <= 10) totals[yr] += amount
      }
    })

    // Custom items
    data.items.forEach((item) => {
      if (item.amount <= 0) return
      if (item.isRecurring) {
        for (let y = item.year; y <= Math.min(10, item.year + item.recurringYears - 1); y++) {
          totals[y] = (totals[y] ?? 0) + item.amount
        }
      } else {
        if (item.year >= 1 && item.year <= 10) {
          totals[item.year] = (totals[item.year] ?? 0) + item.amount
        }
      }
    })

    return totals
  }

  const capexByYear = getCapExByYear()
  const totalCapEx = Object.values(capexByYear).reduce((s, v) => s + v, 0)

  // Helper: system item row (amount + year selector)
  function SystemRow({
    label,
    amtKey,
    yearKey,
  }: {
    label: string
    amtKey: keyof CapExInputs
    yearKey: string
  }) {
    const amt = data[amtKey] as number
    const yr = ((data as unknown as Record<string, number>)[yearKey] ?? 1) as number
    return (
      <div className="flex items-end gap-3">
        <NumberInput label={label} value={amt}
          onChange={(v) => set(amtKey, v as CapExInputs[typeof amtKey])} prefix="$" step={1000}
          className="flex-1" />
        <div className="w-28">
          <label className="input-label">Year (1–10)</label>
          <select className="input-field" value={yr}
            onChange={(e) =>
              onChange({ ...data, [yearKey]: Number(e.target.value) } as unknown as CapExInputs)
            }>
            {YEARS.map((y) => <option key={y} value={y}>Year {y}</option>)}
          </select>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">

      {/* 1. Unit Renovation Program */}
      <Section title="Unit Renovation Program">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
          <NumberInput label="Cost per Unit ($)" value={data.unitRenovationCostPerUnit}
            onChange={(v) => set('unitRenovationCostPerUnit', v)} prefix="$" step={1000} />
          <NumberInput label="Units Renovated per Year" value={data.unitRenovationUnitsPerYear}
            onChange={(v) => set('unitRenovationUnitsPerYear', v)} step={1} min={0} />
          <NumberInput label="Start Year (1–10)" value={data.unitRenovationStartYear}
            onChange={(v) => set('unitRenovationStartYear', v)} min={1} max={10} />
          <NumberInput label="Post-Reno Rent Bump (%)" value={data.unitRenovationRentBump}
            onChange={(v) => set('unitRenovationRentBump', v)} suffix="%" decimals={1} step={0.5}
            hint="Estimated increase in market rent after renovation" />
        </div>

        {(data.unitRenovationCostPerUnit > 0 || data.unitRenovationUnitsPerYear > 0) && (
          <div className="grid grid-cols-3 gap-4 bg-blue-50 border border-blue-200 rounded-xl p-4 text-center text-sm">
            <div>
              <p className="text-xs text-gray-500 mb-1">Total Renovation Cost</p>
              <p className="font-bold font-mono" style={{ color: '#1e3a5f' }}>{fmt$(unitRenoTotalCost)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Years to Complete</p>
              <p className="font-bold">{unitRenoYearsToComplete > 0 ? unitRenoYearsToComplete : '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Annual Rent Bump Revenue</p>
              <p className="font-bold font-mono text-green-700">{fmt$(rentBumpRevenue)}</p>
            </div>
          </div>
        )}
      </Section>

      {/* 2. Building Systems */}
      <Section title="Building Systems">
        <p className="text-xs text-gray-400 mb-4">Enter amount and the year you expect to incur the expense (1–10).</p>
        <div className="space-y-3">
          <SystemRow label="Roof Replacement" amtKey="roofReplacement" yearKey="roofReplacementYear" />
          <SystemRow label="HVAC Replacement" amtKey="hvacReplacement" yearKey="hvacReplacementYear" />
          <SystemRow label="Plumbing Upgrade" amtKey="plumbingUpgrade" yearKey="plumbingUpgradeYear" />
          <SystemRow label="Electrical Upgrade" amtKey="electricalUpgrade" yearKey="electricalUpgradeYear" />
          <SystemRow label="Window Replacement" amtKey="windowReplacement" yearKey="windowReplacementYear" />
          <SystemRow label="Elevator Modernization" amtKey="elevatorModernization" yearKey="elevatorModernizationYear" />
        </div>
      </Section>

      {/* 3. Common Areas & Exterior */}
      <Section title="Common Areas & Exterior">
        <div className="space-y-3">
          <SystemRow label="Common Area Renovation" amtKey="commonAreaRenovation" yearKey="commonAreaRenovationYear" />
          <SystemRow label="Lobby Renovation" amtKey="lobbyRenovation" yearKey="lobbyRenovationYear" />
          <SystemRow label="Laundry Room Upgrade" amtKey="laundryRoomUpgrade" yearKey="laundryRoomUpgradeYear" />
          <SystemRow label="Amenity Upgrade" amtKey="amenityUpgrade" yearKey="amenityUpgradeYear" />
          <SystemRow label="Parking Lot Resurface" amtKey="parkingLotResurface" yearKey="parkingLotResurfaceYear" />
          <SystemRow label="Exterior Paint" amtKey="exteriorPaint" yearKey="exteriorPaintYear" />
          <SystemRow label="Signage Replacement" amtKey="signageReplace" yearKey="signageReplaceYear" />
          <SystemRow label="Security Upgrade" amtKey="securityUpgrade" yearKey="securityUpgradeYear" />
        </div>
      </Section>

      {/* 4. Custom CapEx Schedule */}
      <Section title="Custom CapEx Schedule">
        {data.items.length === 0 ? (
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center text-gray-400 text-sm mb-4">
            No custom items added.
          </div>
        ) : (
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="input-label pb-2 pr-2 font-semibold">Description</th>
                  <th className="input-label pb-2 pr-2 font-semibold">Category</th>
                  <th className="input-label pb-2 pr-2 font-semibold">Year</th>
                  <th className="input-label pb-2 pr-2 font-semibold">Amount</th>
                  <th className="input-label pb-2 pr-2 font-semibold">Recurring</th>
                  <th className="input-label pb-2 pr-2 font-semibold">Recur Yrs</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="py-1 pr-2">
                      <input className="input-field py-1 text-xs" value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        placeholder="e.g. Boiler replacement" />
                    </td>
                    <td className="py-1 pr-2">
                      <input className="input-field py-1 text-xs w-32" value={item.category}
                        onChange={(e) => updateItem(item.id, 'category', e.target.value)}
                        placeholder="Systems" />
                    </td>
                    <td className="py-1 pr-2">
                      <select className="input-field py-1 text-xs w-24" value={item.year}
                        onChange={(e) => updateItem(item.id, 'year', Number(e.target.value))}>
                        {YEARS.map((y) => <option key={y} value={y}>Yr {y}</option>)}
                      </select>
                    </td>
                    <td className="py-1 pr-2">
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                        <input type="number" className="input-field py-1 text-xs text-right pl-5 w-28"
                          value={item.amount} min={0}
                          onChange={(e) => updateItem(item.id, 'amount', Number(e.target.value))} />
                      </div>
                    </td>
                    <td className="py-1 pr-2 text-center">
                      <input type="checkbox" checked={item.isRecurring}
                        onChange={(e) => updateItem(item.id, 'isRecurring', e.target.checked)}
                        className="w-4 h-4 rounded" />
                    </td>
                    <td className="py-1 pr-2">
                      {item.isRecurring ? (
                        <input type="number" className="input-field py-1 text-xs text-right w-20"
                          value={item.recurringYears} min={1} max={10}
                          onChange={(e) => updateItem(item.id, 'recurringYears', Number(e.target.value))} />
                      ) : (
                        <span className="text-gray-300 text-xs px-2">—</span>
                      )}
                    </td>
                    <td className="py-1">
                      <button onClick={() => removeItem(item.id)}
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
        <button type="button" onClick={addItem}
          className="btn-secondary flex items-center gap-1 text-xs py-1.5 px-3">
          <Plus className="w-3.5 h-3.5" /> Add CapEx Item
        </button>
      </Section>

      {/* 5. CapEx Summary by Year */}
      {totalCapEx > 0 && (
        <div className="card mb-4">
          <div className="card-header">
            <span className="section-header">CapEx Summary by Year</span>
          </div>
          <div className="card-body">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {YEARS.map((y) => (
                      <th key={y} className="input-label pb-2 text-center font-semibold pr-2">Yr {y}</th>
                    ))}
                    <th className="input-label pb-2 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {YEARS.map((y) => (
                      <td key={y} className={`py-2 text-center font-mono text-xs pr-2 ${capexByYear[y] > 0 ? 'text-gray-900 font-semibold' : 'text-gray-300'}`}>
                        {capexByYear[y] > 0 ? fmt$(capexByYear[y]) : '—'}
                      </td>
                    ))}
                    <td className="py-2 text-right font-mono font-bold" style={{ color: '#1e3a5f' }}>
                      {fmt$(totalCapEx)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Per-unit context */}
            {totalUnits > 0 && totalCapEx > 0 && (
              <p className="text-xs text-gray-400 mt-2">
                Total CapEx per unit: <strong className="text-gray-600">{fmt$(totalCapEx / totalUnits)}</strong>
                {purchasePrice > 0 && (
                  <span className="ml-3">
                    As % of purchase price:{' '}
                    <strong className="text-gray-600">{((totalCapEx / purchasePrice) * 100).toFixed(1)}%</strong>
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
