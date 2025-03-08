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
        const json = JSON.parse(text.substring(47, text.length - 2)); // Limpiar formato Google Sheets

        let palabras = json.table.rows.map(row => ({
            espanol: (row.c[2] && row.c[2].v) ? String(row.c[2].v).trim() : "Desconocido",
            totonaco: (row.c[3] && row.c[3].v) ? String(row.c[3].v).trim() : "Desconocido"
        }));

        console.log("✅ Palabras obtenidas:", palabras);
        return palabras;
    } catch (error) {
        console.error("❌ Error al obtener las palabras:", error);
        return [];
    }
}

// 📌 Función para filtrar y mostrar solo la palabra buscada (Español o Totonaco)
async function filtrarPalabras() {
    const termino = buscador.value.toLowerCase().trim();
    resultado.innerHTML = ""; // Limpiar resultados anteriores

    if (termino === "") return; // No buscar si está vacío

    const palabras = await obtenerPalabras();
    const filtradas = palabras.filter(palabra =>
        palabra.espanol.toLowerCase().includes(termino) ||
        palabra.totonaco.toLowerCase().includes(termino)
    );

    // 📌 Mostrar solo la palabra buscada
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

