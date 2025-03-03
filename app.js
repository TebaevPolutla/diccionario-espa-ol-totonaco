// Base de datos local
const palabras = [
    { "espanol": "puerco", "totonaco": "paxni" },
    { "espanol": "cerdo", "totonaco": "paxni" }
  ];
  
  const buscador = document.getElementById('buscador');
  const resultado = document.getElementById('resultado');
  
  // Función para buscar palabras
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

  