/**
 * ============================================================================
 * SECURESHEETS CLIENT LIBRARY v1.3.0 - COMPLETE VERSION
 * Compatible with SecureSheets Server v3.9.0
 * ============================================================================
 * 
 * A secure JavaScript client for interacting with SecureSheets API
 * 
 * Dependencies:
 * - CryptoJS (for HMAC-SHA256): 
 *   https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js
 * 
 * @version 1.3.0
 * @license MIT
 * ============================================================================
 */

(function(window) {
    'use strict';

    // ============================================
    // CORE OBJECT
    // ============================================
    const SecureSheets = {
        version: '1.3.0',
        serverVersion: '3.9.0',
        config: {
            scriptUrl: '',
            apiToken: '',
            hmacSecret: '',
            origin: '',
            enableCSRF: true,
            rateLimitEnabled: true,
            maxRequests: 100,
            cacheTimeout: 300000, // 5 minutes
            debug: false
        },
        serverInfo: null,
        cache: new Map(),
        requestCount: 0,
        requestWindow: Date.now()
    };

    // ============================================
    // CONFIGURATION
    // ============================================

    SecureSheets.configure = function(options) {
        if (options.scriptUrl) this.config.scriptUrl = options.scriptUrl;
        if (options.apiToken) this.config.apiToken = options.apiToken;
        if (options.hmacSecret) this.config.hmacSecret = options.hmacSecret;
        if (options.origin) this.config.origin = options.origin;
        if (typeof options.enableCSRF === 'boolean') this.config.enableCSRF = options.enableCSRF;
        if (typeof options.rateLimitEnabled === 'boolean') this.config.rateLimitEnabled = options.rateLimitEnabled;
        if (options.maxRequests) this.config.maxRequests = options.maxRequests;
        if (options.cacheTimeout) this.config.cacheTimeout = options.cacheTimeout;
        if (typeof options.debug === 'boolean') this.config.debug = options.debug;

        if (this.config.debug) {
            console.log('SecureSheets v1.3.0 configured:', {
                scriptUrl: this.config.scriptUrl,
                origin: this.config.origin,
                enableCSRF: this.config.enableCSRF
            });
        }
    };

    SecureSheets.configureWithDiscovery = async function(options) {
        this.configure(options);
        try {
            const serverConfig = await this.getServerConfig();
            this.serverInfo = serverConfig;
            if (this.config.debug) {
                console.log('Auto-discovery complete:', serverConfig);
            }
            return serverConfig;
        } catch (error) {
            console.warn('Auto-discovery failed:', error);
            return null;
        }
    };

    SecureSheets.isConfigured = function() {
        return !!(this.config.scriptUrl && this.config.apiToken && this.config.hmacSecret);
    };

    // ============================================
    // HMAC & SIGNATURES
    // ============================================

    SecureSheets.computeHMAC = function(message, secret) {
        if (typeof CryptoJS === 'undefined') {
            throw new Error('CryptoJS required. Include: https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js');
        }
        const hmac = CryptoJS.HmacSHA256(message, secret);
        return CryptoJS.enc.Hex.stringify(hmac);
    };

    SecureSheets.generateSignature = function(params) {
        const sortedKeys = Object.keys(params).sort();
        const signatureString = sortedKeys
            .map(key => key + '=' + String(params[key] || ''))
            .join('&');
        return this.computeHMAC(signatureString, this.config.hmacSecret);
    };

    // ============================================
    // RATE LIMITING
    // ============================================

    SecureSheets.checkRateLimit = function() {
        if (!this.config.rateLimitEnabled) return true;

        const now = Date.now();
        const oneHour = 60 * 60 * 1000;

        if (now - this.requestWindow > oneHour) {
            this.requestCount = 0;
            this.requestWindow = now;
        }

        if (this.requestCount >= this.config.maxRequests) {
            const resetTime = new Date(this.requestWindow + oneHour);
            throw new Error(`Rate limit exceeded. Resets at ${resetTime.toISOString()}`);
        }

        this.requestCount++;
        return true;
    };

    SecureSheets.resetRateLimit = function() {
        this.requestCount = 0;
        this.requestWindow = Date.now();
    };

    // ============================================
    // CACHING
    // ============================================

    SecureSheets.getCached = function(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;

        const now = Date.now();
        if (now > cached.expiry) {
            this.cache.delete(key);
            return null;
        }

        if (this.config.debug) {
            console.log('Cache hit:', key);
        }
        return cached.data;
    };

    SecureSheets.setCached = function(key, data) {
        this.cache.set(key, {
            data: data,
            expiry: Date.now() + this.config.cacheTimeout
        });
    };

    SecureSheets.clearCache = function(key) {
        if (key) {
            this.cache.delete(key);
        } else {
            this.cache.clear();
        }
    };

    // ============================================
    // HTTP REQUESTS
    // ============================================

    function buildUrl(params) {
        const queryParams = new URLSearchParams();
        for (const key in params) {
            if (params.hasOwnProperty(key) && params[key] !== null && params[key] !== undefined) {
                queryParams.append(key, params[key]);
            }
        }
        return SecureSheets.config.scriptUrl + '?' + queryParams.toString();
    }

    SecureSheets.makeRequest = async function(params = {}, options = {}) {
        this.checkRateLimit();

        params.token = this.config.apiToken;
        if (this.config.origin) {
            params.origin = this.config.origin;
        }
        params.timestamp = new Date().toISOString();

        // Check cache
        if (options.useCache !== false) {
            const cacheKey = JSON.stringify(params);
            const cached = this.getCached(cacheKey);
            if (cached) return cached;
        }

        // Generate signature
        params.signature = this.generateSignature(params);

        const url = buildUrl(params);

        if (this.config.debug) {
            console.log('Making request:', params);
        }

        const response = await fetch(url);

        if (!response.ok) {
            const errorData = await response.json();
            throw this.parseError(errorData);
        }

        const data = await response.json();

        // Cache response
        if (options.useCache !== false) {
            const cacheKey = JSON.stringify(params);
            this.setCached(cacheKey, data);
        }

        return data;
    };

    // ============================================
    // PUBLIC ENDPOINTS
    // ============================================

    SecureSheets.healthCheck = async function() {
        const url = this.config.scriptUrl + '?type=health';
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Health check failed: ' + response.statusText);
        }
        return await response.json();
    };

    SecureSheets.getServerConfig = async function() {
        const params = { type: 'config' };
        if (this.config.origin) {
            params.origin = this.config.origin;
        }
        const url = buildUrl(params);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch config: ' + response.statusText);
        }
        return await response.json();
    };

    SecureSheets.getScrollingMessages = async function(options = {}) {
        const params = { type: 'scrolling' };
        if (this.config.origin) {
            params.origin = this.config.origin;
        }
        
        const cacheKey = 'scrolling';
        if (options.useCache !== false) {
            const cached = this.getCached(cacheKey);
            if (cached) return cached;
        }

        const url = buildUrl(params);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch scrolling messages');
        }

        const data = await response.json();
        if (options.useCache !== false) {
            this.setCached(cacheKey, data);
        }
        return data;
    };

    SecureSheets.getDoodleEvents = async function(options = {}) {
        const params = { type: 'doodle' };
        if (this.config.origin) {
            params.origin = this.config.origin;
        }
        
        const cacheKey = 'doodle';
        if (options.useCache !== false) {
            const cached = this.getCached(cacheKey);
            if (cached) return cached;
        }

        const url = buildUrl(params);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch doodle events');
        }

        const data = await response.json();
        if (options.useCache !== false) {
            this.setCached(cacheKey, data);
        }
        return data;
    };

    SecureSheets.getModalContent = async function(sheet, range, options = {}) {
        const params = {
            type: 'modal',
            sheet: sheet,
            range: range
        };
        
        if (this.config.origin) {
            params.origin = this.config.origin;
        }
        
        const cacheKey = `modal:${sheet}:${range}`;
        if (options.useCache !== false) {
            const cached = this.getCached(cacheKey);
            if (cached) return cached;
        }

        const url = buildUrl(params);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch modal content');
        }

        const data = await response.json();
        if (options.useCache !== false) {
            this.setCached(cacheKey, data);
        }
        return data;
    };

    SecureSheets.getBatch = async function(requests, options = {}) {
        const params = {
            type: 'batch',
            requests: requests.join(',')
        };
        
        if (this.config.origin) {
            params.origin = this.config.origin;
        }
        
        const cacheKey = 'batch:' + requests.join(',');
        if (options.useCache !== false) {
            const cached = this.getCached(cacheKey);
            if (cached) return cached;
        }

        const url = buildUrl(params);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch batch data');
        }

        const data = await response.json();
        if (options.useCache !== false) {
            this.setCached(cacheKey, data);
        }
        return data;
    };

    // ============================================
    // PROTECTED ENDPOINTS (HMAC REQUIRED)
    // ============================================

    SecureSheets.getData = async function(sheet = null, options = {}) {
        const params = { action: 'getData' };
        
        if (sheet) {
            if (Array.isArray(sheet)) {
                params.sheets = sheet.join(',');
            } else {
                params.sheet = sheet;
            }
        }

        return await this.makeRequest(params, options);
    };

    SecureSheets.getCellData = async function(cell, options = {}) {
        const params = {
            cell: cell.toUpperCase()
        };

        return await this.makeRequest(params, options);
    };

    // ============================================
    // ERROR HANDLING
    // ============================================

    SecureSheets.parseError = function(errorData) {
        let message = 'SecureSheets: ';
        
        if (errorData.error) {
            message += errorData.error;
        }
        
        if (errorData.code) {
            message += ' (Code: ' + errorData.code + ')';
        }
        
        const error = new Error(message);
        error.code = errorData.code;
        error.serverResponse = errorData;
        
        return error;
    };

    SecureSheets.formatError = function(error) {
        return {
            message: error.message,
            code: error.code || 'UNKNOWN_ERROR',
            details: error.serverResponse || null,
            timestamp: new Date().toISOString()
        };
    };

    // ============================================
    // UTILITIES
    // ============================================

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
            // Test 1: Health
            try {
                const health = await this.healthCheck();
                results.tests.health.passed = health.status === 'online' || health.status === 'healthy';
                results.tests.health.message = results.tests.health.passed ? 
                    'Server is online' : 'Unexpected status';
                results.tests.health.data = health;
            } catch (error) {
                results.tests.health.message = 'Health check failed: ' + error.message;
            }

            // Test 2: Config
            try {
                const config = await this.getServerConfig();
                results.tests.config.passed = config.success === true;
                results.tests.config.message = config.success ? 
                    'Config accessible' : 'Config error';
                results.tests.config.data = config;
                results.server = config;
            } catch (error) {
                results.tests.config.message = 'Config fetch failed: ' + error.message;
            }

            // Test 3: Auth
            if (this.isConfigured()) {
                try {
                    const data = await this.getData(null, { useCache: false });
                    results.tests.auth.passed = data.status === 'success' || data.success === true;
                    results.tests.auth.message = results.tests.auth.passed ? 
                        'Authentication successful' : 'Authentication failed';
                    results.tests.auth.data = data;
                } catch (error) {
                    results.tests.auth.message = 'Auth failed: ' + error.message;
                }
            } else {
                results.tests.auth.message = 'Skipped (not configured)';
            }

            results.success = results.tests.health.passed && results.tests.config.passed;
            return results;

        } catch (error) {
            results.error = error.message;
            return results;
        }
    };

    SecureSheets.hasFeature = function(featureName) {
        if (!this.serverInfo || !this.serverInfo.features) {
            return false;
        }
        return this.serverInfo.features[featureName] === true;
    };

    SecureSheets.getVersion = function() {
        return this.version;
    };

    SecureSheets.setDebug = function(enable = true) {
        this.config.debug = enable;
        console.log('Debug mode ' + (enable ? 'enabled' : 'disabled'));
    };

    // ============================================
    // EXPORT
    // ============================================
    
    window.SecureSheets = SecureSheets;

    if (typeof define === 'function' && define.amd) {
        define([], function() { return SecureSheets; });
    } else if (typeof module === 'object' && module.exports) {
        module.exports = SecureSheets;
    }

    console.log(`SecureSheets Client v${SecureSheets.version} loaded`);

})(window);
