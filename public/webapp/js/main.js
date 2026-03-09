function cambiarNavbarEnScroll() {
	var navbar = document.querySelector('.navbar');
	if (!navbar) return;

	if (window.scrollY > 20) {
		navbar.classList.add('scrolled');
	} else {
		navbar.classList.remove('scrolled');
	}
}

function escogerImagenAleatoria(imagenes) {
	if (Array.isArray(imagenes) && imagenes.length > 0) {
		var indice = Math.floor(Math.random() * imagenes.length);
		return normalizarRutaImagen(imagenes[indice]);
	}

	if (typeof imagenes === 'string' && imagenes.trim() !== '') {
		return normalizarRutaImagen(imagenes);
	}

	return null;
}

function normalizarRutaImagen(rutaImagen) {
	if (typeof rutaImagen !== 'string') return null;

	var ruta = rutaImagen.trim();
	if (!ruta) return null;

	var marcadorImg = '/img/';
	var indiceImg = ruta.indexOf(marcadorImg);

	// Convierte URLs absolutas del JSON a rutas locales para evitar diferencias entre entornos.
	if (indiceImg !== -1) {
		return 'img/' + ruta.substring(indiceImg + marcadorImg.length);
	}

	return ruta;
}

function pintarGaleria(recetas) {
	var galeriaListado = document.getElementById('galeria-listado');
	if (!galeriaListado) return;

	galeriaListado.innerHTML = '';

	recetas.forEach(function(receta) {
		var imagen = escogerImagenAleatoria(receta.image);
		if (!imagen) return;

		var col = document.createElement('div');
		col.className = 'col-md-4 mb-4';
		col.innerHTML =
			'<div class="card h-100">' +
				'<img src="' + imagen + '" class="card-img-top" alt="' + receta.name + '">' +
				'<div class="card-body">' +
					'<h5 class="card-title">' + receta.name + '</h5>' +
					'<p class="card-text">' + (receta.description || '') + '</p>' +
				'</div>' +
			'</div>';

		galeriaListado.appendChild(col);
	});
}

function iniciarSliderHeader(recetas) {
	var slidesContainer = document.getElementById('header-slides');
	var titleElement = document.getElementById('header-slide-title');
	if (!slidesContainer || !titleElement) return;

	var slideItems = [];

	recetas.forEach(function(receta) {
		var imagen = escogerImagenAleatoria(receta.image);
		if (!imagen) return;

		slideItems.push({
			name: receta.name,
			image: imagen
		});
	});

	if (slideItems.length === 0) return;

	slidesContainer.innerHTML = '';

	slideItems.forEach(function(slide, index) {
		var slideElement = document.createElement('div');
		slideElement.className = index === 0 ? 'header-slide is-active' : 'header-slide';
		slideElement.style.backgroundImage = "url('" + slide.image + "')";
		slideElement.setAttribute('data-recipe-name', slide.name);
		slidesContainer.appendChild(slideElement);
	});

	titleElement.textContent = slideItems[0].name;

	if (slideItems.length === 1) return;

	var currentIndex = 0;

	setInterval(function() {
		var allSlides = slidesContainer.querySelectorAll('.header-slide');
		allSlides[currentIndex].classList.remove('is-active');

		currentIndex = (currentIndex + 1) % allSlides.length;
		allSlides[currentIndex].classList.add('is-active');

		titleElement.textContent = allSlides[currentIndex].getAttribute('data-recipe-name') || 'Sabors de Mallorca';
	}, 5000);
}

document.addEventListener('DOMContentLoaded', function() {
	window.addEventListener('scroll', cambiarNavbarEnScroll);
	cambiarNavbarEnScroll();

	fetch('data/Receta.json')
		.then(function(response) {
			if (!response.ok) {
				throw new Error('HTTP ' + response.status);
			}

			return response.json();
		})
		.then(function(data) {
			var recetas = data['@graph'] || [];
			pintarGaleria(recetas);
			iniciarSliderHeader(recetas);
		})
		.catch(function(error) {
			console.error('No se pudo cargar data/Receta.json:', error);
		});
});
