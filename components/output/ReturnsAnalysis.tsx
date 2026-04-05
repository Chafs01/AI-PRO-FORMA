'use client'
import type { ProFormaOutput, ProFormaInput } from '@/types/proforma'
import { fmt$, fmtPct, fmtX, fmtNum } from '@/lib/utils'

interface Props { input: ProFormaInput; output: ProFormaOutput }

export function ReturnsAnalysis({ input, output }: Props) {
  const cfs = output.annualCashFlows

  // Payback period — first year cumulative ATCF (excl. sale) >= initial equity
  const paybackYear = (() => {
    let cum = 0
    for (const cf of cfs) {
      cum += cf.atcf
      if (cum >= output.totalEquity) return cf.year
    }
    return null // not achieved within hold period
  })()

  return (
    <div className="space-y-6">
      {/* Top Returns Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <ReturnCard
          label="IRR"
          value={fmtPct(output.irr)}
          sub={`${input.exit.holdingPeriodYears}-year hold`}
          grade={gradeIRR(output.irr)}
        />
        <ReturnCard
          label="Equity Multiple"
          value={fmtX(output.equityMultiple)}
          sub="Total return on equity"
          grade={gradeEM(output.equityMultiple)}
        />
        <ReturnCard
          label="NPV"
          value={fmt$(output.npv)}
          sub={`@ ${input.exit.discountRate}% hurdle`}
          grade={output.npv >= 0 ? 'good' : 'bad'}
        />
        <ReturnCard
          label="Avg Cash-on-Cash"
          value={fmtPct(output.averageCoCReturn)}
          sub="Average across hold"
          grade={gradeCoc(output.averageCoCReturn)}
        />
        <ReturnCard
          label="Payback Period"
          value={paybackYear ? `Yr ${paybackYear}` : 'N/A'}
          sub={paybackYear ? 'ATCF-only payback' : 'Not within hold period'}
          grade={paybackYear && paybackYear <= input.exit.holdingPeriodYears ? 'good' : 'ok'}
        />
      </div>

      {/* Detailed Returns Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">Year-by-Year Returns</h3>
        </div>
        <div className="card-body overflow-x-auto">
          <table className="pro-table">
            <thead>
              <tr>
                <th>Metric</th>
                {cfs.map((cf) => <th key={cf.year}>Year {cf.year}</th>)}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Beginning Equity</td>
                {cfs.map((cf) => <td key={cf.year}>{fmt$(cf.beginningEquity)}</td>)}
              </tr>
              <tr>
                <td>NOI</td>
                {cfs.map((cf) => <td key={cf.year}>{fmt$(cf.noi)}</td>)}
              </tr>
              <tr>
                <td>Debt Service</td>
                {cfs.map((cf) => <td key={cf.year} className="text-red-600">({fmt$(cf.debtService)})</td>)}
              </tr>
              <tr className="total-row">
                <td>Before-Tax CF (BTCF)</td>
                {cfs.map((cf) => <td key={cf.year}>{fmt$(cf.btcf)}</td>)}
              </tr>
              <tr>
                <td>Cash-on-Cash Return</td>
                {cfs.map((cf) => (
                  <td key={cf.year} className={cf.cocReturn < 0 ? 'text-red-600' : 'text-green-700'}>
                    {fmtPct(cf.cocReturn * 100)}
                  </td>
                ))}
              </tr>
              <tr>
                <td>Income Taxes</td>
                {cfs.map((cf) => <td key={cf.year} className="text-red-600">({fmt$(cf.taxes)})</td>)}
              </tr>
              <tr>
                <td>CapEx</td>
                {cfs.map((cf) => <td key={cf.year} className="text-red-600">({fmt$(cf.capEx)})</td>)}
              </tr>
              <tr className="highlight-row">
                <td>After-Tax CF (ATCF)</td>
                {cfs.map((cf) => <td key={cf.year}>{fmt$(cf.atcf)}</td>)}
              </tr>
              <tr>
                <td>Sale / Reversion Proceeds</td>
                {cfs.map((cf) => (
                  <td key={cf.year} className={cf.saleProceeds > 0 ? 'text-green-700 font-bold' : ''}>
                    {cf.saleProceeds > 0 ? fmt$(cf.saleProceeds) : '—'}
                  </td>
                ))}
              </tr>
              <tr className="highlight-row">
                <td>Total Return This Year</td>
                {cfs.map((cf) => <td key={cf.year}>{fmt$(cf.atcf + cf.saleProceeds)}</td>)}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Exit Analysis */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Exit Analysis</h3>
          <table className="pro-table">
            <tbody>
              <tr><td>Hold Period</td><td>{input.exit.holdingPeriodYears} years</td></tr>
              <tr><td>Exit Year NOI</td><td>{fmt$(output.exitNOI)}</td></tr>
              <tr><td>Exit Cap Rate Applied</td><td>{fmtPct(output.exitCapRate)}</td></tr>
              <tr><td>Gross Exit Value</td><td className="font-bold">{fmt$(output.exitPrice)}</td></tr>
              <tr><td>Going-In Cap Rate</td><td>{fmtPct(output.goingInCapRate)}</td></tr>
              <tr>
                <td>Cap Rate Δ (Going-In → Exit)</td>
                <td className={output.exitCapRate < output.goingInCapRate ? 'text-green-600' : 'text-red-600'}>
                  {output.exitCapRate < output.goingInCapRate ? '▼ ' : '▲ '}
                  {Math.abs((output.goingInCapRate - output.exitCapRate) * 100).toFixed(0)} bps
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Key Thresholds</h3>
          <table className="pro-table">
            <tbody>
              <tr>
                <td>Break-Even Occupancy</td>
                <td className="font-bold">{fmtPct(output.breakEvenOccupancy)}</td>
              </tr>
              <tr>
                <td>Min DSCR (All Years)</td>
                <td className={Math.min(...cfs.map((c) => c.dscr).filter((d) => d < 900)) < 1.25 ? 'text-red-600 font-bold' : 'text-green-700 font-bold'}>
                  {fmtNum(Math.min(...cfs.map((c) => c.dscr).filter((d) => d < 900)))}x
                </td>
              </tr>
              <tr>
                <td>GRM</td>
                <td>{fmtNum(output.grm)}x</td>
              </tr>
              <tr>
                <td>Price / Unit</td>
                <td>{fmt$(output.pricePerUnit)}</td>
              </tr>
              <tr>
                <td>Price / Sq Ft</td>
                <td>${output.pricePerSqft.toFixed(2)}</td>
              </tr>
              <tr>
                <td>NOI / Sq Ft (Yr 1)</td>
                <td>${output.noiPerSqft.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function gradeIRR(irr: number): 'good' | 'ok' | 'bad' {
  if (irr >= 15) return 'good'
  if (irr >= 8) return 'ok'
  return 'bad'
}
function gradeEM(em: number): 'good' | 'ok' | 'bad' {
  if (em >= 2) return 'good'
  if (em >= 1.3) return 'ok'
  return 'bad'
}
function gradeCoc(coc: number): 'good' | 'ok' | 'bad' {
  if (coc >= 8) return 'good'
  if (coc >= 5) return 'ok'
  return 'bad'
}

function ReturnCard({
  label, value, sub, grade,
}: {
  label: string
  value: string
  sub: string
  grade: 'good' | 'ok' | 'bad'
}) {
  const colorMap = {
    good: { border: '#16a34a', text: '#15803d', bg: '#f0fdf4' },
    ok: { border: '#d97706', text: '#b45309', bg: '#fffbeb' },
    bad: { border: '#dc2626', text: '#b91c1c', bg: '#fef2f2' },
  }
  const c = colorMap[grade]
  return (
    <div
      className="rounded-xl p-5 border-2"
      style={{ borderColor: c.border, background: c.bg }}
    >
      <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: c.text }}>
        {label}
      </p>
      <p className="text-2xl font-bold font-mono" style={{ color: c.text }}>
        {value}
      </p>
      <p className="text-xs mt-1" style={{ color: c.text, opacity: 0.7 }}>
        {sub}
      </p>
    </div>
  )
}
