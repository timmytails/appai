import { formatTimeRange } from '../utils/dateTime'

export default function TimeSlotGrid({ slots, selectedTime, onSelect, loading }) {
    if (loading) {
        return <div className='rounded-sm border border-[var(--tt-border)] bg-white p-8 text-center text-sm text-[var(--tt-muted)]'>Loading available time slots...</div>
    }

    if (!slots.length) {
        return <div className='rounded-sm border border-[var(--tt-border)] bg-white p-8 text-center text-sm text-[var(--tt-muted)]'>Select an available date to view time slots.</div>
    }

    return (
        <div className='grid gap-3 sm:grid-cols-2'>
            {slots.map((slot) => {
                const selected = selectedTime === slot.startTime
                const disabled = slot.status !== 'available'
                const className = selected
                    ? 'border-[var(--tt-gold)] bg-[var(--tt-brand-strong)] text-white'
                    : slot.status === 'booked'
                        ? 'border-red-200 bg-red-50 text-red-500'
                        : slot.status === 'past'
                            ? 'border-stone-200 bg-stone-100 text-stone-400'
                            : 'border-[var(--tt-border)] bg-white text-[var(--tt-ink)] hover:border-[var(--tt-gold)]'

                return (
                    <button
                        key={`${slot.startTime}-${slot.endTime}`}
                        type='button'
                        disabled={disabled}
                        onClick={() => onSelect(slot.startTime)}
                        className={`rounded-sm border px-4 py-3 text-sm font-bold transition disabled:cursor-not-allowed ${className}`}
                    >
                        {formatTimeRange(slot.startTime, slot.endTime)}
                        {slot.status === 'booked' && <span className='ml-2 text-xs font-medium'>(Booked)</span>}
                        {slot.status === 'past' && <span className='ml-2 text-xs font-medium'>(Passed)</span>}
                    </button>
                )
            })}
        </div>
    )
}
