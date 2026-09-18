import { AlertTriangle } from 'lucide-react'

export default function ConfirmModal({
    isOpen,
    title = 'Confirm Action',
    description = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger',
    loading = false,
    onConfirm,
    onClose
}) {
    if (!isOpen) return null
    const isDanger = variant === 'danger'

    return (
        <div
            className='fixed inset-0 z-[100] flex items-end justify-center bg-[var(--tt-ink)]/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-5'
            onMouseDown={(event) => { if (event.target === event.currentTarget && !loading) onClose() }}
        >
            <div className='w-full max-w-md border border-[var(--tt-border)] bg-[var(--tt-canvas)] p-6 shadow-[0_30px_90px_rgba(51,51,47,.24)] sm:p-7'>
                <div className='flex items-start gap-4'>
                    <span className={`grid h-10 w-10 shrink-0 place-items-center border ${isDanger ? 'border-[#e8c5c5] bg-[#fbefef] text-[#934b4b]' : 'border-[var(--tt-border)] bg-white text-[var(--tt-gold)]'}`}>
                        <AlertTriangle size={18} strokeWidth={1.5} />
                    </span>
                    <div>
                        <p className='text-[9px] font-bold uppercase tracking-[.15em] text-[var(--tt-muted)]'>Please confirm</p>
                        <h3 className='mt-1 font-serif text-2xl leading-tight'>{title}</h3>
                        <p className='mt-3 text-xs leading-6 text-[var(--tt-muted)]'>{description}</p>
                    </div>
                </div>

                <div className='mt-7 flex flex-col-reverse gap-2 border-t border-[var(--tt-border)] pt-4 sm:flex-row sm:justify-end'>
                    <button type='button' onClick={onClose} disabled={loading} className='min-h-10 rounded-lg border border-[var(--tt-border)] bg-white px-5 text-xs font-semibold text-[var(--tt-muted)] hover:bg-[var(--tt-canvas)] transition-colors disabled:opacity-50'>{cancelText}</button>
                    <button type='button' onClick={onConfirm} disabled={loading} className={`min-h-10 rounded-lg px-5 text-xs font-semibold text-white shadow-xs transition-colors disabled:opacity-60 ${isDanger ? 'bg-[#934b4b] hover:bg-[#7d3f3f]' : 'bg-[#262626] hover:bg-[#3d3d3d]'}`}>{loading ? 'Processing…' : confirmText}</button>
                </div>
            </div>
        </div>
    )
}
