import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';

export interface TopicNode {
  topic_id: string;
  terms: string[];
  count: number;
  share: number;
}
export interface TopicMap {
  release_id: string;
  model_id: string;
  denominator: number;
  unassigned: number;
  nodes: TopicNode[];
  edges: { source: string; target: string; weight: number }[];
  coverage: string;
  space: string;
}
export interface TopicDocuments {
  total: number;
  items: { article_id: string; title: string; year: number }[];
}
@Injectable({ providedIn: 'root' })
export class TopicMapService {
  constructor(private readonly http: HttpClient) {}
  map(start: string, end: string, threshold: number) {
    return this.http.get<TopicMap>(`${environment.apiAnalytics}/topic-map`, {
      params: this.filters(start, end).set('threshold', threshold),
    });
  }
  documents(map: TopicMap, topic: string, start: string, end: string, offset: number) {
    return this.http.get<TopicDocuments>(`${environment.apiAnalytics}/topic-map/documents`, {
      params: this.filters(start, end)
        .set('release_id', map.release_id)
        .set('topic_id', topic)
        .set('offset', offset)
        .set('limit', 20),
    });
  }
  private filters(start: string, end: string) {
    let p = new HttpParams();
    if (start) p = p.set('start_year', start);
    if (end) p = p.set('end_year', end);
    return p;
  }
}
