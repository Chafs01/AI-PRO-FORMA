'use client'

import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { NumberInput } from '@/components/ui/NumberInput'
import { fmt$ } from '@/lib/utils'
import type { IncomeInputs, OtherIncomeItem } from '@/types/proforma'

interface Props {
  data: IncomeInputs
  gpr: number
  totalUnits: number
  onChange: (d: IncomeInputs) => void
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

export function IncomeSectionWizard({ data, gpr, totalUnits, onChange }: Props) {
  function set<K extends keyof IncomeInputs>(key: K, val: IncomeInputs[K]) {
    onChange({ ...data, [key]: val })
  }

  // Custom other income
  function addOtherIncome() {
    const item: OtherIncomeItem = {
      id: String(Date.now()),
      label: 'Other Income',
      annualAmount: 0,
      growthRate: 2,
    }
    set('otherIncome', [...data.otherIncome, item])
  }
  function updateOI(id: string, key: keyof OtherIncomeItem, val: unknown) {
    set('otherIncome', data.otherIncome.map((o) => (o.id === id ? { ...o, [key]: val } : o)))
  }
  function removeOI(id: string) {
    set('otherIncome', data.otherIncome.filter((o) => o.id !== id))
  }

  // Live EGI waterfall
  const vacancyLoss = gpr * (data.vacancyRate / 100)
  const creditLoss = gpr * (data.creditLoss / 100)
  const totalOtherIncome = data.otherIncome.reduce((s, o) => s + o.annualAmount, 0)

  // All ancillary income
  const rubsAnnual = data.hasRUBS ? data.rubsMonthlyPerUnit * totalUnits * 12 : 0
  const petIncomeAnnual =
    (data.petFeeMonthly * (data.petFeePctUnits / 100) * totalUnits * 12)
  const parkingAnnual =
    data.parkingIncome * 12 + data.coveredParkingPremium * 12 + data.garageIncome
  const ancillaryAnnual =
    data.storageIncome + data.laundryIncome + data.guestSuiteIncome +
    data.vendingIncome + data.billboardCellTower + data.internetBulkBilling
  const feeIncomeAnnual =
    data.applicationFees + data.lateFees + data.nsfFees + data.moveInFees
  const specialAnnual =
    data.shortTermRentalIncome + data.utilityReimbursement
  const m2mAnnual =
    data.monthToMonthPremium * (data.monthToMonthPctUnits / 100) * totalUnits * 12

  const allOtherIncome =
    rubsAnnual + petIncomeAnnual + parkingAnnual + ancillaryAnnual +
    feeIncomeAnnual + specialAnnual + m2mAnnual + totalOtherIncome

  const egi = gpr - vacancyLoss - creditLoss - data.concessions + allOtherIncome

  return (
    <div className="space-y-2">

      {/* EGI Waterfall Preview */}
      {gpr > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 mb-4">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-3">Year 1 EGI Waterfall</p>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Gross Potential Rent (GPR)</span>
              <span className="font-mono font-semibold text-gray-900">{fmt$(gpr)}</span>
            </div>
            <div className="flex justify-between text-red-600">
              <span>(Less) Vacancy Loss ({data.vacancyRate}%)</span>
              <span className="font-mono">({fmt$(vacancyLoss)})</span>
            </div>
            <div className="flex justify-between text-red-600">
              <span>(Less) Credit Loss ({data.creditLoss}%)</span>
              <span className="font-mono">({fmt$(creditLoss)})</span>
            </div>
            {data.concessions > 0 && (
              <div className="flex justify-between text-red-600">
                <span>(Less) Concessions</span>
                <span className="font-mono">({fmt$(data.concessions)})</span>
              </div>
            )}
            {allOtherIncome > 0 && (
              <div className="flex justify-between text-green-700">
                <span>(Plus) Other / Ancillary Income</span>
                <span className="font-mono">{fmt$(allOtherIncome)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-blue-300 pt-2 mt-1">
              <span className="font-bold text-blue-900">Effective Gross Income (EGI)</span>
              <span className="font-mono font-bold text-blue-900 text-base">{fmt$(egi)}</span>
            </div>
          </div>
        </div>
      )}

      {/* 1. Current Occupancy */}
      <Section title="Current Occupancy">
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2 mb-4">
          Current snapshot — does not affect projections. Used for reference only.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <NumberInput label="Physical Occupancy" value={data.physicalOccupancy}
            onChange={(v) => set('physicalOccupancy', v)} suffix="%" decimals={1} step={0.5} min={0} max={100} />
          <NumberInput label="Economic Occupancy" value={data.economicOccupancy}
            onChange={(v) => set('economicOccupancy', v)} suffix="%" decimals={1} step={0.5} min={0} max={100} />
        </div>
      </Section>

      {/* 2. Vacancy & Loss */}
      <Section title="Vacancy & Loss Assumptions">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <NumberInput label="Vacancy Rate" value={data.vacancyRate}
            onChange={(v) => set('vacancyRate', v)} suffix="%" decimals={1} step={0.5} min={0} max={100}
            hint={gpr > 0 ? `= ${fmt$(gpr * data.vacancyRate / 100)} loss/yr` : undefined} />
          <NumberInput label="Credit Loss" value={data.creditLoss}
            onChange={(v) => set('creditLoss', v)} suffix="%" decimals={1} step={0.25} min={0} max={100}
            hint={gpr > 0 ? `= ${fmt$(gpr * data.creditLoss / 100)} loss/yr` : undefined} />
          <NumberInput label="Concessions (Annual)" value={data.concessions}
            onChange={(v) => set('concessions', v)} prefix="$" step={500}
            hint="Free rent, move-in specials, etc." />
        </div>
      </Section>

      {/* 3. RUBS */}
      <Section title="RUBS (Utility Billing Rebill)">
        <div className="flex items-center gap-2 mb-4">
          <input type="checkbox" id="hasRUBS" checked={data.hasRUBS}
            onChange={(e) => set('hasRUBS', e.target.checked)} className="w-4 h-4 rounded" />
          <label htmlFor="hasRUBS" className="input-label mb-0 cursor-pointer">Enable RUBS Program</label>
        </div>
        {data.hasRUBS && (
          <div className="grid grid-cols-2 gap-4">
            <NumberInput label="RUBS Monthly per Unit" value={data.rubsMonthlyPerUnit}
              onChange={(v) => set('rubsMonthlyPerUnit', v)} prefix="$" step={5}
              hint={totalUnits > 0 ? `Annual total: ${fmt$(data.rubsMonthlyPerUnit * totalUnits * 12)}` : undefined} />
          </div>
        )}
      </Section>

      {/* 4. Pet Income */}
      <Section title="Pet Income">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <NumberInput label="Pet Fee ($/mo/unit)" value={data.petFeeMonthly}
            onChange={(v) => set('petFeeMonthly', v)} prefix="$" step={5} />
          <NumberInput label="Pet Deposit ($)" value={data.petDeposit}
            onChange={(v) => set('petDeposit', v)} prefix="$" step={50} />
          <NumberInput label="Pet-Friendly Units (%)" value={data.petFeePctUnits}
            onChange={(v) => set('petFeePctUnits', v)} suffix="%" decimals={0} min={0} max={100}
            hint={totalUnits > 0 ? `Annual: ${fmt$(petIncomeAnnual)}` : undefined} />
        </div>
      </Section>

      {/* 5. Parking Income */}
      <Section title="Parking Income">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <NumberInput label="Parking Income ($/mo/space)" value={data.parkingIncome}
            onChange={(v) => set('parkingIncome', v)} prefix="$" step={5}
            hint={`Annual: ${fmt$(data.parkingIncome * 12)}`} />
          <NumberInput label="Covered Parking Premium ($/mo)" value={data.coveredParkingPremium}
            onChange={(v) => set('coveredParkingPremium', v)} prefix="$" step={5}
            hint={`Annual: ${fmt$(data.coveredParkingPremium * 12)}`} />
          <NumberInput label="Garage Income ($/yr)" value={data.garageIncome}
            onChange={(v) => set('garageIncome', v)} prefix="$" step={500} />
        </div>
      </Section>

      {/* 6. Ancillary Income */}
      <Section title="Ancillary Income">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <NumberInput label="Storage Income ($/yr)" value={data.storageIncome}
            onChange={(v) => set('storageIncome', v)} prefix="$" step={500} />
          <NumberInput label="Laundry Income ($/yr)" value={data.laundryIncome}
            onChange={(v) => set('laundryIncome', v)} prefix="$" step={250} />
          <NumberInput label="Guest Suite Income ($/yr)" value={data.guestSuiteIncome}
            onChange={(v) => set('guestSuiteIncome', v)} prefix="$" step={250} />
          <NumberInput label="Vending Income ($/yr)" value={data.vendingIncome}
            onChange={(v) => set('vendingIncome', v)} prefix="$" step={100} />
          <NumberInput label="Billboard / Cell Tower ($/yr)" value={data.billboardCellTower}
            onChange={(v) => set('billboardCellTower', v)} prefix="$" step={500} />
          <NumberInput label="Internet Bulk Billing ($/yr)" value={data.internetBulkBilling}
            onChange={(v) => set('internetBulkBilling', v)} prefix="$" step={500} />
        </div>
      </Section>

      {/* 7. Fee Income */}
      <Section title="Fee Income">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <NumberInput label="Application Fees ($/yr)" value={data.applicationFees}
            onChange={(v) => set('applicationFees', v)} prefix="$" step={100} />
          <NumberInput label="Late Fees ($/yr)" value={data.lateFees}
            onChange={(v) => set('lateFees', v)} prefix="$" step={100} />
          <NumberInput label="NSF Fees ($/yr)" value={data.nsfFees}
            onChange={(v) => set('nsfFees', v)} prefix="$" step={100} />
          <NumberInput label="Move-In Fees ($/yr)" value={data.moveInFees}
            onChange={(v) => set('moveInFees', v)} prefix="$" step={100} />
        </div>
      </Section>

      {/* 8. Special Income */}
      <Section title="Special Income">
        <div className="grid grid-cols-2 gap-4">
          <NumberInput label="Short-Term Rental Income ($/yr)" value={data.shortTermRentalIncome}
            onChange={(v) => set('shortTermRentalIncome', v)} prefix="$" step={500}
            hint="Airbnb / corporate furnished units" />
          <NumberInput label="Utility Reimbursement ($/yr)" value={data.utilityReimbursement}
            onChange={(v) => set('utilityReimbursement', v)} prefix="$" step={500} />
        </div>
      </Section>

      {/* 9. Month-to-Month Premium */}
      <Section title="Month-to-Month Premium">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <NumberInput label="M2M Premium ($/mo/unit)" value={data.monthToMonthPremium}
            onChange={(v) => set('monthToMonthPremium', v)} prefix="$" step={25} />
          <NumberInput label="M2M Units (%)" value={data.monthToMonthPctUnits}
            onChange={(v) => set('monthToMonthPctUnits', v)} suffix="%" decimals={0} min={0} max={100}
            hint={totalUnits > 0 ? `Annual: ${fmt$(m2mAnnual)}` : undefined} />
        </div>
      </Section>

      {/* 10. Custom Other Income */}
      <Section title="Custom Other Income">
        {data.otherIncome.length === 0 ? (
          <p className="text-sm text-gray-400 italic mb-4">
            No custom income lines added.
          </p>
        ) : (
          <div className="space-y-3 mb-4">
            {data.otherIncome.map((item) => (
              <div key={item.id}
                className="flex flex-wrap gap-3 items-end border border-gray-200 rounded-xl p-4 bg-white">
                <div className="flex-1 min-w-[160px]">
                  <label className="input-label">Description</label>
                  <input className="input-field" value={item.label}
                    onChange={(e) => updateOI(item.id, 'label', e.target.value)}
                    placeholder="e.g. Roof antenna lease" />
                </div>
                <NumberInput label="Annual Amount" value={item.annualAmount}
                  onChange={(v) => updateOI(item.id, 'annualAmount', v)} prefix="$" step={100}
                  className="w-36" />
                <NumberInput label="Growth / Yr" value={item.growthRate}
                  onChange={(v) => updateOI(item.id, 'growthRate', v)} suffix="%" decimals={1} step={0.5}
                  className="w-28" />
                <button onClick={() => removeOI(item.id)}
                  className="mb-0.5 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {totalOtherIncome > 0 && (
              <div className="flex justify-between px-4 py-2 bg-gray-50 rounded-lg text-sm font-semibold text-gray-700">
                <span>Total Custom Other Income (Year 1)</span>
                <span className="font-mono">{fmt$(totalOtherIncome)}</span>
              </div>
            )}
          </div>
        )}
        <button type="button" onClick={addOtherIncome}
          className="btn-secondary flex items-center gap-1 text-xs py-1.5 px-3">
          <Plus className="w-3.5 h-3.5" /> Add Income Line
        </button>
      </Section>

      {/* 11. Growth Assumptions */}
      <Section title="Growth Assumptions">
        <div className="grid grid-cols-2 gap-4">
          <NumberInput label="Rent Growth Rate (Yrs 2–10)" value={data.rentGrowthRate}
            onChange={(v) => set('rentGrowthRate', v)} suffix="%" decimals={2} step={0.25}
            hint="Applied to GPR each year after Year 1" />
          <NumberInput label="Other Income Growth Rate (Yrs 2–10)" value={data.otherIncomeGrowthRate}
            onChange={(v) => set('otherIncomeGrowthRate', v)} suffix="%" decimals={2} step={0.25}
            hint="Applied to all ancillary income" />
        </div>
      </Section>

    </div>
  )
}
