# 🇬🇧 EOI Flashcards

Aplicación web de repaso de inglés con dos áreas principales: **flashcards de vocabulario** y **dashboard de writing C1**. Sin frameworks, sin dependencias, sin build tools — HTML + CSS + JS vanilla puro.

---

## ✨ Características

- **Dashboard** con todos los topics disponibles y su progreso acumulado
- **Sección Writing C1** con dashboard agrupado por familias, buscador, filtro por categoría y vista detalle con infografía
- **Dos modos de estudio** por sesión:
  - **Modo A** → Frente: término en inglés / Reverso: traducción + definición + ejemplos
  - **Modo B** → Frente: traducción en español / Reverso: término + definición + ejemplos
- **Orden aleatorio** en cada sesión (shuffle Fisher-Yates)
- **Repetición de falladas** — las tarjetas no acertadas se reinsertan al final de la cola hasta dominarlas todas
- **Estadísticas persistidas** en `localStorage`:
  - Aciertos y fallos globales y por topic
  - Desglose por término con barra de progreso visual
  - Reset por topic o global
- Diseño **responsive** y modo oscuro

---

## 🗂 Estructura del proyecto

```
eoi/
├── index.html          # Punto de entrada — SPA de una sola página
├── style.css           # Estilos (dark mode, flip 3D, responsive)
├── js/
│   ├── app.js          # Router principal y navegación
│   ├── study.js        # Lógica de sesión y flashcards
│   ├── stats.js        # Vista de estadísticas
│   └── writing.js      # Dashboard y detalle de writing C1
└── src/
    ├── money.json            # Topic: Money & Finance (y futuros topics aquí)
    ├── writing-skills.json   # Catálogo centralizado de writing C1
    └── writting/             # Infografías de writing
```

---

## 🚀 Cómo arrancar

Al ser HTML + JS puro, **necesitas un servidor local** (los módulos ES no funcionan con `file://`).

### Opción 1 — Python (sin instalar nada)
```bash
python3 -m http.server 3000
# Abre http://localhost:3000
```

### Opción 2 — Node.js (`npx`)
```bash
npx serve .
```

### Opción 3 — VS Code / JetBrains
Usa la extensión **Live Server** o el servidor integrado del IDE.

---

## ➕ Añadir un nuevo topic

1. Crea el archivo JSON en `src/<topic>.json` con la siguiente estructura:

```json
[
  {
    "id": "top-001",
    "term": "Word",
    "type": "noun",
    "definition": "Meaning of the word in English.",
    "translation": "Traducción",
    "examples": [
      "Example sentence using the word.",
      "Another example."
    ],
    "tags": ["optional", "tags"]
  }
]
```

2. Registra el topic en `js/app.js`, dentro del array `TOPICS_REGISTRY`:

```js
const TOPICS_REGISTRY = [
  { id: 'money',  label: 'Money & Finance', icon: '💰', file: 'src/money.json' },
  { id: 'travel', label: 'Travel',          icon: '✈️', file: 'src/travel.json' }, // ← nuevo
];
```

¡Listo! El topic aparecerá automáticamente en el dashboard.

---

## ✍️ Añadir o editar writings C1

Toda la información de la sección de writing está centralizada en `src/writing-skills.json`.

Cada skill sigue esta estructura:

```json
{
  "id": "opinion-essay",
  "title": "Opinion essay",
  "categoryId": "essays-argumentativos",
  "category": "Essays argumentativos",
  "shortDescription": "Ensayo formal donde se expresa una opinión clara y se apoya con razones y ejemplos.",
  "tags": ["essay", "opinion", "formal", "arguments"],
  "infographicUrl": "src/writting/13_opinion_essay.png"
}
```

Para añadir uno nuevo:

1. Añade la infografía a `src/writting/`
2. Añade la categoría si hace falta dentro de `categories`
3. Añade la skill a `skills`

El dashboard de writing se actualizará automáticamente con el buscador, el filtro y la vista detalle.

---

## 📊 Almacenamiento

Las estadísticas se guardan en `localStorage` bajo la clave `eoi_stats` con la siguiente forma:

```json
{
  "money": {
    "mon-001": { "pass": 5, "fail": 2 },
    "mon-002": { "pass": 3, "fail": 0 }
  }
}
```

---

## 🛣 Roadmap

- [ ] Más topics (Travel, Work, Technology, Phrasal Verbs…)
- [ ] Writing practice interactivo con checklist por tipo
- [ ] Modo gramática / fill-in-the-blank
- [ ] Historial de sesiones con fecha
- [ ] Exportar / importar estadísticas
- [ ] PWA (instalable en móvil)

