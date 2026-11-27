import { ReviewDatePipe, ReviewNumberPipe } from './review-format.pipes';

describe('review format pipes', () => {
  const date = new ReviewDatePipe();
  const number = new ReviewNumberPipe();

  it('formats a date with the locale and shows a dash when missing', () => {
    expect(date.transform('2026-12-01T10:00:00Z')).toMatch(/\d{1,2}\/\d{1,2}\/\d{2,4}/);
    expect(date.transform(null)).toBe('—');
    expect(date.transform('not a date')).toBe('—');
  });

  it('formats numbers with a decimal comma and passes other values', () => {
    expect(number.transform(0.936)).toBe('0,936');
    expect(number.transform(1234.5)).toMatch(/1.?234,5/);
    expect(number.transform('prefix')).toBe('prefix');
    expect(number.transform(undefined)).toBe('—');
    expect(number.transform('')).toBe('—');
  });
});
