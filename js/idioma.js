/* ==========================================================================
   ByMarta · idioma.js
   Se carga en el <head> (sin defer) para aplicar el idioma y el tema
   (claro u oscuro) antes de pintar la página, y evitar que se vea un
   instante en otro idioma o con otros colores.
   Uso de IA: desarrollado con asistencia de IA (Claude, de Anthropic) y
   revisado por Marta.
   ========================================================================== */

(function () {
  // Idiomas disponibles; el español es el idioma principal; después inglés y alemán
  var IDIOMAS = ["es", "en", "de"];
  var idioma = "es";

  // 1) Si la persona ya eligió un idioma en otra visita, se respeta
  try {
    var guardado = localStorage.getItem("bymarta-lang");
    if (IDIOMAS.indexOf(guardado) !== -1) {
      idioma = guardado;
    }
  } catch (error) {
    // Sin acceso a localStorage (modo privado): se queda en español
  }

  // 2) Un enlace con ?lang=en o ?lang=de manda sobre todo lo anterior.
  //    Así se puede enviar a una empresa la web directamente en su idioma.
  var parametro = new URLSearchParams(window.location.search).get("lang");
  if (IDIOMAS.indexOf(parametro) !== -1) {
    idioma = parametro;
  }

  document.documentElement.setAttribute("data-lang", idioma);
  document.documentElement.lang = idioma;
})();

/* Tema elegido con el botón (claro u oscuro). Si no se ha elegido, manda el sistema. */
(function () {
  try {
    var tema = localStorage.getItem("bymarta-theme");
    if (tema === "light" || tema === "dark") {
      document.documentElement.setAttribute("data-theme", tema);
    }
  } catch (error) {
    // Sin localStorage: se usa el tema del sistema
  }
})();
