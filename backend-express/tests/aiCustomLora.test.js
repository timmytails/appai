const test = require('node:test')
const assert = require('node:assert/strict')
const aiRouter = require('../routes/ai')

const { generateCustomLoraImage } = aiRouter._internal

test('generateCustomLoraImage throws when CUSTOM_LORA_INFERENCE_URL is missing', async () => {
    const originalUrl = process.env.CUSTOM_LORA_INFERENCE_URL
    delete process.env.CUSTOM_LORA_INFERENCE_URL

    try {
        await assert.rejects(
            () => generateCustomLoraImage({
                imageData: null,
                petType: 'dog',
                breed: 'Poodle',
                style: { id: 'teddy-bear-cut' }
            }),
            /Custom LoRA inference URL is not configured/i
        )
    } finally {
        if (originalUrl) {
            process.env.CUSTOM_LORA_INFERENCE_URL = originalUrl
        }
    }
})

test('generateCustomLoraImage sends correctly formatted GroomRequest payload to inference URL', async () => {
    const originalUrl = process.env.CUSTOM_LORA_INFERENCE_URL
    const originalFetch = global.fetch
    process.env.CUSTOM_LORA_INFERENCE_URL = 'https://mock-lora.example.com/generate'

    let capturedUrl = null
    let capturedBody = null
    let capturedHeaders = null

    global.fetch = async (url, options) => {
        capturedUrl = url
        capturedHeaders = options.headers
        capturedBody = JSON.parse(options.body)

        return {
            ok: true,
            status: 200,
            json: async () => ({
                success: true,
                style: 'teddy-bear-cut',
                image_base64: 'data:image/jpeg;base64,dGVzdGltYWdlZGF0YQ=='
            })
        }
    }

    try {
        const mockImageData = {
            mimeType: 'image/jpeg',
            base64: 'c291cmNlcGhvdG8='
        }

        const result = await generateCustomLoraImage({
            imageData: mockImageData,
            petType: 'dog',
            breed: 'Shih Tzu',
            style: { id: 'teddy-bear-cut', name: 'Teddy Bear Cut' }
        })

        assert.equal(capturedUrl, 'https://mock-lora.example.com/generate')
        assert.equal(capturedHeaders['Content-Type'], 'application/json')
        assert.equal(capturedBody.style, 'teddy-bear-cut')
        assert.equal(capturedBody.pet_type, 'dog')
        assert.equal(capturedBody.breed, 'Shih Tzu')
        assert.equal(capturedBody.pet_photo_base64, 'data:image/jpeg;base64,c291cmNlcGhvdG8=')
        assert.equal(typeof capturedBody.strength, 'number')
        assert.equal(typeof capturedBody.steps, 'number')
        assert.equal(typeof capturedBody.guidance, 'number')

        assert.equal(result.mimeType, 'image/jpeg')
        assert.equal(result.data, 'dGVzdGltYWdlZGF0YQ==')
        assert.equal(result.dataUrl, 'data:image/jpeg;base64,dGVzdGltYWdlZGF0YQ==')
    } finally {
        global.fetch = originalFetch
        if (originalUrl) {
            process.env.CUSTOM_LORA_INFERENCE_URL = originalUrl
        } else {
            delete process.env.CUSTOM_LORA_INFERENCE_URL
        }
    }
})

test('generateCustomLoraImage handles raw base64 string response gracefully', async () => {
    const originalUrl = process.env.CUSTOM_LORA_INFERENCE_URL
    const originalFetch = global.fetch
    process.env.CUSTOM_LORA_INFERENCE_URL = 'https://mock-lora.example.com/generate'

    global.fetch = async () => ({
        ok: true,
        status: 200,
        json: async () => ({
            success: true,
            style: 'puppy-cut',
            image_base64: 'cmF3YmFzZTY0ZGF0YQ=='
        })
    })

    try {
        const result = await generateCustomLoraImage({
            imageData: null,
            petType: 'cat',
            breed: 'Persian',
            style: { id: 'lion-cut' }
        })

        assert.equal(result.mimeType, 'image/jpeg')
        assert.equal(result.data, 'cmF3YmFzZTY0ZGF0YQ==')
        assert.equal(result.dataUrl, 'data:image/jpeg;base64,cmF3YmFzZTY0ZGF0YQ==')
    } finally {
        global.fetch = originalFetch
        if (originalUrl) {
            process.env.CUSTOM_LORA_INFERENCE_URL = originalUrl
        } else {
            delete process.env.CUSTOM_LORA_INFERENCE_URL
        }
    }
})
