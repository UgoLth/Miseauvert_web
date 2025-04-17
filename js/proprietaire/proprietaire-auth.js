import config from '../config.js';
import { PROPRIETAIRE_ROUTES } from './proprietaire-config.js';

const TOKEN_KEY = 'proprietaire_token';

export function getProprietaireToken() {
    return localStorage.getItem(TOKEN_KEY);
}

export function setProprietaireToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

export function removeProprietaireToken() {
    localStorage.removeItem(TOKEN_KEY);
}

export function isProprietaireAuthenticated() {
    return getProprietaireToken() !== null;
}

export async function handleProprietaireLogin(e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorAlert = document.getElementById('errorAlert');
    errorAlert.style.display = 'none';

    try {
        if (!email || !password) {
            throw new Error('Email et mot de passe requis');
        }

        console.log('Tentative de connexion avec:', { email });

        const response = await fetch(`${config.API_URL}${PROPRIETAIRE_ROUTES.LOGIN}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        console.log('Statut de la réponse:', response.status);

        if (!response.ok) {
            const text = await response.text();
            console.log('Réponse d\'erreur:', text);
            try {
                const data = JSON.parse(text);
                throw new Error(data.message || 'Erreur de connexion');
            } catch (e) {
                throw new Error('Erreur de connexion au serveur');
            }
        }

        const data = await response.json();
        console.log('Connexion réussie:', data);

        setProprietaireToken(data.token);
        window.location.href = 'proprietaire/profile.html';

    } catch (error) {
        errorAlert.textContent = error.message;
        errorAlert.style.display = 'block';
    }
}

export async function handleProprietaireLogout() {
    try {
        const response = await fetch(`${config.API_URL}${PROPRIETAIRE_ROUTES.LOGOUT}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getProprietaireToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la déconnexion');
        }

        removeProprietaireToken();
        window.location.href = '/login.html';
    } catch (error) {
        console.error('Erreur de déconnexion:', error);
    }
}

export async function getProprietaireProfile() {
    try {
        const response = await fetch(`${config.API_URL}${PROPRIETAIRE_ROUTES.PROFILE}`, {
            headers: {
                'Authorization': `Bearer ${getProprietaireToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la récupération du profil');
        }

        return await response.json();
    } catch (error) {
        console.error('Erreur de récupération du profil:', error);
        throw error;
    }
}

export async function updateProprietaireProfile(profileData) {
    try {
        // Récupérer l'ID du propriétaire depuis le profil actuel
        const currentProfile = await getProprietaireProfile();
        const proprietaireId = currentProfile.id;

        const response = await fetch(`${config.API_URL}${PROPRIETAIRE_ROUTES.UPDATE_PROFILE}/${proprietaireId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getProprietaireToken()}`
            },
            body: JSON.stringify(profileData)
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la mise à jour du profil');
        }

        return await response.json();
    } catch (error) {
        console.error('Erreur de mise à jour du profil:', error);
        throw error;
    }
}

export async function getProprietaireAnimaux() {
    try {
        // Récupérer l'ID du propriétaire connecté
        const currentProfile = await getProprietaireProfile();
        const proprietaireId = currentProfile.id;

        // Utiliser la route /animals avec le paramètre proprietaire_id
        const response = await fetch(`${config.API_URL}/animals?proprietaire_id=${proprietaireId}`, {
            headers: {
                'Authorization': `Bearer ${getProprietaireToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des animaux');
        }

        const result = await response.json();
        return result.data; // L'API renvoie les données dans un objet 'data'
    } catch (error) {
        console.error('Erreur de récupération des animaux:', error);
        throw error;
    }
}
