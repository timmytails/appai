import { useMemo } from 'react'

export default function PhoneField({
    label = 'Phone Number',
    name = 'phone',
    value = '',
    onChange,
    required = true,
    disabled = false,
    placeholder = '917 123 4567',
    help,
    error,
    className = ''
}) {
    // Extract local 10 digits for display (strip +63, 63, or leading 0)
    const displayValue = useMemo(() => {
        let digits = String(value || '').replace(/\D/g, '')
        if (digits.startsWith('63')) digits = digits.slice(2)
        if (digits.startsWith('0')) digits = digits.slice(1)
        return digits.slice(0, 10)
    }, [value])

    const handleChange = (e) => {
        let raw = e.target.value.replace(/\D/g, '')
        if (raw.startsWith('63')) raw = raw.slice(2)
        if (raw.startsWith('0')) raw = raw.slice(1)
        raw = raw.slice(0, 10)

        // Pass full +63... phone to parent handler
        const formatted = raw ? `+63${raw}` : ''
        onChange?.({
            target: {
                name,
                value: formatted,
                raw
            }
        })
    }

    return (
        <div className={`space-y-1.5 ${className}`}>
            {label && (
                <label className='block text-xs font-bold uppercase tracking-[0.14em] text-[var(--tt-brand)]'>
                    {label}
                </label>
            )}
            <div
                className={`flex h-11 items-center rounded-sm border bg-[var(--tt-canvas)] overflow-hidden transition ${
                    error
                        ? 'border-[var(--tt-brand)] focus-within:border-[var(--tt-brand)] focus-within:ring-2 focus-within:ring-[var(--tt-brand)]/10'
                        : 'border-[var(--tt-canvas)] focus-within:border-[var(--tt-brand)] focus-within:ring-2 focus-within:ring-[var(--tt-brand)]/10'
                } ${disabled ? 'opacity-60' : ''}`}
            >
                <div className='flex h-full items-center gap-1.5 border-r border-[var(--tt-canvas)] bg-[var(--tt-canvas)] px-3 text-xs font-bold text-[var(--tt-ink-soft)] select-none shrink-0'>
                    <span className='text-sm leading-none'>🇵🇭</span>
                    <span>+63</span>
                </div>
                <input
                    type='tel'
                    name={name}
                    placeholder={placeholder}
                    value={displayValue}
                    onChange={handleChange}
                    required={required}
                    disabled={disabled}
                    className='h-full w-full bg-transparent px-3.5 text-sm font-mono text-[var(--tt-ink)] outline-none placeholder:font-sans placeholder:text-[var(--tt-muted)]'
                />
            </div>
            {help && <p className='text-xs text-[var(--tt-brand)]'>{help}</p>}
            {error && <p className='text-xs font-medium text-[var(--tt-brand-strong)]'>{error}</p>}
        </div>
    )
}
