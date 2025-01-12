// mongoService.js
const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = "mongodb+srv://Harshad:Harshad@stir.fopcw.mongodb.net/?retryWrites=true&w=majority&appName=STIR" || 'mongodb://localhost:27017/twitter_trends';
let client = null;

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

async function saveTrendingTopics(topics, timestamp, proxyInfo) {
    try {
        const database = client.db('twitter_trends');
        const collection = database.collection('trends');
        
        const result = await collection.insertOne({
            topics,
            timestamp,
            ip: proxyInfo.ip,
            proxyHost: proxyInfo.host,
            usedProxy: proxyInfo.usedProxy,
            createdAt: new Date()
        });

        return result;
    } catch (error) {
        console.error('Error saving to MongoDB:', error);
        throw error;
    }
}

async function getLatestTrends() {
    try {
        const database = client.db('twitter_trends');
        const collection = database.collection('trends');
        
        const trends = await collection.find()
            .sort({ timestamp: -1 })
            .limit(10)
            .toArray();
            
        return trends;
    } catch (error) {
        console.error('Error fetching from MongoDB:', error);
        throw error;
    }
}

module.exports = {
    connectToDatabase,
    saveTrendingTopics,
    getLatestTrends
};
