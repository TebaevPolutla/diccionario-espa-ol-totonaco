// 📌 URL del Google Sheets en formato CSV
const csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT3D7ElMKKfNVp9y2QDe5D6P-Ix3LbP4Hu3KebIwgyuHTJ_HToPjAYW46mUbgsliu0nAthJeN47wjwA/pub?output=csv";

// 📌 Elementos del DOM
const buscador = document.getElementById("buscador");
const resultado = document.getElementById("resultado");
let palabras = []; // Lista global de palabras

// 📌 Función para obtener y convertir CSV a JSON
async function obtenerPalabrasDesdeCSV() {
    try {
        const respuesta = await fetch(csvUrl);
        const data = await respuesta.text();
        
        // 📌 Separar las líneas del CSV
        const filas = data.split("\n").map(line => line.split(","));

        // 📌 Obtener los títulos de las columnas
        const encabezados = filas[0].map(titulo => titulo.trim().toLowerCase());

        console.log("📌 Encabezados detectados en CSV:", encabezados);

        // 📌 Buscar la posición exacta de "Español" y "Totonaco"
        const colEspanol = encabezados.indexOf("español");
        const colTotonaco = encabezados.indexOf("totonaco");

        // 📌 Si no encuentra las columnas, mostrar error
        if (colEspanol === -1 || colTotonaco === -1) {
            console.error("❌ Error: No se encontraron las columnas correctas en el CSV.");
            return;
        }

        // 📌 Extraer datos de las filas, omitiendo la primera fila (títulos)
        palabras = filas.slice(1).map(columna => ({
            espanol: columna[colEspanol]?.trim() || "Sin dato",
            totonaco: columna[colTotonaco]?.trim() || "Sin dato"
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
            item.innerHTML = `<strong>${palabra.espanol}</strong> - ${palabra.totonaco}`;
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
