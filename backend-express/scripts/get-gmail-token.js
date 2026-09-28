/**
 * One-time script to get a Gmail OAuth2 refresh token.
 * Run with: node scripts/get-gmail-token.js
 *
 * Prerequisites: set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET in .env first
 * (or pass them as env vars: GMAIL_CLIENT_ID=... GMAIL_CLIENT_SECRET=... node scripts/get-gmail-token.js)
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const http = require('http')
const { exec } = require('child_process')
const fs = require('fs')
const path = require('path')

const CLIENT_ID = process.env.GMAIL_CLIENT_ID
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET
const REDIRECT_PORT = 3099
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}`
const SCOPES = 'https://mail.google.com/'

const authUrl =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        response_type: 'code',
        scope: SCOPES,
        access_type: 'offline',
        prompt: 'consent'
    }).toString()

console.log('\n🔑 Opening browser for Gmail authorization...')
console.log('   Sign in with: timmytails.cs@gmail.com\n')

// Open browser
const openCmd = process.platform === 'win32' ? `start "" "${authUrl}"` : `open "${authUrl}"`
exec(openCmd)

// Local server to capture the auth code
const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, REDIRECT_URI)
    const code = url.searchParams.get('code')
    const error = url.searchParams.get('error')

    if (error) {
        res.end(`<h2>Error: ${error}</h2><p>Close this tab and try again.</p>`)
        server.close()
        process.exit(1)
    }

    if (!code) {
        res.end('<h2>No code received. Try again.</h2>')
        return
    }

    res.end(`
        <html><body style="font-family:sans-serif;padding:40px;text-align:center">
        <h2 style="color:#2C221E">✅ Authorization successful!</h2>
        <p>You can close this tab and return to the terminal.</p>
        </body></html>
    `)

    // Exchange code for tokens
    console.log('📨 Exchanging authorization code for tokens...')
    try {
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                redirect_uri: REDIRECT_URI,
                grant_type: 'authorization_code',
                code
            })
        })
        const tokens = await tokenRes.json()

        if (!tokens.refresh_token) {
            console.error('\n❌ No refresh token received:', JSON.stringify(tokens, null, 2))
            console.error('   → Try revoking access at https://myaccount.google.com/permissions and run again.')
            server.close()
            process.exit(1)
        }

        console.log('\n✅ Got refresh token!\n')

        // Update .env file
        const envPath = path.join(__dirname, '..', '.env')
        let envContent = fs.readFileSync(envPath, 'utf8')

        const newVars = {
            GMAIL_CLIENT_ID: CLIENT_ID,
            GMAIL_CLIENT_SECRET: CLIENT_SECRET,
            GMAIL_REFRESH_TOKEN: tokens.refresh_token
        }

        for (const [key, value] of Object.entries(newVars)) {
            const regex = new RegExp(`^${key}=.*$`, 'm')
            if (regex.test(envContent)) {
                envContent = envContent.replace(regex, `${key}=${value}`)
            } else {
                envContent += `\n${key}=${value}`
            }
        }

        fs.writeFileSync(envPath, envContent, 'utf8')
        console.log('✅ Saved to .env:')
        console.log(`   GMAIL_CLIENT_ID=${CLIENT_ID}`)
        console.log(`   GMAIL_CLIENT_SECRET=GOCSPX-***`)
        console.log(`   GMAIL_REFRESH_TOKEN=${tokens.refresh_token.slice(0, 20)}...`)
        console.log('\n🎉 Done! Restart the backend server and emails will send from timmytails.cs@gmail.com directly.\n')

    } catch (err) {
        console.error('❌ Token exchange failed:', err.message)
    }

    server.close()
})

server.listen(REDIRECT_PORT, () => {
    console.log(`⏳ Waiting for Google to redirect to http://localhost:${REDIRECT_PORT}...`)
    console.log('   (Browser should have opened — sign in with timmytails.cs@gmail.com)\n')
})
