<?php

/**
 * Plugin Name: Custom REST API
 * Plugin URI: https://example.com/custom-rest-api
 * Description: A custom REST API built with TypeScript/Node.js functionality integrated into WordPress
 * Version: 1.0.0
 * Author: Your Name
 * License: MIT
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('CUSTOM_REST_API_VERSION', '1.0.0');
define('CUSTOM_REST_API_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('CUSTOM_REST_API_PLUGIN_URL', plugin_dir_url(__FILE__));

class CustomRestAPI
{

    public function __construct()
    {
        add_action('init', array($this, 'init'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));
        add_action('rest_api_init', array($this, 'register_rest_routes'));
        add_action('wp_ajax_custom_api_action', array($this, 'handle_ajax_request'));
        add_action('wp_ajax_nopriv_custom_api_action', array($this, 'handle_ajax_request'));
    }

    public function init()
    {
        // Load Node.js dependencies if available
        $this->load_node_dependencies();
    }

    public function enqueue_scripts()
    {
        // Enqueue CSS
        wp_enqueue_style(
            'custom-rest-api-style',
            CUSTOM_REST_API_PLUGIN_URL . 'assets/css/style.css',
            array(),
            CUSTOM_REST_API_VERSION
        );

        // Enqueue JavaScript
        wp_enqueue_script(
            'custom-rest-api-frontend',
            CUSTOM_REST_API_PLUGIN_URL . 'assets/js/frontend.js',
            array('jquery'),
            CUSTOM_REST_API_VERSION,
            true
        );

        wp_localize_script('custom-rest-api-frontend', 'customApiAjax', array(
            'ajaxurl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('custom_api_nonce'),
            'rest_url' => rest_url('custom-api/v1/')
        ));
    }

    public function enqueue_admin_scripts()
    {
        wp_enqueue_script(
            'custom-rest-api-admin',
            CUSTOM_REST_API_PLUGIN_URL . 'assets/js/admin.js',
            array('jquery'),
            CUSTOM_REST_API_VERSION,
            true
        );
    }

    public function register_rest_routes()
    {
        // Register REST API routes
        register_rest_route('custom-api/v1', '/health', array(
            'methods' => 'GET',
            'callback' => array($this, 'health_check'),
            'permission_callback' => '__return_true'
        ));

        register_rest_route('custom-api/v1', '/posts', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_posts'),
            'permission_callback' => '__return_true'
        ));

        register_rest_route('custom-api/v1', '/users', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_users'),
            'permission_callback' => '__return_true'
        ));

        register_rest_route('custom-api/v1', '/node-data', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_node_data'),
            'permission_callback' => '__return_true'
        ));

        register_rest_route('custom-api/v1', '/categories', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_categories'),
            'permission_callback' => '__return_true'
        ));

        register_rest_route('custom-api/v1', '/post/(?P<id>\d+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_single_post'),
            'permission_callback' => '__return_true'
        ));

        register_rest_route('custom-api/v1', '/stats', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_stats'),
            'permission_callback' => '__return_true'
        ));

        register_rest_route('custom-api/v1', '/search', array(
            'methods' => 'GET',
            'callback' => array($this, 'search_content'),
            'permission_callback' => '__return_true'
        ));
    }


    public function health_check($request)
    {
        $response = array(
            'status' => 'OK',
            'timestamp' => current_time('c'),
            'service' => 'WordPress Custom REST API',
            'version' => CUSTOM_REST_API_VERSION,
            'wordpress_version' => get_bloginfo('version'),
            'endpoint' => '/wp-json/custom-api/v1/health',
            'method' => 'GET'
        );

        return new WP_REST_Response($response, 200);
    }

    public function get_posts($request)
    {
        // Get query parameters
        $per_page = $request->get_param('per_page') ?: 10;
        $page = $request->get_param('page') ?: 1;
        $category = $request->get_param('category');
        $search = $request->get_param('search');

        // Build query args
        $args = array(
            'numberposts' => $per_page,
            'post_status' => 'publish',
            'offset' => ($page - 1) * $per_page
        );

        if ($category) {
            $args['category_name'] = $category;
        }

        if ($search) {
            $args['s'] = $search;
        }

        $posts = get_posts($args);
        $total_posts = wp_count_posts('post')->publish;

        $formatted_posts = array();
        foreach ($posts as $post) {
            $formatted_posts[] = array(
                'id' => $post->ID,
                'title' => $post->post_title,
                'content' => wp_strip_all_tags($post->post_content),
                'excerpt' => wp_strip_all_tags($post->post_excerpt ?: wp_trim_words($post->post_content, 55)),
                'author' => get_the_author_meta('display_name', $post->post_author),
                'author_id' => $post->post_author,
                'created_at' => $post->post_date,
                'modified_at' => $post->post_modified,
                'permalink' => get_permalink($post->ID),
                'featured_image' => get_the_post_thumbnail_url($post->ID, 'medium'),
                'categories' => wp_get_post_categories($post->ID, array('fields' => 'names')),
                'tags' => wp_get_post_tags($post->ID, array('fields' => 'names'))
            );
        }

        $response = array(
            'success' => true,
            'data' => $formatted_posts,
            'pagination' => array(
                'current_page' => (int)$page,
                'per_page' => (int)$per_page,
                'total_posts' => $total_posts,
                'total_pages' => ceil($total_posts / $per_page)
            ),
            'meta' => array(
                'endpoint' => '/wp-json/custom-api/v1/posts',
                'method' => 'GET',
                'timestamp' => current_time('c')
            )
        );

        return new WP_REST_Response($response, 200);
    }

    public function get_users($request)
    {
        // Get query parameters
        $per_page = $request->get_param('per_page') ?: 10;
        $page = $request->get_param('page') ?: 1;
        $role = $request->get_param('role');
        $search = $request->get_param('search');

        // Build query args
        $args = array(
            'number' => $per_page,
            'offset' => ($page - 1) * $per_page
        );

        if ($role) {
            $args['role'] = $role;
        }

        if ($search) {
            $args['search'] = '*' . $search . '*';
        }

        $users = get_users($args);
        $total_users = count_users()['total_users'];

        $formatted_users = array();
        foreach ($users as $user) {
            $formatted_users[] = array(
                'id' => $user->ID,
                'username' => $user->user_login,
                'email' => $user->user_email,
                'display_name' => $user->display_name,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'role' => implode(', ', $user->roles),
                'registered_date' => $user->user_registered,
                'avatar' => get_avatar_url($user->ID, array('size' => 96)),
                'profile_url' => get_author_posts_url($user->ID)
            );
        }

        $response = array(
            'success' => true,
            'data' => $formatted_users,
            'pagination' => array(
                'current_page' => (int)$page,
                'per_page' => (int)$per_page,
                'total_users' => $total_users,
                'total_pages' => ceil($total_users / $per_page)
            ),
            'meta' => array(
                'endpoint' => '/wp-json/custom-api/v1/users',
                'method' => 'GET',
                'timestamp' => current_time('c')
            )
        );

        return new WP_REST_Response($response, 200);
    }

    public function get_node_data($request)
    {
        // This endpoint simulates Node.js functionality
        $node_data = array(
            'success' => true,
            'data' => array(
                'message' => 'Node.js-like data from WordPress',
                'timestamp' => time(),
                'random_number' => rand(1, 1000),
                'server_info' => array(
                    'php_version' => PHP_VERSION,
                    'wordpress_version' => get_bloginfo('version'),
                    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
                    'memory_limit' => ini_get('memory_limit'),
                    'max_execution_time' => ini_get('max_execution_time')
                ),
                'wordpress_info' => array(
                    'site_title' => get_bloginfo('name'),
                    'site_description' => get_bloginfo('description'),
                    'site_url' => get_site_url(),
                    'admin_email' => get_option('admin_email'),
                    'timezone' => get_option('timezone_string'),
                    'date_format' => get_option('date_format'),
                    'time_format' => get_option('time_format')
                )
            ),
            'meta' => array(
                'endpoint' => '/wp-json/custom-api/v1/node-data',
                'method' => 'GET',
                'timestamp' => current_time('c')
            )
        );

        return new WP_REST_Response($node_data, 200);
    }

    public function get_categories($request)
    {
        $categories = get_categories(array(
            'hide_empty' => false,
            'orderby' => 'name',
            'order' => 'ASC'
        ));

        $formatted_categories = array();
        foreach ($categories as $category) {
            $formatted_categories[] = array(
                'id' => $category->term_id,
                'name' => $category->name,
                'slug' => $category->slug,
                'description' => $category->description,
                'count' => $category->count,
                'link' => get_category_link($category->term_id)
            );
        }

        $response = array(
            'success' => true,
            'data' => $formatted_categories,
            'meta' => array(
                'endpoint' => '/wp-json/custom-api/v1/categories',
                'method' => 'GET',
                'timestamp' => current_time('c'),
                'total_categories' => count($formatted_categories)
            )
        );

        return new WP_REST_Response($response, 200);
    }

    public function get_single_post($request)
    {
        $post_id = $request->get_param('id');
        $post = get_post($post_id);

        if (!$post || $post->post_status !== 'publish') {
            return new WP_Error(
                'post_not_found',
                'Post not found or not published',
                array('status' => 404)
            );
        }

        $response = array(
            'success' => true,
            'data' => array(
                'id' => $post->ID,
                'title' => $post->post_title,
                'content' => $post->post_content,
                'excerpt' => $post->post_excerpt ?: wp_trim_words($post->post_content, 55),
                'author' => get_the_author_meta('display_name', $post->post_author),
                'author_id' => $post->post_author,
                'created_at' => $post->post_date,
                'modified_at' => $post->post_modified,
                'permalink' => get_permalink($post->ID),
                'featured_image' => get_the_post_thumbnail_url($post->ID, 'full'),
                'categories' => wp_get_post_categories($post->ID, array('fields' => 'names')),
                'tags' => wp_get_post_tags($post->ID, array('fields' => 'names')),
                'comment_count' => $post->comment_count,
                'comment_status' => $post->comment_status
            ),
            'meta' => array(
                'endpoint' => '/wp-json/custom-api/v1/post/' . $post_id,
                'method' => 'GET',
                'timestamp' => current_time('c')
            )
        );

        return new WP_REST_Response($response, 200);
    }

    public function get_stats($request)
    {
        $stats = array(
            'posts' => array(
                'total' => wp_count_posts('post')->publish,
                'draft' => wp_count_posts('post')->draft,
                'pending' => wp_count_posts('post')->pending
            ),
            'pages' => array(
                'total' => wp_count_posts('page')->publish,
                'draft' => wp_count_posts('page')->draft
            ),
            'users' => count_users()['total_users'],
            'categories' => wp_count_terms('category'),
            'tags' => wp_count_terms('post_tag'),
            'comments' => array(
                'total' => wp_count_comments()->total_comments,
                'approved' => wp_count_comments()->approved,
                'pending' => wp_count_comments()->moderated
            )
        );

        $response = array(
            'success' => true,
            'data' => $stats,
            'meta' => array(
                'endpoint' => '/wp-json/custom-api/v1/stats',
                'method' => 'GET',
                'timestamp' => current_time('c')
            )
        );

        return new WP_REST_Response($response, 200);
    }

    public function search_content($request)
    {
        $query = $request->get_param('q');
        $type = $request->get_param('type') ?: 'post';
        $per_page = $request->get_param('per_page') ?: 10;
        $page = $request->get_param('page') ?: 1;

        if (!$query) {
            return new WP_Error(
                'missing_query',
                'Search query parameter "q" is required',
                array('status' => 400)
            );
        }

        $args = array(
            's' => $query,
            'post_type' => $type,
            'post_status' => 'publish',
            'posts_per_page' => $per_page,
            'paged' => $page
        );

        $search_query = new WP_Query($args);
        $results = array();

        if ($search_query->have_posts()) {
            while ($search_query->have_posts()) {
                $search_query->the_post();
                $post = get_post();
                
                $results[] = array(
                    'id' => $post->ID,
                    'title' => $post->post_title,
                    'excerpt' => wp_trim_words($post->post_content, 30),
                    'type' => $post->post_type,
                    'permalink' => get_permalink($post->ID),
                    'author' => get_the_author_meta('display_name', $post->post_author),
                    'created_at' => $post->post_date
                );
            }
        }

        wp_reset_postdata();

        $response = array(
            'success' => true,
            'data' => $results,
            'pagination' => array(
                'current_page' => (int)$page,
                'per_page' => (int)$per_page,
                'total_results' => $search_query->found_posts,
                'total_pages' => $search_query->max_num_pages
            ),
            'meta' => array(
                'endpoint' => '/wp-json/custom-api/v1/search',
                'method' => 'GET',
                'query' => $query,
                'type' => $type,
                'timestamp' => current_time('c')
            )
        );

        return new WP_REST_Response($response, 200);
    }

    public function handle_ajax_request()
    {
        // Verify nonce
        if (!wp_verify_nonce($_POST['nonce'], 'custom_api_nonce')) {
            wp_die('Security check failed');
        }

        $action = $_POST['action'] ?? '';
        $data = $_POST['data'] ?? array();

        switch ($action) {
            case 'custom_api_action':
                $response = array(
                    'success' => true,
                    'message' => 'AJAX request processed successfully',
                    'data' => $data,
                    'timestamp' => current_time('c')
                );
                break;
            default:
                $response = array(
                    'success' => false,
                    'message' => 'Unknown action'
                );
        }

        wp_send_json($response);
    }

    private function load_node_dependencies()
    {
        // Check if Node.js dependencies are available
        $package_json_path = CUSTOM_REST_API_PLUGIN_DIR . 'package.json';
        $node_modules_path = CUSTOM_REST_API_PLUGIN_DIR . 'node_modules';

        if (file_exists($package_json_path) && is_dir($node_modules_path)) {
            // Node.js dependencies are available
            add_action('wp_footer', array($this, 'load_node_scripts'));
        }
    }

    public function load_node_scripts()
    {
        // Load compiled Node.js scripts if available
        $dist_path = CUSTOM_REST_API_PLUGIN_DIR . 'dist/';
        if (is_dir($dist_path)) {
            $files = glob($dist_path . '*.js');
            foreach ($files as $file) {
                $filename = basename($file);
                wp_enqueue_script(
                    'custom-api-' . $filename,
                    CUSTOM_REST_API_PLUGIN_URL . 'dist/' . $filename,
                    array(),
                    CUSTOM_REST_API_VERSION,
                    true
                );
            }
        }
    }
}

// Initialize the plugin
new CustomRestAPI();

// Activation hook
register_activation_hook(__FILE__, 'custom_rest_api_activate');
function custom_rest_api_activate()
{
    // Create necessary database tables or options
    add_option('custom_rest_api_version', CUSTOM_REST_API_VERSION);
}

// Deactivation hook
register_deactivation_hook(__FILE__, 'custom_rest_api_deactivate');
function custom_rest_api_deactivate()
{
    // Cleanup if necessary
}
