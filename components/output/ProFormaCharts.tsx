'use client'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine, Area, AreaChart,
  ComposedChart,
} from 'recharts'
import type { ProFormaOutput } from '@/types/proforma'
import { fmt$ } from '@/lib/utils'

interface Props { output: ProFormaOutput }

const NAVY = '#1e3a5f'
const GOLD = '#c9a84c'
const GREEN = '#16a34a'
const RED = '#dc2626'
const TEAL = '#0d9488'
const PURPLE = '#7c3aed'

export function ProFormaCharts({ output }: Props) {
  const cashFlowData = output.annualCashFlows.map((cf) => ({
    year: `Yr ${cf.year}`,
    GPR: cf.gpr,
    EGI: cf.egi,
    NOI: cf.noi,
    BTCF: cf.btcf,
    ATCF: cf.atcf,
    DebtService: cf.debtService,
  }))

  const returnData = output.annualCashFlows.map((cf) => ({
    year: `Yr ${cf.year}`,
    'Cash-on-Cash': +(cf.cocReturn * 100).toFixed(2),
    'Cap Rate': +(cf.capRate * 100).toFixed(2),
  }))

  const stackData = output.annualCashFlows.map((cf) => ({
    year: `Yr ${cf.year}`,
    NOI: cf.noi,
    'Debt Service': cf.debtService,
    BTCF: cf.btcf,
  }))

  const cumulativeData = (() => {
    let cum = -output.totalEquity
    return output.annualCashFlows.map((cf) => {
      cum += cf.atcf + cf.saleProceeds
      return { year: `Yr ${cf.year}`, Cumulative: +cum.toFixed(0) }
    })
  })()

  const dscrData = output.annualCashFlows.map((cf) => ({
    year: `Yr ${cf.year}`,
    DSCR: cf.dscr >= 900 ? null : +cf.dscr.toFixed(3),
  }))

  const equityData = output.annualCashFlows.map((cf) => ({
    year: `Yr ${cf.year}`,
    'Beginning Equity': +cf.beginningEquity.toFixed(0),
    'ATCF': +cf.atcf.toFixed(0),
  }))

  const hasDebt = output.loanSummaries.length > 0

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* NOI vs Debt Service */}
      <div className="card p-5">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">
          NOI vs Debt Service
        </h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={stackData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: number) => fmt$(v)} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="NOI" fill={NAVY} radius={[3, 3, 0, 0]} />
            {hasDebt && <Bar dataKey="Debt Service" fill={GOLD} radius={[3, 3, 0, 0]} />}
            <Bar dataKey="BTCF" fill={GREEN} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* GPR → EGI → NOI → BTCF Trend */}
      <div className="card p-5">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">
          GPR → EGI → NOI → BTCF Trend
        </h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={cashFlowData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: number) => fmt$(v)} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="GPR" stroke={NAVY} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="EGI" stroke={TEAL} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="NOI" stroke={GREEN} strokeWidth={2.5} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="BTCF" stroke={GOLD} strokeWidth={2} strokeDasharray="5 3" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Cash-on-Cash & Cap Rate */}
      <div className="card p-5">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">
          Cash-on-Cash vs Going-In Cap Rate (%)
        </h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={returnData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(v) => v + '%'} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: number) => v.toFixed(2) + '%'} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <ReferenceLine y={0} stroke={RED} strokeDasharray="3 3" />
            <Line type="monotone" dataKey="Cash-on-Cash" stroke={GOLD} strokeWidth={2.5} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="Cap Rate" stroke={NAVY} strokeWidth={2} strokeDasharray="5 3" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Cumulative Return */}
      <div className="card p-5">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">
          Cumulative Return (incl. sale)
        </h3>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={cumulativeData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="cumGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={GREEN} stopOpacity={0.15} />
                <stop offset="95%" stopColor={GREEN} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: number) => fmt$(v)} />
            <ReferenceLine y={0} stroke={RED} strokeDasharray="4 2" label={{ value: 'Break-Even', position: 'right', fontSize: 10 }} />
            <Area
              type="monotone"
              dataKey="Cumulative"
              stroke={GREEN}
              strokeWidth={2.5}
              fill="url(#cumGradient)"
              dot={{ r: 3, fill: GREEN }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* DSCR Timeline */}
      {hasDebt && (
        <div className="card p-5">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">
            DSCR by Year — Lender Covenant (1.25x min)
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={dscrData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => v + 'x'} tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
              <Tooltip formatter={(v: number) => v.toFixed(2) + 'x'} />
              <ReferenceLine y={1.25} stroke={RED} strokeDasharray="5 3"
                label={{ value: '1.25x min', position: 'right', fontSize: 10, fill: RED }} />
              <ReferenceLine y={1.20} stroke={GOLD} strokeDasharray="3 3"
                label={{ value: '1.20x floor', position: 'right', fontSize: 10, fill: GOLD }} />
              <Bar dataKey="DSCR" fill={NAVY} radius={[3, 3, 0, 0]} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Equity Build-Up */}
      <div className="card p-5">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">
          Equity Position Build-Up
        </h3>
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={equityData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: number) => fmt$(v)} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <defs>
              <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={PURPLE} stopOpacity={0.2} />
                <stop offset="95%" stopColor={PURPLE} stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="Beginning Equity"
              stroke={PURPLE}
              strokeWidth={2.5}
              fill="url(#equityGradient)"
              dot={{ r: 3, fill: PURPLE }}
            />
            <Bar dataKey="ATCF" fill={GREEN} radius={[3, 3, 0, 0]} opacity={0.8} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
