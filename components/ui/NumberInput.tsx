'use client'
import { useEffect, useState } from 'react'

interface NumberInputProps {
  label: string
  value: number
  onChange: (v: number) => void
  prefix?: string   // $ or %
  suffix?: string
  step?: number
  min?: number
  max?: number
  decimals?: number
  hint?: string
  className?: string
}

export function NumberInput({
  label,
  value,
  onChange,
  prefix,
  suffix,
  step = 1,
  min,
  max,
  decimals = 0,
  hint,
  className,
}: NumberInputProps) {
  const [raw, setRaw] = useState(String(value ?? ''))

  useEffect(() => {
    // Sync when value changes externally
    setRaw(value != null ? String(value) : '')
  }, [value])

  function handleBlur() {
    const parsed = parseFloat(raw.replace(/[^0-9.-]/g, ''))
    if (!isNaN(parsed)) {
      const clamped =
        min != null && parsed < min
          ? min
          : max != null && parsed > max
          ? max
          : parsed
      const rounded = Number(clamped.toFixed(decimals))
      onChange(rounded)
      setRaw(String(rounded))
    } else {
      setRaw(String(value ?? ''))
    }
  }

  return (
    <div className={className}>
      <label className="input-label">{label}</label>
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3 text-gray-400 text-sm select-none pointer-events-none">
            {prefix}
          </span>
        )}
        <input
          type="number"
          className={`input-field ${prefix ? 'pl-7' : ''} ${suffix ? 'pr-10' : ''}`}
          value={raw}
          step={step}
          min={min}
          max={max}
          onChange={(e) => setRaw(e.target.value)}
          onBlur={handleBlur}
        />
        {suffix && (
          <span className="absolute right-3 text-gray-400 text-sm select-none pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  )
}
