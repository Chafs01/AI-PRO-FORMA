// ─── Enums ────────────────────────────────────────────────────────────────────
export type PropertyType = 'multifamily'|'office'|'retail'|'industrial'|'mixed-use'|'single-family'|'self-storage'|'hospitality'|'other'
export type PropertyClass = 'A'|'B'|'C'|'D'
export type ConstructionType = 'wood-frame'|'concrete'|'steel'|'masonry'|'prefab'|'other'
export type UtilitySetup = 'master-metered'|'sub-metered'|'individual'
export type LaundryType = 'in-unit'|'common'|'none'
export type ParkingType = 'surface'|'structured'|'garage'|'street'|'mixed'
export type RecourseType = 'non-recourse'|'full-recourse'|'partial-recourse'

export interface UnitMix {
  id: string; unitType: string; unitCount: number; sqft: number
  marketRent: number; currentRent: number; occupied: number; leaseExpiration: string
}
export interface CommercialTenant {
  id: string; tenantName: string; sqft: number
  leaseType: 'nnn'|'gross'|'modified-gross'; baseRent: number
  leaseExpiration: string; escalation: number; ownerExpenses: number
}

export interface PropertyDetails {
  propertyName: string; address: string; city: string; state: string
  zipCode: string; county: string; msa: string; submarket: string; apn: string
  propertyType: PropertyType; propertyClass: PropertyClass
  constructionType: ConstructionType; yearBuilt: number; yearRenovated: number
  totalUnits: number; totalSqft: number; netRentableSqft: number
  commonAreaSqft: number; lotSizeSqft: number; lotSizeAcres: number
  stories: number; numberOfBuildings: number
  parkingSpaces: number; parkingType: ParkingType; coveredSpaces: number; garageSpaces: number
  utilitySetup: UtilitySetup; laundryType: LaundryType
  hasElevator: boolean; hvacType: string; roofType: string
  roofAge: number; plumbingAge: number; electricalAge: number
  zoning: string; floodZone: string; seismicZone: string; currentOccupancy: number
  hasPool: boolean; hasFitnessCtr: boolean; hasDogPark: boolean
  hasCoworking: boolean; hasEVCharging: boolean; hasSmartHome: boolean
  hasGatedAccess: boolean; hasConcierge: boolean; amenitiesNotes: string
  walkScore: number; transitScore: number; bikeScore: number
  schoolRating: number; crimeIndex: number
  unitMix: UnitMix[]; commercialTenants: CommercialTenant[]
}

export interface AcquisitionInputs {
  purchasePrice: number; closingCosts: number; brokerFeePercent: number
  legalFees: number; titleInsurance: number; transferTax: number
  environmentalStudy: number; surveyAndEngineering: number
  propertyInspection: number; appraisalFee: number; earnestMoneyDeposit: number
  immediateCapEx: number; acquisitionFee: number; organizationCosts: number
  workingCapitalReserve: number; lenderFeeAtClose: number; otherAcquisitionCosts: number
}

export interface LoanTranche {
  id: string; label: string; loanAmount: number; interestRate: number
  amortizationYears: number; ioPeriodYears: number; loanTermYears: number
  isFloating: boolean; spread: number; floorRate: number
  originationFee: number; exitFee: number
  extensionOptions: number; extensionMonths: number; rateCap: number
  recourseType: RecourseType; isPersonalGuarantee: boolean
  prepaymentType: 'none'|'stepdown'|'defeasance'|'yield-maintenance'
  prepaymentPenalty: number
}
export interface FinancingInputs {
  useFinancing: boolean; loans: LoanTranche[]; equityContribution: number
}

export interface OtherIncomeItem { id: string; label: string; annualAmount: number; growthRate: number }
export interface IncomeInputs {
  vacancyRate: number; creditLoss: number; concessions: number
  physicalOccupancy: number; economicOccupancy: number
  hasRUBS: boolean; rubsMonthlyPerUnit: number
  petFeeMonthly: number; petDeposit: number; petFeePctUnits: number
  parkingIncome: number; coveredParkingPremium: number; garageIncome: number
  storageIncome: number; laundryIncome: number
  applicationFees: number; lateFees: number; nsfFees: number
  moveInFees: number; guestSuiteIncome: number; vendingIncome: number
  billboardCellTower: number; utilityReimbursement: number
  shortTermRentalIncome: number
  monthToMonthPremium: number; monthToMonthPctUnits: number
  internetBulkBilling: number
  otherIncome: OtherIncomeItem[]
  rentGrowthRate: number; otherIncomeGrowthRate: number
}

export interface OperatingExpenses {
  propertyTaxes: number; specialAssessments: number
  propertyInsurance: number; liabilityInsurance: number; floodInsurance: number
  earthquakeInsurance: number; umbrellaPolicy: number; workersComp: number
  electricity: number; gas: number; water: number; sewer: number; trash: number; cableInternet: number
  repairsAndMaintenance: number; plumbingRepairs: number; electricalRepairs: number
  hvacMaintenance: number; elevatorMaintenance: number; roofMaintenance: number; applianceRepairs: number
  landscaping: number; snowRemoval: number; poolMaintenance: number
  exteriorCleaning: number; pestControl: number
  propertyManagement: number; payroll: number; payrollTaxes: number
  employeeBenefits: number; adminOffice: number; phonePostage: number
  software: number; bankCharges: number; creditCardProcessing: number
  marketing: number; advertising: number; signsAndBrochures: number
  legalFees: number; accountingFees: number; taxPreparation: number; consultingFees: number
  licensesPermits: number; bidAssessments: number; safetyInspections: number; fireSprinklerInspection: number
  reservesForReplacement: number
  securitySystems: number; securityPersonnel: number
  janitorial: number; contractServices: number
  groundLease: number; hoa: number; otherExpenses: number
  expenseGrowthRate: number
}

export interface CapExItem { id: string; description: string; category: string; year: number; amount: number; isRecurring: boolean; recurringYears: number }
export interface CapExInputs {
  unitRenovationCostPerUnit: number; unitRenovationUnitsPerYear: number
  unitRenovationStartYear: number; unitRenovationRentBump: number
  roofReplacement: number; hvacReplacement: number; plumbingUpgrade: number
  electricalUpgrade: number; windowReplacement: number; elevatorModernization: number
  commonAreaRenovation: number; lobbyRenovation: number; laundryRoomUpgrade: number
  amenityUpgrade: number; parkingLotResurface: number; exteriorPaint: number
  signageReplace: number; securityUpgrade: number
  items: CapExItem[]
}

export interface ExitInputs {
  holdingPeriodYears: number; exitCapRate: number; sellingCosts: number
  costBasis: number; landValue: number; depreciableLife: number
  costSegregation: boolean; costSegregation5yr: number; costSegregation15yr: number
  taxRate: number; longTermCapGainsRate: number; depreciationRecaptureRate: number
  stateCapGainsRate: number; netInvestmentIncomeTax: number
  is1031Exchange: boolean; discountRate: number
}

export interface WaterfallInputs {
  useWaterfall: boolean
  lpEquityPct: number; gpEquityPct: number; preferredReturn: number
  catchUp: boolean; catchUpPct: number
  tier1Split: number; tier1Hurdle: number
  tier2Split: number; tier2Hurdle: number
  tier3Split: number; tier3Hurdle: number
  acquisitionFeeToGP: number; assetMgmtFee: number; dispositionFee: number
}

export interface MarketInputs {
  rentGrowthY1: number; rentGrowthY2: number; rentGrowthY3: number
  rentGrowthY4: number; rentGrowthY5: number; rentGrowthY6to10: number
  stabilizedVacancy: number; leaseUpMonths: number; leaseUpStartVacancy: number
  compAvgRent: number; compAvgVacancy: number; compCapRate: number
  marketRentGrowthForecast: number; capRateForecast: number
  inflationRate: number; sofrRate: number
}

export interface ProFormaInput {
  property: PropertyDetails
  acquisition: AcquisitionInputs
  financing: FinancingInputs
  income: IncomeInputs
  expenses: OperatingExpenses
  capex: CapExInputs
  exit: ExitInputs
  waterfall: WaterfallInputs
  market: MarketInputs
}

export interface AnnualCashFlow {
  year: number; gpr: number; vacancyLoss: number; creditLoss: number
  concessions: number; otherIncome: number; egi: number; totalOpEx: number
  noi: number; capRate: number; debtService: number; dscr: number
  btcf: number; capEx: number; depreciation: number; taxableIncome: number
  taxes: number; atcf: number; beginningEquity: number; endingEquity: number
  saleProceeds: number; totalReturn: number; cocReturn: number
  lpDistribution: number; gpDistribution: number
}
export interface LoanSummary {
  loanAmount: number; annualDebtService: number; monthlyPayment: number
  ioPayment: number; dscr: number; ltv: number; loanConstant: number; balloonBalance: number
}
export interface SensitivityGrid {
  rowLabel: string; colLabel: string; rows: number[]; cols: number[]; values: number[][]
}
export interface ProFormaOutput {
  totalProjectCost: number; totalEquity: number; totalDebt: number; ltv: number
  loanSummaries: LoanSummary[]; year1: AnnualCashFlow; annualCashFlows: AnnualCashFlow[]
  irr: number; lpIrr: number; npv: number; equityMultiple: number; lpEquityMultiple: number
  averageCoCReturn: number; exitPrice: number; exitNOI: number
  goingInCapRate: number; exitCapRate: number; grm: number
  breakEvenOccupancy: number; pricePerUnit: number; pricePerSqft: number
  noiPerUnit: number; noiPerSqft: number; totalDepreciation: number
  capRateSensitivity: SensitivityGrid; vacancySensitivity: SensitivityGrid
  purchasePriceSensitivity: SensitivityGrid
}
