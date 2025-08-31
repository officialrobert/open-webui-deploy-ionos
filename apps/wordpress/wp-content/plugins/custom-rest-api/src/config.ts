/**
 * API Configuration - Weather API only
 * This file contains OpenWeatherMap API configuration
 */

export const API_CONFIG = {
  // OpenWeatherMap API
  WEATHER: {
    BASE_URL: 'https://api.openweathermap.org/data/2.5/weather',
    UNITS: 'metric',
    DEFAULT_CITY: 'London',
  },
};

// Helper function to build weather API URL
export function buildWeatherUrl(city: string, apiKey: string): string {
  const params = new URLSearchParams({
    q: city,
    appid: apiKey,
    units: API_CONFIG.WEATHER.UNITS,
  });
  return `${API_CONFIG.WEATHER.BASE_URL}?${params.toString()}`;
}

// Export for use in other files
export default API_CONFIG;
