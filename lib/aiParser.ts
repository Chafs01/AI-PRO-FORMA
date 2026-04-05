import type { ProFormaInput } from '@/types/proforma'

interface ParsedDocumentResult {
  extractedData: Partial<ProFormaInput>
  warnings: string[]
  confidence: 'high' | 'medium' | 'low'
  rawSummary?: string
}

const SYSTEM_PROMPT = `You are an expert commercial real estate analyst.
Your job is to extract structured financial data from real estate documents (Crexi memos, OM packages, rent rolls, appraisals, etc.).
Extract every number you can find and return a JSON object matching the schema exactly.
If a value is not present in the document, omit that field.
Be precise with numbers — never round unless the document rounds.`

const USER_PROMPT_TEMPLATE = `Extract all real estate pro forma data from the following document text and return a single JSON object.

The JSON must follow this schema:
{
  "property": {
    "propertyName": string,
    "address": string,
    "city": string,
    "state": string,
    "zipCode": string,
    "county": string,
    "propertyType": "multifamily"|"office"|"retail"|"industrial"|"mixed-use"|"single-family"|"self-storage"|"hospitality"|"other",
    "yearBuilt": number,
    "totalUnits": number,
    "totalSqft": number,
    "lotSizeSqft": number,
    "stories": number,
    "parkingSpaces": number,
    "unitMix": [{"id":"1","unitType":string,"unitCount":number,"sqft":number,"marketRent":number,"currentRent":number}]
  },
  "acquisition": {
    "purchasePrice": number,
    "closingCosts": number (percentage),
    "immediateCapEx": number,
    "transferTax": number,
    "titleInsurance": number,
    "otherAcquisitionCosts": number
  },
  "financing": {
    "useFinancing": boolean,
    "loans": [{"id":"1","label":string,"loanAmount":number,"interestRate":number,"amortizationYears":number,"ioPeriodYears":number,"loanTermYears":number,"isFloating":boolean}]
  },
  "income": {
    "vacancyRate": number (percentage, e.g. 5 for 5%),
    "creditLoss": number,
    "concessions": number,
    "otherIncome": [{"id":"1","label":string,"annualAmount":number,"growthRate":number}],
    "rentGrowthRate": number
  },
  "expenses": {
    "propertyTaxes": number,
    "insurance": number,
    "utilities": number,
    "repairsAndMaintenance": number,
    "propertyManagement": number (percentage of EGI),
    "payrollAdmin": number,
    "marketing": number,
    "professionalFees": number,
    "reservesForReplacement": number,
    "hoa": number,
    "landscaping": number,
    "pestControl": number,
    "securitySystems": number,
    "otherExpenses": number,
    "expenseGrowthRate": number
  },
  "exit": {
    "holdingPeriodYears": number,
    "exitCapRate": number,
    "sellingCosts": number (percentage),
    "costBasis": number,
    "depreciableLife": number,
    "taxRate": number,
    "longTermCapGainsRate": number,
    "discountRate": number
  }
}

Return ONLY the JSON, no markdown, no explanation.

DOCUMENT TEXT:
{{DOCUMENT_TEXT}}`

export async function parseDocumentWithAI(
  documentText: string,
  apiKey: string
): Promise<ParsedDocumentResult> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default
  const client = new Anthropic({ apiKey })

  const prompt = USER_PROMPT_TEMPLATE.replace('{{DOCUMENT_TEXT}}', documentText.slice(0, 15000))

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('')

  let extractedData: Partial<ProFormaInput> = {}
  const warnings: string[] = []

  try {
    // Strip any accidental markdown fences
    const clean = text.replace(/```json|```/g, '').trim()
    extractedData = JSON.parse(clean)
  } catch {
    warnings.push('Could not parse AI response as JSON. Please fill in fields manually.')
  }

  const fieldCount = Object.keys(extractedData).length
  const confidence: 'high' | 'medium' | 'low' =
    fieldCount >= 4 ? 'high' : fieldCount >= 2 ? 'medium' : 'low'

  // Assign auto-incrementing IDs if needed
  if (extractedData.property?.unitMix) {
    extractedData.property.unitMix = extractedData.property.unitMix.map((u, i) => ({
      ...u,
      id: String(i + 1),
    }))
  }
  if (extractedData.financing?.loans) {
    extractedData.financing.loans = extractedData.financing.loans.map((l, i) => ({
      ...l,
      id: String(i + 1),
    }))
  }
  if (extractedData.income?.otherIncome) {
    extractedData.income.otherIncome = extractedData.income.otherIncome.map((o, i) => ({
      ...o,
      id: String(i + 1),
    }))
  }

  return {
    confidence,
    extractedData,
    rawSummary: text.slice(0, 500),
    warnings,
  }
}
