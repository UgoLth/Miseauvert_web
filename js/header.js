import { isAuthenticated } from './auth.js';

// Met à jour le header en fonction de l'état de connexion
function updateAuthButton() {
    // Attendre que le DOM soit complètement chargé
    setTimeout(() => {
        const navbarNav = document.getElementById('navbarNav');
        if (!navbarNav) {
            console.error('Navigation bar not found');
            return;
        }

        let navList = navbarNav.querySelector('ul.navbar-nav');
        if (!navList) {
            // Si la liste n'existe pas, créons-la
            navList = document.createElement('ul');
            navList.className = 'navbar-nav ms-auto';
            navbarNav.appendChild(navList);
        }

        // Supprime l'ancien bouton s'il existe
        const existingAuthButton = navList.querySelector('.auth-button');
        if (existingAuthButton) {
            existingAuthButton.remove();
        }

        // Crée le nouveau bouton
        const authButton = document.createElement('li');
        authButton.className = 'nav-item auth-button';

        if (isAuthenticated()) {
            authButton.innerHTML = `
                <a class="nav-link" href="#" onclick="window.logout(); return false;">
                    <i class="bi bi-box-arrow-right"></i> Déconnexion
                </a>`;
        } else {
            const loginPath = window.location.pathname.includes('admin/') ? '../login.html' : 'login.html';
            authButton.innerHTML = `
                <a class="nav-link" href="${loginPath}">
                    <i class="bi bi-person"></i> Connexion
                </a>`;
        }

        navList.appendChild(authButton);
    }, 100); // Petit délai pour s'assurer que le DOM est prêt
}

// Initialise le header au chargement de la page
document.addEventListener('DOMContentLoaded', updateAuthButton);

// Export des fonctions pour les autres modules
export { updateAuthButton };
