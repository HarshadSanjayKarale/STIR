const { By, until } = require('selenium-webdriver');
const axios = require('axios');
require('dotenv').config();

class TwitterScraper {
    constructor(seleniumHelper) {
        if (!seleniumHelper || !seleniumHelper.driver) {
            throw new Error('SeleniumHelper instance with initialized driver is required');
        }
        this.seleniumHelper = seleniumHelper;
        this.driver = seleniumHelper.driver;
        this.username = process.env.TWITTER_USERNAME;
        this.password = process.env.TWITTER_PASSWORD;
        
        // Proxy configuration
        this.proxyUsername = 'HarshadKarale45';
        this.proxyPassword = 'HarshadKarale@45';
        this.maxAuthAttempts = 3;
        this.ipCheckServices = [
            'http://checkip.amazonaws.com',
            'https://api64.ipify.org?format=json',
            'http://whatismyip.akamai.com'
        ];
    }

    async validateProxy() {
        console.log("Validating proxy connection...");
        
        // Create axios instance with proxy config
        const axiosInstance = axios.create({
            timeout: 5000,
            proxy: {
                host: 'us.proxymesh.com',
                port: 31280,
                auth: {
                    username: this.proxyUsername,
                    password: this.proxyPassword
                }
            }
        });

        // Try each IP checking service
        for (const service of this.ipCheckServices) {
            try {
                const response = await axiosInstance.get(service);
                if (response.status === 200) {
                    console.log(`Proxy validation successful using ${service}`);
                    return true;
                }
            } catch (error) {
                console.log(`Service ${service} check failed, trying next service...`);
            }
        }

        console.log("All IP checking services failed, but continuing process...");
        return true; // Continue anyway since we don't want to block the process
    }

    async setupProxyAuth() {
        console.log("Setting up proxy authentication...");
        
        try {
            // First validate proxy connection
            await this.validateProxy();

            // Navigate to a test page to trigger proxy auth
            await this.driver.get('http://example.com');
            
            // Handle proxy authentication alert
            let authAttempts = 0;
            while (authAttempts < this.maxAuthAttempts) {
                try {
                    const alert = await this.driver.switchTo().alert();
                    await alert.sendKeys(`${this.proxyUsername}\t${this.proxyPassword}`);
                    await alert.accept();
                    console.log("Proxy authentication successful");
                    await this.driver.sleep(2000); // Wait for auth to complete
                    return true;
                } catch (error) {
                    authAttempts++;
                    if (authAttempts === this.maxAuthAttempts) {
                        console.log("No proxy authentication prompt found, continuing anyway...");
                        return true;
                    }
                    await this.driver.sleep(1000);
                }
            }
        } catch (error) {
            console.log("Proxy setup encountered an error, but continuing:", error.message);
            return true; // Continue anyway to not block the process
        }
    }

    async login() {
        console.log("Starting login process...");
        
        try {
            // Setup proxy authentication first
            await this.setupProxyAuth();
            
            console.log("Navigating to login page...");
            await this.driver.get('https://x.com/login');
            await this.driver.sleep(3000);

            // Rest of the login code remains the same
            const usernameField = await this.driver.wait(
                until.elementLocated(By.css('input[autocomplete="username"]')),
                10000
            );
            await usernameField.sendKeys(this.username);
            
            const nextButton = await this.driver.wait(
                until.elementLocated(By.xpath('//span[text()="Next"]')),
                10000
            );
            await nextButton.click();
            await this.driver.sleep(2000);

            // Handle email verification if needed
            try {
                const emailField = await this.driver.wait(
                    until.elementLocated(By.css('input[autocomplete="email"]')),
                    5000
                );
                await emailField.sendKeys(this.username);
                const submitButton = await this.driver.wait(
                    until.elementLocated(By.xpath('//span[text()="Next"]')),
                    5000
                );
                await submitButton.click();
                await this.driver.sleep(2000);
            } catch (error) {
                console.log("No email verification required");
            }

            // Enter password
            const passwordField = await this.driver.wait(
                until.elementLocated(By.css('input[type="password"]')),
                10000
            );
            await passwordField.sendKeys(this.password);

            const loginButton = await this.driver.wait(
                until.elementLocated(By.xpath('//span[text()="Log in"]')),
                10000
            );
            await loginButton.click();

            // Wait for successful login
            await this.driver.wait(
                until.urlContains('x.com/home'),
                30000,
                'Login timeout - check credentials or network'
            );

            await this.seleniumHelper.saveCookies();
            console.log("Login successful");
        } catch (error) {
            console.error("Login failed:", error);
            throw new Error(`Failed to login to Twitter: ${error.message}`);
        }
    }

    async getTrendingTopics() {
        console.log("Looking for trending topics...");
        const trendingTopics = [];

        try {
            // Navigate to explore page
            await this.driver.get('https://x.com/explore');
            await this.driver.sleep(5000);

            try {
                const showMoreButton = await this.driver.findElement(
                    By.css('a[href="/explore/tabs/for-you"]')
                );
                console.log("Clicking Show more...");
                await showMoreButton.click();
                await this.driver.sleep(3000);
            } catch (error) {
                console.log("Show more button not found, continuing anyway...");
            }

            const trendElements = await this.driver.wait(
                until.elementsLocated(By.css('div[data-testid="trend"]')),
                20000
            );

            const startIndex = 3;
            for (let i = startIndex; i < trendElements.length; i++) {
                try {
                    const trend = trendElements[i];
                    const trendName = await trend.findElement(By.css('.r-b88u0q')).getText();
                    
                    if (trendName && !trendName.toLowerCase().includes('show more')) {
                        trendingTopics.push(trendName.trim());
                        if (trendingTopics.length >= 5) break;
                    }
                } catch (error) {
                    console.error(`Error extracting trend ${i + 1}:`, error.message);
                }
            }

            if (trendingTopics.length === 0) {
                throw new Error('Failed to extract any trending topics');
            }

            return trendingTopics;
        } catch (error) {
            console.error("Error getting trending topics:", error);
            throw error;
        }
    }
}

module.exports = TwitterScraper;