'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import {
  Building2, ChevronLeft, ChevronRight, Loader2, RefreshCw,
  BarChart3, FileSpreadsheet, Printer, ArrowRight, CheckCircle,
  TrendingUp, DollarSign, Percent, Shield,
} from 'lucide-react'

import type { ProFormaInput } from '@/types/proforma'
import { defaultProFormaInput, calculateProForma } from '@/lib/calculations'
import { fmt$, fmtPct, fmtNum } from '@/lib/utils'

import { PropertyDetailsSection }     from '@/components/wizard/PropertyDetails'
import { AcquisitionFinancingSection } from '@/components/wizard/AcquisitionFinancing'
import { IncomeSectionWizard }         from '@/components/wizard/IncomeSection'
import { OperatingExpensesSection }    from '@/components/wizard/OperatingExpenses'
import { ExitAssumptionsSection }      from '@/components/wizard/ExitAssumptions'

import { ExecutiveSummary }    from '@/components/output/ExecutiveSummary'
import { FullIncomeStatement } from '@/components/output/FullIncomeStatement'
import { ReturnsAnalysis }     from '@/components/output/ReturnsAnalysis'
import { DebtAnalysis }        from '@/components/output/DebtAnalysis'
import { SensitivityMatrix }   from '@/components/output/SensitivityMatrix'
import { ProFormaCharts }      from '@/components/output/ProFormaCharts'
import { ExportButtons }       from '@/components/ExportButtons'

// ─── Tab definitions ─────────────────────────────────────────────────────────
const INPUT_TABS = [
  { id: 'property',    label: '1. Property' },
  { id: 'acquisition', label: '2. Acquisition' },
  { id: 'income',      label: '3. Income' },
  { id: 'expenses',    label: '4. Expenses' },
  { id: 'exit',        label: '5. Exit & CapEx' },
]

const OUTPUT_TABS = [
  { id: 'summary',          label: 'Executive Summary' },
  { id: 'income-statement', label: 'Income Statement' },
  { id: 'returns',          label: 'Returns' },
  { id: 'debt',             label: 'Debt Analysis' },
  { id: 'sensitivity',      label: 'Sensitivity' },
  { id: 'charts',           label: 'Charts' },
]

// ─── Main page ────────────────────────────────────────────────────────────────
function ProFormaContent() {
  const [input, setInput]               = useState<ProFormaInput>(defaultProFormaInput)
  const [activeInputTab, setActiveInputTab]   = useState('property')
  const [activeOutputTab, setActiveOutputTab] = useState('summary')
  const [mode, setMode]                 = useState<'input' | 'output'>('input')

  // Live calculation (never crashes the UI)
  const output = (() => {
    try { return calculateProForma(input) } catch { return null }
  })()

  // Derived helpers
  const gpr = input.property.unitMix.reduce((s, u) => s + u.unitCount * u.marketRent * 12, 0)
  const egi = output?.year1.egi ?? 0
  const currentIdx  = INPUT_TABS.findIndex((t) => t.id === activeInputTab)
  const canGoBack   = currentIdx > 0
  const canGoNext   = currentIdx < INPUT_TABS.length - 1
  const isLastTab   = currentIdx === INPUT_TABS.length - 1

  // Switch to results
  function viewResults() {
    setMode('output')
    setActiveOutputTab('summary')
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">

      {/* ── Navigation ───────────────────────────────── */}
      <nav
        className="sticky top-0 z-50 border-b border-blue-900 no-print"
        style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5282 100%)' }}
      >
        <div className="max-w-[1400px] mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
              <Building2 className="w-5 h-5 flex-shrink-0" />
              <span className="font-bold text-sm hidden sm:block">ProForma AI</span>
            </Link>
            <span className="text-white/30 hidden sm:block">›</span>
            <span className="text-white/80 text-sm truncate max-w-[160px] sm:max-w-xs">
              {input.property.propertyName || 'New Pro Forma'}
            </span>
          </div>

          {/* Centre mode switcher */}
          <div className="flex items-center rounded-lg overflow-hidden border border-white/20 text-xs font-semibold">
            <button
              onClick={() => setMode('input')}
              className={`px-3 py-1.5 transition-all ${
                mode === 'input'
                  ? 'bg-white text-blue-900'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              ✏️ Inputs
            </button>
            <button
              onClick={viewResults}
              className={`px-3 py-1.5 transition-all flex items-center gap-1.5 ${
                mode === 'output'
                  ? 'bg-white text-blue-900'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              📊 Pro Forma
              {output && (
                <span className="bg-green-500 text-white rounded-full w-1.5 h-1.5 inline-block" />
              )}
            </button>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {output && mode === 'output' && (
              <div className="hidden md:flex items-center gap-3 text-xs text-white/60 mr-2">
                <span>IRR <strong className="text-green-300">{output.irr.toFixed(1)}%</strong></span>
                <span>NOI <strong className="text-white">${(output.year1.noi/1000).toFixed(0)}k</strong></span>
                <span>DSCR <strong className={output.year1.dscr < 1.25 ? 'text-red-300' : 'text-white'}>
                  {output.year1.dscr >= 900 ? 'N/A' : output.year1.dscr.toFixed(2)+'x'}
                </strong></span>
              </div>
            )}
            {output && <ExportButtons input={input} output={output} />}
          </div>
        </div>
      </nav>

      {/* ── INPUT MODE ───────────────────────────────── */}
      {mode === 'input' && (
        <div className="flex-1 max-w-[900px] mx-auto w-full px-4 py-6 flex flex-col gap-0">

          {/* Live KPI bar (shows even in input mode once data exists) */}
          {output && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <KpiChip icon={TrendingUp} label="IRR"      value={fmtPct(output.irr)}              color="#16a34a" />
              <KpiChip icon={BarChart3}  label="Eq. Mult" value={output.equityMultiple.toFixed(2)+'x'} color="#1e3a5f" />
              <KpiChip icon={DollarSign} label="Yr 1 NOI" value={fmt$(output.year1.noi)}          color="#7c3aed" />
              <KpiChip icon={Shield}     label="DSCR"     value={output.year1.dscr >= 900 ? 'N/A' : fmtNum(output.year1.dscr)+'x'}
                color={output.year1.dscr < 1.25 ? '#dc2626' : '#16a34a'} />
            </div>
          )}

          {/* Input card */}
          <div className="card flex flex-col">
            {/* Tab bar */}
            <div className="border-b border-gray-100 px-4 pt-3 overflow-x-auto">
              <div className="flex gap-0.5 min-w-max">
                {INPUT_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveInputTab(tab.id)}
                    className={`tab-btn text-xs ${activeInputTab === tab.id ? 'active' : ''}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto p-5" style={{ maxHeight: 'calc(100vh - 280px)' }}>
              {activeInputTab === 'property' && (
                <PropertyDetailsSection
                  data={input.property}
                  onChange={(p) => setInput({ ...input, property: p })}
                />
              )}
              {activeInputTab === 'acquisition' && (
                <AcquisitionFinancingSection
                  acquisition={input.acquisition}
                  financing={input.financing}
                  onAcquisitionChange={(a) => setInput({ ...input, acquisition: a })}
                  onFinancingChange={(f) => setInput({ ...input, financing: f })}
                />
              )}
              {activeInputTab === 'income' && (
                <IncomeSectionWizard
                  data={input.income}
                  gpr={gpr}
                  totalUnits={input.property.totalUnits}
                  onChange={(inc) => setInput({ ...input, income: inc })}
                />
              )}
              {activeInputTab === 'expenses' && (
                <OperatingExpensesSection
                  data={input.expenses}
                  egi={egi}
                  onChange={(exp) => setInput({ ...input, expenses: exp })}
                />
              )}
              {activeInputTab === 'exit' && (
                <ExitAssumptionsSection
                  exit={input.exit}
                  capex={input.capex}
                  purchasePrice={input.acquisition.purchasePrice}
                  onExitChange={(e) => setInput({ ...input, exit: e })}
                  onCapExChange={(c) => setInput({ ...input, capex: c })}
                />
              )}
            </div>

            {/* Footer nav */}
            <div className="border-t border-gray-100 px-4 py-3 flex justify-between items-center no-print">
              <button
                disabled={!canGoBack}
                onClick={() => setActiveInputTab(INPUT_TABS[currentIdx - 1].id)}
                className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Back
              </button>

              <button
                onClick={() => setInput(defaultProFormaInput())}
                className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
              >
                <RefreshCw className="w-3 h-3" /> Reset
              </button>

              {isLastTab ? (
                /* Last tab → big CTA to see results */
                <button
                  onClick={viewResults}
                  disabled={!output}
                  className="btn-primary text-xs py-1.5 px-4 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {output ? (
                    <>View Pro Forma <ArrowRight className="w-3.5 h-3.5" /></>
                  ) : (
                    <>Fill in required fields</>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => setActiveInputTab(INPUT_TABS[currentIdx + 1].id)}
                  className="btn-primary text-xs py-1.5 px-3"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Floating "View Pro Forma" banner (shows once output is ready) */}
          {output && (
            <button
              onClick={viewResults}
              className="mt-4 w-full flex items-center justify-between px-5 py-4 rounded-xl text-white shadow-lg transition-all hover:opacity-95 no-print"
              style={{ background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)' }}
            >
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5" />
                <div className="text-left">
                  <p className="font-bold text-sm">Pro Forma Ready</p>
                  <p className="text-xs text-green-100 mt-0.5">
                    IRR {output.irr.toFixed(1)}% · NOI {fmt$(output.year1.noi)} · EM {output.equityMultiple.toFixed(2)}x
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold">
                View Full Pro Forma <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          )}
        </div>
      )}

      {/* ── OUTPUT MODE ──────────────────────────────── */}
      {mode === 'output' && (
        <div className="flex-1 max-w-[1400px] mx-auto w-full px-4 py-6 flex flex-col gap-4">

          {!output ? (
            <div className="card p-16 text-center flex flex-col items-center gap-4">
              <BarChart3 className="w-10 h-10 text-gray-300" />
              <p className="font-semibold text-gray-600">No data to display yet.</p>
              <p className="text-sm text-gray-400">Go back to the Inputs tab and fill in your property details.</p>
              <button onClick={() => setMode('input')} className="btn-primary mt-2">
                <ChevronLeft className="w-4 h-4" /> Go to Inputs
              </button>
            </div>
          ) : (
            <>
              {/* Output header with export buttons */}
              <div className="flex flex-wrap items-center justify-between gap-4 no-print">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {input.property.propertyName || 'Pro Forma'} — Investment Analysis
                  </h1>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {input.property.totalUnits} units ·{' '}
                    {input.property.address || 'Address not set'} ·{' '}
                    {input.exit.holdingPeriodYears}-year hold
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setMode('input')}
                    className="btn-secondary text-sm"
                  >
                    <ChevronLeft className="w-4 h-4" /> Edit Inputs
                  </button>
                  <ExportButtons input={input} output={output} />
                </div>
              </div>

              {/* Key metrics summary bar */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 no-print">
                {[
                  { label: 'IRR', value: fmtPct(output.irr), color: '#16a34a' },
                  { label: 'Equity Multiple', value: output.equityMultiple.toFixed(2)+'x', color: '#1e3a5f' },
                  { label: 'Avg Cash-on-Cash', value: fmtPct(output.averageCoCReturn), color: '#d97706' },
                  { label: 'Year 1 NOI', value: fmt$(output.year1.noi), color: '#7c3aed' },
                  { label: 'DSCR', value: output.year1.dscr >= 900 ? 'N/A' : fmtNum(output.year1.dscr)+'x',
                    color: output.year1.dscr < 1.25 ? '#dc2626' : '#16a34a' },
                  { label: 'Exit Value', value: fmt$(output.exitPrice), color: '#0d9488' },
                ].map((m) => (
                  <div key={m.label} className="bg-white rounded-xl border border-gray-200 px-4 py-3 text-center shadow-sm">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{m.label}</p>
                    <p className="text-lg font-bold font-mono" style={{ color: m.color }}>{m.value}</p>
                  </div>
                ))}
              </div>

              {/* Output tab navigation */}
              <div className="tab-nav overflow-x-auto no-print">
                {OUTPUT_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveOutputTab(tab.id)}
                    className={`tab-btn ${activeOutputTab === tab.id ? 'active' : ''}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="pb-8">
                {activeOutputTab === 'summary'          && <ExecutiveSummary    input={input} output={output} />}
                {activeOutputTab === 'income-statement' && <FullIncomeStatement input={input} output={output} />}
                {activeOutputTab === 'returns'          && <ReturnsAnalysis     input={input} output={output} />}
                {activeOutputTab === 'debt'             && <DebtAnalysis        input={input} output={output} />}
                {activeOutputTab === 'sensitivity'      && <SensitivityMatrix   output={output} />}
                {activeOutputTab === 'charts'           && <ProFormaCharts      output={output} />}
              </div>

              {/* Bottom export bar */}
              <div
                className="sticky bottom-0 border-t border-gray-200 bg-white/95 backdrop-blur-sm px-6 py-4
                           flex flex-wrap items-center justify-between gap-4 no-print"
              >
                <div className="text-sm text-gray-600">
                  <strong>{input.property.propertyName || 'Pro Forma'}</strong> —
                  ready to export
                </div>
                <div className="flex items-center gap-3">
                  <ExportButtons input={input} output={output} />
                  <button onClick={() => window.print()} className="btn-secondary text-sm">
                    <Printer className="w-4 h-4" /> Print / PDF
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── KPI chip (used in input mode) ───────────────────────────────────────────
function KpiChip({
  icon: Icon, label, value, color,
}: { icon: React.ElementType; label: string; value: string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
           style={{ background: color + '18' }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 uppercase tracking-wide leading-none mb-0.5">{label}</p>
        <p className="font-bold font-mono text-sm text-gray-900 truncate">{value}</p>
      </div>
    </div>
  )
}

// ─── Page wrapper with Suspense ───────────────────────────────────────────────
export default function ProFormaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading pro forma builder…</p>
        </div>
      </div>
    }>
      <ProFormaContent />
    </Suspense>
  )
}
