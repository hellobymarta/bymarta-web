# ByMarta · Portfolio de Marta Rodríguez

Portfolio de desarrollo web y marketing digital. Web estática en **HTML, CSS y JavaScript**, sin frameworks.
Publicada en <https://bymarta-web.vercel.app/>.

## Idiomas

Cada idioma es una página propia, para que Google y las vistas previas al compartir muestren el idioma correcto:

| Idioma | Dirección |
| --- | --- |
| Español (principal) | `/` |
| Inglés | `/en/` |
| Alemán | `/de/` |

Los enlaces antiguos con `?lang=en` o `?lang=de` redirigen solos a la página nueva (`js/idioma.js`).

## Estructura

```
src/                  Plantillas con los tres idiomas (data-l="es|en|de"). Aquí se edita el contenido.
scripts/build.py      Genera las páginas de cada idioma y el sitemap a partir de src/.
index.html …          Páginas generadas en español (no editar a mano).
en/, de/              Páginas generadas en inglés y alemán (no editar a mano).
css/styles.css        Hoja de estilos (SUIT CSS, capas @layer, sin !important).
js/idioma.js          Tema claro/oscuro antes de pintar y redirección de ?lang=.
js/main.js            Menú, desplegable de proyectos, carrusel, pestañas, formulario, tema y barra de lectura.
proyectos/            Casos de estudio y el informe web del plan de marketing de DEMYA.
img/, fonts/, cv/     Imágenes (WebP + JPG para compartir), tipografías propias y CV en tres idiomas.
```

## Cómo cambiar un texto

1. Edita el texto en la plantilla de `src/` (cada frase está en `es`, `en` y `de`).
2. Genera las páginas:

   ```bash
   python3 scripts/build.py
   npx prettier@3.3.3 --html-whitespace-sensitivity ignore --print-width 120 --write "*.html" "en/**/*.html" "de/**/*.html" "proyectos/*/index.html"
   ```

3. Sube los cambios con `git add .`, `git commit` y `git push`.

## Convenciones

- **SUIT CSS**: `Componente`, `Componente-parte`, `Componente--variante`, estados `is-*` y utilidades `u-*`.
- Sin `!important`, sin `transition: all` y sin estilos inline.
- HTML semántico y accesible (WCAG 2.2 AA): foco visible, zonas táctiles de 44 px, formulario con mensajes de error por campo y respeto a `prefers-reduced-motion`.
- Tipografías alojadas en la propia web (RGPD) y sin cookies ni analítica.

## Uso de IA

Desarrollado con asistencia de IA (Claude, de Anthropic) a partir de las indicaciones, textos y proyectos de Marta, y revisado por ella.
