import { Sparkles } from 'lucide-react'

export default function AiStyleFloatingButton({
    onClick,
    selectedStyleName,
    hasPreview = false,
    generating = false
}) {
    return (
        <aside aria-label='AI Style Preview'>
            <button
                type='button'
                onClick={onClick}
                className='fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full border border-white/20 bg-[var(--tt-ink)] px-3.5 py-2 text-xs font-semibold text-white shadow-[0_10px_24px_rgba(45,41,37,0.3)] backdrop-blur-md transition-all duration-300 hover:scale-[1.02] hover:bg-[#514b42] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tt-gold)] sm:bottom-6 sm:right-6 md:bottom-8 md:right-8 md:px-4 md:py-2.5'
                aria-label='Open AI Grooming Style Preview'
            >
                <Sparkles size={14} className='text-[var(--tt-gold)]' />
                
                <span className='font-sans font-medium'>
                    {generating
                        ? 'Preparing preview…'
                        : selectedStyleName
                            ? `${selectedStyleName}`
                            : 'AI style preview'}
                </span>

                {hasPreview && (
                    <span className='ml-1 rounded-full bg-[var(--tt-gold)] px-1.5 py-0.5 text-[9px] font-extrabold text-[var(--tt-ink)]'>
                        Ready
                    </span>
                )}
            </button>
        </aside>
    )
}
