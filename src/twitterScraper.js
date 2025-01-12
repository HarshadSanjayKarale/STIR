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
        
        if (!this.username || !this.password) {
            throw new Error('Twitter credentials not found in environment variables');
        }
    }

    async login() {
        console.log("Performing login...");
        await this.driver.get('https://x.com/login');
        await this.driver.sleep(3000);

        try {
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