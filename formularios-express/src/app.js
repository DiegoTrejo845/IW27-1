// Servidor web con Express (clase del 19 de noviembre)
// Sintaxis moderna: módulos con import / export ("type": "module" en package.json)
import express from 'express';           // biblioteca instalada con npm: sin .js
import path from 'path';                 // biblioteca que ya trae Node.js: sin .js

// Puerto: el que defina el entorno (process.env.PORT) y, si no hay ninguno, 3000 por convención
const PORT = process.env.PORT || 3000;

// Instancia del servidor web creada con Express
const app = express();

// ---------- Middleware: se configuran con app.use() ----------
// Permite leer datos que lleguen en formato JSON (los mandaremos con fetch el martes)
app.use(express.json());

// Acceder a req.body: lee los datos que manda un formulario por POST.
// Sin esta línea req.body llega vacío (antes se usaba body-parser, que ya está en desuso)
app.use(express.urlencoded({ extended: true }));

// Entrega lo que está en public (HTML, CSS y JS que interpreta el navegador).
// path.resolve('public') arma la ruta completa a la carpeta public desde la raíz del proyecto,
// que es donde se ejecuta npm run dev. Por eso http://localhost:3000/ muestra public/index.html
app.use(express.static(path.resolve('public')));

// Evita que lo que escribió el usuario se interprete como HTML al regresarlo en la respuesta
const escaparHTML = (texto = '') => String(texto)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

// ---------- Rutas ----------
// Ruta = método HTTP + ubicación. Esta atiende POST en /login, que es el action
// del formulario de inicio de sesión. La ubicación no tiene que ser una carpeta real.
// La función flecha (callback) recibe la petición (req) y la respuesta (res)
app.post('/login', (req, res) => {
  // Cada dato llega con el name que tiene su input en el HTML (name="email")
  const email = req.body.email;

  // res.send() envía la respuesta: texto o HTML, que el navegador interpreta.
  // Con template literals (comillas invertidas) se mete la variable en el mensaje
  res.send(`
    <p>Prueba de respuesta a una petición</p>
    <p>Correo recibido: ${escaparHTML(email)}</p>
    <a href="/">Volver al formulario</a>
  `);
});

// Lanza el servidor y escucha las peticiones que lleguen al puerto
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
