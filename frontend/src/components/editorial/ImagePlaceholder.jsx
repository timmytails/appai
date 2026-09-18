import { Image } from 'lucide-react'

// Add a src when final photography is ready; the shape and dimensions stay intact.
export default function ImagePlaceholder({ label = 'Image placeholder', variant = 'portrait', className = '', src, alt }) {
  return <div className={`image-placeholder image-placeholder--${variant} ${className}`}>
    {src ? <img src={src} alt={alt || label} /> : <span className='placeholder-caption'><Image size={23} strokeWidth={1} aria-hidden='true' /><span>{label}</span></span>}
  </div>
}
