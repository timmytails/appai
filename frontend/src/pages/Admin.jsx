import {
    createElement,
    useEffect,
    useMemo,
    useState
} from 'react'

import {
    AlertCircle,
    AlertTriangle,
    ArrowRight,
    Ban,
    BarChart3,
    Bell,
    CalendarDays,
    Check,
    CheckCheck,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    CircleDollarSign,
    ClipboardList,
    Clock3,
    Download,
    Image as ImageIcon,
    Inbox,
    LogOut,
    Mail,
    Megaphone,
    MessageSquare,
    Phone,
    RefreshCw,
    Scissors,
    Search,
    Send,
    ShieldAlert,
    Sparkles,
    Trash2,
    UserRound,
    Users,
    UserX,
    X,
    ZoomIn
} from 'lucide-react'

import {
    useNavigate
} from 'react-router-dom'

import toast from 'react-hot-toast'

import {
    adminApi,
    getErrorMessage
} from '../utils/api'

import { useAuth } from '../context/AuthContext'
import { getAccountStatusLabel, mergePersistedCustomerStatus } from '../utils/customerStatus'
import { getStagesForService } from '../utils/serviceStages'
import ConfirmModal from '../components/ConfirmModal'
import AdminCancelModal from '../components/AdminCancelModal'

const STATUS_META = {
    pending: {
        label: 'Pending',
        badge: 'bg-[var(--tt-warn-bg)] text-[var(--tt-warn)] ring-1 ring-[var(--tt-warn-border)]'
    },
    confirmed: {
        label: 'Approved',
        badge: 'bg-[var(--tt-success-bg)] text-[#216245] ring-1 ring-[var(--tt-success-border)]'
    },
    in_progress: {
        label: 'In Service',
        badge: 'bg-[var(--tt-success-bg)] text-[#216245] ring-1 ring-[var(--tt-success-border)]'
    },
    completed: {
        label: 'Completed',
        badge: 'bg-[var(--tt-sage)] text-[var(--tt-ink-soft)] ring-1 ring-[var(--tt-success-border)]'
    },
    cancelled: {
        label: 'Cancelled',
        badge: 'bg-[var(--tt-danger-bg)] text-[#934b4b] ring-1 ring-[var(--tt-danger-border)]'
    }
}

const NAV_ITEMS = [
    {
        id: 'dashboard',
        label: 'Overview',
        icon: BarChart3
    },
    {
        id: 'bookings',
        label: 'Bookings',
        icon: ClipboardList
    },
    {
        id: 'schedule',
        label: 'Schedule',
        icon: CalendarDays
    },
    {
        id: 'messages',
        label: 'Messages',
        icon: Mail
    },
    {
        id: 'customers',
        label: 'Customers',
        icon: Users
    },
    {
        id: 'analytics',
        label: 'Analytics',
        icon: BarChart3
    },
    {
        id: 'notifications',
        label: 'Notifications',
        icon: Bell
    }
]


const ADMIN_TAB_META = {
    dashboard: { title: 'Operations overview', description: 'Today’s appointments, pending approvals, service totals and items requiring staff attention.' },
    bookings: { title: 'Bookings', description: 'Review appointment details, confirm requests and update each visit as work progresses.' },
    schedule: { title: 'Schedule', description: 'Review reserved salon windows by day and identify capacity before accepting additional visits.' },
    messages: { title: 'Customer messages', description: 'Read contact requests and mark conversations as handled once the customer has been assisted.' },
    customers: { title: 'Customers', description: 'Review customer contact details, pets, appointment history and account access status.' },
    analytics: { title: 'Reports', description: 'Review completed services, booking status, revenue totals and service demand from recorded appointments.' },
    notifications: { title: 'Customer notices', description: 'Send service updates or salon notices to customers without changing their account permissions.' }
}

const BOOKING_FILTERS = [
    {
        id: '',
        label: 'All Bookings'
    },
    {
        id: 'pending',
        label: 'Pending'
    },
    {
        id: 'confirmed',
        label: 'Approved'
    },
    {
        id: 'in_progress',
        label: 'In Service'
    },
    {
        id: 'completed',
        label: 'Completed'
    },
    {
        id: 'cancelled',
        label: 'Cancelled'
    }
]

const formatPeso = (value) =>
    new Intl.NumberFormat(
        'en-PH',
        {
            style: 'currency',
            currency: 'PHP',
            maximumFractionDigits: 0
        }
    ).format(Number(value) || 0)

const formatDate = (
    value,
    options = {}
) => {
    if (!value) return '—'

    const date =
        /^\d{4}-\d{2}-\d{2}$/.test(
            String(value)
        )
            ? new Date(
                `${value}T12:00:00`
            )
            : new Date(value)

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return String(value)
    }

    return date.toLocaleDateString(
        'en-PH',
        {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            ...options
        }
    )
}

const formatShortDate = (value) =>
    formatDate(value, {
        month: 'short'
    })

const formatTime = (value) => {
    if (!value) return '—'

    const [
        hoursValue,
        minutesValue = '00'
    ] = String(value).split(':')

    const hours = Number(
        hoursValue
    )

    if (
        !Number.isFinite(hours)
    ) {
        return String(value)
    }

    const suffix =
        hours >= 12
            ? 'PM'
            : 'AM'

    const displayHours =
        hours % 12 || 12

    return `${displayHours}:${minutesValue} ${suffix}`
}

const dateKey = (date) => {
    const year =
        date.getFullYear()

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, '0')

    const day =
        String(
            date.getDate()
        ).padStart(2, '0')

    return `${year}-${month}-${day}`
}

const startOfWeek = (
    source = new Date()
) => {
    const date =
        new Date(source)

    const day =
        date.getDay()

    const difference =
        day === 0
            ? -6
            : 1 - day

    date.setDate(
        date.getDate() +
        difference
    )

    date.setHours(
        12,
        0,
        0,
        0
    )

    return date
}

const buildWeek = (anchor) =>
    Array.from(
        {
            length: 7
        },
        (_, index) => {
            const date =
                new Date(anchor)

            date.setDate(
                anchor.getDate() +
                index
            )

            return date
        }
    )

const buildMonthGrid = (anchor) => {
    const year = anchor.getFullYear()
    const month = anchor.getMonth()
    const firstDayOfMonth = new Date(year, month, 1)
    const startDayIndex = firstDayOfMonth.getDay() // 0 is Sun

    const startDate = new Date(year, month, 1 - startDayIndex)
    startDate.setHours(12, 0, 0, 0)

    const days = []
    for (let i = 0; i < 42; i++) {
        const d = new Date(startDate)
        d.setDate(startDate.getDate() + i)
        days.push({
            date: d,
            isCurrentMonth: d.getMonth() === month,
            key: dateKey(d)
        })
    }

    return {
        title: firstDayOfMonth.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' }),
        days
    }
}

const getOwnerName = (
    appointment
) =>
    appointment?.ownerName ||
    [
        appointment?.user
            ?.firstName,
        appointment?.user
            ?.lastName
    ]
        .filter(Boolean)
        .join(' ') ||
    'Customer'

const getInitials = (
    firstName,
    lastName
) =>
    `${firstName?.[0] || ''}${lastName?.[0] || ''}`
        .toUpperCase() ||
    'C'

const getCustomerAddress = (
    customer
) => {
    const address =
        customer?.address || {}

    return [
        address.street,
        address.barangay
            ? `Brgy. ${address.barangay}`
            : '',
        address.city,
        address.province
    ]
        .filter(Boolean)
        .join(', ') ||
        customer?.homeAddress ||
        'No address provided'
}

export default function Admin() {
    const navigate =
        useNavigate()

    const {
        user,
        logout
    } = useAuth()

    const [
        activeTab,
        setActiveTab
    ] = useState(
        'dashboard'
    )


    const [
        loading,
        setLoading
    ] = useState(true)

    const [
        refreshing,
        setRefreshing
    ] = useState(false)

    const [
        stats,
        setStats
    ] = useState(null)

    const [
        appointments,
        setAppointments
    ] = useState([])

    const [
        analytics,
        setAnalytics
    ] = useState(null)

    const [
        customers,
        setCustomers
    ] = useState([])

    const [
        contacts,
        setContacts
    ] = useState([])

    const [
        adminNotifications,
        setAdminNotifications
    ] = useState([])

    const [
        notifLoading,
        setNotifLoading
    ] = useState(false)

    const [
        bookingFilter,
        setBookingFilter
    ] = useState('')

    const [
        search,
        setSearch
    ] = useState('')

    const [
        selectedBookingId,
        setSelectedBookingId
    ] = useState(null)

    const [
        updatingId,
        setUpdatingId
    ] = useState(null)

    const [
        cancelModalAppointment,
        setCancelModalAppointment
    ] = useState(null)

    const [
        weekAnchor,
        setWeekAnchor
    ] = useState(
        startOfWeek()
    )

    useEffect(() => {
        if (!user) {
            navigate('/login')
            return
        }

        if (
            user.role !== 'admin'
        ) {
            toast.error(
                'Admin access required'
            )

            navigate('/')
        }
    }, [
        user,
        navigate
    ])

    const loadData = async (
        showRefresh = false
    ) => {
        if (showRefresh) {
            setRefreshing(true)
        } else {
            setLoading(true)
        }

        try {
            const [
                statsResult,
                appointmentsResult,
                analyticsResult,
                customersResult,
                contactsResult,
                notificationsResult
            ] = await Promise.allSettled([
                adminApi.getStats(),
                adminApi.getAppointments({ limit: 100 }),
                adminApi.getAnalytics(),
                adminApi.getUsers(),
                adminApi.getContacts(),
                adminApi.getNotifications()
            ])

            if (statsResult.status === 'fulfilled') {
                setStats(statsResult.value.data.stats || null)
            }
            if (appointmentsResult.status === 'fulfilled') {
                setAppointments(appointmentsResult.value.data.appointments || [])
            }
            if (analyticsResult.status === 'fulfilled') {
                setAnalytics(analyticsResult.value.data.analytics || null)
            }
            if (customersResult.status === 'fulfilled') {
                setCustomers(customersResult.value.data.users || [])
            }
            if (contactsResult.status === 'fulfilled') {
                setContacts(contactsResult.value.data.contacts || [])
            }
            if (notificationsResult.status === 'fulfilled') {
                setAdminNotifications(notificationsResult.value.data.notifications || [])
            }

            const rejected = [statsResult, appointmentsResult, analyticsResult, customersResult, contactsResult].find((r) => r.status === 'rejected')
            if (rejected && showRefresh) {
                toast.error(getErrorMessage(rejected.reason))
            }
        } catch (error) {
            toast.error(
                getErrorMessage(error)
            )
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        if (
            user?.role === 'admin'
        ) {
            queueMicrotask(loadData)
        }
    }, [user])

    const selectedBooking =
        useMemo(
            () =>
                appointments.find(
                    (item) =>
                        item._id ===
                        selectedBookingId
                ) || null,
            [
                appointments,
                selectedBookingId
            ]
        )

    const filteredAppointments =
        useMemo(() => {
            const query =
                search
                    .trim()
                    .toLowerCase()

            return appointments
                .filter(
                    (appointment) =>
                        !bookingFilter ||
                        appointment.status ===
                        bookingFilter
                )
                .filter(
                    (appointment) => {
                        if (!query) {
                            return true
                        }

                        return [
                            appointment.petName,
                            appointment.breed,
                            appointment.service,
                            appointment.haircutStyle,
                            getOwnerName(
                                appointment
                            ),
                            appointment.ownerPhone,
                            appointment.ownerEmail
                        ]
                            .filter(Boolean)
                            .some((value) =>
                                String(value)
                                    .toLowerCase()
                                    .includes(
                                        query
                                    )
                            )
                    }
                )
                .sort(
                    (first, second) =>
                        new Date(
                            second.startAt ||
                            `${second.date}T${second.time}`
                        ) -
                        new Date(
                            first.startAt ||
                            `${first.date}T${first.time}`
                        )
                )
        }, [
            appointments,
            bookingFilter,
            search
        ])

    const today =
        dateKey(new Date())

    const todaysAppointments =
        useMemo(
            () =>
                appointments
                    .filter(
                        (appointment) =>
                            appointment.date ===
                            today
                    )
                    .sort(
                        (first, second) =>
                            String(
                                first.time
                            ).localeCompare(
                                String(
                                    second.time
                                )
                            )
                    ),
            [
                appointments,
                today
            ]
        )

    const pendingAppointments =
        useMemo(
            () =>
                appointments
                    .filter(
                        (appointment) =>
                            appointment.status ===
                            'pending'
                    )
                    .sort(
                        (first, second) =>
                            new Date(
                                first.startAt ||
                                `${first.date}T${first.time}`
                            ) -
                            new Date(
                                second.startAt ||
                                `${second.date}T${second.time}`
                            )
                    ),
            [appointments]
        )

    const monthlyAppointments =
        analytics?.monthlyData ||
        []

    const currentMonthKey =
        `${new Date().getFullYear()}-${String(
            new Date().getMonth() + 1
        ).padStart(2, '0')}`

    const currentMonthData =
        monthlyAppointments.find(
            (item) =>
                item.monthKey ===
                currentMonthKey
        ) ||
        monthlyAppointments[
        monthlyAppointments.length -
        1
        ] ||
        {
            appointments: 0,
            revenue: 0
        }

    const aiPreviewBookings =
        appointments.filter(
            (appointment) =>
                appointment.aiPreviewUsed &&
                appointment.status !==
                'cancelled'
        )

    const eligibleStyleBookings =
        appointments.filter(
            (appointment) =>
                appointment.haircutStyle &&
                appointment.status !==
                'cancelled'
        )

    const aiUsageRate =
        eligibleStyleBookings.length
            ? Math.round(
                (aiPreviewBookings.length /
                    eligibleStyleBookings.length) *
                100
            )
            : 0

    const completedRate =
        appointments.length
            ? Math.round(
                (appointments.filter(
                    (appointment) =>
                        appointment.status ===
                        'completed'
                ).length /
                    appointments.length) *
                100
            )
            : 0

    const handleStatusUpdate =
        async (
            appointment,
            status,
            cancellationReason = ''
        ) => {
            if (
                appointment.status ===
                status
            ) {
                return
            }

            if (
                [
                    'completed',
                    'cancelled'
                ].includes(
                    appointment.status
                )
            ) {
                toast.error(
                    `This booking is already ${STATUS_META[appointment.status]?.label.toLowerCase()}`
                )

                return
            }

            if (status === 'cancelled' && !cancellationReason) {
                setCancelModalAppointment(appointment)
                return
            }

            setUpdatingId(
                appointment._id
            )

            try {
                await adminApi.updateStatus(
                    appointment._id,
                    status,
                    cancellationReason
                )

                toast.success(
                    `Booking marked as ${STATUS_META[status]?.label || status}`
                )

                if (cancelModalAppointment) {
                    setCancelModalAppointment(null)
                }

                await loadData(true)
            } catch (error) {
                toast.error(
                    getErrorMessage(error)
                )
            } finally {
                setUpdatingId(null)
            }
        }

    const handleStageUpdate = async (appointment, stage) => {
        setUpdatingId(appointment._id)
        try {
            await adminApi.updateServiceStage(appointment._id, stage.label, stage.id)
            toast.success(`Service stage updated: ${stage.label}`)
            await loadData(true)
        } catch (error) {
            toast.error(getErrorMessage(error))
        } finally {
            setUpdatingId(null)
        }
    }

    const handleLogout = () => {
        logout()
        navigate('/')
    }

    const changeTab = (tab) => {
        setActiveTab(tab)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const unreadContactsCount = useMemo(() => (contacts || []).filter((c) => c && !c.read).length, [contacts])

    if (loading) {
        return (
            <div className='grid min-h-screen place-items-center bg-[var(--tt-canvas)] text-[var(--tt-ink)]'>
                <div className='text-center'>
                    <RefreshCw
                        className='mx-auto animate-spin text-[var(--tt-brand)]'
                        size={30}
                    />

                    <p className='mt-3 font-medium text-[var(--tt-muted)] text-sm'>
                        Loading dashboard...
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className='admin-page studio-theme min-h-screen bg-[var(--tt-canvas)] text-[var(--tt-ink)]'>
            <header className='sticky top-0 z-50 border-b border-[var(--tt-border)] bg-[var(--tt-canvas)]/96 backdrop-blur'>
                <div className='mx-auto flex min-h-[76px] max-w-[1560px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8'>
                    <button
                        type='button'
                        onClick={() => changeTab('dashboard')}
                        className='flex shrink-0 items-center gap-2.5 sm:gap-3 transition-opacity hover:opacity-85'
                        aria-label='Open admin overview'
                    >
                        <img
                            src='/logo.png'
                            alt='TimmyTails'
                            className='h-9 w-9 sm:h-10 sm:w-10 rounded-full object-cover border border-[rgba(210,143,119,0.35)] shadow-xs'
                        />
                        <div className='flex items-center gap-2'>
                            <span className='font-serif text-lg sm:text-xl font-medium tracking-tight text-[var(--tt-ink)]'>
                                TimmyTails
                            </span>
                            <span className='rounded-lg border border-[var(--tt-border)] bg-white px-2 py-0.5 text-[12px] font-medium text-[var(--tt-muted)]'>
                                Admin
                            </span>
                        </div>
                    </button>

                    <div className='flex items-center gap-2 sm:gap-3'>
                        <span className='hidden text-[12px] font-medium text-[var(--tt-muted)] xl:inline'>{formatDate(new Date())}</span>
                        <button onClick={() => loadData(true)} disabled={refreshing} className='grid h-10 w-10 place-items-center rounded-lg border border-[var(--tt-border)] bg-white text-[var(--tt-muted)] hover:text-[var(--tt-ink)] transition disabled:opacity-40 shadow-xs' aria-label='Refresh administration data'>
                            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
                        </button>
                        <div className='hidden items-center gap-2.5 border-l border-[var(--tt-border)] pl-3.5 sm:flex'>
                            <span className='grid h-8 w-8 place-items-center rounded-full bg-[var(--tt-accent-soft)] font-serif text-sm font-semibold'>{(user?.firstName?.[0] || 'A').toUpperCase()}</span>
                            <div className='hidden lg:block text-left'>
                                <div className='flex items-center gap-1.5'>
                                    <p className='text-[12px] font-bold text-[var(--tt-ink)]'>
                                        {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : (user?.firstName || 'Salon Staff')}
                                    </p>
                                    <span className='rounded-full bg-[var(--tt-accent)]/15 px-1.5 py-0.5 text-[12px] font-bold uppercase tracking-[.08em] text-[var(--tt-accent)] border border-[var(--tt-accent)]/30'>
                                        Admin
                                    </span>
                                </div>
                                <p className='max-w-40 truncate text-[12px] text-[var(--tt-muted)]'>{user?.email || user?.phone}</p>
                            </div>
                        </div>
                        <button type='button' onClick={handleLogout} className='grid h-10 w-10 place-items-center rounded-lg text-[var(--tt-muted)] hover:text-[#934b4b] hover:bg-[var(--tt-danger-bg)]/50 transition' aria-label='Sign out'><LogOut size={15} /></button>
                    </div>
                </div>
            </header>

            <nav className='sticky top-[76px] z-40 border-b border-[var(--tt-border)] bg-white/96 backdrop-blur' aria-label='Admin workspace navigation'>
                <div className='no-scrollbar mx-auto flex max-w-[1560px] items-stretch overflow-x-auto px-2 sm:px-4 lg:px-6'>
                    {NAV_ITEMS.map(({ id, label, icon }) => {
                        const isActive = activeTab === id
                        const count = id === 'bookings' ? pendingAppointments.length : id === 'messages' ? unreadContactsCount : 0
                        return (
                            <button key={id} onClick={() => changeTab(id)} className={`relative inline-flex min-h-13 shrink-0 items-center gap-2 px-3.5 text-[12px] font-semibold transition sm:px-4 ${isActive ? 'text-[var(--tt-ink)]' : 'text-[var(--tt-muted)] hover:text-[var(--tt-ink)]'}`}>
                                {createElement(icon, { size: 14, strokeWidth: 1.7 })}
                                {label}
                                {count > 0 && <span className='grid min-w-5 place-items-center rounded-full bg-[var(--tt-accent-soft)] px-1.5 py-0.5 text-[12px] font-bold text-[#79584b]'>{count}</span>}
                                {isActive && <span className='absolute inset-x-3 bottom-0 h-px bg-[var(--tt-gold)]' />}
                            </button>
                        )
                    })}
                </div>
            </nav>

            <main className='mx-auto max-w-[1480px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12'>
                <section className='mb-10 grid gap-5 border-b border-[var(--tt-border)] pb-8 sm:grid-cols-[1fr_auto] sm:items-end'>
                    <div>
                        <h1 className='font-serif text-4xl font-normal tracking-[-.03em] sm:text-5xl'>{ADMIN_TAB_META[activeTab]?.title}</h1>
                        <p className='mt-3 max-w-2xl text-sm leading-6 text-[var(--tt-muted)]'>{ADMIN_TAB_META[activeTab]?.description}</p>
                    </div>
                    <div className='flex flex-wrap items-center gap-3 text-[12px] text-[var(--tt-muted)]'>
                        <span className='inline-flex items-center gap-2'><span className='h-1.5 w-1.5 rounded-full bg-[#6c845c]' />Live data</span>
                        {pendingAppointments.length > 0 && <button type='button' onClick={() => changeTab('bookings')} className='inline-flex items-center gap-1.5 border-l border-[var(--tt-border)] pl-3 font-semibold text-[#79584b]'><Clock3 size={12} />{pendingAppointments.length} pending</button>}
                    </div>
                </section>

                {activeTab === 'dashboard' && (
                    <DashboardView
                        stats={stats}
                        todaysAppointments={todaysAppointments}
                        pendingAppointments={pendingAppointments}
                        updatingId={updatingId}
                        onStatusUpdate={handleStatusUpdate}
                        onViewBookings={() => changeTab('bookings')}
                        onViewAnalytics={() => changeTab('analytics')}
                        analytics={analytics}
                        appointments={appointments}
                        aiUsageRate={aiUsageRate}
                        completedRate={completedRate}
                    />
                )}

                {activeTab === 'bookings' && (
                    <BookingsView appointments={filteredAppointments} filter={bookingFilter} onFilter={setBookingFilter} search={search} onSearch={setSearch} selected={selectedBooking} onSelect={setSelectedBookingId} updatingId={updatingId} onStatusUpdate={handleStatusUpdate} onStageUpdate={handleStageUpdate} />
                )}

                {activeTab === 'schedule' && (
                    <ScheduleView
                        appointments={appointments}
                        weekAnchor={weekAnchor}
                        onStatusUpdate={handleStatusUpdate}
                        onStageUpdate={handleStageUpdate}
                        updatingId={updatingId}
                        onPrevious={() => { const next = new Date(weekAnchor); next.setDate(next.getDate() - 7); setWeekAnchor(next) }}
                        onNext={() => { const next = new Date(weekAnchor); next.setDate(next.getDate() + 7); setWeekAnchor(next) }}
                        onToday={() => setWeekAnchor(startOfWeek())}
                    />
                )}

                {activeTab === 'messages' && <ContactsView contacts={contacts} onRefresh={() => loadData(true)} />}
                {activeTab === 'customers' && <CustomersView customers={customers} onRefresh={() => loadData(true)} />}
                {activeTab === 'analytics' && <AnalyticsView analytics={analytics} currentMonthData={currentMonthData} appointments={appointments} aiUsageRate={aiUsageRate} completedRate={completedRate} />}
                {activeTab === 'notifications' && (
                    <NotificationsView
                        notifications={adminNotifications}
                        customers={customers}
                        loading={notifLoading}
                        onSend={async (payload) => {
                            setNotifLoading(true)
                            try {
                                await adminApi.createNotification(payload)
                                toast.success('Notification sent successfully!')
                                const res = await adminApi.getNotifications()
                                setAdminNotifications(res.data.notifications || [])
                            } catch (err) {
                                toast.error(getErrorMessage(err))
                            } finally {
                                setNotifLoading(false)
                            }
                        }}
                    />
                )}
            </main>

            <AdminCancelModal
                isOpen={Boolean(cancelModalAppointment)}
                appointment={cancelModalAppointment}
                loading={Boolean(updatingId)}
                onConfirm={(reason) => { if (cancelModalAppointment) handleStatusUpdate(cancelModalAppointment, 'cancelled', reason) }}
                onClose={() => setCancelModalAppointment(null)}
            />
        </div>
    )
}


function DashboardView({
    stats,
    todaysAppointments,
    pendingAppointments,
    updatingId,
    onStatusUpdate,
    onViewBookings,
    onViewAnalytics,
    analytics,
    appointments = [],
    aiUsageRate = 0,
    completedRate = 0
}) {
    const confirmedToday = todaysAppointments.filter((item) => item.status === 'confirmed').length
    const serviceCounts = useMemo(() => {
        const counts = {}
        appointments.forEach((appointment) => {
            if (appointment.service) counts[appointment.service] = (counts[appointment.service] || 0) + 1
        })
        const total = appointments.length || 1
        return Object.entries(counts)
            .map(([name, count]) => ({ name, count, pct: Math.round((count / total) * 100) }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 4)
    }, [appointments])

    return (
        <div className='space-y-14'>
            <section>
                <div className='grid border-y border-[var(--tt-border)] sm:grid-cols-2 xl:grid-cols-4'>
                    <AdminStat label="Today's appointments" value={stats?.todayAppointments ?? todaysAppointments.length} />
                    <AdminStat label='Awaiting approval' value={stats?.pendingAppointments ?? pendingAppointments.length} />
                    <AdminStat label='Approved today' value={confirmedToday} />
                    <AdminStat label="Today's revenue" value={formatPeso(stats?.todayRevenue)} />
                </div>
            </section>

            <section className='grid gap-12 xl:grid-cols-[1.25fr_.75fr]'>
                <div>
                    <div className='flex items-end justify-between gap-4 border-b border-[var(--tt-border)] pb-4'>
                        <div><h2 className='font-serif text-3xl font-normal'>Today’s schedule</h2></div>
                        <button type='button' onClick={onViewBookings} className='inline-flex items-center gap-1 text-xs font-medium text-[var(--tt-muted)] hover:text-[var(--tt-ink)]'>All bookings<ArrowRight size={12} aria-hidden='true' /></button>
                    </div>
                    {todaysAppointments.length ? (
                        <div>
                            {todaysAppointments.map((appointment) => <ScheduleRow key={appointment._id} appointment={appointment} />)}
                        </div>
                    ) : (
                        <div className='py-14'><CalendarDays size={26} strokeWidth={1.2} className='text-[var(--tt-gold)]' /><p className='mt-4 font-serif text-2xl'>A clear salon calendar today.</p><p className='mt-2 text-xs text-[var(--tt-muted)]'>New approved appointments will appear here in time order.</p></div>
                    )}
                </div>

                <div>
                    <div className='flex items-end justify-between gap-4 border-b border-[var(--tt-border)] pb-4'>
                        <div><h2 className='font-serif text-3xl font-normal'>Pending approvals</h2></div>
                        <span className='font-serif text-2xl text-[var(--tt-muted)]'>{String(pendingAppointments.length).padStart(2, '0')}</span>
                    </div>
                    {pendingAppointments.length ? (
                        <div>
                            {pendingAppointments.slice(0, 6).map((appointment) => (
                                <div key={appointment._id} className='border-b border-[var(--tt-border)] py-5'>
                                    <div className='flex items-start gap-3'>
                                        <PetAvatar appointment={appointment} />
                                        <div className='min-w-0 flex-1'>
                                            <p className='font-serif text-lg'>{appointment.petName} <span className='font-sans text-[12px] text-[var(--tt-muted)]'>with {getOwnerName(appointment)}</span></p>
                                            <p className='mt-1 text-[12px] leading-5 text-[var(--tt-muted)]'>{appointment.service} · {formatDate(appointment.date)} · {formatTime(appointment.time)}</p>
                                        </div>
                                    </div>
                                    <div className='mt-4 flex gap-2 pl-[52px]'>
                                        <button disabled={updatingId === appointment._id} onClick={() => onStatusUpdate(appointment, 'confirmed')} className='min-h-8 rounded-md bg-[var(--tt-ink)] px-3.5 text-xs font-medium text-white transition hover:bg-[var(--tt-brand)] disabled:opacity-50'>Approve</button>
                                        <button disabled={updatingId === appointment._id} onClick={() => onStatusUpdate(appointment, 'cancelled')} className='min-h-8 rounded-md border border-[var(--tt-danger-border)] bg-white px-3.5 text-xs font-medium text-[#934b4b] transition hover:bg-[#fbf4f4] disabled:opacity-50'>Decline</button>
                                    </div>
                                </div>
                            ))}
                            {pendingAppointments.length > 6 && <button type='button' onClick={onViewBookings} className='mt-5 inline-flex items-center gap-1 text-xs font-medium text-[var(--tt-muted)] hover:text-[var(--tt-ink)]'>Review all pending<ArrowRight size={12} aria-hidden='true' /></button>}
                        </div>
                    ) : (
                        <div className='py-12'><CheckCircle2 size={24} strokeWidth={1.2} className='text-[#6f7a4f]' /><p className='mt-4 font-serif text-xl'>Everything has been reviewed.</p><p className='mt-2 text-xs text-[var(--tt-muted)]'>No bookings are waiting for approval.</p></div>
                    )}
                </div>
            </section>

            <section className='border-t border-[var(--tt-border)] pt-10'>
                <div className='mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
                    <div><h2 className='font-serif text-3xl font-normal'>Demand and completion</h2></div>
                    <button type='button' onClick={onViewAnalytics} className='inline-flex items-center gap-1 self-start border-b border-[var(--tt-ink)] pb-1 text-xs font-medium sm:self-auto'>Open analytics<ArrowRight size={12} aria-hidden='true' /></button>
                </div>
                <div className='grid gap-10 lg:grid-cols-[1.1fr_.9fr]'>
                    <div>
                        <p className='mb-4 text-[12px] font-bold uppercase tracking-[.08em] text-[var(--tt-muted)]'>Most booked services</p>
                        {serviceCounts.length ? serviceCounts.map((service) => (
                            <div key={service.name} className='grid grid-cols-[1fr_auto] items-center gap-x-4 border-b border-[var(--tt-border)] py-3'>
                                <div><div className='flex items-center justify-between gap-4 text-xs'><span>{service.name}</span><span className='text-[var(--tt-muted)]'>{service.count} bookings</span></div><div className='mt-2 h-px bg-[var(--tt-border)]'><div className='h-px bg-[var(--tt-gold)]' style={{ width: `${Math.max(service.pct, 8)}%` }} /></div></div>
                                <span className='font-serif text-xl text-[var(--tt-muted)]'>{service.pct}%</span>
                            </div>
                        )) : <p className='text-xs text-[var(--tt-muted)]'>Service demand will appear after bookings are recorded.</p>}
                    </div>
                    <div className='grid grid-cols-2 border-l border-t border-[var(--tt-border)]'>
                        <PulseStat label='All-time revenue' value={formatPeso(stats?.totalRevenue || analytics?.totalRevenue || 0)} />
                        <PulseStat label='Completion rate' value={`${completedRate}%`} />
                        <PulseStat label='Total bookings' value={appointments.length} />
                        <PulseStat label='Style preview usage' value={`${aiUsageRate}%`} />
                    </div>
                </div>
            </section>
        </div>
    )
}

function AdminStat({ label, value }) {
    return <div className='border-b border-[var(--tt-border)] px-1 py-6 sm:border-b-0 sm:border-r sm:px-5 sm:last:border-r-0 xl:py-8'><p className='text-[12px] font-bold uppercase tracking-[.08em] text-[var(--tt-muted)]'>{label}</p><p className='mt-2 font-serif text-4xl font-normal tracking-[-.03em]'>{value}</p></div>
}

function PulseStat({ label, value }) {
    return <div className='border-b border-r border-[var(--tt-border)] p-5'><p className='text-[12px] font-bold uppercase tracking-[.08em] text-[var(--tt-muted)]'>{label}</p><p className='mt-3 font-serif text-2xl font-normal'>{value}</p></div>
}

function MetricCard({
    icon,
    value,
    label,
    tone,
    compact = false
}) {
    const config = {
        orange: { iconColor: 'text-[var(--tt-brand-strong)]', bg: 'bg-[var(--tt-sage)]', bar: 'bg-[var(--tt-brand-strong)]' },
        amber:  { iconColor: 'text-[#C95F47]', bg: 'bg-[#FDF0ED]', bar: 'bg-[#C95F47]' },
        blue:   { iconColor: 'text-[var(--tt-brand)]', bg: 'bg-[#E3EEE8]', bar: 'bg-[var(--tt-brand)]' },
        green:  { iconColor: 'text-[var(--tt-brand-strong)]', bg: 'bg-[var(--tt-sage)]', bar: 'bg-[var(--tt-brand-strong)]' }
    }
    const c = config[tone] || config.orange

    return (
        <div className='relative overflow-hidden rounded-sm border border-[var(--tt-border)] bg-white p-5 shadow-xs transition hover:shadow-sm'>
            <span className={`absolute left-0 top-0 h-full w-1 ${c.bar}`} />
            <div className={`mb-3 inline-grid h-10 w-10 place-items-center rounded-sm ${c.bg}`}>
                {createElement(icon, { size: 20, className: c.iconColor })}
            </div>
            <p className={`font-serif font-bold ${compact ? 'text-2xl' : 'text-3xl'} tracking-tight text-[var(--tt-ink)]`}>
                {value}
            </p>
            <p className='mt-1 text-xs font-semibold text-[var(--tt-muted)]'>{label}</p>
        </div>
    )
}

function ScheduleRow({ appointment }) {
    return (
        <div className='flex items-center gap-4 border-b border-[var(--tt-border)] px-5 py-3.5 last:border-b-0 hover:bg-[var(--tt-canvas)]'>
            <PetAvatar appointment={appointment} />

            <div className='min-w-0 flex-1'>
                <div className='flex flex-wrap items-center gap-2'>
                    <p className='text-sm font-bold text-[var(--tt-ink)]'>{appointment.petName}</p>
                    <span className='text-xs text-[var(--tt-brand)]'>{getOwnerName(appointment)}</span>
                    <StatusBadge status={appointment.status} />
                </div>
                <p className='mt-0.5 text-xs text-[var(--tt-brand)]'>
                    {appointment.service}{appointment.haircutStyle ? ` · ${appointment.haircutStyle}` : ''}
                </p>
            </div>

            <div className='shrink-0 text-right'>
                <p className='font-mono text-sm font-semibold text-[var(--tt-brand)]'>{formatTime(appointment.time)}</p>
                {appointment.endTime && (
                    <p className='inline-flex items-center gap-1 text-[12px] text-[var(--tt-brand)]'><ArrowRight size={11} aria-hidden='true' />{formatTime(appointment.endTime)}</p>
                )}
            </div>
        </div>
    )
}

function PaginationControl({ currentPage, totalPages, totalItems, pageSize, onPageChange, label = 'records' }) {
    if (totalItems <= pageSize) return null

    const startItem = (currentPage - 1) * pageSize + 1
    const endItem = Math.min(currentPage * pageSize, totalItems)

    const getPageNumbers = () => {
        const pages = []
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i)
        } else {
            if (currentPage <= 4) {
                pages.push(1, 2, 3, 4, 5, '...', totalPages)
            } else if (currentPage >= totalPages - 3) {
                pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
            } else {
                pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
            }
        }
        return pages
    }

    return (
        <div className='flex flex-col gap-3 rounded-xl border border-[var(--tt-border)] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between shadow-xs'>
            <p className='text-xs font-medium text-[var(--tt-muted)]'>
                Showing <strong className='font-bold text-[var(--tt-ink)]'>{startItem}–{endItem}</strong> of{' '}
                <strong className='font-bold text-[var(--tt-ink)]'>{totalItems}</strong> {label}
            </p>

            <div className='flex items-center gap-1.5'>
                <button
                    type='button'
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className='inline-flex h-8 items-center gap-1 rounded-lg border border-[var(--tt-border)] bg-white px-2.5 text-xs font-semibold text-[var(--tt-ink)] transition hover:bg-[var(--tt-canvas)] disabled:cursor-not-allowed disabled:opacity-40'
                    aria-label='Previous page'
                >
                    <ChevronLeft size={14} /> Previous
                </button>

                <div className='hidden sm:flex items-center gap-1'>
                    {getPageNumbers().map((p, idx) => (
                        p === '...' ? (
                            <span key={`ellipsis-${idx}`} className='px-1.5 text-xs text-[var(--tt-muted)]'>…</span>
                        ) : (
                            <button
                                key={`page-${p}`}
                                type='button'
                                onClick={() => onPageChange(p)}
                                className={`h-8 min-w-[32px] rounded-lg px-2 text-xs font-bold transition ${
                                    currentPage === p
                                        ? 'bg-[var(--tt-ink)] text-white shadow-xs'
                                        : 'text-[var(--tt-ink-soft)] hover:bg-[var(--tt-canvas)]'
                                }`}
                                aria-current={currentPage === p ? 'page' : undefined}
                            >
                                {p}
                            </button>
                        )
                    ))}
                </div>

                <span className='text-xs font-medium text-[var(--tt-muted)] sm:hidden'>
                    Page {currentPage} of {totalPages}
                </span>

                <button
                    type='button'
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className='inline-flex h-8 items-center gap-1 rounded-lg border border-[var(--tt-border)] bg-white px-2.5 text-xs font-semibold text-[var(--tt-ink)] transition hover:bg-[var(--tt-canvas)] disabled:cursor-not-allowed disabled:opacity-40'
                    aria-label='Next page'
                >
                    Next <ChevronRight size={14} />
                </button>
            </div>
        </div>
    )
}

function BookingsView({
    appointments,
    filter,
    onFilter,
    search,
    onSearch,
    selected,
    onSelect,
    updatingId,
    onStatusUpdate,
    onStageUpdate
}) {
    const [page, setPage] = useState(1)
    const pageSize = 10

    useEffect(() => {
        setPage(1)
    }, [filter, search])

    const totalCount = appointments.length
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

    const pagedAppointments = useMemo(() => {
        const start = (page - 1) * pageSize
        return appointments.slice(start, start + pageSize)
    }, [appointments, page, pageSize])

    return (
        <div className='space-y-4'>
            {/* Filter Tabs and Search Bar */}
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                <div className='flex items-center gap-1 overflow-x-auto no-scrollbar rounded-xl border border-[var(--tt-border)] bg-white p-1 shadow-xs w-full sm:w-auto'>
                    {BOOKING_FILTERS.map((item) => (
                        <button
                            key={item.id || 'all'}
                            onClick={() => onFilter(item.id)}
                            className={`shrink-0 rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                                filter === item.id
                                    ? 'bg-[var(--tt-ink)] text-white shadow-xs'
                                    : 'text-[var(--tt-ink-soft)] hover:bg-[var(--tt-canvas)]'
                            }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                <label className='relative block w-full sm:w-72'>
                    <Search size={15} className='absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--tt-brand)]' />
                    <input
                        value={search}
                        onChange={(event) => onSearch(event.target.value)}
                        placeholder='Search pet, customer, service...'
                        className='h-10 w-full rounded-xl border border-[var(--tt-border)] bg-white pl-9 pr-4 text-xs font-medium shadow-xs outline-none transition focus:border-[var(--tt-brand)] focus:ring-1 focus:ring-[var(--tt-brand)]/20'
                    />
                </label>
            </div>

            {/* Full-width Bookings List */}
            <div className='space-y-3'>
                {pagedAppointments.length ? (
                    pagedAppointments.map((appointment) => (
                        <button
                            key={appointment._id}
                            onClick={() => onSelect(appointment._id)}
                            className='group flex w-full flex-col gap-4 rounded-xl border border-[var(--tt-border)] bg-white p-4 sm:p-5 text-left shadow-xs transition hover:border-[var(--tt-brand)] hover:shadow-sm md:flex-row md:items-center md:justify-between'
                        >
                            <div className='flex items-center gap-4 min-w-0'>
                                <PetAvatar appointment={appointment} large />
                                <div className='min-w-0'>
                                    <div className='flex flex-wrap items-center gap-2'>
                                        <p className='font-serif text-lg font-bold text-[var(--tt-ink)]'>{appointment.petName}</p>
                                        <span className='text-xs text-[var(--tt-muted)]'>({appointment.breed})</span>
                                        <StatusBadge status={appointment.status} />
                                        {appointment.status === 'in_progress' && appointment.serviceStage && (
                                            <span className='inline-flex items-center gap-1 rounded-full bg-[var(--tt-success-bg)] px-2.5 py-0.5 text-[12px] font-bold text-[#216245] ring-1 ring-[var(--tt-success-border)]'>
                                                <span className='tt-live text-[#216245]' />
                                                {appointment.serviceStage}
                                            </span>
                                        )}
                                    </div>
                                    <p className='mt-1 text-xs font-medium text-[var(--tt-ink-soft)]'>
                                        Customer: <strong className='text-[var(--tt-ink)]'>{getOwnerName(appointment)}</strong>
                                        {appointment.ownerPhone && <span> · {appointment.ownerPhone}</span>}
                                    </p>
                                </div>
                            </div>

                            <div className='flex items-center justify-between gap-6 border-t border-[var(--tt-border)] pt-3 md:border-0 md:pt-0 md:justify-end'>
                                <div className='text-left md:text-right'>
                                    <p className='text-xs font-bold text-[var(--tt-ink)]'>
                                        {appointment.service}{appointment.haircutStyle ? ` · ${appointment.haircutStyle}` : ''}
                                    </p>
                                    <p className='mt-0.5 font-mono text-[12px] text-[var(--tt-muted)]'>
                                        {formatDate(appointment.date)} · {formatTime(appointment.time)}{appointment.endTime ? ` – ${formatTime(appointment.endTime)}` : ''}
                                    </p>
                                </div>

                                <div className='text-right shrink-0'>
                                    <p className='font-serif text-base font-bold text-[var(--tt-ink)]'>{formatPeso(appointment.price)}</p>
                                    <span className='mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-[var(--tt-brand)] group-hover:underline'>
                                        View details
                                        <ArrowRight size={13} aria-hidden='true' />
                                    </span>
                                </div>
                            </div>
                        </button>
                    ))
                ) : (
                    <EmptyPanel icon={ClipboardList} message='No bookings match the selected filter.' />
                )}
            </div>

            {/* Pagination Controls */}
            <PaginationControl
                currentPage={page}
                totalPages={totalPages}
                totalItems={totalCount}
                pageSize={pageSize}
                onPageChange={setPage}
                label='bookings'
            />

            {/* Modal Popup for Full Booking Details & Actions */}
            {selected && (
                <BookingDetailModal
                    appointment={selected}
                    updating={updatingId === selected._id}
                    onStatusUpdate={onStatusUpdate}
                    onStageUpdate={onStageUpdate}
                    onClose={() => onSelect(null)}
                />
            )}
        </div>
    )
}

function BookingDetailModal({
    appointment,
    updating,
    onStatusUpdate,
    onStageUpdate,
    onClose
}) {
    const [preview, setPreview] = useState(null)
    const [previewLoading, setPreviewLoading] = useState(false)
    const [previewError, setPreviewError] = useState('')
    const [previewOpen, setPreviewOpen] = useState(false)
    const [confirmStage, setConfirmStage] = useState(null)

    useEffect(() => {
        let active = true

        queueMicrotask(() => {
            if (!active) return
            setPreview(null)
            setPreviewError('')
            setPreviewOpen(false)
            setPreviewLoading(Boolean(appointment?.aiPreviewUsed))
        })

        if (!appointment?.aiPreviewUsed) {
            return () => { active = false }
        }

        adminApi.getAppointmentPreview(appointment._id)
            .then(({ data }) => {
                if (!active) return
                setPreview(data.preview || null)
            })
            .catch((error) => {
                if (!active) return
                setPreviewError(getErrorMessage(error))
            })
            .finally(() => {
                if (active) setPreviewLoading(false)
            })

        return () => { active = false }
    }, [appointment?._id, appointment?.aiPreviewUsed])


    return (
        <div
            className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--tt-ink)]/50 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto'
            onClick={(e) => { if (e.target === e.currentTarget && !updating) onClose() }}
        >
            <div className='relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-sm bg-white border border-[var(--tt-border)] p-6 sm:p-7 shadow-2xl space-y-6 text-[var(--tt-ink)] my-auto'>
                {/* Modal Header */}
                <div className='flex items-center justify-between border-b border-[var(--tt-border)] pb-4'>
                    <div className='flex items-center gap-3.5'>
                        <PetAvatar appointment={appointment} large />
                        <div>
                            <div className='flex items-center gap-2'>
                                <h2 className='font-serif text-2xl font-bold text-[var(--tt-ink)]'>{appointment.petName}</h2>
                                <StatusBadge status={appointment.status} />
                            </div>
                            <p className='text-xs text-[var(--tt-muted)] font-medium'>{appointment.breed} · {appointment.petType === 'cat' ? 'Cat' : 'Dog'}</p>
                        </div>
                    </div>

                    <button
                        type='button'
                        onClick={onClose}
                        className='grid h-9 w-9 place-items-center rounded-sm border border-[var(--tt-border)] bg-[var(--tt-canvas)] text-[var(--tt-ink)] transition hover:bg-[var(--tt-canvas)]'
                        aria-label='Close modal'
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* 2-Column Info Grid */}
                <div className='grid gap-4 sm:grid-cols-2'>
                    {/* Customer Information */}
                    <div className='rounded-sm border border-[var(--tt-border)] bg-[var(--tt-canvas)] p-4 space-y-2.5 text-xs'>
                        <p className='font-bold uppercase tracking-[.08em] text-[12px] text-[var(--tt-brand)]'>Customer Information</p>
                        <DetailRow label='Name' value={getOwnerName(appointment)} />
                        <DetailRow label='Phone' value={appointment.ownerPhone || '—'} />
                        <DetailRow label='Email' value={appointment.ownerEmail || '—'} />
                        {appointment.ownerAddress && <DetailRow label='Address' value={appointment.ownerAddress} />}
                    </div>

                    {/* Booking Details */}
                    <div className='rounded-sm border border-[var(--tt-border)] bg-[var(--tt-canvas)] p-4 space-y-2.5 text-xs'>
                        <p className='font-bold uppercase tracking-[.08em] text-[12px] text-[var(--tt-brand)]'>Booking Information</p>
                        <DetailRow label='Service' value={appointment.service} />
                        <DetailRow label='Hairstyle' value={appointment.haircutStyle || 'Standard'} />
                        <DetailRow label='Date' value={formatDate(appointment.date)} />
                        <DetailRow label='Time' value={`${formatTime(appointment.time)}${appointment.endTime ? ` – ${formatTime(appointment.endTime)}` : ''}`} />
                        <DetailRow label='Total Price' value={formatPeso(appointment.price)} />
                        <DetailRow label='Style preview' value={appointment.aiPreviewUsed ? 'Used' : 'Not used'} />
                    </div>
                </div>

                {/* AI Grooming Reference Image */}
                {appointment.aiPreviewUsed && (
                    <div className='rounded-sm border border-[var(--tt-border)] bg-[var(--tt-canvas)] p-4'>
                        <div className='flex items-center justify-between gap-3 mb-2'>
                            <div>
                                <p className='font-mono text-[12px] uppercase tracking-[.08em] text-[var(--tt-brand)] font-bold'>
                                    Grooming Reference
                                </p>
                                <p className='text-sm font-bold text-[var(--tt-ink)]'>
                                    {appointment.haircutStyle || 'Selected style'}
                                </p>
                            </div>
                            {preview && (
                                <span className='rounded-full bg-[var(--tt-sage)] px-2.5 py-1 text-[12px] font-bold text-[var(--tt-brand-strong)]'>
                                    {preview.seasonLabel || 'Style preview'}
                                </span>
                            )}
                        </div>

                        {previewLoading ? (
                            <div className='grid h-48 place-items-center rounded-sm bg-white text-xs font-semibold text-[var(--tt-muted)] border border-[var(--tt-border)]'>
                                Loading saved preview...
                            </div>
                        ) : preview?.image ? (
                            <button
                                type='button'
                                onClick={() => setPreviewOpen(true)}
                                className='group relative block w-full overflow-hidden rounded-sm border border-[var(--tt-border)] bg-white'
                                title='Enlarge grooming preview'
                            >
                                <img
                                    src={preview.image}
                                    alt={`${appointment.petName} ${appointment.haircutStyle || ''} grooming preview`}
                                    className='h-52 w-full object-contain transition group-hover:scale-[1.01]'
                                />
                                <span className='absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--tt-ink)] px-3 py-1.5 text-xs font-semibold text-white shadow-sm'>
                                    <ZoomIn size={14} /> Enlarge
                                </span>
                            </button>
                        ) : (
                            <div className='rounded-sm border border-dashed border-[var(--tt-border)] bg-white p-4 text-center text-xs leading-5 text-[var(--tt-muted)]'>
                                <ImageIcon size={22} className='mx-auto mb-1.5 text-[#A6B1AA]' />
                                {previewError || 'No style preview image is available for this booking.'}
                            </div>
                        )}
                        <p className='mt-2 text-[12px] leading-relaxed text-[var(--tt-muted)]'>
                            Use this customer-selected style preview as a visual reference. Confirm coat condition, length and safety with the customer at check-in.
                        </p>
                    </div>
                )}

                {/* Notes */}
                {appointment.notes && (
                    <div className='rounded-sm border border-[var(--tt-border)] bg-[var(--tt-canvas)] p-4 text-xs'>
                        <p className='font-bold uppercase tracking-[.08em] text-[12px] text-[var(--tt-brand)]'>Client Notes</p>
                        <p className='mt-1 text-sm text-[var(--tt-ink-soft)] italic'>&ldquo;{appointment.notes}&rdquo;</p>
                    </div>
                )}

                {/* Cancellation Reason if cancelled */}
                {appointment.status === 'cancelled' && appointment.cancellationReason && (
                    <div className='rounded-sm border border-[var(--tt-danger-border)] bg-[var(--tt-danger-bg)] p-4 text-xs text-[#7d3f3f]'>
                        <p className='font-bold uppercase tracking-[.08em] text-[12px] text-[#934b4b]'>Cancellation Reason</p>
                        <p className='mt-1 text-sm font-semibold'>{appointment.cancellationReason}</p>
                    </div>
                )}

                {/* Service Progress Stepper (Milestones) */}
                {['in_progress', 'confirmed'].includes(appointment.status) && onStageUpdate && (
                    <div className='rounded-sm border border-[var(--tt-border)] bg-[var(--tt-canvas)] p-4 space-y-3'>
                        <div className='flex flex-wrap items-center justify-between gap-2'>
                            <div>
                                <p className='text-sm font-bold text-[var(--tt-ink)]'>
                                    Current Stage: <span className='text-[var(--tt-brand-strong)] font-serif'>{appointment.serviceStage || 'Not started'}</span>
                                </p>
                                <p className='text-[12px] text-[var(--tt-muted)] mt-0.5'>
                                    Select a milestone below to advance the service stage for <strong>{appointment.petName}</strong>:
                                </p>
                            </div>
                            {appointment.status === 'in_progress' && (
                                <span className='inline-flex items-center gap-1.5 rounded-full bg-[var(--tt-success-bg)] px-2.5 py-1 text-[12px] font-bold text-[var(--tt-success)] ring-1 ring-[var(--tt-success-border)]'>
                                    <span className='tt-live text-[var(--tt-success)]' />
                                    In Service
                                </span>
                            )}
                        </div>

                        <div className='grid grid-cols-2 sm:grid-cols-3 gap-2'>
                            {getStagesForService(appointment.serviceId).map((stage, idx, allStages) => {
                                const currentIdx = allStages.findIndex((s) => s.id === appointment.serviceStageKey || s.label === appointment.serviceStage)
                                const isCurrent = currentIdx !== -1 && currentIdx === idx
                                const isPast = currentIdx !== -1 && idx < currentIdx

                                return (
                                    <button
                                        key={stage.id}
                                        type='button'
                                        disabled={updating || isCurrent}
                                        onClick={() => setConfirmStage(stage)}
                                        className={`rounded-sm p-2.5 text-left text-xs font-semibold transition border ${
                                            isCurrent
                                                ? 'bg-[#216245] text-white border-[#216245] shadow-xs'
                                                : isPast
                                                ? 'bg-[var(--tt-success-bg)] text-[#216245] border-[var(--tt-success-border)] hover:bg-[#E5F0E9]'
                                                : 'border-[var(--tt-border)] bg-white text-[var(--tt-ink-soft)] hover:bg-[var(--tt-canvas)] hover:border-[#216245] hover:text-[#216245]'
                                        } disabled:opacity-85`}
                                    >
                                        <div className='flex items-center justify-between text-[12px] mb-1 opacity-80'>
                                            <span className='font-mono font-bold'>Step {idx + 1}</span>
                                            {isPast && <span className='inline-flex items-center gap-1'><Check size={11} aria-hidden='true' />Done</span>}
                                            {isCurrent && <span className='inline-flex items-center gap-1.5 font-bold'><span className='tt-live' />Active</span>}
                                        </div>
                                        <p className='font-bold text-xs leading-snug'>{stage.label}</p>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Update Status Actions */}
                <div className='border-t border-[var(--tt-border)] pt-4'>
                    <p className='text-xs font-bold uppercase tracking-[.08em] text-[var(--tt-brand)] mb-2.5'>Update Booking Status</p>
                    <div className='grid grid-cols-2 sm:grid-cols-5 gap-2'>
                        {[
                            { key: 'pending', label: 'Set Pending', activeLabel: 'Pending' },
                            { key: 'confirmed', label: 'Approve', activeLabel: 'Approved' },
                            { key: 'in_progress', label: 'Start Service', activeLabel: 'In Service' },
                            { key: 'completed', label: 'Complete', activeLabel: 'Completed' },
                            { key: 'cancelled', label: 'Cancel', activeLabel: 'Cancelled' }
                        ].map(({ key, label, activeLabel }) => {
                            const isCurrent = appointment.status === key
                            return (
                                <button
                                    key={key}
                                    disabled={updating || isCurrent}
                                    onClick={() => onStatusUpdate(appointment, key)}
                                    className={`rounded-sm px-3 py-2.5 text-xs font-bold transition text-center ${
                                        isCurrent
                                            ? 'bg-[var(--tt-ink)] text-white shadow-xs cursor-default'
                                            : 'border border-[var(--tt-border)] bg-white text-[var(--tt-ink-soft)] hover:bg-[var(--tt-canvas)] hover:border-[var(--tt-brand-strong)] hover:text-[var(--tt-brand-strong)] active:scale-[0.98]'
                                    } disabled:opacity-85`}
                                >
                                    {isCurrent ? (
                                        <span className='inline-flex items-center justify-center gap-1'>
                                            <Check size={12} aria-hidden='true' />
                                            {activeLabel}
                                        </span>
                                    ) : (
                                        label
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Modal Footer */}
                <div className='flex justify-end pt-2 border-t border-[var(--tt-border)]'>
                    <button
                        type='button'
                        onClick={onClose}
                        className='rounded-sm border border-[var(--tt-border)] bg-white px-5 py-2.5 text-xs font-bold text-[var(--tt-ink-soft)] transition hover:bg-[var(--tt-canvas)]'
                    >
                        Close
                    </button>
                </div>
            </div>

            {/* Enlarge Preview Image Modal */}
            {previewOpen && preview?.image && (
                <div
                    className='fixed inset-0 z-[100] flex items-center justify-center bg-[var(--tt-ink)]/70 p-4'
                    onClick={() => setPreviewOpen(false)}
                >
                    <div
                        className='relative max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-sm bg-white p-4 shadow-2xl sm:p-6'
                        onClick={(event) => event.stopPropagation()}
                    >
                        <button
                            type='button'
                            onClick={() => setPreviewOpen(false)}
                            className='absolute right-5 top-5 z-10 grid h-10 w-10 place-items-center rounded-full bg-[var(--tt-canvas)] border border-[var(--tt-border)] text-[var(--tt-ink)] shadow-md hover:bg-[var(--tt-canvas)]'
                            aria-label='Close enlarged preview'
                        >
                            <X size={20} />
                        </button>
                        <div className='pr-12'>
                            <p className='font-serif text-2xl font-bold'>
                                {appointment.petName} — {appointment.haircutStyle || 'Grooming preview'}
                            </p>
                            <p className='text-xs text-[var(--tt-muted)]'>{appointment.service} · {formatDate(appointment.date)}</p>
                        </div>
                        <div className='mt-4 overflow-hidden rounded-sm bg-[var(--tt-canvas)] p-2'>
                            <img
                                src={preview.image}
                                alt={`${appointment.petName} preview`}
                                className='max-h-[65vh] w-full rounded-sm object-contain'
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal before advancing step */}
            <ConfirmModal
                isOpen={Boolean(confirmStage)}
                title='Update Service Stage'
                description={`Are you sure you want to update ${appointment.petName}’s grooming stage to "${confirmStage?.label}"? This will be reflected on the customer's live tracking.`}
                confirmText='Update Stage'
                cancelText='Cancel'
                variant='default'
                loading={updating}
                onConfirm={async () => {
                    if (!confirmStage) return
                    const stageToApply = confirmStage
                    setConfirmStage(null)
                    await onStageUpdate(appointment, stageToApply)
                }}
                onClose={() => setConfirmStage(null)}
            />
        </div>
    )
}

function ScheduleView({
    appointments,
    weekAnchor,
    onPrevious,
    onNext,
    onToday,
    onStatusUpdate,
    onStageUpdate,
    updatingId
}) {
    const [viewMode, setViewMode] = useState('month') // 'month' (default) or 'week'
    const [monthAnchor, setMonthAnchor] = useState(() => new Date())
    const [selectedDateKey, setSelectedDateKey] = useState(() => dateKey(new Date()))
    const [selectedAppointmentSelection, setSelectedAppointment] = useState(null)
    const [previewState, setPreviewState] = useState({ appointmentId: null, image: null })
    const [enlargedImage, setEnlargedImage] = useState(null)
    const [confirmStage, setConfirmStage] = useState(null)

    const [statusFilter, setStatusFilter] = useState('all')

    const week = buildWeek(weekAnchor)
    const monthGrid = useMemo(() => buildMonthGrid(monthAnchor), [monthAnchor])
    const todayKey = dateKey(new Date())

    const hours = [
        '08:00',
        '10:00',
        '12:00',
        '14:00'
    ]

    const totalCount = appointments.filter((a) => a.status !== 'cancelled').length
    const approvedCount = appointments.filter((a) => a.status === 'confirmed').length
    const inProgressCount = appointments.filter((a) => a.status === 'in_progress').length

    const activeAppointments = appointments.filter((appointment) => {
        if (appointment.status === 'cancelled') return false
        if (statusFilter === 'confirmed') return appointment.status === 'confirmed'
        if (statusFilter === 'in_progress') return appointment.status === 'in_progress'
        if (statusFilter === 'pending') return appointment.status === 'pending'
        return true
    })

    const selectedAppointment = selectedAppointmentSelection?._id
        ? appointments.find((appointment) => appointment._id === selectedAppointmentSelection._id) || selectedAppointmentSelection
        : null

    const expectsAiPreview = Boolean(
        selectedAppointment?.aiPreviewUsed || selectedAppointment?.haircutStyle
    )

    useEffect(() => {
        const appointmentId = selectedAppointment?._id
        if (!appointmentId || !expectsAiPreview) return undefined

        let cancelled = false
        adminApi.getAppointmentPreview(appointmentId)
            .then(({ data }) => {
                if (!cancelled) {
                    setPreviewState({
                        appointmentId,
                        image: data?.preview?.image || null
                    })
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setPreviewState({ appointmentId, image: null })
                }
            })

        return () => {
            cancelled = true
        }
    }, [selectedAppointment?._id, expectsAiPreview])

    const fetchedAiPreview = previewState.appointmentId === selectedAppointment?._id
        ? previewState.image
        : null
    const fetchingPreview = Boolean(
        selectedAppointment?._id && expectsAiPreview && previewState.appointmentId !== selectedAppointment._id
    )
    const aiPreviewImg = fetchedAiPreview || selectedAppointment?.generatedImagePreviewUrl || selectedAppointment?.previewImage || selectedAppointment?.aiPreviewImage

    // Navigation handlers
    const handlePrev = () => {
        if (viewMode === 'month') {
            setMonthAnchor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
        } else {
            onPrevious?.()
        }
    }

    const handleNext = () => {
        if (viewMode === 'month') {
            setMonthAnchor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
        } else {
            onNext?.()
        }
    }

    const handleToday = () => {
        setMonthAnchor(new Date())
        setSelectedDateKey(dateKey(new Date()))
        onToday?.()
    }

    // Selected day appointments in Month view
    const selectedDayAppointments = useMemo(() => {
        return activeAppointments.filter((a) => a.date === selectedDateKey)
    }, [activeAppointments, selectedDateKey])

    return (
        <section className='space-y-6'>
            {/* Top Toolbar */}
            <div className='flex flex-col gap-4 rounded-2xl border border-[var(--tt-border)] bg-white p-4 sm:p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between'>
                <div className='flex items-center gap-3'>
                    <div className='grid h-10 w-10 place-items-center rounded-xl bg-[var(--tt-canvas)] text-[var(--tt-brand)] font-bold'>
                        <CalendarDays size={20} />
                    </div>
                    <div>
                        <h2 className='font-serif text-xl sm:text-2xl font-bold text-[var(--tt-ink)]'>
                            {viewMode === 'month' ? monthGrid.title : `Week of ${formatDate(week[0])}`}
                        </h2>
                        <p className='text-xs text-[var(--tt-muted)]'>
                            {viewMode === 'month'
                                ? `Monthly Schedule · ${activeAppointments.length} total active bookings`
                                : `${formatDate(week[0])} – ${formatDate(week[6])}`}
                        </p>
                    </div>
                </div>

                <div className='flex flex-wrap items-center gap-2.5'>
                    {/* View Switcher: Month (Default) vs Week */}
                    <div className='flex items-center rounded-xl border border-[var(--tt-border)] bg-[var(--tt-canvas)] p-1'>
                        <button
                            type='button'
                            onClick={() => setViewMode('month')}
                            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                                viewMode === 'month'
                                    ? 'bg-white text-[var(--tt-ink)] shadow-xs'
                                    : 'text-[var(--tt-muted)] hover:text-[var(--tt-ink)]'
                            }`}
                        >
                            Monthly Calendar
                        </button>
                        <button
                            type='button'
                            onClick={() => setViewMode('week')}
                            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                                viewMode === 'week'
                                    ? 'bg-white text-[var(--tt-ink)] shadow-xs'
                                    : 'text-[var(--tt-muted)] hover:text-[var(--tt-ink)]'
                            }`}
                        >
                            Weekly View
                        </button>
                    </div>

                    {/* Status Filter Buttons */}
                    <div className='hidden xl:flex items-center gap-1 rounded-xl border border-[var(--tt-border)] bg-white p-1'>
                        <button
                            type='button'
                            onClick={() => setStatusFilter('all')}
                            className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                                statusFilter === 'all'
                                    ? 'bg-[var(--tt-ink)] text-white shadow-xs'
                                    : 'text-[var(--tt-muted)] hover:bg-[var(--tt-canvas)]'
                            }`}
                        >
                            All ({totalCount})
                        </button>
                        <button
                            type='button'
                            onClick={() => setStatusFilter('confirmed')}
                            className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                                statusFilter === 'confirmed'
                                    ? 'bg-[var(--tt-brand-strong)] text-white shadow-xs'
                                    : 'text-[var(--tt-muted)] hover:bg-[var(--tt-canvas)]'
                            }`}
                        >
                            Approved ({approvedCount})
                        </button>
                        <button
                            type='button'
                            onClick={() => setStatusFilter('in_progress')}
                            className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                                statusFilter === 'in_progress'
                                    ? 'bg-[#216245] text-white shadow-xs'
                                    : 'text-[var(--tt-muted)] hover:bg-[var(--tt-canvas)]'
                            }`}
                        >
                            In Service ({inProgressCount})
                        </button>
                    </div>

                    {/* Navigation Buttons */}
                    <div className='flex items-center gap-1'>
                        <button
                            type='button'
                            onClick={handlePrev}
                            className='grid h-9 w-9 place-items-center rounded-xl border border-[var(--tt-border)] bg-white text-[var(--tt-ink)] transition hover:bg-[var(--tt-canvas)]'
                            aria-label={viewMode === 'month' ? 'Previous month' : 'Previous week'}
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            type='button'
                            onClick={handleToday}
                            className='h-9 rounded-xl border border-[var(--tt-border)] bg-white px-3.5 text-xs font-bold text-[var(--tt-ink)] transition hover:bg-[var(--tt-canvas)]'
                        >
                            Today
                        </button>
                        <button
                            type='button'
                            onClick={handleNext}
                            className='grid h-9 w-9 place-items-center rounded-xl border border-[var(--tt-border)] bg-white text-[var(--tt-ink)] transition hover:bg-[var(--tt-canvas)]'
                            aria-label={viewMode === 'month' ? 'Next month' : 'Next week'}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* MONTHLY CALENDAR VIEW (Default) */}
            {viewMode === 'month' && (
                <div className='space-y-6'>
                    <div className='overflow-hidden rounded-2xl border border-[var(--tt-border)] bg-white shadow-xs'>
                        {/* Day names header */}
                        <div className='grid grid-cols-7 border-b border-[var(--tt-border)] bg-[var(--tt-canvas)]/60 text-center text-[12px] font-bold uppercase tracking-[.08em] text-[var(--tt-muted)]'>
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                                <div key={d} className='py-3'>
                                    {d}
                                </div>
                            ))}
                        </div>

                        {/* Calendar 42-cell grid */}
                        <div className='grid grid-cols-7 divide-x divide-y divide-[var(--tt-border)]'>
                            {monthGrid.days.map((day) => {
                                const isToday = day.key === todayKey
                                const isSelected = day.key === selectedDateKey
                                const dayAppts = activeAppointments.filter((a) => a.date === day.key)

                                return (
                                    <div
                                        key={day.key}
                                        onClick={() => setSelectedDateKey(day.key)}
                                        className={`group min-h-[96px] sm:min-h-[110px] p-2 transition cursor-pointer flex flex-col justify-between ${
                                            isSelected
                                                ? 'bg-[var(--tt-sage)]/35 ring-2 ring-inset ring-[var(--tt-brand)]'
                                                : day.isCurrentMonth
                                                ? 'bg-white hover:bg-[var(--tt-canvas)]/50'
                                                : 'bg-[var(--tt-canvas)]/30 opacity-60 hover:opacity-100 hover:bg-[var(--tt-canvas)]/70'
                                        }`}
                                    >
                                        <div className='flex items-center justify-between'>
                                            <span
                                                className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${
                                                    isToday
                                                        ? 'bg-[var(--tt-brand)] text-white shadow-xs'
                                                        : isSelected
                                                        ? 'bg-[var(--tt-ink)] text-white'
                                                        : 'text-[var(--tt-ink)]'
                                                }`}
                                            >
                                                {day.date.getDate()}
                                            </span>

                                            {dayAppts.length > 0 && (
                                                <span className='rounded-full bg-[var(--tt-accent-soft)] px-1.5 py-0.5 text-[12px] font-bold text-[var(--tt-ink)]'>
                                                    {dayAppts.length}
                                                </span>
                                            )}
                                        </div>

                                        {/* Mini appointment chips */}
                                        <div className='mt-1.5 space-y-1 overflow-hidden'>
                                            {dayAppts.slice(0, 2).map((a) => (
                                                <div
                                                    key={a._id}
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setSelectedAppointment(a)
                                                    }}
                                                    className='flex items-center gap-1 truncate rounded-md bg-white border border-[var(--tt-border)] px-1.5 py-0.5 text-[12px] font-medium text-[var(--tt-ink)] shadow-2xs hover:border-[var(--tt-brand)] transition'
                                                    title={`${a.petName} (${a.service}) at ${formatTime(a.time)}`}
                                                >
                                                    <span
                                                        className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                                                            a.status === 'confirmed'
                                                                ? 'bg-[var(--tt-brand-strong)]'
                                                                : a.status === 'in_progress'
                                                                ? 'bg-[#216245]'
                                                                : a.status === 'completed'
                                                                ? 'bg-[var(--tt-ink-soft)]'
                                                                : 'bg-[var(--tt-accent)]'
                                                        }`}
                                                    />
                                                    <span className='truncate font-bold'>{a.petName}</span>
                                                    <span className='text-[12px] text-[var(--tt-muted)] shrink-0'>{formatTime(a.time)}</span>
                                                </div>
                                            ))}
                                            {dayAppts.length > 2 && (
                                                <p className='text-[12px] font-bold text-[var(--tt-muted)] text-right pr-1'>
                                                    +{dayAppts.length - 2} more
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Selected Day Agenda Drawer */}
                    <div className='rounded-2xl border border-[var(--tt-border)] bg-white p-5 sm:p-6 shadow-xs'>
                        <div className='flex flex-col gap-2 border-b border-[var(--tt-border)] pb-4 sm:flex-row sm:items-center sm:justify-between'>
                            <div>
                                <p className='text-[12px] font-bold uppercase tracking-[.08em] text-[var(--tt-brand)]'>Day Schedule Details</p>
                                <h3 className='font-serif text-xl sm:text-2xl font-bold text-[var(--tt-ink)] mt-0.5'>
                                    {formatDate(selectedDateKey)}
                                </h3>
                            </div>
                            <span className='rounded-full bg-[var(--tt-canvas)] px-3 py-1 text-xs font-bold text-[var(--tt-ink)] self-start sm:self-auto'>
                                {selectedDayAppointments.length} {selectedDayAppointments.length === 1 ? 'appointment' : 'appointments'} scheduled
                            </span>
                        </div>

                        <div className='mt-5'>
                            {selectedDayAppointments.length > 0 ? (
                                <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
                                    {selectedDayAppointments.map((appt) => (
                                        <div
                                            key={appt._id}
                                            onClick={() => setSelectedAppointment(appt)}
                                            className='group cursor-pointer rounded-xl border border-[var(--tt-border)] bg-white p-4 shadow-2xs transition hover:border-[var(--tt-brand)] hover:shadow-sm flex flex-col justify-between'
                                        >
                                            <div>
                                                <div className='flex items-start justify-between gap-2'>
                                                    <div className='flex items-center gap-2.5'>
                                                        <PetAvatar appointment={appt} />
                                                        <div>
                                                            <p className='font-bold text-sm text-[var(--tt-ink)]'>{appt.petName}</p>
                                                            <p className='text-[12px] text-[var(--tt-muted)]'>{appt.breed || 'Pet'}</p>
                                                        </div>
                                                    </div>
                                                    <StatusBadge status={appt.status} />
                                                </div>

                                                <div className='mt-3 space-y-1 border-t border-[var(--tt-border)] pt-2.5 text-xs text-[var(--tt-ink-soft)]'>
                                                    <p className='font-semibold text-[var(--tt-ink)]'>{appt.service}</p>
                                                    <p className='font-mono text-[12px] text-[var(--tt-muted)]'>
                                                        Time: {formatTime(appt.time)}{appt.endTime ? ` – ${formatTime(appt.endTime)}` : ''}
                                                    </p>
                                                    <p className='text-[12px] text-[var(--tt-muted)]'>
                                                        Client: <strong className='text-[var(--tt-ink)]'>{getOwnerName(appt)}</strong>
                                                    </p>
                                                </div>
                                            </div>

                                            <div className='mt-4 flex items-center justify-between border-t border-[var(--tt-border)] pt-2.5 text-xs'>
                                                <span className='font-serif font-bold text-sm text-[var(--tt-ink)]'>{formatPeso(appt.price || appt.amount)}</span>
                                                <span className='inline-flex items-center gap-1.5 font-bold text-[var(--tt-brand)] group-hover:underline'>
                                                    View details
                                                    <ArrowRight size={13} aria-hidden='true' />
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className='flex flex-col items-center justify-center py-10 text-center'>
                                    <div className='grid h-12 w-12 place-items-center rounded-2xl bg-[var(--tt-canvas)] text-[var(--tt-muted)] mb-3'>
                                        <CalendarDays size={22} />
                                    </div>
                                    <p className='font-serif text-lg font-bold text-[var(--tt-ink)]'>No bookings on this day</p>
                                    <p className='text-xs text-[var(--tt-muted)] mt-1 max-w-sm'>
                                        Select any date on the calendar above with scheduled visits to review appointments.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* WEEKLY GRID VIEW (Optional) */}
            {viewMode === 'week' && (
                <div className='overflow-hidden rounded-2xl border border-[var(--tt-border)] bg-white shadow-xs'>
                    <div className='overflow-x-auto'>
                        <div className='min-w-[1050px]'>
                            <div className='grid grid-cols-[110px_repeat(7,minmax(130px,1fr))]'>
                                <div className='border-b border-r border-[var(--tt-border)] bg-[var(--tt-canvas)] p-3 font-mono text-xs uppercase text-[var(--tt-brand)]'>
                                    Time
                                </div>

                                {week.map((date) => (
                                    <div
                                        key={dateKey(date)}
                                        className={`border-b border-r border-[var(--tt-border)] p-3 text-center last:border-r-0 ${dateKey(date) === dateKey(new Date()) ? 'bg-[var(--tt-sage)]/25' : 'bg-[var(--tt-canvas)]'}`}
                                    >
                                        <p className='text-xs text-[var(--tt-brand)]'>
                                            {date.toLocaleDateString('en-PH', { weekday: 'short' })}
                                        </p>

                                        <p className='font-serif text-lg font-bold'>
                                            {date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                                        </p>
                                    </div>
                                ))}

                                {hours.flatMap((hour) => [
                                    <div
                                        key={`time-${hour}`}
                                        className='min-h-[86px] border-b border-r border-[var(--tt-border)] bg-[var(--tt-canvas)] p-3 font-mono text-xs text-[var(--tt-brand)]'
                                    >
                                        {formatTime(hour)}
                                    </div>,

                                    ...week.map((date) => {
                                        const key = dateKey(date)

                                        const items = activeAppointments.filter(
                                            (appointment) =>
                                                appointment.date === key &&
                                                appointment.time?.slice(0, 2) === hour.slice(0, 2)
                                        )

                                        return (
                                            <div
                                                key={`${key}-${hour}`}
                                                className='min-h-[86px] border-b border-r border-[var(--tt-border)] p-2 last:border-r-0'
                                            >
                                                {items.map((appointment) => {
                                                    const displayImg = appointment.pet?.photoUrl || appointment.petPhotoUrl || appointment.photoUrl || appointment.generatedImagePreviewUrl || appointment.previewImage || appointment.aiPreviewImage
                                                    return (
                                                        <button
                                                            key={appointment._id}
                                                            type='button'
                                                            onClick={() => setSelectedAppointment(appointment)}
                                                            className='mb-1.5 w-full rounded-xl border border-[var(--tt-border)] bg-white p-2 text-left text-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--tt-brand)] hover:bg-[var(--tt-canvas)] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[var(--tt-brand)]'
                                                            title='Click to view appointment details'
                                                        >
                                                            <div className='flex items-center gap-2'>
                                                                {displayImg ? (
                                                                    <img
                                                                        src={displayImg}
                                                                        alt={appointment.petName}
                                                                        className='h-8 w-8 shrink-0 rounded-lg border border-[var(--tt-canvas)] object-cover bg-[var(--tt-canvas)]'
                                                                    />
                                                                ) : (
                                                                    <div className='grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[var(--tt-border)] bg-white text-[var(--tt-brand)] font-bold text-[12px]'>
                                                                        {appointment.petName?.[0] || 'P'}
                                                                    </div>
                                                                )}
                                                                <div className='min-w-0 flex-1'>
                                                                    <div className='flex items-center justify-between gap-1'>
                                                                        <p className='truncate font-bold text-[var(--tt-ink)]'>
                                                                            {appointment.petName}
                                                                        </p>
                                                                        <span className={`inline-block h-2 w-2 rounded-full shrink-0 ${
                                                                            appointment.status === 'confirmed'
                                                                                ? 'bg-[var(--tt-brand-strong)]'
                                                                                : appointment.status === 'in_progress'
                                                                                ? 'bg-[#216245]'
                                                                                : appointment.status === 'completed'
                                                                                ? 'bg-[var(--tt-ink-soft)]'
                                                                                : 'bg-[var(--tt-accent)]'
                                                                        }`} />
                                                                    </div>

                                                                    <p className='truncate text-[12px] text-[var(--tt-brand)]'>
                                                                        {appointment.service}
                                                                    </p>

                                                                    <p className='font-mono text-[12px] font-bold text-[var(--tt-brand)]'>
                                                                        {formatTime(appointment.time)}
                                                                        {appointment.endTime ? `–${formatTime(appointment.endTime)}` : ''}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        )
                                    })
                                ])}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Appointment Details Modal */}
            {selectedAppointment && (
                <div
                    className='fixed inset-0 z-50 flex items-center justify-center bg-[var(--tt-ink)]/60 p-4 backdrop-blur-sm'
                    onClick={() => setSelectedAppointment(null)}
                >
                    <div
                        className='relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-sm bg-[var(--tt-canvas)] p-6 shadow-2xl sm:p-8'
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className='flex items-start justify-between gap-4 border-b border-[var(--tt-border)] pb-5'>
                            <div>
                                <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${STATUS_META[selectedAppointment.status]?.badge || 'bg-[var(--tt-canvas)] text-[var(--tt-ink)]'}`}>
                                    {STATUS_META[selectedAppointment.status]?.label || selectedAppointment.status}
                                </span>
                                <h3 className='mt-2 font-serif text-3xl font-bold text-[var(--tt-ink)]'>
                                    {selectedAppointment.petName}’s Appointment
                                </h3>
                                <p className='mt-1 text-xs text-[var(--tt-brand)]'>
                                    ID: <span className='font-mono'>{selectedAppointment._id}</span>
                                </p>
                            </div>

                            <button
                                type='button'
                                onClick={() => setSelectedAppointment(null)}
                                className='grid h-10 w-10 place-items-center rounded-full bg-[var(--tt-canvas)] text-[var(--tt-ink-soft)] transition hover:bg-[var(--tt-canvas)]'
                                aria-label='Close details'
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className='mt-6 space-y-6'>
                            {/* Grid Info */}
                            <div className='grid gap-4 sm:grid-cols-2'>
                                <div className='rounded-sm border border-[var(--tt-border)] bg-white p-4 space-y-2'>
                                    <p className='text-[12px] font-bold uppercase tracking-[.08em] text-[var(--tt-brand)] flex items-center gap-1.5'>
                                        <Scissors size={14} /> Pet Information
                                    </p>
                                    <p className='text-sm font-bold text-[var(--tt-ink)]'>{selectedAppointment.petName}</p>
                                    <p className='text-xs text-[var(--tt-brand)]'>Breed: <span className='font-semibold text-[var(--tt-ink)]'>{selectedAppointment.breed || selectedAppointment.petBreed || 'N/A'}</span></p>
                                    {selectedAppointment.petType && <p className='text-xs text-[var(--tt-brand)]'>Species: <span className='font-semibold text-[var(--tt-ink)]'>{selectedAppointment.petType}</span></p>}
                                </div>

                                <div className='rounded-sm border border-[var(--tt-border)] bg-white p-4 space-y-2'>
                                    <p className='text-[12px] font-bold uppercase tracking-[.08em] text-[var(--tt-brand)] flex items-center gap-1.5'>
                                        <UserRound size={14} /> Customer Contact
                                    </p>
                                    <p className='text-sm font-bold text-[var(--tt-ink)]'>{getOwnerName(selectedAppointment)}</p>
                                    <p className='text-xs text-[var(--tt-brand)]'>Phone: <span className='font-semibold text-[var(--tt-ink)]'>{selectedAppointment.ownerPhone || selectedAppointment.phone || 'N/A'}</span></p>
                                    <p className='text-xs text-[var(--tt-brand)] truncate'>Email: <span className='font-semibold text-[var(--tt-ink)]'>{selectedAppointment.ownerEmail || selectedAppointment.email || 'N/A'}</span></p>
                                </div>
                            </div>

                            {/* Service & Schedule */}
                            <div className='rounded-sm border border-[var(--tt-border)] bg-white p-4 space-y-3'>
                                <p className='text-[12px] font-bold uppercase tracking-[.08em] text-[var(--tt-brand)] flex items-center gap-1.5'>
                                    <Scissors size={14} /> Grooming Details
                                </p>
                                <div className='grid grid-cols-2 gap-3 text-xs'>
                                    <div>
                                        <p className='text-[var(--tt-brand)]'>Service</p>
                                        <p className='font-bold text-[var(--tt-ink)] text-sm mt-0.5'>{selectedAppointment.service}</p>
                                    </div>
                                    <div>
                                        <p className='text-[var(--tt-brand)]'>Price</p>
                                        <p className='font-serif font-bold text-[var(--tt-brand)] text-base mt-0.5'>{formatPeso(selectedAppointment.amount || selectedAppointment.price || 1200)}</p>
                                    </div>
                                    <div>
                                        <p className='text-[var(--tt-brand)]'>Date</p>
                                        <p className='font-semibold text-[var(--tt-ink)] mt-0.5'>{formatDate(selectedAppointment.date)}</p>
                                    </div>
                                    <div>
                                        <p className='text-[var(--tt-brand)]'>Time Slot</p>
                                        <p className='font-mono font-semibold text-[var(--tt-ink)] mt-0.5'>
                                            {formatTime(selectedAppointment.time)}
                                            {selectedAppointment.endTime ? `–${formatTime(selectedAppointment.endTime)}` : ''}
                                        </p>
                                    </div>
                                </div>

                                {selectedAppointment.haircutStyle && (
                                    <div className='flex items-center justify-between gap-4 border-t border-[var(--tt-border)] pt-3'>
                                        <div>
                                            <p className='text-xs text-[var(--tt-brand)]'>Selected Haircut Style:</p>
                                            <p className='font-semibold text-[var(--tt-brand)] text-sm mt-0.5'>{selectedAppointment.haircutStyle}</p>
                                            {aiPreviewImg && (
                                                <span className='mt-1 inline-flex items-center gap-1 text-[12px] font-bold text-[var(--tt-ink)] bg-[var(--tt-canvas)] px-2.5 py-0.5 rounded-full'>
                                                    Style Preview Attached
                                                </span>
                                            )}
                                        </div>

                                        {aiPreviewImg ? (
                                            <div
                                                className='group relative cursor-pointer overflow-hidden rounded-sm border border-[var(--tt-border)] bg-white shadow-sm transition hover:scale-105'
                                                onClick={() => setEnlargedImage(aiPreviewImg)}
                                                title='Click to enlarge AI haircut preview'
                                            >
                                                <img
                                                    src={aiPreviewImg}
                                                    alt={`Style preview for ${selectedAppointment.haircutStyle}`}
                                                    className='h-16 w-16 object-cover'
                                                />
                                                <span className='absolute inset-0 flex items-center justify-center bg-[var(--tt-ink)]/40 text-[var(--tt-canvas)] opacity-0 transition group-hover:opacity-100'>
                                                    <ZoomIn size={14} />
                                                </span>
                                            </div>
                                        ) : fetchingPreview ? (
                                            <div className='flex h-16 w-16 items-center justify-center rounded-sm border border-dashed border-[var(--tt-border)] bg-white text-[var(--tt-brand)]'>
                                                <RefreshCw size={14} className='animate-spin' />
                                            </div>
                                        ) : null}
                                    </div>
                                )}
                            </div>

                            {/* Notes */}
                            {selectedAppointment.notes && (
                                <div className='rounded-sm border border-[var(--tt-border)] bg-white p-4'>
                                    <p className='text-[12px] font-bold uppercase tracking-[.08em] text-[var(--tt-brand)]'>Notes for Groomer</p>
                                    <p className='mt-1.5 text-xs text-[var(--tt-ink-soft)] leading-relaxed'>{selectedAppointment.notes}</p>
                                </div>
                            )}

                            {/* AI Style Preview Image */}
                            {(selectedAppointment.generatedImagePreviewUrl || selectedAppointment.previewImage || selectedAppointment.aiPreviewImage) && (
                                <div className='rounded-sm border border-[var(--tt-border)] bg-white p-4'>
                                    <p className='text-[12px] font-bold uppercase tracking-[.08em] text-[var(--tt-brand)] mb-2 flex items-center gap-1.5'>
                                        <ImageIcon size={14} /> Grooming Style Reference
                                    </p>
                                    <div className='relative overflow-hidden rounded-sm border border-[var(--tt-border)] bg-white'>
                                        <img
                                            src={selectedAppointment.generatedImagePreviewUrl || selectedAppointment.previewImage || selectedAppointment.aiPreviewImage}
                                            alt={`Style preview for ${selectedAppointment.petName}`}
                                            className='max-h-64 w-full object-contain cursor-pointer transition hover:scale-[1.02]'
                                            onClick={() => setEnlargedImage(selectedAppointment.generatedImagePreviewUrl || selectedAppointment.previewImage || selectedAppointment.aiPreviewImage)}
                                        />
                                        <button
                                            type='button'
                                            onClick={() => setEnlargedImage(selectedAppointment.generatedImagePreviewUrl || selectedAppointment.previewImage || selectedAppointment.aiPreviewImage)}
                                            className='absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-[var(--tt-ink)]/70 px-3 py-1 text-[12px] font-bold text-[var(--tt-canvas)] backdrop-blur-sm'
                                        >
                                            <ZoomIn size={12} /> Click to Enlarge
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Service Progress Stepper (Milestones) */}
                            {['in_progress', 'confirmed'].includes(selectedAppointment.status) && onStageUpdate && (
                                <div className='rounded-sm border border-[var(--tt-border)] bg-[var(--tt-canvas)] p-4 space-y-3'>
                                    <div className='flex flex-wrap items-center justify-between gap-2'>
                                        <div>
                                            <p className='text-sm font-bold text-[var(--tt-ink)]'>
                                                Current Stage: <span className='text-[var(--tt-brand-strong)] font-serif'>{selectedAppointment.serviceStage || 'Not started'}</span>
                                            </p>
                                            <p className='text-[12px] text-[var(--tt-muted)] mt-0.5'>
                                                Select a milestone below to advance the service stage for <strong>{selectedAppointment.petName}</strong>:
                                            </p>
                                        </div>
                                        {selectedAppointment.status === 'in_progress' && (
                                            <span className='inline-flex items-center gap-1.5 rounded-full bg-[var(--tt-success-bg)] px-2.5 py-1 text-[12px] font-bold text-[var(--tt-success)] ring-1 ring-[var(--tt-success-border)]'>
                                                <span className='tt-live text-[var(--tt-success)]' />
                                                In Service
                                            </span>
                                        )}
                                    </div>

                                    <div className='grid grid-cols-2 sm:grid-cols-3 gap-2'>
                                        {getStagesForService(selectedAppointment.serviceId).map((stage, idx, allStages) => {
                                            const currentIdx = allStages.findIndex((s) => s.id === selectedAppointment.serviceStageKey || s.label === selectedAppointment.serviceStage)
                                            const isCurrent = currentIdx !== -1 && currentIdx === idx
                                            const isPast = currentIdx !== -1 && idx < currentIdx

                                            return (
                                                <button
                                                    key={stage.id}
                                                    type='button'
                                                    disabled={updatingId === selectedAppointment._id || isCurrent}
                                                    onClick={() => setConfirmStage(stage)}
                                                    className={`rounded-sm p-2.5 text-left text-xs font-semibold transition border ${
                                                        isCurrent
                                                            ? 'bg-[#216245] text-white border-[#216245] shadow-xs'
                                                            : isPast
                                                            ? 'bg-[var(--tt-success-bg)] text-[#216245] border-[var(--tt-success-border)] hover:bg-[#E5F0E9]'
                                                            : 'border-[var(--tt-border)] bg-white text-[var(--tt-ink-soft)] hover:bg-[var(--tt-canvas)] hover:border-[#216245] hover:text-[#216245]'
                                                    } disabled:opacity-85`}
                                                >
                                                    <div className='flex items-center justify-between text-[12px] mb-1 opacity-80'>
                                                        <span className='font-mono font-bold'>Step {idx + 1}</span>
                                                        {isPast && <span className='inline-flex items-center gap-1'><Check size={11} aria-hidden='true' />Done</span>}
                                                        {isCurrent && <span className='inline-flex items-center gap-1.5 font-bold'><span className='tt-live' />Active</span>}
                                                    </div>
                                                    <p className='font-bold text-xs leading-snug'>{stage.label}</p>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Actions / Status Update */}
                            {onStatusUpdate && (
                                <div className='border-t border-[var(--tt-border)] pt-4'>
                                    <p className='text-xs font-bold text-[var(--tt-brand)] mb-3'>Update Appointment Status:</p>
                                    <div className='grid grid-cols-2 sm:grid-cols-4 gap-2'>
                                        <button
                                            type='button'
                                            disabled={updatingId === selectedAppointment._id || selectedAppointment.status === 'confirmed'}
                                            onClick={() => onStatusUpdate(selectedAppointment, 'confirmed')}
                                            className={`rounded-sm px-2.5 py-2.5 text-xs font-bold transition disabled:opacity-50 ${selectedAppointment.status === 'confirmed' ? 'bg-[var(--tt-brand-strong)] text-[var(--tt-canvas)]' : 'border border-[var(--tt-border)] bg-white text-[var(--tt-brand-strong)] hover:bg-[var(--tt-canvas)]'}`}
                                        >
                                            Approve
                                        </button>

                                        <button
                                            type='button'
                                            disabled={updatingId === selectedAppointment._id || selectedAppointment.status === 'in_progress'}
                                            onClick={() => onStatusUpdate(selectedAppointment, 'in_progress')}
                                            className={`rounded-sm px-2.5 py-2.5 text-xs font-bold transition disabled:opacity-50 ${selectedAppointment.status === 'in_progress' ? 'bg-[#216245] text-white' : 'border border-[var(--tt-border)] bg-white text-[#216245] hover:bg-[var(--tt-success-bg)]'}`}
                                        >
                                            Start Service
                                        </button>

                                        <button
                                            type='button'
                                            disabled={updatingId === selectedAppointment._id || selectedAppointment.status === 'completed'}
                                            onClick={() => onStatusUpdate(selectedAppointment, 'completed')}
                                            className={`rounded-sm px-2.5 py-2.5 text-xs font-bold transition disabled:opacity-50 ${selectedAppointment.status === 'completed' ? 'bg-[var(--tt-ink)] text-[var(--tt-canvas)]' : 'border border-[var(--tt-border)] bg-white text-[var(--tt-ink)] hover:bg-[var(--tt-canvas)]'}`}
                                        >
                                            Complete
                                        </button>

                                        <button
                                            type='button'
                                            disabled={updatingId === selectedAppointment._id || selectedAppointment.status === 'cancelled'}
                                            onClick={() => onStatusUpdate(selectedAppointment, 'cancelled')}
                                            className={`rounded-sm px-2.5 py-2.5 text-xs font-bold transition disabled:opacity-50 ${selectedAppointment.status === 'cancelled' ? 'bg-[#934b4b] text-white' : 'border border-[var(--tt-border)] bg-white text-[#934b4b] hover:bg-[var(--tt-danger-bg)]'}`}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal before advancing step */}
            <ConfirmModal
                isOpen={Boolean(confirmStage)}
                title='Update Service Stage'
                description={`Are you sure you want to update ${selectedAppointment?.petName}’s grooming stage to "${confirmStage?.label}"? This will be reflected on the customer's live tracking.`}
                confirmText='Update Stage'
                cancelText='Cancel'
                variant='default'
                loading={updatingId === selectedAppointment?._id}
                onConfirm={async () => {
                    if (!confirmStage || !selectedAppointment) return
                    const targetStage = confirmStage
                    setConfirmStage(null)
                    await onStageUpdate(selectedAppointment, targetStage)
                }}
                onClose={() => setConfirmStage(null)}
            />

            {/* Enlarged Image Zoom Overlay */}
            {enlargedImage && (
                <div
                    className='fixed inset-0 z-[100] flex items-center justify-center bg-[var(--tt-ink)]/80 p-4 backdrop-blur-md'
                    onClick={() => setEnlargedImage(null)}
                >
                    <div className='relative max-h-[90vh] max-w-4xl overflow-hidden rounded-sm bg-[var(--tt-canvas)] p-4 shadow-2xl'>
                        <button
                            type='button'
                            onClick={() => setEnlargedImage(null)}
                            className='absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-[var(--tt-ink)]/60 text-[var(--tt-canvas)] shadow-md hover:bg-[var(--tt-ink)]'
                        >
                            <X size={20} />
                        </button>
                        <img src={enlargedImage} alt='Enlarged Preview' className='max-h-[80vh] w-full object-contain rounded-sm' />
                    </div>
                </div>
            )}
        </section>
    )
}

function CustomerStatusBadge({ status, reason }) {
    const normalized = status || 'active'
    const config = {
        active: { label: 'Active', icon: CheckCircle2, className: 'border border-[var(--tt-success-border)] bg-[var(--tt-success-bg)] text-[#216245]' },
        warned: { label: 'Warned', icon: AlertTriangle, className: 'border border-[var(--tt-warn-border)] bg-[var(--tt-warn-bg)] text-[var(--tt-warn)]' },
        booking_blocked: { label: 'Booking blocked', icon: Ban, className: 'border border-[#F2D2C8] bg-[var(--tt-accent-soft)] text-[#A84D39]' },
        banned: { label: 'Banned', icon: ShieldAlert, className: 'border border-[var(--tt-danger-border)] bg-[var(--tt-danger-bg)] text-[#934b4b]' }
    }[normalized] || { label: 'Active', icon: CheckCircle2, className: 'border border-[var(--tt-success-border)] bg-[var(--tt-success-bg)] text-[#216245]' }

    const Icon = config.icon
    return (
        <span title={reason || config.label} className={`inline-flex min-h-7 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-bold ${config.className}`}>
            <Icon size={12} /> {config.label}
        </span>
    )
}

function CustomerActionModal({ isOpen, customer, loading, onConfirm, onClose }) {
    const [action, setAction] = useState(
        customer?.accountStatus && customer.accountStatus !== 'active'
            ? customer.accountStatus
            : 'warned'
    )
    const [presetReason, setPresetReason] = useState(() => {
        return customer?.accountStatus === 'active'
            ? 'Multiple booking cancellations / No-show policy'
            : 'Compliance acknowledged & policy confirmed'
    })
    const [customReason, setCustomReason] = useState('')

    // Update preset default if user switches action to/from active
    useEffect(() => {
        if (action === 'active') {
            setPresetReason('Compliance acknowledged & policy confirmed')
        } else {
            setPresetReason('Multiple booking cancellations / No-show policy')
        }
    }, [action])

    if (!isOpen || !customer) return null

    const actions = [
        { id: 'warned', label: 'Issue warning', detail: 'Keep access open', icon: AlertTriangle },
        { id: 'booking_blocked', label: 'Block booking', detail: 'Stop new appointments', icon: Ban },
        { id: 'banned', label: 'Ban account', detail: 'Block account access', icon: ShieldAlert },
        { id: 'active', label: 'Restore active', detail: 'Clear restrictions', icon: CheckCircle2 }
    ]

    const isCustom = presetReason === 'Other (custom reason)'
    const isReasonValid = isCustom
        ? customReason.trim().length >= 5
        : Boolean(presetReason && presetReason.trim())

    const handleSave = () => {
        if (!isReasonValid) {
            toast.error('A justification reason is strictly required before changing account status.')
            return
        }

        const finalReason = isCustom
            ? customReason.trim()
            : `${presetReason}${customReason.trim() ? `: ${customReason.trim()}` : ''}`

        onConfirm(customer._id, {
            accountStatus: action,
            statusReason: finalReason,
            warningMessage: customReason.trim() || presetReason
        })
    }

    return (
        <div className='fixed inset-0 z-50 grid place-items-center bg-[var(--tt-ink)]/70 p-4 backdrop-blur-sm' role='presentation'>
            <button type='button' className='absolute inset-0' onClick={loading ? undefined : onClose} aria-label='Close customer status dialog' />
            <div className='relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-[var(--tt-border)] bg-white shadow-2xl' role='dialog' aria-modal='true' aria-labelledby='customer-status-title'>
                <div className='grid gap-5 border-b border-[var(--tt-border)] p-5 sm:grid-cols-[1fr_auto] sm:items-start sm:p-6'>
                    <div>
                        <p className='text-[12px] font-bold uppercase tracking-[.08em] text-[var(--tt-brand)]'>Account Access Control</p>
                        <h3 id='customer-status-title' className='mt-1 font-serif text-2xl font-bold text-[var(--tt-ink)]'>Manage {customer.firstName} {customer.lastName}</h3>
                        <div className='mt-3 flex flex-wrap items-center gap-2'>
                            <CustomerStatusBadge status={customer.accountStatus} reason={customer.statusReason} />
                            <span className='text-xs font-semibold text-[var(--tt-muted)]'>{customer.email || customer.phone || 'No contact detail'}</span>
                        </div>
                    </div>
                    <button type='button' onClick={onClose} disabled={loading} className='grid h-10 w-10 place-items-center rounded-xl border border-[var(--tt-border)] bg-white text-[var(--tt-ink)] hover:bg-[var(--tt-canvas)] transition' aria-label='Close dialog'>
                        <X size={18} />
                    </button>
                </div>

                <div className='space-y-6 p-5 sm:p-6'>
                    <fieldset>
                        <legend className='text-sm font-bold text-[var(--tt-ink)]'>Choose new account status</legend>
                        <div className='mt-3 grid gap-2 sm:grid-cols-2'>
                            {actions.map(({ id, label, detail, icon }) => {
                                const Icon = icon
                                const selected = action === id
                                return (
                                    <button
                                        key={id}
                                        type='button'
                                        onClick={() => setAction(id)}
                                        aria-pressed={selected}
                                        className={`flex min-h-16 items-center gap-3 rounded-xl border p-3 text-left transition ${selected ? 'border-[var(--tt-brand)] bg-[var(--tt-sage)]/40 text-[var(--tt-ink)] ring-1 ring-[var(--tt-brand)]' : 'border-[var(--tt-border)] bg-white text-[var(--tt-ink-soft)] hover:border-[var(--tt-border)] hover:bg-[var(--tt-canvas)]'}`}
                                    >
                                        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${selected ? 'bg-[var(--tt-brand)] text-white' : 'bg-[var(--tt-canvas)] text-[var(--tt-brand)]'}`}><Icon size={18} /></span>
                                        <span>
                                            <span className='block text-sm font-bold'>{label}</span>
                                            <span className='block text-xs font-semibold opacity-80'>{detail}</span>
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    </fieldset>

                    {/* Mandatory Reason Justification Section */}
                    <div className='rounded-xl border border-[var(--tt-border)] bg-[var(--tt-canvas)]/50 p-4 space-y-4'>
                        <div className='flex items-center gap-1.5'>
                            <AlertCircle size={15} className='text-[var(--tt-brand)] shrink-0' />
                            <p className='text-xs font-bold text-[var(--tt-ink)]'>
                                Mandatory Reason Justification <span className='text-[var(--tt-brand)]'>*</span>
                            </p>
                        </div>
                        <p className='text-[12px] text-[var(--tt-muted)]'>
                            An explicit administrative reason is required for audit logs and customer records before this status update is committed.
                        </p>

                        <div className='grid gap-4 sm:grid-cols-2'>
                            <label className='block'>
                                <span className='text-xs font-bold text-[var(--tt-ink)]'>Reason Category <span className='text-[var(--tt-brand)]'>*</span></span>
                                <select
                                    value={presetReason}
                                    onChange={(event) => setPresetReason(event.target.value)}
                                    className='mt-1.5 min-h-11 w-full rounded-xl border border-[var(--tt-border)] bg-white px-3 text-xs font-semibold text-[var(--tt-ink)] focus:border-[var(--tt-brand)] focus:outline-none'
                                >
                                    {action === 'active' ? (
                                        <>
                                            <option value='Compliance acknowledged & policy confirmed'>Compliance acknowledged & policy confirmed</option>
                                            <option value='Outstanding balance or invoice settled'>Outstanding balance or invoice settled</option>
                                            <option value='Dispute resolved / Account reinstated'>Dispute resolved / Account reinstated</option>
                                            <option value='Administrative test / Cleared by staff'>Administrative test / Cleared by staff</option>
                                            <option value='Other (custom reason)'>Other (custom reason)</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value='Multiple booking cancellations / No-show policy'>Multiple cancellations / no-show</option>
                                            <option value='Excessive last-minute schedule changes'>Last-minute schedule changes</option>
                                            <option value='Uncooperative pet handling or policy refusal'>Handling or policy refusal</option>
                                            <option value='Payment issues / Unpaid grooming balance'>Payment issue / unpaid balance</option>
                                            <option value='Other (custom reason)'>Other (custom reason)</option>
                                        </>
                                    )}
                                </select>
                            </label>

                            <label className='block'>
                                <span className='text-xs font-bold text-[var(--tt-ink)]'>
                                    {isCustom ? 'Required Custom Justification *' : 'Optional Additional Context'}
                                </span>
                                <textarea
                                    value={customReason}
                                    onChange={(event) => setCustomReason(event.target.value)}
                                    rows={3}
                                    placeholder={isCustom ? 'Describe the reason for this action (min 5 chars)…' : 'Add concise notes for customer history…'}
                                    className={`mt-1.5 w-full rounded-xl border bg-white px-3 py-2 text-xs text-[var(--tt-ink)] placeholder:text-[var(--tt-muted)] focus:outline-none ${
                                        isCustom && customReason.trim().length < 5
                                            ? 'border-[var(--tt-danger-border)] focus:border-[var(--tt-danger)]'
                                            : 'border-[var(--tt-border)] focus:border-[var(--tt-brand)]'
                                    }`}
                                />
                                {isCustom && customReason.trim().length < 5 && (
                                    <p className='mt-1 text-[12px] text-[var(--tt-danger)] font-semibold'>
                                        Please provide at least 5 characters for custom justification.
                                    </p>
                                )}
                            </label>
                        </div>
                    </div>
                </div>

                <div className='flex flex-col-reverse gap-2 border-t border-[var(--tt-border)] p-5 sm:flex-row sm:justify-end sm:p-6'>
                    <button type='button' onClick={onClose} disabled={loading} className='min-h-11 rounded-xl border border-[var(--tt-border)] px-5 text-xs font-bold text-[var(--tt-ink)] hover:bg-[var(--tt-canvas)] disabled:opacity-50 transition'>
                        Cancel
                    </button>
                    <button
                        type='button'
                        onClick={handleSave}
                        disabled={loading || !isReasonValid}
                        className='inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--tt-ink)] px-6 text-xs font-bold text-white transition hover:bg-[var(--tt-brand)] disabled:cursor-not-allowed disabled:opacity-40 shadow-xs'
                    >
                        {loading ? <RefreshCw size={14} className='animate-spin' /> : <CheckCheck size={14} />}
                        {loading ? 'Saving…' : 'Save Persisted Status'}
                    </button>
                </div>
            </div>
        </div>
    )
}

function CustomersView({ customers, onRefresh }) {
    const [query, setQuery] = useState('')
    const [selectedCustomer, setSelectedCustomer] = useState(null)
    const [actionModalOpen, setActionModalOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [persistedOverrides, setPersistedOverrides] = useState({})
    const [page, setPage] = useState(1)
    const pageSize = 10

    useEffect(() => {
        setPage(1)
    }, [query])

    const customerList = useMemo(() => (customers || []).map((customer) => {
        const persisted = persistedOverrides[customer._id]
        return persisted ? mergePersistedCustomerStatus(customer, persisted) : customer
    }), [customers, persistedOverrides])

    const handleApplyStatus = async (userId, data) => {
        setSubmitting(true)
        try {
            const response = await adminApi.updateCustomerStatus(userId, data)
            const persistedUser = response.data?.user

            if (!persistedUser || persistedUser.accountStatus !== data.accountStatus) {
                throw new Error('The server did not confirm the requested account status')
            }

            setPersistedOverrides((previous) => ({
                ...previous,
                [userId]: persistedUser
            }))

            toast.success(`Customer status updated: ${getAccountStatusLabel(persistedUser.accountStatus)}`)
            setActionModalOpen(false)
            setSelectedCustomer(null)
            if (onRefresh) await onRefresh()
        } catch (err) {
            toast.error(getErrorMessage(err))
        } finally {
            setSubmitting(false)
        }
    }

    const filtered = useMemo(() => {
        const normalized = query.trim().toLowerCase()
        if (!normalized) return customerList

        return customerList.filter((customer) => [
            customer.firstName,
            customer.lastName,
            customer.email,
            customer.phone,
            customer.accountStatus,
            ...(customer.pets || []).flatMap((pet) => [pet.name, pet.breed])
        ].filter(Boolean).some((value) => String(value).toLowerCase().includes(normalized)))
    }, [customerList, query])

    const totalItems = filtered.length
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
    const pagedCustomers = useMemo(() => {
        const start = (page - 1) * pageSize
        return filtered.slice(start, start + pageSize)
    }, [filtered, page, pageSize])

    const statusCounts = useMemo(() => customerList.reduce((counts, customer) => {
        const status = customer.accountStatus || 'active'
        counts[status] = (counts[status] || 0) + 1
        return counts
    }, { active: 0, warned: 0, booking_blocked: 0, banned: 0 }), [customerList])

    return (
        <section className='space-y-5'>
            {actionModalOpen && selectedCustomer && (
                <CustomerActionModal
                    key={`${selectedCustomer._id}-${selectedCustomer.accountStatus || 'active'}`}
                    isOpen
                    customer={selectedCustomer}
                    loading={submitting}
                    onConfirm={handleApplyStatus}
                    onClose={() => {
                        setActionModalOpen(false)
                        setSelectedCustomer(null)
                    }}
                />
            )}

            <div className='grid overflow-hidden rounded-2xl border border-[var(--tt-border)] bg-white sm:grid-cols-2 xl:grid-cols-4 shadow-xs'>
                {[
                    ['Active', statusCounts.active, 'active'],
                    ['Warned', statusCounts.warned, 'warned'],
                    ['Booking blocked', statusCounts.booking_blocked, 'booking_blocked'],
                    ['Banned', statusCounts.banned, 'banned']
                ].map(([label, value, status]) => (
                    <div key={status} className='border-b border-[var(--tt-border)] p-5 last:border-b-0 sm:border-r sm:border-[var(--tt-border)] sm:last:border-r-0 xl:border-b-0'>
                        <div className='flex items-center justify-between gap-3'>
                            <div>
                                <p className='text-[12px] font-bold uppercase tracking-[.08em] text-[var(--tt-muted)]'>{label}</p>
                                <p className='mt-2 font-serif text-3xl font-bold text-[var(--tt-ink)]'>{value}</p>
                            </div>
                            <CustomerStatusBadge status={status} />
                        </div>
                    </div>
                ))}
            </div>

            <div className='flex flex-col gap-4 rounded-2xl border border-[var(--tt-border)] bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 shadow-xs'>
                <div>
                    <h2 className='font-serif text-2xl font-bold text-[var(--tt-ink)]'>Customer records</h2>
                    <p className='mt-1 text-xs font-semibold text-[var(--tt-muted)]'>{filtered.length} of {customerList.length} customers shown</p>
                </div>
                <label className='relative block w-full sm:max-w-md'>
                    <Search size={16} className='absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--tt-muted)]' />
                    <span className='sr-only'>Search customers</span>
                    <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder='Search name, contact, pet, or status...'
                        className='h-10 w-full rounded-xl border border-[var(--tt-border)] bg-[var(--tt-canvas)] pl-10 pr-4 text-xs font-medium text-[var(--tt-ink)] placeholder:text-[var(--tt-muted)] outline-none focus:border-[var(--tt-brand)] focus:ring-1 focus:ring-[var(--tt-brand)]/20 transition'
                    />
                </label>
            </div>

            {pagedCustomers.length ? (
                <div className='grid gap-3'>
                    {pagedCustomers.map((customer) => (
                        <article key={customer._id} className='grid gap-5 rounded-2xl border border-[var(--tt-border)] bg-white p-5 transition hover:border-[var(--tt-brand)] shadow-xs lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center'>
                            <div className='flex min-w-0 gap-4'>
                                <span className='grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[var(--tt-canvas)] font-serif font-bold text-[var(--tt-brand)]'>{getInitials(customer.firstName, customer.lastName)}</span>
                                <div className='min-w-0'>
                                    <div className='flex flex-wrap items-center gap-2'>
                                        <h3 className='font-serif text-lg font-bold text-[var(--tt-ink)]'>{customer.firstName} {customer.lastName}</h3>
                                        <CustomerStatusBadge status={customer.accountStatus} reason={customer.statusReason} />
                                    </div>
                                    <p className='mt-1 text-xs font-semibold text-[var(--tt-muted)]'>{customer.email || 'No email'} · {customer.phone || 'No phone'}</p>
                                    <p className='mt-1 text-xs leading-5 text-[var(--tt-muted)]'>{getCustomerAddress(customer)}</p>

                                    {customer.accountStatus && customer.accountStatus !== 'active' && customer.statusReason && (
                                        <p className='mt-2.5 max-w-2xl rounded-xl border border-[var(--tt-warn-border)] bg-[var(--tt-warn-bg)] px-3 py-1.5 text-xs font-medium leading-5 text-[var(--tt-warn)]'>
                                            Status reason: <strong>{customer.statusReason}</strong>
                                        </p>
                                    )}

                                    <div className='mt-3 flex flex-wrap gap-2'>
                                        {(customer.pets || []).length ? customer.pets.map((pet) => (
                                            <span key={pet._id} className='rounded-full border border-[var(--tt-border)] bg-[var(--tt-canvas)] px-3 py-1 text-xs font-semibold text-[var(--tt-ink)]'>{pet.name} · {pet.breed}</span>
                                        )) : <span className='text-xs font-medium text-[var(--tt-muted)]'>No saved pet profiles</span>}
                                    </div>
                                </div>
                            </div>

                            <div className='grid gap-4 border-t border-[var(--tt-border)] pt-4 sm:grid-cols-[1fr_auto] sm:items-center lg:min-w-[420px] lg:border-l lg:border-[var(--tt-border)] lg:border-t-0 lg:pl-6 lg:pt-0'>
                                <dl className='grid grid-cols-3 gap-3'>
                                    <div><dt className='text-[12px] font-bold uppercase tracking-[.08em] text-[var(--tt-muted)]'>Bookings</dt><dd className='mt-1 font-serif text-lg font-bold text-[var(--tt-ink)]'>{customer.visits || 0}</dd></div>
                                    <div><dt className='text-[12px] font-bold uppercase tracking-[.08em] text-[var(--tt-muted)]'>Spend</dt><dd className='mt-1 font-serif text-lg font-bold text-[var(--tt-ink)]'>{formatPeso(customer.totalSpend)}</dd></div>
                                    <div><dt className='text-[12px] font-bold uppercase tracking-[.08em] text-[var(--tt-muted)]'>Last visit</dt><dd className='mt-1 font-serif text-sm font-bold text-[var(--tt-ink)]'>{formatShortDate(customer.lastVisit)}</dd></div>
                                </dl>
                                <button
                                    type='button'
                                    onClick={() => {
                                        setSelectedCustomer(customer)
                                        setActionModalOpen(true)
                                    }}
                                    className='inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[var(--tt-ink)] px-4 text-xs font-bold text-white transition hover:bg-[var(--tt-brand)] shadow-xs'
                                >
                                    <UserX size={15} /> Manage access
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            ) : (
                <EmptyPanel message='No customer records match your search.' />
            )}

            {/* Pagination Controls */}
            <PaginationControl
                currentPage={page}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={setPage}
                label='customers'
            />
        </section>
    )
}


function AnalyticsView({
    analytics,
    currentMonthData,
    appointments,
    aiUsageRate,
    completedRate
}) {
    const monthlyData =
        analytics?.monthlyData ||
        []

    const serviceDistribution =
        analytics?.serviceDistribution ||
        []

    const maxAppointments =
        Math.max(
            1,
            ...monthlyData.map(
                (item) =>
                    item.appointments ||
                    0
            )
        )

    const maxRevenue =
        Math.max(
            1,
            ...monthlyData.map(
                (item) =>
                    item.revenue ||
                    0
            )
        )

    const styleUsage =
        useMemo(() => {
            const counts = {}

            appointments
                .filter(
                    (appointment) =>
                        appointment.haircutStyle &&
                        appointment.status !==
                        'cancelled'
                )
                .forEach(
                    (appointment) => {
                        const style =
                            appointment.haircutStyle

                        if (
                            !counts[
                            style
                            ]
                        ) {
                            counts[
                                style
                            ] = {
                                total: 0,
                                preview: 0
                            }
                        }

                        counts[
                            style
                        ].total += 1

                        if (
                            appointment.aiPreviewUsed
                        ) {
                            counts[
                                style
                            ].preview += 1
                        }
                    }
                )

            return Object.entries(
                counts
            )
                .map(
                    ([
                        style,
                        values
                    ]) => ({
                        style,
                        ...values,
                        rate:
                            values.total
                                ? Math.round(
                                    (values.preview /
                                        values.total) *
                                    100
                                )
                                : 0
                    })
                )
                .sort(
                    (first, second) =>
                        second.total -
                        first.total
                )
                .slice(0, 6)
        }, [appointments])

    const totalAppointments =
        currentMonthData
            ?.appointments || 0

    const downloadCSVFile = (filename, rows) => {
        const escapeCell = (cell) => {
            if (cell === null || cell === undefined) return ''
            if (typeof cell === 'number') return cell
            const str = String(cell).trim()
            if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
                return `"${str.replace(/"/g, '""')}"`
            }
            return str
        }

        const lines = rows.map((row) => row.map(escapeCell).join(','))
        // 'sep=,' instructs Microsoft Excel on Windows to parse columns by commas regardless of regional locale settings
        const csvContent = ['sep=,', ...lines].join('\r\n')
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.setAttribute('href', url)
        link.setAttribute('download', filename)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    }

    const handleExportAppointmentsCSV = () => {
        try {
            const dateStr = new Date().toISOString().slice(0, 10)
            const headers = [
                'Appointment ID',
                'Booking Date',
                'Time Slot',
                'Customer Name',
                'Phone',
                'Email',
                'Pet Name',
                'Pet Type',
                'Breed',
                'Service',
                'Haircut Style',
                'Price (PHP)',
                'Status',
                'Service Stage',
                'Created Date'
            ]

            const dataRows = appointments.map((a) => [
                a._id,
                a.date || '',
                a.time || '',
                getOwnerName(a),
                a.ownerPhone || a.phone || '',
                a.ownerEmail || a.email || '',
                a.petName || '',
                a.petType || 'dog',
                a.breed || a.petBreed || '',
                a.service || '',
                a.haircutStyle || 'Standard',
                a.price || a.amount || 0,
                a.status || 'pending',
                a.serviceStage || 'N/A',
                a.createdAt ? new Date(a.createdAt).toISOString().slice(0, 10) : ''
            ])

            downloadCSVFile(`TimmyTails_Appointments_Audit_${dateStr}.csv`, [headers, ...dataRows])
            toast.success('Appointments audit log exported as CSV!')
        } catch (err) {
            console.error(err)
            toast.error('Failed to export appointments: ' + (err?.message || 'Unknown error'))
        }
    }

    const handleExportSummaryCSV = () => {
        try {
            const dateStr = new Date().toISOString().slice(0, 10)
            const headers = ['Category', 'Dimension / Metric', 'Value', 'Details / Notes']

            const rows = [
                headers,
                ['Executive KPI', 'Appointments This Month', currentMonthData?.appointments || 0, 'Current calendar month'],
                ['Executive KPI', 'Revenue This Month', currentMonthData?.revenue || 0, 'PHP (gross bookings)'],
                ['Executive KPI', 'Style Preview Adoption Rate', `${aiUsageRate}%`, 'Clients utilizing AI styling preview'],
                ['Executive KPI', 'Completed Booking Rate', `${completedRate}%`, 'Completed vs total reservations'],
                ['Executive KPI', 'All-Time Total Bookings', appointments.length, 'Total registered appointments'],
                ['Executive KPI', 'All-Time Total Revenue', analytics?.totalRevenue || 0, 'PHP (all completed/paid)'],
                ...monthlyData.map((m) => ['Monthly Trend', m.monthKey || m.month, m.revenue || 0, `${m.appointments || 0} appointments`]),
                ...serviceDistribution.map((s) => ['Service Demand', s.name, `${s.percentage}%`, `${s.count || 0} total bookings`]),
                ...styleUsage.map((st) => ['Haircut Style Demand', st.style, `${st.total} bookings`, `${st.rate}% AI preview adoption`])
            ]

            downloadCSVFile(`TimmyTails_Analytics_Summary_${dateStr}.csv`, rows)
            toast.success('KPI & analytics summary exported as CSV!')
        } catch (err) {
            console.error(err)
            toast.error('Failed to export summary: ' + (err?.message || 'Unknown error'))
        }
    }

    return (
        <div className='space-y-6'>
            {/* Top Action Bar */}
            <div className='flex flex-col gap-4 rounded-2xl border border-[var(--tt-border)] bg-white p-4 sm:p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between'>
                <div className='flex items-center gap-3'>
                    <div className='grid h-10 w-10 place-items-center rounded-xl bg-[var(--tt-canvas)] text-[var(--tt-brand)] font-bold'>
                        <BarChart3 size={20} />
                    </div>
                    <div>
                        <h2 className='font-serif text-xl sm:text-2xl font-bold text-[var(--tt-ink)]'>Analytics & Reports</h2>
                        <p className='text-xs text-[var(--tt-muted)]'>Review salon demand, financial totals, and export raw logs</p>
                    </div>
                </div>

                <div className='flex flex-wrap items-center gap-2.5'>
                    <button
                        type='button'
                        onClick={handleExportAppointmentsCSV}
                        className='inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[var(--tt-ink)] px-4 text-xs font-bold text-white transition hover:bg-[var(--tt-brand)] shadow-xs'
                        title='Export complete appointments audit spreadsheet for Excel'
                    >
                        <Download size={14} /> Export Appointments (CSV)
                    </button>
                    <button
                        type='button'
                        onClick={handleExportSummaryCSV}
                        className='inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[var(--tt-border)] bg-white px-4 text-xs font-bold text-[var(--tt-ink)] transition hover:bg-[var(--tt-canvas)] shadow-xs'
                        title='Export high-level KPI and revenue trend summary'
                    >
                        <Download size={14} /> Export KPI Summary (CSV)
                    </button>
                </div>
            </div>

            <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
                <MetricCard
                    icon={
                        ClipboardList
                    }
                    value={
                        totalAppointments
                    }
                    label='Appointments This Month'
                    tone='orange'
                />

                <MetricCard
                    icon={
                        CircleDollarSign
                    }
                    value={formatPeso(
                        currentMonthData
                            ?.revenue
                    )}
                    label='Monthly Revenue'
                    tone='green'
                    compact
                />

                <MetricCard
                    icon={Sparkles}
                    value={`${aiUsageRate}%`}
                    label='Style Preview Usage'
                    tone='blue'
                />

                <MetricCard
                    icon={
                        CheckCircle2
                    }
                    value={`${completedRate}%`}
                    label='Completed Booking Rate'
                    tone='amber'
                />
            </div>

            <div className='grid gap-5 xl:grid-cols-2'>
                <ChartCard title='Monthly Appointments'>
                    <div className='flex h-64 items-end gap-3 pt-6'>
                        {monthlyData.map(
                            (item) => (
                                <div
                                    key={
                                        item.monthKey
                                    }
                                    className='flex min-w-0 flex-1 flex-col items-center justify-end'
                                >
                                    <span className='mb-2 text-xs font-semibold'>
                                        {
                                            item.appointments
                                        }
                                    </span>

                                    <div
                                        className='w-full max-w-16 rounded-t-md bg-[var(--tt-brand)]'
                                        style={{
                                            height: `${Math.max(
                                                8,
                                                ((item.appointments ||
                                                    0) /
                                                    maxAppointments) *
                                                180
                                            )}px`
                                        }}
                                    />

                                    <span className='mt-2 text-xs text-[var(--tt-brand)]'>
                                        {
                                            item.month
                                        }
                                    </span>
                                </div>
                            )
                        )}
                    </div>
                </ChartCard>

                <ChartCard title='Monthly Revenue'>
                    <RevenueLineChart
                        data={
                            monthlyData
                        }
                        max={
                            maxRevenue
                        }
                    />
                </ChartCard>

                <ChartCard title='Service Breakdown'>
                    <ServiceBreakdown
                        items={
                            serviceDistribution
                        }
                    />
                </ChartCard>

                <ChartCard title='Style Preview Usage'>
                    <div className='space-y-4'>
                        {styleUsage.length ? (
                            styleUsage.map(
                                (item) => (
                                    <div
                                        key={
                                            item.style
                                        }
                                    >
                                        <div className='mb-1.5 flex items-center justify-between gap-3 text-sm'>
                                            <span className='font-semibold'>
                                                {
                                                    item.style
                                                }
                                            </span>

                                            <span className='font-mono text-xs text-[var(--tt-brand)]'>
                                                {
                                                    item.rate
                                                }
                                                % used ·{' '}
                                                {
                                                    item.total
                                                }{' '}
                                                bookings
                                            </span>
                                        </div>

                                        <div className='h-2 overflow-hidden rounded-full bg-[var(--tt-canvas)]'>
                                            <div
                                                className='h-full rounded-full bg-[var(--tt-brand)]'
                                                style={{
                                                    width: `${item.rate}%`
                                                }}
                                            />
                                        </div>
                                    </div>
                                )
                            )
                        ) : (
                            <EmptyPanel message='No hairstyle bookings are available yet.' />
                        )}
                    </div>

                    <div className='mt-6 grid grid-cols-2 gap-3'>
                        <div className='rounded-sm bg-[var(--tt-canvas)] p-4 text-center'>
                            <p className='font-serif text-2xl font-bold text-[var(--tt-ink)]'>
                                {
                                    appointments.filter(
                                        (
                                            appointment
                                        ) =>
                                            appointment.aiPreviewUsed
                                    ).length
                                }
                            </p>

                            <p className='mt-1 text-xs text-[var(--tt-brand)]'>
                                Style previews booked
                            </p>
                        </div>

                        <div className='rounded-sm bg-[var(--tt-canvas)] p-4 text-center'>
                            <p className='font-serif text-2xl font-bold text-[var(--tt-brand)]'>
                                {
                                    appointments.filter(
                                        (
                                            appointment
                                        ) =>
                                            appointment.haircutStyle
                                    ).length
                                }
                            </p>

                            <p className='mt-1 text-xs text-[var(--tt-brand)]'>
                                Style bookings
                            </p>
                        </div>
                    </div>
                </ChartCard>
            </div>
        </div>
    )
}

function ChartCard({
    title,
    children
}) {
    return (
        <section className='rounded-sm border border-[var(--tt-border)] bg-white p-5'>
            <h2 className='font-serif text-xl font-bold'>
                {title}
            </h2>

            <div className='mt-4'>
                {children}
            </div>
        </section>
    )
}

function RevenueLineChart({
    data,
    max
}) {
    const width = 600
    const height = 230
    const padding = 26

    const points =
        data.map(
            (item, index) => {
                const x =
                    data.length <= 1
                        ? width / 2
                        : padding +
                        (index /
                            (data.length -
                                1)) *
                        (width -
                            padding * 2)

                const y =
                    height -
                    padding -
                    ((item.revenue ||
                        0) /
                        max) *
                    (height -
                        padding * 2)

                return {
                    x,
                    y,
                    item
                }
            }
        )

    const path =
        points
            .map(
                (point, index) =>
                    `${index ? 'L' : 'M'} ${point.x} ${point.y}`
            )
            .join(' ')

    return (
        <div>
            <svg
                viewBox={`0 0 ${width} ${height}`}
                className='h-60 w-full overflow-visible'
                role='img'
                aria-label='Monthly revenue line chart'
            >
                {[0.25, 0.5, 0.75].map(
                    (ratio) => (
                        <line
                            key={
                                ratio
                            }
                            x1={
                                padding
                            }
                            x2={
                                width -
                                padding
                            }
                            y1={
                                height *
                                ratio
                            }
                            y2={
                                height *
                                ratio
                            }
                            stroke='#F6F7F2'
                            strokeWidth='1'
                        />
                    )
                )}

                <path
                    d={path}
                    fill='none'
                    stroke='#13231B'
                    strokeWidth='4'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                />

                {points.map(
                    (point) => (
                        <g
                            key={
                                point.item
                                    .monthKey
                            }
                        >
                            <circle
                                cx={
                                    point.x
                                }
                                cy={
                                    point.y
                                }
                                r='5'
                                fill='#13231B'
                            />

                            <text
                                x={
                                    point.x
                                }
                                y={
                                    height -
                                    4
                                }
                                textAnchor='middle'
                                fontSize='12'
                                fill='#2F6B57'
                            >
                                {
                                    point.item
                                        .month
                                }
                            </text>
                        </g>
                    )
                )}
            </svg>

            <p className='text-center text-xs text-[var(--tt-brand)]'>
                Highest visible month:{' '}
                {formatPeso(max)}
            </p>
        </div>
    )
}

function ServiceBreakdown({
    items
}) {
    const colors = [
        '#2F6B57',
        '#13231B',
        '#E8795B',
        '#2F6B57',
        '#F6F7F2',
        '#2F6B57'
    ]

    const segments =
        items.reduce(
            (
                result,
                item,
                index
            ) => {
                const start =
                    result.total

                const end =
                    start +
                    (item.percentage ||
                        0)

                return {
                    total: end,
                    values: [
                        ...result.values,
                        `${colors[index % colors.length]} ${start}% ${end}%`
                    ]
                }
            },
            {
                total: 0,
                values: []
            }
        ).values

    return (
        <div className='flex flex-col items-center gap-6 sm:flex-row sm:items-start'>
            <div
                className='relative h-52 w-52 shrink-0 rounded-full'
                style={{
                    background:
                        segments.length
                            ? `conic-gradient(${segments.join(', ')})`
                            : '#F6F7F2'
                }}
            >
                <div className='absolute inset-12 rounded-full bg-[var(--tt-canvas)]' />
            </div>

            <div className='grid flex-1 gap-3'>
                {items.length ? (
                    items.map(
                        (
                            item,
                            index
                        ) => (
                            <div
                                key={
                                    item.name
                                }
                                className='flex items-center justify-between gap-3 text-sm'
                            >
                                <span className='flex items-center gap-2'>
                                    <span
                                        className='h-3 w-3 rounded-full'
                                        style={{
                                            background:
                                                colors[
                                                index %
                                                colors.length
                                                ]
                                        }}
                                    />

                                    {
                                        item.name
                                    }
                                </span>

                                <span className='font-semibold'>
                                    {
                                        item.percentage
                                    }
                                    %
                                </span>
                            </div>
                        )
                    )
                ) : (
                    <p className='text-sm text-[var(--tt-brand)]'>
                        No service data available.
                    </p>
                )}
            </div>
        </div>
    )
}

function PetAvatar({
    appointment,
    large = false
}) {
    const photo =
        appointment?.pet?.photoUrl ||
        appointment?.petPhotoUrl ||
        appointment?.petPhoto ||
        ''

    const size =
        large
            ? 'h-14 w-14 rounded-sm text-lg'
            : 'h-10 w-10 rounded-lg text-sm'

    if (photo) {
        return (
            <img
                src={photo}
                alt={appointment?.petName || 'Pet'}
                className={`${size} shrink-0 border border-[var(--tt-canvas)] object-cover`}
            />
        )
    }

    return (
        <span
            className={`grid ${size} shrink-0 place-items-center border border-[var(--tt-border)] bg-white font-serif font-bold text-[var(--tt-ink)]`}
        >
            {(appointment?.petName?.[0] || 'P').toUpperCase()}
        </span>
    )
}

function StatusBadge({ status }) {
    const meta = STATUS_META[status] || STATUS_META.pending
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-bold tracking-[.08em] ${meta.badge}`}>
            {meta.label}
        </span>
    )
}

function DetailRow({ label, value }) {
    return (
        <div className='flex items-start justify-between gap-4 py-1'>
            <dt className='text-xs text-[var(--tt-brand)]'>{label}</dt>
            <dd className='max-w-[230px] text-right text-sm font-semibold text-[var(--tt-ink)]'>{value}</dd>
        </div>
    )
}

function EmptyPanel({ icon, message }) {
    return (
        <div className='flex flex-col items-center justify-center gap-2.5 p-10 text-center'>
            {icon && (
                <div className='grid h-12 w-12 place-items-center rounded-sm bg-[var(--tt-sage)] text-[var(--tt-brand-strong)]'>
                    {createElement(icon, { size: 22 })}
                </div>
            )}
            <p className='text-sm font-semibold text-[var(--tt-muted)]'>{message}</p>
        </div>
    )
}

function ContactsView({ contacts = [], onRefresh }) {
    const [filter, setFilter] = useState('all')
    const [search, setSearch] = useState('')
    const [selectedContact, setSelectedContact] = useState(null)
    const [deletingId, setDeletingId] = useState(null)
    const [markingId, setMarkingId] = useState(null)
    const [confirmDeleteId, setConfirmDeleteId] = useState(null)

    // In-app email reply state
    const [replySubject, setReplySubject] = useState('')
    const [replyMessage, setReplyMessage] = useState('')
    const [replySending, setReplySending] = useState(false)

    // Pagination state
    const [page, setPage] = useState(1)
    const pageSize = 8

    const safeContacts = useMemo(() => (Array.isArray(contacts) ? contacts : []), [contacts])

    useEffect(() => {
        setPage(1)
    }, [filter, search])

    // Update reply subject when the selected conversation changes
    const selectedContactId = selectedContact?._id
    useEffect(() => {
        if (selectedContactId) {
            setReplySubject(`Re: Inquiry from ${selectedContact?.name} - Timmy Tails Salon`)
            setReplyMessage('')
        }
    }, [selectedContactId, selectedContact?.name])

    const filteredContacts = useMemo(() => {
        return safeContacts
            .filter((c) => {
                if (!c) return false
                if (filter === 'unread' && c.read) return false
                if (filter === 'read' && !c.read) return false

                if (!search.trim()) return true
                const q = search.toLowerCase()
                return (
                    c.name?.toLowerCase().includes(q) ||
                    c.email?.toLowerCase().includes(q) ||
                    c.phone?.toLowerCase().includes(q) ||
                    c.message?.toLowerCase().includes(q)
                )
            })
            .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    }, [safeContacts, filter, search])

    const totalItems = filteredContacts.length
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
    const pagedContacts = useMemo(() => {
        const start = (page - 1) * pageSize
        return filteredContacts.slice(start, start + pageSize)
    }, [filteredContacts, page, pageSize])

    const handleMarkAsRead = async (id) => {
        setMarkingId(id)
        try {
            await adminApi.markContactRead(id)
            toast.success('Marked message as read')
            if (selectedContact?._id === id) {
                setSelectedContact((prev) => (prev ? { ...prev, read: true } : null))
            }
            onRefresh?.()
        } catch (error) {
            toast.error(getErrorMessage(error))
        } finally {
            setMarkingId(null)
        }
    }

    const handleDelete = async (id) => {
        setDeletingId(id)
        try {
            await adminApi.deleteContact(id)
            toast.success('Deleted contact message')
            if (selectedContact?._id === id) {
                setSelectedContact(null)
            }
            setConfirmDeleteId(null)
            onRefresh?.()
        } catch (error) {
            toast.error(getErrorMessage(error))
        } finally {
            setDeletingId(null)
        }
    }

    const handleSendReply = async (e) => {
        e?.preventDefault?.()
        if (!selectedContact?._id) return
        if (!replyMessage.trim()) {
            toast.error('Please enter a reply message before sending.')
            return
        }

        setReplySending(true)
        try {
            const res = await adminApi.replyContact(selectedContact._id, {
                replyMessage: replyMessage.trim(),
                subject: replySubject.trim() || `Re: Inquiry - Timmy Tails Salon`
            })

            const updatedContact = res.data?.contact || {
                ...selectedContact,
                read: true,
                replied: true,
                replyMessage: replyMessage.trim(),
                repliedAt: new Date().toISOString()
            }

            setSelectedContact(updatedContact)
            setReplyMessage('')
            toast.success(`Reply email sent to ${selectedContact.email}!`)
            if (onRefresh) await onRefresh()
        } catch (err) {
            toast.error(getErrorMessage(err))
        } finally {
            setReplySending(false)
        }
    }

    const unreadCount = safeContacts.filter((c) => c && !c.read).length
    const repliedCount = safeContacts.filter((c) => c && c.replied).length

    return (
        <div className='space-y-6'>
            {/* Header Metrics */}
            <div className='grid gap-4 sm:grid-cols-3'>
                <div className='rounded-2xl border border-[var(--tt-border)] bg-white p-5 shadow-xs'>
                    <div className='flex items-center justify-between'>
                        <p className='text-xs font-bold uppercase tracking-[.08em] text-[var(--tt-brand)]'>Total Messages</p>
                        <span className='grid h-9 w-9 place-items-center rounded-xl bg-[var(--tt-canvas)] text-[var(--tt-ink)]'>
                            <Mail size={18} />
                        </span>
                    </div>
                    <p className='mt-2 font-serif text-3xl font-bold text-[var(--tt-ink)]'>{safeContacts.length}</p>
                </div>

                <div className='rounded-2xl border border-[var(--tt-border)] bg-white p-5 shadow-xs'>
                    <div className='flex items-center justify-between'>
                        <p className='text-xs font-bold uppercase tracking-[.08em] text-[var(--tt-brand)]'>Unread Inquiries</p>
                        <span className='grid h-9 w-9 place-items-center rounded-xl bg-[var(--tt-canvas)] text-[var(--tt-brand)]'>
                            <MessageSquare size={18} />
                        </span>
                    </div>
                    <p className='mt-2 font-serif text-3xl font-bold text-[var(--tt-brand)]'>{unreadCount}</p>
                </div>

                <div className='rounded-2xl border border-[var(--tt-border)] bg-white p-5 shadow-xs'>
                    <div className='flex items-center justify-between'>
                        <p className='text-xs font-bold uppercase tracking-[.08em] text-[var(--tt-brand)]'>Replied to Client</p>
                        <span className='grid h-9 w-9 place-items-center rounded-xl bg-[var(--tt-canvas)] text-[#216245]'>
                            <CheckCheck size={18} />
                        </span>
                    </div>
                    <p className='mt-2 font-serif text-3xl font-bold text-[#216245]'>{repliedCount}</p>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                <div className='flex items-center gap-1.5 rounded-xl border border-[var(--tt-border)] bg-white p-1 shadow-xs'>
                    <button
                        type='button'
                        onClick={() => setFilter('all')}
                        className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${filter === 'all' ? 'bg-[var(--tt-ink)] text-white shadow-xs' : 'text-[var(--tt-muted)] hover:bg-[var(--tt-canvas)]'}`}
                    >
                        All ({safeContacts.length})
                    </button>
                    <button
                        type='button'
                        onClick={() => setFilter('unread')}
                        className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${filter === 'unread' ? 'bg-[var(--tt-brand)] text-white shadow-xs' : 'text-[var(--tt-muted)] hover:bg-[var(--tt-canvas)]'}`}
                    >
                        Unread ({unreadCount})
                    </button>
                    <button
                        type='button'
                        onClick={() => setFilter('read')}
                        className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${filter === 'read' ? 'bg-[var(--tt-ink)] text-white shadow-xs' : 'text-[var(--tt-muted)] hover:bg-[var(--tt-canvas)]'}`}
                    >
                        Handled ({safeContacts.length - unreadCount})
                    </button>
                </div>

                <div className='relative min-w-[260px]'>
                    <Search size={15} className='absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--tt-muted)]' />
                    <input
                        type='text'
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder='Search client, email, message...'
                        className='h-10 w-full rounded-xl border border-[var(--tt-border)] bg-white py-2 pl-9 pr-4 text-xs font-medium text-[var(--tt-ink)] placeholder:text-[var(--tt-muted)] shadow-xs focus:border-[var(--tt-brand)] focus:outline-none focus:ring-1 focus:ring-[var(--tt-brand)]/20 transition'
                    />
                </div>
            </div>

            {/* Main Content Grid: Messages List + Detailed View */}
            <div className='grid gap-6 lg:grid-cols-12'>
                <div className='space-y-3 lg:col-span-5'>
                    {pagedContacts.length === 0 ? (
                        <div className='rounded-2xl border border-dashed border-[var(--tt-border)] bg-white p-8 text-center'>
                            <Inbox size={32} className='mx-auto mb-2 text-[var(--tt-brand)]' />
                            <p className='font-bold text-[var(--tt-ink)]'>No messages found</p>
                            <p className='mt-1 text-xs text-[var(--tt-muted)]'>
                                {search ? 'Try adjusting your search query' : 'No contact form submissions received yet.'}
                            </p>
                        </div>
                    ) : (
                        pagedContacts.map((contact) => {
                            const isSelected = selectedContact?._id === contact._id
                            return (
                                <button
                                    key={contact._id}
                                    type='button'
                                    onClick={() => {
                                        setSelectedContact(contact)
                                        if (!contact.read) {
                                            handleMarkAsRead(contact._id)
                                        }
                                    }}
                                    className={`w-full rounded-2xl border p-4 text-left transition ${
                                        isSelected
                                            ? 'border-[var(--tt-brand)] bg-[var(--tt-sage)]/30 shadow-xs ring-1 ring-[var(--tt-brand)]'
                                            : !contact.read
                                            ? 'border-[var(--tt-border)] bg-white shadow-xs hover:border-[var(--tt-brand)]'
                                            : 'border-[var(--tt-border)] bg-white hover:border-[var(--tt-border)]'
                                    }`}
                                >
                                    <div className='flex items-start justify-between gap-2'>
                                        <div>
                                            <p className='font-bold text-[var(--tt-ink)] text-sm flex items-center gap-2'>
                                                {contact.name}
                                                {!contact.read && (
                                                    <span className='h-2 w-2 rounded-full bg-[var(--tt-brand)]' title='Unread message' />
                                                )}
                                                {contact.replied && (
                                                    <span className='rounded-full bg-[var(--tt-success-bg)] px-1.5 py-0.2 text-[12px] font-bold text-[#216245]'>
                                                        Replied
                                                    </span>
                                                )}
                                            </p>
                                            <p className='text-xs text-[var(--tt-muted)] mt-0.5'>{contact.email}</p>
                                        </div>

                                        <span className='font-mono text-[12px] text-[var(--tt-muted)] shrink-0'>
                                            {new Date(contact.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>

                                    <p className='mt-2.5 line-clamp-2 text-xs text-[var(--tt-ink-soft)] leading-relaxed'>
                                        {contact.message}
                                    </p>
                                </button>
                            )
                        })
                    )}

                    {/* Pagination */}
                    <PaginationControl
                        currentPage={page}
                        totalPages={totalPages}
                        totalItems={totalItems}
                        pageSize={pageSize}
                        onPageChange={setPage}
                        label='messages'
                    />
                </div>

                {/* Selected Contact Message Detail View */}
                <div className='lg:col-span-7'>
                    {selectedContact ? (
                        <div className='sticky top-24 rounded-2xl border border-[var(--tt-border)] bg-white p-6 shadow-xs space-y-6'>
                            <div className='flex items-start justify-between gap-4 border-b border-[var(--tt-border)] pb-5'>
                                <div>
                                    <div className='flex items-center gap-2'>
                                        <h3 className='font-serif text-2xl font-bold text-[var(--tt-ink)]'>{selectedContact.name}</h3>
                                        <span
                                            className={`rounded-full px-2.5 py-0.5 text-[12px] font-bold ${
                                                selectedContact.read ? 'bg-[var(--tt-canvas)] text-[var(--tt-ink)]' : 'bg-[var(--tt-brand)]/15 text-[var(--tt-brand)]'
                                            }`}
                                        >
                                            {selectedContact.read ? 'Read' : 'Unread'}
                                        </span>
                                        {selectedContact.replied && (
                                            <span className='rounded-full bg-[var(--tt-success-bg)] px-2 py-0.5 text-[12px] font-bold text-[#216245] flex items-center gap-1'>
                                                <CheckCheck size={11} /> Replied via Email
                                            </span>
                                        )}
                                    </div>

                                    <p className='mt-1 text-xs text-[var(--tt-muted)]'>
                                        Received on {new Date(selectedContact.createdAt).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}
                                    </p>
                                </div>

                                <div className='flex items-center gap-2'>
                                    <button
                                        type='button'
                                        onClick={() => setConfirmDeleteId(selectedContact._id)}
                                        disabled={deletingId === selectedContact._id}
                                        className='grid h-9 w-9 place-items-center rounded-xl border border-[var(--tt-danger-border)] bg-[var(--tt-danger-bg)] text-[#934b4b] transition hover:bg-[var(--tt-danger-bg)] disabled:opacity-50'
                                        title='Delete message'
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Contact Details Card */}
                            <div className='grid gap-3 sm:grid-cols-2 rounded-xl border border-[var(--tt-border)] bg-[var(--tt-canvas)]/40 p-4 text-xs'>
                                <div>
                                    <p className='text-[var(--tt-brand)] font-bold uppercase tracking-[.08em] text-[12px]'>Client Email</p>
                                    <a
                                        href={`mailto:${selectedContact.email}`}
                                        className='mt-1 block font-semibold text-[var(--tt-ink)] hover:underline truncate'
                                    >
                                        {selectedContact.email}
                                    </a>
                                </div>

                                {selectedContact.phone && (
                                    <div>
                                        <p className='text-[var(--tt-brand)] font-bold uppercase tracking-[.08em] text-[12px] flex items-center gap-1'>
                                            <Phone size={11} /> Phone Number
                                        </p>
                                        <a
                                            href={`tel:${selectedContact.phone}`}
                                            className='mt-1 block font-mono font-semibold text-[var(--tt-ink)] hover:underline'
                                        >
                                            {selectedContact.phone}
                                        </a>
                                    </div>
                                )}
                            </div>

                            {/* Message Body */}
                            <div>
                                <p className='text-xs font-bold uppercase tracking-[.08em] text-[var(--tt-muted)] mb-2'>Client Message</p>
                                <div className='rounded-xl border border-[var(--tt-border)] bg-white p-4 text-sm text-[var(--tt-ink)] leading-relaxed whitespace-pre-wrap shadow-2xs'>
                                    {selectedContact.message}
                                </div>
                            </div>

                            {/* Sent Reply History (Audit) */}
                            {selectedContact.replied && selectedContact.replyMessage && (
                                <div className='rounded-xl border border-[var(--tt-success-border)] bg-[var(--tt-success-bg)]/50 p-4 space-y-2'>
                                    <div className='flex items-center justify-between text-xs'>
                                        <span className='font-bold text-[#216245] flex items-center gap-1.5'>
                                            <CheckCheck size={14} /> Official Salon Reply Sent
                                        </span>
                                        {selectedContact.repliedAt && (
                                            <span className='font-mono text-[12px] text-[#216245]'>
                                                {new Date(selectedContact.repliedAt).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}
                                            </span>
                                        )}
                                    </div>
                                    <p className='text-xs text-[var(--tt-ink-soft)] leading-relaxed whitespace-pre-wrap border-t border-[var(--tt-success-border)] pt-2'>
                                        {selectedContact.replyMessage}
                                    </p>
                                </div>
                            )}

                            {/* In-App Email Reply Composer */}
                            <form onSubmit={handleSendReply} className='space-y-3 rounded-xl border border-[var(--tt-border)] bg-[var(--tt-canvas)]/30 p-4'>
                                <div className='flex items-center justify-between'>
                                    <p className='text-xs font-bold uppercase tracking-[.08em] text-[var(--tt-ink)] flex items-center gap-1.5'>
                                        <Mail size={13} className='text-[var(--tt-brand)]' />
                                        {selectedContact.replied ? 'Send Follow-up Reply Email' : 'Compose Email Reply'}
                                    </p>
                                    <span className='text-[12px] text-[var(--tt-muted)]'>Sent via Timmy Tails Mailer</span>
                                </div>

                                <div>
                                    <label className='block text-[12px] font-bold text-[var(--tt-muted)] mb-1'>Subject</label>
                                    <input
                                        type='text'
                                        value={replySubject}
                                        onChange={(e) => setReplySubject(e.target.value)}
                                        placeholder='Subject…'
                                        required
                                        className='h-9 w-full rounded-lg border border-[var(--tt-border)] bg-white px-3 text-xs text-[var(--tt-ink)] focus:border-[var(--tt-brand)] focus:outline-none'
                                    />
                                </div>

                                <div>
                                    <label className='block text-[12px] font-bold text-[var(--tt-muted)] mb-1'>Message to Client</label>
                                    <textarea
                                        value={replyMessage}
                                        onChange={(e) => setReplyMessage(e.target.value)}
                                        rows={4}
                                        placeholder={`Dear ${selectedContact.name},\n\nThank you for reaching out to Timmy Tails Grooming Salon...`}
                                        required
                                        className='w-full rounded-lg border border-[var(--tt-border)] bg-white p-3 text-xs text-[var(--tt-ink)] placeholder:text-[var(--tt-muted)] focus:border-[var(--tt-brand)] focus:outline-none'
                                    />
                                </div>

                                <div className='flex items-center justify-between pt-1'>
                                    {!selectedContact.read && (
                                        <button
                                            type='button'
                                            onClick={() => handleMarkAsRead(selectedContact._id)}
                                            disabled={markingId === selectedContact._id}
                                            className='inline-flex items-center gap-1.5 rounded-lg border border-[var(--tt-border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--tt-ink-soft)] transition hover:bg-[var(--tt-canvas)]'
                                        >
                                            <CheckCheck size={13} /> Mark as Read
                                        </button>
                                    )}

                                    <button
                                        type='submit'
                                        disabled={replySending || !replyMessage.trim()}
                                        className='ml-auto inline-flex items-center gap-2 rounded-xl bg-[var(--tt-ink)] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[var(--tt-brand)] disabled:opacity-40 shadow-xs'
                                    >
                                        {replySending ? (
                                            <>
                                                <RefreshCw size={13} className='animate-spin' /> Sending Email…
                                            </>
                                        ) : (
                                            <>
                                                <Send size={13} /> Dispatch Email Reply
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div className='rounded-2xl border border-dashed border-[var(--tt-border)] bg-white p-12 text-center shadow-xs'>
                            <div className='mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-[var(--tt-canvas)] text-[var(--tt-brand)]'>
                                <Mail size={22} />
                            </div>
                            <h4 className='font-serif text-xl font-bold text-[var(--tt-ink)]'>Select a Message</h4>
                            <p className='mt-1 text-xs text-[var(--tt-muted)] max-w-xs mx-auto'>
                                Click on any client inquiry on the left side to read the full inquiry and dispatch an official email reply.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmModal
                isOpen={Boolean(confirmDeleteId)}
                title='Delete Contact Message'
                description='Are you sure you want to delete this contact submission message? This action cannot be undone.'
                confirmText='Yes, Delete Message'
                cancelText='Keep Message'
                variant='danger'
                loading={Boolean(deletingId)}
                onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
                onClose={() => setConfirmDeleteId(null)}
            />
        </div>
    )
}

// ─────────────────────────────────────────────────────────
// NOTIFICATIONS VIEW
// ─────────────────────────────────────────────────────────
function NotificationsView({ notifications, customers, loading, onSend }) {
    const [title, setTitle] = useState('')
    const [message, setMessage] = useState('')
    const [audience, setAudience] = useState('all-users')
    const [targetUserId, setTargetUserId] = useState('')
    const [sending, setSending] = useState(false)
    const [search, setSearch] = useState('')

    // Pagination for notifications
    const [page, setPage] = useState(1)
    const pageSize = 6

    useEffect(() => {
        setPage(1)
    }, [search])

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!title.trim() || !message.trim()) {
            return
        }
        if (audience === 'user' && !targetUserId) {
            return
        }
        setSending(true)
        try {
            await onSend({
                title: title.trim(),
                message: message.trim(),
                audience,
                ...(audience === 'user' ? { targetUserId } : {})
            })
            setTitle('')
            setMessage('')
            setTargetUserId('')
        } finally {
            setSending(false)
        }
    }

    const filtered = (notifications || []).filter((n) => {
        if (!search.trim()) return true
        const q = search.toLowerCase()
        return (
            n.title?.toLowerCase().includes(q) ||
            n.message?.toLowerCase().includes(q)
        )
    })

    const totalItems = filtered.length
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
    const pagedNotifications = filtered.slice((page - 1) * pageSize, page * pageSize)

    const broadcastCount = (notifications || []).filter((n) => n.audience === 'all-users').length
    const targetedCount = (notifications || []).filter((n) => n.audience === 'user').length

    function timeAgo(dateStr) {
        if (!dateStr) return 'Unknown date'
        const date = new Date(dateStr)
        if (Number.isNaN(date.getTime())) return 'Unknown date'
        return date.toLocaleString('en-PH', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        })
    }

    return (
        <div className='space-y-6'>
            {/* Page header */}
            <div className='flex items-center gap-3 border-b border-[var(--tt-border)] pb-4'>
                <span className='grid h-10 w-10 place-items-center rounded-xl bg-[var(--tt-ink)] text-white shadow-xs'>
                    <Bell size={20} />
                </span>
                <div>
                    <h2 className='font-serif text-2xl font-bold text-[var(--tt-ink)]'>Notifications & Salon Broadcasts</h2>
                    <p className='text-xs text-[var(--tt-muted)]'>Compose and dispatch official notifications to customer accounts</p>
                </div>
            </div>

            {/* Stats row */}
            <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
                <div className='rounded-2xl border border-[var(--tt-border)] bg-white p-4 shadow-xs'>
                    <p className='text-2xl font-bold text-[var(--tt-ink)]'>{(notifications || []).length}</p>
                    <p className='text-xs font-semibold text-[var(--tt-muted)]'>Total Sent</p>
                </div>
                <div className='rounded-2xl border border-[var(--tt-border)] bg-white p-4 shadow-xs'>
                    <p className='text-2xl font-bold text-[var(--tt-ink)]'>{broadcastCount}</p>
                    <p className='text-xs font-semibold text-[var(--tt-muted)]'>Broadcasts</p>
                </div>
                <div className='rounded-2xl border border-[var(--tt-border)] bg-white p-4 shadow-xs'>
                    <p className='text-2xl font-bold text-[var(--tt-brand)]'>{targetedCount}</p>
                    <p className='text-xs font-semibold text-[var(--tt-muted)]'>Targeted Direct</p>
                </div>
            </div>

            <div className='grid gap-6 lg:grid-cols-5'>
                {/* ── Compose Form ── */}
                <div className='lg:col-span-2'>
                    <div className='rounded-2xl border border-[var(--tt-border)] bg-white shadow-xs'>
                        <div className='border-b border-[var(--tt-border)] px-5 py-4'>
                            <div className='flex items-center gap-2'>
                                <Megaphone size={16} className='text-[var(--tt-brand)]' />
                                <h3 className='font-bold text-[var(--tt-ink)]'>Send Notification</h3>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className='space-y-4 p-5'>
                            {/* Audience toggle */}
                            <div>
                                <label className='mb-1.5 block text-xs font-bold text-[var(--tt-ink-soft)]'>Send To</label>
                                <div className='flex gap-2'>
                                    <button
                                        type='button'
                                        onClick={() => { setAudience('all-users'); setTargetUserId('') }}
                                        className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-bold transition ${
                                            audience === 'all-users'
                                                ? 'border-[var(--tt-ink)] bg-[var(--tt-ink)] text-white shadow-xs'
                                                : 'border-[var(--tt-border)] bg-[var(--tt-canvas)] text-[var(--tt-muted)] hover:border-[var(--tt-ink)]'
                                        }`}
                                    >
                                        <Users size={13} />
                                        All Users
                                    </button>
                                    <button
                                        type='button'
                                        onClick={() => setAudience('user')}
                                        className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-bold transition ${
                                            audience === 'user'
                                                ? 'border-[var(--tt-brand)] bg-[var(--tt-brand)] text-white shadow-xs'
                                                : 'border-[var(--tt-border)] bg-[var(--tt-canvas)] text-[var(--tt-muted)] hover:border-[var(--tt-brand)]'
                                        }`}
                                    >
                                        <UserRound size={13} />
                                        Specific User
                                    </button>
                                </div>
                            </div>

                            {/* Target user selector */}
                            {audience === 'user' && (
                                <div>
                                    <label className='mb-1.5 block text-xs font-bold text-[var(--tt-ink-soft)]'>Select Customer</label>
                                    <select
                                        value={targetUserId}
                                        onChange={(e) => setTargetUserId(e.target.value)}
                                        required
                                        className='w-full rounded-xl border border-[var(--tt-border)] bg-white px-3 py-2 text-xs font-medium text-[var(--tt-ink)] focus:border-[var(--tt-brand)] focus:outline-none'
                                    >
                                        <option value=''>— Choose a customer —</option>
                                        {(customers || []).map((c) => (
                                            <option key={c._id} value={c._id}>
                                                {c.firstName} {c.lastName} ({c.email})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Title */}
                            <div>
                                <label className='mb-1.5 block text-xs font-bold text-[var(--tt-ink-soft)]'>
                                    Title <span className='text-[var(--tt-brand)]'>*</span>
                                </label>
                                <input
                                    type='text'
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    maxLength={120}
                                    placeholder='e.g. Salon Holiday Schedule Update'
                                    required
                                    className='w-full rounded-xl border border-[var(--tt-border)] bg-white px-3 py-2 text-xs text-[var(--tt-ink)] placeholder:text-[var(--tt-muted)] focus:border-[var(--tt-brand)] focus:outline-none'
                                />
                                <p className='mt-1 text-right text-[12px] text-[var(--tt-muted)]'>{title.length}/120</p>
                            </div>

                            {/* Message */}
                            <div>
                                <label className='mb-1.5 block text-xs font-bold text-[var(--tt-ink-soft)]'>
                                    Message <span className='text-[var(--tt-brand)]'>*</span>
                                </label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    maxLength={1000}
                                    rows={4}
                                    placeholder='Write your notification notice here…'
                                    required
                                    className='w-full resize-none rounded-xl border border-[var(--tt-border)] bg-white px-3 py-2 text-xs text-[var(--tt-ink)] placeholder:text-[var(--tt-muted)] focus:border-[var(--tt-brand)] focus:outline-none'
                                />
                                <p className='mt-1 text-right text-[12px] text-[var(--tt-muted)]'>{message.length}/1000</p>
                            </div>

                            {/* Preview */}
                            {(title || message) && (
                                <div className='rounded-xl border border-dashed border-[var(--tt-border)] bg-[var(--tt-canvas)]/40 p-3'>
                                    <p className='mb-1 text-[12px] font-bold uppercase tracking-[.08em] text-[var(--tt-muted)]'>Preview Notice</p>
                                    <p className='text-xs font-bold text-[var(--tt-ink)]'>{title || '—'}</p>
                                    <p className='mt-0.5 text-xs text-[var(--tt-ink-soft)] leading-relaxed'>{message || '—'}</p>
                                </div>
                            )}

                            <button
                                type='submit'
                                disabled={sending || loading || !title.trim() || !message.trim() || (audience === 'user' && !targetUserId)}
                                className='flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--tt-ink)] py-3 text-xs font-bold text-white shadow-xs transition hover:bg-[var(--tt-brand)] disabled:cursor-not-allowed disabled:opacity-40'
                            >
                                {sending ? (
                                    <>
                                        <RefreshCw size={13} className='animate-spin' /> Sending Notice…
                                    </>
                                ) : (
                                    <>
                                        <Send size={13} />
                                        {audience === 'all-users' ? 'Broadcast to All Users' : 'Send to Customer'}
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* ── Sent History ── */}
                <div className='lg:col-span-3 space-y-3'>
                    <div className='rounded-2xl border border-[var(--tt-border)] bg-white shadow-xs'>
                        <div className='flex items-center justify-between border-b border-[var(--tt-border)] px-5 py-4'>
                            <div className='flex items-center gap-2'>
                                <Bell size={15} className='text-[var(--tt-ink)]' />
                                <h3 className='font-bold text-[var(--tt-ink)]'>Sent History</h3>
                                <span className='rounded-full bg-[var(--tt-canvas)] px-2 py-0.5 text-[12px] font-bold text-[var(--tt-brand)]'>
                                    {(notifications || []).length}
                                </span>
                            </div>
                            {/* Search */}
                            <div className='relative'>
                                <Search size={13} className='absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--tt-muted)]' />
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder='Search notices…'
                                    className='rounded-xl border border-[var(--tt-border)] bg-white py-1.5 pl-7 pr-3 text-xs text-[var(--tt-ink)] focus:border-[var(--tt-brand)] focus:outline-none w-36 shadow-2xs'
                                />
                            </div>
                        </div>

                        <div className='divide-y divide-[var(--tt-border)]'>
                            {pagedNotifications.length === 0 ? (
                                <div className='flex flex-col items-center gap-3 py-14 text-[var(--tt-muted)]'>
                                    <Bell size={32} strokeWidth={1.5} />
                                    <p className='text-sm font-medium'>No notifications sent yet</p>
                                    <p className='text-xs text-[var(--tt-muted)]'>Use the form on the left to send one</p>
                                </div>
                            ) : (
                                pagedNotifications.map((n) => (
                                    <div key={n._id} className='flex items-start gap-3 px-5 py-4 hover:bg-[var(--tt-canvas)]/40 transition'>
                                        <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl ${
                                            n.audience === 'all-users'
                                                ? 'bg-[var(--tt-canvas)] text-[var(--tt-ink)]'
                                                : 'bg-[var(--tt-brand)]/15 text-[var(--tt-brand)]'
                                        }`}>
                                            {n.audience === 'all-users' ? <Megaphone size={14} /> : <UserRound size={14} />}
                                        </span>
                                        <div className='flex-1 min-w-0'>
                                            <div className='flex items-start justify-between gap-2'>
                                                <p className='text-xs font-bold text-[var(--tt-ink)] leading-snug'>{n.title}</p>
                                                <span className='shrink-0 text-[12px] text-[var(--tt-muted)] whitespace-nowrap'>{timeAgo(n.createdAt)}</span>
                                            </div>
                                            <p className='mt-0.5 text-xs text-[var(--tt-ink-soft)] leading-relaxed line-clamp-2'>{n.message}</p>
                                            <div className='mt-1.5 flex items-center gap-2'>
                                                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-bold ${
                                                    n.audience === 'all-users'
                                                        ? 'bg-[var(--tt-canvas)] text-[var(--tt-ink)]'
                                                        : 'bg-[var(--tt-brand)]/15 text-[var(--tt-brand)]'
                                                }`}>
                                                    {n.audience === 'all-users' ? <Users size={9} /> : <UserRound size={9} />}
                                                    {n.audience === 'all-users' ? 'Broadcast' : 'Targeted'}
                                                </span>
                                                {n.readBy?.length > 0 && (
                                                    <span className='inline-flex items-center gap-1 rounded-full bg-[var(--tt-success-bg)] px-2 py-0.5 text-[12px] font-bold text-[#216245]'>
                                                        <CheckCheck size={9} />
                                                        {n.readBy.length} read
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Pagination */}
                    <PaginationControl
                        currentPage={page}
                        totalPages={totalPages}
                        totalItems={totalItems}
                        pageSize={pageSize}
                        onPageChange={setPage}
                        label='notifications'
                    />
                </div>
            </div>
        </div>
    )
}
