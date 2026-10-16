const API_BASE = '/api';

export async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

    const headers = {
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
        ...options.headers,
    };

    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    const config = {
        ...options,
        headers,
    };

    if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
        config.body = JSON.stringify(config.body);
    }

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, config);

        if (response.status === 401 && !endpoint.includes('/auth/login')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (window.location.hash !== '#/login' && !window.location.hash.startsWith('#/apply')) {
                window.location.hash = '#/login';
            }
        }

        const data = await response.json().catch(() => null);

        if (!response.ok) {
            const error = new Error(data?.message || 'حدث خطأ في الاتصال بالخادم.');
            error.status = response.status;
            error.errors = data?.errors;
            throw error;
        }

        return data;
    } catch (err) {
        throw err;
    }
}

export const api = {
    get: (url, params) => {
        let query = '';
        if (params) {
            const filteredParams = Object.fromEntries(
                Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
            );
            query = '?' + new URLSearchParams(filteredParams).toString();
        }
        return apiRequest(`${url}${query}`, { method: 'GET' });
    },
    post: (url, body) => apiRequest(url, { method: 'POST', body }),
    put: (url, body) => apiRequest(url, { method: 'PUT', body }),
    patch: (url, body) => apiRequest(url, { method: 'PATCH', body }),
    delete: (url) => apiRequest(url, { method: 'DELETE' }),
};
