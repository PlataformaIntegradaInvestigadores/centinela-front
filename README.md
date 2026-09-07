# Centinela — centinela-front

SPA en Angular 16 de la plataforma de investigación Centinela. Repo solo de UI — nunca habla directo con un puerto de backend, siempre a través de un reverse proxy.

Parte del org multi-repo `PlataformaIntegradaInvestigadores`. En staging/producción, ese proxy es `gateway-service`; en desarrollo local, el proxy de `ng serve`.

## Stack

- Angular 16, basado en NgModules (no standalone components)
- Node 18 (`.nvmrc` fija la versión exacta; la imagen Docker usa `node:18.18-alpine3.18`)
- npm (`package-lock.json` — no pnpm/yarn)
- Tailwind + Flowbite (nuevo trabajo); Bootstrap CSS + Angular Material (legacy, no agregar más UI dependiente de esto)
- D3.js para visualizaciones de red/gráficos (`src/app/shared/d3/`)

## Arquitectura

- Cada feature vive en `src/app/<feature>/`, dividido en:
  - `domain/` — lógica de negocio: `services/` (llamadas HTTP + estado) y `entities/` (interfaces TS de payloads/modelos de la API).
  - `presentation/` — UI: `pages/` (vistas ruteadas de primer nivel) y `components/` (piezas reusables dentro del feature).
- `src/app/shared/` — todo lo reusado por 2+ features: `components/`, `domain/services/`, `interceptors/` (`AuthInterceptor` adjunta el bearer token a cada request saliente), `interfaces/`, `d3/`.
- `src/guards/` — route guards (`auth.guard`, `phase.guard`, `researcher-only.guard`, etc.), deliberadamente fuera de `src/app/` para mantenerse como un solo set compartido y descubrible.
- **Routing**: `app-routing.module.ts` define los paths de primer nivel. La mayoría de features se cargan lazy vía `loadChildren`; unos pocos legacy siguen importados eager en `AppModule` (auth, home, about-us). Lazy loading es lo esperado para cualquier feature nuevo.
- **Estado**: sin NgRx/store global. Los servicios exponen estado vía RxJS `BehaviorSubject`/`Subject`, inyectados como singletons de Angular (`providedIn: 'root'`, o en `providers` del módulo del feature) — ver `AuthService` o `WebSocketService`.
- **Networking**: cada llamada a backend usa un path *relativo* — `environment.apiIdentity` / `apiSocial` / `apiSearch` / `apiPredictive` / `wsUrl` (ver `src/environments/`) resuelven a `/api/identity`, `/api/social`, etc., mismo origen, nunca una URL absoluta a un puerto de backend. La app asume que algo delante de ella (un `gateway-service` en staging/producción, o el proxy de dev de `ng serve` en local) hace el ruteo real hacia cada servicio backend.

## Estructura del proyecto

```
src/
├── app/
│   ├── <feature>/
│   │   ├── domain/{entities,services}/
│   │   └── presentation/{pages,components}/
│   ├── shared/{components,domain/services,interceptors,interfaces,d3}/
│   ├── app.module.ts
│   └── app-routing.module.ts
├── guards/                    # route guards compartidos
└── environments/              # apiIdentity/apiSocial/apiSearch/apiPredictive/wsUrl
```

Features actuales: `analytics`, `auth`, `consensus`, `dashboard`, `feeds`, `group`, `jobs`, `profile`, `profile-company`, `recommendations`, `search-engine`.

## Requisitos previos

- Node 18 + npm
- Docker Desktop (solo si se usa el flujo Docker)
- Un stack de backend corriendo si se necesitan respuestas reales de API (no requerido para trabajo aislado de UI/componentes)

## Levantar en local

### Con Docker (más cercano a producción, sin hot reload)

```bash
docker compose build
docker compose up
```

Sirve el build en **http://localhost:8082** vía el `nginx.conf` incluido. Solo levanta este repo — no levanta `gateway-service` ni ningún backend, así que las llamadas a la API fallarán a menos que esos también estén corriendo.

Para agregar una dependencia npm en este flujo: `docker ps` para el id del contenedor, `docker exec -it <container_id> /bin/sh`, `npm install <paquete>` adentro, y luego `docker compose up --build` para que el cambio quede en la imagen.

### Sin Docker (loop de desarrollo rápido, hot reload)

```bash
npm install
npm start        # = ng serve, http://localhost:4200
```

`ng serve` proxea `/api`, `/ws` y `/media` a `http://localhost:8080` (ver `proxy.conf.json`, referenciado en `angular.json` → `serve`) — ese es el puerto host donde escucha `gateway-service` corrido vía Docker. Para respuestas reales de API con hot reload: levantar el stack de backend necesario (al menos `gateway-service` en `127.0.0.1:8080`), luego `npm start`, y abrir `http://localhost:4200`.

Para trabajo aislado de UI/presentación, `ng serve` funciona sin ningún backend corriendo — las llamadas a la API simplemente devuelven 404.

## Variables de entorno

Este servicio no usa `.env` — ni el build (`ng build`) ni el runtime (nginx sirviendo estáticos) leen variables de entorno. Las URLs por ambiente de cada backend (identity/social/search/predictive/websocket) se configuran en `src/environments/*.ts`, seleccionadas en build time vía `fileReplacements` (`angular.json`).

## Tests

```bash
npm test              # ng test — Karma/Jasmine
```

CI corre `ng test --code-coverage`. `karma.conf.js`'s `coverageReporter.check.global` exige un piso de **90% en statements, branches, functions y lines** — un PR que baje cualquiera de esas métricas por debajo de 90% falla CI directamente. Al agregar tests, priorizar cubrir ramas realmente faltantes (rutas de error, fallbacks `??`/`||`, edge cases) sobre agregar aserciones triviales que no mueven la cobertura de ramas.

## CI/CD

GitHub Actions (`.github/workflows/ci.yml` + `cd-production.yml`): build + tests con gate de cobertura 90% → build de imagen Docker → deploy a staging (runner self-hosted `ticcd`).

## Convenciones

- Branches: `feature/*` → `develop`, `hotfix/*` → `main`.
- Commits: [Conventional Commits](https://www.conventionalcommits.org/), inglés, con el *por qué* en el cuerpo.
- Nuevo feature: seguir la estructura `domain/{entities,services}` + `presentation/{pages,components}` bajo `src/app/<feature>/`, generar con Angular CLI, ruteo lazy vía `loadChildren` salvo razón específica para eager, poner lo compartido entre 2+ features en `src/app/shared/`, guards nuevos en `src/guards/`, specs junto a cada archivo nuevo (`*.component.spec.ts`, `*.service.spec.ts`) a medida que se escribe el código — no al final.
- Ruta nueva de backend: cambio en `gateway-service` (`nginx.conf`), no un workaround en el frontend — esta app solo debe llamar paths relativos `/api/...` ya conocidos por un archivo de `src/environments/`.

## Notas

- `/admin/` — panel/proceso de extracción de datos de Scopus.
