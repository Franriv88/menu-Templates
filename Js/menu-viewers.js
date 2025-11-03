// menu-viewers.js (Versión con títulos de columna dinámicos)

document.addEventListener('DOMContentLoaded', async () => { // <-- Vuelto ASYNC
    const menuContainer = document.getElementById('menu-container');

    if (typeof db === 'undefined' || db === null) {
        console.error("Error: La instancia de Firestore (db) no está disponible.");
        menuContainer.innerHTML = '<p>Error al cargar la configuración del menú.</p>';
        return;
    }

    // --- NUEVO: Cargar metadatos de categorías ---
    const categoriaMeta = {};
    try {
        const catSnapshot = await db.collection('categorias').get();
        catSnapshot.forEach(doc => {
            categoriaMeta[doc.id] = doc.data();
        });
    } catch (e) {
        console.error("Error al cargar metadatos de categorías:", e);
    }
    // --- FIN DE LA MODIFICACIÓN ---


    const seccionesConfig = {
        "NUESTRAS PASTAS": { layout: 'normal', grupo: 'pastas', imagen: './img/img/pastas.jpg' },
        "SANDWICHES":      { layout: 'normal', grupo: 'sanwiches' },
        "MENÚ INFANTIL":   { layout: 'reversed', grupo: 'menuInfantil', imagen: './img/img/infantil2.jpg' },
        "BEBIDAS":         { layout: 'reversed', grupo: 'bebidas_y_extras' },
        "ENTRADAS":        { layout: 'normal', grupo: 'salados_y_laminados', imagen: './img/img/croissant.png' },
        "NUESTRA COCINA":  { layout: 'normal' }, // <-- Quitamos el grupo para que sea independiente
        "DULCES":          { layout: 'reversed', imagen: './img/img/cookie.png' }
    };

    db.collection('productos').orderBy('orden', 'asc').orderBy('ordenProducto', 'asc').onSnapshot(snapshot => {
        if (snapshot.empty) {
            menuContainer.innerHTML = '<p>El menú no está disponible.</p>';
            return;
        }

        const menuPorGrupo = {};
        const gruposOrdenados = [];
        snapshot.forEach(doc => {
            const item = { id: doc.id, ...doc.data() };
            const config = seccionesConfig[item.categoria] || {};
            const grupoNombre = config.grupo || item.categoria;
            if (!menuPorGrupo[grupoNombre]) {
                menuPorGrupo[grupoNombre] = {};
                // Usamos el orden de la metadata o el de la config
                const metaOrden = (categoriaMeta[item.categoria] || {}).orden;
                gruposOrdenados.push({ nombre: grupoNombre, orden: metaOrden || 99 });
            }
            if (!menuPorGrupo[grupoNombre][item.categoria]) {
                menuPorGrupo[grupoNombre][item.categoria] = [];
            }
            menuPorGrupo[grupoNombre][item.categoria].push(item);
        });
        
        menuContainer.innerHTML = '';
        
        // Ordenamos los grupos
        gruposOrdenados.sort((a, b) => a.orden - b.orden);

        gruposOrdenados.forEach(grupo => {
            const nombreGrupo = grupo.nombre;
            const categoriasDelGrupo = menuPorGrupo[nombreGrupo];
            let configGrupo = Object.values(seccionesConfig).find(c => c.grupo === nombreGrupo && c.imagen) || Object.values(seccionesConfig).find(c => c.grupo === nombreGrupo) || seccionesConfig[nombreGrupo] || {};
            
            const layoutClass = configGrupo.layout === 'reversed' ? 'layout-reversed' : '';
            
            // --- MODIFICACIÓN: Lógica para ancho completo ---
            // Si la sección NO tiene imagen, su contenido debe ocupar el 100%
            const tieneImagen = !!configGrupo.imagen;
            let seccionHTML = `<div class="menu-section ${layoutClass} ${tieneImagen ? '' : 'no-image'}">
                                 <div class="menu-content">`;
            
            for (const nombreCategoria in categoriasDelGrupo) {
                const itemsDeCategoria = categoriasDelGrupo[nombreCategoria];
                seccionHTML += `<h2>${nombreCategoria}</h2>`;
                
                // --- NUEVO: Lógica para mostrar títulos de columna ---
                const meta = categoriaMeta[nombreCategoria] || {};
                let hasPrice2Data = false;
                itemsDeCategoria.forEach(item => { if (item.precio2) hasPrice2Data = true; });

                const title1 = meta.title1;
                const title2 = (meta.title2 && hasPrice2Data) ? meta.title2 : null;

                // Si hay título 1 o 2, inyectamos la fila de encabezado
                if (title1 || title2) {
                    seccionHTML += `<div class="item-header item-header-titles">
                                        <span class="producto"></span> <!-- Espacio vacío para alinear -->
                                        <span class="precio">${title1 || ''}</span>
                                        <span class="precio-2">${title2 || ''}</span>
                                    </div>`;
                }
                // --- FIN DE LA MODIFICACIÓN ---

                itemsDeCategoria.forEach(item => {
                    const descripcion = item.descripcion || "El clásico de la casa.";
                    
                    let precio2Span = '';
                    if (item.precio2) {
                        precio2Span = `<span class="precio precio-2">$${item.precio2}</span>`; 
                    }

                    seccionHTML += `<div class="menu-item" data-producto="${item.nombre}" data-categoria="${nombreCategoria}">
                                        <div class="item-header">
                                            <span class="producto">${item.nombre}</span>
                                            <span class="precio">$${item.precio}</span>
                                            ${precio2Span}
                                        </div>
                                        <div class="item-details"><p>${descripcion}</p></div>
                                    </div>`;
                });
            }
            seccionHTML += `</div>`; // Cierra .menu-content
            
            if (configGrupo.imagen) {
                seccionHTML += `<div class="menu-image"><img src="${configGrupo.imagen}" alt="${nombreGrupo}"></div>`;
            }
            seccionHTML += `</div>`; // Cierra .menu-section
            menuContainer.innerHTML += seccionHTML;
        });

        iniciarDemostracionAcordeon();

    }, (error) => {
        console.error("Error al escuchar cambios en Firestore:", error);
    });

    // Lógica de interactividad (sin cambios)
    if (!menuContainer.dataset.listenerAttached) {
        menuContainer.addEventListener('click', (evento) => {
            const menuItem = evento.target.closest('.menu-item');
            if (menuItem) {
                const details = menuItem.querySelector('.item-details');
                if (details) details.classList.toggle('visible');
            }
        });
        menuContainer.dataset.listenerAttached = true;
    }

    // --- 👇 FUNCIÓN DE DEMOSTRACIÓN MEJORADA 👇 ---
    const sleep = ms => new Promise(res => setTimeout(res, ms));
    async function iniciarDemostracionAcordeon() {
        const primerProducto = document.querySelector('.menu-item');
        if (!primerProducto) return;
        const detalles = primerProducto.querySelector('.item-details');
        if (!detalles) return;
        await sleep(1000);
        for (let i = 0; i < 2; i++) {
            detalles.classList.add('visible');
            await sleep(500);
            detalles.classList.remove('visible');
            await sleep(500);
        }
    }
});
