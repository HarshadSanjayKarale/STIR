// proxyService.js
const axios = require('axios');
require('dotenv').config();

class ProxyService {
    constructor() {
        this.proxyMeshUsername = process.env.PROXYMESH_USERNAME;
        this.proxyMeshPassword = process.env.PROXYMESH_PASSWORD;
        
        this.proxyServers = [
            'us-ca.proxymesh.com',
            'us-ny.proxymesh.com',
            'us-fl.proxymesh.com',
            'us-il.proxymesh.com',
            'us.proxymesh.com'
        ];
        
        this.currentServerIndex = 0;
    }

    async refreshIp() {
        const proxyHost = this.proxyServers[this.currentServerIndex];
        const proxyPort = 31280;
        const authHeader = `Basic ${Buffer.from(`${this.proxyMeshUsername}:${this.proxyMeshPassword}`).toString('base64')}`;

        try {
            console.log(`Attempting to get new IP from ${proxyHost}...`);
            
            const response = await axios.get('http://api.ipify.org?format=json', {
                headers: {
                    'Proxy-Authorization': authHeader,
                },
                proxy: {
                    host: proxyHost,
                    port: proxyPort,
                    protocol: 'http',
                },
                timeout: 10000
            });

            const newIp = response.data.ip;
            console.log(`Successfully obtained new IP: ${newIp}`);

            // Rotate to next server for next request
            this.currentServerIndex = (this.currentServerIndex + 1) % this.proxyServers.length;

            return {
                ip: newIp,
                host: proxyHost,
                port: proxyPort,
                auth: authHeader
            };

        } catch (error) {
            console.error(`Failed to get IP from ${proxyHost}:`, error.message);
            // Try next server on failure
            this.currentServerIndex = (this.currentServerIndex + 1) % this.proxyServers.length;
            throw error;
        }
    }
}

module.exports = new ProxyService();