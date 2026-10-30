/* ==========================================================================
   ByMarta · main.js
   Módulos de la página:
   1. Selector de idioma (ES / EN / DE)
   2. Menú móvil (abrir / cerrar)
   3. Carrusel de capturas de cada proyecto
   4. Efecto de scroll en "Sobre mí": los bloques suben al aparecer
   5. Formulario de contacto (idioma, traducciones y mensaje de gracias)
   6. Pestañas de "Cómo puedo ayudarte"
   Uso de IA: desarrollado con asistencia de IA (Claude, de Anthropic) y
   revisado por Marta.
   ========================================================================== */

const root = document.documentElement;

/* 1. SELECTOR DE IDIOMA
   Cambia el atributo data-lang de <html>; el CSS muestra solo los textos de ese idioma. */
const botonesIdioma = document.querySelectorAll("[data-set-lang]");

function aplicarIdioma(idioma) {
  root.setAttribute("data-lang", idioma);
  root.lang = idioma;

  botonesIdioma.forEach(function (boton) {
    boton.setAttribute("aria-pressed", String(boton.dataset.setLang === idioma));
  });
}

botonesIdioma.forEach(function (boton) {
  boton.addEventListener("click", function () {
    aplicarIdioma(boton.dataset.setLang);

    // Se guarda la elección para la próxima visita
    try {
      localStorage.setItem("bymarta-lang", boton.dataset.setLang);
    } catch (error) {
      // Si no se puede guardar, la web sigue funcionando igual
    }

    // La dirección del navegador cambia a ?lang=xx (sin recargar), para que
    // al copiar el enlace se comparta la web en el idioma que se está viendo
    try {
      const url = new URL(window.location.href);
      if (boton.dataset.setLang === "es") {
        url.searchParams.delete("lang");
      } else {
        url.searchParams.set("lang", boton.dataset.setLang);
      }
      history.replaceState(null, "", url);
    } catch (error) {
      // En entornos donde no se puede cambiar la dirección, no pasa nada
    }
  });
});

aplicarIdioma(root.getAttribute("data-lang") || "es");

/* 2. MENÚ MÓVIL
   Variable booleana que indica si el menú está abierto; se refleja con la clase .is-open. */
const cabecera = document.querySelector(".top");
const botonMenu = document.querySelector(".menu-btn");
let menuAbierto = false;

function cambiarMenu(abrir) {
  menuAbierto = abrir;
  cabecera.classList.toggle("is-open", menuAbierto);
  botonMenu.setAttribute("aria-expanded", String(menuAbierto));
}

botonMenu.addEventListener("click", function () {
  cambiarMenu(!menuAbierto);
});

// Al pulsar un enlace del menú, el panel se cierra
document.querySelectorAll(".nav__list a").forEach(function (enlace) {
  enlace.addEventListener("click", function () {
    cambiarMenu(false);
  });
});

// La tecla Escape también cierra el menú
document.addEventListener("keydown", function (evento) {
  if (evento.key === "Escape" && menuAbierto) {
    cambiarMenu(false);
    botonMenu.focus();
  }
});

/* 3. CARRUSEL
   Cada carrusel guarda su posición en una variable numérica (actual).
   Avanza solo cada 5 segundos y se pausa al pasar el ratón o con el foco. */
const sinMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

document.querySelectorAll("[data-carousel]").forEach(function (carrusel) {
  const pista = carrusel.querySelector(".carousel__track");
  const diapositivas = carrusel.querySelectorAll(".carousel__slide");
  const puntos = carrusel.querySelectorAll(".carousel__dots button");
  const anterior = carrusel.querySelector("[data-prev]");
  const siguiente = carrusel.querySelector("[data-next]");
  const contador = carrusel.querySelector("[data-count]");
  const total = diapositivas.length;
  let actual = 0;
  let temporizador = null;

  // Mueve la pista hasta la diapositiva indicada
  function irA(indice) {
    actual = (indice + total) % total;
    pista.style.transform = "translateX(" + actual * -100 + "%)";

    diapositivas.forEach(function (diapositiva, i) {
      diapositiva.setAttribute("aria-hidden", String(i !== actual));
    });

    puntos.forEach(function (punto, i) {
      punto.setAttribute("aria-current", String(i === actual));
    });

    // Contador "1 / 6"
    if (contador) {
      contador.textContent = actual + 1;
    }
  }

  function iniciar() {
    if (sinMovimiento) return;
    detener();
    temporizador = setInterval(function () {
      irA(actual + 1);
    }, 5000);
  }

  function detener() {
    clearInterval(temporizador);
  }

  anterior.addEventListener("click", function () {
    irA(actual - 1);
    iniciar();
  });

  siguiente.addEventListener("click", function () {
    irA(actual + 1);
    iniciar();
  });

  puntos.forEach(function (punto, i) {
    punto.addEventListener("click", function () {
      irA(i);
      iniciar();
    });
  });

  // Pausa mientras se mira o se navega con el teclado
  carrusel.addEventListener("mouseenter", detener);
  carrusel.addEventListener("mouseleave", iniciar);
  carrusel.addEventListener("focusin", detener);
  carrusel.addEventListener("focusout", iniciar);

  irA(0);
  iniciar();
});

/* 4. EFECTO DE SCROLL EN "SOBRE MÍ"
   Los bloques con data-reveal suben suavemente al entrar en pantalla (Intersection Observer).
   La clase .js en <html> indica que JavaScript está activo; sin ella todo se ve directamente. */
root.classList.add("js");

const bloques = document.querySelectorAll("[data-reveal]");

if ("IntersectionObserver" in window && !sinMovimiento) {
  const observador = new IntersectionObserver(
    function (entradas) {
      entradas.forEach(function (entrada) {
        if (entrada.isIntersecting) {
          entrada.target.classList.add("is-visible");
          observador.unobserve(entrada.target);
        }
      });
    },
    { threshold: 0.15 },
  );
  bloques.forEach(function (bloque) {
    observador.observe(bloque);
  });
} else {
  bloques.forEach(function (bloque) {
    bloque.classList.add("is-visible");
  });
}

/* 5. FORMULARIO DE CONTACTO
   a) Traduce las opciones del desplegable al idioma activo.
   b) Envía el mensaje a Web3Forms con fetch, sin salir de la página, y muestra el mensaje de gracias.
      Si falla, muestra un aviso con el email. Sin JavaScript, el formulario se envía de forma normal
      y Web3Forms vuelve a esta web con ?enviado=1.
   c) Al volver con ?enviado=1 también se muestra el mensaje de gracias. */
const formulario = document.getElementById("contact-form");

if (formulario) {
  const campoIdioma = document.getElementById("form-idioma");
  const campoVuelta = document.getElementById("form-next");
  const gracias = document.getElementById("form-thanks");
  const aviso = document.getElementById("form-error");
  const botonEnviar = formulario.querySelector('[type="submit"]');

  function traducirFormulario() {
    const idioma = root.getAttribute("data-lang") || "es";
    campoIdioma.value = idioma;
    formulario.querySelectorAll("option").forEach(function (opcion) {
      opcion.textContent = opcion.dataset["text" + idioma.charAt(0).toUpperCase() + idioma.slice(1)];
    });
  }

  function mostrarGracias() {
    formulario.hidden = true;
    gracias.hidden = false;
  }

  botonesIdioma.forEach(function (boton) {
    boton.addEventListener("click", traducirFormulario);
  });
  traducirFormulario();

  formulario.addEventListener("submit", function (evento) {
    const idioma = root.getAttribute("data-lang") || "es";
    campoIdioma.value = idioma;
    campoVuelta.value = window.location.origin + window.location.pathname + "?enviado=1&lang=" + idioma + "#contact";

    // Si el navegador no tiene fetch, se deja el envío normal
    if (!window.fetch) return;

    evento.preventDefault();
    aviso.hidden = true;
    botonEnviar.disabled = true;

    fetch(formulario.action, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: new FormData(formulario),
    })
      .then(function (respuesta) {
        return respuesta.json();
      })
      .then(function (datos) {
        if (datos.success) {
          formulario.reset();
          mostrarGracias();
        } else {
          aviso.hidden = false;
        }
      })
      .catch(function () {
        aviso.hidden = false;
      })
      .finally(function () {
        botonEnviar.disabled = false;
      });
  });

  if (new URLSearchParams(window.location.search).get("enviado") === "1") {
    mostrarGracias();
    // Se limpia ?enviado=1 de la dirección para que no reaparezca al recargar
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("enviado");
      history.replaceState(null, "", url);
    } catch (error) {
      // Sin cambios en la dirección, no pasa nada
    }
  }
}

/* 6. PESTAÑAS DE "CÓMO PUEDO AYUDARTE"
   Una variable guarda la pestaña activa; al cambiarla se actualizan aria-selected
   y la clase .is-active del panel. Se puede navegar con las flechas del teclado. */
document.querySelectorAll("[data-tabs]").forEach(function (contenedor) {
  const pestanas = Array.from(contenedor.querySelectorAll('[role="tab"]'));
  const paneles = pestanas.map(function (pestana) {
    return document.getElementById(pestana.getAttribute("aria-controls"));
  });
  let activa = 0;

  function mostrar(indice, conFoco) {
    activa = indice;
    pestanas.forEach(function (pestana, i) {
      const seleccionada = i === activa;
      pestana.setAttribute("aria-selected", String(seleccionada));
      pestana.tabIndex = seleccionada ? 0 : -1;
      paneles[i].classList.toggle("is-active", seleccionada);
    });
    if (conFoco) {
      pestanas[activa].focus();
    }
  }

  pestanas.forEach(function (pestana, i) {
    pestana.addEventListener("click", function () {
      mostrar(i, false);
    });
    pestana.addEventListener("keydown", function (evento) {
      if (evento.key === "ArrowRight") {
        mostrar((activa + 1) % pestanas.length, true);
      } else if (evento.key === "ArrowLeft") {
        mostrar((activa - 1 + pestanas.length) % pestanas.length, true);
      }
    });
  });

  mostrar(0, false);
});

// Botones con data-motivo: al ir al formulario, dejan elegido el motivo (p. ej. "Proyecto freelance")
document.querySelectorAll("[data-motivo]").forEach(function (enlace) {
  enlace.addEventListener("click", function () {
    const desplegable = document.getElementById("form-motivo");
    if (desplegable) {
      desplegable.value = enlace.dataset.motivo;
    }
  });
});
