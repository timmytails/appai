import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Calendar,
  CalendarDays,
  Cat,
  ChevronRight,
  Clock3,
  Dog,
  Eye,
  Plus,
  Sparkles,
  XCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import { appointmentsApi, getErrorMessage } from '../utils/api'
import { formatDateLong, formatTimeRange } from '../features/booking/utils/dateTime'
import AppointmentDetailsModal from '../components/AppointmentDetailsModal'
import ConfirmModal from '../components/ConfirmModal'
import RescheduleModal from '../components/RescheduleModal'
import { canEditAppointmentDate } from '../utils/appointmentEditWindow'
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
  confirmed: { label: 'Approved', className: 'border-[#cdbd86] bg-[#fdf8eb] text-[var(--tt-muted)]' },
  in_progress: { label: 'In Service', className: 'border-[var(--tt-success-border)] bg-[var(--tt-success-bg)] text-[#216245]' },
  completed: { label: 'Completed', className: 'border-[rgba(210,143,119,0.3)] bg-[#f7ebe1] text-[var(--tt-muted)]' },
  cancelled: { label: 'Cancelled', className: 'border-[var(--tt-danger-border)] bg-[var(--tt-danger-bg)] text-[#934b4b]' },
  pending: { label: 'Pending review', className: 'border-[#ead7ca] bg-[#f9eee7] text-[#79584b]' }
}

export default function Appointments() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [confirmCancelAppointment, setConfirmCancelAppointment] = useState(null)
  const [cancelling, setCancelling] = useState(false)
  const [rescheduleAppointment, setRescheduleAppointment] = useState(null)

  const load = () =>
    appointmentsApi
      .getMy()
      .then(({ data }) => setAppointments(data.appointments || []))
      .finally(() => setLoading(false))

  useEffect(() => {
    load()
  }, [])

  const upcoming = useMemo(
    () =>
      appointments
        .filter(
          (appointment) =>
            ['pending', 'confirmed', 'in_progress'].includes(appointment.status) &&
            appointmentDate(appointment, true) >= new Date()
        )
        .sort((a, b) => appointmentDate(a) - appointmentDate(b)),
    [appointments]
  )

  const history = useMemo(
    () =>
      appointments
        .filter((appointment) => !upcoming.some((item) => item._id === appointment._id))
        .sort((a, b) => appointmentDate(b) - appointmentDate(a)),
    [appointments, upcoming]
  )

  const handleConfirmCancel = async () => {
    if (!confirmCancelAppointment) return
    setCancelling(true)
    try {
      await appointmentsApi.cancel(confirmCancelAppointment._id)
      toast.success('Appointment cancelled successfully')
      setConfirmCancelAppointment(null)
      await load()
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className='relative min-h-screen overflow-hidden bg-[var(--tt-canvas)] text-[var(--tt-ink)] selection:bg-[var(--tt-gold-light)]/20'>
      <style>{`
        .editorial-card-hover {
          position: relative;
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s ease, border-color 0.35s ease;
        }

        .editorial-card-hover:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 36px rgba(71, 46, 31, 0.08);
          border-color: rgba(207, 124, 84, 0.4);
        }

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

        @keyframes floatSlow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        .anim-float-bg {
          animation: floatSlow 7s ease-in-out infinite;
        }
      `}</style>

      {/* Decorative Background Curves & Botanicals */}
      <svg className='pointer-events-none absolute inset-0 z-0 h-full w-full' viewBox='0 0 1440 900' fill='none' preserveAspectRatio='none'>
        <path d='M-100,160 C300,240 600,60 980,180 C1250,260 1400,140 1600,200' stroke='#ecdcd0' strokeWidth='1.5' strokeDasharray='5 5' />
        <path d='M-50,420 C350,500 700,320 1080,460 C1300,540 1450,440 1650,480' stroke='#f2e2d7' strokeWidth='1.2' strokeDasharray='5 5' />
      </svg>
      <Botanical className='anim-float-bg pointer-events-none absolute -left-12 top-24 z-0 w-72 text-[var(--tt-accent)] opacity-25' />
      <Botanical className='anim-float-bg pointer-events-none absolute -right-16 top-[650px] z-0 w-96 rotate-12 -scale-x-100 text-[var(--tt-gold-light)] opacity-20' />

      <div className='relative z-10 mx-auto max-w-[1240px] px-4 py-8 sm:px-6 md:py-12 lg:px-8'>
        {/* Editorial Header */}
        <header className='relative border-b border-[rgba(210,143,119,0.4)] pb-10'>
          <div className='flex flex-col justify-between gap-8 md:flex-row md:items-end'>
            <div>
              <h1 className='font-serif text-[clamp(1.75rem,5.5vw,3.75rem)] sm:text-[clamp(2.4rem,5.5vw,4.5rem)] font-medium leading-[1.02] tracking-[-0.03em] text-[var(--tt-ink)]'>
                Your grooming appointments, <span className='italic'>past and upcoming</span>.
              </h1>
              <p className='mt-3 sm:mt-4 max-w-xl text-sm sm:text-base leading-relaxed text-[var(--tt-ink-soft)]'>
                Check your upcoming visits, view your appointment history, or reschedule and cancel before your visit.
              </p>
            </div>

            <div className='shrink-0 w-full sm:w-auto'>
              <Link
                to='/booking'
                className='group inline-flex min-h-[46px] sm:min-h-[48px] w-full sm:w-auto items-center justify-center gap-2.5 rounded-lg bg-[var(--tt-brand-strong)] px-6 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-[var(--tt-brand)] hover:shadow-lg active:scale-[0.99]'
              >
                <Plus size={15} className='text-[var(--tt-gold-light)] transition-transform duration-300 group-hover:rotate-90' />
                Book another visit
              </Link>
            </div>
          </div>
        </header>

        {/* Main Section */}
        {loading ? (
          <div className='grid gap-6 py-12 lg:grid-cols-[240px_1fr] lg:gap-14'>
            <div className='h-48 animate-pulse rounded-xl bg-[#f2e4d8]' />
            <div className='space-y-4'>
              {[0, 1, 2].map((i) => (
                <div key={i} className='h-32 animate-pulse rounded-xl bg-[#f2e4d8]' />
              ))}
            </div>
          </div>
        ) : (
          <div className='grid gap-10 py-12 lg:grid-cols-[240px_1fr] lg:gap-14 lg:py-16'>
            {/* Sidebar Overview */}
            <aside className='lg:sticky lg:top-[120px] lg:self-start'>
              <div className='rounded-2xl border border-[rgba(210,143,119,0.35)] bg-white/70 p-6 shadow-[0_8px_24px_rgba(40,26,18,0.03)] backdrop-blur-sm'>
                <h3 className='font-serif text-lg font-medium text-[var(--tt-ink)]'>At a glance</h3>
                <div className='mt-4 divide-y divide-[rgba(210,143,119,0.2)] border-y border-[rgba(210,143,119,0.2)]'>
                  <SummaryCount label='Upcoming Visits' value={upcoming.length} />
                  <SummaryCount label='Visit History' value={history.length} />
                </div>
                <div className='mt-5 flex items-start gap-2.5 text-xs leading-relaxed text-[var(--tt-muted)]'>
                  <p>You can reschedule or cancel appointments up to 24 hours before your slot.</p>
                </div>
              </div>
            </aside>

            {/* Visit Feeds */}
            <div className='space-y-16'>
              <VisitSection title='Upcoming visits' eyebrow='On the calendar' count={upcoming.length}>
                {upcoming.length ? (
                  <div className='mt-6 space-y-4'>
                    {upcoming.map((appointment) => (
                      <AppointmentEntry
                        key={appointment._id}
                        appointment={appointment}
                        onOpen={() => setSelectedAppointment(appointment)}
                        onCancel={() => setConfirmCancelAppointment(appointment)}
                        onReschedule={() => setRescheduleAppointment(appointment)}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState upcoming />
                )}
              </VisitSection>

              <VisitSection title='Past &amp; cancelled' eyebrow='Care archive' count={history.length}>
                {history.length ? (
                  <div className='mt-6 space-y-4'>
                    {history.map((appointment) => (
                      <AppointmentEntry
                        key={appointment._id}
                        appointment={appointment}
                        onOpen={() => setSelectedAppointment(appointment)}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState />
                )}
              </VisitSection>
            </div>
          </div>
        )}
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
        onSuccess={load}
      />
      <ConfirmModal
        isOpen={Boolean(confirmCancelAppointment)}
        title='Cancel Appointment'
        description={
          confirmCancelAppointment
            ? `Are you sure you want to cancel the ${confirmCancelAppointment.service} appointment for ${confirmCancelAppointment.petName}?`
            : ''
        }
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

function SummaryCount({ label, value }) {
  return (
    <div className='flex items-baseline justify-between py-3.5'>
      <span className='text-xs font-medium text-[var(--tt-ink-soft)]'>{label}</span>
      <strong className='font-serif text-3xl font-medium text-[var(--tt-ink)]'>{value}</strong>
    </div>
  )
}

function VisitSection({ title, count, children }) {
  return (
    <section>
      <div className='flex items-end justify-between border-b border-[rgba(210,143,119,0.35)] pb-4'>
        <div>
          <h2 className='font-serif text-3xl font-medium tracking-tight text-[var(--tt-ink)]'>{title}</h2>
        </div>
        <span className='font-serif text-2xl font-light text-[var(--tt-muted)]'>{String(count).padStart(2, '0')}</span>
      </div>
      <div>{children}</div>
    </section>
  )
}

function AppointmentEntry({ appointment, onOpen, onCancel, onReschedule }) {
  const editable = canEditAppointmentDate(appointment)
  const status = STATUS[appointment.status] || STATUS.pending
  const petPhoto = appointment.pet?.photoUrl || appointment.petPhotoUrl || appointment.photoUrl
  const date = appointmentDate(appointment)
  const isCat = appointment.petType?.toLowerCase() === 'cat'

  return (
    <article className='editorial-card-hover group rounded-xl border border-[rgba(210,143,119,0.3)] bg-white p-5 shadow-[0_4px_16px_rgba(40,26,18,0.02)]'>
      <div className='flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between'>
        {/* Left: Portrait Matting + Details */}
        <div className='flex items-start gap-4'>
          {/* Museum Matting Thumbnail */}
          <button
            type='button'
            onClick={onOpen}
            className='relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-[rgba(210,143,119,0.3)] bg-[var(--tt-canvas)] p-1.5 shadow-inner transition-transform duration-300 group-hover:scale-105'
          >
            <div className='flex h-full w-full items-center justify-center overflow-hidden rounded-lg bg-[var(--tt-sage)]'>
              {petPhoto ? (
                <img src={petPhoto} alt={appointment.petName} className='h-full w-full object-cover' />
              ) : isCat ? (
                <Cat size={28} strokeWidth={1} className='text-[var(--tt-gold)]' />
              ) : (
                <Dog size={28} strokeWidth={1} className='text-[var(--tt-accent)]' />
              )}
            </div>
          </button>

          {/* Text & Meta */}
          <div className='min-w-0 text-left'>
            <div className='flex flex-wrap items-center gap-2.5'>
              <h3
                onClick={onOpen}
                className='cursor-pointer font-serif text-2xl font-medium text-[var(--tt-ink)] transition-colors hover:text-[var(--tt-gold)]'
              >
                {appointment.petName}
              </h3>
              <span className={`inline-block border px-2.5 py-0.5 text-[12px] font-bold uppercase tracking-[.08em] ${status.className}`}>
                {status.label}
              </span>
            </div>

            <p className='mt-1 text-sm text-[var(--tt-ink-soft)]'>
              <span className='font-medium text-[var(--tt-ink)]'>{appointment.service}</span>
              {appointment.haircutStyle && <span className='italic text-[var(--tt-muted)]'> · {appointment.haircutStyle}</span>}
            </p>

            <div className='mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-[var(--tt-muted)]'>
              <span className='inline-flex items-center gap-1.5'>
                <CalendarDays size={13} className='text-[var(--tt-gold-light)]' />
                {formatDateLong(appointment.date)}
              </span>
              <span className='inline-flex items-center gap-1.5'>
                <Clock3 size={13} className='text-[var(--tt-gold-light)]' />
                {formatTimeRange(appointment.time, appointment.endTime)}
              </span>
              {!Number.isNaN(date.getTime()) && (
                <span className='capitalize text-[var(--tt-gold)]'>
                  ({date.toLocaleDateString('en-PH', { weekday: 'long' })})
                </span>
              )}
            </div>

            {appointment.status === 'in_progress' && (() => {
              const stages = getStagesForService(appointment.serviceId)
              const progress = getStageProgress(stages, appointment.serviceStageKey)
              return (
                <div className='mt-3 flex items-center gap-2.5 rounded-lg border border-[var(--tt-success-border)] bg-[var(--tt-success-bg)] px-3.5 py-2 text-xs text-[#216245]'>
                  <span className='relative flex h-2 w-2 shrink-0'>
                    <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-[#216245] opacity-75'></span>
                    <span className='relative inline-flex h-2 w-2 rounded-full bg-[#216245]'></span>
                  </span>
                  <span className='font-medium text-[#183f2c]'>
                    Live Milestone: <strong className='text-[#216245]'>{appointment.serviceStage || stages[0]?.label}</strong> · Step {progress.currentStep} of {progress.totalSteps}
                  </span>
                </div>
              )
            })()}

            {appointment.status === 'cancelled' && appointment.cancellationReason && (
              <p className='mt-2.5 max-w-xl text-xs italic leading-relaxed text-[#934b4b]'>
                Cancellation reason: &ldquo;{appointment.cancellationReason}&rdquo;
              </p>
            )}
          </div>
        </div>

        {/* Right: Price & Actions */}
        <div className='flex flex-wrap items-center justify-between gap-3 border-t border-[rgba(210,143,119,0.2)] pt-3 sm:border-t-0 sm:pt-0 sm:justify-end'>
          <div className='mr-2 text-left sm:text-right'>
            <p className='text-[12px] font-bold uppercase tracking-[.08em] text-[var(--tt-gold)]'>Service Fee</p>
            <p className='font-serif text-2xl font-semibold text-[var(--tt-ink)]'>
              ₱{Number(appointment.price || 0).toLocaleString('en-PH')}
            </p>
          </div>

          <div className='flex items-center gap-2'>
            {onReschedule && editable && appointment.status !== 'in_progress' && (
              <button
                type='button'
                onClick={onReschedule}
                className='inline-flex h-9 items-center gap-1.5 rounded-md border border-[rgba(210,143,119,0.4)] bg-white px-3.5 text-xs font-medium text-[var(--tt-ink)] shadow-xs transition-colors hover:border-[var(--tt-gold)] hover:bg-[#fbf5ee]'
              >
                <Calendar size={13} className='text-[var(--tt-gold)]' />
                Reschedule
              </button>
            )}

            {onCancel && appointment.status !== 'in_progress' && (
              <button
                type='button'
                onClick={onCancel}
                className='inline-flex h-9 items-center gap-1.5 rounded-md border border-[var(--tt-danger-border)] bg-white px-3.5 text-xs font-medium text-[#934b4b] shadow-xs transition-colors hover:bg-[var(--tt-danger-bg)]'
              >
                <XCircle size={13} />
                Cancel
              </button>
            )}

            <button
              type='button'
              onClick={onOpen}
              aria-label='View appointment details'
              className='grid h-9 w-9 place-items-center rounded-md bg-[var(--tt-brand-strong)] text-white shadow-sm transition-all duration-300 hover:bg-[var(--tt-brand)] active:scale-95'
            >
              <Eye size={14} />
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

function EmptyState({ upcoming = false }) {
  return (
    <div className='rounded-2xl border border-[rgba(210,143,119,0.3)] bg-white/70 py-12 px-6 text-center shadow-[0_8px_24px_rgba(40,26,18,0.02)] backdrop-blur-sm sm:py-16'>
      <div className='mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[rgba(210,143,119,0.35)] bg-[var(--tt-canvas)] text-[var(--tt-gold-light)]'>
        <CalendarDays size={26} strokeWidth={1.2} />
      </div>
      <h3 className='mt-4 font-serif text-2xl font-medium text-[var(--tt-ink)]'>
        {upcoming ? 'No upcoming appointments.' : 'No past visits yet.'}
      </h3>
      <p className='mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--tt-ink-soft)]'>
        {upcoming
          ? 'Book a grooming session for your pet whenever you are ready.'
          : 'Completed and cancelled appointments will show up here.'}
      </p>
      {upcoming && (
        <Link
          to='/booking'
          className='gold-underline mt-5 inline-flex items-center gap-1.5 pb-1 text-xs font-semibold text-[var(--tt-ink)]'
        >
          <Plus size={13} className='text-[var(--tt-gold)]' /> Book an appointment{' '}
          <ChevronRight size={13} className='text-[var(--tt-accent)]' />
        </Link>
      )}
    </div>
  )
}