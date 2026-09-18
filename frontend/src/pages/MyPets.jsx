import { useEffect, useState } from 'react'
import { Camera, ChevronRight, Pencil, Plus, Trash2, Upload, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { getErrorMessage, petsApi } from '../utils/api'
import ConfirmModal from '../components/ConfirmModal'
import BreedSelect from '../components/BreedSelect'
import PetAgeInput from '../components/PetAgeInput'
import { Botanical } from '../components/editorial/Decorations'

const emptyPet = {
  name: '',
  type: 'dog',
  breed: '',
  coatType: '',
  notes: '',
  ageMonths: '',
  vaccinated: 'yes',
  photoUrl: ''
}

export default function MyPets() {
  const [pets, setPets] = useState([])
  const [form, setForm] = useState(emptyPet)
  const [editingId, setEditingId] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [confirmDeletePet, setConfirmDeletePet] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const loadPets = () => petsApi.getMine().then(({ data }) => setPets(data.pets || [])).finally(() => setLoading(false))
  useEffect(() => { loadPets() }, [])

  const openNew = () => {
    setEditingId('')
    setForm(emptyPet)
    setOpen(true)
  }

  const openEdit = (pet) => {
    setEditingId(pet._id)
    setForm({
      name: pet.name,
      type: pet.type,
      breed: pet.breed,
      coatType: pet.coatType || '',
      notes: pet.notes || '',
      ageMonths: pet.ageMonths !== undefined && pet.ageMonths !== null ? String(pet.ageMonths) : '',
      vaccinated: pet.vaccinated === false ? 'no' : 'yes',
      photoUrl: pet.photoUrl || ''
    })
    setOpen(true)
  }

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 8 * 1024 * 1024) {
      toast.error('Image must be under 8 MB')
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => setForm((current) => ({ ...current, photoUrl: reader.result }))
    reader.readAsDataURL(file)
  }

  const save = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      if (editingId) await petsApi.update(editingId, form)
      else await petsApi.create(form)
      toast.success(editingId ? 'Pet updated successfully' : 'Pet added successfully')
      setOpen(false)
      await loadPets()
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!confirmDeletePet) return
    setDeleting(true)
    try {
      await petsApi.remove(confirmDeletePet._id)
      setPets((current) => current.filter((pet) => pet._id !== confirmDeletePet._id))
      toast.success('Pet profile removed successfully')
      setConfirmDeletePet(null)
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className='relative min-h-screen overflow-hidden bg-[#fdf4ef] text-[#24211e] selection:bg-[#d1a85b]/20'>
      <style>{`
        /* Gallery Matting & Crosshair Styles */
        .gallery-card {
          position: relative;
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s ease, border-color 0.35s ease;
        }

        .gallery-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 45px rgba(71, 46, 31, 0.09);
          border-color: rgba(209, 168, 91, 0.7);
        }

        .gallery-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          border-radius: 12px 12px 0 0;
          background: linear-gradient(90deg, #cf7c54, #d1a85b);
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: 10;
        }

        .gallery-card:hover::before {
          opacity: 1;
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
          background: #d1a85b;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .gold-underline:hover::after {
          transform: scaleX(1);
        }

        /* Micro-Animations */
        @keyframes subtleLeafSway {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(4deg) scale(1.02); }
        }

        .group:hover .anim-botanical-sway {
          animation: subtleLeafSway 3s ease-in-out infinite;
          transform-origin: bottom center;
        }

        @keyframes pawGentlePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }

        .group:hover .anim-paw-pulse {
          animation: pawGentlePulse 2s ease-in-out infinite;
          transform-origin: center;
        }

        @keyframes catTailWave {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-5deg); }
        }

        .group:hover .anim-cat-tail {
          animation: catTailWave 2.4s ease-in-out infinite;
          transform-origin: 56px 74px;
        }

        @keyframes floatSlow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        .anim-float-bg {
          animation: floatSlow 7s ease-in-out infinite;
        }
      `}</style>

      {/* Decorative Background Lines & Botanicals */}
      <svg className='pointer-events-none absolute inset-0 z-0 h-full w-full' viewBox='0 0 1440 900' fill='none' preserveAspectRatio='none'>
        <path d='M-100,140 C300,220 600,40 980,160 C1250,240 1400,120 1600,180' stroke='#ecdcd0' strokeWidth='1.5' strokeDasharray='5 5' />
        <path d='M-50,400 C350,480 700,300 1080,440 C1300,520 1450,420 1650,460' stroke='#f2e2d7' strokeWidth='1.2' strokeDasharray='5 5' />
      </svg>
      <Botanical className='anim-float-bg pointer-events-none absolute -left-12 top-20 z-0 w-72 text-[#cf7c54] opacity-25' />
      <Botanical className='anim-float-bg pointer-events-none absolute -right-16 top-[550px] z-0 w-96 rotate-12 -scale-x-100 text-[#d1a85b] opacity-20' />

      <div className='relative z-10 mx-auto max-w-[1280px] px-4 py-8 sm:px-6 md:py-12 lg:px-8'>
        {/* Editorial Header */}
        <header className='relative border-b border-[rgba(210,143,119,0.4)] pb-10'>
          <div className='flex flex-col justify-between gap-8 md:flex-row md:items-end'>
            <div>
              <div className='flex items-center gap-2'>
                <span className='inline-block text-[10px] font-bold tracking-[2px] text-[#a47d44]'>
                  Your Pets
                </span>
                <span className='text-xs text-[#cf7c54]'>✦</span>
              </div>
              <h1 className='mt-3 font-serif text-[clamp(2.4rem,5.5vw,4.6rem)] font-medium leading-[1.02] tracking-[-0.03em] text-[#24211e]'>
                Your pets, <span className='italic'>all in one place</span>.
              </h1>
              <p className='mt-4 max-w-xl text-base leading-relaxed text-[#635b53]'>
                Add and manage your pets' details, breed info, coat type, and special grooming instructions.
              </p>
            </div>

            <div className='shrink-0'>
              <button
                type='button'
                onClick={openNew}
                className='group inline-flex min-h-[48px] items-center justify-center gap-2.5 rounded-lg bg-[#262626] px-6 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#3d3d3d] hover:shadow-lg active:scale-[0.99]'
              >
                <Plus size={15} className='text-[#d1a85b] transition-transform duration-300 group-hover:rotate-90' />
                Add a pet
              </button>
            </div>
          </div>
        </header>

        {/* Pet Profiles Section */}
        {loading ? (
          <div className='grid gap-6 py-12 sm:grid-cols-2 lg:grid-cols-3'>
            {[0, 1, 2].map((item) => (
              <div key={item} className='aspect-[4/5] animate-pulse rounded-xl bg-[#f2e4d8]' />
            ))}
          </div>
        ) : pets.length ? (
          <section className='grid gap-6 py-12 sm:grid-cols-2 lg:grid-cols-3 lg:py-16'>
            {pets.map((pet) => (
              <PetPortrait
                key={pet._id}
                pet={pet}
                onEdit={() => openEdit(pet)}
                onDelete={() => setConfirmDeletePet(pet)}
              />
            ))}
          </section>
        ) : (
          <section className='grid min-h-[460px] place-items-center py-16 text-center'>
            <div className='max-w-md rounded-2xl border border-[rgba(210,143,119,0.35)] bg-white/70 p-10 shadow-[0_12px_36px_rgba(71,46,31,0.05)] backdrop-blur-sm'>
              {/* Museum Mat Empty Plate */}
              <div className='relative mx-auto flex h-36 w-32 items-center justify-center rounded-lg border border-[rgba(210,143,119,0.35)] bg-[#fdf4ef] p-2'>
                <span className='pointer-events-none absolute left-1 top-1 font-serif text-[10px] text-[#cf7c54]/70'>+</span>
                <span className='pointer-events-none absolute right-1 bottom-1 font-serif text-[10px] text-[#cf7c54]/70'>+</span>
                <div className='flex h-full w-full items-center justify-center rounded bg-[#f7ebe1] shadow-inner'>
                  <DogPawBotanical className='h-20 w-20 text-[#cf7c54]' />
                </div>
              </div>
              <h2 className='mt-6 font-serif text-3xl font-medium text-[#24211e]'>Add your first pet</h2>
              <p className='mt-3 text-sm leading-relaxed text-[#635b53]'>
                Add your pet once so their breed, age, and grooming preferences are saved for future bookings.
              </p>
              <button
                type='button'
                onClick={openNew}
                className='gold-underline mt-6 inline-flex items-center gap-2 pb-1 text-xs font-semibold text-[#24211e]'
              >
                <Plus size={14} className='text-[#a47d44]' /> Add your first pet
              </button>
            </div>
          </section>
        )}
      </div>

      {/* EDIT / CREATE PET MODAL */}
      {open && (
        <div className='fixed inset-0 z-[70] flex items-end justify-center bg-[#1e1c1a]/60 p-0 backdrop-blur-[4px] sm:items-center sm:p-5'>
          <form
            onSubmit={save}
            className='max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-2xl border border-[rgba(210,143,119,0.4)] bg-[#fdf4ef] shadow-[0_30px_90px_rgba(40,26,18,0.25)] sm:rounded-2xl'
          >
            {/* Modal Header */}
            <div className='sticky top-0 z-10 flex items-center justify-between border-b border-[rgba(210,143,119,0.3)] bg-[#fdf4ef]/95 px-6 py-4 backdrop-blur sm:px-8'>
              <div>
                <span className='text-[9px] font-bold uppercase tracking-[2px] text-[#a47d44]'>
                  {editingId ? 'Edit Pet Profile' : 'New Pet'}
                </span>
                <h2 className='mt-0.5 font-serif text-2xl font-medium text-[#24211e]'>
                  {editingId ? `Update ${form.name || 'pet'}` : 'Add a new pet'}
                </h2>
              </div>
              <button
                type='button'
                onClick={() => setOpen(false)}
                className='grid h-9 w-9 place-items-center rounded-full border border-[rgba(210,143,119,0.4)] bg-white/80 text-[#635b53] transition-colors hover:bg-white hover:text-[#24211e]'
                aria-label='Close editor'
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className='grid gap-8 p-6 sm:p-8 lg:grid-cols-[230px_1fr]'>
              {/* Photo Area */}
              <div>
                <div className='relative aspect-[4/5] w-full overflow-hidden rounded-lg border border-[rgba(210,143,119,0.3)] bg-[#fbf5ee] p-2 shadow-inner'>
                  <span className='pointer-events-none absolute left-1.5 top-1.5 font-serif text-[10px] text-[#cf7c54]/70'>+</span>
                  <span className='pointer-events-none absolute right-1.5 bottom-1.5 font-serif text-[10px] text-[#cf7c54]/70'>+</span>
                  <div className='relative h-full w-full overflow-hidden rounded border border-[rgba(210,143,119,0.25)] bg-[#f7eee6] shadow-sm'>
                    {form.photoUrl ? (
                      <img src={form.photoUrl} alt='Preview' className='h-full w-full object-cover' />
                    ) : (
                      <div className='grid h-full place-items-center bg-gradient-to-b from-[#fbf1ea] to-[#f4e2d4] text-[#a47d44]'>
                        <Camera size={36} strokeWidth={1} />
                      </div>
                    )}
                  </div>
                </div>
                <label className='mt-4 inline-flex min-h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-[rgba(210,143,119,0.4)] bg-white px-4 text-xs font-semibold text-[#24211e] shadow-sm transition-all hover:border-[#a47d44] hover:bg-[#fbf5ee]'>
                  <Upload size={14} className='text-[#a47d44]' />
                  {form.photoUrl ? 'Change Photo' : 'Upload Photo'}
                  <input type='file' accept='image/*' onChange={handlePhotoChange} className='hidden' />
                </label>
                <p className='mt-2 text-center text-[10px] leading-relaxed text-[#82746b]'>
                  JPG, PNG or WEBP (Max 8MB)
                </p>
              </div>

              {/* Input Fields */}
              <div className='space-y-4'>
                <div className='grid gap-4 sm:grid-cols-2'>
                  <Field label='Pet Name' placeholder='e.g. Charlie' value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
                  <label className='block'>
                    <FieldLabel>Pet Type</FieldLabel>
                    <select
                      value={form.type}
                      onChange={(event) => setForm({ ...form, type: event.target.value, breed: '' })}
                      className='field-control h-11 w-full rounded-md border border-[rgba(210,143,119,0.4)] bg-white px-3 text-sm text-[#24211e] outline-none transition-colors focus:border-[#a47d44]'
                    >
                      <option value='dog'>Dog</option>
                      <option value='cat'>Cat</option>
                    </select>
                  </label>
                </div>

                <div className='grid gap-4 sm:grid-cols-2'>
                  <BreedSelect
                    variant='mypets'
                    petType={form.type}
                    value={form.breed}
                    onChange={(value) => setForm({ ...form, breed: value })}
                    required={true}
                  />
                  <Field label='Coat Type' placeholder='e.g. Double coat, Curly' value={form.coatType} onChange={(value) => setForm({ ...form, coatType: value })} required={false} />
                </div>

                <div className='grid gap-4 sm:grid-cols-2'>
                  <PetAgeInput
                    variant='mypets'
                    label='Age'
                    value={form.ageMonths}
                    onChange={(value) => setForm({ ...form, ageMonths: value })}
                    required={false}
                  />
                  <label className='block'>
                    <FieldLabel>Vaccination Status</FieldLabel>
                    <select
                      value={form.vaccinated}
                      onChange={(event) => setForm({ ...form, vaccinated: event.target.value })}
                      className='field-control h-11 w-full rounded-md border border-[rgba(210,143,119,0.4)] bg-white px-3 text-sm text-[#24211e] outline-none transition-colors focus:border-[#a47d44]'
                    >
                      <option value='yes'>Fully Vaccinated</option>
                      <option value='no'>Pending / Incomplete</option>
                    </select>
                  </label>
                </div>

                <label className='block'>
                  <FieldLabel>Special Care &amp; Grooming Notes</FieldLabel>
                  <textarea
                    value={form.notes}
                    placeholder='Sensitive skin, ear cleaning preferences, anxiety cues, or gentle handling instructions.'
                    onChange={(event) => setForm({ ...form, notes: event.target.value })}
                    rows={4}
                    className='field-control w-full rounded-md border border-[rgba(210,143,119,0.4)] bg-white p-3.5 text-sm leading-relaxed text-[#24211e] outline-none transition-colors focus:border-[#a47d44]'
                  />
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className='flex items-center justify-end gap-3 border-t border-[rgba(210,143,119,0.3)] bg-white/70 px-6 py-4 sm:px-8'>
              <button
                type='button'
                onClick={() => setOpen(false)}
                className='min-h-10 px-5 text-xs font-semibold text-[#82746b] transition-colors hover:text-[#24211e]'
              >
                Cancel
              </button>
              <button
                disabled={saving}
                className='min-h-10 rounded-md bg-[#262626] px-6 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#3d3d3d] disabled:opacity-50'
              >
                {saving ? 'Saving…' : 'Save pet'}
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(confirmDeletePet)}
        title='Remove Pet'
        description={confirmDeletePet ? `Are you sure you want to remove ${confirmDeletePet.name}?` : ''}
        confirmText='Remove Pet'
        cancelText='Keep Pet'
        variant='danger'
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setConfirmDeletePet(null)}
      />
    </div>
  )
}

/* ==========================================================
   ATELIER GALLERY PLATE TEMPLATE (NO ARCHES)
========================================================== */
function PetPortrait({ pet, onEdit, onDelete }) {
  const isCat = pet.type?.toLowerCase() === 'cat'

  return (
    <article className='gallery-card group relative rounded-xl border border-[rgba(210,143,119,0.35)] bg-white p-4 shadow-[0_4px_20px_rgba(40,26,18,0.03)]'>
      
      {/* Top Gold Gradient Reveal Line */}
      <div className='absolute inset-x-0 top-0 h-[2px] rounded-t-xl bg-gradient-to-r from-transparent via-[#d1a85b] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100' />

      {/* MUSEUM MATTING PHOTO CONTAINER */}
      <div className='relative aspect-[4/5] w-full overflow-hidden rounded-lg border border-[rgba(210,143,119,0.25)] bg-[#fdf4ef] p-2.5 shadow-inner'>
        
        {/* Atelier Registration Marks (Top-Left & Bottom-Right Crosshairs) */}
        <span className='pointer-events-none absolute left-1.5 top-1.5 font-serif text-[11px] leading-none text-[#cf7c54]/60 transition-transform duration-300 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#a47d44]'>+</span>
        <span className='pointer-events-none absolute right-1.5 bottom-1.5 font-serif text-[11px] leading-none text-[#cf7c54]/60 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:translate-y-0.5 group-hover:text-[#a47d44]'>+</span>

        {/* Inner Picture Canvas */}
        <div className='relative h-full w-full overflow-hidden rounded-md border border-[rgba(210,143,119,0.2)] bg-[#f7eee6] shadow-sm'>
          {pet.photoUrl ? (
            <img
              src={pet.photoUrl}
              alt={pet.name}
              className='h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]'
            />
          ) : (
            /* Blank Placeholder: Engraved Sanctuary Silhouette Plate */
            <div className='flex h-full flex-col items-center justify-center bg-gradient-to-b from-[#fbf1ea] to-[#f4e2d4] p-4 text-center'>
              <div className='transition-transform duration-500 group-hover:scale-105'>
                {isCat ? (
                  <FullBodyCatBotanical className='h-32 w-32 text-[#a47d44]' />
                ) : (
                  <DogPawBotanical className='h-32 w-32 text-[#cf7c54]' />
                )}
              </div>
              <p className='mt-2 font-serif text-[10px] font-bold uppercase tracking-widest text-[#82746b]'>
                {isCat ? 'Feline Registry' : 'Canine Registry'}
              </p>
            </div>
          )}

          {/* Luxury Wax-Seal Stamp (Dog Paw / Cat Silhouette) */}
          <div
            className='absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(210,143,119,0.5)] bg-[#fdf4ef]/95 shadow-[0_4px_12px_rgba(71,46,31,0.12)] backdrop-blur-sm transition-transform duration-300 group-hover:scale-110'
            title={isCat ? 'Cat' : 'Dog'}
          >
            {isCat ? (
              <CatIconMini className='h-5 w-5 text-[#a47d44]' />
            ) : (
              <DogPawIconMini className='h-4 w-4 text-[#cf7c54]' />
            )}
          </div>

          {/* Quick Action Floating Capsule Menu (Edit & Trash) */}
          <div className='absolute bottom-2.5 right-2.5 flex items-center gap-1.5 rounded-full border border-[rgba(210,143,119,0.3)] bg-white/95 p-1 shadow-md backdrop-blur-sm opacity-100 transition-all duration-300 sm:opacity-0 sm:translate-y-1 sm:group-hover:opacity-100 sm:group-hover:translate-y-0'>
            <button
              type='button'
              onClick={onEdit}
              className='grid h-7 w-7 place-items-center rounded-full text-[#635b53] transition-colors hover:bg-[#fdf4ef] hover:text-[#a47d44]'
              aria-label={`Edit ${pet.name}`}
            >
              <Pencil size={12} />
            </button>
            <div className='h-3 w-px bg-[rgba(210,143,119,0.3)]' />
            <button
              type='button'
              onClick={onDelete}
              className='grid h-7 w-7 place-items-center rounded-full text-[#934b4b] transition-colors hover:bg-[#fbefef]'
              aria-label={`Delete ${pet.name}`}
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* EDITORIAL METADATA SECTION */}
      <div className='mt-4 px-1'>
        <div className='flex items-baseline justify-between gap-2'>
          <div className='flex items-center gap-2'>
            <h2 className='font-serif text-2xl font-medium tracking-tight text-[#24211e] transition-colors duration-300 group-hover:text-[#a47d44]'>
              {pet.name}
            </h2>
            <span className='text-[10px] text-[#cf7c54] transition-transform duration-300 group-hover:rotate-45'>✦</span>
          </div>

          {pet.ageMonths !== undefined && pet.ageMonths !== null && pet.ageMonths !== '' && (
            <span className='rounded-full border border-[rgba(210,143,119,0.35)] bg-[#fdf4ef] px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[1.5px] text-[#a47d44]'>
              {formatAge(pet.ageMonths)}
            </span>
          )}
        </div>

        <p className='mt-1 text-xs text-[#82746b]'>
          <span className='font-medium text-[#24211e]'>{isCat ? 'Cat' : 'Dog'}</span>
          <span className='mx-1.5 opacity-40'>•</span>
          <span>{pet.breed || 'Registered Companion'}</span>
          {pet.coatType && <span className='italic opacity-80'> ({pet.coatType})</span>}
        </p>

        {/* Status Pills */}
        <div className='mt-3 flex items-center gap-2'>
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[1px] ${
            pet.vaccinated === false 
              ? 'border-[#e8c5c5] bg-[#fbefef] text-[#934b4b]' 
              : 'border-[#cdbd86] bg-[#fdf8eb] text-[#675728]'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${pet.vaccinated === false ? 'bg-[#934b4b]' : 'bg-[#675728]'}`} />
            {pet.vaccinated === false ? 'Vaccination Pending' : 'Fully Vaccinated'}
          </span>
        </div>

        {/* Note Excerpt */}
        {pet.notes && (
          <p className='mt-3 line-clamp-2 border-l-2 border-[rgba(210,143,119,0.4)] pl-2.5 text-xs italic leading-relaxed text-[#635b53]'>
            “{pet.notes}”
          </p>
        )}
      </div>
    </article>
  )
}

function formatAge(months) {
  const value = Number(months)
  if (!Number.isFinite(value)) return ''
  if (value < 12) return `${value} mo`
  const years = Math.floor(value / 12)
  const rest = value % 12
  return rest ? `${years}y ${rest}m` : `${years} yr${years === 1 ? '' : 's'}`
}

function FieldLabel({ children }) {
  return (
    <span className='mb-1.5 block text-[9px] font-bold uppercase tracking-[1.5px] text-[#a47d44]'>
      {children}
    </span>
  )
}

function Field({ label, value, onChange, placeholder, required = true, ...props }) {
  return (
    <label className='block'>
      <FieldLabel>{label}</FieldLabel>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className='field-control h-11 w-full rounded-md border border-[rgba(210,143,119,0.4)] bg-white px-3.5 text-sm text-[#24211e] outline-none transition-colors focus:border-[#a47d44]'
        {...props}
      />
    </label>
  )
}

/* ==========================================================
   BOTANICAL SPECIES EMBLEMS
========================================================== */
function DogPawBotanical({ className = 'w-24 h-24' }) {
  return (
    <svg viewBox='0 0 100 100' fill='none' className={className}>
      <g className='anim-botanical-sway'>
        <path d='M28 72C25 58 30 45 35 38M25 60C20 57 18 50 20 45M28 50C24 45 24 38 28 34' stroke='#cf7c54' strokeWidth='1.5' strokeLinecap='round' opacity='0.75' />
        <circle cx='18' cy='45' r='1.5' fill='#cf7c54' opacity='0.8' />
        <circle cx='28' cy='34' r='1.5' fill='#cf7c54' opacity='0.8' />
      </g>
      <g className='anim-botanical-sway'>
        <path d='M72 72C75 58 70 45 65 38M75 60C80 57 82 50 80 45M72 50C76 45 76 38 72 34' stroke='#cf7c54' strokeWidth='1.5' strokeLinecap='round' opacity='0.75' />
        <circle cx='82' cy='45' r='1.5' fill='#cf7c54' opacity='0.8' />
        <circle cx='72' cy='34' r='1.5' fill='#cf7c54' opacity='0.8' />
      </g>
      <path d='M35 78 C45 83 55 83 65 78' stroke='#d1a85b' strokeWidth='1.5' strokeLinecap='round' />
      <circle cx='50' cy='82' r='2' fill='#d1a85b' />
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

function FullBodyCatBotanical({ className = 'w-24 h-24' }) {
  return (
    <svg viewBox='0 0 100 100' fill='none' className={className}>
      <g className='anim-botanical-sway'>
        <path d='M20 78C35 76 65 76 80 78M28 77C24 72 23 66 26 62M72 77C76 72 77 66 74 62' stroke='#a47d44' strokeWidth='1.5' strokeLinecap='round' opacity='0.75' />
        <circle cx='25' cy='62' r='1.8' fill='#d1a85b' />
        <circle cx='75' cy='62' r='1.8' fill='#d1a85b' />
        <path d='M68 60C74 52 75 42 70 32M72 45C76 43 80 38 78 33' stroke='#a47d44' strokeWidth='1.4' strokeLinecap='round' opacity='0.65' />
        <circle cx='70' cy='32' r='1.5' fill='#cf7c54' />
      </g>
      <path
        d='M46 25C46 25 43 19 41 19C40 19 41 23 42 26C40 28 39 31 39 34C39 39 42 43 45 45C42 49 40 56 40 64C40 69 41 73 43 76C47 77 53 77 57 76C57 72 56 65 58 57C60 48 64 45 64 39C64 33 60 27 55 26C56 23 57 19 56 19C54 19 51 25 51 25C49 24 48 24 46 25Z'
        fill='#a47d44'
        opacity='0.88'
      />
      <path
        className='anim-cat-tail'
        d='M56 74C65 74 72 68 72 60C72 54 67 50 63 53C60 55 62 60 65 59C67 58 68 60 68 62C68 65 64 69 56 70'
        fill='#a47d44'
        opacity='0.88'
      />
    </svg>
  )
}

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