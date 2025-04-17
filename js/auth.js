import config from './config.js';

// Fonctions d'authentification
export function getAuthToken() {
    return localStorage.getItem(config.TOKEN_KEY);
}

export function setAuthToken(token) {
    localStorage.setItem(config.TOKEN_KEY, token);
}

export function removeAuthToken() {
    localStorage.removeItem(config.TOKEN_KEY);
}

export function isAuthenticated() {
    return getAuthToken() !== null;
}

// Gestion du formulaire de connexion
export async function handleLoginFormSubmit(e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        if (!email || !password || password.length < 6) {
            throw new Error('Email et mot de passe (6 caractères minimum) requis');
        }

        const response = await fetch(`${config.API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            throw new Error('Email ou mot de passe incorrect');
        }

        const data = await response.json();
        setAuthToken(data.token);
        window.location.href = 'admin/index.html';

    } catch (error) {
        const errorAlert = document.getElementById('errorAlert');
        errorAlert.textContent = error.message;
        errorAlert.style.display = 'block';
    }
}

// Gestion de la déconnexion
export function logout() {
    removeAuthToken();
    window.location.href = 'login.html';
}

// Gestionnaire de formulaire
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const errorAlert = document.getElementById('errorAlert');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorAlert.style.display = 'none';

            try {
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                await login(email, password);
            } catch (error) {
                errorAlert.textContent = error.message;
                errorAlert.style.display = 'block';
            }
        });
    }

    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }

    // Si l'utilisateur est déjà connecté et qu'il est sur la page de login,
    // on le redirige vers le dashboard
    if (window.location.pathname.endsWith('login.html') && isAuthenticated()) {
        window.location.href = 'admin/index.html';
    }
});

// Export des fonctions
window.isAuthenticated = isAuthenticated;
window.logout = logout;
