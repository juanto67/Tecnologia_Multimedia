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
	filtroIngrediente: 'all',
	filtroNombre: ''
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

function escogerImagenPrincipal(imagenes) {
	if (Array.isArray(imagenes) && imagenes.length > 0) {
		return normalizarRutaImagen(imagenes[0]);
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
	if (palabra === 'tomates') return 'tomate';

	if (palabra.length > 4 && palabra.endsWith('es')) {
		return palabra.slice(0, -2);
	}

	if (palabra.length > 3 && palabra.endsWith('s')) {
		return palabra.slice(0, -1);
	}

	return palabra;
}

function extraerIngredientesCanonicosDeLinea(lineaIngrediente) {
	var lineaNormalizada = normalizarTexto(lineaIngrediente)
		.replace(/\([^)]*\)/g, ' ')
		.replace(/[:]/g, ' ')
		.replace(/[0-9]+([.,][0-9]+)?/g, ' ')
		.replace(/[\/]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();

	if (!lineaNormalizada) return [];

	var ingredientes = [];

	if (lineaNormalizada.indexOf('ralladura de limon') !== -1) {
		ingredientes.push('ralladura de limon');
		lineaNormalizada = lineaNormalizada.replace('ralladura de limon', '').trim();
	}

	if (lineaNormalizada.indexOf('ralladura de naranja') !== -1) {
		ingredientes.push('ralladura de naranja');
		lineaNormalizada = lineaNormalizada.replace('ralladura de naranja', '').trim();
	}

	var linea = lineaNormalizada
		.replace(/\([^)]*\)/g, ' ')
		.replace(/[:]/g, ' ')
		.replace(/[0-9]+([.,][0-9]+)?/g, ' ')
		.replace(/[\/]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();

	if (!linea) return [];

	var partes = linea.split(/,|\sy\s/);

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

	if (base === 'tomat') return 'tomate';
	if (base === 'tomates') return 'tomate';
	if (base === 'patatas') return 'patata';
	if (base === 'pimientos') return 'pimiento';
	if (base === 'cebollas') return 'cebolla';
	if (base === 'ajos') return 'ajo';
	if (base === 'guisantes') return 'guisante';
	if (base === 'setas') return 'seta';
	if (base === 'almendras') return 'almendra';
	if (base === 'ralladura') return 'ralladura de limon';

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

function inicializarFiltroNombre() {
	var input = document.getElementById('galeria-filtro-nombre');
	if (!input) return;

	input.value = estadoGaleria.filtroNombre;
	input.addEventListener('input', function(event) {
		estadoGaleria.filtroNombre = event.target.value || '';
		aplicarFiltrosYRenderizar();
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

function filtrarRecetasPorNombre(recetas, texto) {
	var consulta = normalizarTexto(texto || '');
	if (!consulta) return recetas;

	return recetas.filter(function(receta) {
		return normalizarTexto(receta.name || '').indexOf(consulta) !== -1;
	});
}

var estadoFichaReceta = {
	overlay: null,
	ficha: null,
	contenido: null,
	focoAnterior: null
};

function obtenerIdReceta(receta) {
	if (!receta || typeof receta !== 'object') return '';

	var id = receta['@id'];
	if (typeof id === 'string' && id.trim() !== '') return id;

	var url = receta.url;
	if (typeof url === 'string' && url.trim() !== '') return url;

	var identifier = receta.identifier;
	if (typeof identifier === 'string' && identifier.trim() !== '') return identifier;

	if (identifier && typeof identifier === 'object' && typeof identifier.value === 'string') {
		return identifier.value;
	}

	return '';
}

function extraerPasosDeInstrucciones(recipeInstructions) {
	if (!recipeInstructions) return [];

	if (typeof recipeInstructions === 'string') {
		var texto = recipeInstructions.trim();
		return texto ? [texto] : [];
	}

	var pasos = [];

	function agregarPaso(texto) {
		if (typeof texto !== 'string') return;
		var limpio = texto.trim();
		if (!limpio) return;
		pasos.push(limpio);
	}

	function procesarNodo(nodo) {
		if (!nodo) return;

		if (typeof nodo === 'string') {
			agregarPaso(nodo);
			return;
		}

		if (Array.isArray(nodo)) {
			nodo.forEach(procesarNodo);
			return;
		}

		if (typeof nodo !== 'object') return;

		if (typeof nodo.text === 'string') {
			agregarPaso(nodo.text);
		}

		if (Array.isArray(nodo.itemListElement)) {
			nodo.itemListElement.forEach(function(item) {
				if (item && typeof item === 'object' && typeof item.text === 'string') {
					agregarPaso(item.text);
				} else {
					procesarNodo(item);
				}
			});
		}
 	}

	procesarNodo(recipeInstructions);
	return pasos;
}

function asegurarOverlayFichaReceta() {
	if (estadoFichaReceta.overlay) return;

	var overlay = document.createElement('div');
	overlay.id = 'receta-overlay';
	overlay.className = 'receta-overlay';
	overlay.setAttribute('hidden', 'hidden');

	var ficha = document.createElement('div');
	ficha.className = 'card receta-ficha';
	ficha.setAttribute('role', 'dialog');
	ficha.setAttribute('aria-modal', 'true');
	ficha.setAttribute('tabindex', '-1');

	var cerrar = document.createElement('button');
	cerrar.type = 'button';
	cerrar.className = 'receta-ficha-cerrar';
	cerrar.setAttribute('aria-label', 'Cerrar ficha de receta');
	cerrar.innerHTML = '&times;';
	cerrar.addEventListener('click', function(event) {
		event.preventDefault();
		event.stopPropagation();
		cerrarFichaReceta();
	});

	var contenido = document.createElement('div');
	contenido.className = 'card-body receta-ficha-body';

	ficha.appendChild(cerrar);
	ficha.appendChild(contenido);
	overlay.appendChild(ficha);
	document.body.appendChild(overlay);

	overlay.addEventListener('click', function(event) {
		if (event.target === overlay) {
			cerrarFichaReceta();
		}
	});

	document.addEventListener('keydown', function(event) {
		if (event.key !== 'Escape') return;
		if (!estadoFichaReceta.overlay) return;
		if (estadoFichaReceta.overlay.hasAttribute('hidden')) return;
		cerrarFichaReceta();
	});

	estadoFichaReceta.overlay = overlay;
	estadoFichaReceta.ficha = ficha;
	estadoFichaReceta.contenido = contenido;
}

function renderizarFichaReceta(receta) {
	asegurarOverlayFichaReceta();

	var contenido = estadoFichaReceta.contenido;
	if (!contenido) return;

	contenido.innerHTML = '';

	var titulo = document.createElement('h2');
	titulo.id = 'receta-ficha-titulo';
	titulo.className = 'h4 mb-3';
	titulo.textContent = receta.name || 'Receta';
	contenido.appendChild(titulo);

	estadoFichaReceta.ficha.setAttribute('aria-labelledby', titulo.id);

	var imagen = escogerImagenPrincipal(receta.image);
	if (imagen) {
		var img = document.createElement('img');
		img.src = imagen;
		img.alt = receta.name || 'Receta mallorquina';
		img.className = 'img-fluid mb-3';
		contenido.appendChild(img);
	}

	var minutosTotales = extraerMinutosDesdeISO8601(receta.totalTime);
	var meta = document.createElement('p');
	meta.className = 'text-muted mb-3';
	meta.textContent = 'Tiempo total: ' + formatearMinutos(minutosTotales);
	contenido.appendChild(meta);

	if (receta.description) {
		var descripcion = document.createElement('p');
		descripcion.className = 'mb-4';
		descripcion.textContent = receta.description;
		contenido.appendChild(descripcion);
	}

	if (Array.isArray(receta.recipeIngredient) && receta.recipeIngredient.length > 0) {
		var hIngredientes = document.createElement('h3');
		hIngredientes.className = 'h5 mb-2';
		hIngredientes.textContent = 'Ingredientes';
		contenido.appendChild(hIngredientes);

		var lista = document.createElement('ul');
		lista.className = 'mb-4';
		receta.recipeIngredient.forEach(function(linea) {
			if (typeof linea !== 'string' || !linea.trim()) return;
			var li = document.createElement('li');
			li.textContent = linea.trim();
			lista.appendChild(li);
		});
		contenido.appendChild(lista);
	}

	var pasos = extraerPasosDeInstrucciones(receta.recipeInstructions);
	if (pasos.length > 0) {
		var hPasos = document.createElement('h3');
		hPasos.className = 'h5 mb-2';
		hPasos.textContent = 'Preparación';
		contenido.appendChild(hPasos);

		var ol = document.createElement('ol');
		ol.className = 'mb-0';
		pasos.forEach(function(paso) {
			var li = document.createElement('li');
			li.textContent = paso;
			ol.appendChild(li);
		});
		contenido.appendChild(ol);
	}
}

function abrirFichaRecetaDesdeElemento(elemento) {
	if (!elemento) return;
	asegurarOverlayFichaReceta();

	var recetaId = (elemento.getAttribute('data-receta-id') || '').trim();
	var indiceTexto = elemento.getAttribute('data-receta-indice');
	var indice = indiceTexto ? parseInt(indiceTexto, 10) : NaN;

	var receta = null;
	if (recetaId) {
		receta = estadoGaleria.recetas.find(function(item) {
			return obtenerIdReceta(item) === recetaId;
		});
	}

	if (!receta && !isNaN(indice) && estadoGaleria.recetas[indice]) {
		receta = estadoGaleria.recetas[indice];
	}

	if (!receta) return;

	estadoFichaReceta.focoAnterior = document.activeElement;
	renderizarFichaReceta(receta);

	estadoFichaReceta.overlay.removeAttribute('hidden');
	estadoFichaReceta.overlay.classList.add('is-open');
	document.body.classList.add('receta-overlay-open');
	estadoFichaReceta.ficha.focus();
}

function cerrarFichaReceta() {
	if (!estadoFichaReceta.overlay) return;

	estadoFichaReceta.overlay.classList.remove('is-open');
	estadoFichaReceta.overlay.setAttribute('hidden', 'hidden');
	document.body.classList.remove('receta-overlay-open');

	var foco = estadoFichaReceta.focoAnterior;
	estadoFichaReceta.focoAnterior = null;
	if (foco && typeof foco.focus === 'function') {
		foco.focus();
	}
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

	recetas.forEach(function(receta, indice) {
		var imagen = escogerImagenPrincipal(receta.image);
		if (!imagen) return;
		var minutosTotales = extraerMinutosDesdeISO8601(receta.totalTime);
		var indiceOriginal = estadoGaleria.recetas.indexOf(receta);

		var col = document.createElement('div');
		col.className = 'col-md-4 mb-4';

		var card = document.createElement('button');
		card.type = 'button';
		card.className = 'card h-100 galeria-card';
		card.setAttribute('data-receta-id', obtenerIdReceta(receta));
		card.setAttribute('data-receta-indice', String(indiceOriginal === -1 ? indice : indiceOriginal));
		card.setAttribute('aria-label', 'Abrir receta: ' + (receta.name || 'Receta'));
		card.addEventListener('click', function(event) {
			abrirFichaRecetaDesdeElemento(event.currentTarget);
		});

		var media = document.createElement('div');
		media.className = 'galeria-card-media';

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

		media.appendChild(img);
		card.appendChild(media);
		card.appendChild(body);
		col.appendChild(card);

		galeriaListado.appendChild(col);
	});
}

function aplicarFiltrosYRenderizar() {
	var recetasFiltradas = filtrarRecetasPorTiempo(estadoGaleria.recetas, estadoGaleria.filtroTiempo);
	recetasFiltradas = filtrarRecetasPorIngrediente(recetasFiltradas, estadoGaleria.filtroIngrediente);
	recetasFiltradas = filtrarRecetasPorNombre(recetasFiltradas, estadoGaleria.filtroNombre);
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
			inicializarFiltroNombre();
			pintarFiltrosGaleria();
			pintarFiltrosIngredientes(estadoGaleria.recetas);
			aplicarFiltrosYRenderizar();
			iniciarSliderHeader(estadoGaleria.recetas);
		})
		.catch(function(error) {
			console.error('No se pudo cargar Receta.json:', error);
		});
});
