/* ==========================================================================
   ByMarta · idioma.js
   Se carga en el <head> (sin defer) para aplicar el idioma antes de pintar
   la página y evitar que se vea un instante en otro idioma.
   Uso de IA: desarrollado con asistencia de IA (Claude, de Anthropic) y
   revisado por Marta.
   ========================================================================== */

(function () {
  // Idiomas disponibles; el español es el idioma principal; después inglés y alemán
  var IDIOMAS = ["es", "en", "de"];
  var idioma = "es";

  // Si la persona ya eligió un idioma en otra visita, se respeta
  try {
    var guardado = localStorage.getItem("bymarta-lang");
    if (IDIOMAS.indexOf(guardado) !== -1) {
      idioma = guardado;
    }
  } catch (error) {
    // Sin acceso a localStorage (modo privado): se queda en español
  }

  document.documentElement.setAttribute("data-lang", idioma);
  document.documentElement.lang = idioma;
})();
