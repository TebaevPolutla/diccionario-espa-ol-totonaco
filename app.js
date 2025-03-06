// 📌 ID del Google Sheets
const sheetID = "1-sXQZMK2sjgK5xe8kQ1fg8P10e53mS2g";

// 📌 URL para obtener los datos en formato JSON
const url = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?tqx=out:json`;

// 📌 Elementos del DOM
const buscador = document.getElementById("buscador");
const resultado = document.getElementById("resultado");

// 📌 Función para obtener las palabras desde Google Sheets
async function obtenerPalabras() {
    try {
        const response = await fetch(url);
        const text = await response.text();
        const json = JSON.parse(text.substring(47, text.length - 2)); // Limpiar formato de Google Sheets

        let palabras = json.table.rows.map(row => {
            const espanol = row.c[2]?.v?.trim().toLowerCase() || "";
            const totonaco = row.c[3]?.v?.trim().toLowerCase() || "";
            return { espanol, totonaco };
        });

        console.log("✅ Palabras obtenidas:", palabras);
        return palabras;
    } catch (error) {
        console.error("❌ Error al obtener las palabras:", error);
        return [];
    }
}

// 📌 Función para buscar en español o totonaco con coincidencia exacta
async function filtrarPalabras() {
    const termino = buscador.value.trim().toLowerCase(); // Convertir a minúsculas
    resultado.innerHTML = ""; // Limpiar resultados anteriores

    if (termino === "") return; // No buscar si el campo está vacío

    const palabras = await obtenerPalabras();

    // 📌 Buscar coincidencias exactas en español o totonaco
    const filtradas = palabras.filter(palabra =>
        palabra.espanol === termino || palabra.totonaco === termino
    );

    // 📌 Mostrar solo las palabras encontradas
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
