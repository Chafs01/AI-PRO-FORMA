/**
 * ProForma AI — Excel Workbook Builder
 *
 * Wall Street / A.CRE industry-standard conventions:
 *   Blue text   (#0070C0) = hardcoded inputs the user changes
 *   Black text  (#000000) = formulas / calculated values
 *   Navy header (#1E3A5F) = section title rows (white text, merged full-width)
 *   Light blue  (#DCE6F1) = column header rows
 *   White       (#FFFFFF) = normal data rows
 *   Light grey  (#F2F2F2) = total / subtotal rows
 *
 * No sheet gridlines. Freeze panes on year-header rows.
 * Print: landscape, fit-to-width on wide sheets.
 */

// @ts-ignore — xlsx-js-style types not published; works at runtime
import XLSXStyle from 'xlsx-js-style'
import type { ProFormaInput, ProFormaOutput } from '@/types/proforma'

// ─── Type aliases ─────────────────────────────────────────────────────────────
type WS = ReturnType<typeof XLSXStyle.utils.aoa_to_sheet>
type WB = ReturnType<typeof XLSXStyle.utils.book_new>
type Cell = Record<string, unknown>

// ─── Number format strings ───────────────────────────────────────────────────
const FMT_CURRENCY  = '_(* #,##0_);_(* (#,##0);_(* "-"_);_(@_)'
const FMT_CURRENCY2 = '_(* #,##0.00_);_(* (#,##0.00);_(* "-"??_);_(@_)'
const FMT_PCT       = '0.0%'
const FMT_PCT2      = '0.00%'
const FMT_MULTIPLE  = '0.00"x"'
const FMT_INT       = '#,##0'
const FMT_YEAR      = '"Year "0'

// ─── Color constants ──────────────────────────────────────────────────────────
const C = {
  NAVY:        '1E3A5F',   // section header bg
  NAVY2:       '2D5282',   // year-header bg
  LIGHT_BLUE:  'BDD7EE',   // column sub-header bg
  PALE_BLUE:   'DEEAF1',   // light alternate bg
  WHITE:       'FFFFFF',
  BLACK:       '000000',
  BLUE_INPUT:  '0070C0',   // user-input text (A.CRE standard)
  TOTAL_BG:    'F2F2F2',   // total row background
  BORDER:      'D9D9D9',   // thin border color
  GREEN_HEAT:  'C6EFCE',
  YELLOW_HEAT: 'FFEB9C',
  RED_HEAT:    'FFC7CE',
  GREEN_TEXT:  '375623',
  RED_TEXT:    '9C0006',
}

// ─── Cell factory functions ───────────────────────────────────────────────────

/** Section header cell — always used with a full-width merge */
function secHdr(text: string, bg = C.NAVY): Cell {
  return {
    v: text, t: 's',
    s: {
      font: { name: 'Calibri Light', bold: true, sz: 12, color: { rgb: C.WHITE } },
      fill: { fgColor: { rgb: bg } },
      alignment: { horizontal: 'left', vertical: 'center', indent: 1 },
      border: {},
    },
  }
}

/** Fill cell for the merged portion of a section header row */
function secFill(bg = C.NAVY): Cell {
  return { v: '', t: 's', s: { fill: { fgColor: { rgb: bg } }, border: {} } }
}

/** Column sub-header cell (text) */
function colHdr(text: string, align: 'left' | 'right' | 'center' = 'left'): Cell {
  return {
    v: text, t: 's',
    s: {
      font: { name: 'Calibri', bold: true, sz: 10, color: { rgb: C.BLACK } },
      fill: { fgColor: { rgb: C.LIGHT_BLUE } },
      alignment: { horizontal: align, vertical: 'center' },
      border: bThin(),
    },
  }
}

/** Column sub-header cell (number value) */
function colHdrN(v: number, z: string): Cell {
  return {
    v, t: 'n', z,
    s: {
      font: { name: 'Calibri', bold: true, sz: 10, color: { rgb: C.BLACK } },
      fill: { fgColor: { rgb: C.LIGHT_BLUE } },
      alignment: { horizontal: 'right', vertical: 'center' },
      border: bThin(),
    },
  }
}

/** Year column header */
function yrHdr(year: number): Cell {
  return {
    v: year, t: 'n', z: FMT_YEAR,
    s: {
      font: { name: 'Calibri', bold: true, sz: 10, color: { rgb: C.WHITE } },
      fill: { fgColor: { rgb: C.NAVY2 } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: bThin(),
    },
  }
}

/** Data row — label cell */
function dLabel(text: string, indent = 0): Cell {
  return {
    v: text, t: 's',
    s: {
      font: { name: 'Calibri', sz: 10, color: { rgb: C.BLACK } },
      fill: { fgColor: { rgb: C.WHITE } },
      alignment: { horizontal: 'left', vertical: 'center', indent },
      border: bThin(),
    },
  }
}

/** Data row — number value */
function dNum(v: number, z: string, isInput = false): Cell {
  return {
    v, t: 'n', z,
    s: {
      font: { name: 'Calibri', sz: 10, color: { rgb: isInput ? C.BLUE_INPUT : C.BLACK } },
      fill: { fgColor: { rgb: C.WHITE } },
      alignment: { horizontal: 'right', vertical: 'center' },
      border: bThin(),
    },
  }
}

/** Data row — text value */
function dText(v: string, isInput = false): Cell {
  return {
    v, t: 's',
    s: {
      font: { name: 'Calibri', sz: 10, color: { rgb: isInput ? C.BLUE_INPUT : C.BLACK } },
      fill: { fgColor: { rgb: C.WHITE } },
      alignment: { horizontal: 'left', vertical: 'center' },
      border: bThin(),
    },
  }
}

/** Total / subtotal row — label */
function totLabel(text: string): Cell {
  return {
    v: text, t: 's',
    s: {
      font: { name: 'Calibri', bold: true, sz: 10, color: { rgb: C.BLACK } },
      fill: { fgColor: { rgb: C.TOTAL_BG } },
      alignment: { horizontal: 'left', vertical: 'center' },
      border: bThickTop(),
    },
  }
}

/** Total / subtotal row — number */
function totNum(v: number, z: string): Cell {
  return {
    v, t: 'n', z,
    s: {
      font: { name: 'Calibri', bold: true, sz: 10, color: { rgb: C.BLACK } },
      fill: { fgColor: { rgb: C.TOTAL_BG } },
      alignment: { horizontal: 'right', vertical: 'center' },
      border: bThickTop(),
    },
  }
}

/** Empty spacer cell */
function emp(): Cell {
  return { v: '', t: 's', s: { fill: { fgColor: { rgb: C.WHITE } }, border: {} } }
}

/** Thin border on all sides */
function bThin() {
  const side = { style: 'thin', color: { rgb: C.BORDER } }
  return { top: side, bottom: side, left: side, right: side }
}

/** Total row — thick top border, thin others */
function bThickTop() {
  return {
    top:    { style: 'medium', color: { rgb: '595959' } },
    bottom: { style: 'thin',   color: { rgb: C.BORDER } },
    left:   { style: 'thin',   color: { rgb: C.BORDER } },
    right:  { style: 'thin',   color: { rgb: C.BORDER } },
  }
}

// ─── Sheet helpers ────────────────────────────────────────────────────────────

/** Build a full-width section header row: first cell + N-1 fill cells */
function secRow(text: string, totalCols: number, bg = C.NAVY): Cell[] {
  return [secHdr(text, bg), ...Array(totalCols - 1).fill(null).map(() => secFill(bg))]
}

/** Blank spacer row */
function spacer(totalCols: number): Cell[] {
  return Array(totalCols).fill(null).map(() => emp())
}

function setColWidths(ws: WS, widths: number[]) {
  ws['!cols'] = widths.map((w) => ({ wch: w }))
}

function setRowHeights(ws: WS, map: Record<number, number>) {
  ws['!rows'] = ws['!rows'] || []
  for (const [r, h] of Object.entries(map)) {
    ws['!rows'][Number(r)] = { hpt: h }
  }
}

function aoaToSheet(data: unknown[][]): WS {
  return XLSXStyle.utils.aoa_to_sheet(data as Cell[][])
}

/**
 * Scan rows and add a full-width merge for every row that starts with a secHdr cell.
 * A secHdr cell has fill.fgColor.rgb === NAVY or NAVY2.
 */
function addSectionMerges(
  ws: WS,
  rows: unknown[][],
  totalCols: number,
  mergeRowIndices: number[],
) {
  const existing = ws['!merges'] || []
  const newMerges = mergeRowIndices.map((r) => ({
    s: { r, c: 0 },
    e: { r, c: totalCols - 1 },
  }))
  ws['!merges'] = [...existing, ...newMerges]
}

/** Disable gridlines and optionally freeze top N rows */
function setSheetView(ws: WS, freezeRows = 0) {
  const view: Record<string, unknown> = { showGridLines: false }
  if (freezeRows > 0) {
    view.state = 'frozen'
    view.xSplit = 0
    view.ySplit = freezeRows
    view.topLeftCell = `A${freezeRows + 1}`
  }
  ws['!views'] = [view]
}

/** Landscape print, fit to 1 page wide */
function setLandscape(ws: WS) {
  ws['!pageSetup'] = { orientation: 'landscape', fitToWidth: 1, fitToHeight: 0, fitToPage: true, paperSize: 1 }
  ws['!margins'] = { left: 0.5, right: 0.5, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 }
}

/** Portrait print, fit to 1 page wide */
function setPortrait(ws: WS) {
  ws['!pageSetup'] = { orientation: 'portrait', fitToWidth: 1, fitToHeight: 0, fitToPage: true, paperSize: 1 }
  ws['!margins'] = { left: 0.75, right: 0.75, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 }
}

// ─── Main entry point ─────────────────────────────────────────────────────────
export function buildExcelWorkbook(input: ProFormaInput, output: ProFormaOutput): Uint8Array {
  const wb: WB = XLSXStyle.utils.book_new()

  buildSummarySheet(wb, input, output)
  buildCashFlowSheet(wb, input, output)
  buildIncomeSheet(wb, input, output)
  buildExpensesSheet(wb, input, output)
  buildDebtSheet(wb, input, output)
  buildReturnsSheet(wb, output)
  buildSensitivitySheet(wb, output)
  buildInputsSheet(wb, input)

  const buf = XLSXStyle.write(wb, { type: 'array', bookType: 'xlsx' })
  return new Uint8Array(buf)
}

// ─── 1. Executive Summary ─────────────────────────────────────────────────────
function buildSummarySheet(wb: WB, input: ProFormaInput, output: ProFormaOutput) {
  const y1   = output.year1
  const prop = input.property
  const acq  = input.acquisition
  const COLS  = 6   // A-F
  const mergeRows: number[] = []

  const rows: unknown[][] = []

  function sec(text: string, bg = C.NAVY) {
    mergeRows.push(rows.length)
    rows.push(secRow(text, COLS, bg))
  }
  function sp() { rows.push(spacer(COLS)) }

  // ── Title block ──
  mergeRows.push(rows.length)
  rows.push(secRow(`EXECUTIVE SUMMARY  ·  ${prop.propertyName || 'Pro Forma'}`, COLS))
  setRowHeights // applied later

  sp()

  // ── Property & Returns ──
  rows.push([colHdr('Property Information'), colHdr(''), colHdr(''),
             colHdr('Return Metrics'), colHdr(''), colHdr('')])
  rows.push([dLabel('Property Name'),   dText(prop.propertyName || '—', true), emp(),
             dLabel('Levered IRR'),     dNum(output.irr / 100, FMT_PCT2), emp()])
  rows.push([dLabel('Address'),         dText([prop.address, prop.city, prop.state].filter(Boolean).join(', ') || '—', true), emp(),
             dLabel('Equity Multiple'), dNum(output.equityMultiple, FMT_MULTIPLE), emp()])
  rows.push([dLabel('Property Type'),   dText(prop.propertyType, true), emp(),
             dLabel('NPV'),             dNum(output.npv, FMT_CURRENCY), emp()])
  rows.push([dLabel('Year Built'),      dNum(prop.yearBuilt, '0', true), emp(),
             dLabel('Avg. Cash-on-Cash'), dNum(output.averageCoCReturn / 100, FMT_PCT), emp()])
  rows.push([dLabel('Total Units'),     dNum(prop.totalUnits, FMT_INT, true), emp(),
             dLabel('Hold Period'),     dNum(input.exit.holdingPeriodYears, '0 "years"'), emp()])
  sp()

  // ── Capital Stack ──
  sec('CAPITAL STACK')
  rows.push([colHdr('Component'), colHdr('% of Total', 'center'), colHdr('Amount ($)', 'right'),
             colHdr('Year 1 Income'), colHdr(''), colHdr('Amount ($)', 'right')])
  rows.push([dLabel('  Total Debt'),   dNum(output.ltv, FMT_PCT), dNum(output.totalDebt, FMT_CURRENCY),
             dLabel('Gross Pot. Rent'), emp(), dNum(y1.gpr, FMT_CURRENCY)])
  rows.push([dLabel('  Total Equity'), dNum(1 - output.ltv, FMT_PCT), dNum(output.totalEquity, FMT_CURRENCY),
             dLabel('Effective Gross Income'), emp(), dNum(y1.egi, FMT_CURRENCY)])
  rows.push([totLabel('Total Project Cost'), dNum(1, FMT_PCT), totNum(output.totalProjectCost, FMT_CURRENCY),
             totLabel('Net Operating Income'), emp(), totNum(y1.noi, FMT_CURRENCY)])
  sp()

  // ── Valuation & Debt ──
  sec('ACQUISITION & VALUATION', C.NAVY2)
  rows.push([colHdr('Metric'), colHdr(''), colHdr('Value', 'right'),
             colHdr('Debt Metrics — Year 1'), colHdr(''), colHdr('Value', 'right')])
  rows.push([dLabel('Purchase Price'),    emp(), dNum(acq.purchasePrice, FMT_CURRENCY, true),
             dLabel('Year 1 DSCR'),       emp(), dNum(y1.dscr >= 900 ? 0 : y1.dscr, '0.00"x"')])
  rows.push([dLabel('All-In Basis'),      emp(), dNum(output.totalProjectCost, FMT_CURRENCY),
             dLabel('Total Debt Service'), emp(), dNum(y1.debtService, FMT_CURRENCY)])
  rows.push([dLabel('Going-In Cap Rate'), emp(), dNum(output.goingInCapRate / 100, FMT_PCT2),
             dLabel('Before-Tax Cash Flow'), emp(), dNum(y1.btcf, FMT_CURRENCY)])
  rows.push([dLabel('Exit Cap Rate'),     emp(), dNum(output.exitCapRate / 100, FMT_PCT2, true),
             dLabel('Break-Even Occupancy'), emp(), dNum(output.breakEvenOccupancy / 100, FMT_PCT)])
  rows.push([dLabel('Price / Unit'),      emp(), dNum(output.pricePerUnit, FMT_CURRENCY),
             dLabel('NOI / Unit'),         emp(), dNum(output.noiPerUnit, FMT_CURRENCY)])
  rows.push([dLabel('Price / Sq Ft'),     emp(), dNum(output.pricePerSqft, FMT_CURRENCY2),
             dLabel('NOI / Sq Ft'),        emp(), dNum(output.noiPerSqft, FMT_CURRENCY2)])
  rows.push([dLabel('GRM'),               emp(), dNum(output.grm, FMT_MULTIPLE),
             dLabel('Breakeven Occ.'),     emp(), dNum(output.breakEvenOccupancy / 100, FMT_PCT)])
  sp()

  // ── Exit ──
  sec('EXIT ANALYSIS', C.NAVY2)
  rows.push([colHdr('Metric'), colHdr(''), colHdr('Value', 'right'),
             colHdr('Metric'), colHdr(''), colHdr('Value', 'right')])
  rows.push([dLabel('Exit Year NOI'),     emp(), dNum(output.exitNOI, FMT_CURRENCY),
             dLabel('Exit Cap Rate'),     emp(), dNum(output.exitCapRate / 100, FMT_PCT2, true)])
  rows.push([totLabel('Gross Sale Price'), emp(), totNum(output.exitPrice, FMT_CURRENCY),
             dLabel('Selling Costs'),     emp(), dNum(input.exit.sellingCosts / 100, FMT_PCT, true)])

  const ws = aoaToSheet(rows)
  setColWidths(ws, [28, 10, 18, 28, 10, 18])
  setRowHeights(ws, { 0: 24, ...Object.fromEntries(mergeRows.slice(1).map((r) => [r, 20])) })
  addSectionMerges(ws, rows, COLS, mergeRows)
  setSheetView(ws)
  setPortrait(ws)
  XLSXStyle.utils.book_append_sheet(wb, ws, 'Executive Summary')
}

// ─── 2. Annual Cash Flow ──────────────────────────────────────────────────────
function buildCashFlowSheet(wb: WB, _input: ProFormaInput, output: ProFormaOutput) {
  const cfs  = output.annualCashFlows
  const N    = cfs.length
  const COLS = 2 + N   // label | ratio | Y1..YN
  const mergeRows: number[] = []

  const rows: unknown[][] = []
  function sec(text: string, bg = C.NAVY) {
    mergeRows.push(rows.length)
    rows.push(secRow(text, COLS, bg))
  }
  function sp() { rows.push(spacer(COLS)) }

  // Title + year header
  sec(`ANNUAL CASH FLOW PROJECTIONS  ·  ${_input.property.propertyName || 'Pro Forma'}`)
  rows.push([colHdr(''), colHdr('% Ratio', 'center'), ...cfs.map((cf) => yrHdr(cf.year))])

  sp()

  // Income
  sec('INCOME', C.NAVY2)
  rows.push([dLabel('+ Gross Potential Rent'), emp(), ...cfs.map((cf) => dNum(cf.gpr, FMT_CURRENCY))])
  rows.push([dLabel('  − Vacancy Loss'),
    dNum(output.year1.vacancyLoss / (output.year1.gpr || 1), FMT_PCT),
    ...cfs.map((cf) => dNum(-cf.vacancyLoss, FMT_CURRENCY))])
  rows.push([dLabel('  − Credit Loss'),
    dNum(output.year1.creditLoss / (output.year1.gpr || 1), FMT_PCT),
    ...cfs.map((cf) => dNum(-cf.creditLoss, FMT_CURRENCY))])
  rows.push([dLabel('  − Concessions'), emp(), ...cfs.map((cf) => dNum(-cf.concessions, FMT_CURRENCY))])
  rows.push([dLabel('  + Other Income'),
    dNum(output.year1.otherIncome / (output.year1.gpr || 1), FMT_PCT),
    ...cfs.map((cf) => dNum(cf.otherIncome, FMT_CURRENCY))])
  rows.push([totLabel('Effective Gross Income (EGI)'),
    totNum(output.year1.egi / (output.year1.gpr || 1), FMT_PCT),
    ...cfs.map((cf) => totNum(cf.egi, FMT_CURRENCY))])
  sp()

  // Expenses
  sec('OPERATING EXPENSES', C.NAVY2)
  rows.push([dLabel('  − Total Operating Expenses'),
    dNum(output.year1.totalOpEx / (output.year1.egi || 1), FMT_PCT),
    ...cfs.map((cf) => dNum(-cf.totalOpEx, FMT_CURRENCY))])
  rows.push([totLabel('Net Operating Income (NOI)'),
    totNum(output.year1.noi / (output.year1.egi || 1), FMT_PCT),
    ...cfs.map((cf) => totNum(cf.noi, FMT_CURRENCY))])
  rows.push([dLabel('  Cap Rate'), emp(), ...cfs.map((cf) => dNum(cf.capRate, FMT_PCT2))])
  sp()

  // Debt
  sec('DEBT SERVICE', C.NAVY2)
  rows.push([dLabel('  − Total Debt Service'),
    dNum(output.year1.debtService / (output.year1.noi || 1), FMT_PCT),
    ...cfs.map((cf) => dNum(-cf.debtService, FMT_CURRENCY))])
  rows.push([dLabel('  DSCR'), emp(),
    ...cfs.map((cf) => dNum(cf.dscr >= 900 ? 999 : cf.dscr, '0.00"x"'))])
  rows.push([totLabel('Before-Tax Cash Flow (BTCF)'), emp(),
    ...cfs.map((cf) => totNum(cf.btcf, FMT_CURRENCY))])
  rows.push([dLabel('  Cash-on-Cash Return'), emp(),
    ...cfs.map((cf) => dNum(cf.cocReturn, FMT_PCT))])
  sp()

  // After-tax
  sec('AFTER-TAX & REVERSION', C.NAVY2)
  rows.push([dLabel('  − Capital Expenditures'), emp(), ...cfs.map((cf) => dNum(-cf.capEx, FMT_CURRENCY))])
  rows.push([dLabel('  Depreciation Deduction'), emp(), ...cfs.map((cf) => dNum(cf.depreciation, FMT_CURRENCY))])
  rows.push([dLabel('  Taxable Income'), emp(), ...cfs.map((cf) => dNum(cf.taxableIncome, FMT_CURRENCY))])
  rows.push([dLabel('  − Income Taxes'), emp(), ...cfs.map((cf) => dNum(-cf.taxes, FMT_CURRENCY))])
  rows.push([totLabel('After-Tax Cash Flow (ATCF)'), emp(),
    ...cfs.map((cf) => totNum(cf.atcf, FMT_CURRENCY))])
  sp()
  rows.push([dLabel('  Sale / Reversion Proceeds'), emp(),
    ...cfs.map((cf) => (cf.saleProceeds > 0 ? dNum(cf.saleProceeds, FMT_CURRENCY) : emp()))])
  rows.push([totLabel('Total Return (ATCF + Reversion)'), emp(),
    ...cfs.map((cf) => totNum(cf.atcf + cf.saleProceeds, FMT_CURRENCY))])
  rows.push([dLabel('  Total Return %'), emp(),
    ...cfs.map((cf) => dNum(cf.totalReturn, FMT_PCT))])

  const ws = aoaToSheet(rows)
  setColWidths(ws, [36, 8, ...Array(N).fill(13)])
  setRowHeights(ws, { 0: 24, ...Object.fromEntries(mergeRows.slice(1).map((r) => [r, 18])) })
  addSectionMerges(ws, rows, COLS, mergeRows)
  setSheetView(ws, 2)
  setLandscape(ws)
  XLSXStyle.utils.book_append_sheet(wb, ws, 'Annual Cash Flow')
}

// ─── 3. Income Detail ─────────────────────────────────────────────────────────
function buildIncomeSheet(wb: WB, input: ProFormaInput, output: ProFormaOutput) {
  const cfs  = output.annualCashFlows
  const N    = cfs.length
  const COLS = 2 + N
  const mergeRows: number[] = []

  const rows: unknown[][] = []
  function sec(text: string, bg = C.NAVY) {
    mergeRows.push(rows.length)
    rows.push(secRow(text, COLS, bg))
  }
  function sp() { rows.push(spacer(COLS)) }

  // Unit mix header
  const UNIT_COLS = 6
  mergeRows.push(rows.length)
  rows.push(secRow('UNIT MIX & RENT ROLL', COLS))
  rows.push([colHdr('Unit Type'), colHdr('Units', 'center'), colHdr('Avg SF', 'right'),
             colHdr('Mkt Rent / Mo', 'right'), colHdr('Annual / Unit', 'right'), colHdr('Annual Total', 'right'),
             ...Array(Math.max(0, COLS - UNIT_COLS)).fill(emp())])

  input.property.unitMix.forEach((u) => {
    rows.push([
      dLabel(u.unitType, 1),
      dNum(u.unitCount, FMT_INT, true),
      dNum(u.sqft, FMT_INT, true),
      dNum(u.marketRent, FMT_CURRENCY, true),
      dNum(u.marketRent * 12, FMT_CURRENCY),
      dNum(u.unitCount * u.marketRent * 12, FMT_CURRENCY),
      ...Array(Math.max(0, COLS - UNIT_COLS)).fill(emp()),
    ])
  })
  rows.push([
    totLabel('Totals'),
    totNum(input.property.totalUnits, FMT_INT),
    totNum(input.property.totalSqft / Math.max(input.property.totalUnits, 1), FMT_INT),
    emp(),
    emp(),
    totNum(cfs[0]?.gpr ?? 0, FMT_CURRENCY),
    ...Array(Math.max(0, COLS - UNIT_COLS)).fill(emp()),
  ])
  sp()

  // Multi-year income waterfall
  sec(`${N}-YEAR INCOME WATERFALL`)
  rows.push([colHdr(''), emp(), ...cfs.map((cf) => yrHdr(cf.year))])
  rows.push([dLabel('Gross Potential Rent'),   emp(), ...cfs.map((cf) => dNum(cf.gpr, FMT_CURRENCY))])
  rows.push([dLabel('  − Vacancy Loss'),       emp(), ...cfs.map((cf) => dNum(-cf.vacancyLoss, FMT_CURRENCY))])
  rows.push([dLabel('  − Credit Loss'),        emp(), ...cfs.map((cf) => dNum(-cf.creditLoss, FMT_CURRENCY))])
  rows.push([dLabel('  − Concessions'),        emp(), ...cfs.map((cf) => dNum(-cf.concessions, FMT_CURRENCY))])
  rows.push([dLabel('  + Other / Ancillary Income'), emp(), ...cfs.map((cf) => dNum(cf.otherIncome, FMT_CURRENCY))])
  rows.push([totLabel('Effective Gross Income (EGI)'), emp(), ...cfs.map((cf) => totNum(cf.egi, FMT_CURRENCY))])
  rows.push([dLabel('  Occupancy Rate'), emp(),
    ...cfs.map((cf) => dNum(1 - cf.vacancyLoss / (cf.gpr || 1), FMT_PCT))])

  const ws = aoaToSheet(rows)
  setColWidths(ws, [32, 8, ...Array(N).fill(13)])
  setRowHeights(ws, { 0: 24, ...Object.fromEntries(mergeRows.slice(1).map((r) => [r, 18])) })
  addSectionMerges(ws, rows, COLS, mergeRows)
  setSheetView(ws)
  setLandscape(ws)
  XLSXStyle.utils.book_append_sheet(wb, ws, 'Income')
}

// ─── 4. Operating Expenses ────────────────────────────────────────────────────
function buildExpensesSheet(wb: WB, input: ProFormaInput, output: ProFormaOutput) {
  const cfs  = output.annualCashFlows
  const N    = cfs.length
  const COLS = 2 + N
  const e    = input.expenses
  const grow = e.expenseGrowthRate / 100
  const mergeRows: number[] = []

  const rows: unknown[][] = []
  function sec(text: string, bg = C.NAVY) {
    mergeRows.push(rows.length)
    rows.push(secRow(text, COLS, bg))
  }
  function sp() { rows.push(spacer(COLS)) }

  function expRow(label: string, base: number, isPct = false): unknown[] {
    return [
      dLabel(label, 1),
      isPct ? dNum(base / 100, FMT_PCT, true) : dNum(base, FMT_CURRENCY, true),
      ...cfs.map((cf, yr) =>
        isPct
          ? dNum(cf.egi * (base / 100), FMT_CURRENCY)
          : dNum(base * Math.pow(1 + grow, yr), FMT_CURRENCY)
      ),
    ]
  }

  sec('OPERATING EXPENSES DETAIL')
  rows.push([colHdr('Expense Category'), colHdr('Base / Rate', 'right'), ...cfs.map((cf) => yrHdr(cf.year))])
  sp()

  sec('TAXES & INSURANCE', C.NAVY2)
  rows.push(expRow('Property Taxes', e.propertyTaxes))
  rows.push(expRow('Property Insurance', e.propertyInsurance))
  rows.push(expRow('Liability Insurance', e.liabilityInsurance))
  if (e.floodInsurance) rows.push(expRow('Flood Insurance', e.floodInsurance))
  if (e.umbrellaPolicy) rows.push(expRow('Umbrella Policy', e.umbrellaPolicy))
  if (e.workersComp)    rows.push(expRow('Workers Comp', e.workersComp))

  sec('UTILITIES', C.NAVY2)
  rows.push(expRow('Electricity', e.electricity))
  rows.push(expRow('Gas', e.gas))
  rows.push(expRow('Water', e.water))
  rows.push(expRow('Sewer', e.sewer))
  rows.push(expRow('Trash Removal', e.trash))

  sec('REPAIRS & MAINTENANCE', C.NAVY2)
  rows.push(expRow('Repairs & Maintenance', e.repairsAndMaintenance))
  rows.push(expRow('HVAC Maintenance', e.hvacMaintenance))
  rows.push(expRow('Landscaping', e.landscaping))
  rows.push(expRow('Pest Control', e.pestControl))
  if (e.roofMaintenance)  rows.push(expRow('Roof Maintenance', e.roofMaintenance))
  if (e.poolMaintenance)  rows.push(expRow('Pool Maintenance', e.poolMaintenance))

  sec('MANAGEMENT & PAYROLL', C.NAVY2)
  rows.push(expRow('Property Management Fee', e.propertyManagement, true))
  if (e.payroll) rows.push(expRow('Payroll', e.payroll))

  sec('ADMINISTRATIVE', C.NAVY2)
  rows.push(expRow('Admin & Office', e.adminOffice))
  rows.push(expRow('Marketing', e.marketing))
  if (e.legalFees)       rows.push(expRow('Legal Fees', e.legalFees))
  if (e.accountingFees)  rows.push(expRow('Accounting Fees', e.accountingFees))

  sec('RESERVES', C.NAVY2)
  rows.push(expRow('Reserves for Replacement', e.reservesForReplacement))

  sp()
  rows.push([totLabel('TOTAL OPERATING EXPENSES'), emp(),
    ...cfs.map((cf) => totNum(cf.totalOpEx, FMT_CURRENCY))])
  rows.push([dLabel('  Expense Ratio (% of EGI)'), emp(),
    ...cfs.map((cf) => dNum(cf.totalOpEx / (cf.egi || 1), FMT_PCT))])
  rows.push([dLabel('  Expenses per Unit per Year'), emp(),
    ...cfs.map((cf) => dNum(cf.totalOpEx / (input.property.totalUnits || 1), FMT_CURRENCY))])

  const ws = aoaToSheet(rows)
  setColWidths(ws, [34, 12, ...Array(N).fill(13)])
  setRowHeights(ws, { 0: 24, ...Object.fromEntries(mergeRows.slice(1).map((r) => [r, 18])) })
  addSectionMerges(ws, rows, COLS, mergeRows)
  setSheetView(ws)
  setLandscape(ws)
  XLSXStyle.utils.book_append_sheet(wb, ws, 'Operating Expenses')
}

// ─── 5. Debt Analysis ─────────────────────────────────────────────────────────
function buildDebtSheet(wb: WB, input: ProFormaInput, output: ProFormaOutput) {
  const COLS = 5
  const mergeRows: number[] = []
  const rows: unknown[][] = []
  function sec(text: string, bg = C.NAVY) {
    mergeRows.push(rows.length)
    rows.push(secRow(text, COLS, bg))
  }
  function sp() { rows.push(spacer(COLS)) }

  sec('DEBT & FINANCING ANALYSIS')
  rows.push([colHdr('Component'), colHdr('% of Total', 'center'), colHdr('Amount ($)', 'right'), colHdr('Details'), emp()])
  output.loanSummaries.forEach((ls, i) => {
    const loan = input.financing.loans[i]
    rows.push([
      dLabel(loan?.label ?? `Loan ${i + 1}`, 1),
      dNum(ls.loanAmount / output.totalProjectCost, FMT_PCT),
      dNum(ls.loanAmount, FMT_CURRENCY),
      dText(`${loan?.interestRate ?? 0}%  |  ${loan?.amortizationYears ?? 30}-yr amort  |  ${loan?.ioPeriodYears ?? 0}-yr IO`),
      emp(),
    ])
  })
  rows.push([
    dLabel('Equity', 1),
    dNum(output.totalEquity / output.totalProjectCost, FMT_PCT),
    dNum(output.totalEquity, FMT_CURRENCY),
    dText('LP + GP equity contribution'),
    emp(),
  ])
  rows.push([totLabel('Total Project Cost'), dNum(1, FMT_PCT), totNum(output.totalProjectCost, FMT_CURRENCY), emp(), emp()])
  sp()

  // Per-loan detail
  output.loanSummaries.forEach((ls, i) => {
    const loan = input.financing.loans[i]
    if (!loan) return

    sec(`LOAN ${i + 1}  —  ${loan.label.toUpperCase()}`, C.NAVY2)
    rows.push([colHdr('Metric'), colHdr(''), colHdr('Value', 'right'), emp(), emp()])
    rows.push([dLabel('Loan Amount'),              emp(), dNum(ls.loanAmount, FMT_CURRENCY, true),  emp(), emp()])
    rows.push([dLabel('Interest Rate'),            emp(), dNum(loan.interestRate / 100, FMT_PCT2, true), emp(), emp()])
    rows.push([dLabel('Amortization Period'),      emp(), dNum(loan.amortizationYears, '0 "years"', true), emp(), emp()])
    rows.push([dLabel('Interest-Only Period'),     emp(), dNum(loan.ioPeriodYears, '0 "years"', true),  emp(), emp()])
    rows.push([dLabel('Loan Term'),                emp(), dNum(loan.loanTermYears, '0 "years"', true),   emp(), emp()])
    rows.push([dLabel('Annual DS (IO)'),           emp(), dNum(ls.ioPayment * 12, FMT_CURRENCY),         emp(), emp()])
    rows.push([dLabel('Annual DS (Amortizing)'),   emp(), dNum(ls.annualDebtService, FMT_CURRENCY),      emp(), emp()])
    rows.push([dLabel('LTV at Close'),             emp(), dNum(ls.ltv, FMT_PCT2),                        emp(), emp()])
    rows.push([dLabel('Loan Constant'),            emp(), dNum(ls.loanConstant, FMT_PCT2),               emp(), emp()])
    rows.push([dLabel('DSCR (Year 1)'),            emp(), dNum(ls.dscr, '0.00"x"'),                     emp(), emp()])
    rows.push([dLabel('Balloon Balance'),          emp(), dNum(ls.balloonBalance, FMT_CURRENCY),         emp(), emp()])
    sp()

    // Amortization schedule
    rows.push([colHdr('Year', 'center'), colHdr('Beg. Balance', 'right'), colHdr('Interest', 'right'), colHdr('Principal', 'right'), colHdr('End Balance', 'right')])
    const holdYrs = input.exit.holdingPeriodYears
    let bal = loan.loanAmount
    const r = loan.interestRate / 100 / 12
    const n = loan.amortizationYears * 12
    const amortPmt = r === 0 ? loan.loanAmount / n : (loan.loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
    for (let yr = 1; yr <= holdYrs; yr++) {
      const beg = bal
      const isIO = yr <= loan.ioPeriodYears
      let yInt = 0, yPrin = 0
      for (let m = 0; m < 12; m++) {
        const interest  = bal * r
        const principal = isIO ? 0 : amortPmt - interest
        yInt  += interest
        yPrin += Math.max(0, principal)
        if (!isIO) bal = Math.max(0, bal - principal)
      }
      rows.push([dNum(yr, '0'), dNum(beg, FMT_CURRENCY), dNum(yInt, FMT_CURRENCY), dNum(yPrin, FMT_CURRENCY), dNum(bal, FMT_CURRENCY)])
    }
    sp()
  })

  // DSCR timeline
  const cfs = output.annualCashFlows
  const dcols = 1 + cfs.length
  // Extend to COLS if needed
  sec('DSCR BY YEAR')
  rows.push([colHdr('Metric'), ...cfs.map((cf) => yrHdr(cf.year)), ...Array(Math.max(0, COLS - dcols)).fill(emp())])
  rows.push([dLabel('NOI'), ...cfs.map((cf) => dNum(cf.noi, FMT_CURRENCY)), ...Array(Math.max(0, COLS - dcols)).fill(emp())])
  rows.push([dLabel('Total Debt Service'), ...cfs.map((cf) => dNum(cf.debtService, FMT_CURRENCY)), ...Array(Math.max(0, COLS - dcols)).fill(emp())])
  rows.push([totLabel('DSCR'), ...cfs.map((cf) => totNum(cf.dscr >= 900 ? 999 : cf.dscr, '0.00"x"')), ...Array(Math.max(0, COLS - dcols)).fill(emp())])

  const ws = aoaToSheet(rows)
  setColWidths(ws, [32, 12, 14, 14, 14])
  setRowHeights(ws, { 0: 24, ...Object.fromEntries(mergeRows.slice(1).map((r) => [r, 18])) })
  addSectionMerges(ws, rows, COLS, mergeRows)
  setSheetView(ws)
  setPortrait(ws)
  XLSXStyle.utils.book_append_sheet(wb, ws, 'Debt Analysis')
}

// ─── 6. Investment Returns ────────────────────────────────────────────────────
function buildReturnsSheet(wb: WB, output: ProFormaOutput) {
  const cfs  = output.annualCashFlows
  const N    = cfs.length
  const COLS = 2 + N
  const mergeRows: number[] = []

  const rows: unknown[][] = []
  function sec(text: string, bg = C.NAVY) {
    mergeRows.push(rows.length)
    rows.push(secRow(text, COLS, bg))
  }
  function sp() { rows.push(spacer(COLS)) }

  sec('INVESTMENT RETURNS')
  rows.push([colHdr('Return Metric'), colHdr(''), colHdr('Value', 'right'), ...Array(N - 1).fill(emp())])
  rows.push([dLabel('Levered IRR'),         emp(), dNum(output.irr / 100, FMT_PCT2),              ...Array(N - 1).fill(emp())])
  rows.push([dLabel('LP IRR'),              emp(), dNum(output.lpIrr / 100, FMT_PCT2),            ...Array(N - 1).fill(emp())])
  rows.push([dLabel('NPV'),                 emp(), dNum(output.npv, FMT_CURRENCY),                ...Array(N - 1).fill(emp())])
  rows.push([dLabel('Equity Multiple'),     emp(), dNum(output.equityMultiple, FMT_MULTIPLE),     ...Array(N - 1).fill(emp())])
  rows.push([dLabel('LP Equity Multiple'),  emp(), dNum(output.lpEquityMultiple, FMT_MULTIPLE),   ...Array(N - 1).fill(emp())])
  rows.push([dLabel('Avg. Cash-on-Cash'),   emp(), dNum(output.averageCoCReturn / 100, FMT_PCT),  ...Array(N - 1).fill(emp())])
  rows.push([dLabel('Going-In Cap Rate'),   emp(), dNum(output.goingInCapRate / 100, FMT_PCT2),   ...Array(N - 1).fill(emp())])
  rows.push([dLabel('Exit Cap Rate'),       emp(), dNum(output.exitCapRate / 100, FMT_PCT2),      ...Array(N - 1).fill(emp())])
  rows.push([dLabel('Exit Value'),          emp(), dNum(output.exitPrice, FMT_CURRENCY),          ...Array(N - 1).fill(emp())])
  rows.push([dLabel('Exit NOI'),            emp(), dNum(output.exitNOI, FMT_CURRENCY),            ...Array(N - 1).fill(emp())])
  rows.push([dLabel('GRM'),                 emp(), dNum(output.grm, FMT_MULTIPLE),                ...Array(N - 1).fill(emp())])
  rows.push([dLabel('Break-Even Occ.'),     emp(), dNum(output.breakEvenOccupancy / 100, FMT_PCT), ...Array(N - 1).fill(emp())])
  sp()

  // Year-by-year table
  sec(`${N}-YEAR CASH FLOW SCHEDULE`)
  rows.push([colHdr(''), emp(), ...cfs.map((cf) => yrHdr(cf.year))])
  rows.push([dLabel('NOI'),          emp(), ...cfs.map((cf) => dNum(cf.noi, FMT_CURRENCY))])
  rows.push([dLabel('− Debt Svc'),   emp(), ...cfs.map((cf) => dNum(-cf.debtService, FMT_CURRENCY))])
  rows.push([totLabel('BTCF'),       emp(), ...cfs.map((cf) => totNum(cf.btcf, FMT_CURRENCY))])
  rows.push([dLabel('  CoC Return'), emp(), ...cfs.map((cf) => dNum(cf.cocReturn, FMT_PCT))])
  rows.push([dLabel('− CapEx'),      emp(), ...cfs.map((cf) => dNum(-cf.capEx, FMT_CURRENCY))])
  rows.push([dLabel('− Taxes'),      emp(), ...cfs.map((cf) => dNum(-cf.taxes, FMT_CURRENCY))])
  rows.push([totLabel('ATCF'),       emp(), ...cfs.map((cf) => totNum(cf.atcf, FMT_CURRENCY))])
  rows.push([dLabel('Reversion'),    emp(), ...cfs.map((cf) => (cf.saleProceeds > 0 ? dNum(cf.saleProceeds, FMT_CURRENCY) : emp()))])
  rows.push([totLabel('Total Return'), emp(), ...cfs.map((cf) => totNum(cf.atcf + cf.saleProceeds, FMT_CURRENCY))])
  rows.push([dLabel('  Return %'),   emp(), ...cfs.map((cf) => dNum(cf.totalReturn, FMT_PCT))])

  const ws = aoaToSheet(rows)
  setColWidths(ws, [32, 4, ...Array(N).fill(13)])
  setRowHeights(ws, { 0: 24, ...Object.fromEntries(mergeRows.slice(1).map((r) => [r, 18])) })
  addSectionMerges(ws, rows, COLS, mergeRows)
  setSheetView(ws, 2)
  setLandscape(ws)
  XLSXStyle.utils.book_append_sheet(wb, ws, 'Returns')
}

// ─── 7. Sensitivity Analysis ──────────────────────────────────────────────────
function buildSensitivitySheet(wb: WB, output: ProFormaOutput) {
  const g1   = output.capRateSensitivity
  const g2   = output.vacancySensitivity
  const g3   = output.purchasePriceSensitivity
  const maxCols = Math.max(g1.cols.length, g2.cols.length, g3.cols.length)
  const COLS = 1 + maxCols
  const mergeRows: number[] = []

  const rows: unknown[][] = []
  function sec(text: string, bg = C.NAVY) {
    mergeRows.push(rows.length)
    rows.push(secRow(text, COLS, bg))
  }
  function sp() { rows.push(spacer(COLS)) }

  function heatCell(v: number, all: number[], isCurrency: boolean): Cell {
    const mn = Math.min(...all), mx = Math.max(...all)
    const p  = (v - mn) / ((mx - mn) || 1)
    const bg = p >= 0.7 ? C.GREEN_HEAT : p >= 0.35 ? C.YELLOW_HEAT : C.RED_HEAT
    const fg = p >= 0.7 ? C.GREEN_TEXT : p >= 0.35 ? C.BLACK : C.RED_TEXT
    return {
      v, t: 'n', z: isCurrency ? FMT_CURRENCY : FMT_PCT2,
      s: {
        font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: fg } },
        fill: { fgColor: { rgb: bg } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: bThin(),
      },
    }
  }

  const all1 = g1.values.flat()
  const all2 = g2.values.flat()
  const all3 = g3.values.flat()

  sec('SENSITIVITY ANALYSIS')
  sp()

  // Grid 1
  sec('Exit Cap Rate  ×  NOI Growth  →  Implied Exit Value', C.NAVY2)
  rows.push([colHdr(`${g1.rowLabel}  ↓  /  ${g1.colLabel}  →`),
    ...g1.cols.map((c) => colHdrN(c / 100, FMT_PCT)),
    ...Array(maxCols - g1.cols.length).fill(emp())])
  g1.rows.forEach((row, ri) => {
    rows.push([
      colHdrN(row / 100, FMT_PCT2),
      ...g1.values[ri].map((v) => heatCell(v, all1, true)),
      ...Array(maxCols - g1.cols.length).fill(emp()),
    ])
  })
  sp()

  // Grid 2
  sec('Vacancy Rate  ×  Rent Growth  →  IRR', C.NAVY2)
  rows.push([colHdr(`${g2.rowLabel}  ↓  /  ${g2.colLabel}  →`),
    ...g2.cols.map((c) => colHdrN(c / 100, FMT_PCT)),
    ...Array(maxCols - g2.cols.length).fill(emp())])
  g2.rows.forEach((row, ri) => {
    rows.push([
      colHdrN(row / 100, FMT_PCT2),
      ...g2.values[ri].map((v) => heatCell(v / 100, all2.map((x) => x / 100), false)),
      ...Array(maxCols - g2.cols.length).fill(emp()),
    ])
  })
  sp()

  // Grid 3
  sec('Purchase Price Δ  ×  Exit Cap Rate  →  IRR  (LTV constant)', C.NAVY2)
  rows.push([colHdr(`${g3.rowLabel}  ↓  /  ${g3.colLabel}  →`),
    ...g3.cols.map((c) => colHdrN(c / 100, FMT_PCT2)),
    ...Array(maxCols - g3.cols.length).fill(emp())])
  g3.rows.forEach((row, ri) => {
    const label = row === 0 ? 'Base Price' : row > 0 ? `+${row}%` : `${row}%`
    rows.push([
      colHdr(label, 'center'),
      ...g3.values[ri].map((v) => heatCell(v / 100, all3.map((x) => x / 100), false)),
      ...Array(maxCols - g3.cols.length).fill(emp()),
    ])
  })
  sp()

  // Scenario summary
  sec('SCENARIO SUMMARY', C.NAVY2)
  rows.push([colHdr('Scenario'), colHdr('Exit Value', 'right'), colHdr('IRR (Vac/Rent)', 'right'), colHdr('IRR (Price/Cap)', 'right'), emp()])
  const baseR1 = Math.floor(g1.rows.length / 2), baseC1 = Math.floor(g1.cols.length / 2)
  const baseR2 = Math.floor(g2.rows.length / 2), baseC2 = Math.floor(g2.cols.length / 2)
  const baseR3 = g3.rows.indexOf(0) >= 0 ? g3.rows.indexOf(0) : 3
  const baseC3 = Math.floor(g3.cols.length / 2)
  rows.push([dLabel('Best Case'),  dNum(Math.max(...all1), FMT_CURRENCY), dNum(Math.max(...all2) / 100, FMT_PCT2), dNum(Math.max(...all3) / 100, FMT_PCT2), emp()])
  rows.push([dLabel('Base Case'),  dNum(g1.values[baseR1]?.[baseC1] ?? 0, FMT_CURRENCY), dNum((g2.values[baseR2]?.[baseC2] ?? 0) / 100, FMT_PCT2), dNum((g3.values[baseR3]?.[baseC3] ?? 0) / 100, FMT_PCT2), emp()])
  rows.push([dLabel('Worst Case'), dNum(Math.min(...all1), FMT_CURRENCY), dNum(Math.min(...all2) / 100, FMT_PCT2), dNum(Math.min(...all3) / 100, FMT_PCT2), emp()])

  const ws = aoaToSheet(rows)
  setColWidths(ws, [30, ...Array(maxCols).fill(14)])
  setRowHeights(ws, { 0: 24, ...Object.fromEntries(mergeRows.slice(1).map((r) => [r, 18])) })
  addSectionMerges(ws, rows, COLS, mergeRows)
  setSheetView(ws)
  setPortrait(ws)
  XLSXStyle.utils.book_append_sheet(wb, ws, 'Sensitivity')
}

// ─── 8. Deal Inputs Reference ─────────────────────────────────────────────────
function buildInputsSheet(wb: WB, input: ProFormaInput) {
  const COLS = 3
  const mergeRows: number[] = []
  const rows: unknown[][] = []

  function sec(text: string, bg = C.NAVY) {
    mergeRows.push(rows.length)
    rows.push(secRow(text, COLS, bg))
  }
  function sp() { rows.push(spacer(COLS)) }

  sec('DEAL INPUTS  (Blue = User-Entered Assumption)')
  rows.push([colHdr('Parameter'), colHdr(''), colHdr('Value', 'right')])
  sp()

  sec('PROPERTY', C.NAVY2)
  rows.push([dLabel('Property Name'),      emp(), dText(input.property.propertyName, true)])
  rows.push([dLabel('Address'),            emp(), dText([input.property.address, input.property.city, input.property.state].filter(Boolean).join(', ') || '—', true)])
  rows.push([dLabel('Property Type'),      emp(), dText(input.property.propertyType, true)])
  rows.push([dLabel('Year Built'),         emp(), dNum(input.property.yearBuilt, '0', true)])
  rows.push([dLabel('Total Units'),        emp(), dNum(input.property.totalUnits, FMT_INT, true)])
  rows.push([dLabel('Total Sq Ft'),        emp(), dNum(input.property.totalSqft, FMT_INT, true)])
  sp()

  sec('ACQUISITION', C.NAVY2)
  rows.push([dLabel('Purchase Price'),     emp(), dNum(input.acquisition.purchasePrice, FMT_CURRENCY, true)])
  rows.push([dLabel('Closing Costs'),      emp(), dNum(input.acquisition.closingCosts / 100, FMT_PCT, true)])
  rows.push([dLabel('Immediate CapEx'),    emp(), dNum(input.acquisition.immediateCapEx, FMT_CURRENCY, true)])
  sp()

  sec('FINANCING', C.NAVY2)
  input.financing.loans.forEach((l, i) => {
    rows.push([dLabel(`Loan ${i + 1}  —  ${l.label}`, 0), emp(), emp()])
    rows.push([dLabel('  Loan Amount'),    emp(), dNum(l.loanAmount, FMT_CURRENCY, true)])
    rows.push([dLabel('  Interest Rate'),  emp(), dNum(l.interestRate / 100, FMT_PCT2, true)])
    rows.push([dLabel('  Amortization'),   emp(), dNum(l.amortizationYears, '0 "years"', true)])
    rows.push([dLabel('  IO Period'),      emp(), dNum(l.ioPeriodYears, '0 "years"', true)])
  })
  sp()

  sec('INCOME ASSUMPTIONS', C.NAVY2)
  rows.push([dLabel('Vacancy Rate'),       emp(), dNum(input.income.vacancyRate / 100, FMT_PCT, true)])
  rows.push([dLabel('Credit Loss'),        emp(), dNum(input.income.creditLoss / 100, FMT_PCT, true)])
  rows.push([dLabel('Rent Growth / Year'), emp(), dNum(input.income.rentGrowthRate / 100, FMT_PCT, true)])
  sp()

  sec('EXPENSE ASSUMPTIONS', C.NAVY2)
  rows.push([dLabel('Expense Growth / Year'), emp(), dNum(input.expenses.expenseGrowthRate / 100, FMT_PCT, true)])
  rows.push([dLabel('Mgmt Fee (% of EGI)'),   emp(), dNum(input.expenses.propertyManagement / 100, FMT_PCT, true)])
  sp()

  sec('EXIT & RETURNS', C.NAVY2)
  rows.push([dLabel('Hold Period'),        emp(), dNum(input.exit.holdingPeriodYears, '0 "years"', true)])
  rows.push([dLabel('Exit Cap Rate'),      emp(), dNum(input.exit.exitCapRate / 100, FMT_PCT2, true)])
  rows.push([dLabel('Selling Costs'),      emp(), dNum(input.exit.sellingCosts / 100, FMT_PCT, true)])
  rows.push([dLabel('Discount Rate'),      emp(), dNum(input.exit.discountRate / 100, FMT_PCT, true)])
  rows.push([dLabel('Income Tax Rate'),    emp(), dNum(input.exit.taxRate / 100, FMT_PCT, true)])
  rows.push([dLabel('Recap Tax Rate'),     emp(), dNum(input.exit.depreciationRecaptureRate / 100, FMT_PCT, true)])

  const ws = aoaToSheet(rows)
  setColWidths(ws, [32, 4, 22])
  setRowHeights(ws, { 0: 24, ...Object.fromEntries(mergeRows.slice(1).map((r) => [r, 18])) })
  addSectionMerges(ws, rows, COLS, mergeRows)
  setSheetView(ws)
  setPortrait(ws)
  XLSXStyle.utils.book_append_sheet(wb, ws, 'Inputs')
}
