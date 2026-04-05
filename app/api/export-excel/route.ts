import { NextRequest, NextResponse } from 'next/server'
import type { ProFormaInput, ProFormaOutput } from '@/types/proforma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { input: ProFormaInput; output: ProFormaOutput }
    const { buildExcelWorkbook } = await import('@/lib/excelBuilder')

    const buffer = buildExcelWorkbook(body.input, body.output)

    const propName = body.input.property.propertyName || 'ProForma'
    const fileName = `${propName.replace(/[^a-z0-9]/gi, '_')}_ProForma.xlsx`

    return new Response(new Uint8Array(buffer).buffer as ArrayBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })
  } catch (err: unknown) {
    console.error('[export-excel]', err)
    const message = err instanceof Error ? err.message : 'Export failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
