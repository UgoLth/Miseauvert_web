import {
    getProprietaireProfile,
    updateProprietaireProfile,
    handleProprietaireLogout,
    getProprietaireAnimaux,
    isProprietaireAuthenticated,
    getProprietaireToken
} from '../../js/proprietaire/proprietaire-auth.js';

import config from '../../js/config.js';

document.addEventListener('DOMContentLoaded', async () => {
    if (!isProprietaireAuthenticated()) {
        window.location.href = '../login.html';
        return;
    }

    const profileForm = document.getElementById('profileForm');
    const logoutBtn = document.getElementById('logoutBtn');
    const errorAlert = document.getElementById('errorAlert');
    const successAlert = document.getElementById('successAlert');
    const saveAnimalBtn = document.getElementById('saveAnimalBtn');

    // Charger le profil, les animaux et les espèces
    try {
        const profile = await getProprietaireProfile();
        await Promise.all([
            loadAnimaux(),
            loadEspeces()
        ]);
        document.getElementById('nom').value = profile.nom;
        document.getElementById('prenom').value = profile.prenom;
        document.getElementById('email').value = profile.email;
        document.getElementById('telephone').value = profile.telephone;
        document.getElementById('adresse').value = profile.adresse;
    } catch (error) {
        errorAlert.textContent = 'Erreur lors du chargement du profil';
        errorAlert.style.display = 'block';
    }

    // Mettre à jour le profil
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorAlert.style.display = 'none';
        successAlert.style.display = 'none';

        const profileData = {
            nom: document.getElementById('nom').value,
            prenom: document.getElementById('prenom').value,
            email: document.getElementById('email').value,
            telephone: document.getElementById('telephone').value,
            adresse: document.getElementById('adresse').value
        };

        try {
            await updateProprietaireProfile(profileData);
            successAlert.textContent = 'Profil mis à jour avec succès';
            successAlert.style.display = 'block';
        } catch (error) {
            errorAlert.textContent = error.message;
            errorAlert.style.display = 'block';
        }
    });

    // Charger les animaux
    async function loadAnimaux() {
        try {
            const animaux = await getProprietaireAnimaux();
            const animauxList = document.getElementById('animauxList');
            animauxList.innerHTML = '';

            if (animaux && animaux.length > 0) {
                animaux.forEach(animal => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${animal.nom}</td>
                        <td>${animal.espece ? animal.espece.nom : 'Non spécifié'}</td>
                        <td>${animal.race || 'Non spécifié'}</td>
                        <td>
                            <button class="btn btn-sm btn-primary me-2" onclick="editAnimal(${animal.id})">Modifier</button>
                            <button class="btn btn-sm btn-danger" onclick="deleteAnimal(${animal.id})">Supprimer</button>
                        </td>
                    `;
                    animauxList.appendChild(row);
                });
            } else {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td colspan="4" class="text-center">Aucun animal enregistré</td>
                `;
                animauxList.appendChild(row);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des animaux:', error);
            const animauxList = document.getElementById('animauxList');
            animauxList.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-danger">
                        Erreur lors du chargement des animaux
                    </td>
                </tr>
            `;
        }
    }



    // Charger les espèces
    async function loadEspeces() {
        try {
            const response = await fetch(`${config.API_URL}/especes`, {
                headers: {
                    'Authorization': `Bearer ${getProprietaireToken()}`
                }
            });
            
            if (!response.ok) throw new Error('Erreur lors du chargement des espèces');
            
            const result = await response.json();
            const especeSelect = document.getElementById('animalEspece');
            especeSelect.innerHTML = '<option value="">Sélectionnez une espèce</option>';
        
            if (Array.isArray(result.data)) {
                result.data.forEach(espece => {
                    const option = document.createElement('option');
                    option.value = espece.id;
                    option.textContent = espece.nom;
                    especeSelect.appendChild(option);
                });
            } else {
                console.error('La réponse de l\'API /especes ne contient pas un tableau attendu:', result);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des espèces:', error);
        }
    }

    // Charger les espèces au chargement de la page
    loadEspeces();

    // Fonction pour modifier un animal
    window.editAnimal = async (animalId) => {
        try {
            const response = await fetch(`${config.API_URL}/animals/${animalId}`, {
                headers: {
                    'Authorization': `Bearer ${getProprietaireToken()}`
                }
            });

            if (!response.ok) throw new Error('Erreur lors de la récupération de l\'animal');

            const data = await response.json();
            const animal = data.data;

            // Remplir le formulaire avec les données de l'animal
            document.getElementById('animalNom').value = animal.nom;
            document.getElementById('animalEspece').value = animal.espece_id;
            document.getElementById('animalRace').value = animal.race || '';
            document.getElementById('animalDateNaissance').value = animal.date_naissance || '';

            // Stocker l'ID de l'animal pour la mise à jour
            document.getElementById('animalId').value = animal.id;

            // Ouvrir la modal
            const modal = new bootstrap.Modal(document.getElementById('addAnimalModal'));
            modal.show();
        } catch (error) {
            console.error('Erreur lors de la récupération de l\'animal:', error);
        }
    };

    // Fonction pour supprimer un animal
    window.deleteAnimal = async (animalId) => {
        if (!confirm('Voulez-vous vraiment supprimer cet animal ?')) return;

        try {
            const response = await fetch(`${config.API_URL}/animals/${animalId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${getProprietaireToken()}`
                }
            });

            if (!response.ok) throw new Error('Erreur lors de la suppression');

            // Recharger la liste des animaux
            await loadAnimaux();
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
        }
    };

    // Ajouter/Modifier un animal
    saveAnimalBtn.addEventListener('click', async () => {
        const animalId = document.getElementById('animalId').value;
        const animalData = {
            nom: document.getElementById('animalNom').value,
            espece_id: document.getElementById('animalEspece').value,
            race: document.getElementById('animalRace').value || '',
            date_naissance: document.getElementById('animalDateNaissance').value || null,
            proprietaire_id: (await getProprietaireProfile()).id
        };

        const method = animalId ? 'PUT' : 'POST';
        const url = animalId 
            ? `${config.API_URL}/animals/${animalId}`
            : `${config.API_URL}/animals`;

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getProprietaireToken()}`
                },
                body: JSON.stringify(animalData)
            });

            if (!response.ok) {
                throw new Error('Erreur lors de l\'ajout de l\'animal');
            }

            // Fermer le modal et recharger la liste des animaux
            const modal = bootstrap.Modal.getInstance(document.getElementById('addAnimalModal'));
            modal.hide();
            await loadAnimaux();

        } catch (error) {
            console.error('Erreur:', error);
            errorAlert.textContent = error.message;
            errorAlert.style.display = 'block';
        }
    });

    // Déconnexion
    logoutBtn.addEventListener('click', handleProprietaireLogout);

    // Charger les animaux au démarrage
    loadAnimaux();
});
