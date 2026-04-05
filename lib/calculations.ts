import type {
  ProFormaInput,
  ProFormaOutput,
  AnnualCashFlow,
  LoanSummary,
  SensitivityGrid,
  LoanTranche,
} from '@/types/proforma'

// ─── Utility ─────────────────────────────────────────────────────────────────
export function fmt(n: number) {
  return n
}

/** Monthly payment for a fully-amortizing loan */
export function pmt(rate: number, nper: number, pv: number): number {
  if (rate === 0) return pv / nper
  const r = rate / 12
  return (pv * r * Math.pow(1 + r, nper)) / (Math.pow(1 + r, nper) - 1)
}

/** Remaining balance after k payments */
export function remainingBalance(
  rate: number,
  nper: number,
  pv: number,
  k: number
): number {
  if (rate === 0) return pv - (pv / nper) * k
  const r = rate / 12
  return pv * (Math.pow(1 + r, nper) - Math.pow(1 + r, k)) / (Math.pow(1 + r, nper) - 1)
}

/** Newton-Raphson core — returns NaN if it fails to converge in range */
function _irrNewton(cashflows: number[], guess: number): number {
  const MAX_ITER = 200
  const PRECISION = 1e-7
  let rate = guess
  for (let i = 0; i < MAX_ITER; i++) {
    let npvVal = 0
    let dnpv = 0
    for (let t = 0; t < cashflows.length; t++) {
      const denom = Math.pow(1 + rate, t)
      npvVal += cashflows[t] / denom
      dnpv -= (t * cashflows[t]) / (denom * (1 + rate))
    }
    if (Math.abs(dnpv) < 1e-10) break
    const newRate = rate - npvVal / dnpv
    if (Math.abs(newRate - rate) < PRECISION) {
      // Only accept economically meaningful results (-99% to +500%)
      if (newRate > -0.99 && newRate < 5.0) return newRate
      return NaN
    }
    rate = newRate
  }
  return NaN
}

/**
 * Robust IRR — tries multiple initial guesses to avoid spurious roots
 * that arise from multiple sign changes (e.g. negative BTCF mid-hold then
 * large positive reversion). Returns NaN when no real solution exists.
 * cashflows[0] must be the initial equity outflow (negative number).
 */
export function irr(cashflows: number[]): number {
  // Guard: first CF must be negative (equity investment)
  if (!cashflows.length || cashflows[0] >= 0) return NaN
  // Guard: at least one positive CF must exist
  if (!cashflows.slice(1).some((c) => c > 0)) return NaN

  // Try a spread of initial guesses; return first plausible convergence
  const guesses = [0.08, 0.12, 0.05, 0.15, 0.20, 0.02, 0.25, -0.05, 0.30, -0.10]
  const candidates: number[] = []
  for (const g of guesses) {
    const r = _irrNewton(cashflows, g)
    if (!isNaN(r)) candidates.push(r)
  }
  if (candidates.length === 0) return NaN

  // If multiple roots found, prefer the one closest to a "reasonable" mid-point
  // (typically 0–40% for real estate deals)
  candidates.sort((a, b) => Math.abs(a - 0.15) - Math.abs(b - 0.15))
  return candidates[0]
}

/** NPV given discount rate and cashflows (index 0 = Year 0) */
export function npv(rate: number, cashflows: number[]): number {
  return cashflows.reduce((acc, cf, t) => acc + cf / Math.pow(1 + rate, t), 0)
}

// ─── Loan Analysis ───────────────────────────────────────────────────────────
function loanAnnualDebtService(loan: LoanTranche, year: number): number {
  const isIO = year <= loan.ioPeriodYears
  if (isIO) {
    return loan.loanAmount * (loan.interestRate / 100)
  }
  const amortYears = loan.amortizationYears
  const monthlyPmt = pmt(loan.interestRate / 100, amortYears * 12, loan.loanAmount)
  return monthlyPmt * 12
}

function loanBalloon(loan: LoanTranche, atYear: number): number {
  const ioMonths = loan.ioPeriodYears * 12
  const amortMonths = loan.amortizationYears * 12
  const totalMonths = atYear * 12
  if (totalMonths <= ioMonths) return loan.loanAmount
  const amortPayments = Math.min(totalMonths - ioMonths, amortMonths)
  return remainingBalance(loan.interestRate / 100, amortMonths, loan.loanAmount, amortPayments)
}

function buildLoanSummaries(input: ProFormaInput, year1NOI: number): LoanSummary[] {
  return input.financing.loans.map((loan) => {
    const ads = loanAnnualDebtService(loan, 1)
    const balloon = loanBalloon(loan, loan.loanTermYears)
    const ltv = loan.loanAmount / input.acquisition.purchasePrice
    const loanConstant = ads / loan.loanAmount
    return {
      loanAmount: loan.loanAmount,
      annualDebtService: ads,
      monthlyPayment: ads / 12,
      ioPayment: loan.loanAmount * (loan.interestRate / 100) / 12,
      dscr: ads > 0 ? year1NOI / ads : 0,
      ltv,
      loanConstant,
      balloonBalance: balloon,
    }
  })
}

// ─── Income Calculations ─────────────────────────────────────────────────────
function calcGPR(input: ProFormaInput, year: number): number {
  const growthFactor = Math.pow(1 + input.income.rentGrowthRate / 100, year - 1)
  let gpr = 0
  for (const unit of input.property.unitMix) {
    gpr += unit.unitCount * unit.marketRent * 12
  }
  // Year 1 uses market rent; subsequent years grow
  if (input.property.unitMix.length === 0) return 0
  return gpr * growthFactor
}

function calcOtherIncome(input: ProFormaInput, year: number): number {
  const inc = input.income
  const totalUnits = Math.max(1, input.property.totalUnits)
  const growthFactor = Math.pow(1 + (inc.otherIncomeGrowthRate ?? 2) / 100, year - 1)

  // Custom array items — each has its own growth rate
  const arrayTotal = inc.otherIncome.reduce((sum, item) => {
    const g = Math.pow(1 + item.growthRate / 100, year - 1)
    return sum + item.annualAmount * g
  }, 0)

  // All flat income fields — grow at otherIncomeGrowthRate
  const rubsAnnual = inc.hasRUBS ? (inc.rubsMonthlyPerUnit || 0) * totalUnits * 12 : 0
  const petAnnual = (inc.petFeeMonthly || 0) * ((inc.petFeePctUnits || 0) / 100) * totalUnits * 12
  const parkingAnnual =
    (inc.parkingIncome || 0) * 12 +
    (inc.coveredParkingPremium || 0) * 12 +
    (inc.garageIncome || 0)
  const ancillaryAnnual =
    (inc.storageIncome || 0) + (inc.laundryIncome || 0) +
    (inc.guestSuiteIncome || 0) + (inc.vendingIncome || 0) +
    (inc.billboardCellTower || 0) + (inc.internetBulkBilling || 0)
  const feeAnnual =
    (inc.applicationFees || 0) + (inc.lateFees || 0) +
    (inc.nsfFees || 0) + (inc.moveInFees || 0)
  const specialAnnual = (inc.shortTermRentalIncome || 0) + (inc.utilityReimbursement || 0)
  const m2mAnnual =
    (inc.monthToMonthPremium || 0) * ((inc.monthToMonthPctUnits || 0) / 100) * totalUnits * 12

  const flatTotal =
    (rubsAnnual + petAnnual + parkingAnnual + ancillaryAnnual + feeAnnual + specialAnnual + m2mAnnual) *
    growthFactor

  return arrayTotal + flatTotal
}

function calcOpEx(input: ProFormaInput, egi: number, year: number): number {
  const growthFactor = Math.pow(1 + input.expenses.expenseGrowthRate / 100, year - 1)
  const e = input.expenses
  const mgmtFee = (e.propertyManagement || 0) / 100 * egi
  const fixed =
    (e.propertyTaxes || 0) +
    (e.specialAssessments || 0) +
    (e.propertyInsurance || 0) + (e.liabilityInsurance || 0) + (e.floodInsurance || 0) +
    (e.earthquakeInsurance || 0) + (e.umbrellaPolicy || 0) + (e.workersComp || 0) +
    (e.electricity || 0) + (e.gas || 0) + (e.water || 0) + (e.sewer || 0) +
    (e.trash || 0) + (e.cableInternet || 0) +
    (e.repairsAndMaintenance || 0) + (e.plumbingRepairs || 0) + (e.electricalRepairs || 0) +
    (e.hvacMaintenance || 0) + (e.elevatorMaintenance || 0) + (e.roofMaintenance || 0) +
    (e.applianceRepairs || 0) +
    (e.landscaping || 0) + (e.snowRemoval || 0) + (e.poolMaintenance || 0) +
    (e.exteriorCleaning || 0) + (e.pestControl || 0) +
    (e.payroll || 0) + (e.payrollTaxes || 0) + (e.employeeBenefits || 0) +
    (e.adminOffice || 0) + (e.phonePostage || 0) + (e.software || 0) +
    (e.bankCharges || 0) + (e.creditCardProcessing || 0) +
    (e.marketing || 0) + (e.advertising || 0) + (e.signsAndBrochures || 0) +
    (e.legalFees || 0) + (e.accountingFees || 0) + (e.taxPreparation || 0) + (e.consultingFees || 0) +
    (e.licensesPermits || 0) + (e.bidAssessments || 0) + (e.safetyInspections || 0) +
    (e.fireSprinklerInspection || 0) +
    (e.reservesForReplacement || 0) +
    (e.securitySystems || 0) + (e.securityPersonnel || 0) +
    (e.janitorial || 0) + (e.contractServices || 0) +
    (e.groundLease || 0) + (e.hoa || 0) + (e.otherExpenses || 0)
  return (fixed * growthFactor) + mgmtFee
}

function calcCapEx(input: ProFormaInput, year: number): number {
  return input.capex.items
    .filter((item) => item.year === year)
    .reduce((sum, item) => sum + item.amount, 0)
}

function calcDepreciation(input: ProFormaInput): number {
  return input.exit.costBasis / input.exit.depreciableLife
}

// ─── Main Pro Forma Engine ───────────────────────────────────────────────────
export function calculateProForma(input: ProFormaInput): ProFormaOutput {
  const holdYears = Math.max(1, Math.min(10, input.exit.holdingPeriodYears))
  const totalDebt = input.financing.useFinancing
    ? input.financing.loans.reduce((s, l) => s + l.loanAmount, 0)
    : 0

  const acquisitionCosts =
    input.acquisition.purchasePrice *
      (1 + (input.acquisition.closingCosts ?? 0) / 100) +
    (input.acquisition.immediateCapEx ?? 0) +
    (input.acquisition.transferTax ?? 0) +
    (input.acquisition.titleInsurance ?? 0) +
    (input.acquisition.otherAcquisitionCosts ?? 0)

  // Equity must be positive — if debt exceeds total cost, model is invalid
  const totalEquity = Math.max(1, acquisitionCosts - totalDebt)
  const depreciation = calcDepreciation(input)

  // Build annual cash flows
  const annualCashFlows: AnnualCashFlow[] = []
  let beginningEquity = totalEquity

  for (let year = 1; year <= holdYears; year++) {
    const gpr = calcGPR(input, year)
    const vacancyLoss = gpr * (input.income.vacancyRate / 100)
    const creditLoss = gpr * (input.income.creditLoss / 100)
    const concessions = year === 1 ? input.income.concessions : 0
    const otherIncome = calcOtherIncome(input, year)
    const egi = gpr - vacancyLoss - creditLoss - concessions + otherIncome

    const totalOpEx = calcOpEx(input, egi, year)
    const noi = egi - totalOpEx
    const capRate = noi / input.acquisition.purchasePrice

    let debtService = 0
    if (input.financing.useFinancing) {
      for (const loan of input.financing.loans) {
        debtService += loanAnnualDebtService(loan, year)
      }
    }

    const dscr = debtService > 0 ? noi / debtService : 999
    const btcf = noi - debtService

    const capExYear = calcCapEx(input, year)

    // Interest paid (for tax purposes)
    let interestPaid = 0
    if (input.financing.useFinancing) {
      for (const loan of input.financing.loans) {
        const isIO = year <= loan.ioPeriodYears
        if (isIO) {
          interestPaid += loan.loanAmount * (loan.interestRate / 100)
        } else {
          const ioM = loan.ioPeriodYears * 12
          const amortM = loan.amortizationYears * 12
          const paymentsMade = (year - loan.ioPeriodYears - 1) * 12
          let yearInterest = 0
          for (let m = 1; m <= 12; m++) {
            const bal = remainingBalance(
              loan.interestRate / 100,
              amortM,
              loan.loanAmount,
              ioM + paymentsMade + m - 1
            )
            yearInterest += bal * (loan.interestRate / 100 / 12)
          }
          interestPaid += yearInterest
        }
      }
    }

    const taxableIncome = noi - interestPaid - depreciation
    const taxes =
      taxableIncome > 0 ? taxableIncome * (input.exit.taxRate / 100) : 0
    const atcf = btcf - taxes - capExYear

    // Exit in final year
    let saleProceeds = 0
    let remainingDebt = 0
    if (year === holdYears) {
      const exitNOI = noi * (1 + input.income.rentGrowthRate / 100)
      const grossSalePrice = exitNOI / (input.exit.exitCapRate / 100)
      const sellingCosts = grossSalePrice * (input.exit.sellingCosts / 100)
      if (input.financing.useFinancing) {
        for (const loan of input.financing.loans) {
          remainingDebt += loanBalloon(loan, year)
        }
      }
      const recapRate = (input.exit.depreciationRecaptureRate ?? 25) / 100
      const depreciationRecapture = depreciation * year * recapRate
      saleProceeds = grossSalePrice - sellingCosts - remainingDebt - depreciationRecapture
    }

    const endingEquity = beginningEquity + atcf + saleProceeds
    const cocReturn = btcf / totalEquity
    const totalReturn = (atcf + saleProceeds) / totalEquity

    // LP/GP waterfall distributions (simplified)
    const lpDistribution = btcf * (input.waterfall?.useWaterfall ? (input.waterfall.lpEquityPct || 90) / 100 : 1)
    const gpDistribution = btcf * (input.waterfall?.useWaterfall ? (input.waterfall.gpEquityPct || 10) / 100 : 0)

    annualCashFlows.push({
      year,
      gpr,
      vacancyLoss,
      creditLoss,
      concessions,
      otherIncome,
      egi,
      totalOpEx,
      noi,
      capRate,
      debtService,
      dscr,
      btcf,
      capEx: capExYear,
      depreciation,
      taxableIncome,
      taxes,
      atcf,
      beginningEquity,
      endingEquity,
      saleProceeds,
      totalReturn,
      cocReturn,
      lpDistribution,
      gpDistribution,
    })

    beginningEquity = endingEquity - saleProceeds
  }

  const year1 = annualCashFlows[0]
  const loanSummaries = input.financing.useFinancing
    ? buildLoanSummaries(input, year1.noi)
    : []

  // IRR: Year 0 is -equity, Years 1–N are atcf, final year includes sale proceeds
  const irrCashflows = [
    -totalEquity,
    ...annualCashFlows.map((cf) => cf.atcf + cf.saleProceeds),
  ]
  const rawIrr = irr(irrCashflows)
  const irrResult = isNaN(rawIrr) ? 0 : rawIrr * 100

  // NPV
  const npvCashflows = irrCashflows
  const npvResult = npv(input.exit.discountRate / 100, npvCashflows)

  // Exit
  const exitNOI = annualCashFlows[holdYears - 1].noi * (1 + input.income.rentGrowthRate / 100)
  const exitPrice = exitNOI / (input.exit.exitCapRate / 100)

  // Equity Multiple
  const totalProceeds = annualCashFlows.reduce(
    (s, cf) => s + cf.atcf + cf.saleProceeds,
    0
  )
  const equityMultiple = totalEquity > 0 ? totalProceeds / totalEquity : 0

  const avgCoCReturn =
    annualCashFlows.reduce((s, cf) => s + cf.cocReturn, 0) / holdYears

  // Property metrics
  const goingInCapRate = year1.noi / input.acquisition.purchasePrice
  const grm =
    input.acquisition.purchasePrice > 0 && year1.gpr > 0
      ? input.acquisition.purchasePrice / year1.gpr
      : 0

  const breakEvenOccupancy =
    year1.gpr > 0
      ? (year1.totalOpEx + year1.debtService) / year1.gpr
      : 0

  const totalUnits = input.property.totalUnits || 1
  const totalSqft = input.property.totalSqft || 1

  // Sensitivity grids
  const capRateSensitivity = buildCapRateSensitivity(input, year1.noi)
  const vacancySensitivity = buildVacancySensitivity(input)
  const purchasePriceSensitivity = buildPurchasePriceSensitivity(input)

  const totalDepreciation = depreciation * holdYears
  const lpEquityPct = input.waterfall?.useWaterfall ? (input.waterfall.lpEquityPct || 90) / 100 : 1
  const lpEquityContrib = totalEquity * lpEquityPct
  const lpProceeds = annualCashFlows.reduce((s, cf) => s + cf.lpDistribution + (cf.saleProceeds * lpEquityPct), 0)
  const lpIrrCashflows = [-lpEquityContrib, ...annualCashFlows.map((cf) => cf.lpDistribution + (cf.saleProceeds * lpEquityPct))]
  const rawLpIrr = lpEquityContrib > 0 ? irr(lpIrrCashflows) : NaN
  const lpIrrResult = isNaN(rawLpIrr) ? irrResult : rawLpIrr * 100
  const lpEquityMultiple = lpEquityContrib > 0 ? lpProceeds / lpEquityContrib : equityMultiple

  return {
    totalProjectCost: acquisitionCosts,
    totalEquity,
    totalDebt,
    ltv: totalDebt / input.acquisition.purchasePrice,
    loanSummaries,
    year1,
    annualCashFlows,
    irr: irrResult,
    lpIrr: lpIrrResult,
    npv: npvResult,
    equityMultiple,
    lpEquityMultiple,
    averageCoCReturn: avgCoCReturn * 100,
    exitPrice,
    exitNOI,
    goingInCapRate: goingInCapRate * 100,
    exitCapRate: input.exit.exitCapRate,
    grm,
    breakEvenOccupancy: breakEvenOccupancy * 100,
    pricePerUnit: input.acquisition.purchasePrice / totalUnits,
    pricePerSqft: input.acquisition.purchasePrice / totalSqft,
    noiPerUnit: year1.noi / totalUnits,
    noiPerSqft: year1.noi / totalSqft,
    totalDepreciation,
    capRateSensitivity,
    vacancySensitivity,
    purchasePriceSensitivity,
  }
}

// ─── Sensitivity Grids ───────────────────────────────────────────────────────
function buildCapRateSensitivity(
  input: ProFormaInput,
  baseNOI: number
): SensitivityGrid {
  const baseExitCap = input.exit.exitCapRate
  const capRows = [
    baseExitCap - 1,
    baseExitCap - 0.5,
    baseExitCap,
    baseExitCap + 0.5,
    baseExitCap + 1,
  ]
  const noiBumpCols = [-10, -5, 0, 5, 10] // % NOI change

  const values = capRows.map((cap) =>
    noiBumpCols.map((bump) => {
      const noi = baseNOI * (1 + bump / 100)
      return noi / (cap / 100)
    })
  )

  return {
    rowLabel: 'Exit Cap Rate (%)',
    colLabel: 'NOI Change (%)',
    rows: capRows,
    cols: noiBumpCols,
    values,
  }
}

function buildVacancySensitivity(input: ProFormaInput): SensitivityGrid {
  const baseVac = input.income.vacancyRate
  const baseRentGrowth = input.income.rentGrowthRate

  const vacRows = [
    Math.max(0, baseVac - 4),
    Math.max(0, baseVac - 2),
    baseVac,
    baseVac + 2,
    baseVac + 4,
  ]
  const rentCols = [
    baseRentGrowth - 2,
    baseRentGrowth - 1,
    baseRentGrowth,
    baseRentGrowth + 1,
    baseRentGrowth + 2,
  ]

  const values = vacRows.map((vac) =>
    rentCols.map((growth) => {
      const modInput: ProFormaInput = {
        ...input,
        income: { ...input.income, vacancyRate: vac, rentGrowthRate: growth },
      }
      // Use the non-recursive core engine to avoid infinite recursion
      return calcIRROnly(modInput)
    })
  )

  return {
    rowLabel: 'Vacancy Rate (%)',
    colLabel: 'Rent Growth (%)',
    rows: vacRows,
    cols: rentCols,
    values,
  }
}

function buildPurchasePriceSensitivity(input: ProFormaInput): SensitivityGrid {
  const basePrice = input.acquisition.purchasePrice
  const baseExitCap = input.exit.exitCapRate

  // Rows: % change in purchase price (rows are absolute % deltas, not absolute prices)
  const pricePctRows = [-20, -10, -5, 0, 5, 10, 20]
  // Cols: exit cap rate absolute values
  const exitCapCols = [
    baseExitCap - 1,
    baseExitCap - 0.5,
    baseExitCap,
    baseExitCap + 0.5,
    baseExitCap + 1,
  ]

  const values = pricePctRows.map((pctChange) => {
    const newPrice = basePrice * (1 + pctChange / 100)
    return exitCapCols.map((exitCap) => {
      const modInput: ProFormaInput = {
        ...input,
        acquisition: { ...input.acquisition, purchasePrice: newPrice },
        // Keep LTV constant by scaling loan amounts proportionally
        financing: {
          ...input.financing,
          loans: input.financing.loans.map((l) => ({
            ...l,
            loanAmount: Math.round(l.loanAmount * (newPrice / basePrice)),
          })),
        },
        exit: { ...input.exit, exitCapRate: exitCap },
      }
      return calcIRROnly(modInput)
    })
  })

  return {
    rowLabel: 'Purchase Price Δ (%)',
    colLabel: 'Exit Cap Rate (%)',
    rows: pricePctRows,
    cols: exitCapCols,
    values,
  }
}

/** Lightweight IRR-only calculation — no sensitivity grids, no recursion */
function calcIRROnly(input: ProFormaInput): number {
  const holdYears = Math.max(1, Math.min(10, input.exit.holdingPeriodYears))
  const totalDebt = input.financing.useFinancing
    ? input.financing.loans.reduce((s, l) => s + l.loanAmount, 0)
    : 0

  const acquisitionCosts =
    input.acquisition.purchasePrice * (1 + (input.acquisition.closingCosts ?? 0) / 100) +
    (input.acquisition.immediateCapEx ?? 0) +
    (input.acquisition.transferTax ?? 0) +
    (input.acquisition.titleInsurance ?? 0) +
    (input.acquisition.otherAcquisitionCosts ?? 0)

  const totalEquity = Math.max(1, acquisitionCosts - totalDebt)
  const depreciation = calcDepreciation(input)

  const cashflows = [-totalEquity]

  for (let year = 1; year <= holdYears; year++) {
    const gpr = calcGPR(input, year)
    const vacancyLoss = gpr * (input.income.vacancyRate / 100)
    const creditLoss = gpr * (input.income.creditLoss / 100)
    const concessions = year === 1 ? input.income.concessions : 0
    const otherIncome = calcOtherIncome(input, year)
    const egi = gpr - vacancyLoss - creditLoss - concessions + otherIncome
    const totalOpEx = calcOpEx(input, egi, year)
    const noi = egi - totalOpEx

    let debtService = 0
    if (input.financing.useFinancing) {
      for (const loan of input.financing.loans) {
        debtService += loanAnnualDebtService(loan, year)
      }
    }

    const btcf = noi - debtService
    const capExYear = calcCapEx(input, year)

    let interestPaid = 0
    if (input.financing.useFinancing) {
      for (const loan of input.financing.loans) {
        const isIO = year <= loan.ioPeriodYears
        interestPaid += isIO
          ? loan.loanAmount * (loan.interestRate / 100)
          : loanAnnualDebtService(loan, year) * 0.8 // approx
      }
    }

    const taxableIncome = noi - interestPaid - depreciation
    const taxes = taxableIncome > 0 ? taxableIncome * (input.exit.taxRate / 100) : 0
    const atcf = btcf - taxes - capExYear

    let saleProceeds = 0
    if (year === holdYears) {
      const exitNOI = noi * (1 + input.income.rentGrowthRate / 100)
      const grossSalePrice = exitNOI / (input.exit.exitCapRate / 100)
      const sellingCosts = grossSalePrice * (input.exit.sellingCosts / 100)
      const debtPayoff = input.financing.useFinancing
        ? input.financing.loans.reduce((s, l) => s + loanBalloon(l, year), 0)
        : 0
      const recapRate = (input.exit.depreciationRecaptureRate ?? 25) / 100
      const depreciationRecapture = depreciation * year * recapRate
      saleProceeds = grossSalePrice - sellingCosts - debtPayoff - depreciationRecapture
    }

    cashflows.push(atcf + saleProceeds)
  }

  const result = irr(cashflows)
  return isNaN(result) ? 0 : result * 100
}

// ─── Default Input ────────────────────────────────────────────────────────────
export { defaultProFormaInput } from '@/lib/defaultInput'
