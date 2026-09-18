const test = require('node:test')
const assert = require('node:assert/strict')
const Appointment = require('../models/Appointment')
const Pet = require('../models/Pet')

test('Appointment model accepts mixed petAgeMonths (numbers and 12+)', () => {
    const paths = Appointment.schema.paths
    assert.ok(paths.petAgeMonths, 'petAgeMonths must exist in Appointment schema')
    assert.equal(paths.petAgeMonths.instance, 'Mixed')

    // Verify model document creation does not throw CastError on '12+'
    const apptWithPlus = new Appointment({
        serviceId: 'basic-grooming',
        service: 'Basic Grooming',
        breed: 'Poodle',
        petName: 'Coco',
        date: '2026-09-10',
        time: '10:00',
        petAgeMonths: '12+',
        vaccinated: true
    })
    assert.equal(apptWithPlus.petAgeMonths, '12+')

    const apptWithNumber = new Appointment({
        serviceId: 'basic-grooming',
        service: 'Basic Grooming',
        breed: 'Poodle',
        petName: 'Coco',
        date: '2026-09-10',
        time: '10:00',
        petAgeMonths: 6,
        vaccinated: true
    })
    assert.equal(apptWithNumber.petAgeMonths, 6)
})

test('Pet model accepts mixed ageMonths (numbers and 12+) with default 12+', () => {
    const paths = Pet.schema.paths
    assert.ok(paths.ageMonths, 'ageMonths must exist in Pet schema')
    assert.equal(paths.ageMonths.instance, 'Mixed')

    const defaultPet = new Pet({
        name: 'Mochi',
        type: 'dog',
        breed: 'Shih Tzu'
    })
    assert.equal(defaultPet.ageMonths, '12+')

    const youngPet = new Pet({
        name: 'Puppy',
        type: 'dog',
        breed: 'Pug',
        ageMonths: 4
    })
    assert.equal(youngPet.ageMonths, 4)
})
