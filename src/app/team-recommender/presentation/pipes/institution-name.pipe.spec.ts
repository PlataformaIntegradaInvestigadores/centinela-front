import { InstitutionNamePipe } from './institution-name.pipe';

describe('InstitutionNamePipe', () => {
  const pipe = new InstitutionNamePipe();

  it('title-cases words and keeps connectors in lower case', () => {
    expect(pipe.transform('escuela superior politécnica del litoral')).toBe(
      'Escuela Superior Politécnica del Litoral',
    );
    expect(pipe.transform('university of galapagos')).toBe('University of Galapagos');
  });

  it('capitalizes a leading connector and upper-cases known acronyms', () => {
    expect(pipe.transform('de la salle')).toBe('De la Salle');
    expect(pipe.transform('universidad de las fuerzas armadas espe')).toBe(
      'Universidad de las Fuerzas Armadas ESPE',
    );
    expect(pipe.transform('universidad de las americas - udla')).toBe(
      'Universidad de las Americas - UDLA',
    );
  });

  it('handles accented first letters, punctuation and extra spaces', () => {
    expect(pipe.transform('  área de   investigación ')).toBe('Área de Investigación');
    expect(pipe.transform('aves y conservación/birdlife')).toBe('Aves y Conservación/birdlife');
  });

  it('labels unknown or empty institutions', () => {
    expect(pipe.transform('UNKNOWN')).toBe('Unregistered institution');
    expect(pipe.transform('')).toBe('Unregistered institution');
    expect(pipe.transform(null)).toBe('Unregistered institution');
    expect(pipe.transform(undefined)).toBe('Unregistered institution');
  });
});
