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
import { getStagesForService, getStageProgress } from '../utils/serviceStages'

const appointmentDate = (appointment, useEnd = false) => {
  const directValue = useEnd ? appointment.endAt : appointment.startAt
  if (directValue) return new Date(directValue)
  const time = useEnd ? (appointment.endTime || appointment.time) : appointment.time
  if (!appointment.date || !time) return new Date(0)
  return new Date(`${appointment.date}T${time}:00+08:00`)
}

const STATUS = {
  confirmed: { label: 'Approved', className: 'border-[#cdbd86] bg-[#fdf8eb] text-[#675728]' },
  in_progress: { label: 'In Service', className: 'border-[#bad5c3] bg-[#f1f7f3] text-[#22573d]' },
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
    .filter((appointment) => ['pending', 'confirmed', 'in_progress'].includes(appointment.status) && appointmentDate(appointment, true) >= new Date())
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

      <div className='relative z-10 mx-auto max-w-[1280px] px-4 py-8 sm:px-6 md:py-12 lg:px-8'>
        {/* HERO SECTION: Editorial Sanctuary Welcome */}
        <header className='relative border-b border-[rgba(210,143,119,0.3)] pb-10'>
          <div className='flex flex-col justify-between gap-8 md:flex-row md:items-end'>
            <div>
              <h1 className='font-serif text-[clamp(1.75rem,5.5vw,3.75rem)] sm:text-[clamp(2.4rem,5vw,4.5rem)] font-medium leading-[1.05] tracking-[-0.025em] text-[#24211e]'>
                Good to see you, <span className='italic'>{user?.firstName}</span>.
              </h1>
              <p className='mt-3 sm:mt-4 max-w-xl text-sm sm:text-base leading-relaxed text-[#635b53]'>
                Here's everything about your pets and upcoming appointments — all in one place.
              </p>

              {/* Sanctuary Highlights */}
              <div className='mt-5 sm:mt-6 flex flex-wrap items-center gap-5 sm:gap-8 text-sm'>
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
            <div className='shrink-0 w-full sm:w-auto'>
              <Link
                to='/booking'
                className='group inline-flex min-h-[46px] sm:min-h-[50px] w-full sm:w-auto items-center justify-center gap-2.5 rounded-lg bg-[#262626] px-8 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#3d3d3d] hover:shadow-lg active:translate-y-0 active:scale-[0.99]'
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
              <h2 className='font-serif text-3xl font-medium tracking-tight text-[#24211e] sm:text-4xl'>What's next for your pet</h2>
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
              <h2 className='font-serif text-3xl font-medium tracking-tight text-[#24211e] sm:text-4xl'>Your registered pets</h2>
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
              <h2 className='font-serif text-3xl font-medium leading-snug tracking-tight text-[#24211e] sm:text-4xl'>
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
  const stages = getStagesForService(appointment.serviceId)
  const progress = getStageProgress(stages, appointment.serviceStageKey)
  const petPhoto = pet?.photoUrl || appointment.petPhotoUrl || appointment.petPhoto

  return (
    <article className='editorial-card-hover group grid overflow-hidden rounded-2xl border border-[rgba(210,143,119,0.3)] bg-white shadow-[0_12px_32px_rgba(50,32,22,0.04)] lg:grid-cols-[1.3fr_0.7fr]'>
      {/* Left Main Content */}
      <div className='flex flex-col justify-between p-6 sm:p-8 lg:p-10'>
        <div>
          {/* Status & Date Bar */}
          <div className='flex flex-wrap items-center gap-2.5 text-xs'>
            <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[1.2px] ${status.className}`}>
              {status.label}
            </span>
            <span className='text-[#82746b]'>•</span>
            <span className='font-semibold text-[#82746b] tracking-wide'>
              {formatDateLong(appointment.date)}
            </span>
          </div>

          {/* Heading */}
          <h3 className='mt-4 font-serif text-2xl sm:text-3xl lg:text-[2.25rem] font-medium leading-[1.2] text-[#24211e]'>
            {appointment.status === 'in_progress'
              ? `${appointment.petName} is currently in service.`
              : `${appointment.petName}’s upcoming visit.`}
          </h3>

          <p className='mt-2 text-sm leading-relaxed text-[#635b53]'>
            Booked for <strong className='font-semibold text-[#24211e]'>{appointment.service}</strong>
            {appointment.haircutStyle ? ` (${appointment.haircutStyle})` : ''} at Timmy Tails Pet Salon.
          </p>

          {/* Clean Segmented In-Service Progress Track (No nested boxes or AI badges) */}
          {appointment.status === 'in_progress' && (
            <div className='mt-7 border-t border-[rgba(210,143,119,0.2)] pt-6'>
              <div className='flex items-center justify-between text-xs'>
                <div className='flex items-center gap-2'>
                  <span className='h-2 w-2 rounded-full bg-[#22573d]' />
                  <span className='text-[10px] font-bold uppercase tracking-wider text-[#22573d]'>
                    Current Stage
                  </span>
                  <span className='text-[#82746b]'>—</span>
                  <span className='font-serif font-bold text-[#24211e] text-sm'>
                    {appointment.serviceStage || stages[0]?.label || 'Service in progress'}
                  </span>
                </div>
                <span className='font-mono text-xs font-semibold text-[#82746b]'>
                  Step {progress.currentStep} of {progress.totalSteps}
                </span>
              </div>

              {/* Segmented Timeline */}
              <div className='mt-3.5 grid gap-2' style={{ gridTemplateColumns: `repeat(${stages.length}, 1fr)` }}>
                {stages.map((stg, i) => {
                  const isDone = i < progress.currentStep - 1
                  const isCurrent = i === progress.currentStep - 1
                  return (
                    <div key={stg.id} className='space-y-1.5'>
                      <div className={`h-1.5 w-full rounded-full transition-all duration-500 ${
                        isCurrent
                          ? 'bg-[#22573d]'
                          : isDone
                          ? 'bg-[#89b899]'
                          : 'bg-[rgba(210,143,119,0.18)]'
                      }`} />
                      <p className={`text-[10px] leading-tight transition-colors ${
                        isCurrent
                          ? 'font-bold text-[#22573d]'
                          : isDone
                          ? 'font-medium text-[#635b53]'
                          : 'text-[#9c8e84]'
                      }`}>
                        {stg.label}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Quick Details Badges */}
          <div className='mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[#635b53]'>
            <span className='inline-flex items-center gap-1.5'>
              <Clock3 size={15} className='text-[#a47d44]' />
              <span className='font-medium'>{formatTimeRange(appointment.time, appointment.endTime)}</span>
            </span>
            {appointment.haircutStyle && (
              <span className='inline-flex items-center gap-1.5'>
                <Scissors size={15} className='text-[#a47d44]' />
                <span>{appointment.haircutStyle}</span>
              </span>
            )}
            <span className='font-mono font-semibold text-[#24211e]'>
              ₱{Number(appointment.price || appointment.amount || 0).toLocaleString('en-PH')}
            </span>
          </div>
        </div>

        {/* Footer Link */}
        <div className='mt-8 pt-5 border-t border-[rgba(210,143,119,0.2)]'>
          <button
            type='button'
            onClick={onOpen}
            className='group inline-flex items-center gap-2 text-xs font-bold text-[#24211e] hover:text-[#cf7c54] transition-colors'
          >
            View appointment details <ArrowRight size={13} className='text-[#cf7c54] transition-transform duration-300 group-hover:translate-x-1.5' />
          </button>
        </div>
      </div>

      {/* Right Column: Pet Portrait or Reservation Ticket */}
      <div className='flex flex-col justify-between border-t border-[rgba(210,143,119,0.2)] bg-[#FAF4ED]/60 p-6 sm:p-8 lg:border-l lg:border-t-0'>
        {petPhoto ? (
          <div className='relative flex h-full flex-col justify-between'>
            <div className='relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-[rgba(210,143,119,0.25)] bg-[#f7eee6] shadow-inner sm:aspect-[16/10] lg:aspect-auto lg:h-[220px]'>
              <img src={petPhoto} alt={appointment.petName} className='h-full w-full object-cover transition-transform duration-700 group-hover:scale-105' />
            </div>
            <div className='mt-4 flex items-center justify-between text-xs'>
              <div>
                <p className='font-serif text-base font-bold text-[#24211e]'>{appointment.petName}</p>
                <p className='text-[11px] text-[#82746b]'>{appointment.breed || pet?.breed || 'Companion'} · {isCat ? 'Cat' : 'Dog'}</p>
              </div>
              <span className='rounded-full border border-[rgba(210,143,119,0.3)] bg-white px-2.5 py-0.5 text-[10px] font-semibold text-[#82746b]'>
                Guest Pet
              </span>
            </div>
          </div>
        ) : (
          <div className='flex h-full flex-col justify-between'>
            <div>
              {/* Pet Monogram Card */}
              <div className='flex items-center gap-3.5 pb-4 border-b border-[rgba(210,143,119,0.2)]'>
                <span className='grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-[rgba(210,143,119,0.3)] bg-white font-serif text-xl font-bold text-[#24211e] shadow-xs'>
                  {appointment.petName ? appointment.petName[0].toUpperCase() : 'P'}
                </span>
                <div>
                  <h4 className='font-serif text-lg font-bold text-[#24211e]'>{appointment.petName}</h4>
                  <p className='text-xs text-[#82746b]'>{appointment.breed || pet?.breed || 'Companion'} · {isCat ? 'Cat' : 'Dog'}</p>
                </div>
              </div>

              {/* Reservation Overview Key-Values */}
              <div className='mt-4 space-y-2.5 text-xs'>
                <div className='flex items-center justify-between'>
                  <span className='text-[#82746b]'>Service</span>
                  <span className='font-medium text-[#24211e]'>{appointment.service}</span>
                </div>
                {appointment.haircutStyle && (
                  <div className='flex items-center justify-between'>
                    <span className='text-[#82746b]'>Haircut Style</span>
                    <span className='font-medium text-[#24211e]'>{appointment.haircutStyle}</span>
                  </div>
                )}
                <div className='flex items-center justify-between'>
                  <span className='text-[#82746b]'>Salon Station</span>
                  <span className='font-medium text-[#24211e]'>TimmyTails · Baliuag</span>
                </div>
                <div className='flex items-center justify-between pt-1'>
                  <span className='text-[#82746b]'>Total Amount</span>
                  <span className='font-mono font-bold text-[#cf7c54] text-sm'>
                    ₱{Number(appointment.price || appointment.amount || 0).toLocaleString('en-PH')}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Reference */}
            <div className='mt-6 flex items-center justify-between border-t border-[rgba(210,143,119,0.2)] pt-3 text-[11px] text-[#82746b]'>
              <span>Ref: <span className='font-mono font-medium'>{appointment._id?.slice(-8) || 'N/A'}</span></span>
              <button
                type='button'
                onClick={onOpen}
                className='font-semibold text-[#cf7c54] hover:underline'
              >
                Booking details →
              </button>
            </div>
          </div>
        )}
      </div>
    </article>
  )
}

function EmptyNextVisit() {
  return (
    <div className='editorial-card-hover grid overflow-hidden rounded-xl border border-[rgba(210,143,119,0.3)] bg-white shadow-[0_10px_30px_rgba(50,32,22,0.04)] lg:grid-cols-[1.2fr_0.8fr]'>
      <div className='p-6 sm:p-10 lg:p-12'>
        <h3 className='font-serif text-3xl font-medium leading-tight text-[#24211e] sm:text-4xl'>
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
      <div className='flex min-h-[220px] items-center justify-center border-t border-[rgba(210,143,119,0.2)] bg-[#FAF4ED]/60 p-8 lg:border-l lg:border-t-0'>
        <div className='flex flex-col items-center justify-center text-center'>
          <div className='grid h-14 w-14 place-items-center rounded-2xl border border-[rgba(210,143,119,0.35)] bg-white text-[#a47d44] shadow-xs'>
            <CalendarDays size={26} strokeWidth={1.5} />
          </div>
          <p className='mt-3 font-serif text-sm font-semibold text-[#24211e]'>Appointments at a Glance</p>
          <p className='mt-0.5 text-xs text-[#82746b]'>Your upcoming schedules will appear here</p>
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
      {/* Photo Frame or Monogram Avatar */}
      <div className='relative mx-auto aspect-[4/5] w-full overflow-hidden rounded-xl border border-[rgba(210,143,119,0.25)] bg-[#FAF4ED]'>
        {pet.photoUrl ? (
          <img
            src={pet.photoUrl}
            alt={pet.name}
            className='h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105'
          />
        ) : (
          <div className='flex h-full flex-col items-center justify-center bg-gradient-to-b from-[#fbf1ea] to-[#f4e2d4] p-4 text-center'>
            <span className='grid h-16 w-16 place-items-center rounded-2xl border border-[rgba(210,143,119,0.4)] bg-white font-serif text-2xl font-bold text-[#24211e] shadow-xs transition-transform duration-300 group-hover:scale-110'>
              {pet.name ? pet.name[0].toUpperCase() : 'P'}
            </span>
            <p className='mt-3 font-serif text-sm font-semibold text-[#24211e]'>{pet.name}</p>
            <p className='mt-0.5 text-xs text-[#82746b]'>{pet.breed || (isCat ? 'Cat' : 'Dog')}</p>
          </div>
        )}

        {/* Hover Arrow Indicator */}
        <span className='absolute bottom-3 right-3 grid h-8 w-8 place-items-center rounded-full bg-white/95 text-[#24211e] opacity-0 shadow-md backdrop-blur transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100'>
          <ChevronRight size={15} />
        </span>
      </div>

      {/* Pet Information Footer */}
      <div className='mt-4 flex items-baseline justify-between border-t border-[rgba(210,143,119,0.2)] pt-3'>
        <div>
          <h3 className='font-serif text-lg text-[#24211e] transition-colors duration-300 group-hover:text-[#a47d44]'>
            {pet.name}
          </h3>
          <p className='mt-0.5 flex items-center gap-1.5 text-xs text-[#82746b]'>
            <span>{isCat ? 'Cat' : 'Dog'}</span>
            <span className='text-[8px] opacity-60'>•</span>
            <span className='capitalize'>{pet.breed || 'Companion'}</span>
          </p>
        </div>

        {pet.ageMonths !== undefined && pet.ageMonths !== null && (
          <span className='rounded-full border border-[rgba(210,143,119,0.35)] bg-[#fdf4ef] px-2.5 py-0.5 text-xs font-semibold text-[#82746b] transition-colors duration-300 group-hover:border-[#d1a85b]'>
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
          {appointment.status === 'in_progress' && appointment.serviceStage && (
            <span className='inline-flex items-center gap-1 rounded-full border border-[#bad5c3] bg-[#f1f7f3] px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.5px] text-[#22573d]'>
              <span className='h-1 w-1 animate-pulse rounded-full bg-[#22573d]' />
              {appointment.serviceStage}
            </span>
          )}
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