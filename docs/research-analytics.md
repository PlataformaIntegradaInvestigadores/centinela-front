# Explorador documental de analítica científica

Implementación del incremento del 22 de octubre de 2026. Contribuye a R19, R20 y R27 mediante una pantalla Angular dentro de Centinela, no una aplicación separada.

Continuación del 23 de octubre: se añade [calidad y preparación versionada](corpus-preparation.md). Los resultados de 2103 pruebas y las instrucciones manuales de este documento corresponden al incremento inicial. La continuación incluye pruebas nuevas y una rama preparada por el agente bajo autorización excepcional; consultar su evidencia final antes de repetir comandos Git. environment.development.ts ya estaba versionado en el checkout actual, pese a figurar en .gitignore.

## Arquitectura y alcance

- Módulo lazy `research-analytics`, con estructura `domain/entities`, `domain/services` y `presentation/pages`.
- Ruta `/research-analytics`, protegida por el `authGuard` existente, y enlace «Corpus y tendencias» en el encabezado para sesiones iniciadas.
- El nuevo `CorpusService` usa exclusivamente `environment.apiAnalytics = '/api/analytics'`. Se conservan el interceptor de sesión, proxy de desarrollo y gateway. No se añaden llamadas del navegador a puertos de backend ni excepciones CORS.
- La analítica heredada que consume predictive-service permanece separada. La nueva pantalla consume el diagnóstico y las consultas documentales de analytics-service.

La página ofrece resumen del corpus, distribución anual descriptiva, filtros por año/resumen/autor/descriptor, paginación, diez descriptores frecuentes globales y detalle documental. La tabla de descriptores indica expresamente que no aplica los filtros de artículos. Los conteos representan la instantánea; los descriptores no se presentan como temas aprendidos. Pronósticos y explicaciones se muestran «En proceso».

Cada cambio de consulta cancela las solicitudes anteriores. Las respuestas antiguas no pueden sustituir los nuevos filtros o detalles. Los fallos limpian resultados anteriores, muestran un mensaje y permiten reintentar. La pantalla distingue carga, vacío, resultado y error; el detalle tiene sus propios estados. No hay datos de demostración en el código de producción ni métricas del predictor heredado presentadas como evidencia.

Las pruebas usan respuestas sintéticas explícitas. Comprueban rutas/parámetros HTTP, conservación del filtro booleano false, errores, cancelación, paginación, filtros y limpieza al destruir el componente. Las pruebas DOM verifican etiquetas, estados y escape del texto documental; no equivalen a evaluación con participantes ni a certificación de accesibilidad. Las tablas tienen captions/encabezados, los formularios etiquetas, los estados regiones accesibles y los controles foco visible. El diseño admite desplazamiento de tablas y disposición móvil.

## Ejecución local

El repositorio fija Node 18.20.2 en `.nvmrc`. El incremento se verifica con un runtime portable en `../evidencias_locales/tooling/node-v18.20.2-win-x64`, descargado de nodejs.org y comprobado contra SHASUMS256.txt; el Node global no se reemplaza. Las dependencias se instalan desde package-lock con `npm ci --ignore-scripts --no-audit --no-fund`, sin cambiar versiones. La instalación se inició con el npm disponible del sistema; build/tests se ejecutan con el Node fijado.

Desde Git Bash, en centinela-front:

```bash
export PATH="/c/Users/Pato/Downloads/TESIS/evidencias_locales/tooling/node-v18.20.2-win-x64:$PATH"
node --version
npm start -- --host 127.0.0.1 --configuration local
```

Abrir `http://localhost:4200/research-analytics` con una sesión válida de Centinela. El guard conserva el flujo de inicio de sesión existente. La configuración local usa `environment.local.ts`; la configuración development puede depender de `environment.development.ts`, que el repositorio ignora. En ese archivo local debe mantenerse el mismo `apiAnalytics: '/api/analytics'` si se usa development. El archivo principal y el local incluyen la propiedad versionada.

El proxy continúa enviando `/api` al gateway en `localhost:8080`. Para respuestas reales, el gateway debe enrutar `/api/analytics/` hacia el `/api/v1/` de analytics-service, y los servicios de identidad deben estar disponibles. En analytics-service se debe configurar una instantánea local autorizada mediante `ANALYTICS_CORPUS_DATABASE`, mantener el entorno `local` y ejecutar en loopback. No se certifica conectividad real entre servicios por la sola compilación o por pruebas HTTP simuladas. La autorización de backend para staging/production sigue pendiente; sus rutas analíticas permanecen deshabilitadas.

## Pruebas y revisión

```bash
npm test -- --watch=false --browsers=ChromeHeadless --code-coverage
npm run build -- --configuration development
```

El umbral de cobertura del repositorio permanece en 90 %; no se rebaja. Las comprobaciones del nuevo feature viven junto a sus fuentes. La ruta perezosa y sus contratos deberán verificarse también en el stack compartido antes del cierre de integración.

Durante la primera ejecución completa pasaron las diez pruebas nuevas. Se detectaron seis fallos heredados en los specs de salarios de JobList/JobDetail: sus expectativas fijaban comas inglesas, pero `toLocaleString()` usaba la configuración regional del navegador. Esos dos grupos de pruebas ahora fijan la dependencia de formato a en-US solo mientras se ejecutan sus aserciones. No se cambian las funciones de producción ni el idioma del navegador del usuario. Jasmine restaura el spy entre pruebas.

La inspección ESLint de esos dos specs heredados también detectó 19 usos previos de `any` (6 en JobDetail y 13 en JobList). El ajuste de locale no añade `any`; esa deuda se mantiene explícita y no se deshabilita la regla. El lint del módulo nuevo, routing y environments se comprueba por separado. No se afirma que el lint de toda la aplicación esté aprobado.

Resultado final de Karma/Jasmine: **2103 pruebas aprobadas**, incluidas las diez del nuevo explorador; Chrome Headless 155 en Windows, Node 18.20.2. Cobertura: statements 95,74 %, ramas 90,24 %, funciones 94,77 % y líneas 95,93 %. El proceso finalizó con código 0 y el umbral global de 90 % permaneció activo. ESLint del módulo nuevo, routing y environments aprobó sin incidencias. El log íntegro queda fuera de Git, en `../evidencias_locales/frontend-tests-final.log`; incluye mensajes de error deliberados de pruebas heredadas, por lo que su resultado debe leerse en el resumen final y código de salida.

La compilación development aprobó y la compilación final local también terminó con código 0 (hash c6e652dc6ea8e904, chunk lazy research-analytics de 59,50 kB sin optimización). La configuración local usa el environment versionado. El log final está en `../evidencias_locales/frontend-build-local-final.log`. Esto valida compilación para desarrollo local; no es un build de producción ni prueba de despliegue.

## Git y Azure, a cargo del titular

En la inspección inicial el checkout del frontend estaba en main. Verificar la rama actual antes de confirmar y preparar una feature desde develop según el flujo del equipo. Para conservar modificaciones y archivos nuevos al preparar esa rama, el titular puede usar stash con `-u`, actualizar develop, crear la feature y restaurar el stash. Si aparecen conflictos, conservar el trabajo y resolverlos antes de continuar; las pruebas deberán repetirse si cambian fuentes.

No confirmar este trabajo directamente en main. Un ejemplo de nombre de rama es `feature/research-analytics-corpus`. El PR de frontend es separado del de analytics-service, dirigido a develop, con su propio issue, dos aprobaciones y CODEOWNERS. Revisar fuentes, specs, environments, routing, encabezado y esta documentación. No agregar node_modules, dist, coverage ni datos de corpus.

Registrar evidencia del incremento en R19/R20/R27. La pantalla local implementada no acredita integración de identidad/gateway ni usabilidad con personas. Mantener el alcance de pruebas técnicas indicado en CR01 y la distinción con su aprobación académica pendiente.

### Preparar la rama del frontend sin perder cambios

El titular ejecuta lo siguiente en Git Bash; son instrucciones, no operaciones ya realizadas por el agente:

```bash
cd /c/Users/Pato/Downloads/TESIS/centinela-front
git status --short --branch
git stash push -u -m "research analytics increment before feature branch"
git fetch origin
git branch --list develop
```

Si develop ya existe localmente, usar `git switch develop`. Si no existe, usar `git switch -c develop --track origin/develop`. Después:

```bash
git pull --ff-only
git switch -c feature/research-analytics-corpus
git stash pop
git status --short --branch
git diff --check
git diff
```

Si algún paso falla o aparecen conflictos, detener esta secuencia y conservar el stash hasta resolverlos. `stash -u` guarda archivos nuevos no ignorados; el environment de desarrollo ignorado queda local. No agregarlo a la fuerza. Revisar cualquier diferencia que ya trajera el checkout: no asumir que todo cambio visible pertenece a este incremento. Si la base develop cambia fuentes o dependencias, ejecutar otra vez las comprobaciones tras resolver la restauración.

Archivos de este incremento para revisar: `src/app/research-analytics/`, `src/app/app-routing.module.ts`, el HTML de `src/app/shared/components/header/`, `src/environments/environment.ts`, `src/environments/environment.local.ts`, los dos specs de salarios mencionados, README y este documento. No confirmar artefactos de build, dependencias ni datos.

Una vez revisado el staging con `git diff --cached`, un mensaje posible es:

```bash
git add src/app/research-analytics src/app/app-routing.module.ts \
  src/app/shared/components/header/header.component.html \
  src/environments/environment.ts src/environments/environment.local.ts \
  src/app/jobs/presentation/components/job-list/job-list.component.spec.ts \
  src/app/jobs/presentation/components/job-detail/job-detail.component.spec.ts \
  README.md docs/research-analytics.md
git diff --cached
git commit -m "feat(analytics): add development corpus explorer" \
  -m "Expose documented corpus queries in the existing Angular frontend while keeping uncertain coverage and pending model outputs explicit. Stabilize inherited salary tests across browser locales."
git push -u origin feature/research-analytics-corpus
```

El issue y PR del frontend deben describir filtros, paginación, manejo de errores y cancelación, señalar el enlace al trabajo CMMI y mantener pendiente la verificación del stack. El PR apunta a develop, requiere dos aprobaciones y CODEOWNERS. analytics-service conserva su propio commit y PR: no mezclar archivos de ambos repositorios en un mismo commit.
