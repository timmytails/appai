import { useMemo, useState, useEffect } from 'react'
import { getBreedsForType } from '../utils/petBreeds'

/**
 * BreedSelect Component
 * Renders a breed dropdown dynamically updated based on pet type (dog/cat),
 * with an "Other / Outside list" option for custom breeds.
 */
export default function BreedSelect({
    petType = 'dog',
    value = '',
    onChange,
    label = 'Breed',
    variant = 'editorial', // 'editorial' (Booking), 'mypets' / 'gold', or 'classic'
    labelClassName,
    selectClassName,
    required = true,
    help
}) {
    const breedList = useMemo(() => getBreedsForType(petType), [petType])
    const isKnownBreed = useMemo(() => breedList.includes(value), [breedList, value])

    const [isCustomMode, setIsCustomMode] = useState(!isKnownBreed && Boolean(value))

    useEffect(() => {
        if (value && !breedList.includes(value)) {
            setIsCustomMode(true)
        } else if (breedList.includes(value)) {
            setIsCustomMode(false)
        }
    }, [value, breedList])

    const handleSelectChange = (e) => {
        const selected = e.target.value
        if (selected === '__other__') {
            setIsCustomMode(true)
            onChange('')
        } else {
            setIsCustomMode(false)
            onChange(selected)
        }
    }

    const defaultLabelClasses = variant === 'mypets' || variant === 'gold'
        ? 'mb-1.5 block text-[9px] font-bold uppercase tracking-[1.5px] text-[#a47d44]'
        : 'mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--tt-ink-soft)]'

    const defaultSelectClasses = variant === 'mypets' || variant === 'gold'
        ? 'field-control h-11 w-full rounded-md border border-[rgba(210,143,119,0.4)] bg-white px-3 text-sm text-[#24211e] outline-none transition-colors focus:border-[#a47d44]'
        : 'field-control h-11 w-full'

    const labelClasses = labelClassName || defaultLabelClasses
    const selectClasses = selectClassName || defaultSelectClasses

    return (
        <div className='block'>
            <label className='block'>
                {label && <span className={labelClasses}>{label}</span>}
                {!isCustomMode ? (
                    <select
                        value={isKnownBreed ? value : (value ? '__other__' : '')}
                        onChange={handleSelectChange}
                        required={required}
                        className={selectClasses}
                    >
                        <option value=''>-- Select {petType === 'cat' ? 'Cat' : 'Dog'} Breed --</option>
                        <optgroup label={petType === 'cat' ? 'Popular Cat Breeds' : 'Popular Dog Breeds'}>
                            {breedList.map((b) => (
                                <option key={b} value={b}>{b}</option>
                            ))}
                        </optgroup>
                        <option value='__other__'>Other (Type manually)…</option>
                    </select>
                ) : (
                    <div className='space-y-1.5'>
                        <input
                            type='text'
                            required={required}
                            value={value}
                            placeholder={`Enter ${petType === 'cat' ? 'cat' : 'dog'} breed`}
                            onChange={(e) => onChange(e.target.value)}
                            className={selectClasses}
                        />
                        <button
                            type='button'
                            onClick={() => { setIsCustomMode(false); onChange('') }}
                            className='text-[11px] text-[#a47d44] hover:underline font-medium'
                        >
                            &larr; Choose from breed list
                        </button>
                    </div>
                )}
                {help && <span className='mt-1 block text-[11px] text-[var(--tt-ink-soft)]'>{help}</span>}
            </label>
        </div>
    )
}
