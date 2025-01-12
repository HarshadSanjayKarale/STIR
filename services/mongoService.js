// mongoService.js
const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = "mongodb+srv://Harshad:Harshad@stir.fopcw.mongodb.net/?retryWrites=true&w=majority&appName=STIR";
const dbName = 'twitter_trends';
let client;

async function connectToDatabase() {
    try {
        client = new MongoClient(uri);
        await client.connect();
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
}

async function saveTrendingTopics(topics, timestamp, ipAddress) {
    if (!client?.topology?.isConnected()) {
        await connectToDatabase();
    }

    const collection = client.db(dbName).collection('trends');
    
    const document = {
        nameoftrend1: topics[0] || null,
        nameoftrend2: topics[1] || null,
        nameoftrend3: topics[2] || null,
        nameoftrend4: topics[3] || null,
        nameoftrend5: topics[4] || null,
        timestamp: timestamp,
        ipAddress: ipAddress,
        createdAt: new Date()
    };

    return await collection.insertOne(document);
}

async function getLatestTrends() {
    if (!client?.topology?.isConnected()) {
        await connectToDatabase();
    }

    const collection = client.db(dbName).collection('trends');
    return await collection.find().sort({ timestamp: -1 }).limit(10).toArray();
}

module.exports = {
    connectToDatabase,
    saveTrendingTopics,
    getLatestTrends
};