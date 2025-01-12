// twitter-scraper.js
require('dotenv').config();
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');
const path = require('path');
const ProxyManager = require('./proxy-manager');

const twitterUsername = process.env.TWITTER_USERNAME || 'harshadkarale25@gmail.com';
const twitterPassword = process.env.TWITTER_PASSWORD;
const COOKIES_PATH = path.join(__dirname, 'twitter_cookies.json');

if (!twitterUsername || !twitterPassword) {
    console.error("ERROR: Twitter credentials are missing in .env file or hardcoded values.");
    process.exit(1);
}

async function saveCookies(driver) {
    const cookies = await driver.manage().getCookies();
    fs.writeFileSync(COOKIES_PATH, JSON.stringify(cookies));
    console.log('Cookies saved successfully');
}

async function loadCookies(driver) {
    try {
        if (fs.existsSync(COOKIES_PATH)) {
            const cookies = JSON.parse(fs.readFileSync(COOKIES_PATH));
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

    // Enter username
    console.log("Entering username...");
    const usernameField = await driver.wait(
        until.elementLocated(By.css('input[autocomplete="username"]')),
        10000
    );
    await usernameField.sendKeys(twitterUsername);
    
    // Click "Next"
    const nextButton = await driver.wait(
        until.elementLocated(By.xpath('//span[text()="Next"]')),
        10000
    );
    await nextButton.click();

    await driver.sleep(2000);

    // Handle email verification if needed
    try {
        const emailPhoneField = await driver.wait(
            until.elementLocated(By.css('input[autocomplete="email"]')),
            5000
        );
        console.log("Entering email...");
        await emailPhoneField.sendKeys('harshadkarale25@gmail.com');
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
    console.log("Entering password...");
    const passwordField = await driver.wait(
        until.elementLocated(By.css('input[type="password"]')),
        10000
    );
    await passwordField.sendKeys(twitterPassword);

    // Click login
    const loginButton = await driver.wait(
        until.elementLocated(By.xpath('//span[text()="Log in"]')),
        10000
    );
    await loginButton.click();

    await driver.wait(until.urlContains('x.com/home'), 30000);
    await saveCookies(driver);
}

async function fetchTrendingTopics() {
    console.log("Starting the script...");
    
    // Initialize proxy manager and get proxy details
    const proxyManager = new ProxyManager();
    const proxyDetails = await proxyManager.getCurrentIp();
    
    console.log(`Using proxy IP: ${proxyDetails.ip}`);

    const options = new chrome.Options();
    options.addArguments('--disable-notifications');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments(`--proxy-server=http://${proxyDetails.host}:${proxyDetails.port}`);

    const driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

    try {
        await driver.manage().setTimeouts({ implicit: 20000 });
        await driver.manage().window().maximize();
        
        // Try to load cookies first
        const cookiesLoaded = await loadCookies(driver);
        
        if (cookiesLoaded) {
            console.log("Navigating directly to home page...");
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

        console.log("Looking for What's happening section...");
        const trendingTopics = [];

        try {
            const showMoreButton = await driver.wait(
                until.elementLocated(By.css('a[href="/explore/tabs/for-you"]')),
                10000
            );
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

        console.log("\nTop 5 Trending Topics:");
        trendingTopics.forEach((topic, index) => {
            console.log(`${index + 1}. ${topic}`);
        });

        return trendingTopics;

    } catch (error) {
        console.error("ERROR:", error.message);
        throw error;
    } finally {
        console.log("Closing the browser...");
        await driver.quit();
    }
}

fetchTrendingTopics()
    .catch(error => {
        console.error("Script failed:", error);
        process.exit(1);
    });