
const initialWidth = window.innerWidth;
const initialHeight = Math.max(
  window.innerHeight,
  initialWidth <= 500 ? 750 : 700
);
document.documentElement.style.setProperty(
  '--alto-inicial',
  initialHeight + 'px'
);

'use strict';

const API_URL =
  'https://traductor-totonaco-api.eduardopereznani.workers.dev/';

const $ = id => document.getElementById(id);

const normalize = s => String(s || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('es')
  .trim();

let localWords = [];
let localReady = false;
let requestNumber = 0;
let searchTimer;

function approvedLocal() {
  try {
    const data = JSON.parse(
      localStorage.getItem('aprobadas-demo') || '[]'
    );
    return Array.isArray(data)
      ? data.filter(w => w && w.espanol && w.totonaco)
      : [];
  } catch {
    return [];
  }
}

function validWords(items) {
  return Array.isArray(items)
    ? items.filter(w =>
        w &&
        typeof w.espanol === 'string' &&
        typeof w.totonaco === 'string' &&
        w.espanol.trim() &&
        w.totonaco.trim()
      )
    : [];
}

function matchLocal(query) {
  const all = [...localWords, ...approvedLocal()];
  const exact = all.filter(w =>
    normalize(w.espanol) === query ||
    normalize(w.totonaco) === query
  );

  return exact.length
    ? exact.slice(0, 30)
    : all.filter(w =>
        normalize(w.espanol).includes(query) ||
        normalize(w.totonaco).includes(query)
      ).slice(0, 30);
}

function showMessage(message) {
  const out = $('results');
  out.replaceChildren();

  const p = document.createElement('p');
  p.className = 'hint';
  p.textContent = message;
  out.appendChild(p);
}

function display(items, query) {
  const out = $('results');
  out.replaceChildren();

  if (!items.length) {
    showMessage(
      'No encontramos esa palabra. Puedes proponerla en el formulario.'
    );
    return;
  }

  const exact = items.filter(w =>
    normalize(w.espanol) === query ||
    normalize(w.totonaco) === query
  );

  const ordered = exact.length ? exact : items;

  for (const w of ordered.slice(0, 30)) {
    const row = document.createElement('div');
    row.className = 'entry';

    const left = document.createElement('div');
    const right = document.createElement('div');
    right.className = 'translation';

    const spanish =
      normalize(w.espanol).includes(query) &&
      !normalize(w.totonaco).includes(query);

    const totonac =
      normalize(w.totonaco).includes(query) &&
      !normalize(w.espanol).includes(query);

    const first = totonac ? w.totonaco : w.espanol;
    const second = totonac ? w.espanol : w.totonaco;

    const title = document.createElement('strong');
    title.textContent = first;

    const info = document.createElement('small');
    info.textContent = totonac
      ? 'Totonaco → Español'
      : spanish
        ? 'Español → Totonaco'
        : 'Español ↔ Totonaco';

    left.append(title, info);
    right.textContent = second;
    row.append(left, right);
    out.appendChild(row);
  }
}

async function search() {
  const query = normalize($('q').value);
  const current = ++requestNumber;

  if (!query) {
    showMessage('Escribe una palabra para ver su traducción.');
    return;
  }

  showMessage('Buscando traducción…');

  try {
    const response = await fetch(
      API_URL + '?palabra=' +
      encodeURIComponent($('q').value.trim())
    );

    if (!response.ok) {
      throw new Error('HTTP ' + response.status);
    }

    const data = await response.json();

    if (!Array.isArray(data.resultados)) {
      throw new Error('Respuesta no válida');
    }

    if (current !== requestNumber) return;

    const combined = [
      ...validWords(data.resultados),
      ...approvedLocal()
    ];

    const seen = new Set();

    const unique = combined.filter(w => {
      const key =
        normalize(w.espanol) + '\u0000' +
        normalize(w.totonaco);

      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).filter(w =>
      normalize(w.espanol).includes(query) ||
      normalize(w.totonaco).includes(query)
    );

    display(unique, query);

  } catch (error) {
    if (current !== requestNumber) return;

    if (localReady) {
      display(matchLocal(query), query);
    } else {
      showMessage(
        'No se pudo consultar Cloudflare. Revisa tu conexión a internet.'
      );
    }

    console.warn(
      'Búsqueda en Cloudflare no disponible:',
      error
    );
  }
}

$('q').addEventListener('input', () => {
  clearTimeout(searchTimer);
  ++requestNumber;
  showMessage('Presiona Buscar para ver la traducción.');
});

$('buscar').addEventListener('click', () => {
  search();
});

$('q').addEventListener('keydown', (evento) => {
  if (evento.key === 'Enter') {
    evento.preventDefault();
    search();
  }
});


$('clear').addEventListener('click', () => {
  clearTimeout(searchTimer);
  $('q').value = '';
  ++requestNumber;

  showMessage('Escribe una palabra para ver su traducción.');
  $('q').focus();
});

fetch(API_URL)
  .then(r => {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  })
  .then(data => {
    if (typeof data.total === 'number') {
      $('count').textContent = data.total;
    }
  })
  .catch(() => {});

fetch('palabras.json')
  .then(r => {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  })
  .then(data => {
    localWords = validWords(data);
    localReady = true;

    if (!$('count').textContent.trim()) {
      $('count').textContent = localWords.length;
    }
  })
  .catch(() => {});

showMessage('Escribe una palabra para ver su traducción.');

// Las propuestas todavía se guardan localmente.
$('proposalForm').addEventListener('submit', e => {
  e.preventDefault();

  const proposal = {
    id: crypto.randomUUID
      ? crypto.randomUUID()
      : String(Date.now()) + Math.random(),

    espanol: $('es').value.trim(),
    totonaco: $('to').value.trim(),
    comunidad: $('community').value.trim(),
    fecha: new Date().toISOString(),
    estado: 'pendiente-local'
  };

  if (!proposal.espanol || !proposal.totonaco) return;

  let list = [];

  try {
    list = JSON.parse(
      localStorage.getItem('propuestas-demo') || '[]'
    );
  } catch {}

  if (!Array.isArray(list)) list = [];

  list.push(proposal);

  localStorage.setItem(
    'propuestas-demo',
    JSON.stringify(list)
  );

  $('formStatus').textContent =
    'Propuesta pendiente guardada en este navegador. ' +
    'Todavía no se envía por internet.';

  $('proposalForm').reset();
});

if (
  'serviceWorker' in navigator &&
  ['localhost', '127.0.0.1'].includes(location.hostname)
) {
  navigator.serviceWorker.getRegistrations()
    .then(regs =>
      regs.forEach(reg => reg.unregister())
    );
}


const pantallaTraductor = document.querySelector('.hero');
const pantallaFormulario = document.getElementById('proponer');
const botonProponer = document.querySelector('a[href="#proponer"]');
const botonVolver = document.querySelector('#proponer .back');

if (pantallaTraductor && pantallaFormulario) {
  function cambiarPantalla(mostrarFormulario) {
    pantallaTraductor.style.setProperty(
      'display',
      mostrarFormulario ? 'none' : '',
      'important'
    );

    pantallaFormulario.style.setProperty(
      'display',
      mostrarFormulario ? 'block' : 'none',
      'important'
    );

    pantallaFormulario.hidden = !mostrarFormulario;
    window.scrollTo(0, 0);
  }

  cambiarPantalla(false);

  botonProponer?.addEventListener('click', (e) => {
    e.preventDefault();
    cambiarPantalla(true);
  });

  botonVolver?.addEventListener('click', (e) => {
    e.preventDefault();
    cambiarPantalla(false);
  });
}
