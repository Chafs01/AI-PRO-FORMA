'use client'
import type { ProFormaOutput, ProFormaInput } from '@/types/proforma'
import { fmt$, fmtPct, fmtX, fmtNum } from '@/lib/utils'
import { TrendingUp, Building2, DollarSign, Percent, BarChart3, Shield } from 'lucide-react'

interface Props {
  input: ProFormaInput
  output: ProFormaOutput
}

export function ExecutiveSummary({ input, output }: Props) {
  const y1 = output.year1

  const topMetrics = [
    {
      label: 'IRR',
      value: fmtPct(output.irr),
      sub: `${input.exit.holdingPeriodYears}-yr hold`,
      icon: TrendingUp,
      color: '#16a34a',
      bg: '#f0fdf4',
    },
    {
      label: 'Equity Multiple',
      value: fmtX(output.equityMultiple),
      sub: 'Total equity return',
      icon: BarChart3,
      color: '#1e3a5f',
      bg: '#eff6ff',
    },
    {
      label: 'NPV',
      value: fmt$(output.npv),
      sub: `@ ${input.exit.discountRate}% discount`,
      icon: DollarSign,
      color: output.npv >= 0 ? '#16a34a' : '#dc2626',
      bg: output.npv >= 0 ? '#f0fdf4' : '#fef2f2',
    },
    {
      label: 'Avg Cash-on-Cash',
      value: fmtPct(output.averageCoCReturn),
      sub: 'Before-tax avg',
      icon: Percent,
      color: '#d97706',
      bg: '#fffbeb',
    },
    {
      label: 'Going-In Cap Rate',
      value: fmtPct(output.goingInCapRate),
      sub: `NOI ${fmt$(y1.noi)}`,
      icon: Building2,
      color: '#7c3aed',
      bg: '#faf5ff',
    },
    {
      label: 'Year 1 DSCR',
      value: y1.dscr >= 900 ? 'N/A' : fmtNum(y1.dscr) + 'x',
      sub: y1.dscr >= 900
        ? 'No debt financing'
        : y1.dscr >= 1.25
        ? '✓ Lender threshold met'
        : '⚠ Below 1.25x',
      icon: Shield,
      color: y1.dscr >= 900 ? '#6b7280' : y1.dscr >= 1.25 ? '#16a34a' : '#dc2626',
      bg: y1.dscr >= 900 ? '#f9fafb' : y1.dscr >= 1.25 ? '#f0fdf4' : '#fef2f2',
    },
  ]

  return (
    <div className="space-y-6">
      {/* ── Key Metrics Grid ──────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {topMetrics.map((m) => (
          <div key={m.label} className="metric-card" style={{ borderTop: `3px solid ${m.color}` }}>
            <div className="flex items-start justify-between mb-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: m.bg }}
              >
                <m.icon className="w-4 h-4" style={{ color: m.color }} />
              </div>
            </div>
            <div className="metric-value" style={{ color: m.color, fontSize: '1.4rem' }}>
              {m.value}
            </div>
            <div className="metric-label">{m.label}</div>
            <div className="text-xs text-gray-400 mt-1">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Two Column Detail ─────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Acquisition Summary */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">Acquisition Summary</h3>
          </div>
          <div className="card-body">
            <table className="pro-table">
              <tbody>
                <SummaryRow label="Purchase Price" value={fmt$(input.acquisition.purchasePrice)} />
                <SummaryRow label="Total Project Cost" value={fmt$(output.totalProjectCost)} />
                <SummaryRow label="Total Debt" value={fmt$(output.totalDebt)} />
                <SummaryRow label="Total Equity" value={fmt$(output.totalEquity)} bold />
                <SummaryRow label="LTV" value={fmtPct(output.ltv * 100)} />
                <SummaryRow label="Price / Unit" value={fmt$(output.pricePerUnit)} />
                <SummaryRow label="Price / Sq Ft" value={'$' + output.pricePerSqft.toFixed(2)} />
                <SummaryRow label="Gross Rent Multiplier" value={fmtNum(output.grm) + 'x'} />
              </tbody>
            </table>
          </div>
        </div>

        {/* Year 1 Operations */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">Year 1 Operating Performance</h3>
          </div>
          <div className="card-body">
            <table className="pro-table">
              <tbody>
                <SummaryRow label="Gross Potential Rent" value={fmt$(y1.gpr)} />
                <SummaryRow label="(Less) Vacancy & Credit" value={`(${fmt$(y1.vacancyLoss + y1.creditLoss)})`} negative />
                <SummaryRow label="(Plus) Other Income" value={fmt$(y1.otherIncome)} />
                <SummaryRow label="Effective Gross Income" value={fmt$(y1.egi)} bold />
                <SummaryRow label="(Less) Operating Expenses" value={`(${fmt$(y1.totalOpEx)})`} negative />
                <SummaryRow label="Net Operating Income" value={fmt$(y1.noi)} bold />
                <SummaryRow label="(Less) Debt Service" value={`(${fmt$(y1.debtService)})`} negative />
                <SummaryRow label="Before-Tax Cash Flow" value={fmt$(y1.btcf)} bold />
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Returns Table ─────────────────────────────── */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">
            {input.exit.holdingPeriodYears}-Year Return Summary
          </h3>
        </div>
        <div className="card-body overflow-x-auto">
          <table className="pro-table">
            <thead>
              <tr>
                <th>Year</th>
                {output.annualCashFlows.map((cf) => (
                  <th key={cf.year}>Year {cf.year}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>NOI</td>
                {output.annualCashFlows.map((cf) => (
                  <td key={cf.year}>{fmt$(cf.noi)}</td>
                ))}
              </tr>
              <tr>
                <td>BTCF</td>
                {output.annualCashFlows.map((cf) => (
                  <td key={cf.year}>{fmt$(cf.btcf)}</td>
                ))}
              </tr>
              <tr>
                <td>Cash-on-Cash</td>
                {output.annualCashFlows.map((cf) => (
                  <td key={cf.year}>{fmtPct(cf.cocReturn * 100)}</td>
                ))}
              </tr>
              <tr>
                <td>DSCR</td>
                {output.annualCashFlows.map((cf) => (
                  <td key={cf.year} className={cf.dscr < 1.25 ? 'text-red-600 font-bold' : ''}>
                    {cf.dscr >= 900 ? 'N/A' : fmtNum(cf.dscr)}
                  </td>
                ))}
              </tr>
              <tr className="highlight-row">
                <td>ATCF (incl. sale)</td>
                {output.annualCashFlows.map((cf) => (
                  <td key={cf.year}>{fmt$(cf.atcf + cf.saleProceeds)}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Exit Metrics ──────────────────────────────── */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card p-5 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Exit Value</p>
          <p className="text-2xl font-bold font-mono" style={{ color: '#1e3a5f' }}>{fmt$(output.exitPrice)}</p>
          <p className="text-xs text-gray-400 mt-1">@ {fmtPct(output.exitCapRate)} exit cap</p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Exit NOI</p>
          <p className="text-2xl font-bold font-mono text-gray-800">{fmt$(output.exitNOI)}</p>
          <p className="text-xs text-gray-400 mt-1">Year {input.exit.holdingPeriodYears + 1} projected</p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Break-Even Occupancy</p>
          <p className="text-2xl font-bold font-mono text-gray-800">{fmtPct(output.breakEvenOccupancy)}</p>
          <p className="text-xs text-gray-400 mt-1">Covers OpEx + Debt Service</p>
        </div>
      </div>
    </div>
  )
}

function SummaryRow({
  label,
  value,
  bold,
  negative,
}: {
  label: string
  value: string
  bold?: boolean
  negative?: boolean
}) {
  return (
    <tr className={bold ? 'total-row' : ''}>
      <td>{label}</td>
      <td className={negative ? 'text-red-600' : bold ? 'text-gray-900' : ''}>{value}</td>
    </tr>
  )
}
