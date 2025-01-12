// seleniumHelper.js
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const COOKIES_PATH = path.join(__dirname, 'twitter_cookies.json');

class SeleniumHelper {
    constructor(proxyConfig = null) {
        this.proxyConfig = proxyConfig;
        this.driver = null;
    }

    async initialize() {
        const options = new chrome.Options();
        options.addArguments('--disable-notifications');
        options.addArguments('--no-sandbox');
        options.addArguments('--disable-dev-shm-usage');
        
        if (this.proxyConfig) {
            // Add proxy with authentication directly in the URL
            const proxyString = `${this.proxyConfig.host}:${this.proxyConfig.port}`;
            const proxyAuth = `${this.proxyConfig.auth.username}:${this.proxyConfig.auth.password}`;
            
            // Configure proxy with authentication
            options.addArguments(`--proxy-server=${proxyString}`);
            options.addArguments(`--proxy-auth=${proxyAuth}`);
            
            // Additional Chrome flags for proxy stability
            options.addArguments('--disable-gpu');
            options.addArguments('--disable-features=IsolateOrigins,site-per-process');
            options.addArguments('--ignore-certificate-errors');
        }

        this.driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();

        await this.driver.manage().setTimeouts({ implicit: 20000 });
        await this.driver.manage().window().maximize();

        // Verify proxy is working if configured
        if (this.proxyConfig) {
            await this.verifyProxyConnection();
        }
    }

    async verifyProxyConnection() {
        try {
            await this.driver.get('https://api.ipify.org?format=json');
            const body = await this.driver.findElement(By.tagName('pre'));
            const ipData = JSON.parse(await body.getText());
            const currentIp = ipData.ip;
            
            if (currentIp === this.proxyConfig.ip) {
                console.log('Proxy verification successful');
            } else {
                console.warn('Warning: Current IP does not match proxy IP');
                console.log('Expected:', this.proxyConfig.ip);
                console.log('Got:', currentIp);
            }
        } catch (error) {
            console.error('Proxy verification failed:', error.message);
            // Continue anyway as the proxy might still work
            console.log('Continuing despite verification failure...');
        }
    }

    async saveCookies() {
        try {
            const cookies = await this.driver.manage().getCookies();
            await fs.promises.writeFile(COOKIES_PATH, JSON.stringify(cookies));
            console.log('Cookies saved successfully');
        } catch (error) {
            console.error('Error saving cookies:', error);
        }
    }

    async loadCookies() {
        try {
            if (fs.existsSync(COOKIES_PATH)) {
                const cookiesData = await fs.promises.readFile(COOKIES_PATH, 'utf8');
                const cookies = JSON.parse(cookiesData);
                await this.driver.get('https://x.com');
                for (const cookie of cookies) {
                    await this.driver.manage().addCookie(cookie);
                }
                console.log('Cookies loaded successfully');
                return true;
            }
        } catch (error) {
            console.log('No valid cookies found:', error.message);
        }
        return false;
    }



    async checkCurrentIp() {
        try {
            await this.driver.get('https://api.ipify.org?format=json');
            const body = await this.driver.findElement(By.tagName('pre'));
            const ipData = JSON.parse(await body.getText());
            return ipData.ip;
        } catch (error) {
            console.error('Error checking IP:', error.message);
            throw error;
        }
    }

    async quit() {
        if (this.driver) {
            await this.driver.quit().catch(err => console.error("Error closing browser:", err));
        }
    }
}

module.exports = SeleniumHelper;