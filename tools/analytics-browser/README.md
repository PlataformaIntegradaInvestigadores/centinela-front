# Verificación aislada de analítica

Importa los componentes y servicios reales y consulta un backend HTTP local.
No usa la aplicación principal, su identidad ni el gateway institucional.
No cambia ni omite el guard de las rutas de producción. No usa usuarios externos.

Desde analytics-service, con su entorno Python 3.11 activado:

```bash
PYTHONPATH=. python tools/prepare_browser_fixture.py ../evidencias_locales/nuevo-fixture
export ANALYTICS_CORPUS_DATABASE="$(pwd)/../evidencias_locales/nuevo-fixture/corpus.sqlite"
export ANALYTICS_WORKSET_DIRECTORY="$(pwd)/../evidencias_locales/nuevo-fixture/worksets"
python -m uvicorn app.main:app --host 127.0.0.1 --port 8016
```

Desde centinela-front, compile con Node 18 compatible con Angular 16. Ejecute el
runner Playwright en otra terminal con Node 20 o superior (se verificó con Node
22.15.0), sin cambiar la versión usada para compilar el proyecto:

```bash
npm install --prefix tools/analytics-browser
npx ng build --configuration development --main tools/analytics-browser/main.ts --ts-config tools/analytics-browser/tsconfig.json --index tools/analytics-browser/index.html --output-path ../evidencias_locales/analytics-browser-dist
node tools/analytics-browser/run.mjs ../evidencias_locales/analytics-browser-dist ../evidencias_locales/browser-report.json
```

Usa Chrome instalado; `CHROME_BIN` permite indicar otro ejecutable local compatible.
El servidor de ensayo escucha únicamente en 127.0.0.1:4216. Finaliza y cierra el
navegador al terminar. El informe solo se genera si pasan todos los controles.
Para repetir la creación use un fixture nuevo; los conjuntos existentes se reutilizan.

Controles: HTTP, exploración, detalle, filtros vacíos, fallo 503 y recuperación,
creación del conjunto, navegación por teclado, desbordamiento de página y axe en
360/768/1440 píxeles. Una ejecución sin infracciones automáticas no acredita una
auditoría WCAG completa ni inspección visual institucional. Los avisos de cobertura
y fechas permanecen visibles. El foco de las tablas desplazables es visible.
