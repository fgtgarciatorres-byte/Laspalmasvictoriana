#!/usr/bin/env node
"use strict";
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = __dirname;
let failed = 0;
function ok(msg) { console.log("OK  " + msg); }
function bad(msg) { console.error("FAIL " + msg); failed++; }

const required = ["index.html", "styles.css", "game.js", "README.md"];
for (const f of required) {
  const p = path.join(root, f);
  if (!fs.existsSync(p)) bad("falta " + f);
  else if (fs.statSync(p).size < 50) bad(f + " demasiado pequeño");
  else ok(f + " (" + fs.statSync(p).size + " bytes)");
}

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const js = fs.readFileSync(path.join(root, "game.js"), "utf8");
const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");

if (!html.includes('src="game.js"')) bad("index no carga game.js"); else ok("index carga game.js");
if (!html.includes('href="styles.css"')) bad("index no carga styles.css"); else ok("index carga styles.css");
if (/cdn\.|unpkg|jsdelivr|googleapis/i.test(html + css)) bad("referencia CDN"); else ok("sin CDN");

const needles = [
  "Gabinete Literario",
  "Aluvión",
  "first-match",
  "El vapor que no quería luz",
  "Memoria del aluvión",
  "rep_brief",
  "resolveOutcomeReportero",
  "Clara",
  "sceneArtHtml",
  "stageWrap",
  "ri-las-palmas-proto-v3",
  "goToMenu",
  "hasResumableSave",
  "btnMenu",
];
for (const needle of needles) {
  if (!js.includes(needle)) bad("game.js no contiene: " + needle);
  else ok("game.js contiene: " + needle);
}
if (!css.includes("dialog-bar")) bad("falta dialog-bar en CSS"); else ok("dialog-bar CSS");
if (!css.includes("aspect-ratio: 16 / 9") && !css.includes("aspect-ratio:16/9")) bad("falta aspect-ratio 16:9");
else ok("scene-art 16:9");
if (!readme.includes("Memoria del aluvión")) bad("README no menciona Memoria"); else ok("README Memoria");
if (!readme.includes("index.html")) bad("README no explica abrir index"); else ok("README abrir");

if (/prólogo obligatorio/i.test(js)) bad("aún habla de prólogo obligatorio"); else ok("sin prólogo obligatorio");
if (js.includes("caso reportero en construcción") && !js.includes("rep_titular")) bad("solo stub reportero");
else ok("caso reportero jugable");

const assets = [
  "art/escenarios/gabinete_terraza_noche.png",
  "art/escenarios/muelle_carbonera_bruma.png",
  "art/escenarios/oficina_consignataria.png",
  "art/escenarios/archivo_lectura.png",
  "art/escenarios/guiniguada_ribera.png",
  "art/escenarios/san_telmo_desembocadura.png",
  "art/escenarios/isleta_confital_mirador.png",
  "art/escenarios/inspeccion_portal.png",
  "art/escenarios/plaza_triana.png",
  "art/personajes/nerea_quintero.png",
  "art/personajes/clara_ruiz.png",
  "art/personajes/tato_medina.png",
  "art/personajes/evelyn_shaw.png",
];
for (const a of assets) {
  const p = path.join(root, a);
  if (!fs.existsSync(p)) bad("falta asset " + a);
  else if (fs.statSync(p).size < 1000) bad("asset pequeño " + a);
  else ok("asset " + a);
}
if (fs.existsSync(path.join(root, "art/escenarios/hospital_san_martin_ext.png")))
  bad("hospital no debería estar en el paquete corto (fuera de flujo)");
else ok("sin hospital (fuera de flujo)");
if (fs.existsSync(path.join(root, "art/escenarios/gabinete_terraza_noche_v1.png")))
  bad("no incluir *_v1");
else ok("sin *_v1");

const gabHash = spawnSync("sha256sum", [path.join(root, "art/escenarios/gabinete_terraza_noche.png")], { encoding: "utf8" });
const expectedGab = "37b18ce84e9495b5bad767b633141569c70ea599979f0b5335117f93cfa4ef9a";
if (!(gabHash.stdout || "").includes(expectedGab)) bad("hash Gabinete no coincide (preservar v2)");
else ok("Gabinete SHA256 preservado");

const cssRefs = [
  "muelle_carbonera_bruma.png",
  "gabinete_terraza_noche.png",
  "inspeccion_portal.png",
  "plaza_triana.png",
  "archivo_lectura.png",
  "guiniguada_ribera.png",
  "san_telmo_desembocadura.png",
  "isleta_confital_mirador.png",
  "oficina_consignataria.png",
];
for (const r of cssRefs) {
  if (!css.includes(r)) bad("CSS no referencia " + r);
  else ok("CSS ref " + r);
}

const chk = spawnSync(process.execPath, ["--check", path.join(root, "game.js")], { encoding: "utf8" });
if (chk.status !== 0) bad("game.js no parsea: " + (chk.stderr || chk.stdout || "error"));
else ok("game.js parsea");

// --- Route simulation with jsdom (no real browser) ---
let JSDOM;
try {
  JSDOM = require("jsdom").JSDOM;
} catch (e) {
  bad("jsdom no instalado (npm i jsdom) — no se simulan rutas DOM");
  JSDOM = null;
}

function makeDom() {
  const dom = new JSDOM(
    '<!doctype html><html><body><div id="app"></div></body></html>',
    {
      url: "http://127.0.0.1/ri/",
      runScripts: "outside-only",
      pretendToBeVisual: true,
    }
  );
  const { window } = dom;
  // Prefer JSDOM built-in Storage; keep a mirror for assertions.
  const store = {};
  const proto = {
    getItem(k) {
      try { return window.localStorage.getItem(k); } catch (_) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; }
    },
    setItem(k, v) {
      store[k] = String(v);
      try { window.localStorage.setItem(k, String(v)); } catch (_) {}
    },
    removeItem(k) {
      delete store[k];
      try { window.localStorage.removeItem(k); } catch (_) {}
    },
    clear() {
      Object.keys(store).forEach((k) => delete store[k]);
      try { window.localStorage.clear(); } catch (_) {}
    },
  };
  // Patch Storage methods to mirror
  const ls = window.localStorage;
  const _set = ls.setItem.bind(ls);
  const _get = ls.getItem.bind(ls);
  const _rem = ls.removeItem.bind(ls);
  const _clr = ls.clear.bind(ls);
  ls.setItem = (k, v) => { store[k] = String(v); return _set(k, v); };
  ls.getItem = (k) => { const v = _get(k); if (v != null) store[k] = v; return v; };
  ls.removeItem = (k) => { delete store[k]; return _rem(k); };
  ls.clear = () => { Object.keys(store).forEach((k) => delete store[k]); return _clr(); };
  window.HTMLElement.prototype.scrollIntoView = function () {};
  window.eval(js);
  window.document.dispatchEvent(new window.Event("DOMContentLoaded"));
  return { window, store, dom, readKey: (k) => ls.getItem(k) };
}

function click(win, sel) {
  const el = win.document.querySelector(sel);
  if (!el) throw new Error("no element " + sel);
  el.dispatchEvent(new win.MouseEvent("click", { bubbles: true, cancelable: true }));
}

function clickOpt(win, labelSubstr) {
  const buttons = [...win.document.querySelectorAll("#dialogBar button, button.choice, button.primary, .map-grid button, [data-pet], [data-agent], [data-place], [data-reploc]")];
  const btn = buttons.find((b) => (b.textContent || "").includes(labelSubstr));
  if (!btn) throw new Error("no button containing: " + labelSubstr + " | have: " + buttons.map((b) => b.textContent.trim().slice(0, 40)).join(" || "));
  btn.dispatchEvent(new win.MouseEvent("click", { bubbles: true, cancelable: true }));
}

function phase(win) {
  return win.RI_PROTO.getState().phase;
}

if (JSDOM) {
  try {
    const { window: w1, store: s1 } = makeDom();
    if (!w1.RI_PROTO) throw new Error("RI_PROTO missing");
    ok("RI_PROTO expuesto");
    if (phase(w1) !== "title") throw new Error("phase inicial " + phase(w1));
    ok("fase title");
    // ensure bg class on title
    if (!w1.document.querySelector(".scene-art.bg-muelle")) throw new Error("title sin bg-muelle");
    ok("title muestra muelle");

    click(w1, "#btnStart");
    if (phase(w1) !== "audiencia") throw new Error("tras start: " + phase(w1));
    if (!w1.document.querySelector(".bg-inspeccion")) throw new Error("audiencia sin inspeccion");
    ok("ruta → audiencia + fondo inspección");

    // Vapor route: puerto petition
    click(w1, '[data-pet="puerto"]');
    if (phase(w1) !== "mapa") throw new Error("vapor mapa: " + phase(w1));
    click(w1, '[data-place="puerto"]');
    if (phase(w1) !== "agente") throw new Error("agente: " + phase(w1));
    click(w1, '[data-agent="tato"]');
    if (phase(w1) !== "escena1") throw new Error("escena1: " + phase(w1));
    clickOpt(w1, "Comparar humedad");
    if (phase(w1) !== "escena2") throw new Error("escena2: " + phase(w1));
    clickOpt(w1, "Contrastar");
    if (phase(w1) !== "decision") throw new Error("decision: " + phase(w1));
    clickOpt(w1, "Publicar");
    if (phase(w1) !== "outcome") throw new Error("outcome: " + phase(w1));
    const stV = w1.RI_PROTO.getState();
    if (!stV.outcome || !stV.outcome.title) throw new Error("sin outcome vapor");
    ok("vapor → outcome «" + stV.outcome.title + "»");
    clickOpt(w1, "Ir al debrief");
    if (phase(w1) !== "debrief") throw new Error("debrief");
    clickOpt(w1, "Anochecer");
    if (phase(w1) !== "noche") throw new Error("noche");
    if (!w1.document.querySelector(".bg-gabinete")) throw new Error("noche sin gabinete");
    ok("vapor → noche Gabinete + fondo");
    // persist
    if (!s1["ri-las-palmas-proto-v3"] && !w1.localStorage.getItem("ri-las-palmas-proto-v3")) throw new Error("no persistió v3");
    ok("persistencia localStorage v3");

    // open reporter from night
    clickOpt(w1, "Abrir caso reportero");
    if (phase(w1) !== "rep_brief") throw new Error("rep_brief");
    clickOpt(w1, "Abrir mapa");
    for (const loc of ["guiniguada", "santelmo", "gabinete"]) {
      click(w1, '[data-reploc="' + loc + '"]');
      if (phase(w1) !== "rep_loc") throw new Error("rep_loc " + loc);
      const bgExpected = loc === "gabinete" ? "archivo" : loc === "santelmo" ? "santelmo" : "guiniguada";
      if (!w1.document.querySelector(".bg-" + bgExpected)) throw new Error("fondo " + bgExpected + " en " + loc);
      clickOpt(w1, "Volver al mapa");
    }
    ok("reportero 3 locs + fondos");
    clickOpt(w1, "Contrastar pistas");
    if (phase(w1) !== "rep_contrast") throw new Error("contrast");
    if (!w1.document.querySelector(".bg-archivo")) throw new Error("contrast sin archivo");
    clickOpt(w1, "Contrastar:");
    clickOpt(w1, "Titular sobrio");
    if (phase(w1) !== "outcome") throw new Error("rep outcome");
    const stR = w1.RI_PROTO.getState();
    if (stR.outcome.id !== "semilla") throw new Error("esperaba semilla, got " + stR.outcome.id);
    ok("reportero first-match semilla");
    clickOpt(w1, "Cerrar arco");
    if (phase(w1) !== "fin") throw new Error("fin");
    ok("ruta A vapor+reportero → fin");

    // Route B: audiencia aluvión direct
    const { window: w2 } = makeDom();
    click(w2, "#btnStart");
    click(w2, '[data-pet="aluvion"]');
    if (phase(w2) !== "rep_brief") throw new Error("aluvion directo");
    ok("ruta B audiencia → Memoria del aluvión");
    clickOpt(w2, "Abrir mapa");
    click(w2, '[data-reploc="isleta"]');
    if (!w2.document.querySelector(".bg-isleta")) throw new Error("isleta bg");
    ok("fondo isleta");
    // reset
    w2.RI_PROTO.reset();
    if (phase(w2) !== "title") throw new Error("reset");
    ok("reinicio → title");

    // continue from storage after partial
    const { window: w3, store: s3 } = makeDom();
    click(w3, "#btnStart");
    click(w3, '[data-pet="gremios"]');
    const raw = w3.localStorage.getItem("ri-las-palmas-proto-v3") || s3["ri-las-palmas-proto-v3"];
    if (!raw || !String(raw).includes('"phase":"mapa"')) throw new Error("save mid-map: " + String(raw).slice(0, 120));
    const dom5 = new JSDOM(
      '<!doctype html><html><body><div id="app"></div></body></html>',
      { url: "http://127.0.0.1/ri-continue/", runScripts: "outside-only", pretendToBeVisual: true }
    );
    dom5.window.localStorage.setItem("ri-las-palmas-proto-v3", raw);
    dom5.window.HTMLElement.prototype.scrollIntoView = function () {};
    dom5.window.eval(js);
    dom5.window.document.dispatchEvent(new dom5.window.Event("DOMContentLoaded"));
    // Al recargar, el proto reanuda la fase guardada (mapa), no la title.
    if (phase(dom5.window) !== "mapa") throw new Error("auto-resume phase " + phase(dom5.window));
    ok("recarga reanuda fase mapa desde localStorage");
    // Botón Continuar: forzar title con save presente
    dom5.window.RI_PROTO.getState().phase = "title";
    dom5.window.RI_PROTO.render();
    if (!dom5.window.document.querySelector("#btnContinue")) throw new Error("sin Continuar en title");
    click(dom5.window, "#btnContinue");
    if (phase(dom5.window) !== "mapa") throw new Error("Continuar phase " + phase(dom5.window));
    ok("Continuar partida guardada restaura mapa");

    // outcome cifra path
    const { window: w6 } = makeDom();
    click(w6, "#btnStart");
    click(w6, '[data-pet="aluvion"]');
    clickOpt(w6, "Abrir mapa");
    for (const loc of ["guiniguada", "isleta", "santelmo"]) {
      click(w6, '[data-reploc="' + loc + '"]');
      clickOpt(w6, "Volver al mapa");
    }
    clickOpt(w6, "Contrastar pistas");
    clickOpt(w6, "Contrastar:");
    clickOpt(w6, "Inventar cifra");
    if (w6.RI_PROTO.getState().outcome.id !== "coste") throw new Error("cifra → coste");
    ok("outcome Coste de inventar");

    // evelyn silence → arreglo / oficina art on decision
    const { window: w7 } = makeDom();
    click(w7, "#btnStart");
    click(w7, '[data-pet="puerto"]');
    click(w7, '[data-place="puerto"]');
    click(w7, '[data-agent="evelyn"]');
    clickOpt(w7, "Comparar humedad");
    clickOpt(w7, "Contrastar");
    if (!w7.document.querySelector(".bg-oficina")) throw new Error("decisión evelyn sin oficina");
    ok("Evelyn decisión → fondo oficina");
    clickOpt(w7, "Silencio");
    if (w7.RI_PROTO.getState().outcome.id !== "arreglo") throw new Error("arreglo");
    if (!w7.document.querySelector(".bg-oficina")) throw new Error("outcome arreglo sin oficina");
    ok("Evelyn silencio → Arreglo + oficina");

    // --- Menú sin borrar + Continuar ---
    const { window: wM } = makeDom();
    click(wM, "#btnStart");
    click(wM, '[data-pet="puerto"]');
    click(wM, '[data-place="puerto"]');
    click(wM, '[data-agent="tato"]');
    if (phase(wM) !== "escena1") throw new Error("setup escena1");
    if (!wM.document.querySelector("#btnMenu")) throw new Error("sin botón Menú en escena1");
    const menuLabel = (wM.document.querySelector("#btnMenu").textContent || "").trim();
    if (menuLabel !== "Menú") throw new Error("etiqueta Menú incorrecta: " + menuLabel);
    ok("etiqueta visible exacta: Menú");
    const rawBefore = wM.localStorage.getItem("ri-las-palmas-proto-v3");
    if (!rawBefore || !rawBefore.includes('"phase":"escena1"')) throw new Error("save pre-menú");
    // click Menú
    wM.document.querySelector("#btnMenu").dispatchEvent(new wM.MouseEvent("click", { bubbles: true, cancelable: true }));
    // portada visible
    if (!wM.document.querySelector("#btnContinue")) throw new Error("Menú no mostró Continuar");
    if (!wM.document.querySelector("#btnStart")) throw new Error("Menú no mostró portada");
    const rawAfterMenu = wM.localStorage.getItem("ri-las-palmas-proto-v3");
    if (!rawAfterMenu || !rawAfterMenu.includes('"phase":"escena1"')) {
      throw new Error("Menú borró o reescribió phase: " + String(rawAfterMenu).slice(0, 160));
    }
    ok("Menú → portada sin reescribir phase (sigue escena1 en save)");
    // Continuar restaura
    click(wM, "#btnContinue");
    if (phase(wM) !== "escena1") throw new Error("Continuar no restauró escena1: " + phase(wM));
    if (!wM.document.querySelector(".bg-muelle")) throw new Error("Continuar sin muelle");
    ok("Continuar partida guardada restaura escena1");
    // Menú otra vez; Comenzar sí sustituye (destructivo explícito)
    wM.document.querySelector("#btnMenu").dispatchEvent(new wM.MouseEvent("click", { bubbles: true, cancelable: true }));
    click(wM, "#btnStart");
    if (phase(wM) !== "audiencia") throw new Error("Comenzar no fue a audiencia");
    const afterStart = JSON.parse(wM.localStorage.getItem("ri-las-palmas-proto-v3"));
    if (afterStart.phase !== "audiencia") throw new Error("Comenzar no guardó audiencia");
    if (afterStart.agent) throw new Error("Comenzar no limpió agente");
    ok("Comenzar Día 1 sustituye partida (explícito)");
    // audiencia: hint + compact + petición aluvión en DOM
    if (!wM.document.querySelector(".scroll-hint")) throw new Error("sin scroll-hint audiencia");
    if (!wM.document.querySelector(".stage-compact")) throw new Error("sin stage-compact audiencia");
    if (!wM.document.querySelector('[data-pet="aluvion"]')) throw new Error("sin petición Memoria");
    const aluv = wM.document.querySelector('[data-pet="aluvion"]');
    if (!(aluv.textContent || "").includes("Memoria del aluvión")) throw new Error("texto Memoria");
    ok("audiencia: hint scroll + Memoria del aluvión en DOM");
    // goToMenu API
    if (typeof wM.RI_PROTO.goToMenu !== "function") throw new Error("API goToMenu");
    if (typeof wM.RI_PROTO.hasResumableSave !== "function") throw new Error("API hasResumableSave");
    ok("API goToMenu / hasResumableSave");
  } catch (e) {
    bad("simulación DOM: " + e.stack);
  }
}

if (failed) { console.error("\n" + failed + " fallo(s)"); process.exit(1); }
console.log("\nTodos los checks OK");
process.exit(0);
