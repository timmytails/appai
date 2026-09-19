const nodemailer = require('nodemailer')

let transporterInstance = null

const cleanEnv = (val) => String(val || '').trim().replace(/^['"]|['"]$/g, '')

const getTransporter = () => {
    if (transporterInstance) return transporterInstance

    const host = cleanEnv(process.env.SMTP_HOST) || 'smtp.gmail.com'
    const port = Number(cleanEnv(process.env.SMTP_PORT)) || 587
    const user = cleanEnv(process.env.SMTP_USER) || 'timmytails.cs@gmail.com'
    const pass = cleanEnv(process.env.SMTP_PASS) || 'gmjtfadcyflmzljt'

    if (!user || !pass) {
        console.warn('[MAILER] SMTP credentials not configured (SMTP_USER, SMTP_PASS).')
        return null
    }

    const isGmail = host.includes('gmail.com') || host.includes('google')

    transporterInstance = nodemailer.createTransport({
        service: isGmail ? 'gmail' : undefined,
        host: isGmail ? undefined : host,
        port: isGmail ? undefined : port,
        secure: isGmail ? true : port === 465,
        pool: false, // Avoid hanging background sockets in serverless/cloud environments
        connectionTimeout: 6000,
        greetingTimeout: 6000,
        socketTimeout: 8000,
        auth: {
            user,
            pass
        }
    })

    return transporterInstance
}

const closeTransporter = () => {
    if (transporterInstance) {
        try {
            transporterInstance.close()
        } catch (_) {}
        transporterInstance = null
    }
}

const getSenderAddress = () => {
    let from = cleanEnv(process.env.SMTP_FROM)
    if (from.startsWith('"') && from.endsWith('"') && from.slice(1, -1).includes('"')) {
        from = from.slice(1, -1)
    }
    const user = cleanEnv(process.env.SMTP_USER) || 'timmytails.cs@gmail.com'
    return from || `"Timmy Tails Pet Grooming" <${user}>`
}

/**
 * Unified email sender:
 * 1. Brevo REST API (HTTPS port 443 - Recommended for Render Free Tier to bypass SMTP port blocking)
 * 2. Resend REST API (HTTPS port 443)
 * 3. Direct SMTP via Nodemailer (with fast timeout fallback)
 */
const sendMailViaHttpOrSmtp = async ({ to, name, subject, html, text }) => {
    if (!to) {
        console.warn('[MAILER] No recipient email address provided')
        return { delivered: false, skipped: true }
    }

    const brevoApiKey = cleanEnv(process.env.BREVO_API_KEY)
    const resendApiKey = cleanEnv(process.env.RESEND_API_KEY)

    // Strategy 1: Brevo REST API (HTTPS Port 443)
    if (brevoApiKey) {
        try {
            const senderUser = cleanEnv(process.env.SMTP_USER) || 'timmytails.cs@gmail.com'
            const response = await fetch('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'api-key': brevoApiKey
                },
                body: JSON.stringify({
                    sender: {
                        name: 'Timmy Tails Pet Grooming',
                        email: senderUser
                    },
                    to: [{ email: to, name: name || 'Valued Customer' }],
                    subject,
                    htmlContent: html,
                    textContent: text || undefined
                }),
                signal: AbortSignal.timeout(10000)
            })

            const data = await response.json().catch(() => ({}))
            if (response.ok) {
                console.log(`[MAILER] Email delivered to ${to} via Brevo API, messageId:`, data.messageId)
                return { delivered: true, messageId: data.messageId, provider: 'brevo' }
            } else {
                console.warn(`[MAILER] Brevo API rejected (${response.status}):`, data.message || JSON.stringify(data))
            }
        } catch (brevoErr) {
            console.warn('[MAILER] Brevo HTTPS request failed:', brevoErr.message)
        }
    }

    // Strategy 2: Resend REST API (HTTPS Port 443)
    if (resendApiKey) {
        try {
            const senderFrom = cleanEnv(process.env.SMTP_FROM) || 'Timmy Tails <onboarding@resend.dev>'
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${resendApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: senderFrom,
                    to: [to],
                    subject,
                    html,
                    text: text || undefined
                }),
                signal: AbortSignal.timeout(10000)
            })

            const data = await response.json().catch(() => ({}))
            if (response.ok) {
                console.log(`[MAILER] Email delivered to ${to} via Resend API, id:`, data.id)
                return { delivered: true, messageId: data.id, provider: 'resend' }
            } else {
                console.warn(`[MAILER] Resend API rejected (${response.status}):`, data.message || JSON.stringify(data))
            }
        } catch (resendErr) {
            console.warn('[MAILER] Resend HTTPS request failed:', resendErr.message)
        }
    }

    // Strategy 3: Direct SMTP via Nodemailer
    const transporter = getTransporter()
    if (!transporter) {
        console.log(`[DEV EMAIL] Sent to ${to} (${subject})`)
        return { delivered: false, skipped: true }
    }

    try {
        const info = await Promise.race([
            transporter.sendMail({
                from: getSenderAddress(),
                to,
                subject,
                text,
                html
            }),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('SMTP connection timed out after 6 seconds. (Render Free Tier blocks outbound SMTP ports 465/587. To send emails from Render, add BREVO_API_KEY to your Render environment variables.)')), 6000)
            )
        ])
        console.log(`[MAILER] Email delivered to ${to} via SMTP, messageId:`, info.messageId)
        return { delivered: true, messageId: info.messageId, provider: 'smtp' }
    } catch (error) {
        console.error(`[MAILER] Error sending email to ${to}:`, error.message || error)
        return { delivered: false, error: error.message || 'Email delivery failed' }
    }
}

/**
 * Send day-of appointment reminder email
 */
const sendAppointmentReminderTodayEmail = async ({ to, name, appointment }) => {
    if (!to) {
        console.warn('[MAILER] No recipient email provided for appointment reminder')
        return { delivered: false, skipped: true }
    }

    const clientName = name || appointment.ownerName || 'Valued Customer'
    const petName = appointment.petName || 'your pet'
    const petType = appointment.petType === 'cat' ? 'Cat' : 'Dog'
    const serviceName = appointment.service || 'Grooming Service'
    const haircutStyle = appointment.haircutStyle ? ` (${appointment.haircutStyle})` : ''
    const timeSlot = `${appointment.time} – ${appointment.endTime || ''}`
    const priceFormatted = Number(appointment.price || 0).toLocaleString('en-PH')

    const subject = `🐾 Reminder: Your grooming appointment for ${petName} is TODAY at ${appointment.time}`

    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Your Appointment is Today</title>
</head>
<body style="margin:0;padding:0;background-color:#F8F7F4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#261C14;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#F8F7F4;padding:30px 15px;">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" style="max-width:580px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);border:1px solid #E5D6C5;">
        <tr>
          <td style="background-color:#C25E2B;padding:28px 24px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:0.5px;">🐾 Timmy Tails Pet Grooming</h1>
            <p style="margin:6px 0 0 0;color:#FFE9DF;font-size:14px;font-weight:500;">Same-Day Appointment Reminder</p>
          </td>
        </tr>

        <tr>
          <td style="padding:32px 28px;">
            <p style="margin:0 0 16px 0;font-size:16px;line-height:1.5;color:#261C14;">
              Hello <strong>${clientName}</strong>,
            </p>
            <p style="margin:0 0 20px 0;font-size:15px;line-height:1.5;color:#4A3B32;">
              Today is the day! This is a friendly reminder that <strong>${petName}</strong> is scheduled for grooming today at Timmy Tails.
            </p>

            <div style="background-color:#FFF5F0;border:2px solid #E06D38;border-radius:12px;padding:18px 20px;margin:24px 0;">
              <p style="margin:0 0 8px 0;font-size:14px;font-weight:700;color:#B3471A;text-transform:uppercase;letter-spacing:0.5px;">
                ⚠️ Important Salon Policy Notice
              </p>
              <p style="margin:0;font-size:15px;font-weight:600;line-height:1.5;color:#93330C;">
                Please arrive 5–10 minutes before ${appointment.time} or the slot will be automatically cancelled and will open to others.
              </p>
            </div>

            <h3 style="margin:24px 0 12px 0;font-size:16px;color:#261C14;border-bottom:1px solid #F0E6DC;padding-bottom:8px;">
              📋 Appointment Details
            </h3>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="6" style="font-size:14px;color:#4A3B32;">
              <tr>
                <td style="width:38%;color:#8C7A6D;font-weight:600;">Pet Name:</td>
                <td style="color:#261C14;font-weight:700;">${petName} (${petType})</td>
              </tr>
              <tr>
                <td style="color:#8C7A6D;font-weight:600;">Breed:</td>
                <td style="color:#261C14;">${appointment.breed || 'N/A'}</td>
              </tr>
              <tr>
                <td style="color:#8C7A6D;font-weight:600;">Service:</td>
                <td style="color:#261C14;font-weight:600;">${serviceName}${haircutStyle}</td>
              </tr>
              <tr>
                <td style="color:#8C7A6D;font-weight:600;">Date:</td>
                <td style="color:#C25E2B;font-weight:700;">Today (${appointment.date})</td>
              </tr>
              <tr>
                <td style="color:#8C7A6D;font-weight:600;">Time Slot:</td>
                <td style="color:#C25E2B;font-weight:700;">${timeSlot}</td>
              </tr>
              <tr>
                <td style="color:#8C7A6D;font-weight:600;">Total Amount:</td>
                <td style="color:#261C14;font-weight:700;">₱${priceFormatted}</td>
              </tr>
            </table>

            <div style="margin-top:28px;padding:16px;background-color:#FAF7F2;border-radius:10px;font-size:13px;color:#68594E;line-height:1.5;">
              <p style="margin:0 0 6px 0;font-weight:700;color:#261C14;">📍 Salon Address &amp; Guidelines:</p>
              <p style="margin:0 0 6px 0;">Tangos, Baliuag City, Bulacan</p>
              <p style="margin:0;">Please bring your pet on a leash or inside a pet carrier, and ensure vaccinations are up to date.</p>
            </div>

            <p style="margin:28px 0 0 0;font-size:14px;line-height:1.5;color:#68594E;">
              We look forward to seeing you and ${petName} today! If you have questions, reply directly to this email or reach us at <a href="mailto:timmytails.cs@gmail.com" style="color:#C25E2B;text-decoration:none;font-weight:600;">timmytails.cs@gmail.com</a>.
            </p>
          </td>
        </tr>

        <tr>
          <td style="background-color:#FAF7F2;padding:20px 24px;text-align:center;font-size:12px;color:#8C7A6D;border-top:1px solid #E5D6C5;">
            <p style="margin:0 0 4px 0;">© ${new Date().getFullYear()} Timmy Tails Pet Grooming Salon. All rights reserved.</p>
            <p style="margin:0;">Tangos, Baliuag City, Bulacan, Philippines</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>
`

    const text = `
🐾 TIMMY TAILS PET GROOMING - APPOINTMENT TODAY REMINDER

Hello ${clientName},

Today is the day! This is a reminder that ${petName} is scheduled for grooming today at Timmy Tails.

⚠️ IMPORTANT NOTICE:
Please arrive 5-10 minutes before ${appointment.time} or the slot will be automatically cancelled and will open to others.

APPOINTMENT DETAILS:
- Pet: ${petName} (${petType} - ${appointment.breed || 'N/A'})
- Service: ${serviceName}${haircutStyle}
- Date: Today (${appointment.date})
- Time: ${timeSlot}
- Total Price: ₱${priceFormatted}

Salon Address: Tangos, Baliuag City, Bulacan

See you soon!
Timmy Tails Pet Grooming Team
timmytails.cs@gmail.com
`

    return sendMailViaHttpOrSmtp({
        to,
        name: clientName,
        subject,
        html,
        text
    })
}

/**
 * Send appointment confirmation email when a booking is placed
 */
const sendAppointmentConfirmedEmail = async ({ to, name, appointment, isToday = false }) => {
    if (!to) return { delivered: false, skipped: true }

    const clientName = name || appointment.ownerName || 'Valued Customer'
    const petName = appointment.petName || 'your pet'
    const petType = appointment.petType === 'cat' ? 'Cat' : 'Dog'
    const serviceName = appointment.service || 'Grooming Service'
    const haircutStyle = appointment.haircutStyle ? ` (${appointment.haircutStyle})` : ''
    const timeSlot = `${appointment.time} – ${appointment.endTime || ''}`
    const priceFormatted = Number(appointment.price || 0).toLocaleString('en-PH')

    const subject = isToday
        ? `🐾 Booking Confirmed: Your appointment for ${petName} is TODAY at ${appointment.time}`
        : `🐾 Booking Confirmed: Grooming appointment for ${petName} on ${appointment.date}`

    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Booking Confirmed</title>
</head>
<body style="margin:0;padding:0;background-color:#F8F7F4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#261C14;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#F8F7F4;padding:30px 15px;">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" style="max-width:580px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);border:1px solid #E5D6C5;">
        <tr>
          <td style="background-color:#2B4C3F;padding:28px 24px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">🐾 Timmy Tails Pet Grooming</h1>
            <p style="margin:6px 0 0 0;color:#D8E5DF;font-size:14px;">Appointment Booking Confirmation</p>
          </td>
        </tr>

        <tr>
          <td style="padding:32px 28px;">
            <p style="margin:0 0 16px 0;font-size:16px;line-height:1.5;color:#261C14;">
              Hello <strong>${clientName}</strong>,
            </p>
            <p style="margin:0 0 20px 0;font-size:15px;line-height:1.5;color:#4A3B32;">
              Thank you for choosing Timmy Tails! Your grooming appointment for <strong>${petName}</strong> has been successfully booked.
            </p>

            ${isToday ? `
            <div style="background-color:#FFF5F0;border:2px solid #E06D38;border-radius:12px;padding:18px 20px;margin:24px 0;">
              <p style="margin:0 0 8px 0;font-size:14px;font-weight:700;color:#B3471A;text-transform:uppercase;">
                ⚠️ Note for Today's Appointment
              </p>
              <p style="margin:0;font-size:15px;font-weight:600;line-height:1.5;color:#93330C;">
                Please arrive 5–10 minutes before ${appointment.time} or the slot will be automatically cancelled and will open to others.
              </p>
            </div>
            ` : `
            <div style="background-color:#F5FAF7;border:1px solid #A3D4BE;border-radius:12px;padding:16px 20px;margin:20px 0;">
              <p style="margin:0;font-size:14px;line-height:1.5;color:#1B4332;">
                <strong>Friendly Note:</strong> We will send you an appointment reminder on the day of your booking. Please arrive 5–10 minutes before ${appointment.time} to keep your reserved slot.
              </p>
            </div>
            `}

            <h3 style="margin:24px 0 12px 0;font-size:16px;color:#261C14;border-bottom:1px solid #F0E6DC;padding-bottom:8px;">
              📋 Booking Summary
            </h3>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="6" style="font-size:14px;color:#4A3B32;">
              <tr>
                <td style="width:38%;color:#8C7A6D;font-weight:600;">Pet Name:</td>
                <td style="color:#261C14;font-weight:700;">${petName} (${petType})</td>
              </tr>
              <tr>
                <td style="color:#8C7A6D;font-weight:600;">Breed:</td>
                <td style="color:#261C14;">${appointment.breed || 'N/A'}</td>
              </tr>
              <tr>
                <td style="color:#8C7A6D;font-weight:600;">Service:</td>
                <td style="color:#261C14;font-weight:600;">${serviceName}${haircutStyle}</td>
              </tr>
              <tr>
                <td style="color:#8C7A6D;font-weight:600;">Date:</td>
                <td style="color:#261C14;font-weight:700;">${appointment.date} ${isToday ? '(Today)' : ''}</td>
              </tr>
              <tr>
                <td style="color:#8C7A6D;font-weight:600;">Time Slot:</td>
                <td style="color:#261C14;font-weight:700;">${timeSlot}</td>
              </tr>
              <tr>
                <td style="color:#8C7A6D;font-weight:600;">Total Amount:</td>
                <td style="color:#261C14;font-weight:700;">₱${priceFormatted}</td>
              </tr>
            </table>

            <div style="margin-top:28px;padding:16px;background-color:#FAF7F2;border-radius:10px;font-size:13px;color:#68594E;line-height:1.5;">
              <p style="margin:0 0 6px 0;font-weight:700;color:#261C14;">📍 Salon Address:</p>
              <p style="margin:0;">Tangos, Baliuag City, Bulacan, Philippines</p>
            </div>
          </td>
        </tr>

        <tr>
          <td style="background-color:#FAF7F2;padding:20px 24px;text-align:center;font-size:12px;color:#8C7A6D;border-top:1px solid #E5D6C5;">
            <p style="margin:0 0 4px 0;">© ${new Date().getFullYear()} Timmy Tails Pet Grooming Salon. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>
`

    return sendMailViaHttpOrSmtp({
        to,
        name: clientName,
        subject,
        html
    })
}

/**
 * Send one-time password (OTP) verification email
 */
const sendOtpEmail = async ({ to, name, code, purpose }) => {
    if (!to) {
        console.warn('[MAILER] No recipient email provided for OTP email')
        return { delivered: false, skipped: true }
    }

    let subject = `🐾 Your TimmyTails Verification Code: ${code}`
    let title = 'Verification Code'
    let description = 'Use the 6-digit code below to complete your registration with TimmyTails Pet Grooming Salon.'

    if (purpose === 'reset_password') {
        subject = `🔐 Your TimmyTails Password Reset Code: ${code}`
        title = 'Password Reset Code'
        description = 'We received a request to reset your TimmyTails account password. Use the verification code below to set a new password.'
    } else if (purpose === 'complete_profile') {
        subject = `🐾 Complete Your TimmyTails Profile: ${code}`
        title = 'Profile Verification Code'
        description = 'Use the verification code below to verify your email and complete your TimmyTails customer profile.'
    }

    const recipientName = name || 'Valued Customer'

    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#F8F7F4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#261C14;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#F8F7F4;padding:30px 15px;">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" style="max-width:540px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);border:1px solid #E5D6C5;">
        <tr>
          <td style="background-color:#33332F;padding:26px 24px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.5px;">🐾 TimmyTails</h1>
            <p style="margin:6px 0 0 0;color:#E1DAD4;font-size:13px;font-weight:500;">Pet Grooming Salon</p>
          </td>
        </tr>

        <tr>
          <td style="padding:32px 28px;">
            <p style="margin:0 0 16px 0;font-size:15px;line-height:1.5;color:#261C14;">
              Hello <strong>${recipientName}</strong>,
            </p>
            <p style="margin:0 0 24px 0;font-size:14px;line-height:1.6;color:#514C46;">
              ${description}
            </p>

            <div style="text-align:center;margin:28px 0;padding:20px;background-color:#FAF7F3;border:1px dashed #BBA153;border-radius:12px;">
              <p style="margin:0 0 8px 0;font-size:11px;font-weight:700;letter-spacing:1.5px;color:#8A763A;text-transform:uppercase;">
                Verification Code
              </p>
              <span style="display:inline-block;font-size:36px;font-weight:800;letter-spacing:8px;color:#33332F;font-family:monospace;">
                ${code}
              </span>
              <p style="margin:10px 0 0 0;font-size:12px;color:#786E65;">
                Valid for <strong>10 minutes</strong>. Do not share this code with anyone.
              </p>
            </div>

            <p style="margin:20px 0 0 0;font-size:12px;line-height:1.5;color:#8A8075;">
              If you didn't request this verification code, please ignore this email or reach out to our team if you have concerns.
            </p>
          </td>
        </tr>

        <tr>
          <td style="background-color:#FAF7F3;padding:18px 24px;text-align:center;font-size:12px;color:#8A8075;border-top:1px solid #E1DAD4;">
            <p style="margin:0 0 4px 0;">© ${new Date().getFullYear()} TimmyTails Pet Grooming Salon</p>
            <p style="margin:0;font-size:11px;">Baliuag City, Bulacan, Philippines</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>
`

    return sendMailViaHttpOrSmtp({
        to,
        name: recipientName,
        subject,
        html,
        text: `Your TimmyTails verification code is: ${code}. Valid for 10 minutes.`
    })
}

/**
 * Send welcome email when an account is created
 */
const sendWelcomeEmail = async ({ to, name }) => {
    if (!to) return { delivered: false, skipped: true }

    const clientName = name || 'Valued Customer'
    const subject = `🐾 Welcome to TimmyTails Pet Grooming Salon, ${clientName}!`

    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Welcome to TimmyTails</title>
</head>
<body style="margin:0;padding:0;background-color:#F8F7F4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#261C14;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#F8F7F4;padding:30px 15px;">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);border:1px solid #E5D6C5;">
        <tr>
          <td style="background-color:#2B4C3F;padding:32px 24px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:0.5px;">🐾 Welcome to TimmyTails</h1>
            <p style="margin:6px 0 0 0;color:#D8E5DF;font-size:14px;font-weight:500;">Premium AI-Assisted Pet Grooming Salon</p>
          </td>
        </tr>

        <tr>
          <td style="padding:32px 28px;">
            <p style="margin:0 0 16px 0;font-size:16px;line-height:1.5;color:#261C14;">
              Hello <strong>${clientName}</strong>,
            </p>
            <p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:#4A3B32;">
              Thank you for registering an account with TimmyTails! We are dedicated to providing the most caring, hygienic, and stress-free grooming experience for your dogs and cats.
            </p>

            <div style="background-color:#FAF7F2;border:1px solid #E5D6C5;border-radius:12px;padding:20px;margin:24px 0;">
              <h3 style="margin:0 0 12px 0;font-size:15px;color:#261C14;">✨ What you can do with your account:</h3>
              <ul style="margin:0;padding-left:20px;color:#4A3B32;font-size:14px;line-height:1.7;">
                <li>Book grooming appointments easily online</li>
                <li>Preview AI hairstyle simulations for your pet</li>
                <li>Track your pet's appointment history and updates</li>
                <li>Receive automatic appointment reminders</li>
              </ul>
            </div>

            <p style="margin:0 0 8px 0;font-size:14px;font-weight:600;color:#261C14;">📍 Visit Us:</p>
            <p style="margin:0 0 24px 0;font-size:14px;color:#68594E;line-height:1.5;">
              Tangos, Baliuag City, Bulacan, Philippines<br>
              Open Daily: 9:00 AM – 6:00 PM
            </p>

            <p style="margin:0;font-size:14px;line-height:1.5;color:#68594E;">
              Have questions? Simply reply to this email or reach us at <a href="mailto:timmytails.cs@gmail.com" style="color:#2B4C3F;font-weight:600;text-decoration:none;">timmytails.cs@gmail.com</a>.
            </p>
          </td>
        </tr>

        <tr>
          <td style="background-color:#FAF7F2;padding:18px 24px;text-align:center;font-size:12px;color:#8C7A6D;border-top:1px solid #E5D6C5;">
            <p style="margin:0 0 4px 0;">© ${new Date().getFullYear()} TimmyTails Pet Grooming Salon</p>
            <p style="margin:0;font-size:11px;">Baliuag City, Bulacan, Philippines</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>
`

    return sendMailViaHttpOrSmtp({
        to,
        name: clientName,
        subject,
        html,
        text: `Welcome to TimmyTails Pet Grooming, ${clientName}! Visit us in Baliuag City, Bulacan or book online.`
    })
}

/**
 * Send cancellation email
 */
const sendAppointmentCancelledEmail = async ({ to, name, appointment, reason }) => {
    if (!to) return { delivered: false, skipped: true }

    const clientName = name || appointment.ownerName || 'Valued Customer'
    const petName = appointment.petName || 'your pet'
    const subject = `🐾 Appointment Cancelled: ${petName}'s grooming on ${appointment.date}`

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Appointment Cancelled</title></head>
<body style="margin:0;padding:0;background-color:#F8F7F4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#261C14;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#F8F7F4;padding:30px 15px;">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);border:1px solid #E5D6C5;">
        <tr>
          <td style="background-color:#B3471A;padding:26px 24px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">🐾 Timmy Tails Pet Grooming</h1>
            <p style="margin:6px 0 0 0;color:#FFE9DF;font-size:13px;">Appointment Cancellation Notice</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 24px;">
            <p style="margin:0 0 16px 0;font-size:15px;color:#261C14;">Hello <strong>${clientName}</strong>,</p>
            <p style="margin:0 0 16px 0;font-size:14px;color:#4A3B32;line-height:1.6;">
              Your grooming appointment for <strong>${petName}</strong> on <strong>${appointment.date} at ${appointment.time}</strong> has been cancelled.
            </p>
            ${reason ? `
            <div style="background-color:#FFF5F0;border-left:4px solid #B3471A;padding:14px 16px;margin:20px 0;border-radius:6px;">
              <p style="margin:0;font-size:14px;color:#93330C;"><strong>Reason:</strong> ${reason}</p>
            </div>
            ` : ''}
            <p style="margin:20px 0 0 0;font-size:14px;color:#4A3B32;line-height:1.6;">
              If you wish to reschedule or have any questions, you can book a new slot anytime on our website or reply directly to this email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background-color:#FAF7F2;padding:16px 24px;text-align:center;font-size:12px;color:#8C7A6D;border-top:1px solid #E5D6C5;">
            <p style="margin:0;">© ${new Date().getFullYear()} Timmy Tails Pet Grooming Salon • Baliuag City, Bulacan</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>
`

    return sendMailViaHttpOrSmtp({
        to,
        name: clientName,
        subject,
        html,
        text: `Your grooming appointment for ${petName} on ${appointment.date} at ${appointment.time} has been cancelled. ${reason ? `Reason: ${reason}` : ''}`
    })
}

/**
 * Send rescheduled appointment email
 */
const sendAppointmentRescheduledEmail = async ({ to, name, appointment }) => {
    if (!to) return { delivered: false, skipped: true }

    const clientName = name || appointment.ownerName || 'Valued Customer'
    const petName = appointment.petName || 'your pet'
    const subject = `🐾 Appointment Rescheduled: ${petName}'s grooming is now on ${appointment.date} at ${appointment.time}`

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Appointment Rescheduled</title></head>
<body style="margin:0;padding:0;background-color:#F8F7F4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#261C14;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#F8F7F4;padding:30px 15px;">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);border:1px solid #E5D6C5;">
        <tr>
          <td style="background-color:#2B4C3F;padding:26px 24px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">🐾 Timmy Tails Pet Grooming</h1>
            <p style="margin:6px 0 0 0;color:#D8E5DF;font-size:13px;">Appointment Rescheduled</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 24px;">
            <p style="margin:0 0 16px 0;font-size:15px;color:#261C14;">Hello <strong>${clientName}</strong>,</p>
            <p style="margin:0 0 16px 0;font-size:14px;color:#4A3B32;line-height:1.6;">
              Your grooming appointment for <strong>${petName}</strong> has been successfully rescheduled to:
            </p>
            <div style="background-color:#F5FAF7;border:1px solid #A3D4BE;border-radius:10px;padding:16px;margin:18px 0;">
              <p style="margin:0 0 6px 0;font-size:15px;color:#1B4332;font-weight:700;">📅 ${appointment.date}</p>
              <p style="margin:0;font-size:15px;color:#1B4332;font-weight:700;">⏰ ${appointment.time} – ${appointment.endTime || ''}</p>
            </div>
            <p style="margin:16px 0 0 0;font-size:14px;color:#4A3B32;line-height:1.6;">
              Please arrive 5–10 minutes before ${appointment.time}. We look forward to seeing you and ${petName}!
            </p>
          </td>
        </tr>
        <tr>
          <td style="background-color:#FAF7F2;padding:16px 24px;text-align:center;font-size:12px;color:#8C7A6D;border-top:1px solid #E5D6C5;">
            <p style="margin:0;">© ${new Date().getFullYear()} Timmy Tails Pet Grooming Salon • Baliuag City, Bulacan</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>
`

    return sendMailViaHttpOrSmtp({
        to,
        name: clientName,
        subject,
        html,
        text: `Your grooming appointment for ${petName} has been rescheduled to ${appointment.date} at ${appointment.time}.`
    })
}

/**
 * Send completed appointment thank-you email
 */
const sendAppointmentCompletedEmail = async ({ to, name, appointment }) => {
    if (!to) return { delivered: false, skipped: true }

    const clientName = name || appointment.ownerName || 'Valued Customer'
    const petName = appointment.petName || 'your pet'
    const subject = `🐾 Thank you for visiting Timmy Tails! ${petName}'s grooming is complete`

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Grooming Completed</title></head>
<body style="margin:0;padding:0;background-color:#F8F7F4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#261C14;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#F8F7F4;padding:30px 15px;">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);border:1px solid #E5D6C5;">
        <tr>
          <td style="background-color:#2B4C3F;padding:26px 24px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">🐾 Timmy Tails Pet Grooming</h1>
            <p style="margin:6px 0 0 0;color:#D8E5DF;font-size:13px;">Grooming Session Completed</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 24px;">
            <p style="margin:0 0 16px 0;font-size:15px;color:#261C14;">Hello <strong>${clientName}</strong>,</p>
            <p style="margin:0 0 16px 0;font-size:14px;color:#4A3B32;line-height:1.6;">
              Thank you for trusting Timmy Tails with <strong>${petName}</strong> today! We hope ${petName} is feeling fresh, comfortable, and looking great.
            </p>
            <p style="margin:16px 0 0 0;font-size:14px;color:#4A3B32;line-height:1.6;">
              We look forward to welcoming you and ${petName} back for your next grooming session!
            </p>
          </td>
        </tr>
        <tr>
          <td style="background-color:#FAF7F2;padding:16px 24px;text-align:center;font-size:12px;color:#8C7A6D;border-top:1px solid #E5D6C5;">
            <p style="margin:0;">© ${new Date().getFullYear()} Timmy Tails Pet Grooming Salon • Baliuag City, Bulacan</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>
`

    return sendMailViaHttpOrSmtp({
        to,
        name: clientName,
        subject,
        html,
        text: `Thank you for visiting Timmy Tails! ${petName}'s grooming session has been completed.`
    })
}

module.exports = {
    sendAppointmentReminderTodayEmail,
    sendAppointmentConfirmedEmail,
    sendAppointmentCancelledEmail,
    sendAppointmentRescheduledEmail,
    sendAppointmentCompletedEmail,
    sendWelcomeEmail,
    sendOtpEmail,
    closeTransporter
}
