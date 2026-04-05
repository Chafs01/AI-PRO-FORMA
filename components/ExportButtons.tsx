'use client'
import { useState } from 'react'
import { Download, FileSpreadsheet, Printer, Loader2 } from 'lucide-react'
import type { ProFormaInput, ProFormaOutput } from '@/types/proforma'

interface Props { input: ProFormaInput; output: ProFormaOutput }

export function ExportButtons({ input, output }: Props) {
  const [xlsxLoading, setXlsxLoading] = useState(false)
  const [xlsxError, setXlsxError] = useState<string | null>(null)

  async function handleExcelExport() {
    setXlsxLoading(true)
    setXlsxError(null)
    try {
      const res = await fetch('/api/export-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, output }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Export failed')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const name = input.property.propertyName || 'ProForma'
      a.href = url
      a.download = `${name.replace(/[^a-z0-9]/gi, '_')}_ProForma.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: unknown) {
      setXlsxError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setXlsxLoading(false)
    }
  }

  function handlePrint() {
    window.print()
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleExcelExport}
        disabled={xlsxLoading}
        className="btn-gold"
      >
        {xlsxLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="w-4 h-4" />
        )}
        {xlsxLoading ? 'Generating...' : 'Export Excel'}
      </button>

      <button onClick={handlePrint} className="btn-secondary">
        <Printer className="w-4 h-4" />
        Print / PDF
      </button>

      {xlsxError && (
        <span className="text-xs text-red-600">{xlsxError}</span>
      )}
    </div>
  )
}
