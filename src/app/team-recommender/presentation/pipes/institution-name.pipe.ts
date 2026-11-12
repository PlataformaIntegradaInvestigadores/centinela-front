import { Pipe, PipeTransform } from '@angular/core';

import { UNKNOWN_INSTITUTION } from '../../domain/entities/team-recommendation.interface';

/** Conectores que se mantienen en minúscula dentro de un nombre de institución. */
const LOWERCASE_WORDS = new Set([
  'de',
  'del',
  'la',
  'las',
  'los',
  'el',
  'y',
  'e',
  'en',
  'para',
  'of',
  'the',
  'and',
  'for',
  'in',
]);

/** Siglas frecuentes en el corpus que deben ir en mayúsculas. */
const ACRONYMS = new Set(['espe', 'espol', 'epn', 'ute', 'utpl', 'usfq', 'puce', 'udla', 'inia']);

/**
 * El corpus guarda las instituciones normalizadas en minúsculas
 * ("escuela politécnica nacional"); este pipe las muestra en formato título.
 */
@Pipe({
  name: 'institutionName',
})
export class InstitutionNamePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value || value === UNKNOWN_INSTITUTION) {
      return 'Institución no registrada';
    }
    return value
      .trim()
      .split(/\s+/)
      .map((word, index) => this.formatWord(word.toLowerCase(), index))
      .join(' ');
  }

  private formatWord(word: string, index: number): string {
    const bare = word.replace(/[^\p{L}\p{N}]/gu, '');
    if (ACRONYMS.has(bare)) {
      return word.toUpperCase();
    }
    if (index > 0 && LOWERCASE_WORDS.has(word)) {
      return word;
    }
    return word.replace(/\p{L}/u, (first) => first.toUpperCase());
  }
}
