$(document).ready(function() {
    // Fonction pour gérer la visibilité des sections en fonction de l'URL
    function handleSectionVisibility() {
        var currentUrl = window.location.href;
        var sectionIds = ['#accueil', '#animes'];
        var sectionFound = false;

        var navLinks = $('.app-nav-list a');

        // Parcourir les liens de navigation
        navLinks.each(function() {
            var linkUrl = $(this).attr('href');

            if (currentUrl.includes(linkUrl)) {
                $(this).addClass('active');
                var sectionId = linkUrl;
                for (var i = 0; i < sectionIds.length; i++) {
                    if (sectionIds[i] !== sectionId) {
                        $(sectionIds[i]).addClass('d-none');
                    }
                }
                $(sectionId).removeClass('d-none');
                sectionFound = true;
            }
        });

        if (!sectionFound) {
            $('#accueil').removeClass('d-none');
        }
    }

    handleSectionVisibility();

    var navLinks = $('.app-nav-list a');

    // Gérer la mise en surbrillance des liens de navigation lors du clic
    navLinks.on('click',function() {
        navLinks.removeClass('active');
        $(this).addClass('active');
        var sectionId = $(this).attr('href');
        $('.section').addClass('d-none');
        $(sectionId).removeClass('d-none');
    });

    // Fonction pour ajuster le nombre de colonnes d'anime en fonction de la largeur d'écran
    function adjustAnimeRow() {
        var screenWidth = window.innerWidth;
        if (screenWidth < 400) {
            $('.animeRow').removeClass('row-cols-2').addClass('row-cols-1');
        } else {
            $('.animeRow').removeClass('row-cols-1').addClass('row-cols-2');
        }
    }

    adjustAnimeRow();

    // Redimensionnement de la fenêtre pour ajuster le nombre de colonnes d'anime
    $(window).on('resize',function() {
        adjustAnimeRow();
    });

    
    var page = 1;
    var loading = false;
    var allAnimes = $('#allAnimes');
    var recommendAnimes = $('#recommendAnimes');
    var infiniteScrollTrigger = $('#infinite-scroll-trigger');
    var loadingDiv = $('#loading'); // La div où vous voulez afficher l'indicateur de chargement

    // Fonction pour afficher l'indicateur de chargement
    function showLoadingIndicator() {
        var loadingIndicator = $(`
        <style>
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .loading-indicator {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100px; /* Ajustez la hauteur selon vos besoins */
        }
        
        .loader {
            border: 4px solid rgb(255, 255, 255);
            border-top: 4px solid #999999;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            animation: spin 1s linear infinite;
        }
        </style>        
        <div class="loading-indicator mb-4">
            <div class="loader">
            </div>
        </div>`);
        loadingDiv.html(loadingIndicator);
    }
    
    // Fonction pour cacher l'indicateur de chargement
    function hideLoadingIndicator() {
        $('.loading-indicator').remove();
    }

    // Fonction pour charger plus d'animes en défilement infini
    function loadMoreAnimes() {
        if (loading) {
            return;
        }
        // Avant d'afficher le "skeleton screen"
        $('.skeletonRow').addClass('disable-scroll');

        loading = true;
        var apiUrl = `https://api.jikan.moe/v4/anime?page=${page}`;

        showLoadingIndicator(); // Afficher l'indicateur de chargement

        // Appel à l'API pour obtenir les données d'anime
        $.getJSON(apiUrl, function(data) {
            var animes = data.data;

            // Parcourir les données d'anime et générer les cartes correspondantes
            $.each(animes, function(index, anime) {
                var title = anime.title;
                var title_japanese = anime.title_japanese;
                var imageUrl = anime.images.jpg.image_url;
                var animeId = anime.mal_id;
                var animeType = anime.type;
                var animePopularity = anime.popularity;

                var cardHtml = `
                    <div class="col mb-3">
                        <button type="button" class="card bg-dark h-100 w-100 d-flex flex-column justify-content-between p-0 text-white text-start" data-bs-toggle="modal" data-bs-target="#animeModal" data-anime-id="${animeId}">
                            <img src="${imageUrl}" class="card-img-top anime-thumbnail w-100" alt="${title}">
                            <div class="card-body d-flex flex-column justify-content-center">
                                <h5 class="card-title">${title}</h5>
                                <h5 class="card-title">${title_japanese}</h5>
                                <p class="card-p">${animeType}</p>
                            </div>
                        </button>
                    </div>`;
                allAnimes.append(cardHtml);

                if (animePopularity <= 7000 && (animeType === "TV" || animeType === "Movie" || animeType === "ONA")) {
                    var recommendAnimesCardHtml = `
                        <div class="col mb-3">
                            <button type="button" style="width:200px" class="card bg-dark d-flex h-100 flex-column justify-content-between p-0 text-white text-start" data-bs-toggle="modal" data-bs-target="#animeModal" data-anime-id="${animeId}">
                                <img src="${imageUrl}" class="card-img-top w-100" alt="${title}">
                                <div class="card-body d-flex flex-column justify-content-center">
                                    <p class="card-title">${title}</p>
                                </div>
                            </button>
                        </div>`;
                    recommendAnimes.append(recommendAnimesCardHtml);
                }
                $('#recommendAnimesSkeleton').remove();
            
            });

            loading = false;
            page++;
            // Après le chargement, enlever la classe "disable-scroll"
            $('.skeletonRow').removeClass('disable-scroll');
            // Supprimer les éléments de skeleton screen
            $('.skeletonRow').remove();
        
        hideLoadingIndicator(); // Cacher l'indicateur de chargement

        });
    }

    // Écouter l'événement de défilement pour charger plus d'animes
    $(window).on('scroll', function() {
        var triggerOffset = infiniteScrollTrigger.offset().top;
        var windowOffset = $(window).scrollTop() + $(window).height();

        if (windowOffset > triggerOffset) {
            loadMoreAnimes();
        }
    });

    // Charger les premiers animes
    loadMoreAnimes();

    // Gérer l'événement d'ouverture du modal pour afficher les détails d'anime
    $('#animeModal').on('show.bs.modal', function(event) {
        var modal = $(this);
        var button = $(event.relatedTarget);
        var animeId = button.data('anime-id');

        // Utilisez l'ID de l'anime pour récupérer les détails via une requête AJAX
        $.getJSON(`https://api.jikan.moe/v4/anime/${animeId}`, function(data) {
            var animeData = data.data;
            var title = animeData.title;

            modal.find('.modal-title').text(title);

            var detailsHtml = `
            <div class="row">
            <div class="col-md-4">
                <img src="${animeData.images.jpg.large_image_url}" class="img-fluid rounded w-100" alt="${title}">
            </div>
            <div class="col-md-8 row">
                <h4 class="mt-2">${title}</h4>
                <h5>${animeData.title_japanese}</h5>
                <hr class="border-dark">
                <p> ${animeData.synopsis}</p>
                <p class="col-6"> <strong>Type:</strong> ${animeData.type}</p>
                <p class="col-6"> <strong>Source:</strong> ${animeData.source}</p>
                <p class="col-6"> <strong>Épisodes:</strong> ${animeData.episodes}</p>
                <p class="col-6"> <strong>Statut:</strong> ${animeData.status}</p>
                <p class="col-6"> <strong>Diffusé:</strong> ${animeData.aired.string}</p>
                <p class="col-6"> <strong>Durée:</strong> ${animeData.duration}</p>
                <p class="col-6"> <strong>Popularité:</strong> ${animeData.popularity}</p>
                <!-- Ajouter d'autres détails ici -->
            </div>
        </div>
                    `;

            modal.find('.anime-details').html(detailsHtml);
        });
    });

    var searchPage = 1; // Utilisez une variable distincte pour le chargement infini pendant la recherche

// Créer une fonction pour gérer les filtres et le chargement infini
function applyFiltersAndLoad() {
    // Réappliquer les filtres en fonction du terme de recherche
    var searchTerm = $('#search').val().toLowerCase();
    $('.anime-thumbnail').each(function() {
        var title = $(this).siblings('.card-body').find('.card-title').first().text().toLowerCase();
        var titleJapanese = $(this).siblings('.card-body').find('.card-title').eq(1).text().toLowerCase();
        var animeType = $(this).siblings('.card-body').find('.card-p').first().text().toLowerCase();

        if (title.includes(searchTerm) || titleJapanese.includes(searchTerm) || animeType.includes(searchTerm)) {
            $(this).closest('.col').removeClass('d-none');
        } else {
            $(this).closest('.col').addClass('d-none');
        }
    });

    // Appeler la fonction de chargement infini
    loadMoreAnimes();

    // Appeler cette fonction à nouveau après un délai (boucle infinie)
    setTimeout(applyFiltersAndLoad, 2000); // Exemple : appelle toutes les 1 seconde (ajustez selon vos besoins)
}

// Écouter l'événement de saisie dans la barre de recherche
$('#search').on('input', function() {
    // Réinitialiser la page de chargement infini pendant la recherche
    searchPage = 1;

    // Appeler la fonction pour appliquer les filtres et charger les animes
    applyFiltersAndLoad();
});
    
    
});
