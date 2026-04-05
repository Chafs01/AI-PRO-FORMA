'use client'
import type { ProFormaOutput, ProFormaInput } from '@/types/proforma'
import { fmt$, fmtPct, fmtNum } from '@/lib/utils'

interface Props { input: ProFormaInput; output: ProFormaOutput }

export function FullIncomeStatement({ input, output }: Props) {
  const cfs = output.annualCashFlows
  const holdYears = cfs.length

  return (
    <div className="space-y-6">
      {/* Full 10-Year Income & Expense Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">
            {holdYears}-Year Income & Expense Statement
          </h3>
        </div>
        <div className="card-body overflow-x-auto">
          <table className="pro-table">
            <thead>
              <tr>
                <th>Category</th>
                {cfs.map((cf) => <th key={cf.year}>Year {cf.year}</th>)}
              </tr>
            </thead>
            <tbody>
              {/* Income */}
              <GroupHeader cols={holdYears} label="INCOME" />
              <DataRow label="Gross Potential Rent" values={cfs.map((c) => c.gpr)} />
              <DataRow label="(Less) Vacancy Loss" values={cfs.map((c) => -c.vacancyLoss)} negative />
              <DataRow label="(Less) Credit Loss" values={cfs.map((c) => -c.creditLoss)} negative />
              <DataRow label="(Less) Concessions" values={cfs.map((c) => -c.concessions)} negative />
              <DataRow label="(Plus) Other Income" values={cfs.map((c) => c.otherIncome)} />
              <TotalRow label="Effective Gross Income" values={cfs.map((c) => c.egi)} />

              {/* Expenses */}
              <GroupHeader cols={holdYears} label="OPERATING EXPENSES" />
              {buildExpenseRows(input, output).map((row) => (
                <DataRow key={row.label} label={row.label} values={row.values} negative />
              ))}
              <TotalRow label="Total Operating Expenses" values={cfs.map((c) => c.totalOpEx)} negative />

              {/* NOI */}
              <GroupHeader cols={holdYears} label="NET OPERATING INCOME" />
              <TotalRow label="Net Operating Income" values={cfs.map((c) => c.noi)} highlight />
              <DataRow label="Cap Rate" values={cfs.map((c) => c.capRate * 100)} isPct />

              {/* Debt Service */}
              <GroupHeader cols={holdYears} label="DEBT SERVICE" />
              <DataRow label="(Less) Total Debt Service" values={cfs.map((c) => -c.debtService)} negative />
              <DataRow label="DSCR" values={cfs.map((c) => c.dscr >= 900 ? 0 : c.dscr)} isDSCR />

              {/* Cash Flow */}
              <GroupHeader cols={holdYears} label="CASH FLOW" />
              <TotalRow label="Before-Tax Cash Flow" values={cfs.map((c) => c.btcf)} highlight />
              <DataRow label="Cash-on-Cash Return" values={cfs.map((c) => c.cocReturn * 100)} isPct />
              <DataRow label="(Less) CapEx" values={cfs.map((c) => -c.capEx)} negative />
              <DataRow label="(Less) Depreciation" values={cfs.map((c) => c.depreciation)} />
              <DataRow label="Taxable Income" values={cfs.map((c) => c.taxableIncome)} />
              <DataRow label="(Less) Income Taxes" values={cfs.map((c) => -c.taxes)} negative />
              <TotalRow label="After-Tax Cash Flow (ATCF)" values={cfs.map((c) => c.atcf)} highlight />
              <DataRow label="Sale Proceeds (Exit Year)" values={cfs.map((c) => c.saleProceeds)} />
              <TotalRow
                label="Total Return (ATCF + Sale)"
                values={cfs.map((c) => c.atcf + c.saleProceeds)}
                highlight
              />
            </tbody>
          </table>
        </div>
      </div>

      {/* Per-Unit and Per-SqFt */}
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">Per-Unit Metrics</h3>
          </div>
          <div className="card-body overflow-x-auto">
            <table className="pro-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  {cfs.map((cf) => <th key={cf.year}>Yr {cf.year}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>GPR / Unit</td>
                  {cfs.map((cf) => <td key={cf.year}>{fmt$(cf.gpr / Math.max(1, input.property.totalUnits))}</td>)}
                </tr>
                <tr>
                  <td>NOI / Unit</td>
                  {cfs.map((cf) => <td key={cf.year}>{fmt$(cf.noi / Math.max(1, input.property.totalUnits))}</td>)}
                </tr>
                <tr>
                  <td>BTCF / Unit</td>
                  {cfs.map((cf) => <td key={cf.year}>{fmt$(cf.btcf / Math.max(1, input.property.totalUnits))}</td>)}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">Per-Square-Foot Metrics</h3>
          </div>
          <div className="card-body overflow-x-auto">
            <table className="pro-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  {cfs.map((cf) => <th key={cf.year}>Yr {cf.year}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>EGI / SF</td>
                  {cfs.map((cf) => <td key={cf.year}>${(cf.egi / Math.max(1, input.property.totalSqft)).toFixed(2)}</td>)}
                </tr>
                <tr>
                  <td>OpEx / SF</td>
                  {cfs.map((cf) => <td key={cf.year}>${(cf.totalOpEx / Math.max(1, input.property.totalSqft)).toFixed(2)}</td>)}
                </tr>
                <tr>
                  <td>NOI / SF</td>
                  {cfs.map((cf) => <td key={cf.year}>${(cf.noi / Math.max(1, input.property.totalSqft)).toFixed(2)}</td>)}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function GroupHeader({ cols, label }: { cols: number; label: string }) {
  return (
    <tr>
      <td
        colSpan={cols + 1}
        className="text-xs font-bold uppercase tracking-widest py-2 px-3 bg-gray-800 text-white"
      >
        {label}
      </td>
    </tr>
  )
}

function DataRow({
  label, values, negative, isPct, isDSCR,
}: {
  label: string
  values: number[]
  negative?: boolean
  isPct?: boolean
  isDSCR?: boolean
}) {
  return (
    <tr>
      <td className="pl-5">{label}</td>
      {values.map((v, i) => (
        <td
          key={i}
          className={negative && v !== 0 ? 'text-red-600' : ''}
        >
          {isDSCR
            ? (v === 0 ? '—' : v.toFixed(2) + 'x')
            : isPct
            ? v.toFixed(2) + '%'
            : fmt$(v)}
        </td>
      ))}
    </tr>
  )
}

function TotalRow({ label, values, highlight, negative }: { label: string; values: number[]; highlight?: boolean; negative?: boolean }) {
  return (
    <tr className={highlight ? 'highlight-row' : 'total-row'}>
      <td className="font-bold">{label}</td>
      {values.map((v, i) => (
        <td key={i} className={negative && v !== 0 ? 'text-red-700' : ''}>{fmt$(v)}</td>
      ))}
    </tr>
  )
}

function buildExpenseRows(input: ProFormaInput, output: ProFormaOutput) {
  const cfs = output.annualCashFlows
  const e = input.expenses
  const g = e.expenseGrowthRate / 100

  const totalInsurance = (e.propertyInsurance || 0) + (e.liabilityInsurance || 0) +
    (e.floodInsurance || 0) + (e.earthquakeInsurance || 0) + (e.umbrellaPolicy || 0) + (e.workersComp || 0)
  const totalUtilities = (e.electricity || 0) + (e.gas || 0) + (e.water || 0) +
    (e.sewer || 0) + (e.trash || 0) + (e.cableInternet || 0)
  const totalMaintenance = (e.repairsAndMaintenance || 0) + (e.plumbingRepairs || 0) +
    (e.electricalRepairs || 0) + (e.hvacMaintenance || 0) + (e.elevatorMaintenance || 0) +
    (e.roofMaintenance || 0) + (e.applianceRepairs || 0)
  const totalPayroll = (e.payroll || 0) + (e.payrollTaxes || 0) + (e.employeeBenefits || 0) +
    (e.adminOffice || 0) + (e.phonePostage || 0) + (e.software || 0) + (e.bankCharges || 0)
  const totalMarketing = (e.marketing || 0) + (e.advertising || 0) + (e.signsAndBrochures || 0)
  const totalProfessional = (e.legalFees || 0) + (e.accountingFees || 0) +
    (e.taxPreparation || 0) + (e.consultingFees || 0)
  const totalGrounds = (e.landscaping || 0) + (e.snowRemoval || 0) + (e.poolMaintenance || 0) +
    (e.exteriorCleaning || 0) + (e.pestControl || 0)
  const totalTaxesFees = (e.specialAssessments || 0) + (e.licensesPermits || 0) +
    (e.bidAssessments || 0) + (e.safetyInspections || 0) + (e.fireSprinklerInspection || 0)

  const rows = [
    { label: 'Property Taxes', base: e.propertyTaxes },
    { label: 'Insurance (All Lines)', base: totalInsurance },
    { label: 'Utilities', base: totalUtilities },
    { label: 'Repairs & Maintenance', base: totalMaintenance },
    { label: 'Grounds / Landscaping', base: totalGrounds },
    { label: 'Payroll & Admin', base: totalPayroll },
    { label: 'Marketing & Advertising', base: totalMarketing },
    { label: 'Professional Fees', base: totalProfessional },
    { label: 'Taxes & Permits', base: totalTaxesFees },
    { label: 'Security Systems', base: e.securitySystems || 0 },
    { label: 'Security Personnel', base: e.securityPersonnel || 0 },
    { label: 'Janitorial / Contract Svcs', base: (e.janitorial || 0) + (e.contractServices || 0) },
    { label: 'Reserves for Replacement', base: e.reservesForReplacement },
    { label: 'Ground Lease / HOA', base: (e.groundLease || 0) + (e.hoa || 0) },
    { label: 'Other Expenses', base: e.otherExpenses },
  ]
    .filter((r) => r.base > 0)
    .map((row) => ({
      label: row.label,
      values: cfs.map((_, yr) => row.base * Math.pow(1 + g, yr)),
    }))

  // Add property management fee (% of EGI)
  const mgmt = {
    label: `Property Mgmt (${e.propertyManagement}% of EGI)`,
    values: cfs.map((cf) => cf.egi * (e.propertyManagement / 100)),
  }

  return [...rows, mgmt]
}
