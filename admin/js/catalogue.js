import config from '../../js/config.js';
import { getAuthToken } from '../../js/auth.js';

let currentCatalogueOptions = [];
let currentPensionCatalogue = [];
let editingCatalogueId = null;
export async function loadCatalogueOptions() {
    try {
        const response = await fetch(`${config.API_URL}/catalogues`, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Erreur lors du chargement des options du catalogue');
        }

        currentCatalogueOptions = await response.json();
        return currentCatalogueOptions;
    } catch (error) {
        console.error('Erreur:', error);
        return [];
    }
}


export async function loadPensionCatalogue(pensionId) {
    if (!pensionId) return;
    
    try {
        const response = await fetch(`${config.API_URL}/tarif-catalogues?pension_id=${pensionId}`, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Erreur lors du chargement du catalogue de la pension');
        }

        currentPensionCatalogue = await response.json();
        displayPensionCatalogue(currentPensionCatalogue);
    } catch (error) {
        console.error('Erreur:', error);
        document.getElementById('catalogueList').innerHTML = `<tr><td colspan="3" class="text-center">Erreur de chargement</td></tr>`;
    }
}


export function displayPensionCatalogue(tarifCatalogues) {
    const container = document.getElementById('catalogueList');
    container.innerHTML = '';

    if (tarifCatalogues.length === 0) {
        container.innerHTML = `<tr><td colspan="3" class="text-center">Aucune option dans le catalogue</td></tr>`;
        return;
    }

    
    const promises = tarifCatalogues.map(async (tarif) => {
        try {
            const response = await fetch(`${config.API_URL}/catalogues/${tarif.catalogue_id}`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${getAuthToken()}`
                }
            });

            if (!response.ok) {
                throw new Error(`Erreur lors du chargement de l'option ${tarif.catalogue_id}`);
            }

            const option = await response.json();
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${option.nom}</td>
                <td>${tarif.prix} €</td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-primary" onclick="window.editCatalogueOption(${tarif.id})">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-danger" onclick="window.deleteCatalogueOption(${tarif.id})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            container.appendChild(row);
        } catch (error) {
            console.error('Erreur:', error);
        }
    });

    Promise.all(promises).catch(error => {
        console.error('Erreur lors de l\'affichage du catalogue:', error);
    });
}


export async function populateCatalogueOptions() {
    const select = document.getElementById('catalogueOption');
    select.innerHTML = '<option value="">Sélectionnez une option</option>';
    
    try {
        const options = await loadCatalogueOptions();
        
        
        const selectedOptions = currentPensionCatalogue.map(tarif => tarif.catalogue_id);
        
        options.forEach(option => {
            
            if (!selectedOptions.includes(option.id)) {
                const optElement = document.createElement('option');
                optElement.value = option.id;
                optElement.textContent = option.nom;
                select.appendChild(optElement);
            }
        });
    } catch (error) {
        console.error('Erreur lors du chargement des options:', error);
    }
}


export async function saveCatalogueOption(event, pensionId) {
    event.preventDefault();
    
    const catalogueId = document.getElementById('catalogueOption').value;
    const prix = document.getElementById('cataloguePrix').value;
    
    if (!catalogueId || !prix) {
        alert('Veuillez remplir tous les champs');
        return;
    }
    
    const tarifData = {
        pension_id: pensionId,
        catalogue_id: catalogueId,
        prix: prix
    };
    
    try {
        const url = editingCatalogueId 
            ? `${config.API_URL}/tarif-catalogues/${editingCatalogueId}`
            : `${config.API_URL}/tarif-catalogues`;
            
        const response = await fetch(url, {
            method: editingCatalogueId ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify(tarifData)
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la sauvegarde');
        }

        // Fermer le modal et recharger le catalogue
        const modal = bootstrap.Modal.getInstance(document.getElementById('catalogueModal'));
        modal.hide();
        
        // Réinitialiser le formulaire
        document.getElementById('catalogueForm').reset();
        editingCatalogueId = null;
        
        // Recharger le catalogue
        await loadPensionCatalogue(pensionId);
        
    } catch (error) {
        console.error('Erreur:', error);
        alert(`Erreur: ${error.message}`);
    }
}


export async function editCatalogueOption(id) {
    editingCatalogueId = id;
    
    try {
        const response = await fetch(`${config.API_URL}/tarif-catalogues/${id}`, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Erreur lors du chargement des données');
        }

        const tarif = await response.json();
        
        
        document.getElementById('cataloguePrix').value = tarif.prix;
        
        
        const select = document.getElementById('catalogueOption');
        select.innerHTML = '';
        
        
        const optionResponse = await fetch(`${config.API_URL}/catalogues/${tarif.catalogue_id}`, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        if (optionResponse.ok) {
            const option = await optionResponse.json();
            const optElement = document.createElement('option');
            optElement.value = option.id;
            optElement.textContent = option.nom;
            select.appendChild(optElement);
        }
        
        select.disabled = true;
        
        
        document.querySelector('#catalogueModal .modal-title').textContent = 'Modifier le prix';
        
        
        const modal = new bootstrap.Modal(document.getElementById('catalogueModal'));
        modal.show();
    } catch (error) {
        console.error('Erreur:', error);
        alert(`Erreur: ${error.message}`);
    }
}


export async function deleteCatalogueOption(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette option du catalogue ?')) {
        return;
    }
    
    try {
        const response = await fetch(`${config.API_URL}/tarif-catalogues/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la suppression');
        }

        // Recharger le catalogue
        const pensionId = currentPensionCatalogue[0]?.pension_id;
        if (pensionId) {
            await loadPensionCatalogue(pensionId);
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert(`Erreur: ${error.message}`);
    }
}

setTimeout(() => {
    window.editCatalogueOption = editCatalogueOption;
    window.deleteCatalogueOption = deleteCatalogueOption;
    window.populateCatalogueOptions = populateCatalogueOptions;
    window.saveCatalogueOption = saveCatalogueOption;
}, 100);
