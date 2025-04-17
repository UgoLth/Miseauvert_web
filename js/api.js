import config from './config.js';

// Fonction pour construire les en-têtes avec le token
function getHeaders() {
    const headers = {
        'Content-Type': 'application/json'
    };

    const token = localStorage.getItem(config.TOKEN_KEY);
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
}

// Fonction générique pour les requêtes API
async function apiRequest(endpoint, options = {}) {
    const defaultOptions = {
        headers: getHeaders()
    };

    const response = await fetch(`${config.API_URL}${endpoint}`, {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Une erreur est survenue');
    }

    return response.json();
}

// Fonctions spécifiques pour chaque type de requête
export async function getPensions() {
    return apiRequest('/pension');
}

export async function getPension(id) {
    return apiRequest(`/pension/${id}`);
}

export async function getTarifications(pensionId) {
    return apiRequest(`/tarification?pension_id=${pensionId}`);
}

export async function getTypesGardiennage() {
    return apiRequest('/types-gardiennage');
}

// Exporter les constantes et fonctions utiles
export {
    API_URL,
    API_PREFIX,
    getHeaders
};
