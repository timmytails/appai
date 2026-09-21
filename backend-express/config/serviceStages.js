/**
 * Service stage configurations mapped by serviceId.
 * Provides custom milestone stages for each grooming service.
 */

const SERVICE_STAGES = {
    'full-grooming': [
        { id: 'prep', label: 'Check-in & Coat Prep', shortLabel: 'Coat Prep' },
        { id: 'bath', label: 'Warm Bath & Shampoo', shortLabel: 'Bathing' },
        { id: 'blow_dry', label: 'Blow Drying & Brushing', shortLabel: 'Blowing' },
        { id: 'haircut', label: 'Haircut & Styling', shortLabel: 'Trimming' },
        { id: 'sanitary_nails', label: 'Nail Trim & Ear Cleaning', shortLabel: 'Nails & Ears' },
        { id: 'ready', label: 'Finishing Touches & Ready for Pickup', shortLabel: 'Ready' }
    ],
    'basic-grooming': [
        { id: 'prep', label: 'Check-in & Coat Prep', shortLabel: 'Coat Prep' },
        { id: 'bath', label: 'Warm Bath & Shampoo', shortLabel: 'Bathing' },
        { id: 'blow_dry', label: 'Blow Drying & Brushing', shortLabel: 'Blowing' },
        { id: 'sanitary_nails', label: 'Nail Trim & Ear Cleaning', shortLabel: 'Nails & Ears' },
        { id: 'ready', label: 'Ready for Pickup', shortLabel: 'Ready' }
    ],
    'custom-styling': [
        { id: 'prep', label: 'Style Consultation & Prep', shortLabel: 'Prep' },
        { id: 'bath', label: 'Warm Bath & Conditioning', shortLabel: 'Bathing' },
        { id: 'blow_dry', label: 'Blow Drying & Fluffing', shortLabel: 'Blowing' },
        { id: 'haircut', label: 'Custom Haircut & Detailing', shortLabel: 'Styling' },
        { id: 'ready', label: 'Ready for Pickup', shortLabel: 'Ready' }
    ],
    'bath-blow-dry': [
        { id: 'prep', label: 'Check-in & Brushing', shortLabel: 'Brushing' },
        { id: 'bath', label: 'Deep Cleanse Shampoo & Condition', shortLabel: 'Bathing' },
        { id: 'blow_dry', label: 'Blow Drying & Deshedding', shortLabel: 'Blowing' },
        { id: 'ready', label: 'Ready for Pickup', shortLabel: 'Ready' }
    ],
    'nail-trimming': [
        { id: 'prep', label: 'Paw Examination & Prep', shortLabel: 'Prep' },
        { id: 'trim', label: 'Nail Clipping & Smooth Filing', shortLabel: 'Nail Trim' },
        { id: 'ready', label: 'Ready for Pickup', shortLabel: 'Ready' }
    ],
    'ear-cleaning': [
        { id: 'prep', label: 'External Ear Inspection', shortLabel: 'Prep' },
        { id: 'clean', label: 'Gentle Cleansing & Drying', shortLabel: 'Ear Care' },
        { id: 'ready', label: 'Ready for Pickup', shortLabel: 'Ready' }
    ]
}

const DEFAULT_STAGES = [
    { id: 'prep', label: 'Session Started & Prep', shortLabel: 'Prep' },
    { id: 'bath', label: 'Bathing & Washing', shortLabel: 'Bathing' },
    { id: 'blow_dry', label: 'Blow Drying', shortLabel: 'Blowing' },
    { id: 'groom', label: 'Grooming & Trimming', shortLabel: 'Trimming' },
    { id: 'ready', label: 'Ready for Pickup', shortLabel: 'Ready' }
]

const getStagesForService = (serviceId) => {
    if (!serviceId) return DEFAULT_STAGES
    return SERVICE_STAGES[serviceId] || DEFAULT_STAGES
}

const getDefaultFirstStage = (serviceId) => {
    const stages = getStagesForService(serviceId)
    return stages[0] || { id: 'prep', label: 'Service Started', shortLabel: 'Started' }
}

module.exports = {
    SERVICE_STAGES,
    DEFAULT_STAGES,
    getStagesForService,
    getDefaultFirstStage
}
