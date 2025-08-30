# TypeScript-Powered Demo Endpoint for Open WebUI

## Overview

A demo endpoint that uses **TypeScript to handle external API calls** (weather, search, news) for your Open WebUI integration. The PHP backend serves as a proxy while the TypeScript handles all external API interactions.

## Architecture

- **PHP**: WordPress plugin that provides REST API endpoints
- **TypeScript**: Handles all external API calls (OpenWeatherMap, DuckDuckGo, etc.)
- **External APIs**: Weather, Search, and News data from real services

## Endpoint Details

**URL:** `/index.php?rest_route=/custom-api/v1/demo`  
**Methods:** GET, POST  
**Description:** Demo endpoint with TypeScript-powered external API integration

## Available Actions

### 1. Weather Data (`action=weather`)
Get current weather for any city using OpenWeatherMap API.

**Parameters:**
- `city` (optional): City name (default: "London")

**Example:**
```bash
GET /index.php?rest_route=/custom-api/v1/demo?action=weather&city=New York
```

### 2. Search Results (`action=search`)
Search using DuckDuckGo Instant Answer API (free, no API key required).

**Parameters:**
- `query` (required): Search term
- `limit` (optional): Number of results (default: 5)

**Example:**
```bash
GET /index.php?rest_route=/custom-api/v1/demo?action=search&query=openai&limit=3
```

### 3. News Data (`action=news`)
Get mock news articles (ready for NewsAPI integration).

**Parameters:**
- `query` (optional): Filter news by topic
- `limit` (optional): Number of articles (default: 5)

**Example:**
```bash
GET /index.php?rest_route=/custom-api/v1/demo?action=news&query=AI&limit=3
```

### 4. Info (`action=info`)
Get information about available actions.

**Example:**
```bash
GET /index.php?rest_route=/custom-api/v1/demo?action=info
```

## TypeScript Usage

### Installation & Build

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build
```

### Using the External API Service Directly

```typescript
import { ExternalApiService } from './dist/api';

// Create external API service with optional API keys
const externalApi = new ExternalApiService(
  'your_openweathermap_api_key', // Optional: for real weather data
  'your_newsapi_key'             // Optional: for real news data
);

// Get weather data
const weather = await externalApi.getWeatherData('Tokyo');

// Get search results
const searchResults = await externalApi.getSearchResults('artificial intelligence', 3);

// Get news data
const news = await externalApi.getNewsData('AI', 2);
```

### Using the Full API Service

```typescript
import { CustomApiClient, CustomApiService } from './dist/api';

const client = new CustomApiClient(
  'https://your-wordpress-site.com', 
  'your-nonce',
  'your_openweathermap_api_key', // Optional
  'your_newsapi_key'             // Optional
);
const service = new CustomApiService(client);

// Get weather through the service
const weather = await service.getWeather('Paris');

// Search for information
const searchResults = await service.getSearch('machine learning', 3);

// Get news
const news = await service.getNews('AI', 5);

// Generic demo call
const demo = await service.getDemo({
  action: 'weather',
  city: 'Paris'
});
```

### Browser Usage

```html
<!-- Include the compiled TypeScript -->
<script src="dist/api.js"></script>

<script>
// Use the external API service
const externalApi = new ExternalApiService();

// Get weather data
externalApi.getWeatherData('New York')
  .then(weather => console.log('Weather:', weather));

// Get search results
externalApi.getSearchResults('openai', 2)
  .then(results => console.log('Search:', results));
</script>
```

## Testing with curl

```bash
# Get weather for New York
curl "https://your-wordpress-site.com/index.php?rest_route=/custom-api/v1/demo?action=weather&city=New%20York"

# Search for "artificial intelligence"
curl "https://your-wordpress-site.com/index.php?rest_route=/custom-api/v1/demo?action=search&query=artificial%20intelligence&limit=3"

# Get news about technology
curl "https://your-wordpress-site.com/index.php?rest_route=/custom-api/v1/demo?action=news&query=technology&limit=2"
```

## Features

✅ **TypeScript-Powered**: All external API calls handled by TypeScript  
✅ **Real External APIs**: Weather (OpenWeatherMap) and Search (DuckDuckGo)  
✅ **No API Keys Required**: DuckDuckGo search works out of the box  
✅ **Fallback Support**: Graceful degradation to mock data  
✅ **Multiple Usage Patterns**: Direct API service, WordPress integration, browser usage  
✅ **Type Safety**: Full TypeScript support with interfaces  
✅ **Clean Architecture**: Separation of concerns between PHP and TypeScript  

Perfect for your Open WebUI demo with TypeScript-powered external API integration!
