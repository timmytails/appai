import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Home, LogOut, Menu, X } from 'lucide-react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import NotificationBell from './NotificationBell'

const customerLinks = [
  ['Overview', '/dashboard'],
  ['Appointments', '/appointments'],
  ['My Pets', '/my-pets'],
  ['Account', '/profile']
]

export default function CustomerHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const accountRef = useRef(null)
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    setMobileOpen(false)
    setAccountOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!accountOpen) return
    const close = (event) => {
      if (accountRef.current && !accountRef.current.contains(event.target)) setAccountOpen(false)
    }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [accountOpen])

  const signOut = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className='sticky top-0 z-40 border-b border-[var(--tt-border)] bg-[var(--tt-canvas)]/90 backdrop-blur-md'>
      <div className='mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8'>
        {/* Brand Link */}
        <Link to='/dashboard' className='flex items-center gap-3 transition-opacity duration-300 hover:opacity-85'>
          <img src='/logo.png' alt='TimmyTails' className='h-9 w-9 rounded-full object-cover border border-[var(--tt-gold)]/40 shadow-xs' />
          <span className='font-serif text-2xl font-medium tracking-tight text-[var(--tt-ink)]'>TimmyTails</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className='hidden h-[72px] items-center gap-1 lg:flex' aria-label='Customer desktop navigation'>
          {customerLinks.map(([label, to]) => (
            <NavLink key={to} to={to} className={({ isActive }) => customerNavClass(isActive)}>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Right Utilities & Actions */}
        <div className='flex items-center gap-2 sm:gap-3'>
          <Link
            to='/book'
            className='hidden sm:inline-flex min-h-10 items-center justify-center rounded-lg bg-[var(--tt-ink)] px-5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#514b42]'
          >
            Book appointment
          </Link>

          <NotificationBell />

          {/* User Profile Pill & Dropdown */}
          <div className='relative' ref={accountRef}>
            <button
              type='button'
              onClick={() => setAccountOpen((current) => !current)}
              className='flex min-h-10 items-center gap-2 rounded-full border border-[var(--tt-border)] bg-white/80 py-1.5 pl-2 pr-3.5 text-xs font-medium text-[var(--tt-ink)] shadow-xs transition hover:border-[var(--tt-gold)] hover:bg-white'
              aria-label='Account menu'
              aria-haspopup='menu'
              aria-expanded={accountOpen}
            >
              <span className='grid h-7 w-7 place-items-center rounded-full bg-[var(--tt-accent-soft)] font-serif text-sm transition-transform duration-300'>
                {(user?.firstName?.[0] || 'A').toUpperCase()}
              </span>
              <span className='hidden xl:inline'>{user?.firstName || 'Account'}</span>
              <ChevronDown size={13} className={`transition-transform duration-300 ${accountOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu na may Slide-down & Soft Shadow */}
            {accountOpen && (
              <div 
                className='absolute right-0 top-[calc(100%+10px)] w-[280px] animate-in fade-in slide-in-from-top-2 duration-200 border border-[var(--tt-border)] bg-white p-3 shadow-[0_20px_50px_rgba(51,51,47,.12)]' 
                role='menu'
              >
                <div className='border-b border-[var(--tt-border)] px-2 pb-3 pt-1'>
                  <p className='font-serif text-lg text-[var(--tt-ink)]'>{user?.firstName} {user?.lastName}</p>
                  <p className='mt-1 truncate text-[11px] text-[var(--tt-muted)]'>{user?.email || user?.phone}</p>
                </div>
                <div className='py-2'>
                  {customerLinks.map(([label, to]) => (
                    <Link key={to} to={to} className='account-item transition-all duration-200 hover:pl-3'>
                      {label}
                    </Link>
                  ))}
                  <Link to='/' className='account-item transition-all duration-200 hover:pl-3'>
                    <Home size={14} /> Back to Home
                  </Link>
                </div>
                <button 
                  type='button' 
                  onClick={signOut} 
                  className='account-item w-full border-t border-[var(--tt-border)] pt-3 text-left text-[var(--tt-muted)] transition-all duration-200 hover:text-[var(--tt-ink)]'
                >
                  <LogOut size={14} /> Sign out
                </button>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <button
            type='button'
            onClick={() => setMobileOpen((current) => !current)}
            className='grid h-11 w-11 place-items-center text-[var(--tt-ink)] transition-transform duration-200 active:scale-95 lg:hidden'
            aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={22} className='transition-transform duration-200 rotate-90' /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileOpen && (
        <div className='absolute inset-x-0 top-full max-h-[calc(100vh-72px)] overflow-y-auto border-y border-[var(--tt-border)] bg-[var(--tt-canvas)] px-5 py-5 shadow-[0_18px_35px_rgba(51,51,47,.08)] lg:hidden'>
          <nav className='grid gap-1' aria-label='Customer mobile menu'>
            {customerLinks.map(([label, to]) => <MobileLink key={to} to={to}>{label}</MobileLink>)}
            <div className='my-2 h-px bg-[var(--tt-border)]' />
            <MobileLink to='/'>
              <span className='flex items-center gap-2'>
                <Home size={16} /> Back to Home
              </span>
            </MobileLink>
            <button 
              type='button' 
              onClick={signOut} 
              className='flex min-h-11 items-center gap-2 px-3 text-left text-sm text-[var(--tt-muted)] transition-colors hover:text-[var(--tt-ink)]'
            >
              <LogOut size={15} /> Sign out
            </button>
          </nav>
        </div>
      )}
    </header>
  )
}

// Gold sliding underline tulad ng nasa Header.jsx
function customerNavClass(isActive) {
  return `relative inline-flex min-h-full items-center px-4 text-[12px] font-medium transition-colors duration-300 after:absolute after:inset-x-4 after:bottom-0 after:h-px after:origin-left after:bg-[var(--tt-gold)] after:transition-transform after:duration-300 after:ease-out ${
    isActive 
      ? 'text-[var(--tt-ink)] after:scale-x-100' 
      : 'text-[var(--tt-ink-soft)] after:scale-x-0 hover:text-[var(--tt-ink)] hover:after:scale-x-100'
  }`
}

function MobileLink({ to, children }) {
  return (
    <Link 
      to={to} 
      className='flex min-h-11 items-center px-3 font-serif text-lg text-[var(--tt-ink)] transition-colors duration-200 hover:bg-white/60'
    >
      {children}
    </Link>
  )
}