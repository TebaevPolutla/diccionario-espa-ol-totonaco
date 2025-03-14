// 📌 URL del Web App de Google Apps Script (Actualizada para GET)
const scriptUrl = "https://script.googleusercontent.com/macros/echo?user_content_key=AehSKLjKydTuO6tFIXoRLbaGkdFyW14Wpof0Ned9Dbb9mDx3TMtpeJ7S0_TEedAwxkdhSQISWkVmtHC-fPy8dEm3Hud02j-r3BYkyJlVa3d2QS3onm_9invGwaZ9H7Poky4YTK4zm3w-53koWYQG7trKrdTF6s4skzNzEet-Hgy5iIqOOeJGhtyqvdt_m0W2MMd5_hRWB88Rre63bfC0fHVLYWe9fP5wVyEixeNvmZ5HI-AiCzPdNm8AgQCk8H-3H-VuV1vjAhl9rcPF2mp0htwBdeUZ2mHxnQ&lib=MnewecsndWBLjpOhrm3CYVHKRT9d30hqB";

// 📌 URL del Web App de Google Apps Script (Actualizada para POST con CORS habilitado)
const postUrl = "https://script.google.com/macros/s/AKfycbxlpoM5fcC67sYgdXRfFc-2eIelgICgvJDOAX_9LYrJgFzgsVNckrnMqfbatvbLmADk/exec";

// 📌 Elementos del DOM
const buscador = document.getElementById("buscador");
const resultado = document.getElementById("resultado");
const formulario = document.getElementById("formulario");
const mensaje = document.getElementById("mensaje");

window.palabras = []; // Hacer la variable global para probar en consola

// 📌 Función para obtener datos desde Google Sheets
async function obtenerPalabrasDesdeGoogleSheets() {
    try {
        console.log("🔍 Intentando obtener datos desde:", scriptUrl);
        const respuesta = await fetch(scriptUrl);
        if (!respuesta.ok) throw new Error(`HTTP error! Status: ${respuesta.status}`);
        window.palabras = await respuesta.json();
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

    resultado.innerHTML = filtradas.length 
        ? filtradas.map(palabra => `<li><strong>${palabra.espanol}</strong> - ${palabra.totonaco}</li>`).join("")
        : "<li>No se encontró la palabra exacta</li>";
}

// 📌 Enviar palabra al diccionario
formulario.addEventListener("submit", async function(event) {
    event.preventDefault();

    const nuevoEspanol = document.getElementById("nuevoEspanol").value.trim();
    const nuevoTotonaco = document.getElementById("nuevoTotonaco").value.trim();
    const colaborador = document.getElementById("colaborador").value.trim() || "Anónimo";

    if (!nuevoEspanol || !nuevoTotonaco) {
        mensaje.textContent = "❌ Por favor, completa todos los campos.";
        return;
    }

    try {
        const respuesta = await fetch(postUrl, {
            method: "POST",
            body: JSON.stringify({ espanol: nuevoEspanol, totonaco: nuevoTotonaco, colaborador }),
            headers: { "Content-Type": "application/json" }
        });

        const resultado = await respuesta.text();
        console.log("✅ Respuesta del servidor:", resultado);
        mensaje.textContent = "✅ Palabra enviada correctamente.";
        formulario.reset();
    } catch (error) {
        console.error("❌ Error al enviar la palabra:", error);
        mensaje.textContent = "❌ Error al enviar la palabra.";
    }
});

// 📌 Cargar datos al inicio
window.onload = obtenerPalabrasDesdeGoogleSheets;
buscador.addEventListener("input", () => setTimeout(() => filtrarPalabras(), 300));

