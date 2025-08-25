/**
 * Custom REST API - Admin JavaScript
 * This file provides admin panel functionality for the WordPress plugin
 */

(function ($) {
  'use strict';

  // Custom API Admin Class
  class CustomApiAdmin {
    constructor() {
      this.init();
    }

    init() {
      this.bindEvents();
      this.loadAdminData();
    }

    bindEvents() {
      // Bind to DOM ready
      $(document).ready(() => {
        this.setupAdminEventListeners();
      });

      // Admin-specific event listeners
      $(document).on('click', '.custom-api-admin-test', (e) => {
        e.preventDefault();
        this.testAdminApiConnection();
      });

      $(document).on('click', '.custom-api-admin-settings-save', (e) => {
        e.preventDefault();
        this.saveAdminSettings();
      });

      $(document).on('click', '.custom-api-admin-clear-cache', (e) => {
        e.preventDefault();
        this.clearApiCache();
      });
    }

    setupAdminEventListeners() {
      console.log('Custom API Admin initialized');

      // Initialize admin dashboard widgets
      this.initDashboardWidgets();
    }

    initDashboardWidgets() {
      // Add dashboard widget if on dashboard page
      if ($('#dashboard-widgets').length) {
        this.createDashboardWidget();
      }
    }

    createDashboardWidget() {
      const widgetHtml = `
                <div class="custom-api-dashboard-widget">
                    <h3>Custom REST API Status</h3>
                    <div class="api-status-display">
                        <p>Status: <span class="api-status">Checking...</span></p>
                        <p>Version: <span class="api-version">1.0.0</span></p>
                        <p>Last Check: <span class="api-last-check">-</span></p>
                    </div>
                    <div class="api-actions">
                        <button class="button custom-api-admin-test">Test Connection</button>
                        <button class="button custom-api-admin-clear-cache">Clear Cache</button>
                    </div>
                </div>
            `;

      // Add to dashboard
      $('#dashboard-widgets').append(widgetHtml);
    }

    async loadAdminData() {
      try {
        // Load API statistics and status
        const healthResponse = await this.makeApiRequest('/health');
        if (healthResponse.success) {
          this.updateAdminStatus(healthResponse.data);
        } else {
          this.updateAdminStatus({
            status: 'error',
            error: healthResponse.error,
          });
        }

        // Load additional admin data
        await this.loadApiStatistics();
      } catch (error) {
        console.error('Failed to load admin data:', error);
        this.updateAdminStatus({ status: 'error', error: error.message });
      }
    }

    async testAdminApiConnection() {
      const button = $('.custom-api-admin-test');
      const originalText = button.text();

      button.text('Testing...').prop('disabled', true);

      try {
        const response = await this.makeApiRequest('/health');

        if (response.success) {
          this.showAdminNotification('API connection successful!', 'success');
          this.updateAdminStatus(response.data);
        } else {
          this.showAdminNotification(
            'API connection failed: ' + response.error,
            'error',
          );
        }
      } catch (error) {
        this.showAdminNotification(
          'API connection error: ' + error.message,
          'error',
        );
      } finally {
        button.text(originalText).prop('disabled', false);
      }
    }

    async saveAdminSettings() {
      const button = $('.custom-api-admin-settings-save');
      const originalText = button.text();

      button.text('Saving...').prop('disabled', true);

      try {
        const formData = this.serializeAdminForm();
        const response = await this.makeAjaxRequest(
          'custom_api_admin_save_settings',
          formData,
        );

        if (response.success) {
          this.showAdminNotification('Settings saved successfully!', 'success');
        } else {
          this.showAdminNotification(
            'Failed to save settings: ' + response.message,
            'error',
          );
        }
      } catch (error) {
        this.showAdminNotification(
          'Settings save error: ' + error.message,
          'error',
        );
      } finally {
        button.text(originalText).prop('disabled', false);
      }
    }

    async clearApiCache() {
      const button = $('.custom-api-admin-clear-cache');
      const originalText = button.text();

      button.text('Clearing...').prop('disabled', true);

      try {
        const response = await this.makeAjaxRequest(
          'custom_api_admin_clear_cache',
        );

        if (response.success) {
          this.showAdminNotification('Cache cleared successfully!', 'success');
        } else {
          this.showAdminNotification(
            'Failed to clear cache: ' + response.message,
            'error',
          );
        }
      } catch (error) {
        this.showAdminNotification(
          'Cache clear error: ' + error.message,
          'error',
        );
      } finally {
        button.text(originalText).prop('disabled', false);
      }
    }

    async loadApiStatistics() {
      try {
        // Load posts count
        const postsResponse = await this.makeApiRequest('/posts');
        if (postsResponse.success) {
          this.updateStatistics('posts', postsResponse.data.length);
        }

        // Load users count
        const usersResponse = await this.makeApiRequest('/users');
        if (usersResponse.success) {
          this.updateStatistics('users', usersResponse.data.length);
        }
      } catch (error) {
        console.error('Failed to load API statistics:', error);
      }
    }

    async makeApiRequest(endpoint) {
      try {
        const response = await fetch(
          ajaxurl + '?action=custom_api_admin_request&endpoint=' + endpoint,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          },
        );

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
          url: ajaxurl,
          type: 'POST',
          data: {
            action: action,
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

    serializeAdminForm() {
      const formData = {};
      $('.custom-api-admin-form')
        .serializeArray()
        .forEach((item) => {
          formData[item.name] = item.value;
        });
      return formData;
    }

    updateAdminStatus(data) {
      const statusElement = $('.api-status');
      const versionElement = $('.api-version');
      const lastCheckElement = $('.api-last-check');

      if (data.status) {
        statusElement
          .text(data.status.toUpperCase())
          .removeClass('ok error')
          .addClass(data.status === 'OK' ? 'ok' : 'error');
      }

      if (data.version) {
        versionElement.text(data.version);
      }

      lastCheckElement.text(new Date().toLocaleString());
    }

    updateStatistics(type, count) {
      const element = $(`.api-stat-${type}`);
      if (element.length) {
        element.text(count);
      }
    }

    showAdminNotification(message, type = 'info') {
      // Create admin notification
      const notification = $(`
                <div class="notice notice-${type} is-dismissible">
                    <p>${message}</p>
                    <button type="button" class="notice-dismiss">
                        <span class="screen-reader-text">Dismiss this notice.</span>
                    </button>
                </div>
            `);

      // Add to admin notices area
      $('.wrap h1').after(notification);

      // Auto-remove after 5 seconds
      setTimeout(() => {
        notification.fadeOut(() => notification.remove());
      }, 5000);

      // Manual dismiss
      notification.find('.notice-dismiss').on('click', () => {
        notification.fadeOut(() => notification.remove());
      });
    }

    // Utility method to export API data
    async exportApiData() {
      try {
        const response = await this.makeAjaxRequest(
          'custom_api_admin_export_data',
        );
        if (response.success) {
          // Create download link
          const blob = new Blob([JSON.stringify(response.data, null, 2)], {
            type: 'application/json',
          });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'custom-api-data.json';
          a.click();
          window.URL.revokeObjectURL(url);
        } else {
          this.showAdminNotification(
            'Export failed: ' + response.message,
            'error',
          );
        }
      } catch (error) {
        this.showAdminNotification('Export error: ' + error.message, 'error');
      }
    }
  }

  // Initialize when DOM is ready
  $(document).ready(() => {
    new CustomApiAdmin();
  });
})(jQuery);
