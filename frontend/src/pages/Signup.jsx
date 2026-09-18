import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronDown, HeartHandshake, Loader2, Scissors, Search, ShieldCheck, Sparkles, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { getErrorMessage, warmupBackendServer } from '../utils/api'
import { normalizePhilippinePhone } from '../utils/phone'
import PhoneField from '../components/PhoneField'
import { consumeReturnTo, peekReturnTo, rememberReturnTo, resolvePostLoginRoute } from '../utils/authRouting'
import GoogleSignInButton from '../features/auth/components/GoogleSignInButton'
import { Botanical } from '../components/editorial/Decorations'

const BULACAN_CODE = '031400000'
const BULACAN_PROVINCES = [{ code: BULACAN_CODE, name: 'Bulacan' }]

const initialForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  address: { street: '', barangay: '', city: '', province: 'Bulacan' }
}

export default function Signup() {
  const [form, setForm] = useState(initialForm)
  const [otp, setOtp] = useState('')
  const [otpTimer, setOtpTimer] = useState(0)
  const [step, setStep] = useState('details')
  const [submitting, setSubmitting] = useState(false)

  // Address Dropdown States - locked to Bulacan
  const [provinces, setProvinces] = useState(BULACAN_PROVINCES)
  const [cities, setCities] = useState([])
  const [barangays, setBarangays] = useState([])

  const [selectedProvinceCode, setSelectedProvinceCode] = useState(BULACAN_CODE)
  const [selectedCityCode, setSelectedCityCode] = useState('')

  const [loadingProvinces, setLoadingProvinces] = useState(false)
  const [loadingCities, setLoadingCities] = useState(false)
  const [loadingBarangays, setLoadingBarangays] = useState(false)

  useEffect(() => {
    warmupBackendServer()
  }, [])

  // Load Bulacan Cities on Mount
  useEffect(() => {
    let active = true
    setLoadingCities(true)
    fetchCities(BULACAN_CODE)
      .then((data) => {
        if (active) setCities(data)
      })
      .catch((err) => {
        console.error(err)
        toast.error('Could not load Bulacan cities list')
      })
      .finally(() => {
        if (active) setLoadingCities(false)
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (otpTimer <= 0) return
    const interval = setInterval(() => {
      setOtpTimer((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [otpTimer])

  const { sendRegisterOtp, register, googleLogin } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const requestedReturnTo = useMemo(() => {
    const statePath = location.state?.returnTo
    if (statePath) rememberReturnTo(statePath)
    return statePath || peekReturnTo()
  }, [location.state])

  const routeAfterAuth = useCallback((user) => {
    const returnTo = consumeReturnTo() || requestedReturnTo
    if (!user?.profileCompleted && returnTo) rememberReturnTo(returnTo)
    navigate(resolvePostLoginRoute({ user, returnTo }), { replace: true })
  }, [navigate, requestedReturnTo])

  const update = (e) => setForm((c) => ({ ...c, [e.target.name]: e.target.value }))
  const updateAddressField = (field, value) => {
    setForm((c) => ({
      ...c,
      address: { ...c.address, [field]: value }
    }))
  }

  // Hierarchy Step 1: Province Change (Resets City & Barangay)
  const handleProvinceChange = (item) => {
    const newProvinceCode = item.code
    const newProvinceName = item.name

    setSelectedProvinceCode(newProvinceCode)
    setSelectedCityCode('')
    setCities([])
    setBarangays([])

    setForm((c) => ({
      ...c,
      address: {
        ...c.address,
        province: newProvinceName,
        city: '',
        barangay: ''
      }
    }))

    if (!newProvinceCode) return

    setLoadingCities(true)
    fetchCities(newProvinceCode)
      .then((data) => setCities(data))
      .catch((err) => {
        console.error(err)
        toast.error('Could not load cities for the selected province')
      })
      .finally(() => setLoadingCities(false))
  }

  // Hierarchy Step 2: City Change (Resets Barangay)
  const handleCityChange = (item) => {
    const newCityCode = item.code
    const newCityName = item.name

    setSelectedCityCode(newCityCode)
    setBarangays([])

    setForm((c) => ({
      ...c,
      address: {
        ...c.address,
        city: newCityName,
        barangay: ''
      }
    }))

    if (!newCityCode) return

    setLoadingBarangays(true)
    fetchBarangays(newCityCode)
      .then((data) => setBarangays(data))
      .catch((err) => {
        console.error(err)
        toast.error('Could not load barangays for the selected city')
      })
      .finally(() => setLoadingBarangays(false))
  }

  // Hierarchy Step 3: Barangay Change
  const handleBarangayChange = (item) => {
    updateAddressField('barangay', item.name)
  }

  const requestOtp = async (e) => {
    e.preventDefault()

    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    const normalizedPhone = normalizePhilippinePhone(form.phone)
    if (!normalizedPhone) {
      toast.error('Enter a valid mobile number using +63 or 09 format')
      return
    }

    if (!form.address.province) {
      toast.error('Please select your Province')
      return
    }
    if (!form.address.city) {
      toast.error('Please select your City / Municipality')
      return
    }
    if (!form.address.barangay) {
      toast.error('Please select your Barangay')
      return
    }
    if (!form.address.street.trim()) {
      toast.error('Please enter your Street / House Number')
      return
    }

    if (!form.email.trim()) {
      toast.error('Please enter your Email Address')
      return
    }

    setSubmitting(true)
    try {
      await sendRegisterOtp({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email.trim(),
        phone: normalizedPhone,
        address: form.address,
        password: form.password
      })
      setForm((c) => ({ ...c, phone: normalizedPhone }))
      setStep('otp')
      setOtpTimer(60)
      toast.success('Verification code sent to your email')
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  const resendOtp = async () => {
    if (otpTimer > 0 || submitting) return
    setSubmitting(true)
    try {
      await sendRegisterOtp({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email.trim() || undefined,
        phone: form.phone,
        address: form.address,
        password: form.password
      })
      setOtpTimer(60)
      toast.success('New verification code sent to your email')
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  const verifyOtp = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const data = await register(normalizePhilippinePhone(form.phone), otp)
      toast.success('Account created')
      routeAfterAuth(data.user)
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  const handleGoogle = useCallback(async (credential) => {
    setSubmitting(true)
    try {
      const data = await googleLogin(credential)
      routeAfterAuth(data.user)
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }, [googleLogin, routeAfterAuth])

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

      {/* LEFT SHOWCASE PANEL */}
      <section className='relative hidden min-h-screen overflow-hidden bg-[#1c1a18] text-[#f7f1ea] lg:flex lg:flex-col lg:justify-between lg:p-14 xl:p-16'>
        <div className='pointer-events-none absolute left-12 top-0 h-full w-px bg-white/5' aria-hidden='true' />
        <div className='pointer-events-none absolute right-12 top-0 h-full w-px bg-white/5' aria-hidden='true' />

        <Botanical className='anim-leaf-float pointer-events-none absolute -left-20 top-1/2 -translate-y-1/2 w-80 rotate-12 text-white/[0.04]' />
        <Botanical className='anim-leaf-float pointer-events-none absolute -right-20 bottom-12 w-96 -scale-x-100 rotate-45 text-[#d1a85b]/[0.08]' />

        {/* Header Logo */}
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

        {/* Editorial Text & Sanctuary Highlights */}
        <div className='relative z-10 my-auto max-w-lg py-12'>
          <div className='inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1 text-[10px] font-bold uppercase tracking-[2px] text-[#d1a85b] backdrop-blur-sm'>
            <Sparkles size={11} className='text-[#d1a85b]' /> Sanctuary Registration
          </div>

          <h2 className='mt-6 font-serif text-[clamp(2.5rem,3.4vw,4rem)] font-medium leading-[1.04] tracking-[-0.03em] text-white'>
            Begin a quiet, dedicated standard of grooming care.
          </h2>

          <p className='mt-5 max-w-md text-base leading-relaxed text-[#b5aba0]'>
            Register once to preserve your companion’s health records, haircut references, and tailored handling notes across every visit.
          </p>

          <div className='mt-10 space-y-4 border-t border-white/10 pt-8'>
            <div className='flex items-start gap-3.5'>
              <div className='grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-[#d1a85b]'>
                <HeartHandshake size={15} />
              </div>
              <div>
                <h3 className='font-serif text-base font-medium text-white'>Gentle, Patient Handling</h3>
                <p className='mt-0.5 text-xs text-[#9c9388]'>Every ritual is adapted to your companion's temper.</p>
              </div>
            </div>

            <div className='flex items-start gap-3.5'>
              <div className='grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-[#d1a85b]'>
                <ShieldCheck size={15} />
              </div>
              <div>
                <h3 className='font-serif text-base font-medium text-white'>Cage-Free Sanctuary</h3>
                <p className='mt-0.5 text-xs text-[#9c9388]'>Calm, dedicated care suites with zero chaotic waiting.</p>
              </div>
            </div>

            <div className='flex items-start gap-3.5'>
              <div className='grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-[#d1a85b]'>
                <Scissors size={15} />
              </div>
              <div>
                <h3 className='font-serif text-base font-medium text-white'>Tailored Breed Styling</h3>
                <p className='mt-0.5 text-xs text-[#9c9388]'>Precision hand-sculpting for dogs and cats alike.</p>
              </div>
            </div>
          </div>
        </div>

        <div className='relative z-10 flex items-center justify-between border-t border-white/10 pt-6 text-[10px] uppercase tracking-[2px] text-[#8e857c]'>
          <span>Open Mon – Sat</span>
          <span>Baliuag, Bulacan</span>
        </div>
      </section>

      {/* RIGHT REGISTRATION FORM */}
      <main className='relative flex min-h-screen items-start justify-center px-6 py-12 sm:px-10 sm:py-16 lg:overflow-y-auto lg:px-14 xl:px-18'>
        <svg className='pointer-events-none absolute inset-0 z-0 h-full w-full' viewBox='0 0 800 1100' fill='none' preserveAspectRatio='none'>
          <path d='M-50,180 C200,260 400,100 700,220 C900,300 1000,180 1100,240' stroke='#ecdcd0' strokeWidth='1.3' strokeDasharray='5 5' />
          <path d='M-50,680 C250,750 500,610 750,710' stroke='#f2e2d7' strokeWidth='1.1' strokeDasharray='5 5' />
        </svg>

        <div className='relative z-10 w-full max-w-[540px]'>
          <Link
            to='/'
            className='gold-underline group mb-8 inline-flex items-center gap-2 pb-0.5 text-xs font-semibold uppercase tracking-[1.5px] text-[#82746b] hover:text-[#24211e]'
          >
            <ArrowLeft size={13} className='text-[#cf7c54] transition-transform duration-300 group-hover:-translate-x-1' />
            Back to sanctuary home
          </Link>

          <div className='mb-7 flex items-center gap-3 lg:hidden'>
            <img
              src='/logo.png'
              alt='TimmyTails'
              className='h-10 w-10 rounded-full object-cover border border-[rgba(210,143,119,0.4)] shadow-xs'
            />
            <span className='font-serif text-2xl font-medium text-[#24211e]'>TimmyTails</span>
          </div>

          <div>
            <div className='flex items-center gap-2'>
              <span className='text-[10px] font-bold uppercase tracking-[3px] text-[#a47d44]'>
                {step === 'details' ? 'Sanctuary Registry' : 'Mobile Verification'}
              </span>
              <span className='text-xs text-[#cf7c54]'>✦</span>
            </div>
            <h1 className='mt-2 font-serif text-4xl font-medium tracking-tight text-[#24211e] sm:text-5xl'>
              {step === 'details' ? 'Create your account.' : 'Verify your number.'}
            </h1>
            <p className='mt-3 text-sm leading-relaxed text-[#635b53]'>
              {step === 'details'
                ? 'Register with Google or verify your mobile number to begin scheduling rituals.'
                : `We have sent a six-digit verification code to ${form.phone}.`}
            </p>
          </div>

          {step === 'details' ? (
            <>
              <div className='mt-8 flex w-full justify-center'>
                <GoogleSignInButton onCredential={handleGoogle} disabled={submitting} text='signup_with' />
              </div>

              <div className='my-7 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[2px] text-[#82746b]'>
                <span className='h-px flex-1 bg-[rgba(210,143,119,0.3)]' />
                <span>or register with details</span>
                <span className='h-px flex-1 bg-[rgba(210,143,119,0.3)]' />
              </div>

              <form onSubmit={requestOtp} className='space-y-4'>
                <div className='grid gap-4 sm:grid-cols-2'>
                  <Field label='First Name' name='firstName' value={form.firstName} onChange={update} />
                  <Field label='Last Name' name='lastName' value={form.lastName} onChange={update} />
                </div>

                <div className='grid gap-4 sm:grid-cols-2'>
                  <Field
                    label='Email Address'
                    name='email'
                    type='email'
                    required={true}
                    value={form.email}
                    onChange={update}
                    help='A 6-digit verification code will be sent to this email.'
                  />
                  <div>
                    <label className='block'>
                      <span className='mb-1.5 flex items-center gap-1'>
                        <span className='block text-[9px] font-bold uppercase tracking-[1.5px] text-[#a47d44]'>
                          Mobile Number
                        </span>
                        <span className='text-[#cf7c54]'>*</span>
                      </span>
                      <PhoneField
                        label=''
                        name='phone'
                        value={form.phone}
                        onChange={update}
                        placeholder='917 123 4567'
                      />
                    </label>
                    <span className='mt-1 block text-[11px] text-[#82746b]'>
                      Used for appointment updates and SMS reminders.
                    </span>
                  </div>
                </div>

                {/* Cascading Philippine Address Section */}
                <div className='rounded-xl border border-[rgba(210,143,119,0.3)] bg-white/70 p-5 shadow-[0_4px_16px_rgba(40,26,18,0.02)] backdrop-blur-sm'>
                  <div className='flex items-center gap-2'>
                    <h2 className='font-serif text-base font-medium text-[#24211e]'>Home Address</h2>
                    <span className='text-[10px] text-[#cf7c54]'>✦</span>
                  </div>
                  <p className='mt-0.5 text-xs text-[#82746b]'>Used for appointment record & verification.</p>

                  <div className='mt-4 space-y-4'>
                    {/* Row 1: Province & City/Municipality */}
                    <div className='grid gap-4 sm:grid-cols-2'>
                      <AddressSelect
                        label='Province'
                        options={provinces}
                        value={form.address.province}
                        onChange={handleProvinceChange}
                        placeholder='Select Province'
                        loading={loadingProvinces}
                        searchPlaceholder='Search province...'
                      />

                      <AddressSelect
                        label='City / Municipality'
                        options={cities}
                        value={form.address.city}
                        onChange={handleCityChange}
                        placeholder={
                          !selectedProvinceCode
                            ? 'Select Province First'
                            : loadingCities
                            ? 'Loading cities...'
                            : 'Select City / Municipality'
                        }
                        disabled={!selectedProvinceCode || loadingCities}
                        loading={loadingCities}
                        searchPlaceholder='Search city or municipality...'
                      />
                    </div>

                    {/* Row 2: Barangay & Street / House Number */}
                    <div className='grid gap-4 sm:grid-cols-2'>
                      <AddressSelect
                        label='Barangay'
                        options={barangays}
                        value={form.address.barangay}
                        onChange={handleBarangayChange}
                        placeholder={
                          !selectedCityCode
                            ? 'Select City / Municipality First'
                            : loadingBarangays
                            ? 'Loading barangays...'
                            : 'Select Barangay'
                        }
                        disabled={!selectedCityCode || loadingBarangays}
                        loading={loadingBarangays}
                        searchPlaceholder='Search barangay...'
                      />

                      <Field
                        label='Street / House Number'
                        name='street'
                        value={form.address.street}
                        onChange={(e) => updateAddressField('street', e.target.value)}
                        placeholder='House no., street, subdivision...'
                      />
                    </div>
                  </div>
                </div>

                {/* Password Fields */}
                <div className='grid gap-4 sm:grid-cols-2'>
                  <Field
                    label='Password'
                    name='password'
                    type='password'
                    value={form.password}
                    onChange={update}
                    minLength={8}
                  />
                  <Field
                    label='Confirm Password'
                    name='confirmPassword'
                    type='password'
                    value={form.confirmPassword}
                    onChange={update}
                    minLength={8}
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
                    'Send Verification Code'
                  )}
                </button>
              </form>
            </>
          ) : (
            /* Step 2: OTP Verification */
            <form onSubmit={verifyOtp} className='mt-8 space-y-4'>
              <div className='rounded-lg border border-[#cdbd86] bg-[#fdf8eb] p-4 text-xs leading-relaxed text-[#675728] shadow-xs'>
                Enter the six-digit code sent to <strong className='font-semibold text-[#24211e]'>{form.email}</strong> to confirm and activate your companion registry.
              </div>

              <Field
                label='Six-Digit Verification Code'
                name='otp'
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode='numeric'
                minLength={6}
                maxLength={6}
                className='text-center tracking-[6px] text-lg font-mono'
              />

              <button
                type='submit'
                disabled={submitting || otp.length !== 6}
                className='inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-md bg-[#262626] text-xs font-semibold uppercase tracking-[1.5px] text-white shadow-md transition-all duration-300 hover:bg-[#3d3d3d] hover:shadow-lg active:scale-[0.99] disabled:opacity-50'
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className='animate-spin text-[#d1a85b]' /> Confirming…
                  </>
                ) : (
                  'Verify & Create Account'
                )}
              </button>

              <div className='flex items-center justify-between rounded-lg border border-[rgba(210,143,119,0.3)] bg-white/70 p-3.5 text-xs text-[#82746b]'>
                <span>{otpTimer > 0 ? `Resend code in ${otpTimer}s` : "Didn't receive the code?"}</span>
                <button
                  type='button'
                  onClick={resendOtp}
                  disabled={submitting || otpTimer > 0}
                  className='font-bold text-[#a47d44] transition hover:text-[#24211e] disabled:opacity-40'
                >
                  {otpTimer > 0 ? `Resend (${otpTimer}s)` : 'Resend Code'}
                </button>
              </div>

              <button
                type='button'
                onClick={() => setStep('details')}
                className='gold-underline w-full pt-2 text-center text-xs font-semibold text-[#82746b] hover:text-[#24211e]'
              >
                &larr; Edit Registration Details
              </button>
            </form>
          )}

          <p className='mt-8 text-center text-xs text-[#82746b]'>
            Already registered with us?{' '}
            <Link
              to='/login'
              state={{ returnTo: requestedReturnTo }}
              className='gold-underline font-bold text-[#24211e]'
            >
              Sign in to your care desk
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}

function Field({ label, help, required = true, className = '', ...props }) {
  return (
    <label className='block'>
      <span className='mb-1.5 flex items-center gap-1'>
        <span className='block text-[9px] font-bold uppercase tracking-[1.5px] text-[#a47d44]'>
          {label}
        </span>
        {required && <span className='text-[#cf7c54]'>*</span>}
      </span>
      <input
        required={required}
        className={`h-12 w-full rounded-md border border-[rgba(210,143,119,0.35)] bg-white px-4 text-sm text-[#24211e] outline-none transition-all focus:border-[#d1a85b] focus:ring-2 focus:ring-[#d1a85b]/20 ${className}`}
        {...props}
      />
      {help && <span className='mt-1 block text-[11px] text-[#82746b]'>{help}</span>}
    </label>
  )
}

/* ==========================================================================
   INTERNAL SEARCHABLE DROPDOWN COMPONENT
========================================================================== */
function AddressSelect({
  label,
  options = [],
  value = '',
  onChange,
  placeholder = 'Select...',
  disabled = false,
  loading = false,
  required = true,
  searchPlaceholder = 'Search...'
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef(null)
  const searchInputRef = useRef(null)
  const id = useId()

  useEffect(() => {
    if (!open) return
    const onMouseDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  useEffect(() => {
    if (open) {
      setSearch('')
      setTimeout(() => searchInputRef.current?.focus(), 40)
    }
  }, [open])

  const filtered = useMemo(() => {
    if (!search.trim()) return options
    const query = search.toLowerCase()
    return options.filter((item) => item.name.toLowerCase().includes(query))
  }, [options, search])

  const handleSelect = (item) => {
    onChange(item)
    setOpen(false)
  }

  const handleClear = (e) => {
    e.stopPropagation()
    onChange({ code: '', name: '' })
  }

  return (
    <div className='relative' ref={containerRef}>
      <label htmlFor={id} className='mb-1.5 flex items-center gap-1'>
        <span className='block text-[9px] font-bold uppercase tracking-[1.5px] text-[#a47d44]'>
          {label}
        </span>
        {required && <span className='text-[#cf7c54]'>*</span>}
      </label>

      <button
        id={id}
        type='button'
        disabled={disabled || loading}
        onClick={() => setOpen((prev) => !prev)}
        className={`flex h-12 w-full items-center justify-between rounded-md border px-4 text-left text-sm transition-all outline-none ${
          disabled
            ? 'cursor-not-allowed border-[rgba(210,143,119,0.2)] bg-[#f7ede6]/50 text-[#a59a8f]'
            : open
            ? 'border-[#d1a85b] bg-white ring-2 ring-[#d1a85b]/20'
            : 'border-[rgba(210,143,119,0.35)] bg-white text-[#24211e] hover:border-[#a47d44]'
        }`}
        aria-haspopup='listbox'
        aria-expanded={open}
      >
        <span className={`truncate ${!value ? 'text-[#a59a8f]' : 'text-[#24211e]'}`}>
          {loading ? (
            <span className='flex items-center gap-2 italic text-[#82746b]'>
              <Loader2 size={14} className='animate-spin text-[#d1a85b]' />
              Loading options...
            </span>
          ) : (
            value || placeholder
          )}
        </span>

        <span className='ml-2 flex shrink-0 items-center gap-1 text-[#82746b]'>
          {value && !disabled && !loading && (
            <span
              role='button'
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => e.key === 'Enter' && handleClear(e)}
              className='grid h-5 w-5 place-items-center rounded-full hover:bg-[rgba(210,143,119,0.15)] hover:text-[#24211e]'
              title='Clear'
            >
              <X size={12} />
            </span>
          )}
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 ${open ? 'rotate-180 text-[#a47d44]' : ''}`}
          />
        </span>
      </button>

      {open && !disabled && !loading && (
        <div
          className='absolute left-0 top-full z-50 mt-1.5 w-full rounded-md border border-[rgba(210,143,119,0.35)] bg-white shadow-xl transition-all'
          role='listbox'
        >
          <div className='flex items-center border-b border-[rgba(210,143,119,0.2)] bg-[#fdf4ef]/80 px-3 py-2'>
            <Search size={14} className='mr-2 text-[#a47d44]' />
            <input
              ref={searchInputRef}
              type='text'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className='w-full bg-transparent text-xs text-[#24211e] placeholder:text-[#a59a8f] outline-none'
            />
            {search && (
              <button type='button' onClick={() => setSearch('')} className='text-[#82746b] hover:text-[#24211e]'>
                <X size={12} />
              </button>
            )}
          </div>

          <div className='max-h-56 overflow-y-auto divide-y divide-[rgba(210,143,119,0.1)] py-1'>
            {filtered.length > 0 ? (
              filtered.map((item) => {
                const isSelected = item.name.toLowerCase() === value.toLowerCase()
                return (
                  <button
                    key={item.code}
                    type='button'
                    role='option'
                    aria-selected={isSelected}
                    onClick={() => handleSelect(item)}
                    className={`flex w-full items-center justify-between px-3.5 py-2.5 text-left text-xs transition-colors ${
                      isSelected
                        ? 'bg-[#fdf4ef] font-semibold text-[#a47d44]'
                        : 'text-[#24211e] hover:bg-[#fdf4ef] hover:text-[#a47d44]'
                    }`}
                  >
                    <span>{item.name}</span>
                    {isSelected && <span className='text-[10px] text-[#d1a85b]'>✦</span>}
                  </button>
                )
              })
            ) : (
              <div className='px-4 py-6 text-center text-xs text-[#82746b]'>
                No locations match &ldquo;{search}&rdquo;
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ==========================================================================
   PHILIPPINE ADDRESS (PSGC) API & RESILIENT CACHE HELPER
========================================================================== */
const API_BASE = 'https://psgc.gitlab.io/api'
const memoryCache = new Map()
const NCR_CODE = '130000000'

function getCached(key) {
  if (memoryCache.has(key)) return memoryCache.get(key)
  try {
    const sessionVal = sessionStorage.getItem(`psgc_${key}`)
    if (sessionVal) {
      const parsed = JSON.parse(sessionVal)
      memoryCache.set(key, parsed)
      return parsed
    }
  } catch { /* Session storage is optional; keep the in-memory cache available. */ }
  return null
}

function setCache(key, data) {
  memoryCache.set(key, data)
  try {
    sessionStorage.setItem(`psgc_${key}`, JSON.stringify(data))
  } catch { /* Session storage is optional; keep the in-memory cache available. */ }
}

const BULACAN_CITIES_FALLBACK = [
  { code: '031401000', name: 'Angat' },
  { code: '031402000', name: 'Balagtas' },
  { code: '031403000', name: 'Baliuag' },
  { code: '031404000', name: 'Bocaue' },
  { code: '031405000', name: 'Bulakan' },
  { code: '031406000', name: 'Bustos' },
  { code: '031407000', name: 'Calumpit' },
  { code: '031408000', name: 'Doña Remedios Trinidad' },
  { code: '031409000', name: 'Guiguinto' },
  { code: '031410000', name: 'City of Malolos' },
  { code: '031411000', name: 'Marilao' },
  { code: '031412000', name: 'City of Meycauayan' },
  { code: '031413000', name: 'Norzagaray' },
  { code: '031414000', name: 'Obando' },
  { code: '031415000', name: 'Pandi' },
  { code: '031416000', name: 'Paombong' },
  { code: '031417000', name: 'Plaridel' },
  { code: '031418000', name: 'Pulilan' },
  { code: '031419000', name: 'City of San Jose del Monte' },
  { code: '031420000', name: 'San Ildefonso' },
  { code: '031421000', name: 'San Miguel' },
  { code: '031422000', name: 'San Rafael' },
  { code: '031423000', name: 'Santa Maria' }
]

async function fetchProvinces() {
  return BULACAN_PROVINCES
}

async function fetchCities(provinceCode = BULACAN_CODE) {
  const code = provinceCode || BULACAN_CODE
  const cacheKey = `cities_${code}`
  const cached = getCached(cacheKey)
  if (cached) return cached

  try {
    const res = await fetch(`${API_BASE}/provinces/${code}/cities-municipalities.json`)
    if (!res.ok) throw new Error('Failed to fetch cities')
    const data = await res.json()

    const formatted = data.map((c) => ({ code: String(c.code), name: c.name }))
    formatted.sort((a, b) => a.name.localeCompare(b.name))

    setCache(cacheKey, formatted)
    return formatted
  } catch (error) {
    console.warn('Using Bulacan city fallback:', error)
    return BULACAN_CITIES_FALLBACK
  }
}

async function fetchBarangays(cityCode) {
  if (!cityCode) return []
  const cacheKey = `barangays_${cityCode}`
  const cached = getCached(cacheKey)
  if (cached) return cached

  try {
    const res = await fetch(`${API_BASE}/cities-municipalities/${cityCode}/barangays.json`)
    if (!res.ok) throw new Error('Failed to fetch barangays')
    const data = await res.json()

    const formatted = data.map((b) => ({ code: String(b.code), name: b.name }))
    formatted.sort((a, b) => a.name.localeCompare(b.name))

    setCache(cacheKey, formatted)
    return formatted
  } catch (error) {
    console.warn('Using barangay fallback:', error)
    return [
      { code: '031403001', name: 'Bagong Nayon' },
      { code: '031403004', name: 'Concepcion' },
      { code: '031403013', name: 'Poblacion' },
      { code: '031403014', name: 'Sabang' },
      { code: '031403022', name: 'Subic' }
    ]
  }
}