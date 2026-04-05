'use client'
import { Plus, Trash2 } from 'lucide-react'
import type { ExitInputs, CapExInputs, CapExItem } from '@/types/proforma'
import { NumberInput } from '@/components/ui/NumberInput'
import { fmt$ } from '@/lib/utils'

interface Props {
  exit: ExitInputs
  capex: CapExInputs
  purchasePrice: number
  onExitChange: (e: ExitInputs) => void
  onCapExChange: (c: CapExInputs) => void
}

export function ExitAssumptionsSection({
  exit,
  capex,
  purchasePrice,
  onExitChange,
  onCapExChange,
}: Props) {
  function setE<K extends keyof ExitInputs>(key: K, val: ExitInputs[K]) {
    onExitChange({ ...exit, [key]: val })
  }

  function addCapEx() {
    const item: CapExItem = {
      id: String(Date.now()),
      description: 'Capital Improvement',
      category: 'custom',
      year: 1,
      amount: 0,
      isRecurring: false,
      recurringYears: 0,
    }
    onCapExChange({ ...capex, items: [...capex.items, item] })
  }

  function updateCapEx(id: string, key: keyof CapExItem, val: unknown) {
    onCapExChange({
      ...capex,
      items: capex.items.map((c) => (c.id === id ? { ...c, [key]: val } : c)),
    })
  }

  function removeCapEx(id: string) {
    onCapExChange({ ...capex, items: capex.items.filter((c) => c.id !== id) })
  }

  const totalCapEx = capex.items.reduce((s, c) => s + c.amount, 0)

  return (
    <div className="space-y-8">
      {/* ── Holding Period & Exit ─────────────────────── */}
      <div>
        <p className="section-header">Holding Period & Exit Strategy</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <NumberInput
            label="Holding Period (Years)"
            value={exit.holdingPeriodYears}
            onChange={(v) => setE('holdingPeriodYears', v)}
            min={1}
            max={10}
            hint="IRR calculated at exit year"
          />
          <NumberInput
            label="Exit Cap Rate"
            value={exit.exitCapRate}
            onChange={(v) => setE('exitCapRate', v)}
            suffix="%"
            decimals={2}
            step={0.25}
            hint="Applied to exit-year NOI"
          />
          <NumberInput
            label="Selling / Disposition Costs"
            value={exit.sellingCosts}
            onChange={(v) => setE('sellingCosts', v)}
            suffix="%"
            decimals={2}
            step={0.25}
            hint="Broker commissions, transfer taxes, etc."
          />
        </div>
      </div>

      {/* ── Depreciation & Tax ───────────────────────── */}
      <div>
        <p className="section-header">Depreciation & Taxes</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <NumberInput
            label="Depreciable Cost Basis"
            value={exit.costBasis}
            onChange={(v) => setE('costBasis', v)}
            prefix="$"
            step={10000}
            hint="Total cost minus land value"
          />
          <div>
            <label className="input-label">Depreciable Life</label>
            <select
              className="input-field"
              value={exit.depreciableLife}
              onChange={(e) => setE('depreciableLife', Number(e.target.value))}
            >
              <option value={27.5}>27.5 years (Residential)</option>
              <option value={39}>39 years (Commercial)</option>
              <option value={15}>15 years (Land Improvements)</option>
            </select>
          </div>
          <NumberInput
            label="Ordinary Income Tax Rate"
            value={exit.taxRate}
            onChange={(v) => setE('taxRate', v)}
            suffix="%"
            decimals={1}
            step={1}
            hint="Federal + state combined marginal"
          />
          <NumberInput
            label="Long-Term Cap Gains Rate"
            value={exit.longTermCapGainsRate}
            onChange={(v) => setE('longTermCapGainsRate', v)}
            suffix="%"
            decimals={1}
            step={1}
          />
          <NumberInput
            label="Discount Rate (for NPV)"
            value={exit.discountRate}
            onChange={(v) => setE('discountRate', v)}
            suffix="%"
            decimals={2}
            step={0.25}
            hint="Hurdle rate / required return"
          />
        </div>
        <div className="mt-3 text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
          Annual depreciation deduction: <strong className="text-gray-700">{fmt$(exit.costBasis / exit.depreciableLife)}</strong>
          &nbsp;over {exit.depreciableLife} years
        </div>
      </div>

      {/* ── Capital Expenditures ─────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="section-header mb-0">Capital Expenditures Schedule</p>
          <button onClick={addCapEx} className="btn-secondary text-xs py-1.5 px-3">
            <Plus className="w-3.5 h-3.5" />
            Add CapEx Item
          </button>
        </div>

        {capex.items.length === 0 ? (
          <p className="text-sm text-gray-400 italic">
            No planned capital expenditures. Add items like roof replacement, HVAC, unit renovations, etc.
          </p>
        ) : (
          <>
            <div className="space-y-3">
              {capex.items.map((item) => (
                <div key={item.id} className="flex gap-3 items-end border border-gray-200 rounded-xl p-4 bg-white">
                  <div className="flex-1">
                    <label className="input-label">Description</label>
                    <input
                      className="input-field"
                      value={item.description}
                      onChange={(e) => updateCapEx(item.id, 'description', e.target.value)}
                      placeholder="e.g. Roof Replacement"
                    />
                  </div>
                  <div className="w-28">
                    <label className="input-label">Year (1–10)</label>
                    <input
                      type="number"
                      className="input-field"
                      value={item.year}
                      min={1}
                      max={10}
                      onChange={(e) => updateCapEx(item.id, 'year', Number(e.target.value))}
                    />
                  </div>
                  <NumberInput
                    label="Amount"
                    value={item.amount}
                    onChange={(v) => updateCapEx(item.id, 'amount', v)}
                    prefix="$"
                    step={1000}
                    className="w-36"
                  />
                  <button
                    onClick={() => removeCapEx(item.id)}
                    className="mb-0.5 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex justify-between px-4 py-2 bg-gray-50 rounded-lg text-sm font-semibold text-gray-700 mt-3">
              <span>Total Planned CapEx</span>
              <span className="font-mono">{fmt$(totalCapEx)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
