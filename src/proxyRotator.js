const axios = require('axios');
const https = require('https');

class ProxyRotator {
    constructor() {
        this.proxyMeshUsername = "HarshadKarale45";
        this.proxyMeshPassword = "HarshadKarale@45";
        this.proxyServer = 'us-ca.proxymesh.com';
        this.port = 31280;
        this.currentIp = null;
        this.rotationDelay = 5000; // 5 seconds between rotation attempts
        this.maxRotationAttempts = 5;
    }

    async getCurrentIp(proxyConfig = null) {
        const ipServices = [
            'http://httpbin.org/ip',  // Returns {"origin": "XXX.XXX.XXX.XXX"}
            'https://api.ipify.org?format=json',  // Returns {"ip": "XXX.XXX.XXX.XXX"}
            'http://ip-api.com/json'  // Returns {"query": "XXX.XXX.XXX.XXX", ...}
        ];

        const config = {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        };

        if (proxyConfig) {
            config.proxy = {
                host: proxyConfig.host,
                port: proxyConfig.port,
                auth: {
                    username: this.proxyMeshUsername,
                    password: this.proxyMeshPassword
                }
            };
        }

        for (const service of ipServices) {
            try {
                const response = await axios.get(service, config);
                if (response.data) {
                    // Extract IP based on the service response format
                    const ip = response.data.origin || response.data.ip || response.data.query;
                    if (ip) return ip;
                }
            } catch (error) {
                console.log(`Failed to get IP from ${service}:`, error.message);
                continue;
            }
        }
        throw new Error('Failed to get IP from any service');
    }

    async rotateIp() {
        // ProxyMesh requires a specific request to rotate IP
        const rotateConfig = {
            method: 'delete',
            url: 'http://us-ca.proxymesh.com/rotate_ip',
            auth: {
                username: this.proxyMeshUsername,
                password: this.proxyMeshPassword
            },
            timeout: 10000
        };

        try {
            await axios(rotateConfig);
            // Wait for the rotation to take effect
            await new Promise(resolve => setTimeout(resolve, 2000));
            return true;
        } catch (error) {
            console.error('IP rotation request failed:', error.message);
            return false;
        }
    }

    async getNextProxy(retryCount = 0) {
        if (retryCount >= this.maxRotationAttempts) {
            throw new Error('Failed to obtain a new IP after maximum attempts');
        }

        const proxyConfig = {
            host: this.proxyServer,
            port: this.port,
            auth: {
                username: this.proxyMeshUsername,
                password: this.proxyMeshPassword
            }
        };

        try {
            // Get current IP before rotation
            const oldIp = this.currentIp || await this.getCurrentIp(proxyConfig);
            console.log('Current IP:', oldIp);

            // Request IP rotation
            console.log('Requesting IP rotation...');
            const rotated = await this.rotateIp();
            if (!rotated) {
                throw new Error('IP rotation request failed');
            }

            // Get new IP after rotation
            const newIp = await this.getCurrentIp(proxyConfig);
            console.log('New IP:', newIp);

            // Verify IP has changed
            if (oldIp === newIp) {
                console.log('IP did not change, retrying...');
                await new Promise(resolve => setTimeout(resolve, this.rotationDelay));
                return this.getNextProxy(retryCount + 1);
            }

            this.currentIp = newIp;
            return {
                ...proxyConfig,
                ip: newIp
            };

        } catch (error) {
            console.error('Error during IP rotation:', error.message);
            await new Promise(resolve => setTimeout(resolve, this.rotationDelay));
            return this.getNextProxy(retryCount + 1);
        }
    }

    async testConnection() {
        const proxyConfig = {
            host: this.proxyServer,
            port: this.port,
            auth: {
                username: this.proxyMeshUsername,
                password: this.proxyMeshPassword
            }
        };

        try {
            const ip = await this.getCurrentIp(proxyConfig);
            console.log('Proxy connection successful. Current IP:', ip);
            return true;
        } catch (error) {
            console.error('Proxy connection test failed:', error.message);
            return false;
        }
    }
}

module.exports = ProxyRotator;