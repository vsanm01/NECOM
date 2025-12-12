/**
 * SecureSheets Client Library
 * Version: 3.8.1
 * 
 * A client-side library for making secure requests to SecureSheets v3.8.1 API
 * with comprehensive security features and domain validation support.
 * 
 * Dependencies: CryptoJS (for HMAC-SHA256)
 * - Include before this script: https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js
 * 
 * Compatible with: SecureSheets v3.8.1 Security Enhanced Edition
 * 
 * NEW IN v3.8.1 CLIENT:
 * - Automatic origin parameter injection for all endpoints
 * - Support for domain-restricted public endpoints
 * - Enhanced error handling for domain validation failures
 * - Multi-sheet request support
 * - CSRF token support for POST requests
 * - Improved validation and error messages
 */

(function(window) {
    'use strict';

    // ============================================
    // SECURESHEETS CLIENT NAMESPACE
    // ============================================
    const SecureSheetsClient = {
        version: '3.8.1',
        config: {
            scriptUrl: null,
            apiToken: null,
            hmacSecret: null,
            rateLimitEnabled: true,
            maxRequests: 100,
            checksumValidation: true,
            enforceHttps: true,
            autoOrigin: true,  // NEW: Automatically include origin parameter
            csrfProtection: true,  // NEW: CSRF token support
            debug: false
        },
        
        // Request counter for client-side rate limiting
        requestCount: 0,
        requestWindow: Date.now(),
        
        // CSRF token cache
        csrfToken: null
    };

    // ============================================
    // CONFIGURATION METHOD
    // ============================================
    /**
     * Configure the SecureSheets Client settings
     * @param {Object} options - Configuration options
     * @param {string} options.scriptUrl - Google Apps Script Web App URL
     * @param {string} options.apiToken - API authentication token (for protected endpoints)
     * @param {string} options.hmacSecret - HMAC secret key (for protected endpoints)
     * @param {boolean} [options.rateLimitEnabled=true] - Enable rate limiting
     * @param {number} [options.maxRequests=100] - Maximum requests per hour
     * @param {boolean} [options.checksumValidation=true] - Enable checksum validation
     * @param {boolean} [options.enforceHttps=true] - Enforce HTTPS connections
     * @param {boolean} [options.autoOrigin=true] - Automatically include origin parameter
     * @param {boolean} [options.csrfProtection=true] - Enable CSRF protection for POST
     * @param {boolean} [options.debug=false] - Enable debug logging
     */
    SecureSheetsClient.configure = function(options) {
        if (!options) {
            throw new Error('SecureSheetsClient: Configuration options are required');
        }

        // Required field validation
        if (!options.scriptUrl) {
            throw new Error('SecureSheetsClient: scriptUrl is required');
        }

        // Validate HTTPS if enforced
        if (options.enforceHttps !== false && !options.scriptUrl.startsWith('https://')) {
            throw new Error('SecureSheetsClient: scriptUrl must use HTTPS');
        }

        // Merge configuration
        Object.assign(SecureSheetsClient.config, options);

        if (SecureSheetsClient.config.debug) {
            console.log('SecureSheetsClient: Configuration loaded successfully', {
                scriptUrl: SecureSheetsClient.config.scriptUrl,
                rateLimitEnabled: SecureSheetsClient.config.rateLimitEnabled,
                maxRequests: SecureSheetsClient.config.maxRequests,
                autoOrigin: SecureSheetsClient.config.autoOrigin,
                csrfProtection: SecureSheetsClient.config.csrfProtection
            });
        }

        return SecureSheetsClient;
    };

    // ============================================
    // HMAC COMPUTATION
    // ============================================
    /**
     * Compute HMAC-SHA256 signature
     * @param {string} message - Message to sign
     * @param {string} secret - Secret key
     * @returns {string} HMAC signature in hex format
     */
    SecureSheetsClient.computeHMAC = function(message, secret) {
        if (typeof CryptoJS === 'undefined') {
            throw new Error('SecureSheetsClient: CryptoJS library is required. Include https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js');
        }

        if (!message || !secret) {
            throw new Error('SecureSheetsClient: Message and secret are required for HMAC computation');
        }

        return CryptoJS.HmacSHA256(message, secret).toString();
    };

    // ============================================
    // SIGNATURE CREATION
    // ============================================
    /**
     * Create a signature from request parameters
     * @param {Object} params - Request parameters (without signature)
     * @param {string} secret - HMAC secret key
     * @returns {string} Generated signature
     */
    SecureSheetsClient.createSignature = function(params, secret) {
        if (!params || typeof params !== 'object') {
            throw new Error('SecureSheetsClient: Parameters must be a valid object');
        }

        // Sort keys alphabetically for consistent signature
        const sortedKeys = Object.keys(params).sort();
        
        // Build signature string: key1=value1&key2=value2...
        const signatureString = sortedKeys
            .map(key => `${key}=${params[key]}`)
            .join('&');

        if (SecureSheetsClient.config.debug) {
            console.log('SecureSheetsClient: Signature string:', signatureString);
        }

        return SecureSheetsClient.computeHMAC(signatureString, secret);
    };

    // ============================================
    // CSRF TOKEN GENERATION (NEW in v3.8.1)
    // ============================================
    /**
     * Generate CSRF token for POST requests
     * @param {string} origin - Request origin
     * @param {string} secret - HMAC secret
     * @returns {string} CSRF token
     */
    SecureSheetsClient.generateCSRFToken = function(origin, secret) {
        const timestamp = Date.now();
        const signature = SecureSheetsClient.computeHMAC(timestamp + ':' + origin, secret);
        return timestamp + ':' + signature;
    };

    // ============================================
    // RATE LIMITING CHECK
    // ============================================
    /**
     * Check if request is within rate limits
     * @returns {boolean} True if within limits
     * @throws {Error} If rate limit exceeded
     */
    SecureSheetsClient.checkRateLimit = function() {
        if (!SecureSheetsClient.config.rateLimitEnabled) {
            return true;
        }

        const now = Date.now();
        const oneHour = 60 * 60 * 1000;

        // Reset counter if window has passed
        if (now - SecureSheetsClient.requestWindow > oneHour) {
            SecureSheetsClient.requestCount = 0;
            SecureSheetsClient.requestWindow = now;
        }

        // Check limit
        if (SecureSheetsClient.requestCount >= SecureSheetsClient.config.maxRequests) {
            const resetTime = new Date(SecureSheetsClient.requestWindow + oneHour);
            throw new Error(`SecureSheetsClient: Rate limit exceeded. Resets at ${resetTime.toLocaleTimeString()}`);
        }

        SecureSheetsClient.requestCount++;
        return true;
    };

    // ============================================
    // ORIGIN DETECTION (NEW in v3.8.1)
    // ============================================
    /**
     * Get current origin for domain validation
     * @returns {string} Current origin
     */
    SecureSheetsClient.getOrigin = function() {
        return window.location.origin || 
               (window.location.protocol + '//' + window.location.host);
    };

    // ============================================
    // PUBLIC ENDPOINT REQUEST (NEW in v3.8.1)
    // ============================================
    /**
     * Make a request to public/domain-restricted endpoints
     * These endpoints don't require HMAC but need origin validation
     * 
     * @param {Object} params - Request parameters
     * @param {string} params.type - Endpoint type (scrolling, doodle, modal, batch, config, health)
     * @param {string} [params.sheet] - Sheet name (for modal endpoint)
     * @param {string} [params.range] - Cell range (for modal endpoint)
     * @param {string} [params.requests] - Comma-separated request types (for batch endpoint)
     * @param {string} [params.callback] - JSONP callback name
     * @param {Object} [options] - Additional request options
     * @returns {Promise<Object>} API response
     */
    SecureSheetsClient.makePublicRequest = async function(params, options = {}) {
        // Validate configuration
        if (!SecureSheetsClient.config.scriptUrl) {
            throw new Error('SecureSheetsClient: API not configured. Call SecureSheetsClient.configure() first.');
        }

        // Validate parameters
        if (!params || typeof params !== 'object') {
            throw new Error('SecureSheetsClient: Request parameters must be an object');
        }

        if (!params.type) {
            throw new Error('SecureSheetsClient: "type" parameter is required for public endpoints');
        }

        try {
            // Check rate limit
            SecureSheetsClient.checkRateLimit();

            // Clone params to avoid mutation
            const requestParams = { ...params };

            // NEW v3.8.1: Automatically add origin for domain validation
            if (SecureSheetsClient.config.autoOrigin) {
                requestParams.origin = SecureSheetsClient.getOrigin();
                requestParams.referrer = window.location.href;
            }

            // Build URL with query parameters
            const url = new URL(SecureSheetsClient.config.scriptUrl);
            Object.keys(requestParams).forEach(key => {
                url.searchParams.append(key, requestParams[key]);
            });

            if (SecureSheetsClient.config.debug) {
                console.log('SecureSheetsClient: Making public request to:', url.toString());
                console.log('SecureSheetsClient: Parameters:', requestParams);
            }

            // Setup fetch options
            const fetchOptions = {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    ...options.headers
                }
            };

            // Add timeout support
            const timeout = options.timeout || 30000;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            fetchOptions.signal = controller.signal;

            // Make request
            const response = await fetch(url, fetchOptions);
            clearTimeout(timeoutId);

            // Check HTTP status
            if (!response.ok) {
                throw new Error(`SecureSheetsClient: HTTP error! Status: ${response.status} ${response.statusText}`);
            }

            // Parse response
            const data = await response.json();

            if (SecureSheetsClient.config.debug) {
                console.log('SecureSheetsClient: Response received:', data);
            }

            // Check for API errors
            if (data.error) {
                throw new Error(`SecureSheetsClient: ${data.error} (Code: ${data.code || 'UNKNOWN'})`);
            }

            return data;

        } catch (error) {
            // Handle specific error types
            if (error.name === 'AbortError') {
                throw new Error('SecureSheetsClient: Request timeout');
            }

            console.error('SecureSheetsClient: Request error:', error);
            throw error;
        }
    };

    // ============================================
    // PROTECTED ENDPOINT REQUEST
    // ============================================
    /**
     * Make a secure API request with HMAC authentication (for protected endpoints)
     * 
     * @param {Object} params - Request parameters
     * @param {string} params.action - API action to perform (getData, etc.)
     * @param {string} [params.sheet] - Sheet name for single sheet request
     * @param {string} [params.sheets] - Comma-separated sheet names for multi-sheet request
     * @param {Object} [options] - Additional request options
     * @param {number} [options.timeout=30000] - Request timeout in milliseconds
     * @param {Object} [options.headers] - Additional headers
     * @returns {Promise<Object>} API response
     */
    SecureSheetsClient.makeProtectedRequest = async function(params, options = {}) {
        // Validate configuration
        if (!SecureSheetsClient.config.scriptUrl || 
            !SecureSheetsClient.config.apiToken || 
            !SecureSheetsClient.config.hmacSecret) {
            throw new Error('SecureSheetsClient: Protected endpoint requires scriptUrl, apiToken, and hmacSecret. Call SecureSheetsClient.configure() first.');
        }

        // Validate parameters
        if (!params || typeof params !== 'object') {
            throw new Error('SecureSheetsClient: Request parameters must be an object');
        }

        if (!params.action) {
            throw new Error('SecureSheetsClient: "action" parameter is required');
        }

        try {
            // Check rate limit
            SecureSheetsClient.checkRateLimit();

            // Clone params to avoid mutation
            const requestParams = { ...params };

            // Add authentication and metadata
            requestParams.token = SecureSheetsClient.config.apiToken;
            requestParams.timestamp = new Date().toISOString();  // ISO format for token expiration
            requestParams.origin = SecureSheetsClient.getOrigin();
            requestParams.referrer = window.location.href;

            // Generate HMAC signature (signature must be last, after all other params)
            requestParams.signature = SecureSheetsClient.createSignature(
                requestParams, 
                SecureSheetsClient.config.hmacSecret
            );

            // Build URL with query parameters
            const url = new URL(SecureSheetsClient.config.scriptUrl);
            Object.keys(requestParams).forEach(key => {
                url.searchParams.append(key, requestParams[key]);
            });

            if (SecureSheetsClient.config.debug) {
                console.log('SecureSheetsClient: Making protected request to:', url.toString());
                console.log('SecureSheetsClient: Parameters:', requestParams);
            }

            // Setup fetch options
            const fetchOptions = {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    ...options.headers
                }
            };

            // Add timeout support
            const timeout = options.timeout || 30000;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            fetchOptions.signal = controller.signal;

            // Make request
            const response = await fetch(url, fetchOptions);
            clearTimeout(timeoutId);

            // Check HTTP status
            if (!response.ok) {
                throw new Error(`SecureSheetsClient: HTTP error! Status: ${response.status} ${response.statusText}`);
            }

            // Parse response
            const data = await response.json();

            if (SecureSheetsClient.config.debug) {
                console.log('SecureSheetsClient: Response received:', data);
            }

            // Check API response status
            if (data.status === 'success') {
                // Validate checksum if enabled and present
                if (SecureSheetsClient.config.checksumValidation && data.checksum) {
                    if (!SecureSheetsClient.validateChecksum(data)) {
                        throw new Error('SecureSheetsClient: Data integrity check failed (checksum mismatch)');
                    }
                }
                return data;
            } else {
                throw new Error(data.message || data.error || 'SecureSheetsClient: Request failed');
            }

        } catch (error) {
            // Handle specific error types
            if (error.name === 'AbortError') {
                throw new Error('SecureSheetsClient: Request timeout');
            }

            console.error('SecureSheetsClient: Request error:', error);
            throw error;
        }
    };

    // ============================================
    // POST REQUEST (NEW in v3.8.1)
    // ============================================
    /**
     * Make a POST request with CSRF protection
     * 
     * @param {Object} data - Request data
     * @param {string} data.action - API action to perform
     * @param {string} [data.sheet] - Sheet name
     * @param {string} [data.sheets] - Comma-separated sheet names
     * @param {Object} [options] - Additional request options
     * @returns {Promise<Object>} API response
     */
    SecureSheetsClient.makePostRequest = async function(data, options = {}) {
        // Validate configuration
        if (!SecureSheetsClient.config.scriptUrl || 
            !SecureSheetsClient.config.apiToken || 
            !SecureSheetsClient.config.hmacSecret) {
            throw new Error('SecureSheetsClient: POST request requires scriptUrl, apiToken, and hmacSecret.');
        }

        try {
            // Check rate limit
            SecureSheetsClient.checkRateLimit();

            // Prepare request data
            const requestData = {
                ...data,
                token: SecureSheetsClient.config.apiToken,
                timestamp: new Date().toISOString()
            };

            // Prepare headers
            const headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options.headers
            };

            // Add CSRF token if enabled
            if (SecureSheetsClient.config.csrfProtection) {
                const origin = SecureSheetsClient.getOrigin();
                const csrfToken = SecureSheetsClient.generateCSRFToken(
                    origin, 
                    SecureSheetsClient.config.hmacSecret
                );
                headers['X-CSRF-Token'] = csrfToken;
            }

            if (SecureSheetsClient.config.debug) {
                console.log('SecureSheetsClient: Making POST request');
                console.log('SecureSheetsClient: Data:', requestData);
            }

            // Setup fetch options
            const fetchOptions = {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestData)
            };

            // Add timeout support
            const timeout = options.timeout || 30000;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            fetchOptions.signal = controller.signal;

            // Add origin as query parameter
            const url = new URL(SecureSheetsClient.config.scriptUrl);
            url.searchParams.append('origin', SecureSheetsClient.getOrigin());

            // Make request
            const response = await fetch(url, fetchOptions);
            clearTimeout(timeoutId);

            // Check HTTP status
            if (!response.ok) {
                throw new Error(`SecureSheetsClient: HTTP error! Status: ${response.status} ${response.statusText}`);
            }

            // Parse response
            const responseData = await response.json();

            if (SecureSheetsClient.config.debug) {
                console.log('SecureSheetsClient: Response received:', responseData);
            }

            // Check API response
            if (responseData.status === 'success') {
                return responseData;
            } else {
                throw new Error(responseData.message || responseData.error || 'POST request failed');
            }

        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('SecureSheetsClient: Request timeout');
            }
            console.error('SecureSheetsClient: POST request error:', error);
            throw error;
        }
    };

    // ============================================
    // CONVENIENCE METHODS - PUBLIC ENDPOINTS
    // ============================================

    /**
     * Get health status (no authentication required)
     * @returns {Promise<Object>} Health check response
     */
    SecureSheetsClient.getHealth = async function() {
        return SecureSheetsClient.makePublicRequest({ type: 'health' });
    };

    /**
     * Get API configuration (no authentication required)
     * @returns {Promise<Object>} Configuration response
     */
    SecureSheetsClient.getConfig = async function() {
        return SecureSheetsClient.makePublicRequest({ type: 'config' });
    };

    /**
     * Get scrolling messages (requires domain validation)
     * @param {string} [callback] - JSONP callback name
     * @returns {Promise<Object>} Scrolling messages
     */
    SecureSheetsClient.getScrollingMessages = async function(callback) {
        const params = { type: 'scrolling' };
        if (callback) params.callback = callback;
        return SecureSheetsClient.makePublicRequest(params);
    };

    /**
     * Get doodle events (requires domain validation)
     * @param {string} [callback] - JSONP callback name
     * @returns {Promise<Object>} Doodle events
     */
    SecureSheetsClient.getDoodleEvents = async function(callback) {
        const params = { type: 'doodle' };
        if (callback) params.callback = callback;
        return SecureSheetsClient.makePublicRequest(params);
    };

    /**
     * Get modal content (requires domain validation)
     * @param {string} sheet - Sheet name (Sheet5 or Sheet6)
     * @param {string} range - Cell range (e.g., "B37" or "A1:C10")
     * @param {string} [callback] - JSONP callback name
     * @returns {Promise<Object>} Modal content
     */
    SecureSheetsClient.getModalContent = async function(sheet, range, callback) {
        const params = { 
            type: 'modal',
            sheet: sheet,
            range: range
        };
        if (callback) params.callback = callback;
        return SecureSheetsClient.makePublicRequest(params);
    };

    /**
     * Get batch data (requires domain validation)
     * @param {string[]} requests - Array of request types ['scrolling', 'doodle']
     * @param {string} [callback] - JSONP callback name
     * @returns {Promise<Object>} Batch response
     */
    SecureSheetsClient.getBatchData = async function(requests, callback) {
        const params = { 
            type: 'batch',
            requests: requests.join(',')
        };
        if (callback) params.callback = callback;
        return SecureSheetsClient.makePublicRequest(params);
    };

    // ============================================
    // CONVENIENCE METHODS - PROTECTED ENDPOINTS
    // ============================================

    /**
     * Get data from a single sheet (requires HMAC authentication)
     * @param {string} sheet - Sheet name
     * @param {Object} [additionalParams] - Additional parameters
     * @returns {Promise<Object>} Sheet data
     */
    SecureSheetsClient.getSheetData = async function(sheet, additionalParams = {}) {
        return SecureSheetsClient.makeProtectedRequest({
            action: 'getData',
            sheet: sheet,
            ...additionalParams
        });
    };

    /**
     * Get data from multiple sheets (requires HMAC authentication)
     * @param {string[]} sheets - Array of sheet names
     * @param {Object} [additionalParams] - Additional parameters
     * @returns {Promise<Object>} Multi-sheet data
     */
    SecureSheetsClient.getMultiSheetData = async function(sheets, additionalParams = {}) {
        return SecureSheetsClient.makeProtectedRequest({
            action: 'getData',
            sheets: sheets.join(','),
            ...additionalParams
        });
    };

    /**
     * Get data via POST request (requires HMAC + CSRF)
     * @param {string} sheet - Sheet name
     * @param {Object} [additionalParams] - Additional parameters
     * @returns {Promise<Object>} Sheet data
     */
    SecureSheetsClient.postGetSheetData = async function(sheet, additionalParams = {}) {
        return SecureSheetsClient.makePostRequest({
            action: 'getData',
            sheet: sheet,
            ...additionalParams
        });
    };

    /**
     * Get multiple sheets via POST request (requires HMAC + CSRF)
     * @param {string[]} sheets - Array of sheet names
     * @param {Object} [additionalParams] - Additional parameters
     * @returns {Promise<Object>} Multi-sheet data
     */
    SecureSheetsClient.postGetMultiSheetData = async function(sheets, additionalParams = {}) {
        return SecureSheetsClient.makePostRequest({
            action: 'getData',
            sheets: sheets,
            ...additionalParams
        });
    };

    // ============================================
    // VALIDATION METHODS
    // ============================================

    /**
     * Validate data checksum
     * @param {Object} data - Response data with checksum
     * @returns {boolean} True if checksum is valid
     */
    SecureSheetsClient.validateChecksum = function(data) {
        if (!data.checksum || !data.data) {
            return false;
        }

        try {
            // Compute checksum of the data
            const jsonString = JSON.stringify(data.data);
            const hash = CryptoJS.SHA256(jsonString).toString();
            
            return hash === data.checksum;
        } catch (error) {
            console.error('SecureSheetsClient: Checksum validation error:', error);
            return false;
        }
    };

    // ============================================
    // UTILITY METHODS
    // ============================================

    /**
     * Get current configuration (without sensitive data)
     * @returns {Object} Public configuration
     */
    SecureSheetsClient.getClientConfig = function() {
        return {
            scriptUrl: SecureSheetsClient.config.scriptUrl,
            rateLimitEnabled: SecureSheetsClient.config.rateLimitEnabled,
            maxRequests: SecureSheetsClient.config.maxRequests,
            checksumValidation: SecureSheetsClient.config.checksumValidation,
            enforceHttps: SecureSheetsClient.config.enforceHttps,
            autoOrigin: SecureSheetsClient.config.autoOrigin,
            csrfProtection: SecureSheetsClient.config.csrfProtection,
            debug: SecureSheetsClient.config.debug,
            version: SecureSheetsClient.version,
            currentOrigin: SecureSheetsClient.getOrigin()
        };
    };

    /**
     * Reset rate limit counter
     */
    SecureSheetsClient.resetRateLimit = function() {
        SecureSheetsClient.requestCount = 0;
        SecureSheetsClient.requestWindow = Date.now();
        
        if (SecureSheetsClient.config.debug) {
            console.log('SecureSheetsClient: Rate limit counter reset');
        }
    };

    /**
     * Get current rate limit status
     * @returns {Object} Rate limit status
     */
    SecureSheetsClient.getRateLimitStatus = function() {
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;
        const resetTime = new Date(SecureSheetsClient.requestWindow + oneHour);
        
        return {
            enabled: SecureSheetsClient.config.rateLimitEnabled,
            currentRequests: SecureSheetsClient.requestCount,
            maxRequests: SecureSheetsClient.config.maxRequests,
            remaining: Math.max(0, SecureSheetsClient.config.maxRequests - SecureSheetsClient.requestCount),
            resetsAt: resetTime.toISOString(),
            resetsIn: Math.max(0, resetTime - now)
        };
    };

    /**
     * Test connection to API
     * @returns {Promise<Object>} Test results
     */
    SecureSheetsClient.testConnection = async function() {
        const results = {
            configured: false,
            health: false,
            config: false,
            origin: SecureSheetsClient.getOrigin(),
            errors: []
        };

        // Check configuration
        if (SecureSheetsClient.config.scriptUrl) {
            results.configured = true;
        } else {
            results.errors.push('Not configured. Call configure() first.');
            return results;
        }

        // Test health endpoint
        try {
            const health = await SecureSheetsClient.getHealth();
            if (health.status === 'online') {
                results.health = true;
                results.healthData = health;
            }
        } catch (error) {
            results.errors.push('Health check failed: ' + error.message);
        }

        // Test config endpoint
        try {
            const config = await SecureSheetsClient.getConfig();
            if (config.success) {
                results.config = true;
                results.configData = config;
            }
        } catch (error) {
            results.errors.push('Config fetch failed: ' + error.message);
        }

        return results;
    };

    // ============================================
    // EXPORT TO WINDOW
    // ============================================
    window.SecureSheetsClient = SecureSheetsClient;

    // AMD/CommonJS compatibility
    if (typeof define === 'function' && define.amd) {
        define([], function() { return SecureSheetsClient; });
    } else if (typeof module === 'object' && module.exports) {
        module.exports = SecureSheetsClient;
    }

    // Log initialization
    if (typeof console !== 'undefined') {
        console.log(`SecureSheetsClient v${SecureSheetsClient.version} loaded successfully`);
    }

})(window);
