# Sistema de diseño SofLIA

**Versión:** 3.0

**Estado:** Especificación normativa

**Última actualización:** 30 de julio de 2026

**Productos de referencia:** SofLIA Academy, SofLIA Engine, Pulse Hub y futuras herramientas del ecosistema

**Sustituye:** todas las versiones anteriores de `SOFIA_DESIGN_SYSTEM.md`

---

## 1. Propósito

Este documento define el lenguaje visual, funcional y de interacción de SofLIA. No es una colección de sugerencias ni un catálogo de capturas: es la fuente normativa para diseñar, implementar y revisar cualquier interfaz del ecosistema.

El sistema nace del rediseño integral de:

- página pública de inicio;
- contacto, privacidad y términos;
- autenticación, registro, invitaciones y acceso por organización;
- dashboard de aprendizaje;
- navegación, menú de usuario y notificaciones;
- perfil y seguridad;
- estadísticas y análisis de SofLIA;
- certificados, validación y compartición;
- libro de apuntes, filtros y editor;
- experiencia de curso, video, actividades, quizzes y comunidad;
- paneles flotantes de SofLIA;
- pantallas de carga, estados vacíos y errores 404/500.

Su finalidad es que todos los productos compartan una identidad reconocible: precisa, humana, tecnológica, minimalista y premium, sin sacrificar rendimiento, accesibilidad o personalización por organización.

### 1.1 Palabras normativas

- **DEBE / NO DEBE:** requisito obligatorio.
- **DEBERÍA / NO DEBERÍA:** regla recomendada; una excepción exige justificación de producto.
- **PUEDE:** variante permitida.

### 1.2 Jerarquía de decisiones

Ante un conflicto se aplica este orden:

1. accesibilidad y legibilidad;
2. claridad de la tarea;
3. consistencia del sistema;
4. branding de la organización;
5. efecto decorativo.

Ninguna animación, color de marca o recurso visual puede degradar los tres primeros niveles.

---

## 2. Principios de marca y experiencia

### 2.1 Claridad antes que decoración

Cada superficie debe responder a una función concreta. Los elementos que solo repiten información, compiten con el contenido o no permiten una acción deben eliminarse. Ejemplos deliberadamente descartados:

- rótulos redundantes como “Biblioteca personal” cuando el título “Cursos” ya aporta contexto;
- contadores aislados que repiten el número visible de tarjetas;
- descripciones obvias debajo de títulos autoexplicativos;
- anillos, cuadrículas o fondos luminosos detrás de un logotipo sin función;
- tarjetas dentro de tarjetas cuando no existe una jerarquía real.

### 2.2 Tecnología con calidez editorial

SofLIA combina:

- una voz editorial en titulares con **Newsreader**;
- precisión contemporánea en interfaz con **Inter Tight**;
- lectura técnica y estabilidad numérica con **IBM Plex Sans**;
- profundidad ambiental mediante luz, transparencia y color;
- formas redondeadas que reducen dureza sin convertir todo en cápsulas.

### 2.3 Premium significa precisión

“Premium” no significa añadir brillo a todos los componentes. Significa:

- alineaciones exactas;
- ritmo de espaciado consistente;
- tipografía con jerarquía clara;
- estados de interacción completos;
- transiciones breves y fluidas;
- contraste verificable;
- sombras ambientales sutiles;
- contenido sin recortes accidentales;
- simetría entre páginas relacionadas;
- comportamiento responsive diseñado, no improvisado.

### 2.4 Minimalismo funcional

Una vista debe mostrar primero la tarea principal. La información secundaria aparece por progresión:

1. identidad y contexto;
2. acción o contenido principal;
3. métricas o detalles útiles;
4. opciones avanzadas bajo menú, acordeón o panel secundario.

### 2.5 Marca adaptable, experiencia estable

Las organizaciones pueden personalizar colores y logotipos. No pueden romper:

- jerarquías tipográficas;
- tamaños táctiles;
- contraste;
- radios estructurales;
- espaciado;
- patrones de navegación;
- semántica de estados.

El color cambia; el comportamiento y la calidad permanecen.

---

## 3. Arquitectura del sistema

### 3.1 Capas

El sistema se organiza en cinco capas:

| Capa | Responsabilidad | Ejemplos |
|---|---|---|
| Fundamentos | valores primitivos | color, tipografía, espacio, radio, elevación |
| Tokens semánticos | intención y tema | fondo, superficie, texto, acción, borde |
| Componentes | piezas reutilizables | botón, input, dropdown, modal, tarjeta |
| Patrones | composición funcional | navbar flotante, panel lateral, hero compacto |
| Experiencias | adaptación por producto | curso, analítica, certificados, Engine |

Los componentes NO DEBEN consumir colores hexadecimales de una organización directamente. Deben recibir tokens semánticos resueltos.

### 3.2 Fuentes de verdad en código

La implementación actual se apoya en:

- `apps/web/src/app/root-fonts.ts`;
- `apps/web/src/app/styles/globals/global-overrides-01.css`;
- `apps/web/src/app/styles/globals/global-overrides-02.css`;
- `apps/web/src/app/styles/globals/global-overrides-30-typography.css`;
- `apps/web/src/core/theme/color-tokens.ts`;
- `apps/web/src/core/theme/color-engine.ts`;
- `apps/web/src/core/theme/organization-brand-colors.ts`.

Cuando se amplíe el sistema, se actualizan primero los tokens y después los componentes. No se crea una paleta paralela dentro de una página.

---

## 4. Color

## 4.1 Paleta base SofLIA

| Token | Hex | Uso principal |
|---|---:|---|
| Primary | `#0A2540` | acción principal, texto profundo, navegación |
| Primary hover | `#0D2F4D` | hover de acción primaria |
| Accent | `#00D4B3` | progreso, foco, presencia, detalle tecnológico |
| Accent hover | `#00B89A` | hover de acciones construidas con accent |
| Success | `#10B981` | completado, validado, disponible |
| Warning | `#F59E0B` | atención, pendiente, riesgo recuperable |
| Error | `#EF4444` | fallo, destrucción, bloqueo |
| Info | `#3B82F6` | información neutral o ayuda |
| Secondary | `#8B5CF6` | compatibilidad heredada; no es protagonista |
| Dark canvas | `#0F1419` | fondo principal oscuro |
| Deep dark | `#0A0D12` | superficie más profunda |
| Light canvas | `#F8FAFC` | fondo principal claro |
| White surface | `#FFFFFF` | tarjeta o modal claro |
| Muted dark | `#8899A6` | texto secundario en oscuro |
| Muted light | `#64748B` | texto secundario en claro |

### 4.2 Escala neutral

| Nivel | Hex base |
|---|---:|
| 50 | `#F8FAFC` |
| 100 | `#F1F5F9` |
| 200 | `#E9ECEF` |
| 300 | `#DEE2E6` |
| 400 | `#CED4DA` |
| 500 | `#6C757D` |
| 600 | `#495057` |
| 700 | `#343A40` |
| 800 | `#1E2329` |
| 900 | `#0F1419` |
| 950 | `#0A0D12` |

Los nombres semánticos pueden invertir su valor en modo claro para preservar la intención de “texto”, “fondo” o “superficie”. Por ello un componente DEBE consumir `--color-contrast`, `--color-surface`, `--color-muted` o su token local, no asumir que `gray-900` siempre será fondo.

### 4.3 Modo claro

El modo claro es el modo inicial para evitar destellos de tema incorrecto.

| Intención | Valor recomendado |
|---|---|
| Canvas | `#F8FAFC` |
| Superficie | `#FFFFFF` |
| Texto principal | `#1E293B` o Primary |
| Texto secundario | `#64748B` |
| Borde | `#E2E8F0` o Primary con 8–14% de opacidad |
| Accent legible | `#009987` cuando se usa como texto pequeño |

`#00D4B3` puede utilizarse como relleno, progreso o decoración sobre fondos adecuados; para texto pequeño sobre blanco DEBE emplearse una versión ajustada como `#009987`.

### 4.4 Modo oscuro

| Intención | Valor recomendado |
|---|---|
| Canvas | `#0F1419` |
| Superficie | `#1E2329` o mezcla con `#0F1419` |
| Superficie profunda | `#0A0D12` |
| Texto principal | `#F8FAFC` |
| Texto secundario | `#8899A6` o blanco 54–64% |
| Borde | blanco 8–12% |
| Accent | `#00D4B3` |

El modo oscuro NO DEBE ser negro puro con tarjetas gris uniforme. Se construye con pequeñas diferencias de luminancia, bordes translúcidos y luz ambiental contenida.

### 4.5 Semántica de estado

| Estado | Color | Tratamiento |
|---|---|---|
| Bloqueado | `#6B7280` | icono + texto; opacidad reducida |
| No iniciado | `#9CA3AF` | neutral, sin brillo |
| En progreso | Accent | barra, punto o borde parcial |
| Completado | Success | check, texto y relleno suave |
| Advertencia | Warning | icono y fondo al 6–10% |
| Error | Error | mensaje explícito; nunca solo color |

Un estado siempre combina al menos dos señales entre color, icono, etiqueta y texto.

### 4.6 Opacidad

Escala recomendada:

- `3–5%`: cambio de superficie casi imperceptible;
- `6–9%`: fondo de estado o hover;
- `10–14%`: borde, focus halo o acento suave;
- `16–24%`: borde activo o sombra cromática;
- `28–40%`: glow controlado;
- `54–68%`: texto secundario;
- `88–97%`: superficie translúcida.

Evitar usar el accent al 100% en áreas grandes. Su intensidad funciona mejor como señal breve.

### 4.7 Gradientes

Los gradientes de marca usan Primary → Accent, pero nunca de forma lineal saturada en toda la página.

Patrón recomendado:

```css
background:
  radial-gradient(
    circle at 88% 8%,
    color-mix(in srgb, var(--accent) 8%, transparent),
    transparent 28rem
  ),
  linear-gradient(
    115deg,
    var(--primary),
    color-mix(in srgb, var(--primary) 72%, var(--accent))
  );
```

Reglas:

- máximo dos glows ambientales por viewport;
- la opacidad cromática normal es 5–12%;
- un hero oscuro puede usar una transición más intensa, pero el texto debe mantener contraste;
- no crear bandas visibles;
- no situar un glow directamente detrás de texto pequeño.

### 4.8 Branding organizacional

`brandingEnabled` es el único interruptor que permite aplicar colores personalizados. Si está desactivado, los colores almacenados no deben filtrarse a la interfaz.

Todos los productos DEBEN resolver:

```css
--org-primary-color;
--org-secondary-color;
--org-accent-color;
--org-action-color;
--org-on-primary-color;
--org-on-action-color;
--org-background-color;
--org-card-background;
--org-text-color;
--org-text-secondary;
--org-border-color;
```

Fallback:

```css
--org-primary-color: var(--color-primary);
--org-accent-color: var(--color-accent);
```

Reglas:

1. no leer `organization.brandColor*` desde un componente;
2. usar `resolveOrganizationBrandColors`;
3. calcular texto legible mediante luminancia relativa;
4. usar `chooseReadableTextColor` para elegir texto claro u oscuro;
5. usar `adjustColorForContrast` si la marca no alcanza el ratio objetivo;
6. no fijar texto blanco sobre un botón verde por costumbre;
7. preservar colores semánticos de error, éxito y advertencia;
8. mantener logotipo de la organización en accesos e invitaciones personalizados;
9. ofrecer fallback SofLIA cuando falte un asset.

### 4.9 Contraste

Objetivos mínimos:

- texto normal: `4.5:1`;
- texto grande: `3:1`;
- bordes y controles importantes: `3:1`;
- estados de foco: perceptibles en claro y oscuro.

La apariencia “premium” nunca justifica texto tenue ilegible.

---

## 5. Tipografía

## 5.1 Familias

| Rol | Familia | Pesos cargados | Uso |
|---|---|---|---|
| Display | Newsreader | 300, 400; normal e italic | títulos, cifras editoriales, nombres de sección |
| UI | Inter Tight | 400, 500, 600, 700 | cuerpo, botones, navegación, formularios |
| Label/Data | IBM Plex Sans | 400, 500, 600 | etiquetas, metadata, fechas, tablas, métricas |
| Mono | sistema monoespaciado | según plataforma | hash, código, identificadores |

Variables:

```css
--font-system-display: var(--font-newsreader), Newsreader, Georgia, serif;
--font-system-ui: var(--font-inter-tight), "Inter Tight", Inter, Arial, sans-serif;
--font-system-label: var(--font-ibm-plex), "IBM Plex Sans", Arial, sans-serif;
--font-system-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
```

### 5.2 Razonamiento

- **Newsreader** aporta humanidad, confianza y una voz editorial diferenciada.
- **Inter Tight** conserva alta densidad sin perder lectura; por eso se usa en controles.
- **IBM Plex Sans** aporta precisión técnica y cifras estables.
- Mezclar estas tres familias evita que el producto parezca una plantilla genérica, pero cada familia tiene una función fija.

### 5.3 Jerarquía

| Token conceptual | Tamaño | Peso | Interlineado | Tracking | Familia |
|---|---:|---:|---:|---:|---|
| Display XL | `clamp(3.6rem, 8vw, 8rem)` | 300 | 0.9–0.98 | `-0.045em` | Newsreader |
| Display L | `clamp(2.9rem, 6vw, 6rem)` | 300 | 0.94–1 | `-0.04em` | Newsreader |
| Page title | `clamp(2.15rem, 4vw, 3.35rem)` | 300 | 1–1.08 | `-0.035em` | Newsreader |
| Section title | `clamp(1.55rem, 2.5vw, 2.15rem)` | 300/400 | 1.08–1.18 | `-0.025em` | Newsreader |
| Card title | `1.05–1.65rem` | 400 | 1.15–1.25 | `-0.015em` | Newsreader |
| Body L | `1–1.14rem` | 400 | 1.6–1.75 | `-0.005em` | Inter Tight |
| Body | `0.78–0.92rem` | 400 | 1.5–1.7 | `-0.005em` | Inter Tight |
| Control | `0.68–0.82rem` | 500/600 | 1–1.3 | `-0.01em` | Inter Tight |
| Label | `0.54–0.65rem` | 500/600 | 1.2–1.4 | `0.10–0.18em` | IBM Plex Sans |
| Metadata | `0.52–0.68rem` | 400/500 | 1.35 | normal | IBM Plex Sans |

### 5.4 Reglas globales

- `h1` y `h2`: Newsreader 300, tracking `-0.025em`.
- `h3–h6`: Newsreader 400, tracking `-0.015em`.
- botones, inputs, tabs, menús y navegación: Inter Tight 500 como base.
- labels, encabezados de tabla, fechas y números: IBM Plex Sans.
- tablas: números tabulares.
- código y hashes: mono, sin ligaduras.
- `font-synthesis: none` para evitar falsos pesos.
- titulares pueden usar `text-wrap: balance`.

### 5.5 Uso correcto de títulos

Un titular grande debe:

- contener una sola idea;
- ocupar como máximo 2–3 líneas en desktop;
- mantener palabras relevantes juntas;
- reducirse con `clamp`, no por breakpoint abrupto;
- evitar truncado en páginas editoriales.

En tarjetas:

- máximo 3–4 líneas reservadas;
- todas las tarjetas de una cuadrícula mantienen la misma altura;
- se permite `line-clamp` solo si existe preview, tooltip o acceso completo al abrir;
- el tamaño se reduce antes de ocultar información crítica.

### 5.6 Texto de botones

- Inter Tight 500 o 600;
- nunca Newsreader;
- una acción principal comienza con verbo: “Guardar”, “Continuar”, “Descargar”;
- no escribir todo en mayúsculas;
- no forzar tracking ancho;
- el texto debe caber sin elipsis en la acción principal.

### 5.7 Etiquetas

Los eyebrows se escriben en mayúsculas, IBM Plex Sans, `0.54–0.65rem`, tracking `0.12–0.18em`. Se reservan para:

- contexto de sección;
- estado del sistema;
- categoría pequeña;
- metadata de alto nivel.

No deben aparecer encima de cada tarjeta.

### 5.8 Tipografía responsive

- Mobile: el tamaño mínimo de cuerpo es `0.75rem`; recomendado `0.82rem`.
- Inputs móviles deben usar al menos `16px` cuando exista riesgo de zoom automático en iOS.
- Los displays reducen amplitud, no peso.
- Las etiquetas críticas no deben bajar de `0.54rem`.
- No resolver falta de espacio reduciendo todo; reordenar o colapsar primero.

---

## 6. Espaciado y layout

## 6.1 Unidad base

Unidad base: `0.25rem` (4 px).

| Token | Valor |
|---|---:|
| 1 | 0.25rem |
| 2 | 0.5rem |
| 3 | 0.75rem |
| 4 | 1rem |
| 5 | 1.25rem |
| 6 | 1.5rem |
| 8 | 2rem |
| 10 | 2.5rem |
| 12 | 3rem |
| 16 | 4rem |
| 20 | 5rem |

Se permiten valores ópticos como `0.42rem`, `0.68rem` o `0.85rem` dentro de controles, pero la composición macro usa la escala.

### 6.2 Contenedores

| Contexto | Máximo recomendado |
|---|---:|
| Landing / legal | 88–92rem |
| Dashboard | 92rem |
| Navbar de organización | 76rem por defecto; hasta 92rem en paneles amplios |
| Texto legal | 44–54rem |
| Modal estándar | 28rem |
| Modal editor/configuración | 54rem |
| Menú usuario | 20rem |
| Notificaciones | 29rem |
| Panel SofLIA | 25–30rem según contexto |

### 6.3 Márgenes

- Desktop: `1.25–2rem` laterales dentro del canvas.
- Tablet: `1rem`.
- Mobile: `0.75rem`, respetando safe areas.
- Entre navbar y contenido: `1–2rem`.
- Entre secciones mayores: `2.5–5rem` según densidad.

### 6.4 Simetría

Páginas hermanas —cursos, estadísticas, certificados y apuntes— DEBEN compartir:

- ancho de contenedor;
- altura y radio del panel superior;
- distancia desde navbar;
- alineación del título;
- ritmo de tarjetas.

El panel superior compacto del dashboard es la referencia. Una página no debe crear un hero más alto solo para llenar espacio.

#### 6.4.1 Hero compacto unificado de producto

El encabezado superior de Cursos, Mis estadísticas, Mis certificados y Libro de
apuntes pertenece a una sola familia. No son banners independientes.

**Geometría desktop**

- ancho: `100%` del contenedor de página;
- altura de referencia: `10.5rem` (`168px`);
- altura mínima permitida: `9.75rem`;
- radio exterior: `2rem`;
- padding horizontal: `3rem`;
- padding vertical: `2rem`;
- alineación vertical del contenido: centro;
- distancia al navbar: `1.25–1.5rem`;
- distancia a la siguiente sección: `1.25–2rem`;
- `overflow: hidden` únicamente en la capa decorativa del hero, nunca en un
  ancestro que contenga menús o paneles flotantes.

**Tratamiento visual**

```css
background:
  radial-gradient(
    circle at 92% 0%,
    color-mix(in srgb, var(--accent) 15%, transparent),
    transparent 19rem
  ),
  linear-gradient(
    112deg,
    var(--primary) 0%,
    color-mix(in srgb, var(--primary) 66%, var(--accent)) 58%,
    var(--accent) 145%
  );
border: 1px solid color-mix(in srgb, var(--accent) 32%, transparent);
border-radius: 2rem;
box-shadow:
  0 1.4rem 3.5rem rgb(2 12 23 / 0.14),
  inset 0 1px 0 rgb(255 255 255 / 0.08);
```

El extremo derecho puede incorporar dos o tres arcos concéntricos de `1px`, con
opacidad `8–16%`, y un punto accent de `0.42rem`. Los arcos son decoración y
deben declararse con `aria-hidden="true"` y `pointer-events:none`.

**Jerarquía**

1. eyebrow IBM Plex Sans 600, `0.62rem`, tracking `0.12em`;
2. título Newsreader 300, `2.6–3.15rem`, line-height `0.96–1.02`;
3. descripción Inter Tight 400, `0.8–0.95rem`, máximo `42rem`;
4. acciones opcionales alineadas a la derecha.

El botón Volver es un icon button de `2.7rem` dentro del hero cuando el contexto
lo necesita. Las acciones como PDF, Actualizar o Nuevo apunte son botones de
vidrio con fondo blanco al `6–10%`, borde blanco al `18–24%` y texto con
contraste AA. En mobile el hero usa altura automática, padding `1.25rem`, título
`2rem` y acciones en una segunda fila.

**Variantes permitidas**

- dashboard: saludo, descripción y accesos rápidos;
- analytics: “Mis estadísticas”, descripción y PDF/Actualizar;
- certificados: “Certificados de SofLIA y empresas aliadas”, sin contadores ni
  explicación redundante;
- notebooks: “Libro de apuntes”, descripción y Nuevo apunte.

No se permite alterar la altura, radio o alineación entre estas variantes.

### 6.5 Cuadrículas

- tarjetas de cursos: `repeat(auto-fit, minmax(...))` o columnas explícitas estables;
- analytics: cuatro KPIs en desktop, dos en tablet, una columna en mobile;
- notas: tres columnas en desktop, dos en tablet, una en mobile;
- grids deben usar `align-items: stretch`;
- cada tarjeta usa `height: 100%` y layout interno flex/grid para alinear footer.

### 6.6 Densidad

Se reconocen tres densidades:

- **Editorial:** landing, legal, errores; más aire, displays grandes.
- **Productiva:** dashboard, analytics, certificados; balance.
- **Operativa:** editor, curso, filtros; controles compactos sin sacrificar 44 px táctiles.

No mezclar densidades dentro de la misma región.

---

## 7. Radios

## 7.1 Escala

| Uso | Radio |
|---|---:|
| Micro icono | 0.5–0.6rem |
| Botón compacto | 0.68–0.78rem |
| Input / botón principal | 0.82–0.95rem |
| Tarjeta pequeña | 1–1.15rem |
| Tarjeta principal | 1.25–1.6rem |
| Modal | 1.35–1.75rem |
| Hero / escena | 1.5–2.5rem |
| Chip / status / progreso | 999px |
| Avatar | 50% |

### 7.2 Por qué los botones son redondeados

Los radios:

- hacen reconocible la familia visual;
- suavizan áreas densas;
- mejoran la lectura de objetivos táctiles;
- conectan botones con inputs y superficies;
- permiten estados de foco limpios.

No todos los botones son pills. Una cápsula `999px` se reserva para:

- chips;
- badges;
- status;
- tabs segmentados;
- acciones muy breves dentro de una barra.

Los botones con texto largo usan radio `0.8–0.95rem` para conservar estructura.

### 7.3 Prohibiciones

- esquinas cuadradas en dropdowns, modales o botones principales;
- mezclar radios 4 px y 28 px en una misma familia;
- redondear bloques editoriales internos sin necesidad;
- usar círculo para un icono rectangular.

---

## 8. Bordes, divisores y elevación

### 8.1 Bordes

Borde base: 1 px.

- claro: Primary 8–14%;
- oscuro: blanco 8–12%;
- activo: Accent 22–48% mezclado con borde;
- error: Error 30–55%;
- nunca negro sólido alrededor de un video o acordeón.

Un borde solo separa. No debe convertirse en un marco pesado.

### 8.2 Divisores

Usar divisores:

- entre header y contenido de modal;
- entre grupos de menú;
- antes de acciones destructivas;
- entre paneles que comparten superficie.

No usar una línea debajo de cada texto o cada tarjeta.

### 8.3 Sombras

| Nivel | Uso | Sombra orientativa |
|---|---|---|
| 0 | contenido plano | ninguna |
| 1 | input/tarjeta | `0 0.45rem 1.4rem rgb(2 10 20 / .04–.08)` |
| 2 | navbar/tarjeta flotante | `0 1rem 3rem rgb(2 10 20 / .10–.14)` |
| 3 | dropdown/panel | `0 1.5rem 4rem rgb(2 10 20 / .18–.24)` |
| 4 | modal | `0 2.5rem 7rem rgb(2 12 22 / .30–.34)` |

Se permite una segunda sombra cromática de 12–24% en acciones o focus.

### 8.4 Luz interior

Las superficies premium pueden añadir:

```css
box-shadow:
  0 2rem 5rem rgb(2 10 20 / 0.2),
  inset 0 1px 0 rgb(255 255 255 / 0.08);
```

La línea interior simula material, no relieve skeuomórfico.

---

## 9. Blur, vidrio y fondos ambientales

### 9.1 Blur permitido

| Contexto | Blur |
|---|---:|
| navbar flotante | 1.25–1.4rem |
| panel/dropdown | 1–1.5rem |
| modal | 1.5–1.6rem |
| backdrop | 0.65–0.9rem |
| glow ambiental | 4–5rem |

Agregar `saturate(115–140%)` cuando la transparencia reduzca demasiado el color.

### 9.2 Superficies translúcidas

Claro:

```css
background: rgb(255 255 255 / 0.92–0.97);
```

Oscuro:

```css
background: color-mix(
  in srgb,
  var(--color-bg-dark) 88%,
  var(--color-gray-800)
);
```

### 9.3 Reglas de uso

- Blur solo cuando existe contenido detrás.
- Una tarjeta sobre canvas plano no necesita backdrop-filter.
- No superponer más de dos superficies con blur.
- Mantener fallback opaco.
- Evitar blur en listas largas si afecta rendimiento.
- El área verde de un glow no debe percibirse como rectángulo.
- Los anillos decorativos solo se usan en escenas amplias y con opacidad mínima; no detrás del logo de auth.

---

## 10. Iconografía

### 10.1 Biblioteca y estilo

Se utiliza **Lucide React** o una familia lineal equivalente.

Características:

- trazo consistente;
- geometría simple;
- sin rellenos decorativos;
- stroke `1.5–2`;
- terminaciones redondeadas;
- apariencia legible a 16 px.

No usar:

- emoji como icono de interfaz;
- iconos de bibliotecas diferentes en el mismo panel;
- glifos con pesos incompatibles;
- iconos 3D dentro de controles productivos.

### 10.2 Tamaños

| Contexto | Tamaño |
|---|---:|
| Metadata | 12–14 px |
| Botón/control | 16–18 px |
| Acción destacada | 18–20 px |
| Estado vacío | 22–28 px |
| Hero/modal informativo | 28–32 px |

### 10.3 Contenedor de icono

Patrón estándar:

```css
width: 2.2rem;
height: 2.2rem;
border-radius: 0.72rem;
border: 1px solid color-mix(in srgb, var(--accent) 24%, var(--border));
color: var(--accent);
background: color-mix(in srgb, var(--accent) 7%, transparent);
```

El icono no necesita contenedor cuando acompaña una etiqueta dentro de un botón.

### 10.4 Accesibilidad

- botones de solo icono requieren `aria-label`;
- tooltip para acciones no obvias;
- iconos decorativos usan `aria-hidden`;
- el estado no depende exclusivamente del icono.

---

## 11. Botones

## 11.1 Anatomía

Un botón contiene:

1. superficie;
2. borde;
3. icono opcional;
4. etiqueta;
5. indicador de carga opcional;
6. estado de foco.

Alturas:

| Tamaño | Altura mínima | Uso |
|---|---:|---|
| XS | 1.95rem | toolbar densa |
| S | 2.25–2.45rem | menú, filtros |
| M | 2.65–3rem | acción estándar |
| L | 3–3.25rem | CTA principal |

Objetivo táctil mínimo recomendado: 44 × 44 px.

### 11.2 Primario

```css
border: 1px solid var(--action);
border-radius: 0.9rem;
color: var(--on-action);
background: var(--action);
box-shadow: 0 0.85rem 2rem
  color-mix(in srgb, var(--action) 18%, transparent);
```

Hover:

- `translateY(-1px)`;
- sombra aumenta, no el brillo del relleno;
- halo máximo de 3 px al 10–14%.

### 11.3 Accent

Solo cuando la acción representa:

- crear;
- avanzar;
- guardar en un flujo contextual;
- activar una capacidad;
- iniciar una experiencia.

El texto se calcula con `--on-action`; nunca se asume blanco.

### 11.4 Secundario

- superficie transparente o soft;
- borde neutral;
- texto principal;
- hover con accent 5–8%;
- sin sombra fuerte.

### 11.5 Ghost

Para acciones de baja jerarquía:

- borde transparente;
- fondo transparente;
- hover con superficie soft;
- icono y texto muted que pasan a primary/text.

### 11.6 Destructivo

- Error como texto y/o relleno;
- pedir confirmación para operación irreversible;
- separar visualmente del resto;
- no usar verde para confirmar destrucción;
- describir el objeto afectado.

### 11.7 Botón de icono

- cuadrado `2.2–2.55rem`;
- radio `0.68–0.85rem`;
- icono centrado;
- hover y focus visibles;
- círculo solo para avatar, presencia o control audiovisual muy específico.

### 11.8 Estados

**Default:** estable.

**Hover:** elevación de 1 px o tinte suave.

**Active:** `translateY(0)`, sombra menor.

**Focus-visible:** halo de 3 px.

**Disabled:** opacidad 40–50%, sin sombra, cursor no permitido.

**Loading:** conservar ancho; reemplazar o acompañar con spinner.

**Success temporal:** check + texto, sin alterar layout.

### 11.9 Contenido

- una acción por botón;
- icono antes del texto salvo flecha de avance;
- gap `0.42–0.55rem`;
- padding horizontal `0.8–1.1rem`;
- no recortar texto;
- en mobile puede ocupar 100% si es acción principal.

---

## 12. Formularios

## 12.1 Inputs

```css
min-height: 2.65–3.35rem;
border: 1px solid var(--border);
border-radius: 0.85–1rem;
padding: 0.65–0.95rem;
background: var(--surface-soft);
font-family: var(--font-system-ui);
```

Focus:

```css
border-color: color-mix(in srgb, var(--accent) 50%, var(--border));
box-shadow: 0 0 0 3px
  color-mix(in srgb, var(--accent) 8%, transparent);
```

### 12.2 Labels

- encima del control;
- IBM Plex Sans 500;
- `0.58–0.68rem`;
- no usar placeholder como única etiqueta;
- indicar opcionalidad en label, no en error.

### 12.3 Textareas

- radio `0.95–1.15rem`;
- line-height `1.55–1.75`;
- resize vertical cuando corresponda;
- contador alineado al pie;
- no ocupar más altura que la tarea inicial;
- en chat, auto-grow con máximo definido.

### 12.4 Search

- icono a la izquierda;
- borde y fondo soft;
- botón limpiar al escribir;
- ancho completo en páginas de biblioteca;
- placeholder describe campos buscables.

### 12.5 Checkbox y radio

- control mínimo 18 px;
- fila clicable completa;
- seleccionado con action/accent y marca visible;
- radio para una opción; checkbox para selección independiente;
- respuesta de quiz usa borde, radio y fondo, no solo círculo.

### 12.6 Switch

Dimensiones de referencia:

- track `2.55rem × 1.45rem`;
- thumb `1.05rem`;
- desplazamiento `1.1rem`;
- radio pill;
- estado activo usa accent;
- focus halo de 3 px;
- etiqueta y descripción permanecen fuera del track.

### 12.7 Validación

- mostrar error debajo del campo;
- Error + icono + mensaje accionable;
- no borrar el valor;
- éxito silencioso salvo que confirme una acción importante;
- errores de servidor se presentan en un bloque común, no como `alert()` nativo.

---

## 13. Dropdowns, selects y popovers

## 13.1 Por qué no se usa el select nativo visible

El menú nativo cambia entre sistemas, produce esquinas cuadradas, limita branding y no garantiza jerarquía o descripciones. Por ello los filtros y selects visibles se construyen como trigger + popover accesible.

El control sigue manteniendo:

- navegación por teclado;
- roles `listbox` y `option`;
- `aria-expanded`;
- `aria-controls`;
- cierre con Escape y click exterior;
- foco restaurado al trigger.

### 13.2 Trigger

```css
min-height: 2.75–2.9rem;
border: 1px solid var(--border);
border-radius: 0.82–0.9rem;
padding: 0.62rem 0.8rem;
background: var(--surface-soft);
```

Incluye:

- label opcional fuera del trigger;
- valor truncable;
- chevron a la derecha;
- estado abierto con borde accent y halo.

### 13.3 Menú flotante

```css
top: calc(100% + 0.35rem);
border-radius: 0.9–1rem;
padding: 0.3–0.48rem;
background: var(--surface-raised);
box-shadow: 0 1.4rem 3.5rem var(--shadow);
backdrop-filter: blur(1rem);
```

Cada opción:

- radio `0.62–0.7rem`;
- padding `0.55–0.7rem`;
- título Inter Tight 600;
- descripción opcional;
- check al final;
- hover accent 6–8%;
- seleccionado con texto accent.

### 13.4 Posicionamiento

- usar portal si un ancestro tiene overflow;
- ajustar al viewport;
- ancho mínimo igual al trigger;
- menú largo con scroll interno sutil;
- mobile puede convertirse en bottom sheet.

### 13.5 Filtros de notebooks

Los filtros Origen, Tipo y Estado comparten:

- misma altura;
- mismo radio;
- ancho estable;
- separación `0.5rem`;
- menú personalizado;
- alineación vertical con selector de vista;
- colapso a una fila desplazable o sheet en mobile.

---

## 14. Chips, badges, tabs y controles segmentados

### 14.1 Chips

- radio 999 px;
- altura `1.45–1.9rem`;
- padding horizontal `0.45–0.7rem`;
- IBM Plex Sans o Inter Tight;
- fondo accent 6–9%;
- borde accent 18–28%;
- no deben parecer CTA.

### 14.2 Status badges

Incluyen icono o punto y texto:

- “En progreso”;
- “Completado”;
- “Validado”;
- “Pendiente”.

Las etiquetas son breves y no se traducen en todo mayúsculas salvo micro-status.

### 14.3 Tabs segmentados

Patrón:

- grupo con superficie soft, borde y radio `0.9–1rem`;
- padding interno 3–4 px;
- cada tab radio `0.65–0.8rem`;
- activo usa Primary o action;
- inactivo es transparente;
- icono 16 px;
- texto nunca cortado.

En curso, “Contenido” y “Mis notas” reservan suficiente ancho para etiqueta, icono y contador. Si no caben:

1. se permite wrap controlado del grupo;
2. se reduce gap;
3. se oculta texto secundario;
4. nunca se aplica ellipsis a la etiqueta primaria.

### 14.4 Selector grid/lista

Este es el botón flotante de cambio de plantilla de visualización. Debe verse
como un único control, no como dos botones independientes.

**Anatomía y medidas**

- contenedor: `6rem × 3rem` aproximadamente;
- superficie: `var(--card)` al `94–97%`;
- borde: `1px solid var(--border)`;
- radio: `999px`;
- padding interno: `0.25rem`;
- gap entre opciones: `0.1rem`;
- sombra: `0 0.8rem 2rem rgb(2 12 23 / 0.12)`;
- blur: `0.9rem` cuando existe contenido detrás;
- cada opción: `2.5rem × 2.5rem`;
- iconos Lucide `Grid2X2` y `List`, stroke `1.75`, tamaño `17–18px`.

**Estados**

- activo: fondo Primary, icono `on-primary`, radio `999px` y sombra interior
  tenue;
- inactivo: transparente, texto/icono Muted;
- hover inactivo: Accent al `5–7%`;
- focus-visible: halo Accent al `16%`, nunca solo cambio de color;
- disabled: opacidad `0.42`, sin elevación;
- transición: `160–190ms` con `ease-out`.

El selector flota alineado al extremo derecho del encabezado de la colección,
pero conserva un anclaje estable; no debe saltar cuando cambia el número de
tarjetas. Cada opción requiere tooltip (“Vista en cuadrícula”, “Vista en
lista”), `aria-pressed` y target mínimo de `40px`. La preferencia se conserva
durante la sesión y, cuando sea posible, en almacenamiento del usuario.

En mobile puede mantenerse como cápsula de dos opciones o trasladarse a la fila
de filtros. Nunca se sustituye por un `<select>` nativo ni se recortan los
iconos.

---

## 15. Tarjetas

## 15.1 Tarjeta base

```css
border: 1px solid var(--border);
border-radius: 1–1.25rem;
background: var(--card);
box-shadow: var(--elevation-1);
```

Contenido:

- header;
- body flexible;
- metadata;
- footer alineado.

### 15.2 Tarjeta premium

Puede añadir:

- línea accent de 1 px;
- gradiente radial al 4–7%;
- sombra cromática al 5–12%;
- inset highlight.

No añadir simultáneamente todos los efectos.

### 15.3 Igualdad de alturas

En un grid:

- `align-items: stretch`;
- tarjeta `height: 100%`;
- cuerpo `display:flex; flex-direction:column`;
- footer `margin-top:auto`;
- reservar altura estable para título.

Esto aplica a cursos, notas, certificados y métricas.

### 15.4 Imágenes

Reglas para portadas:

- contenedor con aspect ratio consistente;
- `overflow:hidden`;
- `object-position:center`;
- `object-fit:cover` cuando la portada tolere recorte;
- `object-fit:contain` solo si el documento completo debe verse;
- si se usa `contain`, el fondo debe extender el color dominante, nunca dejar una barra blanca accidental;
- certificados usan contain dentro de un stage neutral;
- curso en lista usa thumbnail con ancho fijo y sin espacio en blanco lateral.

### 15.5 Preview de curso

La plantilla flotante de curso es una superficie editorial temporal que amplía
una tarjeta sin navegar. Es el patrón mostrado sobre las tarjetas del dashboard
y debe reutilizarse en cualquier catálogo.

**Geometría de referencia**

- ancho: `22–24rem`;
- alto máximo: `34rem` o
  `calc(var(--soflia-viewport-height) - 2rem)`, lo que sea menor;
- radio: `1.5rem`;
- borde: Accent al `14–20%`;
- fondo claro: blanco al `94–97%`;
- fondo oscuro: mezcla de `--color-bg-dark` al `88–92%` con Gray 800;
- blur: `1.25–1.5rem`, saturación `120–130%`;
- sombra:
  `0 1.8rem 4.5rem rgb(2 12 23 / 0.20)`;
- padding: `1.1rem 1.2rem 0.9rem`;
- glow radial Accent al `6–8%` desde la esquina superior derecha.

**Anatomía obligatoria**

1. chip de tipo —por ejemplo “Resumen”— con icono `Sparkles`;
2. botón cerrar circular de `2.35rem`, anclado arriba a la derecha;
3. título completo en Newsreader 300, `1.9–2.2rem`, line-height `1.02`;
4. autor en Inter Tight `0.72–0.8rem`;
5. porcentaje en cifra tabular y barra de progreso;
6. status pill —“En progreso”, “Completado”—;
7. descripción con line-height `1.55–1.65`;
8. CTA inferior “Ver curso” con `ArrowUpRight`.

La descripción ocupa un viewport interno flexible. Si excede el espacio, usa
scroll interno con scrollbar visualmente oculta, máscara de desvanecimiento
inferior y `overscroll-behavior:contain`. El CTA permanece sticky en la base
sobre una superficie que pasa de transparente a `var(--card)`; jamás queda
oculto bajo el texto.

**Posicionamiento y activación**

- abre por `hover` con retraso de `140–220ms`;
- también abre por `focus-visible` y conserva el foco lógico;
- permanece abierta cuando el puntero pasa de la tarjeta al preview;
- se cierra por Escape, botón cerrar, click exterior o pérdida de contexto;
- usa colisión con viewport: cambia de lado o ajusta `top` antes de salirse;
- no cubre totalmente la tarjeta origen;
- `z-index` de superficie flotante global, por encima de navbar y contenido;
- en touch se abre mediante acción explícita “Ver resumen”, nunca por hover
  simulado.

**Movimiento**

- entrada: opacidad `0→1`, `y:8→0`, escala `0.985→1`;
- duración: `180–220ms`;
- salida: `140–170ms`;
- reduced motion: solo opacidad.

El preview no duplica botones innecesarios ni introduce carruseles. Su objetivo
es resolver la decisión “¿quiero continuar este curso?” con título, avance y
contexto suficientes.

---

## 16. Modales y superficies flotantes

## 16.1 Familias

| Familia | Ancho | Uso |
|---|---:|---|
| Confirmación/validación | 23–28rem | bloqueo, aviso, eliminación |
| Formulario estándar | 28–36rem | nueva pregunta, nuevo apunte |
| Configuración/editor | hasta 54rem | notas, personalización |
| Documento | 66rem o viewport | certificado, preview |
| Panel lateral flotante | 20–30rem | SofLIA, historial, notificaciones |

### 16.2 Overlay

Patrón normativo:

```css
position: fixed;
inset: 0;
z-index: 9999;
display: grid;
place-items: center;
padding: 1rem;
background:
  radial-gradient(
    circle at 50% 42%,
    color-mix(in srgb, var(--accent) 10%, transparent),
    transparent 28rem
  ),
  rgb(3 12 22 / 0.58);
backdrop-filter: blur(0.9rem) saturate(115%);
```

El overlay:

- bloquea scroll del documento;
- cierra por click exterior solo si no hay riesgo de pérdida;
- respeta safe areas;
- no oscurece tanto que el modal pierda contraste.

### 16.3 Superficie

```css
border: 1px solid color-mix(in srgb, var(--accent) 22%, var(--border));
border-radius: 1.35–1.75rem;
background: var(--modal-surface);
box-shadow:
  0 2.5rem 7rem rgb(2 12 22 / 0.32),
  inset 0 1px 0 rgb(255 255 255 / 0.1);
backdrop-filter: blur(1.5rem) saturate(135%);
```

### 16.4 Header

- alto `4.4–4.8rem`;
- icono opcional 2.4–2.7rem;
- eyebrow opcional;
- título;
- cerrar arriba a la derecha;
- divisor de 1 px;
- no repetir marca si no aporta contexto.

### 16.5 Cuerpo

- padding `0.95–1.5rem`;
- scroll solo dentro del cuerpo;
- scrollbar oculta visualmente cuando no sea necesaria para orientación;
- estructura clara, sin tarjetas internas redundantes;
- texto legible y acciones cercanas al contenido.

### 16.6 Footer

- borde superior;
- acciones a la derecha;
- secundaria antes de primaria;
- en mobile se apilan y primaria ocupa 100%;
- footer sticky solo en modales largos.

### 16.7 Modal informativo “Finaliza el video”

Especificación:

- ancho máximo 28rem;
- icono informativo 3.4rem;
- eyebrow de contexto opcional;
- título Newsreader `1.55–2rem`;
- mensaje Inter Tight `0.86rem`, line-height 1.6;
- un único botón “Entendido” de ancho completo;
- radio 1.65rem;
- overlay blur 0.9rem;
- sin círculo verde saturado ni sombra agresiva;
- variante por actividad usa Warning en icono, no en botón.

### 16.8 Modal de nueva pregunta

Debe incluir:

- título “Nueva pregunta”;
- descripción breve;
- identidad del autor compacta;
- textarea principal;
- contador;
- tags opcionales;
- Cancelar y Publicar pregunta;
- modo claro y oscuro con tokens;
- altura basada en contenido;
- sin grandes regiones vacías;
- botón publicar deshabilitado con razón perceptible.

### 16.9 Modal/editor de notas

Especificación implementada:

- ancho máximo 54rem;
- altura `min(48rem, 86svh)`;
- radio 1.75rem;
- header 1.05rem vertical;
- toolbar sobre superficie soft;
- título con Newsreader;
- editor flexible con scroll;
- tags en chips;
- estado de guardado en footer;
- mobile: `100svh`, sin borde ni radio, toolbar horizontal y CTA completo.

### 16.10 Modal de configuración

- ancho máximo 54rem;
- altura máxima 90svh;
- secciones en acordeón de radio 1rem;
- header y footer con blur;
- select custom;
- switches accesibles;
- scroll interno invisible;
- confirmación de reset separada con Warning.

### 16.11 Modal de compartir

- icono de compartir;
- título y nombre del recurso;
- opciones como filas completas;
- copiar enlace primero;
- redes con iconos profesionales;
- URL en bloque mono;
- confirmación no intrusiva al copiar.

### 16.12 Mobile

En pantallas menores a 640–768 px:

- modales complejos ocupan `100svh`;
- border-radius 0 o solo esquinas superiores para bottom sheet;
- modales simples conservan margen 0.75–1rem;
- footer usa safe-area;
- no se corta ningún botón.

### 16.13 Accesibilidad modal

- `role="dialog"`;
- `aria-modal="true"`;
- título enlazado por `aria-labelledby`;
- focus trap;
- Escape;
- foco inicial lógico;
- restaurar foco al cerrar;
- no permitir interacción con el fondo.

### 16.14 Sistema unificado de modales administrativos

Esta sección es normativa para flujos de gestión de usuarios, invitaciones,
enlaces de acceso, importaciones y cualquier herramienta administrativa que
requiera formularios extensos. No se debe crear una composición visual
independiente por cada flujo: todos parten de la misma anatomía, tokens y
comportamiento.

#### 16.14.1 Anatomía obligatoria

```text
Overlay
└── Dialog
    ├── Header
    │   ├── Icono contextual o avatar opcional
    │   ├── Eyebrow + título + descripción breve
    │   ├── Navegación contextual opcional
    │   └── Cerrar
    ├── Body con scroll interno
    │   ├── Aviso o error opcional
    │   ├── Secciones del formulario
    │   └── Contenido o resultado
    └── Footer fijo
        ├── Contexto del proceso
        └── Acción secundaria + acción primaria
```

Reglas:

- el `dialog` es la única superficie principal;
- se evitan tarjetas decorativas anidadas sin función;
- el header explica qué se hará, no repite el nombre de la página;
- el body es la única zona con scroll;
- el footer permanece visible cuando el formulario es largo;
- los cambios de vista internos no deben cerrar ni redimensionar bruscamente
  el modal;
- cada acción debe tener un verbo específico: `Crear usuario`,
  `Enviar invitación`, `Crear enlace`, `Importar` o `Finalizar`.

#### 16.14.2 Escala y tamaños

| Variante | Ancho máximo | Alto recomendado | Casos |
|---|---:|---:|---|
| Compacta | 28rem | según contenido | confirmación, aviso |
| Estándar | 36rem | según contenido | pregunta, formulario corto |
| Administrativa | 54rem | 43rem | invitación y enlaces |
| Administrativa amplia | 58–64rem | 42–46rem | nuevo usuario, CSV |
| Workspace | 64rem o más | 86svh | editor o documento |

Valores de referencia del patrón administrativo:

```css
width: min(54rem, calc(100vw - 2.5rem));
height: min(43rem, calc(100svh - 2.5rem));
max-height: 48rem;
border-radius: 1.65rem;
```

El modal de alta individual puede crecer hasta `64rem`; la importación usa
`58rem`. No se debe usar `100vw` en desktop ni imponer alturas que creen
regiones vacías.

#### 16.14.3 Overlay y enfoque visual

```css
background:
  radial-gradient(
    circle at 78% 12%,
    color-mix(in srgb, var(--accent) 12%, transparent),
    transparent 34rem
  ),
  rgb(2 9 18 / 0.66);
backdrop-filter: blur(1rem) saturate(116%);
```

- el blur separa el contexto sin ocultarlo completamente;
- la saturación evita que el fondo se vuelva gris y pesado;
- el radial usa el accent de la organización;
- el fondo no recibe clicks ni foco;
- el documento bloquea su scroll mientras el modal está abierto;
- un click exterior cierra solo cuando no existe una operación en proceso ni
  riesgo de perder datos;
- los menús internos se cierran antes que el modal.

#### 16.14.4 Superficie y elevación

```css
border: 1px solid var(--border);
background:
  radial-gradient(
    circle at 100% 0%,
    color-mix(in srgb, var(--accent) 7%, transparent),
    transparent 22rem
  ),
  color-mix(in srgb, var(--surface) 97%, transparent);
box-shadow:
  0 2.25rem 5.5rem rgb(2 12 23 / 0.46),
  0 0 0 1px rgb(255 255 255 / 0.025),
  inset 0 1px 0 rgb(255 255 255 / 0.055);
backdrop-filter: blur(1.5rem) saturate(120%);
```

El borde exterior es de 1 px. No se permiten marcos negros gruesos, dobles
bordes, halos neón o sombras de color intenso. El radial es ambiental, con una
presencia máxima de 7%.

#### 16.14.5 Header administrativo

- alto mínimo: `5.15–5.35rem`;
- padding: `0.75–0.85rem 1–1.25rem`;
- grid: `icono / texto flexible / navegación opcional / cerrar`;
- divisor inferior de 1 px;
- fondo de superficie al 93% con blur `1.2rem`;
- icono contextual: `2.75–3rem`, radio `0.86–0.94rem`;
- iconos Lucide de `17–18px`, `stroke-width: 1.8`;
- cerrar: `2.75rem`, nunca un icono suelto sin área de interacción.

Tipografía:

- eyebrow: IBM Plex Sans, 9 px, peso 600, tracking `0.095–0.12em`;
- título: Newsreader, `24–30px`, peso 400, tracking `-0.028em`;
- descripción: Inter Tight, `11–12px`, peso 400/450;
- títulos largos se truncan en una línea; la descripción no debe superar dos
  líneas.

El icono puede convertirse en selector de imagen en el alta de usuario. En ese
caso conserva el tamaño del contexto, muestra preview con `object-fit: cover` y
revela el icono de cámara solo en hover/focus.

#### 16.14.6 Navegación interna

Las vistas `Individual`, `Enlace` y `Gestionar` usan un control segmentado:

```css
border: 1px solid var(--border);
border-radius: .96rem;
padding: .22rem;
background: var(--input-surface);
```

- cada opción mide al menos `2.35rem` de alto;
- radio interno `0.72rem`;
- estado inactivo: texto muted y fondo transparente;
- hover: accent al 5%;
- estado activo: fondo primary, texto `on-primary`, sombra primary al 17%;
- icono `14–15px`, stroke 1.8;
- no se usan tabs circulares, subrayados aislados ni botones de distinto tamaño;
- en mobile las tres opciones ocupan una cuadrícula de tres columnas.

#### 16.14.7 Campos

- alto mínimo: `3rem` en escritorio, `3.15rem` táctil;
- radio: `0.9rem`;
- borde: 1 px;
- padding horizontal: `0.88rem`;
- fuente: Inter Tight `12.5–13px`, peso 450;
- label: IBM Plex Sans `8.5–9px`, peso 600, uppercase;
- placeholder usa muted, nunca una opacidad inferior a 45%;
- hover mezcla accent al 25% con el borde;
- focus mezcla accent al 54% y añade ring de 3 px al 13%;
- error usa rojo semántico en borde y mensaje, no en toda la superficie;
- los campos deshabilitados conservan legibilidad y reducen énfasis, no
  contraste.

Los dropdowns siguen exactamente la geometría de los inputs. El menú emergente:

- radio `0.9rem`;
- borde 1 px;
- sombra de nivel 3;
- padding exterior `0.3rem`;
- opción mínima `2.4rem`;
- opción activa con accent al 8–12%;
- check de 16 px;
- sin esquinas cuadradas del `<select>` nativo cuando el sistema requiera un
  menú visual personalizado.

##### 16.14.7.1 Calendario y selector de fecha/hora

Los formularios administrativos no muestran el calendario nativo del navegador:
su geometría, tipografía y contraste cambian entre sistemas operativos y rompen
la continuidad visual. Se utiliza un trigger con la misma altura, radio, borde,
tipografía y estados de foco que el resto de los campos, seguido de un popover
propio montado en un portal.

Especificación del trigger:

- alto mínimo: `3rem`;
- radio: `0.9rem`;
- icono Calendar de `16px`, stroke `1.8`;
- texto con Inter Tight `12.5–13px`;
- valor vacío con color muted legible;
- botón para limpiar integrado únicamente cuando existe valor;
- `aria-expanded`, `aria-haspopup="dialog"` y label accesible obligatorio.

Especificación del popover:

- ancho de fecha: `20.5rem`; fecha y hora: `22.5rem`;
- ancho máximo: `calc(100vw - 1rem)`;
- radio exterior: `1rem`;
- borde de 1 px;
- padding: `0.72–0.8rem`;
- superficie al 96–98%, `backdrop-filter: blur(1.35rem) saturate(125%)`;
- sombra de elevación 3, sin marco negro, halo neón ni esquinas cuadradas;
- posición `fixed`, calculada respecto al trigger y corregida para no salir del
  viewport;
- `z-index` superior al modal (`100020` como referencia).

El encabezado usa botones de navegación de `2.2rem`, radio `0.72rem`, iconos
ChevronLeft/ChevronRight de 16 px y un selector central de mes y año. Al pulsar
mes/año se presenta una cuadrícula de 12 meses y los años disponibles dentro de
los límites configurados.

La cuadrícula mensual usa:

- siete columnas;
- días de `2.05rem`, radio `0.65rem`;
- encabezados de día en IBM Plex Sans, 8.5 px, uppercase;
- día activo con fondo primary y texto `on-primary`;
- día actual con un punto accent visible, sin depender solo del color;
- días fuera del mes con opacidad aproximada de 32%;
- fechas deshabilitadas con contraste suficiente y `cursor: not-allowed`.

Cuando se solicita fecha y hora, debajo del calendario aparece un bloque
compacto con horas y minutos. Cada valor usa un stepper con botones de 28–32 px,
incrementos de cinco minutos y selector AM/PM. El footer ofrece `Limpiar`,
`Cancelar` y `Aplicar`; la selección no se confirma accidentalmente al navegar
entre meses.

Comportamiento obligatorio:

- locale `es-MX` y formato consistente con el contexto;
- límites `min` y `max`;
- cierre con Escape o clic exterior;
- restauración del foco al trigger;
- navegación por teclado y foco visible;
- recalcular posición al hacer scroll o resize;
- adaptación mobile sin desbordamiento horizontal;
- transiciones de 140–180 ms y respeto a `prefers-reduced-motion`.

#### 16.14.8 Selector de rol

`Miembro`, `Administrador` y `Propietario` son tarjetas de selección, no CTAs.

- layout desktop: tres columnas iguales;
- altura mínima: `5rem`;
- radio: `1rem`;
- padding: `0.82rem`;
- icono en caja `2rem`, radio `0.68rem`;
- inactivo: superficie input y borde neutral;
- hover: desplazamiento vertical máximo de 1 px;
- activo: primary y texto `on-primary`;
- sombra activa: primary al 17%, blur `1.6rem`;
- nombre: IBM Plex Sans 9 px, uppercase;
- descripción: Inter Tight 10 px, una línea en desktop;
- se expone `aria-pressed`;
- el estado no depende únicamente del color.

En mobile se apilan. No se reducen hasta volver ilegible el texto ni se
truncan los nombres de los roles.

#### 16.14.9 Footer y botones

El footer usa:

```css
min-height: 4.75rem;
border-top: 1px solid var(--border);
padding: .78rem 1.35rem;
background: color-mix(in srgb, var(--surface) 94%, transparent);
backdrop-filter: blur(1.1rem);
```

Botón secundario:

- alto `2.72rem`;
- radio `0.86rem`;
- borde 1 px;
- superficie input;
- texto muted que pasa a texto principal en hover.

Botón primario:

- mismo alto y radio que el secundario;
- fondo primary de organización;
- texto calculado con `on-primary`;
- sombra primary al 16%;
- icono final de 15 px;
- hover sube 1 px;
- disabled: opacidad 42%, sin sombra.

El radio es moderado para expresar control y precisión. Los pill buttons se
reservan para chips, estados y controles segmentados; una acción administrativa
no debe usar `border-radius: 999px`.

#### 16.14.10 Importación CSV

La importación usa composición dividida:

- panel contextual: `15.5–20rem`;
- área operativa flexible;
- divisor vertical de 1 px;
- icono principal `4.6rem`, radio `1.25rem`;
- preview del archivo dentro de una sola tarjeta compacta;
- dropzone mínima `11rem`, borde dashed de 1 px;
- tarjeta de formato en dos columnas;
- campos de código con fuente mono y accent;
- `Requerido` usa Warning solo como badge;
- resultados conservan el mismo shell y reemplazan únicamente el body;
- errores tienen scroll interno, máximo 14rem;
- descargar plantilla es secundaria y permanece disponible en mobile.

La dropzone:

- acepta click, Enter, Space y drag-and-drop;
- muestra foco visible;
- no depende de animaciones para indicar estado;
- durante carga impide cierre accidental y muestra un spinner de 2 px;
- no usa ilustraciones grandes ni paneles decorativos sin información.

#### 16.14.11 Gestión de enlaces

- cada enlace es una fila o tarjeta compacta dentro del body;
- nombre, estado, URL, usos, rol y expiración forman una sola unidad;
- copiar usa botón de icono con tooltip y confirmación breve;
- menú de tres puntos se ancla al elemento y se cierra al hacer click fuera;
- `Pausar` usa Warning;
- `Eliminar` usa Danger;
- `Nuevo enlace` permanece como acción primaria del footer;
- no se presenta un gran vacío debajo de una única tarjeta: el contenedor se
  adapta a contenido y mantiene el footer estable.

#### 16.14.12 Mapeo de flujos

| Flujo | Variante | Icono | Acción primaria |
|---|---|---|---|
| Nuevo usuario | Administrativa amplia | `UserPlus` | Crear usuario |
| Invitación individual | Administrativa | `Mail` | Enviar invitación |
| Enlace de invitación | Administrativa | `Link2` | Crear enlace |
| Gestionar enlaces | Administrativa | `List` | Nuevo enlace |
| Importar usuarios | Administrativa amplia | `FileUp` | Importar |

Estos cinco flujos constituyen la referencia para futuros modales de SofLIA
Engine, Pulse Hub y herramientas relacionadas.

#### 16.14.13 Responsive

- a partir de `48rem` el modal administrativo pasa a `100% × 100svh`;
- se eliminan radio y margen exterior;
- header: icono 2.7rem, texto flexible y cerrar 2.7rem;
- descripciones secundarias pueden ocultarse, nunca el título;
- columnas de formulario pasan a una;
- roles se apilan;
- botones del footer reparten el ancho disponible;
- el panel visual de importación se reduce a la acción de descargar plantilla;
- se respeta `env(safe-area-inset-bottom)`;
- ningún botón puede quedar cortado por el teclado virtual.

#### 16.14.14 Movimiento

- overlay: `opacity 0→1`;
- dialog: `opacity 0→1`, `scale .975→1`, `y 18→0`;
- duración: 260 ms;
- easing: `cubic-bezier(.22, 1, .36, 1)`;
- hover de controles: 170–180 ms;
- no se animan altura y ancho entre pasos;
- `prefers-reduced-motion` reduce transiciones a 1 ms y conserva el cambio de
  estado.

#### 16.14.15 Accesibilidad y calidad

- `role="dialog"`, `aria-modal`, `aria-labelledby`;
- Escape cierra salvo durante una operación no cancelable;
- foco visible con ring accent de 3 px;
- controles de icono tienen `aria-label`;
- selector de rol expone `aria-pressed`;
- dropzone funciona con teclado;
- foco queda contenido y regresa al disparador al cerrar;
- contraste mínimo AA en texto, estados y acciones;
- primary siempre usa color `on-primary` calculado;
- el tema oscuro y el branding de organización se resuelven mediante tokens,
  nunca por hex locales.

#### 16.14.16 Prohibiciones

No usar:

- overlay transparente;
- fondo del modal negro puro sin tokens;
- blur menor a 8 px en overlays administrativos;
- títulos Inter/Arial cuando corresponda Newsreader;
- botones con alturas o radios diferentes dentro del mismo footer;
- inputs cuadrados;
- etiquetas dentro del placeholder como única identificación;
- tarjetas de rol saturadas o con glow neón;
- iconos emoji;
- scroll del documento detrás del modal;
- barras de scroll visibles sin necesidad;
- sombras fuertes en todos los controles;
- texto blanco sobre un primary demasiado luminoso sin cálculo de contraste.

---

## 17. Navegación

## 17.1 Navbar flotante de organización

Especificación de referencia:

- sticky, `z-index:120`;
- margen superior `0.7rem`;
- alto mínimo `4rem`;
- máximo 76rem por defecto, hasta 92rem en áreas amplias;
- radio 1.15rem;
- fondo translúcido;
- blur 1.4rem;
- sombra ambiental;
- línea inferior degradada de 1 px;
- logo 2.6rem;
- presencia en accent.

La barra no toca los bordes del viewport en desktop.

### 17.2 Identidad

- logotipo de organización;
- nombre truncable;
- presencia;
- no añadir subtítulos si la organización ya es evidente.

### 17.3 Acciones

- notificaciones;
- ayuda;
- avatar/menu;
- separación `0.28rem`;
- icon buttons 2.35rem.

### 17.4 Responsive

En mobile:

- shell `0.45rem 0.5rem 0`;
- alto 3.6rem;
- logo puede ocultarse cuando consume espacio sin aportar navegación;
- nombre se oculta;
- se mantiene acceso a menú hamburguesa;
- acciones principales se mueven al menú;
- no mostrar botones cortados.

En la landing, el logo permanece en desktop y puede eliminarse en responsive cuando el título visual ya identifica la experiencia.

### 17.5 Header de curso

Debe verse como navbar flotante:

- título del curso;
- organización;
- ayuda;
- progreso;
- notificaciones;
- radio 1.15rem;
- blur 1.35rem;
- alto 4.35rem desktop / 3.65–4rem mobile.

El título:

- Newsreader;
- máximo una línea desktop;
- en mobile se acorta o se mueve a segunda línea controlada.

La barra de progreso:

- compacta;
- track neutral;
- fill accent;
- porcentaje en pill;
- no competir con el título.

### 17.6 Breadcrumbs

- IBM Plex Sans o Inter Tight pequeño;
- iconos 14 px;
- truncado en nodos intermedios;
- nodo actual legible;
- mobile muestra solo volver + contexto actual.

---

## 18. Menús, notificaciones e historial

### 18.1 Menú de usuario

- ancho 20rem;
- radio 1.35rem;
- superficie 97%;
- blur 1.5rem;
- sin scrollbar visible;
- identidad, organización, cambio de panel, preferencias y cierre de sesión;
- grupos separados por divisores;
- items de 2.25rem mínimo;
- hover desplaza 0.12rem como microseñal;
- logout en Error.

La paleta personalizada se resuelve por tokens en claro y oscuro. El menú nunca conserva un tono distinto al resto de la organización.

### 18.2 Mobile user menu

- bottom sheet de ancho completo;
- radio superior 1.25rem;
- safe-area inferior;
- secciones agrupadas;
- targets grandes;
- no replicar todo el desktop en miniatura.

### 18.3 Notificaciones

El panel de notificaciones es una ventana flotante global, no contenido interno
del navbar. Debe renderizarse mediante portal en `document.body` para evitar
recortes producidos por `overflow`, `filter`, `backdrop-filter`, transforms o
stacking contexts de páginas como estadísticas, certificados y apuntes.

**Contrato de capas**

| Capa | Valor de referencia |
|---|---:|
| navbar sticky | 120 |
| backdrop global | 1,000,002 |
| panel de notificaciones | 1,000,003 |

El backdrop puede atenuar y difuminar el navbar y el contenido, pero el panel
siempre queda nítido y completamente visible. Nunca debe aparecer únicamente
una franja redondeada detrás del navbar.

**Geometría**

- ancho desktop: `29rem`;
- `max-width: calc(100vw - 1.5rem)`;
- alto máximo: el menor entre `35rem` y el espacio disponible bajo el trigger;
- radio: `1.35rem`;
- borde: Accent `16%` mezclado con Border;
- blur: `1.5rem`, saturación `125%`;
- sombra: `0 2rem 5rem` con color de sombra contextual;
- posición: `fixed`, calculada desde `getBoundingClientRect()` del botón;
- separación desde el trigger: `0.6rem`;
- margen mínimo al viewport: `0.75rem`;
- recálculo en `resize` y en scroll de cualquier contenedor.

En mobile ocupa el ancho disponible con `left/right:0.75rem`, conserva margen
inferior seguro y limita la altura al viewport real.

**Anatomía**

- header de `4.4rem` con título Newsreader y contador de no leídas;
- acciones “marcar todas” y cerrar como icon buttons de `2rem`;
- lista con scroll interno, scrollbar oculta y overscroll contenido;
- nivel de prioridad por icono, etiqueta y tono semántico;
- acciones leer, archivar y eliminar como icon buttons con tooltip;
- footer “Ver todas” de `2.45rem` mínimo;
- badge del trigger usando `on-accent`, nunca texto blanco asumido.

**Interacción y accesibilidad**

- `aria-expanded` y `aria-controls` en el trigger;
- `role="dialog"` y nombre accesible en el panel;
- cierre por Escape, backdrop, click exterior y navegación;
- clicks dentro del panel no se interpretan como click exterior;
- foco visible en todas las acciones;
- modo oscuro redefine superficie, texto, muted, border y sombra;
- el portal copia los tokens `--org-accent-color`,
  `--org-primary-color` y `--org-on-action-color` del contexto de la
  organización para no perder branding al salir del árbol visual.

### 18.4 Historial SofLIA

- sesiones como filas/tarjetas compactas;
- fecha y número de mensajes;
- hora con cifras tabulares;
- editar y eliminar como icon buttons;
- paginación;
- confirmación destructiva;
- scrollbar oculta visualmente.

---

## 19. Panel flotante de SofLIA

## 19.1 Estructura

1. header de identidad;
2. área de mensajes o estado vacío;
3. sugerencias;
4. composer sticky.

### 19.2 Superficie

- ancho contextual 20–30rem;
- radio 1.5rem;
- sombra `0 1.6rem 4.5rem rgb(2 12 23 / .17)`;
- blur 1.4rem;
- borde sutil;
- fondo con glow radial máximo 5–7%.

### 19.3 Header

- avatar;
- nombre Newsreader 300;
- estado IBM Plex Sans;
- audio, historial/reiniciar y cerrar;
- icon buttons 2.1rem;
- presencia accent.

### 19.4 Estado vacío

- avatar 4rem;
- eyebrow;
- título;
- una frase contextual;
- chip con lección actual;
- sin anillos grandes ni fondo rectangular verde.

### 19.5 Mensajes

- asistente: radio `1rem 1rem 1rem .3rem`;
- usuario: radio `1rem 1rem .3rem 1rem`;
- máximo 86% del ancho;
- line-height 1.55;
- acciones pequeñas bajo mensaje;
- texto siempre legible sobre brand color.

### 19.6 Sugerencias

- 2 columnas desktop, una mobile;
- radio 0.85rem;
- skeleton del mismo tamaño;
- máximo 4 sugerencias visibles;
- ocultar/mostrar;
- texto conciso.

### 19.7 Composer

- borde 1 px;
- radio 1rem;
- padding `0.45rem 0.5rem 0.45rem 0.75rem`;
- textarea centrada verticalmente;
- line-height 1.35;
- botón 2.2rem;
- focus halo de 3 px;
- no debe aparecer una scrollbar vacía;
- `overflow-y:hidden` hasta alcanzar altura máxima.

### 19.8 Alineación en curso

En layout de tres columnas:

- sidebar de contenido y panel SofLIA comparten exactamente `top`;
- ambos usan el mismo margen superior;
- su cálculo depende del mismo header;
- no corregir con valores absolutos independientes;
- el centro puede desplazarse sin mover los laterales;
- en responsive los paneles se convierten en drawers/sheets.

---

## 20. Dashboard y biblioteca de cursos

### 20.1 Panel de bienvenida

- misma altura base en todas las páginas relacionadas;
- oscuro Primary → Accent;
- radio aproximado 1.5–2rem;
- saludo Newsreader;
- una línea de apoyo;
- accesos rápidos compactos a estadísticas, certificados y apuntes;
- sin bloque de estadísticas generales dentro del inicio;
- el contenido principal empieza con cursos.

### 20.2 Tarjetas de curso

- dimensiones uniformes;
- portada con ratio estable;
- título Newsreader ajustado;
- autor y metadata;
- progreso;
- CTA alineado abajo;
- status superpuesto en portada;
- hover con elevación y preview;
- imagen completa sin barras blancas.

### 20.3 Modo lista

- grupo con header mínimo;
- cada fila presenta thumbnail, título, autor, estado y progreso;
- thumbnail ocupa toda su celda;
- el contenedor no deja espacio blanco lateral;
- filas con radio 1rem;
- status a la derecha;
- responsive apila metadata, no recorta portada.

### 20.4 Loading del dashboard

Usar el loader unificado descrito en la sección 29. No crear un spinner aislado ni una tarjeta genérica distinta.

---

## 21. Estadísticas y análisis

### 21.1 Hero

Mismo ancho, altura, radio y posición que el panel de bienvenida. Incluye:

- volver;
- eyebrow “Panel personal”;
- título “Mis estadísticas”;
- una descripción breve;
- acciones PDF/Actualizar si son relevantes.

### 21.2 KPIs

- cuatro tarjetas desktop;
- icono profesional;
- etiqueta IBM Plex;
- valor Newsreader o Inter Tight tabular según métrica;
- descripción;
- progreso si aplica;
- misma altura.

### 21.3 Gráficas

- conservar las gráficas funcionales;
- color principal de serie = action/accent;
- gridlines con 6–10% de opacidad;
- labels IBM Plex Sans;
- tooltip flotante con radio 0.8rem;
- no usar más de cinco colores simultáneos;
- modo oscuro ajusta grid, tooltip y texto.

### 21.4 Análisis de SofLIA

No es un bloque de texto genérico. Se compone de:

- header con icono y actualizar;
- resumen ejecutivo;
- métricas clave;
- fortalezas;
- áreas de oportunidad;
- recomendación priorizada;
- cards de métrica uniformes;
- listas con icono semántico;
- texto line-height 1.6;
- espaciado entre insight y evidencia.

El tono cromático de “oportunidad” usa Warning, no Error, salvo fallo real.

---

## 22. Certificados

### 22.1 Encabezado

- hero compacto del mismo tamaño que dashboard/analytics;
- título “Certificados de SofLIA y empresas aliadas”;
- sin contadores redundantes;
- sin “Biblioteca personal”;
- sin descripción obvia de la tarjeta.

### 22.2 Tarjeta de certificado

No debe ser una miniatura vertical comprimida del diseño anterior. La tarjeta
canónica es horizontal y distribuye documento e información en dos regiones
equilibradas.

**Geometría desktop**

- ancho recomendado: `43–48rem`;
- alto: `19–21rem`;
- grid: `55% 45%`;
- radio exterior: `1.35rem`;
- overflow oculto;
- borde: `1px solid var(--border)`;
- línea accent superior de `1–2px`;
- sombra: `0 1.2rem 3rem rgb(2 12 23 / 0.12)`;
- fondo: `var(--card)`.

**Región documental**

- stage neutral con mezcla de Surface y Accent al `2–4%`;
- padding `1.1–1.35rem`;
- preview en `object-fit:contain`;
- documento completo visible, sin corte ni barras blancas accidentales;
- punto accent opcional en la esquina inferior;
- borde vertical separador al `8–12%`.

**Región informativa**

- padding `1.2–1.4rem`;
- primera fila: organización y badge “Certificado válido”;
- título Newsreader 300, `1.65–1.95rem`, máximo cuatro líneas;
- metadata con iconos `UserRound` y `CalendarDays`, `0.68–0.75rem`;
- divider antes de acciones;
- footer pegado al fondo mediante `margin-top:auto`;
- CTA Ver ocupa el espacio flexible;
- Descargar y Verificar son icon buttons de `2.55rem`;
- todos los iconos son Lucide, stroke `1.75`, con tooltip.

La tarjeta completa puede elevarse `translateY(-2px)` en hover, pero solo el
CTA Ver inicia la navegación principal. Descargar y verificar no pueden estar
ocultos en un menú de tres puntos.

**Responsive**

- por debajo de `48rem`, cambia a una columna;
- preview conserva aspect ratio documental y altura máxima;
- información queda debajo, sin transformar la tarjeta en una miniatura;
- acciones ocupan una fila completa;
- título puede usar line clamp de cuatro líneas con acceso al texto completo.

**Estados**

- válido: Success suave + icono `ShieldCheck`;
- pendiente: Warning suave + `Clock3`;
- inválido: Error suave + `ShieldAlert`;
- descargando: icon button mantiene ancho y muestra loader interno;
- error: mensaje contextual, sin reemplazar todo el certificado.

### 22.3 Detalle

- certificado como documento principal;
- panel lateral con estado, emisor, instructor y fecha;
- hash en mono con copiar;
- acciones Descargar, Verificar y Compartir;
- layout cambia a una columna en tablet;
- documento se mantiene legible, no se recorta.

### 22.4 Verificación pública

- estado válido visible;
- integridad de cadena;
- operación;
- empresa emisora;
- hash;
- contenido verificable sin autenticación;
- no exponer datos personales adicionales.

---

## 23. Notebooks y apuntes

### 23.1 Página

- navbar organizacional;
- hero simétrico;
- búsqueda;
- tabs Actividad reciente/Tareas;
- filtros custom;
- árbol de cursos;
- grid de notas.

### 23.2 Árbol lateral

- ancho aproximado 18.5rem;
- curso expandible;
- contadores;
- títulos con elipsis y tooltip;
- selección con accent soft;
- filas compactas;
- panel con radio 1.2rem.

### 23.3 Tarjeta de nota

- misma altura mínima en toda la cuadrícula;
- grid `align-items:stretch`;
- título reservado;
- curso y lección;
- tags;
- status;
- fecha al pie;
- overlay de preview no altera altura;
- hover sutil;
- máximo tres columnas.

### 23.4 Nuevo apunte

Modal de formulario:

- header editorial;
- curso;
- lección dependiente;
- título opcional;
- selects custom;
- botón deshabilitado hasta completar requisitos;
- Cancelar y Crear apunte;
- sin espacio vacío;
- claro/oscuro por token.

### 23.5 Editor de notas

- navbar flotante con nombre del producto, volver, breadcrumb, guardado y menú;
- toolbar agrupada;
- lienzo editorial;
- panel de análisis/pregunta SofLIA;
- título Newsreader;
- cuerpo Inter Tight;
- menús de formato como popovers premium;
- estado Guardado visible y no intrusivo;
- una columna en tablet/mobile.

---

## 24. Experiencia de curso

### 24.1 Layout desktop

Tres regiones:

1. sidebar de contenido/notas;
2. panel central;
3. SofLIA.

Las regiones laterales son ventanas flotantes con:

- radio 1.5–1.55rem;
- blur 1.4–1.5rem;
- sombra;
- borde sutil;
- top y altura coherentes.

### 24.2 Sidebar

- tabs Contenido/Mis notas;
- contador en badge;
- acción nuevo apunte;
- colapsar;
- módulos como tarjetas;
- progreso por módulo;
- lección activa con accent soft;
- completadas con Success;
- scroll interno sin scrollbar agresiva.

### 24.3 Responsive

- sidebar se convierte en drawer;
- SofLIA se convierte en panel full-height;
- centro ocupa el ancho;
- tabs no se cortan;
- header se compacta;
- video mantiene ratio;
- no hay offsets desktop heredados.

---

## 25. Video y controles

### 25.1 Stage

- video sin marco negro grueso;
- borde máximo 1 px;
- padding exterior mínimo;
- radio 1.1rem;
- overflow hidden;
- ratio estable;
- controles superpuestos dentro del video;
- sin grandes marcos blancos.

### 25.2 Barra de progreso

- track 3–4 px;
- radio 999px;
- fill accent;
- buffer distinguible;
- thumb 10–12 px, visible en hover/focus;
- área táctil invisible mayor que el track;
- tooltip de tiempo.

### 25.3 Controles

- iconos lineales;
- play, volumen, tiempo, configuración y fullscreen;
- controles de 36–44 px;
- color blanco con contraste sobre gradiente inferior;
- hover con fondo translúcido;
- volumen vertical u horizontal según ancho;
- configuración en popover oscuro/translúcido legible;
- texto de opciones nunca blanco sobre blanco.

### 25.4 Navegación

- anterior/siguiente como icon buttons;
- seek ±10 s con icono específico;
- no duplicar flechas arriba y laterales sin función diferenciada;
- ocultar controles secundarios en mobile.

### 25.5 Accesibilidad

- teclado: espacio, flechas, M, F;
- `aria-label`;
- focus visible;
- captions;
- estado de volumen;
- no autoplay con sonido.

---

## 26. Transcripción y resumen

### 26.1 Contenedor

- panel separado del video con radio 1.35rem;
- título de lección;
- acordeones Transcripción y Resumen;
- sin borde negro;
- superficie soft;
- sombra casi imperceptible.

### 26.2 Acordeón

- header mínimo 4.25–4.6rem;
- icono en contenedor;
- título;
- metadata de palabras/tiempo;
- descripción;
- chevron;
- abierto con borde accent parcial.

### 26.3 Contenido

- ancho de lectura controlado;
- line-height 1.7;
- párrafos separados;
- métricas en chips;
- “Generar nota” al final;
- escuchar como acción secundaria;
- leyenda de origen IA en IBM Plex Sans.

---

## 27. Actividades, quizzes y comunidad

### 27.1 Actividades

Eliminar tarjetas de título redundantes. El contenido comienza con:

- título de sección;
- lección;
- lista agrupada por Actividades y Materiales.

Cada actividad:

- fila de radio 0.82–1.15rem;
- icono por tipo;
- título;
- tipo en chip;
- estado;
- chevron;
- contenido expandido con una superficie, no varias cajas anidadas.

### 27.2 Lectura/reflexión

- tipografía de lectura;
- controles Escuchar y tamaño;
- ancho cómodo;
- secciones claras;
- CTA al final;
- no presentar un bloque de texto sin jerarquía.

### 27.3 Conversación IA

- identidad SofLIA;
- criterios y puntaje;
- mensajes;
- composer;
- estados Listo/En progreso;
- métricas compactas;
- usa el mismo patrón del panel SofLIA.

### 27.4 Ejercicio

- objetivo;
- contexto;
- herramientas;
- pasos;
- resultado esperado;
- área de respuesta o entrega;
- dividir texto largo en bloques con títulos e iconos;
- no usar emoji como iconos finales.

### 27.5 Quiz

- resumen de puntos y umbral;
- paginación de preguntas;
- tarjeta de pregunta;
- opciones completas clicables;
- selección clara;
- Anterior/Siguiente;
- Enviar respuestas;
- feedback accesible;
- estado aprobado/reprobado;
- botones coherentes en claro y oscuro.

### 27.6 Comunidad

Título único: **Preguntas de la comunidad**.

Eliminar:

- “Comunidad de lección”;
- contadores redundantes como “4 conversaciones” cuando no aporten decisión;
- cajas vacías desproporcionadas.

Incluir:

- buscar;
- nueva pregunta;
- lista de conversaciones;
- autor, fecha, contenido y métricas;
- ver/cerrar conversación;
- respuestas anidadas;
- composer;
- estado vacío compacto y accionable.

---

## 28. Perfil y seguridad

### 28.1 Header

- navbar flotante;
- volver;
- Guardar cambios;
- hero de identidad con avatar, nombre, rol, fecha, email y verificación;
- estadísticas compactas;
- tabs Información personal/Seguridad.

### 28.2 Avatar

- stage redondeado;
- borde accent;
- eliminar y cambiar como icon buttons;
- acciones no cubren rostro;
- fallback con iniciales.

### 28.3 Formulario

- grid de tres columnas desktop;
- dos tablet;
- una mobile;
- cards/input de radio 1rem;
- labels IBM Plex;
- textareas con contadores;
- dropdown de género custom;
- estado de guardado.

### 28.4 Seguridad

- email verificado en tarjeta;
- sección Cambiar contraseña;
- campos actual/nueva/confirmar;
- botón Mostrar;
- reglas de contraseña;
- CTA habilitado solo al validar;
- no mostrar información sensible en query o logs.

---

## 29. Estados de carga

## 29.1 Único componente

Todas las pantallas usan `PremiumLoadingScreen`. Se prohíben loaders locales con spinner y texto genérico si representan carga de página.

### 29.2 Composición

- canvas completo o contenido contenido;
- glow radial de organización;
- logo stage 5rem;
- logotipo real;
- punto de presencia;
- eyebrow de producto;
- etiqueta;
- descripción opcional;
- línea indeterminada.

### 29.3 Valores

- stage: radio 1.55rem;
- blur 1.25rem;
- progreso 11rem × 0.18rem;
- animación 1.5 s;
- respiración 3.8 s;
- canvas responsive;
- dark/light y branding.

### 29.4 Contained

Para carga de módulo:

- ancho 100%;
- min-height `clamp(18rem, 48vh, 32rem)`;
- radio 1.5rem;
- conserva contexto de la página.

### 29.5 Skeleton

Usar skeleton cuando la estructura es conocida:

- mismo tamaño final;
- shimmer discreto;
- no más de 1.4–1.5 s;
- sin saltos de layout;
- detener con reduced motion.

---

## 30. Estados vacíos, éxito y error

### 30.1 Estado vacío

Debe responder:

- qué falta;
- por qué;
- qué puede hacer el usuario.

Composición:

- icono;
- título;
- frase;
- una acción.

No ocupar todo el viewport si la ausencia es local.

### 30.2 Error inline

- superficie soft de Error 6–9%;
- icono;
- título;
- mensaje;
- reintentar;
- detalles técnicos colapsados;
- preservar contexto.

### 30.3 404 y 500

Comparten `SystemErrorScene`:

- canvas adaptativo;
- escena máxima 66rem;
- radio 1.5–2.5rem;
- topbar con logotipo real SofLIA;
- status de plataforma;
- código editorial;
- mensaje;
- acciones;
- claro/oscuro.

404:

- “Ruta no disponible”;
- volver al inicio;
- acceso clientes.

500:

- “Interrupción temporal”;
- reintentar;
- ir al inicio;
- mensaje de seguridad de datos;
- mismo lenguaje visual que 404.

No usar tarjetas pequeñas rojas aisladas ni iniciales “SL”.

---

## 31. Movimiento e interacción

## 31.1 Duraciones

| Acción | Duración |
|---|---:|
| color/borde | 150–180 ms |
| hover/elevación | 170–200 ms |
| panel/dropdown | 180–240 ms |
| modal | 220–320 ms |
| transición de sección | 400–700 ms |
| ambiente | 3–8 s |

### 31.2 Curvas

- estándar: `ease`;
- UI premium: `cubic-bezier(0.22, 1, 0.36, 1)`;
- progreso: `cubic-bezier(0.65, 0, 0.35, 1)`;
- spring en React Spring para drag/3D, sin rebote excesivo.

### 31.3 Hover

Permitir uno o dos efectos:

- elevar 1–2 px;
- cambiar borde;
- aumentar sombra;
- mover icono 1–2 px.

No escalar tarjetas grandes de forma perceptible.

### 31.4 Scroll

Landing:

- secciones pueden revelar contenido;
- títulos con desplazamiento/opacity;
- slides responden a scroll;
- transiciones ligadas a progreso;
- efecto 3D y pointer con amortiguación.

Producto:

- movimiento más corto;
- sticky headers;
- no usar parallax en tablas, formularios o cursos.

### 31.5 Drag y 3D

- el modelo `soflia3d.web.glb` responde a arrastre;
- rotación con inercia controlada;
- cursor grab/grabbing;
- límite vertical;
- no bloquear scroll;
- fallback estático;
- carga diferida;
- detener render cuando no está visible.

### 31.6 Reduced motion

Con `prefers-reduced-motion: reduce`:

- transiciones a 1 ms o estado estable;
- sin parallax;
- sin auto-rotación;
- shimmer se detiene o ralentiza;
- contenido permanece completo.

---

## 32. Responsive

## 32.1 Breakpoints de referencia

| Nombre | Rango |
|---|---|
| Mobile S | `< 400px` |
| Mobile | `< 640px` |
| Tablet | `640–1023px` |
| Desktop | `1024–1439px` |
| Wide | `≥ 1440px` |

Los componentes pueden usar breakpoints de contenido como 35rem, 40rem, 48rem, 64rem o 72rem cuando su estructura lo requiera.

### 32.2 Estrategia

- diseñar mobile primero para tarea;
- ampliar columnas, no solo tamaños;
- drawers para paneles laterales;
- bottom sheets para menús;
- modales complejos full-screen;
- preservar safe areas;
- usar `svh/dvh`;
- evitar ancho fijo mayor al viewport;
- probar 320, 375, 390, 768, 1024, 1440 y 1920 px.

### 32.3 Contenido

- títulos no se cortan;
- botones no se salen;
- tabs pueden desplazarse o reorganizarse;
- filtros se apilan;
- tablas se transforman o desplazan;
- portadas conservan ratio;
- acciones secundarias entran en menú.

### 32.4 Navegación mobile

- hamburger;
- logo opcional según espacio;
- acciones principales dentro del menú;
- overlay accesible;
- bloqueo de scroll;
- cerrar por Escape/backdrop;
- foco correcto.

---

## 33. Accesibilidad

### 33.1 Obligatorio

- WCAG AA;
- navegación completa por teclado;
- foco visible;
- landmarks;
- headings en orden;
- labels;
- mensajes asociados;
- alt text;
- contraste;
- zoom 200%;
- touch targets;
- reduced motion.

### 33.2 Focus

Patrón:

```css
:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px
    color-mix(in srgb, var(--accent) 12%, transparent);
}
```

No quitar outline sin reemplazo.

### 33.3 Lectores

- acciones con nombre;
- badges con texto accesible;
- progreso con `aria-valuenow`;
- gráficos con resumen textual;
- iconos decorativos ocultos;
- errores anunciados;
- live regions para guardado/carga.

### 33.4 Color

- nunca única señal;
- ajustar branding;
- no usar texto accent claro sobre blanco;
- hover no puede ser el único acceso a información.

---

## 34. Contenido y microcopy

### 34.1 Voz

- clara;
- directa;
- profesional;
- humana;
- sin lenguaje técnico innecesario;
- sin exageración comercial dentro del producto.

### 34.2 Acciones

Buenas:

- “Guardar cambios”;
- “Continuar curso”;
- “Publicar pregunta”;
- “Intentar de nuevo”.

Evitar:

- “Aceptar” cuando no dice qué acepta;
- “Sí” como única etiqueta;
- “Click aquí”;
- títulos duplicados.

### 34.3 Errores

Estructura:

1. qué ocurrió;
2. qué se conserva;
3. qué puede hacer;
4. detalle técnico opcional.

### 34.4 Vacíos

No culpar al usuario. Indicar la siguiente acción.

---

## 35. Rendimiento

### 35.1 Reglas

- fuentes con `next/font`;
- cargar solo pesos usados;
- imágenes optimizadas;
- lazy loading;
- GLB diferido;
- evitar blur en nodos masivos;
- animar transform/opacity;
- reservar dimensiones;
- virtualizar listas extensas;
- prefetch selectivo;
- skeleton estable.

### 35.2 3D

- Suspense;
- fallback ligero;
- detener animation frame fuera de vista;
- limitar DPR;
- texturas comprimidas;
- no usar 3D para controles.

### 35.3 Consultas

- evitar cascadas;
- compartir queries;
- cachear catálogos;
- cargar paneles secundarios bajo demanda;
- no bloquear auth por contenido decorativo.

---

## 36. Implementación

### 36.1 Tokens locales

Cada experiencia crea alias semánticos:

```css
.page {
  --experience-action: var(--org-action-color, var(--color-primary));
  --experience-accent: var(--org-accent-color, var(--color-accent));
  --experience-on-action: var(--org-on-action-color, var(--color-bg-light));
  --experience-surface: var(--color-bg-light);
  --experience-text: var(--color-contrast);
  --experience-muted: var(--color-muted);
  --experience-border: color-mix(
    in srgb,
    var(--experience-text) 10%,
    transparent
  );
}
```

Los descendientes consumen los alias. No repetir fallback en cada clase.

### 36.2 CSS Modules

- nombres por función, no apariencia;
- estados como modificadores;
- media queries junto al módulo;
- evitar `!important`, salvo migración global documentada;
- no usar estilos inline para colores;
- mantener tokens al inicio.

### 36.3 Componentes compartidos

Crear componente compartido si:

- aparece en tres vistas;
- tiene lógica accesible;
- requiere branding;
- posee estados complejos.

Ejemplos:

- OrgNavbar;
- PremiumLoadingScreen;
- SystemErrorScene;
- NotesModalLayout;
- LearnPageValidationModal;
- LiaSidePanel.

### 36.4 Estados

Todo componente interactivo implementa:

- default;
- hover;
- active;
- focus-visible;
- disabled;
- loading si aplica;
- error si aplica;
- dark;
- custom branding;
- mobile.

### 36.5 Z-index

Escala:

| Capa | Z |
|---|---:|
| contenido | 0–10 |
| sticky interno | 20–40 |
| dropdown local | 50–80 |
| navbar | 120 |
| panel/notificaciones | 100–1000 |
| modal | 9999 |
| modal crítico | 10000+ |

Evitar números arbitrarios sin contexto.

---

## 37. Adopción en SofLIA Engine y Pulse Hub

### 37.1 Elementos que permanecen idénticos

- tipografía;
- radios;
- botones;
- inputs;
- dropdowns;
- modales;
- navbar;
- panel SofLIA;
- loaders;
- errores;
- motion;
- responsive;
- accesibilidad.

### 37.2 Elementos variables

- color de organización;
- logotipo;
- densidad por tarea;
- gráficas;
- nomenclatura;
- distribución del workspace.

### 37.3 SofLIA Engine

Priorizar densidad operativa:

- canvas amplio;
- paneles flotantes;
- inspector y navegación alineados;
- toolbar compacta;
- estados de ejecución;
- código en mono;
- no perder la voz editorial en títulos.

### 37.4 Pulse Hub

Priorizar productividad:

- navbar compartido;
- tarjetas de herramientas;
- descargas;
- estados de dispositivo;
- menús y modales del sistema;
- branding por organización.

### 37.5 Proceso de migración

1. inventariar componentes;
2. mapear colores a tokens;
3. sustituir fuentes;
4. unificar botones/inputs;
5. migrar overlays;
6. unificar loaders/errores;
7. revisar responsive;
8. validar accesibilidad;
9. probar custom branding;
10. comparar visualmente.

---

## 38. Antipatrones

No permitido:

- botones cuadrados sin razón;
- dropdown nativo visible con esquinas del sistema;
- texto blanco sobre accent sin contraste calculado;
- marco negro grueso alrededor del video;
- grandes bordes blancos exteriores;
- glow verde rectangular;
- anillos decorativos detrás del logo de auth;
- scrollbar visible en panel SofLIA vacío;
- inputs desalineados verticalmente;
- cards de diferentes alturas en el mismo grid;
- portadas con barras blancas;
- hero de distinta altura entre páginas hermanas;
- emojis como iconos;
- títulos cortados en tabs;
- paneles laterales con top distinto;
- múltiples loaders;
- spinner aislado como pantalla;
- tarjetas informativas redundantes;
- exceso de contadores;
- blur sobre blur;
- sombras negras duras;
- hover que contiene información inaccesible;
- acciones críticas solo por color;
- mobile como desktop encogido.

---

## 39. Checklist de diseño

### Fundamentos

- [ ] Usa Newsreader, Inter Tight e IBM Plex Sans en sus roles.
- [ ] Consume tokens semánticos.
- [ ] Modo claro y oscuro.
- [ ] Branding habilitado/deshabilitado.
- [ ] Contraste AA.

### Layout

- [ ] Contenedor correcto.
- [ ] Espaciado consistente.
- [ ] Simetría con páginas hermanas.
- [ ] Cards iguales.
- [ ] Sin regiones vacías accidentales.

### Controles

- [ ] Altura táctil.
- [ ] Radio correcto.
- [ ] Texto completo.
- [ ] Icono Lucide.
- [ ] Hover, active, focus, disabled y loading.

### Modales

- [ ] Overlay y blur correctos.
- [ ] Focus trap.
- [ ] Escape.
- [ ] Scroll interno.
- [ ] Mobile.
- [ ] Acción principal inequívoca.

### Responsive

- [ ] 320 px.
- [ ] 390 px.
- [ ] 768 px.
- [ ] 1024 px.
- [ ] 1440 px.
- [ ] safe areas.
- [ ] sin overflow horizontal.

### Contenido

- [ ] Sin labels redundantes.
- [ ] Microcopy accionable.
- [ ] Títulos sin recorte crítico.
- [ ] estados vacíos y errores útiles.

### Movimiento

- [ ] duración correcta.
- [ ] sin exceso.
- [ ] reduced motion.
- [ ] no causa layout shift.

### Rendimiento

- [ ] fuentes optimizadas.
- [ ] assets diferidos.
- [ ] imágenes con dimensiones.
- [ ] consultas no bloqueantes.
- [ ] blur limitado.

---

## 40. Checklist de QA visual

Cada entrega se compara en:

1. tema claro SofLIA;
2. tema oscuro SofLIA;
3. branding personalizado claro;
4. branding personalizado oscuro;
5. contenido corto;
6. contenido largo;
7. sin datos;
8. loading;
9. error;
10. teclado;
11. touch;
12. reduced motion.

Validar especialmente:

- texto de botones;
- dropdown abierto;
- modal con teclado virtual;
- focus;
- portadas;
- scrollbar;
- panel SofLIA;
- títulos de curso;
- z-index;
- safe area;
- contraste de gráficos.

---

## 41. Criterios de aceptación por componente

Un componente se considera listo cuando:

- representa correctamente su intención;
- no introduce un token nuevo sin necesidad;
- hereda branding;
- funciona en ambos temas;
- todos sus estados son visibles;
- no corta contenido esencial;
- es operable por teclado;
- no altera el layout al cargar;
- no duplica un patrón existente;
- está validado visualmente en mobile y desktop.

Una página se considera lista cuando:

- su tarea principal es evidente en cinco segundos;
- la navegación comparte el sistema;
- la jerarquía visual es consistente;
- no existe ruido informativo;
- loading, vacío y error están diseñados;
- el responsive no es una reducción mecánica;
- la personalización no rompe contraste.

---

## 42. Referencias de implementación

Componentes y módulos representativos:

- `apps/web/src/features/landing/components/home/SofliaHome.module.css`;
- `apps/web/src/app/auth/AuthPage.module.css`;
- `apps/web/src/features/landing/components/legal/LegalPage.module.css`;
- `apps/web/src/core/components/OrgNavbar/OrgNavbar.module.css`;
- `apps/web/src/core/components/UserDropdown/UserDropdown.module.css`;
- `apps/web/src/core/components/NotificationBell/NotificationBell.module.css`;
- `apps/web/src/core/components/LiaSidePanel/LiaSidePanel.module.css`;
- `apps/web/src/features/lia/components/personalization-settings/PersonalizationSettings.module.css`;
- `apps/web/src/features/profile/components/profile-page/ProfileExperience.module.css`;
- `apps/web/src/features/business-panel/components/business-user-analytics/BusinessUserAnalytics.module.css`;
- `apps/web/src/features/certificates/components/CertificateExperience.module.css`;
- `apps/web/src/features/notebook/components/NotebookExperience.module.css`;
- `apps/web/src/features/notebook/components/NotebookEditor.module.css`;
- `apps/web/src/features/courses/components/learn/LearnPageHeader.module.css`;
- `apps/web/src/features/courses/components/learn/sidebar/CourseSidebar.module.css`;
- `apps/web/src/features/courses/components/learn/video-content/VideoPanel.module.css`;
- `apps/web/src/core/components/CustomVideoPlayer/player/CustomVideoPlayerControls.module.css`;
- `apps/web/src/features/courses/components/learn/LessonSupplementaryContent.module.css`;
- `apps/web/src/features/courses/components/learn/ActivitiesExperience.module.css`;
- `apps/web/src/features/courses/components/learn/CommunityExperience.module.css`;
- `apps/web/src/features/courses/components/CourseLia/CourseLiaPanel.module.css`;
- `apps/web/src/core/components/PremiumLoadingScreen/PremiumLoadingScreen.module.css`;
- `apps/web/src/core/components/NotesModal/shared/NotesModalLayout.module.css`;
- `apps/web/src/app/_components/system-error/SystemErrorScene.module.css`;
- `apps/web/src/features/courses/components/learn/LearnPageValidationModal.module.css`.

---

## 43. Gobierno del sistema

### 43.1 Cambios

Todo cambio al sistema debe incluir:

- problema que resuelve;
- componente afectado;
- tokens nuevos o modificados;
- impacto en claro/oscuro;
- impacto en branding;
- impacto responsive;
- accesibilidad;
- migración.

### 43.2 Versionado

- **Major:** cambia fundamentos o rompe componentes.
- **Minor:** añade patrón o componente compatible.
- **Patch:** corrige valor, contraste o documentación.

### 43.3 Excepciones

Una excepción debe:

- quedar documentada;
- limitarse a una experiencia;
- preservar accesibilidad;
- no crear una segunda familia visual;
- tener plan de revisión.

---

## 44. Resumen normativo

La identidad SofLIA se reconoce por:

- Newsreader en títulos;
- Inter Tight en interacción;
- IBM Plex Sans en datos;
- Primary profundo y Accent turquesa;
- superficies claras u oscuras con profundidad sutil;
- radios generosos y coherentes;
- bordes de 1 px;
- sombras ambientales;
- blur controlado;
- iconos lineales;
- botones legibles con contraste calculado;
- dropdowns flotantes redondeados;
- modales centrados o laterales con estructura consistente;
- movimiento breve y funcional;
- páginas simétricas;
- personalización de marca segura;
- responsive diseñado;
- ausencia deliberada de ruido.

Si una interfaz se ve llamativa pero pierde claridad, no pertenece al sistema. Si es limpia pero genérica, aún no está terminada. El objetivo es una experiencia sobria, distintiva, humana y técnicamente precisa.
