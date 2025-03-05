// Importar Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// Configuración de Firebase (Reemplaza con tus datos reales)
const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "TU_PROYECTO.firebaseapp.com",
    projectId: "diccionario-totonaco",
    storageBucket: "TU_PROYECTO.appspot.com",
    messagingSenderId: "TU_ID",
    appId: "TU_APP_ID"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Elementos del DOM
const buscador = document.getElementById('buscador');
const resultado = document.getElementById('resultado');

// Obtener palabras desde Firestore
async function obtenerPalabras() {
    const palabrasRef = collection(db, "palabras");
    const snapshot = await getDocs(palabrasRef);
    let palabras = [];

    snapshot.forEach((doc) => {
        const data = doc.data();

        if (data.fields) {
            palabras.push({
                espanol: data.fields.espanol?.stringValue || "Desconocido",
                totonaco: data.fields.totonaco?.stringValue || "Desconocido"
            });
        }
    });

    console.log("✅ Palabras obtenidas:", palabras);

    // Evento para buscar palabras
    buscador.addEventListener('input', () => {
        const query = buscador.value.toLowerCase();
        resultado.innerHTML = '';

        palabras.forEach(palabra => {
            if (palabra.espanol.includes(query) || palabra.totonaco.includes(query)) {
                const item = document.createElement('li');
                item.textContent = `${palabra.espanol} - ${palabra.totonaco}`;
                resultado.appendChild(item);
            }
        });

        if (resultado.innerHTML === '') {
            const noResult = document.createElement('li');
            noResult.textContent = 'No se encontraron resultados';
            resultado.appendChild(noResult);
        }
    });
}

// Llamar a la función para obtener las palabras al cargar la página
obtenerPalabras();
