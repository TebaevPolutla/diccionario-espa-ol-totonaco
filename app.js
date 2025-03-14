// 📌 URL del Google Sheets en formato CSV
const csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT3D7ElMKKfNVp9y2QDe5D6P-Ix3LbP4Hu3KebIwgyuHTJ_HToPjAYW46mUbgsliu0nAthJeN47wjwA/pub?output=csv";

// 📌 Elementos del DOM
const buscador = document.getElementById("buscador");
const resultado = document.getElementById("resultado");
let palabras = []; // Lista global de palabras

// 📌 Función para obtener y procesar el CSV
async function obtenerPalabrasDesdeCSV() {
    try {
        console.log("🔍 Intentando obtener datos desde:", csvUrl);
        const respuesta = await fetch(csvUrl);
        
        if (!respuesta.ok) {
            throw new Error(`HTTP error! Status: ${respuesta.status}`);
        }

        const data = await respuesta.text();
        
        // 📌 Separar líneas y limpiar datos
        const filas = data.split("\n").map(line => line.split(","));
        let encabezados = filas[0].map(titulo => titulo.trim().toLowerCase());

        console.log("📌 Encabezados detectados en CSV:", encabezados);

        // 📌 Buscar las posiciones de "Español" y "Totonaco"
        const colEspanol = encabezados.indexOf("español");
        const colTotonaco = encabezados.indexOf("totonaco");

        if (colEspanol === -1 || colTotonaco === -1) {
            console.error("❌ Error: No se encontraron las columnas correctas en el CSV.");
            return;
        }

        // 📌 Extraer datos desde la segunda fila (evita títulos)
        palabras = filas.slice(1).map(columna => ({
            espanol: columna[colEspanol]?.trim() || "Sin dato",
            totonaco: columna[colTotonaco]?.trim() || "Sin dato"
        }));

        console.log("✅ Palabras extraídas correctamente:", palabras);

    } catch (error) {
        console.error("❌ Error al obtener los datos:", error);
    }
}

// 📌 Función para buscar palabras EXACTAS
function filtrarPalabras() {
    const termino = buscador.value.toLowerCase().trim();
    resultado.innerHTML = ""; 

    if (termino === "") return; // No buscar si el campo está vacío

    // 📌 Filtrar solo la palabra exacta o que comience con el término buscado
    const filtradas = palabras.filter(palabra => 
        palabra.espanol.toLowerCase() === termino || 
        palabra.totonaco.toLowerCase() === termino
    );

    // 📌 Mostrar solo la palabra exacta encontrada
    if (filtradas.length > 0) {
        filtradas.forEach(palabra => {
            const item = document.createElement("li");

            // 📌 Resaltar la palabra encontrada
            let regex = new RegExp(`^${termino}`, "gi");
            let espanolDestacado = palabra.espanol.replace(regex, match => `<mark>${match}</mark>`);
            let totonacoDestacado = palabra.totonaco.replace(regex, match => `<mark>${match}</mark>`);

            item.innerHTML = `<strong>${espanolDestacado}</strong> - ${totonacoDestacado}`;
            resultado.appendChild(item);
        });
    } else {
        resultado.innerHTML = "<li>No se encontró la palabra exacta</li>";
    }
}

// 📌 Cargar datos al inicio SIN MOSTRAR NADA AUTOMÁTICAMENTE
window.onload = async () => {
    await obtenerPalabrasDesdeCSV();
};

// 📌 Escuchar eventos en el input de búsqueda con debounce
let timeout;
buscador.addEventListener("input", () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => filtrarPalabras(), 300);
});
