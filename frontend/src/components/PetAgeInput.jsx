import { useState, useEffect } from 'react'

/**
 * PetAgeInput
 * Allows pet owners to input their pet's age in either Years or Months,
 * while automatically calculating and returning total months to the parent.
 *
 * @param {string|number} value - The age in total months.
 * @param {function} onChange - Callback function returning total months (string/number).
 * @param {string} variant - 'mypets' / 'gold' for MyPets, 'editorial' for Booking.
 * @param {string} label - Input label text.
 */
export default function PetAgeInput({
  value = '',
  onChange,
  variant = 'editorial',
  label = 'Age',
  required = false
}) {
  const [unit, setUnit] = useState(() => {
    const num = Number(value)
    if (!Number.isFinite(num) || value === '' || value === null || value === undefined) {
      return 'years'
    }
    return num < 12 ? 'months' : 'years'
  })

  const [rawNumber, setRawNumber] = useState(() => {
    const num = Number(value)
    if (!Number.isFinite(num) || value === '' || value === null || value === undefined) {
      return ''
    }
    if (num < 12) return String(num)
    const yrs = num / 12
    return String(Number.isInteger(yrs) ? yrs : Number(yrs.toFixed(1)))
  })

  // Sync internal state if external value changes (e.g. resetting form or selecting another pet)
  useEffect(() => {
    if (value === '' || value === null || value === undefined) {
      setRawNumber('')
      return
    }
    const num = Number(value)
    if (!Number.isFinite(num)) {
      setRawNumber('')
      return
    }

    if (unit === 'years') {
      const yrs = num / 12
      setRawNumber(String(Number.isInteger(yrs) ? yrs : Number(yrs.toFixed(1))))
    } else {
      setRawNumber(String(num))
    }
  }, [value, unit])

  const handleNumberChange = (e) => {
    const val = e.target.value
    setRawNumber(val)

    if (val === '') {
      onChange('')
      return
    }

    const parsed = parseFloat(val)
    if (isNaN(parsed) || parsed < 0) {
      onChange('')
      return
    }

    const calculatedMonths = unit === 'years' ? Math.round(parsed * 12) : Math.round(parsed)
    onChange(calculatedMonths)
  }

  const handleUnitChange = (e) => {
    const newUnit = e.target.value
    setUnit(newUnit)

    if (rawNumber === '') return

    const parsed = parseFloat(rawNumber)
    if (isNaN(parsed) || parsed < 0) return

    if (newUnit === 'years') {
      // Switched from months to years
      const yrs = parsed / 12
      const formatted = Number.isInteger(yrs) ? yrs : Number(yrs.toFixed(1))
      setRawNumber(String(formatted))
      onChange(Math.round(parsed))
    } else {
      // Switched from years to months
      const totalMonths = Math.round(parsed * 12)
      setRawNumber(String(totalMonths))
      onChange(totalMonths)
    }
  }

  const isGold = variant === 'mypets' || variant === 'gold'

  return (
    <div className='block'>
      <label className='block'>
        <span
          className={
            isGold
              ? 'mb-1.5 block text-[9px] font-bold uppercase tracking-[1.5px] text-[#a47d44]'
              : 'mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--tt-ink-soft)]'
          }
        >
          {label}
        </span>
        <div
          className={`flex overflow-hidden transition-colors ${
            isGold
              ? 'rounded-md border border-[rgba(210,143,119,0.4)] bg-white focus-within:border-[#a47d44]'
              : 'border border-[var(--tt-border)] bg-white focus-within:border-[var(--tt-ink)]'
          }`}
        >
          <input
            type='number'
            min='0'
            step='any'
            required={required}
            value={rawNumber}
            onChange={handleNumberChange}
            placeholder={unit === 'years' ? 'e.g. 2' : 'e.g. 6'}
            className='h-11 w-full bg-transparent px-3 text-sm text-[#24211e] outline-none placeholder:text-[#82746b]/50'
          />
          <select
            value={unit}
            onChange={handleUnitChange}
            aria-label='Age unit'
            className={`h-11 border-l text-xs font-semibold outline-none cursor-pointer px-3 transition-colors ${
              isGold
                ? 'border-[rgba(210,143,119,0.3)] bg-[#fdf4ef] text-[#635b53] hover:text-[#24211e]'
                : 'border-[var(--tt-border)] bg-[var(--tt-canvas)] text-[var(--tt-ink-soft)] hover:text-[var(--tt-ink)]'
            }`}
          >
            <option value='years'>Years</option>
            <option value='months'>Months</option>
          </select>
        </div>
      </label>
    </div>
  )
}
