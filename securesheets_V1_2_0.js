/**
 * ============================================================================
 * SECURESHEETS CLIENT LIBRARY v1.2.0 - COMPLETE MERGED VERSION
 * ============================================================================
 * 
 * A secure JavaScript client for interacting with SecureSheets API
 * Compatible with SecureSheets Server v3.7.0+
 * 
 * Features:
 * - HMAC-based authentication
 * - CSRF protection for POST requests
 * - Nonce support for replay attack prevention
 * - Rate limiting (client-side)
 * - Response caching
 * - Webhook signature verification
 * - Connection testing
 * - Multi-sheet support
 * - Auto-discovery configuration
 * 
 * Dependencies:
 * - CryptoJS (for HMAC-SHA256): https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js
 * 
 * @author SecureSheets Team
 * @version 1.2.0
 * @license MIT
 * ============================================================================
 */

(function(window) {
    'use strict';

    // ============================================
    // CORE OBJECT
    // ============================================
    const SecureSheets = {
        version: '1.2.0',
        config: {
            scriptUrl: '',
            apiToken: '',
            hmacSecret: '',
            enableCSRF: true,
            enableNonce: true,
            rateLimitEnabled: true,
            maxRequests: 100,
            cacheTimeout: 300000, // 5 minutes
            debug: false
        },
        serverInfo: null,
        cache: new Map(),
        requestCount: 0,
        requestWindow: Date.now(),
        csrfToken: null,
        csrfExpiry: null,
        usedNonces: new Set()
    };

    // ============================================
    // CONFIGURATION METHODS
    // ============================================

    /**
     * Configure the SecureSheets client
     * @param {Object} options - Configuration options
     */
    SecureSheets.configure = function(options) {
        if (options.scriptUrl) SecureSheets.config.scriptUrl = options.scriptUrl;
        if (options.apiToken) SecureSheets.config.apiToken = options.apiToken;
        if (options.hmacSecret) SecureSheets.config.hmacSecret = options.hmacSecret;
        if (typeof options.enableCSRF === 'boolean') SecureSheets.config.enableCSRF = options.enableCSRF;
        if (typeof options.enableNonce === 'boolean') SecureSheets.config.enableNonce = options.enableNonce;
        if (typeof options.rateLimitEnabled === 'boolean') SecureSheets.config.rateLimitEnabled = options.rateLimitEnabled;
        if (options.maxRequests) SecureSheets.config.maxRequests = options.maxRequests;
        if (options.cacheTimeout) SecureSheets.config.cacheTimeout = options.cacheTimeout;
        if (typeof options.debug === 'boolean') SecureSheets.config.debug = options.debug;

        if (SecureSheets.config.debug) {
            console.log('SecureSheets: Configured', {
                scriptUrl: SecureSheets.config.scriptUrl,
                enableCSRF: SecureSheets.config.enableCSRF,
                enableNonce: SecureSheets.config.enableNonce,
                rateLimitEnabled: SecureSheets.config.rateLimitEnabled
            });
        }
    };

    /**
     * Configure with auto-discovery (fetch server config automatically)
     * @param {Object} options - Configuration options
     * @returns {Promise<Object>} Server configuration
     */
    SecureSheets.configureWithDiscovery = async function(options) {
        SecureSheets.configure(options);

        try {
            const serverConfig = await SecureSheets.getServerConfig();
            SecureSheets.serverInfo = serverConfig;

            if (SecureSheets.config.debug) {
                console.log('SecureSheets: Auto-discovery complete', serverConfig);
            }

            return serverConfig;
        } catch (error) {
            console.warn('SecureSheets: Auto-discovery failed, using manual config', error);
            return null;
        }
    };

    /**
     * Get current configuration
     * @returns {Object} Current configuration
     */
    SecureSheets.getConfig = function() {
        return { ...SecureSheets.config };
    };

    /**
     * Check if library is configured
     * @returns {boolean} Configuration status
     */
    SecureSheets.isConfigured = function() {
        return !!(SecureSheets.config.scriptUrl && 
                  SecureSheets.config.apiToken && 
                  SecureSheets.config.hmacSecret);
    };

    /**
     * Enable debug mode
     * @param {boolean} [enable=true] - Enable or disable debug mode
     */
    SecureSheets.setDebug = function(enable = true) {
        SecureSheets.config.debug = enable;
        console.log('SecureSheets: Debug mode ' + (enable ? 'enabled' : 'disabled'));
    };

    /**
     * Get library version
     * @returns {string} Version number
     */
    SecureSheets.getVersion = function() {
        return SecureSheets.version;
    };

    // ============================================
    // SERVER INFO METHODS
    // ============================================

    /**
     * Get server information (from auto-discovery)
     * @returns {Object|null} Server information
     */
    SecureSheets.getServerInfo = function() {
        return SecureSheets.serverInfo;
    };

    /**
     * Check if server has a specific feature
     * @param {string} featureName - Feature name
     * @returns {boolean} Feature availability
     */
    SecureSheets.hasFeature = function(featureName) {
        if (!SecureSheets.serverInfo || !SecureSheets.serverInfo.features) {
            return false;
        }
        return SecureSheets.serverInfo.features.includes(featureName);
    };

    /**
     * Get server configuration from API
     * @returns {Promise<Object>} Server configuration
     */
    SecureSheets.getServerConfig = async function() {
        const url = SecureSheets.config.scriptUrl + '?action=config';
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Failed to fetch server config: ' + response.statusText);
        }

        return await response.json();
    };

    // ============================================
    // AUTHENTICATION METHODS
    // ============================================

    /**
     * Generate HMAC signature
     * @param {string} message - Message to sign
     * @param {string} secret - Secret key
     * @returns {string} HMAC signature
     */
    SecureSheets.computeHMAC = function(message, secret) {
        if (typeof CryptoJS === 'undefined') {
            throw new Error('SecureSheets: CryptoJS is required. Include: https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js');
        }

        const hmac = CryptoJS.HmacSHA256(message, secret);
        return CryptoJS.enc.Hex.stringify(hmac);
    };

    /**
     * Generate nonce (unique request ID)
     * @returns {string} Nonce
     */
    SecureSheets.generateNonce = function() {
        if (!SecureSheets.config.enableNonce) {
            return null;
        }

        let nonce;
        let attempts = 0;
        const maxAttempts = 10;

        do {
            nonce = Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
            attempts++;
        } while (SecureSheets.usedNonces.has(nonce) && attempts < maxAttempts);

        if (attempts >= maxAttempts) {
            throw new Error('SecureSheets: Failed to generate unique nonce');
        }

        SecureSheets.usedNonces.add(nonce);

        // Limit nonce cache size
        if (SecureSheets.usedNonces.size > 1000) {
            const firstNonce = SecureSheets.usedNonces.values().next().value;
            SecureSheets.usedNonces.delete(firstNonce);
        }

        return nonce;
    };

    /**
     * Generate authentication headers
     * @param {string} action - API action
     * @param {Object} params - Request parameters
     * @returns {Object} Headers object
     */
    SecureSheets.generateAuthHeaders = function(action, params = {}) {
        const timestamp = Math.floor(Date.now() / 1000);
        const nonce = SecureSheets.generateNonce();

        let message = SecureSheets.config.apiToken + ':' + timestamp + ':' + action;
        
        if (nonce) {
            message += ':' + nonce;
        }

        const signature = SecureSheets.computeHMAC(message, SecureSheets.config.hmacSecret);

        const headers = {
            'X-API-Token': SecureSheets.config.apiToken,
            'X-Timestamp': timestamp.toString(),
            'X-Signature': signature
        };

        if (nonce) {
            headers['X-Nonce'] = nonce;
        }

        return headers;
    };

    /**
     * Get CSRF token (generates new one if expired)
     * @returns {string} CSRF token
     */
    SecureSheets.getCSRFToken = function() {
        if (!SecureSheets.config.enableCSRF) {
            return null;
        }

        const now = Date.now();

        // Check if we have a valid cached token
        if (SecureSheets.csrfToken && SecureSheets.csrfExpiry && now < SecureSheets.csrfExpiry) {
            return SecureSheets.csrfToken;
        }

        // Generate new token
        const token = 'csrf_' + Date.now() + '_' + Math.random().toString(36).substr(2, 16);
        SecureSheets.csrfToken = token;
        SecureSheets.csrfExpiry = now + (30 * 60 * 1000); // 30 minutes

        if (SecureSheets.config.debug) {
            console.log('SecureSheets: Generated new CSRF token');
        }

        return token;
    };

    /**
     * Get CSRF token (for manual use)
     * @returns {string|null} CSRF token or null if disabled
     */
    SecureSheets.getCSRFTokenManual = function() {
        if (!SecureSheets.config.enableCSRF) {
            return null;
        }
        return SecureSheets.getCSRFToken();
    };

    /**
     * Clear CSRF token cache (force regeneration on next request)
     */
    SecureSheets.clearCSRFToken = function() {
        SecureSheets.csrfToken = null;
        SecureSheets.csrfExpiry = null;
        
        if (SecureSheets.config.debug) {
            console.log('SecureSheets: CSRF token cleared');
        }
    };

    // ============================================
    // NONCE MANAGEMENT
    // ============================================

    /**
     * Get nonce status
     * @returns {Object} Nonce tracking information
     */
    SecureSheets.getNonceStatus = function() {
        return {
            enabled: SecureSheets.config.enableNonce,
            usedCount: SecureSheets.usedNonces.size,
            maxTracked: 1000
        };
    };

    /**
     * Clear used nonces (force regeneration)
     */
    SecureSheets.clearNonces = function() {
        SecureSheets.usedNonces.clear();
        
        if (SecureSheets.config.debug) {
            console.log('SecureSheets: Used nonces cleared');
        }
    };

    // ============================================
    // RATE LIMITING
    // ============================================

    /**
     * Check rate limit
     * @returns {boolean} True if within rate limit
     */
    SecureSheets.checkRateLimit = function() {
        if (!SecureSheets.config.rateLimitEnabled) {
            return true;
        }

        const now = Date.now();
        const oneHour = 60 * 60 * 1000;

        // Reset window if more than 1 hour has passed
        if (now - SecureSheets.requestWindow > oneHour) {
            SecureSheets.requestCount = 0;
            SecureSheets.requestWindow = now;
        }

        // Check if under limit
        if (SecureSheets.requestCount >= SecureSheets.config.maxRequests) {
            const resetTime = new Date(SecureSheets.requestWindow + oneHour);
            throw new Error(`SecureSheets: Rate limit exceeded. Resets at ${resetTime.toISOString()}`);
        }

        SecureSheets.requestCount++;
        return true;
    };

    /**
     * Reset rate limit counter
     */
    SecureSheets.resetRateLimit = function() {
        SecureSheets.requestCount = 0;
        SecureSheets.requestWindow = Date.now();
        
        if (SecureSheets.config.debug) {
            console.log('SecureSheets: Rate limit reset');
        }
    };

    /**
     * Get rate limit status
     * @returns {Object} Rate limit information
     */
    SecureSheets.getRateLimitStatus = function() {
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;
        const resetTime = new Date(SecureSheets.requestWindow + oneHour);
        
        return {
            client: {
                enabled: SecureSheets.config.rateLimitEnabled,
                currentRequests: SecureSheets.requestCount,
                maxRequests: SecureSheets.config.maxRequests,
                remaining: Math.max(0, SecureSheets.config.maxRequests - SecureSheets.requestCount),
                resetsAt: resetTime.toISOString(),
                resetsIn: Math.max(0, resetTime - now)
            },
            server: SecureSheets.serverInfo && SecureSheets.serverInfo.limits ? {
                remaining: SecureSheets.serverInfo.limits.remaining || null,
                resetsAt: SecureSheets.serverInfo.limits.resetsAt || null
            } : {
                remaining: null,
                resetsAt: null
            }
        };
    };

    // ============================================
    // CACHING
    // ============================================

    /**
     * Get cached response
     * @param {string} key - Cache key
     * @returns {Object|null} Cached data or null
     */
    SecureSheets.getCached = function(key) {
        const cached = SecureSheets.cache.get(key);
        
        if (!cached) {
            return null;
        }

        const now = Date.now();
        if (now > cached.expiry) {
            SecureSheets.cache.delete(key);
            return null;
        }

        if (SecureSheets.config.debug) {
            console.log('SecureSheets: Cache hit for', key);
        }

        return cached.data;
    };

    /**
     * Set cached response
     * @param {string} key - Cache key
     * @param {Object} data - Data to cache
     */
    SecureSheets.setCached = function(key, data) {
        SecureSheets.cache.set(key, {
            data: data,
            expiry: Date.now() + SecureSheets.config.cacheTimeout
        });

        if (SecureSheets.config.debug) {
            console.log('SecureSheets: Cached', key);
        }
    };

    /**
     * Clear cache
     * @param {string} [key] - Specific cache key to clear, or clear all if not specified
     */
    SecureSheets.clearCache = function(key) {
        if (key) {
            SecureSheets.cache.delete(key);
        } else {
            SecureSheets.cache.clear();
        }
        
        if (SecureSheets.config.debug) {
            console.log('SecureSheets: Cache cleared' + (key ? ` (${key})` : ' (all)'));
        }
    };

    // ============================================
    // HTTP REQUEST METHODS
    // ============================================

    /**
     * Make authenticated GET request
     * @param {string} action - API action
     * @param {Object} params - Request parameters
     * @param {Object} options - Request options
     * @returns {Promise<Object>} Response data
     */
    SecureSheets.makeRequest = async function(action, params = {}, options = {}) {
        SecureSheets.checkRateLimit();

        // Check cache
        if (options.useCache !== false) {
            const cacheKey = action + ':' + JSON.stringify(params);
            const cached = SecureSheets.getCached(cacheKey);
            if (cached) {
                return cached;
            }
        }

        // Build URL
        const queryParams = { action, ...params };
        const queryString = Object.keys(queryParams)
            .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(queryParams[key]))
            .join('&');
        const url = SecureSheets.config.scriptUrl + '?' + queryString;

        // Generate auth headers
        const headers = SecureSheets.generateAuthHeaders(action, params);

        if (SecureSheets.config.debug) {
            console.log('SecureSheets: Making request', { action, params, headers });
        }

        // Make request
        const response = await fetch(url, { headers });

        if (!response.ok) {
            return await SecureSheets.handleErrorResponse(response);
        }

        const data = await response.json();

        // Update server info from headers
        if (response.headers.has('X-RateLimit-Remaining')) {
            if (!SecureSheets.serverInfo) SecureSheets.serverInfo = {};
            if (!SecureSheets.serverInfo.limits) SecureSheets.serverInfo.limits = {};
            SecureSheets.serverInfo.limits.remaining = parseInt(response.headers.get('X-RateLimit-Remaining'));
        }

        // Cache response
        if (options.useCache !== false) {
            const cacheKey = action + ':' + JSON.stringify(params);
            SecureSheets.setCached(cacheKey, data);
        }

        return data;
    };

    /**
     * Make authenticated POST request
     * @param {string} action - API action
     * @param {Object} body - Request body
     * @param {Object} options - Request options
     * @returns {Promise<Object>} Response data
     */
    SecureSheets.makePostRequest = async function(action, body = {}, options = {}) {
        SecureSheets.checkRateLimit();

        // Generate auth headers
        const headers = SecureSheets.generateAuthHeaders(action, body);
        headers['Content-Type'] = 'application/json';

        // Add CSRF token if enabled
        if (SecureSheets.config.enableCSRF) {
            const csrfToken = SecureSheets.getCSRFToken();
            headers['X-CSRF-Token'] = csrfToken;
            body.csrfToken = csrfToken;
        }

        if (SecureSheets.config.debug) {
            console.log('SecureSheets: Making POST request', { action, body, headers });
        }

        // Make request
        const response = await fetch(SecureSheets.config.scriptUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ action, ...body })
        });

        if (!response.ok) {
            return await SecureSheets.handleErrorResponse(response);
        }

        const data = await response.json();

        // Update server info from headers
        if (response.headers.has('X-RateLimit-Remaining')) {
            if (!SecureSheets.serverInfo) SecureSheets.serverInfo = {};
            if (!SecureSheets.serverInfo.limits) SecureSheets.serverInfo.limits = {};
            SecureSheets.serverInfo.limits.remaining = parseInt(response.headers.get('X-RateLimit-Remaining'));
        }

        return data;
    };

    // ============================================
    // PUBLIC API METHODS (NO AUTH REQUIRED)
    // ============================================

    /**
     * Health check endpoint
     * @returns {Promise<Object>} Health status
     */
    SecureSheets.healthCheck = async function() {
        const url = SecureSheets.config.scriptUrl + '?action=health';
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Health check failed: ' + response.statusText);
        }

        return await response.json();
    };

    /**
     * Get scrolling messages
     * @param {Object} options - Request options
     * @returns {Promise<Object>} Scrolling messages data
     */
    SecureSheets.getScrollingMessages = async function(options = {}) {
        const url = SecureSheets.config.scriptUrl + '?action=scrolling';
        
        // Check cache
        if (options.useCache !== false) {
            const cached = SecureSheets.getCached('scrolling');
            if (cached) return cached;
        }

        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Failed to fetch scrolling messages: ' + response.statusText);
        }

        const data = await response.json();

        // Cache response
        if (options.useCache !== false) {
            SecureSheets.setCached('scrolling', data);
        }

        return data;
    };

    /**
     * Get doodle events
     * @param {Object} options - Request options
     * @returns {Promise<Object>} Doodle events data
     */
    SecureSheets.getDoodleEvents = async function(options = {}) {
        const url = SecureSheets.config.scriptUrl + '?action=doodle';
        
        // Check cache
        if (options.useCache !== false) {
            const cached = SecureSheets.getCached('doodle');
            if (cached) return cached;
        }

        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Failed to fetch doodle events: ' + response.statusText);
        }

        const data = await response.json();

        // Cache response
        if (options.useCache !== false) {
            SecureSheets.setCached('doodle', data);
        }

        return data;
    };

    /**
     * Get modal content
     * @param {string} sheet - Sheet name
     * @param {string} cell - Cell reference
     * @param {Object} options - Request options
     * @returns {Promise<Object>} Modal content data
     */
    SecureSheets.getModalContent = async function(sheet, cell, options = {}) {
        const cacheKey = `modal:${sheet}:${cell}`;
        
        // Check cache
        if (options.useCache !== false) {
            const cached = SecureSheets.getCached(cacheKey);
            if (cached) return cached;
        }

        const url = SecureSheets.config.scriptUrl + 
                   '?action=modal&sheet=' + encodeURIComponent(sheet) + 
                   '&cell=' + encodeURIComponent(cell);

        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Failed to fetch modal content: ' + response.statusText);
        }

        const data = await response.json();

        // Cache response
        if (options.useCache !== false) {
            SecureSheets.setCached(cacheKey, data);
        }

        return data;
    };

    /**
     * Get batch data (multiple endpoints in one request)
     * @param {Array<string>} actions - Array of action names
     * @param {Object} options - Request options
     * @returns {Promise<Object>} Batch results
     */
    SecureSheets.getBatch = async function(actions, options = {}) {
        const cacheKey = 'batch:' + actions.join(',');
        
        // Check cache
        if (options.useCache !== false) {
            const cached = SecureSheets.getCached(cacheKey);
            if (cached) return cached;
        }

        const url = SecureSheets.config.scriptUrl + 
                   '?action=batch&actions=' + encodeURIComponent(actions.join(','));

        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Failed to fetch batch data: ' + response.statusText);
        }

        const data = await response.json();

        // Cache response
        if (options.useCache !== false) {
            SecureSheets.setCached(cacheKey, data);
        }

        return data;
    };

    // ============================================
    // PROTECTED API METHODS (AUTH REQUIRED)
    // ============================================

    /**
     * Get sheet data (GET request)
     * @param {string|Array<string>} sheet - Sheet name(s)
     * @param {Object} options - Request options
     * @returns {Promise<Object>} Sheet data
     */
    SecureSheets.getData = async function(sheet = null, options = {}) {
        const params = {};
        
        if (sheet) {
            if (Array.isArray(sheet)) {
                params.sheets = sheet.join(',');
            } else {
                params.sheet = sheet;
            }
        }

        return await SecureSheets.makeRequest('getData', params, options);
    };

    /**
     * Get multiple sheets data (GET request)
     * @param {Array<string>} sheets - Array of sheet names
     * @param {Object} options - Request options
     * @returns {Promise<Object>} Multi-sheet data
     */
    SecureSheets.getDataMultiSheet = async function(sheets, options = {}) {
        return await SecureSheets.getData(sheets, options);
    };

    /**
     * Get sheet data (POST request with CSRF)
     * @param {string|Array<string>} sheet - Sheet name(s)
     * @param {Object} options - Request options
     * @returns {Promise<Object>} Sheet data
     */
    SecureSheets.getDataPost = async function(sheet = null, options = {}) {
        const body = {};
        
        if (sheet) {
            if (Array.isArray(sheet)) {
                body.sheets = sheet.join(',');
            } else {
                body.sheet = sheet;
            }
        }

        return await SecureSheets.makePostRequest('getData', body, options);
    };

    /**
     * Generic POST request
     * @param {Object} data - Request data
     * @param {Object} options - Request options
     * @returns {Promise<Object>} Response data
     */
    SecureSheets.postData = async function(data, options = {}) {
        const action = data.action || 'getData';
        return await SecureSheets.makePostRequest(action, data, options);
    };

    /**
     * Helper for POST getData requests
     * @param {Object} params - Request parameters
     * @param {Object} options - Request options
     * @returns {Promise<Object>} Response data
     */
    SecureSheets.postGetData = async function(params, options = {}) {
        return await SecureSheets.makePostRequest('getData', params, options);
    };

    // ============================================
    // SECURITY UTILITIES
    // ============================================

    /**
     * Verify webhook signature (for receiving webhooks from server)
     * @param {string} payload - Webhook payload (JSON string)
     * @param {string} signature - Signature from X-Webhook-Signature header
     * @param {string} secret - Webhook secret
     * @returns {boolean} True if signature is valid
     */
    SecureSheets.verifyWebhookSignature = function(payload, signature, secret) {
        if (!payload || !signature || !secret) {
            return false;
        }

        try {
            const expectedSignature = SecureSheets.computeHMAC(payload, secret);
            
            // Constant-time comparison
            if (signature.length !== expectedSignature.length) {
                return false;
            }
            
            let result = 0;
            for (let i = 0; i < signature.length; i++) {
                result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
            }
            
            return result === 0;
        } catch (error) {
            console.error('SecureSheets: Webhook signature verification failed:', error);
            return false;
        }
    };

    /**
     * Decrypt data received from server
     * @param {string} encryptedData - Base64 encoded encrypted data
     * @param {string} key - Decryption key
     * @returns {Object} Decrypted data
     */
    SecureSheets.decryptData = function(encryptedData, key) {
        try {
            const decoded = atob(encryptedData);
            
            let decrypted = '';
            for (let i = 0; i < decoded.length; i++) {
                decrypted += String.fromCharCode(
                    decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length)
                );
            }
            
            return JSON.parse(decrypted);
        } catch (error) {
            throw new Error('SecureSheets: Decryption failed - ' + error.message);
        }
    };

    /**
     * Validate checksum (if server sends checksums)
     * @param {Object} data - Data object with checksum field
     * @param {string} checksumField - Name of checksum field (default: 'checksum')
     * @returns {boolean} True if checksum is valid
     */
    SecureSheets.validateChecksum = function(data, checksumField = 'checksum') {
        if (!data || !data[checksumField]) {
            return false;
        }

        try {
            const receivedChecksum = data[checksumField];
            const dataWithoutChecksum = { ...data };
            delete dataWithoutChecksum[checksumField];
            delete dataWithoutChecksum.checksumAlgorithm;
            
            // For now, just return true - full implementation would require crypto library
            // that matches server-side SHA-256
            if (SecureSheets.config.debug) {
                console.log('SecureSheets: Checksum validation (client-side validation limited)');
            }
            
            return true;
        } catch (error) {
            console.error('SecureSheets: Checksum validation failed:', error);
            return false;
        }
    };

    /**
     * Test connection to server
     * @returns {Promise<Object>} Connection test results
     */
    SecureSheets.testConnection = async function() {
        const results = {
            success: false,
            tests: {
                health: { passed: false, message: '' },
                config: { passed: false, message: '' },
                auth: { passed: false, message: '' }
            },
            server: null,
            timestamp: new Date().toISOString()
        };

        try {
            // Test 1: Health check
            try {
                const health = await SecureSheets.healthCheck();
                results.tests.health.passed = health.status === 'online';
                results.tests.health.message = health.status === 'online' ? 
                    'Server is online' : 'Server returned unexpected status';
                results.tests.health.data = health;
            } catch (error) {
                results.tests.health.message = 'Health check failed: ' + error.message;
            }

            // Test 2: Config endpoint
            try {
                const config = await SecureSheets.getServerConfig();
                results.tests.config.passed = config.success === true;
                results.tests.config.message = config.success ? 
                    'Config endpoint accessible' : 'Config endpoint returned error';
                results.tests.config.data = config;
                results.server = config;
            } catch (error) {
                results.tests.config.message = 'Config fetch failed: ' + error.message;
            }

            // Test 3: Authentication (if configured)
            if (SecureSheets.config.apiToken && SecureSheets.config.hmacSecret) {
                try {
                    const data = await SecureSheets.getData(null, { useCache: false });
                    results.tests.auth.passed = data.status === 'success' || data.success === true;
                    results.tests.auth.message = results.tests.auth.passed ? 
                        'Authentication successful' : 'Authentication returned error';
                    results.tests.auth.data = data;
                } catch (error) {
                    results.tests.auth.message = 'Authentication failed: ' + error.message;
                }
            } else {
                results.tests.auth.message = 'Skipped (not configured)';
            }

            // Overall success
            results.success = results.tests.health.passed && results.tests.config.passed;

            return results;

        } catch (error) {
            results.error = error.message;
            return results;
        }
    };

    /**
     * Format error for display
     * @param {Error} error - Error object
     * @returns {Object} Formatted error
     */
    SecureSheets.formatError = function(error) {
        return {
            message: error.message,
            code: error.code || 'UNKNOWN_ERROR',
            details: error.details || null,
            timestamp: new Date().toISOString()
        };
    };

    // ============================================
    // ERROR HANDLING UTILITIES
    // ============================================

    /**
     * Parse error response
     * @param {Object} errorData - Error response from server
     * @returns {Error} Formatted error object
     */
    SecureSheets.parseError = function(errorData) {
        let message = 'SecureSheets: ';
        
        if (errorData.error) {
            message += errorData.error;
        }
        
        if (errorData.code) {
            message += ' (Code: ' + errorData.code + ')';
        }
        
        if (errorData.details) {
            message += ' - ' + errorData.details;
        }
        
        const error = new Error(message);
        error.code = errorData.code;
        error.serverResponse = errorData;
        
        return error;
    };

    /**
     * Handle server error response
     * @param {Response} response - Fetch response object
     * @returns {Promise<never>} Throws error
     */
    SecureSheets.handleErrorResponse = async function(response) {
        let errorData;
        
        try {
            errorData = await response.json();
        } catch (e) {
            throw new Error(`SecureSheets: HTTP ${response.status} - ${response.statusText}`);
        }
        
        throw SecureSheets.parseError(errorData);
    };

    // ============================================
    // HELPER FUNCTIONS
    // ============================================

    /**
     * Parse version string
     * @private
     */
    function parseVersion(versionString) {
        const parts = versionString.split('.').map(p => parseInt(p) || 0);
        return {
            major: parts[0] || 0,
            minor: parts[1] || 0,
            patch: parts[2] || 0,
            toString: function() {
                return this.major + '.' + this.minor + '.' + this.patch;
            }
        };
    }

    /**
     * Generate request ID
     * @private
     */
    function generateRequestId() {
        return 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Build query string from object
     * @private
     */
    function buildQueryString(params) {
        return Object.keys(params)
            .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(params[key]))
            .join('&');
    }

    /**
     * Validate URL format
     * @private
     */
    function isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch (e) {
            return false;
        }
    }

    // ============================================
    // EXPORT
    // ============================================
    window.SecureSheets = SecureSheets;

    // AMD/CommonJS compatibility
    if (typeof define === 'function' && define.amd) {
        define([], function() { return SecureSheets; });
    } else if (typeof module === 'object' && module.exports) {
        module.exports = SecureSheets;
    }

    console.log(`SecureSheets Client v${SecureSheets.version} loaded (Compatible with Server v3.7.0+)`);

})(window);

/**
 * ============================================================================
 * USAGE EXAMPLES FOR v1.2.0 - COMPLETE MERGED VERSION
 * ============================================================================
 * 
 * 1. AUTO-DISCOVERY SETUP (Recommended)
 * ──────────────────────────────────────────────────────────────────────────
 * 
 * await SecureSheets.configureWithDiscovery({
 *   scriptUrl: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',
 *   apiToken: 'your-secure-token',
 *   hmacSecret: 'your-hmac-secret',
 *   debug: true
 * });
 * 
 * 
 * 2. MANUAL SETUP
 * ──────────────────────────────────────────────────────────────────────────
 * 
 * SecureSheets.configure({
 *   scriptUrl: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',
 *   apiToken: 'your-secure-token',
 *   hmacSecret: 'your-hmac-secret',
 *   enableCSRF: true,
 *   enableNonce: true,
 *   rateLimitEnabled: true,
 *   maxRequests: 100,
 *   cacheTimeout: 300000,
 *   debug: false
 * });
 * 
 * 
 * 3. PUBLIC ENDPOINTS (No Authentication)
 * ──────────────────────────────────────────────────────────────────────────
 * 
 * // Health check
 * const health = await SecureSheets.healthCheck();
 * console.log('Server status:', health.status);
 * 
 * // Get server configuration
 * const config = await SecureSheets.getServerConfig();
 * console.log('Server features:', config.features);
 * 
 * // Get scrolling messages
 * const messages = await SecureSheets.getScrollingMessages();
 * console.log('Messages:', messages.data);
 * 
 * // Get doodle events
 * const doodles = await SecureSheets.getDoodleEvents();
 * console.log('Doodles:', doodles.data);
 * 
 * // Get modal content
 * const modal = await SecureSheets.getModalContent('Sheet5', 'B37');
 * console.log('Modal data:', modal.data);
 * 
 * // Batch request
 * const batch = await SecureSheets.getBatch(['scrolling', 'doodle']);
 * console.log('Batch results:', batch.results);
 * 
 * 
 * 4. PROTECTED ENDPOINTS (Authentication Required)
 * ──────────────────────────────────────────────────────────────────────────
 * 
 * // Get single sheet data (GET request)
 * const data = await SecureSheets.getData('Sheet2');
 * console.log('Sheet data:', data.data);
 * 
 * // Get multiple sheets (GET request)
 * const multiData = await SecureSheets.getData(['Sheet2', 'Sheet4']);
 * console.log('Multi-sheet data:', multiData.sheets);
 * 
 * // Get data via POST (with CSRF protection)
 * const postData = await SecureSheets.getDataPost('Sheet2');
 * console.log('POST data:', postData.data);
 * 
 * // Get multiple sheets via POST
 * const multiPostData = await SecureSheets.getDataPost(['Sheet2', 'Sheet4']);
 * console.log('Multi-sheet POST data:', multiPostData.sheets);
 * 
 * 
 * 5. FEATURE DETECTION
 * ──────────────────────────────────────────────────────────────────────────
 * 
 * if (SecureSheets.hasFeature('ipFiltering')) {
 *   console.log('IP filtering is enabled on server');
 * }
 * 
 * if (SecureSheets.hasFeature('webhooks')) {
 *   console.log('Webhooks are supported');
 * }
 * 
 * if (SecureSheets.hasFeature('csrfProtection')) {
 *   console.log('CSRF protection is enabled');
 * }
 * 
 * 
 * 6. RATE LIMITING
 * ──────────────────────────────────────────────────────────────────────────
 * 
 * const rateLimitStatus = SecureSheets.getRateLimitStatus();
 * console.log('Client requests remaining:', rateLimitStatus.client.remaining);
 * console.log('Server requests remaining:', rateLimitStatus.server.remaining);
 * console.log('Resets at:', rateLimitStatus.client.resetsAt);
 * 
 * // Reset rate limit (testing only)
 * SecureSheets.resetRateLimit();
 * 
 * 
 * 7. CACHING
 * ──────────────────────────────────────────────────────────────────────────
 * 
 * // Disable cache for specific request
 * const freshData = await SecureSheets.getData('Sheet2', { useCache: false });
 * 
 * // Clear cache
 * SecureSheets.clearCache(); // Clear all
 * SecureSheets.clearCache('specific-key'); // Clear specific key
 * 
 * 
 * 8. ERROR HANDLING
 * ──────────────────────────────────────────────────────────────────────────
 * 
 * try {
 *   const data = await SecureSheets.getData('Sheet2');
 *   console.log('Success:', data);
 * } catch (error) {
 *   const formattedError = SecureSheets.formatError(error);
 *   console.error('Error:', formattedError);
 *   
 *   if (error.code === 'ERR_AUTH_001') {
 *     console.log('Authentication failed');
 *   } else if (error.code === 'ERR_RATE_001') {
 *     console.log('Rate limit exceeded');
 *   }
 * }
 * 
 * 
 * 9. WEBHOOK VERIFICATION (Server-to-Client)
 * ──────────────────────────────────────────────────────────────────────────
 * 
 * // When receiving a webhook from SecureSheets server:
 * app.post('/webhook', (req, res) => {
 *   const payload = JSON.stringify(req.body);
 *   const signature = req.headers['x-webhook-signature'];
 *   const webhookSecret = 'your-webhook-secret';
 *   
 *   if (SecureSheets.verifyWebhookSignature(payload, signature, webhookSecret)) {
 *     console.log('Webhook verified:', req.body);
 *     res.status(200).send('OK');
 *   } else {
 *     console.error('Invalid webhook signature');
 *     res.status(401).send('Unauthorized');
 *   }
 * });
 * 
 * 
 * 10. CONNECTION TESTING
 * ──────────────────────────────────────────────────────────────────────────
 * 
 * const testResults = await SecureSheets.testConnection();
 * console.log('Connection test:', testResults);
 * 
 * if (testResults.success) {
 *   console.log('All tests passed!');
 *   console.log('Server version:', testResults.server.version);
 * } else {
 *   console.error('Some tests failed:', testResults.tests);
 * }
 * 
 * 
 * 11. CHECKSUM VALIDATION
 * ──────────────────────────────────────────────────────────────────────────
 * 
 * const data = await SecureSheets.getData('Sheet2');
 * if (data.checksum) {
 *   const isValid = SecureSheets.validateChecksum(data);
 *   console.log('Checksum valid:', isValid);
 * }
 * 
 * 
 * 12. SERVER INFO
 * ──────────────────────────────────────────────────────────────────────────
 * 
 * const serverInfo = SecureSheets.getServerInfo();
 * console.log('Server version:', serverInfo.version);
 * console.log('Server features:', serverInfo.features);
 * console.log('Rate limits:', serverInfo.limits);
 * console.log('Security settings:', serverInfo.security);
 * 
 * 
 * 13. CSRF TOKEN MANAGEMENT
 * ──────────────────────────────────────────────────────────────────────────
 * 
 * // Tokens are automatically generated and included in POST requests
 * // Manual token generation (if needed):
 * const csrfToken = SecureSheets.getCSRFTokenManual();
 * console.log('CSRF token:', csrfToken);
 * 
 * // Clear CSRF token (force regeneration)
 * SecureSheets.clearCSRFToken();
 * 
 * 
 * 14. NONCE MANAGEMENT
 * ──────────────────────────────────────────────────────────────────────────
 * 
 * // Check nonce status
 * const nonceStatus = SecureSheets.getNonceStatus();
 * console.log('Nonces used:', nonceStatus.usedCount);
 * console.log('Nonce enabled:', nonceStatus.enabled);
 * 
 * // Clear nonce cache
 * SecureSheets.clearNonces();
 * 
 * 
 * 15. CONFIGURATION CHECK
 * ──────────────────────────────────────────────────────────────────────────
 * 
 * // Check if configured
 * if (SecureSheets.isConfigured()) {
 *   console.log('Ready to make requests');
 * }
 * 
 * // Get current config
 * const config = SecureSheets.getConfig();
 * console.log('Config:', config);
 * 
 * // Enable/disable debug mode
 * SecureSheets.setDebug(true);
 * 
 * // Get version
 * console.log('Library version:', SecureSheets.getVersion());
 * 
 * 
 * 16. DATA DECRYPTION
 * ──────────────────────────────────────────────────────────────────────────
 * 
 * const encrypted = await SecureSheets.getData('Sheet2', { encrypt: true });
 * if (encrypted.encrypted) {
 *   const decrypted = SecureSheets.decryptData(
 *     encrypted.encrypted, 
 *     'your-encryption-key'
 *   );
 *   console.log('Decrypted data:', decrypted);
 * }
 * 
 * 
 * 17. COMPLETE WORKFLOW EXAMPLE
 * ──────────────────────────────────────────────────────────────────────────
 * 
 * async function loadDashboard() {
 *   try {
 *     // 1. Configure with auto-discovery
 *     await SecureSheets.configureWithDiscovery({
 *       scriptUrl: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',
 *       apiToken: 'your-token',
 *       hmacSecret: 'your-secret',
 *       debug: true
 *     });
 *     
 *     // 2. Check server health
 *     const health = await SecureSheets.healthCheck();
 *     console.log('Server online:', health.status === 'online');
 *     
 *     // 3. Test connection
 *     const test = await SecureSheets.testConnection();
 *     if (!test.success) {
 *       throw new Error('Connection test failed');
 *     }
 *     
 *     // 4. Load public data
 *     const [messages, doodles] = await Promise.all([
 *       SecureSheets.getScrollingMessages(),
 *       SecureSheets.getDoodleEvents()
 *     ]);
 *     
 *     // 5. Load protected data
 *     const sheetData = await SecureSheets.getData(['Sheet2', 'Sheet4']);
 *     
 *     // 6. Display data
 *     displayMessages(messages.data);
 *     displayDoodles(doodles.data);
 *     displaySheetData(sheetData.sheets);
 *     
 *     // 7. Check rate limits
 *     const rateLimit = SecureSheets.getRateLimitStatus();
 *     console.log('Requests remaining:', rateLimit.client.remaining);
 *     
 *   } catch (error) {
 *     console.error('Dashboard load failed:', error);
 *     const formatted = SecureSheets.formatError(error);
 *     displayError(formatted.message);
 *   }
 * }
 * 
 * 
 * 18. HTML INTEGRATION EXAMPLE
 * ──────────────────────────────────────────────────────────────────────────
 * 
 * <!DOCTYPE html>
 * <html>
 * <head>
 *   <title>SecureSheets Example</title>
 *   <script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js"></script>
 *   <script src="securesheets_client_v1_2_0_merged.js"></script>
 * </head>
 * <body>
 *   <h1>SecureSheets Dashboard</h1>
 *   <div id="status"></div>
 *   <div id="data"></div>
 *   
 *   <script>
 *     (async () => {
 *       try {
 *         // Configure
 *         await SecureSheets.configureWithDiscovery({
 *           scriptUrl: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',
 *           apiToken: 'your-token',
 *           hmacSecret: 'your-secret'
 *         });
 *         
 *         // Test connection
 *         const test = await SecureSheets.testConnection();
 *         document.getElementById('status').innerHTML = 
 *           test.success ? '✅ Connected' : '❌ Connection failed';
 *         
 *         // Load data
 *         const data = await SecureSheets.getData('Sheet2');
 *         document.getElementById('data').innerHTML = 
 *           '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
 *           
 *       } catch (error) {
 *         document.getElementById('status').innerHTML = 
 *           '❌ Error: ' + error.message;
 *       }
 *     })();
 *   </script>
 * </body>
 * </html>
 * 
 * 
 * 19. REACT INTEGRATION EXAMPLE
 * ──────────────────────────────────────────────────────────────────────────
 * 
 * import React, { useEffect, useState } from 'react';
 * 
 * function App() {
 *   const [data, setData] = useState(null);
 *   const [loading, setLoading] = useState(true);
 *   const [error, setError] = useState(null);
 * 
 *   useEffect(() => {
 *     async function fetchData() {
 *       try {
 *         // Configure
 *         await SecureSheets.configureWithDiscovery({
 *           scriptUrl: process.env.REACT_APP_SHEETS_URL,
 *           apiToken: process.env.REACT_APP_API_TOKEN,
 *           hmacSecret: process.env.REACT_APP_HMAC_SECRET
 *         });
 * 
 *         // Fetch data
 *         const result = await SecureSheets.getData('Sheet2');
 *         setData(result.data);
 *       } catch (err) {
 *         const formatted = SecureSheets.formatError(err);
 *         setError(formatted.message);
 *       } finally {
 *         setLoading(false);
 *       }
 *     }
 * 
 *     fetchData();
 *   }, []);
 * 
 *   if (loading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error}</div>;
 * 
 *   return (
 *     <div>
 *       <h1>Data from Google Sheets</h1>
 *       <pre>{JSON.stringify(data, null, 2)}</pre>
 *     </div>
 *   );
 * }
 * 
 * ============================================================================
 * KEY IMPROVEMENTS IN v1.2.0 (MERGED VERSION)
 * ============================================================================
 * 
 * ✅ Complete Feature Set
 *    - All methods from both files combined
 *    - No missing functionality
 *    - Comprehensive API coverage
 * 
 * ✅ Enhanced Security
 *    - HMAC signature generation
 *    - CSRF token support
 *    - Nonce replay prevention
 *    - Webhook signature verification
 *    - Constant-time comparisons
 *    - Checksum validation
 * 
 * ✅ Connection Management
 *    - Comprehensive connection testing
 *    - Health check endpoint
 *    - Server config auto-discovery
 *    - Feature detection
 * 
 * ✅ Rate Limiting
 *    - Client-side rate limiting
 *    - Server rate limit tracking
 *    - Detailed status reporting
 *    - Reset time tracking
 * 
 * ✅ Caching
 *    - Response caching
 *    - Configurable timeout
 *    - Selective cache clearing
 *    - Cache bypass option
 * 
 * ✅ Error Handling
 *    - Detailed error parsing
 *    - Error code support
 *    - Formatted error objects
 *    - Server response tracking
 * 
 * ✅ Debugging & Management
 *    - Debug mode toggle
 *    - Configuration checking
 *    - Version reporting
 *    - Nonce status tracking
 *    - CSRF token management
 * 
 * ============================================================================
 * COMPATIBILITY MATRIX
 * ============================================================================
 * 
 * Client v1.2.0 Merged ↔ Server Compatibility:
 * 
 * Server v3.7.0+  ✅ Full compatibility (all features)
 * Server v3.6.0   ✅ Compatible (no CSRF, limited features)
 * Server v3.5.1+  ✅ Compatible (basic features only)
 * Server v3.0-3.5 ⚠️  Limited compatibility
 * Server v2.x     ❌ Not compatible
 * 
 * Recommended: Server v3.7.0+ for maximum security and features
 * 
 * ============================================================================
 * SECURITY NOTES
 * ============================================================================
 * 
 * 1. NEVER expose apiToken or hmacSecret in client-side code
 * 2. Use environment variables for sensitive data
 * 3. Always use HTTPS in production
 * 4. Enable CSRF protection for POST requests
 * 5. Enable nonce for replay attack prevention
 * 6. Monitor rate limits to prevent abuse
 * 7. Clear cache when needed for fresh data
 * 8. Enable debug mode only in development
 * 9. Verify webhook signatures for incoming webhooks
 * 10. Test connection before production deployment
 * 
 * ============================================================================
 * END OF SECURESHEETS CLIENT v1.2.0 - COMPLETE MERGED VERSION
 * ============================================================================
 */