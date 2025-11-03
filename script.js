// script.js (Versión Final y Definitiva con Firebase)

// =====================================================================
// EVENTOS PRINCIPALES
// =====================================================================

document.addEventListener('DOMContentLoaded', () => {
    cargarMenuExistente();
    document.getElementById('saveMenuBtn').addEventListener('click', guardarMenu);
});


// =====================================================================
// FUNCIONES AUXILIARES PARA LA INTERFAZ (AGREGAR/ELIMINAR FILAS)
// =====================================================================

function agregarFila(boton_agregar) {
    const tabla = boton_agregar.nextElementSibling;
    const tbody = tabla.querySelector('tbody');
    const nuevaFila = tbody.insertRow();
    // Crea la fila completa, incluyendo el campo de descripción
    nuevaFila.innerHTML = `
        <td class="col-product"><input type="text" name="product[]" placeholder="Nombre"/></td>
        <td class="col-price"><input type="number" name="price[]" placeholder="Precio"/></td>
        <td class="col-price2"><input type="number" name="price2[]" placeholder="Precio"/></td>
        <td class="col-description"><input type="text" name="description[]" placeholder="Descripción"/></td>
        <td><button class="delete-btn" onclick="eliminarFila(this)">X</button></td>`;
}

function eliminarFila(boton_eliminar) {
    const fila = boton_eliminar.closest('tr');
    if (fila) {
        fila.remove();
    }
}


// =====================================================================
// LÓGICA DE FIREBASE (CARGAR Y GUARDAR)
// =====================================================================

async function cargarMenuExistente() {
    try {
        // Pide los productos a Firestore (sin cambios)
        const snapshot = await db.collection('productos').orderBy('orden', 'asc').orderBy('ordenProducto', 'asc').get();
        const productosPorCategoria = {};

        // Agrupa los productos por categoría (sin cambios)
        snapshot.forEach(doc => {
            const data = doc.data();
            if (!productosPorCategoria[data.categoria]) {
                productosPorCategoria[data.categoria] = [];
            }
            productosPorCategoria[data.categoria].push({ id: doc.id, ...data });
        });

        // --- LÓGICA DE RENDERIZADO (MODIFICADA) ---
        document.querySelectorAll('h2').forEach(h2 => {
            const categoria = h2.textContent.trim();
            const tableElement = h2.nextElementSibling.nextElementSibling; // El <table>

            // 1. Obtenemos los títulos definidos en el HTML
            const title1 = h2.dataset.price1Title; // Ej: "Precio" o undefined
            const title2 = h2.dataset.price2Title; // Ej: "Promo" o undefined

            // 2. Limpiamos cualquier encabezado <thead> o cuerpo <tbody> viejo
            const oldThead = tableElement.querySelector('thead');
            if (oldThead) oldThead.remove();
            
            const tbody = tableElement.querySelector('tbody');
            if (tbody) tbody.innerHTML = ''; // Limpia solo el cuerpo

            
            // 3. Revisamos si hay datos para esta categoría
            if (productosPorCategoria[categoria] && productosPorCategoria[categoria].length > 0) {
                
                let hasPrice2Data = false; // Flag para la condición
                let rowsHTML = ''; // Acumulador para el HTML de las filas <tr>

                // 4. Recorremos los productos para (A) buscar datos y (B) construir las filas
                productosPorCategoria[categoria].forEach(producto => {
                    if (producto.precio2) {
                        hasPrice2Data = true; // ¡Encontramos un precio 2!
                    }
                    // Acumulamos el HTML de la fila
                    rowsHTML += `
                        <tr>
                            <td class="col-product"><input type="text" name="product[]" value="${producto.nombre || ''}"/></td>
                            <td class="col-price"><input type="number" name="price[]" value="${producto.precio || ''}"/></td>
                            <td class="col-price2"><input type="number" name="price2[]" value="${producto.precio2 || ''}"/></td>
                            <td class="col-description"><input type="text" name="description[]" value="${producto.descripcion || ''}"/></td>
                            <td><button class="delete-btn" onclick="eliminarFila(this)">X</button></td>
                        </tr>`;
                });

                // 5. Decidimos qué título 2 mostrar (si aplica)
                // Solo se muestra si (existe un título DEFINIDO) Y (encontramos DATOS)
                const finalTitle2 = (title2 && hasPrice2Data) ? title2 : '';

                let headerHTML = '';
                // 6. Creamos el <thead> solo si hay algún título que mostrar
                if (title1 || finalTitle2) {
                    headerHTML = `
                        <thead>
                            <tr>
                                <th class="col-product"></th>
                                <th class="col-price">${title1 || ''}</th>
                                <th class="col-price2">${finalTitle2}</th>
                                <th class="col-description"></th>
                                <th class="col-delete"></th>
                            </tr>
                        </thead>`;
                }
                
                // 7. Inyectamos el encabezado (si existe) y el cuerpo (tbody)
                tableElement.innerHTML = headerHTML + `<tbody>${rowsHTML}</tbody>`;

            } else {
                // Si no hay productos, solo muestra una fila vacía (sin encabezado)
                if (tbody) {
                    tbody.innerHTML = `
                        <tr>
                            <td class="col-product"><input type="text" name="product[]" placeholder="Nombre"/></td>
                            <td class="col-price"><input type="number" name="price[]" placeholder="Precio"/></td>
                            <td class="col-price2"><input type="number" name="price2[]" placeholder="Precio"/></td>
                            <td class="col-description"><input type="text" name="description[]" placeholder="Descripción"/></td>
                            <td><button class="delete-btn" onclick="eliminarFila(this)">X</button></td>
                        </tr>`;
                }
            }
        });
    } catch (error) {
        console.error("Error al cargar menú existente:", error);
        alert("Hubo un error al cargar el menú. Revisa la consola F12.");
    }
}


async function guardarMenu() {
    const saveBtn = document.getElementById('saveMenuBtn');
    
    saveBtn.classList.add('is-saving');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Guardando...';

    const ordenes = {
        "NUESTRAS PASTAS": 1,
        "SANDWICHES":      2,
        "MENÚ INFANTIL":   3,
        "BEBIDAS":         4,
        "ENTRADAS":        5,
        "NUESTRA COCINA":  6,
        "DULCES":          7
    };

    const productosParaGuardar = [];
    
    // --- NUEVO: Objeto para guardar metadatos de categorías ---
    const categoriasParaGuardar = {};

    document.querySelectorAll('.block__item').forEach(block => {
        block.querySelectorAll('h2').forEach(h2 => {
            const categoria = h2.textContent.trim();
            const tabla = h2.nextElementSibling.nextElementSibling;

            // --- NUEVO: Leer títulos del H2 ---
            const title1 = h2.dataset.price1Title || null;
            const title2 = h2.dataset.price2Title || null;
            
            // Guardamos los metadatos de la categoría
            categoriasParaGuardar[categoria] = {
                orden: ordenes[categoria] || 99,
                title1: title1,
                title2: title2
            };

            // Lógica para guardar productos (sin cambios)
            tabla.querySelectorAll('tbody tr').forEach((fila, index) => {
                const productoInput = fila.querySelector('input[name="product[]"]');
                const precioInput = fila.querySelector('input[name="price[]"]');
                const precioInput2 = fila.querySelector('input[name="price2[]"]');
                const descripcionInput = fila.querySelector('input[name="description[]"]');

                if (productoInput && productoInput.value && precioInput && precioInput.value) {
                    productosParaGuardar.push({
                        nombre: productoInput.value.trim(),
                        precio: parseFloat(precioInput.value),
                        precio2: precioInput2 && precioInput2.value ? parseFloat(precioInput2.value) : null,
                        categoria: categoria,
                        descripcion: descripcionInput ? descripcionInput.value.trim() : "",
                        orden: ordenes[categoria] || 99,
                        ordenProducto: index
                    });
                }
            });
        });
    });

    try {
        const snapshotActual = await db.collection('productos').get();
        const batch = db.batch();

        // Borrado de productos (sin cambios)
        snapshotActual.docs.forEach(doc => {
            batch.delete(doc.ref);
        });

        // Escritura de productos (sin cambios)
        productosParaGuardar.forEach(producto => {
            const newDocRef = db.collection('productos').doc();
            batch.set(newDocRef, producto);
        });

        // --- NUEVO: Guardar los metadatos de las categorías ---
        // Borramos las categorías viejas (opcional, pero limpio)
        const catSnapshot = await db.collection('categorias').get();
        catSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        // Creamos las nuevas categorías
        for (const categoriaNombre in categoriasParaGuardar) {
            const catRef = db.collection('categorias').doc(categoriaNombre);
            batch.set(catRef, categoriasParaGuardar[categoriaNombre]);
        }
        // --- FIN DE LA MODIFICACIÓN ---

        await batch.commit();

        alert('¡Menú guardado con éxito en Firebase!');
        console.log("Datos guardados en Firestore:", productosParaGuardar);
        console.log("Categorías guardadas:", categoriasParaGuardar);

    } catch (error) {
        console.error("Error al guardar el menú en Firebase:", error);
        alert('Hubo un error al guardar. Revisa la consola.');
    } finally {
        saveBtn.classList.remove('is-saving');
        saveBtn.disabled = false;
        saveBtn.textContent = 'Guardar Menú';
    }
}
