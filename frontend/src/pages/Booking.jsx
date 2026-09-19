import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
    AlertCircle,
    AlertTriangle,
    Ban,
    CalendarDays,
    Check,
    ChevronLeft,
    ChevronRight,
    Clock,
    Clock3,
    Scissors,
    WandSparkles
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { aiPreviewApi, appointmentsApi, getErrorMessage, petsApi } from '../utils/api'
import { getPhilippineSeason } from '../utils/season'
import {
    SOURCE_PHOTO_POLICY_VERSION,
    createPreviewCacheKey,
    deleteCachedPreview,
    getCachedPreview,
    hashDataUrl,
    hashFile,
    saveCachedPreview
} from '../utils/previewCache'
import AvailabilityCalendar from '../features/booking/components/AvailabilityCalendar'
import TimeSlotGrid from '../features/booking/components/TimeSlotGrid'
import AiPreviewPanel from '../features/booking/components/AiPreviewPanel'
import AiStyleFloatingButton from '../features/booking/components/AiStyleFloatingButton'
import AiStylePreviewModal from '../features/booking/components/AiStylePreviewModal'
import BreedSelect from '../components/BreedSelect'
import PetAgeInput from '../components/PetAgeInput'
import {
    addDays,
    formatDateLong,
    formatTimeRange,
    toDateKey,
    toMonthKey
} from '../features/booking/utils/dateTime'
import { getActivePetId } from '../features/booking/utils/petContext'
import { getNextFailedStyleId } from '../features/booking/utils/galleryPolicy'
import { Botanical } from '../components/editorial/Decorations'

const SERVICE_COPY = {
    'basic-grooming': 'Bath and blow-dry with brushing, nail trimming and external ear cleaning for routine coat and hygiene maintenance.',
    'full-grooming': 'A complete grooming visit with bath, blow-dry, brushing and a full haircut adjusted to coat condition and your preferred finish.',
    'custom-styling': 'A haircut-focused appointment for a specific finish or shape, discussed with the groomer before clipping and scissoring begin.',
    'bath-blow-dry': 'Shampoo, conditioning, coat drying and brushing without a haircut.',
    'nail-trimming': 'Nail shortening and finishing performed according to your pet’s comfort and nail condition.',
    'ear-cleaning': 'Gentle external ear cleaning for routine hygiene. This service does not include treatment for ear infections or medical conditions.'
}

const fallbackServices = [
    { id: 'basic-grooming', name: 'Basic Grooming', description: SERVICE_COPY['basic-grooming'], durationMinutes: 60, price: 500, supportsAiPreview: false },
    { id: 'full-grooming', name: 'Full Grooming', description: SERVICE_COPY['full-grooming'], durationMinutes: 120, price: 1200, supportsAiPreview: true },
    { id: 'custom-styling', name: 'Custom Styling', description: SERVICE_COPY['custom-styling'], durationMinutes: 90, price: 1000, supportsAiPreview: true },
    { id: 'bath-blow-dry', name: 'Bath & Blow Dry', description: SERVICE_COPY['bath-blow-dry'], durationMinutes: 90, price: 800, supportsAiPreview: false },
    { id: 'nail-trimming', name: 'Nail Trimming', description: SERVICE_COPY['nail-trimming'], durationMinutes: 30, price: 200, supportsAiPreview: false },
    { id: 'ear-cleaning', name: 'Ear Cleaning', description: SERVICE_COPY['ear-cleaning'], durationMinutes: 30, price: 250, supportsAiPreview: false }
]

const applyServiceCopy = (service) => ({
    ...service,
    description: SERVICE_COPY[service.id] || service.description
})

const emptyPet = {
    name: '',
    type: 'dog',
    breed: '',
    coatType: '',
    notes: '',
    ageMonths: '',
    vaccinated: 'yes'
}


// The frontend displays only these fixed two-hour booking periods.
// The backend must enforce the same periods before saving.
const FIXED_BOOKING_SLOTS = [
    { startTime: '08:00', endTime: '10:00' },
    { startTime: '10:00', endTime: '12:00' },
    { startTime: '12:00', endTime: '14:00' },
    { startTime: '14:00', endTime: '16:00' }
]

const timeToMinutes = (time) => {
    const [hours, minutes] = String(time || '')
        .split(':')
        .map(Number)

    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
        return null
    }

    return hours * 60 + minutes
}

const rangesOverlap = (first, second) => {
    const firstStart = timeToMinutes(first.startTime)
    const firstEnd = timeToMinutes(first.endTime)
    const secondStart = timeToMinutes(second.startTime)
    const secondEnd = timeToMinutes(second.endTime)

    if (
        firstStart === null ||
        firstEnd === null ||
        secondStart === null ||
        secondEnd === null
    ) {
        return false
    }

    return firstStart < secondEnd && firstEnd > secondStart
}

const normalizeFixedSlots = (apiSlots = []) =>
    FIXED_BOOKING_SLOTS.map((fixedSlot) => {
        const exactSlot = apiSlots.find(
            (slot) =>
                slot.startTime === fixedSlot.startTime &&
                slot.endTime === fixedSlot.endTime
        )

        if (exactSlot) {
            return {
                ...fixedSlot,
                ...exactSlot
            }
        }

        const overlappingSlots = apiSlots.filter((slot) =>
            rangesOverlap(fixedSlot, slot)
        )

        const hasBookedConflict = overlappingSlots.some((slot) =>
            ['booked', 'unavailable', 'closed'].includes(slot.status)
        )

        const isPast = overlappingSlots.some(
            (slot) => slot.status === 'past'
        )

        return {
            ...fixedSlot,
            status: isPast
                ? 'past'
                : hasBookedConflict
                    ? 'booked'
                    : 'available'
        }
    })

const fileToDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(
        new Error('Unable to read the selected image')
    )
    reader.readAsDataURL(file)
})

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const runStyleQueue = async (items, worker) => {
    for (let i = 0; i < items.length; i += 1) {
        if (i > 0) {
            await delay(1500)
        }
        const result = await worker(items[i])

        if (result?.stopQueue) return result
    }

    return { stopQueue: false }
}

export default function Booking() {
    const { user, refreshUser } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    useEffect(() => {
        if (refreshUser) refreshUser()
    }, [refreshUser])
    const season = getPhilippineSeason()
    const today = useMemo(() => new Date(), [])
    const minDate = useMemo(() => toDateKey(today), [today])
    const maxDate = useMemo(() => toDateKey(addDays(today, 90)), [today])

    const [services, setServices] = useState(fallbackServices)
    const [styles, setStyles] = useState([])
    const [stylesLoading, setStylesLoading] = useState(false)
    const [previewVersion, setPreviewVersion] = useState('')
    const [recommendations, setRecommendations] = useState([])
    const [recommendationsLoading, setRecommendationsLoading] = useState(false)
    const [pets, setPets] = useState([])
    const [petMode, setPetMode] = useState('existing')
    const [selectedPetId, setSelectedPetId] = useState('')
    const [newPet, setNewPet] = useState(emptyPet)
    const [selectedServiceId, setSelectedServiceId] = useState('')
    const [selectedStyleId, setSelectedStyleId] = useState('')
    const [photoDataUrl, setPhotoDataUrl] = useState('')
    const [photoPreview, setPhotoPreview] = useState('')
    const [stylePreviews, setStylePreviews] = useState({})
    const [generatedPreview, setGeneratedPreview] = useState('')
    const [generatedPreviewMeta, setGeneratedPreviewMeta] = useState(null)
    const [previewFromCache, setPreviewFromCache] = useState(false)
    const [photoHash, setPhotoHash] = useState('')
    const [consent, setConsent] = useState(false)
    const [verificationStatus, setVerificationStatus] = useState('idle')
    const [galleryGenerating, setGalleryGenerating] = useState(false)
    const [galleryMessage, setGalleryMessage] = useState('')
    const [monthKey, setMonthKey] = useState(toMonthKey(today))
    const [monthStatuses, setMonthStatuses] = useState({})
    const [calendarLoading, setCalendarLoading] = useState(false)
    const [selectedDate, setSelectedDate] = useState('')
    const [slots, setSlots] = useState([])
    const [slotsLoading, setSlotsLoading] = useState(false)
    const [selectedTime, setSelectedTime] = useState('')
    const [userDayAppointment, setUserDayAppointment] = useState(null)
    const [myBookings, setMyBookings] = useState([])
    const [notes, setNotes] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [booked, setBooked] = useState(null)
    const [mobileStep, setMobileStep] = useState(1)
    const [isStyleModalOpen, setIsStyleModalOpen] = useState(false)
    const galleryRunIdRef = useRef(0)
    const galleryBusyRef = useRef(false)
    const startedGalleryKeyRef = useRef('')
    const photoVerificationTokenRef = useRef('')

    const selectedService = services.find((service) => service.id === selectedServiceId)
    const selectedPet = pets.find((pet) => pet._id === selectedPetId)
    const activePet = petMode === 'existing' ? selectedPet : newPet
    const activePetId = getActivePetId(petMode, selectedPet)
    const activePetAge = activePet?.ageMonths !== undefined && activePet?.ageMonths !== '' ? Number(activePet.ageMonths) : null
    const isPetTooYoung = activePetAge !== null && !isNaN(activePetAge) && activePetAge < 3
    const isPetNotVaccinated = activePet?.vaccinated === false || activePet?.vaccinated === 'no' || activePet?.vaccinated === 'false'
    const activePetType = String(activePet?.type || '').toLowerCase()
    const compatibleStyles = useMemo(() =>
        styles.filter((style) =>
            Array.isArray(style.petTypes) &&
            style.petTypes.includes(activePetType)
        ),
        [styles, activePetType]
    )
    const aiEnabled = Boolean(selectedService?.supportsAiPreview)
    const selectedStyle = aiEnabled ? compatibleStyles.find((style) => style.id === selectedStyleId) : null
    const selectedSlot = slots.find((slot) => slot.startTime === selectedTime)
    const bookingSteps = aiEnabled
        ? [
            { id: 1, label: 'Pet & service' },
            { id: 2, label: 'Style preview' },
            { id: 3, label: 'Date & time' },
            { id: 4, label: 'Review' }
        ]
        : [
            { id: 1, label: 'Pet & service' },
            { id: 3, label: 'Date & time' },
            { id: 4, label: 'Review' }
        ]
    const currentStepIndex = Math.max(0, bookingSteps.findIndex((step) => step.id === mobileStep))

    useEffect(() => {
        if (!aiEnabled) {
            if (mobileStep === 2) {
                setMobileStep(3)
            }
            if (selectedStyleId) {
                setSelectedStyleId('')
            }
        }
    }, [aiEnabled, mobileStep, selectedStyleId])

    useEffect(() => {
        Promise.allSettled([
            appointmentsApi.getServices(),
            petsApi.getMine(),
            appointmentsApi.getMy()
        ]).then(([servicesResult, petsResult, appointmentsResult]) => {
            if (servicesResult.status === 'fulfilled' && servicesResult.value.data?.services?.length) {
                setServices(servicesResult.value.data.services.map(applyServiceCopy))
            }
            if (petsResult.status === 'fulfilled') {
                const loadedPets = petsResult.value.data?.pets || []
                setPets(loadedPets)
                if (loadedPets.length) {
                    setSelectedPetId(loadedPets[0]._id)
                } else {
                    setPetMode('new')
                }
            }
            if (appointmentsResult.status === 'fulfilled') {
                const loadedAppointments = appointmentsResult.value.data?.appointments || []
                const active = loadedAppointments.filter((a) => ['pending', 'confirmed'].includes(a.status))
                setMyBookings(active)
            }
        })
    }, [])

    const myBookedDateMap = useMemo(() => {
        const map = new Map()
        myBookings.forEach((a) => {
            if (a.date) {
                map.set(a.date, a)
            }
        })
        return map
    }, [myBookings])

    const calendarStatuses = useMemo(() => {
        const merged = { ...monthStatuses }
        myBookedDateMap.forEach((_, date) => {
            merged[date] = 'user-booked'
        })
        return merged
    }, [monthStatuses, myBookedDateMap])

    useEffect(() => {
        if (selectedDate && myBookedDateMap.has(selectedDate)) {
            setUserDayAppointment(myBookedDateMap.get(selectedDate))
            setSelectedTime('')
            setSlots([])
        }
    }, [selectedDate, myBookedDateMap])

    useEffect(() => {
        const reqServiceId = location.state?.serviceId || new URLSearchParams(location.search).get('service')
        const reqServiceName = location.state?.serviceName
        if (reqServiceId || reqServiceName) {
            const matched = services.find((s) =>
                (reqServiceId && s.id === reqServiceId) ||
                (reqServiceName && s.name.toLowerCase() === reqServiceName.toLowerCase())
            )
            if (matched) {
                setSelectedServiceId(matched.id)
            }
        }
    }, [location.state, location.search, services])

    useEffect(() => {
        const petType = String(
            activePet?.type || ''
        ).toLowerCase()

        if (!['dog', 'cat'].includes(petType)) {
            return
        }

        let active = true
        queueMicrotask(() => {
            if (active) setStylesLoading(true)
        })

        aiPreviewApi.getStyles(petType)
            .then(({ data }) => {
                if (!active) return
                setStyles(data.styles || [])
                setPreviewVersion(
                    data.previewVersion || 'default'
                )
            })
            .catch((error) => {
                if (!active) return
                setStyles([])
                toast.error(getErrorMessage(error))
            })
            .finally(() => {
                if (active) setStylesLoading(false)
            })

        return () => {
            active = false
        }
    }, [activePet?.type])

    // Auto-load saved pet photo if available on selected pet profile
    useEffect(() => {
        if (activePet?.photoUrl) {
            setPhotoPreview(activePet.photoUrl)
            setPhotoDataUrl(activePet.photoUrl)
            setConsent(true)
            hashDataUrl(activePet.photoUrl).then((hash) => {
                setPhotoHash(hash || `pet-profile-${activePet._id || activePet.name}`)
            }).catch(() => {
                setPhotoHash(`pet-profile-${activePet._id || activePet.name}`)
            })
        } else {
            setPhotoPreview('')
            setPhotoDataUrl('')
            setPhotoHash('')
            setConsent(false)
        }
    }, [activePet?._id, activePet?.name, activePet?.photoUrl, petMode])

    useEffect(() => {
        if (!aiEnabled || !activePet?.name || !activePet?.breed) {
            return
        }

        let active = true
        queueMicrotask(() => {
            if (!active) return
            setRecommendationsLoading(true)
        })
        aiPreviewApi.getRecommendations({
            serviceId: selectedService?.id || '',
            petId: activePetId,
            petName: activePet.name,
            petType: activePet.type || 'dog',
            breed: activePet.breed,
            coatType: activePet.coatType || '',
            season: season.key
        }).then(({ data }) => {
            if (!active) return
            setRecommendations(data.recommendations || [])
        }).catch(() => {
            if (active) setRecommendations([])
        }).finally(() => {
            if (active) {
                setRecommendationsLoading(false)
            }
        })

        return () => { active = false }
    }, [aiEnabled, activePet?.name, activePet?.breed, activePet?.type, activePet?.coatType, activePetId, selectedService?.id, season.key])

    useEffect(() => {
        if (!selectedServiceId) {
            return
        }

        queueMicrotask(() => setCalendarLoading(true))
        appointmentsApi.getMonthAvailability(monthKey, selectedServiceId)
            .then(({ data }) => {
                const map = Object.fromEntries((data.dates || []).map((item) => [item.date, item.status]))
                setMonthStatuses(map)
            })
            .catch((error) => {
                setMonthStatuses({})
                toast.error(getErrorMessage(error))
            })
            .finally(() => setCalendarLoading(false))
    }, [monthKey, selectedServiceId])

    useEffect(() => {
        if (!selectedDate || !selectedServiceId) {
            return
        }

        if (myBookedDateMap.has(selectedDate)) {
            setUserDayAppointment(myBookedDateMap.get(selectedDate))
            setSelectedTime('')
            setSlots([])
            return
        }

        let active = true

        queueMicrotask(() => {
            if (active) setSlotsLoading(true)
        })

        appointmentsApi
            .getAvailability(selectedDate, selectedServiceId)
            .then(({ data }) => {
                if (!active) return

                if (data?.userHasAppointment) {
                    setUserDayAppointment(data.userAppointment)
                    setSlots([])
                    return
                }

                setUserDayAppointment(null)
                const fixedSlots = normalizeFixedSlots(
                    Array.isArray(data?.slots)
                        ? data.slots
                        : []
                )

                setSlots(fixedSlots)
            })
            .catch((error) => {
                if (!active) return

                setUserDayAppointment(null)
                setSlots([])
                toast.error(getErrorMessage(error))
            })
            .finally(() => {
                if (active) {
                    setSlotsLoading(false)
                }
            })

        return () => {
            active = false
        }
    }, [selectedDate, selectedServiceId, myBookedDateMap])

    useEffect(() => () => {
        if (photoPreview?.startsWith('blob:')) URL.revokeObjectURL(photoPreview)
    }, [photoPreview])

    const resetStyleGallery = ({ clearPhoto = false } = {}) => {
        galleryRunIdRef.current += 1
        startedGalleryKeyRef.current = ''
        photoVerificationTokenRef.current = ''
        setStylePreviews({})
        setSelectedStyleId('')
        setGeneratedPreview('')
        setGeneratedPreviewMeta(null)
        setPreviewFromCache(false)
        setVerificationStatus('idle')
        setGalleryGenerating(false)
        setGalleryMessage('')

        if (clearPhoto) {
            setPhotoDataUrl('')
            setPhotoPreview('')
            setPhotoHash('')
        }
    }

    const resetForPetChange = (targetPet = null) => {
        const pet = targetPet || activePet
        setRecommendations([])
        if (pet?.photoUrl) {
            resetStyleGallery({ clearPhoto: false })
            setPhotoPreview(pet.photoUrl)
            setPhotoDataUrl(pet.photoUrl)
            setConsent(true)
            hashDataUrl(pet.photoUrl).then((hash) => {
                setPhotoHash(hash || `pet-profile-${pet._id || pet.name}`)
            }).catch(() => {
                setPhotoHash(`pet-profile-${pet._id || pet.name}`)
            })
        } else {
            setConsent(false)
            resetStyleGallery({ clearPhoto: true })
        }
    }

    const selectService = (serviceId) => {
        setSelectedServiceId(serviceId)
        setSelectedDate('')
        setSelectedTime('')
        setSlots([])
        setRecommendations([])

        const targetService = services.find((s) => s.id === serviceId)
        if (!targetService?.supportsAiPreview) {
            setSelectedStyleId('')
            resetStyleGallery({ clearPhoto: false })
        } else if (activePet?.photoUrl) {
            resetStyleGallery({ clearPhoto: false })
            setPhotoPreview((prev) => prev || activePet.photoUrl)
            setPhotoDataUrl((prev) => prev || activePet.photoUrl)
            setPhotoHash((prev) => prev || `pet-profile-${activePet._id || activePet.name}-${String(activePet.photoUrl).slice(-20)}`)
            setConsent(true)
        } else {
            setConsent(false)
            resetStyleGallery({ clearPhoto: true })
        }
    }

    const selectStyle = (styleId) => {
        setSelectedStyleId(styleId)
        const stylePreview = stylePreviews[styleId]

        if (stylePreview?.status === 'ready' && stylePreview.generatedImage) {
            setGeneratedPreview(stylePreview.generatedImage)
            setGeneratedPreviewMeta({
                previewId: stylePreview.previewId || null,
                model: stylePreview.model || null,
                previewVersion: stylePreview.previewVersion || previewVersion,
                sourcePhotoHash: stylePreview.sourcePhotoHash || photoHash,
                verification: stylePreview.verification || null,
                fidelityCheck: stylePreview.fidelityCheck || null,
                season: stylePreview.season || {
                    key: season.key,
                    label: season.label
                },
                styleId,
                styleName:
                    stylePreview.styleName ||
                    compatibleStyles.find((style) => style.id === styleId)?.name
            })
            setPreviewFromCache(Boolean(stylePreview.fromCache))
        } else {
            setGeneratedPreview('')
            setGeneratedPreviewMeta(null)
            setPreviewFromCache(false)
        }
    }

    const handlePhoto = async (event) => {
        const file = event.target.files?.[0]
        if (!file) return

        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            toast.error('Upload a JPG, PNG, or WEBP image')
            event.target.value = ''
            return
        }

        if (file.size > 7 * 1024 * 1024) {
            toast.error('The photo must be 7 MB or smaller')
            event.target.value = ''
            return
        }

        if (photoPreview?.startsWith('blob:')) {
            URL.revokeObjectURL(photoPreview)
        }

        resetStyleGallery()
        setPhotoPreview(URL.createObjectURL(file))
        setPhotoDataUrl('')
        setPhotoHash('')

        try {
            const [dataUrl, hash] = await Promise.all([
                fileToDataUrl(file),
                hashFile(file)
            ])
            setPhotoDataUrl(dataUrl)
            setPhotoHash(hash)
        } catch {
            toast.error('Unable to prepare this pet photo')
        }
    }

    const handleConsentChange = (value) => {
        setConsent(value)

        if (!value) {
            resetStyleGallery()
        }
    }

    const buildStyleCacheKey = (styleId) =>
        createPreviewCacheKey({
            photoHash,
            petType: activePet.type,
            breed: activePet.breed,
            styleId,
            seasonKey: season.key,
            previewVersion
        })

    const setStylePreviewForRun = (
        runId,
        styleId,
        value
    ) => {
        if (galleryRunIdRef.current !== runId) return

        setStylePreviews((current) => ({
            ...current,
            [styleId]: {
                ...(current[styleId] || {}),
                ...value
            }
        }))
    }

    const getCommonPreviewPayload = () => ({
        petPhotoDataUrl: photoDataUrl || activePet?.photoUrl || '',
        serviceId: selectedService?.id || '',
        petId: activePetId || (activePet?._id ? String(activePet._id) : ''),
        petName: activePet?.name || '',
        petType: activePet?.type || 'dog',
        breed: activePet?.breed || '',
        coatType: activePet?.coatType || '',
        consent: true
    })

    const createStylePreview = async ({
        style,
        verificationToken,
        runId
    }) => {
        setStylePreviewForRun(
            runId,
            style.id,
            { status: 'generating', error: '' }
        )

        try {
            const { data } = await aiPreviewApi.generate({
                ...getCommonPreviewPayload(),
                styleId: style.id,
                photoVerificationToken:
                    verificationToken
            })
            const preview = data.preview
            const entry = {
                status: 'ready',
                generatedImage:
                    preview.generatedImage,
                previewId:
                    preview.previewId || null,
                model: preview.model || null,
                previewVersion:
                    preview.previewVersion ||
                    previewVersion,
                sourcePhotoHash:
                    preview.sourcePhotoHash ||
                    photoHash,
                verification:
                    preview.verification || null,
                fidelityCheck:
                    preview.fidelityCheck || null,
                season: preview.season || {
                    key: season.key,
                    label: season.label
                },
                styleId: preview.styleId,
                styleName: preview.styleName,
                fromCache: false,
                error: ''
            }

            setStylePreviewForRun(
                runId,
                style.id,
                entry
            )

            await saveCachedPreview({
                key: buildStyleCacheKey(style.id),
                ...entry,
                petType: activePet.type || 'dog',
                breed: activePet.breed
            })

            return {
                success: true,
                stopQueue: false
            }
        } catch (error) {
            const errorCode =
                error?.response?.data?.code || ''
            const errorMessage =
                getErrorMessage(error)

            if (
                errorCode ===
                'PHOTO_VERIFICATION_EXPIRED'
            ) {
                photoVerificationTokenRef.current = ''
            }

            setStylePreviewForRun(
                runId,
                style.id,
                {
                    status: 'error',
                    error: errorMessage,
                    errorCode
                }
            )

            return {
                success: false,
                stopQueue: false,
                error: errorMessage,
                errorCode
            }
        }
    }

    const startPersonalizedGallery = async (
        onlyStyleIds = null,
        { forceRefresh = false } = {}
    ) => {
        if (galleryBusyRef.current) {
            if (onlyStyleIds) {
                toast('Please wait for the current preview to finish')
            }
            return
        }

        const targetStyles = onlyStyleIds
            ? compatibleStyles.filter((style) =>
                onlyStyleIds.includes(style.id)
            )
            : compatibleStyles

        if (!targetStyles.length) return

        const isManualSelection = Boolean(onlyStyleIds)
        const runId = galleryRunIdRef.current + 1
        galleryRunIdRef.current = runId

        if (isManualSelection) {
            galleryBusyRef.current = true
            setGalleryGenerating(true)
            setGalleryMessage(forceRefresh ? 'Regenerating preview…' : 'Preparing preview…')
            setStylePreviews((current) => ({
                ...current,
                ...Object.fromEntries(
                    targetStyles.map((style) => [
                        style.id,
                        { status: 'queued' }
                    ])
                )
            }))
        } else {
            setSelectedStyleId('')
            setGeneratedPreview('')
            setGeneratedPreviewMeta(null)
            setPreviewFromCache(false)
            setStylePreviews(
                Object.fromEntries(
                    targetStyles.map((style) => [
                        style.id,
                        { status: 'idle' }
                    ])
                )
            )
        }

        try {
            if (forceRefresh) {
                await Promise.all(
                    targetStyles.map((style) =>
                        deleteCachedPreview(buildStyleCacheKey(style.id))
                    )
                )
            }

            const cachedResults = forceRefresh
                ? targetStyles.map((style) => ({ style, cached: null }))
                : await Promise.all(
                    targetStyles.map(async (style) => ({
                        style,
                        cached: await getCachedPreview(
                            buildStyleCacheKey(style.id)
                        )
                    }))
                )

            if (galleryRunIdRef.current !== runId) return

            cachedResults.forEach(({ style, cached }) => {
                if (cached?.generatedImage) {
                    setStylePreviewForRun(
                        runId,
                        style.id,
                        {
                            ...cached,
                            status: 'ready',
                            fromCache: true,
                            error: ''
                        }
                    )
                }
            })

            // On initial consent/upload, only restore cached previews if any.
            // Do NOT automatically generate any new previews until the user clicks a card.
            if (!isManualSelection) {
                return
            }

            const stylesForRun = targetStyles.filter((style) => {
                const isCached = cachedResults.some(
                    (r) => r.style.id === style.id && r.cached?.generatedImage
                )
                return !isCached
            })

            if (!stylesForRun.length) {
                return
            }

            let verificationToken =
                photoVerificationTokenRef.current

            if (!verificationToken) {
                setVerificationStatus('checking')
                setGalleryMessage(
                    'Checking your pet photo once…'
                )

                const { data } =
                    await aiPreviewApi.verifyPhoto(
                        getCommonPreviewPayload()
                    )

                if (galleryRunIdRef.current !== runId) return

                const photoVerification =
                    data?.photoVerification
                const sourceCheck =
                    photoVerification?.verification
                const expectedPetType = String(
                    activePet.type || ''
                ).toLowerCase()

                if (sourceCheck?.valid !== true) {
                    throw new Error(
                        sourceCheck?.reason ||
                        `This photo does not pass the ${expectedPetType} verification. Upload a clear photo of the selected ${expectedPetType}.`
                    )
                }

                if (
                    expectedPetType &&
                    sourceCheck?.detectedAnimal &&
                    !['unclear', 'other'].includes(sourceCheck.detectedAnimal) &&
                    sourceCheck.detectedAnimal !== expectedPetType
                ) {
                    throw new Error(
                        `This photo appears to show a ${sourceCheck.detectedAnimal}. Please upload a clear photo of the selected ${expectedPetType}.`
                    )
                }

                verificationToken =
                    photoVerification.token
                photoVerificationTokenRef.current =
                    verificationToken
                setVerificationStatus('verified')
            }

            setGalleryMessage(
                onlyStyleIds
                    ? 'Preparing your selected style…'
                    : 'Preparing saved style previews…'
            )
            const queueResult = await runStyleQueue(
                stylesForRun,
                (style) => createStylePreview({
                    style,
                    verificationToken,
                    runId
                })
            )

            if (queueResult.stopQueue) {
                const pausedMessage =
                    queueResult.error ||
                    'The preview service is temporarily unavailable. Try this style again in a few minutes.'

                setStylePreviews((current) =>
                    Object.fromEntries(
                        Object.entries(current).map(
                            ([styleId, entry]) => [
                                styleId,
                                entry.status === 'queued'
                                    ? {
                                        ...entry,
                                        status: 'error',
                                        error: pausedMessage,
                                        errorCode:
                                            'AI_QUOTA_EXHAUSTED'
                                    }
                                    : entry
                            ]
                        )
                    )
                )
                toast.error(pausedMessage)
            }
        } catch (error) {
            if (galleryRunIdRef.current !== runId) return

            setVerificationStatus('error')
            setStylePreviews((current) =>
                Object.fromEntries(
                    Object.entries(current).map(
                        ([styleId, entry]) => [
                            styleId,
                            entry.status === 'ready'
                                ? entry
                                : {
                                    ...entry,
                                    status: 'error',
                                    error:
                                        getErrorMessage(error)
                                }
                        ]
                    )
                )
            )
            toast.error(getErrorMessage(error))
        } finally {
            galleryBusyRef.current = false

            if (galleryRunIdRef.current === runId) {
                setGalleryGenerating(false)
                setGalleryMessage('')
            }
        }
    }

    const retryStylePreview = (styleId) => {
        if (galleryBusyRef.current) return
        startPersonalizedGallery([styleId], { forceRefresh: true })
    }

    const retryFailedStylePreviews = () => {
        if (galleryBusyRef.current) return

        const nextStyleId = getNextFailedStyleId({
            stylePreviews,
            recommendations
        })

        if (nextStyleId) {
            startPersonalizedGallery([nextStyleId], { forceRefresh: true })
        }
    }

    const galleryInputKey = (
        aiEnabled &&
        consent &&
        photoDataUrl &&
        photoHash &&
        previewVersion &&
        compatibleStyles.length &&
        !stylesLoading
    )
        ? [
            selectedService.id,
            activePetId || activePet.name,
            activePet.type,
            activePet.breed,
            activePet.coatType || '',
            photoHash,
            previewVersion,
            compatibleStyles.map((style) => style.id).join(',')
        ].join('|')
        : ''
    const hasStyleFailures = Object.values(
        stylePreviews
    ).some((preview) => preview.status === 'error')

    /* The gallery runner is deliberately keyed by the complete, stable input
       signature. Adding its render-local function identity would restart the
       paid generation workflow after every preview-state update. */
    /* eslint-disable react-hooks/exhaustive-deps */
    useEffect(() => {
        if (
            !galleryInputKey ||
            startedGalleryKeyRef.current === galleryInputKey
        ) {
            return
        }

        startedGalleryKeyRef.current = galleryInputKey
        queueMicrotask(() => {
            if (
                startedGalleryKeyRef.current === galleryInputKey
            ) {
                startPersonalizedGallery()
            }
        })
    }, [galleryInputKey])
    /* eslint-enable react-hooks/exhaustive-deps */

    // Auto-select only when preview/recommendation state changes. selectStyle is
    // render-local but does not define when this selection effect should rerun.
    /* eslint-disable react-hooks/exhaustive-deps */
    useEffect(() => {
        if (!selectedStyleId) {
            const topRecommendationId = recommendations[0]?.id
            if (topRecommendationId && stylePreviews[topRecommendationId]?.status === 'ready' && stylePreviews[topRecommendationId]?.generatedImage) {
                selectStyle(topRecommendationId)
                return
            }

            const firstReadyEntry = Object.entries(stylePreviews).find(
                ([, entry]) => entry?.status === 'ready' && entry?.generatedImage
            )
            if (firstReadyEntry) {
                selectStyle(firstReadyEntry[0])
                return
            }

            if (compatibleStyles.length > 0) {
                setSelectedStyleId(compatibleStyles[0].id)
            }
            return
        }

        const activePreview = stylePreviews[selectedStyleId]
        if (activePreview?.status === 'ready' && activePreview?.generatedImage && !generatedPreview) {
            setGeneratedPreview(activePreview.generatedImage)
            setGeneratedPreviewMeta({
                previewId: activePreview.previewId || null,
                model: activePreview.model || null,
                previewVersion: activePreview.previewVersion || previewVersion,
                sourcePhotoHash: activePreview.sourcePhotoHash || photoHash,
                verification: activePreview.verification || null,
                fidelityCheck: activePreview.fidelityCheck || null,
                season: activePreview.season || {
                    key: season.key,
                    label: season.label
                },
                styleId: selectedStyleId,
                styleName: activePreview.styleName || compatibleStyles.find((style) => style.id === selectedStyleId)?.name
            })
            setPreviewFromCache(Boolean(activePreview.fromCache))
        }
    }, [stylePreviews, recommendations, selectedStyleId, compatibleStyles, generatedPreview])
    /* eslint-enable react-hooks/exhaustive-deps */

    const validate = () => {
        if (!selectedService) return { message: 'Please select a grooming service', sectionId: 'booking-section-1' }
        if (!activePet?.name || !activePet?.breed || !activePet?.type) return { message: 'Please complete the pet information', sectionId: 'booking-section-1' }
        if (isPetTooYoung) return { message: 'Pets must be at least 3 months old to be booked', sectionId: 'booking-section-1' }
        if (isPetNotVaccinated) return { message: 'Pets must be fully vaccinated to proceed', sectionId: 'booking-section-1' }
        if (aiEnabled && !selectedStyle) return { message: 'Please select a haircut style preview', sectionId: 'booking-section-2' }
        if (userDayAppointment) return { message: 'You already have an appointment on this day. Please choose another date.', sectionId: 'booking-section-3' }
        if (!selectedDate || !selectedSlot) return { message: 'Please select an available date and time slot', sectionId: 'booking-section-3' }
        if (!user?.phone) return { message: 'Complete your profile with a phone number', sectionId: null }
        return null
    }

    const scrollToSection = (sectionId, targetStep = null) => {
        if (targetStep) {
            setMobileStep(targetStep)
        } else if (sectionId === 'booking-section-1') {
            setMobileStep(1)
        } else if (sectionId === 'booking-section-2') {
            setMobileStep(2)
        } else if (sectionId === 'booking-section-3') {
            setMobileStep(3)
        }
        window.scrollTo({ top: 0, behavior: 'smooth' })
        if (!sectionId) return
        setTimeout(() => {
            const el = document.getElementById(sectionId)
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
        }, 100)
    }

    const validateStep1 = () => {
        if (user?.accountStatus === 'booking_blocked' || user?.accountStatus === 'banned') {
            toast.error(user.accountStatus === 'banned'
                ? 'Your customer account has been permanently suspended.'
                : `Your booking access is currently blocked by salon administration. ${user.statusReason || ''}`
            )
            return false
        }
        if (!selectedService) { toast.error('Please select a grooming service'); return false }
        if (!activePet?.name || !activePet?.breed || !activePet?.type) { toast.error('Please complete the pet information'); return false }
        if (isPetTooYoung) { toast.error('Pets must be at least 3 months old to be booked'); return false }
        if (isPetNotVaccinated) { toast.error('Pets must be fully vaccinated to proceed'); return false }
        return true
    }

    const validateStep2 = () => {
        if (user?.accountStatus === 'booking_blocked' || user?.accountStatus === 'banned') {
            toast.error('Your booking privileges are currently blocked by salon administration.')
            return false
        }
        if (aiEnabled && !selectedStyle) { toast.error('Please select a haircut style preview'); return false }
        return true
    }

    const validateStep3 = () => {
        if (user?.accountStatus === 'booking_blocked' || user?.accountStatus === 'banned') {
            toast.error('Your booking privileges are currently blocked by salon administration.')
            return false
        }
        if (userDayAppointment || (selectedDate && myBookedDateMap.has(selectedDate))) {
            const bookedAppt = myBookedDateMap.get(selectedDate) || userDayAppointment
            toast.error(`You already have an appointment on this day${bookedAppt ? ` (${bookedAppt.time} for ${bookedAppt.petName || 'your pet'})` : ''}. Please pick a different date.`)
            return false
        }
        if (!selectedDate || !selectedSlot) { toast.error('Please select an available date and time slot'); return false }
        return true
    }

    const goToNextStep = () => {
        const valid = mobileStep === 1
            ? validateStep1()
            : mobileStep === 2
                ? validateStep2()
                : mobileStep === 3
                    ? validateStep3()
                    : true

        if (!valid) return

        const sequence = aiEnabled ? [1, 2, 3, 4] : [1, 3, 4]
        const index = sequence.indexOf(mobileStep)
        const next = sequence[index + 1]
        if (next) {
            setMobileStep(next)
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }

    const goToPreviousStep = () => {
        const sequence = aiEnabled ? [1, 2, 3, 4] : [1, 3, 4]
        const index = sequence.indexOf(mobileStep)
        const previous = sequence[index - 1]
        if (previous) {
            setMobileStep(previous)
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }

    const submitBooking = async () => {
        if (user?.accountStatus === 'booking_blocked' || user?.accountStatus === 'banned') {
            toast.error(user.accountStatus === 'banned'
                ? 'Your customer account has been permanently suspended.'
                : `Your booking privileges are currently blocked by salon administration. ${user.statusReason || ''}`
            )
            return
        }
        const error = validate()
        if (error) {
            toast.error(error.message)
            scrollToSection(error.sectionId)
            return
        }

        setSubmitting(true)
        try {
            let petId = activePetId || ''
            let petRecord = petMode === 'existing'
                ? selectedPet
                : null
            if (petMode === 'new') {
                const existingSamePet = pets.find(
                    (p) => String(p.name || '').trim().toLowerCase() === String(newPet.name || '').trim().toLowerCase() &&
                           String(p.type || '').toLowerCase() === String(newPet.type || '').toLowerCase()
                )
                if (existingSamePet) {
                    petRecord = existingSamePet
                    petId = existingSamePet._id
                } else {
                    const { data } = await petsApi.create(newPet)
                    petRecord = data.pet
                    petId = data.pet._id
                    setPets((current) => [data.pet, ...current])
                    setSelectedPetId(data.pet._id)
                }
            }

            const { data } = await appointmentsApi.create({
                petId,
                petName: petRecord?.name || activePet.name,
                petType: petRecord?.type || activePet.type,
                breed: petRecord?.breed || activePet.breed,
                petAgeMonths: activePet?.ageMonths !== undefined && activePet?.ageMonths !== '' ? Number(activePet.ageMonths) : null,
                vaccinated: activePet?.vaccinated !== false && activePet?.vaccinated !== 'no' && activePet?.vaccinated !== 'false',
                serviceId: selectedService.id,
                haircutStyle: aiEnabled ? (selectedStyle?.id || null) : null,
                aiPreviewUsed: Boolean(aiEnabled && generatedPreview),
                aiPreviewId: aiEnabled ? (generatedPreviewMeta?.previewId || null) : null,
                aiPreviewImage: (aiEnabled && !generatedPreviewMeta?.previewId)
                    ? (generatedPreview || null)
                    : null,
                aiPreviewModel: aiEnabled ? (generatedPreviewMeta?.model || null) : null,
                aiPreviewSourceHash: aiEnabled ? (generatedPreviewMeta?.sourcePhotoHash || photoHash || null) : null,
                date: selectedDate,
                time: selectedTime,
                ownerName: `${user.firstName} ${user.lastName}`.trim(),
                ownerEmail: user.email || '',
                ownerPhone: user.phone,
                ownerAddress: user.homeAddress || '',
                notes
            })

            setBooked(data.appointment)
            window.scrollTo({ top: 0, behavior: 'smooth' })
        } catch (error) {
            toast.error(getErrorMessage(error))
        } finally {
            setSubmitting(false)
        }
    }

    if (booked) {
        return (
            <div className='booking-page min-h-screen bg-[#fdf4ef] px-4 py-12 text-[var(--tt-ink)] sm:px-6 lg:px-8'>
                <div className='mx-auto max-w-xl rounded-sm border border-[var(--tt-border)] bg-white p-7 text-center shadow-xs sm:p-10 space-y-6'>
                    <span className='mx-auto grid h-16 w-16 place-items-center rounded-sm bg-[var(--tt-sage)] text-[var(--tt-brand-strong)]'>
                        <Check size={30} strokeWidth={2.5} />
                    </span>
                    <div>
                        <h1 className='font-serif text-3xl font-bold tracking-tight text-[var(--tt-ink)] sm:text-4xl'>Appointment Confirmed</h1>
                        <p className='mt-1.5 text-sm text-[var(--tt-muted)]'>Your grooming appointment has been received and scheduled.</p>
                    </div>

                    <div className='rounded-sm border border-[var(--tt-border)] bg-[var(--tt-canvas)] p-5 text-left space-y-1'>
                        <SummaryRow label='Pet' value={`${booked.petName} (${booked.breed})`} />
                        <SummaryRow label='Service' value={booked.service} />
                        {booked.haircutStyle && <SummaryRow label='Style' value={booked.haircutStyle} />}
                        <SummaryRow label='Date' value={formatDateLong(booked.date)} />
                        <SummaryRow label='Time' value={formatTimeRange(booked.time, booked.endTime)} />
                        <SummaryRow label='Total' value={`₱${Number(booked.price).toLocaleString('en-PH')}`} strong />
                    </div>

                    {/* Arrival Policy Notice Banner */}
                    <div className='rounded-sm border border-[#F0DEB6] bg-[#FFF9EC] p-4 text-left flex items-start gap-3.5 text-[#6E4A0D] shadow-xs'>
                        <span className='grid h-9 w-9 shrink-0 place-items-center rounded-sm bg-[#FFF0D1] text-[#8A5D13]'>
                            <Clock size={17} />
                        </span>
                        <div className='text-xs leading-relaxed'>
                            <p className='font-bold text-[#8A5D13] text-sm'>Arrival Guideline</p>
                            <p className='mt-0.5 text-[#6E4A0D]'>Please arrive <strong>5–10 minutes before</strong> your scheduled appointment time.</p>
                            <p className='mt-1 text-[11px] font-semibold text-[#8A5D13]/90'>Late arrival beyond 10 minutes may result in cancellation to respect other reserved slots.</p>
                        </div>
                    </div>

                    <div className='flex flex-col justify-center gap-3 sm:flex-row pt-2'>
                        <button onClick={() => navigate('/appointments')} className='rounded-lg bg-[var(--tt-ink)] px-6 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#514b42]'>
                            View Appointments
                        </button>
                        <button onClick={() => navigate('/dashboard')} className='rounded-lg border border-[var(--tt-border)] bg-white px-6 py-2.5 text-xs font-semibold text-[var(--tt-ink)] transition hover:bg-[var(--tt-canvas)]'>
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className='booking-page relative min-h-screen overflow-hidden bg-[#fdf4ef] text-[var(--tt-ink)] selection:bg-[#d1a85b]/20'>
            {/* Same decorative background as UserDashboard */}
            <svg className='pointer-events-none absolute inset-0 z-0 h-full w-full' viewBox='0 0 1440 900' fill='none' preserveAspectRatio='none'>
                <path d='M-100,160 C300,240 600,60 980,180 C1250,260 1400,140 1600,200' stroke='#ecdcd0' strokeWidth='1.5' strokeDasharray='5 5' />
                <path d='M-50,420 C350,500 700,320 1080,460 C1300,540 1450,440 1650,480' stroke='#f2e2d7' strokeWidth='1.2' strokeDasharray='5 5' />
            </svg>
            <Botanical className='pointer-events-none absolute -left-12 top-24 z-0 w-72 text-[#cf7c54] opacity-25' />
            <Botanical className='pointer-events-none absolute -right-16 top-[650px] z-0 w-96 rotate-12 -scale-x-100 text-[#d1a85b] opacity-20' />

            <div className='relative z-10 px-4 py-8 pb-28 sm:px-6 md:py-10 lg:px-8 lg:pb-16'>
                <div className='booking-container mx-auto max-w-[1080px]'>
                <header className='mb-8 lg:mb-10'>
                    <p className='text-[10px] font-bold uppercase tracking-[.2em] text-[var(--tt-gold)]'>Book a grooming visit</p>
                    <div className='mt-3 flex flex-col gap-4 border-b border-[var(--tt-border)] pb-7 lg:flex-row lg:items-end lg:justify-between'>
                        <div>
                            <h1 className='max-w-3xl font-serif text-[clamp(2.35rem,5vw,4.3rem)] font-normal leading-[.98] tracking-[-.04em] text-[var(--tt-ink)]'>Choose what they need, then pick a time.</h1>
                        </div>
                        <p className='max-w-sm text-sm leading-6 text-[var(--tt-muted)]'>Your choices are saved as you move through the booking. You can go back before confirming.</p>
                    </div>
                </header>

                {user?.accountStatus === 'warned' && (
                    <div className='mb-6 flex items-start gap-3 border border-[#F0DEB6] bg-[#FFF4DC] p-4 text-xs text-[#6E4A0D]'>
                        <AlertTriangle className='mt-0.5 h-5 w-5 shrink-0' />
                        <div>
                            <p className='font-semibold text-[var(--tt-ink)]'>Account notice</p>
                            <p className='mt-1 leading-5'>{user.warningMessage || user.statusReason || 'Please review the salon booking and attendance policy before making another appointment.'}</p>
                        </div>
                    </div>
                )}

                {(user?.accountStatus === 'booking_blocked' || user?.accountStatus === 'banned') && (
                    <div className='mb-6 flex items-start gap-3 border border-[#F0CCCC] bg-[#FBEAEA] p-5 text-sm text-[#7F3333]'>
                        <Ban className='mt-0.5 h-5 w-5 shrink-0' />
                        <div>
                            <p className='font-semibold'>Booking is currently unavailable for this account.</p>
                            <p className='mt-1 leading-6'>{user.statusReason || user.warningMessage || 'Please contact TimmyTails if you need help with your account.'}</p>
                        </div>
                    </div>
                )}

                <BookingProgress steps={bookingSteps} currentIndex={currentStepIndex} />

                {(mobileStep > 1 && (activePet?.name || selectedService)) && (
                    <div className='mb-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-[var(--tt-border)] py-3 text-xs text-[var(--tt-muted)]'>
                        {activePet?.name && <span><strong className='font-semibold text-[var(--tt-ink)]'>{activePet.name}</strong>{activePet.breed ? ` · ${activePet.breed}` : ''}</span>}
                        {selectedService && <span><strong className='font-semibold text-[var(--tt-ink)]'>{selectedService.name}</strong> · ₱{Number(selectedService.price || 0).toLocaleString('en-PH')}</span>}
                        {aiEnabled && selectedStyle && <span>{selectedStyle.name}</span>}
                    </div>
                )}

                <div className='border border-[var(--tt-border)] bg-[rgba(255,255,255,.58)] p-5 sm:p-7 lg:p-9'>
                    {mobileStep === 1 && (
                        <Section id='booking-section-1' number='1' title='Pet & service' icon={<Scissors size={18} />}>
                            <div>
                                <h3 className='font-serif text-xl text-[var(--tt-ink)]'>Choose a service</h3>
                                <div className='mt-4 grid gap-3 md:grid-cols-2'>
                                    {services.map((service) => {
                                        const selected = selectedServiceId === service.id
                                        return (
                                            <button
                                                key={service.id}
                                                type='button'
                                                onClick={() => selectService(service.id)}
                                                aria-pressed={selected}
                                                className={`border p-5 text-left transition ${selected ? 'border-[var(--tt-ink)] bg-white shadow-[0_7px_22px_rgba(51,51,47,.07)]' : 'border-[var(--tt-border)] bg-white/70 hover:border-[var(--tt-ink-soft)]'}`}
                                            >
                                                <div className='flex items-start justify-between gap-4'>
                                                    <h4 className='font-serif text-xl text-[var(--tt-ink)]'>{service.name}</h4>
                                                    {selected && <span className='grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--tt-ink)] text-white'><Check size={13} /></span>}
                                                </div>
                                                <p className='mt-2 min-h-12 text-xs leading-5 text-[var(--tt-ink-soft)]'>{service.description}</p>
                                                <div className='mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--tt-border)] pt-3 text-xs'>
                                                    <span className='font-semibold text-[var(--tt-ink)]'>₱{Number(service.price || 0).toLocaleString('en-PH')}</span>
                                                    <span className='inline-flex items-center gap-1.5 text-[var(--tt-muted)]'><Clock3 size={13} />about {service.durationMinutes} min</span>
                                                </div>
                                                {service.supportsAiPreview && <p className='mt-3 text-[10px] font-semibold uppercase tracking-[.12em] text-[var(--tt-gold)]'>Style preview available</p>}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            <div className='my-8 h-px bg-[var(--tt-border)]' />

                            <div>
                                <div className='flex flex-wrap items-end justify-between gap-3'>
                                    <h3 className='font-serif text-xl text-[var(--tt-ink)]'>Choose the pet</h3>
                                    <div className='inline-flex border border-[var(--tt-border)] bg-white p-1'>
                                        <button type='button' onClick={() => { setPetMode('existing'); const currentPet = pets.find((pet) => pet._id === selectedPetId) || pets[0]; resetForPetChange(currentPet) }} disabled={!pets.length} className={`min-h-9 px-3 text-xs font-semibold ${petMode === 'existing' ? 'bg-[var(--tt-ink)] text-white' : 'text-[var(--tt-muted)]'} disabled:opacity-40`}>Saved pets</button>
                                        <button type='button' onClick={() => { setPetMode('new'); resetForPetChange(newPet) }} className={`min-h-9 px-3 text-xs font-semibold ${petMode === 'new' ? 'bg-[var(--tt-ink)] text-white' : 'text-[var(--tt-muted)]'}`}>New pet</button>
                                    </div>
                                </div>

                                {petMode === 'existing' ? (
                                    <div className='mt-4 grid gap-3 sm:grid-cols-2'>
                                        {pets.map((pet) => {
                                            const petAge = pet.ageMonths !== undefined && pet.ageMonths !== '' ? Number(pet.ageMonths) : null
                                            const tooYoung = petAge !== null && petAge < 3
                                            const unvaccinated = pet.vaccinated === false || pet.vaccinated === 'no' || pet.vaccinated === 'false'
                                            const selected = selectedPetId === pet._id
                                            return (
                                                <button key={pet._id} type='button' onClick={() => { setSelectedPetId(pet._id); resetForPetChange(pet) }} aria-pressed={selected} className={`flex items-center gap-3 border p-4 text-left transition ${selected ? 'border-[var(--tt-ink)] bg-white' : 'border-[var(--tt-border)] bg-white/70 hover:border-[var(--tt-ink-soft)]'}`}>
                                                    <span className='grid h-14 w-14 shrink-0 place-items-center overflow-hidden bg-[var(--tt-canvas)]'>
                                                        {pet.photoUrl ? <img src={pet.photoUrl} alt={pet.name} className='h-full w-full object-cover' /> : <span className='font-serif text-xl'>{pet.name?.[0]?.toUpperCase()}</span>}
                                                    </span>
                                                    <span className='min-w-0 flex-1'>
                                                        <span className='block font-serif text-lg text-[var(--tt-ink)]'>{pet.name}</span>
                                                        <span className='mt-0.5 block text-xs text-[var(--tt-muted)]'>{pet.type === 'cat' ? 'Cat' : 'Dog'} · {pet.breed}{petAge !== null ? ` · ${petAge} mo` : ''}</span>
                                                        {(tooYoung || unvaccinated) && <span className='mt-2 block text-[10px] font-semibold text-[#9E3E3E]'>{tooYoung ? 'Minimum age is 3 months. ' : ''}{unvaccinated ? 'Vaccination required.' : ''}</span>}
                                                    </span>
                                                    {selected && <Check size={16} className='shrink-0' />}
                                                </button>
                                            )
                                        })}
                                        {!pets.length && <p className='text-sm text-[var(--tt-muted)]'>No saved pets yet. Choose “New pet” to continue.</p>}
                                    </div>
                                ) : (
                                    <div className='mt-4 grid gap-4 sm:grid-cols-2'>
                                        <Input label='Pet name' value={newPet.name} onChange={(value) => { setNewPet({ ...newPet, name: value }); resetForPetChange() }} />
                                        <label className='block'>
                                            <Label>Pet type</Label>
                                            <select value={newPet.type} onChange={(event) => { setNewPet({ ...newPet, type: event.target.value }); resetForPetChange() }} className='field-control h-11'>
                                                <option value='dog'>Dog</option>
                                                <option value='cat'>Cat</option>
                                            </select>
                                        </label>
                                        <BreedSelect
                                            petType={newPet.type}
                                            value={newPet.breed}
                                            onChange={(value) => { setNewPet({ ...newPet, breed: value }); resetForPetChange() }}
                                        />
                                        <Input label='Coat type (optional)' value={newPet.coatType} onChange={(value) => { setNewPet({ ...newPet, coatType: value }); resetForPetChange() }} placeholder='Long, short, curly, double coat' />
                                        <PetAgeInput
                                            variant='editorial'
                                            label='Age'
                                            value={newPet.ageMonths}
                                            onChange={(value) => { setNewPet({ ...newPet, ageMonths: value }); resetForPetChange() }}
                                        />
                                        <label className='block'>
                                            <Label>Vaccination status</Label>
                                            <select value={newPet.vaccinated} onChange={(event) => { setNewPet({ ...newPet, vaccinated: event.target.value }); resetForPetChange() }} className='field-control h-11'>
                                                <option value='yes'>Fully vaccinated</option>
                                                <option value='no'>Not fully vaccinated</option>
                                            </select>
                                        </label>
                                        <label className='block sm:col-span-2'>
                                            <Label>Pet notes (optional)</Label>
                                            <textarea value={newPet.notes} onChange={(event) => setNewPet({ ...newPet, notes: event.target.value })} rows={2} className='field-control min-h-20 py-2.5' placeholder='Handling preferences, coat or skin notes' />
                                        </label>
                                        <p className='text-[11px] text-[var(--tt-muted)] sm:col-span-2'>
                                            ✦ This companion will be automatically saved to your registered pets profile for future bookings.
                                        </p>
                                    </div>
                                )}

                                {isPetTooYoung && <InlineNotice tone='warning'>Pets must be at least 3 months old for grooming appointments.</InlineNotice>}
                                {!isPetTooYoung && isPetNotVaccinated && <InlineNotice tone='danger'>A current vaccination status is required before a grooming visit can be booked.</InlineNotice>}
                            </div>
                        </Section>
                    )}

                    {mobileStep === 2 && (
                        <Section id='booking-section-2' number='2' title='Style preview' icon={<WandSparkles size={18} />}>
                            <AiPreviewPanel
                                photoPreview={photoPreview}
                                onPhotoChange={handlePhoto}
                                generatedPreview={generatedPreview}
                                selectedStyle={selectedStyle}
                                selectedStyleName={selectedStyle?.name || ''}
                                onOpenStyleModal={() => setIsStyleModalOpen(true)}
                                previewFromCache={previewFromCache}
                                consent={consent}
                                onConsentChange={handleConsentChange}
                                verificationStatus={verificationStatus}
                                galleryGenerating={galleryGenerating}
                                galleryMessage={galleryMessage}
                                onRegenerateSelected={() => selectedStyleId && retryStylePreview(selectedStyleId)}
                            />
                        </Section>
                    )}

                    {mobileStep === 3 && (
                        <Section id='booking-section-3' number={currentStepIndex + 1} title='Date & time' icon={<CalendarDays size={18} />}>
                            <div className='grid gap-7 xl:grid-cols-[minmax(0,1fr)_minmax(320px,.85fr)]'>
                                <AvailabilityCalendar
                                    monthKey={monthKey}
                                    selectedDate={selectedDate}
                                    statuses={calendarStatuses}
                                    onMonthChange={(key) => { setMonthKey(key); setSelectedDate(''); setSelectedTime(''); setSlots([]); setUserDayAppointment(null) }}
                                    onSelect={(date) => {
                                        if (myBookedDateMap.has(date) || calendarStatuses[date] === 'user-booked') {
                                            const bookedAppt = myBookedDateMap.get(date)
                                            toast.error(`You already have an appointment on this day${bookedAppt ? ` (${bookedAppt.time} for ${bookedAppt.petName || 'your pet'})` : ''}. Please select a different day.`)
                                            return
                                        }
                                        setSelectedDate(date)
                                        setSelectedTime('')
                                        setSlots([])
                                        setUserDayAppointment(null)
                                    }}
                                    minDate={minDate}
                                    maxDate={maxDate}
                                    loading={calendarLoading}
                                />
                                <div>
                                    <h3 className='font-serif text-xl text-[var(--tt-ink)]'>{selectedDate ? formatDateLong(selectedDate) : 'Choose a date first'}</h3>
                                    <p className='mt-1 text-xs leading-5 text-[var(--tt-muted)]'>Available appointments are shown in two-hour salon windows.</p>
                                    <div className='mt-4'>
                                        {(userDayAppointment || (selectedDate && myBookedDateMap.has(selectedDate))) ? (
                                            <div className='rounded-sm border border-[#e8c4b8] bg-[#fdf2ee] p-5 text-xs text-[#8c3d20] shadow-xs'>
                                                <div className='flex items-center gap-2'>
                                                    <AlertCircle size={18} className='text-[#c97453] shrink-0' />
                                                    <p className='font-bold text-sm text-[#702a14]'>You already have an appointment on this day</p>
                                                </div>
                                                <p className='mt-2 leading-relaxed'>
                                                    Scheduled for <strong>{(userDayAppointment || myBookedDateMap.get(selectedDate))?.petName}</strong> ({(userDayAppointment || myBookedDateMap.get(selectedDate))?.service} at {(userDayAppointment || myBookedDateMap.get(selectedDate))?.time}).
                                                </p>
                                                <p className='mt-2.5 font-medium text-[11px] text-[#8c3d20]/90 border-t border-[#e8c4b8]/60 pt-2'>
                                                    Customers are limited to one appointment per day. Please select another date from the calendar.
                                                </p>
                                            </div>
                                        ) : (
                                            <TimeSlotGrid slots={slots} selectedTime={selectedTime} onSelect={setSelectedTime} loading={slotsLoading} />
                                        )}
                                    </div>
                                </div>
                            </div>

                            <label className='mt-7 block border-t border-[var(--tt-border)] pt-6'>
                                <Label>Notes for the groomer (optional)</Label>
                                <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} maxLength={500} placeholder='For example: skin sensitivity, handling notes, or a preferred length.' className='field-control min-h-24 py-3' />
                                <span className='mt-1 block text-right text-[10px] text-[var(--tt-muted)]'>{notes.length}/500</span>
                            </label>
                        </Section>
                    )}

                    {mobileStep === 4 && (
                        <Section id='booking-section-4' number={currentStepIndex + 1} title='Review your visit' icon={<Check size={18} />}>
                            <div className='grid gap-7 lg:grid-cols-[minmax(0,1fr)_320px]'>
                                <div className='border border-[var(--tt-border)] bg-white p-5 sm:p-6'>
                                    <SummaryRow label='Pet' value={activePet?.name || '—'} />
                                    <SummaryRow label='Breed' value={activePet?.breed || '—'} />
                                    <SummaryRow label='Service' value={selectedService?.name || '—'} />
                                    {aiEnabled && <SummaryRow label='Reference style' value={selectedStyle?.name || '—'} />}
                                    <SummaryRow label='Date' value={selectedDate ? formatDateLong(selectedDate) : '—'} />
                                    <SummaryRow label='Time' value={selectedSlot ? formatTimeRange(selectedSlot.startTime, selectedSlot.endTime) : '—'} />
                                    <div className='mt-4 flex items-end justify-between border-t border-[var(--tt-border)] pt-4'>
                                        <span className='text-sm font-semibold text-[var(--tt-ink)]'>Estimated total</span>
                                        <span className='font-serif text-3xl text-[var(--tt-ink)]'>₱{Number(selectedService?.price || 0).toLocaleString('en-PH')}</span>
                                    </div>
                                </div>

                                <div className='space-y-4'>
                                    {aiEnabled && generatedPreview && (
                                        <figure className='overflow-hidden border border-[var(--tt-border)] bg-white'>
                                            <div className='aspect-[4/3] bg-[var(--tt-canvas)]'><img src={generatedPreview} alt={`${selectedStyle?.name || 'Style'} preview`} className='h-full w-full object-contain' /></div>
                                            <figcaption className='border-t border-[var(--tt-border)] px-4 py-3 text-xs text-[var(--tt-muted)]'>{selectedStyle?.name} reference</figcaption>
                                        </figure>
                                    )}
                                    <div className='border border-[var(--tt-border)] bg-[var(--tt-canvas)] p-4 text-xs leading-5 text-[var(--tt-ink-soft)]'>
                                        Please arrive 5–10 minutes before the reserved time. If you expect to be late, contact the salon so the team can advise whether the appointment can still be accommodated.
                                    </div>
                                </div>
                            </div>
                        </Section>
                    )}

                    <div className='mt-8 flex items-center justify-between gap-3 border-t border-[var(--tt-border)] pt-6'>
                        <div>
                            {mobileStep !== 1 ? (
                                <button type='button' onClick={goToPreviousStep} className='inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[var(--tt-border)] bg-white px-4 text-xs font-medium text-[var(--tt-ink)] shadow-sm hover:bg-[var(--tt-canvas)] transition'>
                                    <ChevronLeft size={15} /> Back
                                </button>
                            ) : <div />}
                        </div>
                        {mobileStep === 4 ? (
                            <button type='button' onClick={submitBooking} disabled={submitting} className='inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[var(--tt-ink)] px-5 text-xs font-medium text-white shadow-sm transition hover:bg-[#514b42] disabled:opacity-45'>
                                {submitting ? 'Confirming…' : 'Confirm booking'}
                            </button>
                        ) : (
                            <button type='button' onClick={goToNextStep} className='inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-[var(--tt-ink)] px-5 text-xs font-medium text-white shadow-sm transition hover:bg-[#514b42]'>
                                {mobileStep === 3 ? 'Review booking' : 'Continue'} <ChevronRight size={15} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Floating AI Style Preview Button */}
            {aiEnabled && (
                <AiStyleFloatingButton
                    onClick={() => setIsStyleModalOpen(true)}
                    selectedStyleName={selectedStyle?.name}
                    hasPreview={Boolean(generatedPreview)}
                    generating={galleryGenerating}
                />
            )}

            {/* Responsive AI Style Preview Modal */}
            <AiStylePreviewModal
                isOpen={isStyleModalOpen}
                onClose={() => setIsStyleModalOpen(false)}
                pet={activePet}
                photoPreview={photoPreview}
                onPhotoChange={handlePhoto}
                consent={consent}
                onConsentChange={handleConsentChange}
                verificationStatus={verificationStatus}
                styles={compatibleStyles}
                recommendations={recommendations}
                stylePreviews={stylePreviews}
                selectedStyleId={selectedStyleId}
                onSelectStyle={(id) => {
                    selectStyle(id)
                    setIsStyleModalOpen(false)
                    toast.success('Style selected!')
                }}
                onGeneratePreview={retryStylePreview}
                generating={galleryGenerating}
                galleryMessage={galleryMessage}
            />
            </div>
        </div>
    )
}

function BookingProgress({ steps, currentIndex }) {
    const progress = ((currentIndex + 1) / steps.length) * 100

    return (
        <div className='mb-6'>
            <div className='flex items-end justify-between gap-4'>
                <div>
                    <p className='text-[10px] font-bold uppercase tracking-[.16em] text-[var(--tt-muted)]'>Step {currentIndex + 1} of {steps.length}</p>
                    <p className='mt-1 font-serif text-xl text-[var(--tt-ink)]'>{steps[currentIndex]?.label}</p>
                </div>
                <div className='hidden items-center gap-5 text-[11px] md:flex'>
                    {steps.map((step, index) => (
                        <span key={step.id} className={index === currentIndex ? 'font-semibold text-[var(--tt-ink)]' : index < currentIndex ? 'text-[var(--tt-ink-soft)]' : 'text-[var(--tt-muted)]'}>
                            {step.label}
                        </span>
                    ))}
                </div>
            </div>
            <div className='mt-3 h-px bg-[var(--tt-border)]'>
                <div className='h-px bg-[var(--tt-ink)] transition-all' style={{ width: `${progress}%` }} />
            </div>
        </div>
    )
}

function InlineNotice({ tone = 'warning', children }) {
    const danger = tone === 'danger'
    return (
        <div className={`mt-4 flex items-start gap-3 border p-3.5 text-xs leading-5 ${danger ? 'border-[#F0CCCC] bg-[#FBEAEA] text-[#7F3333]' : 'border-[#F0DEB6] bg-[#FFF4DC] text-[#6E4A0D]'}`}>
            <AlertTriangle size={15} className='mt-0.5 shrink-0' />
            <span>{children}</span>
        </div>
    )
}

function Section({ id, number, title, icon, disabled = false, children }) {
    return (
        <section id={id} className={`transition-opacity ${disabled ? 'pointer-events-none opacity-45' : ''}`}>
            <div className='mb-7 flex items-center gap-3'>
                <span className='grid h-8 w-8 shrink-0 place-items-center border border-[var(--tt-gold)] font-serif text-sm text-[var(--tt-gold)]'>{number}</span>
                <span className='text-[var(--tt-muted)]'>{icon}</span>
                <h2 className='font-serif text-2xl text-[var(--tt-ink)]'>{title}</h2>
            </div>
            {children}
        </section>
    )
}

function Label({ children }) {
    return <span className='mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--tt-ink-soft)]'>{children}</span>
}

function Input({ label, value, onChange, ...props }) {
    return <label className='block'><Label>{label}</Label><input value={value} onChange={(event) => onChange(event.target.value)} className='field-control h-11' {...props} /></label>
}

function SummaryRow({ label, value, strong = false }) {
    return (
        <div className='flex items-start justify-between gap-4 border-b border-[#E5EAE6] py-2.5 last:border-0'>
            <span className='text-xs font-medium text-[var(--tt-muted)]'>{label}</span>
            <span className={`text-right text-xs ${strong ? 'font-serif text-base font-bold text-[var(--tt-brand-strong)]' : 'font-bold text-[var(--tt-ink)]'}`}>{value}</span>
        </div>
    )
}
