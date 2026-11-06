# PRUEBAS · RI Las Palmas proto v3-visual

Fecha: 2026-11-06 (Atlantic/Canary, UTC+0) · revisión navegación Menú/Continuar

## Qué se probó (programático, sin navegador GUI)

Ejecutado: `node test-proto.js` en `/workspace/ri-las-palmas` (jsdom; **no** Chromium/Playwright).

### Estáticos
- Presencia index/styles/game/README; sin CDN; `node --check game.js`
- 9 fondos + 4 retratos; sin hospital; sin `*_v1`
- Gabinete SHA256 `37b18ce84e9495b5bad767b633141569c70ea599979f0b5335117f93cfa4ef9a`

### Rutas DOM
- Vapor + noche + reportero; aluvión directo; persistencia; auto-reanudación
- Evelyn → oficina; outcome cifra → Coste de inventar

### Navegación Menú / Continuar (nuevo)
- Etiqueta visible exacta del botón: **`Menú`**
- Desde Caso · Escena 1: `#btnMenu` → portada; `localStorage` **sigue** con `"phase":"escena1"` (no escribe title)
- **`Continuar partida guardada`** restaura escena1
- **`Comenzar Día 1`** / **`Reiniciar`** sí sustituyen (destructivos explícitos, no automáticos)
- Audiencia: `.scroll-hint`, `.stage-compact`, petición `Memoria del aluvión` en DOM

## Procedimiento UI: vapor guardado → reportero sin perder avance

1. En el caso vapor (p. ej. Escena 1): pulsar **`Menú`** (arriba izquierda) → portada; el avance **no** se borra.
2. Pulsar **`Continuar partida guardada`** → vuelve al punto (Escena 1 u otra fase guardada).
3. Completar el favor vapor hasta **noche Gabinete**.
4. En Gabinete: **`Abrir caso reportero: Memoria del aluvión`**.
5. Alternativa sin vapor previo: en portada **`Comenzar Día 1`** (nueva partida) → audiencia → petición **Memoria del aluvión** (requiere scroll si no se ve; hay aviso). Eso **sí** sustituye la partida anterior.

Reload a mitad de partida: reanuda la fase guardada (no vuelve solo al menú). Usar **`Menú`** para ir a portada sin perder el slot.

## Limitaciones
- Sin captura visual de layout móvil real en este paso.
- jsdom no mide overflow real; scroll-hint + compact son la mitigación de alcanzabilidad.

Servidor local sugerido (no ejecutado aquí):
```bash
cd /ruta/al/extraido/ri-las-palmas && python3 -m http.server 8765
```
