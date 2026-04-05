'use client'
import type { ProFormaOutput, SensitivityGrid } from '@/types/proforma'
import { fmt$ } from '@/lib/utils'

interface Props { output: ProFormaOutput }

function getHeatClass(value: number, all: number[]): string {
  const sorted = [...all].sort((a, b) => a - b)
  const min = sorted[0]
  const max = sorted[sorted.length - 1]
  const range = max - min
  if (range === 0) return 'sensitivity-med'
  const p = (value - min) / range
  if (p >= 0.7) return 'sensitivity-high'
  if (p >= 0.35) return 'sensitivity-med'
  return 'sensitivity-low'
}

function GridTable({
  grid,
  formatter,
  baseRow,
  baseCol,
  rowFormatter,
}: {
  grid: SensitivityGrid
  formatter: (v: number) => string
  baseRow: number
  baseCol: number
  rowFormatter?: (v: number) => string
}) {
  const allValues = grid.values.flat()

  return (
    <div className="overflow-x-auto">
      <table className="sensitivity-table w-full text-xs border-collapse">
        <thead>
          <tr>
            <td className="px-3 py-2 text-left text-xs font-bold text-gray-500 bg-gray-50">
              {grid.rowLabel} ↓ / {grid.colLabel} →
            </td>
            {grid.cols.map((c) => (
              <th key={c} className="px-3 py-2 text-center font-bold text-gray-600 bg-gray-50">
                {c.toFixed(1)}%
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.rows.map((row, ri) =>
            grid.values[ri] ? (
              <tr key={row}>
                <td className="px-3 py-2 text-left font-bold text-gray-600 bg-gray-50">
                  {rowFormatter ? rowFormatter(row) : `${row.toFixed(2)}%`}
                </td>
                {grid.values[ri].map((val, ci) => {
                  const isBase = ri === baseRow && ci === baseCol
                  const cls = isBase ? 'sensitivity-base' : getHeatClass(val, allValues)
                  return (
                    <td key={ci} className={cls}>
                      {formatter(val)}
                    </td>
                  )
                })}
              </tr>
            ) : null
          )}
        </tbody>
      </table>
    </div>
  )
}

export function SensitivityMatrix({ output }: Props) {
  const g1 = output.capRateSensitivity
  const g2 = output.vacancySensitivity
  const g3 = output.purchasePriceSensitivity

  const baseCapRow = Math.floor(g1.rows.length / 2)
  const baseCapCol = Math.floor(g1.cols.length / 2)
  const baseVacRow = Math.floor(g2.rows.length / 2)
  const baseVacCol = Math.floor(g2.cols.length / 2)
  // g3 rows are [-20,-10,-5,0,5,10,20] → base is index 3 (0%)
  const basePriceRow = g3.rows.indexOf(0)
  const basePriceCol = Math.floor(g3.cols.length / 2)

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex items-center gap-4 text-xs">
        <span className="font-semibold text-gray-600 uppercase tracking-wide">Heat Map:</span>
        <span className="sensitivity-high px-2 py-0.5 rounded">High</span>
        <span className="sensitivity-med px-2 py-0.5 rounded">Medium</span>
        <span className="sensitivity-low px-2 py-0.5 rounded">Low</span>
        <span className="sensitivity-base px-2 py-0.5 rounded">Base Case</span>
      </div>

      {/* Grid 1: Exit Cap Rate × NOI Change → Exit Value */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">
              Exit Cap Rate × NOI Change → Implied Exit Value
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              What is the property worth at exit under different cap rate &amp; NOI scenarios?
            </p>
          </div>
        </div>
        <div className="card-body">
          <GridTable
            grid={g1}
            formatter={(v) => fmt$(v)}
            baseRow={baseCapRow}
            baseCol={baseCapCol}
          />
        </div>
      </div>

      {/* Grid 2: Vacancy × Rent Growth → IRR */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">
              Vacancy Rate × Rent Growth → IRR
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              How does IRR change as occupancy and rent growth vary from base case?
            </p>
          </div>
        </div>
        <div className="card-body">
          <GridTable
            grid={g2}
            formatter={(v) => v.toFixed(2) + '%'}
            baseRow={baseVacRow}
            baseCol={baseVacCol}
          />
        </div>
      </div>

      {/* Grid 3: Purchase Price × Exit Cap → IRR */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">
              Purchase Price Δ × Exit Cap Rate → IRR
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              How does IRR change as you pay more/less and the market cap rate shifts? (LTV held constant)
            </p>
          </div>
        </div>
        <div className="card-body">
          <GridTable
            grid={g3}
            formatter={(v) => v.toFixed(2) + '%'}
            baseRow={basePriceRow >= 0 ? basePriceRow : 3}
            baseCol={basePriceCol}
            rowFormatter={(v) => (v === 0 ? 'Base' : v > 0 ? `+${v}%` : `${v}%`)}
          />
        </div>
      </div>

      {/* Scenario summary callouts */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-1">Best Case</p>
          <p className="text-sm text-blue-900">
            Exit Value: <strong>{fmt$(Math.max(...g1.values.flat()))}</strong><br />
            IRR (Vac/Rent): <strong>{Math.max(...g2.values.flat()).toFixed(2)}%</strong><br />
            IRR (Price/Cap): <strong>{Math.max(...g3.values.flat()).toFixed(2)}%</strong>
          </p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Base Case</p>
          <p className="text-sm text-gray-900">
            Exit Value: <strong>{fmt$(g1.values[baseCapRow]?.[baseCapCol] ?? 0)}</strong><br />
            IRR (Vac/Rent): <strong>{(g2.values[baseVacRow]?.[baseVacCol] ?? 0).toFixed(2)}%</strong><br />
            IRR (Price/Cap): <strong>{(g3.values[basePriceRow >= 0 ? basePriceRow : 3]?.[basePriceCol] ?? 0).toFixed(2)}%</strong>
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-xs font-bold text-red-700 uppercase tracking-wide mb-1">Worst Case</p>
          <p className="text-sm text-red-900">
            Exit Value: <strong>{fmt$(Math.min(...g1.values.flat()))}</strong><br />
            IRR (Vac/Rent): <strong>{Math.min(...g2.values.flat()).toFixed(2)}%</strong><br />
            IRR (Price/Cap): <strong>{Math.min(...g3.values.flat()).toFixed(2)}%</strong>
          </p>
        </div>
      </div>
    </div>
  )
}
