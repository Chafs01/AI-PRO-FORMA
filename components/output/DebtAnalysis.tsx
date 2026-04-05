'use client'
import type { ProFormaOutput, ProFormaInput } from '@/types/proforma'
import { fmt$, fmtPct, fmtNum } from '@/lib/utils'

interface Props { input: ProFormaInput; output: ProFormaOutput }

export function DebtAnalysis({ input, output }: Props) {
  if (!input.financing.useFinancing || output.loanSummaries.length === 0) {
    return (
      <div className="card p-10 text-center text-gray-400">
        <p className="font-medium">No financing selected.</p>
        <p className="text-sm mt-1">Enable financing in the Acquisition & Financing tab to see debt analysis.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Loan Summaries */}
      {output.loanSummaries.map((ls, i) => {
        const loan = input.financing.loans[i]
        if (!loan) return null
        const dscr = ls.dscr
        const dscrOk = dscr >= 1.25

        return (
          <div key={loan.id} className="card">
            <div className="card-header">
              <div>
                <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">
                  {loan.label} — Loan {i + 1}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {loan.isFloating ? 'Floating Rate' : 'Fixed Rate'} ·{' '}
                  {loan.amortizationYears}-yr amortization ·{' '}
                  {loan.ioPeriodYears > 0 ? `${loan.ioPeriodYears}-yr IO period` : 'Fully amortizing'}
                </p>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-xs font-bold ${dscrOk ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
              >
                DSCR {fmtNum(dscr)}x {dscrOk ? '✓' : '⚠'}
              </div>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                <MetricBlock label="Loan Amount" value={fmt$(ls.loanAmount)} />
                <MetricBlock label="Interest Rate" value={fmtPct(loan.interestRate)} />
                <MetricBlock label="LTV" value={fmtPct(ls.ltv * 100)} />
                <MetricBlock label="Loan Constant" value={fmtPct(ls.loanConstant * 100)} />
                <MetricBlock label="Annual Debt Service" value={fmt$(ls.annualDebtService)} />
                <MetricBlock label="Monthly Payment (Amort)" value={fmt$(ls.monthlyPayment)} />
                <MetricBlock label="Monthly IO Payment" value={fmt$(ls.ioPayment)} />
                <MetricBlock label={`Balloon Balance (Yr ${loan.loanTermYears})`} value={fmt$(ls.balloonBalance)} />
              </div>

              {/* Amortization schedule (Year 1–Hold) */}
              <div className="overflow-x-auto">
                <table className="pro-table">
                  <thead>
                    <tr>
                      <th>Year</th>
                      <th>Beginning Balance</th>
                      <th>Interest Paid</th>
                      <th>Principal Paid</th>
                      <th>Ending Balance</th>
                      <th>Annual Debt Service</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buildAmortSchedule(loan, input.exit.holdingPeriodYears).map((row) => (
                      <tr key={row.year}>
                        <td>{row.year}</td>
                        <td>{fmt$(row.begBalance)}</td>
                        <td>{fmt$(row.interest)}</td>
                        <td>{fmt$(row.principal)}</td>
                        <td>{fmt$(row.endBalance)}</td>
                        <td>{fmt$(row.totalPayment)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      })}

      {/* DSCR Timeline */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">DSCR by Year</h3>
          <span className="text-xs text-gray-400">Min lender threshold typically 1.20x–1.25x</span>
        </div>
        <div className="card-body overflow-x-auto">
          <table className="pro-table">
            <thead>
              <tr>
                <th>Year</th>
                {output.annualCashFlows.map((cf) => <th key={cf.year}>Year {cf.year}</th>)}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>NOI</td>
                {output.annualCashFlows.map((cf) => <td key={cf.year}>{fmt$(cf.noi)}</td>)}
              </tr>
              <tr>
                <td>Total Debt Service</td>
                {output.annualCashFlows.map((cf) => <td key={cf.year}>{fmt$(cf.debtService)}</td>)}
              </tr>
              <tr className="highlight-row">
                <td>DSCR</td>
                {output.annualCashFlows.map((cf) => (
                  <td
                    key={cf.year}
                    className={cf.dscr < 1.25 ? 'text-red-600 font-bold' : 'text-green-700 font-bold'}
                  >
                    {cf.dscr >= 900 ? 'N/A' : cf.dscr.toFixed(2) + 'x'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Total capital stack */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">Capital Stack</h3>
        </div>
        <div className="card-body">
          <div className="flex flex-col sm:flex-row gap-6 items-center">
            {/* Visual bar */}
            <div className="w-full sm:w-48 h-10 rounded-full overflow-hidden flex">
              {output.loanSummaries.map((ls, i) => {
                const pct = ls.loanAmount / output.totalProjectCost
                const colors = ['#1e3a5f', '#4a7db8', '#7fb3d3']
                return (
                  <div
                    key={i}
                    style={{ width: `${pct * 100}%`, background: colors[i] }}
                    title={`Loan ${i + 1}: ${fmt$(ls.loanAmount)} (${(pct * 100).toFixed(1)}%)`}
                  />
                )
              })}
              <div
                style={{
                  flex: 1,
                  background: '#c9a84c',
                }}
                title={`Equity: ${fmt$(output.totalEquity)}`}
              />
            </div>

            {/* Legend */}
            <div className="space-y-2">
              {output.loanSummaries.map((ls, i) => {
                const loan = input.financing.loans[i]
                const colors = ['#1e3a5f', '#4a7db8', '#7fb3d3']
                return (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded" style={{ background: colors[i] }} />
                    <span className="text-gray-600">{loan?.label}:</span>
                    <span className="font-mono font-semibold">{fmt$(ls.loanAmount)}</span>
                    <span className="text-gray-400">({((ls.loanAmount / output.totalProjectCost) * 100).toFixed(1)}%)</span>
                  </div>
                )
              })}
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded" style={{ background: '#c9a84c' }} />
                <span className="text-gray-600">Equity:</span>
                <span className="font-mono font-semibold">{fmt$(output.totalEquity)}</span>
                <span className="text-gray-400">({((output.totalEquity / output.totalProjectCost) * 100).toFixed(1)}%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="font-bold font-mono text-gray-900">{value}</p>
    </div>
  )
}

interface AmortRow {
  year: number
  begBalance: number
  interest: number
  principal: number
  endBalance: number
  totalPayment: number
}

function buildAmortSchedule(
  loan: { loanAmount: number; interestRate: number; amortizationYears: number; ioPeriodYears: number },
  holdYears: number
): AmortRow[] {
  const rows: AmortRow[] = []
  let balance = loan.loanAmount
  const r = loan.interestRate / 100 / 12
  const n = loan.amortizationYears * 12
  const amortPmt = r === 0 ? loan.loanAmount / n : (loan.loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)

  for (let yr = 1; yr <= holdYears; yr++) {
    const begBalance = balance
    const isIO = yr <= loan.ioPeriodYears
    let yearInterest = 0
    let yearPrincipal = 0
    let yearPayment = 0

    for (let m = 0; m < 12; m++) {
      const interest = balance * r
      const principal = isIO ? 0 : amortPmt - interest
      yearInterest += interest
      yearPrincipal += Math.max(0, principal)
      yearPayment += isIO ? interest : amortPmt
      if (!isIO) balance = Math.max(0, balance - principal)
    }

    rows.push({
      year: yr,
      begBalance,
      interest: yearInterest,
      principal: yearPrincipal,
      endBalance: balance,
      totalPayment: yearPayment,
    })
  }

  return rows
}
