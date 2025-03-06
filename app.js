// 📌 ID del Google Sheets (reemplaza con el tuyo)
const sheetID = "1-sXQZMK2sjgK5xe8kQ1fg8P10e53mS2g";

// 📌 URL para obtener los datos en formato JSON
const url = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?tqx=out:json`;

// 📌 Elementos del DOM
const buscador = document.getElementById("buscador");
const resultado = document.getElementById("resultado");

// 📌 Función para obtener los datos del Google Sheets
async function obtenerPalabras() {
    try {
        const response = await fetch(url);
        const text = await response.text();
        const json = JSON.parse(text.substring(47, text.length - 2)); // Limpiar formato de Google Sheets

        let palabras = json.table.rows.map(row => ({
            espanol: row.c[2]?.v?.trim().toLowerCase() || "desconocido", // 📌 Columna 2 = Español
            totonaco: row.c[3]?.v?.trim().toLowerCase() || "desconocido" // 📌 Columna 3 = Totonaco
        }));

        // 📌 Eliminar duplicados
        const palabrasUnicas = [];
        const seen = new Set();

        palabras.forEach(palabra => {
            const key = `${palabra.espanol}-${palabra.totonaco}`;
            if (!seen.has(key)) {
                seen.add(key);
                palabrasUnicas.push(palabra);
            }
        });

        console.log("✅ Palabras obtenidas (sin duplicados):", palabrasUnicas);
        return palabrasUnicas;
    } catch (error) {
        console.error("❌ Error al obtener las palabras:", error);
        return [];
    }
}

// 📌 Función para buscar tanto en español como en totonaco
async function filtrarPalabras() {
    const termino = buscador.value.trim().toLowerCase(); // Convertir entrada a minúsculas y eliminar espacios extra
    resultado.innerHTML = ""; // Limpiar resultados anteriores

    if (termino === "") return; // No buscar si está vacío

    const palabras = await obtenerPalabras();

    // 📌 Buscar si el término aparece en español o en totonaco
    const filtradas = palabras.filter(palabra =>
        palabra.espanol.includes(termino) || palabra.totonaco.includes(termino)
    );

    // 📌 Mostrar solo los resultados filtrados
    if (filtradas.length > 0) {
        filtradas.forEach(palabra => {
            const item = document.createElement("li");
            item.textContent = `${palabra.espanol} - ${palabra.totonaco}`;
            resultado.appendChild(item);
        });
    } else {
        resultado.innerHTML = "<li>No se encontraron resultados</li>";
    }
}

// 📌 Escuchar eventos en el input de búsqueda
buscador.addEventListener("input", filtrarPalabras);
