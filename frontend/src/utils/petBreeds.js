/**
 * Pet Breeds Dataset
 * Curated list of popular dog and cat breeds in the Philippines for TimmyTails grooming sanctuary.
 */

export const POPULAR_DOG_BREEDS = [
    'Shih Tzu',
    'Pomeranian',
    'Toy Poodle',
    'Standard Poodle',
    'French Bulldog',
    'Golden Retriever',
    'Labrador Retriever',
    'Siberian Husky',
    'Pembroke Welsh Corgi',
    'Beagle',
    'Chihuahua',
    'Chow Chow',
    'Pug',
    'Maltese',
    'Yorkshire Terrier',
    'Dachshund',
    'German Shepherd',
    'Aspin (Asong Pinoy / Native)',
    'Bichon Frise',
    'Samoyed',
    'Alaskan Malamute',
    'Boxer',
    'Doberman Pinscher',
    'Great Dane',
    'Cocker Spaniel',
    'Miniature Pinscher',
    'Jack Russell Terrier',
    'Miniature Schnauzer',
    'Cavalier King Charles Spaniel',
    'Border Collie',
    'Belgian Malinois',
    'American Bully / Pitbull',
    'Japanese Spitz',
    'Pekingese',
    'Shiba Inu',
    'Boston Terrier',
    'Basset Hound',
    'Rottweiler',
    'Dalmatian',
    'Lhasa Apso',
    'Mixed Breed Dog',
    'Other Dog Breed'
]

export const POPULAR_CAT_BREEDS = [
    'Persian',
    'British Shorthair',
    'Puspin (Pusang Pinoy / Domestic Shorthair)',
    'Siamese',
    'Maine Coon',
    'Scottish Fold',
    'Ragdoll',
    'Bengal',
    'Sphynx',
    'Russian Blue',
    'American Shorthair',
    'Exotic Shorthair',
    'Birman',
    'Burmese',
    'Abyssinian',
    'Himalayan',
    'Turkish Angora',
    'Munchkin',
    'Norwegian Forest Cat',
    'Devon Rex',
    'Mixed Breed Cat',
    'Other Cat Breed'
]

/**
 * Get breed list according to selected pet type (alphabetically sorted A-Z)
 */
export function getBreedsForType(type = 'dog') {
    const normalized = String(type || '').toLowerCase()
    const baseList = normalized === 'cat' ? POPULAR_CAT_BREEDS : POPULAR_DOG_BREEDS
    const otherItems = baseList.filter((b) => b.startsWith('Other') || b.startsWith('Mixed'))
    const regularItems = baseList.filter((b) => !b.startsWith('Other') && !b.startsWith('Mixed'))
    return [...regularItems.slice().sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })), ...otherItems]
}
