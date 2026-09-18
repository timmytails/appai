const express = require('express')
const rateLimit = require('express-rate-limit')
const { body, validationResult } = require('express-validator')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')

const User = require('../models/User')
const OtpRequest = require('../models/OtpRequest')
const { sendOtp } = require('../services/textbee')
const { sendWelcomeEmail, sendOtpEmail } = require('../services/mailer')
const { protect } = require('../middleware/auth')

const router = express.Router()

let googleJwksCache = { expiresAt: 0, keys: [] }

const decodeBase64Url = (value) => {
    const normalized = String(value).replace(/-/g, '+').replace(/_/g, '/')
    const padding = '='.repeat((4 - (normalized.length % 4)) % 4)
    return Buffer.from(normalized + padding, 'base64')
}

const getGoogleJwks = async () => {
    if (googleJwksCache.expiresAt > Date.now() && googleJwksCache.keys.length) {
        return googleJwksCache.keys
    }

    const response = await fetch('https://www.googleapis.com/oauth2/v3/certs')
    if (!response.ok) throw new Error('Unable to load Google signing keys')

    const data = await response.json()
    const cacheControl = response.headers.get('cache-control') || ''
    const maxAgeMatch = cacheControl.match(/max-age=(\d+)/)
    const maxAgeSeconds = maxAgeMatch ? Number(maxAgeMatch[1]) : 3600

    googleJwksCache = {
        keys: data.keys || [],
        expiresAt: Date.now() + maxAgeSeconds * 1000
    }

    return googleJwksCache.keys
}

const verifyGoogleCredential = async (credential) => {
    const rawExpectedId = process.env.GOOGLE_CLIENT_ID || ''
    const expectedClientId = rawExpectedId.trim().replace(/^["']|["']$/g, '')

    let payload = null

    // Attempt 1: Local JWKS cryptographic verification
    try {
        const parts = String(credential || '').split('.')
        if (parts.length === 3) {
            const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'))
            const parsedPayload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'))

            if (header.alg === 'RS256' && header.kid) {
                let keys = await getGoogleJwks()
                let jwk = keys.find((key) => key.kid === header.kid)

                // If not found in cache, force a fresh fetch once
                if (!jwk) {
                    googleJwksCache = { expiresAt: 0, keys: [] }
                    keys = await getGoogleJwks()
                    jwk = keys.find((key) => key.kid === header.kid)
                }

                if (jwk) {
                    const publicKey = crypto.createPublicKey({ key: jwk, format: 'jwk' })
                    const validSignature = crypto.verify(
                        'RSA-SHA256',
                        Buffer.from(`${parts[0]}.${parts[1]}`),
                        publicKey,
                        Buffer.from(parts[2], 'base64url')
                    )

                    const nowSeconds = Math.floor(Date.now() / 1000)
                    const validIssuer = [
                        'accounts.google.com',
                        'https://accounts.google.com'
                    ].includes(parsedPayload.iss)

                    if (validSignature && validIssuer && Number(parsedPayload.exp) > nowSeconds) {
                        payload = parsedPayload
                    }
                }
            }
        }
    } catch (jwkErr) {
        console.warn('Google JWKS verification failed, trying tokeninfo fallback:', jwkErr.message)
    }

    // Attempt 2: Fallback to Google's authoritative tokeninfo endpoint
    if (!payload) {
        try {
            const response = await fetch(
                `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
            )
            if (response.ok) {
                payload = await response.json()
            } else {
                const errText = await response.text()
                console.error('Google tokeninfo endpoint rejected token:', response.status, errText)
                throw new Error(`Google rejected the token (${response.status}): ${errText}`)
            }
        } catch (fetchErr) {
            console.error('Google tokeninfo fetch error:', fetchErr.message)
            throw new Error(`Google token validation error: ${fetchErr.message}`)
        }
    }

    if (!payload) {
        throw new Error('Google credential could not be verified')
    }

    // Verify audience matches expected Client ID
    const tokenAud = payload.aud
    const tokenAzp = payload.azp
    const matchesAud =
        !expectedClientId ||
        tokenAud === expectedClientId ||
        tokenAzp === expectedClientId ||
        (Array.isArray(tokenAud) && tokenAud.includes(expectedClientId))

    if (!matchesAud) {
        console.error('Google client ID mismatch:', {
            expected: expectedClientId,
            receivedAud: tokenAud,
            receivedAzp: tokenAzp
        })
        throw new Error(
            `Google Client ID mismatch. Configured: ${expectedClientId ? expectedClientId.slice(0, 15) + '...' : '(none)'}, received aud: ${tokenAud}`
        )
    }

    const isEmailVerified =
        payload.email_verified === true ||
        payload.email_verified === 'true' ||
        payload.email_verified === 1

    if (!isEmailVerified) {
        throw new Error('Google account email has not been verified by Google')
    }

    return {
        ...payload,
        email_verified: true
    }
}

const OTP_TTL_MS = 10 * 60 * 1000
const OTP_REQUEST_COOLDOWN_MS = 5 * 60 * 1000

const normalizePhone = (value) => {
    let digits = String(value || '').replace(/\D/g, '')
    if (digits.startsWith('63')) digits = digits.slice(2)
    if (digits.startsWith('0')) digits = digits.slice(1)
    if (!/^9\d{9}$/.test(digits)) return ''
    return `+63${digits}`
}

const normalizeEmail = (value) => {
    const email = String(value || '').trim().toLowerCase()
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : ''
}

const getPhoneCandidates = (value) => {
    const normalized = normalizePhone(value)
    if (!normalized) return []
    const local = normalized.slice(3)
    return [normalized, `0${local}`, local, `63${local}`]
}

const escapeRegex = (value) =>
    String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const buildAddress = (source = {}) => ({
    street: String(source.street || '').trim(),
    barangay: String(source.barangay || '').trim(),
    city: String(source.city || '').trim(),
    province: String(source.province || '').trim()
})

const formatAddress = (address = {}) =>
    [
        address.street,
        address.barangay ? `Brgy. ${address.barangay}` : '',
        address.city,
        address.province
    ]
        .map((value) => String(value || '').trim())
        .filter(Boolean)
        .join(', ')

const hasRequiredAddress = (address) =>
    Boolean(
        address.street &&
        address.barangay &&
        address.city &&
        address.province
    )

const otpRequestLimiter = rateLimit({
    windowMs: OTP_REQUEST_COOLDOWN_MS,
    max: 1,
    standardHeaders: true,
    legacyHeaders: false,
    skipFailedRequests: true,
    keyGenerator: (req) => {
        const key =
            normalizePhone(req.body?.phone) ||
            normalizeEmail(req.body?.identifier) ||
            String(req.body?.identifier || '').trim().toLowerCase() ||
            req.ip

        return `${req.path}:${key}`
    },
    handler: (req, res) => {
        const resetTime = req.rateLimit?.resetTime
        const retryAfter = resetTime instanceof Date
            ? Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000))
            : 300

        res.status(429).json({
            success: false,
            message:
                'An OTP was already requested. Please wait 5 minutes before requesting another code.',
            retryAfter
        })
    }
})

const generateToken = (id) =>
    jwt.sign(
        { id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    )

const validateRequest = (req, res) => {
    const errors = validationResult(req)
    if (errors.isEmpty()) return true

    res.status(400).json({
        success: false,
        errors: errors.array()
    })

    return false
}

const generateSixDigitOtp = () =>
    `${Math.floor(100000 + Math.random() * 900000)}`

const serializeUser = (user) => {
    const storedAddress = buildAddress(user.address || {})
    const hasStructuredAddress = Object.values(storedAddress).some(Boolean)
    const legacyAddress = String(user.homeAddress || '').trim()

    return {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email || '',
        phone: user.phone || '',
        address: hasStructuredAddress
            ? storedAddress
            : {
                ...storedAddress,
                street: legacyAddress
            },
        homeAddress:
            legacyAddress ||
            formatAddress(storedAddress),
        profileImage: user.profileImage || '',
        profileCompleted: Boolean(user.profileCompleted),
        authProvider: user.authProvider,
        role: user.role,
        accountStatus: user.accountStatus || 'active',
        statusReason: user.statusReason || '',
        warningMessage: user.warningMessage || '',
        statusUpdatedAt: user.statusUpdatedAt || user.createdAt
    }
}

const findUserByIdentifier = async (identifier, includePassword = false) => {
    const raw = String(identifier || '').trim()
    const email = normalizeEmail(raw)

    let query
    if (email) {
        query = {
            email: {
                $regex: new RegExp(`^${escapeRegex(email)}$`, 'i')
            }
        }
    } else {
        const phoneCandidates = getPhoneCandidates(raw)
        query = {
            phone: {
                $in: phoneCandidates.length
                    ? phoneCandidates
                    : [raw]
            }
        }
    }

    const request = User.findOne(query)
    return includePassword
        ? request.select('+password')
        : request
}

router.post(
    '/register/send-otp',
    [
        body('firstName').trim().notEmpty().withMessage('First name is required'),
        body('lastName').trim().notEmpty().withMessage('Last name is required'),
        body('email')
            .trim()
            .notEmpty()
            .withMessage('Email address is required')
            .isEmail()
            .withMessage('Enter a valid email address'),
        body('phone').trim().notEmpty().withMessage('Phone number is required'),
        body('password')
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters')
    ],
    otpRequestLimiter,
    async (req, res) => {
        if (!validateRequest(req, res)) return

        const phone = normalizePhone(req.body.phone)
        const email = normalizeEmail(req.body.email)
        const address = buildAddress(req.body.address)

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'A valid email address is required to receive your verification code'
            })
        }

        if (!phone) {
            return res.status(400).json({
                success: false,
                message: 'Enter a valid Philippine mobile number'
            })
        }

        if (!hasRequiredAddress(address)) {
            return res.status(400).json({
                success: false,
                message:
                    'Street, barangay, city, and province are required'
            })
        }

        try {
            const duplicateQuery = [
                { phone: { $in: getPhoneCandidates(phone) } },
                {
                    email: {
                        $regex: new RegExp(`^${escapeRegex(email)}$`, 'i')
                    }
                }
            ]

            const existingUser = await User.findOne({ $or: duplicateQuery })

            if (existingUser) {
                const message =
                    String(existingUser.email || '').toLowerCase() === email
                        ? 'Email address is already registered'
                        : 'Phone number is already registered'

                return res.status(400).json({
                    success: false,
                    message
                })
            }

            const code = generateSixDigitOtp()
            const otpHash = await bcrypt.hash(code, 10)

            await OtpRequest.findOneAndUpdate(
                { purpose: 'signup', email },
                {
                    purpose: 'signup',
                    email,
                    phone,
                    otpHash,
                    expiresAt: new Date(Date.now() + OTP_TTL_MS),
                    payload: {
                        firstName: req.body.firstName,
                        lastName: req.body.lastName,
                        phone,
                        email,
                        password: req.body.password,
                        address,
                        homeAddress: formatAddress(address)
                    }
                },
                {
                    upsert: true,
                    new: true,
                    setDefaultsOnInsert: true
                }
            )

            await sendOtpEmail({
                to: email,
                name: req.body.firstName,
                code,
                purpose: 'signup'
            })

            res.json({
                success: true,
                message: 'Verification code sent to your email address',
                email
            })
        } catch (error) {
            console.error('Send signup OTP error:', error)

            res.status(500).json({
                success: false,
                message: 'Failed to send verification code'
            })
        }
    }
)

router.post(
    '/register',
    [
        body('otp')
            .isLength({ min: 6, max: 6 })
            .withMessage('OTP must be 6 digits')
    ],
    async (req, res) => {
        if (!validateRequest(req, res)) return

        const email = normalizeEmail(req.body.email)
        const phone = normalizePhone(req.body.phone)

        if (!email && !phone) {
            return res.status(400).json({
                success: false,
                message: 'Email address or phone number is required'
            })
        }

        try {
            const query = { purpose: 'signup' }
            if (email) {
                query.email = email
            } else {
                query.phone = phone
            }

            let otpRequest = await OtpRequest.findOne(query)

            // Fallback lookup if not found by primary key
            if (!otpRequest && phone) {
                otpRequest = await OtpRequest.findOne({ purpose: 'signup', phone })
            }

            if (
                !otpRequest ||
                otpRequest.expiresAt.getTime() < Date.now()
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        'Verification code expired or not found. Request a new code.'
                })
            }

            const isMatch = await bcrypt.compare(
                String(req.body.otp),
                otpRequest.otpHash
            )

            if (!isMatch) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid verification code'
                })
            }

            const payload = otpRequest.payload || {}
            const registeredPhone = normalizePhone(payload.phone || phone)
            const registeredEmail = normalizeEmail(payload.email || email)

            const duplicateQuery = []
            if (registeredPhone) {
                duplicateQuery.push({ phone: { $in: getPhoneCandidates(registeredPhone) } })
            }
            if (registeredEmail) {
                duplicateQuery.push({
                    email: {
                        $regex: new RegExp(
                            `^${escapeRegex(registeredEmail)}$`,
                            'i'
                        )
                    }
                })
            }

            const existing = await User.findOne({ $or: duplicateQuery })

            if (existing) {
                await OtpRequest.deleteOne({ _id: otpRequest._id })

                return res.status(400).json({
                    success: false,
                    message: 'Phone number or email is already registered'
                })
            }

            const user = await User.create({
                firstName: payload.firstName,
                lastName: payload.lastName,
                phone,
                email: payload.email || undefined,
                password: payload.password,
                address: buildAddress(payload.address),
                homeAddress:
                    payload.homeAddress ||
                    formatAddress(payload.address),
                authProvider: 'phone',
                profileCompleted: true
            })

            await OtpRequest.deleteOne({ _id: otpRequest._id })

            if (user.email) {
                sendWelcomeEmail({
                    to: user.email,
                    name: user.firstName
                }).catch((emailErr) => {
                    console.error('Welcome email dispatch error:', emailErr.message)
                })
            }

            res.status(201).json({
                success: true,
                message: 'Account created successfully',
                token: generateToken(user._id),
                user: serializeUser(user)
            })
        } catch (error) {
            console.error('Register error:', error)

            res.status(500).json({
                success: false,
                message: 'Server error'
            })
        }
    }
)

router.post(
    '/google',
    [
        body('credential')
            .notEmpty()
            .withMessage('Google credential is required')
    ],
    async (req, res) => {
        if (!validateRequest(req, res)) return

        if (!process.env.GOOGLE_CLIENT_ID) {
            return res.status(503).json({
                success: false,
                message: 'Google sign-in is not configured'
            })
        }

        try {
            const payload = await verifyGoogleCredential(
                req.body.credential
            )

            if (
                !payload?.sub ||
                !payload?.email ||
                !payload.email_verified
            ) {
                return res.status(401).json({
                    success: false,
                    message: 'Google account could not be verified'
                })
            }

            const email = normalizeEmail(payload.email)

            let user = await User.findOne({
                $or: [
                    { googleId: payload.sub },
                    {
                        email: {
                            $regex: new RegExp(
                                `^${escapeRegex(email)}$`,
                                'i'
                            )
                        }
                    }
                ]
            }).select('+googleId +password')

            if (!user) {
                user = await User.create({
                    firstName: payload.given_name || 'Google',
                    lastName: payload.family_name || 'User',
                    email,
                    googleId: payload.sub,
                    profileImage: payload.picture || '',
                    authProvider: 'google',
                    profileCompleted: false
                })

                if (email) {
                    sendWelcomeEmail({
                        to: email,
                        name: user.firstName
                    }).catch((emailErr) => {
                        console.error('Google welcome email dispatch error:', emailErr.message)
                    })
                }
            } else {
                user = await User.findByIdAndUpdate(
                    user._id,
                    {
                        $set: {
                            googleId: payload.sub,
                            email,
                            profileImage: user.profileImage || payload.picture || '',
                            authProvider: user.authProvider === 'phone' ? 'phone' : 'google'
                        }
                    },
                    { new: true }
                )
            }

            // Re-read the persisted status so a newly banned account cannot authenticate.
            const freshUser = await User.findById(user._id).select('accountStatus statusReason')
            const isBanned = freshUser?.accountStatus === 'banned'
            const banReason = freshUser?.statusReason || ''

            if (isBanned) {
                return res.status(403).json({
                    success: false,
                    isBanned: true,
                    message: `Your customer account has been permanently suspended by salon administration. ${banReason ? `Reason: ${banReason}` : ''}`
                })
            }

            res.json({
                success: true,
                token: generateToken(user._id),
                user: serializeUser(user)
            })
        } catch (error) {
            console.error('Google sign-in error:', error)

            res.status(401).json({
                success: false,
                message: error.message || 'Google sign-in failed'
            })
        }
    }
)

router.post(
    '/login',
    [
        body('identifier')
            .trim()
            .notEmpty()
            .withMessage('Email or phone number is required'),
        body('password')
            .notEmpty()
            .withMessage('Password is required')
    ],
    async (req, res) => {
        if (!validateRequest(req, res)) return

        try {
            const user = await findUserByIdentifier(
                req.body.identifier,
                true
            )

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email, phone number, or password'
                })
            }

            if (user.authProvider === 'google' && !user.password) {
                return res.status(400).json({
                    success: false,
                    code: 'GOOGLE_AUTH_REQUIRED',
                    message: 'This account is linked with Google. Please click "Continue with Google" below to sign in, or use "Forgot password?" to set a password.'
                })
            }

            if (!(await user.matchPassword(req.body.password))) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email, phone number, or password'
                })
            }

            const freshUser = await User.findById(user._id).select('accountStatus statusReason')
            const isBanned = freshUser?.accountStatus === 'banned'
            const banReason = freshUser?.statusReason || ''

            if (isBanned) {
                return res.status(403).json({
                    success: false,
                    isBanned: true,
                    message: `Your customer account has been permanently suspended by salon administration. ${banReason ? `Reason: ${banReason}` : ''}`
                })
            }

            res.json({
                success: true,
                message: 'Login successful',
                token: generateToken(user._id),
                user: serializeUser(user)
            })
        } catch (error) {
            console.error('Login error:', error)

            res.status(500).json({
                success: false,
                message: 'Server error'
            })
        }
    }
)

router.get('/me', protect, async (req, res) => {
    res.json({
        success: true,
        user: serializeUser(req.user)
    })
})

router.post(
    '/complete-profile/send-otp',
    protect,
    otpRequestLimiter,
    async (req, res) => {
        if (req.user.profileCompleted) {
            return res.status(400).json({
                success: false,
                message: 'Profile is already complete. Use the Profile page to update your information.'
            })
        }

        if (!req.user.email) {
            return res.status(400).json({
                success: false,
                message: 'No registered email address found for this account'
            })
        }

        const phone = req.body.phone ? normalizePhone(req.body.phone) : null

        try {
            if (phone) {
                const duplicate = await User.findOne({
                    phone: { $in: getPhoneCandidates(phone) },
                    _id: { $ne: req.user._id }
                })

                if (duplicate) {
                    return res.status(400).json({
                        success: false,
                        message: 'Phone number is already in use'
                    })
                }
            }

            const code = generateSixDigitOtp()
            const otpHash = await bcrypt.hash(code, 10)

            await OtpRequest.findOneAndUpdate(
                {
                    purpose: 'complete_profile',
                    email: req.user.email,
                    'payload.userId': String(req.user._id)
                },
                {
                    purpose: 'complete_profile',
                    email: req.user.email,
                    phone: phone || undefined,
                    otpHash,
                    expiresAt: new Date(Date.now() + OTP_TTL_MS),
                    payload: {
                        userId: String(req.user._id),
                        phone: phone || undefined,
                        action: 'complete_profile'
                    }
                },
                {
                    upsert: true,
                    new: true,
                    setDefaultsOnInsert: true
                }
            )

            await sendOtpEmail({
                to: req.user.email,
                name: req.user.firstName,
                code,
                purpose: 'complete_profile'
            })

            res.json({
                success: true,
                message: `Verification code sent to ${req.user.email}`,
                email: req.user.email
            })
        } catch (error) {
            console.error('Complete profile OTP error:', error)

            res.status(500).json({
                success: false,
                message: 'Failed to send verification code'
            })
        }
    }
)

router.patch(
    '/complete-profile',
    protect,
    [
        body('firstName')
            .trim()
            .notEmpty()
            .withMessage('First name is required'),
        body('lastName')
            .trim()
            .notEmpty()
            .withMessage('Last name is required'),
        body('phone')
            .trim()
            .notEmpty()
            .withMessage('Phone number is required'),
        body('otp')
            .isLength({ min: 6, max: 6 })
            .withMessage('Enter the 6-digit verification code sent to your email')
    ],
    async (req, res) => {
        if (!validateRequest(req, res)) return

        if (req.user.profileCompleted) {
            return res.status(400).json({
                success: false,
                message: 'Profile is already complete. Use the Profile page to update your information.'
            })
        }

        const phone = normalizePhone(req.body.phone)
        const address = buildAddress(req.body.address)

        if (!phone) {
            return res.status(400).json({
                success: false,
                message:
                    'Enter a valid Philippine mobile number in +63 or 09 format'
            })
        }

        if (!hasRequiredAddress(address)) {
            return res.status(400).json({
                success: false,
                message:
                    'Street, barangay, city, and province are required'
            })
        }

        try {
            const duplicate = await User.findOne({
                phone: { $in: getPhoneCandidates(phone) },
                _id: { $ne: req.user._id }
            })

            if (duplicate) {
                return res.status(400).json({
                    success: false,
                    message: 'Phone number is already in use'
                })
            }

            let otpRequest = await OtpRequest.findOne({
                purpose: 'complete_profile',
                email: req.user.email,
                'payload.userId': String(req.user._id)
            })

            if (!otpRequest && phone) {
                otpRequest = await OtpRequest.findOne({
                    purpose: 'profile_phone',
                    phone,
                    'payload.userId': String(req.user._id),
                    'payload.action': 'complete_profile'
                })
            }

            if (
                !otpRequest ||
                otpRequest.expiresAt.getTime() < Date.now()
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        'Verification code expired or not found. Request a new code.'
                })
            }

            const validOtp = await bcrypt.compare(
                String(req.body.otp),
                otpRequest.otpHash
            )

            if (!validOtp) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid verification code'
                })
            }

            req.user.firstName = req.body.firstName.trim()
            req.user.lastName = req.body.lastName.trim()
            req.user.phone = phone
            req.user.address = address
            req.user.homeAddress = formatAddress(address)
            req.user.profileCompleted = true

            await req.user.save()
            await OtpRequest.deleteOne({ _id: otpRequest._id })

            res.json({
                success: true,
                message: 'Profile completed successfully',
                user: serializeUser(req.user)
            })
        } catch (error) {
            console.error('Complete profile error:', error)

            res.status(500).json({
                success: false,
                message: 'Failed to complete profile'
            })
        }
    }
)

router.post(
    '/me/phone/send-otp',
    protect,
    [
        body('phone')
            .trim()
            .notEmpty()
            .withMessage('Phone number is required')
    ],
    otpRequestLimiter,
    async (req, res) => {
        if (!validateRequest(req, res)) return

        const phone = normalizePhone(req.body.phone)

        if (!phone) {
            return res.status(400).json({
                success: false,
                message:
                    'Enter a valid Philippine mobile number in +63 or 09 format'
            })
        }

        try {
            const duplicate = await User.findOne({
                phone: { $in: getPhoneCandidates(phone) },
                _id: { $ne: req.user._id }
            })

            if (duplicate) {
                return res.status(400).json({
                    success: false,
                    message: 'Phone number is already in use'
                })
            }

            const code = generateSixDigitOtp()
            const otpHash = await bcrypt.hash(code, 10)

            await OtpRequest.findOneAndUpdate(
                {
                    purpose: 'profile_phone',
                    phone,
                    'payload.userId': String(req.user._id),
                    'payload.action': 'update_profile'
                },
                {
                    purpose: 'profile_phone',
                    phone,
                    email: req.user.email || undefined,
                    otpHash,
                    expiresAt: new Date(Date.now() + OTP_TTL_MS),
                    payload: {
                        userId: String(req.user._id),
                        action: 'update_profile'
                    }
                },
                {
                    upsert: true,
                    new: true,
                    setDefaultsOnInsert: true
                }
            )

            await sendOtp({
                phone,
                code,
                purpose: 'profile_phone'
            })

            res.json({
                success: true,
                message: 'Verification code sent to your mobile number',
                phone
            })
        } catch (error) {
            console.error('Profile phone OTP error:', error)

            res.status(500).json({
                success: false,
                message: 'Failed to send verification code'
            })
        }
    }
)

router.patch(
    '/me/profile',
    protect,
    [
        body('phone')
            .trim()
            .notEmpty()
            .withMessage('Phone number is required'),
        body('email')
            .optional({ checkFalsy: true })
            .isEmail()
            .withMessage('Enter a valid email address')
    ],
    async (req, res) => {
        if (!validateRequest(req, res)) return

        const phone = normalizePhone(req.body.phone)
        const address = buildAddress(req.body.address)
        const requestedEmail = normalizeEmail(req.body.email)

        if (!phone) {
            return res.status(400).json({
                success: false,
                message:
                    'Enter a valid Philippine mobile number in +63 or 09 format'
            })
        }

        if (!hasRequiredAddress(address)) {
            return res.status(400).json({
                success: false,
                message:
                    'Street, barangay, city, and province are required'
            })
        }

        try {
            const user = await User.findById(req.user._id)
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User account was not found'
                })
            }

            const currentPhone = normalizePhone(user.phone)
            const phoneChanged = currentPhone !== phone

            const duplicatePhone = await User.findOne({
                phone: { $in: getPhoneCandidates(phone) },
                _id: { $ne: user._id }
            })

            if (duplicatePhone) {
                return res.status(400).json({
                    success: false,
                    message: 'Phone number is already in use'
                })
            }

            let verifiedOtpRequest = null

            if (phoneChanged) {
                if (!/^\d{6}$/.test(String(req.body.phoneOtp || ''))) {
                    return res.status(400).json({
                        success: false,
                        message:
                            'Verify the new mobile number using the six-digit OTP'
                    })
                }

                verifiedOtpRequest = await OtpRequest.findOne({
                    purpose: 'profile_phone',
                    phone,
                    'payload.userId': String(user._id),
                    'payload.action': 'update_profile'
                })

                if (
                    !verifiedOtpRequest ||
                    verifiedOtpRequest.expiresAt.getTime() < Date.now()
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            'Verification code expired or not found. Request a new code.'
                    })
                }

                const validOtp = await bcrypt.compare(
                    String(req.body.phoneOtp),
                    verifiedOtpRequest.otpHash
                )

                if (!validOtp) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid verification code'
                    })
                }
            }

            if (user.authProvider !== 'google') {
                if (!requestedEmail) {
                    user.email = undefined
                } else {
                    const duplicateEmail = await User.findOne({
                        email: {
                            $regex: new RegExp(
                                `^${escapeRegex(requestedEmail)}$`,
                                'i'
                            )
                        },
                        _id: { $ne: user._id }
                    })

                    if (duplicateEmail) {
                        return res.status(400).json({
                            success: false,
                            message: 'Email address is already in use'
                        })
                    }

                    user.email = requestedEmail
                }
            }

            user.phone = phone
            user.address = address
            user.homeAddress = formatAddress(address)

            await user.save()

            if (verifiedOtpRequest) {
                await OtpRequest.deleteOne({
                    _id: verifiedOtpRequest._id
                })
            }

            res.json({
                success: true,
                message: 'Profile updated successfully',
                user: serializeUser(user)
            })
        } catch (error) {
            console.error('Update profile error:', error)

            res.status(500).json({
                success: false,
                message: 'Server error'
            })
        }
    }
)

// Kept for older frontend versions. Direct phone changes are blocked so
// mobile-number ownership cannot be bypassed without OTP verification.
router.patch('/me/phone', protect, (req, res) => {
    res.status(400).json({
        success: false,
        message:
            'Use the Profile page to verify and update your mobile number'
    })
})

router.post(
    '/password/send-otp',
    [
        body('identifier')
            .trim()
            .notEmpty()
            .withMessage('Enter your email address or phone number')
    ],
    otpRequestLimiter,
    async (req, res) => {
        if (!validateRequest(req, res)) return

        try {
            const user = await findUserByIdentifier(
                req.body.identifier,
                true
            )

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message:
                        'No account was found with that email address or phone number'
                })
            }

            const email = normalizeEmail(user.email)
            if (!email) {
                return res.status(400).json({
                    success: false,
                    message:
                        'This account has no registered email address for password recovery. Please contact salon support or sign in with Google.'
                })
            }

            const code = generateSixDigitOtp()

            await OtpRequest.findOneAndUpdate(
                {
                    purpose: 'reset_password',
                    email
                },
                {
                    purpose: 'reset_password',
                    email,
                    phone: user.phone ? normalizePhone(user.phone) : undefined,
                    otpHash: await bcrypt.hash(code, 10),
                    expiresAt: new Date(Date.now() + OTP_TTL_MS),
                    payload: {
                        userId: user._id.toString()
                    }
                },
                {
                    upsert: true,
                    new: true,
                    setDefaultsOnInsert: true
                }
            )

            await sendOtpEmail({
                to: email,
                name: user.firstName,
                code,
                purpose: 'reset_password'
            })

            const [localPart, domain] = email.split('@')
            const maskedEmail = localPart.length > 2
                ? `${localPart[0]}***${localPart.slice(-1)}@${domain}`
                : `${localPart[0]}*@${domain}`

            res.json({
                success: true,
                message:
                    `Verification code sent to your registered email address ${maskedEmail}`,
                email
            })
        } catch (error) {
            console.error('Password OTP error:', error)

            res.status(500).json({
                success: false,
                message: 'Failed to send verification code'
            })
        }
    }
)

router.post(
    '/password/reset',
    [
        body('identifier')
            .trim()
            .notEmpty()
            .withMessage('Email or phone number is required'),
        body('otp')
            .isLength({ min: 6, max: 6 })
            .withMessage('OTP must be 6 digits'),
        body('newPassword')
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters')
    ],
    async (req, res) => {
        if (!validateRequest(req, res)) return

        try {
            const user = await findUserByIdentifier(
                req.body.identifier,
                true
            )

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Account not found'
                })
            }

            const email = normalizeEmail(user.email)
            const phone = user.phone ? normalizePhone(user.phone) : null

            let request = null
            if (email) {
                request = await OtpRequest.findOne({
                    purpose: 'reset_password',
                    email
                })
            }

            if (!request && phone) {
                request = await OtpRequest.findOne({
                    purpose: 'reset_password',
                    phone
                })
            }

            if (
                !request ||
                request.expiresAt.getTime() < Date.now()
            ) {
                return res.status(400).json({
                    success: false,
                    message: 'Verification code expired or not found. Please request a new code.'
                })
            }

            const otpMatches = await bcrypt.compare(
                String(req.body.otp),
                request.otpHash
            )

            if (!otpMatches) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid verification code'
                })
            }

            user.password = req.body.newPassword
            await user.save()
            await OtpRequest.deleteOne({ _id: request._id })

            res.json({
                success: true,
                message: 'Password updated successfully'
            })
        } catch (error) {
            console.error('Password reset error:', error)

            res.status(500).json({
                success: false,
                message: 'Unable to reset password'
            })
        }
    }
)

module.exports = router
