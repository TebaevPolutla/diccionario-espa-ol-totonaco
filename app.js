// 📌 URL del Google Sheets en formato CSV
const csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQHUYB4pxLmNetc7ScSToTrsSFQT4adVfJIDcb3BhPcPHK0wT7jd9JyWf_A8iGH4A/pub?output=csv";

// 📌 Elementos del DOM
const buscador = document.getElementById("buscador");
const resultado = document.getElementById("resultado");
let palabras = []; // Lista global de palabras

// 📌 Función para obtener y procesar los datos CSV
async function obtenerPalabras() {
    try {
        const response = await fetch(csvUrl);
        const data = await response.text();
        const filas = data.split("\n");

        console.log("🔍 CSV CRUDO RECIBIDO:", filas); // Depuración: Ver CSV en consola

        // 📌 Convertir CSV a array de objetos
        palabras = filas
            .map(line => {
                const columnas = line.split(",");
                console.log("🔍 FILA PROCESADA:", columnas); // Depuración: Ver cada fila

                return {
                    espanol: columnas[2]?.trim() || "Desconocido",
                    totonaco: columnas[3]?.trim() || "Desconocido"
                };
            })
            .filter(p => p.espanol !== "Desconocido" && p.totonaco !== "Desconocido"); // Filtrar datos inválidos

        console.log("✅ Palabras obtenidas correctamente:", palabras);
    } catch (error) {
        console.error("❌ Error al obtener las palabras:", error);
    }
}

// 📌 Función para filtrar y mostrar resultados en español o totonaco
function filtrarPalabras() {
    const termino = buscador.value.toLowerCase();
    resultado.innerHTML = ""; // Limpiar resultados anteriores

    if (termino === "") return; // No buscar si está vacío

    const filtradas = palabras.filter(palabra =>
        palabra.espanol.toLowerCase().includes(termino) || palabra.totonaco.toLowerCase().includes(termino)
    );

    // 📌 Mostrar resultados
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

// 📌 Cargar datos al inicio
obtenerPalabras();
