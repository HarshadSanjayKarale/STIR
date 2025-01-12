const ProxyRotator = require('./src/proxyRotator');

async function testProxy() {
    const rotator = new ProxyRotator();
    try {
        console.log('Testing proxy connection...');
        const proxyConfig = await rotator.getNextProxy();
        console.log('Successfully connected to proxy:', {
            host: proxyConfig.host,
            ip: proxyConfig.ip
        });
    } catch (error) {
        console.error('Proxy test failed:', error.message);
    }
}

// Run the test
testProxy();