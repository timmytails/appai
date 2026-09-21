/**
 * Service stage configurations mapped by serviceId for frontend.
 * Provides custom milestone stages, icons, and labels.
 */

export const SERVICE_STAGES = {
    'full-grooming': [
        { id: 'prep', label: 'Check-in & Coat Prep', shortLabel: 'Coat Prep', icon: 'Scissors' },
        { id: 'bath', label: 'Warm Bath & Shampoo', shortLabel: 'Bathing', icon: 'Droplets' },
        { id: 'blow_dry', label: 'Blow Drying & Brushing', shortLabel: 'Blowing', icon: 'Wind' },
        { id: 'haircut', label: 'Haircut & Styling', shortLabel: 'Trimming', icon: 'Sparkles' },
        { id: 'sanitary_nails', label: 'Nail Trim & Ear Cleaning', shortLabel: 'Nails & Ears', icon: 'HeartHandshake' },
        { id: 'ready', label: 'Finishing Touches & Ready for Pickup', shortLabel: 'Ready for Pickup', icon: 'CheckCircle2' }
    ],
    'basic-grooming': [
        { id: 'prep', label: 'Check-in & Coat Prep', shortLabel: 'Coat Prep', icon: 'Scissors' },
        { id: 'bath', label: 'Warm Bath & Shampoo', shortLabel: 'Bathing', icon: 'Droplets' },
        { id: 'blow_dry', label: 'Blow Drying & Brushing', shortLabel: 'Blowing', icon: 'Wind' },
        { id: 'sanitary_nails', label: 'Nail Trim & Ear Cleaning', shortLabel: 'Nails & Ears', icon: 'HeartHandshake' },
        { id: 'ready', label: 'Ready for Pickup', shortLabel: 'Ready for Pickup', icon: 'CheckCircle2' }
    ],
    'custom-styling': [
        { id: 'prep', label: 'Style Consultation & Prep', shortLabel: 'Prep', icon: 'Scissors' },
        { id: 'bath', label: 'Warm Bath & Conditioning', shortLabel: 'Bathing', icon: 'Droplets' },
        { id: 'blow_dry', label: 'Blow Drying & Fluffing', shortLabel: 'Blowing', icon: 'Wind' },
        { id: 'haircut', label: 'Custom Haircut & Detailing', shortLabel: 'Styling', icon: 'Sparkles' },
        { id: 'ready', label: 'Ready for Pickup', shortLabel: 'Ready for Pickup', icon: 'CheckCircle2' }
    ],
    'bath-blow-dry': [
        { id: 'prep', label: 'Check-in & Brushing', shortLabel: 'Brushing', icon: 'Scissors' },
        { id: 'bath', label: 'Deep Cleanse Shampoo & Condition', shortLabel: 'Bathing', icon: 'Droplets' },
        { id: 'blow_dry', label: 'Blow Drying & Deshedding', shortLabel: 'Blowing', icon: 'Wind' },
        { id: 'ready', label: 'Ready for Pickup', shortLabel: 'Ready for Pickup', icon: 'CheckCircle2' }
    ],
    'nail-trimming': [
        { id: 'prep', label: 'Paw Examination & Prep', shortLabel: 'Prep', icon: 'HeartHandshake' },
        { id: 'trim', label: 'Nail Clipping & Smooth Filing', shortLabel: 'Nail Trim', icon: 'Scissors' },
        { id: 'ready', label: 'Ready for Pickup', shortLabel: 'Ready for Pickup', icon: 'CheckCircle2' }
    ],
    'ear-cleaning': [
        { id: 'prep', label: 'External Ear Inspection', shortLabel: 'Prep', icon: 'HeartHandshake' },
        { id: 'clean', label: 'Gentle Cleansing & Drying', shortLabel: 'Ear Care', icon: 'Droplets' },
        { id: 'ready', label: 'Ready for Pickup', shortLabel: 'Ready for Pickup', icon: 'CheckCircle2' }
    ]
}

export const DEFAULT_STAGES = [
    { id: 'prep', label: 'Session Started & Prep', shortLabel: 'Prep', icon: 'Scissors' },
    { id: 'bath', label: 'Bathing & Washing', shortLabel: 'Bathing', icon: 'Droplets' },
    { id: 'blow_dry', label: 'Blow Drying', shortLabel: 'Blowing', icon: 'Wind' },
    { id: 'groom', label: 'Grooming & Trimming', shortLabel: 'Trimming', icon: 'Sparkles' },
    { id: 'ready', label: 'Ready for Pickup', shortLabel: 'Ready for Pickup', icon: 'CheckCircle2' }
]

export const getStagesForService = (serviceId) => {
    if (!serviceId) return DEFAULT_STAGES
    return SERVICE_STAGES[serviceId] || DEFAULT_STAGES
}

export const getStageProgress = (stages, currentStageKey) => {
    if (!stages || !stages.length) return { currentStep: 1, totalSteps: 1, percentage: 20 }
    const index = stages.findIndex((s) => s.id === currentStageKey)
    if (index === -1) {
        return { currentStep: 1, totalSteps: stages.length, percentage: Math.round((1 / stages.length) * 100) }
    }
    const currentStep = index + 1
    const totalSteps = stages.length
    const percentage = Math.round((currentStep / totalSteps) * 100)
    return { currentStep, totalSteps, percentage }
}
