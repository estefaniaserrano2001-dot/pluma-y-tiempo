# Sistema de Múltiples Líneas de Tiempo Interactivas, Puntos Jerárquicos y Conexiones Luminosas

Modernización integral de la sección de Línea de Tiempo para permitir la creación y alternancia entre múltiples cronologías independientes (como los capítulos de un libro), con visualización nítida de hitos principales, sub-eventos secundarios integrados desplegables y conexiones en curvas bezier luminosas con etiquetas y direcciones claras en el lienzo interactivo.

### User Review & Critical Decisions

> [!IMPORTANT]
> **Decisiones confirmadas por el usuario en la fase de clarificación:**
> - **Organización de múltiples líneas de tiempo**: Se implementará una barra lateral y pestañas intercambiables análogas a la gestión de capítulos (`TimelineListSidebar` / `TimelineTabBar`).
> - **Visualización de hitos y subpuntos**: Los puntos principales contarán con una lista interna desplegable de sub-eventos secundarios con numeración, fechas relativas y estado visual.
> - **Estilo de conexiones interactivas**: Trazos curvos bezier luminosos con degradados de color temáticos, marcadores de flecha direccionales y etiquetas de relación legibles con soporte de interacción al pasar el cursor o pulsar.

---

### 1. Overview & Core Concept

- **Qué hace**: Permite a los autores crear, organizar y alternar entre distintas líneas de tiempo narrativas (ej. "Trama Principal", "Flashbacks y Precuela", "Cronología del Antagonista", "Subtrama Romántica"), cada una con sus propios hitos cronológicos, subpuntos anidados desplegables y un entramado de conexiones causales/temáticas renderizadas con alta claridad visual sobre un lienzo 2D interactivo con zoom, paneo y controles táctiles.
- **Audiencia objetivo**: Novelistas, guionistas y constructores de mundos que necesitan visualizar y controlar la coherencia temporal de eventos complejos sin saturación visual.
- **Valor clave**: Elimina la limitación de una cronología única y rígida, facilitando la exploración multidimensional del tiempo narrativo con claridad estética y ergonomía móvil/escritorio.

---

### 2. User Experience & Visual Design

#### A. Flujos de Usuario Principales
1. **Gestión y cambio de líneas temporales**:
   - En la barra lateral o barra superior de la sección, el usuario visualiza la lista de líneas temporales activas del libro, con su color identificativo, conteo de hitos y estado.
   - Puede pulsar "+ Nueva Línea de Tiempo" para crear una cronología (ej. "Arco de la Guerra Civil", "Línea Alternativa"), asignándole nombre, descripción y paleta.
   - Al seleccionar una línea de tiempo, el visor interactivo se enfoca en esa cronología de forma fluida.
2. **Visualización de Puntos y Subpuntos en el Lienzo**:
   - Los **Puntos Principales** se presentan como tarjetas e hitos con fecha/año visible, título destacado, categoría temática, indicador de importancia y un botón selector de subpuntos (`[ ▼ 3 sub-eventos ]`).
   - Al pulsar el botón desplegable, la tarjeta se expande suavemente revelando los subpuntos con su propia cronología interna, notas breves y badges de conexión.
   - Posibilidad de crear subpuntos directamente desde el hito principal.
3. **Conexiones Curvas Luminosas**:
   - Conexiones dinámicas renderizadas como caminos SVG cúbicos bezier suaves (`M x1 y1 C ... x2 y2`).
   - Efecto de resplandor sutil (glow filter) en armonía con la paleta de color activa (`bosque`, `oceano`, `atardecer`, `lavanda`, `nocturna`).
   - Flechas direccionales (`unidireccional`, `bidireccional`) y píldora flotante con la etiqueta de relación (ej. "Causa y consecuencia", "Revelación", "Contradicción").
4. **Ergonomía Táctil y de Escritorio**:
   - Barra de herramientas con controles rápidos de Zoom (+ / - / Ajustar vista al 100% / Centrar hitos).
   - Modo de pantalla completa y modo expandido para máxima concentración en portátiles y celulares.

#### B. Identidad Visual y Paleta
- **Canvas Base**: Fondo neutro de alta legibilidad (`stone-50` / `stone-900` en modo oscuro) con cuadrícula de puntos suave (*subtle dot grid*) para orientación espacial sin ruido.
- **Jerarquía Tipográfica**: Encabezados en `Cinzel` / `Lora`, títulos de nodos en `Plus Jakarta Sans` con peso semibold (600), cifras y fechas en números tabulares (`font-mono tabular-nums`).
- **Respeto a la Paleta Activa**: Los nodos principales y los resplandores de conexión adaptan sus colores principales y acentos de acuerdo a la paleta seleccionada del libro.

---

### 3. Key Product Decisions & Trade-Offs

- **Decisión 1: Estructura de Datos para Múltiples Líneas de Tiempo**:
  - *Enfoque*: Crear la entidad `TimelineTrack` (`id`, `bookId`, `title`, `description`, `color`, `order`, `isMain`, `createdAt`, `updatedAt`) persistida en IndexedDB (`timelineTracks`) y sincronizada con Firestore.
  - *Por qué*: Conserva la compatibilidad con eventos existentes mediante una migración automática transparente que asigna una "Línea Temporal Principal" por defecto a los eventos sin `timelineId`.
  - *Alternativa descartada*: Filtrar solo por etiquetas o carriles; no resolvía la petición de tratar las líneas de tiempo como unidades independientes al nivel de los capítulos.
- **Decisión 2: Despliegue de Subpuntos Integrados en Nodo**:
  - *Enfoque*: Tarjeta expandible en el lienzo con altura animada y recálculo reactivo de anclajes de conexión.
  - *Por qué*: Evita la maraña visual de cientos de nodos diminutos en pantalla mientras permite examinar detalles minuciosos al hacer clic.
- **Decisión 3: Renderizado SVG con Curvas Bezier y Filtros de Brillo**:
  - *Enfoque*: Capa SVG superpuesta sincronizada matemáticamente con la matriz de transformación del lienzo (`scale`, `translateX`, `translateY`).
  - *Por qué*: Garantiza 60 FPS, nitidez vectorial infinita en pantallas Retina y 4K, y soporte para eventos de ratón/toque sobre las conexiones.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                          BookWorkspace.tsx                             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                  ┌─────────────────┴─────────────────┐
                  ▼                                   ▼
      ┌───────────────────────┐           ┌───────────────────────┐
      │  TimelineListSidebar  │           │    TimelineModule     │
      │  (Selector & Gestión  │           │   (Visor Interactivo) │
      │   de Cronologías)     │           └───────────┬───────────┘
      └───────────────────────┘                       │
                                    ┌─────────────────┴─────────────────┐
                                    ▼                                   ▼
                        ┌───────────────────────┐           ┌───────────────────────┐
                        │  InteractiveCanvas2D  │           │   LuminousCurveLayer  │
                        │  (Nodos Principales & │           │   (SVG Bezier Paths,  │
                        │   Subpuntos Anidados) │           │   Arrows, Rel-Labels) │
                        └───────────────────────┘           └───────────────────────┘
                                    │                                   │
                                    └─────────────────┬─────────────────┘
                                                      ▼
                                        ┌───────────────────────────┐
                                        │  dbService (IndexedDB v4) │
                                        │  + timelineTracks Store   │
                                        │  + timelineEvents Store   │
                                        │  + timelineConnections   │
                                        └───────────────────────────┘
```

#### Modelo de Datos Extendido
```typescript
export interface TimelineTrack {
  id: string;
  bookId: string;
  title: string;
  description: string;
  color: string;
  icon?: string;
  order: number;
  isMain: boolean;
  createdAt: string;
  updatedAt: string;
}

// TimelineEvent se extiende con timelineTrackId opcional para retrocompatibilidad
export interface TimelineEvent {
  // ... campos existentes conservados intactos
  timelineTrackId?: string; // ID de la línea de tiempo a la que pertenece
  parentEventId?: string | null; // ID del hito principal si es subpunto
  orderInParent?: number;
  isExpanded?: boolean;
}
```

#### Fases de Ejecución:
1. **Base de Datos & Tipos**: Incorporar `TimelineTrack` en `src/types/index.ts` y añadir el almacén `timelineTracks` en `src/services/db.ts` con migración transparente para eventos existentes.
2. **Navegador de Líneas de Tiempo (Pestañas y Barra Lateral)**: Construir el selector de cronologías en `TimelineModule.tsx`, permitiendo alternar, añadir, editar y eliminar líneas temporales.
3. **Visor de Hitos Principales y Subpuntos**: Implementar el contenedor de eventos con tarjeta interactiva, botón desplegable de subpuntos, badges de estado y editor rápido de sub-eventos.
4. **Capa SVG de Conexiones Curvas Luminosas**: Trazado bezier adaptativo con degradados dinámicos, flechas de dirección y etiquetas de relación con resaltado al interactuar.
5. **Verificación & Pruebas**: Comprobar fluidez de paneo/zoom en computador y celular táctil, consistencia de datos y compilación con cero errores.
