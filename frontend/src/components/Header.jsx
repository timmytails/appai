import { useEffect, useRef, useState } from 'react'
import { ChevronDown, LogOut, Menu, Shield, UserRound, X } from 'lucide-react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import NotificationBell from './NotificationBell'
import BookButton from './editorial/BookButton'

const customerLinks = [
  ['Overview', '/dashboard'],
  ['Appointments', '/appointments'],
  ['My Pets', '/my-pets'],
  ['Account Settings', '/profile']
]

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const accountRef = useRef(null)
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  // Scroll listener para pumuti kapag nag-scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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

  if (['/login', '/signup', '/forgot-password', '/complete-profile', '/admin'].includes(location.pathname)) return null

  const signOut = () => {
    logout()
    setAccountOpen(false)
    setMobileOpen(false)
    navigate('/')
  }

  const accountLabel = user?.role === 'admin' ? 'Admin Workspace' : 'My TimmyTails'

  return (
    <header
      className={`sticky top-0 z-50 h-[72px] transition-all duration-300 ease-in-out md:h-[88px] ${
        isScrolled || mobileOpen
          ? 'border-b border-[var(--tt-border)] bg-white/95 shadow-sm backdrop-blur-md'
          : 'border-b border-transparent bg-[var(--tt-canvas)]'
      }`}
    >
      <a className='skip-link' href='#main-content'>Skip to content</a>
      <div className='relative mx-auto flex h-full max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-10'>
        
        {/* LOGO (Kaliwa) */}
        <Link to='/' className='z-10 flex shrink-0 items-center gap-3' aria-label='TimmyTails home'>
          <img src='/logo.png' alt='TimmyTails' className='h-11 w-11 rounded-full object-cover transition-transform duration-300 hover:scale-105 md:h-12 md:w-12' />
          <span className='font-serif text-lg font-semibold tracking-tight text-[var(--tt-ink)] sm:text-xl'>TimmyTails</span>
        </Link>

        {/* NAVIGATION LINKS (Naka-center nang eksakto sa gitna) */}
        <nav 
          className='absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-7 xl:gap-8 lg:flex' 
          aria-label='Primary navigation'
        >
          <NavLink to='/' end className={({ isActive }) => navClass(isActive)}>Home</NavLink>
          <NavLink to='/about' className={({ isActive }) => navClass(isActive)}>About</NavLink>
          <NavLink to='/services' className={({ isActive }) => navClass(isActive)}>Services</NavLink>
          <Link to='/services#our-services' className={navClass(false)}>Packages</Link>
          <Link to='/#gallery' className={navClass(false)}>Gallery</Link>
          <NavLink to='/contact' className={({ isActive }) => navClass(isActive)}>Contact</NavLink>
        </nav>

        {/* ACTIONS: SIGN IN / USER / BOOK A VISIT (Kanan - Hindi ginalaw ang lalagyan) */}
        <div className='ml-auto flex items-center gap-2 lg:ml-0 z-10'>
          {user ? (
            <>
              {user.role === 'user' && <NotificationBell />}
              <div className='relative hidden sm:block' ref={accountRef}>
                <button
                  type='button'
                  onClick={() => setAccountOpen((current) => !current)}
                  className='flex min-h-10 items-center gap-2 rounded-full border border-[var(--tt-border)] bg-white/80 py-1.5 pl-2 pr-3.5 text-xs font-medium text-[var(--tt-ink)] shadow-xs transition hover:border-[var(--tt-gold)] hover:bg-white'
                  aria-label='Account menu'
                  aria-haspopup='menu'
                  aria-expanded={accountOpen}
                >
                  <span className='grid h-7 w-7 place-items-center rounded-full bg-[var(--tt-accent-soft)] font-serif text-sm transition-transform duration-300'>
                    {(user.firstName?.[0] || 'A').toUpperCase()}
                  </span>
                  <span className='hidden xl:inline'>{user?.role === 'admin' ? 'Admin' : (user?.firstName || 'Account')}</span>
                  <ChevronDown size={13} className={`transition-transform duration-300 ${accountOpen ? 'rotate-180' : ''}`} />
                </button>

                {accountOpen && (
                  <div className='absolute right-0 top-[calc(100%+10px)] w-[290px] border border-[var(--tt-border)] bg-white p-3 shadow-[0_20px_50px_rgba(51,51,47,.12)]' role='menu'>
                    <div className='border-b border-[var(--tt-border)] px-2 pb-3 pt-1'>
                      <p className='font-serif text-lg text-[var(--tt-ink)]'>{user.firstName} {user.lastName}</p>
                      <p className='mt-1 truncate text-[11px] text-[var(--tt-muted)]'>{user.email || user.phone}</p>
                    </div>
                    <div className='py-2'>
                      {user.role === 'admin' ? (
                        <Link to='/admin' className='account-item'><Shield size={14} />Open admin workspace</Link>
                      ) : (
                        customerLinks.map(([label, to]) => (
                          <Link key={to} to={to} className='account-item'>{label}</Link>
                        ))
                      )}
                    </div>
                    <button type='button' onClick={signOut} className='account-item w-full border-t border-[var(--tt-border)] pt-3 text-left text-[var(--tt-muted)]'>
                      <LogOut size={14} />Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link to='/login' className='hidden px-3 text-xs font-semibold text-[var(--tt-ink)] sm:inline'>
              Sign in
            </Link>
          )}

          <div className='hidden md:block'>
            <BookButton className='!min-h-11 !px-5 !text-[10px] !tracking-[.14em]'>
              Book a visit
            </BookButton>
          </div>

          <button
            type='button'
            onClick={() => setMobileOpen((current) => !current)}
            className='grid h-11 w-11 place-items-center text-[var(--tt-ink)] lg:hidden'
            aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      {mobileOpen && (
        <div className='absolute inset-x-0 top-full max-h-[calc(100vh-72px)] overflow-y-auto border-y border-[var(--tt-border)] bg-[var(--tt-canvas)] px-5 py-5 shadow-[0_18px_35px_rgba(51,51,47,.08)] lg:hidden'>
          <nav className='grid gap-1 text-sm' aria-label='Mobile menu'>
            <MobileLink to='/'>Home</MobileLink>
            <MobileLink to='/about'>About</MobileLink>
            <MobileLink to='/services'>Services &amp; pricing</MobileLink>
            <MobileLink to='/#gallery'>Gallery</MobileLink>
            <MobileLink to='/contact'>Contact</MobileLink>
            
            <div className='my-3 h-px bg-[var(--tt-border)]' />
            
            {user ? (
              <>
                <p className='px-3 pb-1 text-[9px] font-bold uppercase tracking-[.18em] text-[var(--tt-muted)]'>{accountLabel}</p>
                {user.role === 'admin' ? (
                  <MobileLink to='/admin'>Admin workspace</MobileLink>
                ) : (
                  customerLinks.map(([label, to]) => <MobileLink key={to} to={to}>{label}</MobileLink>)
                )}
                <button type='button' onClick={signOut} className='flex min-h-11 items-center gap-2 px-3 text-left text-sm text-[var(--tt-muted)]'>
                  <LogOut size={15} />Sign out
                </button>
              </>
            ) : (
              <MobileLink to='/login'>Sign in</MobileLink>
            )}
            
            <div className='mt-3 md:hidden'>
              <BookButton className='w-full'>Book a visit</BookButton>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}

// BUMAGAY NA TYPOGRAPHY (Title Case, natural at malinis na font gaya ng Home.jsx)
function navClass(isActive) {
  return `relative inline-flex min-h-11 items-center text-[13px] font-medium transition-colors duration-200 after:absolute after:inset-x-0 after:bottom-1 after:h-[1.5px] after:origin-left after:bg-[var(--tt-gold)] after:transition-transform after:duration-200 ${
    isActive 
      ? 'text-[var(--tt-ink)] font-semibold after:scale-x-100' 
      : 'text-[var(--tt-ink-soft)] hover:text-[var(--tt-ink)] after:scale-x-0 hover:after:scale-x-100'
  }`
}


function MobileLink({ to, children }) {
  return (
    <Link to={to} className='flex min-h-11 items-center px-3 font-serif text-lg text-[var(--tt-ink)] hover:bg-white'>
      {children}
    </Link>
  )
}