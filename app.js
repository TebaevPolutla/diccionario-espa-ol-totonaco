/*
==================================================
TRADUCTOR TOTONACO–ESPAÑOL
TELEBACHILLERATO POLUTLA

APP.JS COMPLETO

CORRECCIÓN:
- Búsqueda por idioma desde Cloudflare D1
- Prioridad absoluta a coincidencias exactas
- Sugerencias solamente si no hay coincidencia exacta
- Conserva propuestas, Turnstile y contador
- Conserva respaldo local y navegación
==================================================
*/

// ========================================
// ALTURA INICIAL
// ========================================

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

// ========================================
// CONFIGURACIÓN
// ========================================

const API_URL =
  'https://traductor-totonaco-api.eduardopereznani.workers.dev/';

const TURNSTILE_SITE_KEY =
  '0x4AAAAAAFeOoR4lrHD_E-5o';

const PROPOSAL_ENDPOINT =
  API_URL + 'api/propuestas';

const COUNTER_ENDPOINT =
  API_URL + 'api/contador';

const $ = id => document.getElementById(id);

// ========================================
// NORMALIZACIÓN
// ========================================

const normalize = value =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
    .trim();

// ========================================
// VARIABLES
// ========================================

let localWords = [];
let localReady = false;

let requestNumber = 0;
let searchTimer;

let searchDirection = 'es';

// ========================================
// DIRECCIÓN DE TRADUCCIÓN
// ========================================

function sourceField() {
  return searchDirection === 'es'
    ? 'espanol'
    : 'totonaco';
}

function targetField() {
  return searchDirection === 'es'
    ? 'totonaco'
    : 'espanol';
}

// ========================================
// VALIDAR PALABRAS
// ========================================

function validWords(items) {
  return Array.isArray(items)
    ? items.filter(word =>
        word &&
        typeof word.espanol === 'string' &&
        typeof word.totonaco === 'string' &&
        word.espanol.trim() &&
        word.totonaco.trim()
      )
    : [];
}

// ========================================
// PALABRAS APROBADAS LOCALMENTE
// ========================================

function approvedLocal() {
  try {
    const data = JSON.parse(
      localStorage.getItem('aprobadas-demo') || '[]'
    );

    return validWords(data);
  } catch {
    return [];
  }
}

// ========================================
// ELIMINAR DUPLICADOS
// ========================================

function uniqueWords(items) {
  const seen = new Set();

  return validWords(items).filter(word => {
    const key =
      normalize(word.espanol) + '\u0000' +
      normalize(word.totonaco);

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

// ========================================
// CLASIFICAR RESULTADOS
// ========================================

function classifyResults(items, query) {
  const source = sourceField();
  const words = uniqueWords(items);

  // PRIORIDAD 1: COINCIDENCIA EXACTA

  const exact = words.filter(word =>
    normalize(word[source]) === query
  );

  if (exact.length > 0) {
    return {
      type: 'exact',
      items: exact.slice(0, 30)
    };
  }

  // PRIORIDAD 2: PALABRAS QUE COMIENZAN IGUAL

  const startsWith = words.filter(word =>
    normalize(word[source]).startsWith(query)
  );

  // PRIORIDAD 3: PALABRAS QUE CONTIENEN EL TEXTO

  const contains = words.filter(word => {
    const value = normalize(word[source]);

    return (
      value.includes(query) &&
      !value.startsWith(query)
    );
  });

  const suggestions = [
    ...startsWith,
    ...contains
  ].slice(0, 30);

  if (suggestions.length > 0) {
    return {
      type: 'suggestions',
      items: suggestions
    };
  }

  return {
    type: 'none',
    items: []
  };
}

// ========================================
// RESPALDO LOCAL
// ========================================

function matchLocal(query) {
  return classifyResults(
    [
      ...localWords,
      ...approvedLocal()
    ],
    query
  );
}

// ========================================
// MOSTRAR MENSAJES
// ========================================

function showMessage(message) {
  const out = $('results');

  if (!out) return;

  out.replaceChildren();

  const paragraph = document.createElement('p');

  paragraph.className = 'hint';
  paragraph.textContent = message;

  out.appendChild(paragraph);
}

// ========================================
// MOSTRAR RESULTADOS
// ========================================

function display(result) {
  const out = $('results');

  if (!out) return;

  out.replaceChildren();

  if (
    !result ||
    result.type === 'none' ||
    !result.items.length
  ) {
    showMessage(
      'No encontramos esa palabra. Puedes proponerla en el formulario.'
    );
    return;
  }

  if (result.type === 'suggestions') {
    const notice = document.createElement('p');

    notice.className = 'hint';
    notice.textContent =
      'No encontramos una coincidencia exacta. Estas son palabras relacionadas:';

    notice.style.marginBottom = '14px';

    out.appendChild(notice);
  }

  const source = sourceField();
  const target = targetField();

  const directionLabel =
    searchDirection === 'es'
      ? 'Español → Totonaco'
      : 'Totonaco → Español';

  for (const word of result.items) {
    const row = document.createElement('div');
    row.className = 'entry';

    const left = document.createElement('div');

    const title = document.createElement('strong');
    title.textContent = word[source];

    const info = document.createElement('small');
    info.textContent = directionLabel;

    left.append(title, info);

    const right = document.createElement('div');
    right.className = 'translation';
    right.textContent = word[target];

    row.append(left, right);
    out.appendChild(row);
  }
}

// ========================================
// CAMBIAR DIRECCIÓN DE BÚSQUEDA
// ========================================

function setSearchDirection(direction) {
  if (direction !== 'es' && direction !== 'to') {
    return;
  }

  searchDirection = direction;

  const spanishButton = $('direction-es');
  const totonacButton = $('direction-to');
  const input = $('q');

  if (spanishButton) {
    spanishButton.classList.toggle(
      'active',
      direction === 'es'
    );

    spanishButton.setAttribute(
      'aria-pressed',
      String(direction === 'es')
    );
  }

  if (totonacButton) {
    totonacButton.classList.toggle(
      'active',
      direction === 'to'
    );

    totonacButton.setAttribute(
      'aria-pressed',
      String(direction === 'to')
    );
  }

  if (input) {
    input.placeholder =
      direction === 'es'
        ? 'Escribe una palabra en español...'
        : 'Escribe una palabra en totonaco...';

    input.setAttribute(
      'aria-label',
      direction === 'es'
        ? 'Buscar una palabra en español'
        : 'Buscar una palabra en totonaco'
    );

    input.value = '';
  }

  clearTimeout(searchTimer);
  ++requestNumber;

  showMessage(
    'Escribe una palabra para ver su traducción.'
  );
}

// ========================================
// BOTONES DE IDIOMA
// ========================================

$('direction-es')?.addEventListener(
  'click',
  () => setSearchDirection('es')
);

$('direction-to')?.addEventListener(
  'click',
  () => setSearchDirection('to')
);

setSearchDirection('es');

// ========================================
// BÚSQUEDA EN CLOUDFLARE D1
// ========================================

async function search() {
  const input = $('q');

  if (!input) return;

  const rawQuery = input.value.trim();
  const query = normalize(rawQuery);

  const current = ++requestNumber;
  const directionAtStart = searchDirection;

  if (!query) {
    showMessage(
      'Escribe una palabra para ver su traducción.'
    );
    return;
  }

  showMessage('Buscando traducción…');

  try {
    // CAMBIO PRINCIPAL:
    // ENVIAR PALABRA E IDIOMA A CLOUDFLARE.

    const params = new URLSearchParams({
      palabra: rawQuery,
      idioma: directionAtStart
    });

    const response = await fetch(
      API_URL + '?' + params.toString(),
      { cache: 'no-store' }
    );

    if (!response.ok) {
      throw new Error('HTTP ' + response.status);
    }

    const data = await response.json();

    if (!Array.isArray(data.resultados)) {
      throw new Error('Respuesta no válida');
    }

    if (
      current !== requestNumber ||
      directionAtStart !== searchDirection
    ) {
      return;
    }

    // SOLO RESULTADOS DEL IDIOMA SELECCIONADO.
    // CONSERVAR PALABRAS APROBADAS LOCALMENTE.

    const combined = [
      ...validWords(data.resultados),
      ...approvedLocal()
    ];

    const result = classifyResults(
      combined,
      query
    );

    display(result);

  } catch (error) {
    if (
      current !== requestNumber ||
      directionAtStart !== searchDirection
    ) {
      return;
    }

    if (localReady) {
      display(matchLocal(query));
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

// ========================================
// CONTROLES DEL BUSCADOR
// ========================================

$('q')?.addEventListener('input', () => {
  clearTimeout(searchTimer);
  ++requestNumber;

  showMessage(
    'Presiona Buscar para ver la traducción.'
  );
});

$('buscar')?.addEventListener(
  'click',
  () => search()
);

$('q')?.addEventListener(
  'keydown',
  event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      search();
    }
  }
);

$('clear')?.addEventListener(
  'click',
  () => {
    clearTimeout(searchTimer);

    const input = $('q');
    if (!input) return;

    input.value = '';
    ++requestNumber;

    showMessage(
      'Escribe una palabra para ver su traducción.'
    );

    input.focus();
  }
);

// ========================================
// TOTAL DE TRADUCCIONES
// ========================================

fetch(API_URL)
  .then(response => {
    if (!response.ok) {
      throw new Error('HTTP ' + response.status);
    }

    return response.json();
  })
  .then(data => {
    if (
      typeof data.total === 'number' &&
      $('count')
    ) {
      $('count').textContent =
        new Intl.NumberFormat('es-MX')
          .format(data.total);
    }
  })
  .catch(error => {
    console.warn(
      'No se pudo obtener el total de traducciones:',
      error
    );
  });

// ========================================
// CARGAR RESPALDO LOCAL
// ========================================

fetch('palabras.json')
  .then(response => {
    if (!response.ok) {
      throw new Error('HTTP ' + response.status);
    }

    return response.json();
  })
  .then(data => {
    localWords = validWords(data);
    localReady = true;

    const count = $('count');

    if (
      count &&
      (
        !count.textContent.trim() ||
        count.textContent.trim() === '—'
      )
    ) {
      count.textContent =
        new Intl.NumberFormat('es-MX')
          .format(localWords.length);
    }
  })
  .catch(error => {
    console.warn(
      'No se pudo cargar el respaldo local:',
      error
    );
  });

// ========================================
// MENSAJE INICIAL
// ========================================

showMessage(
  'Escribe una palabra para ver su traducción.'
);

// ========================================
// PROTECCIÓN TURNSTILE
// ========================================

let turnstileWidgetId = null;
let turnstileReady = false;

function setFormMessage(message) {
  const status = $('formStatus');

  if (status) {
    status.textContent = message;
  }
}

// ========================================
// CARGAR TURNSTILE
// ========================================

function loadTurnstile() {
  const form = $('proposalForm');

  if (!form) return;

  const container = document.createElement('div');

  container.id = 'turnstile-propuestas';
  container.style.margin = '16px 0';

  const submit = form.querySelector(
    '[type="submit"]'
  );

  if (submit) {
    submit.parentNode.insertBefore(
      container,
      submit
    );
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

    turnstileWidgetId = window.turnstile.render(
      container,
      {
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
      }
    );

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

// ========================================
// ENVÍO DE PROPUESTAS
// ========================================

$('proposalForm')?.addEventListener(
  'submit',
  async event => {
    event.preventDefault();

    const form = $('proposalForm');

    const button = form.querySelector(
      '[type="submit"]'
    );

    const proposal = {
      espanol: $('es').value.trim(),
      totonaco: $('to').value.trim(),
      comunidad: $('community').value.trim()
    };

    if (
      !proposal.espanol ||
      !proposal.totonaco
    ) {
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

    if (button) {
      button.disabled = true;
    }

    setFormMessage('Enviando propuesta…');

    try {
      const response = await fetch(
        PROPOSAL_ENDPOINT,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json'
          },

          body: JSON.stringify({
            ...proposal,
            turnstileToken: token
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          'No se pudo enviar la propuesta.'
        );
      }

      setFormMessage(
        data.mensaje ||
        'Propuesta recibida para revisión.'
      );

      if (!data.duplicada) {
        form.reset();
      }

    } catch (error) {
      setFormMessage(
        error.message ||
        'No se pudo enviar. Inténtalo más tarde.'
      );

      console.warn(
        'Error al enviar propuesta:',
        error
      );

    } finally {
      window.turnstile?.reset(
        turnstileWidgetId
      );

      if (button) {
        button.disabled = false;
      }
    }
  }
);

// ========================================
// SERVICIO LOCAL
// ========================================

if (
  'serviceWorker' in navigator &&
  ['localhost', '127.0.0.1'].includes(
    location.hostname
  )
) {
  navigator.serviceWorker
    .getRegistrations()
    .then(registrations =>
      registrations.forEach(
        registration => registration.unregister()
      )
    );
}

// ========================================
// NAVEGACIÓN ENTRE PANTALLAS
// ========================================

const pantallaTraductor =
  document.querySelector('.hero');

const pantallaFormulario =
  document.getElementById('proponer');

const botonProponer =
  document.querySelector(
    'a[href="#proponer"]'
  );

const botonVolver =
  document.querySelector(
    '#proponer .back'
  );

if (
  pantallaTraductor &&
  pantallaFormulario
) {
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

    pantallaFormulario.hidden =
      !mostrarFormulario;

    window.scrollTo(0, 0);
  }

  cambiarPantalla(false);

  botonProponer?.addEventListener(
    'click',
    event => {
      event.preventDefault();
      cambiarPantalla(true);
    }
  );

  botonVolver?.addEventListener(
    'click',
    event => {
      event.preventDefault();
      cambiarPantalla(false);
    }
  );
}

// ========================================
// IDENTIFICADOR DEL VISITANTE
// ========================================

function obtenerIdentificadorVisitante() {
  const clave =
    'diccionario-visitante-id-v1';

  const patron =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  try {
    let identificador =
      localStorage.getItem(clave);

    if (
      !identificador ||
      !patron.test(identificador)
    ) {
      identificador = crypto.randomUUID();

      localStorage.setItem(
        clave,
        identificador
      );
    }

    return identificador;

  } catch (error) {
    if (!window.__diccionarioVisitanteTemporal) {
      window.__diccionarioVisitanteTemporal =
        crypto.randomUUID();
    }

    return window.__diccionarioVisitanteTemporal;
  }
}

// ========================================
// MOSTRAR ESTADÍSTICAS
// ========================================

function mostrarCifrasContador(datos) {
  if (
    !datos ||
    typeof datos.visitas !== 'number' ||
    typeof datos.visitantes !== 'number' ||
    !Number.isFinite(datos.visitas) ||
    !Number.isFinite(datos.visitantes)
  ) {
    console.warn(
      'El contador recibió datos incompletos:',
      datos
    );

    return false;
  }

  const formato =
    new Intl.NumberFormat('es-MX');

  const visitas =
    formato.format(datos.visitas);

  const visitantes =
    formato.format(datos.visitantes);

  const tarjetaVisitas =
    $('stats-visits');

  const tarjetaVisitantes =
    $('stats-unique');

  if (tarjetaVisitas) {
    tarjetaVisitas.textContent = visitas;
  }

  if (tarjetaVisitantes) {
    tarjetaVisitantes.textContent = visitantes;
  }

  // COMPATIBILIDAD CON DISEÑO ANTERIOR

  const contadorAnteriorVisitas =
    $('contador-total-visitas');

  const contadorAnteriorVisitantes =
    $('contador-unicos');

  if (contadorAnteriorVisitas) {
    contadorAnteriorVisitas.textContent = visitas;
  }

  if (contadorAnteriorVisitantes) {
    contadorAnteriorVisitantes.textContent =
      visitantes;
  }

  return true;
}

// ========================================
// CONSULTAR ESTADÍSTICAS
// ========================================

async function consultarEstadisticasPublicas() {
  try {
    const respuesta = await fetch(
      COUNTER_ENDPOINT,
      {
        method: 'GET',
        cache: 'no-store'
      }
    );

    if (!respuesta.ok) {
      throw new Error(
        'HTTP ' + respuesta.status
      );
    }

    const datos = await respuesta.json();

    if (!mostrarCifrasContador(datos)) {
      throw new Error(
        'La respuesta GET no contiene estadísticas válidas.'
      );
    }

    return true;

  } catch (error) {
    console.warn(
      'No se pudieron consultar las estadísticas:',
      error
    );

    return false;
  }
}

// ========================================
// REGISTRAR VISITA
// ========================================

async function iniciarContadorPublico() {
  try {
    const identificador =
      obtenerIdentificadorVisitante();

    const respuesta = await fetch(
      COUNTER_ENDPOINT,
      {
        method: 'POST',

        headers: {
          'X-Visitor-Id': identificador
        },

        cache: 'no-store'
      }
    );

    if (!respuesta.ok) {
      throw new Error(
        'HTTP ' + respuesta.status
      );
    }

    try {
      const datos = await respuesta.json();

      if (
        datos &&
        typeof datos.visitas === 'number' &&
        typeof datos.visitantes === 'number'
      ) {
        mostrarCifrasContador(datos);
      }

    } catch {
      console.info(
        'Registro realizado; consultaremos las estadísticas por GET.'
      );
    }

  } catch (error) {
    console.warn(
      'No se pudo registrar la visita:',
      error
    );
  }

  await consultarEstadisticasPublicas();
}

// ========================================
// INICIAR CONTADOR
// ========================================

iniciarContadorPublico();

/*
==================================================
FIN DE APP.JS

BÚSQUEDA:
- Español: idioma=es
- Totonaco: idioma=to
- Coincidencia exacta primero
- Sugerencias después

CLOUDFLARE D1:
- Sin modificaciones a los datos

PROPUESTAS, TURNSTILE Y CONTADOR:
- Funciones conservadas
==================================================
*/
