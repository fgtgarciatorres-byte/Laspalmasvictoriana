/* RI Las Palmas · proto v3-visual · vapor + aluvión reportero + fondos */
(function () {
  "use strict";

  const STORAGE_KEY = "ri-las-palmas-proto-v3";

  const FACS = ["Puerto", "Gremios", "Iglesia", "Prensa", "Élites"];

  const AGENTS = {
    tato: {
      id: "tato",
      name: "Tomás «Tato» Medina",
      role: "Estibador / cabo de botes",
      traits: ["conoce el muelle", "desconfía de la élite", "habla poco con ingleses"],
      best: "Puerto/Gremios",
    },
    clara: {
      id: "clara",
      name: "Clara Ruiz",
      role: "Reportera aprendiz",
      traits: ["quiere titular", "lee Jable mental", "impaciente con el silencio"],
      best: "Prensa",
    },
    evelyn: {
      id: "evelyn",
      name: "Miss Evelyn Shaw",
      role: "Enlace consignataria británica",
      traits: ["habla inglés", "conoce AIDA a medias", "lealtad a la casa"],
      best: "Puerto/Élite",
    },
  };

  const PETITIONS = [
    {
      id: "puerto",
      faction: "Puerto",
      title: "Queja del vapor británico",
      body: "El S.S. Meridian denuncia carbón «corto»: sacos remojados o mezcla. La carbonera culpa a peones. Piden inspección discreta antes de zarpar.",
      tag: "Inventado",
      arc: "vapor",
    },
    {
      id: "gremios",
      faction: "Gremios",
      title: "Soldadas retenidas",
      body: "Estibadores hablan de médicas / soldadas retenidas y de AIDA entre casas. Quieren que alguien del muelle escuche sin policía.",
      tag: "Inventado",
      arc: "vapor",
    },
    {
      id: "prensa",
      faction: "Prensa",
      title: "Titular antes del cable",
      body: "Clara necesita un titular sobre el vapor y la luz del puerto. Prefiere contraste a rumor, pero el plazo aprieta.",
      tag: "Inventado",
      arc: "vapor",
    },
    {
      id: "aluvion",
      faction: "Prensa",
      title: "Memoria del aluvión",
      body: "La redacción pide a Clara una pieza sobre la noche de San Florencio (7–8 nov 1826). No es survival: es reportaje. Pregunta: ¿por qué el temporal empuja a mirar La Isleta?",
      tag: "Inventado+Dato",
      arc: "reportero",
    },
  ];

  const REP_LOCS = [
    {
      id: "guiniguada",
      name: "Guiniguada",
      desc: "Cauce · vegas · testimonio",
      art: "guiniguada",
      label: "Barranco Guiniguada · Vegueta",
    },
    {
      id: "santelmo",
      name: "San Telmo",
      desc: "Muelle viejo · mar de leva",
      art: "santelmo",
      label: "Muelle de San Telmo",
    },
    {
      id: "gabinete",
      name: "Gabinete / Archivo",
      desc: "Documento · mapa · Tenoya",
      art: "archivo",
      label: "Gabinete Literario · Archivo",
    },
    {
      id: "isleta",
      name: "Mirada a La Isleta",
      desc: "Abrigo · semilla La Luz",
      art: "isleta",
      label: "Istmo · Confital · hacia La Isleta",
    },
  ];


  const SCENE_BG = {
    muelle: "muelle",
    oficina: "oficina",
    archivo: "archivo",
    gabinete: "gabinete",
    guiniguada: "guiniguada",
    santelmo: "santelmo",
    isleta: "isleta",
    inspeccion: "inspeccion",
    plaza: "plaza",
  };

  const PORTRAITS = {
    nerea: "art/personajes/nerea_quintero.png",
    clara: "art/personajes/clara_ruiz.png",
    tato: "art/personajes/tato_medina.png",
    evelyn: "art/personajes/evelyn_shaw.png",
  };

  function portraitFor(who) {
    if (!who) return null;
    const w = String(who).toLowerCase();
    if (w.includes("nerea")) return PORTRAITS.nerea;
    if (w.includes("clara")) return PORTRAITS.clara;
    if (w.includes("tato") || w.includes("tomás") || w.includes("tomas")) return PORTRAITS.tato;
    if (w.includes("evelyn") || w.includes("miss")) return PORTRAITS.evelyn;
    return null;
  }

  function sceneArtHtml(key, label) {
    const k = SCENE_BG[key] || key || "muelle";
    return (
      '<div class="scene-art has-bg bg-' +
      escapeHtml(k) +
      '"><span class="scene-label">' +
      escapeHtml(label) +
      "</span></div>"
    );
  }

  function stageWrap(artKey, artLabel, innerHtml, opts) {
    const compact = opts && opts.compact;
    return (
      '<div class="stage' +
      (compact ? " stage-compact" : "") +
      '">' +
      sceneArtHtml(artKey, artLabel) +
      '<div class="stage-body">' +
      innerHtml +
      "</div></div>"
    );
  }

  function defaultState() {
    return {
      phase: "title",
      day: 1,
      factions: { Puerto: 0, Gremios: 0, Iglesia: 0, Prensa: 0, Élites: 0 },
      petition: null,
      arc: null, // "vapor" | "reportero"
      agent: null,
      visited: [],
      sampleCompared: false,
      sampleContrasted: false,
      publishChoice: null,
      outcome: null,
      debriefDone: false,
      archivo: [],
      sceneStep: 0,
      flags: {},
      // reportero
      repVisited: [],
      repClues: {},
      repContrasted: false,
      repHeadline: null, // "sobrio" | "sensacional" | "cifra" | "cajon"
      vaporDone: false,
      reporteroDone: false,
    };
  }

  let state = load() || defaultState();

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {}
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function reset() {
    state = defaultState();
    save();
    render();
  }

  /** ¿Hay partida reanudable en localStorage? (no cuenta phase title) */
  function hasResumableSave() {
    const s = load();
    if (!s || typeof s !== "object") return false;
    if (!s.phase || s.phase === "title") return false;
    return true;
  }

  /**
   * Vuelve a la portada SIN borrar el avance.
   * Guarda el punto actual y muestra el menú; «Continuar partida guardada» restaura.
   * No escribe phase=title en el slot de guardado.
   */
  function goToMenu() {
    save();
    renderTitle();
  }

  function bindChromeOnce() {
    const app = document.getElementById("app");
    if (!app || app.getAttribute("data-ri-chrome") === "1") return;
    app.setAttribute("data-ri-chrome", "1");
    app.addEventListener("click", (ev) => {
      const t = ev.target && ev.target.closest ? ev.target.closest("#btnMenu") : null;
      if (!t) return;
      ev.preventDefault();
      goToMenu();
    });
  }

  function adj(fac, n) {
    state.factions[fac] = (state.factions[fac] || 0) + n;
  }

  function addFicha(f) {
    if (state.archivo.some((x) => x.id === f.id)) return;
    state.archivo.push(f);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function chipHtml(list) {
    return (
      '<div class="chips">' +
      list
        .map((c) => '<span class="chip ' + c.c + '">' + escapeHtml(c.t) + "</span>")
        .join("") +
      "</div>"
    );
  }

  function topbarHtml(phaseLabel) {
    const facs = FACS.map((f) => {
      const v = state.factions[f] || 0;
      const cls = v > 0 ? "up" : v < 0 ? "down" : "";
      const sign = v > 0 ? "+" + v : String(v);
      return (
        '<span class="fac ' +
        cls +
        '">' +
        escapeHtml(f) +
        " <b>" +
        sign +
        "</b></span>"
      );
    }).join("");
    return (
      '<div class="topbar">' +
      '<div class="topbar-left">' +
      '<button type="button" class="btn-menu" id="btnMenu" title="Volver a la portada sin borrar el avance">Menú</button>' +
      '<div class="phase">' +
      escapeHtml(phaseLabel) +
      "</div></div>" +
      '<div class="factions">' +
      facs +
      "</div></div>"
    );
  }

  function dialogBar(who, text, options) {
    const opts = (options || [])
      .map(
        (o, i) =>
          '<button type="button" data-opt="' +
          i +
          '"' +
          (o.primary ? ' class="primary"' : "") +
          ">" +
          escapeHtml(o.label) +
          "</button>"
      )
      .join("");
    const portrait = portraitFor(who);
    const whoBlock = who
      ? '<div class="dialog-who">' + escapeHtml(who) + "</div>"
      : "";
    const copy =
      '<div class="dialog-copy">' +
      whoBlock +
      '<div class="dialog-text">' +
      escapeHtml(text) +
      "</div></div>";
    const row = portrait
      ? '<div class="dialog-row"><img class="dialog-portrait" src="' +
        portrait +
        '" alt="" width="56" height="56" />' +
        copy +
        "</div>"
      : '<div class="dialog-row">' + copy + "</div>";
    return (
      '<div class="dialog-bar" id="dialogBar">' +
      row +
      '<div class="dialog-options">' +
      opts +
      "</div></div>"
    );
  }

  function bindDialog(options) {
    const bar = document.getElementById("dialogBar");
    if (!bar) return;
    bar.querySelectorAll("[data-opt]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const i = Number(btn.getAttribute("data-opt"));
        const opt = options[i];
        if (opt && opt.fn) opt.fn();
      });
    });
  }

  function markVisit(id) {
    if (!state.visited.includes(id)) state.visited.push(id);
  }

  function markRep(id) {
    if (!state.repVisited.includes(id)) state.repVisited.push(id);
  }

  function hasDocClue() {
    const c = state.repClues;
    return !!(c.santelmo || c.tenoya || c.parte);
  }

  /** Unexpected Outcomes vapor — first-match */
  function resolveOutcomeVapor() {
    const g = state.factions.Gremios || 0;
    const p = state.factions.Puerto || 0;
    const agent = state.agent;
    const contrasted = state.sampleContrasted;
    const publish = state.publishChoice === "publish";

    if (g >= 1 && agent === "tato" && contrasted) {
      return {
        id: "cabo",
        title: "El cabo habla en voz alta",
        body: "Tato confirma la humedad irregular delante de peones. Sale una lista informal de soldadas. El muelle escucha; la carbonera aprieta los dientes.",
        deltas: { Gremios: 1, Puerto: -1 },
        causal:
          "Porque asignaste a quien conoce el muelle y contrastaste la muestra, el rumor dejó de ser solo Hipótesis.",
        ficha: {
          id: "soldadas",
          title: "Lista de soldadas (muelle)",
          tag: "Hipótesis→Documento",
          chips: [
            { t: "Documento", c: "doc" },
            { t: "Inventado", c: "inv" },
          ],
        },
      };
    }
    if (agent === "evelyn" && p >= 1 && state.publishChoice === "silence") {
      return {
        id: "arreglo",
        title: "Arreglo en la oficina",
        body: "Evelyn traduce y cierra puertas. La consignataria ofrece reposición sin titular. El rumor pasa al Cajón como Hipótesis.",
        deltas: { Puerto: 1, Élites: 1, Gremios: -1 },
        causal:
          "Porque priorizaste acceso inglés y silencio, el Puerto gana tiempo; los gremios pierden altavoz.",
        ficha: {
          id: "cajon",
          title: "Rumor en el Cajón",
          tag: "Hipótesis",
          chips: [{ t: "Hipótesis", c: "hip" }],
        },
      };
    }
    if (agent === "clara" && publish && !contrasted) {
      return {
        id: "titular",
        title: "Titular sin fuente",
        body: "Clara publica «Carbón mojado en La Luz». Suena fuerte; no hay ficha Documento que lo sostenga. La élite se molesta; la prensa propia se quema.",
        deltas: { Prensa: -2, Élites: -1 },
        causal:
          "Publicar sin elevar la muestra a Documento convierte el titular en chip Inventado caro.",
        ficha: {
          id: "titular-inv",
          title: "Titular sin fuente",
          tag: "Inventado",
          chips: [{ t: "Inventado", c: "inv" }],
        },
      };
    }
    if (!state.sampleCompared) {
      return {
        id: "plazo",
        title: "El vapor zarpó a media luz",
        body: "El Meridian leva anclas sin inspección útil. Queda una huella: el muelle se siente a oscuras una noche. El caso queda abierto.",
        deltas: { Puerto: -1 },
        causal: "Sin visita con craft de muestra, el plazo del vapor gana — huella, no game over.",
        ficha: {
          id: "huella",
          title: "Huella: vapor sin contraste",
          tag: "Inventado",
          chips: [{ t: "Inventado", c: "inv" }],
        },
      };
    }
    if (publish && contrasted) {
      return {
        id: "A",
        title: "Transparencia a media luz",
        body: "Publicas el contraste: humedad irregular + contexto de soldadas. Gana la prensa seria y los gremios; el Puerto cede un poco.",
        deltas: { Prensa: 1, Gremios: 1, Puerto: -1 },
        causal:
          "Contrastar antes de titular abre puertas obreras y cierra comodidad consignataria.",
        ficha: {
          id: "aida",
          title: "Nota AIDA / competencia carboneras",
          tag: "Documento (contexto)",
          chips: [
            { t: "Documento", c: "doc" },
            { t: "Inventado", c: "inv" },
          ],
        },
      };
    }
    return {
      id: "B",
      title: "Silencio negociado",
      body: "Guardas el contraste en el Cajón. La casa británica respira; gremios y prensa pierden el instante.",
      deltas: { Puerto: 1, Élites: 1, Gremios: -1, Prensa: -1 },
      causal: "El silencio compra acceso élite a costa de voz en el muelle.",
      ficha: {
        id: "silencio",
        title: "Acuerdo tácito (Cajón)",
        tag: "Hipótesis",
        chips: [{ t: "Hipótesis", c: "hip" }],
      },
    };
  }

  /** Unexpected Outcomes reportero — first-match */
  function resolveOutcomeReportero() {
    const n = state.repVisited.length;
    const doc = hasDocClue() && state.repContrasted;
    const h = state.repHeadline;

    if (n >= 3 && doc && h === "sobrio") {
      return {
        id: "semilla",
        title: "Titular sobrio: la semilla del puerto",
        body: "Clara firma: el temporal no pide espectáculo; pide abrigo. San Telmo muestra límites; La Isleta gana la mirada. Décadas después, La Luz (1883) — y el muelle donde hoy vive el carbón.",
        deltas: { Prensa: 2, Élites: 1 },
        causal:
          "≥3 lugares + Documento contrastado + titular sin cifra inventada = pedagogía del puerto.",
        ficha: {
          id: "isleta-luz",
          title: "San Telmo → La Isleta → La Luz",
          tag: "Ya contrastado",
          chips: [
            { t: "Dato", c: "dato" },
            { t: "Documento", c: "doc" },
            { t: "Ya contrastado", c: "ya" },
          ],
        },
      };
    }
    if (h === "cifra") {
      return {
        id: "coste",
        title: "Coste de inventar",
        body: "El Archivo no sostiene un número de muertos «en la ciudad» que nadie documentó aquí. El titular miente por precisión falsa. Clara lo sabe al día siguiente.",
        deltas: { Prensa: -2, Élites: -1, Iglesia: -1 },
        causal: "Inventar cifra local de víctimas viola la regla de respeto y quema credibilidad.",
        ficha: {
          id: "cifra-rechazada",
          title: "Cifra local rechazada",
          tag: "Inventado (rechazado)",
          chips: [{ t: "Inventado", c: "inv" }],
        },
      };
    }
    if (h === "sensacional" && !doc) {
      return {
        id: "sensacional",
        title: "Memoria sensacionalista",
        body: "«La noche que se tragó la ciudad» vende. Sin Documento, el rumor «San Telmo basta» y el miedo se mezclan. La élite cierra puertas; la prensa seria mira a otro lado.",
        deltas: { Prensa: -1, Élites: -1 },
        causal: "Titular fuerte sin elevar pista a Documento = chip caro.",
        ficha: {
          id: "rumor-san-telmo",
          title: "Rumor: San Telmo basta",
          tag: "Hipótesis",
          chips: [{ t: "Hipótesis", c: "hip" }],
        },
      };
    }
    if (h === "cajon") {
      return {
        id: "cajon-mem",
        title: "Memoria en el cajón",
        body: "El legajo vuelve al cajón del Gabinete. Nadie se molesta. Nadie aprende por qué La Luz no nació en San Telmo.",
        deltas: { Prensa: -1, Élites: 1 },
        causal: "No publicar compra comodidad élite a costa de memoria pública.",
        ficha: {
          id: "memoria-cajon",
          title: "Memoria del aluvión (Cajón)",
          tag: "Hipótesis / abierto",
          chips: [{ t: "Hipótesis", c: "hip" }],
        },
      };
    }
    return {
      id: "media-tinta",
      title: "Nota a media tinta",
      body: "Sale una nota breve: hubo temporal; hubo daños; la Isleta se nombra sin hilo causal claro. Queda huella para releer con Archivo.",
      deltas: { Prensa: 1 },
      causal: "Investigación incompleta o contraste flojo: una sola carta tibia.",
      ficha: {
        id: "nota-parcial",
        title: "Nota parcial 1826",
        tag: "Hipótesis",
        chips: [
          { t: "Hipótesis", c: "hip" },
          { t: "Dato", c: "dato" },
        ],
      },
    };
  }

  function applyOutcome(o) {
    state.outcome = o;
    Object.entries(o.deltas || {}).forEach(([k, v]) => adj(k, v));
    if (o.ficha) addFicha(o.ficha);
  }

  /* ---------- SCREENS ---------- */

  function renderTitle() {
    const app = document.getElementById("app");
    const resumable = hasResumableSave();
    const saved = resumable ? load() : null;
    const resumeHint = resumable
      ? '<p class="scroll-hint" id="resumeHint">Avance guardado en: <strong>' +
        escapeHtml(saved.phase) +
        "</strong>. Pulsa <strong>Continuar partida guardada</strong> para volver ahí sin perderlo. «Comenzar Día 1» / «Reiniciar» sí sustituyen la partida.</p>"
      : "";
    app.innerHTML =
      '<div class="stage title-wrap">' +
      sceneArtHtml("muelle", "Puerto de La Luz · ~1910") +
      '<div class="stage-body">' +
      "<h1>Estación carbonera</h1>" +
      '<div class="tagline">Las Palmas · sin violencia · Archivo con etiquetas</div>' +
      '<p class="sub">Proto v3 visual · Día 1<br>Favor vapor <strong>o</strong> caso reportero <em>Memoria del aluvión</em></p>' +
      resumeHint +
      '<button type="button" class="primary" id="btnStart" style="width:100%">Comenzar Día 1</button>' +
      (resumable
        ? '<button type="button" id="btnContinue" class="primary" style="width:100%;margin-top:8px">Continuar partida guardada</button>'
        : "") +
      '<button type="button" id="btnReset" style="width:100%;margin-top:8px">Reiniciar</button>' +
      '<p class="progress-note">Hub nocturno: Gabinete Literario · Aluvión = caso jugable (Clara lead) · sin survival. Desde el juego: botón <strong>Menú</strong> (arriba) vuelve aquí sin borrar el avance.</p>' +
      "</div></div>";
    document.getElementById("btnStart").onclick = () => {
      state = defaultState();
      state.phase = "audiencia";
      save();
      render();
    };
    const c = document.getElementById("btnContinue");
    if (c)
      c.onclick = () => {
        state = load() || defaultState();
        if (state.phase === "title") state.phase = "audiencia";
        save();
        render();
      };
    document.getElementById("btnReset").onclick = reset;
  }

  function renderAudiencia() {
    markVisit("vegueta");
    const app = document.getElementById("app");
    const cards = PETITIONS.map(
      (p) =>
        '<button type="button" class="choice card petition" data-pet="' +
        p.id +
        '"><div class="meta">' +
        escapeHtml(p.faction) +
        " · [" +
        escapeHtml(p.tag) +
        "] · arco " +
        escapeHtml(p.arc) +
        '</div><strong>' +
        escapeHtml(p.title) +
        "</strong><div class=\"lede\" style=\"margin:6px 0 0\">" +
        escapeHtml(p.body) +
        "</div></button>"
    ).join("");
    app.innerHTML =
      topbarHtml("Día 1 · Mañana · Audiencia") +
      stageWrap(
        "inspeccion",
        "Portal de Inspección · Vegueta",
        "<h2>Audiencia</h2>" +
      '<p class="lede">Eres Nerea Quintero, auxiliar civil de Inspección [Inventado]. Elige <strong>una</strong> petición. Si eliges <em>Memoria del aluvión</em>, Clara toma el lead del reportaje.</p>' +
      '<p class="scroll-hint">Desliza hacia abajo si no ves las 4 peticiones: la última es <strong>Memoria del aluvión</strong>.</p>' +
      '<div class="petition-list" id="petitionList">' +
      cards +
      "</div>",
        { compact: true }
      ) +
      dialogBar("Nerea", "Hoy un solo hilo. ¿Carbón vivo o memoria de 1826?", [
        { label: "(Elige una petición arriba)", primary: false },
      ]);

    app.querySelectorAll("[data-pet]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-pet");
        const pet = PETITIONS.find((x) => x.id === id);
        state.petition = id;
        state.arc = pet.arc;
        if (id === "puerto") adj("Puerto", 1);
        if (id === "gremios") adj("Gremios", 1);
        if (id === "prensa") adj("Prensa", 1);
        if (id === "aluvion") adj("Prensa", 1);
        if (pet.arc === "reportero") {
          state.agent = "clara";
          state.phase = "rep_brief";
        } else {
          state.phase = "mapa";
        }
        save();
        render();
      });
    });
  }

  function renderMapa() {
    const app = document.getElementById("app");
    const places = [
      {
        id: "vegueta",
        name: "Vegueta",
        desc: "Inspección · élite",
        go: () => {
          markVisit("vegueta");
          save();
          flashHint("Ya viniste de la audiencia. El favor espera en el Puerto.");
        },
      },
      {
        id: "triana",
        name: "Triana",
        desc: "Comercio · Gabinete (noche)",
        go: () => {
          markVisit("triana");
          save();
          flashHint("De día el Gabinete espera la noche. Ahora: Puerto.");
        },
      },
      {
        id: "puerto",
        name: "Puerto / Sta. Catalina",
        desc: "Carboneras · vapor",
        go: () => {
          markVisit("puerto");
          state.phase = "agente";
          save();
          render();
        },
      },
      {
        id: "istmo",
        name: "Istmo",
        desc: "Tranvía · atajo",
        go: () => {
          markVisit("istmo");
          markVisit("puerto");
          state.phase = "agente";
          state.flags.tranvia = true;
          save();
          render();
        },
      },
    ];
    const grid = places
      .map(
        (p) =>
          '<button type="button" data-place="' +
          p.id +
          '"' +
          (state.visited.includes(p.id) ? ' class="here"' : "") +
          "><strong>" +
          escapeHtml(p.name) +
          "</strong><span>" +
          escapeHtml(p.desc) +
          "</span></button>"
      )
      .join("");
    app.innerHTML =
      topbarHtml("Día 1 · Mapa") +
      stageWrap(
        "plaza",
        "Plaza Triana · tránsito",
        "<h2>¿Adónde vas?</h2>" +
      '<p class="lede">Favor: <strong>' +
      escapeHtml(PETITIONS.find((x) => x.id === state.petition).title) +
      "</strong>. Visita el Puerto (o Istmo) para el caso del vapor.</p>" +
      '<div class="map-grid" id="mapGrid">' +
      grid +
      "</div>" +
      '<p class="progress-note" id="mapHint"></p>'
      );

    function flashHint(t) {
      const h = document.getElementById("mapHint");
      if (h) h.textContent = t;
      app.querySelectorAll("[data-place]").forEach((b) => {
        if (state.visited.includes(b.getAttribute("data-place"))) b.classList.add("here");
      });
    }
    const optFns = [
      {
        label: "Recordar: el caso está en el muelle",
        primary: true,
        fn: () => flashHint("Abre Puerto / Santa Catalina o Istmo."),
      },
    ];
    app.insertAdjacentHTML(
      "beforeend",
      dialogBar("Nerea", "Sin combate: solo credencial, favores y Archivo.", optFns)
    );
    bindDialog(optFns);
    app.querySelectorAll("[data-place]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-place");
        const place = places.find((p) => p.id === id);
        if (place) place.go();
      });
    });
  }

  function renderAgente() {
    const app = document.getElementById("app");
    const list = ["tato", "clara", "evelyn"]
      .map((id) => {
        const a = AGENTS[id];
        return (
          '<button type="button" class="choice card agent" data-agent="' +
          id +
          '"><div class="meta">' +
          escapeHtml(a.role) +
          " · mejor: " +
          escapeHtml(a.best) +
          "</div><strong>" +
          escapeHtml(a.name) +
          "</strong><div class=\"lede\" style=\"margin:6px 0 0\">Traits: " +
          escapeHtml(a.traits.join(" · ")) +
          "</div></button>"
        );
      })
      .join("");
    app.innerHTML =
      topbarHtml("Día 1 · Asignar agente") +
      stageWrap(
        "muelle",
        "Muelle · La Luz",
        "<h2>¿Quién te acompaña?</h2>" +
      '<p class="lede">Unexpected Outcomes first-match. Sor Inés y el Dr. Alemán fuera de este favor corto.</p>' +
      list
      );
    app.querySelectorAll("[data-agent]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.agent = btn.getAttribute("data-agent");
        state.phase = "escena1";
        state.sceneStep = 0;
        save();
        render();
      });
    });
  }

  function renderEscena1() {
    const a = AGENTS[state.agent];
    const app = document.getElementById("app");
    const line =
      state.agent === "evelyn"
        ? "Evelyn habla con el capataz en inglés. Os dejan pasar a la gabarra de muestra."
        : state.agent === "tato"
          ? "Tato asiente al cabo de botes. Os abren un hueco entre sacos sin hacer ruido."
          : "Clara anota nombres. El capataz se tensa, pero tu credencial de Inspección basta.";
    const opts = [
      {
        label: "Comparar humedad y peso de dos sacos",
        primary: true,
        fn: () => {
          state.sampleCompared = true;
          state.phase = "escena2";
          save();
          render();
        },
      },
      {
        label: "Marcharte sin muestra (arriesgar plazo)",
        fn: () => {
          state.sampleCompared = false;
          state.phase = "decision";
          save();
          render();
        },
      },
    ];
    const who1 =
      state.agent === "tato"
        ? "Tato"
        : state.agent === "clara"
          ? "Clara"
          : state.agent === "evelyn"
            ? "Evelyn"
            : "Nerea";
    app.innerHTML =
      topbarHtml("Caso · Escena 1") +
      stageWrap(
        "muelle",
        "Carbonera / gabarra · La Luz",
        "<h2>El vapor que no quería luz</h2>" +
      chipHtml([
        { t: "Inventado", c: "inv" },
        { t: "Contexto Dato 1910", c: "dato" },
      ]) +
      '<div class="card"><div class="meta">Agente</div><strong>' +
      escapeHtml(a.name) +
      "</strong><p class=\"lede\" style=\"margin:6px 0 0\">" +
      escapeHtml(line) +
      "</p></div>"
      ) +
      dialogBar(who1, "¿Pesamos o nos vamos?", opts);
    bindDialog(opts);
  }

  function renderEscena2() {
    const app = document.getElementById("app");
    const opts = [
      {
        label: "Contrastar con testimonio / recorte (elevar a Documento)",
        primary: true,
        fn: () => {
          state.sampleContrasted = true;
          addFicha({
            id: "muestra",
            title: "Muestra de carbón (humedad irregular)",
            tag: "Documento",
            chips: [
              { t: "Documento", c: "doc" },
              { t: "Inventado", c: "inv" },
            ],
          });
          state.phase = "decision";
          save();
          render();
        },
      },
      {
        label: "Quedarte solo con la Hipótesis de la báscula",
        fn: () => {
          state.sampleContrasted = false;
          addFicha({
            id: "muestra-hip",
            title: "Muestra sin contraste",
            tag: "Hipótesis",
            chips: [{ t: "Hipótesis", c: "hip" }],
          });
          state.phase = "decision";
          save();
          render();
        },
      },
    ];
    app.innerHTML =
      topbarHtml("Caso · Escena 2") +
      stageWrap(
        "muelle",
        "Báscula improvisada · carbonera",
        "<h2>Craft: dos sacos</h2>" +
      '<div class="craft-row">' +
      '<div class="sample wet"><strong>Saco A</strong><br>Más pesado · olor a humedad<br><span class="chip hip">Hipótesis</span></div>' +
      '<div class="sample dry"><strong>Saco B</strong><br>Peso seco · polvo fino<br><span class="chip hip">Hipótesis</span></div>' +
      "</div>" +
      '<p class="lede">La báscula sugiere irregularidad, no culpables. Sin testimonio o recorte, no sube a Documento.</p>'
      ) +
      dialogBar(
        "Nerea",
        state.agent === "tato"
          ? "Tato puede hablar con peones si se lo pides."
          : state.agent === "clara"
            ? "Clara tiene un recorte de enero 1910 sobre soldadas — si contrastas."
            : "Evelyn puede pedir la hoja de la casa — o no.",
        opts
      );
    bindDialog(opts);
  }

  function renderDecision() {
    const app = document.getElementById("app");
    if (!state.sampleCompared) {
      state.publishChoice = "silence";
      const o = resolveOutcomeVapor();
      applyOutcome(o);
      state.phase = "outcome";
      save();
      render();
      return;
    }
    const opts = [
      {
        label: "Publicar lo que tengas (titular / nota)",
        primary: true,
        fn: () => {
          state.publishChoice = "publish";
          const o = resolveOutcomeVapor();
          applyOutcome(o);
          state.phase = "outcome";
          save();
          render();
        },
      },
      {
        label: "Silencio negociado (Cajón)",
        fn: () => {
          state.publishChoice = "silence";
          const o = resolveOutcomeVapor();
          applyOutcome(o);
          state.phase = "outcome";
          save();
          render();
        },
      },
    ];
    const decArt = state.agent === "evelyn" ? "oficina" : "plaza";
    const decLabel =
      state.agent === "evelyn" ? "Oficina consignataria" : "Antes del cable · Triana";
    app.innerHTML =
      topbarHtml("Caso · Decisión") +
      stageWrap(
        decArt,
        decLabel,
        "<h2>¿Qué haces con lo hallado?</h2>" +
      '<p class="lede">Muestra comparada: <strong>sí</strong>. Contrastada: <strong>' +
      (state.sampleContrasted ? "sí" : "no") +
      "</strong>. Agente: <strong>" +
      escapeHtml(AGENTS[state.agent].name) +
      "</strong>.</p>" +
      '<p class="progress-note">Unexpected Outcomes: una sola carta (first-match).</p>'
      ) +
      dialogBar("Nerea", "Una decisión. Una carta.", opts);
    bindDialog(opts);
  }

  function renderOutcome() {
    const o = state.outcome;
    const app = document.getElementById("app");
    const deltas = Object.entries(o.deltas || {})
      .map(([k, v]) => k + (v > 0 ? " +" : " ") + v)
      .join(" · ");
    const nextPhase = state.arc === "reportero" ? "fin" : "debrief";
    const nextLabel =
      state.arc === "reportero" ? "Cerrar arco / Archivo" : "Ir al debrief";
    const opts = [
      {
        label: nextLabel,
        primary: true,
        fn: () => {
          if (state.arc === "reportero") {
            state.reporteroDone = true;
            state.phase = "fin";
          } else {
            state.phase = "debrief";
          }
          save();
          render();
        },
      },
    ];
    const outArt =
      o.id === "arreglo" ? "oficina" : state.arc === "reportero" ? "archivo" : "muelle";
    const outLabel =
      o.id === "arreglo"
        ? "Oficina consignataria"
        : state.arc === "reportero"
          ? "Archivo · contraste"
          : "Carta del caso";
    app.innerHTML =
      topbarHtml("Unexpected Outcome") +
      stageWrap(
        outArt,
        outLabel,
        '<div class="card outcome"><div class="meta">Carta única · first-match</div><h2>' +
      escapeHtml(o.title) +
      "</h2><p>" +
      escapeHtml(o.body) +
      '</p><p class="progress-note">' +
      escapeHtml(deltas) +
      "</p></div>" +
      '<div class="causal">' +
      escapeHtml(o.causal) +
      "</div>"
      ) +
      dialogBar(null, "El Archivo guarda la ficha.", opts);
    bindDialog(opts);
  }

  function renderDebrief() {
    const o = state.outcome;
    const app = document.getElementById("app");
    const opts = [
      {
        label: "Anochecer · Gabinete Literario",
        primary: true,
        fn: () => {
          state.debriefDone = true;
          state.vaporDone = true;
          state.phase = "noche";
          markVisit("triana");
          save();
          render();
        },
      },
    ];
    app.innerHTML =
      topbarHtml("Día 1 · Debrief") +
      stageWrap(
        "inspeccion",
        "Debrief · Inspección",
        "<h2>Cierre del favor</h2>" +
      '<div class="card"><strong>' +
      escapeHtml(o.title) +
      "</strong><div class=\"causal\">" +
      escapeHtml(o.causal) +
      "</div></div>" +
      '<p class="lede">De noche, en el Gabinete, puedes abrir el <strong>caso reportero</strong> del Aluvión (ya no es solo una ficha de lectura).</p>'
      ) +
      dialogBar("Nerea", "La noche cae sobre Triana.", opts);
    bindDialog(opts);
  }

  function renderNoche() {
    const app = document.getElementById("app");
    const fichas = state.archivo
      .map(
        (f) =>
          '<div class="card"><div class="meta">' +
          escapeHtml(f.tag || "") +
          "</div><strong>" +
          escapeHtml(f.title) +
          "</strong>" +
          chipHtml(f.chips || []) +
          "</div>"
      )
      .join("") || '<p class="lede">Aún no hay fichas del caso.</p>';
    const opts = [];
    if (!state.reporteroDone) {
      opts.push({
        label: "Abrir caso reportero: Memoria del aluvión",
        primary: true,
        fn: () => {
          state.arc = "reportero";
          state.agent = "clara";
          state.petition = "aluvion";
          state.phase = "rep_brief";
          state.outcome = null;
          save();
          render();
        },
      });
    }
    opts.push({
      label: state.reporteroDone ? "Cerrar el arco" : "Cerrar el arco (sin reportaje 1826)",
      fn: () => {
        state.phase = "fin";
        save();
        render();
      },
    });
    app.innerHTML =
      topbarHtml("Día 1 · Noche · Gabinete") +
      stageWrap(
        "gabinete",
        "Gabinete Literario · terraza Triana · 1844 [Dato]",
        "<h2>Archivo</h2>" +
      '<p class="lede">Clara puede tomar el lead: investigar 1826 como reportaje (Guiniguada, San Telmo, Archivo, Isleta). Sin survival. Sin cuerpos.</p>' +
      "<h3>Fichas</h3>" +
      fichas
      ) +
      dialogBar(
        "Clara Ruiz",
        "La pregunta no es cuántos muertos inventamos. Es por qué miramos La Isleta.",
        opts
      );
    bindDialog(opts);
  }

  /* ----- REPORTERO ----- */

  function renderRepBrief() {
    markVisit("triana");
    const app = document.getElementById("app");
    const opts = [
      {
        label: "Abrir mapa de investigación",
        primary: true,
        fn: () => {
          state.phase = "rep_mapa";
          save();
          render();
        },
      },
    ];
    app.innerHTML =
      topbarHtml("Reportaje · Brief") +
      stageWrap(
        "gabinete",
        "Clara lead · Nerea colabora · Gabinete",
        "<h2>Memoria del aluvión</h2>" +
      chipHtml([
        { t: "Inventado", c: "inv" },
        { t: "Dato 7–8 nov 1826", c: "dato" },
      ]) +
      '<div class="card"><strong>Pregunta central</strong><p class="lede" style="margin:6px 0 0">¿Por qué el temporal de 1826 empuja a mirar La Isleta (y no solo a reparar San Telmo)?</p></div>' +
      '<p class="lede">Visita al menos <strong>3</strong> lugares. Contrastar rumor vs documento. Luego titular — una sola carta Unexpected Outcome.</p>' +
      '<p class="progress-note">Respeto: sin cuerpos, sin survival, sin inventar muertos de la ciudad. 1826→Isleta→La Luz = hipótesis multicausal, no cadena afirmada.</p>'
      ) +
      dialogBar("Clara", "No vamos a la tormenta. Vamos a los papeles y al terreno.", opts);
    bindDialog(opts);
  }

  function renderRepMapa() {
    const app = document.getElementById("app");
    const n = state.repVisited.length;
    const canClose = n >= 3;
    const grid = REP_LOCS.map((p) => {
      const done = state.repVisited.includes(p.id);
      return (
        '<button type="button" data-reploc="' +
        p.id +
        '"' +
        (done ? ' class="here"' : "") +
        "><strong>" +
        escapeHtml(p.name) +
        (done ? " ✓" : "") +
        "</strong><span>" +
        escapeHtml(p.desc) +
        "</span></button>"
      );
    }).join("");
    const opts = [];
    if (canClose) {
      opts.push({
        label: "Contrastar pistas y decidir titular",
        primary: true,
        fn: () => {
          state.phase = "rep_contrast";
          save();
          render();
        },
      });
    } else {
      opts.push({
        label: "Necesitas ≥3 lugares (" + n + "/3)",
        primary: false,
        fn: null,
      });
    }
    app.innerHTML =
      topbarHtml("Reportaje · Mapa (" + n + "/3+)") +
      stageWrap(
        "plaza",
        "Investigación · sin reloj de survival",
        "<h2>¿Adónde investigáis?</h2>" +
      '<p class="lede">Clara anota en cuaderno. Nerea abre puertas. Cada lugar da una pista con etiqueta de certeza.</p>' +
      '<div class="map-grid">' +
      grid +
      "</div>"
      ) +
      dialogBar("Clara", canClose ? "Con tres lugares ya puedo contrastar." : "Aún nos faltan lugares.", opts);
    bindDialog(opts);
    app.querySelectorAll("[data-reploc]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.phase = "rep_loc";
        state.flags.repLoc = btn.getAttribute("data-reploc");
        save();
        render();
      });
    });
  }

  function renderRepLoc() {
    const id = state.flags.repLoc;
    const loc = REP_LOCS.find((x) => x.id === id) || REP_LOCS[0];
    const app = document.getElementById("app");
    let title = loc.name;
    let body = "";
    let chips = [];
    let clueKey = id;
    let who = "Clara";
    let line = "";

    if (id === "guiniguada") {
      title = "Guiniguada";
      body =
        "Una vecina mayor (anonimizada) recuerda lo que le contaron: el barranco bajó negro de lama; la vega quedó herida. No hay cuerpos en escena — solo el cauce y la memoria oral.\n\nAncla histórica: riada del Guiniguada y daños en vegas [Dato]. El testimonio concreto es [Inventado].";
      chips = [
        { t: "Inventado (oral)", c: "inv" },
        { t: "Dato (riada)", c: "dato" },
      ];
      line = "Anoto el testimonio. Sin convertirlo en cifra.";
      state.repClues.guiniguada = true;
    } else if (id === "santelmo") {
      title = "San Telmo";
      body =
        "El muelle de San Telmo (obras 1811–1813) [Dato] aguanta el día bueno. Con mar de leva y borrasca, el fondeo muestra límites: mar de reboso, abrigo insuficiente.\n\nRumor oído al pasar: «San Telmo basta si el tiempo mejora.» → queda como [Hipótesis] hasta contrastar.";
      chips = [
        { t: "Dato / Documento", c: "doc" },
        { t: "Rumor = Hipótesis", c: "hip" },
      ];
      line = "Límites del muelle viejo: esto va al Archivo.";
      state.repClues.santelmo = true;
      state.repClues.rumor = true;
      who = "Nerea";
    } else if (id === "gabinete") {
      title = "Archivo del Gabinete";
      body =
        "Legajo: puente de Tenoya (1824) con ojo derribado por la fuerza del agua [Dato]. Paráfrasis de partes: Canarias entera golpeada; en Las Palmas, daños materiales graves sin la magnitud demográfica de Tenerife [Documento / síntesis].\n\nCifra exacta de muertos en la ciudad = [Pendiente]. No se inventa.\n\nRachas 120–150 km/h o >500 mm = [Hipótesis] de reconstrucción.";
      chips = [
        { t: "Documento", c: "doc" },
        { t: "Dato Tenoya", c: "dato" },
        { t: "Hipótesis (mm/km/h)", c: "hip" },
      ];
      line = "Tenoya y el parte suben a Documento. La cifra local no.";
      state.repClues.tenoya = true;
      state.repClues.parte = true;
      markVisit("triana");
      who = "Archivero";
    } else {
      title = "Mirada a La Isleta";
      body =
        "Desde el istmo se entiende el abrigo al norte. Décadas después: obras del Puerto de La Luz (26/02/1883) [Dato]. La estación carbonera de ~1910 vive de ese abrigo — no de San Telmo.\n\nSi contrastas San Telmo + Archivo + esta mirada, responde la pregunta del reportaje.";
      chips = [
        { t: "Dato 1883", c: "dato" },
        { t: "Síntesis", c: "doc" },
      ];
      line = "Aquí encaja el titular sobrio — si no inventamos muertos.";
      state.repClues.isleta = true;
      markVisit("istmo");
      who = "Clara";
    }

    markRep(id);
    if (id === "guiniguada") markVisit("vegueta");
    if (id === "santelmo") markVisit("puerto");

    const opts = [
      {
        label: "Volver al mapa de investigación",
        primary: true,
        fn: () => {
          state.phase = "rep_mapa";
          save();
          render();
        },
      },
    ];
    app.innerHTML =
      topbarHtml("Reportaje · " + title) +
      stageWrap(
        loc.art,
        loc.label,
        "<h2>" +
      escapeHtml(title) +
      "</h2>" +
      chipHtml(chips) +
      '<div class="card ficha-body">' +
      escapeHtml(body).replace(/\n/g, "<br>") +
      "</div>"
      ) +
      dialogBar(who, line, opts);
    bindDialog(opts);
    save();
  }

  function renderRepContrast() {
    const app = document.getElementById("app");
    const doc = hasDocClue();
    const opts = [
      {
        label: doc
          ? "Contrastar: elevar San Telmo/Tenoya/parte a Documento firme"
          : "Solo tienes rumor / oral — contrastar débil (Hipótesis)",
        primary: true,
        fn: () => {
          state.repContrasted = doc;
          if (doc) {
            addFicha({
              id: "contraste-1826",
              title: "Contraste 1826 (San Telmo / Tenoya)",
              tag: "Documento",
              chips: [
                { t: "Documento", c: "doc" },
                { t: "Dato", c: "dato" },
              ],
            });
          } else {
            addFicha({
              id: "contraste-debil",
              title: "Notas sin Documento",
              tag: "Hipótesis",
              chips: [{ t: "Hipótesis", c: "hip" }],
            });
          }
          state.phase = "rep_titular";
          save();
          render();
        },
      },
      {
        label: "Volver al mapa (más lugares)",
        fn: () => {
          state.phase = "rep_mapa";
          save();
          render();
        },
      },
    ];
    const clueList = Object.keys(state.repClues)
      .filter((k) => state.repClues[k])
      .join(", ");
    app.innerHTML =
      topbarHtml("Reportaje · Contrastar") +
      stageWrap(
        "archivo",
        "Rumor vs documento · Archivo",
        "<h2>Mesa del Archivo</h2>" +
      '<p class="lede">Lugares: <strong>' +
      state.repVisited.length +
      "</strong>. Pistas: " +
      escapeHtml(clueList || "—") +
      ".</p>" +
      '<div class="card"><strong>Rumor</strong><p class="lede">«San Telmo basta» → [Hipótesis]</p></div>' +
      '<div class="card"><strong>Documento posible</strong><p class="lede">' +
      (doc
        ? "Sí: San Telmo límites / Tenoya / parte (paráfrasis). Un Documento no garantiza verdad automática."
        : "Aún no: visita San Telmo o Gabinete.") +
      "</p></div>"
      ) +
      dialogBar("Clara", "Sin contraste, el titular es fuego amigo.", opts);
    bindDialog(opts);
  }

  function renderRepTitular() {
    const app = document.getElementById("app");
    const opts = [
      {
        label: "Titular sobrio: «Por qué miramos La Isleta»",
        primary: true,
        fn: () => {
          state.repHeadline = "sobrio";
          finishReportero();
        },
      },
      {
        label: "Titular sensacionalista: «La noche que se tragó la ciudad»",
        fn: () => {
          state.repHeadline = "sensacional";
          finishReportero();
        },
      },
      {
        label: "Inventar cifra de muertos «en Las Palmas ciudad»",
        fn: () => {
          state.repHeadline = "cifra";
          finishReportero();
        },
      },
      {
        label: "Guardar en el Cajón (no publicar)",
        fn: () => {
          state.repHeadline = "cajon";
          finishReportero();
        },
      },
    ];
    app.innerHTML =
      topbarHtml("Reportaje · Titular") +
      stageWrap(
        "archivo",
        "Antes de imprimir",
        "<h2>¿Qué firma Clara?</h2>" +
      '<p class="lede">Contrastado a Documento: <strong>' +
      (state.repContrasted ? "sí" : "no") +
      "</strong>. Lugares: <strong>" +
      state.repVisited.length +
      "</strong>.</p>" +
      '<p class="progress-note">First-match: una sola carta. Inventar muertos locales siempre pierde. Reputación ≠ nota.</p>'
      ) +
      dialogBar("Clara", "El Archivo nos mira.", opts);
    bindDialog(opts);
  }

  function finishReportero() {
    const o = resolveOutcomeReportero();
    applyOutcome(o);
    state.reporteroDone = true;
    state.phase = "outcome";
    save();
    render();
  }

  function renderFin() {
    const app = document.getElementById("app");
    const visited = state.visited.join(", ") || "—";
    const opts = [
      {
        label: "Jugar de nuevo",
        primary: true,
        fn: reset,
      },
    ];
    app.innerHTML =
      topbarHtml("Fin del arco corto") +
      stageWrap(
        "gabinete",
        "Proto v3 visual · Gabinete",
        "<h2>Gracias por jugar</h2>" +
      '<div class="card">' +
      "<p><strong>Arco:</strong> " +
      escapeHtml(state.arc || "—") +
      "</p>" +
      "<p><strong>Outcome:</strong> " +
      escapeHtml((state.outcome && state.outcome.title) || "—") +
      "</p>" +
      "<p><strong>Agente:</strong> " +
      escapeHtml((AGENTS[state.agent] && AGENTS[state.agent].name) || "—") +
      "</p>" +
      "<p><strong>Barrios:</strong> " +
      escapeHtml(visited) +
      "</p>" +
      "<p><strong>Reportaje 1826:</strong> " +
      (state.reporteroDone ? "jugado" : "no") +
      " · lugares " +
      state.repVisited.length +
      "</p>" +
      "<p><strong>Fichas:</strong> " +
      state.archivo.length +
      "</p>" +
      "</div>" +
      '<p class="lede">Diseño: <code>rev_industrial/docs/CASO_ALUVION_REPORTERO.md</code></p>' +
      '<p class="progress-note">localStorage ' +
      STORAGE_KEY +
      "</p>"
      ) +
      dialogBar(
        state.arc === "reportero" ? "Clara" : "Nerea",
        "Mañana otra audiencia. Hoy bastó una carta.",
        opts
      );
    bindDialog(opts);
  }

  function render() {
    const p = state.phase;
    if (p === "title") return renderTitle();
    if (p === "audiencia") return renderAudiencia();
    if (p === "mapa") return renderMapa();
    if (p === "agente") return renderAgente();
    if (p === "escena1") return renderEscena1();
    if (p === "escena2") return renderEscena2();
    if (p === "decision") return renderDecision();
    if (p === "outcome") return renderOutcome();
    if (p === "debrief") return renderDebrief();
    if (p === "noche") return renderNoche();
    if (p === "rep_brief") return renderRepBrief();
    if (p === "rep_mapa") return renderRepMapa();
    if (p === "rep_loc") return renderRepLoc();
    if (p === "rep_contrast") return renderRepContrast();
    if (p === "rep_titular") return renderRepTitular();
    if (p === "fin") return renderFin();
    renderTitle();
  }

  document.addEventListener("DOMContentLoaded", () => {
    bindChromeOnce();
    render();
  });
  window.RI_PROTO = {
    reset,
    render,
    getState: () => state,
    goToMenu,
    hasResumableSave,
    resolveOutcomeVapor,
    resolveOutcomeReportero,
  };
})();
