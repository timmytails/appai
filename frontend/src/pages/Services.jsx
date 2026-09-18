import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, Clock, Sparkles, Check, HeartHandshake } from 'lucide-react'
import { services } from '../data/services'
import ImagePlaceholder from '../components/editorial/ImagePlaceholder'
import BookButton from '../components/editorial/BookButton'
import { Botanical } from '../components/editorial/Decorations'
import { Faq, PlaceholderCopy } from '../components/editorial/Sections'

export default function Services() {
  const [params] = useSearchParams()
  const selected = services.find(s => s.id === params.get('service'))

  return (
    <div className='editorial-page'>
      <style>{`
        /* ======================================================
           1. "OUR PACKAGE" HERO SECTION
        ====================================================== */
        .package-hero-section {
          position: relative;
          background: #fdf4ef;
          overflow: hidden;
          padding: 5rem 2rem 5.5rem;
          font-family: Georgia, 'Times New Roman', serif;
        }

        .package-hero-lines {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1;
          opacity: 0.65;
        }

        .package-hero-leaf {
          position: absolute;
          left: -40px;
          top: -20px;
          width: 250px;
          opacity: 0.35;
          color: #cf7c54;
          pointer-events: none;
          z-index: 1;
        }

        .package-hero-container {
          max-width: 1280px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 3.5rem;
          align-items: center;
          position: relative;
          z-index: 2;
        }

        .package-hero-copy {
          max-width: 530px;
        }

        .package-hero-eyebrow {
          font-size: 0.82rem;
          letter-spacing: 3.5px;
          text-transform: uppercase;
          color: #a47d44;
          font-weight: 600;
          display: block;
          margin-bottom: 0.9rem;
        }

        .package-hero-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(2.8rem, 4.8vw, 4.2rem);
          line-height: 1.12;
          color: #24211e;
          font-weight: 500;
          margin: 0 0 1.35rem 0;
          letter-spacing: -0.02em;
        }

        .package-hero-desc {
          font-size: 1.05rem;
          line-height: 1.8;
          color: #635b53;
          margin: 0;
        }

        .package-hero-visual {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .package-petal-flower {
          position: absolute;
          width: 440px;
          height: 440px;
          pointer-events: none;
          z-index: 1;
          opacity: 0.55;
        }

        .package-hero-arch {
          width: 320px;
          height: 400px;
          border-radius: 160px 160px 20px 20px;
          overflow: hidden;
          background: #f6eae0;
          border: 1px solid rgba(210, 143, 119, 0.45);
          outline: 6px solid rgba(255, 255, 255, 0.7);
          outline-offset: 4px;
          box-shadow: 0 20px 45px rgba(50, 32, 22, 0.08);
          position: relative;
          z-index: 2;
        }

        .package-hero-arch img,
        .package-hero-arch > * {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* ======================================================
           2. SLIM & SLEEK MARQUEE (#our-services)
        ====================================================== */
        .services-marquee-showcase {
          background-color: #22201e;
          color: #f7f1ea;
          padding: 3.8rem 0 4.2rem;
          position: relative;
          overflow: hidden;
        }

        .services-grid-rule-top {
          position: absolute;
          top: 38px;
          left: 0;
          right: 0;
          height: 1px;
          background: rgba(210, 143, 119, 0.25);
          z-index: 1;
          pointer-events: none;
        }

        .services-grid-rule-bottom {
          position: absolute;
          bottom: 35px;
          left: 0;
          right: 0;
          height: 1px;
          background: rgba(210, 143, 119, 0.2);
          z-index: 1;
          pointer-events: none;
        }

        .services-botanical-art-left {
          position: absolute;
          left: -40px;
          top: 15px;
          width: 250px;
          opacity: 0.15;
          color: #d1a85b;
          pointer-events: none;
          z-index: 1;
          transform: rotate(20deg);
        }

        .services-botanical-art-right {
          position: absolute;
          right: -40px;
          bottom: 10px;
          width: 250px;
          opacity: 0.12;
          color: #cf7c54;
          pointer-events: none;
          z-index: 1;
          transform: scaleX(-1) rotate(-15deg);
        }

        .services-showcase-header-wrapper {
          max-width: 1280px;
          margin: 0 auto 2.5rem;
          padding: 0 2rem;
          position: relative;
          z-index: 2;
        }

        .services-showcase-header {
          position: relative;
          max-width: 680px;
          margin: 0 auto;
          text-align: center;
          padding: 1.25rem 2rem;
          border-left: 1px solid rgba(210, 143, 119, 0.35);
          border-right: 1px solid rgba(210, 143, 119, 0.35);
        }

        .services-showcase-header::before,
        .services-showcase-header::after {
          content: '+';
          position: absolute;
          font-family: Georgia, serif;
          font-size: 13px;
          color: #d1a85b;
          line-height: 1;
        }
        .services-showcase-header::before {
          top: -7px;
          left: -4.5px;
        }
        .services-showcase-header::after {
          top: -7px;
          right: -4.5px;
        }

        .services-badge-pill {
          font-size: 0.72rem;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          color: #d1a85b;
          font-weight: 600;
          display: inline-block;
          margin-bottom: 0.4rem;
        }

        .services-headline {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(1.8rem, 3vw, 2.4rem);
          line-height: 1.18;
          color: #ffffff;
          font-weight: 500;
          margin: 0 0 0.5rem 0;
        }

        .services-tagline-list {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 0.4rem 0.9rem;
          margin: 0.75rem auto 0;
          font-size: 0.82rem;
          color: #a89f94;
        }

        .services-marquee-viewport {
          position: relative;
          width: 100%;
          overflow: hidden;
          padding: 0.75rem 0;
          z-index: 2;
          mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
        }

        .services-marquee-track {
          display: flex;
          gap: 1.75rem;
          width: max-content;
          animation: servicesMarqueeScroll 32s linear infinite;
        }

        .services-marquee-track:hover {
          animation-play-state: paused;
        }

        @keyframes servicesMarqueeScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .service-marquee-card {
          flex: 0 0 240px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          transition: transform 0.3s ease;
        }

        .service-marquee-card:hover {
          transform: translateY(-4px);
        }

        .service-marquee-arch {
          width: 240px;
          height: 290px;
          border-radius: 120px 120px 8px 8px;
          overflow: hidden;
          position: relative;
          background: #35312e;
          border: 1px solid rgba(210, 143, 119, 0.4);
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.25);
        }

        .service-marquee-arch > img,
        .service-marquee-arch > .image-placeholder {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.5s ease;
        }

        .service-marquee-card:hover .service-marquee-arch > img {
          transform: scale(1.05);
        }

        .service-floating-label-box {
          position: absolute;
          bottom: 12px;
          left: 12px;
          right: 12px;
          width: calc(100% - 24px);
          height: auto;
          background: #ffffff;
          padding: 0.6rem 0.9rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-radius: 4px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          text-decoration: none;
          color: #22201e;
          z-index: 2;
        }

        .service-floating-name {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 0.92rem;
          font-weight: 600;
          color: #22201e;
          margin: 0;
        }

        .service-floating-arrow {
          width: 20px;
          height: 20px;
          background: #cf7c54;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 2px;
          flex-shrink: 0;
        }

        .service-card-meta-bottom {
          margin-top: 0.85rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.2rem;
        }

        .service-price-text {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 1.15rem;
          font-weight: 600;
          color: #ffffff;
          margin: 0;
        }

        .service-price-text span {
          font-family: Georgia, serif;
          font-size: 0.8rem;
          color: #a89f94;
        }

        .service-preview-note {
          font-size: 0.74rem;
          letter-spacing: 0.5px;
          color: #d1a85b;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          margin: 0;
        }

        /* ======================================================
           3. BENEFITS: TEXT ON LEFT, EXTRA LARGE PINK-TO-TRANSPARENT CIRCLE
        ====================================================== */
        .service-benefits-redesigned {
          position: relative;
          background: #fdf5ef;
          padding: 7.5rem 2rem 8.5rem;
          overflow: hidden;
        }

        .benefits-line-top {
          position: absolute;
          top: 55px;
          left: 0;
          right: 0;
          height: 1px;
          background: rgba(210, 143, 119, 0.38);
          z-index: 1;
          pointer-events: none;
        }

        .benefits-line-bottom {
          position: absolute;
          bottom: 55px;
          left: 0;
          right: 0;
          height: 1px;
          background: rgba(210, 143, 119, 0.32);
          z-index: 1;
          pointer-events: none;
        }

        .benefits-bg-svg-lines {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1;
          opacity: 0.55;
        }

        .benefits-leaf-left {
          position: absolute;
          left: -40px;
          bottom: 15px;
          width: 270px;
          opacity: 0.28;
          color: #d1a85b;
          pointer-events: none;
          z-index: 1;
          transform: rotate(-15deg);
        }

        .benefits-grid-container {
          max-width: 1320px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3.5rem;
          align-items: center;
          position: relative;
          z-index: 2;
        }

        /* LEFT: TEXT CONTENT */
        .benefits-text-column {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          max-width: 560px;
        }

        .benefits-eyebrow-text {
          font-size: 0.8rem;
          letter-spacing: 3.5px;
          text-transform: uppercase;
          color: #a47d44;
          font-weight: 600;
          display: inline-block;
          margin-bottom: 0.9rem;
        }

        .benefits-heading-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(2.4rem, 4vw, 3.4rem);
          line-height: 1.16;
          color: #24211e;
          font-weight: 500;
          margin: 0 0 1.25rem 0;
          letter-spacing: -0.015em;
        }

        .benefits-lead-copy {
          font-size: 1.02rem;
          line-height: 1.8;
          color: #635b53;
          margin: 0 0 2rem 0;
          max-width: 530px;
        }

        .benefits-pill-container {
          display: flex;
          flex-wrap: wrap;
          gap: 0.6rem 0.85rem;
          margin-bottom: 2rem;
          padding-bottom: 1.75rem;
          border-bottom: 1px solid rgba(210, 143, 119, 0.35);
          width: 100%;
        }

        .benefits-pill-item {
          font-family: Georgia, serif;
          font-size: 0.88rem;
          color: #6d422a;
          background: #fbf1e8;
          border: 1px solid rgba(207, 124, 84, 0.35);
          padding: 0.35rem 0.95rem;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .benefits-checklist-stack {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.95rem;
          width: 100%;
        }

        .benefits-check-card {
          background: #ffffff;
          border: 1px solid rgba(210, 143, 119, 0.28);
          border-radius: 8px;
          padding: 1.05rem 1.35rem;
          display: flex;
          align-items: center;
          gap: 14px;
          box-shadow: 0 6px 18px rgba(50, 32, 22, 0.03);
          transition: transform 0.25s ease, border-color 0.25s ease;
        }

        .benefits-check-card:hover {
          transform: translateX(4px);
          border-color: rgba(207, 124, 84, 0.55);
        }

        .benefits-check-badge {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #fdf4ef;
          border: 1px solid rgba(164, 125, 68, 0.4);
          color: #a47d44;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .benefits-check-label {
          font-size: 0.93rem;
          color: #3b3631;
          font-weight: 500;
          line-height: 1.45;
        }

        /* RIGHT: EXTRA LARGE CIRCLE WITH TOP-TO-BOTTOM TRANSPARENCY GRADIENT */
        .benefits-visual-column {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
        }

        .benefits-circle-outer-wrapper {
          position: relative;
          width: 580px;
          height: 580px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Concentric delicate halo that gently fades at the bottom */
        .benefits-circle-halo-ring {
          position: absolute;
          inset: -14px;
          border-radius: 50%;
          border: 1px solid rgba(210, 143, 119, 0.35);
          pointer-events: none;
          mask-image: linear-gradient(180deg, black 40%, transparent 100%);
          -webkit-mask-image: linear-gradient(180deg, black 40%, transparent 100%);
        }

        /* MALAKING BILOG: PINK SA TAAS, PAPA-TRANSPARENT SA IBABA */
        .benefits-pink-circle-card {
          width: 550px;
          height: 550px;
          border-radius: 50%;
          background: linear-gradient(180deg, #f4b8ac 0%, rgba(247, 204, 196, 0.5) 50%, rgba(253, 245, 239, 0) 100%);
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .benefits-pink-circle-card img,
        .benefits-pink-circle-card > * {
          width: 100%;
          height: 100%;
          object-fit: cover;
          background: transparent !important;
        }

        /* White leaf botanical overlay sa kanto */
        .benefits-circle-white-leaf {
          position: absolute;
          right: -30px;
          bottom: 10px;
          width: 320px;
          opacity: 0.92;
          color: rgba(255, 255, 255, 0.96);
          pointer-events: none;
          z-index: 5;
          transform: rotate(8deg);
        }

        /* Floating Trust Tag */
        .benefits-floating-pill-badge {
          position: absolute;
          bottom: 25px;
          left: -8px;
          background: #ffffff;
          border: 1px solid rgba(210, 143, 119, 0.35);
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08);
          border-radius: 8px;
          padding: 0.85rem 1.25rem;
          display: flex;
          align-items: center;
          gap: 12px;
          z-index: 6;
        }

        .benefits-floating-pill-badge strong {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 1rem;
          color: #24211e;
          display: block;
        }

        .benefits-floating-pill-badge span {
          font-size: 0.72rem;
          color: #8c8378;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        /* ======================================================
           RESPONSIVE BREAKPOINTS
        ====================================================== */
        @media (max-width: 1150px) {
          .benefits-circle-outer-wrapper {
            width: 460px;
            height: 460px;
          }
          .benefits-pink-circle-card {
            width: 440px;
            height: 440px;
          }
        }

        @media (max-width: 1024px) {
          .package-hero-container,
          .benefits-grid-container {
            grid-template-columns: 1fr;
            text-align: center;
            gap: 3.5rem;
          }

          .package-hero-copy,
          .benefits-lead-copy {
            max-width: 100%;
          }

          .benefits-text-column {
            align-items: center;
            max-width: 100%;
          }

          .benefits-pill-container {
            justify-content: center;
          }

          .benefits-floating-pill-badge {
            left: 50%;
            transform: translateX(-50%);
            bottom: -15px;
          }
        }

        @media (max-width: 680px) {
          .package-hero-section,
          .service-benefits-redesigned {
            padding: 4rem 1.25rem;
          }

          .package-hero-arch {
            width: 240px;
            height: 310px;
          }

          .package-petal-flower {
            width: 320px;
            height: 320px;
          }

          .benefits-circle-outer-wrapper {
            width: 310px;
            height: 310px;
          }

          .benefits-pink-circle-card {
            width: 290px;
            height: 290px;
          }

          .benefits-circle-white-leaf {
            width: 200px;
            right: -15px;
            bottom: -5px;
          }
        }
      `}</style>

      {/* ======================================================
          1. "OUR PACKAGE" HERO
      ====================================================== */}
      <section className='package-hero-section'>
        <svg
          className='package-hero-lines'
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

        <Botanical className='package-hero-leaf' />

        <div className='package-hero-container'>
          <div className='package-hero-copy'>
            <span className='package-hero-eyebrow'>UNLOCK YOUR RADIANCE</span>
            <h1 className='package-hero-title'>Our Package</h1>
            <p className='package-hero-desc'>
              Our packages combine essential grooming services to give your companion complete care, value, and a radiant transformation.
            </p>
          </div>

          <div className='package-hero-visual'>
            <svg
              className='package-petal-flower'
              viewBox='0 0 200 200'
              fill='currentColor'
              style={{ color: '#f3cfc1' }}
            >
              <circle cx='100' cy='35' r='30' />
              <circle cx='165' cy='75' r='30' />
              <circle cx='150' cy='150' r='30' />
              <circle cx='70' cy='165' r='30' />
              <circle cx='35' cy='100' r='30' />
              <circle cx='100' cy='100' r='38' />
            </svg>

            <div className='package-hero-arch'>
              <img
                src='/pome-tweed-suit.jpg'
                alt='TimmyTails Package Model'
                className='w-full h-full object-cover'
              />
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================
          2. SLIM & SLEEK MARQUEE
      ====================================================== */}
      <section className='services-marquee-showcase' id='our-services'>
        <div className='services-grid-rule-top' aria-hidden='true' />
        <div className='services-grid-rule-bottom' aria-hidden='true' />

        <Botanical className='services-botanical-art-left' />
        <Botanical className='services-botanical-art-right' />

        <div className='services-showcase-header-wrapper'>
          <div className='services-showcase-header'>
            <span className='services-badge-pill'>INDIVIDUAL SERVICES</span>
            <h2 className='services-headline'>Care for every companion</h2>
            <div className='services-tagline-list'>
              <span>Basic Grooming</span>
              <span>•</span>
              <span>Full Grooming</span>
              <span>•</span>
              <span>Custom Styling</span>
              <span>•</span>
              <span>Bath &amp; Blow Dry</span>
              <span>•</span>
              <span>Nail Trimming</span>
              <span>•</span>
              <span>Ear Cleaning</span>
            </div>
          </div>
        </div>

        <div className='services-marquee-viewport'>
          <div className='services-marquee-track'>
            {[...services, ...services].map((service, index) => (
              <div key={`${service.id}-${index}`} className='service-marquee-card'>
                <div className='service-marquee-arch'>
                  {service.image ? (
                    <img
                      src={service.image}
                      alt={service.name}
                      className='w-full h-full object-cover'
                    />
                  ) : (
                    <ImagePlaceholder label={`${service.name} visual`} variant='arch' />
                  )}

                  <Link
                    to={`/services?service=${service.id}`}
                    className='service-floating-label-box'
                    aria-label={`View details for ${service.name}`}
                  >
                    <span className='service-floating-name'>{service.name}</span>
                    <span className='service-floating-arrow'>
                      <ArrowRight size={12} strokeWidth={2.5} />
                    </span>
                  </Link>
                </div>

                <div className='service-card-meta-bottom'>
                  <p className='service-price-text'>
                    ₱{service.price.toLocaleString('en-PH')}{' '}
                    <span>/ {service.duration}</span>
                  </p>
                  {service.ai ? (
                    <p className='service-preview-note'>
                      <Sparkles size={11} /> Style preview available
                    </p>
                  ) : (
                    <p className='service-preview-note' style={{ color: '#a89f94' }}>
                      <Clock size={11} /> Cage-free session
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================
          3. BENEFITS: TEXT ON LEFT, EXTRA LARGE PINK-TO-TRANSPARENT CIRCLE
      ====================================================== */}
      <section className='service-benefits-redesigned'>
        <div className='benefits-line-top' aria-hidden='true' />
        <div className='benefits-line-bottom' aria-hidden='true' />

        <svg
          className='benefits-bg-svg-lines'
          viewBox='0 0 1440 500'
          fill='none'
          preserveAspectRatio='none'
          aria-hidden='true'
        >
          <path
            d='M-50,260 L380,330 L740,240 L1120,320 L1500,250'
            stroke='#ebd9cc'
            strokeWidth='1.8'
            strokeDasharray='5 5'
          />
        </svg>

        <Botanical className='benefits-leaf-left' />

        <div className='benefits-grid-container'>
          {/* LEFT: TEXT CONTENT */}
          <div className='benefits-text-column'>
            <span className='benefits-eyebrow-text'>WHY OUR GROOMING SERVICES STAND OUT</span>
            <h2 className='benefits-heading-title'>Benefits of Our Grooming Services</h2>
            <p className='benefits-lead-copy'>
              We believe grooming is an essential health ritual rather than a stressful chore. Every session is adapted to your pet’s unique coat condition and temperament.
            </p>

            <div className='benefits-pill-container'>
              <span className='benefits-pill-item'>Expert care</span>
              <span className='benefits-pill-item'>Patient handling</span>
              <span className='benefits-pill-item'>Coat care</span>
              <span className='benefits-pill-item'>Comfortable surroundings</span>
            </div>

            <ul className='benefits-checklist-stack'>
              <li className='benefits-check-card'>
                <span className='benefits-check-badge'><Check size={13} strokeWidth={2.8} /></span>
                <span className='benefits-check-label'>Care tailored to your pet’s coat and individual needs</span>
              </li>
              <li className='benefits-check-card'>
                <span className='benefits-check-badge'><Check size={13} strokeWidth={2.8} /></span>
                <span className='benefits-check-label'>Grooming styles chosen around your silhouette preferences</span>
              </li>
              <li className='benefits-check-card'>
                <span className='benefits-check-badge'><Check size={13} strokeWidth={2.8} /></span>
                <span className='benefits-check-label'>Transparent services, upfront pricing, and private schedule slots</span>
              </li>
              <li className='benefits-check-card'>
                <span className='benefits-check-badge'><Check size={13} strokeWidth={2.8} /></span>
                <span className='benefits-check-label'>Pet profiles that keep temperament and skin care notes together</span>
              </li>
            </ul>
          </div>

          {/* RIGHT: EXTRA LARGE PINK-TO-TRANSPARENT CIRCLE */}
          <div className='benefits-visual-column'>
            <div className='benefits-circle-outer-wrapper'>
              <div className='benefits-circle-halo-ring' aria-hidden='true' />

              <div className='benefits-pink-circle-card'>
                <img
                  src='/pome-pink-dress.jpg'
                  alt='Benefits of Grooming'
                  className='w-full h-full object-cover rounded-full'
                />
              </div>

              {/* White Botanical Leaf Accent Overlay */}
              <Botanical className='benefits-circle-white-leaf' />

              {/* Floating Trust Badge */}
              <div className='benefits-floating-pill-badge'>
                <div style={{ color: '#d1a85b' }}>
                  <HeartHandshake size={22} />
                </div>
                <div>
                  <strong>Low-Stress &amp; Cage-Free</strong>
                  <span>Certified Gentle Care</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <Faq />

      {/* CALL TO ACTION */}
      <section className='editorial-section'>
        <div className='editorial-container section-intro'>
          <p className='eyebrow'>Ready when you are</p>
          <h2>Reserve your pet’s next visit.</h2>
          <PlaceholderCopy short />
          <div className='editorial-actions center-action'>
            <BookButton serviceId={selected?.id}>Book an appointment</BookButton>
            <Link className='editorial-text-link' to='/contact'>Contact Us</Link>
          </div>
        </div>
      </section>
    </div>
  )
}