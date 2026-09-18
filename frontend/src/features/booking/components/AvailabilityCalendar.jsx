import { ChevronLeft, ChevronRight } from 'lucide-react'
import { addMonths, monthFromKey, toDateKey, toMonthKey } from '../utils/dateTime'

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function AvailabilityCalendar({
    monthKey,
    selectedDate,
    statuses,
    onMonthChange,
    onSelect,
    minDate,
    maxDate,
    loading
}) {
    const monthDate = monthFromKey(monthKey)
    const year = monthDate.getFullYear()
    const month = monthDate.getMonth()
    const firstDay = new Date(year, month, 1, 12).getDay()
    const daysInMonth = new Date(year, month + 1, 0, 12).getDate()
    const cells = Array(firstDay).fill(null).concat(Array.from({ length: daysInMonth }, (_, index) => index + 1))
    const previousMonth = toMonthKey(addMonths(monthDate, -1))
    const nextMonth = toMonthKey(addMonths(monthDate, 1))
    const minMonth = minDate.slice(0, 7)
    const maxMonth = maxDate.slice(0, 7)

    return (
        <div className='booking-calendar rounded-sm border border-[var(--tt-border)] bg-white p-5'>
            <div className='mb-5 flex items-center justify-between'>
                <button
                    type='button'
                    disabled={previousMonth < minMonth}
                    onClick={() => onMonthChange(previousMonth)}
                    className='grid h-9 w-9 place-items-center rounded-full border border-[var(--tt-canvas)] disabled:cursor-not-allowed disabled:opacity-30'
                    aria-label='Previous month'
                >
                    <ChevronLeft size={18} />
                </button>
                <h3 className='font-serif text-xl font-bold'>{monthDate.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })}</h3>
                <button
                    type='button'
                    disabled={nextMonth > maxMonth}
                    onClick={() => onMonthChange(nextMonth)}
                    className='grid h-9 w-9 place-items-center rounded-full border border-[var(--tt-canvas)] disabled:cursor-not-allowed disabled:opacity-30'
                    aria-label='Next month'
                >
                    <ChevronRight size={18} />
                </button>
            </div>

            <div className='grid grid-cols-7 gap-1 text-center'>
                {weekdays.map((day) => <div key={day} className='py-2 text-[11px] font-bold uppercase tracking-wide text-[var(--tt-brand)]'>{day}</div>)}
                {cells.map((day, index) => {
                    if (!day) return <div key={`blank-${index}`} />
                    const dateKey = toDateKey(new Date(year, month, day, 12))
                    const status = statuses[dateKey] || (loading ? 'loading' : 'available')
                    const selected = selectedDate === dateKey
                    const isUserBooked = status === 'user-booked'
                    const disabled = dateKey < minDate || dateKey > maxDate || ['past', 'closed', 'fully-booked', 'outside-range', 'loading', 'user-booked'].includes(status)
                    const className = selected
                        ? 'border-[var(--tt-brand)] bg-[var(--tt-brand)] text-[var(--tt-canvas)]'
                        : isUserBooked
                            ? 'border-[#c97453] bg-[#faebe5] text-[#8c3d20] font-bold shadow-xs cursor-not-allowed opacity-95'
                            : status === 'fully-booked' || status === 'closed'
                                ? 'border-[var(--tt-brand-strong)] bg-[var(--tt-brand-strong)] text-white'
                                : status === 'past' || status === 'outside-range'
                                    ? 'border-[var(--tt-brand-strong)] bg-[var(--tt-brand-strong)] text-white'
                                    : 'border-[var(--tt-canvas)] bg-[var(--tt-canvas)] text-[var(--tt-ink)] hover:border-[var(--tt-brand)] hover:bg-[var(--tt-canvas)]'

                    return (
                        <button
                            key={dateKey}
                            type='button'
                            disabled={disabled}
                            onClick={() => {
                                if (disabled || isUserBooked) return
                                onSelect(dateKey)
                            }}
                            className={`aspect-square rounded-sm border text-sm font-bold transition disabled:cursor-not-allowed ${className}`}
                            title={isUserBooked ? 'You already have an appointment on this day' : status === 'fully-booked' ? 'Fully booked' : status === 'closed' ? 'Closed' : ''}
                        >
                            {day}
                        </button>
                    )
                })}
            </div>

            <div className='mt-5 flex flex-wrap gap-4 border-t border-[var(--tt-border)] pt-4 text-xs text-[var(--tt-brand)]'>
                <Legend className='bg-[var(--tt-canvas)] border-[var(--tt-canvas)]' label='Available' />
                <Legend className='bg-[var(--tt-brand)] border-[var(--tt-brand)]' label='Booked or closed' />
                <Legend className='bg-[#faebe5] border-[#c97453]' label='Your appointment' />
                <Legend className='bg-[var(--tt-canvas)] border-[var(--tt-canvas)]' label='Past or unavailable' />
            </div>
        </div>
    )
}

function Legend({ className, label }) {
    return <span className='flex items-center gap-2'><span className={`h-4 w-4 rounded border ${className}`} />{label}</span>
}
