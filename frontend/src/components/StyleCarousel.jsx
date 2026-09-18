import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import ImagePlaceholder from './editorial/ImagePlaceholder'
import BookButton from './editorial/BookButton'
const CUT_STYLES = [
  { id: '1', style: 'Teddy Bear Cut', breed: 'Toy Poodle' },
  { id: '2', style: 'Puppy Cut', breed: 'Shih Tzu' },
  { id: '3', style: 'Lion Trim & De-Shed', breed: 'Persian Cat' },
  { id: '4', style: 'Summer Bob Cut', breed: 'Maltese' },
  { id: '5', style: 'Silky Clean Trim', breed: 'Yorkshire Terrier' },
  { id: '6', style: 'Fluffy Hygiene Trim', breed: 'Mixed Companion' }
]
export default function StyleCarousel() {
  const [startIndex, setStartIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [autoPlay, setAutoPlay] = useState(false)
  useEffect(() => {
    if (isPaused || !autoPlay || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = setInterval(() => setStartIndex(i => (i + 1) % CUT_STYLES.length), 3500)
    return () => clearInterval(timer)
  }, [isPaused, autoPlay])
  const visibleItems = [0, 1, 2].map(offset => CUT_STYLES[(startIndex + offset) % CUT_STYLES.length])
  return <div className='style-carousel' aria-label='Pet style gallery' aria-roledescription='carousel' onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)} onFocus={() => setIsPaused(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setIsPaused(false) }}>
    <div className='gallery-controls'><span>Featured Pet Cuts ({startIndex + 1}/{CUT_STYLES.length})</span><div><button onClick={() => setAutoPlay(!autoPlay)} aria-pressed={autoPlay}>{autoPlay ? 'Pause slideshow' : 'Play slideshow'}</button><button aria-label='Previous style' onClick={() => setStartIndex(i => (i + CUT_STYLES.length - 1) % CUT_STYLES.length)}><ChevronLeft size={17} /></button><button aria-label='Next style' onClick={() => setStartIndex(i => (i + 1) % CUT_STYLES.length)}><ChevronRight size={17} /></button></div></div>
    <div className='gallery-grid' aria-live={autoPlay ? 'off' : 'polite'}>{visibleItems.map(item => <figure key={item.id}><ImagePlaceholder label='Gallery image placeholder' variant='arch' /><figcaption><span>{item.breed}</span><h3>{item.style}</h3><BookButton serviceId='custom-styling'>Book</BookButton></figcaption></figure>)}</div>
    <div className='gallery-pagination'>{CUT_STYLES.map((item, i) => <button key={item.id} aria-label={`Go to slide ${i + 1}`} aria-current={i === startIndex ? 'true' : undefined} className={i === startIndex ? 'is-active' : ''} onClick={() => setStartIndex(i)} />)}</div>
  </div>
}
