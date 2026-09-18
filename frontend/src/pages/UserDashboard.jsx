import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  Ban,
  CalendarDays,
  ChevronRight,
  Clock3,
  Plus,
  Scissors
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { appointmentsApi, getErrorMessage, petsApi } from '../utils/api'
import { formatDateLong, formatTimeRange } from '../features/booking/utils/dateTime'
import AppointmentDetailsModal from '../components/AppointmentDetailsModal'
import ConfirmModal from '../components/ConfirmModal'
import RescheduleModal from '../components/RescheduleModal'
import { Botanical } from '../components/editorial/Decorations'

const appointmentDate = (appointment, useEnd = false) => {
  const directValue = useEnd ? appointment.endAt : appointment.startAt
  if (directValue) return new Date(directValue)
  const time = useEnd ? (appointment.endTime || appointment.time) : appointment.time
  if (!appointment.date || !time) return new Date(0)
  return new Date(`${appointment.date}T${time}:00+08:00`)
}

const STATUS = {
  confirmed: { label: 'Approved', className: 'border-[#cdbd86] bg-[#fdf8eb] text-[#675728]' },
  completed: { label: 'Completed', className: 'border-[rgba(210,143,119,0.3)] bg-[#f7ebe1] text-[#7a6f66]' },
  cancelled: { label: 'Cancelled', className: 'border-[#e8c5c5] bg-[#fbefef] text-[#934b4b]' },
  pending: { label: 'Pending review', className: 'border-[#ead7ca] bg-[#f9eee7] text-[#79584b]' }
}

export default function UserDashboard() {
  const { user, refreshUser } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [pets, setPets] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [confirmCancelAppointment, setConfirmCancelAppointment] = useState(null)
  const [rescheduleAppointment, setRescheduleAppointment] = useState(null)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => { if (refreshUser) refreshUser() }, [refreshUser])

  useEffect(() => {
    if (user?.accountStatus === 'banned') {
      localStorage.removeItem('token')
      const msg = encodeURIComponent(user.statusReason || 'Your customer account has been suspended by salon administration.')
      if (window.location.pathname !== '/login') window.location.href = `/login?reason=banned&msg=${msg}`
    }
  }, [user])

  const loadData = () => {
    setLoading(true)
    Promise.all([appointmentsApi.getMy(), petsApi.getMine()])
      .then(([appointmentResult, petResult]) => {
        setAppointments(appointmentResult.data.appointments || [])
        setPets(petResult.data.pets || [])
      })
      .catch((error) => {
        if (error.response?.status === 403) {
          localStorage.removeItem('token')
          const msg = encodeURIComponent(error.response?.data?.message || 'Your customer account has been suspended by salon administration.')
          window.location.href = `/login?reason=banned&msg=${msg}`
        }
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [])

  const upcoming = useMemo(() => appointments
    .filter((appointment) => ['pending', 'confirmed'].includes(appointment.status) && appointmentDate(appointment, true) >= new Date())
    .sort((a, b) => appointmentDate(a) - appointmentDate(b)), [appointments])

  const recentVisits = useMemo(() => appointments
    .filter((appointment) => !upcoming.some((item) => item._id === appointment._id))
    .sort((a, b) => appointmentDate(b) - appointmentDate(a))
    .slice(0, 4), [appointments, upcoming])

  const nextAppointment = upcoming[0]
  const completedCount = appointments.filter((appointment) => appointment.status === 'completed').length

  const handleConfirmCancel = async () => {
    if (!confirmCancelAppointment) return
    setCancelling(true)
    try {
      await appointmentsApi.cancel(confirmCancelAppointment._id)
      toast.success('Appointment cancelled successfully')
      setConfirmCancelAppointment(null)
      await loadData()
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className='relative min-h-screen overflow-hidden bg-[#fdf4ef] text-[#24211e] selection:bg-[#d1a85b]/20'>
      <style>{`
        /* ======================================================
           MINIMAL ANIMATIONS & EDITORIAL TRANSITIONS
        ====================================================== */
        .editorial-arch {
          border-radius: 160px 160px 12px 12px;
          border: 1px solid rgba(210, 143, 119, 0.45);
          outline: 5px solid rgba(255, 255, 255, 0.7);
          outline-offset: 3px;
          overflow: hidden;
          position: relative;
        }

        .editorial-card-hover {
          position: relative;
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s ease, border-color 0.35s ease;
        }

        .editorial-card-hover:hover {
          transform: translateY(-5px);
          box-shadow: 0 18px 40px rgba(71, 46, 31, 0.08);
          border-color: rgba(207, 124, 84, 0.4);
        }

        .editorial-card-hover::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #cf7c54, #d1a85b);
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: 10;
        }

        .editorial-card-hover:hover::before {
          opacity: 1;
        }

        /* Gold sliding underline mula sa Header.jsx */
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

        /* Botanical leaf gentle sway */
        @keyframes subtleLeafSway {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(4deg) scale(1.02); }
        }

        .group:hover .anim-botanical-sway {
          animation: subtleLeafSway 3s ease-in-out infinite;
          transform-origin: bottom center;
        }

        /* Gentle paw pulse */
        @keyframes pawGentlePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }

        .group:hover .anim-paw-pulse {
          animation: pawGentlePulse 2s ease-in-out infinite;
          transform-origin: center;
        }

        /* Cat tail subtle wave */
        @keyframes catTailWave {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-5deg); }
        }

        .group:hover .anim-cat-tail {
          animation: catTailWave 2.4s ease-in-out infinite;
          transform-origin: 56px 74px;
        }

        /* Floating background botanicals */
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        .anim-float-bg {
          animation: floatSlow 7s ease-in-out infinite;
        }
      `}</style>

      {/* Decorative Background Curves & Botanicals mula sa Home.jsx */}
      <svg className='pointer-events-none absolute inset-0 z-0 h-full w-full' viewBox='0 0 1440 900' fill='none' preserveAspectRatio='none'>
        <path d='M-100,160 C300,240 600,60 980,180 C1250,260 1400,140 1600,200' stroke='#ecdcd0' strokeWidth='1.5' strokeDasharray='5 5' />
        <path d='M-50,420 C350,500 700,320 1080,460 C1300,540 1450,440 1650,480' stroke='#f2e2d7' strokeWidth='1.2' strokeDasharray='5 5' />
      </svg>
      <Botanical className='anim-float-bg pointer-events-none absolute -left-12 top-24 z-0 w-72 text-[#cf7c54] opacity-25' />
      <Botanical className='anim-float-bg pointer-events-none absolute -right-16 top-[650px] z-0 w-96 rotate-12 -scale-x-100 text-[#d1a85b] opacity-20' />

      <div className='relative z-10 mx-auto max-w-[1280px] px-4 py-8 sm:px-6 md:py-12 lg:px-8'>
        {/* HERO SECTION: Editorial Sanctuary Welcome */}
        <header className='relative border-b border-[rgba(210,143,119,0.4)] pb-10'>
          <div className='flex flex-col justify-between gap-8 md:flex-row md:items-end'>
            <div>
              <div className='flex items-center gap-2'>
                <span className='inline-block text-[10px] font-bold tracking-[2px] text-[#a47d44]'>
                  TimmyTails Pet Care
                </span>
                <span className='text-xs text-[#cf7c54]'>✦</span>
              </div>
              <h1 className='mt-3 font-serif text-[clamp(2.4rem,5vw,4.5rem)] font-medium leading-[1.05] tracking-[-0.025em] text-[#24211e]'>
                Good to see you, <span className='italic'>{user?.firstName}</span>.
              </h1>
              <p className='mt-4 max-w-xl text-base leading-relaxed text-[#635b53]'>
                Here's everything about your pets and upcoming appointments — all in one place.
              </p>

              {/* Sanctuary Highlights */}
              <div className='mt-6 flex flex-wrap items-center gap-8 text-sm'>
                <div className='flex items-center gap-2 transition-transform duration-300 hover:scale-105'>
                  <span className='font-serif text-2xl font-semibold text-[#24211e]'>{pets.length}</span>
                  <span className='text-xs text-[#82746b]'>Registered Pet{pets.length === 1 ? '' : 's'}</span>
                </div>
                <div className='h-4 w-px bg-[rgba(210,143,119,0.4)]' />
                <div className='flex items-center gap-2 transition-transform duration-300 hover:scale-105'>
                  <span className='font-serif text-2xl font-semibold text-[#24211e]'>{completedCount}</span>
                  <span className='text-xs text-[#82746b]'>Completed Visit{completedCount === 1 ? '' : 's'}</span>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className='shrink-0'>
              <Link
                to='/booking'
                className='group inline-flex min-h-[50px] items-center justify-center gap-2.5 rounded-lg bg-[#262626] px-8 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#3d3d3d] hover:shadow-lg active:translate-y-0 active:scale-[0.99]'
              >
                <Plus size={15} className='text-[#d1a85b] transition-transform duration-300 group-hover:rotate-90' /> Book a visit
              </Link>
            </div>
          </div>
        </header>

        <AccountNotices user={user} />

        {/* SECTION 1: NEXT VISIT (Editorial Arch Frame) */}
        <section className='py-12 lg:py-16'>
          <div className='mb-7 flex items-end justify-between gap-4'>
            <div>
              <span className='text-[10px] font-bold uppercase tracking-[3px] text-[#a47d44]'>Coming Up</span>
              <h2 className='mt-1 font-serif text-3xl font-medium tracking-tight text-[#24211e] sm:text-4xl'>What's next for your pet</h2>
            </div>
            <Link
              to='/appointments'
              className='gold-underline group hidden items-center gap-1.5 pb-1 text-xs font-semibold text-[#635b53] hover:text-[#24211e] sm:inline-flex'
            >
              All appointments <ArrowRight size={13} className='text-[#cf7c54] transition-transform duration-300 group-hover:translate-x-1' />
            </Link>
          </div>

          {loading ? (
            <NextVisitSkeleton />
          ) : nextAppointment ? (
            <NextVisit appointment={nextAppointment} pets={pets} onOpen={() => setSelectedAppointment(nextAppointment)} />
          ) : (
            <EmptyNextVisit />
          )}
        </section>

        {/* SECTION 2: COMPANIONS WITH BOTANICAL SPECIES EMBLEMS */}
        <section className='border-t border-[rgba(210,143,119,0.35)] py-12 lg:py-16'>
          <div className='mb-8 flex items-end justify-between gap-4'>
            <div>
              <span className='text-[10px] font-bold uppercase tracking-[3px] text-[#a47d44]'>Your Pets</span>
              <h2 className='mt-1 font-serif text-3xl font-medium tracking-tight text-[#24211e] sm:text-4xl'>Your registered pets</h2>
            </div>
            <Link
              to='/my-pets'
              className='gold-underline group inline-flex items-center gap-1.5 pb-1 text-xs font-semibold text-[#635b53] hover:text-[#24211e]'
            >
              Manage pets <ArrowRight size={13} className='text-[#cf7c54] transition-transform duration-300 group-hover:translate-x-1' />
            </Link>
          </div>

          {loading ? (
            <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
              {[0, 1, 2].map((item) => (
                <div key={item} className='aspect-[4/5] animate-pulse rounded-xl bg-[#f2e4d8]' />
              ))}
            </div>
          ) : pets.length ? (
            <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
              {pets.slice(0, 6).map((pet) => (
                <CompanionCard key={pet._id} pet={pet} />
              ))}
            </div>
          ) : (
            <div className='border border-[rgba(210,143,119,0.3)] bg-white/70 py-12 text-center backdrop-blur-sm'>
              <p className='font-serif text-2xl text-[#24211e]'>No pets added yet.</p>
              <p className='mt-2 text-sm text-[#635b53]'>Add your pet once and their info will be ready for every future booking.</p>
              <Link
                to='/my-pets'
                className='gold-underline mt-5 inline-flex items-center gap-2 pb-1 text-sm font-semibold text-[#24211e]'
              >
                <Plus size={14} className='text-[#a47d44]' /> Add your first pet
              </Link>
            </div>
          )}
        </section>

        {/* SECTION 3: CARE & VISITS ARCHIVE */}
        <section className='border-t border-[rgba(210,143,119,0.35)] py-12 lg:py-16'>
          <div className='grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14'>
            <div>
              <span className='text-[10px] font-bold uppercase tracking-[3px] text-[#a47d44]'>Visit History</span>
              <h2 className='mt-2 font-serif text-3xl font-medium leading-snug tracking-tight text-[#24211e] sm:text-4xl'>
                Your past visits with us.
              </h2>
              <p className='mt-4 text-sm leading-relaxed text-[#635b53]'>
                See your previous grooming sessions, check haircut details, or reach out if you need to make changes.
              </p>
              <Link
                to='/appointments'
                className='gold-underline group mt-6 inline-flex items-center gap-2 pb-1 text-sm font-semibold text-[#24211e]'
              >
                See all visits <ArrowRight size={13} className='text-[#cf7c54] transition-transform duration-300 group-hover:translate-x-1' />
              </Link>
            </div>

            <div className='divide-y divide-[rgba(210,143,119,0.25)] rounded-xl border border-[rgba(210,143,119,0.25)] bg-white/85 p-2 shadow-[0_8px_24px_rgba(40,26,18,0.03)] backdrop-blur-sm'>
              {!loading && (upcoming.length || recentVisits.length) ? (
                [...upcoming.slice(0, 2), ...recentVisits].slice(0, 5).map((appointment) => (
                  <VisitRow key={appointment._id} appointment={appointment} onOpen={() => setSelectedAppointment(appointment)} />
                ))
              ) : (
                <div className='py-12 text-center text-sm text-[#82746b]'>Your grooming history will show up here after your first visit.</div>
              )}
            </div>
          </div>
        </section>
      </div>

      {selectedAppointment && (
        <AppointmentDetailsModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onCancel={(appointment) => setConfirmCancelAppointment(appointment)}
          onReschedule={(appointment) => setRescheduleAppointment(appointment)}
        />
      )}
      <RescheduleModal
        isOpen={Boolean(rescheduleAppointment)}
        appointment={rescheduleAppointment}
        onClose={() => setRescheduleAppointment(null)}
        onSuccess={loadData}
      />
      <ConfirmModal
        isOpen={Boolean(confirmCancelAppointment)}
        title='Cancel Appointment'
        description={confirmCancelAppointment ? `Are you sure you want to cancel the ${confirmCancelAppointment.service} appointment for ${confirmCancelAppointment.petName}?` : ''}
        confirmText='Cancel Appointment'
        cancelText='Keep Booking'
        variant='danger'
        loading={cancelling}
        onConfirm={handleConfirmCancel}
        onClose={() => setConfirmCancelAppointment(null)}
      />
    </div>
  )
}

function AccountNotices({ user }) {
  if (!['warned', 'booking_blocked', 'banned'].includes(user?.accountStatus)) return null
  const blocked = ['booking_blocked', 'banned'].includes(user.accountStatus)
  return (
    <div className={`mt-8 flex items-start gap-3 border p-5 text-sm transition-all duration-300 ${blocked ? 'border-[#e8c5c5] bg-[#fbefef] text-[#7d3f3f]' : 'border-[rgba(210,143,119,0.4)] bg-[#fdf8eb] text-[#6a5827]'}`}>
      {blocked ? <Ban className='mt-0.5 shrink-0 text-[#934b4b]' size={18} /> : <AlertTriangle className='mt-0.5 shrink-0 text-[#a47d44]' size={18} />}
      <div>
        <p className='font-serif text-base font-semibold'>{blocked ? 'Booking Privileges Suspended' : 'Account Notice'}</p>
        <p className='mt-1 leading-relaxed text-[#635b53]'>{user.statusReason || user.warningMessage || (blocked ? 'Your customer account is currently unable to schedule new appointments.' : 'Please review our salon policies before your next visit.')}</p>
      </div>
    </div>
  )
}

function NextVisit({ appointment, pets, onOpen }) {
  const pet = appointment.pet || pets.find((item) => item._id === appointment.petId || item.name?.toLowerCase() === appointment.petName?.toLowerCase())
  const status = STATUS[appointment.status] || STATUS.pending
  const isCat = (appointment.petType || pet?.type)?.toLowerCase() === 'cat'

  return (
    <article className='editorial-card-hover group grid overflow-hidden rounded-xl border border-[rgba(210,143,119,0.3)] bg-white shadow-[0_10px_30px_rgba(50,32,22,0.04)] lg:grid-cols-[1.25fr_0.75fr]'>
      <div className='flex flex-col justify-between p-7 sm:p-10 lg:min-h-[380px]'>
        <div>
          <div className='flex items-center gap-3'>
            <span className={`inline-flex border px-3 py-1 text-[9px] font-bold uppercase tracking-[1.5px] transition-transform duration-300 group-hover:scale-105 ${status.className}`}>
              {status.label}
            </span>
            <span className='text-xs text-[#d1a85b]'>✦</span>
            <span className='text-[11px] font-bold uppercase tracking-[2px] text-[#a47d44]'>
              {formatDateLong(appointment.date)}
            </span>
          </div>

          <h3 className='mt-5 font-serif text-3xl font-medium leading-tight text-[#24211e] sm:text-4xl lg:text-[2.7rem]'>
            {appointment.petName} is booked for {appointment.service?.toLowerCase()}.
          </h3>

          <div className='mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm text-[#635b53]'>
            <span className='inline-flex items-center gap-2'>
              <Clock3 size={16} className='text-[#d1a85b]' /> {formatTimeRange(appointment.time, appointment.endTime)}
            </span>
            {appointment.haircutStyle && (
              <span className='inline-flex items-center gap-2'>
                <Scissors size={16} className='text-[#d1a85b]' /> {appointment.haircutStyle}
              </span>
            )}
          </div>
        </div>

        <button
          type='button'
          onClick={onOpen}
          className='gold-underline group mt-9 inline-flex self-start items-center gap-2 pb-1 text-xs font-semibold text-[#24211e]'
        >
          View appointment details <ArrowRight size={13} className='text-[#cf7c54] transition-transform duration-300 group-hover:translate-x-1.5' />
        </button>
      </div>

      {/* Right Arch Window */}
      <div className='flex items-center justify-center bg-gradient-to-b from-[#fbf1ea] to-[#f4e2d4] p-8'>
        <button
          type='button'
          onClick={onOpen}
          className='editorial-arch group/arch h-[300px] w-[230px] bg-[#f5e9dc] shadow-[0_16px_36px_-10px_rgba(71,46,31,0.15)] transition-transform duration-500 hover:scale-[1.03]'
        >
          {pet?.photoUrl ? (
            <img src={pet.photoUrl} alt={pet.name} className='h-full w-full object-cover transition-transform duration-700 group-hover/arch:scale-105' />
          ) : (
            <div className='flex h-full flex-col items-center justify-center bg-gradient-to-b from-[#fbf1ea] to-[#f4e2d4] p-4 text-center'>
              {isCat ? (
                <FullBodyCatBotanical className='h-36 w-36 text-[#a47d44]' />
              ) : (
                <DogPawBotanical className='h-36 w-36 text-[#cf7c54]' />
              )}
              <span className='mt-1 font-serif text-xs italic tracking-wider text-[#82746b]'>
                {isCat ? 'Feline Guest' : 'Canine Guest'}
              </span>
            </div>
          )}
          {/* Subtle flower accent overlay katulad sa Home.jsx About Media */}
          <svg className='pointer-events-none absolute bottom-3 left-3 h-6 w-6 text-[#cf7c54] opacity-80 transition-transform duration-500 group-hover/arch:scale-110' viewBox='0 0 24 24' fill='currentColor'>
            <path d='M12 2a3 3 0 0 0-3 3 3 3 0 0 0 .5 1.6A3 3 0 0 0 6 6a3 3 0 0 0-3 3 3 3 0 0 0 1.6.5A3 3 0 0 0 4 12a3 3 0 0 0 3 3 3 3 0 0 0-.5 1.6A3 3 0 0 0 8 18a3 3 0 0 0 3 3 3 3 0 0 0 .5-1.6A3 3 0 0 0 12 20a3 3 0 0 0 3-3 3 3 0 0 0-.5-1.6A3 3 0 0 0 18 14a3 3 0 0 0 3-3 3 3 0 0 0-1.6-.5A3 3 0 0 0 20 8a3 3 0 0 0-3-3 3 3 0 0 0-.5 1.6A3 3 0 0 0 15 6a3 3 0 0 0-3-4zm0 8a2 2 0 1 1 0 4 2 2 0 0 1 0-4z'/>
          </svg>
        </button>
      </div>
    </article>
  )
}

function EmptyNextVisit() {
  return (
    <div className='editorial-card-hover grid overflow-hidden rounded-xl border border-[rgba(210,143,119,0.3)] bg-white shadow-[0_10px_30px_rgba(50,32,22,0.04)] lg:grid-cols-[1.2fr_0.8fr]'>
      <div className='p-8 sm:p-12'>
        <span className='text-[10px] font-bold uppercase tracking-[3px] text-[#a47d44]'>No Upcoming Visit</span>
        <h3 className='mt-3 font-serif text-3xl font-medium leading-tight text-[#24211e] sm:text-4xl'>
          Ready to book their next grooming?
        </h3>
        <p className='mt-4 max-w-lg text-sm leading-relaxed text-[#635b53]'>
          Pick a service and a time that works for you. Once booked, it'll show up right here.
        </p>
        <Link
          to='/booking'
          className='group mt-8 inline-flex min-h-[48px] items-center gap-2 bg-[#262626] px-7 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:bg-[#3d3d3d] hover:shadow-md active:scale-[0.99]'
        >
          <Plus size={14} className='text-[#d1a85b] transition-transform duration-300 group-hover:rotate-90' /> Book a visit
        </Link>
      </div>
      <div className='flex min-h-[240px] items-center justify-center bg-gradient-to-b from-[#fbf1ea] to-[#f4e2d4] p-8'>
        <div className='editorial-arch flex h-[220px] w-[180px] items-center justify-center bg-[#f7ebe1] shadow-[0_12px_28px_rgba(71,46,31,0.08)] transition-transform duration-500 hover:scale-105'>
          <CalendarDays size={42} strokeWidth={1} className='text-[#a47d44] transition-transform duration-300 hover:scale-110' />
        </div>
      </div>
    </div>
  )
}

function NextVisitSkeleton() {
  return (
    <div className='grid min-h-[350px] animate-pulse rounded-xl border border-[rgba(210,143,119,0.3)] bg-white lg:grid-cols-[1.25fr_0.75fr]'>
      <div className='m-10 rounded-lg bg-[#f5e9dc]' />
      <div className='bg-[#eee1d5]' />
    </div>
  )
}

function CompanionCard({ pet }) {
  const isCat = pet.type?.toLowerCase() === 'cat'

  return (
    <Link
      to='/my-pets'
      className='editorial-card-hover group block rounded-2xl border border-[rgba(210,143,119,0.35)] bg-white p-5 shadow-[0_8px_24px_rgba(40,26,18,0.03)]'
    >
      {/* Arch Frame with Botanical Emblem */}
      <div className='editorial-arch relative mx-auto h-[250px] w-full max-w-[270px] bg-[#f7eee6]'>
        {pet.photoUrl ? (
          <img
            src={pet.photoUrl}
            alt={pet.name}
            className='h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105'
          />
        ) : (
          /* Placeholder kapag walang photo */
          <div className='relative flex h-full flex-col items-center justify-center bg-gradient-to-b from-[#fbf1ea] to-[#f4e2d4] p-4 text-center'>
            {isCat ? (
              <FullBodyCatBotanical className='h-36 w-36 text-[#a47d44]' />
            ) : (
              <DogPawBotanical className='h-36 w-36 text-[#cf7c54]' />
            )}
            <span className='mt-1 font-serif text-xs italic tracking-wider text-[#82746b]'>
              {isCat ? 'Feline Companion' : 'Canine Companion'}
            </span>
          </div>
        )}

        {/* Floating Botanical Species Badge */}
        <div
          className='absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(210,143,119,0.5)] bg-[#fdf4ef]/95 shadow-[0_4px_12px_rgba(71,46,31,0.12)] backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_6px_16px_rgba(71,46,31,0.18)]'
          title={isCat ? 'Cat' : 'Dog'}
        >
          {isCat ? (
            <CatIconMini className='h-6 w-6 text-[#a47d44]' />
          ) : (
            <DogPawIconMini className='h-5 w-5 text-[#cf7c54]' />
          )}
        </div>

        {/* Hover Arrow Indicator */}
        <span className='absolute bottom-3 right-3 grid h-8 w-8 place-items-center rounded-full bg-white/95 text-[#24211e] opacity-0 shadow-md backdrop-blur transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100'>
          <ChevronRight size={15} />
        </span>
      </div>

      {/* Pet Information Footer */}
      <div className='mt-5 flex items-baseline justify-between border-t border-[rgba(210,143,119,0.25)] pt-4'>
        <div>
          <div className='flex items-center gap-2'>
            <h3 className='font-serif text-lg text-[#24211e] transition-colors duration-300 group-hover:text-[#a47d44]'>
              {pet.name}
            </h3>
            <span className='text-[11px] text-[#cf7c54] transition-transform duration-300 group-hover:scale-125'>✦</span>
          </div>
          <p className='mt-0.5 flex items-center gap-1.5 text-xs text-[#82746b]'>
            <span>{isCat ? 'Cat' : 'Dog'}</span>
            <span className='text-[8px] opacity-60'>•</span>
            <span className='capitalize'>{pet.breed || 'Companion'}</span>
          </p>
        </div>

        {pet.ageMonths !== undefined && pet.ageMonths !== null && (
          <span className='rounded-full border border-[rgba(210,143,119,0.35)] bg-[#fdf4ef] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[1.5px] text-[#a47d44] transition-colors duration-300 group-hover:border-[#d1a85b]'>
            {formatAge(pet.ageMonths)}
          </span>
        )}
      </div>
    </Link>
  )
}

function VisitRow({ appointment, onOpen }) {
  const status = STATUS[appointment.status] || STATUS.pending
  const date = appointmentDate(appointment)
  return (
    <button
      type='button'
      onClick={onOpen}
      className='group grid w-full grid-cols-[70px_1fr_auto] items-center gap-4 p-4 text-left transition-all duration-300 ease-out hover:bg-[#fdf4ef] hover:pl-6'
    >
      <div className='text-center transition-transform duration-300 group-hover:scale-105'>
        <p className='font-serif text-2xl font-semibold leading-none text-[#24211e]'>
          {Number.isNaN(date.getTime()) ? '—' : date.getDate()}
        </p>
        <p className='mt-1 text-[9px] font-bold uppercase tracking-[2px] text-[#a47d44]'>
          {Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-PH', { month: 'short' })}
        </p>
      </div>

      <div className='min-w-0'>
        <div className='flex flex-wrap items-center gap-2'>
          <p className='truncate font-serif text-lg font-medium text-[#24211e] transition-colors duration-300 group-hover:text-[#a47d44]'>
            {appointment.petName}
          </p>
          <span className={`border px-2 py-0.5 text-[8px] font-bold uppercase tracking-[1px] ${status.className}`}>
            {status.label}
          </span>
        </div>
        <p className='mt-1 truncate text-xs text-[#82746b]'>
          {appointment.service} · {formatTimeRange(appointment.time, appointment.endTime)}
        </p>
      </div>

      <ChevronRight size={16} className='text-[#cf7c54] transition-transform duration-300 group-hover:translate-x-1.5' />
    </button>
  )
}

function formatAge(months) {
  const value = Number(months)
  if (!Number.isFinite(value)) return ''
  if (value < 12) return `${value} mo`
  const years = Math.floor(value / 12)
  return `${years} yr${years === 1 ? '' : 's'}`
}

/* ==========================================================
   BOTANICAL EMBLEMS & SVGS (WITH MICRO-ANIMATION CLASSES)
========================================================== */

// DOG: Paw print with animated botanical sprigs and leaves
function DogPawBotanical({ className = 'w-24 h-24' }) {
  return (
    <svg viewBox='0 0 100 100' fill='none' className={className}>
      {/* Botanical Sprigs Left (animates on hover) */}
      <g className='anim-botanical-sway'>
        <path d='M28 72C25 58 30 45 35 38M25 60C20 57 18 50 20 45M28 50C24 45 24 38 28 34' stroke='#cf7c54' strokeWidth='1.5' strokeLinecap='round' opacity='0.75' />
        <circle cx='18' cy='45' r='1.5' fill='#cf7c54' opacity='0.8' />
        <circle cx='28' cy='34' r='1.5' fill='#cf7c54' opacity='0.8' />
      </g>

      {/* Botanical Sprigs Right (animates on hover) */}
      <g className='anim-botanical-sway'>
        <path d='M72 72C75 58 70 45 65 38M75 60C80 57 82 50 80 45M72 50C76 45 76 38 72 34' stroke='#cf7c54' strokeWidth='1.5' strokeLinecap='round' opacity='0.75' />
        <circle cx='82' cy='45' r='1.5' fill='#cf7c54' opacity='0.8' />
        <circle cx='72' cy='34' r='1.5' fill='#cf7c54' opacity='0.8' />
      </g>

      {/* Center Botanical Wreath Base */}
      <path d='M35 78 C45 83 55 83 65 78' stroke='#d1a85b' strokeWidth='1.5' strokeLinecap='round' />
      <circle cx='50' cy='82' r='2' fill='#d1a85b' />

      {/* Dog Paw Center (with gentle pulse) */}
      <g className='anim-paw-pulse'>
        <ellipse cx='50' cy='56' rx='14' ry='11' fill='#cf7c54' opacity='0.88' />
        <circle cx='34' cy='41' r='5.5' fill='#cf7c54' opacity='0.88' />
        <circle cx='45' cy='33' r='5.5' fill='#cf7c54' opacity='0.88' />
        <circle cx='55' cy='33' r='5.5' fill='#cf7c54' opacity='0.88' />
        <circle cx='66' cy='41' r='5.5' fill='#cf7c54' opacity='0.88' />
      </g>
    </svg>
  )
}

// CAT: Full body cat silhouette seated among botanical vines and curling tail
function FullBodyCatBotanical({ className = 'w-24 h-24' }) {
  return (
    <svg viewBox='0 0 100 100' fill='none' className={className}>
      {/* Botanical Vine Base */}
      <g className='anim-botanical-sway'>
        <path d='M20 78C35 76 65 76 80 78M28 77C24 72 23 66 26 62M72 77C76 72 77 66 74 62' stroke='#a47d44' strokeWidth='1.5' strokeLinecap='round' opacity='0.75' />
        <circle cx='25' cy='62' r='1.8' fill='#d1a85b' />
        <circle cx='75' cy='62' r='1.8' fill='#d1a85b' />

        {/* Leaf sprigs curving behind cat */}
        <path d='M68 60C74 52 75 42 70 32M72 45C76 43 80 38 78 33' stroke='#a47d44' strokeWidth='1.4' strokeLinecap='round' opacity='0.65' />
        <circle cx='70' cy='32' r='1.5' fill='#cf7c54' />
      </g>

      {/* Whole Body Cat Silhouette */}
      <path
        d='M46 25C46 25 43 19 41 19C40 19 41 23 42 26C40 28 39 31 39 34C39 39 42 43 45 45C42 49 40 56 40 64C40 69 41 73 43 76C47 77 53 77 57 76C57 72 56 65 58 57C60 48 64 45 64 39C64 33 60 27 55 26C56 23 57 19 56 19C54 19 51 25 51 25C49 24 48 24 46 25Z'
        fill='#a47d44'
        opacity='0.88'
      />

      {/* Animated curling tail */}
      <path
        className='anim-cat-tail'
        d='M56 74C65 74 72 68 72 60C72 54 67 50 63 53C60 55 62 60 65 59C67 58 68 60 68 62C68 65 64 69 56 70'
        fill='#a47d44'
        opacity='0.88'
      />
    </svg>
  )
}

// Mini Dog Paw with Leaf Sprigs for Badges
function DogPawIconMini({ className = 'w-5 h-5' }) {
  return (
    <svg viewBox='0 0 24 24' fill='none' className={className}>
      <ellipse cx='12' cy='14' rx='4.2' ry='3.4' fill='currentColor' />
      <circle cx='7.5' cy='9.5' r='1.8' fill='currentColor' />
      <circle cx='10.8' cy='7' r='1.8' fill='currentColor' />
      <circle cx='13.2' cy='7' r='1.8' fill='currentColor' />
      <circle cx='16.5' cy='9.5' r='1.8' fill='currentColor' />
      <path d='M5 19C7 18 8 16 8 14M19 19C17 18 16 16 16 14' stroke='currentColor' strokeWidth='1.2' strokeLinecap='round' opacity='0.75' />
    </svg>
  )
}

// Mini Full Body Cat Silhouette for Badges
function CatIconMini({ className = 'w-5 h-5' }) {
  return (
    <svg viewBox='0 0 24 24' fill='none' className={className}>
      <path
        d='M11 5L9.5 2.5C9 2.5 9.5 5 10 6C9 7 8.5 8.5 8.5 10C8.5 12 10 13.5 11 14C9.5 16 9 18 9 20C11 20.5 14 20.5 15 20C15 17 17 15 17 12C17 9 15 6.5 13 6C13.5 5 14 2.5 13.5 2.5L12 5C11.6 4.9 11.3 4.9 11 5Z'
        fill='currentColor'
      />
      <path
        d='M15 19C18 19 20 17 20 14.5C20 13 18.5 12 17.5 13C17 13.5 17.8 14.8 18.5 14.5C18.8 14.8 18.8 15.5 17.5 16.5C16.5 17.2 15 17.5 14.5 17.5'
        stroke='currentColor'
        strokeWidth='1.1'
        strokeLinecap='round'
      />
    </svg>
  )
}