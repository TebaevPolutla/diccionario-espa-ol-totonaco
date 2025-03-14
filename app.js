// URL del Google Sheets en formato CSV
const csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT3D7ElMKKfNVp9y2QDe5D6P-Ix3LbP4Hu3KebIwgyuHTJ_HToPjAYW46mUbgsliu0nAthJeN47wjwA/pub?output=csv";

// Elementos del DOM
const buscador = document.getElementById("buscador");
const resultado = document.getElementById("resultado");
let palabras = []; // Lista global de palabras

// Función para obtener y procesar el CSV
async function obtenerPalabrasDesdeCSV() {
    try {
        const respuesta = await fetch(csvUrl);
        if (!respuesta.ok) {
            throw new Error(`HTTP error! Status: ${respuesta.status}`);
        }
        const data = await respuesta.text();
        const filas = data.split("\n").map(line => line.split(","));
        let encabezados = filas[0].map(titulo => titulo.trim().toLowerCase());
        const colEspanol = encabezados.indexOf("español");
        const colTotonaco = encabezados.indexOf("totonaco");
        if (colEspanol === -1 || colTotonaco === -1) {
            console.error("Error: No se encontraron las columnas correctas en el CSV.");
            return;
        }
        palabras = filas.slice(1).map(columna => ({
            espanol: columna[colEspanol]?.trim() || "Sin dato",
            totonaco: columna[colTotonaco]?.trim() || "Sin dato"
        }));
    } catch (error) {
        console.error("Error al obtener los datos:", error);
    }
}

// Función para buscar palabras que coincidan exactamente con el término ingresado
function filtrarPalabras() {
    const termino = buscador.value.toLowerCase().trim();
    resultado.innerHTML = ""; 
    if (termino === "") return;
    const filtradas = palabras.filter(palabra => 
        palabra.espanol.toLowerCase() === termino || 
        palabra.totonaco.toLowerCase() === termino
    );
    if (filtradas.length > 0) {
        filtradas.forEach(palabra => {
            const item = document.createElement("li");
            let espanolDestacado = `<mark>${palabra.espanol}</mark>`;
            let totonacoDestacado = `<mark>${palabra.totonaco}</mark>`;
            item.innerHTML = `<strong>${espanolDestacado}</strong> - ${totonacoDestacado}`;
            resultado.appendChild(item);
        });
        const contador = document.createElement("p");
        contador.textContent = `Se encontró ${filtradas.length} palabra(s) que coinciden exactamente con "${termino}".`;
        resultado.appendChild(contador);
    } else {
        resultado.innerHTML = `<li>No se encontraron palabras que coincidan exactamente con "${termino}".</li>`;
    }
}

// Cargar datos al inicio
window.onload = obtenerPalabrasDesdeCSV;

// Agregar búsqueda con debounce para evitar sobrecarga de búsquedas en cada tecla presionada
let timeout;
buscador.addEventListener("input", () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => filtrarPalabras(), 300);
});
