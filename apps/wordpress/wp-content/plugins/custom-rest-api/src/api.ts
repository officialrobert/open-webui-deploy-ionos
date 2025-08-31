/**
 * Custom REST API - TypeScript Implementation
 * This file handles weather API calls only
 */

import axios from 'axios';
import { buildWeatherUrl } from './config';

// Types
interface WeatherData {
  city: string;
  temperature: number;
  description: string;
  humidity: number;
  wind_speed: number;
  source: string;
}

// Weather API Service Class
export class WeatherApiService {
  private weatherApiKey: string;

  constructor(weatherApiKey?: string) {
    // Use provided key first, then environment variable
    let apiKey = weatherApiKey || process.env.OPEN_WEATHER_MAP_KEY;
    
    if (!apiKey) {
      throw new Error('OpenWeatherMap API key not provided. Please set OPEN_WEATHER_MAP_KEY environment variable.');
    }
    
    // Decode base64 API key if it's encoded
    try {
      const decoded = Buffer.from(apiKey, 'base64').toString('utf8');
      // Check if the decoded string looks like a valid API key (32 characters, alphanumeric)
      if (/^[a-zA-Z0-9]{32}$/.test(decoded)) {
        apiKey = decoded;
      }
    } catch (error) {
      // If decoding fails, use the original key
      console.log('API key is not base64 encoded, using as-is');
    }
    
    this.weatherApiKey = apiKey;
  }

  /**
   * Get weather data from OpenWeatherMap API
   */
  async getWeatherData(city: string): Promise<WeatherData> {
    try {
      const url = buildWeatherUrl(city, this.weatherApiKey);
      const response = await axios.get(url);

      if (response?.data && response.data.main) {
        return {
          city: response.data.name,
          temperature: Math.round(response.data.main.temp),
          description: response.data.weather[0].description,
          humidity: response.data.main.humidity,
          wind_speed: response.data.wind.speed,
          source: 'openweathermap_api',
        };
      }

      throw new Error('Invalid weather data received');
    } catch (error) {
      throw new Error(
        `Weather API failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }
}

// Export for use in WordPress
export default {
  WeatherApiService,
};
