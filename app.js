// 📌 URL del Web App de Google Apps Script (Actualizada)
const scriptUrl = "https://script.google.com/macros/s/AKfycbwd_SFysQ1vQXQwHy6YzeRR77WKB5E84xMDjNfvgJwXsA6gOIBNrX22z8_ADzwWt8oh/exec";

// 📌 Elementos del DOM
const buscador = document.getElementById("buscador");
const resultado = document.getElementById("resultado");
window.palabras = []; // Hacer la variable global para probar en consola

// 📌 Función para obtener los datos desde Google Sheets en tiempo real
async function obtenerPalabrasDesdeGoogleSheets() {
    try {
        console.log("🔍 Intentando obtener datos desde:", scriptUrl);
        const respuesta = await fetch(scriptUrl);
        if (!respuesta.ok) {
            throw new Error(`HTTP error! Status: ${respuesta.status}`);
        }
        window.palabras = await respuesta.json(); // Almacenar datos globalmente
        console.log("✅ Palabras obtenidas en tiempo real:", window.palabras);
    } catch (error) {
        console.error("❌ Error al obtener los datos:", error);
    }
}

// 📌 Función para buscar palabras exactas
function filtrarPalabras() {
    const termino = buscador.value.toLowerCase().trim();
    resultado.innerHTML = ""; 
    if (termino === "") return;

    const filtradas = window.palabras.filter(palabra => 
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
    } else {
        resultado.innerHTML = "<li>No se encontró la palabra exacta</li>";
    }
}

// 📌 Cargar datos al inicio desde Google Sheets
window.onload = obtenerPalabrasDesdeGoogleSheets;

// 📌 Agregar búsqueda con debounce para evitar sobrecarga de búsquedas en cada tecla presionada
let timeout;
buscador.addEventListener("input", () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => filtrarPalabras(), 300);
});
