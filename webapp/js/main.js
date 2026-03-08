// Galería dinámica desde Receta.json
fetch('data/Receta.json')
	.then(response => response.json())
	.then(data => {
		const recetas = data['@graph'] || [];
		const galeriaListado = document.getElementById('galeria-listado');
		galeriaListado.innerHTML = '';
		recetas.forEach(receta => {
			const col = document.createElement('div');
			col.className = 'col-md-4 mb-4';
			col.innerHTML = `
				<div class="card h-100">
					<img src="${Array.isArray(receta.image) ? receta.image[0] : receta.image}" class="card-img-top" alt="${receta.name}">
					<div class="card-body">
						<h5 class="card-title">${receta.name}</h5>
						<p class="card-text">${receta.description || ''}</p>
					</div>
				</div>
			`;
			galeriaListado.appendChild(col);
		});
	});
// main.js
console.log('WebApp cargada');
