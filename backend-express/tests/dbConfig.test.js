const test = require('node:test')
const assert = require('node:assert/strict')
const mongoose = require('mongoose')
const connectDB = require('../config/db')

test('database config accepts legacy MONGO_URI when MONGODB_URI is absent', async () => {
    const originalConnect = mongoose.connect
    const originalMongoDbUri = process.env.MONGODB_URI
    const originalMongoUri = process.env.MONGO_URI
    let receivedUri = null

    mongoose.connect = async (uri) => {
        receivedUri = uri
        return { connection: { host: 'test-host' } }
    }
    delete process.env.MONGODB_URI
    process.env.MONGO_URI = 'mongodb://legacy-host/timmytails'

    try {
        await connectDB()
        assert.equal(receivedUri, 'mongodb://legacy-host/timmytails')
    } finally {
        mongoose.connect = originalConnect
        if (originalMongoDbUri === undefined) delete process.env.MONGODB_URI
        else process.env.MONGODB_URI = originalMongoDbUri
        if (originalMongoUri === undefined) delete process.env.MONGO_URI
        else process.env.MONGO_URI = originalMongoUri
    }
})

test('database config prefers MONGODB_URI when both database variables exist', async () => {
    const originalConnect = mongoose.connect
    const originalMongoDbUri = process.env.MONGODB_URI
    const originalMongoUri = process.env.MONGO_URI
    let receivedUri = null

    mongoose.connect = async (uri) => {
        receivedUri = uri
        return { connection: { host: 'test-host' } }
    }
    process.env.MONGODB_URI = 'mongodb://canonical-host/timmytails'
    process.env.MONGO_URI = 'mongodb://legacy-host/timmytails'

    try {
        await connectDB()
        assert.equal(receivedUri, 'mongodb://canonical-host/timmytails')
    } finally {
        mongoose.connect = originalConnect
        if (originalMongoDbUri === undefined) delete process.env.MONGODB_URI
        else process.env.MONGODB_URI = originalMongoDbUri
        if (originalMongoUri === undefined) delete process.env.MONGO_URI
        else process.env.MONGO_URI = originalMongoUri
    }
})
