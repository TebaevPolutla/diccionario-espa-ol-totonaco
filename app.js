// 📌 Importar Firebase (Si usas módulos ES6 y npm)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// 📌 Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBlQkozFpUossaLTHycZgywkPqz4VjJSg8",
    authDomain: "diccionario-totonaco.firebaseapp.com",
    projectId: "diccionario-totonaco",
    storageBucket: "diccionario-totonaco.appspot.com",
    messagingSenderId: "134554353684",
    appId: "1:134554353684:web:1aac000b678f98ad1de701"
};

// 📌 Inicializar Firebase y Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 📌 Elementos del DOM
const buscador = document.getElementById("buscador");
const resultado = document.getElementById("resultado");
const formulario = document.getElementById("formulario");
const mensaje = document.getElementById("mensaje");

window.palabras = []; // Guardar palabras en memoria

// 📌 Función para obtener datos desde Firestore
async function obtenerPalabrasDesdeFirestore() {
    try {
        console.log("🔍 Cargando palabras desde Firebase...");
        const snapshot = await getDocs(collection(db, "palabras"));
        window.palabras = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("✅ Palabras obtenidas:", window.palabras);
    } catch (error) {
        console.error("❌ Error al obtener datos:", error);
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

// 📌 Función para agregar palabras al diccionario en Firebase
formulario.addEventListener("submit", async function(event) {
    event.preventDefault();

    const nuevoEspanol = document.getElementById("nuevoEspanol").value.trim();
    const nuevoTotonaco = document.getElementById("nuevoTotonaco").value.trim();
    const colaborador = document.getElementById("colaborador").value.trim() || "Anónimo";

    if (!nuevoEspanol || !nuevoTotonaco) {
        mensaje.textContent = "❌ Completa todos los campos.";
        return;
    }

    try {
        await addDoc(collection(db, "palabras"), {
            espanol: nuevoEspanol,
            totonaco: nuevoTotonaco,
            colaborador: colaborador,
            fecha: new Date()
        });

        mensaje.textContent = "✅ Palabra enviada correctamente.";
        formulario.reset();
        obtenerPalabrasDesdeFirestore(); // Recargar datos después de agregar
    } catch (error) {
        console.error("❌ Error al enviar la palabra:", error);
        mensaje.textContent = "❌ Error al enviar la palabra.";
    }
});

// 📌 Cargar datos al inicio
window.onload = obtenerPalabrasDesdeFirestore;
buscador.addEventListener("input", () => setTimeout(() => filtrarPalabras(), 300));



