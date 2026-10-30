# Diagnóstico y preparación del corpus en Centinela

Incremento del 23 de octubre de 2026. Continúa el explorador documental existente en `/research-analytics` y añade `/research-analytics/preparation`, bajo el mismo guard de sesión. Conserva NgModules, carga lazy y rutas relativas al gateway. No añade dependencias ni cambia el interceptor, proxy, pipelines o infraestructura compartida.

## Uso y estados

La nueva página carga un diagnóstico agregado de la instantánea completa: artículos, resúmenes ausentes, textos repetidos, longitud de resúmenes, idioma declarado/desconocido y concentración de fechas. Presenta precauciones específicas para no confundir fechas con cobertura o repeticiones textuales con publicaciones duplicadas. No infiere idiomas ni presenta descriptores como temas aprendidos.

El formulario permite configurar ausencia de resumen, repeticiones, mínimo de tokens y rango de años. La previsualización muestra incluidos/excluidos y motivos, sin guardar. Una modificación de criterios invalida ese resultado. La creación se habilita para una selección no vacía ya previsualizada; envía su identidad esperada junto a la configuración. Si el backend calcula otra preparación, rechaza el guardado y solicita volver a previsualizar. Mientras se procesa se bloquean envíos repetidos y cambios de criterios. No se presupone cancelación del trabajo del servidor por cerrar la página: RxJS evita actualizar una vista destruida, mientras que una creación aceptada puede finalizar y su repetición será idempotente.

La versión guardada se puede consultar mediante su identificador hexadecimal, comprobando su integridad en el backend. La interfaz distingue carga, error, previsualización, guardado, selección vacía y reutilización. Los errores eliminan resultados anteriores. Guardar no ejecuta modelos ni crea una partición de evaluación final.

## Contratos

| Método | Ruta bajo /api/analytics | Uso |
| --- | --- | --- |
| GET | /corpus/quality | Diagnóstico agregado |
| POST | /corpus/preparation/preview | Configuración → resumen sin escritura |
| POST | /corpus/worksets | Configuración e identidad esperada → nueva versión o reutilización |
| GET | /corpus/worksets/{id} | Resumen de versión verificada |

`source_sha256` es un mapa de nombres de archivos a sus huellas, no una cadena única. La API no acepta rutas del navegador. Los tipos TypeScript reflejan estos contratos; OpenAPI/Pydantic verifica las respuestas del backend. Configurar `ANALYTICS_WORKSET_DIRECTORY` fuera del repositorio, además de la instantánea original, siguiendo `analytics-service/docs/calidad-preparacion.md`.

La ejecución local sigue la [guía del explorador](research-analytics.md). El archivo environment.development.ts aparece en .gitignore, pero en el checkout inspeccionado ya está versionado; ignorar una ruta no elimina su seguimiento previo. Se agrega el mismo apiAnalytics relativo en los tres environments. Los checkouts se preparan desde develop conservando cambios; este incremento usa feature/corpus-preparation-quality.

## Validación y límites

Los tests del servicio comprueban prefijo, métodos, configuración, identidad esperada y propagación de errores. Los tests del componente comprueban previsualización antes de crear, invalidación, límites de configuración, consultas, selección vacía, reutilización, errores, bloqueo de envíos y destrucción. Usan exclusivamente respuestas sintéticas; no representan resultados de modelos ni pruebas con participantes. Se verifica el umbral global del repositorio y se registra el resultado final en la evidencia del incremento.

La conexión real navegador/gateway/identidad permanece pendiente. No se afirma revisión visual manual, certificación de accesibilidad ni despliegue. Se conserva la deuda de any de dos specs heredados y el ajuste regional de sus pruebas; no se deshabilitan reglas de lint o cobertura.

Verificación final: 2120 pruebas aprobadas; cobertura de statements 95,80 %, ramas 90,30 %, funciones 94,84 % y líneas 96,00 %. ESLint del módulo nuevo, routing y tres environments conforme; Prettier del módulo conforme. La ejecución local de Karma usó el mismo umbral global con mayor espera de arranque del navegador en un archivo temporal externo, después de una desconexión de Chrome; la configuración versionada y CI no se alteraron. El test de bloqueo espera la actualización asíncrona de FormsModule.

El build de producción terminó con salida 0, hash dcbfbe93c509c219, total inicial 2,68 MB y módulo lazy de analítica de 32,63 kB. Conserva advertencias de presupuestos CSS de componentes heredados y una advertencia de sintaxis CSS del código existente; no se declara compilación sin advertencias. Backend asociado: PR #4 de analytics-service, con 366 pruebas y 99,06 % de cobertura, CI de calidad y nombre de rama aprobadas.

Por autorización excepcional del titular, en esta ejecución el agente puede efectuar commits, push, PR y estados CMMI con evidencia. Las instrucciones manuales anteriores son referencia; no deben repetirse sobre una rama ya preparada. Esta excepción no amplía permisos para futuras ejecuciones.
