# Módulo de revisión humana en `/admin`

Pantallas del panel de administración para resolver las salidas que `governance-service` retiene: preguntas y respuestas (Q&A), recomendador ético y gestión documental (RAG). AB#251 y AB#252.

## Acceso

- Rutas `/admin/dashboard/reviews` (bandeja) y `/admin/dashboard/reviews/:caseId` (expediente), dentro del módulo lazy `AdminModule` y protegidas por `loginGuard`. Enlace «Revisión humana» en la barra lateral.
- La sesión es la del administrador de Centinela (ADR 0005 del servicio). `AuthInterceptor` añade `X-Admin-Token` a toda llamada a `/api/governance/*` salvo las rutas del solicitante (`governed/`) y `health`. Un 401 o un 403 de esas rutas cierra la sesión del panel y vuelve a `/admin`, sin intentar renovar el JWT de usuario.
- `environment.apiGovernance = '/api/governance'`. El gateway reescribe ese prefijo a `/api/v1/` del servicio.

## Pantallas

**Bandeja.** Los filtros viven en la URL (`?tipo=rag&estado=expired`). En pantallas estrechas la tabla pasa a una lista con el plazo primero. Lista los expedientes por tipo (todos, Q&A, recomendador, RAG) y estado (pendientes por defecto, vencidos, aprobados, modificados, rechazados). Cada fila muestra el tipo, los motivos de retención en palabras, la política y versión, la fecha de recepción y el tiempo que queda; menos de dos horas se marca en ámbar. Permite abrir un expediente por su identificador, que es la vía disponible mientras el servicio no publique el listado.

**Expediente.** Encabezado con estado, plazo, recepción y política; los códigos de razón con su explicación. El contenido depende del tipo:

- **Q&A:** los pares retenidos y, por cada `source_article_id`, el título y el resumen del artículo en el corpus del buscador (`GET /api/search/v2/articles/{id}`). Atiende el hallazgo de la rúbrica de revisión de Q&A §9: el revisor necesita el texto de las fuentes. Un identificador que el corpus no tiene se marca como no verificable. La pantalla advierte que es el registro del corpus, no necesariamente el contexto que recibió el generador.
- **Recomendador:** la lista retenida sin nombres, con rango, institución, baja visibilidad, motivo de selección y puntajes, las métricas de equidad y los parámetros aplicados, y la propuesta de la política (`review_plan`) fila por fila.
- **RAG:** la consulta, la respuesta con cada cita `[n]` enlazada al texto de su bloque y las citas sin bloque resaltadas, y los bloques recuperados en su orden.

**Decisión.** Aprobar, modificar o rechazar. Cada opción dice qué recibe el usuario y la propuesta de la política se marca, pero no se preselecciona. La confirmación recibe el foco, nombra la consecuencia y usa el verbo de la decisión («Rechazar definitivamente»). Salir con una decisión sin enviar pide confirmación. Tras resolver, «Siguiente pendiente» abre el expediente más próximo a vencer. La justificación se marca obligatoria con las reglas del servicio (D6 en ADR 0003 y ADR 0007): siempre en el recomendador; al modificar o rechazar Q&A y RAG; al aprobar una salida con `PARTIAL_GENERATION`, `SOURCE_EVIDENCE_INCOMPLETE` o `RAG_CITATION_WITHOUT_BLOCK`. Máximo 2000 caracteres. Modificar permite:

- en Q&A, editar o retirar pares (al menos uno, y algún cambio);
- en el recomendador, retirar perfiles sin reordenar; la pantalla avisa cuando el revisor se aparta de la propuesta (desenlace libre, ADR 0007);
- en RAG, corregir `answer_text`; avisa si sigue citando posiciones sin bloque.

El servicio sigue siendo la autoridad: los errores 409 `CASE_EXPIRED` y `CASE_ALREADY_RESOLVED`, 422 `JUSTIFICATION_REQUIRED` e `INVALID_RECOMMENDATION_RESOLUTION`, 404, 503 y la falta de red se muestran con su mensaje y su `trace_id`. Ante un vencimiento o un conflicto, la pantalla ofrece recargar el estado real. Si el plazo vence con la pantalla abierta, el formulario se cierra.

Una resolución registrada se muestra con fecha, responsable (el rol administrador, o el servicio si venció), justificación y, en el recomendador, la propuesta y si el revisor se apartó de ella.

## Contratos

Detalle y resolución siguen `app/api/review_cases.py` de `governance-service` (`20c57e6`, PR #17). El listado aún no existe en el servicio y el módulo trabaja contra el contrato propuesto aquí:

### Listado de expedientes (propuesto)

ADR 0003 deja el listado fuera («there is no case list»). Propuesta para el servicio:

```
GET /api/v1/review-cases/?status=pending&case_type=qa&limit=25&cursor=<opaco>
X-Admin-Token: <token>
Cache-Control: no-store

200 {
  "items": [
    {
      "case_id": "…",
      "case_type": "qa" | "recommendation" | "rag",
      "created_at": "ISO 8601",
      "expires_at": "ISO 8601",
      "status": "pending" | "expired" | "approve" | "modify" | "reject",
      "policy": { "policy_id": "…", "version": "…" },
      "reason_codes": ["…"]
    }
  ],
  "next_cursor": "…" | null
}
```

Sin contenido protegido (pares, listas, bloques ni justificaciones). `status` por defecto `pending`, orden por `expires_at` ascendente. Mientras la ruta no exista, el front interpreta un 404 o 405 sin código como «listado no disponible» y ofrece abrir por ID.

### Sección `rag` del expediente

Sigue `docs/contracts/rag-ask.v1.md` de `governance-service` (`e53f754`, rama `feature/governed-rag-ask`): `rag.query`, `rag.answer_text`, `rag.blocks[]` (`cite_id`, `title`, `authors_mention`, `authors_raw`, `year`, `doi_raw` y `text`), `rag.cited_positions` y `rag.unresolved_positions`. La modificación envía `answer_text`; el front exige, como el servicio (422 `INVALID_RAG_CORRECTION`), que la corrección cite al menos una fuente y que todas sus citas tengan bloque. Aprobar con `RAG_CITATION_WITHOUT_BLOCK` o `RAG_CITATIONS_MISSING` exige justificación.

### Expediente de explicación (P4)

Pendiente del contrato de X3 (AB#263–265), que aún no está publicado en `docs/contracts/`. El panel lo mostrará en el expediente cuando exista.

## Doble de pruebas local

`tools/admin-review-stub/server.mjs` implementa estos contratos con datos sintéticos (Node, sin dependencias) para recorrer las pantallas sin backend:

```bash
node tools/admin-review-stub/server.mjs          # http://127.0.0.1:8099
npx ng serve --port 4300 --proxy-config tools/admin-review-stub/proxy.json
```

En `http://localhost:4300/admin` cualquier usuario y clave inician la sesión de prueba. El doble no es el servicio: no persiste entre reinicios, no repite una resolución idéntica con 200 y no valida el token contra `search-service`. La integración con el servicio real queda pendiente de la ruta de listado y del despliegue en staging.

## Pruebas

```bash
npx ng test --watch=false --browsers=ChromeHeadless --code-coverage
```

Cubren el servicio (rutas, parámetros y traducción de errores), las reglas (justificación, apartamiento del plan, citas y plazos), la bandeja, el expediente de los tres tipos, el formulario de decisión y el interceptor.

## Diseño

Componentes compartidos del módulo: `app-review-panel` (bloque con título que nombra la región), `app-review-deadline` (plazo o estado final con palabra y color), `app-review-reasons`, `app-review-error` (mensaje, traza y acción) y los pipes `reviewDate` y `reviewNumber` (`Intl`, `es-EC`). Colores de marca `primary_tailwind` y `primary_hover`. Bootstrap define `p-3…p-5`, `mt-3…mt-5` y `gap-3…gap-5` con `!important` y pisa los de Tailwind; el módulo usa el paso 6 cuando necesita uno mayor que 2.
