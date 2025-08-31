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
    // Use provided key first, then environment variable, then fallback to demo
    this.weatherApiKey =
      weatherApiKey || process.env.OPEN_WEATHER_MAP_KEY || 'demo_key';
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
