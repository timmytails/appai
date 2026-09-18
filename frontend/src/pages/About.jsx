import { Link } from 'react-router-dom'
import { HeartHandshake, ShieldCheck, Sparkles, Scissors } from 'lucide-react'
import ImagePlaceholder from '../components/editorial/ImagePlaceholder'
import { Faq } from '../components/editorial/Sections'

// Dito na nakapaloob ang bagong WhyChooseUs component
function WhyChooseUs() {
  const features = [
    {
      icon: <HeartHandshake size={24} />,
      title: 'Gentle, Low-Stress Handling',
      description: 'We prioritize patience over speed. Every session is adapted to your pet’s unique temperament, ensuring a calm, fear-free grooming visit.'
    },
    {
      icon: <Sparkles size={24} />,
      title: 'Hypoallergenic Spa Products',
      description: 'We strictly use premium, natural, and low-sensitivity botanical shampoos and conditioners that nourish delicate coats and sensitive skin.'
    },
    {
      icon: <ShieldCheck size={24} />,
      title: 'Cage-Free & Hygienic Haven',
      description: 'No cramped metal cages or noisy chaos. Our sanctuary maintains strict sanitation protocols with peaceful, dedicated spaces for each companion.'
    },
    {
      icon: <Scissors size={24} />,
      title: 'Precision Breed Styling',
      description: 'From customized teddy cuts to show-standard outlines, our trained stylists consult with you to deliver the exact silhouette you envision.'
    }
  ]

  return (
    <section className='why-choose-section'>
      <div className='why-choose-header'>
        <span className='why-eyebrow'>The TimmyTails Standard</span>
        <h2 className='why-title'>Why Pets &amp; Owners Trust Us</h2>
        <p className='why-subtitle'>
          We combine certified styling expertise with genuine compassion, ensuring each grooming session is restorative, comfortable, and tailored to your pet.
        </p>
      </div>

      <div className='why-grid'>
        {features.map((item, index) => (
          <div key={index} className='why-card'>
            <div className='why-icon-box'>
              {item.icon}
            </div>
            <h3 className='why-card-title'>{item.title}</h3>
            <p className='why-card-desc'>{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default function About() {
  return (
    <>
      <style>{`
        .editorial-about-page {
          background-color: #fdf4ef;
          color: #2b2b2b;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 1.5rem 1.5rem 6rem;
          overflow-x: hidden;
          position: relative;
        }

        .about-inner-container {
          max-width: 1280px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 4.5rem;
          position: relative;
          z-index: 2;
        }

        /* Hero Background Lines */
        .hero-bg-lines {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1;
        }

        /* Left Paw Decor */
        .left-paw-decor {
          position: absolute;
          left: -40px;
          top: 15%;
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
          opacity: 0.22;
          color: #cf7c54;
          pointer-events: none;
          z-index: 1;
        }

        .left-paw-decor svg:nth-child(1) {
          transform: rotate(-24deg) scale(1.1);
        }
        .left-paw-decor svg:nth-child(2) {
          transform: rotate(18deg) translate(25px, 0);
        }

        /* Hero Section */
        .about-hero-section {
          position: relative;
          padding: 3.5rem 0 2rem;
          min-height: 520px;
          display: flex;
          align-items: center;
        }

        .hero-grid-content {
          display: grid;
          grid-template-columns: 1.05fr 1fr;
          gap: 3.5rem;
          align-items: center;
          width: 100%;
          position: relative;
          z-index: 3;
        }

        .hero-left-content {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .hero-eyebrow {
          font-size: 0.82rem;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: #a47d44;
          font-weight: 600;
          margin-bottom: 1.2rem;
        }

        .hero-heading {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(2.5rem, 4.2vw, 3.8rem);
          line-height: 1.15;
          color: #24211e;
          font-weight: 500;
          margin: 0 0 1.5rem 0;
        }

        .hero-heading span {
          display: block;
        }

        .hero-description {
          font-size: 1.02rem;
          line-height: 1.8;
          color: #635b53;
          max-width: 480px;
          margin: 0;
        }

        /* Hero Media */
        .hero-media-wrapper {
          display: flex;
          align-items: flex-end;
          justify-content: center;
          position: relative;
          padding-bottom: 10px;
        }

        .hero-arch-container {
          position: relative;
          z-index: 2;
        }

        .hero-arch-box {
          width: 280px;
          height: 400px;
          border-radius: 140px 140px 0 0;
          border: 1px solid rgba(207, 124, 84, 0.35);
          outline: 6px solid rgba(255, 255, 255, 0.65);
          outline-offset: 4px;
          overflow: hidden;
          background-color: #f5e9dc;
          box-shadow: 0 18px 36px -10px rgba(71, 46, 31, 0.12);
          position: relative;
        }

        .hero-arch-box img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .hero-portrait-box {
          width: 230px;
          height: 350px;
          margin-left: -35px;
          position: relative;
          z-index: 3;
          border-radius: 110px 110px 30px 30px;
          overflow: hidden;
          background: linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(245,233,220,0.85) 100%);
          border: 1px solid rgba(255, 255, 255, 0.9);
          box-shadow: 0 20px 40px -12px rgba(61, 38, 26, 0.15);
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }

        .hero-portrait-box img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: top center;
        }

        .hero-flower-accent {
          position: absolute;
          left: -16px;
          bottom: 25px;
          width: 32px;
          height: 32px;
          color: #cf7c54;
          z-index: 4;
        }

        /* Vision & Mission */
        .vision-mission-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .vision-card {
          position: relative;
          background: linear-gradient(rgba(26, 24, 23, 0.65), rgba(26, 24, 23, 0.65)),
                      url('/about-vision.jpg') center/cover no-repeat;
          background-color: #3b332f;
          border-radius: 8px;
          padding: 4rem 3rem;
          min-height: 270px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          color: #ffffff;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
        }

        .vision-card h2 {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 2.2rem;
          font-weight: 500;
          margin: 0 0 1rem 0;
          color: #ffffff;
        }

        .vision-card p {
          font-size: 1.05rem;
          line-height: 1.7;
          color: #e8e3dc;
          margin: 0;
          max-width: 440px;
        }

        .mission-card {
          background-color: #ffffff;
          border-radius: 8px;
          padding: 4rem 3.5rem;
          min-height: 270px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.03);
          border: 1px solid rgba(0, 0, 0, 0.04);
        }

        .mission-card h2 {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 2.2rem;
          font-weight: 500;
          margin: 0 0 1rem 0;
          color: #21201e;
        }

        .mission-card p {
          font-size: 1.05rem;
          line-height: 1.75;
          color: #59534c;
          margin: 0;
          max-width: 460px;
        }

        /* Brand Story */
        .brand-story-card {
          background: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.03);
          display: grid;
          grid-template-columns: 1.05fr 1fr;
          border: 1px solid rgba(0, 0, 0, 0.03);
        }

        .story-image-wrap {
          position: relative;
          min-height: 420px;
          background-color: #f1e4d8;
        }

        .story-image-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .story-content-wrap {
          padding: 4.5rem 4rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: flex-start;
        }

        .story-content-wrap h2 {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(1.9rem, 2.5vw, 2.4rem);
          line-height: 1.3;
          color: #21201e;
          font-weight: 500;
          margin: 0 0 1.5rem 0;
        }

        .story-content-wrap p {
          font-size: 0.98rem;
          line-height: 1.8;
          color: #5e574f;
          margin: 0 0 1.25rem 0;
        }

        .custom-dark-btn {
          display: inline-block;
          background-color: #262626;
          color: #ffffff;
          padding: 0.85rem 2.2rem;
          font-size: 0.85rem;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          font-weight: 500;
          text-decoration: none;
          margin-top: 1rem;
          transition: background-color 0.25s ease, transform 0.2s ease;
        }

        .custom-dark-btn:hover {
          background-color: #3d3d3d;
          transform: translateY(-1px);
        }

        /* Comfort & Experience Card */
        .comfort-card {
          background: #ffffff;
          border-radius: 8px;
          padding: 4rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.03);
          border: 1px solid rgba(0, 0, 0, 0.03);
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: center;
        }

        .comfort-left {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .comfort-eyebrow {
          font-size: 0.8rem;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #a47d44;
          font-weight: 600;
          margin-bottom: 0.85rem;
        }

        .comfort-left h2 {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(2rem, 2.8vw, 2.6rem);
          line-height: 1.25;
          color: #21201e;
          font-weight: 500;
          margin: 0 0 1.5rem 0;
        }

        .comfort-left p {
          font-size: 0.98rem;
          line-height: 1.8;
          color: #5e574f;
          margin: 0 0 1.5rem 0;
        }

        .comfort-right {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .arch-image-frame {
          width: 100%;
          max-width: 440px;
          height: 480px;
          border-radius: 220px 220px 0 0;
          overflow: hidden;
          background-color: #ecdcd0;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.06);
        }

        /* Why Choose Us Section Styles */
        .why-choose-section {
          padding: 1rem 0;
        }

        .why-choose-header {
          text-align: center;
          max-width: 680px;
          margin: 0 auto 3.5rem;
        }

        .why-eyebrow {
          font-size: 0.8rem;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: #a47d44;
          font-weight: 600;
          display: inline-block;
          margin-bottom: 0.85rem;
        }

        .why-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(2.2rem, 3.5vw, 3rem);
          line-height: 1.2;
          color: #24211e;
          font-weight: 500;
          margin: 0 0 1.25rem 0;
        }

        .why-subtitle {
          font-size: 1rem;
          line-height: 1.8;
          color: #635b53;
          margin: 0;
        }

        .why-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.75rem;
        }

        .why-card {
          background: #ffffff;
          border-radius: 8px;
          padding: 3rem 2rem 2.5rem;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.03);
          border: 1px solid rgba(0, 0, 0, 0.04);
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .why-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 16px 36px rgba(71, 46, 31, 0.08);
          border-color: rgba(207, 124, 84, 0.3);
        }

        .why-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #cf7c54, #d1a85b);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .why-card:hover::before {
          opacity: 1;
        }

        .why-icon-box {
          width: 54px;
          height: 54px;
          border-radius: 50%;
          background-color: #fdf4ef;
          color: #a47d44;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.75rem;
          border: 1px solid rgba(209, 168, 91, 0.25);
          transition: background-color 0.3s ease, color 0.3s ease;
        }

        .why-card:hover .why-icon-box {
          background-color: #24211e;
          color: #ffffff;
          border-color: #24211e;
        }

        .why-card-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 1.25rem;
          font-weight: 500;
          color: #24211e;
          margin: 0 0 1rem 0;
          line-height: 1.35;
        }

        .why-card-desc {
          font-size: 0.92rem;
          line-height: 1.7;
          color: #6a635b;
          margin: 0;
        }

        /* Responsive Breakpoints */
        @media (max-width: 1100px) {
          .why-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 2rem;
          }
        }

        @media (max-width: 1024px) {
          .hero-grid-content,
          .vision-mission-grid,
          .brand-story-card,
          .comfort-card {
            grid-template-columns: 1fr;
            gap: 2.5rem;
          }

          .hero-media-wrapper {
            margin-top: 1rem;
          }

          .comfort-card {
            padding: 2.5rem 2rem;
          }

          .story-content-wrap {
            padding: 3rem 2rem;
          }

          .arch-image-frame {
            height: 380px;
          }

          .left-paw-decor {
            display: none;
          }
        }

        @media (max-width: 640px) {
          .hero-arch-box {
            width: 200px;
            height: 300px;
          }
          .hero-portrait-box {
            width: 160px;
            height: 260px;
            margin-left: -25px;
          }
          .why-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
          .why-card {
            padding: 2.25rem 1.75rem;
          }
        }
      `}</style>

      <div className='editorial-about-page'>
        {/* Background Line Wavy Art */}
        <svg className='hero-bg-lines' viewBox='0 0 1440 600' fill='none' preserveAspectRatio='none'>
          <path
            d='M-100,240 C300,320 600,140 980,260 C1250,340 1400,220 1600,280'
            stroke='#ecdcd0'
            strokeWidth='1.8'
            strokeDasharray='5 5'
          />
          <path
            d='M-50,340 C350,420 700,240 1080,380 C1300,460 1450,360 1650,400'
            stroke='#f0e1d5'
            strokeWidth='1.5'
          />
        </svg>

        {/* Decorative Paw Accents */}
        <div className='left-paw-decor' aria-hidden='true'>
          <svg width='56' height='56' viewBox='0 0 24 24' fill='currentColor'>
            <path d='M12 13.5c-1.8 0-3.5 1.2-3.5 3.2 0 1.6 1.3 2.8 3.5 2.8s3.5-1.2 3.5-2.8c0-2-1.7-3.2-3.5-3.2zm-4.7-2.3c1 0 1.8-.9 1.8-2s-.8-2-1.8-2-1.8.9-1.8 2 .8 2 1.8 2zm9.4 0c1 0 1.8-.9 1.8-2s-.8-2-1.8-2-1.8.9-1.8 2 .8 2 1.8 2zm-6.7-2.7c1 0 1.8-.9 1.8-2s-.8-2-1.8-2-1.8.9-1.8 2 .8 2 1.8 2zm4 0c1 0 1.8-.9 1.8-2s-.8-2-1.8-2-1.8.9-1.8 2 .8 2 1.8 2z' />
          </svg>
          <svg width='44' height='44' viewBox='0 0 24 24' fill='currentColor'>
            <path d='M12 13.5c-1.8 0-3.5 1.2-3.5 3.2 0 1.6 1.3 2.8 3.5 2.8s3.5-1.2 3.5-2.8c0-2-1.7-3.2-3.5-3.2zm-4.7-2.3c1 0 1.8-.9 1.8-2s-.8-2-1.8-2-1.8.9-1.8 2 .8 2 1.8 2zm9.4 0c1 0 1.8-.9 1.8-2s-.8-2-1.8-2-1.8.9-1.8 2 .8 2 1.8 2zm-6.7-2.7c1 0 1.8-.9 1.8-2s-.8-2-1.8-2-1.8.9-1.8 2 .8 2 1.8 2zm4 0c1 0 1.8-.9 1.8-2s-.8-2-1.8-2-1.8.9-1.8 2 .8 2 1.8 2z' />
          </svg>
        </div>

        <div className='about-inner-container'>

          {/* HERO SECTION */}
          <section className='about-hero-section'>
            <div className='hero-grid-content'>
              <div className='hero-left-content'>
                <span className='hero-eyebrow'>About Us</span>
                <h1 className='hero-heading'>
                  TimmyTails <span>Where Care Blooms</span>
                </h1>
                <p className='hero-description'>
                  Experience expert care and tranquil surroundings at our dedicated pet sanctuary in Baliuag, Bulacan, offering gentle, modern, and personalized pet grooming services.
                </p>
              </div>

              <div className='hero-media-wrapper'>
                <div className='hero-arch-container'>
                  <div className='hero-arch-box'>
                    <img
                      src='/pome-before.jpg'
                      alt='TimmyTails Sanctuary - Pomeranian Before'
                      className='w-full h-full object-cover'
                    />
                    <span style={{
                      position: 'absolute',
                      top: '1rem',
                      left: '1rem',
                      backgroundColor: 'rgba(23, 21, 19, 0.8)',
                      backdropFilter: 'blur(4px)',
                      color: '#d1a85b',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                      padding: '0.35rem 0.8rem',
                      borderRadius: '999px',
                      border: '1px solid rgba(209, 168, 91, 0.3)',
                      zIndex: 3
                    }}>Before</span>
                  </div>

                  <svg className='hero-flower-accent' viewBox='0 0 24 24' fill='currentColor'>
                    <path d='M12 2a3 3 0 0 0-3 3 3 3 0 0 0 .5 1.6A3 3 0 0 0 6 6a3 3 0 0 0-3 3 3 3 0 0 0 1.6.5A3 3 0 0 0 4 12a3 3 0 0 0 3 3 3 3 0 0 0-.5 1.6A3 3 0 0 0 8 18a3 3 0 0 0 3 3 3 3 0 0 0 .5-1.6A3 3 0 0 0 12 20a3 3 0 0 0 3-3 3 3 0 0 0-.5-1.6A3 3 0 0 0 18 14a3 3 0 0 0 3-3 3 3 0 0 0-1.6-.5A3 3 0 0 0 20 8a3 3 0 0 0-3-3 3 3 0 0 0-.5 1.6A3 3 0 0 0 15 6a3 3 0 0 0-3-4zm0 8a2 2 0 1 1 0 4 2 2 0 0 1 0-4z'/>
                  </svg>
                </div>

                <div className='hero-portrait-box'>
                  <img
                    src='/pome-after.jpg'
                    alt='Pet Stylist & Companion - Pomeranian After'
                    className='w-full h-full object-cover'
                  />
                  <span style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    backgroundColor: '#d1a85b',
                    color: '#171513',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    padding: '0.35rem 0.8rem',
                    borderRadius: '999px',
                    zIndex: 3
                  }}>After</span>
                </div>
              </div>
            </div>
          </section>

          {/* VISION & MISSION */}
          <section className='vision-mission-grid'>
            <div className='vision-card'>
              <h2>Our Vision</h2>
              <p>
                To become the leading name in compassionate pet care, recognized for our stress-free environment, gentle styling excellence, and commitment to the overall wellness of every companion.
              </p>
            </div>

            <div className='mission-card'>
              <h2>Our mission</h2>
              <p>
                To provide premium, gentle grooming and spa services in a safe, welcoming sanctuary — ensuring every pet feels calm, refreshed, and cherished.
              </p>
            </div>
          </section>

          {/* BRAND STORY */}
          <section className='brand-story-card'>
            <div className='story-image-wrap'>
              <img
                src='/services/full-grooming.jpg'
                alt='TimmyTails Grooming Experience'
                className='w-full h-full object-cover'
              />
            </div>

            <div className='story-content-wrap'>
              <h2>About TimmyTails Pet Sanctuary</h2>
              <p>
                At TimmyTails, we believe pet grooming is more than just a routine bath—it is a personal journey of care, comfort, and bonding.
              </p>
              <p>
                Built upon patience and certified handling techniques, we trade noisy, crowded cages for dedicated one-on-one attention. Every trim, wash, and spa treatment is designed around your companion’s pace and emotional well-being.
              </p>
              <Link to='/contact' className='custom-dark-btn'>
                Contact Us
              </Link>
            </div>
          </section>

          {/* COMFORT & EXPERIENCE */}
          <section className='comfort-card'>
            <div className='comfort-left'>
              <span className='comfort-eyebrow'>Gentle · Hygienic · Professional</span>
              <h2>Experience Care &amp; Comfort for Your Pets</h2>
              <p>
                Located in Tangos, Baliuag City, our pet sanctuary is intentionally styled to be hygienic, serene, and relaxing. We offer specialized breed styling, soothing therapeutic baths, paw treatments, and gentle de-shedding—all performed by loving stylists using trusted, non-irritant products.
              </p>
              <Link to='/contact' className='custom-dark-btn'>
                Contact Us
              </Link>
            </div>

            <div className='comfort-right'>
              <div className='arch-image-frame'>
                <img
                  src='/sanctuary-session.jpg'
                  alt='Sanctuary & Comfort Arch'
                  className='w-full h-full object-cover'
                />
              </div>
            </div>
          </section>

          {/* WHY CHOOSE US (Built-in) */}
          <div id='why-choose-us'>
            <WhyChooseUs />
          </div>

          {/* FAQ */}
          <div id='faq'>
            <Faq />
          </div>

        </div>
      </div>
    </>
  )
}