import { createElement } from 'react'
import { CalendarDays, Dog, Home, LayoutDashboard, LogIn, Sparkles, UserRound } from 'lucide-react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function BottomNav({ mode = 'public' }) {
  const { user } = useAuth()
  const location = useLocation()

  if (mode === 'customer') {
    const items = [
      { label: 'Overview', to: '/dashboard', icon: LayoutDashboard },
      { label: 'Visits', to: '/appointments', icon: CalendarDays },
      { label: 'Pets', to: '/my-pets', icon: Dog },
      { label: 'Account', to: '/profile', icon: UserRound }
    ]

    return (
      <>
        {location.pathname !== '/booking' && (
          <Link to='/booking' className='fixed bottom-[78px] right-4 z-40 inline-flex min-h-11 items-center gap-2 bg-[var(--tt-ink)] px-4 text-[13px] font-semibold text-white shadow-[0_10px_30px_rgba(51,51,47,.18)] md:hidden'>
            <span className='text-base leading-none'>+</span> Book a visit
          </Link>
        )}
        <nav aria-label='Customer mobile navigation' className='fixed inset-x-0 bottom-0 z-40 border-t border-[var(--tt-border)] bg-[var(--tt-canvas)]/98 px-2 pb-[max(.4rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur md:hidden'>
          <div className='grid min-h-14 grid-cols-4'>
            {items.map(({ label, to, icon: Icon }) => (
              <NavLink key={to} to={to} end={to === '/dashboard'} className={({ isActive }) => `relative flex flex-col items-center justify-center gap-1 text-[10px] font-medium ${isActive ? 'text-[var(--tt-ink)]' : 'text-[var(--tt-muted)]'}`}>
                {({ isActive }) => <>{createElement(Icon, { size: 18, strokeWidth: isActive ? 2 : 1.5 })}<span>{label}</span>{isActive && <span className='absolute inset-x-5 top-0 h-px bg-[var(--tt-gold)]' />}</>}
              </NavLink>
            ))}
          </div>
        </nav>
      </>
    )
  }

  const accountTarget = user?.role === 'admin' ? '/admin' : user ? '/dashboard' : '/login'
  const accountLabel = user?.role === 'admin' ? 'Admin' : user ? 'Account' : 'Sign in'
  const AccountIcon = user ? UserRound : LogIn
  const publicItems = [
    { label: 'Home', to: '/', icon: Home },
    { label: 'Services', to: '/services', icon: Sparkles },
    { label: 'Book', to: '/booking', icon: CalendarDays },
    { label: accountLabel, to: accountTarget, icon: AccountIcon }
  ]

  return (
    <nav aria-label='Website mobile navigation' className='fixed inset-x-0 bottom-0 z-40 border-t border-[var(--tt-border)] bg-[var(--tt-canvas)] px-2 pb-[max(.4rem,env(safe-area-inset-bottom))] pt-1.5 md:hidden'>
      <div className='grid min-h-14 grid-cols-4'>
        {publicItems.map(({ label, to, icon: Icon }) => (
          <NavLink key={`${label}-${to}`} to={to} end={to === '/'} className={({ isActive }) => `flex flex-col items-center justify-center gap-1 text-[10px] font-medium ${isActive ? 'text-[var(--tt-ink)]' : 'text-[var(--tt-muted)]'}`}>
            {createElement(Icon, { size: 18, strokeWidth: 1.6 })}<span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
