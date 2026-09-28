const fs = require('fs')
const path = require('path')
const mailerPath = path.join(__dirname, '..', 'services', 'mailer.js')
let c = fs.readFileSync(mailerPath, 'utf8')
// Remove leading space left after emoji removal in subject backtick strings
c = c.replace(/subject = `\s+/g, 'subject = `')
c = c.replace(/emailSubject = subject \|\| `\s+/g, 'emailSubject = subject || `')
fs.writeFileSync(mailerPath, c, 'utf8')
console.log('Done')
