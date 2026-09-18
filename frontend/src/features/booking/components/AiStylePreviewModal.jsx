import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
    AlertCircle,
    Check,
    CheckCircle2,
    Image as ImageIcon,
    Loader2,
    RefreshCw,
    Scissors,
    Sparkles,
    Upload,
    Wand2,
    X
} from 'lucide-react'

const formatImageSrc = (src) => {
    if (!src) return ''
    if (src.startsWith('data:') || src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/')) {
        return src
    }
    return `data:image/png;base64,${src}`
}

const PROFESSIONAL_STYLE_COPY = {
    'puppy-cut': {
        description: 'An even trim through the body and legs with a softly rounded finish around the face.',
        note: 'A practical maintenance cut for coats that are kept at a short-to-medium length.'
    },
    'teddy-bear-cut': {
        description: 'A rounded face and muzzle with a fuller, balanced finish through the body and legs.',
        note: 'Best suited to coats with enough length and density to hold a rounded shape.'
    },
    'summer-cut': {
        description: 'A shorter body trim with the head and tail left natural enough to keep the pet recognizable.',
        note: 'Final length should be agreed with the groomer; double coats are not normally clipped short.'
    },
    'asian-fusion-cut': {
        description: 'A shorter body with a rounded head and fuller, shaped legs for a more stylized finish.',
        note: 'Requires regular brushing and enough coat length on the legs for shaping.'
    },
    'poodle-lamb-cut': {
        description: 'A neater body length blended into fuller legs for a traditional lamb-style outline.',
        note: 'Commonly used on curly or wavy coats that can be scissored and blended cleanly.'
    },
    'schnauzer-trim': {
        description: 'A tidy back and body with the beard, eyebrows and leg furnishings kept in their characteristic shape.',
        note: 'The finish is adjusted to coat texture and the amount of existing furnishing.'
    },
    'natural-trim': {
        description: 'Light shaping around the paws, legs, sanitary area and body outline while preserving natural coat length.',
        note: 'Often the safer choice for double coats when only tidying and outline work are needed.'
    },
    'comb-cut': {
        description: 'An even medium-length cat trim that reduces excess coat while keeping a soft, plush finish.',
        note: 'Length depends on coat condition, tolerance and whether matting is present.'
    },
    'cat-teddy-bear-trim': {
        description: 'A softly rounded cat trim that keeps a fuller body outline and neatens the face and paws.',
        note: 'Only suitable when the coat condition and the cat’s tolerance allow safe scissor work.'
    },
    'lion-cut': {
        description: 'A close body clip with the mane, lower legs and tail tip left longer.',
        note: 'A specialist cat service that should be confirmed by the groomer after checking coat condition and handling tolerance.'
    },
    'cat-sanitary-trim': {
        description: 'A focused tidy around the sanitary area, belly and paw pads while leaving the main body coat intact.',
        note: 'Used for hygiene and maintenance rather than changing the overall coat style.'
    }
}

export default function AiStylePreviewModal({
    isOpen,
    onClose,
    pet,
    photoPreview,
    onPhotoChange,
    consent,
    onConsentChange,
    verificationStatus,
    styles = [],
    recommendations = [],
    stylePreviews = {},
    selectedStyleId,
    onSelectStyle,
    onGeneratePreview,
    generating = false,
    galleryMessage = ''
}) {
    const [focusedStyleId, setFocusedStyleId] = useState('')
    const [viewMode, setViewMode] = useState('comparison')

    useEffect(() => {
        if (isOpen) {
            if (!focusedStyleId) {
                const initialId = (selectedStyleId && styles.some((s) => s.id === selectedStyleId))
                    ? selectedStyleId
                    : styles[0]?.id || ''
                setFocusedStyleId(initialId)
            }
        } else {
            setFocusedStyleId('')
        }
    }, [isOpen, selectedStyleId, styles, focusedStyleId])

    useEffect(() => {
        if (!isOpen) return
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose()
        }
        const originalOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        window.addEventListener('keydown', handleKeyDown)
        return () => {
            document.body.style.overflow = originalOverflow
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [isOpen, onClose])

    if (!isOpen) return null

    const recommendationRank = new Map(recommendations.map((item, index) => [item.id, index]))
    const orderedStyles = [...styles].sort((first, second) => {
        const firstRank = recommendationRank.has(first.id) ? recommendationRank.get(first.id) : 999
        const secondRank = recommendationRank.has(second.id) ? recommendationRank.get(second.id) : 999
        if (firstRank !== secondRank) return firstRank - secondRank
        return first.name.localeCompare(second.name)
    })

    const focusedStyle = styles.find((s) => s.id === focusedStyleId) || orderedStyles[0] || null
    const focusedPreview = focusedStyle ? stylePreviews[focusedStyle.id] : null
    const isFocusedReady = focusedPreview?.status === 'ready' && focusedPreview?.generatedImage
    const isFocusedGenerating = focusedPreview?.status === 'generating' || (generating && focusedPreview?.status === 'generating')
    const hasPhoto = Boolean(photoPreview)
    const isSelected = selectedStyleId === focusedStyle?.id
    const styleCopy = focusedStyle ? (PROFESSIONAL_STYLE_COPY[focusedStyle.id] || { description: focusedStyle.description, note: 'Groomer will confirm suitability.' }) : null

    const handleApplyStyle = () => {
        if (focusedStyle) {
            onSelectStyle(focusedStyle.id)
            onClose()
        }
    }

    const handleGenerateClick = () => {
        if (!focusedStyle) return
        onGeneratePreview(focusedStyle.id)
    }

    return createPortal(
        <div
            className='fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-2 sm:p-5 md:p-8 backdrop-blur-sm animate-in fade-in duration-200'
            role='dialog'
            aria-modal='true'
            aria-labelledby='style-modal-title'
        >
            <div className='relative flex max-h-[96vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-[var(--tt-border)] bg-[var(--tt-canvas)] shadow-2xl md:max-h-[90vh]'>
                {/* Header */}
                <div className='flex items-center justify-between border-b border-[var(--tt-border)] bg-white px-5 py-4 sm:px-6'>
                    <div className='flex items-center gap-3'>
                        <div className='grid h-9 w-9 place-items-center rounded-full bg-[var(--tt-accent-soft)] text-[var(--tt-ink)]'>
                            <Sparkles size={18} className='text-[var(--tt-gold)]' />
                        </div>
                        <div>
                            <h2 id='style-modal-title' className='font-serif text-lg font-semibold tracking-tight text-[var(--tt-ink)] sm:text-xl'>
                                AI Style Preview
                            </h2>
                            <p className='text-xs text-[var(--tt-muted)]'>
                                Preview haircut styles for {pet?.name || 'your pet'} {pet?.breed ? `(${pet.breed})` : ''}
                            </p>
                        </div>
                    </div>
                    <button
                        type='button'
                        onClick={onClose}
                        className='grid h-9 w-9 place-items-center rounded-full text-[var(--tt-muted)] transition hover:bg-[var(--tt-canvas)] hover:text-[var(--tt-ink)]'
                        aria-label='Close style preview modal'
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body: Responsive 2-Column */}
                <div className='grid flex-1 overflow-y-auto md:grid-cols-[330px_1fr] lg:grid-cols-[360px_1fr]'>
                    {/* Left Column: Photo & Style Selection List (Desktop) */}
                    <div className='hidden md:flex flex-col border-b border-[var(--tt-border)] bg-[var(--tt-canvas)] p-4 sm:p-5 md:border-b-0 md:border-r'>
                        {/* 1. Photo Reference Card */}
                        <div className='mb-4 rounded-lg border border-[var(--tt-border)] bg-white p-3.5 shadow-sm'>
                            <div className='mb-2 flex items-center justify-between'>
                                <span className='text-[10px] font-bold uppercase tracking-[.14em] text-[var(--tt-gold)]'>Pet Photo Reference</span>
                                <label className='cursor-pointer text-[11px] font-semibold text-[var(--tt-ink)] underline hover:text-[var(--tt-gold)]'>
                                    {hasPhoto ? 'Change photo' : 'Upload photo'}
                                    <input type='file' accept='image/jpeg,image/png,image/webp' onChange={onPhotoChange} className='sr-only' />
                                </label>
                            </div>

                            {hasPhoto ? (
                                <div className='relative flex items-center gap-3 overflow-hidden rounded border border-[var(--tt-border)] bg-[var(--tt-canvas)] p-2'>
                                    <img src={photoPreview} alt='Pet reference' className='h-14 w-14 rounded object-cover' />
                                    <div className='min-w-0 flex-1 text-xs'>
                                        <p className='truncate font-semibold text-[var(--tt-ink)]'>{pet?.name || 'Pet reference photo'}</p>
                                        <p className='text-[11px] text-[var(--tt-muted)]'>Photo ready for AI preview</p>
                                    </div>
                                    <CheckCircle2 size={16} className='text-[#5b8767] shrink-0' />
                                </div>
                            ) : (
                                <label className='flex cursor-pointer flex-col items-center justify-center rounded border border-dashed border-[var(--tt-border)] bg-[var(--tt-canvas)] py-4 text-center hover:bg-white'>
                                    <Upload size={18} className='text-[var(--tt-muted)]' />
                                    <span className='mt-1 text-xs font-semibold text-[var(--tt-ink)]'>Upload pet photo</span>
                                    <span className='text-[10px] text-[var(--tt-muted)]'>JPG, PNG or WEBP (up to 7MB)</span>
                                    <input type='file' accept='image/jpeg,image/png,image/webp' onChange={onPhotoChange} className='sr-only' />
                                </label>
                            )}

                            <label className='mt-3 flex items-start gap-2 text-[11px] leading-4 text-[var(--tt-muted)]'>
                                <input
                                    type='checkbox'
                                    checked={consent}
                                    onChange={(e) => onConsentChange(e.target.checked)}
                                    className='mt-0.5 h-3.5 w-3.5 accent-[var(--tt-ink)]'
                                />
                                <span>I agree to process this photo for style preview references.</span>
                            </label>
                        </div>

                        {/* 2. Styles Navigation List */}
                        <div className='flex items-center justify-between pb-2'>
                            <span className='text-[10px] font-bold uppercase tracking-[.14em] text-[var(--tt-muted)]'>Available Styles ({orderedStyles.length})</span>
                        </div>

                        <div className='space-y-2 overflow-y-auto pr-1 flex-1 max-h-[200px] md:max-h-none'>
                            {orderedStyles.map((style) => {
                                const preview = stylePreviews[style.id]
                                const isReady = preview?.status === 'ready' && preview?.generatedImage
                                const isGeneratingThis = preview?.status === 'generating'
                                const isFocused = focusedStyleId === style.id
                                const isStyleSelected = selectedStyleId === style.id
                                const isRecommended = recommendations.some((r) => r.id === style.id)

                                return (
                                    <button
                                        key={style.id}
                                        type='button'
                                        onClick={() => setFocusedStyleId(style.id)}
                                        className={`w-full rounded-lg border p-3 text-left transition-all ${isFocused ? 'border-[var(--tt-ink)] bg-white shadow-md' : 'border-[var(--tt-border)] bg-white/70 hover:bg-white hover:border-[var(--tt-ink-soft)]'}`}
                                    >
                                        <div className='flex items-center justify-between gap-2'>
                                            <div className='min-w-0'>
                                                <p className='font-serif text-sm font-semibold text-[var(--tt-ink)] truncate'>{style.name}</p>
                                                {isRecommended && (
                                                    <span className='inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--tt-gold)]'>
                                                        <Sparkles size={10} /> Seasonal pick
                                                    </span>
                                                )}
                                            </div>

                                            <div className='shrink-0 text-right'>
                                                {isGeneratingThis ? (
                                                    <span className='inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700'>
                                                        <Loader2 size={10} className='animate-spin' /> Generating
                                                    </span>
                                                ) : isReady ? (
                                                    <span className='inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700'>
                                                        <Check size={10} /> Preview ready
                                                    </span>
                                                ) : isStyleSelected ? (
                                                    <span className='inline-flex items-center gap-1 rounded bg-[var(--tt-ink)] px-2 py-0.5 text-[10px] font-bold text-white'>
                                                        Current choice
                                                    </span>
                                                ) : null}
                                            </div>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Right Column: Style Canvas & Comparison Showcase */}
                    <div className='flex flex-col overflow-y-auto bg-white p-4 sm:p-6 lg:p-7'>
                        {/* Mobile Pet Photo Reference Bar */}
                        <div className='mb-3 rounded-lg border border-[var(--tt-border)] bg-[var(--tt-canvas)] p-2.5 md:hidden'>
                            <div className='flex items-center justify-between gap-2'>
                                <div className='flex items-center gap-2.5 min-w-0'>
                                    {hasPhoto ? (
                                        <img src={photoPreview} alt='Pet reference' className='h-10 w-10 rounded-md object-cover shrink-0' />
                                    ) : (
                                        <div className='grid h-10 w-10 place-items-center rounded-md border border-dashed border-[var(--tt-border)] bg-white shrink-0'>
                                            <Upload size={14} className='text-[var(--tt-muted)]' />
                                        </div>
                                    )}
                                    <div className='min-w-0 flex-1 text-xs'>
                                        <p className='truncate font-semibold text-[var(--tt-ink)]'>{pet?.name || 'Pet reference photo'}</p>
                                        <p className='text-[10px] text-[var(--tt-muted)]'>{hasPhoto ? 'Photo ready for preview' : 'Upload photo to enable AI'}</p>
                                    </div>
                                </div>
                                <label className='cursor-pointer rounded border border-[var(--tt-border)] bg-white px-2.5 py-1 text-[11px] font-medium text-[var(--tt-ink)] hover:bg-[var(--tt-canvas)] shrink-0'>
                                    {hasPhoto ? 'Change' : 'Upload'}
                                    <input type='file' accept='image/jpeg,image/png,image/webp' onChange={onPhotoChange} className='sr-only' />
                                </label>
                            </div>
                            {!consent && (
                                <label className='mt-2 flex items-start gap-2 border-t border-[var(--tt-border)] pt-2 text-[11px] leading-4 text-[var(--tt-muted)]'>
                                    <input
                                        type='checkbox'
                                        checked={consent}
                                        onChange={(e) => onConsentChange(e.target.checked)}
                                        className='mt-0.5 h-3.5 w-3.5 accent-[var(--tt-ink)] shrink-0'
                                    />
                                    <span>I agree to process this photo for style preview references.</span>
                                </label>
                            )}
                        </div>

                        {/* Mobile Horizontal Styles Carousel */}
                        <div className='mb-3.5 md:hidden'>
                            <div className='mb-1.5 flex items-center justify-between px-0.5'>
                                <span className='text-[10px] font-bold uppercase tracking-[.14em] text-[var(--tt-muted)]'>
                                    Haircut Styles ({orderedStyles.length})
                                </span>
                                <span className='text-[10px] text-[var(--tt-muted)]'>
                                    Swipe to explore
                                </span>
                            </div>
                            <div className='flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar -mx-1 px-1'>
                                {orderedStyles.map((style) => {
                                    const preview = stylePreviews[style.id]
                                    const isReady = preview?.status === 'ready' && preview?.generatedImage
                                    const isGeneratingThis = preview?.status === 'generating'
                                    const isFocused = focusedStyleId === style.id
                                    const isRecommended = recommendations.some((r) => r.id === style.id)

                                    return (
                                        <button
                                            key={style.id}
                                            type='button'
                                            onClick={() => setFocusedStyleId(style.id)}
                                            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                                                isFocused
                                                    ? 'bg-[var(--tt-ink)] text-white shadow-sm ring-1 ring-[var(--tt-ink)]'
                                                    : 'border border-[var(--tt-border)] bg-white text-[var(--tt-ink)] hover:bg-[var(--tt-canvas)]'
                                            }`}
                                        >
                                            {isRecommended && <Sparkles size={11} className={isFocused ? 'text-[var(--tt-gold)]' : 'text-[var(--tt-gold)]'} />}
                                            <span>{style.name}</span>
                                            {isGeneratingThis ? (
                                                <Loader2 size={11} className='animate-spin text-amber-500' />
                                            ) : isReady ? (
                                                <span className={`inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-[9px] font-bold ${isFocused ? 'bg-white/20 text-emerald-300' : 'bg-emerald-50 text-emerald-700'}`}>✓</span>
                                            ) : null}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {focusedStyle ? (
                            <div className='flex flex-col flex-1'>
                                {/* Style Header & View Toggles */}
                                <div className='mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-[var(--tt-border)] pb-4'>
                                    <div>
                                        <div className='flex items-center gap-2'>
                                            <h3 className='font-serif text-2xl font-normal tracking-tight text-[var(--tt-ink)]'>{focusedStyle.name}</h3>
                                            {isSelected && (
                                                <span className='rounded-full bg-[var(--tt-ink)] px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[.1em] text-white'>
                                                    Selected Style
                                                </span>
                                            )}
                                        </div>
                                        <p className='mt-1 max-w-xl text-xs text-[var(--tt-ink-soft)] leading-relaxed'>{styleCopy?.description}</p>
                                    </div>

                                    {/* View Mode Toggle */}
                                    {isFocusedReady && (
                                        <div className='inline-flex w-full sm:w-auto rounded-md border border-[var(--tt-border)] bg-[var(--tt-canvas)] p-0.5 text-[11px] font-semibold'>
                                            <button
                                                type='button'
                                                onClick={() => setViewMode('comparison')}
                                                className={`flex-1 sm:flex-initial rounded px-2.5 py-1.5 transition text-center ${viewMode === 'comparison' ? 'bg-white text-[var(--tt-ink)] shadow-xs font-bold' : 'text-[var(--tt-muted)] hover:text-[var(--tt-ink)]'}`}
                                            >
                                                Side by Side
                                            </button>
                                            <button
                                                type='button'
                                                onClick={() => setViewMode('preview-only')}
                                                className={`flex-1 sm:flex-initial rounded px-2.5 py-1.5 transition text-center ${viewMode === 'preview-only' ? 'bg-white text-[var(--tt-ink)] shadow-xs font-bold' : 'text-[var(--tt-muted)] hover:text-[var(--tt-ink)]'}`}
                                            >
                                                Preview Only
                                            </button>
                                            <button
                                                type='button'
                                                onClick={() => setViewMode('original-only')}
                                                className={`flex-1 sm:flex-initial rounded px-2.5 py-1.5 transition text-center ${viewMode === 'original-only' ? 'bg-white text-[var(--tt-ink)] shadow-xs font-bold' : 'text-[var(--tt-muted)] hover:text-[var(--tt-ink)]'}`}
                                            >
                                                Original Photo
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Preview Canvas */}
                                <div className='flex-1 flex flex-col justify-center'>
                                    {isFocusedGenerating ? (
                                        <div className='flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-[var(--tt-gold)] bg-[var(--tt-canvas)]/60 p-8 text-center sm:min-h-[360px]'>
                                            <div className='relative'>
                                                <div className='grid h-16 w-16 place-items-center rounded-full bg-white shadow-md'>
                                                    <Wand2 size={28} className='animate-bounce text-[var(--tt-gold)]' />
                                                </div>
                                                <span className='absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--tt-ink)] text-white'>
                                                    <Loader2 size={12} className='animate-spin' />
                                                </span>
                                            </div>
                                            <h4 className='mt-4 font-serif text-lg font-semibold text-[var(--tt-ink)]'>Generating {focusedStyle.name} Preview</h4>
                                            <p className='mt-1 max-w-sm text-xs text-[var(--tt-muted)] leading-relaxed'>
                                                {galleryMessage || 'Preparing a preview based on your pet’s photo and coat…'}
                                            </p>
                                        </div>
                                    ) : isFocusedReady ? (
                                        <div className={`grid gap-4 ${viewMode === 'comparison' ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>
                                            {(viewMode === 'comparison' || viewMode === 'original-only') && (
                                                <figure className='overflow-hidden rounded-xl border border-[var(--tt-border)] bg-[var(--tt-canvas)]'>
                                                    <div className='aspect-[4/3] w-full overflow-hidden bg-[#242220]'>
                                                        {photoPreview ? (
                                                            <img src={photoPreview} alt='Original pet reference' className='h-full w-full object-contain' />
                                                        ) : (
                                                            <div className='grid h-full place-items-center text-[var(--tt-muted)]'>
                                                                <ImageIcon size={32} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <figcaption className='border-t border-[var(--tt-border)] bg-white px-3.5 py-2 text-xs font-semibold text-[var(--tt-ink)] flex items-center justify-between'>
                                                        <span>Original Pet Photo</span>
                                                        <span className='text-[10px] text-[var(--tt-muted)] font-normal'>Current coat</span>
                                                    </figcaption>
                                                </figure>
                                            )}

                                            {(viewMode === 'comparison' || viewMode === 'preview-only') && (
                                                <figure className='overflow-hidden rounded-xl border border-[var(--tt-border)] bg-[var(--tt-canvas)]'>
                                                    <div className='relative aspect-[4/3] w-full overflow-hidden bg-[#242220]'>
                                                        <img src={formatImageSrc(focusedPreview.generatedImage)} alt={`${focusedStyle.name} preview`} className='h-full w-full object-contain' />
                                                        {focusedPreview.fromCache && (
                                                            <span className='absolute bottom-3 left-3 rounded bg-[var(--tt-ink)] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.1em] text-white'>
                                                                Saved preview
                                                            </span>
                                                        )}
                                                    </div>
                                                    <figcaption className='border-t border-[var(--tt-border)] bg-white px-3.5 py-2 text-xs font-semibold text-[var(--tt-ink)] flex items-center justify-between'>
                                                        <span className='inline-flex items-center gap-1 text-[var(--tt-gold)]'>
                                                            <Sparkles size={12} /> {focusedStyle.name} Result
                                                        </span>
                                                        <span className='text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold'>Reference</span>
                                                    </figcaption>
                                                </figure>
                                            )}
                                        </div>
                                    ) : (
                                        <div className='flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-[var(--tt-border)] bg-[var(--tt-canvas)]/40 p-8 text-center sm:min-h-[360px]'>
                                            <div className='grid h-14 w-14 place-items-center rounded-full bg-white shadow-sm'>
                                                <Scissors size={24} className='text-[var(--tt-gold)]' />
                                            </div>
                                            <h4 className='mt-4 font-serif text-lg font-semibold text-[var(--tt-ink)]'>
                                                Preview {focusedStyle.name}
                                            </h4>
                                            <p className='mt-1 max-w-md text-xs text-[var(--tt-muted)] leading-relaxed'>
                                                {hasPhoto
                                                    ? 'Click below to generate a tailored hairstyle preview on your pet’s photo.'
                                                    : 'Please upload a photo of your pet to generate a personalized AI preview.'}
                                            </p>
                                            {hasPhoto ? (
                                                !consent ? (
                                                    <div className='mt-5 max-w-sm rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900'>
                                                        Please agree to the photo consent on the left to enable AI generation.
                                                    </div>
                                                ) : (
                                                    <button
                                                        type='button'
                                                        onClick={handleGenerateClick}
                                                        disabled={generating}
                                                        className='mt-4 inline-flex min-h-9 items-center gap-2 rounded-md bg-[var(--tt-ink)] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#514b42] disabled:opacity-40'
                                                    >
                                                        <Wand2 size={14} /> Generate style preview
                                                    </button>
                                                )
                                            ) : (
                                                <label className='mt-4 inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-md bg-[var(--tt-ink)] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#514b42]'>
                                                    <Upload size={14} /> Upload pet photo first
                                                    <input type='file' accept='image/jpeg,image/png,image/webp' onChange={onPhotoChange} className='sr-only' />
                                                </label>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Groomer Note Banner */}
                                <div className='mt-4 rounded-lg border border-[var(--tt-border)] bg-[var(--tt-canvas)]/70 p-3.5 text-xs text-[var(--tt-muted)]'>
                                    <div className='flex items-start gap-2'>
                                        <AlertCircle size={14} className='mt-0.5 text-[var(--tt-gold)] shrink-0' />
                                        <div>
                                            <strong className='font-semibold text-[var(--tt-ink)]'>Groomer Note: </strong>
                                            {styleCopy?.note}
                                            <span className='block mt-1 text-[11px] text-[var(--tt-muted)]'>
                                                Style previews serve as visual guidelines. Actual scissor and clip lengths are adjusted to your companion’s coat texture, matting, and comfort during the salon visit.
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className='grid h-full place-items-center text-xs text-[var(--tt-muted)]'>
                                Select a haircut style from the left to view details.
                            </div>
                        )}
                    </div>
                </div>

                {/* Modal Footer / Action Bar */}
                <div className='border-t border-[var(--tt-border)] bg-white px-3.5 py-2.5 sm:px-6 sm:py-3.5'>
                    {/* Mobile active preview bar */}
                    <div className='mb-2 flex items-center justify-between gap-2 sm:hidden'>
                        <span className='text-[11px] text-[var(--tt-muted)] truncate'>
                            Active preview: <strong className='text-[var(--tt-ink)]'>{focusedStyle?.name}</strong>
                        </span>
                        {isSelected && (
                            <span className='inline-flex shrink-0 items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700'>
                                <Check size={11} /> Current choice
                            </span>
                        )}
                    </div>

                    <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3'>
                        <div className='hidden text-xs text-[var(--tt-muted)] sm:block'>
                            {focusedStyle && (
                                <span>
                                    Active preview: <strong className='text-[var(--tt-ink)]'>{focusedStyle.name}</strong>
                                </span>
                            )}
                        </div>

                        {/* Buttons: Clean responsive grid on mobile so nothing is clipped or pushed off screen; right-aligned row on desktop */}
                        <div className='grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center sm:justify-end sm:gap-2.5'>
                            <button
                                type='button'
                                onClick={onClose}
                                className='inline-flex min-h-10 sm:min-h-9 items-center justify-center rounded-lg sm:rounded-md border border-[var(--tt-border)] bg-white px-3.5 text-xs font-semibold text-[var(--tt-ink)] hover:bg-[var(--tt-canvas)] transition active:scale-[0.98]'
                            >
                                Cancel
                            </button>

                            {isFocusedReady && (
                                <button
                                    type='button'
                                    onClick={handleGenerateClick}
                                    disabled={generating}
                                    className='inline-flex min-h-10 sm:min-h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg sm:rounded-md border border-[var(--tt-border)] bg-[var(--tt-canvas)] px-3 text-xs font-semibold text-[var(--tt-ink)] hover:bg-white disabled:opacity-40 transition active:scale-[0.98]'
                                >
                                    <RefreshCw size={13} className={generating ? 'animate-spin' : ''} />
                                    <span>Regenerate</span>
                                </button>
                            )}

                            <button
                                type='button'
                                onClick={handleApplyStyle}
                                disabled={!focusedStyle}
                                className={`inline-flex min-h-10 sm:min-h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg sm:rounded-md bg-[var(--tt-ink)] px-4 text-xs font-semibold text-white transition hover:bg-[#514b42] disabled:opacity-40 active:scale-[0.98] ${
                                    isFocusedReady ? 'col-span-2 sm:col-span-1 sm:w-auto' : 'col-span-1 sm:w-auto'
                                }`}
                            >
                                <Check size={14} className='shrink-0' />
                                <span>{isSelected ? 'Style confirmed' : 'Select this style'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    )
}
