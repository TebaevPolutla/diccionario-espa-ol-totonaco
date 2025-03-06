// Importar Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBlQkozFpUossaLTHycZgywkPqz4VjJSg8",
    authDomain: "diccionario-totonaco.firebaseapp.com",
    projectId: "diccionario-totonaco",
    storageBucket: "diccionario-totonaco.appspot.com",
    messagingSenderId: "134554353684",
    appId: "1:134554353684:web:1aac000b678f98ad1de701"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Obtener referencias a elementos del DOM
const buscador = document.getElementById("buscador");
const resultado = document.getElementById("resultado");

// 📌 Obtener palabras desde Firebase
async function obtenerPalabras() {
    try {
        const querySnapshot = await getDocs(collection(db, "palabras"));
        const palabras = [];
        querySnapshot.forEach((doc) => {
            palabras.push(doc.data());
        });

        console.log("✅ Palabras obtenidas:", palabras);
        return palabras;
    } catch (error) {
        console.error("❌ Error al obtener los datos:", error);
        return [];
    }
}

// 📌 Filtrar palabras en tiempo real
async function filtrarPalabras() {
    const texto = buscador.value.trim().toLowerCase();
    const palabras = await obtenerPalabras();

    // Filtrar por coincidencia exacta
    const filtradas = palabras.filter(palabra => 
        palabra.espanol.toLowerCase() === texto
    );

    // Mostrar los resultados filtrados
    mostrarPalabras(filtradas);
}

// 📌 Mostrar palabras filtradas
function mostrarPalabras(listaPalabras) {
    resultado.innerHTML = ""; // Limpiar resultados

    if (listaPalabras.length === 0) {
        resultado.innerHTML = "<li>No se encontraron resultados</li>";
        return;
    }

    listaPalabras.forEach((palabra) => {
        const item = document.createElement("li");
        item.textContent = `${palabra.espanol} - ${palabra.totonaco}`;
        resultado.appendChild(item);
    });
}

// 📌 Detectar cambios en el buscador y actualizar resultados
buscador.addEventListener("input", filtrarPalabras);

