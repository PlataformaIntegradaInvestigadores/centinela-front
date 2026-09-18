import { IconDefinition } from '@fortawesome/free-brands-svg-icons';

export interface SearchOption {
  code: 'au' | 'mrau' | 'mrar';
  label: string;
  placeholder: string;
  icon: IconDefinition;
}

export interface Search {
  option: string;
  query: string;
}
export interface RandItem {
  value: string;
  size: number;
}
