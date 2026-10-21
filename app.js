
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

const TURNSTILE_SITE_KEY = '0x4AAAAAAFeOoR4lrHD_E-5o';
const PROPOSAL_ENDPOINT = API_URL + 'api/propuestas';
const COUNTER_ENDPOINT = API_URL + 'api/contador';

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

$('q').addEventListener('keydown', evento => {
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

// PROTECCION TURNSTILE PARA PROPUESTAS

let turnstileWidgetId = null;
let turnstileReady = false;

function setFormMessage(message) {
  $('formStatus').textContent = message;
}

function loadTurnstile() {
  const form = $('proposalForm');
  if (!form) return;

  const container = document.createElement('div');
  container.id = 'turnstile-propuestas';
  container.style.margin = '16px 0';

  const submit = form.querySelector('[type="submit"]');

  if (submit) {
    submit.parentNode.insertBefore(container, submit);
  } else {
    form.appendChild(container);
  }

  const script = document.createElement('script');

  script.src =
    'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

  script.async = true;
  script.defer = true;

  script.onload = () => {
    if (!window.turnstile) {
      setFormMessage(
        'No se pudo iniciar la verificación de seguridad.'
      );
      return;
    }

    turnstileWidgetId = window.turnstile.render(container, {
      sitekey: TURNSTILE_SITE_KEY,
      theme: 'auto',

      callback: () => {
        setFormMessage(
          'Verificación lista. Ya puedes enviar tu propuesta.'
        );
      },

      'expired-callback': () => {
        setFormMessage(
          'La verificación venció. Complétala de nuevo.'
        );
      },

      'error-callback': () => {
        setFormMessage(
          'Error al verificar. Vuelve a intentarlo.'
        );
      }
    });

    turnstileReady = true;
  };

  script.onerror = () => {
    setFormMessage(
      'No se pudo cargar la verificación. Revisa tu conexión.'
    );
  };

  document.head.appendChild(script);
}

loadTurnstile();

// ENVIO DE PROPUESTAS A CLOUDFLARE D1

$('proposalForm').addEventListener('submit', async event => {
  event.preventDefault();

  const form = $('proposalForm');
  const button = form.querySelector('[type="submit"]');

  const proposal = {
    espanol: $('es').value.trim(),
    totonaco: $('to').value.trim(),
    comunidad: $('community').value.trim()
  };

  if (!proposal.espanol || !proposal.totonaco) {
    setFormMessage(
      'Escribe la palabra en español y su traducción.'
    );
    return;
  }

  if (
    !turnstileReady ||
    turnstileWidgetId === null ||
    !window.turnstile
  ) {
    setFormMessage(
      'Espera a que cargue la verificación de seguridad.'
    );
    return;
  }

  const token = window.turnstile.getResponse(
    turnstileWidgetId
  );

  if (!token) {
    setFormMessage(
      'Completa primero la verificación de seguridad.'
    );
    return;
  }

  if (button) button.disabled = true;

  setFormMessage('Enviando propuesta…');

  try {
    const response = await fetch(PROPOSAL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...proposal,
        turnstileToken: token
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || 'No se pudo enviar la propuesta.'
      );
    }

    setFormMessage(
      data.mensaje || 'Propuesta recibida para revisión.'
    );

    if (!data.duplicada) {
      form.reset();
    }

  } catch (error) {
    setFormMessage(
      error.message || 'No se pudo enviar. Inténtalo más tarde.'
    );

    console.warn(
      'Error al enviar propuesta:',
      error
    );

  } finally {
    window.turnstile?.reset(turnstileWidgetId);

    if (button) {
      button.disabled = false;
    }
  }
});

// SERVICIO LOCAL

if (
  'serviceWorker' in navigator &&
  ['localhost', '127.0.0.1'].includes(location.hostname)
) {
  navigator.serviceWorker.getRegistrations()
    .then(regs =>
      regs.forEach(reg => reg.unregister())
    );
}

// CAMBIO ENTRE BUSCADOR Y FORMULARIO

const pantallaTraductor = document.querySelector('.hero');

const pantallaFormulario =
  document.getElementById('proponer');

const botonProponer =
  document.querySelector('a[href="#proponer"]');

const botonVolver =
  document.querySelector('#proponer .back');

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

  botonProponer?.addEventListener('click', e => {
    e.preventDefault();
    cambiarPantalla(true);
  });

  botonVolver?.addEventListener('click', e => {
    e.preventDefault();
    cambiarPantalla(false);
  });
}

// ========================================
// CONTADOR PUBLICO DE VISITAS
// ========================================

function obtenerIdentificadorVisitante() {
  const clave = 'diccionario-visitante-id-v1';
  const patron =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  try {
    let identificador = localStorage.getItem(clave);

    if (!identificador || !patron.test(identificador)) {
      identificador = crypto.randomUUID();
      localStorage.setItem(clave, identificador);
    }

    return identificador;
  } catch (error) {
    // En navegadores con almacenamiento restringido,
    // usamos un identificador temporal de esta sesión.
    if (!window.__diccionarioVisitanteTemporal) {
      window.__diccionarioVisitanteTemporal =
        crypto.randomUUID();
    }

    return window.__diccionarioVisitanteTemporal;
  }
}

function crearContadorVisible() {
  if (document.getElementById('contador-visitas')) {
    return;
  }

  const seccion = document.createElement('section');
  seccion.id = 'contador-visitas';

  Object.assign(seccion.style, {
    boxSizing: 'border-box',
    width: '100%',
    maxWidth: '700px',
    margin: '30px auto',
    padding: '20px 16px',
    background: '#f3f7f5',
    color: '#174a38',
    border: '1px solid #d7e7df',
    borderRadius: '14px',
    textAlign: 'center',
    fontFamily: 'inherit',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
  });

  const titulo = document.createElement('h2');
  titulo.textContent = 'Visitas al diccionario';

  Object.assign(titulo.style, {
    fontSize: '19px',
    margin: '0 0 16px',
    color: '#174a38'
  });

  const cifras = document.createElement('div');

  Object.assign(cifras.style, {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '28px'
  });

  function crearDato(etiqueta, identificador) {
    const bloque = document.createElement('div');

    const numero = document.createElement('strong');
    numero.id = identificador;
    numero.textContent = '—';

    Object.assign(numero.style, {
      display: 'block',
      fontSize: '32px',
      lineHeight: '1.2',
      color: '#146c4a'
    });

    const texto = document.createElement('span');
    texto.textContent = etiqueta;

    Object.assign(texto.style, {
      display: 'block',
      marginTop: '6px',
      fontSize: '14px',
      color: '#3f554b'
    });

    bloque.append(numero, texto);
    return bloque;
  }

  cifras.append(
    crearDato('Visitas totales', 'contador-total-visitas'),
    crearDato('Visitantes únicos estimados', 'contador-unicos')
  );

  const nota = document.createElement('small');
  nota.textContent =
    'Estadísticas registradas desde la activación del contador.';

  Object.assign(nota.style, {
    display: 'block',
    marginTop: '15px',
    color: '#64786c',
    fontSize: '12px'
  });

  seccion.append(titulo, cifras, nota);

  const pie = document.querySelector('footer');

  if (pie && pie.parentNode) {
    pie.parentNode.insertBefore(seccion, pie);
  } else {
    document.body.appendChild(seccion);
  }
}

function mostrarCifrasContador(datos) {
  if (
    !datos ||
    typeof datos.visitas !== 'number' ||
    typeof datos.visitantes !== 'number'
  ) {
    return;
  }

  const formato = new Intl.NumberFormat('es-MX');

  const visitas = $('contador-total-visitas');
  const visitantes = $('contador-unicos');

  if (visitas) {
    visitas.textContent = formato.format(datos.visitas);
  }

  if (visitantes) {
    visitantes.textContent = formato.format(datos.visitantes);
  }
}

async function iniciarContadorPublico() {
  crearContadorVisible();

  try {
    const identificador = obtenerIdentificadorVisitante();

    const respuesta = await fetch(COUNTER_ENDPOINT, {
      method: 'POST',
      headers: {
        'X-Visitor-Id': identificador
      },
      cache: 'no-store'
    });

    if (!respuesta.ok) {
      throw new Error('HTTP ' + respuesta.status);
    }

    const datos = await respuesta.json();

    mostrarCifrasContador(datos);

  } catch (error) {
    console.warn(
      'No se pudo registrar la visita:',
      error
    );

    // Si falla el registro, intentamos mostrar
    // los datos existentes sin modificar el contador.
    try {
      const respuesta = await fetch(COUNTER_ENDPOINT, {
        method: 'GET',
        cache: 'no-store'
      });

      if (respuesta.ok) {
        const datos = await respuesta.json();
        mostrarCifrasContador(datos);
      }
    } catch (errorConsulta) {
      console.warn(
        'Contador no disponible:',
        errorConsulta
      );
    }
  }
}

iniciarContadorPublico();
