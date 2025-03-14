// 📌 Función mejorada para buscar palabras
function filtrarPalabras() {
    const termino = buscador.value.toLowerCase().trim();
    resultado.innerHTML = ""; 

    if (termino === "") return;

    // 📌 Filtrar resultados exactos o relevantes
    const filtradas = palabras.filter(palabra =>
        palabra.espanol.toLowerCase() === termino || 
        palabra.totonaco.toLowerCase() === termino || 
        palabra.espanol.toLowerCase().includes(` ${termino} `) || 
        palabra.totonaco.toLowerCase().includes(` ${termino} `)
    );

    // 📌 Mostrar los resultados mejorados
    if (filtradas.length > 0) {
        filtradas.forEach(palabra => {
            const item = document.createElement("li");

            // 📌 Resaltar la palabra buscada en los resultados
            let espanolDestacado = palabra.espanol.replace(new RegExp(termino, "gi"), match => `<mark>${match}</mark>`);
            let totonacoDestacado = palabra.totonaco.replace(new RegExp(termino, "gi"), match => `<mark>${match}</mark>`);

            item.innerHTML = `<strong>${espanolDestacado}</strong> - ${totonacoDestacado}`;
            resultado.appendChild(item);
        });
    } else {
        resultado.innerHTML = "<li>No se encontraron resultados exactos</li>";
    }
}
