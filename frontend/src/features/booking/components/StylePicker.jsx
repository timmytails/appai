import { Check, Image as ImageIcon, Loader2, RefreshCw, Scissors } from 'lucide-react'

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

function getStyleCopy(style) {
    return PROFESSIONAL_STYLE_COPY[style.id] || {
        description: style.description || 'A grooming reference that can be adjusted to your pet’s coat and comfort.',
        note: 'The groomer will confirm the achievable length and finish after checking the coat in person.'
    }
}

export default function StylePicker({
    styles,
    recommendations = [],
    stylePreviews,
    selectedStyleId,
    onSelect,
    onRetry,
    photoReady,
    loading,
    generationBusy
}) {
    const recommendationRank = new Map(recommendations.map((item, index) => [item.id, index]))
    const orderedStyles = [...styles].sort((first, second) => {
        const firstRank = recommendationRank.has(first.id) ? recommendationRank.get(first.id) : 999
        const secondRank = recommendationRank.has(second.id) ? recommendationRank.get(second.id) : 999
        if (firstRank !== secondRank) return firstRank - secondRank
        return first.name.localeCompare(second.name)
    })

    return (
        <section className='space-y-4'>
            <div className='flex flex-wrap items-end justify-between gap-3'>
                <div>
                    <p className='text-[10px] font-bold uppercase tracking-[.18em] text-[var(--tt-gold)]'>Reference style</p>
                    <h3 className='mt-1 font-serif text-2xl text-[var(--tt-ink)]'>Choose the finish you want to discuss</h3>
                </div>
                {loading && (
                    <span className='inline-flex items-center gap-2 text-xs text-[var(--tt-muted)]' role='status'>
                        <Loader2 size={14} className='animate-spin' /> Loading styles
                    </span>
                )}
            </div>

            <div className='grid gap-4 md:grid-cols-2'>
                {orderedStyles.map((style) => {
                    const preview = stylePreviews[style.id] || { status: 'idle' }
                    const ready = preview.status === 'ready' && preview.generatedImage
                    const failed = preview.status === 'error'
                    const selected = selectedStyleId === style.id
                    const canGenerate = photoReady && preview.status === 'idle' && !generationBusy
                    const copy = getStyleCopy(style)
                    const disabled = (!ready && !failed && !canGenerate) || ((failed || canGenerate) && generationBusy)

                    return (
                        <article key={style.id} className={`overflow-hidden border bg-white transition ${selected ? 'border-[var(--tt-ink)] shadow-[0_8px_24px_rgba(51,51,47,.09)]' : 'border-[var(--tt-border)]'}`}>
                            <div className='relative aspect-[16/10] overflow-hidden border-b border-[var(--tt-border)] bg-[var(--tt-canvas)]'>
                                {ready ? (
                                    <img src={formatImageSrc(preview.generatedImage)} alt={`${style.name} style preview`} className='h-full w-full object-cover' />
                                ) : (
                                    <div className='grid h-full place-items-center px-6 text-center'>
                                        {preview.status === 'generating' ? (
                                            <div role='status'>
                                                <Loader2 size={24} className='mx-auto animate-spin text-[var(--tt-ink)]' />
                                                <p className='mt-3 text-xs font-semibold text-[var(--tt-ink)]'>Preparing preview…</p>
                                                <p className='mt-1 text-[11px] text-[var(--tt-muted)]'>This can take a short moment.</p>
                                            </div>
                                        ) : failed ? (
                                            <div>
                                                <RefreshCw size={22} className='mx-auto text-[var(--tt-muted)]' />
                                                <p className='mt-3 text-xs font-semibold text-[var(--tt-ink)]'>Preview could not be created</p>
                                                <p className='mt-1 text-[11px] text-[var(--tt-muted)]'>You can try this style again.</p>
                                            </div>
                                        ) : (
                                            <div>
                                                {photoReady ? <ImageIcon size={24} className='mx-auto text-[var(--tt-muted)]' /> : <Scissors size={24} className='mx-auto text-[var(--tt-muted)]' />}
                                                <p className='mt-3 text-xs font-semibold text-[var(--tt-ink)]'>{photoReady ? 'Preview not created yet' : 'Add a photo above first'}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {selected && (
                                    <span className='absolute right-3 top-3 inline-flex items-center gap-1 bg-[var(--tt-ink)] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.1em] text-white'>
                                        <Check size={11} /> Selected
                                    </span>
                                )}
                            </div>

                            <div className='p-5'>
                                <h4 className='font-serif text-xl text-[var(--tt-ink)]'>{style.name}</h4>
                                <p className='mt-2 text-sm leading-6 text-[var(--tt-ink-soft)]'>{copy.description}</p>
                                <p className='mt-3 border-t border-[var(--tt-border)] pt-3 text-[11px] leading-5 text-[var(--tt-muted)]'>
                                    <strong className='font-semibold text-[var(--tt-ink-soft)]'>Groomer note:</strong> {copy.note}
                                </p>
                                <button
                                    type='button'
                                    onClick={() => ready ? onSelect(style.id) : onRetry(style.id)}
                                    disabled={disabled}
                                    className={`mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 border px-4 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 ${selected ? 'border-[var(--tt-ink)] bg-[var(--tt-ink)] text-white' : 'border-[var(--tt-border)] bg-[var(--tt-canvas)] text-[var(--tt-ink)] hover:border-[var(--tt-ink)]'}`}
                                >
                                    {preview.status === 'generating' ? 'Preparing preview…' : failed ? 'Try preview again' : ready ? (selected ? 'Selected' : 'Use this style') : 'Create preview'}
                                </button>
                            </div>
                        </article>
                    )
                })}
            </div>

            {!orderedStyles.length && (
                <div className='border border-[var(--tt-border)] bg-white p-6 text-sm text-[var(--tt-muted)]'>
                    No compatible haircut references are available for this pet type.
                </div>
            )}
        </section>
    )
}
