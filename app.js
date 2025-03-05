// ✅ Importar Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// ✅ Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBlQkozFpUossaLTHycZgywkPqz4VjJSg8",
    authDomain: "diccionario-totonaco.firebaseapp.com",
    projectId: "diccionario-totonaco",
    storageBucket: "diccionario-totonaco.appspot.com",
    messagingSenderId: "134554353684",
    appId: "1:134554353684:web:1aac000b678f98ad1de701"
};

// ✅ Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ✅ Función para obtener palabras de Firestore
async function obtenerPalabras() {
    try {
        const querySnapshot = await getDocs(collection(db, "palabras"));
        const palabras = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();

            // 🔥 Corregido para tu estructura de datos
            const espanol = data.espanol || "⚠️ Sin dato";
            const totonaco = data.totonaco || "⚠️ Sin dato";

            palabras.push({ espanol, totonaco });
        });

        console.log("✅ Palabras obtenidas:", palabras);

        if (palabras.length === 0) {
            console.warn("⚠️ No se encontraron palabras en Firestore.");
        }

        mostrarPalabras(palabras); // Llamamos a la función para mostrarlas en la página
    } catch (error) {
        console.error("❌ Error al obtener los datos:", error);
    }
}

// ✅ Función para mostrar palabras en la página
function mostrarPalabras(palabras) {
    const lista = document.getElementById("lista-palabras");
    lista.innerHTML = ""; // Limpiar la lista antes de mostrar

    if (palabras.length === 0) {
        lista.innerHTML = "<li>⚠️ No hay palabras en la base de datos.</li>";
        return;
    }

    palabras.forEach(palabra => {
        const elemento = document.createElement("li");
        elemento.textContent = `${palabra.espanol} - ${palabra.totonaco}`;
        lista.appendChild(elemento);
    });
}

// ✅ Ejecutar la función al cargar la página
document.addEventListener("DOMContentLoaded", obtenerPalabras);
