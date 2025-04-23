import config from '../../js/config.js';
import { getAuthToken } from '../../js/auth.js';
import { loadPensionCatalogue, populateCatalogueOptions, saveCatalogueOption } from './catalogue.js';

// Variables globales
let currentPensions = [];
let editingPensionId = null;
let currentGardiennageTypes = [];
let currentBoxes = [];
let currentTarificationId = null;
let editingGardiennageId = null;
let editingBoxId = null;

// Fonction pour charger toutes les pensions
async function loadPensions() {
    try {
        const response = await fetch(`${config.API_URL}/pension`, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Erreur lors du chargement des pensions');
        }

        currentPensions = await response.json();
        displayPensions(currentPensions);
    } catch (error) {
        showAlert('danger', `Erreur: ${error.message}`);
    }
}

// Fonction pour afficher les pensions
function displayPensions(pensions) {
    const container = document.getElementById('pensionsList');
    container.innerHTML = '';

    pensions.forEach(pension => {
        const card = document.createElement('div');
        card.className = 'col-md-4 mb-4';
        card.innerHTML = `
            <div class="card h-100">
                <div class="card-body">
                    <h5 class="card-title">${pension.Ville}</h5>
                    <p class="card-text">
                        <strong>Adresse:</strong> ${pension.Adresse}<br>
                        <strong>Téléphone:</strong> ${pension.Telephone}<br>
                        <strong>Responsable:</strong> ${pension.Responsable}
                    </p>
                    <div class="btn-group">
                        <button class="btn btn-primary btn-sm" onclick="window.editPension(${pension.id})">
                            <i class="bi bi-pencil"></i> Modifier
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="window.deletePension(${pension.id})">
                            <i class="bi bi-trash"></i> Supprimer
                        </button>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// Fonction pour créer/modifier une pension
async function savePension(event) {
    event.preventDefault();
    
    const pensionData = {
        Ville: document.getElementById('ville').value,
        Adresse: document.getElementById('adresse').value,
        Telephone: document.getElementById('telephone').value,
        Responsable: document.getElementById('responsable').value
    };

    try {
        const url = editingPensionId 
            ? `${config.API_URL}/pension/${editingPensionId}`
            : `${config.API_URL}/pension`;
            
        const response = await fetch(url, {
            method: editingPensionId ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify(pensionData)
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la sauvegarde');
        }

        // Recharger les pensions et fermer le modal
        await loadPensions();
        const modal = bootstrap.Modal.getInstance(document.getElementById('pensionModal'));
        modal.hide();
        showAlert('success', `Pension ${editingPensionId ? 'modifiée' : 'créée'} avec succès`);
        
        // Réinitialiser le formulaire
        document.getElementById('pensionForm').reset();
        editingPensionId = null;
    } catch (error) {
        showAlert('danger', `Erreur: ${error.message}`);
    }
}

// Fonction pour charger une pension dans le formulaire
async function editPension(id) {
    editingPensionId = id;
    const pension = currentPensions.find(p => p.id === id);
    
    if (pension) {
        document.getElementById('ville').value = pension.Ville;
        document.getElementById('adresse').value = pension.Adresse;
        document.getElementById('telephone').value = pension.Telephone;
        document.getElementById('responsable').value = pension.Responsable;
        
        document.getElementById('modalTitle').textContent = 'Modifier la pension';
        
        // Charger les types de gardiennage pour cette pension
        await loadGardiennageTypes(id);
        
        // Charger le catalogue pour cette pension
        await loadPensionCatalogue(id);
        
        const modal = new bootstrap.Modal(document.getElementById('pensionModal'));
        modal.show();
    }
}

// Fonction pour supprimer une pension
async function deletePension(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette pension ?')) {
        return;
    }

    try {
        const response = await fetch(`${config.API_URL}/pension/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la suppression');
        }

        await loadPensions();
        showAlert('success', 'Pension supprimée avec succès');
    } catch (error) {
        showAlert('danger', `Erreur: ${error.message}`);
    }
}

// Fonction pour afficher une alerte
function showAlert(type, message) {
    const alertContainer = document.getElementById('alertContainer');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    alertContainer.appendChild(alert);
    
    // Auto-suppression après 5 secondes
    setTimeout(() => {
        alert.remove();
    }, 5000);
}

// Fonction pour réinitialiser le formulaire
function resetForm() {
    editingPensionId = null;
    document.getElementById('pensionForm').reset();
    document.getElementById('modalTitle').textContent = 'Ajouter une pension';
}

// Fonction pour charger les types de gardiennage
async function loadGardiennageTypes(pensionId) {
    try {
        // Charger les types de gardiennage disponibles
        const typesResponse = await fetch(`${config.API_URL}/types-gardiennage`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        if (!typesResponse.ok) throw new Error('Erreur lors du chargement des types de gardiennage');
        
        const types = await typesResponse.json();
        
        // Charger les tarifs de la pension
        const tarifsResponse = await fetch(`${config.API_URL}/tarification?pension_id=${pensionId}`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        if (!tarifsResponse.ok) throw new Error('Erreur lors du chargement des tarifs');
        
        const tarifs = await tarifsResponse.json();
        
        // Afficher les tarifs
        displayGardiennageTypes(types, tarifs);
    } catch (error) {
        showAlert('danger', `Erreur: ${error.message}`);
    }
}

// Fonction pour afficher les types de gardiennage
function displayGardiennageTypes(types, tarifs) {
    const tbody = document.getElementById('gardiennageList');
    tbody.innerHTML = '';
    
    tarifs.forEach(tarif => {
        const type = types.find(t => t.id === tarif.TypeGardiennage_id);
        if (!type) return;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${type.libelle}</td>
            <td>${tarif.Tarif} €</td>
            <td>
                <button class="btn btn-primary btn-sm me-2" onclick="editGardiennage(${tarif.id})">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-danger btn-sm me-2" onclick="deleteGardiennage(${tarif.id})">
                    <i class="bi bi-trash"></i>
                </button>
                <button class="btn btn-info btn-sm" onclick="showBoxes(${tarif.id})">
                    <i class="bi bi-box"></i> Voir les boxes
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    // Mettre à jour le select des types dans le modal
    const typeSelect = document.getElementById('typeGardiennage');
    typeSelect.innerHTML = '<option value="">Sélectionnez un type</option>';
    types.forEach(type => {
        const option = document.createElement('option');
        option.value = type.id;
        option.textContent = type.libelle;
        typeSelect.appendChild(option);
    });
}

// Fonction pour charger les boxes
async function loadBoxes(tarificationId) {
    try {
        const response = await fetch(`${config.API_URL}/boxes?tarification_id=${tarificationId}`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        if (!response.ok) throw new Error('Erreur lors du chargement des boxes');
        
        const boxes = await response.json();
        // Stocker les boxes dans la variable globale
        currentBoxes = boxes;
        displayBoxes(boxes);
    } catch (error) {
        showAlert('danger', `Erreur: ${error.message}`);
        currentBoxes = []; // Réinitialiser en cas d'erreur
    }
}

// Fonction pour afficher les boxes
function displayBoxes(boxes) {
    const tbody = document.getElementById('boxesList');
    tbody.innerHTML = '';
    let html = '';
    
    boxes.forEach(box => {
        console.log('Box à afficher:', box); // Debug
        html += `
            <tr>
                <td>${box.id}</td>
                <td>${box.numero || ''}</td>
                <td>${box.taille || ''}</td>
                <td>${box.type || ''}</td>
                <td><span class="badge ${box.disponibilite ? 'bg-success' : 'bg-danger'}">${box.disponibilite ? 'Disponible' : 'Occupé'}</span></td>
                <td>
                    <button onclick="editBox(${box.id})" class="btn btn-sm btn-primary"><i class="bi bi-pencil"></i></button>
                    <button onclick="deleteBox(${box.id})" class="btn btn-sm btn-danger"><i class="bi bi-trash"></i></button>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    // Charger les pensions
    loadPensions();
    
    // Gestionnaire pour le formulaire principal
    document.getElementById('savePensionBtn').addEventListener('click', savePension);
    
    // Gestionnaire pour le bouton d'ajout de pension
    document.getElementById('addPensionBtn').addEventListener('click', () => {
        resetForm();
        const modal = new bootstrap.Modal(document.getElementById('pensionModal'));
        modal.show();
    });
    
    // Gestionnaire pour le bouton d'ajout de type de gardiennage
    document.getElementById('addGardiennageBtn').addEventListener('click', () => {
        editingGardiennageId = null;
        document.getElementById('gardiennageForm').reset();
        const modal = new bootstrap.Modal(document.getElementById('gardiennageModal'));
        modal.show();
    });
    
    // Gestionnaire pour le bouton d'ajout de box
    document.getElementById('addBoxBtn').addEventListener('click', () => {
        document.querySelector('#boxModal .modal-title').textContent = 'Ajouter un box';
        document.getElementById('boxForm').reset();
        document.getElementById('boxId').value = '';
        const modal = new bootstrap.Modal(document.getElementById('boxModal'));
        modal.show();
    });

    // Événement pour la soumission du formulaire de box
    document.getElementById('boxForm').addEventListener('submit', saveBox);
    
    // Événement pour l'ajout d'une option du catalogue
    document.getElementById('addCatalogueBtn').addEventListener('click', async () => {
        document.querySelector('#catalogueModal .modal-title').textContent = 'Ajouter une option';
        document.getElementById('catalogueForm').reset();
        document.getElementById('catalogueOption').disabled = false;
        
        // Charger les options disponibles
        await populateCatalogueOptions();
        
        const modal = new bootstrap.Modal(document.getElementById('catalogueModal'));
        modal.show();
    });
    
    // Événement pour la soumission du formulaire d'option du catalogue
    document.getElementById('catalogueForm').addEventListener('submit', (event) => {
        saveCatalogueOption(event, editingPensionId);
    });
    
    // Gestionnaire pour le formulaire de gardiennage
    document.getElementById('gardiennageForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        // TODO: Implémenter la sauvegarde du tarif
    });
    
    // Gestionnaire pour le formulaire de box
    document.getElementById('boxForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        // TODO: Implémenter la sauvegarde du box
    });
});

// Export des fonctions pour l'utilisation globale
window.editPension = editPension;
window.deletePension = deletePension;
window.editGardiennage = (id) => {
    // TODO: Implémenter l'édition d'un tarif
};
window.deleteGardiennage = (id) => {
    // TODO: Implémenter la suppression d'un tarif
};
window.editBox = async (id) => {
    console.log('EditBox appelé avec ID:', id);
    console.log('Type de ID:', typeof id);
    try {
        console.log('Tentative de récupération de la box avec ID:', id);
        
        // Récupérer les données du box depuis l'API
        const response = await fetch(`${config.API_URL}/boxes/${id}`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        console.log('Réponse de l\'API:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Erreur API:', errorText);
            throw new Error('Box non trouvé');
        }
        
        const box = await response.json();
        console.log('Box reçue:', box);

        // Remplir le formulaire avec les données du box
        document.getElementById('boxId').value = box.id;
        document.getElementById('boxNumero').value = box.numero;
        document.getElementById('boxTaille').value = box.taille;
        document.getElementById('boxType').value = box.type;
        document.getElementById('boxDisponibilite').checked = box.disponibilite;

        // Afficher le modal
        const boxModal = new bootstrap.Modal(document.getElementById('boxModal'));
        boxModal.show();
    } catch (error) {
        console.error('Erreur complète:', error);
        showAlert('warning', error.message);
    }
};
window.deleteBox = async (id) => {
    console.log('DeleteBox appelé avec ID:', id);
    console.log('Type de ID:', typeof id);
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce box ?')) {
        return;
    }

    try {
        const response = await fetch(`${config.API_URL}/boxes/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la suppression du box');
        }

        // Recharger les boxes
        await loadBoxes(currentTarificationId);
        showAlert('success', 'Box supprimé avec succès');
    } catch (error) {
        showAlert('danger', `Erreur: ${error.message}`);
    }
};


window.saveBox = async (event) => {
    event.preventDefault();

    const boxId = document.getElementById('boxId').value;
    // Aligner les champs avec le modèle Box.java
    const boxData = {
        numero: document.getElementById('boxNumero').value,
        taille: document.getElementById('boxTaille').value, // taille dans l'app lourde
        type: document.getElementById('boxType').value,
        disponibilite: document.getElementById('boxDisponibilite').checked,
        tarification_id: currentTarificationId // @SerializedName("tarification_id") dans l'app lourde
    };

    try {
        const url = boxId ? 
            `${config.API_URL}/boxes/${boxId}` : 
            `${config.API_URL}/boxes`;

        const response = await fetch(url, {
            method: boxId ? 'PUT' : 'POST',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(boxData)
        });

        if (!response.ok) {
            throw new Error('Erreur lors de l\'enregistrement du box');
        }

        // Fermer le modal
        const boxModal = bootstrap.Modal.getInstance(document.getElementById('boxModal'));
        boxModal.hide();

        // Recharger les boxes
        await loadBoxes(currentTarificationId);
        showAlert('success', `Box ${boxId ? 'modifié' : 'ajouté'} avec succès`);
    } catch (error) {
        showAlert('danger', `Erreur: ${error.message}`);
    }
};

window.showBoxes = async (tarificationId) => {
    if (!tarificationId) {
        showAlert('warning', 'Tarification non valide');
        return;
    }

    try {
        // Sauvegarder l'ID de la tarification courante
        currentTarificationId = tarificationId;

        // Charger les boxes pour cette tarification
        await loadBoxes(tarificationId);

        // Activer l'onglet des boxes
        const boxesTab = document.querySelector('#pensionTabs button[data-bs-target="#boxes"]');
        const tab = new bootstrap.Tab(boxesTab);
        tab.show();

        // Réinitialiser le formulaire
        document.getElementById('boxForm').reset();
        document.getElementById('boxId').value = '';
    } catch (error) {
        showAlert('danger', `Erreur: ${error.message}`);
    }
};
