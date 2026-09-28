import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Ban, Eye, EyeOff, Loader2, HeartHandshake, ShieldCheck, Scissors } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { getErrorMessage, warmupBackendServer } from '../utils/api'
import { consumeReturnTo, peekReturnTo, rememberReturnTo, resolvePostLoginRoute } from '../utils/authRouting'
import GoogleSignInButton from '../features/auth/components/GoogleSignInButton'
import { Botanical } from '../components/editorial/Decorations'

export default function Login() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [loadingElapsed, setLoadingElapsed] = useState(0)

  const location = useLocation()
  const navigate = useNavigate()
  const { login, googleLogin } = useAuth()

  useEffect(() => {
    let timer = null
    if (submitting) {
      setLoadingElapsed(0)
      timer = setInterval(() => {
        setLoadingElapsed((prev) => prev + 1)
      }, 1000)
    } else {
      setLoadingElapsed(0)
    }
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [submitting])

  const loadingStatusText = useMemo(() => {
    if (loadingElapsed < 3) return 'Checking your details…'
    if (loadingElapsed < 8) return 'Still connecting. The server sleeps when nobody is using it, so the first sign-in of the day takes longer…'
    return 'Almost there. Waking the server is the slow part, not your account…'
  }, [loadingElapsed])

  // Progress follows real elapsed time, so the bar never claims to be done while
  // the request is still running. It stops short of 100% until sign-in succeeds.
  const loadingProgress = useMemo(
    () => Math.min(92, Math.round((1 - Math.exp(-loadingElapsed / 7)) * 100)),
    [loadingElapsed]
  )

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search])
  const urlReason = searchParams.get('reason')
  const urlMsg = searchParams.get('msg')

  const initialBanMsg = useMemo(() => {
    if (urlReason === 'banned' || urlReason === 'blocked' || urlReason === 'suspended') {
      return urlMsg || 'Your customer account has been suspended by salon administration.'
    }
    return ''
  }, [urlReason, urlMsg])

  const [banErrorMsg, setBanErrorMsg] = useState(initialBanMsg)
  const [googleHintMsg, setGoogleHintMsg] = useState('')

  useEffect(() => {
    if (initialBanMsg) setBanErrorMsg(initialBanMsg)
  }, [initialBanMsg])

  useEffect(() => {
    warmupBackendServer()
  }, [])

  const requestedReturnTo = useMemo(() => {
    const statePath = location.state?.returnTo || location.state?.from
    if (statePath) rememberReturnTo(statePath)
    return statePath || peekReturnTo()
  }, [location.state])

  const finishLogin = useCallback((user) => {
    const returnTo = consumeReturnTo() || requestedReturnTo
    if (!user?.profileCompleted && returnTo) rememberReturnTo(returnTo)
    navigate(resolvePostLoginRoute({ user, returnTo }), { replace: true })
  }, [navigate, requestedReturnTo])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setBanErrorMsg('')
    setGoogleHintMsg('')
    try {
      const data = await login(identifier.trim(), password)
      toast.success('Signed in successfully')
      finishLogin(data.user)
    } catch (error) {
      const msg = getErrorMessage(error)
      const code = error?.response?.data?.code
      if (code === 'GOOGLE_AUTH_REQUIRED' || msg.toLowerCase().includes('google')) {
        setGoogleHintMsg(msg || 'This account was created with Google. Click "Continue with Google" below to sign in.')
      } else if (error?.response?.status === 403 || msg.toLowerCase().includes('suspended') || msg.toLowerCase().includes('banned') || msg.toLowerCase().includes('blocked')) {
        setBanErrorMsg(msg || 'Your customer account has been suspended by salon administration.')
      }
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleGoogle = useCallback(async (credential) => {
    setSubmitting(true)
    setBanErrorMsg('')
    setGoogleHintMsg('')
    try {
      const data = await googleLogin(credential)
      toast.success(data.user.profileCompleted ? 'Signed in successfully' : 'Complete your profile to continue')
      finishLogin(data.user)
    } catch (error) {
      const msg = getErrorMessage(error)
      if (error?.response?.status === 403 || msg.toLowerCase().includes('suspended') || msg.toLowerCase().includes('banned') || msg.toLowerCase().includes('blocked')) {
        setBanErrorMsg(msg || 'Your customer account has been suspended by salon administration.')
      }
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }, [finishLogin, googleLogin])

  return (
    <div className='relative min-h-screen bg-[var(--tt-canvas)] text-[var(--tt-ink)] selection:bg-[var(--tt-gold-light)]/20 lg:grid lg:grid-cols-[1.05fr_0.95fr]'>
      <style>{`
        .gold-underline {
          position: relative;
          transition: color 0.25s ease;
        }

        .gold-underline::after {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          bottom: -1px;
          height: 1px;
          background: var(--tt-gold-light);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .gold-underline:hover::after {
          transform: scaleX(1);
        }

        @keyframes subtleFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        .anim-leaf-float {
          animation: subtleFloat 7s ease-in-out infinite;
        }
      `}</style>

      {/* LEFT SHOWCASE PANEL */}
      <section className='relative hidden min-h-screen overflow-hidden bg-[var(--tt-ink)] text-[#f7f1ea] lg:flex lg:flex-col lg:justify-between lg:p-14 xl:p-16'>
        {/* Architectural Hairline Guides */}
        <div className='pointer-events-none absolute left-12 top-0 h-full w-px bg-white/5' aria-hidden='true' />
        <div className='pointer-events-none absolute right-12 top-0 h-full w-px bg-white/5' aria-hidden='true' />

        {/* Ambient Botanicals */}
        <Botanical className='anim-leaf-float pointer-events-none absolute -left-20 top-1/2 -translate-y-1/2 w-80 rotate-12 text-white/[0.04]' />
        <Botanical className='anim-leaf-float pointer-events-none absolute -right-20 bottom-12 w-96 -scale-x-100 rotate-45 text-[var(--tt-gold-light)]/[0.08]' />

        {/* Logo Header */}
        <div className='relative z-10'>
          <Link to='/' className='group inline-flex items-center gap-3.5 text-white transition-opacity hover:opacity-90'>
            <img
              src='/logo.png'
              alt='TimmyTails'
              className='h-12 w-12 rounded-full object-cover ring-1 ring-[rgba(210,143,119,0.4)] shadow-md'
            />
            <span className='font-serif text-2xl font-medium tracking-tight text-white'>TimmyTails</span>
          </Link>
        </div>

        {/* Editorial Text & Sanctuary Pillars */}
        <div className='relative z-10 my-auto max-w-lg py-12'>
          <h2 className='font-serif text-[clamp(2.5rem,3.4vw,4rem)] font-medium leading-[1.04] tracking-[-0.03em] text-white'>
            A quieter place for grooming, care, and the companions you love.
          </h2>

          <p className='mt-5 max-w-md text-base leading-relaxed text-[var(--tt-muted-soft)]'>
            Appointments, coat notes, breed-standard styling, and visit history remain safely connected to your account.
          </p>

          <div className='mt-10 space-y-4 border-t border-white/10 pt-8'>
            <div className='flex items-start gap-3.5'>
              <div className='grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-[var(--tt-gold-light)]'>
                <HeartHandshake size={15} />
              </div>
              <div>
                <h3 className='font-serif text-base font-medium text-white'>Gentle, Low-Stress Handling</h3>
                <p className='mt-0.5 text-xs text-[var(--tt-muted-soft)]'>Sessions adapted to your pet's comfort and pace.</p>
              </div>
            </div>

            <div className='flex items-start gap-3.5'>
              <div className='grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-[var(--tt-gold-light)]'>
                <ShieldCheck size={15} />
              </div>
              <div>
                <h3 className='font-serif text-base font-medium text-white'>Cage-Free Sanctuary</h3>
                <p className='mt-0.5 text-xs text-[var(--tt-muted-soft)]'>Peaceful, dedicated space with zero crowded waiting.</p>
              </div>
            </div>

            <div className='flex items-start gap-3.5'>
              <div className='grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-[var(--tt-gold-light)]'>
                <Scissors size={15} />
              </div>
              <div>
                <h3 className='font-serif text-base font-medium text-white'>Precision Breed Styling</h3>
                <p className='mt-0.5 text-xs text-[var(--tt-muted-soft)]'>Tailored outlines and coat care for dogs and cats.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Notes */}
        <div className='relative z-10 flex items-center justify-between border-t border-white/10 pt-6 text-xs text-[var(--tt-muted-soft)]'>
          <span>Open Mon – Sat</span>
          <span>Baliuag, Bulacan</span>
        </div>
      </section>

      {/* RIGHT AUTHENTICATION FORM */}
      <main className='relative flex min-h-screen items-center justify-center px-6 py-10 sm:px-10 lg:px-14 xl:px-18'>
        <div className='relative z-10 w-full max-w-[430px]'>
          <Link
            to='/'
            className='gold-underline group mb-8 inline-flex items-center gap-2 pb-0.5 text-sm font-medium text-[var(--tt-muted)] hover:text-[var(--tt-ink)]'
          >
            <ArrowLeft size={14} className='text-[var(--tt-accent)] transition-transform duration-300 group-hover:-translate-x-1' />
            Back to home
          </Link>

          <div className='mb-7 flex items-center gap-3 lg:hidden'>
            <img
              src='/logo.png'
              alt='TimmyTails'
              className='h-10 w-10 rounded-full object-cover border border-[rgba(210,143,119,0.4)] shadow-xs'
            />
            <span className='font-serif text-2xl font-medium text-[var(--tt-ink)]'>TimmyTails</span>
          </div>

          <div>
            <h1 className='font-serif text-4xl font-medium tracking-tight text-[var(--tt-ink)] sm:text-5xl'>
              Sign in to your care desk.
            </h1>
            <p className='mt-3 text-sm leading-relaxed text-[var(--tt-ink-soft)]'>
              Review appointments, manage companion medical notes, and configure grooming preferences in one quiet place.
            </p>
          </div>

          {location.state?.reason === 'booking-required' && (
            <div className='mt-5 rounded-lg border border-[#cdbd86] bg-[#fdf8eb] p-3.5 text-xs font-medium text-[var(--tt-muted)] shadow-xs'>
              Please sign in first, and we will take you straight to your appointment reservation.
            </div>
          )}

          {banErrorMsg && (
            <div className='mt-5 rounded-lg border border-[var(--tt-danger-border)] bg-[var(--tt-danger-bg)] p-4 text-left shadow-xs'>
              <div className='flex items-start gap-3'>
                <span className='grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-[#934b4b] shadow-xs'>
                  <Ban size={16} />
                </span>
                <div>
                  <h4 className='font-serif text-sm font-semibold uppercase tracking-[.08em] text-[#7d3f3f]'>
                    Account Access Suspended
                  </h4>
                  <p className='mt-1 text-xs leading-relaxed text-[#7d3f3f]'>{banErrorMsg}</p>
                </div>
              </div>
            </div>
          )}

          {googleHintMsg && (
            <div className='mt-5 rounded-lg border border-[#ead7ca] bg-[#fdf7f2] p-4 text-left shadow-xs'>
              <div className='flex items-start gap-3'>
                <span className='grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white shadow-xs'>
                  <svg className='h-4 w-4' viewBox='0 0 24 24'>
                    <path fill='#4285F4' d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z' />
                    <path fill='#34A853' d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z' />
                    <path fill='#FBBC05' d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z' />
                    <path fill='#EA4335' d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z' />
                  </svg>
                </span>
                <div>
                  <h4 className='font-serif text-sm font-semibold text-[#79584b]'>
                    Google Account Detected
                  </h4>
                  <p className='mt-1 text-xs leading-relaxed text-[#79584b]'>{googleHintMsg}</p>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className='mt-7 space-y-4'>
            <div>
              <label className='mb-1.5 block text-xs font-semibold text-[var(--tt-ink-soft)]'>
                Phone Number or Email
              </label>
              <input
                id='login-identifier'
                type='text'
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                onFocus={() => warmupBackendServer()}
                required
                autoComplete='username'
                className='h-12 w-full rounded-xl border border-[rgba(210,143,119,0.35)] bg-white px-4 text-sm text-[var(--tt-ink)] outline-none transition-all focus:border-[var(--tt-gold-light)] focus:ring-2 focus:ring-[var(--tt-gold-light)]/20 shadow-xs'
              />
            </div>

            <div>
              <div className='mb-1.5 flex items-center justify-between'>
                <label className='block text-xs font-semibold text-[var(--tt-ink-soft)]'>
                  Password
                </label>
                <Link
                  to='/forgot-password'
                  className='gold-underline text-[12px] font-semibold text-[var(--tt-muted)] hover:text-[var(--tt-ink)]'
                >
                  Forgot password?
                </Link>
              </div>
              <div className='relative'>
                <input
                  id='login-password'
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => warmupBackendServer()}
                  required
                  autoComplete='current-password'
                  className='h-12 w-full rounded-xl border border-[rgba(210,143,119,0.35)] bg-white pl-4 pr-11 text-sm text-[var(--tt-ink)] outline-none transition-all focus:border-[var(--tt-gold-light)] focus:ring-2 focus:ring-[var(--tt-gold-light)]/20 shadow-xs'
                />
                <button
                  type='button'
                  onClick={() => setShowPassword((p) => !p)}
                  className='absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--tt-muted)] transition-colors hover:text-[var(--tt-ink)]'
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type='submit'
              disabled={submitting}
              className='mt-2 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-[var(--tt-brand-strong)] text-sm font-semibold text-white antialiased shadow-sm transition-all duration-200 hover:bg-[var(--tt-brand)] active:scale-[0.99] disabled:opacity-50'
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className='animate-spin text-[var(--tt-gold-light)]' /> Signing in…
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Loading overlay. The backend sleeps when idle, so the wait is real;
              this shows honest progress instead of decorative animation. */}
          {submitting && (
            <div
              className='fixed inset-0 z-50 flex items-center justify-center bg-[var(--tt-ink)]/70 px-4'
              role='status'
              aria-live='polite'
              aria-label='Signing in'
            >
              <div className='w-full max-w-sm rounded-lg border border-[var(--tt-border)] bg-[var(--tt-surface)] p-7 text-center shadow-[var(--tt-elev-3)]'>
                <h3 className='font-serif text-xl text-[var(--tt-ink)]'>Signing you in</h3>

                <p className='mt-2 h-10 text-xs leading-5 text-[var(--tt-muted)]'>
                  {loadingStatusText}
                </p>

                <div
                  className='mt-5 h-1 w-full overflow-hidden rounded-full bg-[var(--tt-sage)]'
                  role='progressbar'
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={loadingProgress}
                >
                  <div
                    className='h-full origin-left rounded-full bg-[var(--tt-gold)] transition-transform duration-700 ease-out'
                    style={{ transform: `scaleX(${loadingProgress / 100})` }}
                  />
                </div>

                <p className='mt-4 text-[12px] text-[var(--tt-muted-soft)]'>
                  {loadingElapsed >= 20
                    ? 'This is taking longer than usual.'
                    : 'Usually under a few seconds.'}
                </p>

                {loadingElapsed >= 20 && (
                  <button
                    type='button'
                    onClick={() => setSubmitting(false)}
                    className='mt-3 text-xs font-semibold text-[var(--tt-gold)] underline underline-offset-4 transition-colors hover:text-[var(--tt-ink)]'
                  >
                    Cancel and try again
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Divider */}
          <div className='my-6 flex items-center gap-3 text-xs font-medium text-[var(--tt-muted)]'>
            <span className='h-px flex-1 bg-[rgba(210,143,119,0.3)]' />
            <span>or continue with</span>
            <span className='h-px flex-1 bg-[rgba(210,143,119,0.3)]' />
          </div>

          {/* Google Login */}
          <div className='mx-auto flex w-full justify-center'>
            <GoogleSignInButton onCredential={handleGoogle} disabled={submitting} text='continue_with' />
          </div>

          {/* Registration Link */}
          <p className='mt-8 text-center text-xs text-[var(--tt-muted)]'>
            First time booking with us?{' '}
            <Link
              to='/signup'
              state={{ returnTo: requestedReturnTo }}
              className='gold-underline font-bold text-[var(--tt-ink)]'
            >
              Register a companion account
            </Link>
          </p>

          {/* Terms & Privacy Agreement Notice */}
          <p className='mt-6 border-t border-[rgba(210,143,119,0.2)] pt-4 text-center text-[12px] leading-relaxed text-[var(--tt-muted-soft)]'>
            By signing in, you agree to TimmyTails’{' '}
            <Link
              to='/terms-of-service'
              target='_blank'
              rel='noopener noreferrer'
              className='underline underline-offset-2 transition-colors hover:text-[var(--tt-ink)]'
            >
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link
              to='/privacy-policy'
              target='_blank'
              rel='noopener noreferrer'
              className='underline underline-offset-2 transition-colors hover:text-[var(--tt-ink)]'
            >
              Privacy Policy
            </Link>.
          </p>
        </div>
      </main>
    </div>
  )
}