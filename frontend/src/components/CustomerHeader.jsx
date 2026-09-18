import { useEffect, useRef, useState } from 'react'
import { ChevronDown, ExternalLink, LogOut, Menu, X } from 'lucide-react'
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
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [accountOpen])

  const signOut = () => {
    logout()
    setAccountOpen(false)
    setMobileOpen(false)
    navigate('/')
  }

  return (
    <header className='sticky top-0 z-50 h-[72px] border-b border-[var(--tt-border)] bg-[var(--tt-canvas)]/95 backdrop-blur transition-colors duration-300 md:h-[78px]'>
      <a className='skip-link' href='#main-content'>Skip to content</a>
      <div className='mx-auto flex h-full max-w-[1440px] items-center gap-4 px-4 sm:px-6 lg:px-10'>
        <div className='flex flex-1 items-center'>
          <Link to='/dashboard' className='group flex shrink-0 items-center gap-3' aria-label='TimmyTails customer overview'>
            <img 
              src='/logo.png' 
              alt='TimmyTails' 
              className='h-11 w-11 rounded-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 lg:h-12 lg:w-12' 
            />
            <span className='hidden font-serif text-xl font-semibold tracking-tight text-[var(--tt-ink)] sm:block'>TimmyTails</span>
          </Link>
        </div>

        {/* Center Nav Links na may Animated Gold Underline */}
        <nav className='hidden flex-1 items-stretch justify-center self-stretch lg:flex' aria-label='Customer navigation'>
          {customerLinks.map(([label, to]) => (
            <NavLink 
              key={to} 
              to={to} 
              end={to === '/dashboard'} 
              className={({ isActive }) => customerNavClass(isActive)}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className='flex flex-1 items-center justify-end gap-2'>
          <NotificationBell />
          {/* User Profile Dropdown Button */}
          <div className='relative hidden sm:block' ref={accountRef}>
            <button
              type='button'
              onClick={() => setAccountOpen((current) => !current)}
              className='inline-flex min-h-11 items-center gap-2 border border-transparent px-3 text-xs font-semibold text-[var(--tt-ink)] transition-all duration-300 hover:border-[var(--tt-border)] hover:bg-white active:scale-[0.98]'
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
                    <ExternalLink size={14} /> Visit website
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
            <MobileLink to='/'>Visit website</MobileLink>
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