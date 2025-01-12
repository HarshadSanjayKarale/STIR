// proxyService.js
const axios = require('axios');
require('dotenv').config();

class ProxyService {
    constructor() {
        this.proxyMeshUsername = "HarshadKarale45";
        this.proxyMeshPassword = "HarshadKarale@45";
        
        this.proxyServers = [
            'us-ca.proxymesh.com',
            'us-ny.proxymesh.com',
            'us-fl.proxymesh.com',
            'us-il.proxymesh.com',
            'us.proxymesh.com'
        ];
        
        this.currentServerIndex = 0;
        this.retryCount = 0;
        this.maxRetries = 3;
    }

    getNextServer() {
        this.currentServerIndex = (this.currentServerIndex + 1) % this.proxyServers.length;
        return this.proxyServers[this.currentServerIndex];
    }

    async getProxyIp(useProxy = true) {
        if (!useProxy) {
            // Return local configuration if proxy fails
            return {
                ip: 'localhost',
                host: 'localhost',
                port: null,
                auth: null
            };
        }

        const proxyHost = this.getNextServer();
        const proxyPort = 31280;
        const authHeader = `Basic ${Buffer.from(`${this.proxyMeshUsername}:${this.proxyMeshPassword}`).toString('base64')}`;

        try {
            const response = await axios.get('http://api.ipify.org?format=json', {
                headers: {
                    'Proxy-Authorization': authHeader,
                },
                proxy: {
                    host: proxyHost,
                    port: proxyPort,
                    protocol: 'http',
                },
                timeout: 5000 // 5 second timeout
            });

            this.retryCount = 0; // Reset retry count on success
            return {
                ip: response.data.ip,
                host: proxyHost,
                port: proxyPort,
                auth: authHeader
            };
        } catch (error) {
            console.error('Proxy error:', error.message);
            
            if (this.retryCount < this.maxRetries) {
                this.retryCount++;
                console.log(`Retrying with different proxy server (Attempt ${this.retryCount}/${this.maxRetries})`);
                return this.getProxyIp(true);
            }
            
            console.log('Falling back to local connection');
            return this.getProxyIp(false);
        }
    }
}

module.exports = new ProxyService();