// server.js
const express = require('express');
const cors = require('cors');
const { fetchTrendingTopics } = require('./src/main');
const { connectToDatabase, saveTrendingTopics, getLatestTrends } = require('./services/mongoService');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true
}));
app.use(express.json());
app.use(express.static('public'));

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

app.post('/api/scrape-trends', async (req, res) => {
    try {
        const result = await fetchTrendingTopics();
        
        const timestamp = new Date();
        const dbResult = await saveTrendingTopics(
            result.topics, 
            timestamp, 
            result.proxyInfo
        );
        
        res.json({
            success: true,
            data: {
                id: dbResult.insertedId,
                topics: result.topics,
                timestamp,
                proxyInfo: result.proxyInfo
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

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

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