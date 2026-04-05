'use client'
import { NumberInput } from '@/components/ui/NumberInput'
import { fmtPct, fmt$ } from '@/lib/utils'
import type { MarketInputs } from '@/types/proforma'

interface Props {
  data: MarketInputs
  onChange: (d: MarketInputs) => void
  baseRentGrowth: number
}

type GrowthYear = {
  label: string
  key: keyof Pick<
    MarketInputs,
    'rentGrowthY1' | 'rentGrowthY2' | 'rentGrowthY3' | 'rentGrowthY4' | 'rentGrowthY5' | 'rentGrowthY6to10'
  >
}

const GROWTH_YEARS: GrowthYear[] = [
  { label: 'Year 1', key: 'rentGrowthY1' },
  { label: 'Year 2', key: 'rentGrowthY2' },
  { label: 'Year 3', key: 'rentGrowthY3' },
  { label: 'Year 4', key: 'rentGrowthY4' },
  { label: 'Year 5', key: 'rentGrowthY5' },
  { label: 'Yrs 6–10', key: 'rentGrowthY6to10' },
]

export function MarketAssumptions({ data, onChange, baseRentGrowth }: Props) {
  function set<K extends keyof MarketInputs>(key: K, val: MarketInputs[K]) {
    onChange({ ...data, [key]: val })
  }

  // ── Bar chart scale ──────────────────────────────────────────────────────────
  const growthValues = GROWTH_YEARS.map((y) => data[y.key] as number)
  const maxGrowth = Math.max(...growthValues, 0.1)

  return (
    <div className="space-y-8">

      {/* ══ SECTION A — Year-by-Year Rent Growth ════════════════════════════════ */}
      <div className="card">
        <p className="section-header">A — Year-by-Year Rent Growth</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          {GROWTH_YEARS.map(({ label, key }) => (
            <NumberInput
              key={key}
              label={label}
              value={data[key] as number}
              onChange={(v) => set(key, v)}
              suffix="%"
              decimals={2}
              step={0.25}
              hint={key === 'rentGrowthY1' ? `Base: ${fmtPct(baseRentGrowth)}` : undefined}
            />
          ))}
        </div>

        {/* HTML div-based horizontal bar chart */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Rent Growth Visualization
          </p>
          {GROWTH_YEARS.map(({ label, key }) => {
            const val = data[key] as number
            const barPct = maxGrowth > 0 ? Math.max((val / maxGrowth) * 100, 0) : 0
            const isNegative = val < 0
            return (
              <div key={key} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-16 shrink-0 text-right">{label}</span>
                <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isNegative ? 'bg-red-400' : 'bg-indigo-500'
                    }`}
                    style={{ width: `${barPct}%` }}
                  />
                </div>
                <span
                  className={`text-xs font-mono w-12 text-right ${
                    isNegative ? 'text-red-600' : 'text-gray-700'
                  }`}
                >
                  {fmtPct(val)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ══ SECTION B — Vacancy Assumptions ════════════════════════════════════ */}
      <div className="card">
        <p className="section-header">B — Vacancy Assumptions</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <NumberInput
            label="Stabilized Vacancy"
            value={data.stabilizedVacancy}
            onChange={(v) => set('stabilizedVacancy', v)}
            suffix="%"
            decimals={2}
            step={0.5}
            hint="Long-run stabilized physical vacancy"
          />
          <NumberInput
            label="Lease-Up Period (months)"
            value={data.leaseUpMonths}
            onChange={(v) => set('leaseUpMonths', v)}
            min={0}
            max={36}
            hint="Months to reach stabilized occupancy"
          />
          <NumberInput
            label="Lease-Up Starting Vacancy"
            value={data.leaseUpStartVacancy}
            onChange={(v) => set('leaseUpStartVacancy', v)}
            suffix="%"
            decimals={1}
            step={1}
            hint="Vacancy at acquisition / start"
          />
        </div>
        {data.leaseUpMonths > 0 && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            Lease-up note: Property starts at {fmtPct(data.leaseUpStartVacancy)} vacancy and
            stabilizes over {data.leaseUpMonths} months. Year 1 cash flow will reflect a blended
            occupancy. Lease-up costs are not modeled here — add them as CapEx items if applicable.
          </div>
        )}
      </div>

      {/* ══ SECTION C — Market Comparables ═════════════════════════════════════ */}
      <div className="card">
        <p className="section-header">C — Market Comparables</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <NumberInput
            label="Comp Avg Rent ($/mo)"
            value={data.compAvgRent}
            onChange={(v) => set('compAvgRent', v)}
            prefix="$"
            step={25}
            hint="Market comparable average rent"
          />
          <NumberInput
            label="Comp Avg Vacancy"
            value={data.compAvgVacancy}
            onChange={(v) => set('compAvgVacancy', v)}
            suffix="%"
            decimals={1}
            step={0.5}
          />
          <NumberInput
            label="Comp Cap Rate"
            value={data.compCapRate}
            onChange={(v) => set('compCapRate', v)}
            suffix="%"
            decimals={2}
            step={0.25}
          />
          <NumberInput
            label="Market Rent Growth Forecast"
            value={data.marketRentGrowthForecast}
            onChange={(v) => set('marketRentGrowthForecast', v)}
            suffix="%"
            decimals={2}
            step={0.25}
            hint="Broker / market consensus long-run growth"
          />
          <NumberInput
            label="Cap Rate Forecast"
            value={data.capRateForecast}
            onChange={(v) => set('capRateForecast', v)}
            suffix="%"
            decimals={2}
            step={0.25}
            hint="Expected exit cap rate direction"
          />
        </div>

        {/* Comparison table */}
        <div className="mt-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Deal vs. Market Snapshot
          </p>
          <table className="pro-table">
            <thead>
              <tr>
                <th>Metric</th>
                <th>This Deal (Model)</th>
                <th>Market Comps</th>
                <th>Spread</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Avg Rent / mo</td>
                <td className="font-mono">—</td>
                <td className="font-mono">{fmt$(data.compAvgRent)}</td>
                <td className="font-mono text-gray-400">—</td>
              </tr>
              <tr>
                <td>Vacancy</td>
                <td className="font-mono">{fmtPct(data.stabilizedVacancy)}</td>
                <td className="font-mono">{fmtPct(data.compAvgVacancy)}</td>
                <td
                  className={`font-mono ${
                    data.stabilizedVacancy - data.compAvgVacancy > 0
                      ? 'text-red-600'
                      : 'text-green-600'
                  }`}
                >
                  {fmtPct(data.stabilizedVacancy - data.compAvgVacancy)}
                </td>
              </tr>
              <tr>
                <td>Cap Rate</td>
                <td className="font-mono">—</td>
                <td className="font-mono">{fmtPct(data.compCapRate)}</td>
                <td className="font-mono text-gray-400">—</td>
              </tr>
              <tr>
                <td>Rent Growth Forecast</td>
                <td className="font-mono">{fmtPct(data.rentGrowthY1)} (Yr 1)</td>
                <td className="font-mono">{fmtPct(data.marketRentGrowthForecast)}</td>
                <td
                  className={`font-mono ${
                    data.rentGrowthY1 - data.marketRentGrowthForecast >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {fmtPct(data.rentGrowthY1 - data.marketRentGrowthForecast)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ══ SECTION D — Economic Indicators ════════════════════════════════════ */}
      <div className="card">
        <p className="section-header">D — Economic Indicators</p>
        <div className="grid grid-cols-2 gap-4">
          <NumberInput
            label="Inflation Rate"
            value={data.inflationRate}
            onChange={(v) => set('inflationRate', v)}
            suffix="%"
            decimals={2}
            step={0.25}
            hint="Used as a cross-check against expense growth assumptions"
          />
          <NumberInput
            label="SOFR Rate"
            value={data.sofrRate}
            onChange={(v) => set('sofrRate', v)}
            suffix="%"
            decimals={3}
            step={0.125}
            hint="Secured Overnight Financing Rate — used as the base for floating-rate loans"
          />
        </div>
        <p className="mt-3 text-xs text-gray-400">
          Note: SOFR is used as the floating rate index for variable-rate debt tranches. Add a
          spread in the Financing section to derive the all-in rate.
        </p>
      </div>

    </div>
  )
}
