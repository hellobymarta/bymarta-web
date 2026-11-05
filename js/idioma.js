/* ==========================================================================
   ByMarta · idioma.js
   Se carga en el <head> (sin defer), antes de pintar la página:
   1. Aplica el tema elegido con el botón (claro u oscuro) para que no parpadee.
   2. Redirige los enlaces antiguos con ?lang=en o ?lang=de a la página de ese idioma
      (/en/ o /de/), para que los enlaces que ya se compartieron sigan funcionando.
   Uso de IA: desarrollado con asistencia de IA (Claude, de Anthropic) y
   revisado por Marta.
   ========================================================================== */

(function () {
  // 1. Tema elegido con el botón. Si no se ha elegido, manda el sistema.
  try {
    var tema = localStorage.getItem("bymarta-theme");
    if (tema === "light" || tema === "dark") {
      document.documentElement.setAttribute("data-theme", tema);
    }
  } catch (error) {
    // Sin localStorage: se usa el tema del sistema
  }

  // 2. Enlaces antiguos ?lang=xx -> página de ese idioma
  var parametro = new URLSearchParams(window.location.search).get("lang");
  var actual = document.documentElement.lang;
  if ((parametro === "en" || parametro === "de") && actual === "es") {
    // La raíz de la web se deduce de la ruta de este archivo (…/js/idioma.js)
    var raiz = document.currentScript.src.replace(/js\/idioma\.js.*$/, "");
    var pagina = window.location.href.split("?")[0].split("#")[0];
    var resto = pagina.indexOf(raiz) === 0 ? pagina.slice(raiz.length) : "";
    window.location.replace(raiz + parametro + "/" + resto + window.location.hash);
  }
})();
