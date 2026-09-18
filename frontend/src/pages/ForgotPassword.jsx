import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { getErrorMessage } from '../utils/api'
import { Botanical } from '../components/editorial/Decorations'

export default function ForgotPassword() {
  const { sendPasswordOtp, resetPasswordWithOtp } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState('request') // 'request' | 'verify' | 'success'
  const [form, setForm] = useState({ identifier: '', otp: '', newPassword: '', confirmPassword: '' })
  const [otpTimer, setOtpTimer] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (otpTimer <= 0) return
    const interval = setInterval(() => {
      setOtpTimer((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [otpTimer])

  const canReset = useMemo(
    () =>
      /^\d{6}$/.test(form.otp) &&
      form.newPassword.length >= 8 &&
      form.newPassword === form.confirmPassword,
    [form.otp, form.newPassword, form.confirmPassword]
  )

  const update = (e) => {
    const { name, value } = e.target
    setForm((c) => ({ ...c, [name]: name === 'otp' ? value.replace(/\D/g, '').slice(0, 6) : value }))
  }

  const requestOtp = async (e) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    try {
      const data = await sendPasswordOtp(form.identifier.trim())
      toast.success(data?.message || 'Verification code sent')
      setStep('verify')
      setOtpTimer(60)
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  const resendPasswordOtp = async () => {
    if (otpTimer > 0 || submitting) return
    setSubmitting(true)
    try {
      const data = await sendPasswordOtp(form.identifier.trim())
      setOtpTimer(60)
      toast.success(data?.message || 'New verification code sent')
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  const resetPassword = async (e) => {
    e.preventDefault()
    if (form.newPassword !== form.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (submitting) return
    setSubmitting(true)
    try {
      await resetPasswordWithOtp({
        identifier: form.identifier.trim(),
        otp: form.otp,
        newPassword: form.newPassword
      })
      setStep('success')
      toast.success('Password updated successfully')
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className='relative min-h-screen bg-[#fdf4ef] text-[#24211e] selection:bg-[#d1a85b]/20 lg:grid lg:grid-cols-[1.05fr_0.95fr]'>
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
          background: #d1a85b;
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

      {/* LEFT SHOWCASE PANEL (Identical to Login.jsx) */}
      <section className='relative hidden min-h-screen overflow-hidden bg-[#1c1a18] text-[#f7f1ea] lg:flex lg:flex-col lg:justify-between lg:p-14 xl:p-16'>
        {/* Architectural Hairline Guides */}
        <div className='pointer-events-none absolute left-12 top-0 h-full w-px bg-white/5' aria-hidden='true' />
        <div className='pointer-events-none absolute right-12 top-0 h-full w-px bg-white/5' aria-hidden='true' />

        {/* Ambient Botanicals */}
        <Botanical className='anim-leaf-float pointer-events-none absolute -left-20 top-1/2 -translate-y-1/2 w-80 rotate-12 text-white/[0.04]' />
        <Botanical className='anim-leaf-float pointer-events-none absolute -right-20 bottom-12 w-96 -scale-x-100 rotate-45 text-[#d1a85b]/[0.08]' />

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

        {/* Editorial Text & Security Pillars */}
        <div className='relative z-10 my-auto max-w-lg py-12'>
          <div className='inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1 text-[10px] font-bold uppercase tracking-[2px] text-[#d1a85b] backdrop-blur-sm'>
            <Sparkles size={11} className='text-[#d1a85b]' /> Security &amp; Credential Recovery
          </div>

          <h2 className='mt-6 font-serif text-[clamp(2.5rem,3.4vw,4rem)] font-medium leading-[1.04] tracking-[-0.03em] text-white'>
            Restoring safe access to your sanctuary desk.
          </h2>

          <p className='mt-5 max-w-md text-base leading-relaxed text-[#b5aba0]'>
            Protecting your companions&rsquo; grooming profiles, history records, and reserved sanctuary private slots.
          </p>

          <div className='mt-10 space-y-4 border-t border-white/10 pt-8'>
            <div className='flex items-start gap-3.5'>
              <div className='grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-[#d1a85b]'>
                <KeyRound size={15} />
              </div>
              <div>
                <h3 className='font-serif text-base font-medium text-white'>Encrypted OTP Verification</h3>
                <p className='mt-0.5 text-xs text-[#9c9388]'>Time-limited security codes delivered to your credentials.</p>
              </div>
            </div>

            <div className='flex items-start gap-3.5'>
              <div className='grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-[#d1a85b]'>
                <ShieldCheck size={15} />
              </div>
              <div>
                <h3 className='font-serif text-base font-medium text-white'>Companion Data Privacy</h3>
                <p className='mt-0.5 text-xs text-[#9c9388]'>Coat condition and grooming logs remain strictly confidential.</p>
              </div>
            </div>

            <div className='flex items-start gap-3.5'>
              <div className='grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-[#d1a85b]'>
                <Lock size={15} />
              </div>
              <div>
                <h3 className='font-serif text-base font-medium text-white'>Seamless Account Continuity</h3>
                <p className='mt-0.5 text-xs text-[#9c9388]'>Restore your password without interrupting active bookings.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Notes */}
        <div className='relative z-10 flex items-center justify-between border-t border-white/10 pt-6 text-[10px] uppercase tracking-[2px] text-[#8e857c]'>
          <span>Open Mon – Sat</span>
          <span>Baliuag, Bulacan</span>
        </div>
      </section>

      {/* RIGHT AUTHENTICATION FORM */}
      <main className='relative flex min-h-screen items-center justify-center px-6 py-10 sm:px-10 lg:px-14 xl:px-18'>
        {/* Background Subtle Guides */}
        <svg className='pointer-events-none absolute inset-0 z-0 h-full w-full' viewBox='0 0 800 900' fill='none' preserveAspectRatio='none'>
          <path d='M-50,180 C200,260 400,100 700,220 C900,300 1000,180 1100,240' stroke='#ecdcd0' strokeWidth='1.3' strokeDasharray='5 5' />
          <path d='M-50,580 C250,650 500,510 750,610' stroke='#f2e2d7' strokeWidth='1.1' strokeDasharray='5 5' />
        </svg>

        <div className='relative z-10 w-full max-w-[430px]'>
          {/* Back link */}
          <Link
            to='/login'
            className='gold-underline group mb-8 inline-flex items-center gap-2 pb-0.5 text-xs font-semibold uppercase tracking-[1.5px] text-[#82746b] hover:text-[#24211e]'
          >
            <ArrowLeft size={13} className='text-[#cf7c54] transition-transform duration-300 group-hover:-translate-x-1' />
            Back to Sign In
          </Link>

          {/* Mobile Logo */}
          <div className='mb-7 flex items-center gap-3 lg:hidden'>
            <img
              src='/logo.png'
              alt='TimmyTails'
              className='h-10 w-10 rounded-full object-cover border border-[rgba(210,143,119,0.4)] shadow-xs'
            />
            <span className='font-serif text-2xl font-medium text-[#24211e]'>TimmyTails</span>
          </div>

          {/* ================= STEP 1: REQUEST OTP ================= */}
          {step === 'request' && (
            <div>
              <div className='flex items-center gap-2'>
                <span className='text-[10px] font-bold uppercase tracking-[3px] text-[#a47d44]'>Security Recovery</span>
                <span className='text-xs text-[#cf7c54]'>✦</span>
              </div>
              <h1 className='mt-2 font-serif text-4xl font-medium tracking-tight text-[#24211e] sm:text-5xl'>
                Forgot password?
              </h1>
              <p className='mt-3 text-sm leading-relaxed text-[#635b53]'>
                Enter your registered mobile phone number or email address to receive a 6-digit recovery code.
              </p>

              <form onSubmit={requestOtp} className='mt-7 space-y-4'>
                <div>
                  <label className='mb-1.5 block text-[9px] font-bold uppercase tracking-[1.5px] text-[#a47d44]'>
                    Phone Number or Email
                  </label>
                  <input
                    type='text'
                    name='identifier'
                    value={form.identifier}
                    onChange={update}
                    required
                    placeholder='0917 123 4567 or companion@example.com'
                    autoComplete='username'
                    className='h-12 w-full rounded-md border border-[rgba(210,143,119,0.35)] bg-white px-4 text-sm text-[#24211e] outline-none transition-all placeholder:text-[#a89d95] focus:border-[#d1a85b] focus:ring-2 focus:ring-[#d1a85b]/20'
                  />
                </div>

                <button
                  type='submit'
                  disabled={submitting}
                  className='mt-2 inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-md bg-[#262626] text-xs font-semibold uppercase tracking-[1.5px] text-white shadow-md transition-all duration-300 hover:bg-[#3d3d3d] hover:shadow-lg active:scale-[0.99] disabled:opacity-50'
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className='animate-spin text-[#d1a85b]' /> Sending code…
                    </>
                  ) : (
                    'Send Recovery Code'
                  )}
                </button>
              </form>

              <p className='mt-8 text-center text-xs text-[#82746b]'>
                Remembered your password?{' '}
                <Link to='/login' className='gold-underline font-bold text-[#24211e]'>
                  Sign in here
                </Link>
              </p>
            </div>
          )}

          {/* ================= STEP 2: VERIFY OTP & RESET ================= */}
          {step === 'verify' && (
            <div>
              <div className='flex items-center gap-2'>
                <span className='text-[10px] font-bold uppercase tracking-[3px] text-[#a47d44]'>Authentication</span>
                <span className='text-xs text-[#cf7c54]'>✦</span>
              </div>
              <h1 className='mt-2 font-serif text-4xl font-medium tracking-tight text-[#24211e] sm:text-5xl'>
                Set new password.
              </h1>
              <p className='mt-3 text-sm leading-relaxed text-[#635b53]'>
                Enter the 6-digit verification code sent to <strong className='text-[#24211e]'>{form.identifier}</strong> and define your new login password.
              </p>

              <form onSubmit={resetPassword} className='mt-7 space-y-4'>
                <div>
                  <label className='mb-1.5 block text-[9px] font-bold uppercase tracking-[1.5px] text-[#a47d44]'>
                    6-Digit Verification Code
                  </label>
                  <input
                    type='text'
                    name='otp'
                    value={form.otp}
                    onChange={update}
                    required
                    inputMode='numeric'
                    maxLength={6}
                    placeholder='000000'
                    className='h-12 w-full tracking-[4px] font-mono rounded-md border border-[rgba(210,143,119,0.35)] bg-white px-4 text-sm text-[#24211e] outline-none transition-all placeholder:text-[#a89d95] focus:border-[#d1a85b] focus:ring-2 focus:ring-[#d1a85b]/20'
                  />
                </div>

                <div>
                  <label className='mb-1.5 block text-[9px] font-bold uppercase tracking-[1.5px] text-[#a47d44]'>
                    New Password
                  </label>
                  <div className='relative'>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name='newPassword'
                      value={form.newPassword}
                      onChange={update}
                      required
                      minLength={8}
                      placeholder='At least 8 characters'
                      className='h-12 w-full rounded-md border border-[rgba(210,143,119,0.35)] bg-white pl-4 pr-11 text-sm text-[#24211e] outline-none transition-all placeholder:text-[#a89d95] focus:border-[#d1a85b] focus:ring-2 focus:ring-[#d1a85b]/20'
                    />
                    <button
                      type='button'
                      onClick={() => setShowPassword((p) => !p)}
                      className='absolute right-3 top-1/2 -translate-y-1/2 text-[#82746b] transition-colors hover:text-[#24211e]'
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className='mb-1.5 block text-[9px] font-bold uppercase tracking-[1.5px] text-[#a47d44]'>
                    Confirm New Password
                  </label>
                  <div className='relative'>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name='confirmPassword'
                      value={form.confirmPassword}
                      onChange={update}
                      required
                      placeholder='Repeat your new password'
                      className='h-12 w-full rounded-md border border-[rgba(210,143,119,0.35)] bg-white pl-4 pr-11 text-sm text-[#24211e] outline-none transition-all placeholder:text-[#a89d95] focus:border-[#d1a85b] focus:ring-2 focus:ring-[#d1a85b]/20'
                    />
                    <button
                      type='button'
                      onClick={() => setShowPassword((p) => !p)}
                      className='absolute right-3 top-1/2 -translate-y-1/2 text-[#82746b] transition-colors hover:text-[#24211e]'
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type='submit'
                  disabled={submitting || !canReset}
                  className='mt-2 inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-md bg-[#262626] text-xs font-semibold uppercase tracking-[1.5px] text-white shadow-md transition-all duration-300 hover:bg-[#3d3d3d] hover:shadow-lg active:scale-[0.99] disabled:opacity-50'
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className='animate-spin text-[#d1a85b]' /> Updating credentials…
                    </>
                  ) : (
                    'Update Password'
                  )}
                </button>

                {/* Resend Notice Box */}
                <div className='mt-4 flex items-center justify-between rounded-lg border border-[#ead7ca] bg-[#fdf7f2] p-3.5 text-xs text-[#79584b] shadow-xs'>
                  <span>
                    {otpTimer > 0 ? `Resend code in ${otpTimer}s` : "Didn't receive the OTP?"}
                  </span>
                  <button
                    type='button'
                    onClick={resendPasswordOtp}
                    disabled={submitting || otpTimer > 0}
                    className='gold-underline font-bold uppercase tracking-wider text-[#a47d44] transition hover:text-[#24211e] disabled:opacity-40 disabled:no-underline'
                  >
                    {otpTimer > 0 ? `Wait (${otpTimer}s)` : 'Resend Code'}
                  </button>
                </div>

                <div className='text-center pt-2'>
                  <button
                    type='button'
                    onClick={() => setStep('request')}
                    className='gold-underline text-xs font-semibold text-[#82746b] hover:text-[#24211e]'
                  >
                    &larr; Use a different phone number or email
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ================= STEP 3: SUCCESS ================= */}
          {step === 'success' && (
            <div className='text-center'>
              <div className='mx-auto grid h-14 w-14 place-items-center rounded-full border border-[#d1a85b]/40 bg-white text-[#a47d44] shadow-sm'>
                <CheckCircle2 size={30} />
              </div>

              <div className='mt-5 flex items-center justify-center gap-2'>
                <span className='text-[10px] font-bold uppercase tracking-[3px] text-[#a47d44]'>Updated</span>
                <span className='text-xs text-[#cf7c54]'>✦</span>
              </div>

              <h1 className='mt-2 font-serif text-3xl font-medium tracking-tight text-[#24211e] sm:text-4xl'>
                Password reset complete.
              </h1>
              <p className='mt-3 text-sm leading-relaxed text-[#635b53]'>
                Your companion care credentials have been safely renewed. You can now sign in to your sanctuary desk.
              </p>

              <button
                type='button'
                onClick={() => navigate('/login', { replace: true })}
                className='mt-8 inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-md bg-[#262626] text-xs font-semibold uppercase tracking-[1.5px] text-white shadow-md transition-all duration-300 hover:bg-[#3d3d3d] hover:shadow-lg active:scale-[0.99]'
              >
                Return to Sign In
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}