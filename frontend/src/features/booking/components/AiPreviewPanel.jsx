import {
    Check,
    CheckCircle2,
    Image as ImageIcon,
    Loader2,
    RefreshCw,
    Scissors,
    Sparkles,
    Upload
} from 'lucide-react'

export default function AiPreviewPanel({
    photoPreview,
    onPhotoChange,
    generatedPreview,
    selectedStyle,
    selectedStyleName,
    onOpenStyleModal,
    previewFromCache,
    consent,
    onConsentChange,
    verificationStatus,
    galleryGenerating,
    galleryMessage,
    onRegenerateSelected
}) {
    const styleName = selectedStyle?.name || selectedStyleName || ''

    return (
        <div className='space-y-8'>
            {/* Top Row: Photo Reference & Guidelines */}
            <section className='grid gap-5 border-b border-[var(--tt-border)] pb-8 lg:grid-cols-[minmax(0,1fr)_360px]'>
                <div>
                    <div className='mb-3'>
                        <p className='text-[10px] font-bold uppercase tracking-[.18em] text-[var(--tt-gold)]'>Photo reference</p>
                        <h3 className='mt-1 font-serif text-2xl text-[var(--tt-ink)]'>Add a clear photo of your pet</h3>
                        <p className='mt-2 max-w-2xl text-sm leading-6 text-[var(--tt-muted)]'>
                            Use a recent front or three-quarter photo with the face and coat visible. The image is used to prepare the grooming reference shown in this booking.
                        </p>
                    </div>

                    <div className='relative min-h-64 overflow-hidden border border-dashed border-[var(--tt-border)] bg-white'>
                        {photoPreview ? (
                            <div className='relative h-72 w-full'>
                                <img src={photoPreview} alt='Pet reference' className='h-full w-full object-contain p-3' />
                                <label className='absolute bottom-3 right-3 inline-flex cursor-pointer items-center gap-2 border border-[var(--tt-border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--tt-ink)] shadow-sm hover:bg-[var(--tt-canvas)]'>
                                    <Upload size={14} /> Change photo
                                    <input type='file' accept='image/jpeg,image/png,image/webp' onChange={onPhotoChange} className='sr-only' />
                                </label>
                            </div>
                        ) : (
                            <label className='flex min-h-64 cursor-pointer flex-col items-center justify-center px-6 py-10 text-center hover:bg-[var(--tt-canvas)]/50 transition-colors'>
                                <span className='grid h-11 w-11 place-items-center rounded-full border border-[var(--tt-border)] bg-[var(--tt-canvas)] text-[var(--tt-ink)]'>
                                    <Upload size={19} />
                                </span>
                                <strong className='mt-3 text-sm text-[var(--tt-ink)]'>Choose pet photo</strong>
                                <span className='mt-1 text-xs text-[var(--tt-muted)]'>JPG, PNG or WEBP · up to 7 MB</span>
                                <input type='file' accept='image/jpeg,image/png,image/webp' onChange={onPhotoChange} className='sr-only' />
                            </label>
                        )}
                    </div>
                </div>

                <aside className='flex flex-col justify-between border border-[var(--tt-border)] bg-white p-5'>
                    <div>
                        <h4 className='font-serif text-lg text-[var(--tt-ink)]'>Before you continue</h4>
                    <ul className='mt-3 space-y-2 text-xs leading-5 text-[var(--tt-ink-soft)]'>
                        <li>Use one pet as the main subject.</li>
                        <li>Keep the face and most of the body visible.</li>
                        <li>Avoid heavy blur, filters or very dark lighting.</li>
                    </ul>

                    <label className='mt-5 flex items-start gap-3 border-t border-[var(--tt-border)] pt-4 text-xs leading-5 text-[var(--tt-ink-soft)]'>
                        <input
                            type='checkbox'
                            checked={consent}
                            onChange={(event) => onConsentChange(event.target.checked)}
                            className='mt-0.5 h-4 w-4 accent-[var(--tt-ink)]'
                        />
                        <span>I agree to process this photo to create a temporary grooming style reference for this booking.</span>
                    </label>

                        <div className='mt-3 min-h-6 text-xs leading-5' aria-live='polite'>
                            {verificationStatus === 'checking' ? (
                                <span className='inline-flex items-center gap-2 text-[var(--tt-ink-soft)]' role='status'>
                                    <Loader2 size={14} className='animate-spin' />Checking the photo…
                                </span>
                            ) : verificationStatus === 'verified' ? (
                                <span className='inline-flex items-center gap-2 font-semibold text-[var(--tt-ink)]'>
                                    <CheckCircle2 size={14} className='text-[#5b8767]' />Photo ready for style previews.
                                </span>
                            ) : verificationStatus === 'error' ? (
                                <span className='text-[#9E3E3E]'>We could not use this photo. Please choose a clearer image or try again.</span>
                            ) : photoPreview && !consent ? (
                                <span className='text-[var(--tt-muted)]'>Accept photo processing to create a preview.</span>
                            ) : photoPreview && consent ? (
                                <span className='font-medium text-[var(--tt-ink)]'>Ready to explore styles and generate previews.</span>
                            ) : (
                                <span className='text-[var(--tt-muted)]'>Add a photo to continue.</span>
                            )}
                        </div>
                    </div>

                    <div className='mt-4 border-t border-[var(--tt-border)] pt-3.5'>
                        <button
                            type='button'
                            onClick={onOpenStyleModal}
                            className='inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-full bg-[var(--tt-ink)] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#514b42]'
                        >
                            <Sparkles size={14} className='text-[var(--tt-gold)]' />
                            Choose style & AI preview
                        </button>
                    </div>
                </aside>
            </section>

            {/* Haircut Style Reference Details (When Style is Selected) */}
            {selectedStyle && (
                <section className='pt-2'>
                    <div>
                        <p className='text-[10px] font-bold uppercase tracking-[.18em] text-[var(--tt-gold)]'>Grooming Finish</p>
                        <h3 className='mt-1 font-serif text-2xl text-[var(--tt-ink)]'>Haircut Style Reference</h3>
                        <p className='mt-1 max-w-2xl text-xs leading-relaxed text-[var(--tt-muted)]'>
                            Selected finish for your grooming appointment. You can change your choice or generate new previews anytime.
                        </p>
                    </div>

                    <div className='mt-6 overflow-hidden rounded-xl border border-[var(--tt-border)] bg-white p-5 shadow-sm sm:p-6'>
                        <div className='flex flex-wrap items-start justify-between gap-4'>
                            <div className='space-y-1.5'>
                                <div className='flex items-center gap-2'>
                                    <span className='inline-flex items-center gap-1 rounded bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800 border border-emerald-200'>
                                        <Check size={12} /> Selected Reference
                                    </span>
                                    {generatedPreview && (
                                        <span className='inline-flex items-center gap-1 rounded bg-[var(--tt-canvas)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--tt-gold)] border border-[var(--tt-border)]'>
                                            <Sparkles size={11} /> AI Preview Ready
                                        </span>
                                    )}
                                </div>
                                <h4 className='font-serif text-2xl font-normal text-[var(--tt-ink)]'>{styleName}</h4>
                                <p className='max-w-2xl text-xs leading-relaxed text-[var(--tt-ink-soft)]'>
                                    {selectedStyle.description || 'A balanced grooming finish tailored to your pet’s coat texture and comfort.'}
                                </p>
                            </div>

                            <button
                                type='button'
                                onClick={onOpenStyleModal}
                                className='inline-flex items-center gap-2 rounded border border-[var(--tt-border)] bg-[var(--tt-canvas)] px-3.5 py-2 text-xs font-semibold text-[var(--tt-ink)] transition hover:bg-white hover:border-[var(--tt-ink)]'
                            >
                                <Scissors size={14} className='text-[var(--tt-gold)]' />
                                Change Style
                            </button>
                        </div>

                        {/* If preview is generated, show the comparison right here */}
                        {generatedPreview && (
                            <div className='mt-6 border-t border-[var(--tt-border)] pt-5'>
                                <div className='mb-3 flex items-center justify-between'>
                                    <span className='text-[10px] font-bold uppercase tracking-[.14em] text-[var(--tt-muted)]'>
                                        Visual Reference Comparison
                                    </span>
                                </div>
                                <div className='grid gap-4 sm:grid-cols-2'>
                                    <figure className='overflow-hidden rounded-lg border border-[var(--tt-border)] bg-[var(--tt-canvas)]'>
                                        <div className='aspect-[4/3] w-full bg-[#242220]'>
                                            {photoPreview ? (
                                                <img src={photoPreview} alt='Original pet reference' className='h-full w-full object-contain' />
                                            ) : (
                                                <div className='grid h-full place-items-center text-[var(--tt-muted)]'>
                                                    <ImageIcon size={28} />
                                                </div>
                                            )}
                                        </div>
                                        <figcaption className='border-t border-[var(--tt-border)] bg-white px-3.5 py-2 text-xs font-semibold text-[var(--tt-ink)]'>
                                            Original Pet Photo
                                        </figcaption>
                                    </figure>

                                    <figure className='overflow-hidden rounded-lg border border-[var(--tt-border)] bg-[var(--tt-canvas)]'>
                                        <div className='relative aspect-[4/3] w-full bg-[#242220]'>
                                            <img src={generatedPreview} alt={`${styleName} preview`} className='h-full w-full object-contain' />
                                            {previewFromCache && (
                                                <span className='absolute bottom-3 left-3 rounded bg-[var(--tt-ink)] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.08em] text-white'>
                                                    Saved preview
                                                </span>
                                            )}
                                        </div>
                                        <figcaption className='flex items-center justify-between border-t border-[var(--tt-border)] bg-white px-3.5 py-2 text-xs font-semibold text-[var(--tt-ink)]'>
                                            <span className='inline-flex items-center gap-1 text-[var(--tt-gold)]'>
                                                <Sparkles size={12} /> {styleName} Preview
                                            </span>
                                            {onRegenerateSelected && (
                                                <button
                                                    type='button'
                                                    onClick={onRegenerateSelected}
                                                    disabled={galleryGenerating}
                                                    className='inline-flex items-center gap-1 text-[11px] text-[var(--tt-muted)] hover:text-[var(--tt-ink)] disabled:opacity-40'
                                                >
                                                    <RefreshCw size={11} className={galleryGenerating ? 'animate-spin' : ''} />
                                                    Regenerate
                                                </button>
                                            )}
                                        </figcaption>
                                    </figure>
                                </div>
                                <p className='mt-3 text-[11px] leading-relaxed text-[var(--tt-muted)]'>
                                    This style preview is a visual reference, not a guaranteed final result. Scissor lengths and finish will be confirmed with your groomer during consultation.
                                </p>
                            </div>
                        )}
                    </div>
                </section>
            )}
        </div>
    )
}
