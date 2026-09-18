# Módulo de Feeds - Arquitectura Modular

## Descripción

El módulo de feeds ha sido diseñado para ser completamente modular y reutilizable a través de toda la aplicación. Los componentes pueden ser utilizados tanto en el feed principal como en perfiles de usuario y cualquier otra parte que necesite mostrar publicaciones.

## Estructura

```
feeds/
├── domain/
│   ├── entities/
│   │   └── feed.interface.ts      # Interfaces y tipos de dominio
│   └── services/
│       └── feed.service.ts        # Servicio principal de feeds
├── presentation/
│   ├── components/
│   │   ├── feed-post/                      # Componente individual de post
│   │   │   ├── feed-post.component.ts
│   │   │   ├── feed-post.component.html
│   │   │   └── feed-post.component.css
│   │   ├── post-comments/                  # Componente de comentarios
│   │   │   ├── post-comments.component.ts
│   │   │   ├── post-comments.component.html
│   │   │   └── post-comments.component.css
│   │   ├── post-creator/                   # Componente para crear posts
│   │   │   ├── post-creator.component.ts
│   │   │   ├── post-creator.component.html
│   │   │   └── post-creator.component.css
│   │   └── post-list/                      # Componente lista de posts
│   │       ├── post-list.component.ts
│   │       ├── post-list.component.html
│   │       └── post-list.component.css
│   ├── pages/
│   │   └── feed-page.component.ts          # Página principal del feed
│   └── types/
│       └── post.types.ts                   # Tipos e interfaces compartidos
├── feeds-routing.module.ts
├── feeds.module.ts                         # Módulo con exports públicos
├── index.ts                               # Barrel export
└── README.md                              # Documentación
```

## Componentes Exportados

### 1. PostCreatorComponent

**Selector:** `app-post-creator`

Componente para crear nuevas publicaciones con soporte para archivos, texto y opciones adicionales.

**Inputs:**

- `placeholder: string` - Texto placeholder para el textarea
- `buttonText: string` - Texto del botón de publicar
- `showOptions: boolean` - Mostrar opciones adicionales (foto, link, encuesta)
- `userAvatar: string` - URL del avatar del usuario
- `userName: string` - Nombre del usuario
- `isLoading: boolean` - Estado de carga

**Outputs:**

- `postSubmitted: EventEmitter<PostCreatorData>` - Emite cuando se envía un post

**Ejemplo de uso:**

```html
<app-post-creator
  [placeholder]="'¿Qué estás pensando?'"
  [buttonText]="'Publicar'"
  [userAvatar]="user.avatar"
  [userName]="user.name"
  [isLoading]="isSubmitting"
  (postSubmitted)="onPostCreated($event)"
>
</app-post-creator>
```

### 2. PostListComponent

**Selector:** `app-post-list`

Componente para mostrar una lista de publicaciones con estado de carga y mensaje de lista vacía.

**Inputs:**

- `posts: FeedPost[]` - Array de publicaciones
- `isLoading: boolean` - Estado de carga
- `emptyMessage: string` - Mensaje cuando no hay posts
- `showActions: boolean` - Mostrar acciones de posts
- `currentUserId: string | null` - ID del usuario actual

**Outputs:**

- `toggleLike: EventEmitter<FeedPost>` - Like/Unlike en un post
- `deletePost: EventEmitter<string>` - Eliminar post
- `sharePost: EventEmitter<FeedPost>` - Compartir post
- `viewProfile: EventEmitter<string>` - Ver perfil del autor

**Ejemplo de uso:**

```html
<app-post-list
  [posts]="posts"
  [isLoading]="loading"
  [emptyMessage]="'No hay publicaciones'"
  [showActions]="true"
  [currentUserId]="currentUser?.id"
  (toggleLike)="onToggleLike($event)"
  (deletePost)="onDeletePost($event)"
  (sharePost)="onSharePost($event)"
  (viewProfile)="onViewProfile($event)"
>
</app-post-list>
```

### 3. FeedPostComponent

**Selector:** `app-feed-post`

Componente individual para mostrar un post con todas sus interacciones.

**Inputs:**

- `post: FeedPost` - Datos del post
- `showActions: boolean` - Mostrar acciones
- `showComments: boolean` - Mostrar sección de comentarios
- `allowDelete: boolean` - Permitir eliminar
- `allowEdit: boolean` - Permitir editar
- `currentUserId: string | null` - ID del usuario actual

**Outputs:**

- `toggleLike: EventEmitter<FeedPost>`
- `deletePost: EventEmitter<string>`
- `sharePost: EventEmitter<FeedPost>`
- `viewProfile: EventEmitter<string>`

### 4. PostCommentsComponent

**Selector:** `app-post-comments`

Componente para manejar comentarios de un post.

## Cómo Usar el Módulo

### 1. Importar el módulo

```typescript
import { FeedsModule } from '../feeds/feeds.module';

@NgModule({
  imports: [
    // ... otros módulos
    FeedsModule,
  ],
  // ...
})
export class MiModulo {}
```

### 2. Usar los componentes

Los componentes están disponibles automáticamente una vez importado el módulo.

## Ventajas de esta Arquitectura

1. **Reutilización:** Los componentes pueden usarse en cualquier parte de la aplicación
2. **Mantenibilidad:** Un solo lugar para manejar la lógica de posts
3. **Consistencia:** UI/UX consistente en toda la aplicación
4. **Escalabilidad:** Fácil agregar nuevas funcionalidades
5. **Testabilidad:** Componentes independientes y testeable

## Migración desde Profile

El módulo de profile ahora usa los componentes de feeds:

- ✅ Eliminado `post-creator` de shared
- ✅ Eliminado componentes duplicados en profile
- ✅ Profile usa `PostCreatorComponent` y `PostListComponent` de feeds
- ✅ Lógica unificada mediante `FeedService`

## Estilos

Los componentes usan principalmente **Tailwind CSS** para estilos, con CSS personalizado mínimo solo para animaciones y efectos que no se pueden lograr con Tailwind.
