import { createElement } from 'react'
import { Link } from 'react-router-dom'
import {
  Bath,
  HeartHandshake,
  PawPrint,
  Scissors,
  Sparkles,
  Phone,
  ShieldCheck,
  Clock,
  ArrowUpRight,
  Check
} from 'lucide-react'

import ImagePlaceholder from '../components/editorial/ImagePlaceholder'
import BookButton from '../components/editorial/BookButton'
import { Botanical } from '../components/editorial/Decorations'
import { PlaceholderCopy } from '../components/editorial/Sections'
import { services } from '../data/services'

const features = [
  [Scissors, 'Expert Grooming'],
  [PawPrint, 'Custom Styling'],
  [Sparkles, 'Coat Care'],
  [HeartHandshake, 'Gentle Handling'],
  [Bath, 'Bath & Tidy']
]

const whyChooseItems = [
  {
    icon: <HeartHandshake size={22} />,
    title: 'Gentle, Low-Stress Handling',
    desc: 'We prioritize patience over speed. Every session is adapted to your pet’s unique temperament, ensuring a calm, fear-free grooming visit.'
  },
  {
    icon: <Sparkles size={22} />,
    title: 'Hypoallergenic Spa Products',
    desc: 'We strictly use premium, natural, and low-sensitivity botanical shampoos and conditioners that nourish delicate coats and sensitive skin.'
  },
  {
    icon: <ShieldCheck size={22} />,
    title: 'Cage-Free & Hygienic Haven',
    desc: 'No cramped metal cages or noisy chaos. Our sanctuary maintains strict sanitation protocols with peaceful, dedicated spaces for each companion.'
  },
  {
    icon: <Scissors size={22} />,
    title: 'Precision Breed Styling',
    desc: 'From customized teddy cuts to show-standard outlines, our trained stylists consult with you to deliver the exact silhouette you envision.'
  }
]

const steps = [
  {
    num: '01',
    title: 'Choose a pet',
    desc: 'Select your registered companion or add their profile with coat condition, temperament, and health notes saved.'
  },
  {
    num: '02',
    title: 'Pick the care',
    desc: 'Choose from routine bath rituals, soothing de-shedding spa treatments, or complete breed-standard styling.'
  },
  {
    num: '03',
    title: 'Set the look',
    desc: 'Choose a haircut reference and, for eligible services, preview the selected style using a current photo of your pet.'
  },
  {
    num: '04',
    title: 'Manage the visit',
    desc: 'Confirm your reserved private slot with transparent schedule tracking and zero crowded salon waiting.'
  }
]

// Sample items para sa Marquee Gallery
const galleryItems = [
  { id: 1, title: 'Asian Fusion Cut', subtitle: 'Poodle Silhouette', image: '/gallery/poodle-silhouette.jpg' },
  { id: 2, title: 'Botanical Bath Glow', subtitle: 'Deep Coat Conditioning', image: '/gallery/botanical-bath-glow.jpg' },
  { id: 3, title: 'Teddy Bear Finish', subtitle: 'Bichon Frise', image: '/gallery/teddy-bear-bichon.jpg' },
  { id: 4, title: 'Gentle De-shedding', subtitle: 'Golden Retriever', image: '/gallery/golden-retriever-deshedding.jpg' },
  { id: 5, title: 'Show Outline Trim', subtitle: 'Pomeranian', image: '/gallery/pomeranian-show-trim.jpg' },
  { id: 6, title: 'Calm Sanctuary Groom', subtitle: 'Persian Cat Ritual', image: '/gallery/persian-cat-ritual.jpg' }
]

export default function Home() {
  return (
    <div className='editorial-page'>
      <style>{`
        /* ======================================================
           BLOOM HERO STYLES
        ====================================================== */
        .bloom-hero-section {
          position: relative;
          background: #fdf4ef;
          min-height: calc(100vh - 88px);
          overflow: hidden;
          padding: 0;
          font-family: Georgia, 'Times New Roman', serif;
        }

        .bloom-hero-section::before {
          content: '';
          position: absolute;
          left: 0;
          top: 68px;
          width: max(0px, calc((100vw - 1320px) / 2));
          height: 1px;
          background: rgba(210, 143, 119, 0.56);
          z-index: 1;
        }

        .bloom-hero-wrapper {
          width: calc(100% - 48px);
          max-width: 1320px;
          min-height: 745px;
          margin: 0 auto;
          position: relative;
          z-index: 2;
        }

        .bloom-hero-guide {
          position: absolute;
          left: 0;
          top: 0;
          width: 1px;
          height: 100%;
          background: rgba(210, 143, 119, 0.62);
          pointer-events: none;
          z-index: 0;
        }

        .bloom-middle-rule {
          position: absolute;
          left: 522px;
          top: 174px;
          width: 295px;
          height: 1px;
          background: rgba(210, 143, 119, 0.67);
          pointer-events: none;
          z-index: 0;
        }

        .bloom-hero-copy {
          position: absolute;
          left: 6px;
          top: 34px;
          width: 505px;
          z-index: 5;
        }

        .bloom-title {
          margin: 0;
          max-width: 500px;
          font-family: var(--font-serif, 'Playfair Display', Georgia, 'Times New Roman', serif);
          font-size: 42px;
          font-weight: 600;
          line-height: 1.06;
          letter-spacing: -0.025em;
          color: #17252d;
        }

        .bloom-description {
          width: 495px;
          margin-top: 24px;
          color: #222020;
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 17px;
          line-height: 1.42;
        }

        .bloom-button-group {
          display: flex;
          align-items: stretch;
          gap: 22px;
          margin-top: 43px;
        }

        .bloom-btn-dark {
          min-width: 130px;
          height: 52px;
          padding: 0 28px;
          background: #2a2929;
          color: #ffffff !important;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          text-transform: uppercase;
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.01em;
          border: none;
          border-radius: 0;
          transition: background-color 0.2s ease, transform 0.2s ease;
        }

        .bloom-btn-dark:hover {
          background: #171717;
          transform: translateY(-1px);
        }

        .bloom-btn-gold {
          min-width: 180px;
          height: 52px;
          padding: 0 26px;
          background: linear-gradient(105deg, #caa63f 0%, #f2d875 48%, #e1bd55 100%);
          color: #151515 !important;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 11px;
          text-decoration: none;
          text-transform: uppercase;
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.01em;
          border: 1px solid rgba(169, 127, 33, 0.25);
          border-radius: 0;
          transition: filter 0.2s ease, transform 0.2s ease;
        }

        .bloom-btn-gold:hover {
          filter: brightness(1.04);
          transform: translateY(-1px);
        }

        .bloom-stats {
          display: flex;
          gap: 72px;
          margin-top: 49px;
          position: relative;
          z-index: 4;
        }

        .bloom-stat-item {
          min-width: 90px;
        }

        .bloom-stat-item strong {
          display: block;
          margin: 0;
          font-family: var(--font-serif, 'Playfair Display', Georgia, serif);
          font-size: 27px;
          font-weight: 500;
          line-height: 1;
          color: #171717;
        }

        .bloom-stat-item span {
          display: block;
          margin-top: 10px;
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 15px;
          line-height: 1.2;
          color: #383333;
        }

        .bloom-arch-container {
          position: absolute;
          left: 405px;
          top: 355px;
          width: 340px;
          height: 390px;
          overflow: hidden;
          border-radius: 170px 170px 0 0;
          background: linear-gradient(180deg, #e5d7ca 0%, #eee4dc 47%, #f7f0eb 100%);
          border: 1px solid rgba(215, 153, 129, 0.55);
          z-index: 6;
        }

        .bloom-arch-container > * {
          width: 100%;
          height: 100%;
          object-fit: cover;
          background: transparent !important;
          border: none !important;
        }

        .bloom-arch-container::after {
          content: '';
          position: absolute;
          left: 15px;
          right: 15px;
          top: 15px;
          bottom: 0;
          border: 1px solid rgba(191, 159, 145, 0.34);
          border-bottom: none;
          border-radius: 155px 155px 0 0;
          pointer-events: none;
          z-index: 10;
        }

        .bloom-visual-col {
          position: absolute;
          left: 805px;
          top: 128px;
          width: 650px;
          height: 650px;
          z-index: 3;
        }

        .bloom-visual-composition {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .bloom-main-circle {
          position: absolute;
          inset: 0;
          width: 650px;
          height: 650px;
          border-radius: 50%;
          background: #f3c9bd;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .bloom-main-circle::before {
          content: '';
          position: absolute;
          inset: -21px;
          border-radius: 50%;
          border: 1px solid rgba(215, 153, 129, 0.46);
          pointer-events: none;
          z-index: 5;
        }

        .bloom-main-circle > * {
          width: 100%;
          height: 100%;
          object-fit: cover;
          background: transparent !important;
          border: none !important;
        }

        .bloom-corner-leaf {
          position: absolute;
          left: -62px;
          bottom: 23px;
          width: 270px;
          opacity: 0.41;
          pointer-events: none;
          z-index: 1;
        }

        .bloom-circle-botanical {
          position: absolute;
          width: 390px;
          right: -112px;
          bottom: -28px;
          opacity: 0.82;
          color: rgba(255, 255, 255, 0.92);
          pointer-events: none;
          z-index: 10;
        }

        /* ======================================================
           FEATURE STRIP MICRO-ANIMATIONS (NON-INTRUSIVE)
        ====================================================== */
        .feature-anim-item {
          cursor: pointer;
        }

        .feature-icon-wrap {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .feature-svg {
          transition: transform 0.25s ease;
        }

        /* 1. SCISSORS CUTTING ACTION */
        .feature-anim-item:hover .anim-scissors {
          animation: scissorSnip 0.45s ease-in-out infinite alternate;
          transform-origin: 38% 62%;
        }

        @keyframes scissorSnip {
          0% { transform: rotate(0deg); }
          50% { transform: rotate(-24deg) scale(1.05); }
          100% { transform: rotate(10deg) scale(0.96); }
        }

        /* 2. CUSTOM STYLING FLOATING PAWS */
        .paw-particle {
          position: absolute;
          opacity: 0;
          color: currentColor;
          pointer-events: none;
        }

        .paw-p1 {
          right: -6px;
          top: 6px;
        }

        .paw-p2 {
          left: -6px;
          top: 0px;
        }

        .feature-anim-item:hover .paw-p1 {
          animation: pawFloat 0.85s ease-out infinite;
        }

        .feature-anim-item:hover .paw-p2 {
          animation: pawFloat 0.85s ease-out 0.4s infinite;
        }

        @keyframes pawFloat {
          0% { opacity: 0; transform: translateY(4px) scale(0.5); }
          40% { opacity: 0.85; }
          100% { opacity: 0; transform: translateY(-16px) scale(0.85); }
        }

        /* 3. COAT CARE TWINKLE STARS */
        .feature-anim-item:hover .anim-sparkles {
          animation: sparkleTwinkle 0.8s ease-in-out infinite alternate;
        }

        @keyframes sparkleTwinkle {
          0% { transform: scale(1) rotate(0deg); }
          100% { transform: scale(1.14) rotate(14deg); }
        }

        .star-particle {
          position: absolute;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #d1a85b;
          opacity: 0;
          pointer-events: none;
        }

        .star-s1 { top: 4px; right: 4px; }
        .star-s2 { bottom: 6px; left: 4px; }

        .feature-anim-item:hover .star-s1 {
          animation: starPop 0.8s ease-in-out infinite;
        }

        .feature-anim-item:hover .star-s2 {
          animation: starPop 0.8s ease-in-out 0.4s infinite;
        }

        @keyframes starPop {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1.4); box-shadow: 0 0 6px #d1a85b; }
        }

        /* 4. GENTLE HANDLING SHAKE HANDS & HEART */
        .feature-anim-item:hover .anim-handshake {
          animation: handshakeShake 0.65s ease-in-out infinite;
          transform-origin: center bottom;
        }

        @keyframes handshakeShake {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-3px) rotate(-4deg); }
          50% { transform: translateY(3px) rotate(3deg); }
          75% { transform: translateY(-2px) rotate(-2deg); }
        }

        .heart-particle {
          position: absolute;
          top: -6px;
          right: 2px;
          font-size: 13px;
          color: #cf7c54;
          opacity: 0;
          pointer-events: none;
        }

        .feature-anim-item:hover .heart-particle {
          animation: heartAscend 0.9s ease-out infinite;
        }

        @keyframes heartAscend {
          0% { opacity: 0; transform: translateY(4px) scale(0.6); }
          40% { opacity: 0.9; transform: translateY(-6px) scale(1.1); }
          100% { opacity: 0; transform: translateY(-16px) scale(0.7); }
        }

        /* 5. BATH & TIDY ACTIVE SHOWER STREAM */
        .shower-stream {
          position: absolute;
          top: 8px;
          left: 17px;
          display: flex;
          gap: 2.5px;
          pointer-events: none;
        }

        .shower-drop {
          width: 1.5px;
          height: 6px;
          background: #739ebb;
          border-radius: 999px;
          opacity: 0;
        }

        .feature-anim-item:hover .drop-1 {
          animation: waterDrop 0.5s linear infinite;
        }

        .feature-anim-item:hover .drop-2 {
          animation: waterDrop 0.5s linear 0.16s infinite;
        }

        .feature-anim-item:hover .drop-3 {
          animation: waterDrop 0.5s linear 0.32s infinite;
        }

        @keyframes waterDrop {
          0% { opacity: 0; transform: translateY(-2px); }
          30% { opacity: 0.9; }
          100% { opacity: 0; transform: translateY(14px); }
        }

        /* ======================================================
           ABOUT US: "WHERE CARE BLOOMS"
        ====================================================== */
        .home-about-bloom {
          position: relative;
          background-color: #fdf4ef;
          padding: 6rem 2rem;
          overflow: hidden;
        }

        .home-about-bg-lines {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1;
        }

        .home-about-container {
          max-width: 1280px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1.05fr 1fr;
          gap: 4rem;
          align-items: center;
          position: relative;
          z-index: 2;
        }

        .home-about-text {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .home-about-eyebrow {
          font-size: 0.82rem;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: #a47d44;
          font-weight: 600;
          margin-bottom: 1.25rem;
        }

        .home-about-heading {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(2.6rem, 4vw, 3.8rem);
          line-height: 1.15;
          color: #24211e;
          font-weight: 500;
          margin: 0 0 1.5rem 0;
        }

        .home-about-heading span {
          display: block;
        }

        .home-about-desc {
          font-size: 1.02rem;
          line-height: 1.8;
          color: #635b53;
          max-width: 490px;
          margin: 0 0 2rem 0;
        }

        .home-about-btn {
          display: inline-block;
          background-color: #262626;
          color: #ffffff !important;
          padding: 0.9rem 2.4rem;
          font-size: 0.85rem;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          font-weight: 500;
          text-decoration: none;
          transition: background-color 0.25s ease, transform 0.2s ease;
        }

        .home-about-btn:hover {
          background-color: #3d3d3d;
          transform: translateY(-1px);
        }

        .home-about-media {
          display: flex;
          align-items: flex-end;
          justify-content: center;
          position: relative;
        }

        .home-arch-main {
          width: 300px;
          height: 420px;
          border-radius: 150px 150px 0 0;
          border: 1px solid rgba(207, 124, 84, 0.35);
          outline: 6px solid rgba(255, 255, 255, 0.65);
          outline-offset: 4px;
          overflow: hidden;
          background-color: #f5e9dc;
          box-shadow: 0 18px 36px -10px rgba(71, 46, 31, 0.12);
          position: relative;
          z-index: 2;
        }

        .home-arch-main img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .home-arch-accent {
          width: 250px;
          height: 360px;
          margin-left: -45px;
          border-radius: 125px 125px 30px 30px;
          overflow: hidden;
          background: linear-gradient(180deg, rgba(255,255,255,0.75) 0%, rgba(245,233,220,0.85) 100%);
          border: 1px solid rgba(255, 255, 255, 0.9);
          box-shadow: 0 20px 40px -12px rgba(61, 38, 26, 0.15);
          position: relative;
          z-index: 3;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }

        .home-arch-accent img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: top center;
        }

        .home-flower-icon {
          position: absolute;
          left: -16px;
          bottom: 25px;
          width: 32px;
          height: 32px;
          color: #cf7c54;
          z-index: 4;
        }

        /* ======================================================
           WHY CHOOSE US: 4 FLOATING PILLARS
        ====================================================== */
        .home-why-section {
          background-color: #fdf4ef;
          padding: 6rem 2rem;
          position: relative;
        }

        .home-why-container {
          max-width: 1280px;
          margin: 0 auto;
          position: relative;
          z-index: 2;
        }

        .home-why-header {
          text-align: center;
          max-width: 700px;
          margin: 0 auto 4rem;
        }

        .home-why-eyebrow {
          font-size: 0.8rem;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: #a47d44;
          font-weight: 600;
          display: inline-block;
          margin-bottom: 0.85rem;
        }

        .home-why-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(2.3rem, 3.5vw, 3.1rem);
          line-height: 1.2;
          color: #24211e;
          font-weight: 500;
          margin: 0 0 1.25rem 0;
        }

        .home-why-subtitle {
          font-size: 1rem;
          line-height: 1.8;
          color: #635b53;
          margin: 0;
        }

        .home-why-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.75rem;
        }

        .home-why-card {
          background: #ffffff;
          border-radius: 12px;
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

        .home-why-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 16px 36px rgba(71, 46, 31, 0.08);
          border-color: rgba(207, 124, 84, 0.3);
        }

        .home-why-card::before {
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

        .home-why-card:hover::before {
          opacity: 1;
        }

        .home-why-icon {
          width: 52px;
          height: 52px;
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

        .home-why-card:hover .home-why-icon {
          background-color: #24211e;
          color: #ffffff;
          border-color: #24211e;
        }

        .home-why-card-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 1.25rem;
          font-weight: 500;
          color: #24211e;
          margin: 0 0 1rem 0;
          line-height: 1.35;
        }

        .home-why-card-desc {
          font-size: 0.92rem;
          line-height: 1.7;
          color: #6a635b;
          margin: 0;
        }

        /* ======================================================
           REFINED LUXURY SERVICES SECTION
        ====================================================== */
        .home-services-luxury {
          background-color: #1e1c1a;
          color: #f7f1ea;
          padding: 7rem 2rem;
          position: relative;
          overflow: hidden;
        }

        .services-backdrop-botanical {
          position: absolute;
          width: 380px;
          opacity: 0.08;
          color: #ffffff;
          pointer-events: none;
        }
        .services-botanical-left {
          left: -100px;
          top: 10%;
          transform: rotate(35deg);
        }
        .services-botanical-right {
          right: -100px;
          bottom: 5%;
          transform: scaleX(-1) rotate(15deg);
        }

        .home-services-container {
          max-width: 1280px;
          margin: 0 auto;
          position: relative;
          z-index: 2;
        }

        .home-services-header {
          text-align: center;
          max-width: 720px;
          margin: 0 auto 4.5rem;
        }

        .services-gold-eyebrow {
          font-size: 0.82rem;
          letter-spacing: 3.5px;
          text-transform: uppercase;
          color: #d1a85b;
          font-weight: 600;
          display: inline-block;
          margin-bottom: 0.85rem;
        }

        .services-luxury-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(2.4rem, 4vw, 3.4rem);
          line-height: 1.15;
          color: #ffffff;
          font-weight: 500;
          margin: 0 0 1.25rem 0;
        }

        .services-luxury-subtitle {
          font-size: 1rem;
          line-height: 1.8;
          color: #b0a79d;
          margin: 0;
        }

        .services-luxury-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2.25rem;
          margin-bottom: 4rem;
        }

        .service-luxury-card {
          background: #272422;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: transform 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease;
          position: relative;
        }

        .service-luxury-card:hover {
          transform: translateY(-8px);
          border-color: rgba(209, 168, 91, 0.45);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
        }

        .service-image-window {
          position: relative;
          padding: 1.5rem 1.5rem 0;
          background: linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(0,0,0,0.15) 100%);
        }

        .service-arch-visual {
          display: block;
          width: 100%;
          height: 260px;
          border-radius: 130px 130px 8px 8px;
          overflow: hidden;
          background-color: #383431;
          border: 1px solid rgba(209, 168, 91, 0.2);
          position: relative;
        }

        .service-arch-visual img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          transition: transform 0.5s ease;
        }

        .service-luxury-card:hover .service-arch-visual img {
          transform: scale(1.05);
        }

        .service-tag-badge {
          position: absolute;
          top: 2rem;
          left: 2rem;
          background: rgba(30, 28, 26, 0.85);
          backdrop-filter: blur(4px);
          color: #d1a85b;
          border: 1px solid rgba(209, 168, 91, 0.3);
          font-size: 0.72rem;
          letter-spacing: 1px;
          text-transform: uppercase;
          font-weight: 600;
          padding: 0.35rem 0.8rem;
          border-radius: 999px;
          z-index: 3;
        }

        .service-ai-badge {
          position: absolute;
          top: 2rem;
          right: 2rem;
          background: linear-gradient(135deg, rgba(209, 168, 91, 0.9), rgba(164, 125, 68, 0.95));
          color: #171513;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 0.35rem 0.75rem;
          border-radius: 999px;
          display: flex;
          align-items: center;
          gap: 4px;
          z-index: 3;
        }

        .service-card-body {
          padding: 1.75rem;
          display: flex;
          flex-direction: column;
          flex-grow: 1;
        }

        .service-card-heading {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 1.4rem;
          font-weight: 500;
          color: #ffffff;
          margin: 0 0 0.5rem 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .service-card-heading a {
          color: #ffffff;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .service-card-heading a:hover {
          color: #d1a85b;
        }

        .service-meta-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          color: #9c9388;
          font-size: 0.85rem;
          margin-bottom: 1.5rem;
        }

        .service-meta-row span {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .service-card-footer {
          margin-top: auto;
          padding-top: 1.25rem;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .service-price-block {
          display: flex;
          flex-direction: column;
        }

        .service-price-label {
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #8c8378;
        }

        .service-price-value {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 1.35rem;
          font-weight: 600;
          color: #d1a85b;
          margin: 0;
        }

        .service-action-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #36322e;
          color: #ffffff;
          text-decoration: none;
          padding: 0.65rem 1.2rem;
          font-size: 0.82rem;
          font-weight: 500;
          letter-spacing: 0.5px;
          border-radius: 4px;
          transition: background-color 0.2s ease, transform 0.2s ease;
        }

        .service-action-link:hover {
          background-color: #d1a85b;
          color: #171513;
          transform: translateY(-2px);
        }

        .services-center-footer {
          text-align: center;
          margin-top: 1rem;
        }

        .services-view-all-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          color: #d1a85b;
          border: 1px solid #d1a85b;
          padding: 0.95rem 2.8rem;
          font-size: 0.85rem;
          letter-spacing: 2px;
          text-transform: uppercase;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.3s ease;
        }

        .services-view-all-btn:hover {
          background: #d1a85b;
          color: #171513;
        }

        /* ======================================================
           PROFESSIONAL BENEFITS SHOWCASE
        ====================================================== */
        .home-benefits-section {
          padding: 6rem 2rem;
          background-color: #fdf4ef;
        }

        .home-benefits-card {
          max-width: 1280px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid rgba(210, 143, 119, 0.22);
          box-shadow: 0 16px 40px rgba(50, 32, 22, 0.04);
          display: grid;
          grid-template-columns: 1.15fr 1fr;
          gap: 4.5rem;
          align-items: center;
          padding: 4.5rem;
          box-sizing: border-box;
        }

        .benefits-left-content {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .benefits-eyebrow {
          font-size: 0.82rem;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: #a47d44;
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .benefits-heading {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(2.3rem, 3.4vw, 3.1rem);
          line-height: 1.2;
          color: #24211e;
          font-weight: 500;
          margin: 0 0 1.25rem 0;
        }

        .benefits-description {
          font-size: 1.02rem;
          line-height: 1.8;
          color: #635b53;
          margin: 0 0 2rem 0;
        }

        .benefits-checklist {
          list-style: none;
          padding: 0;
          margin: 0 0 2.5rem 0;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          width: 100%;
        }

        .benefits-checklist li {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 0.95rem;
          color: #3b3631;
        }

        .benefits-check-icon {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #fdf4ef;
          color: #a47d44;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border: 1px solid rgba(164, 125, 68, 0.35);
        }

        .benefits-right-visual {
          position: relative;
          display: flex;
          justify-content: center;
        }

        .benefits-arch-frame {
          width: 100%;
          max-width: 440px;
          height: 480px;
          border-radius: 220px 220px 10px 10px;
          overflow: hidden;
          background: #f7ebe1;
          border: 1px solid rgba(210, 143, 119, 0.35);
          outline: 6px solid #ffffff;
          outline-offset: -3px;
          box-shadow: 0 20px 45px rgba(50, 30, 20, 0.08);
          position: relative;
        }

        .benefits-arch-frame img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* ======================================================
           BOOKING STEPS (YOUR VISIT)
        ====================================================== */
        .home-steps-section {
          padding: 6rem 2rem 7rem;
          background-color: #fdf4ef;
          position: relative;
        }

        .steps-container {
          max-width: 1280px;
          margin: 0 auto;
        }

        .steps-header {
          text-align: center;
          max-width: 680px;
          margin: 0 auto 4.5rem;
        }

        .steps-eyebrow {
          font-size: 0.8rem;
          letter-spacing: 3.5px;
          text-transform: uppercase;
          color: #a47d44;
          font-weight: 600;
          display: inline-block;
          margin-bottom: 0.85rem;
        }

        .steps-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(2.3rem, 3.5vw, 3.1rem);
          line-height: 1.2;
          color: #24211e;
          font-weight: 500;
          margin: 0 0 1rem 0;
        }

        .steps-subtitle {
          font-size: 0.98rem;
          line-height: 1.75;
          color: #635b53;
          margin: 0;
        }

        .steps-cards-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.75rem;
          margin-bottom: 4.5rem;
        }

        .step-editorial-card {
          background: #ffffff;
          border-radius: 10px;
          padding: 3rem 2rem 2.25rem;
          border: 1px solid rgba(210, 143, 119, 0.22);
          box-shadow: 0 8px 24px rgba(40, 26, 18, 0.03);
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          position: relative;
          transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
        }

        .step-editorial-card:hover {
          transform: translateY(-6px);
          border-color: rgba(207, 124, 84, 0.4);
          box-shadow: 0 16px 36px rgba(40, 26, 18, 0.07);
        }

        .step-editorial-card::before {
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

        .step-editorial-card:hover::before {
          opacity: 1;
        }

        .step-number-tag {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 2.2rem;
          font-weight: 500;
          color: #d1a85b;
          line-height: 1;
          margin-bottom: 1.5rem;
        }

        .step-card-heading {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 1.3rem;
          font-weight: 500;
          color: #24211e;
          margin: 0 0 0.85rem 0;
          line-height: 1.3;
        }

        .step-card-description {
          font-size: 0.92rem;
          line-height: 1.7;
          color: #6a635b;
          margin: 0;
        }

        .steps-center-action {
          display: flex;
          justify-content: center;
        }

        /* ======================================================
           EDITORIAL MARQUEE GALLERY WITH ARCHITECTURAL ACCENTS
        ====================================================== */
        .editorial-marquee-section {
          background-color: #fdf4ef;
          padding: 7rem 0 8rem;
          position: relative;
          overflow: hidden;
        }

        .marquee-grid-line-top {
          position: absolute;
          top: 72px;
          left: 0;
          right: 0;
          height: 1px;
          background: rgba(210, 143, 119, 0.45);
          z-index: 1;
          pointer-events: none;
        }

        .marquee-grid-line-bottom {
          position: absolute;
          bottom: 60px;
          left: 0;
          right: 0;
          height: 1px;
          background: rgba(210, 143, 119, 0.35);
          z-index: 1;
          pointer-events: none;
        }

        .marquee-botanical-bottom-left {
          position: absolute;
          left: -40px;
          bottom: -20px;
          width: 320px;
          opacity: 0.38;
          color: #cf7c54;
          pointer-events: none;
          z-index: 1;
          transform: rotate(-10deg);
        }

        .marquee-botanical-top-right {
          position: absolute;
          right: -50px;
          top: 15px;
          width: 260px;
          opacity: 0.28;
          color: #cf7c54;
          pointer-events: none;
          z-index: 1;
          transform: scaleX(-1) rotate(25deg);
        }

        .editorial-marquee-header-wrapper {
          max-width: 1280px;
          margin: 0 auto 3.5rem;
          padding: 0 2rem;
          position: relative;
          z-index: 2;
        }

        .editorial-marquee-header {
          position: relative;
          max-width: 720px;
          margin: 0 auto;
          text-align: center;
          padding: 2.2rem 2.5rem;
          border-left: 1px solid rgba(210, 143, 119, 0.55);
          border-right: 1px solid rgba(210, 143, 119, 0.55);
        }

        .editorial-marquee-header::before,
        .editorial-marquee-header::after {
          content: '+';
          position: absolute;
          font-family: Georgia, serif;
          font-size: 14px;
          color: rgba(207, 124, 84, 0.7);
          line-height: 1;
        }
        .editorial-marquee-header::before {
          top: -8px;
          left: -5px;
        }
        .editorial-marquee-header::after {
          top: -8px;
          right: -5px;
        }

        .editorial-marquee-eyebrow {
          font-size: 0.8rem;
          letter-spacing: 3.5px;
          text-transform: uppercase;
          color: #a47d44;
          font-weight: 600;
          display: inline-block;
          margin-bottom: 0.75rem;
        }

        .editorial-marquee-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(2.3rem, 3.5vw, 3.2rem);
          line-height: 1.18;
          color: #24211e;
          font-weight: 500;
          margin: 0 0 1rem 0;
        }

        .editorial-marquee-subtext {
          margin: 0 auto;
          max-width: 520px;
          color: #635b53;
          font-size: 0.98rem;
          line-height: 1.75;
        }

        .marquee-viewport {
          position: relative;
          width: 100%;
          overflow: hidden;
          padding: 1.5rem 0;
          z-index: 2;
          mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
        }

        .marquee-track {
          display: flex;
          gap: 2.25rem;
          width: max-content;
          animation: marqueeScroll 36s linear infinite;
        }

        .marquee-track:hover {
          animation-play-state: paused;
        }

        @keyframes marqueeScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .marquee-card {
          flex: 0 0 280px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          transition: transform 0.35s ease;
        }

        .marquee-card:hover {
          transform: translateY(-5px);
        }

        .marquee-arch-frame {
          width: 280px;
          height: 380px;
          border-radius: 140px 140px 8px 8px;
          overflow: hidden;
          position: relative;
          background-color: #f5e9dc;
          border: 1px solid rgba(210, 143, 119, 0.45);
          box-shadow: 0 12px 30px rgba(61, 38, 26, 0.05);
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }

        .marquee-arch-frame::after {
          content: '';
          position: absolute;
          inset: 10px;
          border-radius: 130px 130px 4px 4px;
          border: 1px solid rgba(210, 143, 119, 0.28);
          pointer-events: none;
        }

        .marquee-card:hover .marquee-arch-frame {
          border-color: rgba(207, 124, 84, 0.7);
          box-shadow: 0 18px 40px rgba(61, 38, 26, 0.12);
        }

        .marquee-arch-frame > * {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s ease;
        }

        .marquee-card:hover .marquee-arch-frame > * {
          transform: scale(1.04);
        }

        .marquee-info {
          margin-top: 1.25rem;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .marquee-card-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 1.18rem;
          color: #24211e;
          font-weight: 500;
          margin: 0 0 0.35rem 0;
        }

        .marquee-card-sub {
          font-size: 0.8rem;
          color: #927563;
          text-transform: uppercase;
          letter-spacing: 1.8px;
          margin: 0;
        }

        /* ======================================================
           RESPONSIVE TWEAKS
        ====================================================== */
        @media (max-width: 1100px) {
          .services-luxury-grid,
          .home-why-grid,
          .steps-cards-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 2rem;
          }

          .home-benefits-card {
            grid-template-columns: 1fr;
            padding: 3.5rem 2.5rem;
            gap: 3rem;
          }

          .benefits-arch-frame {
            max-width: 380px;
            margin: 0 auto;
          }
        }

        @media (max-width: 1024px) {
          .home-about-container {
            grid-template-columns: 1fr;
            gap: 3rem;
            text-align: center;
          }

          .home-about-text {
            align-items: center;
          }

          .home-about-desc {
            max-width: 100%;
          }
        }

        @media (max-width: 680px) {
          .services-luxury-grid,
          .home-why-grid,
          .steps-cards-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }

          .home-services-luxury,
          .home-benefits-section,
          .home-steps-section,
          .editorial-marquee-section {
            padding: 4.5rem 1.25rem;
          }

          .marquee-card {
            flex: 0 0 230px;
          }

          .marquee-arch-frame {
            width: 230px;
            height: 310px;
            border-radius: 115px 115px 10px 10px;
          }

          .home-benefits-card {
            padding: 2.25rem 1.5rem;
          }

          .home-arch-main {
            width: 210px;
            height: 310px;
          }

          .home-arch-accent {
            width: 170px;
            height: 270px;
            margin-left: -30px;
          }

          .home-why-card,
          .step-editorial-card {
            padding: 2.25rem 1.75rem;
          }
        }
      `}</style>

      {/* ======================================================
          HERO SECTION
      ====================================================== */}
      <section className='home-hero bloom-hero-section'>
        <Botanical className='bloom-corner-leaf' />

        <div className='bloom-hero-wrapper'>
          <div className='bloom-hero-guide' aria-hidden='true' />
          <div className='bloom-middle-rule' aria-hidden='true' />

          {/* LEFT CONTENT */}
          <div className='bloom-hero-copy'>
            <h1 className='bloom-title'>
              A little care.
              <br />
              A beautiful difference.
            </h1>

            <div className='bloom-description'>
              <PlaceholderCopy />
            </div>

            <div className='bloom-button-group'>
              <Link to='/about' className='bloom-btn-dark'>
                About Us
              </Link>

              <a className='bloom-btn-gold' href='tel:+639756692647'>
                <Phone size={14} strokeWidth={2} />
                Book a call
              </a>
            </div>

            <div className='bloom-stats'>
              <div className='bloom-stat-item'>
                <strong>Mon–Sat</strong>
                <span>Open weekly</span>
              </div>

              <div className='bloom-stat-item'>
                <strong>Dogs + cats</strong>
                <span>All companions</span>
              </div>
            </div>
          </div>

          {/* LARGE CENTER ARCH */}
          <div className='bloom-arch-container'>
            <img
              src='/pome-pink-dress.jpg'
              alt='Pomeranian in pink dress'
              className='h-full w-full object-cover object-center'
            />
          </div>

          {/* LARGE RIGHT CIRCLE */}
          <div className='bloom-visual-col'>
            <div className='bloom-visual-composition'>
              <div className='bloom-main-circle'>
                <img
                  src='/pome-tweed-suit.jpg'
                  alt='Pomeranian in tweed suit'
                  className='h-full w-full object-cover object-center'
                />
              </div>
              <Botanical className='bloom-circle-botanical' />
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================
          FEATURE STRIP (WITH HOVER ANIMATIONS)
      ====================================================== */}
      <section className='feature-strip' aria-label='Care highlights'>
        <div className='editorial-container'>
          {features.map(([icon, label]) => {
            const isScissors = label === 'Expert Grooming'
            const isPaw = label === 'Custom Styling'
            const isSparkles = label === 'Coat Care'
            const isHandshake = label === 'Gentle Handling'
            const isBath = label === 'Bath & Tidy'

            return (
              <div key={label} className='feature-anim-item'>
                <div className='feature-icon-wrap'>
                  {createElement(icon, {
                    size: 46,
                    strokeWidth: 0.85,
                    className: `feature-svg ${isScissors ? 'anim-scissors' : ''} ${isSparkles ? 'anim-sparkles' : ''} ${isHandshake ? 'anim-handshake' : ''}`
                  })}

                  {/* 2. Custom Styling: Floating Paws */}
                  {isPaw && (
                    <>
                      <PawPrint size={14} className='paw-particle paw-p1' />
                      <PawPrint size={12} className='paw-particle paw-p2' />
                    </>
                  )}

                  {/* 3. Coat Care: Twinkling Stars */}
                  {isSparkles && (
                    <>
                      <span className='star-particle star-s1' />
                      <span className='star-particle star-s2' />
                    </>
                  )}

                  {/* 4. Gentle Handling: Floating Heart */}
                  {isHandshake && (
                    <span className='heart-particle'>♥</span>
                  )}

                  {/* 5. Bath & Tidy: Running Shower Drops */}
                  {isBath && (
                    <div className='shower-stream' aria-hidden='true'>
                      <span className='shower-drop drop-1' />
                      <span className='shower-drop drop-2' />
                      <span className='shower-drop drop-3' />
                    </div>
                  )}
                </div>
                <span>{label}</span>
              </div>
            )
          })}
        </div>
      </section>

      {/* ======================================================
          ABOUT US: "WHERE CARE BLOOMS"
      ====================================================== */}
      <section className='home-about-bloom'>
        <svg className='home-about-bg-lines' viewBox='0 0 1440 600' fill='none' preserveAspectRatio='none'>
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

        <div className='home-about-container'>
          <div className='home-about-text'>
            <span className='home-about-eyebrow'>ABOUT US</span>
            <h2 className='home-about-heading'>
              TimmyTails <span>Where Care Blooms</span>
            </h2>
            <p className='home-about-desc'>
              Experience expert care and tranquil surroundings at our dedicated pet sanctuary in Baliuag, Bulacan, offering gentle, modern, and personalized pet grooming services.
            </p>
            <Link to='/about' className='home-about-btn'>
              Discover More
            </Link>
          </div>

          <div className='home-about-media'>
            <div className='home-arch-main'>
              <img
                src='/pome-before.jpg'
                alt='TimmyTails Sanctuary - Pomeranian Before'
                className='w-full h-full object-cover'
              />

              <svg className='home-flower-icon' viewBox='0 0 24 24' fill='currentColor'>
                <path d='M12 2a3 3 0 0 0-3 3 3 3 0 0 0 .5 1.6A3 3 0 0 0 6 6a3 3 0 0 0-3 3 3 3 0 0 0 1.6.5A3 3 0 0 0 4 12a3 3 0 0 0 3 3 3 3 0 0 0-.5 1.6A3 3 0 0 0 8 18a3 3 0 0 0 3 3 3 3 0 0 0 .5-1.6A3 3 0 0 0 12 20a3 3 0 0 0 3-3 3 3 0 0 0-.5-1.6A3 3 0 0 0 18 14a3 3 0 0 0 3-3 3 3 0 0 0-1.6-.5A3 3 0 0 0 20 8a3 3 0 0 0-3-3 3 3 0 0 0-.5 1.6A3 3 0 0 0 15 6a3 3 0 0 0-3-4zm0 8a2 2 0 1 1 0 4 2 2 0 0 1 0-4z'/>
              </svg>
            </div>

            <div className='home-arch-accent'>
              <img
                src='/pome-after.jpg'
                alt='Stylist & Pet - Pomeranian After'
                className='w-full h-full object-cover'
              />
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================
          WHY CHOOSE US: 4 FLOATING PILLARS
      ====================================================== */}
      <section className='home-why-section'>
        <div className='home-why-container'>
          <div className='home-why-header'>
            <span className='home-why-eyebrow'>THE TIMMYTAILS STANDARD</span>
            <h2 className='home-why-title'>Why Pets &amp; Owners Trust Us</h2>
            <p className='home-why-subtitle'>
              We combine certified styling expertise with genuine compassion, ensuring each grooming session is restorative, comfortable, and tailored to your pet.
            </p>
          </div>

          <div className='home-why-grid'>
            {whyChooseItems.map((item, idx) => (
              <div key={idx} className='home-why-card'>
                <div className='home-why-icon'>{item.icon}</div>
                <h3 className='home-why-card-title'>{item.title}</h3>
                <p className='home-why-card-desc'>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================
          REFINED LUXURY SERVICES SECTION
      ====================================================== */}
      <section className='home-services-luxury' id='our-services'>
        <Botanical className='services-backdrop-botanical services-botanical-left' />
        <Botanical className='services-backdrop-botanical services-botanical-right' />

        <div className='home-services-container'>
          <div className='home-services-header'>
            <span className='services-gold-eyebrow'>TAILORED CARE &amp; STYLING</span>
            <h2 className='services-luxury-title'>Care for Every Companion</h2>
            <p className='services-luxury-subtitle'>
              Carefully formulated baths, low-stress deshedding, and precision cuts tailored specifically to your companion’s comfort and breed profile.
            </p>
          </div>

          <div className='services-luxury-grid'>
            {services.map((service) => (
              <article key={service.id} className='service-luxury-card'>
                <div className='service-image-window'>
                  <span className='service-tag-badge'>{service.category}</span>
                  {service.ai && (
                    <span className='service-ai-badge'>
                      <Sparkles size={11} /> Style Preview
                    </span>
                  )}
                  <Link
                    to={`/services?service=${service.id}`}
                    className='service-arch-visual'
                    aria-label={`View ${service.name}`}
                  >
                    {service.image ? (
                      <img
                        src={service.image}
                        alt={service.name}
                        className='w-full h-full object-cover object-center'
                      />
                    ) : (
                      <ImagePlaceholder label={`${service.name} visual`} variant='arch' />
                    )}
                  </Link>
                </div>

                <div className='service-card-body'>
                  <h3 className='service-card-heading'>
                    <Link to={`/services?service=${service.id}`}>{service.name}</Link>
                  </h3>

                  <div className='service-meta-row'>
                    <span>
                      <Clock size={13} color='#d1a85b' />
                      {service.duration}
                    </span>
                    <span>•</span>
                    <span>Cage-free session</span>
                  </div>

                  <div className='service-card-footer'>
                    <div className='service-price-block'>
                      <span className='service-price-label'>Starts at</span>
                      <span className='service-price-value'>
                        ₱{service.price.toLocaleString('en-PH')}
                      </span>
                    </div>

                    <Link
                      to={`/services?service=${service.id}`}
                      className='service-action-link'
                      aria-label={`Learn more about ${service.name}`}
                    >
                      Details <ArrowUpRight size={14} />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className='services-center-footer'>
            <Link to='/services' className='services-view-all-btn'>
              View All Packages &amp; Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* ======================================================
          EDITORIAL BENEFITS SHOWCASE
      ====================================================== */}
      <section className='home-benefits-section'>
        <div className='home-benefits-card'>
          <div className='benefits-left-content'>
            <span className='benefits-eyebrow'>HOLISTIC PET SANCTUARY</span>
            <h2 className='benefits-heading'>
              Thoughtful grooming for every companion.
            </h2>
            <p className='benefits-description'>
              We believe grooming is an essential health ritual rather than a stressful necessity. Our quiet, cage-free salon ensures your pet feels secure, respected, and completely calm from arrival to pick-up.
            </p>

            <ul className='benefits-checklist'>
              <li>
                <span className='benefits-check-icon'><Check size={12} strokeWidth={2.5} /></span>
                <span>Individualized one-on-one attention with zero crowded waiting areas.</span>
              </li>
              <li>
                <span className='benefits-check-icon'><Check size={12} strokeWidth={2.5} /></span>
                <span>Hypoallergenic botanicals formulated specifically for sensitive skin.</span>
              </li>
              <li>
                <span className='benefits-check-icon'><Check size={12} strokeWidth={2.5} /></span>
                <span>Calming ambient aromatherapy and temperature-controlled drying rooms.</span>
              </li>
            </ul>

            <BookButton />
          </div>

          <div className='benefits-right-visual'>
            <div className='benefits-arch-frame'>
              <img
                src='/sanctuary-session.jpg'
                alt='Grooming sanctuary session'
                className='w-full h-full object-cover object-center'
              />
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================
          BOOKING STEPS (YOUR VISIT)
      ====================================================== */}
      <section className='home-steps-section'>
        <div className='steps-container'>
          <div className='steps-header'>
            <span className='steps-eyebrow'>A SIMPLE EXPERIENCE</span>
            <h2 className='steps-title'>Your Visit, Step by Step</h2>
            <p className='steps-subtitle'>
              From booking your appointment to picking up a radiant, happy pet, here is how we make every visit seamless.
            </p>
          </div>

          <div className='steps-cards-grid'>
            {steps.map((step) => (
              <div key={step.num} className='step-editorial-card'>
                <span className='step-number-tag'>{step.num}</span>
                <h3 className='step-card-heading'>{step.title}</h3>
                <p className='step-card-description'>{step.desc}</p>
              </div>
            ))}
          </div>

          <div className='steps-center-action'>
            <BookButton>Book an appointment</BookButton>
          </div>
        </div>
      </section>

      {/* ======================================================
          EDITORIAL MARQUEE GALLERY (LAST SECTION BEFORE FOOTER)
      ====================================================== */}
      <section className='editorial-marquee-section' id='gallery'>
        <div className='marquee-grid-line-top' aria-hidden='true' />
        <div className='marquee-grid-line-bottom' aria-hidden='true' />

        <Botanical className='marquee-botanical-bottom-left' />
        <Botanical className='marquee-botanical-top-right' />

        <div className='editorial-marquee-header-wrapper'>
          <div className='editorial-marquee-header'>
            <span className='editorial-marquee-eyebrow'>STYLE REFERENCES</span>
            <h2 className='editorial-marquee-title'>Living Gallery</h2>
            <p className='editorial-marquee-subtext'>
              A continuous showcase of calm grooming transformations, natural coat textures, and hand-sculpted finishes.
            </p>
          </div>
        </div>

        <div className='marquee-viewport'>
          <div className='marquee-track'>
            {[...galleryItems, ...galleryItems].map((item, index) => (
              <div key={`${item.id}-${index}`} className='marquee-card'>
                <div className='marquee-arch-frame'>
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      className='w-full h-full object-cover object-center'
                    />
                  ) : (
                    <ImagePlaceholder label={item.title} variant='arch' />
                  )}
                </div>
                <div className='marquee-info'>
                  <h4 className='marquee-card-title'>{item.title}</h4>
                  <p className='marquee-card-sub'>{item.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}