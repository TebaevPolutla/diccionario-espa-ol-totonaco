
/*
==============================================
TRADUCTOR TOTONACO–ESPAÑOL
TELEBACHILLERATO POLUTLA

APP.JS COMPLETO
CORRECCIÓN DEL CONTADOR PÚBLICO

Conserva:
- Búsqueda en Cloudflare D1
- Búsqueda local de respaldo
- Propuestas de palabras
- Cloudflare Turnstile
- Identificación original de visitantes
- Registro de visitas en Cloudflare
- Navegación entre traductor y formulario

Corrección:
- Registro de visita mediante POST
- Consulta de estadísticas mediante GET
- Actualización directa del nuevo diseño
- Sin duplicar registros por consultas GET
- Sin modificar la base de traducciones
==============================================
*/

// ALTURA INICIAL

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

// CONFIGURACIÓN ORIGINAL

const API_URL =
  'https://traductor-totonaco-api.eduardopereznani.workers.dev/';

const TURNSTILE_SITE_KEY =
  '0x4AAAAAAFeOoR4lrHD_E-5o';

const PROPOSAL_ENDPOINT =
  API_URL + 'api/propuestas';

const COUNTER_ENDPOINT =
  API_URL + 'api/contador';

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

// ========================================
// PALABRAS APROBADAS LOCALMENTE
// ========================================

function approvedLocal() {
  try {
    const data = JSON.parse(
      localStorage.getItem('aprobadas-demo') || '[]'
    );

    return Array.isArray(data)
      ? data.filter(w =>
          w &&
          w.espanol &&
          w.totonaco
        )
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
  const all = [
    ...localWords,
    ...approvedLocal()
  ];

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

// ========================================
// RESULTADOS DEL TRADUCTOR
// ========================================

function showMessage(message) {
  const out = $('results');

  if (!out) return;

  out.replaceChildren();

  const p = document.createElement('p');
  p.className = 'hint';
  p.textContent = message;

  out.appendChild(p);
}

function display(items, query) {
  const out = $('results');

  if (!out) return;

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

  const ordered = exact.length
    ? exact
    : items;

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

    const first = totonac
      ? w.totonaco
      : w.espanol;

    const second = totonac
      ? w.espanol
      : w.totonaco;

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

// ========================================
// BÚSQUEDA EN CLOUDFLARE D1
// ========================================

async function search() {
  const input = $('q');

  if (!input) return;

  const query = normalize(input.value);
  const current = ++requestNumber;

  if (!query) {
    showMessage(
      'Escribe una palabra para ver su traducción.'
    );
    return;
  }

  showMessage('Buscando traducción…');

  try {
    const response = await fetch(
      API_URL + '?palabra=' +
      encodeURIComponent(input.value.trim())
    );

    if (!response.ok) {
      throw new Error(
        'HTTP ' + response.status
      );
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

$('buscar')?.addEventListener('click', () => {
  search();
});

$('q')?.addEventListener('keydown', evento => {
  if (evento.key === 'Enter') {
    evento.preventDefault();
    search();
  }
});

$('clear')?.addEventListener('click', () => {
  clearTimeout(searchTimer);

  $('q').value = '';

  ++requestNumber;

  showMessage(
    'Escribe una palabra para ver su traducción.'
  );

  $('q').focus();
});

// ========================================
// TOTAL DE TRADUCCIONES DISPONIBLES
// ========================================

fetch(API_URL)
  .then(r => {
    if (!r.ok) {
      throw new Error('HTTP ' + r.status);
    }

    return r.json();
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
// RESPALDO LOCAL
// ========================================

fetch('palabras.json')
  .then(r => {
    if (!r.ok) {
      throw new Error('HTTP ' + r.status);
    }

    return r.json();
  })
  .then(data => {
    localWords = validWords(data);
    localReady = true;

    const count = $('count');

    if (
      count &&
      (!count.textContent.trim() ||
       count.textContent.trim() === '—')
    ) {
      count.textContent =
        new Intl.NumberFormat('es-MX')
          .format(localWords.length);
    }
  })
  .catch(() => {});

showMessage(
  'Escribe una palabra para ver su traducción.'
);

// ========================================
// PROTECCIÓN TURNSTILE PARA PROPUESTAS
// ========================================

let turnstileWidgetId = null;
let turnstileReady = false;

function setFormMessage(message) {
  const status = $('formStatus');

  if (status) {
    status.textContent = message;
  }
}

function loadTurnstile() {
  const form = $('proposalForm');

  if (!form) return;

  const container = document.createElement('div');

  container.id = 'turnstile-propuestas';
  container.style.margin = '16px 0';

  const submit =
    form.querySelector('[type="submit"]');

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

    turnstileWidgetId =
      window.turnstile.render(container, {
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

// ========================================
// ENVÍO DE PROPUESTAS A CLOUDFLARE D1
// ========================================

$('proposalForm')?.addEventListener(
  'submit',
  async event => {
    event.preventDefault();

    const form = $('proposalForm');

    const button =
      form.querySelector('[type="submit"]');

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
  navigator.serviceWorker.getRegistrations()
    .then(regs =>
      regs.forEach(reg => reg.unregister())
    );
}

// ========================================
// CAMBIO ENTRE BUSCADOR Y FORMULARIO
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
    e => {
      e.preventDefault();
      cambiarPantalla(true);
    }
  );

  botonVolver?.addEventListener(
    'click',
    e => {
      e.preventDefault();
      cambiarPantalla(false);
    }
  );
}

// ========================================
// CONTADOR PÚBLICO DE VISITAS
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
    if (
      !window.__diccionarioVisitanteTemporal
    ) {
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

  // TARJETAS DEL NUEVO DISEÑO

  const tarjetaVisitas =
    $('stats-visits');

  const tarjetaVisitantes =
    $('stats-unique');

  if (tarjetaVisitas) {
    tarjetaVisitas.textContent = visitas;
  }

  if (tarjetaVisitantes) {
    tarjetaVisitantes.textContent =
      visitantes;
  }

  // COMPATIBILIDAD CON DISEÑO ANTERIOR

  const contadorAnteriorVisitas =
    $('contador-total-visitas');

  const contadorAnteriorVisitantes =
    $('contador-unicos');

  if (contadorAnteriorVisitas) {
    contadorAnteriorVisitas.textContent =
      visitas;
  }

  if (contadorAnteriorVisitantes) {
    contadorAnteriorVisitantes.textContent =
      visitantes;
  }

  return true;
}

// ========================================
// CONSULTAR ESTADÍSTICAS SIN REGISTRAR
// UNA VISITA ADICIONAL
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
// REGISTRAR UNA VISITA Y ACTUALIZAR
// LAS ESTADÍSTICAS DEL NUEVO DISEÑO
// ========================================

async function iniciarContadorPublico() {
  try {
    const identificador =
      obtenerIdentificadorVisitante();

    // CONSERVAMOS EL REGISTRO ORIGINAL:
    // POST CON X-Visitor-Id.

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

    // SI POST DEVUELVE ESTADÍSTICAS
    // VÁLIDAS, LAS MOSTRAMOS TAMBIÉN.
    // SI NO LAS DEVUELVE, NO INTERRUMPIMOS
    // LA CONSULTA GET POSTERIOR.

    try {
      const datos = await respuesta.json();

      if (
        datos &&
        typeof datos.visitas === 'number' &&
        typeof datos.visitantes === 'number'
      ) {
        mostrarCifrasContador(datos);
      }

    } catch (errorDatos) {
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

  // ESTA CONSULTA SE REALIZA SIEMPRE,
  // TANTO SI POST FUNCIONÓ COMO SI FALLÓ.
  // GET SOLO CONSULTA LOS VALORES EXISTENTES.

  await consultarEstadisticasPublicas();
}

// INICIAR EL CONTADOR UNA SOLA VEZ

iniciarContadorPublico();

/*
==============================================
FIN DE APP.JS

ESTADÍSTICAS:
stats-visits = visitas totales
stats-unique = visitantes únicos estimados

POST: registra la visita.
GET: consulta las cifras.

NO SE MODIFICA EL WORKER.
NO SE MODIFICA LA BASE DE TRADUCCIONES.
==============================================
*/
