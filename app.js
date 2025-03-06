// 📌 Importar Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// 📌 Configuración de Firebase (reemplaza con tus datos)
const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "TU_PROYECTO.firebaseapp.com",
    projectId: "diccionario-totonaco",
    storageBucket: "TU_PROYECTO.appspot.com",
    messagingSenderId: "TU_ID",
    appId: "TU_APP_ID"
};

// 📌 Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 📌 Obtener referencias a los elementos del DOM
const buscador = document.getElementById("buscador");
const resultado = document.getElementById("resultado");

// 📌 Función para obtener palabras desde Firebase
async function obtenerPalabras() {
    try {
        const querySnapshot = await getDocs(collection(db, "palabras"));
        let palabras = [];

        querySnapshot.forEach((doc) => {
            palabras.push(doc.data());
        });

        return palabras;
    } catch (error) {
        console.error("❌ Error al obtener las palabras:", error);
        return [];
    }
}

// 📌 Función para mostrar solo la palabra buscada
async function filtrarPalabras() {
    const termino = buscador.value.toLowerCase();
    resultado.innerHTML = ""; // Limpiar resultados anteriores

    if (termino === "") return; // No buscar si está vacío

    const palabras = await obtenerPalabras();
    const filtradas = palabras.filter(palabra =>
        palabra.espanol.toLowerCase().includes(termino)
    );

    // 📌 Mostrar solo la palabra buscada
    if (filtradas.length > 0) {
        filtradas.forEach(palabra => {
            const item = document.createElement("li");
            item.textContent = `${palabra.espanol} - ${palabra.totonaco}`;
            resultado.appendChild(item);
        });
    } else {
        resultado.innerHTML = "<li>No se encontraron resultados</li>";
    }
}

// 📌 Escuchar eventos en el input de búsqueda
buscador.addEventListener("input", filtrarPalabras);
