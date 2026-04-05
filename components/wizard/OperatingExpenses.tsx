'use client'

import { ChevronDown, ChevronUp } from 'lucide-react'
import { NumberInput } from '@/components/ui/NumberInput'
import { fmt$ } from '@/lib/utils'
import type { OperatingExpenses } from '@/types/proforma'

interface Props {
  data: OperatingExpenses
  egi: number
  onChange: (d: OperatingExpenses) => void
}

// Collapsible section using native <details>/<summary>
function ExpenseGroup({
  title,
  subtotal,
  egi,
  children,
}: {
  title: string
  subtotal: number
  egi: number
  children: React.ReactNode
}) {
  return (
    <details className="card mb-3" open>
      <summary className="card-header flex items-center justify-between cursor-pointer list-none">
        <span className="section-header">{title}</span>
        <div className="flex items-center gap-3">
          {subtotal > 0 && (
            <span className="text-xs font-mono text-gray-500">
              {fmt$(subtotal)}
              {egi > 0 && (
                <span className="text-gray-400 ml-1">({((subtotal / egi) * 100).toFixed(1)}%)</span>
              )}
            </span>
          )}
          <ChevronDown size={16} className="details-arrow" />
        </div>
      </summary>
      <div className="card-body">{children}</div>
    </details>
  )
}

export function OperatingExpensesSection({ data, egi, onChange }: Props) {
  function set<K extends keyof OperatingExpenses>(key: K, val: OperatingExpenses[K]) {
    onChange({ ...data, [key]: val })
  }

  // Subtotals
  const insuranceTotal =
    data.propertyInsurance + data.liabilityInsurance + data.floodInsurance +
    data.earthquakeInsurance + data.umbrellaPolicy + data.workersComp
  const utilitiesTotal =
    data.electricity + data.gas + data.water + data.sewer + data.trash + data.cableInternet
  const repairsTotal =
    data.repairsAndMaintenance + data.plumbingRepairs + data.electricalRepairs +
    data.hvacMaintenance + data.elevatorMaintenance + data.roofMaintenance + data.applianceRepairs
  const groundsTotal =
    data.landscaping + data.snowRemoval + data.poolMaintenance +
    data.exteriorCleaning + data.pestControl
  const mgmtFee = egi * (data.propertyManagement / 100)
  const payrollTaxesDollar = data.payroll * (data.payrollTaxes / 100)
  const mgmtAdminTotal =
    mgmtFee + data.payroll + payrollTaxesDollar + data.employeeBenefits +
    data.adminOffice + data.phonePostage + data.software + data.bankCharges + data.creditCardProcessing
  const marketingTotal =
    data.marketing + data.advertising + data.signsAndBrochures
  const professionalTotal =
    data.legalFees + data.accountingFees + data.taxPreparation + data.consultingFees
  const complianceTotal =
    data.licensesPermits + data.bidAssessments + data.safetyInspections + data.fireSprinklerInspection
  const securityTotal =
    data.securitySystems + data.securityPersonnel + data.janitorial + data.contractServices
  const otherTotal =
    data.groundLease + data.hoa + data.otherExpenses

  const totalOpEx =
    data.propertyTaxes + data.specialAssessments +
    insuranceTotal + utilitiesTotal + repairsTotal + groundsTotal +
    mgmtAdminTotal + marketingTotal + professionalTotal + complianceTotal +
    data.reservesForReplacement + securityTotal + otherTotal
  const expenseRatio = egi > 0 ? (totalOpEx / egi) * 100 : 0
  const noi = egi - totalOpEx

  // All non-zero expense rows for breakdown table
  const breakdownRows = [
    { label: 'Property Taxes', amount: data.propertyTaxes },
    { label: 'Special Assessments', amount: data.specialAssessments },
    { label: 'Property Insurance', amount: data.propertyInsurance },
    { label: 'Liability Insurance', amount: data.liabilityInsurance },
    { label: 'Flood Insurance', amount: data.floodInsurance },
    { label: 'Earthquake Insurance', amount: data.earthquakeInsurance },
    { label: 'Umbrella Policy', amount: data.umbrellaPolicy },
    { label: "Workers' Comp", amount: data.workersComp },
    { label: 'Electricity', amount: data.electricity },
    { label: 'Gas', amount: data.gas },
    { label: 'Water', amount: data.water },
    { label: 'Sewer', amount: data.sewer },
    { label: 'Trash', amount: data.trash },
    { label: 'Cable / Internet', amount: data.cableInternet },
    { label: 'Repairs & Maintenance', amount: data.repairsAndMaintenance },
    { label: 'Plumbing Repairs', amount: data.plumbingRepairs },
    { label: 'Electrical Repairs', amount: data.electricalRepairs },
    { label: 'HVAC Maintenance', amount: data.hvacMaintenance },
    { label: 'Elevator Maintenance', amount: data.elevatorMaintenance },
    { label: 'Roof Maintenance', amount: data.roofMaintenance },
    { label: 'Appliance Repairs', amount: data.applianceRepairs },
    { label: 'Landscaping', amount: data.landscaping },
    { label: 'Snow Removal', amount: data.snowRemoval },
    { label: 'Pool Maintenance', amount: data.poolMaintenance },
    { label: 'Exterior Cleaning', amount: data.exteriorCleaning },
    { label: 'Pest Control', amount: data.pestControl },
    { label: `Property Management (${data.propertyManagement}% EGI)`, amount: mgmtFee },
    { label: 'Payroll', amount: data.payroll },
    { label: `Payroll Taxes (${data.payrollTaxes}%)`, amount: payrollTaxesDollar },
    { label: 'Employee Benefits', amount: data.employeeBenefits },
    { label: 'Admin / Office', amount: data.adminOffice },
    { label: 'Phone / Postage', amount: data.phonePostage },
    { label: 'Software', amount: data.software },
    { label: 'Bank Charges', amount: data.bankCharges },
    { label: 'Credit Card Processing', amount: data.creditCardProcessing },
    { label: 'Marketing', amount: data.marketing },
    { label: 'Advertising', amount: data.advertising },
    { label: 'Signs & Brochures', amount: data.signsAndBrochures },
    { label: 'Legal Fees', amount: data.legalFees },
    { label: 'Accounting Fees', amount: data.accountingFees },
    { label: 'Tax Preparation', amount: data.taxPreparation },
    { label: 'Consulting Fees', amount: data.consultingFees },
    { label: 'Licenses & Permits', amount: data.licensesPermits },
    { label: 'BID Assessments', amount: data.bidAssessments },
    { label: 'Safety Inspections', amount: data.safetyInspections },
    { label: 'Fire Sprinkler Inspection', amount: data.fireSprinklerInspection },
    { label: 'Reserves for Replacement', amount: data.reservesForReplacement },
    { label: 'Security Systems', amount: data.securitySystems },
    { label: 'Security Personnel', amount: data.securityPersonnel },
    { label: 'Janitorial', amount: data.janitorial },
    { label: 'Contract Services', amount: data.contractServices },
    { label: 'Ground Lease', amount: data.groundLease },
    { label: 'HOA', amount: data.hoa },
    { label: 'Other Expenses', amount: data.otherExpenses },
  ].filter((r) => r.amount > 0)

  return (
    <div className="space-y-2">

      {/* NOI Preview Box */}
      {egi > 0 && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-5 mb-4">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-3">Year 1 NOI Preview</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-500 mb-1">EGI</p>
              <p className="text-lg font-bold font-mono text-gray-900">{fmt$(egi)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Total OpEx</p>
              <p className="text-lg font-bold font-mono text-red-700">{fmt$(totalOpEx)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">NOI</p>
              <p className="text-lg font-bold font-mono text-emerald-700">{fmt$(noi)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Expense Ratio</p>
              <p className="text-lg font-bold font-mono text-gray-700">{expenseRatio.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      )}

      {/* 1. Property Taxes */}
      <ExpenseGroup title="Property Taxes" subtotal={data.propertyTaxes + data.specialAssessments} egi={egi}>
        <div className="grid grid-cols-2 gap-4">
          <NumberInput label="Property Taxes (Annual)" value={data.propertyTaxes}
            onChange={(v) => set('propertyTaxes', v)} prefix="$" step={500} />
          <NumberInput label="Special Assessments" value={data.specialAssessments}
            onChange={(v) => set('specialAssessments', v)} prefix="$" step={100} />
        </div>
      </ExpenseGroup>

      {/* 2. Insurance */}
      <ExpenseGroup title="Insurance" subtotal={insuranceTotal} egi={egi}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <NumberInput label="Property Insurance" value={data.propertyInsurance}
            onChange={(v) => set('propertyInsurance', v)} prefix="$" step={250} />
          <NumberInput label="Liability Insurance" value={data.liabilityInsurance}
            onChange={(v) => set('liabilityInsurance', v)} prefix="$" step={100} />
          <NumberInput label="Flood Insurance" value={data.floodInsurance}
            onChange={(v) => set('floodInsurance', v)} prefix="$" step={100} />
          <NumberInput label="Earthquake Insurance" value={data.earthquakeInsurance}
            onChange={(v) => set('earthquakeInsurance', v)} prefix="$" step={100} />
          <NumberInput label="Umbrella Policy" value={data.umbrellaPolicy}
            onChange={(v) => set('umbrellaPolicy', v)} prefix="$" step={100} />
          <NumberInput label="Workers' Comp" value={data.workersComp}
            onChange={(v) => set('workersComp', v)} prefix="$" step={100} />
        </div>
        {insuranceTotal > 0 && (
          <p className="text-xs text-gray-500 mt-2">Insurance Subtotal: <strong>{fmt$(insuranceTotal)}</strong></p>
        )}
      </ExpenseGroup>

      {/* 3. Utilities */}
      <ExpenseGroup title="Utilities" subtotal={utilitiesTotal} egi={egi}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <NumberInput label="Electricity" value={data.electricity}
            onChange={(v) => set('electricity', v)} prefix="$" step={250} />
          <NumberInput label="Gas" value={data.gas}
            onChange={(v) => set('gas', v)} prefix="$" step={100} />
          <NumberInput label="Water" value={data.water}
            onChange={(v) => set('water', v)} prefix="$" step={250} />
          <NumberInput label="Sewer" value={data.sewer}
            onChange={(v) => set('sewer', v)} prefix="$" step={100} />
          <NumberInput label="Trash" value={data.trash}
            onChange={(v) => set('trash', v)} prefix="$" step={100} />
          <NumberInput label="Cable / Internet" value={data.cableInternet}
            onChange={(v) => set('cableInternet', v)} prefix="$" step={100} />
        </div>
        {utilitiesTotal > 0 && (
          <p className="text-xs text-gray-500 mt-2">Utilities Subtotal: <strong>{fmt$(utilitiesTotal)}</strong></p>
        )}
      </ExpenseGroup>

      {/* 4. Repairs & Maintenance */}
      <ExpenseGroup title="Repairs & Maintenance" subtotal={repairsTotal} egi={egi}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <NumberInput label="Repairs & Maintenance" value={data.repairsAndMaintenance}
            onChange={(v) => set('repairsAndMaintenance', v)} prefix="$" step={500} />
          <NumberInput label="Plumbing Repairs" value={data.plumbingRepairs}
            onChange={(v) => set('plumbingRepairs', v)} prefix="$" step={100} />
          <NumberInput label="Electrical Repairs" value={data.electricalRepairs}
            onChange={(v) => set('electricalRepairs', v)} prefix="$" step={100} />
          <NumberInput label="HVAC Maintenance" value={data.hvacMaintenance}
            onChange={(v) => set('hvacMaintenance', v)} prefix="$" step={100} />
          <NumberInput label="Elevator Maintenance" value={data.elevatorMaintenance}
            onChange={(v) => set('elevatorMaintenance', v)} prefix="$" step={100} />
          <NumberInput label="Roof Maintenance" value={data.roofMaintenance}
            onChange={(v) => set('roofMaintenance', v)} prefix="$" step={100} />
          <NumberInput label="Appliance Repairs" value={data.applianceRepairs}
            onChange={(v) => set('applianceRepairs', v)} prefix="$" step={100} />
        </div>
      </ExpenseGroup>

      {/* 5. Grounds & Exterior */}
      <ExpenseGroup title="Grounds & Exterior" subtotal={groundsTotal} egi={egi}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <NumberInput label="Landscaping" value={data.landscaping}
            onChange={(v) => set('landscaping', v)} prefix="$" step={100} />
          <NumberInput label="Snow Removal" value={data.snowRemoval}
            onChange={(v) => set('snowRemoval', v)} prefix="$" step={100} />
          <NumberInput label="Pool Maintenance" value={data.poolMaintenance}
            onChange={(v) => set('poolMaintenance', v)} prefix="$" step={100} />
          <NumberInput label="Exterior Cleaning" value={data.exteriorCleaning}
            onChange={(v) => set('exteriorCleaning', v)} prefix="$" step={100} />
          <NumberInput label="Pest Control" value={data.pestControl}
            onChange={(v) => set('pestControl', v)} prefix="$" step={50} />
        </div>
      </ExpenseGroup>

      {/* 6. Management & Admin */}
      <ExpenseGroup title="Management & Admin" subtotal={mgmtAdminTotal} egi={egi}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <NumberInput label="Property Management Fee" value={data.propertyManagement}
            onChange={(v) => set('propertyManagement', v)} suffix="% of EGI" decimals={1} step={0.5}
            hint={egi > 0 ? `= ${fmt$(mgmtFee)}/yr` : undefined} />
          <NumberInput label="Payroll" value={data.payroll}
            onChange={(v) => set('payroll', v)} prefix="$" step={1000} />
          <NumberInput label="Payroll Taxes" value={data.payrollTaxes}
            onChange={(v) => set('payrollTaxes', v)} suffix="% of payroll" decimals={1} step={0.5}
            hint={data.payroll > 0 ? `= ${fmt$(payrollTaxesDollar)}/yr` : undefined} />
          <NumberInput label="Employee Benefits" value={data.employeeBenefits}
            onChange={(v) => set('employeeBenefits', v)} prefix="$" step={500} />
          <NumberInput label="Admin / Office" value={data.adminOffice}
            onChange={(v) => set('adminOffice', v)} prefix="$" step={100} />
          <NumberInput label="Phone / Postage" value={data.phonePostage}
            onChange={(v) => set('phonePostage', v)} prefix="$" step={100} />
          <NumberInput label="Software" value={data.software}
            onChange={(v) => set('software', v)} prefix="$" step={100} />
          <NumberInput label="Bank Charges" value={data.bankCharges}
            onChange={(v) => set('bankCharges', v)} prefix="$" step={100} />
          <NumberInput label="Credit Card Processing" value={data.creditCardProcessing}
            onChange={(v) => set('creditCardProcessing', v)} prefix="$" step={100} />
        </div>
      </ExpenseGroup>

      {/* 7. Sales & Marketing */}
      <ExpenseGroup title="Sales & Marketing" subtotal={marketingTotal} egi={egi}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <NumberInput label="Marketing" value={data.marketing}
            onChange={(v) => set('marketing', v)} prefix="$" step={250} />
          <NumberInput label="Advertising" value={data.advertising}
            onChange={(v) => set('advertising', v)} prefix="$" step={100} />
          <NumberInput label="Signs & Brochures" value={data.signsAndBrochures}
            onChange={(v) => set('signsAndBrochures', v)} prefix="$" step={100} />
        </div>
      </ExpenseGroup>

      {/* 8. Professional Services */}
      <ExpenseGroup title="Professional Services" subtotal={professionalTotal} egi={egi}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <NumberInput label="Legal Fees" value={data.legalFees}
            onChange={(v) => set('legalFees', v)} prefix="$" step={250} />
          <NumberInput label="Accounting Fees" value={data.accountingFees}
            onChange={(v) => set('accountingFees', v)} prefix="$" step={250} />
          <NumberInput label="Tax Preparation" value={data.taxPreparation}
            onChange={(v) => set('taxPreparation', v)} prefix="$" step={100} />
          <NumberInput label="Consulting Fees" value={data.consultingFees}
            onChange={(v) => set('consultingFees', v)} prefix="$" step={250} />
        </div>
      </ExpenseGroup>

      {/* 9. Compliance & Regulatory */}
      <ExpenseGroup title="Compliance & Regulatory" subtotal={complianceTotal} egi={egi}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <NumberInput label="Licenses & Permits" value={data.licensesPermits}
            onChange={(v) => set('licensesPermits', v)} prefix="$" step={100} />
          <NumberInput label="BID Assessments" value={data.bidAssessments}
            onChange={(v) => set('bidAssessments', v)} prefix="$" step={100} />
          <NumberInput label="Safety Inspections" value={data.safetyInspections}
            onChange={(v) => set('safetyInspections', v)} prefix="$" step={100} />
          <NumberInput label="Fire Sprinkler Inspection" value={data.fireSprinklerInspection}
            onChange={(v) => set('fireSprinklerInspection', v)} prefix="$" step={100} />
        </div>
      </ExpenseGroup>

      {/* 10. Reserves */}
      <ExpenseGroup title="Reserves" subtotal={data.reservesForReplacement} egi={egi}>
        <div className="grid grid-cols-2 gap-4">
          <NumberInput label="Reserves for Replacement ($/yr)" value={data.reservesForReplacement}
            onChange={(v) => set('reservesForReplacement', v)} prefix="$" step={500}
            hint="Typical: $200–$400/unit/yr" />
        </div>
      </ExpenseGroup>

      {/* 11. Security & Services */}
      <ExpenseGroup title="Security & Services" subtotal={securityTotal} egi={egi}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <NumberInput label="Security Systems" value={data.securitySystems}
            onChange={(v) => set('securitySystems', v)} prefix="$" step={100} />
          <NumberInput label="Security Personnel" value={data.securityPersonnel}
            onChange={(v) => set('securityPersonnel', v)} prefix="$" step={500} />
          <NumberInput label="Janitorial" value={data.janitorial}
            onChange={(v) => set('janitorial', v)} prefix="$" step={250} />
          <NumberInput label="Contract Services" value={data.contractServices}
            onChange={(v) => set('contractServices', v)} prefix="$" step={250} />
        </div>
      </ExpenseGroup>

      {/* 12. Other */}
      <ExpenseGroup title="Other" subtotal={otherTotal} egi={egi}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <NumberInput label="Ground Lease" value={data.groundLease}
            onChange={(v) => set('groundLease', v)} prefix="$" step={500} />
          <NumberInput label="HOA Fees" value={data.hoa}
            onChange={(v) => set('hoa', v)} prefix="$" step={100} />
          <NumberInput label="Other Expenses" value={data.otherExpenses}
            onChange={(v) => set('otherExpenses', v)} prefix="$" step={250} />
        </div>
      </ExpenseGroup>

      {/* 13. Growth Rate */}
      <div className="card mb-4">
        <div className="card-header">
          <span className="section-header">Expense Growth Rate</span>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 gap-4">
            <NumberInput label="Expense Growth Rate (Yrs 2–10)" value={data.expenseGrowthRate}
              onChange={(v) => set('expenseGrowthRate', v)} suffix="%" decimals={2} step={0.25}
              hint="Applied to all fixed expenses annually" />
          </div>
        </div>
      </div>

      {/* Full Expense Breakdown Table */}
      {breakdownRows.length > 0 && (
        <div className="card mb-4">
          <div className="card-header">
            <span className="section-header">Year 1 Expense Breakdown</span>
          </div>
          <div className="card-body">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="input-label pb-2 text-left font-semibold">Expense Category</th>
                    <th className="input-label pb-2 text-right font-semibold">Year 1 Amount</th>
                    <th className="input-label pb-2 text-right font-semibold">% of EGI</th>
                  </tr>
                </thead>
                <tbody>
                  {breakdownRows.map((row) => (
                    <tr key={row.label} className="border-b last:border-0">
                      <td className="py-1.5 text-gray-700">{row.label}</td>
                      <td className="py-1.5 text-right font-mono">{fmt$(row.amount)}</td>
                      <td className="py-1.5 text-right text-gray-500">
                        {egi > 0 ? ((row.amount / egi) * 100).toFixed(1) + '%' : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 font-bold bg-gray-50">
                    <td className="py-2 text-gray-900">Total Operating Expenses</td>
                    <td className="py-2 text-right font-mono text-red-700">{fmt$(totalOpEx)}</td>
                    <td className="py-2 text-right text-gray-700">
                      {egi > 0 ? expenseRatio.toFixed(1) + '%' : '—'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
