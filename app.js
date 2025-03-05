// 🔥 Importar Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// 🔥 Configuración de Firebase
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

// 📌 Elementos del DOM
const buscador = document.getElementById('buscador');
const resultado = document.getElementById('resultado');

// 📌 Obtener palabras desde Firestore
async function obtenerPalabras() {
    const palabrasRef = collection(db, "palabras");
    const snapshot = await getDocs(palabrasRef);
    let palabras = [];

    snapshot.forEach((doc) => {
        let data = doc.data();
        
        // 📌 Extraemos correctamente los valores del JSON
        let espanol = data.espanol ? data.espanol.stringValue || data.espanol : "Desconocido";
        let totonaco = data.totonaco ? data.totonaco.stringValue || data.totonaco : "Desconocido";

        palabras.push({ espanol, totonaco });
    });

    console.log("✅ Palabras obtenidas:", palabras);

    // 📌 Evento para buscar palabras
    buscador.addEventListener('input', () => {
        const query = buscador.value.toLowerCase();
        resultado.innerHTML = '';

        palabras.forEach(palabra => {
            if (palabra.espanol.toLowerCase().includes(query) || palabra.totonaco.toLowerCase().includes(query)) {
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

// 📌 Llamar a la función para obtener las palabras al cargar la página
obtenerPalabras();
