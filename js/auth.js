/**
 * Authentication Module for ESG SME Platform Qatar
 * Handles user authentication, session management, and token refresh
 */

class AuthManager {
    constructor() {
        this.token = localStorage.getItem('access_token');
        this.user = null;
        this.tokenExpiry = localStorage.getItem('token_expiry');
        this.refreshTimer = null;
        this.init();
    }

    init() {
        // Check if token is expired
        if (this.token && this.isTokenExpired()) {
            this.logout();
        }
        
        // Set up auto-refresh if token exists
        if (this.token && !this.isTokenExpired()) {
            this.scheduleTokenRefresh();
            this.loadUserData();
        }
        
        // Listen for auth events across tabs
        window.addEventListener('storage', (e) => {
            if (e.key === 'access_token') {
                if (e.newValue) {
                    this.token = e.newValue;
                    this.loadUserData();
                    window.location.reload();
                } else {
                    this.logout(false);
                }
            }
        });
    }

    isTokenExpired() {
        if (!this.tokenExpiry) return true;
        const expiry = new Date(this.tokenExpiry);
        const now = new Date();
        return now >= expiry;
    }

    scheduleTokenRefresh() {
        if (this.refreshTimer) clearTimeout(this.refreshTimer);
        
        // Refresh 5 minutes before expiry
        const expiry = new Date(this.tokenExpiry);
        const now = new Date();
        const msUntilExpiry = expiry - now;
        const refreshTime = msUntilExpiry - (5 * 60 * 1000);
        
        if (refreshTime > 0) {
            this.refreshTimer = setTimeout(() => this.refreshToken(), refreshTime);
        }
    }

    async refreshToken() {
        try {
            const response = await fetch(`${API_BASE}/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.setToken(data.access_token);
            } else {
                this.logout();
            }
        } catch (error) {
            console.error('Token refresh failed:', error);
            this.logout();
        }
    }

    setToken(token) {
        this.token = token;
        if (token) {
            // Set expiry (7 days from now)
            const expiry = new Date();
            expiry.setDate(expiry.getDate() + 7);
            this.tokenExpiry = expiry.toISOString();
            
            localStorage.setItem('access_token', token);
            localStorage.setItem('token_expiry', this.tokenExpiry);
            this.scheduleTokenRefresh();
        } else {
            localStorage.removeItem('access_token');
            localStorage.removeItem('token_expiry');
            if (this.refreshTimer) clearTimeout(this.refreshTimer);
        }
    }

    async loadUserData() {
        try {
            const response = await fetch(`${API_BASE}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (response.ok) {
                this.user = await response.json();
                this.dispatchUserEvent('userLoaded', this.user);
            }
        } catch (error) {
            console.error('Failed to load user data:', error);
        }
    }

    dispatchUserEvent(eventName, data) {
        const event = new CustomEvent(eventName, { detail: data });
        document.dispatchEvent(event);
    }

    async signup(userData) {
        // Validate password strength
        const passwordValidation = this.validatePassword(userData.password);
        if (!passwordValidation.valid) {
            throw new Error(passwordValidation.message);
        }
        
        // Validate email format
        if (!this.validateEmail(userData.email)) {
            throw new Error('Please enter a valid email address');
        }
        
        try {
            const response = await fetch(`${API_BASE}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.detail || 'Signup failed');
            }
            
            return data;
        } catch (error) {
            console.error('Signup error:', error);
            throw error;
        }
    }

    async login(email, password) {
        if (!email || !password) {
            throw new Error('Email and password are required');
        }
        
        try {
            const response = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Invalid email or password');
                }
                throw new Error(data.detail || 'Login failed');
            }
            
            this.setToken(data.access_token);
            await this.loadUserData();
            
            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    async logout(redirect = true) {
        try {
            // Call logout endpoint if token exists
            if (this.token) {
                await fetch(`${API_BASE}/auth/logout`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${this.token}` }
                }).catch(() => {});
            }
        } finally {
            this.token = null;
            this.user = null;
            this.tokenExpiry = null;
            localStorage.removeItem('access_token');
            localStorage.removeItem('token_expiry');
            if (this.refreshTimer) clearTimeout(this.refreshTimer);
            
            if (redirect) {
                window.location.href = '/login.html';
            }
        }
    }

    isAuthenticated() {
        return !!this.token && !this.isTokenExpired();
    }

    getToken() {
        return this.token;
    }

    getUser() {
        return this.user;
    }

    validatePassword(password) {
        if (!password || password.length < 8) {
            return { valid: false, message: 'Password must be at least 8 characters long' };
        }
        
        // Check for at least one number
        if (!/\d/.test(password)) {
            return { valid: false, message: 'Password must contain at least one number' };
        }
        
        // Check for at least one uppercase letter
        if (!/[A-Z]/.test(password)) {
            return { valid: false, message: 'Password must contain at least one uppercase letter' };
        }
        
        // Check for at least one special character
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            return { valid: false, message: 'Password must contain at least one special character' };
        }
        
        return { valid: true, message: '' };
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Session management
    async checkSession() {
        if (!this.isAuthenticated()) {
            return false;
        }
        
        try {
            const response = await fetch(`${API_BASE}/auth/verify`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            return response.ok;
        } catch {
            return false;
        }
    }
}

// Global auth instance
const auth = new AuthManager();

// Export for module usage (if using modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = auth;
}