'use client'

import { useRouter } from 'next/navigation'
import {
  Building2, ArrowRight, TrendingUp, Shield, BarChart3,
  FileText, Percent, DollarSign, Calculator, Layers,
} from 'lucide-react'

export default function LandingPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Navigation ─────────────────────────────────── */}
      <nav
        className="sticky top-0 z-50 border-b border-blue-900"
        style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5282 100%)' }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">ProForma AI</span>
          </div>
          <button onClick={() => router.push('/proforma')} className="btn-primary text-sm">
            Open Pro Forma <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #1e3a5f 0%, #2d5282 55%, #1a365d 100%)' }}
      >
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 40px,rgba(255,255,255,.3) 40px,rgba(255,255,255,.3) 41px),repeating-linear-gradient(90deg,transparent,transparent 40px,rgba(255,255,255,.3) 40px,rgba(255,255,255,.3) 41px)',
        }} />
        <div className="relative max-w-7xl mx-auto px-6 py-28 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 mb-8">
            <Calculator className="w-4 h-4 text-yellow-300" />
            <span className="text-sm text-white/90 font-medium">Institutional-Grade Underwriting</span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6 leading-tight tracking-tight">
            Real Estate Pro Forma<br />
            <span style={{ color: '#c9a84c' }}>Built for Professionals</span>
          </h1>
          <p className="text-xl text-blue-200 max-w-3xl mx-auto mb-12 leading-relaxed">
            Every metric a Wells Fargo underwriter expects — input every data point manually
            with our exhaustive field library covering income, expenses, debt, taxes, and returns.
          </p>
          <button onClick={() => router.push('/proforma')} className="btn-primary text-lg px-10 py-4 rounded-xl shadow-xl">
            Launch Pro Forma Builder <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Every Input. Every Metric.</h2>
        <p className="text-center text-gray-500 mb-12 max-w-2xl mx-auto">
          Eight comprehensive input tabs covering every conceivable data point — from unit mix and rent roll
          to LP/GP waterfall structures and cost segregation studies.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f) => (
            <div key={f.title} className="card p-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: '#eef3fb' }}>
                <f.icon className="w-5 h-5" style={{ color: '#1e3a5f' }} />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-3">{f.description}</p>
              <ul className="space-y-1">
                {f.fields.map((field) => (
                  <li key={field} className="text-xs text-gray-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                    {field}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── Metrics Ticker ─────────────────────────────── */}
      <section className="bg-gray-900 py-14">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-xl font-bold text-white text-center mb-8 uppercase tracking-widest">
            Every metric calculated automatically
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {metrics.map((m) => (
              <div key={m} className="text-center px-3 py-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">{m}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────── */}
      <section className="py-20 text-center">
        <div className="max-w-xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to underwrite?</h2>
          <p className="text-gray-500 mb-8">Build a complete institutional pro forma. Export to Excel with live formulas or PDF for your lender.</p>
          <button onClick={() => router.push('/proforma')} className="btn-primary text-base px-10 py-4 rounded-xl shadow-lg">
            Launch Pro Forma Builder <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      <footer className="border-t border-gray-200 py-8 text-center text-sm text-gray-400">
        <div className="flex items-center justify-center gap-2">
          <Building2 className="w-4 h-4" />
          ProForma AI — For analytical purposes only. Not investment advice.
        </div>
      </footer>
    </div>
  )
}

const features = [
  {
    icon: Building2, title: 'Property & Market',
    description: 'Complete physical, zoning, and market-level data.',
    fields: ['APN, zoning, flood zone', 'Construction type & class', 'Amenities & utilities setup', 'Walk/transit/bike scores', 'Submarket & MSA data'],
  },
  {
    icon: DollarSign, title: 'Acquisition & Costs',
    description: 'Every closing cost and transaction expense.',
    fields: ['Purchase price & broker fee', 'Due diligence & legal fees', 'Acquisition fee (sponsor)', 'Working capital reserve', 'Organization costs'],
  },
  {
    icon: Layers, title: 'Financing Structure',
    description: 'Full multi-tranche capital stack with term sheet details.',
    fields: ['Senior, mezz, pref equity', 'IO periods & balloon terms', 'Origination & exit fees', 'Rate caps (floating rate)', 'Recourse & guarantee type'],
  },
  {
    icon: TrendingUp, title: 'Income Analysis',
    description: 'Every revenue stream individually tracked.',
    fields: ['Unit mix & full rent roll', 'RUBS, pet fees, storage', 'Retail & commercial tenants', 'Short-term rental income', 'Lease expiration schedule'],
  },
  {
    icon: FileText, title: 'Operating Expenses',
    description: '30+ expense categories, each individually adjustable.',
    fields: ['All utility sub-categories', '5-type insurance breakdown', 'Payroll & benefits detail', 'Contract services line items', 'BID, permits, license fees'],
  },
  {
    icon: Shield, title: 'Tax & Waterfall',
    description: 'LP/GP structure, depreciation, after-tax returns.',
    fields: ['Pref return & GP promote', 'Cost segregation benefits', 'Depreciation recapture', 'Federal + state tax layers', '1031 exchange modeling'],
  },
  {
    icon: BarChart3, title: 'Returns & Sensitivity',
    description: 'Full returns suite with multi-scenario stress testing.',
    fields: ['IRR, NPV, equity multiple', 'Cash-on-cash by year', 'Cap rate sensitivity grid', 'Vacancy × rent growth grid', 'Best/base/worst scenarios'],
  },
  {
    icon: Percent, title: 'Capital Plan',
    description: 'Renovation budget and full CapEx schedule.',
    fields: ['Unit reno cost per unit', 'Exterior & common areas', 'Roof, HVAC, plumbing', 'Year-by-year schedule', 'Replacement reserve analysis'],
  },
]

const metrics = [
  'Cap Rate', 'IRR', 'Cash-on-Cash', 'DSCR', 'NPV', 'Equity Multiple',
  'NOI', 'BTCF', 'ATCF', 'GRM', 'LTV', 'Break-Even Occ.',
  'Price/Unit', 'Price/SF', 'NOI/Unit', 'NOI/SF', 'Loan Constant', 'Balloon',
  'Pref. Return', 'LP IRR', 'GP Promote', 'Depreciation', 'Tax Shield', 'CoC',
]
