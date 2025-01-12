// seleniumScript.js
require('dotenv').config();
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');
const path = require('path');

const twitterUsername = process.env.TWITTER_USERNAME;
const twitterPassword = process.env.TWITTER_PASSWORD;
const COOKIES_PATH = path.join(__dirname, 'twitter_cookies.json');

async function saveCookies(driver) {
    try {
        const cookies = await driver.manage().getCookies();
        await fs.promises.writeFile(COOKIES_PATH, JSON.stringify(cookies));
        console.log('Cookies saved successfully');
    } catch (error) {
        console.error('Error saving cookies:', error);
    }
}

async function loadCookies(driver) {
    try {
        if (fs.existsSync(COOKIES_PATH)) {
            const cookiesData = await fs.promises.readFile(COOKIES_PATH, 'utf8');
            const cookies = JSON.parse(cookiesData);
            await driver.get('https://x.com');
            for (const cookie of cookies) {
                await driver.manage().addCookie(cookie);
            }
            console.log('Cookies loaded successfully');
            return true;
        }
    } catch (error) {
        console.log('No valid cookies found:', error.message);
    }
    return false;
}

async function login(driver) {
    console.log("Performing login...");
    await driver.get('https://x.com/login');
    await driver.sleep(3000);

    try {
        // Enter username
        const usernameField = await driver.wait(
            until.elementLocated(By.css('input[autocomplete="username"]')),
            10000
        );
        await usernameField.sendKeys(twitterUsername);
        
        const nextButton = await driver.wait(
            until.elementLocated(By.xpath('//span[text()="Next"]')),
            10000
        );
        await nextButton.click();
        await driver.sleep(2000);

        // Handle email verification if needed
        try {
            const emailField = await driver.wait(
                until.elementLocated(By.css('input[autocomplete="email"]')),
                5000
            );
            await emailField.sendKeys(twitterUsername);
            const submitButton = await driver.wait(
                until.elementLocated(By.xpath('//span[text()="Next"]')),
                5000
            );
            await submitButton.click();
            await driver.sleep(2000);
        } catch (error) {
            console.log("No email verification required");
        }

        // Enter password
        const passwordField = await driver.wait(
            until.elementLocated(By.css('input[type="password"]')),
            10000
        );
        await passwordField.sendKeys(twitterPassword);

        const loginButton = await driver.wait(
            until.elementLocated(By.xpath('//span[text()="Log in"]')),
            10000
        );
        await loginButton.click();

        await driver.wait(until.urlContains('x.com/home'), 30000);
        await saveCookies(driver);
        console.log("Login successful");
    } catch (error) {
        console.error("Login failed:", error);
        throw new Error('Failed to login to Twitter');
    }
}

async function fetchTrendingTopics(proxyConfig = null) {
    console.log("Starting the Selenium script...");
    let driver = null;
    
    try {
        const options = new chrome.Options();
        options.addArguments('--disable-notifications');
        options.addArguments('--no-sandbox');
        options.addArguments('--disable-dev-shm-usage');
        
        // Add proxy configuration if provided and valid
        if (proxyConfig && proxyConfig.host && proxyConfig.port) {
            console.log(`Setting up proxy: ${proxyConfig.host}:${proxyConfig.port}`);
            options.addArguments(`--proxy-server=http://${proxyConfig.host}:${proxyConfig.port}`);
        } else {
            console.log('Running without proxy');
        }

        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();

        await driver.manage().setTimeouts({ implicit: 20000 });
        await driver.manage().window().maximize();
        
        const cookiesLoaded = await loadCookies(driver);
        
        if (cookiesLoaded) {
            console.log("Navigating with loaded cookies...");
            await driver.get('https://x.com/home');
            
            try {
                await driver.wait(until.urlContains('x.com/home'), 5000);
            } catch (error) {
                console.log("Session expired, logging in again...");
                await login(driver);
            }
        } else {
            await login(driver);
        }

        await driver.sleep(5000);

        console.log("Looking for trending topics...");
        const trendingTopics = [];

        try {
            const showMoreButton = await driver.findElement(By.css('a[href="/explore/tabs/for-you"]'));
            console.log("Clicking Show more...");
            await showMoreButton.click();
            await driver.sleep(3000);
        } catch (error) {
            console.log("Show more button not found, continuing anyway...");
        }

        const trendElements = await driver.wait(
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

        console.log("\nExtracted Trending Topics:");
        trendingTopics.forEach((topic, index) => {
            console.log(`${index + 1}. ${topic}`);
        });

        return trendingTopics;

    } catch (error) {
        console.error("ERROR in fetchTrendingTopics:", error.message);
        throw error;
    } finally {
        if (driver) {
            console.log("Closing the browser...");
            await driver.quit().catch(err => console.error("Error closing browser:", err));
        }
    }
}

module.exports = {
    fetchTrendingTopics
};