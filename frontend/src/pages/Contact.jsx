import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  MapPin,
  Phone,
  Mail,
  Clock3,
  Send,
  ArrowRight,
  Sparkles
} from 'lucide-react'
import toast from 'react-hot-toast'
import { contactApi, getErrorMessage } from '../utils/api'
import PhoneField from '../components/PhoneField'
import { Botanical } from '../components/editorial/Decorations'
import ImagePlaceholder from '../components/editorial/ImagePlaceholder'

const initialForm = { name: '', email: '', phone: '', message: '' }

export default function Contact() {
  const [form, setForm] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)

  const validate = () => {
    if (!form.name.trim() || form.name.trim().length < 2) {
      toast.error('Please enter a valid full name (at least 2 characters)')
      return false
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!form.email.trim() || !emailRegex.test(form.email.trim())) {
      toast.error('Please enter a valid email address')
      return false
    }
    if (!form.phone || form.phone.replace(/\D/g, '').length < 10) {
      toast.error('Please enter a valid mobile number')
      return false
    }
    if (!form.message.trim() || form.message.trim().length < 10) {
      toast.error('Message must be at least 10 characters long')
      return false
    }
    return true
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      const { data } = await contactApi.send(form)
      toast.success(data?.message || 'Thank you! Your message has been sent successfully.')
      setForm(initialForm)
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className='contact-editorial-page'>
      <style>{`
        /* ======================================================
           EDITORIAL CONTACT HERO (MATCHING REFERENCE DESIGN)
        ====================================================== */
        .contact-hero-section {
          position: relative;
          background: #fdf4ef;
          overflow: hidden;
          padding: 5rem 2rem 6rem;
          font-family: Georgia, 'Times New Roman', serif;
        }

        /* Subtle chevron / angled background lines mula sa reference */
        .contact-hero-bg-lines {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1;
          opacity: 0.65;
        }

        .contact-hero-container {
          max-width: 1280px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 3.5rem;
          align-items: center;
          position: relative;
          z-index: 2;
        }

        .contact-hero-leaf-left {
          position: absolute;
          left: -45px;
          top: -30px;
          width: 250px;
          opacity: 0.38;
          color: #cf7c54;
          pointer-events: none;
          z-index: 1;
        }

        .contact-hero-copy {
          max-width: 540px;
        }

        .contact-hero-eyebrow {
          font-size: 0.82rem;
          letter-spacing: 3.5px;
          text-transform: uppercase;
          color: #a47d44;
          font-weight: 600;
          display: block;
          margin-bottom: 1rem;
        }

        .contact-hero-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(2.8rem, 4.8vw, 4.4rem);
          line-height: 1.1;
          color: #24211e;
          font-weight: 500;
          margin: 0 0 1.5rem 0;
          letter-spacing: -0.02em;
        }

        .contact-hero-desc {
          font-size: 1.05rem;
          line-height: 1.8;
          color: #635b53;
          margin: 0;
        }

        /* Visual column sa kanan (Floral circular portrait styling) */
        .contact-hero-visual-wrapper {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .contact-hero-circle-halo {
          position: relative;
          width: 360px;
          height: 360px;
          border-radius: 50%;
          padding: 10px;
          background: linear-gradient(145deg, rgba(255,255,255,0.7), rgba(243, 201, 189, 0.4));
          border: 1px solid rgba(210, 143, 119, 0.35);
          box-shadow: 0 16px 40px rgba(50, 32, 22, 0.06);
        }

        .contact-hero-circle-inner {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          overflow: hidden;
          background-color: #f7ebe1;
          position: relative;
        }

        .contact-hero-circle-inner img,
        .contact-hero-circle-inner > * {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .contact-botanical-halo-1 {
          position: absolute;
          width: 330px;
          right: -70px;
          bottom: -50px;
          opacity: 0.85;
          color: #cf7c54;
          pointer-events: none;
          z-index: 3;
          transform: rotate(20deg);
        }

        .contact-botanical-halo-2 {
          position: absolute;
          width: 260px;
          left: -60px;
          top: -30px;
          opacity: 0.55;
          color: #d1a85b;
          pointer-events: none;
          z-index: 3;
          transform: scaleX(-1) rotate(-35deg);
        }

        /* ======================================================
           MAIN CONTACT FORM & DETAILS SECTION
        ====================================================== */
        .contact-main-section {
          background-color: #ffffff;
          padding: 6rem 2rem 7rem;
          position: relative;
        }

        .contact-main-container {
          max-width: 1240px;
          margin: 0 auto;
        }

        .contact-section-heading-block {
          text-align: center;
          max-width: 650px;
          margin: 0 auto 4.5rem;
        }

        .contact-section-eyebrow {
          font-size: 0.8rem;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: #a47d44;
          font-weight: 600;
          display: inline-block;
          margin-bottom: 0.75rem;
        }

        .contact-section-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(2.3rem, 3.5vw, 3.2rem);
          line-height: 1.2;
          color: #24211e;
          font-weight: 500;
          margin: 0;
        }

        .contact-grid {
          display: grid;
          grid-template-columns: 0.85fr 1.15fr;
          gap: 3.5rem;
          align-items: flex-start;
        }

        /* Info Sanctuary Card */
        .contact-info-card {
          background: #24211e;
          color: #f7f1ea;
          border-radius: 16px;
          padding: 3.25rem 2.75rem;
          position: relative;
          overflow: hidden;
          box-shadow: 0 18px 45px rgba(36, 33, 30, 0.12);
        }

        .contact-info-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #cf7c54, #d1a85b);
        }

        .contact-info-eyebrow {
          font-size: 0.78rem;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: #d1a85b;
          font-weight: 600;
          margin-bottom: 0.5rem;
          display: block;
        }

        .contact-info-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 1.85rem;
          color: #ffffff;
          font-weight: 500;
          margin: 0 0 2rem 0;
        }

        .contact-info-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding-top: 1.75rem;
        }

        .contact-info-item {
          display: flex;
          align-items: flex-start;
          gap: 1.1rem;
        }

        .contact-info-icon-box {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(209, 168, 91, 0.25);
          color: #d1a85b;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .contact-info-item-label {
          font-size: 0.72rem;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #9c9388;
          font-weight: 600;
          margin: 0 0 0.25rem 0;
        }

        .contact-info-item-value {
          font-size: 0.95rem;
          color: #ffffff;
          margin: 0;
          line-height: 1.5;
        }

        .contact-booking-prompt {
          margin-top: 2.5rem;
          padding-top: 1.75rem;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .contact-booking-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 0.88rem;
          font-weight: 600;
          color: #d1a85b;
          text-decoration: none;
          letter-spacing: 0.5px;
          transition: color 0.2s ease, transform 0.2s ease;
        }

        .contact-booking-link:hover {
          color: #f2d875;
          transform: translateX(3px);
        }

        /* Editorial Clean Form */
        .contact-form-card {
          background: #ffffff;
          border: 1px solid rgba(210, 143, 119, 0.3);
          border-radius: 16px;
          padding: 3.5rem 3rem;
          box-shadow: 0 16px 40px rgba(50, 32, 22, 0.03);
        }

        .contact-form-heading {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 1.75rem;
          color: #24211e;
          font-weight: 500;
          margin: 0 0 0.5rem 0;
        }

        .contact-form-sub {
          font-size: 0.92rem;
          color: #635b53;
          margin: 0 0 2.25rem 0;
        }

        .contact-field-group {
          margin-bottom: 1.5rem;
        }

        .contact-field-label {
          display: block;
          font-size: 0.82rem;
          font-weight: 600;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          color: #4a453f;
          margin-bottom: 0.55rem;
        }

        .contact-input,
        .contact-textarea {
          width: 100%;
          border: 1px solid rgba(210, 143, 119, 0.35);
          background-color: #fdfaf8;
          border-radius: 6px;
          padding: 0.85rem 1.15rem;
          font-size: 0.94rem;
          color: #24211e;
          font-family: inherit;
          outline: none;
          transition: border-color 0.25s ease, box-shadow 0.25s ease, background-color 0.25s ease;
          box-sizing: border-box;
        }

        .contact-input:focus,
        .contact-textarea:focus {
          border-color: #cf7c54;
          background-color: #ffffff;
          box-shadow: 0 0 0 4px rgba(207, 124, 84, 0.12);
        }

        .contact-submit-btn {
          height: 52px;
          padding: 0 2.25rem;
          background: #24211e;
          color: #ffffff !important;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          text-transform: uppercase;
          font-size: 0.82rem;
          font-weight: 600;
          letter-spacing: 1.5px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.2s ease, transform 0.2s ease;
          margin-top: 1rem;
        }

        .contact-submit-btn:hover:not(:disabled) {
          background: #3d3d3d;
          transform: translateY(-1px);
        }

        .contact-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* ======================================================
           RESPONSIVE BREAKPOINTS
        ====================================================== */
        @media (max-width: 1024px) {
          .contact-hero-container {
            grid-template-columns: 1fr;
            text-align: center;
            gap: 3.5rem;
          }

          .contact-hero-copy {
            max-width: 100%;
          }

          .contact-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 680px) {
          .contact-hero-section {
            padding: 4rem 1.25rem;
          }

          .contact-hero-circle-halo {
            width: 270px;
            height: 270px;
          }

          .contact-main-section {
            padding: 4.5rem 1.25rem;
          }

          .contact-info-card,
          .contact-form-card {
            padding: 2.25rem 1.5rem;
          }
        }
      `}</style>

      {/* ======================================================
          EDITORIAL HERO SECTION (IN THE STYLE OF YOUR SCREENSHOT)
      ====================================================== */}
      <section className='contact-hero-section'>
        {/* Subtle Decorative Chevron Lines sa Background */}
        <svg
          className='contact-hero-bg-lines'
          viewBox='0 0 1440 450'
          fill='none'
          preserveAspectRatio='none'
          aria-hidden='true'
        >
          <path
            d='M-50,220 L350,280 L720,200 L1100,280 L1500,210'
            stroke='#ecdcd0'
            strokeWidth='1.8'
            strokeDasharray='6 6'
          />
          <path
            d='M-50,310 L380,380 L760,300 L1150,380 L1500,310'
            stroke='#f0e1d5'
            strokeWidth='1.5'
          />
        </svg>

        {/* Botanical Leaf sa Left Edge */}
        <Botanical className='contact-hero-leaf-left' />

        <div className='contact-hero-container'>
          <div className='contact-hero-copy'>
            <span className='contact-hero-eyebrow'>CONTACT US</span>
            <h1 className='contact-hero-title'>Get in touch</h1>
            <p className='contact-hero-desc'>
              Get in touch with TimmyTails Pet Sanctuary for appointments, inquiries, or personalized pet styling consultations today.
            </p>
          </div>

          <div className='contact-hero-visual-wrapper'>
            {/* Halo Botanical Decorations */}
            <Botanical className='contact-botanical-halo-1' />
            <Botanical className='contact-botanical-halo-2' />

            <div className='contact-hero-circle-halo'>
              <div className='contact-hero-circle-inner'>
                <img
                  src='/sanctuary-session.jpg'
                  alt='TimmyTails Sanctuary Stylist'
                  className='w-full h-full object-cover'
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================
          REACH OUT TODAY: FORM & LOCATION DETAILS
      ====================================================== */}
      <section className='contact-main-section'>
        <div className='contact-main-container'>
          <div className='contact-section-heading-block'>
            <span className='contact-section-eyebrow'>COMMUNICATION</span>
            <h2 className='contact-section-title'>Reach Out Today</h2>
          </div>

          <div className='contact-grid'>
            {/* Left Column: Sanctuary Information */}
            <aside className='contact-info-card'>
              <span className='contact-info-eyebrow'>LOCATION &amp; HOURS</span>
              <h3 className='contact-info-title'>TimmyTails Tangos</h3>

              <div className='contact-info-list'>
                <div className='contact-info-item'>
                  <div className='contact-info-icon-box'>
                    <MapPin size={18} />
                  </div>
                  <div>
                    <p className='contact-info-item-label'>Location</p>
                    <p className='contact-info-item-value'>Tangos, Baliuag City, Bulacan, Philippines</p>
                  </div>
                </div>

                <div className='contact-info-item'>
                  <div className='contact-info-icon-box'>
                    <Phone size={18} />
                  </div>
                  <div>
                    <p className='contact-info-item-label'>Phone</p>
                    <p className='contact-info-item-value'>+63 975 669 2647</p>
                  </div>
                </div>

                <div className='contact-info-item'>
                  <div className='contact-info-icon-box'>
                    <Mail size={18} />
                  </div>
                  <div>
                    <p className='contact-info-item-label'>Email</p>
                    <p className='contact-info-item-value'>contact@timmytails.com</p>
                  </div>
                </div>

                <div className='contact-info-item'>
                  <div className='contact-info-icon-box'>
                    <Clock3 size={18} />
                  </div>
                  <div>
                    <p className='contact-info-item-label'>Hours</p>
                    <p className='contact-info-item-value'>Mon–Sat · 8:00 AM–6:00 PM</p>
                  </div>
                </div>
              </div>

              <div className='contact-booking-prompt'>
                <Link to='/booking' className='contact-booking-link'>
                  Need a slot instead? Book here <ArrowRight size={15} />
                </Link>
              </div>
            </aside>

            {/* Right Column: Editorial Message Form */}
            <form onSubmit={submit} className='contact-form-card'>
              <h3 className='contact-form-heading'>Send a message.</h3>
              <p className='contact-form-sub'>
                Have questions regarding styling cuts, sensitive skin botanicals, or private sanctuary slots? Let us know.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                <div className='contact-field-group'>
                  <label className='contact-field-label'>Full Name</label>
                  <input
                    required
                    type='text'
                    name='name'
                    placeholder='e.g. Juan dela Cruz'
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className='contact-input'
                  />
                </div>

                <div className='contact-field-group'>
                  <label className='contact-field-label'>Email Address</label>
                  <input
                    required
                    type='email'
                    name='email'
                    placeholder='example@gmail.com'
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className='contact-input'
                  />
                </div>
              </div>

              <div className='contact-field-group'>
                <PhoneField
                  label='Mobile Phone Number'
                  name='phone'
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder='917 123 4567'
                />
              </div>

              <div className='contact-field-group'>
                <label className='contact-field-label'>Message</label>
                <textarea
                  name='message'
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  required
                  minLength={10}
                  maxLength={1000}
                  rows={5}
                  placeholder='Write your inquiry or notes regarding your pet here…'
                  className='contact-textarea'
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#a47d44' }}>
                    <Sparkles size={11} style={{ display: 'inline', marginRight: '4px' }} />
                    We usually respond within 24 hours
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#8c8378', fontWeight: 'bold' }}>
                    {form.message.length}/1000
                  </span>
                </div>
              </div>

              <button
                type='submit'
                disabled={submitting}
                className='contact-submit-btn'
              >
                <Send size={15} />
                {submitting ? 'Sending message…' : 'Send message'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  )
}