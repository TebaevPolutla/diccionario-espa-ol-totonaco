// 📌 Importar Firebase Firestore
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// 📌 Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBlQkozFpUossaLTHycZgywkPqz4VjJSg8",
  authDomain: "diccionario-totonaco.firebaseapp.com",
  projectId: "diccionario-totonaco",
  storageBucket: "diccionario-totonaco.appspot.com",
  messagingSenderId: "134554353684",
  appId: "1:134554353684:web:1aac000b678f98ad1de701"
};

// 📌 Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 📌 Elementos del DOM
const buscador = document.getElementById("buscador");
const resultado = document.getElementById("resultado");
const formulario = document.getElementById("formulario");
const mensaje = document.getElementById("mensaje");

window.palabras = []; // Lista global de palabras

// 📌 Función para obtener palabras desde Firestore sin duplicados
async function obtenerPalabrasDesdeFirestore() {
    try {
        console.log("🔍 Obteniendo datos desde Firestore...");
        const querySnapshot = await getDocs(collection(db, "palabras"));

        // Filtrar duplicados con un Set
        const palabrasUnicas = new Map();
        querySnapshot.forEach(doc => {
            const palabra = doc.data();
            const clave = palabra.espanol.toLowerCase(); // Normalizar a minúsculas
            palabrasUnicas.set(clave, palabra);
        });

        window.palabras = Array.from(palabrasUnicas.values());

        console.log("✅ Palabras obtenidas:", window.palabras);
    } catch (error) {
        console.error("❌ Error al obtener los datos:", error);
    }
}

// 📌 Función para buscar palabras exactas sin duplicados
function filtrarPalabras() {
    const termino = buscador.value.toLowerCase().trim();
    resultado.innerHTML = "";

    if (termino === "") return;

    // Buscar coincidencias exactas y eliminar duplicados
    const filtradas = window.palabras.filter(palabra => 
        palabra.espanol.toLowerCase() === termino || 
        palabra.totonaco.toLowerCase() === termino
    );

    if (filtradas.length > 0) {
        // Usar un Set para evitar duplicados al mostrar
        const palabrasUnicas = new Set(filtradas.map(p => JSON.stringify(p)));
        
        palabrasUnicas.forEach(str => {
            const palabra = JSON.parse(str);
            const item = document.createElement("li");
            item.innerHTML = `<strong>${palabra.espanol}</strong> - ${palabra.totonaco}`;
            resultado.appendChild(item);
        });
    } else {
        resultado.innerHTML = "<li>No se encontró la palabra exacta</li>";
    }
}

// 📌 Función para agregar nuevas palabras sin duplicados
formulario.addEventListener("submit", async function(event) {
    event.preventDefault();

    const nuevoEspanol = document.getElementById("nuevoEspanol").value.trim();
    const nuevoTotonaco = document.getElementById("nuevoTotonaco").value.trim();
    const colaborador = document.getElementById("colaborador").value.trim() || "Anónimo";

    if (!nuevoEspanol || !nuevoTotonaco) {
        mensaje.textContent = "❌ Por favor, completa todos los campos.";
        return;
    }

    // Evitar que se agreguen duplicados a Firestore
    const existe = window.palabras.some(p => p.espanol.toLowerCase() === nuevoEspanol.toLowerCase());

    if (existe) {
        mensaje.textContent = "⚠️ La palabra ya existe en la base de datos.";
        return;
    }

    try {
        await addDoc(collection(db, "palabras"), {
            espanol: nuevoEspanol,
            totonaco: nuevoTotonaco,
            colaborador: colaborador
        });

        console.log("✅ Palabra agregada correctamente.");
        mensaje.textContent = "✅ Palabra enviada correctamente.";
        formulario.reset();

        // 🔄 Actualizar la lista sin recargar la página
        obtenerPalabrasDesdeFirestore();
    } catch (error) {
        console.error("❌ Error al enviar la palabra:", error);
        mensaje.textContent = "❌ Error al enviar la palabra.";
    }
});

// 📌 Cargar palabras al inicio
window.onload = obtenerPalabrasDesdeFirestore;
buscador.addEventListener("input", () => setTimeout(() => filtrarPalabras(), 300));



