import { ErrorService } from './error.service';

describe('ErrorService', () => {
  let service: ErrorService;

  beforeEach(() => {
    service = new ErrorService();
  });

  it('handleError always throws', () => {
    expect(() => service.handleError()).toThrowError('Method not implemented.');
  });

  it('returns a default message when there is no error payload', () => {
    expect(service.processErrors({})).toEqual(['Incorrect email or password.']);
  });

  it('extracts the detail message when present', () => {
    expect(service.processErrors({ error: { detail: 'Account locked' } })).toEqual([
      'Account locked',
    ]);
  });

  it('flattens array-valued field errors', () => {
    const result = service.processErrors({
      error: { username: ['Already taken'], password: ['Too short', 'Too weak'] },
    });
    expect(result).toEqual(['Already taken', 'Too short', 'Too weak']);
  });

  it('pushes non-array field errors as-is', () => {
    const result = service.processErrors({ error: { username: 'Already taken' } as any });
    expect(result).toEqual(['Already taken']);
  });
});
