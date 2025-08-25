/**
 * Custom REST API - Frontend JavaScript
 * This file provides client-side functionality for the WordPress plugin
 */

(function ($) {
  'use strict';

  // Custom API Frontend Class
  class CustomApiFrontend {
    constructor() {
      this.init();
    }

    init() {
      this.bindEvents();
      this.loadApiData();
    }

    bindEvents() {
      // Bind to DOM ready
      $(document).ready(() => {
        this.setupEventListeners();
      });

      // Example: Bind to a button click
      $(document).on('click', '.custom-api-test', (e) => {
        e.preventDefault();
        this.testApiConnection();
      });

      // Example: Bind to form submission
      $(document).on('submit', '.custom-api-form', (e) => {
        e.preventDefault();
        this.handleFormSubmission(e);
      });
    }

    setupEventListeners() {
      // Add any additional event listeners here
      console.log('Custom API Frontend initialized');
    }

    async loadApiData() {
      try {
        // Test the API connection
        const healthResponse = await this.makeApiRequest('/health');
        if (healthResponse.success) {
          console.log('API Health Check:', healthResponse.data);
          this.displayApiStatus('connected');
        } else {
          console.error('API Health Check Failed:', healthResponse.error);
          this.displayApiStatus('disconnected');
        }
      } catch (error) {
        console.error('Failed to load API data:', error);
        this.displayApiStatus('error');
      }
    }

    async testApiConnection() {
      const button = $('.custom-api-test');
      const originalText = button.text();

      button.text('Testing...').prop('disabled', true);

      try {
        const response = await this.makeApiRequest('/health');

        if (response.success) {
          this.showNotification('API connection successful!', 'success');
          console.log('API Response:', response.data);
        } else {
          this.showNotification(
            'API connection failed: ' + response.error,
            'error',
          );
        }
      } catch (error) {
        this.showNotification(
          'API connection error: ' + error.message,
          'error',
        );
      } finally {
        button.text(originalText).prop('disabled', false);
      }
    }

    async handleFormSubmission(event) {
      const form = $(event.target);
      const submitButton = form.find('button[type="submit"]');
      const originalText = submitButton.text();

      submitButton.text('Processing...').prop('disabled', true);

      try {
        const formData = this.serializeForm(form);
        const response = await this.makeAjaxRequest(
          'custom_api_action',
          formData,
        );

        if (response.success) {
          this.showNotification('Form submitted successfully!', 'success');
          form[0].reset();
        } else {
          this.showNotification(
            'Form submission failed: ' + response.message,
            'error',
          );
        }
      } catch (error) {
        this.showNotification(
          'Form submission error: ' + error.message,
          'error',
        );
      } finally {
        submitButton.text(originalText).prop('disabled', false);
      }
    }

    async makeApiRequest(endpoint) {
      if (typeof customApiAjax === 'undefined') {
        throw new Error('Custom API configuration not found');
      }

      try {
        const response = await fetch(customApiAjax.rest_url + endpoint, {
          method: 'GET',
          headers: {
            'X-WP-Nonce': customApiAjax.nonce,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return {
          success: true,
          data: data,
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
        };
      }
    }

    async makeAjaxRequest(action, data = {}) {
      return new Promise((resolve, reject) => {
        $.ajax({
          url: customApiAjax.ajaxurl,
          type: 'POST',
          data: {
            action: action,
            nonce: customApiAjax.nonce,
            data: data,
          },
          success: function (response) {
            resolve(response);
          },
          error: function (xhr, status, error) {
            reject(new Error(error));
          },
        });
      });
    }

    serializeForm(form) {
      const formData = {};
      form.serializeArray().forEach((item) => {
        formData[item.name] = item.value;
      });
      return formData;
    }

    displayApiStatus(status) {
      const statusElement = $('.api-status');
      if (statusElement.length) {
        statusElement
          .removeClass('connected disconnected error')
          .addClass(status)
          .text(status.charAt(0).toUpperCase() + status.slice(1));
      }
    }

    showNotification(message, type = 'info') {
      // Create notification element
      const notification = $(`
                <div class="custom-api-notification ${type}">
                    <span class="message">${message}</span>
                    <button class="close-btn">&times;</button>
                </div>
            `);

      // Add to page
      $('body').append(notification);

      // Auto-remove after 5 seconds
      setTimeout(() => {
        notification.fadeOut(() => notification.remove());
      }, 5000);

      // Manual close
      notification.find('.close-btn').on('click', () => {
        notification.fadeOut(() => notification.remove());
      });
    }

    // Utility method to load posts
    async loadPosts() {
      try {
        const response = await this.makeApiRequest('/posts');
        if (response.success) {
          this.displayPosts(response.data);
        } else {
          console.error('Failed to load posts:', response.error);
        }
      } catch (error) {
        console.error('Error loading posts:', error);
      }
    }

    // Utility method to load users
    async loadUsers() {
      try {
        const response = await this.makeApiRequest('/users');
        if (response.success) {
          this.displayUsers(response.data);
        } else {
          console.error('Failed to load users:', response.error);
        }
      } catch (error) {
        console.error('Error loading users:', error);
      }
    }

    displayPosts(posts) {
      const container = $('.posts-container');
      if (container.length && posts.length > 0) {
        const postsHtml = posts
          .map(
            (post) => `
                    <div class="post-item">
                        <h3>${post.title}</h3>
                        <p>${post.content.substring(0, 100)}...</p>
                        <small>By ${post.author} on ${post.created_at}</small>
                    </div>
                `,
          )
          .join('');
        container.html(postsHtml);
      }
    }

    displayUsers(users) {
      const container = $('.users-container');
      if (container.length && users.length > 0) {
        const usersHtml = users
          .map(
            (user) => `
                    <div class="user-item">
                        <h4>${user.display_name}</h4>
                        <p>Username: ${user.username}</p>
                        <p>Role: ${user.role}</p>
                    </div>
                `,
          )
          .join('');
        container.html(usersHtml);
      }
    }
  }

  // Initialize when DOM is ready
  $(document).ready(() => {
    new CustomApiFrontend();
  });
})(jQuery);
