import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle2,
  ChevronDown,
  Loader2,
  LogOut,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
  X
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { getErrorMessage } from '../utils/api'
import { normalizePhilippinePhone } from '../utils/phone'
import PhoneField from '../components/PhoneField'
import { Botanical } from '../components/editorial/Decorations'

const emptyAddress = { street: '', barangay: '', city: '', province: '' }

export default function Profile() {
  const { user, sendProfilePhoneOtp, updateProfile, logout } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', phone: '', address: emptyAddress })
  const [phoneOtp, setPhoneOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpTimer, setOtpTimer] = useState(0)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Cascading Address Dropdown States
  const [provinces, setProvinces] = useState([])
  const [cities, setCities] = useState([])
  const [barangays, setBarangays] = useState([])

  const [selectedProvinceCode, setSelectedProvinceCode] = useState('')
  const [selectedCityCode, setSelectedCityCode] = useState('')

  const [loadingProvinces, setLoadingProvinces] = useState(false)
  const [loadingCities, setLoadingCities] = useState(false)
  const [loadingBarangays, setLoadingBarangays] = useState(false)

  const handleLogout = () => {
    logout()
    toast.success('Signed out successfully')
    navigate('/')
  }

  useEffect(() => {
    if (otpTimer <= 0) return
    const interval = setInterval(() => setOtpTimer((current) => current - 1), 1000)
    return () => clearInterval(interval)
  }, [otpTimer])

  // Populate form with existing user data
  useEffect(() => {
    if (!user) return
    setForm({
      email: user.email || '',
      phone: user.phone || '',
      address: {
        street: user.address?.street || '',
        barangay: user.address?.barangay || '',
        city: user.address?.city || '',
        province: user.address?.province || ''
      }
    })
  }, [user])

  // Load Philippine Provinces on mount & auto-match existing user province
  useEffect(() => {
    let active = true
    setLoadingProvinces(true)
    fetchProvinces()
      .then((data) => {
        if (!active) return
        setProvinces(data)

        // Pre-resolve province code if user already has an address
        if (user?.address?.province) {
          const matched = data.find(
            (p) => p.name.toLowerCase() === user.address.province.toLowerCase()
          )
          if (matched) {
            setSelectedProvinceCode(matched.code)
            setLoadingCities(true)
            fetchCities(matched.code)
              .then((cityData) => {
                if (!active) return
                setCities(cityData)
                if (user?.address?.city) {
                  const matchedCity = cityData.find(
                    (c) => c.name.toLowerCase() === user.address.city.toLowerCase()
                  )
                  if (matchedCity) {
                    setSelectedCityCode(matchedCity.code)
                    setLoadingBarangays(true)
                    fetchBarangays(matchedCity.code)
                      .then((bgData) => {
                        if (active) setBarangays(bgData)
                      })
                      .finally(() => {
                        if (active) setLoadingBarangays(false)
                      })
                  }
                }
              })
              .finally(() => {
                if (active) setLoadingCities(false)
              })
          }
        }
      })
      .catch((err) => {
        console.error(err)
        toast.error('Could not load provinces list')
      })
      .finally(() => {
        if (active) setLoadingProvinces(false)
      })

    return () => {
      active = false
    }
  }, [user?.address?.province, user?.address?.city])

  const initials = useMemo(() => {
    const first = user?.firstName?.[0] || ''
    const last = user?.lastName?.[0] || ''
    return `${first}${last}`.toUpperCase()
  }, [user])

  const phoneChanged = useMemo(() => {
    if (!user) return false
    const current = normalizePhilippinePhone(form.phone)
    const saved = normalizePhilippinePhone(user.phone || '')
    return Boolean(current && current !== saved)
  }, [form.phone, user])

  const googleAccount = Boolean(user?.googleId)

  const updatePhoneField = (event) => {
    setForm((current) => ({ ...current, phone: event.target.value }))
    setOtpSent(false)
    setPhoneOtp('')
  }

  const updateAddressField = (field, value) => {
    setForm((current) => ({
      ...current,
      address: { ...current.address, [field]: value }
    }))
  }

  // Cascading Selection Handlers
  const handleProvinceChange = (item) => {
    const newCode = item.code
    const newName = item.name

    setSelectedProvinceCode(newCode)
    setSelectedCityCode('')
    setCities([])
    setBarangays([])

    setForm((current) => ({
      ...current,
      address: {
        ...current.address,
        province: newName,
        city: '',
        barangay: ''
      }
    }))

    if (!newCode) return

    setLoadingCities(true)
    fetchCities(newCode)
      .then((data) => setCities(data))
      .catch((err) => {
        console.error(err)
        toast.error('Could not load cities for the selected province')
      })
      .finally(() => setLoadingCities(false))
  }

  const handleCityChange = (item) => {
    const newCode = item.code
    const newName = item.name

    setSelectedCityCode(newCode)
    setBarangays([])

    setForm((current) => ({
      ...current,
      address: {
        ...current.address,
        city: newName,
        barangay: ''
      }
    }))

    if (!newCode) return

    setLoadingBarangays(true)
    fetchBarangays(newCode)
      .then((data) => setBarangays(data))
      .catch((err) => {
        console.error(err)
        toast.error('Could not load barangays for the selected city')
      })
      .finally(() => setLoadingBarangays(false))
  }

  const handleBarangayChange = (item) => {
    updateAddressField('barangay', item.name)
  }

  const requestPhoneOtp = async () => {
    if (!form.phone) {
      toast.error('Please enter a phone number')
      return
    }
    setSendingOtp(true)
    try {
      const data = await sendProfilePhoneOtp(form.phone)
      setOtpSent(true)
      setOtpTimer(60)
      toast.success(data.message || 'Verification code sent to your phone')
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSendingOtp(false)
    }
  }

  const submit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      await updateProfile({
        email: form.email,
        phone: form.phone,
        address: form.address,
        phoneOtp: phoneChanged ? phoneOtp : undefined
      })
      toast.success('Profile updated successfully')
      setOtpSent(false)
      setPhoneOtp('')
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className='relative min-h-screen overflow-hidden bg-[#fdf4ef] text-[#24211e] selection:bg-[#d1a85b]/20'>
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

        @keyframes floatSlow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        .anim-float-bg {
          animation: floatSlow 7s ease-in-out infinite;
        }
      `}</style>

      {/* Background Decorative Curves & Botanicals */}
      <svg className='pointer-events-none absolute inset-0 z-0 h-full w-full' viewBox='0 0 1440 900' fill='none' preserveAspectRatio='none'>
        <path d='M-100,160 C300,240 600,60 980,180 C1250,260 1400,140 1600,200' stroke='#ecdcd0' strokeWidth='1.5' strokeDasharray='5 5' />
        <path d='M-50,420 C350,500 700,320 1080,460 C1300,540 1450,440 1650,480' stroke='#f2e2d7' strokeWidth='1.2' strokeDasharray='5 5' />
      </svg>
      <Botanical className='anim-float-bg pointer-events-none absolute -left-12 top-24 z-0 w-72 text-[#cf7c54] opacity-25' />
      <Botanical className='anim-float-bg pointer-events-none absolute -right-16 top-[650px] z-0 w-96 rotate-12 -scale-x-100 text-[#d1a85b] opacity-20' />

      <div className='relative z-10 mx-auto max-w-[1240px] px-4 py-8 sm:px-6 md:py-12 lg:px-8'>
        {/* Editorial Header */}
        <header className='relative border-b border-[rgba(210,143,119,0.4)] pb-10'>
          <div>
            <div className='flex items-center gap-2'>
              <span className='inline-block text-[10px] font-bold uppercase tracking-[3px] text-[#a47d44]'>
                Account &amp; Profile
              </span>
              <span className='text-xs text-[#cf7c54]'>✦</span>
            </div>
            <h1 className='mt-3 font-serif text-[clamp(2.4rem,5.5vw,4.5rem)] font-medium leading-[1.02] tracking-[-0.03em] text-[#24211e]'>
              Your account, <span className='italic'>profile &amp; details</span>.
            </h1>
            <p className='mt-4 max-w-xl text-base leading-relaxed text-[#635b53]'>
              Update your contact info and home address so you can easily receive appointment updates and reminders.
            </p>
          </div>
        </header>

        {/* Profile Content Layout */}
        <form onSubmit={submit} className='grid gap-10 py-12 lg:grid-cols-[300px_1fr] lg:gap-14 lg:py-16'>
          {/* Sidebar Member Card */}
          <aside className='lg:sticky lg:top-[120px] lg:self-start'>
            <div className='rounded-2xl border border-[rgba(210,143,119,0.35)] bg-white/75 p-6 shadow-[0_8px_24px_rgba(40,26,18,0.03)] backdrop-blur-sm'>
              <div className='flex items-center gap-4'>
                <div className='relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full border border-[rgba(210,143,119,0.4)] bg-[#f7eee6] font-serif text-2xl font-medium text-[#24211e] shadow-sm'>
                  {user?.profileImage ? (
                    <img src={user.profileImage} alt='' className='h-full w-full object-cover' />
                  ) : initials ? (
                    <span>{initials}</span>
                  ) : (
                    <UserRound size={28} strokeWidth={1.2} className='text-[#a47d44]' />
                  )}
                </div>
                <div className='min-w-0'>
                  <div className='flex items-center gap-1.5'>
                    <h2 className='truncate font-serif text-2xl font-medium text-[#24211e]'>
                      {user?.firstName} {user?.lastName}
                    </h2>
                  </div>
                  <p className='mt-0.5 truncate text-xs text-[#82746b]'>{user?.email || user?.phone}</p>
                </div>
              </div>

              <div className='mt-6 border-t border-[rgba(210,143,119,0.2)] pt-4'>
                <button
                  type='button'
                  onClick={handleLogout}
                  className='inline-flex items-center gap-2 text-xs font-medium text-[#934b4b] transition-colors hover:text-[#7d3f3f]'
                >
                  <LogOut size={14} /> Log out
                </button>
              </div>
            </div>
          </aside>

          {/* Form Sections */}
          <div className='space-y-10'>
            {/* Section 1: Personal Information */}
            <AccountSection
              title='Personal Information'
              eyebrow='Account Owner'
              description='Your registered name and contact details for your TimmyTails account.'
            >
              <div className='grid gap-4 sm:grid-cols-2'>
                <ReadOnlyField label='First Name' value={user?.firstName || ''} />
                <ReadOnlyField label='Last Name' value={user?.lastName || ''} />
              </div>

              <div className='mt-4'>
                <Field
                  label='Email Address'
                  type='email'
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  readOnly={googleAccount}
                  required={false}
                  help={
                    googleAccount
                      ? 'This email is linked and verified through your Google account.'
                      : 'Used for appointment confirmations, reminders, and service receipts.'
                  }
                />
              </div>
            </AccountSection>

            {/* Section 2: Mobile Number & Verification */}
            <AccountSection
              title='Mobile Verification'
              eyebrow='Contact Number'
              description='Used for SMS scheduling reminders. Changing your mobile number requires a one-time verification code.'
            >
              <label className='block'>
                <span className='mb-1.5 flex items-center gap-1'>
                  <span className='block text-[9px] font-bold uppercase tracking-[1.5px] text-[#a47d44]'>
                    Mobile Number
                  </span>
                  <span className='text-[#cf7c54]'>*</span>
                </span>
                <PhoneField name='phone' value={form.phone} onChange={updatePhoneField} />
              </label>

              {phoneChanged && (
                <div className='mt-4 rounded-xl border border-[rgba(210,143,119,0.4)] bg-white p-5 shadow-xs'>
                  <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
                    <div className='flex items-start gap-3'>
                      {otpSent ? (
                        <CheckCircle2 size={18} className='mt-0.5 shrink-0 text-[#6f7a4f]' />
                      ) : (
                        <ShieldCheck size={18} className='mt-0.5 shrink-0 text-[#a47d44]' />
                      )}
                      <div>
                        <p className='font-serif text-base font-medium text-[#24211e]'>Verify new phone number</p>
                        <p className='mt-0.5 text-xs text-[#82746b]'>
                          {otpSent
                            ? otpTimer > 0
                              ? `Verification code sent. You can request another in ${otpTimer}s.`
                              : 'Enter the six-digit code below or request another.'
                            : 'A code must be requested to confirm ownership before saving.'}
                        </p>
                      </div>
                    </div>

                    <button
                      type='button'
                      onClick={requestPhoneOtp}
                      disabled={sendingOtp || (otpSent && otpTimer > 0)}
                      className='inline-flex min-h-9 items-center justify-center rounded-md border border-[rgba(210,143,119,0.4)] bg-white px-4 text-xs font-semibold text-[#24211e] shadow-xs transition-colors hover:border-[#a47d44] hover:bg-[#fbf5ee] disabled:opacity-50'
                    >
                      {sendingOtp
                        ? 'Sending…'
                        : otpSent && otpTimer > 0
                        ? `Resend in ${otpTimer}s`
                        : otpSent
                        ? 'Resend Code'
                        : 'Send Code'}
                    </button>
                  </div>

                  {otpSent && (
                    <div className='mt-4'>
                      <Field
                        label='Six-Digit Verification Code'
                        inputMode='numeric'
                        autoComplete='one-time-code'
                        value={phoneOtp}
                        onChange={(event) =>
                          setPhoneOtp(event.target.value.replace(/\D/g, '').slice(0, 6))
                        }
                        minLength={6}
                        maxLength={6}
                        className='text-center tracking-[6px] font-mono text-base'
                      />
                    </div>
                  )}
                </div>
              )}
            </AccountSection>

            {/* Section 3: Cascading Philippine Address */}
            <AccountSection
              title='Home Address'
              eyebrow='Service Location'
              description='Stored with your customer profile for salon coordination, transport assistance, and service records.'
            >
              <div className='space-y-4'>
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
            </AccountSection>

            {/* Form Footer / Submit */}
            <div className='flex flex-col gap-4 border-t border-[rgba(210,143,119,0.3)] pt-6 sm:flex-row sm:items-center sm:justify-between'>
              <p className='text-xs leading-relaxed text-[#82746b]'>
                Changes are saved directly to your TimmyTails customer account.
              </p>
              <button
                type='submit'
                disabled={submitting || (phoneChanged && (!otpSent || phoneOtp.length !== 6))}
                className='inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-[#262626] px-8 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:bg-[#3d3d3d] hover:shadow-lg active:scale-[0.99] disabled:opacity-45'
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className='animate-spin text-[#d1a85b]' /> Saving changes…
                  </>
                ) : (
                  'Save changes'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

function AccountSection({ title, eyebrow, description, children }) {
  return (
    <section className='rounded-2xl border border-[rgba(210,143,119,0.3)] bg-white/70 p-6 sm:p-8 shadow-[0_4px_16px_rgba(40,26,18,0.02)] backdrop-blur-sm'>
      <div className='mb-6'>
        {eyebrow && (
          <span className='block text-[10px] font-bold uppercase tracking-[2.5px] text-[#a47d44]'>
            {eyebrow}
          </span>
        )}
        <h3 className='mt-1 font-serif text-2xl sm:text-3xl font-medium tracking-tight text-[#24211e]'>
          {title}
        </h3>
        {description && <p className='mt-1.5 max-w-xl text-xs leading-relaxed text-[#635b53]'>{description}</p>}
      </div>
      <div>{children}</div>
    </section>
  )
}

function ReadOnlyField({ label, value }) {
  return (
    <label className='block'>
      <span className='mb-1.5 block text-[9px] font-bold uppercase tracking-[1.5px] text-[#a47d44]'>
        {label}
      </span>
      <input
        value={value}
        readOnly
        className='h-12 w-full cursor-not-allowed rounded-md border border-[rgba(210,143,119,0.2)] bg-[#f7ede6]/50 px-4 text-sm font-medium text-[#82746b] outline-none'
      />
    </label>
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
      {help && <span className='mt-1.5 block text-[11px] text-[#82746b]'>{help}</span>}
    </label>
  )
}

/* ==========================================================================
   SEARCHABLE CASCADING DROPDOWN COMPONENT (INLINE)
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
   PHILIPPINE ADDRESS (PSGC) API & CACHE HELPER
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

async function fetchProvinces() {
  const cacheKey = 'provinces_all'
  const cached = getCached(cacheKey)
  if (cached) return cached

  try {
    const res = await fetch(`${API_BASE}/provinces.json`)
    if (!res.ok) throw new Error('Failed to fetch provinces')
    const data = await res.json()

    const formatted = data.map((p) => ({ code: String(p.code), name: p.name }))
    formatted.push({ code: NCR_CODE, name: 'Metro Manila (NCR)' })
    formatted.sort((a, b) => a.name.localeCompare(b.name))

    setCache(cacheKey, formatted)
    return formatted
  } catch (error) {
    console.warn('Using province fallback:', error)
    return [
      { code: '031400000', name: 'Bulacan' },
      { code: '042100000', name: 'Cavite' },
      { code: '043400000', name: 'Laguna' },
      { code: NCR_CODE, name: 'Metro Manila (NCR)' },
      { code: '035400000', name: 'Pampanga' },
      { code: '045800000', name: 'Rizal' }
    ].sort((a, b) => a.name.localeCompare(b.name))
  }
}

async function fetchCities(provinceCode) {
  if (!provinceCode) return []
  const cacheKey = `cities_${provinceCode}`
  const cached = getCached(cacheKey)
  if (cached) return cached

  try {
    const url =
      provinceCode === NCR_CODE
        ? `${API_BASE}/regions/${NCR_CODE}/cities-municipalities.json`
        : `${API_BASE}/provinces/${provinceCode}/cities-municipalities.json`

    const res = await fetch(url)
    if (!res.ok) throw new Error('Failed to fetch cities')
    const data = await res.json()

    const formatted = data.map((c) => ({ code: String(c.code), name: c.name }))
    formatted.sort((a, b) => a.name.localeCompare(b.name))

    setCache(cacheKey, formatted)
    return formatted
  } catch (error) {
    console.warn('Using city fallback:', error)
    return [
      { code: '031403000', name: 'Baliuag' },
      { code: '031410000', name: 'City of Malolos' },
      { code: '031418000', name: 'Pulilan' }
    ]
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