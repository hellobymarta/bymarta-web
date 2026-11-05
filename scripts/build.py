"""
ByMarta · scripts/build.py
Genera una página por idioma a partir de las plantillas multilingües de src/.

En src/ cada texto existe en los tres idiomas (atributo data-l="es|en|de").
Este script crea:
  /            -> español (idioma principal)
  /en/         -> inglés
  /de/         -> alemán
y en cada página deja solo los textos de su idioma, traduce las etiquetas ARIA,
escribe title, descripción, Open Graph, canonical y hreflang, ajusta las rutas
relativas, enlaza el selector ES · EN · DE con la misma página en cada idioma
y genera el sitemap.xml.

Uso (desde la carpeta del proyecto):  python3 scripts/build.py
No necesita librerías externas: solo Python 3.

Uso de IA: desarrollado con asistencia de IA (Claude, de Anthropic) y revisado por Marta.
"""
import posixpath
import re
from datetime import date
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
SRC = RAIZ / "src"
BASE = "https://bymarta-web.vercel.app/"
IDIOMAS = ["es", "en", "de"]
LOCALE = {"es": "es_ES", "en": "en_GB", "de": "de_DE"}

# ---------------------------------------------------------------------------
# Metadatos de cada página y cada idioma
# ---------------------------------------------------------------------------
META = {
    "index.html": {
        "img": "img/og-imagen.jpg",
        "es": ("Marta Rodríguez · Desarrollo web y marketing digital en Colonia",
               "Portfolio de Marta Rodríguez, desarrolladora web con formación en marketing digital en Colonia. "
               "Casos de estudio de Casa Brava, Vagamundo, Golden Chance Senior y DEMYA. Disponible para prácticas."),
        "en": ("Marta Rodríguez · Web developer & digital marketing in Cologne",
               "Portfolio of Marta Rodríguez, a Cologne-based web developer with a digital marketing background. "
               "Case studies: Casa Brava, Vagamundo, Golden Chance Senior and DEMYA. Open to internships."),
        "de": ("Marta Rodríguez · Webentwicklung & digitales Marketing in Köln",
               "Portfolio von Marta Rodríguez, Webentwicklerin mit Hintergrund im digitalen Marketing in Köln. "
               "Fallstudien: Casa Brava, Vagamundo, Golden Chance Senior und DEMYA. Offen für ein Praktikum."),
    },
    "proyectos/casa-brava/index.html": {
        "img": "img/og-casa-brava.jpg", "tipo": "article",
        "es": ("Casa Brava · Caso de estudio · Marta Rodríguez",
               "Caso de estudio de Casa Brava: web editorial y accesible para un hotel boutique en Lombok, hecha a mano con HTML, CSS y JavaScript."),
        "en": ("Casa Brava · Case study · Marta Rodríguez",
               "Casa Brava case study: an editorial, accessible website for a boutique hotel in Lombok, hand-coded in HTML, CSS and JavaScript."),
        "de": ("Casa Brava · Fallstudie · Marta Rodríguez",
               "Fallstudie Casa Brava: eine barrierefreie Website im Magazin-Stil für ein Boutique-Hotel auf Lombok, von Hand mit HTML, CSS und JavaScript umgesetzt."),
    },
    "proyectos/vagamundo/index.html": {
        "img": "img/og-vagamundo.jpg", "tipo": "article",
        "es": ("Vagamundo · Caso de estudio · Marta Rodríguez",
               "Caso de estudio de Vagamundo: agencia de viajes full stack con React, TypeScript, Express y MongoDB Atlas, con reservas y panel de estadísticas."),
        "en": ("Vagamundo · Case study · Marta Rodríguez",
               "Vagamundo case study: a full-stack travel agency built with React, TypeScript, Express and MongoDB Atlas, with bookings and a statistics dashboard."),
        "de": ("Vagamundo · Fallstudie · Marta Rodríguez",
               "Fallstudie Vagamundo: ein Full-Stack-Reiseveranstalter mit React, TypeScript, Express und MongoDB Atlas, mit Buchungen und Statistik-Dashboard."),
    },
    "proyectos/golden-chance-senior/index.html": {
        "img": "img/og-golden-chance-senior.jpg", "tipo": "article",
        "es": ("Golden Chance Senior · Caso de estudio · Marta Rodríguez",
               "Caso de estudio de Golden Chance Senior: landing bilingüe para un proyecto residencial sénior en el norte de España. Marca, textos y desarrollo."),
        "en": ("Golden Chance Senior · Case study · Marta Rodríguez",
               "Golden Chance Senior case study: a bilingual landing page for a senior living project in northern Spain. Brand, copy and development."),
        "de": ("Golden Chance Senior · Fallstudie · Marta Rodríguez",
               "Fallstudie Golden Chance Senior: zweisprachige Landingpage für ein Wohnprojekt für Senioren in Nordspanien. Marke, Texte und Entwicklung."),
    },
    "proyectos/demya/index.html": {
        "img": "img/og-demya.jpg", "tipo": "article",
        "es": ("Plan de marketing digital DEMYA · Caso de estudio · Marta Rodríguez",
               "Caso de estudio del plan de marketing digital de DEMYA: auditoría web y SEO, redes sociales, competencia, DAFO, objetivos SMART y KPIs."),
        "en": ("DEMYA digital marketing plan · Case study · Marta Rodríguez",
               "Case study of the DEMYA digital marketing plan: website and SEO audit, social media, competitors, SWOT, SMART goals and KPIs."),
        "de": ("Digitalmarketing-Plan DEMYA · Fallstudie · Marta Rodríguez",
               "Fallstudie zum Digitalmarketing-Plan für DEMYA: Website- und SEO-Audit, Social Media, Wettbewerb, SWOT, SMART-Ziele und KPIs."),
    },
    "aviso-legal.html": {
        "img": "img/og-imagen.jpg", "noindex": True,
        "es": ("Aviso legal · Marta Rodríguez", "Aviso legal del portfolio de Marta Rodríguez."),
        "en": ("Legal notice · Marta Rodríguez", "Legal notice for Marta Rodríguez's portfolio."),
        "de": ("Impressum · Marta Rodríguez", "Impressum des Portfolios von Marta Rodríguez."),
    },
    "privacidad.html": {
        "img": "img/og-imagen.jpg", "noindex": True,
        "es": ("Política de privacidad · Marta Rodríguez", "Política de privacidad del portfolio de Marta Rodríguez."),
        "en": ("Privacy policy · Marta Rodríguez", "Privacy policy for Marta Rodríguez's portfolio."),
        "de": ("Datenschutzerklärung · Marta Rodríguez", "Datenschutzerklärung des Portfolios von Marta Rodríguez."),
    },
}

# Etiquetas ARIA que en las plantillas están en un solo idioma
ARIA = {
    "Main": ("Principal", "Main", "Hauptnavigation"),
    "Language": ("Idioma", "Language", "Sprache"),
    "Menu": ("Menú", "Menu", "Menü"),
    "Ver los cuatro proyectos": ("Ver los cuatro proyectos", "Show the four projects", "Die vier Projekte anzeigen"),
    "Key facts": ("Datos clave", "Key facts", "Eckdaten"),
    "Services": ("Servicios", "Services", "Leistungen"),
    "Projects": ("Proyectos", "Projects", "Projekte"),
    "Breadcrumb": ("Ruta de navegación", "Breadcrumb", "Brotkrümelnavigation"),
    "Previous screenshot": ("Captura anterior", "Previous screenshot", "Vorheriger Screenshot"),
    "Next screenshot": ("Captura siguiente", "Next screenshot", "Nächster Screenshot"),
    "Dark mode": ("Modo oscuro", "Dark mode", "Dunkelmodus"),
}
for n in range(1, 7):
    ARIA[f"Screenshot {n}"] = (f"Captura {n}", f"Screenshot {n}", f"Screenshot {n}")

PAGINAS = sorted(str(p.relative_to(SRC)).replace("\\", "/") for p in SRC.rglob("*.html"))


# ---------------------------------------------------------------------------
# Utilidades
# ---------------------------------------------------------------------------
def ruta_salida(pagina, lang):
    return pagina if lang == "es" else f"{lang}/{pagina}"


def url_publica(pagina, lang):
    ruta = ruta_salida(pagina, lang)
    return BASE + (ruta[: -len("index.html")] if ruta.endswith("index.html") else ruta)


def quitar_otros_idiomas(html, lang):
    """Elimina los elementos con data-l de otro idioma (con todo su contenido) y
    quita el atributo data-l de los del idioma actual."""
    patron = re.compile(r'<([a-zA-Z][a-zA-Z0-9]*)\b[^>]*\sdata-l="(es|en|de)"[^>]*>')
    pos = 0
    out = []
    while True:
        m = patron.search(html, pos)
        if not m:
            out.append(html[pos:])
            break
        tag, l = m.group(1), m.group(2)
        out.append(html[pos:m.start()])
        if m.group(0).endswith("/>") or tag.lower() in ("img", "input", "br", "meta", "link"):
            fin = m.end()
        else:
            # cierre correspondiente, contando etiquetas del mismo tipo anidadas
            nivel, i = 1, m.end()
            abre = re.compile(rf"<{tag}\b", re.I)
            cierra = re.compile(rf"</{tag}\s*>", re.I)
            while nivel:
                a = abre.search(html, i)
                c = cierra.search(html, i)
                if a and a.start() < c.start():
                    nivel += 1
                    i = a.end()
                else:
                    nivel -= 1
                    i = c.end()
            fin = i
        if l == lang:
            bloque = html[m.start():fin]
            bloque = bloque.replace(f' data-l="{l}"', "", 1)
            out.append(quitar_otros_idiomas(bloque, lang))
        # si es de otro idioma no se añade nada (y se come el salto de línea sobrante)
        pos = fin
    return "".join(out)


def limpiar_lineas_vacias(html):
    return re.sub(r"\n[ \t]*(?=\n[ \t]*\n)", "", html)


def resolver(desde, url):
    """Ruta (desde la raíz del sitio) a la que apunta una URL relativa de la plantilla."""
    base = posixpath.dirname(desde)
    ruta, _, ancla = url.partition("#")
    if ruta == "":
        objetivo = desde
    else:
        objetivo = posixpath.normpath(posixpath.join(base, ruta))
        if ruta.endswith("/"):
            objetivo += "/"
        if objetivo == ".":
            objetivo = ""
    return objetivo, ancla


def es_pagina(objetivo):
    """Devuelve la plantilla a la que apunta (o None si es un recurso: css, img, pdf…)."""
    candidatos = [objetivo, objetivo + "index.html", objetivo.rstrip("/") + "/index.html"]
    if objetivo in ("", "./"):
        candidatos.append("index.html")
    for c in candidatos:
        if c in PAGINAS:
            return c
    return None


def relativa(desde_salida, objetivo_salida):
    base = posixpath.dirname(desde_salida) or "."
    rel = posixpath.relpath(objetivo_salida or ".", base)
    return rel


def reescribir_urls(html, pagina, lang):
    salida = ruta_salida(pagina, lang)

    def nueva(url):
        if re.match(r"^(https?:|mailto:|tel:|data:|//|#)", url) or url == "":
            return url
        objetivo, ancla = resolver(pagina, url)
        plantilla = es_pagina(objetivo)
        if plantilla:
            destino = ruta_salida(plantilla, lang)
            if destino.endswith("index.html"):
                destino = destino[: -len("index.html")]
            rel = relativa(salida, destino or ".")
            if rel in (".", ""):
                rel = "./"
            elif destino.endswith("/") and not rel.endswith("/"):
                rel += "/"
            # misma página + ancla -> solo el ancla
            if plantilla == pagina and ancla:
                return "#" + ancla
        else:
            rel = relativa(salida, objetivo)
        return rel + ("#" + ancla if ancla else "")

    html = re.sub(r'\b(href|src|action)="([^"]*)"', lambda m: f'{m.group(1)}="{nueva(m.group(2))}"', html)
    html = re.sub(r'srcset="([^"]*)"', lambda m: 'srcset="' + ", ".join(
        " ".join([nueva(p.split()[0])] + p.split()[1:]) for p in m.group(1).split(",")) + '"', html)
    return html


def metadatos(pagina, lang):
    m = META[pagina]
    titulo, desc = m[lang]
    url = url_publica(pagina, lang)
    lineas = [
        f"<title>{titulo}</title>",
        f'<meta name="description" content="{desc}" />',
    ]
    if m.get("noindex"):
        lineas.append('<meta name="robots" content="noindex, follow" />')
    lineas += [
        "<!-- Open Graph: vista previa al compartir el enlace -->",
        f'<meta property="og:type" content="{m.get("tipo", "website")}" />',
        f'<meta property="og:site_name" content="ByMarta" />',
        f'<meta property="og:title" content="{titulo}" />',
        f'<meta property="og:description" content="{desc}" />',
        f'<meta property="og:url" content="{url}" />',
        f'<meta property="og:image" content="{BASE}{m["img"]}" />',
        '<meta property="og:image:width" content="1200" />',
        '<meta property="og:image:height" content="630" />',
        f'<meta property="og:locale" content="{LOCALE[lang]}" />',
    ] + [f'<meta property="og:locale:alternate" content="{LOCALE[o]}" />' for o in IDIOMAS if o != lang] + [
        '<meta name="twitter:card" content="summary_large_image" />',
        "<!-- Dirección principal y versiones en cada idioma -->",
        f'<link rel="canonical" href="{url}" />',
    ] + [f'<link rel="alternate" hreflang="{o}" href="{url_publica(pagina, o)}" />' for o in IDIOMAS] + [
        f'<link rel="alternate" hreflang="x-default" href="{url_publica(pagina, "es")}" />',
    ]
    return "\n    ".join(lineas)


def localizar(pagina, lang):
    html = (SRC / pagina).read_text(encoding="utf-8")

    # 1. Cabecera: idioma y metadatos
    html = re.sub(r'<html lang="[a-z]+"', f'<html lang="{lang}"', html, count=1)
    for patron in [r"\s*<title>.*?</title>", r'\s*<meta\s+name="description"[^>]*?/>', r'\s*<meta\s+name="robots"[^>]*?/>',
                   r'\s*<meta\s+property="og:[^"]+"[^>]*?/>', r'\s*<meta\s+name="twitter:[^"]+"[^>]*?/>',
                   r'\s*<link\s+rel="canonical"[^>]*?/>', r'\s*<link\s+rel="alternate"\s+hreflang[^>]*?/>',
                   r"\s*<!-- Open Graph[^>]*-->", r"\s*<!-- Versiones por idioma[^>]*-->", r"\s*<!-- Dirección principal[^>]*-->"]:
        html = re.sub(patron, "", html, flags=re.S)
    html = re.sub(r'(<meta name="viewport"[^>]*/>)', lambda m: m.group(1) + "\n    " + metadatos(pagina, lang), html, count=1)

    # 2. Textos del idioma
    html = quitar_otros_idiomas(html, lang)

    # 3. Atributos traducidos: data-error-xx, data-sending-xx, opciones data-text-xx
    for attr in ("error", "sending"):
        html = re.sub(rf'\s+data-{attr}-{lang}="([^"]*)"', rf' data-{attr}="\1"', html)
        html = re.sub(rf'\s+data-{attr}-(es|en|de)="[^"]*"', "", html)
    html = re.sub(r'(<option\b[^>]*?)\s+data-text-en="([^"]*)"\s+data-text-es="([^"]*)"\s+data-text-de="([^"]*)"(\s*>)\s*([^<]*?)\s*(</option>)',
                  lambda m: m.group(1) + m.group(5) + {"en": m.group(2), "es": m.group(3), "de": m.group(4)}[lang] + m.group(7), html)

    # 4. Etiquetas ARIA
    i = IDIOMAS.index(lang)
    html = re.sub(r'aria-label="([^"]*)"', lambda m: f'aria-label="{ARIA[m.group(1)][i]}"' if m.group(1) in ARIA else m.group(0), html)

    # 5. Formulario: idioma del mensaje y página de vuelta sin JavaScript
    html = re.sub(r'(name="idioma" value=")[a-z]+(")', rf"\g<1>{lang}\2", html)
    html = re.sub(r'(name="redirect"\s+value=")[^"]*(")', lambda m: m.group(1) + url_publica("index.html", lang) + "?enviado=1#contact" + m.group(2), html)

    # 6. Rutas relativas según la nueva carpeta
    html = reescribir_urls(html, pagina, lang)

    # 7. Selector de idioma: enlaces a esta misma página en cada idioma
    salida = ruta_salida(pagina, lang)

    def enlace_idioma(m):
        otro = m.group(2)
        destino = ruta_salida(pagina, otro)
        destino = destino[: -len("index.html")] if destino.endswith("index.html") else destino
        rel = relativa(salida, destino or ".")
        if destino.endswith("/") or destino == "":
            rel = rel.rstrip("/") + "/" if rel != "." else "./"
        actual = ' aria-current="page"' if otro == lang else ""
        return f'<a href="{rel}"{actual} data-lang-link="{otro}"'

    html = re.sub(r'<a href="([^"]*)" data-lang-link="(es|en|de)"', enlace_idioma, html)
    return limpiar_lineas_vacias(html)


def sitemap():
    hoy = date.today().isoformat()
    filas = []
    for pagina in PAGINAS:
        if META[pagina].get("noindex"):
            continue
        for lang in IDIOMAS:
            alt = "".join(f'\n    <xhtml:link rel="alternate" hreflang="{o}" href="{url_publica(pagina, o)}" />' for o in IDIOMAS)
            filas.append(f"  <url>\n    <loc>{url_publica(pagina, lang)}</loc>{alt}\n    <lastmod>{hoy}</lastmod>\n  </url>")
    filas.append(f"  <url>\n    <loc>{BASE}proyectos/plan-marketing-demya/</loc>\n    <lastmod>{hoy}</lastmod>\n  </url>")
    return ('<?xml version="1.0" encoding="UTF-8"?>\n<!-- ByMarta · mapa del sitio (lo genera scripts/build.py) -->\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
            + "\n".join(filas) + "\n</urlset>\n")


if __name__ == "__main__":
    for pagina in PAGINAS:
        for lang in IDIOMAS:
            destino = RAIZ / ruta_salida(pagina, lang)
            destino.parent.mkdir(parents=True, exist_ok=True)
            destino.write_text(localizar(pagina, lang), encoding="utf-8")
            print("ok", ruta_salida(pagina, lang))
    (RAIZ / "sitemap.xml").write_text(sitemap(), encoding="utf-8")
    print("ok sitemap.xml")
