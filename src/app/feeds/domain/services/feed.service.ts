import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import {
  FeedPost,
  FeedResponse,
  FeedFilters,
  CreatePostData,
  Comment,
  UserFeedStats,
} from '../entities/feed.interface';

/**
 * Spanish messages that social-service can return, matched on lowercase
 * fragments and mapped to the English text shown in the UI.
 */
export const BACKEND_MESSAGES: ReadonlyArray<[string, string]> = [
  ['descripción de la publicación es obligatoria', 'Write a description before posting.'],
  ['no puede superar los 5000', 'The description cannot exceed 5000 characters.'],
  ['más de 10 archivos', 'You can attach up to 10 files per post.'],
  ['no puede superar 50 mb', 'The files cannot exceed 50 MB in total.'],
  ['como máximo 10 mb', 'Each file can be at most 10 MB.'],
  ['no se pudo crear el comentario', 'Could not create the comment.'],
  ['encuesta ya no está activa', 'This poll is no longer active.'],
  ['encuesta no está activa', 'This poll is no longer active.'],
  ['encuesta ha expirado', 'This poll has expired.'],
  ['seleccionar al menos una opción', 'Select at least one option.'],
  ['solo puede seleccionar una opción', 'You can only select one option in this poll.'],
  ['ya has votado', 'You already voted in this poll.'],
  ['opciones no son válidas', 'One or more options are not valid.'],
  ['no se pueden modificar votos', 'Votes in this poll cannot be changed.'],
  ['no tienes votos', 'You have no votes in this poll.'],
  ['pregunta no puede estar vacía', 'The poll question cannot be empty.'],
  ['más de 10 opciones', 'A poll cannot have more than 10 options.'],
  ['al menos 2 opciones válidas', 'A poll needs at least 2 valid options.'],
  ['error interno del servidor', 'Something went wrong on the server. Please try again.'],
];

/** Heuristic for backend text that is still in Spanish and has no mapping. */
const SPANISH_TEXT = /[áéíóúñ¿¡]|\b(no se|debe|puede|esta|este|tienes|encuesta|publicación)\b/i;

@Injectable({
  providedIn: 'root',
})
export class FeedService {
  private apiUrl = `${environment.apiSocial}/v1`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene el token de autorización
   */
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    console.log('FeedService: Token found:', token ? 'Yes' : 'No');
    if (token) {
      console.log('FeedService: Token length:', token.length);
    }

    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  /**
   * Obtiene el feed principal con filtros opcionales
   */
  getFeed(filters?: FeedFilters): Observable<FeedResponse> {
    const headers = this.getHeaders();
    let params = new HttpParams();

    if (filters) {
      if (filters.feed_type) params = params.set('type', filters.feed_type);
      if (filters.tags) params = params.set('tags', filters.tags.join(','));
      if (filters.author) params = params.set('author', filters.author);
      if (filters.time_range) params = params.set('time_range', filters.time_range);
      if (filters.cursor) params = params.set('cursor', filters.cursor);
      if (filters.limit) params = params.set('limit', filters.limit.toString());
    }

    const url = `${this.apiUrl}/feed/`;
    console.log('FeedService: Making request to:', url);
    console.log('FeedService: Headers:', headers);
    console.log('FeedService: Params:', params.toString());

    return this.http.get<FeedResponse>(url, { headers, params }).pipe(
      map((response) => {
        console.log('FeedService: Raw response:', response);
        const convertedResponse = this.convertFeedResponseDates(response);
        console.log('FeedService: Converted response:', convertedResponse);
        return convertedResponse;
      }),
    );
  }

  /**
   * Obtiene posts con filtros específicos usando POST
   */
  getFilteredFeed(filters: FeedFilters): Observable<FeedResponse> {
    const headers = this.getHeaders();
    return this.http
      .post<FeedResponse>(`${this.apiUrl}/feed/`, filters, { headers })
      .pipe(map((response) => this.convertFeedResponseDates(response)));
  }

  /**
   * Obtiene posts en tendencia
   */
  getTrendingPosts(timeRange: string = 'week', limit: number = 20): Observable<FeedResponse> {
    const headers = this.getHeaders();
    const params = new HttpParams().set('time_range', timeRange).set('limit', limit.toString());

    return this.http
      .get<FeedResponse>(`${this.apiUrl}/feed/trending/`, { headers, params })
      .pipe(map((response) => this.convertFeedResponseDates(response)));
  }

  /**
   * Obtiene recomendaciones de posts
   */
  getRecommendations(limit: number = 20): Observable<FeedResponse> {
    const headers = this.getHeaders();
    const params = new HttpParams().set('limit', limit.toString());

    return this.http
      .get<FeedResponse>(`${this.apiUrl}/feed/recommendations/`, { headers, params })
      .pipe(map((response) => this.convertFeedResponseDates(response)));
  }

  /**
   * Crea un nuevo post
   */
  createPost(postData: CreatePostData): Observable<FeedPost> {
    const headers = this.getHeaders();
    const formData = new FormData();

    formData.append('content', postData.content);

    if (postData.tags && postData.tags.length > 0) {
      formData.append('tags', postData.tags.join(','));
    }

    // Asegurar que todos los posts sean públicos por defecto
    const isPublic = postData.is_public !== undefined ? postData.is_public : true;
    formData.append('is_public', isPublic.toString());

    if (postData.files) {
      postData.files.forEach((file) => {
        formData.append(`files`, file);
      });
    }

    // Agregar datos de encuesta si existe
    if (postData.poll_data) {
      formData.append('poll_data', JSON.stringify(postData.poll_data));
    }

    return this.http
      .post<FeedPost>(`${this.apiUrl}/posts/`, formData, { headers })
      .pipe(map((post) => this.convertPostDates(post)));
  }

  getFriendlyErrorMessage(
    error: any,
    fallback: string = 'The action could not be completed. Please try again.',
  ): string {
    if (!error) return fallback;

    if (error.status === 0) {
      return 'Cannot reach the server. Check your connection and try again.';
    }

    const payload = error.error;
    const rawMessage = this.extractErrorMessage(payload) || error.message || '';
    const normalized = rawMessage.toLowerCase();

    // social-service still answers some errors in Spanish; show them in English.
    const known = BACKEND_MESSAGES.find(([pattern]) => normalized.includes(pattern));
    if (known) return known[1];

    if (
      normalized.includes('content cannot be empty') ||
      (normalized.includes('content') && normalized.includes('blank'))
    ) {
      return 'Write a description before posting.';
    }

    if (normalized.includes('5000')) {
      return 'The description cannot exceed 5000 characters.';
    }

    if (
      normalized.includes('file size') ||
      normalized.includes('50mb') ||
      normalized.includes('10mb')
    ) {
      return 'One of the files is too large. Use files up to 10 MB each and 50 MB in total.';
    }

    if (normalized.includes('more than 10 files')) {
      return 'You can attach up to 10 files per post.';
    }

    if (normalized.includes('permission') || error.status === 403) {
      return 'You do not have permission to do this.';
    }

    if (error.status === 401) {
      return 'Your session expired. Please sign in again.';
    }

    if (rawMessage && rawMessage !== '[object Object]' && !SPANISH_TEXT.test(rawMessage)) {
      return rawMessage;
    }

    return fallback;
  }

  private extractErrorMessage(payload: any): string {
    if (!payload) return '';
    if (typeof payload === 'string') return payload;

    const directMessage = payload.message || payload.error || payload.detail;
    if (typeof directMessage === 'string') return directMessage;

    if (Array.isArray(payload)) {
      return payload
        .map((item) => this.extractErrorMessage(item))
        .filter(Boolean)
        .join(' ');
    }

    if (typeof payload === 'object') {
      const messages = Object.values(payload)
        .map((value) => this.extractErrorMessage(value))
        .filter(Boolean);
      return messages.join(' ');
    }

    return '';
  }

  /**
   * Obtiene un post específico por ID
   */
  getPost(postId: string): Observable<FeedPost> {
    const headers = this.getHeaders();
    return this.http
      .get<FeedPost>(`${this.apiUrl}/posts/${postId}/`, { headers })
      .pipe(map((post) => this.convertPostDates(post)));
  }

  /**
   * Actualiza un post
   */
  updatePost(postId: string, updateData: Partial<CreatePostData>): Observable<FeedPost> {
    const headers = this.getHeaders();
    return this.http
      .patch<FeedPost>(`${this.apiUrl}/posts/${postId}/`, updateData, { headers })
      .pipe(map((post) => this.convertPostDates(post)));
  }

  /**
   * Elimina un post
   */
  deletePost(postId: string): Observable<void> {
    const headers = this.getHeaders();
    return this.http.delete<void>(`${this.apiUrl}/posts/${postId}/`, { headers });
  }

  /**
   * Busca posts usando búsqueda vectorial semántica
   */
  searchPosts(
    query: string,
    tags?: string[],
    author?: string,
    useVectorSearch: boolean = true,
  ): Observable<FeedPost[]> {
    const headers = this.getHeaders();
    let params = new HttpParams().set('q', query);

    if (tags && tags.length > 0) {
      tags.forEach((tag) => {
        params = params.append('tags', tag);
      });
    }
    if (author) params = params.set('author', author);

    // Parámetro para habilitar/deshabilitar búsqueda vectorial
    params = params.set('vector', useVectorSearch.toString());
    params = params.set('limit', '20');

    return this.http.get<FeedPost[]>(`${this.apiUrl}/posts/search/`, { headers, params }).pipe(
      map((posts) => posts.map((post) => this.convertPostDates(post))),
      catchError((error) => {
        console.error('Error en búsqueda de posts:', error);
        // Si falla la búsqueda vectorial, intentar búsqueda básica
        if (useVectorSearch && error.status !== 404) {
          console.log('Fallback a búsqueda básica de texto');
          return this.searchPosts(query, tags, author, false);
        }
        return throwError(() => error);
      }),
    );
  }

  /**
   * Obtiene estadísticas del post
   */
  getPostStats(postId: string): Observable<any> {
    const headers = this.getHeaders();
    return this.http.get(`${this.apiUrl}/posts/${postId}/stats/`, { headers });
  }

  /**
   * Da like/unlike a un post
   */
  toggleLikePost(postId: string): Observable<{ liked: boolean; likes_count: number }> {
    const headers = this.getHeaders();
    return this.http.post<{ liked: boolean; likes_count: number }>(
      `${this.apiUrl}/posts/${postId}/like/`,
      {},
      { headers },
    );
  }

  /**
   * Obtiene comentarios de un post
   */
  getComments(postId: string, page: number = 1, limit: number = 20): Observable<Comment[]> {
    const headers = this.getHeaders();
    const params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());

    return this.http
      .get<Comment[]>(`${this.apiUrl}/posts/${postId}/comments/`, { headers, params })
      .pipe(map((comments) => comments.map((comment) => this.convertCommentDates(comment))));
  }

  /**
   * Crea un comentario
   */
  createComment(postId: string, content: string, parentId?: string): Observable<Comment> {
    const headers = this.getHeaders();
    const data: any = { content };
    if (parentId) data.parent_comment = parentId;

    return this.http
      .post<Comment>(`${this.apiUrl}/posts/${postId}/comments/`, data, { headers })
      .pipe(map((comment) => this.convertCommentDates(comment)));
  }

  /**
   * Da like/unlike a un comentario
   */
  toggleLikeComment(commentId: string): Observable<{ liked: boolean; likes_count: number }> {
    const headers = this.getHeaders();
    return this.http.post<{ liked: boolean; likes_count: number }>(
      `${this.apiUrl}/likes/comments/${commentId}/`,
      {},
      { headers },
    );
  }

  /**
   * Obtiene estadísticas del usuario en el feed
   */
  getUserFeedStats(): Observable<UserFeedStats> {
    const headers = this.getHeaders();
    return this.http.get<UserFeedStats>(`${this.apiUrl}/feed/stats/`, { headers });
  }

  /**
   * Obtiene posts de un usuario específico
   */
  getUserPosts(userId: string, limit: number = 20, cursor?: string): Observable<FeedResponse> {
    const headers = this.getHeaders();
    let params = new HttpParams().set('author', userId).set('limit', limit.toString());

    if (cursor) {
      params = params.set('cursor', cursor);
    }

    return this.http
      .get<FeedResponse>(`${this.apiUrl}/feed/`, { headers, params })
      .pipe(map((response) => this.convertFeedResponseDates(response)));
  }

  /**
   * Obtiene posts del usuario actual autenticado
   */
  getCurrentUserPosts(limit: number = 20, cursor?: string): Observable<FeedResponse> {
    const headers = this.getHeaders();
    let params = new HttpParams().set('limit', limit.toString());

    if (cursor) {
      params = params.set('cursor', cursor);
    }

    return this.http
      .get<FeedResponse>(`${this.apiUrl}/user/posts/`, { headers, params })
      .pipe(map((response) => this.convertFeedResponseDates(response)));
  }

  /**
   * Registra una interacción del usuario
   */
  recordUserInteraction(
    postId: string,
    interactionType: 'view' | 'like' | 'comment' | 'share',
  ): Observable<void> {
    const headers = this.getHeaders();
    return this.http.post<void>(
      `${this.apiUrl}/interactions/`,
      {
        post_id: postId,
        interaction_type: interactionType,
      },
      { headers },
    );
  }

  /**
   * Vota en una encuesta
   */
  votePoll(pollId: string, optionIds: string[]): Observable<any> {
    const headers = this.getHeaders();
    const body = { option_ids: optionIds };

    return this.http.post(`${this.apiUrl}/polls/${pollId}/vote/`, body, { headers }).pipe(
      catchError((error) => {
        console.error('Error voting in poll:', error);
        return throwError(() => error);
      }),
    );
  }

  /**
   * Elimina el voto en una encuesta
   */
  removePollVote(pollId: string): Observable<any> {
    const headers = this.getHeaders();

    return this.http.delete(`${this.apiUrl}/polls/${pollId}/remove-vote/`, { headers }).pipe(
      catchError((error) => {
        console.error('Error removing poll vote:', error);
        return throwError(() => error);
      }),
    );
  }

  /**
   * Obtiene los detalles de una encuesta
   */
  getPollDetails(pollId: string): Observable<any> {
    const headers = this.getHeaders();

    return this.http.get(`${this.apiUrl}/polls/${pollId}/`, { headers }).pipe(
      catchError((error) => {
        console.error('Error getting poll details:', error);
        return throwError(() => error);
      }),
    );
  }

  /**
   * Convierte las fechas de string a Date en la respuesta del feed
   */
  private convertFeedResponseDates(response: FeedResponse): FeedResponse {
    return {
      ...response,
      posts: response.posts.map((post) => this.convertPostDates(post)),
    };
  }

  /**
   * Convierte las fechas de string a Date en un post
   */
  private convertPostDates(post: FeedPost): FeedPost {
    return {
      ...post,
      created_at: new Date(post.created_at),
      updated_at: new Date(post.updated_at),
      files:
        post.files?.map((file) => ({
          ...file,
          uploaded_at: new Date(file.uploaded_at),
        })) || [],
    };
  }

  /**
   * Convierte las fechas de string a Date en un comentario
   */
  private convertCommentDates(comment: Comment): Comment {
    return {
      ...comment,
      created_at: new Date(comment.created_at),
      updated_at: new Date(comment.updated_at),
    };
  }
}
