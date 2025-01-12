const express = require('express');
const cors = require('cors');
const path = require('path');
const { fetchTrendingTopics } = require('./selenium/seleniumScript');
const { connectToDatabase, saveTrendingTopics, getLatestTrends } = require('./services/mongoService');
const proxyService = require('./services/proxyService');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true
}));
app.use(express.json());
app.use(express.static('public'));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Endpoint to fetch stored trends
app.get('/api/trends', async (req, res) => {
    try {
        const trends = await getLatestTrends();
        res.json({
            success: true,
            data: trends
        });
    } catch (error) {
        console.error('Error fetching trends:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch trends',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Main endpoint to trigger scraping
app.post('/api/scrape-trends', async (req, res) => {
    try {
        let proxyConfig = null;
        
        try {
            proxyConfig = await proxyService.getProxyIp();
        } catch (proxyError) {
            console.warn('Failed to get proxy, continuing without proxy:', proxyError.message);
            // Continue without proxy
        }
        
        const trendingTopics = await fetchTrendingTopics(proxyConfig);
        
        const timestamp = new Date();
        const result = await saveTrendingTopics(
            trendingTopics, 
            timestamp, 
            proxyConfig?.ip || 'local'
        );
        
        res.json({
            success: true,
            data: {
                id: result.insertedId,
                topics: trendingTopics,
                timestamp,
                ip: proxyConfig?.ip || 'local',
                proxyUsed: !!proxyConfig
            }
        });
    } catch (error) {
        console.error('Error in /api/scrape-trends:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to scrape trending topics',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Handle unhandled rejections and exceptions
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // Give the server a chance to finish handling ongoing requests
    setTimeout(() => {
        process.exit(1);
    }, 1000);
});

// Start the server
async function startServer() {
    try {
        await connectToDatabase();
        app.listen(port, () => {
            console.log(`Server running on http://localhost:${port}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();