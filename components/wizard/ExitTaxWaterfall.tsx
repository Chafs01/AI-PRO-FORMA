'use client'
import { NumberInput } from '@/components/ui/NumberInput'
import { fmt$, fmtPct } from '@/lib/utils'
import type { ExitInputs, WaterfallInputs } from '@/types/proforma'

interface Props {
  exit: ExitInputs
  waterfall: WaterfallInputs
  onExitChange: (e: ExitInputs) => void
  onWaterfallChange: (w: WaterfallInputs) => void
}

export function ExitTaxWaterfall({ exit, waterfall, onExitChange, onWaterfallChange }: Props) {
  function setE<K extends keyof ExitInputs>(key: K, val: ExitInputs[K]) {
    onExitChange({ ...exit, [key]: val })
  }
  function setW<K extends keyof WaterfallInputs>(key: K, val: WaterfallInputs[K]) {
    onWaterfallChange({ ...waterfall, [key]: val })
  }

  // ── Depreciation schedule computations ──────────────────────────────────────
  const straightLineAnnual = exit.depreciableLife > 0 ? exit.costBasis / exit.depreciableLife : 0
  const basis5yr = exit.costSegregation ? (exit.costSegregation5yr / 100) * exit.costBasis : 0
  const basis15yr = exit.costSegregation ? (exit.costSegregation15yr / 100) * exit.costBasis : 0
  const remainingBasis = exit.costBasis - basis5yr - basis15yr
  const straightLineOnRemaining = exit.depreciableLife > 0 ? remainingBasis / exit.depreciableLife : 0
  // Year-1 MACRS 5-yr: 20% (200DB half-year convention)
  const macrs5Yr1 = basis5yr * 0.2
  // Year-1 MACRS 15-yr: 5% (150DB half-year convention)
  const macrs15Yr1 = basis15yr * 0.05
  const totalYear1Deduction = exit.costSegregation
    ? straightLineOnRemaining + macrs5Yr1 + macrs15Yr1
    : straightLineAnnual

  // ── Effective exit tax rate ──────────────────────────────────────────────────
  const effectiveExitTaxRate = exit.is1031Exchange
    ? 0
    : exit.longTermCapGainsRate + exit.stateCapGainsRate + exit.netInvestmentIncomeTax

  // ── LP/GP equity sum validation ──────────────────────────────────────────────
  const equitySum = waterfall.lpEquityPct + waterfall.gpEquityPct
  const equitySumError = Math.abs(equitySum - 100) > 0.01

  return (
    <div className="space-y-8">

      {/* ══ SECTION A — Hold Period & Exit ══════════════════════════════════════ */}
      <div className="card">
        <p className="section-header">A — Hold Period &amp; Exit</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <NumberInput
            label="Holding Period (Years)"
            value={exit.holdingPeriodYears}
            onChange={(v) => setE('holdingPeriodYears', v)}
            min={1}
            max={10}
            hint="IRR is calculated at exit year"
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
            label="Selling Costs"
            value={exit.sellingCosts}
            onChange={(v) => setE('sellingCosts', v)}
            suffix="%"
            decimals={2}
            step={0.25}
            hint="Broker, transfer taxes, etc."
          />
          <NumberInput
            label="Hurdle Rate / Discount Rate"
            value={exit.discountRate}
            onChange={(v) => setE('discountRate', v)}
            suffix="%"
            decimals={2}
            step={0.25}
            hint="Used for NPV calculation"
          />
        </div>
      </div>

      {/* ══ SECTION B — Depreciation ════════════════════════════════════════════ */}
      <div className="card">
        <p className="section-header">B — Depreciation</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <NumberInput
            label="Depreciable Cost Basis (excl. land)"
            value={exit.costBasis}
            onChange={(v) => setE('costBasis', v)}
            prefix="$"
            step={10000}
            hint="Purchase price minus land value"
          />
          <NumberInput
            label="Land Value"
            value={exit.landValue}
            onChange={(v) => setE('landValue', v)}
            prefix="$"
            step={5000}
            hint="Non-depreciable portion"
          />
          <div>
            <label className="input-label">Depreciable Life</label>
            <select
              className="input-field"
              value={exit.depreciableLife}
              onChange={(e) => setE('depreciableLife', Number(e.target.value))}
            >
              <option value={27.5}>27.5 years — Residential</option>
              <option value={39}>39 years — Commercial</option>
              <option value={15}>15 years — Land Improvements</option>
            </select>
          </div>
        </div>

        {/* Cost Segregation */}
        <div className="mt-4">
          <label className="flex items-center gap-2 cursor-pointer w-fit">
            <input
              type="checkbox"
              className="w-4 h-4 accent-indigo-600"
              checked={exit.costSegregation}
              onChange={(e) => setE('costSegregation', e.target.checked)}
            />
            <span className="input-label mb-0">Cost Segregation Study</span>
          </label>
          <p className="text-xs text-gray-400 mt-1 ml-6">
            Accelerates depreciation by reclassifying components to shorter recovery periods.
          </p>

          {exit.costSegregation && (
            <div className="grid grid-cols-2 gap-4 mt-3 ml-6">
              <NumberInput
                label="5-yr MACRS Component (% of basis)"
                value={exit.costSegregation5yr}
                onChange={(v) => setE('costSegregation5yr', v)}
                suffix="%"
                decimals={1}
                step={1}
                hint="Personal property, fixtures (typ. 10–20%)"
              />
              <NumberInput
                label="15-yr MACRS Component (% of basis)"
                value={exit.costSegregation15yr}
                onChange={(v) => setE('costSegregation15yr', v)}
                suffix="%"
                decimals={1}
                step={1}
                hint="Land improvements (typ. 5–10%)"
              />
            </div>
          )}
        </div>

        {/* Annual Depreciation Schedule Table */}
        <div className="mt-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Annual Depreciation Schedule
          </p>
          <table className="pro-table">
            <thead>
              <tr>
                <th>Component</th>
                <th>Basis</th>
                <th>Life</th>
                <th>Year 1 Deduction</th>
              </tr>
            </thead>
            <tbody>
              {exit.costSegregation ? (
                <>
                  <tr>
                    <td>Straight-line (remaining basis)</td>
                    <td className="font-mono">{fmt$(remainingBasis)}</td>
                    <td>{exit.depreciableLife} yrs</td>
                    <td className="font-mono">{fmt$(straightLineOnRemaining)}</td>
                  </tr>
                  <tr>
                    <td>5-yr MACRS component</td>
                    <td className="font-mono">{fmt$(basis5yr)}</td>
                    <td>5 yrs</td>
                    <td className="font-mono">{fmt$(macrs5Yr1)}</td>
                  </tr>
                  <tr>
                    <td>15-yr MACRS component</td>
                    <td className="font-mono">{fmt$(basis15yr)}</td>
                    <td>15 yrs</td>
                    <td className="font-mono">{fmt$(macrs15Yr1)}</td>
                  </tr>
                </>
              ) : (
                <tr>
                  <td>Straight-line</td>
                  <td className="font-mono">{fmt$(exit.costBasis)}</td>
                  <td>{exit.depreciableLife} yrs</td>
                  <td className="font-mono">{fmt$(straightLineAnnual)}</td>
                </tr>
              )}
              <tr className="font-semibold bg-gray-50">
                <td>Total Year 1 Deduction</td>
                <td className="font-mono">{fmt$(exit.costBasis)}</td>
                <td>—</td>
                <td className="font-mono text-indigo-700">{fmt$(totalYear1Deduction)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ══ SECTION C — Tax Assumptions ═════════════════════════════════════════ */}
      <div className="card">
        <p className="section-header">C — Tax Assumptions</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <NumberInput
            label="Ordinary Income Tax Rate"
            value={exit.taxRate}
            onChange={(v) => setE('taxRate', v)}
            suffix="%"
            decimals={1}
            step={1}
            hint="Federal + state combined marginal rate"
          />
          <NumberInput
            label="Long-Term Capital Gains Rate"
            value={exit.longTermCapGainsRate}
            onChange={(v) => setE('longTermCapGainsRate', v)}
            suffix="%"
            decimals={1}
            step={1}
            hint="Federal LTCG rate (0%, 15%, or 20%)"
          />
          <NumberInput
            label="Depreciation Recapture Rate"
            value={exit.depreciationRecaptureRate}
            onChange={(v) => setE('depreciationRecaptureRate', v)}
            suffix="%"
            decimals={1}
            step={1}
            hint="Typically 25% for real property (§1250)"
          />
          <NumberInput
            label="State Capital Gains Rate"
            value={exit.stateCapGainsRate}
            onChange={(v) => setE('stateCapGainsRate', v)}
            suffix="%"
            decimals={1}
            step={0.5}
          />
          <div>
            <label className="input-label flex items-center gap-1.5">
              Net Investment Income Tax (NIIT)
              <span
                title="3.8% Medicare surtax applies to investment income for taxpayers above income thresholds ($200K single / $250K MFJ)"
                className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 text-gray-600 text-[10px] font-bold cursor-help select-none"
              >
                ?
              </span>
            </label>
            <div className="relative flex items-center">
              <input
                type="number"
                className="input-field pr-10"
                value={exit.netInvestmentIncomeTax}
                step={0.1}
                min={0}
                onChange={(e) => setE('netInvestmentIncomeTax', parseFloat(e.target.value) || 0)}
              />
              <span className="absolute right-3 text-gray-400 text-sm select-none pointer-events-none">%</span>
            </div>
            <p className="mt-1 text-xs text-gray-400">Typically 3.8% NIIT</p>
          </div>
        </div>

        {/* 1031 Exchange */}
        <div className="mt-4">
          <label className="flex items-center gap-2 cursor-pointer w-fit">
            <input
              type="checkbox"
              className="w-4 h-4 accent-indigo-600"
              checked={exit.is1031Exchange}
              onChange={(e) => setE('is1031Exchange', e.target.checked)}
            />
            <span className="input-label mb-0">1031 Like-Kind Exchange</span>
          </label>
          {exit.is1031Exchange && (
            <div className="ml-6 mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
              Sale proceeds reinvested — reduces exit tax to $0 in model. Depreciation basis carries
              over to replacement property.
            </div>
          )}
        </div>

        {/* Effective exit tax rate summary */}
        <div className="mt-4 flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
          <span className="text-sm font-medium text-gray-600">Computed Total Effective Exit Tax Rate</span>
          <span className="text-lg font-bold font-mono text-indigo-700">
            {exit.is1031Exchange ? '0.0%' : fmtPct(effectiveExitTaxRate)}
          </span>
        </div>
      </div>

      {/* ══ SECTION D — LP/GP Waterfall ═════════════════════════════════════════ */}
      <div className="card">
        <label className="flex items-center gap-2 cursor-pointer w-fit mb-4">
          <input
            type="checkbox"
            className="w-4 h-4 accent-indigo-600"
            checked={waterfall.useWaterfall}
            onChange={(e) => setW('useWaterfall', e.target.checked)}
          />
          <span className="section-header mb-0">D — Model LP/GP Equity Waterfall</span>
        </label>

        {waterfall.useWaterfall && (
          <div className="space-y-6">

            {/* Equity Split */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Equity Split</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <NumberInput
                  label="LP Equity %"
                  value={waterfall.lpEquityPct}
                  onChange={(v) => setW('lpEquityPct', v)}
                  suffix="%"
                  decimals={1}
                  step={1}
                />
                <NumberInput
                  label="GP Equity %"
                  value={waterfall.gpEquityPct}
                  onChange={(v) => setW('gpEquityPct', v)}
                  suffix="%"
                  decimals={1}
                  step={1}
                />
                <NumberInput
                  label="Preferred Return to LP"
                  value={waterfall.preferredReturn}
                  onChange={(v) => setW('preferredReturn', v)}
                  suffix="%"
                  decimals={2}
                  step={0.25}
                  hint="Annual cumulative preferred return"
                />
              </div>
              {equitySumError && (
                <p className="mt-2 text-xs text-red-600 font-medium">
                  LP + GP equity must sum to 100% (currently {fmtPct(equitySum)}).
                </p>
              )}
            </div>

            {/* Catch-Up */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer w-fit">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-indigo-600"
                  checked={waterfall.catchUp}
                  onChange={(e) => setW('catchUp', e.target.checked)}
                />
                <span className="input-label mb-0">GP Catch-Up Provision</span>
              </label>
              {waterfall.catchUp && (
                <div className="ml-6 mt-3">
                  <NumberInput
                    label="GP Catch-Up %"
                    value={waterfall.catchUpPct}
                    onChange={(v) => setW('catchUpPct', v)}
                    suffix="%"
                    decimals={1}
                    step={1}
                    hint="% of distributions directed to GP in catch-up tier"
                    className="max-w-xs"
                  />
                </div>
              )}
            </div>

            {/* IRR Tier Structure */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">IRR Tier Structure</p>
              <table className="pro-table">
                <thead>
                  <tr>
                    <th>Tier</th>
                    <th>IRR Hurdle (up to)</th>
                    <th>LP Split</th>
                    <th>GP Split</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Tier 1 */}
                  <tr>
                    <td className="font-medium">Tier 1</td>
                    <td>
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          className="input-field pr-8 w-24"
                          value={waterfall.tier1Hurdle}
                          step={0.5}
                          min={0}
                          onChange={(e) => setW('tier1Hurdle', parseFloat(e.target.value) || 0)}
                        />
                        <span className="absolute right-2 text-gray-400 text-xs">%</span>
                      </div>
                    </td>
                    <td>
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          className="input-field pr-8 w-24"
                          value={waterfall.tier1Split}
                          step={1}
                          min={0}
                          max={100}
                          onChange={(e) => setW('tier1Split', parseFloat(e.target.value) || 0)}
                        />
                        <span className="absolute right-2 text-gray-400 text-xs">%</span>
                      </div>
                    </td>
                    <td className="font-mono text-gray-500">{fmtPct(100 - waterfall.tier1Split)}</td>
                  </tr>
                  {/* Tier 2 */}
                  <tr>
                    <td className="font-medium">Tier 2</td>
                    <td>
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          className="input-field pr-8 w-24"
                          value={waterfall.tier2Hurdle}
                          step={0.5}
                          min={0}
                          onChange={(e) => setW('tier2Hurdle', parseFloat(e.target.value) || 0)}
                        />
                        <span className="absolute right-2 text-gray-400 text-xs">%</span>
                      </div>
                    </td>
                    <td>
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          className="input-field pr-8 w-24"
                          value={waterfall.tier2Split}
                          step={1}
                          min={0}
                          max={100}
                          onChange={(e) => setW('tier2Split', parseFloat(e.target.value) || 0)}
                        />
                        <span className="absolute right-2 text-gray-400 text-xs">%</span>
                      </div>
                    </td>
                    <td className="font-mono text-gray-500">{fmtPct(100 - waterfall.tier2Split)}</td>
                  </tr>
                  {/* Tier 3 */}
                  <tr>
                    <td className="font-medium">Tier 3</td>
                    <td>
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          className="input-field pr-8 w-24"
                          value={waterfall.tier3Hurdle}
                          step={0.5}
                          min={0}
                          onChange={(e) => setW('tier3Hurdle', parseFloat(e.target.value) || 0)}
                        />
                        <span className="absolute right-2 text-gray-400 text-xs">%</span>
                      </div>
                    </td>
                    <td>
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          className="input-field pr-8 w-24"
                          value={waterfall.tier3Split}
                          step={1}
                          min={0}
                          max={100}
                          onChange={(e) => setW('tier3Split', parseFloat(e.target.value) || 0)}
                        />
                        <span className="absolute right-2 text-gray-400 text-xs">%</span>
                      </div>
                    </td>
                    <td className="font-mono text-gray-500">{fmtPct(100 - waterfall.tier3Split)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* GP Fees */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">GP Fees</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <NumberInput
                  label="Acquisition Fee to GP (% of purchase)"
                  value={waterfall.acquisitionFeeToGP}
                  onChange={(v) => setW('acquisitionFeeToGP', v)}
                  suffix="%"
                  decimals={2}
                  step={0.25}
                />
                <NumberInput
                  label="Asset Management Fee (% of EGI/yr)"
                  value={waterfall.assetMgmtFee}
                  onChange={(v) => setW('assetMgmtFee', v)}
                  suffix="%"
                  decimals={2}
                  step={0.1}
                />
                <NumberInput
                  label="Disposition Fee (% of sale)"
                  value={waterfall.dispositionFee}
                  onChange={(v) => setW('dispositionFee', v)}
                  suffix="%"
                  decimals={2}
                  step={0.25}
                />
              </div>
            </div>

            {/* Waterfall Diagram */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Distribution Waterfall Flow
              </p>
              <table className="pro-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Tier / Event</th>
                    <th>Condition</th>
                    <th>LP Receives</th>
                    <th>GP Receives</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-mono text-gray-400">1</td>
                    <td>Return of Capital</td>
                    <td>Until LP capital returned</td>
                    <td>100%</td>
                    <td>0%</td>
                  </tr>
                  <tr>
                    <td className="font-mono text-gray-400">2</td>
                    <td>Preferred Return</td>
                    <td>Until LP earns {fmtPct(waterfall.preferredReturn)} pref</td>
                    <td>100%</td>
                    <td>0%</td>
                  </tr>
                  {waterfall.catchUp && (
                    <tr>
                      <td className="font-mono text-gray-400">3</td>
                      <td>GP Catch-Up</td>
                      <td>Until GP is caught up</td>
                      <td>{fmtPct(100 - waterfall.catchUpPct)}</td>
                      <td>{fmtPct(waterfall.catchUpPct)}</td>
                    </tr>
                  )}
                  <tr>
                    <td className="font-mono text-gray-400">{waterfall.catchUp ? 4 : 3}</td>
                    <td>Tier 1 Promote</td>
                    <td>IRR up to {fmtPct(waterfall.tier1Hurdle)}</td>
                    <td>{fmtPct(waterfall.tier1Split)}</td>
                    <td>{fmtPct(100 - waterfall.tier1Split)}</td>
                  </tr>
                  <tr>
                    <td className="font-mono text-gray-400">{waterfall.catchUp ? 5 : 4}</td>
                    <td>Tier 2 Promote</td>
                    <td>IRR {fmtPct(waterfall.tier1Hurdle)} – {fmtPct(waterfall.tier2Hurdle)}</td>
                    <td>{fmtPct(waterfall.tier2Split)}</td>
                    <td>{fmtPct(100 - waterfall.tier2Split)}</td>
                  </tr>
                  <tr>
                    <td className="font-mono text-gray-400">{waterfall.catchUp ? 6 : 5}</td>
                    <td>Tier 3 Promote</td>
                    <td>IRR above {fmtPct(waterfall.tier2Hurdle)}</td>
                    <td>{fmtPct(waterfall.tier3Split)}</td>
                    <td>{fmtPct(100 - waterfall.tier3Split)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
