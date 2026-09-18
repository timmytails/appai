import { Link } from 'react-router-dom'
import { ArrowRight, Check, Minus, Plus } from 'lucide-react'
import ImagePlaceholder from './ImagePlaceholder'
import BookButton from './BookButton'
import { Botanical, Geometry } from './Decorations'
import { services } from '../../data/services'

export function PlaceholderCopy({ short = false, className = '' }) {
  return (
    <p className={`editorial-copy ${className}`}>
      {short
        ? 'Thoughtful grooming tailored to your pet’s comfort, coat health, and individual style.'
        : 'Gentle, stress-free grooming tailored to your pet’s natural coat and personality. From soothing baths and warm blow-drys to precision scissor styling, we treat every companion with patience, care, and comfort.'}
    </p>
  )
}
export function SplitImages({ className = '' }) {
  return <div className={`split-images ${className}`}>
    <ImagePlaceholder label='Before image' variant='arch' /><ImagePlaceholder label='After image' variant='reverse-arch' />
    <span className='comparison-mark comparison-mark--before'><Minus size={12} /></span><span className='comparison-mark comparison-mark--after'><Check size={12} /></span>
  </div>
}
export function Checklist({ items = ['Personalized grooming experience', 'Patient handling and professional techniques', 'A calm, comfortable space for your pet', 'Thoughtful care for every coat'] }) {
  return <ul className='editorial-checklist'>{items.map(item => <li key={item}><span><Check size={14} strokeWidth={1.5} /></span>{item}</li>)}</ul>
}
export function WhyChooseUs() {
  return <section className='editorial-section why-section'>
    <div className='circle-decoration' aria-hidden='true'>{[0, 1, 2, 3, 4].map(i => <i key={i} />)}</div>
    <div className='editorial-container editorial-two-column'>
      <div className='editorial-text'><h2>Why Choose Us?</h2><PlaceholderCopy />
        <ul className='plain-highlights'><li>Personalized grooming experience</li><li>Calm, welcoming environment</li><li>Professional coat care</li><li>Pet profiles and clear scheduling</li></ul>
        <PlaceholderCopy short /><Checklist /><BookButton /></div>
      <div className='why-visual'><SplitImages /><p className='vertical-caption'>Celebrate your pet’s unique style</p></div>
    </div>
  </section>
}
export function ServiceGrid({ showPricing = false }) {
  return <section className='dark-services' id='our-services'>
    <Botanical className='services-leaf services-leaf--left' /><Botanical className='services-leaf services-leaf--right' />
    <div className='editorial-container'>
      <div className='section-intro'><p className='eyebrow'>Our Services</p><h2>Care for every companion.</h2><PlaceholderCopy short /><p className='service-summary'>Basic Grooming · Full Grooming<br />Custom Styling · Bath &amp; Blow Dry<br />Nail Trimming · Ear Cleaning</p></div>
      <div className='arch-service-grid'>{services.map(service => <article className='arch-service-card' key={service.id}>
        <Link to={`/services?service=${service.id}`} className='service-image-link' aria-label={`View ${service.name}`}><ImagePlaceholder label='Service image placeholder' variant='arch' /></Link>
        <Link to={`/services?service=${service.id}`} className='service-label'>{service.name}<ArrowRight size={14} aria-hidden='true' /></Link>
        {showPricing && <div className='service-pricing'><p>₱{service.price.toLocaleString('en-PH')} <span> / {service.duration}</span></p>{service.ai && <small>Style preview available</small>}<BookButton serviceId={service.id}>Book {service.name}</BookButton></div>}
      </article>)}</div>
    </div>
  </section>
}
export function InnerHero({ title, eyebrow, children }) {
  return <section className='inner-hero'><Geometry /><Botanical className='inner-leaf' /><div className='editorial-container editorial-two-column'><div className='editorial-text'><p className='eyebrow'>{eyebrow}</p><h1>{title}</h1>{children || <PlaceholderCopy />}</div><ImagePlaceholder label='Service image placeholder' variant='arch' className='inner-hero-image' /></div></section>
}
export function Faq() {
  return <section className='editorial-section faq-section'><div className='editorial-container editorial-two-column'><div><p className='eyebrow'>FAQ</p><h2>Frequently Asked Questions</h2><div className='faq-list'>{[
    ['How do I book an appointment?', 'Sign in or create an account, add your pet, select a service, and choose an available date and time.'],
    ['Can I choose a grooming style?', 'Full Grooming and Custom Styling include a style preview option in the booking flow.'],
    ['Where can I manage my visits?', 'Open Appointments from your account to view your visits and the available rescheduling or cancellation options.']
  ].map(([question, answer]) => <details key={question}><summary>{question}<Plus size={14} /></summary><p>{answer}</p></details>)}</div></div><div className='faq-image' style={{ borderRadius: '145px 145px 8px 8px', overflow: 'hidden', border: '1px solid rgba(210, 143, 119, 0.4)', background: '#f5e9dc' }}><img src='/sanctuary-session.jpg' alt='FAQ Grooming Care' style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /></div></div></section>
}
