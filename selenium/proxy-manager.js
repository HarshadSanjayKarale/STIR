// proxy-manager.js
require('dotenv').config();
const axios = require('axios');

class ProxyManager {
    constructor() {
        this.proxyMeshUsername = process.env.PROXYMESH_USERNAME;
        this.proxyMeshPassword = process.env.PROXYMESH_PASSWORD;
        this.proxyHost = 'us-ca.proxymesh.com';
        this.proxyPort = 31280;

        if (!this.proxyMeshUsername || !this.proxyMeshPassword) {
            throw new Error("ProxyMesh credentials are missing in .env file");
        }
    }

    async getCurrentIp() {
        const authHeader = `Basic ${Buffer.from(`${this.proxyMeshUsername}:${this.proxyMeshPassword}`).toString('base64')}`;

        try {
            const response = await axios.get('http://api.ipify.org?format=json', {
                headers: {
                    'Proxy-Authorization': authHeader,
                },
                proxy: {
                    host: this.proxyHost,
                    port: this.proxyPort,
                    protocol: 'http',
                },
                timeout: 5000,
            });

            console.log("Current Proxy IP:", response.data.ip);
            return {
                ip: response.data.ip,
                host: this.proxyHost,
                port: this.proxyPort,
                auth: authHeader
            };
        } catch (error) {
            console.error("Failed to get proxy IP:", error.message);
            throw error;
        }
    }
}

module.exports = ProxyManager;