const { By, until } = require('selenium-webdriver');
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
        this.email = process.env.TWITTER_EMAIL || this.username;
        
        if (!this.username || !this.password) {
            throw new Error('Twitter credentials not found in environment variables');
        }
    }

    async login() {
        console.log("Performing login...");
        
        try {
            // Handle proxy authentication by including credentials in the URL
            const baseUrl = 'https://x.com/login';
            const urlWithAuth = baseUrl.replace('https://', `https://Harshad45:Harshad45@`);
            
            await this.driver.get(urlWithAuth);
            await this.driver.sleep(3000);

            // Enter username
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

            // Handle additional verification steps
            let isEmailRequired = false;
            try {
                // Check if email verification is required
                const emailField = await this.driver.wait(
                    until.elementLocated(By.css('input[autocomplete="email"]')),
                    5000
                );
                isEmailRequired = true;
                console.log("Email verification required");
                await emailField.sendKeys(this.email);
                
                const emailNextButton = await this.driver.wait(
                    until.elementLocated(By.xpath('//span[text()="Next"]')),
                    5000
                );
                await emailNextButton.click();
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
            // Include proxy authentication in explore URL as well
            const exploreUrl = 'https://x.com/explore';
            const exploreWithAuth = exploreUrl.replace('https://', `https://Harshad45:Harshad45@`);
            await this.driver.get(exploreWithAuth);
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