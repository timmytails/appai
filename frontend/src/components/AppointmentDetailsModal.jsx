import { useEffect, useState } from 'react'
import { Calendar, CalendarDays, Clock3, MapPin, Phone, Scissors, Sparkles, User, XCircle } from 'lucide-react'
import { formatDateLong, formatTimeRange } from '../features/booking/utils/dateTime'
import { getRemainingEditSeconds, formatRemainingTime } from '../utils/appointmentEditWindow'

export default function AppointmentDetailsModal({ appointment, onClose, onCancel, onReschedule }) {
    const [secondsLeft, setSecondsLeft] = useState(() => getRemainingEditSeconds(appointment))

    useEffect(() => {
        const remaining = getRemainingEditSeconds(appointment)
        setSecondsLeft(remaining)

        if (!appointment || remaining <= 0) return undefined

        const timer = setInterval(() => {
            setSecondsLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer)
                    return 0
                }
                return prev - 1
            })
        }, 1000)
        return () => clearInterval(timer)
    }, [appointment])

    if (!appointment) return null

    const statusLabel = appointment.status === 'confirmed' ? 'Approved' : appointment.status === 'pending' ? 'Pending' : appointment.status === 'completed' ? 'Completed' : 'Cancelled'
    const statusStyle =
        appointment.status === 'confirmed'
            ? 'border-[#cdbd86] bg-[#f5efd9] text-[#675728]'
            : appointment.status === 'pending'
            ? 'border-[#ead7ca] bg-[var(--tt-accent-soft)] text-[#79584b]'
            : appointment.status === 'completed'
            ? 'border-[var(--tt-border)] bg-white text-[var(--tt-muted)]'
            : 'border-[#e8c5c5] bg-[#fbefef] text-[#934b4b]'

    const isUpcoming = ['pending', 'confirmed'].includes(appointment.status)
    const isEditable = secondsLeft > 0 && isUpcoming

    return (
        <div
            className='fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[var(--tt-ink)]/40 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto'
            onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
            <div className='w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[var(--tt-canvas)] p-5 sm:p-6 border border-[var(--tt-border)] space-y-4 text-[var(--tt-ink)] pb-safe'>
                {/* Header */}
                <div className='flex items-start justify-between border-b border-[var(--tt-brand)] pb-3.5 gap-3'>
                    <div>
                        <div className='flex items-center gap-2'>
                            <span className={`inline-block border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusStyle}`}>
                                {statusLabel}
                            </span>
                            {appointment._id && (
                                <span className='text-[10px] font-mono text-[var(--tt-ink-soft)]'>
                                    ID: #{appointment._id.slice(-6).toUpperCase()}
                                </span>
                            )}
                        </div>
                        <h2 className='mt-1.5 font-serif text-2xl font-bold text-[var(--tt-ink)]'>
                            {appointment.petName}
                        </h2>
                        <p className='mt-0.5 text-[11px] font-semibold text-[var(--tt-ink-soft)] uppercase tracking-wider'>
                            {appointment.petType === 'cat' ? 'Cat' : 'Dog'} {appointment.breed ? `· ${appointment.breed}` : ''}
                        </p>
                    </div>

                    {/* Top Right Action / Status Badge */}
                    {isUpcoming && isEditable && onReschedule && (
                        <button
                            onClick={() => {
                                onReschedule(appointment)
                                onClose()
                            }}
                            className='inline-flex items-center gap-1.5 border border-[var(--tt-border)] bg-white px-3 py-1.5 text-xs font-bold text-[var(--tt-ink)] transition hover:bg-[var(--tt-accent)] shrink-0'
                        >
                            <Calendar size={14} className='text-[var(--tt-ink)]' />
                            <span>Edit Date ({formatRemainingTime(secondsLeft)})</span>
                        </button>
                    )}
                    {isUpcoming && !isEditable && (
                        <span className='inline-block text-[11px] font-medium text-[var(--tt-ink-soft)] bg-[var(--tt-canvas)] px-2.5 py-1 rounded-md border border-[var(--tt-border)] shrink-0' title='Rescheduling is only allowed within 3 minutes of booking.'>
                            Cannot be edited
                        </span>
                    )}
                </div>

                {/* Service & Price Details */}
                <div className='rounded-sm border border-[var(--tt-border)] bg-white p-4 space-y-3'>
                    <div className='flex items-start justify-between gap-4'>
                        <div className='flex items-center gap-3'>
                            <span className='grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--tt-brand)] text-[var(--tt-canvas)]'>
                                <Scissors size={16} />
                            </span>
                            <div>
                                <h3 className='font-serif text-base font-bold text-[var(--tt-ink)]'>
                                    {appointment.service}
                                </h3>
                                {appointment.haircutStyle && (
                                    <p className='text-xs font-semibold text-[var(--tt-brand)]'>
                                        Style: {appointment.haircutStyle}
                                    </p>
                                )}
                            </div>
                        </div>
                        <span className='font-serif text-xl font-bold text-[var(--tt-ink)] shrink-0'>
                            ₱{Number(appointment.price || 0).toLocaleString('en-PH')}
                        </span>
                    </div>

                    <div className='grid gap-2 pt-2.5 border-t border-[var(--tt-brand)] sm:grid-cols-2 text-xs text-[var(--tt-ink-soft)] font-semibold'>
                        <div className='flex items-center gap-2'>
                            <CalendarDays size={14} className='text-[var(--tt-brand)]' />
                            <span>{formatDateLong(appointment.date)}</span>
                        </div>
                        <div className='flex items-center gap-2'>
                            <Clock3 size={14} className='text-[var(--tt-brand)]' />
                            <span>{formatTimeRange(appointment.time, appointment.endTime)}</span>
                        </div>
                    </div>
                </div>

                {/* AI Preview Image (if available) */}
                {(appointment.aiPreviewImage || appointment.aiPreview?.generatedImage) && (
                    <div className='space-y-1.5'>
                        <div className='flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--tt-brand)]'>
                            <Sparkles size={13} />
                            <span>Requested Haircut Style Preview</span>
                        </div>
                        <div className='overflow-hidden rounded-sm border border-[var(--tt-border)] bg-[var(--tt-ink)] text-center p-2'>
                            <img
                                src={appointment.aiPreviewImage || appointment.aiPreview?.generatedImage}
                                alt='Haircut preview'
                                className='max-h-52 w-full object-contain mx-auto'
                            />
                        </div>
                    </div>
                )}

                {/* Customer Information */}
                <div className='space-y-2 pt-0.5'>
                    <h4 className='text-[10px] font-bold uppercase tracking-wider text-[var(--tt-ink-soft)]'>
                        Customer & Appointment Info
                    </h4>
                    <div className='grid gap-2.5 text-xs text-[var(--tt-ink-soft)] sm:grid-cols-2'>
                        {appointment.ownerName && (
                            <div className='flex items-center gap-2.5 rounded-lg border border-[var(--tt-border)] bg-[var(--tt-canvas)] p-2.5'>
                                <User size={15} className='shrink-0 text-[var(--tt-brand)]' />
                                <div>
                                    <p className='text-[9px] text-[var(--tt-ink-soft)] uppercase font-bold'>Pet Owner</p>
                                    <p className='font-bold text-[var(--tt-ink)]'>{appointment.ownerName}</p>
                                </div>
                            </div>
                        )}
                        {appointment.ownerPhone && (
                            <div className='flex items-center gap-2.5 rounded-lg border border-[var(--tt-border)] bg-[var(--tt-canvas)] p-2.5'>
                                <Phone size={15} className='shrink-0 text-[var(--tt-brand)]' />
                                <div>
                                    <p className='text-[9px] text-[var(--tt-ink-soft)] uppercase font-bold'>Mobile Phone</p>
                                    <p className='font-bold text-[var(--tt-ink)]'>{appointment.ownerPhone}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Notes */}
                {appointment.notes && (
                    <div className='rounded-lg border border-[var(--tt-border)] bg-[var(--tt-canvas)] p-3 text-xs space-y-1'>
                        <p className='font-bold text-[var(--tt-ink-soft)] uppercase tracking-wider text-[9px]'>Special Instructions</p>
                        <p className='text-[var(--tt-ink-soft)] leading-relaxed'>&quot;{appointment.notes}&quot;</p>
                    </div>
                )}

                {/* Cancellation Reason Alert (if cancelled) */}
                {appointment.status === 'cancelled' && (
                    <div className='rounded-lg border border-[#F0CCCC] bg-[#FBEAEA] p-3 text-xs text-[#7F3333] space-y-1'>
                        <div className='flex items-center gap-1.5 font-bold uppercase tracking-wider text-[9px] text-[#9E3E3E]'>
                            <XCircle size={14} />
                            <span>Cancellation Explanation</span>
                        </div>
                        <p className='leading-relaxed font-medium text-xs'>
                            {appointment.cancellationReason || 'This booking was cancelled.'}
                        </p>
                    </div>
                )}

                {/* Location & Arrival Policy Reminder */}
                <div className='border border-[var(--tt-border)] bg-white p-3 text-xs text-[var(--tt-ink)] space-y-1'>
                    <div className='flex items-center gap-2 font-bold text-[var(--tt-ink)]'>
                        <MapPin size={15} className='shrink-0 text-[var(--tt-brand)]' />
                        <span>TimmyTails · Baliuag City, Bulacan</span>
                    </div>
                    <p className='pl-5 text-[11px] text-[var(--tt-ink)]/90 leading-normal'>
                        Please arrive <strong>5–10 minutes before</strong> your appointment. Late arrival beyond 10 minutes will automatically cancel your booking.
                    </p>
                </div>

                {/* Actions */}
                <div className='flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-[rgba(210,143,119,0.3)]'>
                    {isUpcoming && onCancel && (
                        <button
                            type='button'
                            onClick={() => {
                                onCancel(appointment)
                                onClose()
                            }}
                            className='inline-flex items-center gap-1.5 rounded-lg border border-[#e8c5c5] bg-white px-3.5 py-2 text-xs font-semibold text-[#934b4b] shadow-xs transition-colors hover:border-[#d99b9b] hover:bg-[#fbefef] hover:text-[#7d3f3f]'
                        >
                            <XCircle size={14} />
                            <span>Cancel appointment</span>
                        </button>
                    )}
                    <button
                        type='button'
                        onClick={onClose}
                        className='rounded-lg bg-[#262626] px-5 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#3d3d3d]'
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}
