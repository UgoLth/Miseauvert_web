import { populateCatalogueOptions } from './catalogue.js';

async function showAddCatalogueModal() {
    document.querySelector('#catalogueModal .modal-title').textContent = 'Ajouter une option';
    document.getElementById('catalogueForm').reset();
    document.getElementById('catalogueOption').disabled = false;
    
    await populateCatalogueOptions();
    
    const modal = new bootstrap.Modal(document.getElementById('catalogueModal'));
    modal.show();
}

window.showAddCatalogueModal = showAddCatalogueModal;
