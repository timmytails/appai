const dns = require('dns')
const mongoose = require('mongoose')

// Force Google Public DNS for reliable mongodb+srv Atlas resolution
try {
    dns.setServers(['8.8.8.8', '8.8.4.4'])
} catch (dnsErr) {
    console.warn('Custom DNS set failed, using system default:', dnsErr.message)
}

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI
        if (!mongoUri) {
            throw new Error('MONGODB_URI is not configured')
        }
        const conn = await mongoose.connect(mongoUri)
        console.log(`MongoDB connected: ${conn.connection.host}`)
    } catch (error) {
        console.error(`MongoDB connection error: ${error.message}`)
        process.exit(1)
    }
}

module.exports = connectDB
