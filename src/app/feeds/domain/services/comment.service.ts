import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { Comment, CreateCommentData } from '../entities/feed.interface';

@Injectable({
  providedIn: 'root',
})
export class CommentService {
  private readonly baseUrl = `${environment.apiSocial}/v1`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  /**
   * Obtiene los comentarios de un post
   */
  getPostComments(postId: string): Observable<Comment[]> {
    const headers = this.getHeaders();
    return this.http.get<Comment[]>(`${this.baseUrl}/posts/${postId}/comments/`, { headers }).pipe(
      map((comments) =>
        comments.map((comment) => ({
          ...comment,
          created_at: new Date(comment.created_at),
          updated_at: new Date(comment.updated_at),
        })),
      ),
    );
  }

  /**
   * Crea un nuevo comentario en un post
   */
  createComment(postId: string, commentData: CreateCommentData): Observable<Comment> {
    const headers = this.getHeaders();
    return this.http
      .post<Comment>(`${this.baseUrl}/posts/${postId}/comments/`, commentData, { headers })
      .pipe(
        map((comment) => ({
          ...comment,
          created_at: new Date(comment.created_at),
          updated_at: new Date(comment.updated_at),
        })),
      );
  }

  /**
   * Obtiene las respuestas de un comentario
   */
  getCommentReplies(commentId: string): Observable<Comment[]> {
    const headers = this.getHeaders();
    return this.http
      .get<Comment[]>(`${this.baseUrl}/comments/${commentId}/replies/`, { headers })
      .pipe(
        map((comments) =>
          comments.map((comment) => ({
            ...comment,
            created_at: new Date(comment.created_at),
            updated_at: new Date(comment.updated_at),
          })),
        ),
      );
  }

  /**
   * Actualiza un comentario existente
   */
  updateComment(commentId: string, content: string): Observable<Comment> {
    const headers = this.getHeaders();
    return this.http
      .patch<Comment>(`${this.baseUrl}/comments/${commentId}/`, { content }, { headers })
      .pipe(
        map((comment) => ({
          ...comment,
          created_at: new Date(comment.created_at),
          updated_at: new Date(comment.updated_at),
        })),
      );
  }

  /**
   * Elimina un comentario
   */
  deleteComment(commentId: string): Observable<void> {
    const headers = this.getHeaders();
    return this.http.delete<void>(`${this.baseUrl}/comments/${commentId}/`, { headers });
  }

  /**
   * Alterna like en un comentario
   */
  toggleCommentLike(commentId: string): Observable<{ liked: boolean; likes_count: number }> {
    const headers = this.getHeaders();
    return this.http.post<{ liked: boolean; likes_count: number }>(
      `${this.baseUrl}/comments/${commentId}/like/`,
      {},
      { headers },
    );
  }
}
