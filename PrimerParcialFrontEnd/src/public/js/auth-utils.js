function getStoredToken() {
    return localStorage.getItem('authToken');
}

function saveToken(token, user = null) {
    if (token) {
        localStorage.setItem('authToken', token);
    }
    if (user) {
        localStorage.setItem('user', JSON.stringify(user));
    }
}

function clearToken() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
}

function getAuthHeaders() {
    const headers = {
        'Content-Type': 'application/json'
    };
    const token = getStoredToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

async function authenticatedFetch(url, options = {}) {
    const defaultOptions = {
        credentials: 'include',
        headers: getAuthHeaders()
    };
    const finalOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...(options.headers || {})
        }
    };
    try {
        const response = await fetch(url, finalOptions);
        if (response.status === 401) {
            clearToken();
            if (!window.location.pathname.includes('login.html') && !window.location.pathname.includes('index.html')) {
                alert('Sesión expirada. Por favor, inicia sesión nuevamente.');
                window.location.href = './login.html';
                return null;
            }
        }
        return response;
    } catch (error) {
        console.error('❌ Error en fetch autenticado:', error);
        throw error;
    }
}

function isAuthenticated() {
    return !!getStoredToken();
}

function getStoredUser() {
    try {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
        console.error('❌ Error parseando usuario almacenado:', error);
        return null;
    }
}

if (typeof window !== 'undefined') {
    window.authUtils = {
        getStoredToken,
        saveToken,
        clearToken,
        getAuthHeaders,
        authenticatedFetch,
        isAuthenticated,
        getStoredUser
    };
}