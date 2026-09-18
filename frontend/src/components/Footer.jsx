import { Clock, Mail, MapPin, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'
import { services } from '../data/services'

export default function Footer() {
  const quickLinks = [
    ['Home', '/'],
    ['About us', '/about'],
    ['Services & pricing', '/services'],
    ['Gallery', '/#gallery'],
    ['Contact us', '/contact'],
    ['Privacy policy', '/privacy-policy'],
    ['Terms of service', '/terms-of-service']
  ]

  return (
    <>
      <style>{`
        .editorial-footer {
          background-color: #21201e;
          color: #e6e1da;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 2.75rem 2rem 1.5rem;
          border-top: 1px solid rgba(0, 0, 0, 0.05);
        }

        .footer-container {
          max-width: 1400px;
          margin: 0 auto;
        }

        .footer-columns {
          display: grid;
          grid-template-columns: 1.3fr 1fr 1.1fr 1.2fr;
          gap: 2.5rem;
          margin-bottom: 2rem;
        }

        /* 1. Brand Section */
        .footer-brand {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }

        .footer-brand img {
          height: 48px;
          width: auto;
          object-fit: contain;
          border-radius: 50%;
        }

        .footer-brand p {
          color: #a49e96;
          font-size: 0.88rem;
          line-height: 1.6;
          margin: 0;
          max-width: 300px;
        }

        /* Section Headings */
        .footer-columns h2 {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 1.05rem;
          font-weight: 500;
          color: #ffffff;
          margin: 0 0 0.85rem 0;
          letter-spacing: 0.5px;
          position: relative;
        }

        .footer-columns h2::after {
          content: '';
          display: block;
          width: 26px;
          height: 1.5px;
          background-color: #d1a85b;
          margin-top: 0.35rem;
        }

        /* 2 & 3. Navigation Links */
        .footer-nav {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .footer-nav a {
          color: #b5ada4;
          text-decoration: none;
          font-size: 0.88rem;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          transition: all 0.2s ease;
          width: fit-content;
        }

        .footer-nav a span {
          color: #d1a85b;
          font-size: 1rem;
          line-height: 1;
          transition: transform 0.2s ease;
        }

        .footer-nav a:hover {
          color: #ffffff;
          transform: translateX(3px);
        }

        /* 4. Contact Section */
        .footer-contact {
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }

        .footer-contact p,
        .footer-contact a {
          color: #b5ada4;
          font-size: 0.88rem;
          text-decoration: none;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.65rem;
          line-height: 1.4;
          transition: color 0.2s ease;
        }

        .footer-contact a:hover {
          color: #ffffff;
        }

        .footer-contact svg {
          color: #d1a85b;
          flex-shrink: 0;
        }

        /* Copyright Bar */
        .footer-bottom {
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding-top: 1.25rem;
          text-align: center;
        }

        .footer-copyright {
          color: #827b73;
          font-size: 0.82rem;
          letter-spacing: 0.4px;
        }

        /* Responsive Breakpoints */
        @media (max-width: 1024px) {
          .footer-columns {
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
          }
        }

        @media (max-width: 640px) {
          .editorial-footer {
            padding: 2.25rem 1.25rem 1.25rem;
          }

          .footer-columns {
            grid-template-columns: 1fr;
            gap: 1.75rem;
            margin-bottom: 1.5rem;
          }

          .footer-brand p {
            max-width: 100%;
          }
        }
      `}</style>

      <footer className='editorial-footer'>
        <div className='footer-container'>
          <div className='footer-columns'>
            {/* Column 1: Brand */}
            <div className='footer-brand'>
              <Link to='/'>
                <img src='/logo.png' alt='TimmyTails home' />
              </Link>
              <p>A gentle, welcoming pet grooming sanctuary in Baliuag, Bulacan. Dedicated to calm, personalized care for dogs and cats.</p>
            </div>

            {/* Column 2: Quick Links */}
            <nav className='footer-nav' aria-label='Footer quick links'>
              <h2>Quick links</h2>
              {quickLinks.map(([label, to]) => (
                <Link key={to} to={to}>
                  <span aria-hidden='true'>›</span>
                  {label}
                </Link>
              ))}
            </nav>

            {/* Column 3: Our Services */}
            <nav className='footer-nav' aria-label='Footer services'>
              <h2>Our Services</h2>
              {services.map(s => (
                <Link key={s.id} to={`/services?service=${s.id}`}>
                  <span aria-hidden='true'>›</span>
                  {s.name}
                </Link>
              ))}
            </nav>

            {/* Column 4: Contact Information */}
            <div className='footer-contact'>
              <h2>Contact</h2>
              <p>
                <MapPin size={15} />
                Tangos, Baliuag City, Bulacan
              </p>
              <a href='tel:+639756692647'>
                <Phone size={15} />
                +63 975 669 2647
              </a>
              <a href='mailto:contact@timmytails.com'>
                <Mail size={15} />
                contact@timmytails.com
              </a>
              <p>
                <Clock size={15} />
                Mon–Sat · 8 AM–6 PM
              </p>
            </div>
          </div>

          <div className='footer-bottom'>
            <div className='footer-copyright'>
              © {new Date().getFullYear()} TimmyTails. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}