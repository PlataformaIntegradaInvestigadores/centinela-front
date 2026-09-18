import { UserDataService } from './user_data.service';
import { User } from 'src/app/profile/domain/entities/user.interfaces';

describe('UserDataService', () => {
  let service: UserDataService;

  beforeEach(() => {
    localStorage.clear();
    service = new UserDataService();
  });

  afterEach(() => localStorage.clear());

  it('unsubscribe always throws (not implemented)', () => {
    expect(() => service.unsubscribe()).toThrowError('Method not implemented.');
  });

  it('user$ starts null', (done) => {
    service.user$.subscribe((user) => {
      expect(user).toBeNull();
      done();
    });
  });

  it('changeUser emits the new value on user$', (done) => {
    const user = { id: 'u-1' } as User;
    service.changeUser(user);
    service.user$.subscribe((value) => {
      expect(value).toBe(user);
      done();
    });
  });

  describe('setUser', () => {
    it('marks isOwnProfile true when the stored userId matches', () => {
      localStorage.setItem('userId', 'u-1');
      const user = { id: 'u-1' } as User;
      service.setUser(user, undefined);
      expect(user.isOwnProfile).toBeTrue();
    });

    it('marks isOwnProfile false when the stored userId differs', () => {
      localStorage.setItem('userId', 'someone-else');
      const user = { id: 'u-1' } as User;
      service.setUser(user, undefined);
      expect(user.isOwnProfile).toBeFalse();
    });

    it('does not override an already-set isOwnProfile', () => {
      const user = { id: 'u-1', isOwnProfile: true } as User;
      service.setUser(user, undefined);
      expect(user.isOwnProfile).toBeTrue();
    });

    it('stores the author when provided', () => {
      const author = { id: 'a-1' } as any;
      service.setUser(null, author);
      expect(service.author).toBe(author);
    });

    it('leaves author untouched when not provided', () => {
      const author = { id: 'a-1' } as any;
      service.setUser(null, author);
      service.setUser({ id: 'u-2' } as User, undefined);
      expect(service.author).toBe(author);
    });
  });

  it('getUser returns the same observable as user$', (done) => {
    const user = { id: 'u-3' } as User;
    service.changeUser(user);
    service.getUser().subscribe((value) => {
      expect(value).toBe(user);
      done();
    });
  });
});
