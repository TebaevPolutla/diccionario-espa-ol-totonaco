// 📌 URL del Web App de Google Apps Script (Actualizada)
const scriptUrl = "https://script.googleusercontent.com/macros/echo?user_content_key=AehSKLjKydTuO6tFIXoRLbaGkdFyW14Wpof0Ned9Dbb9mDx3TMtpeJ7S0_TEedAwxkdhSQISWkVmtHC-fPy8dEm3Hud02j-r3BYkyJlVa3d2QS3onm_9invGwaZ9H7Poky4YTK4zm3w-53koWYQG7trKrdTF6s4skzNzEet-Hgy5iIqOOeJGhtyqvdt_m0W2MMd5_hRWB88Rre63bfC0fHVLYWe9fP5wVyEixeNvmZ5HI-AiCzPdNm8AgQCk8H-3H-VuV1vjAhl9rcPF2mp0htwBdeUZ2mHxnQ&lib=MnewecsndWBLjpOhrm3CYVHKRT9d30hqB";

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

   
