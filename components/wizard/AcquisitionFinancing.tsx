'use client'

import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { NumberInput } from '@/components/ui/NumberInput'
import { fmt$ } from '@/lib/utils'
import type { AcquisitionInputs, FinancingInputs, LoanTranche, RecourseType } from '@/types/proforma'

interface Props {
  acquisition: AcquisitionInputs
  financing: FinancingInputs
  onAcquisitionChange: (a: AcquisitionInputs) => void
  onFinancingChange: (f: FinancingInputs) => void
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

function calcAnnualDS(loan: LoanTranche): number {
  if (loan.ioPeriodYears >= 1) return loan.loanAmount * (loan.interestRate / 100)
  const r = loan.interestRate / 100 / 12
  const n = loan.amortizationYears * 12
  if (r === 0 || n === 0) return loan.amortizationYears > 0 ? loan.loanAmount / loan.amortizationYears : 0
  const pmt = (loan.loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
  return pmt * 12
}

const RECOURSE_TYPES: { value: RecourseType; label: string }[] = [
  { value: 'non-recourse', label: 'Non-Recourse' },
  { value: 'full-recourse', label: 'Full Recourse' },
  { value: 'partial-recourse', label: 'Partial Recourse' },
]
const PREPAYMENT_TYPES = [
  { value: 'none', label: 'None' },
  { value: 'stepdown', label: 'Step-Down' },
  { value: 'defeasance', label: 'Defeasance' },
  { value: 'yield-maintenance', label: 'Yield Maintenance' },
] as const

export function AcquisitionFinancingSection({
  acquisition,
  financing,
  onAcquisitionChange,
  onFinancingChange,
}: Props) {
  function setA<K extends keyof AcquisitionInputs>(key: K, val: AcquisitionInputs[K]) {
    onAcquisitionChange({ ...acquisition, [key]: val })
  }
  function setF<K extends keyof FinancingInputs>(key: K, val: FinancingInputs[K]) {
    onFinancingChange({ ...financing, [key]: val })
  }

  function addLoan() {
    if (financing.loans.length >= 4) return
    const loan: LoanTranche = {
      id: String(Date.now()),
      label: `Loan ${financing.loans.length + 1}`,
      loanAmount: 0,
      interestRate: 6.5,
      amortizationYears: 30,
      ioPeriodYears: 0,
      loanTermYears: 10,
      isFloating: false,
      spread: 250,
      floorRate: 3.0,
      originationFee: 1.0,
      exitFee: 0,
      extensionOptions: 0,
      extensionMonths: 12,
      rateCap: 0,
      recourseType: 'non-recourse',
      isPersonalGuarantee: false,
      prepaymentType: 'none',
      prepaymentPenalty: 0,
    }
    setF('loans', [...financing.loans, loan])
  }

  function updateLoan(id: string, key: keyof LoanTranche, val: unknown) {
    setF('loans', financing.loans.map((l) => (l.id === id ? { ...l, [key]: val } : l)))
  }

  function removeLoan(id: string) {
    setF('loans', financing.loans.filter((l) => l.id !== id))
  }

  const pp = acquisition.purchasePrice
  const totalTransactionCosts =
    pp * (acquisition.closingCosts / 100) +
    pp * (acquisition.brokerFeePercent / 100) +
    acquisition.legalFees +
    acquisition.titleInsurance +
    acquisition.transferTax +
    acquisition.environmentalStudy +
    acquisition.surveyAndEngineering +
    acquisition.propertyInspection +
    acquisition.appraisalFee +
    acquisition.otherAcquisitionCosts
  const totalSponsorCosts =
    pp * (acquisition.acquisitionFee / 100) +
    acquisition.organizationCosts +
    acquisition.workingCapitalReserve +
    acquisition.lenderFeeAtClose +
    acquisition.immediateCapEx
  const totalProjectCost = pp + totalTransactionCosts + totalSponsorCosts
  const totalDebt = financing.loans.reduce((s, l) => s + l.loanAmount, 0)
  const equityRequired = totalProjectCost - totalDebt
  const ltv = pp > 0 ? (totalDebt / pp) * 100 : 0

  return (
    <div className="space-y-2">

      {/* 1. Purchase Price */}
      <Section title="Purchase Price">
        <NumberInput
          label="Purchase Price"
          value={acquisition.purchasePrice}
          onChange={(v) => setA('purchasePrice', v)}
          prefix="$"
          step={10000}
          className="max-w-xs"
        />
      </Section>

      {/* 2. Transaction Costs */}
      <Section title="Transaction Costs">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <NumberInput label="Closing Costs" value={acquisition.closingCosts}
            onChange={(v) => setA('closingCosts', v)} suffix="%" decimals={2} step={0.1}
            hint={pp > 0 ? `= ${fmt$(pp * acquisition.closingCosts / 100)}` : undefined} />
          <NumberInput label="Broker Fee" value={acquisition.brokerFeePercent}
            onChange={(v) => setA('brokerFeePercent', v)} suffix="%" decimals={2} step={0.1}
            hint={pp > 0 ? `= ${fmt$(pp * acquisition.brokerFeePercent / 100)}` : undefined} />
          <NumberInput label="Legal Fees" value={acquisition.legalFees}
            onChange={(v) => setA('legalFees', v)} prefix="$" step={500} />
          <NumberInput label="Title Insurance" value={acquisition.titleInsurance}
            onChange={(v) => setA('titleInsurance', v)} prefix="$" step={500} />
          <NumberInput label="Transfer Tax" value={acquisition.transferTax}
            onChange={(v) => setA('transferTax', v)} prefix="$" step={100} />
          <NumberInput label="Environmental Study" value={acquisition.environmentalStudy}
            onChange={(v) => setA('environmentalStudy', v)} prefix="$" step={250} />
          <NumberInput label="Survey & Engineering" value={acquisition.surveyAndEngineering}
            onChange={(v) => setA('surveyAndEngineering', v)} prefix="$" step={250} />
          <NumberInput label="Property Inspection" value={acquisition.propertyInspection}
            onChange={(v) => setA('propertyInspection', v)} prefix="$" step={100} />
          <NumberInput label="Appraisal Fee" value={acquisition.appraisalFee}
            onChange={(v) => setA('appraisalFee', v)} prefix="$" step={100} />
          <NumberInput label="Earnest Money Deposit" value={acquisition.earnestMoneyDeposit}
            onChange={(v) => setA('earnestMoneyDeposit', v)} prefix="$" step={1000} />
          <NumberInput label="Other Acquisition Costs" value={acquisition.otherAcquisitionCosts}
            onChange={(v) => setA('otherAcquisitionCosts', v)} prefix="$" step={250} />
        </div>
      </Section>

      {/* 3. Sponsor / Equity Costs */}
      <Section title="Sponsor / Equity Costs">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <NumberInput label="Acquisition Fee" value={acquisition.acquisitionFee}
            onChange={(v) => setA('acquisitionFee', v)} suffix="% of purchase" decimals={2} step={0.1}
            hint={pp > 0 ? `= ${fmt$(pp * acquisition.acquisitionFee / 100)}` : undefined} />
          <NumberInput label="Organization Costs" value={acquisition.organizationCosts}
            onChange={(v) => setA('organizationCosts', v)} prefix="$" step={500} />
          <NumberInput label="Working Capital Reserve" value={acquisition.workingCapitalReserve}
            onChange={(v) => setA('workingCapitalReserve', v)} prefix="$" step={1000} />
          <NumberInput label="Lender Fee at Close" value={acquisition.lenderFeeAtClose}
            onChange={(v) => setA('lenderFeeAtClose', v)} prefix="$" step={500} />
          <NumberInput label="Immediate CapEx / Renovation" value={acquisition.immediateCapEx}
            onChange={(v) => setA('immediateCapEx', v)} prefix="$" step={5000} />
        </div>
      </Section>

      {/* 4. Acquisition Summary */}
      <div className="card mb-4">
        <div className="card-header">
          <span className="section-header">Acquisition Summary</span>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Project Cost</p>
              <p className="text-xl font-bold font-mono" style={{ color: '#1e3a5f' }}>{fmt$(totalProjectCost)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Debt</p>
              <p className="text-xl font-bold font-mono text-gray-800">{fmt$(totalDebt)}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Equity Required</p>
              <p className="text-xl font-bold font-mono text-green-700">{fmt$(equityRequired)}</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">LTV</p>
              <p className="text-xl font-bold font-mono text-blue-700">{ltv.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Financing Toggle */}
      <div className="card mb-4">
        <div className="card-header flex items-center justify-between">
          <span className="section-header">Financing Structure</span>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={financing.useFinancing}
              onChange={(e) => setF('useFinancing', e.target.checked)}
              className="w-4 h-4 rounded" />
            <span className="text-sm font-medium text-gray-700">Use Financing</span>
          </label>
        </div>

        {financing.useFinancing && (
          <div className="card-body space-y-4">

            {/* 6. Loan Tranches */}
            {financing.loans.map((loan, idx) => (
              <div key={loan.id} className="border border-gray-200 rounded-xl p-5 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-white px-2.5 py-1 rounded-full"
                      style={{ background: '#1e3a5f' }}>
                      {idx === 0 ? 'Senior' : idx === 1 ? 'Mezz' : `Tranche ${idx + 1}`}
                    </span>
                    <input className="input-field py-1 text-sm w-40" value={loan.label}
                      onChange={(e) => updateLoan(loan.id, 'label', e.target.value)} />
                  </div>
                  {financing.loans.length > 1 && (
                    <button onClick={() => removeLoan(loan.id)}
                      className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Core loan terms */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                  <NumberInput label="Loan Amount" value={loan.loanAmount}
                    onChange={(v) => updateLoan(loan.id, 'loanAmount', v)} prefix="$" step={10000}
                    hint={pp > 0 ? `${((loan.loanAmount / pp) * 100).toFixed(1)}% LTV` : undefined} />
                  <NumberInput label="Interest Rate" value={loan.interestRate}
                    onChange={(v) => updateLoan(loan.id, 'interestRate', v)}
                    suffix="%" decimals={3} step={0.125} />
                  <NumberInput label="Amortization (Yrs)" value={loan.amortizationYears}
                    onChange={(v) => updateLoan(loan.id, 'amortizationYears', v)} min={1} max={40} />
                  <NumberInput label="IO Period (Yrs)" value={loan.ioPeriodYears}
                    onChange={(v) => updateLoan(loan.id, 'ioPeriodYears', v)}
                    min={0} max={loan.loanTermYears} hint="0 = fully amortizing" />
                  <NumberInput label="Loan Term (Yrs)" value={loan.loanTermYears}
                    onChange={(v) => updateLoan(loan.id, 'loanTermYears', v)} min={1} max={30} />
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={loan.isFloating}
                        onChange={(e) => updateLoan(loan.id, 'isFloating', e.target.checked)}
                        className="w-4 h-4 rounded" />
                      <span className="text-sm text-gray-700">Floating Rate</span>
                    </label>
                  </div>
                </div>

                {/* Floating rate fields */}
                {loan.isFloating && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <NumberInput label="Spread (bps)" value={loan.spread}
                      onChange={(v) => updateLoan(loan.id, 'spread', v)} step={25}
                      hint="Spread over SOFR" />
                    <NumberInput label="Floor Rate" value={loan.floorRate}
                      onChange={(v) => updateLoan(loan.id, 'floorRate', v)}
                      suffix="%" decimals={2} step={0.25} />
                    <NumberInput label="Rate Cap Cost" value={loan.rateCap}
                      onChange={(v) => updateLoan(loan.id, 'rateCap', v)} prefix="$" step={1000}
                      hint="One-time cap purchase cost" />
                  </div>
                )}

                {/* Fees & terms */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                  <NumberInput label="Origination Fee" value={loan.originationFee}
                    onChange={(v) => updateLoan(loan.id, 'originationFee', v)}
                    suffix="%" decimals={2} step={0.125}
                    hint={loan.loanAmount > 0 ? `= ${fmt$(loan.loanAmount * loan.originationFee / 100)}` : undefined} />
                  <NumberInput label="Exit Fee" value={loan.exitFee}
                    onChange={(v) => updateLoan(loan.id, 'exitFee', v)}
                    suffix="%" decimals={2} step={0.125} />
                  <NumberInput label="Extension Options (#)" value={loan.extensionOptions}
                    onChange={(v) => updateLoan(loan.id, 'extensionOptions', v)} min={0} max={5} />
                  <NumberInput label="Extension Length (mo)" value={loan.extensionMonths}
                    onChange={(v) => updateLoan(loan.id, 'extensionMonths', v)} min={0} />
                  <div>
                    <label className="input-label">Recourse Type</label>
                    <select className="input-field" value={loan.recourseType}
                      onChange={(e) => updateLoan(loan.id, 'recourseType', e.target.value as RecourseType)}>
                      {RECOURSE_TYPES.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={loan.isPersonalGuarantee}
                        onChange={(e) => updateLoan(loan.id, 'isPersonalGuarantee', e.target.checked)}
                        className="w-4 h-4 rounded" />
                      <span className="text-sm text-gray-700">Personal Guarantee</span>
                    </label>
                  </div>
                </div>

                {/* Prepayment */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="input-label">Prepayment Type</label>
                    <select className="input-field" value={loan.prepaymentType}
                      onChange={(e) => updateLoan(loan.id, 'prepaymentType', e.target.value as LoanTranche['prepaymentType'])}>
                      {PREPAYMENT_TYPES.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                  {loan.prepaymentType !== 'none' && (
                    <NumberInput label="Prepayment Penalty" value={loan.prepaymentPenalty}
                      onChange={(v) => updateLoan(loan.id, 'prepaymentPenalty', v)}
                      suffix="%" decimals={2} step={0.5} />
                  )}
                </div>

                {/* Quick calc row */}
                {loan.loanAmount > 0 && loan.interestRate > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-6 text-xs text-gray-500">
                    <span>
                      Monthly IO:{' '}
                      <strong className="text-gray-700">
                        {fmt$((loan.loanAmount * loan.interestRate / 100) / 12)}
                      </strong>
                    </span>
                    <span>
                      Annual Debt Service:{' '}
                      <strong className="text-gray-700">{fmt$(calcAnnualDS(loan))}</strong>
                    </span>
                    <span>
                      LTV:{' '}
                      <strong className="text-gray-700">
                        {pp > 0 ? ((loan.loanAmount / pp) * 100).toFixed(1) + '%' : '—'}
                      </strong>
                    </span>
                  </div>
                )}
              </div>
            ))}

            {/* 7. Add Loan button */}
            {financing.loans.length < 4 && (
              <button onClick={addLoan} className="btn-secondary flex items-center gap-1 text-xs py-1.5 px-3">
                <Plus className="w-3.5 h-3.5" />
                Add {financing.loans.length === 0 ? 'Loan' : 'Mezzanine / Second Loan'}
              </button>
            )}

            {/* 8. Combined stack summary */}
            {financing.loans.length > 1 && totalDebt > 0 && (
              <div className="mt-2 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-3">Combined Debt Stack</p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-blue-200">
                      <th className="input-label pb-2">Tranche</th>
                      <th className="input-label pb-2">Amount</th>
                      <th className="input-label pb-2">Rate</th>
                      <th className="input-label pb-2">Ann. DS</th>
                      <th className="input-label pb-2">LTV</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financing.loans.map((loan) => (
                      <tr key={loan.id} className="border-b border-blue-100 last:border-0">
                        <td className="py-1.5 text-xs text-gray-700">{loan.label}</td>
                        <td className="py-1.5 text-xs font-mono">{fmt$(loan.loanAmount)}</td>
                        <td className="py-1.5 text-xs">{loan.interestRate}%</td>
                        <td className="py-1.5 text-xs font-mono">{fmt$(calcAnnualDS(loan))}</td>
                        <td className="py-1.5 text-xs">
                          {pp > 0 ? ((loan.loanAmount / pp) * 100).toFixed(1) + '%' : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-blue-200 font-bold">
                      <td className="py-1.5 text-xs text-blue-800">TOTAL</td>
                      <td className="py-1.5 text-xs font-mono text-blue-800">{fmt$(totalDebt)}</td>
                      <td className="py-1.5 text-xs text-blue-800">—</td>
                      <td className="py-1.5 text-xs font-mono text-blue-800">
                        {fmt$(financing.loans.reduce((s, l) => s + calcAnnualDS(l), 0))}
                      </td>
                      <td className="py-1.5 text-xs text-blue-800">{ltv.toFixed(1)}%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  )
}
