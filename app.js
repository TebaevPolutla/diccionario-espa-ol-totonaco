// 📌 Importar Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// 📌 Configuración de Firebase (REEMPLAZA con tus datos reales)
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

// 📌 Función para cargar el JSON y subirlo a Firebase
async function cargarJSON() {
    try {
        const response = await fetch("palabras.json");  // 📌 Cargar el archivo JSON
        const palabras = await response.json();  // 📌 Convertir a objeto JavaScript

        console.log("🚀 JSON cargado correctamente:", palabras);

        // 📌 Subir cada palabra a Firestore
        for (let palabra of palabras) {
            await addDoc(collection(db, "palabras"), palabra);
            console.log(`✅ Subida: ${palabra.espanol} - ${palabra.totonaco}`);
        }

        console.log("🎉 ¡Todas las palabras fueron subidas a Firebase correctamente!");
    } catch (error) {
        console.error("❌ Error al cargar JSON:", error);
    }
}

// 📌 Ejecutar la función cuando la página cargue
document.addEventListener("DOMContentLoaded", cargarJSON);

