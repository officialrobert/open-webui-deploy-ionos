/**
 * Custom REST API - TypeScript Implementation
 * This file provides Node.js-like functionality within WordPress
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

interface Post {
  id: number;
  title: string;
  content: string;
  author: string;
  created_at: string;
  modified_at: string;
  permalink: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  display_name: string;
  role: string;
}

interface NodeData {
  message: string;
  timestamp: number;
  random_number: number;
  server_info: {
    php_version: string;
    wordpress_version: string;
    server_software: string;
  };
}

// API Client Class
export class CustomApiClient {
  private baseUrl: string;
  private nonce: string;

  constructor(baseUrl: string, nonce: string) {
    this.baseUrl = baseUrl;
    this.nonce = nonce;
  }

  /**
   * Make a GET request to the API
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
   * Make a POST request to the API
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
}

// API Service Class
export class CustomApiService {
  private client: CustomApiClient;

  constructor(client: CustomApiClient) {
    this.client = client;
  }

  /**
   * Get health status
   */
  async getHealth(): Promise<ApiResponse> {
    return this.client.get('/health');
  }

  /**
   * Get posts
   */
  async getPosts(): Promise<ApiResponse<Post[]>> {
    return this.client.get<Post[]>('/posts');
  }

  /**
   * Get users
   */
  async getUsers(): Promise<ApiResponse<User[]>> {
    return this.client.get<User[]>('/users');
  }

  /**
   * Get Node.js-like data
   */
  async getNodeData(): Promise<ApiResponse<NodeData>> {
    return this.client.get<NodeData>('/node-data');
  }

  /**
   * Process data with Node.js-like utilities
   */
  processData<T>(data: T[]): T[] {
    // Use lodash for data processing (Node.js-like functionality)
    return _.chain(data)
      .filter((item) => item !== null && item !== undefined)
      .sortBy('id')
      .value();
  }

  /**
   * Generate random data (Node.js-like functionality)
   */
  generateRandomData(count: number = 5): any[] {
    return _.times(count, (index) => ({
      id: index + 1,
      name: `Item ${index + 1}`,
      value: Math.random() * 100,
      timestamp: new Date().toISOString(),
      hash: this.generateHash(`item-${index}`),
    }));
  }

  /**
   * Generate a simple hash (Node.js-like functionality)
   */
  private generateHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }
}

// Utility functions
export const utils = {
  /**
   * Debounce function (Node.js-like)
   */
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number,
  ): (...args: Parameters<T>) => void {
    return _.debounce(func, wait);
  },

  /**
   * Throttle function (Node.js-like)
   */
  throttle<T extends (...args: any[]) => any>(
    func: T,
    wait: number,
  ): (...args: Parameters<T>) => void {
    return _.throttle(func, wait);
  },

  /**
   * Deep clone object (Node.js-like)
   */
  cloneDeep<T>(obj: T): T {
    return _.cloneDeep(obj);
  },

  /**
   * Merge objects (Node.js-like)
   */
  merge<T>(target: T, ...sources: Partial<T>[]): T {
    return _.merge(target, ...sources);
  },
};

// Export for use in WordPress
export default {
  CustomApiClient,
  CustomApiService,
  utils,
};
