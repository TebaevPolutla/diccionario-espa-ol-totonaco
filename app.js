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

        // 📌 Extraer los datos y convertirlos en un objeto JSON
        palabras = filas.slice(1).map(columna => ({
            espanol: columna[0]?.trim() || "Desconocido",
            totonaco: columna[1]?.trim() || "Desconocido",
            ejemplo: columna[2]?.trim() || "Sin ejemplo",
            fuente: columna[3]?.trim() || "Desconocido"
        }));

        console.log("✅ Palabras obtenidas correctamente:", palabras);
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
