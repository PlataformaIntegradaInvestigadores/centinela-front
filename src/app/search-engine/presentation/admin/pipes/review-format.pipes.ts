import { Pipe, PipeTransform } from '@angular/core';

const LOCALE = 'es-EC';
const dateFormat = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'short', timeStyle: 'short' });
const numberFormat = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 3 });

/** Date and time in the reviewer's locale; a dash when absent or invalid. */
@Pipe({ name: 'reviewDate' })
export class ReviewDatePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    const time = value ? Date.parse(value) : NaN;
    return Number.isNaN(time) ? '—' : dateFormat.format(time);
  }
}

/** Numbers with the locale's separators; non-numbers pass through and absent values are a dash. */
@Pipe({ name: 'reviewNumber' })
export class ReviewNumberPipe implements PipeTransform {
  transform(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '—';
    }
    return typeof value === 'number' ? numberFormat.format(value) : String(value);
  }
}
