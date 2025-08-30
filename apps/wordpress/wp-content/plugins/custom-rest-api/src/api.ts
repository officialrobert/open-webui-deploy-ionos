/**
 * Custom REST API - TypeScript Implementation
 * This file handles external API calls and provides Node.js-like functionality
 */

import axios from 'axios';
import _ from 'lodash';

// Types
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

interface WeatherData {
  city: string;
  temperature: number;
  description: string;
  humidity: number;
  wind_speed: number;
  source: string;
  note?: string;
}

interface SearchResult {
  title: string;
  snippet: string;
  url: string;
  source: string;
}

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  published_at: string;
  source: string;
}

interface DemoResponse {
  message?: string;
  available_actions?: string[];
  examples?: Record<string, string>;
  city?: string;
  temperature?: number;
  description?: string;
  humidity?: number;
  wind_speed?: number;
  source?: string;
  note?: string;
  query?: string;
  results?: SearchResult[];
  articles?: NewsArticle[];
  total_results?: number;
}

// External API Service Class
export class ExternalApiService {
  private weatherApiKey: string;
  private newsApiKey: string;

  constructor(weatherApiKey?: string, newsApiKey?: string) {
    this.weatherApiKey = weatherApiKey || 'demo_key';
    this.newsApiKey = newsApiKey || 'demo_key';
  }

  /**
   * Get weather data from OpenWeatherMap API
   */
  async getWeatherData(city: string): Promise<WeatherData> {
    try {
      const url = `http://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${this.weatherApiKey}&units=metric`;
      const response = await axios.get(url);
      
      if (response.data && response.data.main) {
        return {
          city: response.data.name,
          temperature: Math.round(response.data.main.temp),
          description: response.data.weather[0].description,
          humidity: response.data.main.humidity,
          wind_speed: response.data.wind.speed,
          source: 'openweathermap_api'
        };
      }
      
      throw new Error('Invalid weather data received');
    } catch (error) {
      // Return mock data if API fails
      return {
        city: city,
        temperature: Math.floor(Math.random() * 15) + 15, // 15-30°C
        description: 'Partly cloudy',
        humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
        wind_speed: Math.floor(Math.random() * 15) + 5, // 5-20 m/s
        source: 'mock_data',
        note: 'Using mock data - add real API key for live weather'
      };
    }
  }

  /**
   * Get search results using DuckDuckGo Instant Answer API
   */
  async getSearchResults(query: string, limit: number = 5): Promise<SearchResult[]> {
    try {
      const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
      const response = await axios.get(url);
      const searchData = response.data;
      
      const results: SearchResult[] = [];
      
      // Add main result if available
      if (searchData && searchData.AbstractText && searchData.AbstractText.trim()) {
        results.push({
          title: searchData.Heading || query,
          snippet: searchData.AbstractText,
          url: searchData.AbstractURL || '#',
          source: 'duckduckgo_api'
        });
      }
      
      // Add related topics
      if (searchData.RelatedTopics && Array.isArray(searchData.RelatedTopics)) {
        for (const topic of searchData.RelatedTopics.slice(0, limit - 1)) {
          if (topic.Text) {
            results.push({
              title: topic.Text,
              snippet: 'Related topic',
              url: topic.FirstURL || '#',
              source: 'duckduckgo_api'
            });
          }
        }
      }
      
      if (results.length === 0) {
        results.push({
          title: `No results found for: ${query}`,
          snippet: 'Try a different search term',
          url: '#',
          source: 'no_results'
        });
      }
      
      return results.slice(0, limit);
    } catch (error) {
      // Return mock search results
      return [{
        title: `Search result for: ${query}`,
        snippet: 'This is a mock search result. The actual API call failed.',
        url: '#',
        source: 'mock_data'
      }];
    }
  }

  /**
   * Get news data (mock data for demo)
   */
  async getNewsData(query: string = '', limit: number = 5): Promise<NewsArticle[]> {
    const mockNews: NewsArticle[] = [
      {
        title: 'AI Breakthrough in Natural Language Processing',
        description: 'Researchers develop new model that improves language understanding by 40%',
        url: 'https://example.com/ai-breakthrough',
        published_at: new Date(Date.now() - 3600000).toISOString(),
        source: 'Tech News'
      },
      {
        title: 'Open Source AI Models Gain Popularity',
        description: 'Community-driven AI development sees significant growth in 2024',
        url: 'https://example.com/open-source-ai',
        published_at: new Date(Date.now() - 7200000).toISOString(),
        source: 'AI Weekly'
      },
      {
        title: 'WordPress Integration with AI Tools',
        description: 'New plugins enable seamless AI integration in WordPress websites',
        url: 'https://example.com/wordpress-ai',
        published_at: new Date(Date.now() - 10800000).toISOString(),
        source: 'Web Development'
      },
      {
        title: 'Machine Learning in Web Applications',
        description: 'How ML is transforming modern web development practices',
        url: 'https://example.com/ml-web-dev',
        published_at: new Date(Date.now() - 14400000).toISOString(),
        source: 'Developer News'
      },
      {
        title: 'The Future of API Integration',
        description: 'Emerging trends in API development and integration patterns',
        url: 'https://example.com/api-future',
        published_at: new Date(Date.now() - 18000000).toISOString(),
        source: 'API Insights'
      }
    ];
    
    // Filter by query if provided
    if (query.trim()) {
      const filteredNews = mockNews.filter(news => 
        news.title.toLowerCase().includes(query.toLowerCase()) ||
        news.description.toLowerCase().includes(query.toLowerCase()) ||
        news.source.toLowerCase().includes(query.toLowerCase())
      );
      return filteredNews.slice(0, limit);
    }
    
    return mockNews.slice(0, limit);
  }
}

// API Client Class for WordPress REST API
export class CustomApiClient {
  private baseUrl: string;
  private nonce: string;
  private externalApi: ExternalApiService;

  constructor(baseUrl: string, nonce: string, weatherApiKey?: string, newsApiKey?: string) {
    this.baseUrl = baseUrl;
    this.nonce = nonce;
    this.externalApi = new ExternalApiService(weatherApiKey, newsApiKey);
  }

  /**
   * Make a GET request to the WordPress API
   */
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await axios.get(`${this.baseUrl}${endpoint}`, {
        headers: {
          'X-WP-Nonce': this.nonce,
          'Content-Type': 'application/json',
        },
      });
      return {
        success: true,
        data: response.data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Make a POST request to the WordPress API
   */
  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    try {
      const response = await axios.post(`${this.baseUrl}${endpoint}`, data, {
        headers: {
          'X-WP-Nonce': this.nonce,
          'Content-Type': 'application/json',
        },
      });
      return {
        success: true,
        data: response.data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get external API service
   */
  getExternalApi(): ExternalApiService {
    return this.externalApi;
  }
}

// API Service Class
export class CustomApiService {
  private client: CustomApiClient;

  constructor(client: CustomApiClient) {
    this.client = client;
  }

  /**
   * Demo endpoint that handles external API calls directly
   */
  async getDemo(params?: {
    action?: string;
    query?: string;
    city?: string;
    limit?: number;
  }): Promise<ApiResponse<DemoResponse>> {
    const action = params?.action || 'info';
    const query = params?.query || '';
    const city = params?.city || 'London';
    const limit = params?.limit || 5;

    try {
      const externalApi = this.client.getExternalApi();
      let responseData: DemoResponse = {};

      switch (action) {
        case 'weather':
          const weatherData = await externalApi.getWeatherData(city);
          responseData = {
            city: weatherData.city,
            temperature: weatherData.temperature,
            description: weatherData.description,
            humidity: weatherData.humidity,
            wind_speed: weatherData.wind_speed,
            source: weatherData.source,
            note: weatherData.note
          };
          break;

        case 'search':
          const searchResults = await externalApi.getSearchResults(query, limit);
          responseData = {
            query: query,
            results: searchResults,
            total_results: searchResults.length
          };
          break;

        case 'news':
          const newsData = await externalApi.getNewsData(query, limit);
          responseData = {
            query: query,
            articles: newsData,
            total_results: newsData.length
          };
          break;

        case 'info':
        default:
          responseData = {
            message: 'Demo endpoint working! External APIs handled by TypeScript',
            available_actions: ['weather', 'search', 'news', 'info'],
            examples: {
              'weather': '/demo?action=weather&city=New York',
              'search': '/demo?action=search&query=openai',
              'news': '/demo?action=news&query=technology&limit=3'
            }
          };
          break;
      }

      return {
        success: true,
        data: responseData,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Demo endpoint with POST request
   */
  async postDemo(data: {
    action?: string;
    query?: string;
    city?: string;
    limit?: number;
  }): Promise<ApiResponse<DemoResponse>> {
    return this.getDemo(data);
  }

  /**
   * Get weather data directly from external API
   */
  async getWeather(city: string): Promise<ApiResponse<DemoResponse>> {
    return this.getDemo({ action: 'weather', city });
  }

  /**
   * Get search results directly from external API
   */
  async getSearch(query: string, limit?: number): Promise<ApiResponse<DemoResponse>> {
    return this.getDemo({ action: 'search', query, limit: limit || 5 });
  }

  /**
   * Get news data directly from external API
   */
  async getNews(query?: string, limit?: number): Promise<ApiResponse<DemoResponse>> {
    return this.getDemo({ action: 'news', query: query || '', limit: limit || 5 });
  }
}

// Export for use in WordPress
export default {
  CustomApiClient,
  CustomApiService,
  ExternalApiService,
};
