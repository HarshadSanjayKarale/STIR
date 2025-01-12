// proxyRotator.js
const axios = require('axios');
const https = require('https');

class ProxyRotator {
    constructor() {
        this.proxyMeshUsername = "Harshad45";
        this.proxyMeshPassword = "Harshad45";
        this.proxyServers = [
            'us-ca.proxymesh.com',
        ];
        this.currentServerIndex = -1;
        this.currentIp = null;
    }

    async validateIpChange(proxyConfig) {
        if (!this.currentIp) {
            this.currentIp = await this.getCurrentIp();
            console.log('Initial IP:', this.currentIp);
        }

        if (!proxyConfig) {
            throw new Error('No proxy configuration available');
        }

        const newIp = await this.getCurrentIp(proxyConfig);
        console.log('New Proxy IP:', newIp);

        if (this.currentIp === newIp) {
            throw new Error('IP address did not change with proxy');
        }

        return newIp;
    }

    async getCurrentIp(proxyConfig = null) {
        try {
            const config = {
                timeout: 30000,
                httpsAgent: new https.Agent({
                    rejectUnauthorized: false,
                    secureOptions: require('constants').SSL_OP_NO_TLSv1_2,
                    ciphers: 'ALL'
                }),
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            };

            if (proxyConfig) {
                const proxyAuth = `${this.proxyMeshUsername}:${this.proxyMeshPassword}`;
                config.proxy = {
                    host: proxyConfig.host,
                    port: proxyConfig.port,
                    auth: {
                        username: this.proxyMeshUsername,
                        password: this.proxyMeshPassword
                    },
                    protocol: 'http'
                };
                config.headers['Proxy-Authorization'] = `Basic ${Buffer.from(proxyAuth).toString('base64')}`;
            }

            // Updated IP checking services
            const ipServices = [
                { url: 'http://checkip.amazonaws.com', parser: (data) => data.trim() },
                { url: 'https://api64.ipify.org?format=json', parser: (data) => data.ip },
                { url: 'http://whatismyip.akamai.com', parser: (data) => data.trim() }
            ];

            for (const service of ipServices) {
                try {
                    const response = await axios.get(service.url, config);
                    const ip = service.parser(response.data);
                    if (ip) return ip;
                } catch (error) {
                    console.log(`Failed to get IP from ${service.url}:`, error.message);
                    continue;
                }
            }
            
            throw new Error('All IP checking services failed');
        } catch (error) {
            throw new Error(`Failed to get current IP: ${error.message}`);
        }
    }

    async testProxyConnection(proxyConfig) {
        const config = {
            timeout: 10000,
            proxy: {
                host: proxyConfig.host,
                port: proxyConfig.port,
                auth: {
                    username: this.proxyMeshUsername,
                    password: this.proxyMeshPassword
                },
                protocol: 'http'
            },
            httpsAgent: new https.Agent({
                rejectUnauthorized: false,
                secureOptions: require('constants').SSL_OP_NO_TLSv1_2,
                ciphers: 'ALL'
            }),
            validateStatus: function (status) {
                return status >= 200 && status < 600; // Accept all status codes
            }
        };

        try {
            await axios.get('http://example.com', config);
            return true;
        } catch (error) {
            throw new Error(`Proxy connection test failed: ${error.message}`);
        }
    }

    async getNextProxy(retryCount = 0) {
        const maxRetries = this.proxyServers.length * 2;
        
        if (retryCount >= maxRetries) {
            throw new Error('All proxy servers failed validation after maximum retries');
        }

        this.currentServerIndex = (this.currentServerIndex + 1) % this.proxyServers.length;
        const proxyHost = this.proxyServers[this.currentServerIndex];
        
        const proxyConfig = {
            host: proxyHost,
            port: 31280,
            auth: {
                username: this.proxyMeshUsername,
                password: this.proxyMeshPassword
            }
        };

        try {
            await this.testProxyConnection(proxyConfig);
            const newIp = await this.validateIpChange(proxyConfig);
            return {
                ...proxyConfig,
                ip: newIp
            };
        } catch (error) {
            console.error(`Proxy validation failed for ${proxyHost}:`, error.message);
            await new Promise(resolve => setTimeout(resolve, 3000));
            return this.getNextProxy(retryCount + 1);
        }
    }
}

module.exports = ProxyRotator;