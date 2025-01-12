const ProxyRotator = require('./proxyRotator');
const SeleniumHelper = require('./seleniumHelper');
const TwitterScraper = require('./twitterScraper');

async function fetchTrendingTopics() {
    const proxyRotator = new ProxyRotator();
    let seleniumHelper = null;
    let proxyConfig = null;
    let usedProxy = false;
    
    try {
        // Try to get proxy first
        try {
            proxyConfig = await proxyRotator.getNextProxy();
            console.log(`Successfully configured proxy: ${proxyConfig.host} (${proxyConfig.ip})`);
            usedProxy = true;
        } catch (error) {
            console.log('Proxy setup failed, continuing without proxy:', error.message);
            proxyConfig = null;
        }

        // Initialize Selenium with or without proxy
        seleniumHelper = new SeleniumHelper(proxyConfig);
        await seleniumHelper.initialize();

        // Create TwitterScraper instance with initialized SeleniumHelper
        const scraper = new TwitterScraper(seleniumHelper);
        
        // Try to load cookies first
        const cookiesLoaded = await seleniumHelper.loadCookies();
        if (!cookiesLoaded) {
            await scraper.login();
        }

        const trendingTopics = await scraper.getTrendingTopics();

        return {
            topics: trendingTopics,
            proxyInfo: usedProxy ? {
                ip: proxyConfig.ip,
                host: proxyConfig.host,
                usedProxy: true
            } : {
                ip: await seleniumHelper.checkCurrentIp(),
                host: null,
                usedProxy: false
            }
        };

    } catch (error) {
        console.error("ERROR in fetchTrendingTopics:", error.message);
        throw error;
    } finally {
        if (seleniumHelper) {
            await seleniumHelper.quit();
        }
    }
}

module.exports = {
    fetchTrendingTopics
};