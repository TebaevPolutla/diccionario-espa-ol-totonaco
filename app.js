// 📌 URL del archivo CSV público de Google Sheets
const csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQHUYB4pxLmNetc7ScSToTrsSFQT4adVfJIDcb3BhPcPHK0wT7jd9JyWf_A8iGH4A/pub?output=csv";

// 📌 Elementos del DOM
const buscador = document.getElementById("buscador");
const resultado = document.getElementById("resultado");

// 📌 Función para obtener y procesar los datos CSV
async function obtenerPalabras() {
    try {
        const response = await fetch(csvUrl);
        const text = await response.text();
        
        // 📌 Convertir el CSV a un array de objetos
        const filas = text.split("\n").slice(1); // Omitir encabezado
        let palabras = filas.map(row => {
            const columnas = row.split(",");
            return {
                espanol: columnas[0]?.trim() || "Desconocido",
                totonaco: columnas[1]?.trim() || "Desconocido"
            };
        });

        console.log("✅ Palabras obtenidas:", palabras);
        return palabras;
    } catch (error) {
        console.error("❌ Error al obtener las palabras:", error);
        return [];
    }
}

// 📌 Función para buscar en español o totonaco
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
