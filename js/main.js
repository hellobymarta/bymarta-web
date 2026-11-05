/* ==========================================================================
   ByMarta · main.js
   Módulos de la página:
   1. Idioma: cada idioma es una página propia (/, /en/, /de/); aquí solo se lee el idioma activo
   2. Menú móvil (abrir / cerrar)
   3. Carrusel de capturas de cada proyecto
   4. Aparición suave de bloques al hacer scroll
   5. Formulario de contacto (validación, envío y mensaje de gracias)
   6. Pestañas de "Cómo puedo ayudarte"
   7. Botón de modo claro / oscuro
   8. Barra de progreso de lectura
   9. Desplegable de Proyectos en el menú
   10. Menú que marca la sección visible
   Uso de IA: desarrollado con asistencia de IA (Claude, de Anthropic) y
   revisado por Marta.
   ========================================================================== */

const root = document.documentElement;

/* 1. IDIOMA
   Cada idioma tiene su propia página (/, /en/, /de/) con todos sus textos en el HTML,
   así que el navegador no tiene que traducir nada. Los enlaces ES · EN · DE del menú
   llevan a la misma página en el otro idioma. */

/* 2. MENÚ MÓVIL
   Variable booleana que indica si el menú está abierto; se refleja con la clase .is-open. */
const cabecera = document.querySelector(".Header");
const botonMenu = document.querySelector(".MenuButton");
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
document.querySelectorAll(".Nav-list a").forEach(function (enlace) {
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
  const pista = carrusel.querySelector(".Carousel-track");
  const diapositivas = carrusel.querySelectorAll(".Carousel-slide");
  const puntos = carrusel.querySelectorAll(".Carousel-dots button");
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
root.classList.add("is-js");

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
   a) Valida cada campo al enviar y al salir de él, con un mensaje claro debajo (aria-invalid + aria-describedby).
   b) Envía el mensaje a Web3Forms con fetch, sin salir de la página, mostrando "Enviando…" en el botón.
   c) Si todo va bien, muestra el mensaje de gracias; si falla, un aviso con el email.
   Sin JavaScript, el formulario se envía de forma normal y Web3Forms vuelve a esta página con ?enviado=1. */
const formulario = document.getElementById("contact-form");

if (formulario) {
  const campoVuelta = document.getElementById("form-next");
  const gracias = document.getElementById("form-thanks");
  const aviso = document.getElementById("form-error");
  const botonEnviar = formulario.querySelector('[type="submit"]');
  const textoBoton = botonEnviar.innerHTML;
  const campos = Array.from(formulario.querySelectorAll("[data-error]"));

  function mostrarGracias() {
    formulario.hidden = true;
    gracias.hidden = false;
    gracias.focus();
  }

  // Devuelve true si el campo es válido y muestra u oculta su mensaje de error
  function validar(campo) {
    const valido = campo.checkValidity() && (campo.type === "checkbox" || campo.value.trim() !== "");
    const mensaje = document.getElementById(campo.id + "-error");
    campo.setAttribute("aria-invalid", String(!valido));
    mensaje.textContent = valido ? "" : campo.dataset.error;
    mensaje.hidden = valido;
    return valido;
  }

  campos.forEach(function (campo) {
    // Al salir del campo solo se avisa si ya se había intentado enviar o si tenía texto
    campo.addEventListener("blur", function () {
      if (campo.hasAttribute("aria-invalid") || (campo.value && campo.type !== "checkbox")) {
        validar(campo);
      }
    });
    campo.addEventListener("input", function () {
      if (campo.getAttribute("aria-invalid") === "true") {
        validar(campo);
      }
    });
  });

  formulario.addEventListener("submit", function (evento) {
    campoVuelta.value = window.location.origin + window.location.pathname + "?enviado=1#contact";

    const invalidos = campos.filter(function (campo) {
      return !validar(campo);
    });

    if (invalidos.length) {
      evento.preventDefault();
      invalidos[0].focus();
      return;
    }

    // Si el navegador no tiene fetch, se deja el envío normal
    if (!window.fetch) return;

    evento.preventDefault();
    aviso.hidden = true;
    botonEnviar.disabled = true;
    botonEnviar.textContent = botonEnviar.dataset.sending;
    formulario.setAttribute("aria-busy", "true");

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
        botonEnviar.innerHTML = textoBoton;
        formulario.removeAttribute("aria-busy");
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

/* 7. BOTÓN DE MODO CLARO / OSCURO
   Cambia el atributo data-theme de <html> y guarda la elección.
   Si nunca se ha pulsado, la web sigue el modo del sistema. */
const botonTema = document.getElementById("theme-toggle");
const sistemaOscuro = window.matchMedia("(prefers-color-scheme: dark)");
const metaColor = document.querySelector('meta[name="theme-color"]');

function temaActual() {
  return root.getAttribute("data-theme") || (sistemaOscuro.matches ? "dark" : "light");
}

function pintarBotonTema() {
  const oscuro = temaActual() === "dark";
  if (botonTema) {
    botonTema.setAttribute("aria-pressed", String(oscuro));
  }
  if (metaColor) {
    metaColor.setAttribute("content", oscuro ? "#1d1a17" : "#fbf8f3");
  }
}

if (botonTema) {
  botonTema.addEventListener("click", function () {
    const nuevo = temaActual() === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", nuevo);
    try {
      localStorage.setItem("bymarta-theme", nuevo);
    } catch (error) {
      // Si no se puede guardar, el cambio vale solo para esta visita
    }
    pintarBotonTema();
  });
}

// Si cambia el modo del sistema y no se ha elegido otro, se actualiza el botón
sistemaOscuro.addEventListener("change", pintarBotonTema);
pintarBotonTema();

/* 8. BARRA DE PROGRESO DE LECTURA
   Variable numérica entre 0 y 1 según lo que se ha bajado en la página. */
const barra = document.querySelector(".Progress span");

if (barra) {
  let pendiente = false;

  function actualizarBarra() {
    const recorrido = document.documentElement.scrollHeight - window.innerHeight;
    const avance = recorrido > 0 ? Math.min(window.scrollY / recorrido, 1) : 0;
    barra.style.transform = "scaleX(" + avance + ")";
    pendiente = false;
  }

  window.addEventListener(
    "scroll",
    function () {
      if (!pendiente) {
        pendiente = true;
        window.requestAnimationFrame(actualizarBarra);
      }
    },
    { passive: true },
  );
  actualizarBarra();
}

/* 9. DESPLEGABLE DE PROYECTOS
   Botón con aria-expanded que abre y cierra el panel (clase .is-open en el elemento del menú).
   Con el ratón también se abre al pasar por encima (CSS). Escape lo cierra y devuelve el foco. */
const itemProyectos = document.querySelector(".Nav-item--menu");

if (itemProyectos) {
  const botonProyectos = itemProyectos.querySelector("[aria-controls]");

  function cambiarDesplegable(abrir) {
    itemProyectos.classList.toggle("is-open", abrir);
    botonProyectos.setAttribute("aria-expanded", String(abrir));
  }

  botonProyectos.addEventListener("click", function () {
    cambiarDesplegable(botonProyectos.getAttribute("aria-expanded") !== "true");
  });

  itemProyectos.addEventListener("keydown", function (evento) {
    if (evento.key === "Escape" && botonProyectos.getAttribute("aria-expanded") === "true") {
      cambiarDesplegable(false);
      botonProyectos.focus();
    }
  });

  // Al salir del desplegable con el tabulador o hacer clic fuera, se cierra
  itemProyectos.addEventListener("focusout", function (evento) {
    if (!itemProyectos.contains(evento.relatedTarget)) {
      cambiarDesplegable(false);
    }
  });
  document.addEventListener("click", function (evento) {
    if (!itemProyectos.contains(evento.target)) {
      cambiarDesplegable(false);
    }
  });
}

/* 10. MENÚ QUE MARCA LA SECCIÓN VISIBLE
   Solo en la portada: el enlace de la sección que se está leyendo recibe aria-current. */
const enlacesSeccion = document.querySelectorAll("[data-spy]");

if (enlacesSeccion.length && "IntersectionObserver" in window) {
  const secciones = Array.from(enlacesSeccion)
    .map(function (enlace) {
      return document.getElementById(enlace.dataset.spy);
    })
    .filter(Boolean);

  const vigilante = new IntersectionObserver(
    function (entradas) {
      entradas.forEach(function (entrada) {
        if (!entrada.isIntersecting) return;
        enlacesSeccion.forEach(function (enlace) {
          if (enlace.dataset.spy === entrada.target.id) {
            enlace.setAttribute("aria-current", "true");
          } else {
            enlace.removeAttribute("aria-current");
          }
        });
      });
    },
    { rootMargin: "-45% 0px -50% 0px" },
  );

  secciones.forEach(function (seccion) {
    vigilante.observe(seccion);
  });
}
