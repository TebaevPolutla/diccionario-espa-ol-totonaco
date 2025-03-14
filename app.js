// 📌 Importar Firebase Firestore
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, query, where } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

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
const listaPalabras = document.getElementById("lista-palabras"); // 📌 Contenedor para todas las palabras
const formulario = document.getElementById("formulario");
const mensaje = document.getElementById("mensaje");

window.palabras = []; // Lista global de palabras

// 📌 Función para obtener palabras desde Firestore
async function obtenerPalabrasDesdeFirestore() {
    try {
        console.log("🔍 Obteniendo datos desde Firestore...");
        const querySnapshot = await getDocs(collection(db, "palabras"));

        window.palabras = querySnapshot.docs.map(doc => ({
            id: doc.id,  // 📌 ID de Firestore para poder eliminar palabras
            ...doc.data()
        }));

        console.log("✅ Palabras obtenidas:", window.palabras);
        mostrarTodasLasPalabras();
    } catch (error) {
        console.error("❌ Error al obtener los datos:", error);
    }
}

// 📌 Función para mostrar **todas** las palabras en la lista
function mostrarTodasLasPalabras() {
    listaPalabras.innerHTML = "";
    window.palabras.forEach(palabra => {
        const item = document.createElement("li");
        item.innerHTML = `<strong>${palabra.espanol}</strong> - ${palabra.totonaco} <br>
                          <small>📌 Agregado por: ${palabra.colaborador || "Anónimo"}</small>
                          <button onclick="eliminarPalabra('${palabra.id}')">🗑️ Eliminar</button>`;
        listaPalabras.appendChild(item);
    });
}

// 📌 Función para eliminar una palabra de Firestore
async function eliminarPalabra(id) {
    if (confirm("¿Estás seguro de que quieres eliminar esta palabra?")) {
        try {
            await deleteDoc(doc(db, "palabras", id));
            console.log("✅ Palabra eliminada correctamente.");
            obtenerPalabrasDesdeFirestore(); // 🔄 Actualizar la lista después de eliminar
        } catch (error) {
            console.error("❌ Error al eliminar la palabra:", error);
        }
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

    if (filtradas.length > 0) {
        const palabra = filtradas[0]; // Solo mostrar una coincidencia exacta
        const item = document.createElement("li");
        item.innerHTML = `<strong>${palabra.espanol}</strong> - ${palabra.totonaco} <br> 
                          <small>📌 Agregado por: ${palabra.colaborador || "Anónimo"}</small>`;
        resultado.appendChild(item);
    } else {
        resultado.innerHTML = "<li>No se encontró la palabra exacta</li>";
    }
}

// 📌 Función para agregar nuevas palabras evitando duplicados
formulario.addEventListener("submit", async function(event) {
    event.preventDefault();

    const nuevoEspanol = document.getElementById("nuevoEspanol").value.trim();
    const nuevoTotonaco = document.getElementById("nuevoTotonaco").value.trim();
    const colaborador = document.getElementById("colaborador").value.trim() || "Anónimo";

    if (!nuevoEspanol || !nuevoTotonaco) {
        mensaje.textContent = "❌ Por favor, completa todos los campos.";
        return;
    }

    // 📌 Comprobar si la palabra ya existe
    const consulta = query(collection(db, "palabras"), where("espanol", "==", nuevoEspanol.toLowerCase()));
    const resultado = await getDocs(consulta);

    if (!resultado.empty) {
        mensaje.textContent = "⚠️ La palabra ya existe en la base de datos.";
        return;
    }

    try {
        await addDoc(collection(db, "palabras"), {
            espanol: nuevoEspanol,
            totonaco: nuevoTotonaco,
            colaborador: colaborador,
            fecha: new Date().toISOString()
        });

        console.log("✅ Palabra agregada correctamente.");
        mensaje.textContent = "✅ Palabra enviada correctamente.";
        formulario.reset();

        obtenerPalabrasDesdeFirestore(); // 🔄 Actualizar la lista en tiempo real
    } catch (error) {
        console.error("❌ Error al enviar la palabra:", error);
        mensaje.textContent = "❌ Error al enviar la palabra.";
    }
});

// 📌 Cargar palabras al inicio
window.onload = obtenerPalabrasDesdeFirestore;
buscador.addEventListener("input", () => setTimeout(() => filtrarPalabras(), 300));

       


   
