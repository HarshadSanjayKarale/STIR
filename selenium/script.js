require('dotenv').config();
const axios = require('axios');

// Load ProxyMesh credentials from environment variables
const proxyMeshUsername = process.env.PROXYMESH_USERNAME;
const proxyMeshPassword = process.env.PROXYMESH_PASSWORD;

if (!proxyMeshUsername || !proxyMeshPassword) {
    console.error("ERROR: ProxyMesh credentials are missing in .env file");
    process.exit(1);
}

async function getPublicIp() {
    // Base64 encode the credentials
    const authHeader = `Basic ${Buffer.from(`${proxyMeshUsername}:${proxyMeshPassword}`).toString('base64')}`;
    const proxyHost = 'us-ca.proxymesh.com'; // The only server available in the free trial
    const proxyPort = 31280;

    console.log(`Connecting to ProxyMesh server: ${proxyHost}...`);

    try {
        const response = await axios.get('http://api.ipify.org?format=json', {
            headers: {
                'Proxy-Authorization': authHeader, // Include the ProxyMesh authorization header
            },
            proxy: {
                host: proxyHost,
                port: proxyPort,
                protocol: 'http', // Ensure HTTP for ProxyMesh
            },
            timeout: 5000, // Timeout for the request
        });

        console.log("Public IP Address:", response.data.ip);
    } catch (error) {
        console.error("Failed to get public IP:");
        if (error.response) {
            console.error("Status Code:", error.response.status);
            console.error("Response Data:", error.response.data);
        } else if (error.request) {
            console.error("No response received:", error.request);
        } else {
            console.error("Error Message:", error.message);
        }
    }
}

getPublicIp();
