<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Détails de la Pension</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.7.2/font/bootstrap-icons.css">
  <link rel="stylesheet" href="style.css">
  <style>
    .navbar {
      background-color: #2E7D32 !important;
    }
    .card {
      margin-top: 20px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    .card-title {
      color: #2E7D32;
    }
    .accordion-button:not(.collapsed) {
      background-color: #E8F5E9;
      color: #2E7D32;
    }
    .accordion-button:focus {
      border-color: #81C784;
      box-shadow: 0 0 0 0.25rem rgba(46, 125, 50, 0.25);
    }
    .badge.bg-success {
      background-color: #2E7D32 !important;
    }
    .table-hover tbody tr:hover {
      background-color: #E8F5E9;
    }
  </style>
</head>
<body>
  <!-- Navigation -->
  <nav class="navbar navbar-expand-lg navbar-dark">
    <div class="container">
      <a class="navbar-brand" href="index.html">La mise au vert</a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav ms-auto">
          <li class="nav-item"><a class="nav-link" href="index.html">Accueil</a></li>
          <li class="nav-item"><a class="nav-link" href="index.html#apropos">À propos</a></li>
          <li class="nav-item"><a class="nav-link" href="index.html#services">Services</a></li>
          <li class="nav-item"><a class="nav-link" href="index.html#contact">Contact</a></li>
        </ul>
      </div>
    </div>
  </nav>

  <div class="container mt-4">
    <div class="card">
      <div class="card-body" id="pension-details">
        <!-- Les détails de la pension seront chargés ici dynamiquement -->
      </div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
  <script src="js/auth.js"></script>
  <script src="js/header.js"></script>
  <script type="module" src="js/api.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      const urlParams = new URLSearchParams(window.location.search);
      const pensionId = urlParams.get('id');

      if (!pensionId) {
        document.getElementById('pension-details').innerHTML = '<p class="text-danger">ID de pension non spécifié</p>';
        return;
      }

      console.log('Fetching pension details');
      // 1. Récupérer la pension
      fetch('http://127.0.0.1:8000/api/pension')
        .then(response => {
          console.log('Response pension:', response);
          return response.json();
        })
        .then(pensions => {
          console.log('Pensions:', pensions);
          // Trouver la pension correspondante
          const pension = pensions.find(p => p.Id == pensionId || p.id == pensionId);
          if (!pension) {
            throw new Error('Pension non trouvée');
          }

          // 2. Récupérer les tarifications de cette pension
          const headers = {
            'Accept': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('token')
          };

          return Promise.all([
            Promise.resolve(pension),
            fetch(`http://127.0.0.1:8000/api/tarification?pension_id=${pension.id}`, { headers })
              .then(r => {
                console.log('Response tarification:', r);
                return r.json();
              }),
            fetch('http://127.0.0.1:8000/api/types-gardiennage', { headers })
              .then(r => {
                console.log('Response types gardiennage:', r);
                return r.json();
              })
              .then(data => {
                console.log('Types gardiennage data:', JSON.stringify(data, null, 2));
                return data;
              })
          ]);
        })
        .then(([pension, tarifications, typesGardiennage]) => {
          // Debug des données reçues
          console.log('Types de gardiennage reçus:', JSON.stringify(typesGardiennage, null, 2));
          console.log('Tarifications reçues:', JSON.stringify(tarifications, null, 2));
          const tarifsAvecTypes = tarifications.map(tarif => {
            // Debug de chaque tarification
            console.log('Traitement tarification:', {
              tarif_id: tarif.id,
              type_gardiennage_id: tarif.TypeGardiennage_id
            });
            console.log('Tarif avant ajout du type:', JSON.stringify(tarif, null, 2));

            const type = Array.isArray(typesGardiennage) ? typesGardiennage.find(t => {
              console.log('Comparaison:', {
                type_id: t.id,
                tarif_type_id: tarif.TypeGardiennage_id,
                match: t.id === tarif.TypeGardiennage_id
              });
              return t.id === tarif.TypeGardiennage_id;
            }) : null;
            return {
              ...tarif,
              TypeGardiennage: type
            };
          });
          
          return {
            ...pension,
            tarifications: tarifsAvecTypes
          };
        })
        .then(pension => {
          console.log('Received pension data:', pension);
          if (!pension) {
            throw new Error('Pension non trouvée');
          }
          document.getElementById('pension-details').innerHTML = `
            <h1 class="card-title mb-4">${pension.Ville || 'Ville non spécifiée'}</h1>
            <div class="pension-info mb-4">
              <p class="card-text"><strong>Adresse:</strong> ${pension.Adresse || 'Non spécifiée'}</p>
              <p class="card-text"><strong>Téléphone:</strong> ${pension.Telephone || 'Non spécifié'}</p>
              <p class="card-text"><strong>Responsable:</strong> ${pension.Responsable || 'Non spécifié'}</p>
            </div>
            
            <div class="gardiennage-section">
              <h2 class="h4 mb-3">Types de gardiennage et tarifs</h2>
              ${pension.tarifications ? `
                <div class="table-responsive">
                  <table class="table table-hover">
                    <thead>
                      <tr>
                        <th>Type de gardiennage</th>
                        <th>Tarif</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${pension.tarifications.map(tarif => `
                        <tr>
                          <td>${tarif.TypeGardiennage?.libelle || 'Non spécifié'}</td>
                          <td>${tarif.Tarif ? tarif.Tarif + ' €' : 'Non spécifié'}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              ` : '<p class="text-muted">Aucun type de gardiennage disponible pour le moment.</p>'}
            </div>
            <div class="mt-4">
              <a href="index.html" class="btn btn-success">Retour à la liste des pensions</a>
            </div>
          `;
          document.title = `La mise au vert - Pension de ${pension.Ville || 'Inconnue'}`;
        })
        .catch(error => {
          console.error('Error:', error);
          document.getElementById('pension-details').innerHTML = `
            <div class="alert alert-danger" role="alert">
              Une erreur est survenue lors du chargement des détails de la pension.<br>
              ${error.message}
            </div>
            <a href="index.html" class="btn btn-success">Retour à la liste des pensions</a>
          `;
        });
    });
  </script>
</body>
</html>
