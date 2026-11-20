// JavaScript del navegador (lado del cliente): cuatro formularios en una sola página (diseño SPA).
// El JavaScript hace cuatro cosas:
//   1. Cambiar de formulario con los hipervínculos, sin recargar la página.
//   2. Personalizar los mensajes de la API de validación de HTML5 (evento invalid + setCustomValidity).
//   3. Mostrar u ocultar la contraseña.
//   4. Cambiar entre modo claro y oscuro.
// Clase del 19: el login ya se manda al servidor de Express (ver src/app.js).
// Crear cuenta y recuperar contraseña todavía usan localStorage, hasta que veamos sus rutas.

// Espera a que el HTML esté cargado: así ningún getElementById regresa null
document.addEventListener('DOMContentLoaded', () => {

  // ---------- Mensajes en una constante: se cambian aquí sin buscarlos en el código ----------
  const MENSAJES = {
    obligatorio: 'Este campo es obligatorio.',
    correo: 'Escribe un correo válido, por ejemplo nombre@correo.com.',
    corto: 'Escribe al menos {n} caracteres.',
    contrasena: 'De 8 a 13 caracteres, con al menos una mayúscula, una minúscula y un número. Ejemplo: Correo2026',
    noCoinciden: 'Las contraseñas no coinciden.',
    elegir: 'Elige una pregunta de la lista.',
  };

  const mensaje = document.getElementById('mensaje');

  const mostrarMensaje = (texto, tipo) => {
    mensaje.textContent = texto;
    mensaje.className = `mensaje ${tipo}`; // 'exito' o 'error'
  };

  const limpiarMensaje = () => {
    mensaje.textContent = '';
    mensaje.className = 'mensaje';
  };

  // ---------- 1. Diseño SPA: una sola vista visible a la vez ----------
  const vistas = document.querySelectorAll('.vista');
  const TITULOS = {
    login: 'Iniciar sesión',
    registro: 'Crear cuenta',
    recuperar: 'Recuperar contraseña',
    pregunta: 'Recuperar contraseña',
  };

  const mostrarVista = (nombre) => {
    vistas.forEach(vista => {
      vista.classList.toggle('activa', vista.id === `vista-${nombre}`);
    });
    document.title = TITULOS[nombre];
    limpiarMensaje();

    // Lleva el cursor al primer campo del formulario que se abrió
    const primerCampo = document.querySelector(`#vista-${nombre} input, #vista-${nombre} select`);
    if (primerCampo) primerCampo.focus();
  };

  // Cada hipervínculo dice a qué formulario lleva con data-vista
  document.querySelectorAll('[data-vista]').forEach(enlace => {
    enlace.addEventListener('click', (e) => {
      e.preventDefault(); // href="#" no debe mover la página
      mostrarVista(enlace.dataset.vista);
    });
  });

  // ---------- 2. Mensajes personalizados de la API de validación ----------
  // Arreglo con los campos que el navegador valida: obligatorios, con longitud mínima o con patrón
  const campos = document.querySelectorAll('input[required], input[minlength], input[pattern], select[required]');

  // Elige el texto según lo que falló (validity dice qué regla no se cumplió)
  const mensajePara = (campo) => {
    const estado = campo.validity;

    if (estado.valueMissing) return campo.tagName === 'SELECT' ? MENSAJES.elegir : MENSAJES.obligatorio;
    if (estado.typeMismatch) return MENSAJES.correo;
    if (estado.tooShort) return MENSAJES.corto.replace('{n}', campo.minLength);
    if (estado.patternMismatch) return MENSAJES.contrasena;
    return campo.validationMessage; // por ejemplo, "Las contraseñas no coinciden"
  };

  campos.forEach(campo => {
    // El navegador lanza "invalid" al intentar enviar si el campo no cumple
    campo.addEventListener('invalid', () => {
      campo.setCustomValidity(mensajePara(campo));
    });

    // Al escribir (o al elegir otra opción de la lista) se borra el mensaje propio
    // para que el navegador vuelva a revisar el campo
    const evento = campo.tagName === 'SELECT' ? 'change' : 'input';
    campo.addEventListener(evento, () => campo.setCustomValidity(''));
  });

  // HTML no puede comparar dos campos: "Confirmar contraseña" se revisa aquí
  const contrasena = document.getElementById('contrasena');
  const confirmar = document.getElementById('confirmar');

  const revisarCoincidencia = () => {
    confirmar.setCustomValidity(
      confirmar.value !== contrasena.value ? MENSAJES.noCoinciden : ''
    );
  };

  contrasena.addEventListener('input', revisarCoincidencia);
  confirmar.addEventListener('input', revisarCoincidencia);

  // ---------- 3. Ver u ocultar la contraseña ----------
  document.querySelectorAll('.ver-contrasena').forEach(boton => {
    boton.addEventListener('click', () => {
      const campo = document.getElementById(boton.dataset.para);
      const oculta = campo.type === 'password';

      campo.type = oculta ? 'text' : 'password';
      boton.textContent = oculta ? 'Ocultar' : 'Ver';
      boton.setAttribute('aria-pressed', String(oculta));
    });
  });

  // ---------- 4. Modo claro / oscuro con data-theme ----------
  const raiz = document.documentElement; // la etiqueta <html>
  const botonTema = document.getElementById('cambiar-tema');

  const aplicarTema = (tema) => {
    raiz.dataset.theme = tema;
    botonTema.textContent = tema === 'dark' ? 'Modo claro' : 'Modo oscuro';
    botonTema.setAttribute('aria-pressed', String(tema === 'dark'));
  };

  try {
    aplicarTema(localStorage.getItem('tema') === 'dark' ? 'dark' : 'light');
  } catch {
    aplicarTema('light');
  }

  botonTema.addEventListener('click', () => {
    const nuevo = raiz.dataset.theme === 'dark' ? 'light' : 'dark';
    aplicarTema(nuevo);
    try { localStorage.setItem('tema', nuevo); } catch { /* sin localStorage solo no se recuerda */ }
  });

  // ---------- Cuentas guardadas (simulación mientras no hay servidor) ----------
  const leerUsuarios = () => {
    try {
      const guardados = JSON.parse(localStorage.getItem('usuarios'));
      return Array.isArray(guardados) ? guardados : [];
    } catch {
      return [];
    }
  };

  const guardarUsuarios = (usuarios) => {
    localStorage.setItem('usuarios', JSON.stringify(usuarios));
  };

  // Para comparar sin importar mayúsculas ni espacios de más
  const normalizar = (texto) => texto.trim().toLowerCase();

  // ---------- Envío de cada formulario ----------
  // El navegador solo dispara "submit" si todos los campos pasaron la validación.
  // preventDefault evita que la página se recargue (diseño SPA).

  // Formulario 1: iniciar sesión
  // Clase del 19: este ya NO lleva preventDefault. Si los campos pasan la validación,
  // el navegador lo manda al servidor con su action="/login" y method="POST",
  // y la ruta app.post('/login') de src/app.js contesta con res.send().

  // Formulario 2: crear cuenta
  const formRegistro = document.getElementById('form-registro');
  formRegistro.addEventListener('submit', (e) => {
    e.preventDefault();

    // Los datos del formulario agrupados en un objeto, como se mandarán al servidor en JSON.
    // La contraseña no se guarda aquí: eso le tocará al servidor.
    const nuevo = {
      nombre: formRegistro.nombre.value.trim(),
      correo: normalizar(formRegistro.correo.value),
      pregunta: formRegistro.pregunta.value,
      respuesta: normalizar(formRegistro.respuesta.value),
    };

    const usuarios = leerUsuarios();

    if (usuarios.some(u => u.correo === nuevo.correo)) {
      mostrarMensaje('Ya existe una cuenta con ese correo. Inicia sesión o recupera tu contraseña.', 'error');
      return;
    }

    try {
      guardarUsuarios([...usuarios, nuevo]);
    } catch {
      mostrarMensaje('No se pudo guardar la cuenta en este navegador.', 'error');
      return;
    }

    formRegistro.reset();
    mostrarVista('login');
    mostrarMensaje(`Cuenta creada, ${nuevo.nombre}. Ya puedes iniciar sesión.`, 'exito');
  });

  // Formulario 3: recuperar contraseña, paso 1 (buscar el correo)
  const formRecuperar = document.getElementById('form-recuperar');
  const formPregunta = document.getElementById('form-pregunta');
  const textoPregunta = document.getElementById('texto-pregunta');
  let correoEnRecuperacion = '';

  formRecuperar.addEventListener('submit', (e) => {
    e.preventDefault();

    const correo = normalizar(formRecuperar.correo.value);
    const usuario = leerUsuarios().find(u => u.correo === correo);

    if (!usuario) {
      mostrarMensaje('No encontramos una cuenta con ese correo.', 'error');
      return;
    }

    // Si existe, aparece el segundo formulario con la pregunta que eligió al registrarse
    correoEnRecuperacion = usuario.correo;
    textoPregunta.textContent = usuario.pregunta;
    formRecuperar.reset();
    mostrarVista('pregunta');
  });

  // Formulario 4: recuperar contraseña, paso 2 (responder la pregunta)
  formPregunta.addEventListener('submit', (e) => {
    e.preventDefault();

    const usuario = leerUsuarios().find(u => u.correo === correoEnRecuperacion);
    const respuesta = normalizar(formPregunta.respuesta.value);

    if (!usuario || usuario.respuesta !== respuesta) {
      mostrarMensaje('La respuesta no coincide. Inténtalo de nuevo.', 'error');
      return;
    }

    formPregunta.reset();
    mostrarMensaje('Respuesta correcta. Aquí seguirá el formulario para escribir una nueva contraseña.', 'exito');
  });
});
