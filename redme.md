# Stir - Trending Topics Tracker

A Node.js application that scrapes and stores trending topics, providing an API to access historical trend data.

## Features

- Real-time trending topics scraping
- Historical trends storage in MongoDB
- RESTful API endpoints
- CORS-enabled for frontend integration
- Error handling and logging
- Development/Production environment configurations

## Prerequisites

- Node.js (LTS version recommended)
- MongoDB instance
- Chrome browser (for Selenium WebDriver)

## Installation

1. Clone the repository:
```bash
git clone [https://github.com/HarshadSanjayKarale/STIR.git]
cd stir
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
NODE_ENV=development
```

4. Start the server:
```bash
npm start
```

## API Endpoints

### GET /api/trends
Retrieves the latest trending topics from the database.

#### Response
```json
{
  "success": true,
  "data": [
    {
      "topics": ["..."],
      "timestamp": "2024-01-12T00:00:00.000Z",
      "proxyInfo": {}
    }
  ]
}
```

### POST /api/scrape-trends
Triggers a new scraping operation to fetch current trending topics.

#### Response
```json
{
  "success": true,
  "data": {
    "id": "mongoDbId",
    "topics": ["..."],
    "timestamp": "2024-01-12T00:00:00.000Z",
    "proxyInfo": {}
  }
}
```

## Security

The application includes several security measures:
- CORS protection with whitelist
- Helmet middleware (ready to be implemented)
- Rate limiting support (ready to be implemented)
- Environment-specific error messages

## Development

The project uses the following key dependencies:
- Express.js for the web server
- Selenium WebDriver for web scraping
- MongoDB for data storage
- Axios for HTTP requests
- CORS for cross-origin resource sharing

## Error Handling

The application includes comprehensive error handling:
- Global error handler middleware
- Environment-specific error messages
- Console logging for debugging
- Structured error responses

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository.