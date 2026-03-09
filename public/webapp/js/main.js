function cambiarNavbarEnScroll() {
	var navbar = document.querySelector('.navbar');
	if (!navbar) return;

	if (window.scrollY > 20) {
		navbar.classList.add('scrolled');
	} else {
		navbar.classList.remove('scrolled');
	}
}

var estadoGaleria = {
	recetas: [],
	filtroTiempo: 'all',
	filtroIngrediente: 'all'
};

var filtrosDeTiempo = [
	{ key: 'all', label: 'Todas' },
	{ key: 'rapidas', label: 'Rapidas (<= 30 min)' },
	{ key: 'medias', label: 'Medias (31-60 min)' },
	{ key: 'largas', label: 'Largas (> 60 min)' }
];

var palabrasNoIngrediente = {
	de: true,
	del: true,
	la: true,
	el: true,
	los: true,
	las: true,
	u: true,
	o: true,
	y: true,
	para: true,
	al: true,
	un: true,
	una: true,
	unos: true,
	unas: true,
	opcional: true,
	opcionales: true,
	pizca: true,
	rebanada: true,
	rebanadas: true,
	diente: true,
	dientes: true,
	chorro: true,
	chorros: true,
	gramo: true,
	gramos: true,
	kg: true,
	g: true,
	ml: true,
	l: true,
	temperada: true,
	maduro: true,
	maduros: true,
	fresco: true,
	fresca: true,
	frescos: true,
	frescas: true,
	virgen: true,
	extra: true,
	grande: true,
	grandes: true,
	mezcla: true,
	al: true,
	gusto: true
};

var ingredientesPocoRelevantes = {
	sal: true,
	agua: true,
	aceite: true,
	oliva: true,
	pimienta: true,
	azucar: true,
	harina: true,
	huevo: true,
	huev: true,
	leche: true,
	caldo: true,
	manteca: true,
	mantequilla: true,
	levadura: true,
	limon: true,
	canela: true,
	perejil: true,
	romero: true,
	tomillo: true
};

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

function normalizarTexto(texto) {
	if (typeof texto !== 'string') return '';

	return texto
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.trim();
}

function singularizarPalabra(palabra) {
	if (palabra.length > 4 && palabra.endsWith('es')) {
		return palabra.slice(0, -2);
	}

	if (palabra.length > 3 && palabra.endsWith('s')) {
		return palabra.slice(0, -1);
	}

	return palabra;
}

function extraerIngredientesCanonicosDeLinea(lineaIngrediente) {
	var linea = normalizarTexto(lineaIngrediente)
		.replace(/\([^)]*\)/g, ' ')
		.replace(/[:]/g, ' ')
		.replace(/[0-9]+([.,][0-9]+)?/g, ' ')
		.replace(/[\/]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();

	if (!linea) return [];

	var partes = linea.split(/,|\sy\s/);
	var ingredientes = [];

	partes.forEach(function(parte) {
		var palabras = parte.trim().split(/\s+/).filter(Boolean);
		if (palabras.length === 0) return;

		var palabraIngrediente = null;

		for (var i = 0; i < palabras.length; i++) {
			var limpia = palabras[i].replace(/[^a-z]/g, '');
			if (!limpia || palabrasNoIngrediente[limpia]) continue;

			palabraIngrediente = singularizarPalabra(limpia);
			break;
		}

		if (palabraIngrediente && ingredientes.indexOf(palabraIngrediente) === -1) {
			ingredientes.push(palabraIngrediente);
		}
	});

	return ingredientes;
}

function obtenerIngredientesDeReceta(receta) {
	if (!receta || !Array.isArray(receta.recipeIngredient)) return [];

	var ingredientes = [];

	receta.recipeIngredient.forEach(function(linea) {
		extraerIngredientesCanonicosDeLinea(linea).forEach(function(ingrediente) {
			if (ingredientes.indexOf(ingrediente) === -1) {
				ingredientes.push(ingrediente);
			}
		});
	});

	return ingredientes;
}

function capitalizar(texto) {
	if (!texto) return '';
	return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function normalizarIngredienteBase(ingrediente) {
	var base = normalizarTexto(ingrediente);
	if (!base) return '';

	if (base === 'tomates') return 'tomate';
	if (base === 'patatas') return 'patata';
	if (base === 'pimientos') return 'pimiento';
	if (base === 'cebollas') return 'cebolla';
	if (base === 'ajos') return 'ajo';
	if (base === 'guisantes') return 'guisante';
	if (base === 'setas') return 'seta';
	if (base === 'almendras') return 'almendra';

	return base;
}

function esIngredienteImportante(ingrediente) {
	var base = normalizarIngredienteBase(ingrediente);
	if (!base) return false;

	return !ingredientesPocoRelevantes[base];
}

function obtenerIngredientesDestacadosDeReceta(receta) {
	var ingredientes = obtenerIngredientesDeReceta(receta);
	var destacados = ingredientes.filter(esIngredienteImportante);

	if (destacados.length > 0) return destacados;

	return ingredientes.filter(function(ingrediente) {
		return normalizarIngredienteBase(ingrediente) !== 'sal';
	});
}

function obtenerIngredientesFrecuentes(recetas, limite) {
	var puntuaciones = {};

	recetas.forEach(function(receta) {
		var keywords = normalizarTexto(receta.keywords || '');

		obtenerIngredientesDestacadosDeReceta(receta).forEach(function(ingrediente, indice) {
			var base = normalizarIngredienteBase(ingrediente);
			if (!base) return;

			var peso = 1;

			if (indice < 3) {
				peso += 1;
			}

			if (keywords.indexOf(base) !== -1) {
				peso += 2;
			}

			puntuaciones[base] = (puntuaciones[base] || 0) + peso;
		});
	});

	return Object.keys(puntuaciones)
		.sort(function(a, b) {
			if (puntuaciones[b] === puntuaciones[a]) {
				return a.localeCompare(b, 'es');
			}

			return puntuaciones[b] - puntuaciones[a];
		})
		.slice(0, limite)
		.map(function(ingrediente) {
			return {
				key: ingrediente,
				label: capitalizar(ingrediente)
			};
		});
}

function extraerMinutosDesdeISO8601(duracionIso) {
	if (typeof duracionIso !== 'string') return null;

	var coincidencia = duracionIso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:\d+S)?$/);
	if (!coincidencia) return null;

	var horas = parseInt(coincidencia[1] || '0', 10);
	var minutos = parseInt(coincidencia[2] || '0', 10);

	return (horas * 60) + minutos;
}

function obtenerClaveFiltroPorMinutos(minutos) {
	if (typeof minutos !== 'number' || isNaN(minutos)) return 'all';
	if (minutos <= 30) return 'rapidas';
	if (minutos <= 60) return 'medias';
	return 'largas';
}

function formatearMinutos(minutos) {
	if (typeof minutos !== 'number' || isNaN(minutos)) return 'Tiempo no disponible';

	var horas = Math.floor(minutos / 60);
	var restoMinutos = minutos % 60;

	if (horas === 0) return minutos + ' min';
	if (restoMinutos === 0) return horas + ' h';

	return horas + ' h ' + restoMinutos + ' min';
}

function crearBotonFiltro(filtro) {
	var boton = document.createElement('button');
	boton.type = 'button';
	boton.className = 'filtro-btn';
	boton.textContent = filtro.label;
	boton.setAttribute('data-filtro-tiempo', filtro.key);
	boton.setAttribute('aria-pressed', 'false');

	boton.addEventListener('click', function() {
		estadoGaleria.filtroTiempo = filtro.key;
		actualizarEstadoBotonesFiltro();
		aplicarFiltrosYRenderizar();
	});

	return boton;
}

function pintarFiltrosGaleria() {
	var contenedor = document.getElementById('galeria-filtros');
	if (!contenedor) return;

	contenedor.innerHTML = '';

	filtrosDeTiempo.forEach(function(filtro) {
		contenedor.appendChild(crearBotonFiltro(filtro));
	});

	actualizarEstadoBotonesFiltro();
}

function actualizarEstadoBotonesFiltro() {
	var botones = document.querySelectorAll('#galeria-filtros .filtro-btn');

	botones.forEach(function(boton) {
		var activo = boton.getAttribute('data-filtro-tiempo') === estadoGaleria.filtroTiempo;
		boton.classList.toggle('is-active', activo);
		boton.setAttribute('aria-pressed', activo ? 'true' : 'false');
	});
}

function crearBotonFiltroIngrediente(filtro) {
	var boton = document.createElement('button');
	boton.type = 'button';
	boton.className = 'filtro-btn';
	boton.textContent = filtro.label;
	boton.setAttribute('data-filtro-ingrediente', filtro.key);
	boton.setAttribute('aria-pressed', 'false');

	boton.addEventListener('click', function() {
		estadoGaleria.filtroIngrediente = filtro.key;
		actualizarEstadoBotonesIngredientes();
		aplicarFiltrosYRenderizar();
	});

	return boton;
}

function pintarFiltrosIngredientes(recetas) {
	var contenedor = document.getElementById('galeria-filtros-ingredientes');
	if (!contenedor) return;

	contenedor.innerHTML = '';

	var filtrosIngredientes = [{ key: 'all', label: 'Todos' }].concat(obtenerIngredientesFrecuentes(recetas, 10));

	filtrosIngredientes.forEach(function(filtro) {
		contenedor.appendChild(crearBotonFiltroIngrediente(filtro));
	});

	actualizarEstadoBotonesIngredientes();
}

function actualizarEstadoBotonesIngredientes() {
	var botones = document.querySelectorAll('#galeria-filtros-ingredientes .filtro-btn');

	botones.forEach(function(boton) {
		var activo = boton.getAttribute('data-filtro-ingrediente') === estadoGaleria.filtroIngrediente;
		boton.classList.toggle('is-active', activo);
		boton.setAttribute('aria-pressed', activo ? 'true' : 'false');
	});
}

function filtrarRecetasPorTiempo(recetas, filtroTiempo) {
	if (filtroTiempo === 'all') return recetas;

	return recetas.filter(function(receta) {
		var minutos = extraerMinutosDesdeISO8601(receta.totalTime);
		return obtenerClaveFiltroPorMinutos(minutos) === filtroTiempo;
	});
}

function filtrarRecetasPorIngrediente(recetas, ingrediente) {
	if (ingrediente === 'all') return recetas;
	var ingredienteNormalizado = normalizarIngredienteBase(ingrediente);

	return recetas.filter(function(receta) {
		return obtenerIngredientesDeReceta(receta).some(function(item) {
			return normalizarIngredienteBase(item) === ingredienteNormalizado;
		});
	});
}

function pintarGaleria(recetas) {
	var galeriaListado = document.getElementById('galeria-listado');
	if (!galeriaListado) return;

	galeriaListado.innerHTML = '';

	if (!Array.isArray(recetas) || recetas.length === 0) {
		var vacio = document.createElement('div');
		vacio.className = 'col-12';
		vacio.innerHTML = '<p class="text-center text-muted mb-0">No hay recetas para este filtro.</p>';
		galeriaListado.appendChild(vacio);
		return;
	}

	recetas.forEach(function(receta) {
		var imagen = escogerImagenAleatoria(receta.image);
		if (!imagen) return;
		var minutosTotales = extraerMinutosDesdeISO8601(receta.totalTime);

		var col = document.createElement('div');
		col.className = 'col-md-4 mb-4';

		var card = document.createElement('div');
		card.className = 'card h-100';

		var img = document.createElement('img');
		img.src = imagen;
		img.className = 'card-img-top';
		img.alt = receta.name || 'Receta mallorquina';

		var body = document.createElement('div');
		body.className = 'card-body';

		var titulo = document.createElement('h5');
		titulo.className = 'card-title';
		titulo.textContent = receta.name || 'Receta';

		var meta = document.createElement('p');
		meta.className = 'card-text text-muted mb-2';
		meta.textContent = 'Tiempo total: ' + formatearMinutos(minutosTotales);

		var descripcion = document.createElement('p');
		descripcion.className = 'card-text';
		descripcion.textContent = receta.description || '';

		body.appendChild(titulo);
		body.appendChild(meta);
		body.appendChild(descripcion);

		card.appendChild(img);
		card.appendChild(body);
		col.appendChild(card);

		galeriaListado.appendChild(col);
	});
}

function aplicarFiltrosYRenderizar() {
	var recetasFiltradas = filtrarRecetasPorTiempo(estadoGaleria.recetas, estadoGaleria.filtroTiempo);
	recetasFiltradas = filtrarRecetasPorIngrediente(recetasFiltradas, estadoGaleria.filtroIngrediente);
	pintarGaleria(recetasFiltradas);
}

function iniciarSliderHeader(recetas) {
	var slidesContainer = document.getElementById('header-slides');
	var titleElement = document.getElementById('header-slide-title');
	if (!slidesContainer || !titleElement) return;

	var slideItems = recetas
		.map(function(receta) {
			var imagenes = [];

			if (Array.isArray(receta.image)) {
				receta.image.forEach(function(ruta) {
					var normalizada = normalizarRutaImagen(ruta);
					if (normalizada) {
						imagenes.push(normalizada);
					}
				});
			} else {
				var unica = normalizarRutaImagen(receta.image);
				if (unica) {
					imagenes.push(unica);
				}
			}

			if (imagenes.length === 0) return null;

			return {
				name: receta.name || 'Sabors de Mallorca',
				images: imagenes
			};
		})
		.filter(Boolean);

	if (slideItems.length === 0) return;

	slidesContainer.innerHTML = '';

	var slideElement = document.createElement('div');
	slideElement.className = 'header-slide is-active';
	slidesContainer.appendChild(slideElement);

	function aplicarSlide(indice) {
		var item = slideItems[indice];
		if (!item) return;

		var imagen = escogerImagenAleatoria(item.images);
		if (!imagen) return;

		slideElement.style.backgroundImage = "url('" + imagen + "')";
		titleElement.textContent = item.name;
	}

	var currentIndex = Math.floor(Math.random() * slideItems.length);
	aplicarSlide(currentIndex);

	if (slideItems.length === 1) return;

	setInterval(function() {
		var nextIndex = currentIndex;

		while (nextIndex === currentIndex) {
			nextIndex = Math.floor(Math.random() * slideItems.length);
		}

		currentIndex = nextIndex;
		aplicarSlide(currentIndex);
	}, 5000);
}

function cargarRecetasConFallback() {
	var rutas = [
		'data/Receta.json',
		'webapp/data/Receta.json',
		'public/webapp/data/Receta.json'
	];

	function intentarRuta(indice) {
		if (indice >= rutas.length) {
			return Promise.reject(new Error('No se pudo cargar Receta.json en ninguna ruta conocida'));
		}

	var ruta = rutas[indice];

		return fetch(ruta)
			.then(function(response) {
				if (!response.ok) {
					throw new Error('HTTP ' + response.status + ' en ' + ruta);
				}

				return response.json();
			})
			.catch(function() {
				return intentarRuta(indice + 1);
			});
	}

	return intentarRuta(0);
}

document.addEventListener('DOMContentLoaded', function() {
	window.addEventListener('scroll', cambiarNavbarEnScroll);
	cambiarNavbarEnScroll();

	cargarRecetasConFallback()
		.then(function(data) {
			estadoGaleria.recetas = data['@graph'] || [];
			pintarFiltrosGaleria();
			pintarFiltrosIngredientes(estadoGaleria.recetas);
			aplicarFiltrosYRenderizar();
			iniciarSliderHeader(estadoGaleria.recetas);
		})
		.catch(function(error) {
			console.error('No se pudo cargar Receta.json:', error);
		});
});
