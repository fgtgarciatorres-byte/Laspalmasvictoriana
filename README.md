# RI Las Palmas · prototipo v3 visual

Point-and-click / novela visual corta: estación carbonera de Las Palmas (~1910), sin violencia.
Fondos establishing 16:9 aprobados + barra inferior de diálogo (sin bocadillos).

Diseño caso 1826: `../rev_industrial/docs/CASO_ALUVION_REPORTERO.md`  
Boceto base: `../DISENO_RI_BOCETO_2.md`  
Escenarios: `../rev_industrial/docs/ESCENARIOS_VISUAL.md`

## Cómo abrir (offline)

1. Extrae el ZIP (si aplica) y abre **`index.html`** en un navegador (doble clic).
2. Opcional servidor local (mismo directorio):
   ```bash
   python3 -m http.server 8765
   ```
   Luego visita `http://127.0.0.1:8765/`
3. CSS/JS/PNG locales. Sin CDN. Ancho hasta ~960px; móvil razonable.
4. Progreso: `localStorage` clave `ri-las-palmas-proto-v3`.

## Controles

- Toca/clic en peticiones, mapa, agentes y botones de la **barra inferior**.
- Botón **Menú** (arriba a la izquierda, etiqueta exacta: `Menú`): vuelve a la portada **sin borrar** el avance; en portada usa **Continuar partida guardada** para restaurar el punto exacto.
- **Comenzar Día 1** / **Reiniciar** en portada sí sustituyen la partida (destructivos a propósito).
- Sin teclado obligatorio. Sin combate.

## Arcos

### A — Favor vapor (*El vapor que no quería luz*)
Audiencia (Puerto/Gremios/Prensa vapor) → mapa → agente → craft → decisión → Unexpected Outcome → debrief → **noche Gabinete** → puedes abrir el caso reportero.

### B — Caso reportero (*Memoria del aluvión*)
Audiencia elige **Memoria del aluvión** (Clara lead) **o** lo abres de noche tras el vapor.  
Mapa de investigación (≥3 lugares: Guiniguada, San Telmo, Gabinete/Archivo, Isleta) → contrastar → titular → first-match.

## Fondos en este paquete

`art/escenarios/` — gabinete noche, muelle, oficina, archivo, Guiniguada, San Telmo, Isleta/Confital, inspección, plaza Triana.  
No incluye Hospital San Martín (fuera del flujo corto). No incluye `*_v1` ni refs de usuario.

Retratos de diálogo (Nerea, Clara, Tato, Evelyn): `art/personajes/`.

## Respeto 1826

Sin survival, sin cuerpos, sin inventar muertos de LPA ciudad.  
1826 → Isleta → La Luz: **hipótesis multicausal**, no cadena causal afirmada.  
Documento ≠ verdad automática. Puntos/reputación **no** son nota.

## Test

```bash
node test-proto.js
```
