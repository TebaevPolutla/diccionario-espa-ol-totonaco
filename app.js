// 📌 URL del Google Sheets en formato CSV
const csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQHUYB4pxLmNetc7ScSToTrsSFQT4adVfJIDcb3BhPcPHK0wT7jd9JyWf_A8iGH4A/pub?output=csv";

// 📌 Elementos del DOM
const buscador = document.getElementById("buscador");
const resultado = document.getElementById("resultado");
let palabras = []; // Lista global de palabras

// 📌 Función para obtener y convertir CSV a JSON
async function obtenerPalabrasDesdeCSV() {
    try {
        const respuesta = await fetch(csvUrl);
        const data = await respuesta.text();
        const filas = data.split("\n").map(line => line.split(","));

        // 📌 Verifica si la primera fila contiene los títulos correctos
        const encabezados = filas[0].map(titulo => titulo.trim().toLowerCase());
        console.log("📌 Encabezados encontrados en CSV:", encabezados);

        // 📌 Encuentra las posiciones de cada columna
        const colEspanol = encabezados.indexOf("español");
        const colTotonaco = encabezados.indexOf("totonaco");
        const colEjemplo = encabezados.indexOf("ejemplo");
        const colFuente = encabezados.indexOf("fuente");

        // 📌 Si no encuentra los encabezados, muestra un error
        if (colEspanol === -1 || colTotonaco === -1) {
            console.error("❌ Error: No se encontraron las columnas correctas en el CSV.");
            return;
        }

        // 📌 Extraer datos basados en las posiciones de las columnas
        palabras = filas.slice(1).map(columna => ({
            espanol: columna[colEspanol]?.trim() || "No disponible",
            totonaco: columna[colTotonaco]?.trim() || "No disponible",
            ejemplo: columna[colEjemplo]?.trim() || "Sin ejemplo",
            fuente: columna[colFuente]?.trim() || "Desconocido"
        }));

        console.log("✅ Palabras extraídas correctamente:", palabras);
    } catch (error) {
        console.error("❌ Error al obtener los datos:", error);
    }
}

// 📌 Función para buscar palabras en el diccionario
function filtrarPalabras() {
    const termino = buscador.value.toLowerCase();
    resultado.innerHTML = ""; // Limpiar resultados anteriores

    if (termino === "") return; // No buscar si el campo está vacío

    const filtradas = palabras.filter(palabra =>
        palabra.espanol.toLowerCase().includes(termino) || 
        palabra.totonaco.toLowerCase().includes(termino)
    );

    if (filtradas.length > 0) {
        filtradas.forEach(palabra => {
            const item = document.createElement("li");
            item.innerHTML = `<strong>${palabra.espanol}</strong> - ${palabra.totonaco} <br> 
                              <em>Ejemplo:</em> ${palabra.ejemplo} <br>
                              <small>Fuente: ${palabra.fuente}</small>`;
            resultado.appendChild(item);
        });
    } else {
        resultado.innerHTML = "<li>No se encontraron resultados</li>";
    }
}

// 📌 Cargar datos automáticamente al abrir la web
window.onload = obtenerPalabrasDesdeCSV;

// 📌 Agregar búsqueda con debounce para mejorar rendimiento
let timeout;
buscador.addEventListener("input", () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => filtrarPalabras(), 300);
});
