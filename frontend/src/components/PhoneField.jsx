import { useMemo } from 'react'

export default function PhoneField({
    label = '',
    name = 'phone',
    value = '',
    onChange,
    required = true,
    disabled = false,
    placeholder = '917 123 4567',
    help,
    error,
    className = '',
    inputContainerClassName = ''
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
                className={`flex h-12 items-center rounded-md border bg-white overflow-hidden transition ${
                    error
                        ? 'border-red-400 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-500/10'
                        : 'border-[rgba(210,143,119,0.35)] focus-within:border-[#d1a85b] focus-within:ring-2 focus-within:ring-[#d1a85b]/20'
                } ${disabled ? 'opacity-60' : ''} ${inputContainerClassName}`}
            >
                <div className='flex h-full items-center gap-1.5 border-r border-[rgba(210,143,119,0.25)] bg-[#fcf9f6] px-3.5 text-xs font-semibold text-[#82746b] select-none shrink-0'>
                    <span className='text-sm leading-none'>🇵🇭</span>
                    <span className='font-mono'>+63</span>
                </div>
                <input
                    type='tel'
                    name={name}
                    placeholder={placeholder}
                    value={displayValue}
                    onChange={handleChange}
                    required={required}
                    disabled={disabled}
                    className='h-full w-full bg-transparent px-3.5 text-sm font-sans text-[#24211e] outline-none placeholder:text-[#a89b91]'
                />
            </div>
            {help && <p className='text-xs text-[#82746b]'>{help}</p>}
            {error && <p className='text-xs font-medium text-red-500'>{error}</p>}
        </div>
    )
}
