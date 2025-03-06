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

// 📌 Obtener palabras desde Firebase (solo una vez para optimizar)
let palabrasDB = [];

async function obtenerPalabras() {
    if (palabrasDB.length === 0) {
        try {
            const querySnapshot = await getDocs(collection(db, "palabras"));
            querySnapshot.forEach((doc) => {
                palabrasDB.push(doc.data());
            });
            console.log("✅ Palabras obtenidas:", palabrasDB);
        } catch (error) {
            console.error("❌ Error al obtener los datos:", error);
        }
    }
}

// 📌 Filtrar palabras en tiempo real
async function filtrarPalabras() {
    await obtenerPalabras(); // Asegurarse de que los datos estén cargados

    const texto = buscador.value.trim().toLowerCase();

    // Filtrar por coincidencia exacta y eliminar duplicados
    const filtradas = palabrasDB.filter((palabra, index, self) =>
        palabra.espanol.toLowerCase() === texto &&
        self.findIndex(p => p.espanol.toLowerCase() === palabra.espanol.toLowerCase()) === index
    );

    mostrarPalabras(filtradas);
}

// 📌 Mostrar palabras filtradas sin duplicados
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

