/**
 * API Module for ESG SME Platform Qatar
 * Handles all backend communication
 */

const API_BASE = 'https://esg-sme-backend.onrender.com';

class API {
    constructor() {
        this.token = localStorage.getItem('access_token');
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('access_token', token);
        } else {
            localStorage.removeItem('access_token');
        }
    }

    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
        };
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        return headers;
    }

    async request(endpoint, method, data = null) {
        const url = `${API_BASE}${endpoint}`;
        const options = {
            method,
            headers: this.getHeaders(),
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);
            const responseData = await response.json();
            
            if (!response.ok) {
                throw new Error(responseData.detail || 'Request failed');
            }
            
            return responseData;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    async get(endpoint) {
        return this.request(endpoint, 'GET');
    }

    async post(endpoint, data) {
        return this.request(endpoint, 'POST', data);
    }

    async put(endpoint, data) {
        return this.request(endpoint, 'PUT', data);
    }

    async delete(endpoint) {
        return this.request(endpoint, 'DELETE');
    }

    // Auth endpoints
    async signup(userData) {
        return this.post('/auth/signup', userData);
    }

    async login(credentials) {
        const data = await this.post('/auth/login', credentials);
        this.setToken(data.access_token);
        return data;
    }

    async logout() {
        try {
            await this.post('/auth/logout');
        } finally {
            this.setToken(null);
        }
    }

    async getCurrentUser() {
        return this.get('/auth/me');
    }

    // ESG Data endpoints (Pages 16-28)
    async saveESGData(data) {
        return this.post('/esg/data', data);
    }

    async getESGData(year) {
        return this.get(`/esg/data/${year}`);
    }

    async getESGHistory() {
        return this.get('/esg/data/history');
    }

    async getESGScore() {
        return this.get('/esg/score');
    }

    // Reports endpoints
    async generateReport(year, type = 'basic') {
        return this.post(`/reports/generate/${year}?report_type=${type}`);
    }

    async getReportHistory() {
        return this.get('/reports/history');
    }

    async downloadReport(reportId) {
        const url = `${API_BASE}/reports/download/${reportId}`;
        const response = await fetch(url, {
            headers: this.getHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Download failed');
        }
        
        return response.blob();
    }

    // Materiality endpoints (Page 8)
    async assessMateriality(year) {
        return this.post(`/materiality/assess/${year}`);
    }

    async getMaterialityHistory() {
        return this.get('/materiality/history');
    }

    // Helper method for file uploads
    async uploadFile(file, type) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        
        const url = `${API_BASE}/upload`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`
            },
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Upload failed');
        }
        
        return response.json();
    }
}

// Create global instance
const api = new API();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
}
