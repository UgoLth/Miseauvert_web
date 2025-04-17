import config from '../../js/config.js';
import { isAuthenticated } from '../../js/auth.js';

// Constantes
const editModal = new bootstrap.Modal(document.getElementById('editModal'));
let currentPensions = [];

// Vérifie l'authentification
function checkAuth() {
    if (!isAuthenticated()) {
        window.location.href = '../login.html';
    }
}

// Charge toutes les pensions
async function loadPensions() {
    try {
        const response = await fetch(`${config.API_URL}/pension`, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Erreur lors du chargement des pensions');
        }

        const pensions = await response.json();
        currentPensions = pensions;
        displayPensions(pensions);
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors du chargement des pensions');
    }
}

// Affiche les pensions dans la page
function displayPensions(pensions) {
    const container = document.getElementById('pensionsList');
    container.innerHTML = pensions.map(pension => `
        <div class="col-md-6 col-lg-4">
            <div class="card pension-card">
                <div class="card-body">
                    <button class="btn btn-primary edit-btn" onclick="editPension(${pension.id})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <h5 class="card-title">${pension.Ville}</h5>
                    <p class="card-text">
                        <strong>Adresse:</strong> ${pension.Adresse}<br>
                        <strong>Téléphone:</strong> ${pension.Telephone}<br>
                        <strong>Responsable:</strong> ${pension.Responsable}
                    </p>
                    <div class="btn-group">
                        <a href="../pension.php?id=${pension.id}" class="btn btn-outline-primary">
                            <i class="bi bi-eye"></i> Voir
                        </a>
                        <button class="btn btn-outline-danger" onclick="deletePension(${pension.id})">
                            <i class="bi bi-trash"></i> Supprimer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Ouvre le modal d'édition avec les données de la pension
function editPension(id) {
    const pension = currentPensions.find(p => p.id === id);
    if (pension) {
        document.getElementById('pensionId').value = pension.id;
        document.getElementById('ville').value = pension.Ville;
        document.getElementById('adresse').value = pension.Adresse;
        document.getElementById('telephone').value = pension.Telephone;
        document.getElementById('responsable').value = pension.Responsable;
        editModal.show();
    }
}

// Sauvegarde les modifications d'une pension
async function savePension() {
    const id = document.getElementById('pensionId').value;
    const pensionData = {
        Ville: document.getElementById('ville').value,
        Adresse: document.getElementById('adresse').value,
        Telephone: document.getElementById('telephone').value,
        Responsable: document.getElementById('responsable').value
    };

    try {
        const response = await fetch(`${API_URL}/pension/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify(pensionData)
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la sauvegarde');
        }

        editModal.hide();
        loadPensions();
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la sauvegarde de la pension');
    }
}

// Supprime une pension
async function deletePension(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette pension ?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/pension/${id}`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la suppression');
        }

        loadPensions();
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la suppression de la pension');
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadPensions();

    // Gestionnaire pour le bouton de sauvegarde
    document.getElementById('savePensionBtn').addEventListener('click', savePension);

    // Gestionnaire pour le bouton d'ajout
    document.getElementById('addPensionBtn').addEventListener('click', () => {
        document.getElementById('pensionId').value = '';
        document.getElementById('editPensionForm').reset();
        editModal.show();
    });
});
