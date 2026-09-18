export interface AuthorResult {
  scopusId: number;
  names: string[];
  affiliations: string[];
  articles: number;
  topics: string[];
  current_affiliation: string;
  citation_count: number;
  updated: boolean;
}

export interface Topic {
  name: string;
}
export interface PaginationAuthorResult {
  data: AuthorResult[];
  total: number;
}

export interface Author {
  name: string;
  email: string;
  affiliation: string;
  articles: number;
  topics: string[];
  scopus_id: number;
  first_name: string;
  last_name: string;
  auth_name: string;
  initials: string;
  current_affiliation: string;
  citation_count: number;
}

export interface CoauthorInfo {
  data: Data;
}

export interface Data {
  nodes: AuthorNode[];
  links: Link[];
}

export interface Link {
  source: string | number;
  target: string | number;
  collabStrength: number;
}

export interface Coauthors {
  links: Link[];
  nodes: AuthorNode[];
  affiliations: { scopus_id: string; name: string }[];
  total_results?: number;
  page?: number;
  page_size?: number;
}

export interface AuthorNode {
  scopus_id: string | number;
  initials: string;
  first_name: string;
  last_name: string;
  auth_name?: string;
  affiliations?: string[];
  articles?: number;
  co_authors?: string[];
  topics?: string[];
  citation_count?: number;
  current_affiliation?: string;
  weight?: number;
  rol?: string;
}

export interface RandItem {
  value: string;
  size: number;
}
