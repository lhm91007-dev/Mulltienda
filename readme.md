# Norte — PWA (app instalable, gratis, sin tiendas de apps)

Esta es una app web progresiva (PWA): un sitio normal que, una vez publicado
en internet con HTTPS, el navegador ofrece "instalar" — queda con ícono en
la pantalla de inicio, abre a pantalla completa sin barra de navegador, y
funciona offline. Probada de punta a punta (catálogo, carrito, checkout,
panel admin y asistente de IA) sin errores.

## Qué puedo y qué no puedo hacer yo (Claude)

Puedo escribir y probar el código (lo corrí en un navegador real dentro de
mi entorno), pero **no puedo publicarlo en una URL pública** — este entorno
no tiene salida a internet. El paso de "subir esto a un hosting" lo tienes
que hacer tú, y toma literalmente un par de minutos con las opciones de
abajo.

## 1. Publicarla gratis (elige una)

**Netlify (la más simple):**
1. Entra a [app.netlify.com/drop](https://app.netlify.com/drop)
2. Arrastra la carpeta `norte-pwa` completa a esa página
3. Netlify te da una URL pública (`algo.netlify.app`) al instante, con HTTPS
   incluido — requisito obligatorio para que la instalación funcione

**GitHub Pages (si ya usas GitHub):**
1. Crea un repositorio, sube el contenido de `norte-pwa/`
2. Settings → Pages → selecciona la rama → guarda
3. Te da una URL tipo `tuusuario.github.io/tu-repo`

Ambas son gratuitas de forma permanente para un sitio de este tamaño.

## 2. Instalarla en el teléfono

- **Android (Chrome)**: al abrir la URL aparece un botón "Instalar app"
  (ya viene programado en `index.html`), o desde el menú ⋮ → "Instalar
  aplicación".
- **iPhone (Safari)**: Safari no muestra ese botón automático — hay que
  tocar el ícono de compartir (el cuadrado con la flecha hacia arriba) →
  "Agregar a inicio". Por eso el `index.html` ya incluye las etiquetas
  `apple-mobile-web-app-capable` y el ícono correcto para que se vea bien.

Desde ahí se abre como cualquier app instalada, sin barra de navegador.

## 3. Convertirla en un .apk de Android (sin cuenta de Google Play)

Una vez que tengas la URL pública del paso 1:

1. Ve a [pwabuilder.com](https://www.pwabuilder.com) (herramienta gratuita
   de Microsoft, de código abierto)
2. Pega tu URL, deja que analice el manifest
3. Elige "Android" → descarga el paquete
4. Te da un `.apk` firmado que puedes repartir por link directo, sin pasar
   por Google Play ni pagar nada

Alternativa más técnica: la herramienta oficial de Google
[Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) hace lo mismo
por línea de comandos.

Para iOS no existe un equivalente: Apple no permite instalar apps fuera de
App Store o TestFlight (ambos requieren la cuenta de pago). El "Agregar a
inicio" del paso 2 es la única vía gratuita ahí, pero es real y funciona
bien.

## 4. El asistente de IA necesita el mismo backend que la app nativa

`app.js` llama a `API_BASE_URL/api/chat` — es exactamente el mismo endpoint
que ya armamos en `server/index.js` del proyecto `norte-native`. Puedes
desplegar ese único backend y apuntar ahí tanto la PWA como la app nativa:

1. Despliega `server/index.js` en Render, Railway o Fly.io (todos tienen
   nivel gratuito) con `ANTHROPIC_API_KEY` como variable de entorno.
2. Cambia `API_BASE_URL` al inicio de `app.js` por esa URL.

Sin este paso, el resto de la app funciona igual — el asistente solo
muestra un mensaje de "no pude conectar" (ya lo probé: no rompe nada).

## 5. Sobre los datos guardados

Esta versión guarda catálogo y pedidos en el propio navegador
(`localStorage`) — cada persona que instale la app ve su propia copia, no
una compartida. Para un catálogo y pedidos realmente compartidos entre
todos tus clientes, el siguiente paso es mover esos datos a una base de
datos en el mismo backend del punto 4.

## Estructura

```
norte-pwa/
├── index.html
├── app.js              — toda la lógica: tienda, carrito, checkout, admin, IA
├── styles.css
├── manifest.webmanifest
├── service-worker.js   — instalación + funcionamiento offline
└── icons/
    ├── icon-192.png
    ├── icon-512.png
    └── apple-touch-icon.png
```
